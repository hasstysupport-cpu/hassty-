/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/**
 * GroupScheduleControls — أدوات التحكم في مواعيد المجموعة من لوحتها:
 *  1) ChangeSlotModal: تغيير ميعاد حصة — فحص توافق كل الطلاب أولاً ثم التطبيق
 *     على الحصص القادمة فقط، مع معالج نقل المتعارضين (1-2 طالب) لمجموعة تانية
 *     بفحص ميعاد المجموعة الهدف قبل النقل.
 *  2) TransferStudentModal: نقل طالب لمجموعة أخرى للمدرس (بفحص التعارض).
 *  3) AddSessionModal: إضافة حصة جديدة للمجموعة.
 *  4) AddExamModal: إنشاء امتحان للمجموعة.
 */

import React, { useState } from 'react';
import {
  Clock, CalendarDays, AlertTriangle, CheckCircle2, XCircle, Loader2, ArrowLeftRight,
  Search, Users, Plus, Info, GraduationCap,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Btn, useToast } from '../../components/common/ui';
import { Badge } from '../../components/common/Badge';
import { formatTimeArabic } from '../../lib/scheduleSync';
import { supabase as supaClient } from '../../lib/supabase';
import {
  analyzeSlotConflict, applySlotChange, fetchTransferTargets, transferStudentDirect,
  slotLabel, SlotConflictResult, TransferTarget,
} from '../../lib/smartSchedule';
import { notifyParentTransfer } from '../../lib/parentNotify';

const DAYS = [
  { eng: 'Saturday', ar: 'السبت' },
  { eng: 'Sunday', ar: 'الأحد' },
  { eng: 'Monday', ar: 'الإثنين' },
  { eng: 'Tuesday', ar: 'الثلاثاء' },
  { eng: 'Wednesday', ar: 'الأربعاء' },
  { eng: 'Thursday', ar: 'الخميس' },
  { eng: 'Friday', ar: 'الجمعة' },
];
const dayAr = (d: string) => DAYS.find(x => x.eng === d)?.ar || d;

export interface SlotRow {
  id?: string;
  day: string;
  dayArabic?: string;
  startTime: string;
  endTime: string;
}

/* ============================================================
   1) تغيير ميعاد حصة — الفحص ثم التطبيق ثم نقل المتعارضين
   ============================================================ */
export const ChangeSlotModal: React.FC<{
  groupId: string;
  groupName: string;
  slot: SlotRow;
  slotIndex: number;
  teacherName: string;
  onClose: () => void;
  onApplied: () => void;
}> = ({ groupId, groupName, slot, slotIndex, teacherName, onClose, onApplied }) => {
  const toast = useToast();
  const [day, setDay] = useState(slot.day);
  const [start, setStart] = useState(slot.startTime || '');
  const [end, setEnd] = useState(slot.endTime || '');
  const [phase, setPhase] = useState<'form' | 'result' | 'applied' | 'transfer'>('form');
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [force, setForce] = useState(false);
  const [blocked, setBlocked] = useState<{ code: string; message: string } | null>(null);
  const [result, setResult] = useState<SlotConflictResult | null>(null);
  const [appliedInfo, setAppliedInfo] = useState<{ sessions: number; effective?: string; schedule?: string } | null>(null);
  const [transferQueue, setTransferQueue] = useState<SlotConflictResult['conflicts']>([]);
  const [transferDone, setTransferDone] = useState<string[]>([]);

  const changed = day !== slot.day || start !== slot.startTime || end !== slot.endTime;

  const runCheck = async () => {
    if (!start || !end || end <= start) { toast.push('error', 'اختر وقت بداية ونهاية صحيح — النهاية لازم تكون بعد البداية.'); return; }
    setChecking(true); setResult(null);
    try {
      const r = await analyzeSlotConflict(groupId, day, start, end, slotIndex);
      setResult(r);
      setPhase('result');
    } catch (e: any) {
      toast.push('error', e?.message || 'فشل فحص الميعاد.');
    } finally { setChecking(false); }
  };

  const runApply = async () => {
    setApplying(true);
    setBlocked(null);
    try {
      const r = await applySlotChange(groupId, slotIndex, day, start, end, force ? 'فرض مباشر من المدرس (تجاوز التعارض)' : 'تغيير مباشر من لوحة المجموعة', force);
      if (r.ok) {
        setAppliedInfo({ sessions: r.sessions_updated || 0, effective: r.effective_from, schedule: r.new_schedule });
        setTransferQueue((r.conflicts || []).filter(c => !transferDone.includes(c.student_id)));
        setPhase('applied');
        onApplied();
      } else if (r.code === 'COOLDOWN') {
        setBlocked({ code: 'COOLDOWN', message: r.message || `تغيير المواعيد متاح بعد ${r.hours_left} ساعة (فترة تهدئة).` });
      } else if (r.code === 'MAJORITY_CONFLICT') {
        setResult(r); setPhase('result');
        setBlocked({ code: 'MAJORITY_CONFLICT', message: r.message || 'الأغلبية عليهم درس في الميعاد الجديد.' });
      } else {
        setBlocked({ code: 'UNKNOWN', message: r.message || 'تعذر تطبيق التغيير.' });
      }
    } catch (e: any) {
      toast.push('error', e?.message || 'تعذر تطبيق التغيير.');
    } finally { setApplying(false); }
  };

  return (
    <Modal isOpen onClose={onClose} maxWidth="2xl" title={`تغيير ميعاد حصة — ${groupName}`} icon={<Clock className="w-5 h-5" />}>
      <div className="space-y-4" dir="rtl">
        {/* الميعاد الحالي */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs">
          <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-bold text-slate-500">الميعاد الحالي:</span>
          <span className="font-black text-slate-800">{slot.dayArabic || dayAr(slot.day)} — {formatTimeArabic(slot.startTime)} إلى {formatTimeArabic(slot.endTime)}</span>
        </div>

        {/* نموذج الميعاد الجديد */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">اليوم الجديد</label>
            <select value={day} onChange={e => setDay(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 cursor-pointer">
              {DAYS.map(d => <option key={d.eng} value={d.eng}>{d.ar}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">من الساعة</label>
            <input type="time" value={start} onChange={e => setStart(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">إلى الساعة</label>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300" />
          </div>
        </div>

        {phase === 'form' && (
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>اكتب الميعاد الجديد واضغط «افحص التوافق» — النظام هيدور على كل طالب: هل عنده درس في الميعاد ده عند مدرس تاني؟ الحصص اللي فاتت مش هتتغير أبداً، والتطبيق يبدأ من الحصة القادمة.</span>
          </div>
        )}

        {checking && (
          <div className="flex items-center gap-2 text-xs font-black text-slate-600 py-3 justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" /> جاري فحص مواعيد كل الطلاب في كل مجموعاتهم...
          </div>
        )}

        {/* نتيجة الفحص */}
        {phase !== 'form' && phase !== 'applied' && result && result.ok && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-4 rounded-2xl border text-center ${result.conflict_count ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className={`text-2xl font-black ${result.conflict_count ? 'text-red-700' : 'text-emerald-700'}`}>{result.conflict_count}</div>
                <div className={`text-[11px] font-bold mt-1 ${result.conflict_count ? 'text-red-600' : 'text-emerald-600'}`}>
                  {result.conflict_count ? 'طالب عليهم درس في الميعاد ده' : 'مفيش أي طالب عليه درس — تمام'}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-2xl font-black text-emerald-700">{result.free_count}</div>
                <div className="text-[11px] font-bold mt-1 text-emerald-600">طالب الميعاد الجديد فاضي لهم</div>
              </div>
            </div>

            {(result.conflicts || []).length > 0 && (
              <div className="rounded-2xl border border-red-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-red-50 border-b border-red-200 text-[11px] font-black text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> الطلاب المتعارضون — وعندهم:
                </div>
                <div className="divide-y divide-red-50 bg-white">
                  {(result.conflicts || []).map(c => (
                    <div key={c.student_id} className="px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
                      <span className="font-black text-slate-800">{c.student_name}</span>
                      <span className="text-[11px] font-bold text-red-700 text-left">{c.with_group} — {c.with_day} {formatTimeArabic(c.with_start)} إلى {formatTimeArabic(c.with_end)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* الحكم النهائي */}
            {(result.conflict_count || 0) === 0 && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> الميعاد ده مناسب لكل الطلاب — تنفع تغيّره فورًا.
              </div>
            )}
            {(result.conflict_count || 0) > 0 && (result.conflict_count || 0) <= 2 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-black text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {(result.conflict_count || 0)} طالب بس عليهم درس — طبّق التغيير والميعاد مناسب لباقي المجموعة، وبعدها انقلهم لمجموعة تانية مناسبة (النظام هيفحص ميعادها برضو).
              </div>
            )}
            {(result.conflict_count || 0) > 2 && (result.conflict_count || 0) >= (result.free_count || 0) && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-black text-red-800 flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" /> الأغلبية عليهم درس في الميعاد ده — جرب ميعاد تاني يناسبهم، النظام مش هيسمح بالتغيير.
              </div>
            )}
          </div>
        )}

        {/* بعد التطبيق */}
        {phase === 'applied' && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs font-bold text-emerald-900 leading-6">
                <div className="font-black text-sm">تم تغيير الميعاد بنجاح ✅</div>
                <div>المواعيد الجديدة: {appliedInfo?.schedule}</div>
                <div>عدد الحصص القادمة اللي اتحدثت: <strong>{appliedInfo?.sessions}</strong> — الحصص المنتهية لم تُلمس، والإشعارات وصلت للطلاب واولياء أمورهم تلقائيًا.</div>
              </div>
            </div>

            {(transferQueue || []).length > 0 && transferDone.length < (transferQueue || []).length ? (
              <InlineTransfer
                groupId={groupId}
                queue={(transferQueue || []).filter(c => !transferDone.includes(c.student_id))}
                teacherName={teacherName}
                onDone={(studentName) => {
                  setTransferDone(p => [...p, (transferQueue || []).find(c => c.student_name === studentName)?.student_id || '']);
                  toast.push('success', `تم نقل ${studentName} — وولي أمره اتصعّر تلقائيًا.`);
                }}
              />
            ) : (
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-xs font-bold text-blue-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> كل الطلاب المتعارضين اتنقلوا أو اتفقوا على ميعاد تاني — خلصت الشغل.
              </div>
            )}
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="space-y-3">
          {/* وضع الفرض: يظهر عند الحجب أو كخيار للمدرس دائمًا */}
          {phase !== 'applied' && (
            <div className={`rounded-2xl border p-3 ${force ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
              <label className="flex items-start gap-2 text-[11px] font-black text-slate-700 cursor-pointer select-none">
                <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} className="w-4 h-4 mt-0.5 accent-rose-600 shrink-0" />
                <span>
                  فرض التغيير رغم تعارض الطلاب وفترة التهدئة
                  <span className="block text-[10px] font-bold text-slate-400 mt-0.5">للمدرس صلاحية كاملة — النظام هيسجل التعارضات ويبلغ الطلاب المتأثرين.</span>
                </span>
              </label>
              {blocked && (
                <div className="mt-2 rounded-xl bg-white border border-rose-200 p-2.5 text-[11px] font-bold text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {blocked.message}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 justify-end pt-2 border-t border-slate-100">
            <Btn variant="secondary" size="sm" onClick={onClose}>إغلاق</Btn>
            {phase === 'form' && (
              <Btn variant="primary" size="sm" onClick={runCheck} disabled={checking || !changed || !start || !end}>
                <Search className="w-3.5 h-3.5" /> افحص التوافق
              </Btn>
            )}
            {phase === 'result' && result?.ok && (
              <>
                <Btn variant="secondary" size="sm" onClick={() => setPhase('form')}>تعديل الميعاد</Btn>
                <Btn
                  variant={force ? 'danger' : 'primary'} size="sm" onClick={runApply} disabled={applying || (!force && (result.conflict_count || 0) >= (result.free_count || 0) && (result.conflict_count || 0) > 0)}
                  title={!force && (result.conflict_count || 0) >= (result.free_count || 0) && (result.conflict_count || 0) > 0 ? 'الأغلبية عليهم درس — فعّل «فرض التغيير» لو متأكد' : ''}
                >
                  {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {force ? 'فرض التطبيق على الحصص القادمة' : 'تطبيق التغيير على الحصص القادمة'}
                </Btn>
              </>
            )}
            {phase === 'applied' && <Btn variant="primary" size="sm" onClick={() => { onApplied(); onClose(); }}>تم — إغلاق</Btn>}
          </div>
        </div>
      </div>
    </Modal>
  );
};

/* نقل الطالب المتعارض مباشرة بعد تطبيق التغيير */
const InlineTransfer: React.FC<{
  groupId: string;
  queue: NonNullable<SlotConflictResult['conflicts']>;
  teacherName: string;
  onDone: (studentName: string) => void;
}> = ({ groupId, queue, teacherName, onDone }) => {
  const toast = useToast();
  const [idx, setIdx] = useState(0);
  const [targets, setTargets] = useState<TransferTarget[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState('');
  const current = queue[idx];

  const load = async () => {
    setLoading(true);
    try { setTargets(await fetchTransferTargets(current.student_id, groupId)); }
    catch { setTargets([]); }
    finally { setLoading(false); }
  };
  React.useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [idx]);

  const move = async (t: TransferTarget) => {
    setMoving(t.id);
    try {
      const r: any = await transferStudentDirect(current.student_id, groupId, t.id, 'نقل تلقائي بعد تغيير ميعاد المجموعة');
      if (r?.ok) {
        await notifyParentTransfer({ studentId: current.student_id, studentName: current.student_name, toGroupName: t.name, teacherName }).catch(() => {});
        onDone(current.student_name);
      } else toast.push('error', r?.message || 'تعذر النقل.');
    } catch (e: any) { toast.push('error', e?.message || 'تعذر النقل.'); }
    finally { setMoving(''); }
  };

  if (!current) return null;
  return (
    <div className="rounded-2xl border border-amber-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-xs font-black text-amber-900 flex items-center gap-2">
        <ArrowLeftRight className="w-3.5 h-3.5" />
        انقل الطالب المتعارض ({idx + 1} من {queue.length}): <span className="text-amber-700">{current.student_name}</span> — وكان عنده درس في {current.with_group}
      </div>
      <div className="p-3 bg-white space-y-2 max-h-64 overflow-y-auto">
        {loading && <div className="flex items-center gap-2 text-xs font-bold text-slate-500 py-2"><Loader2 className="w-4 h-4 animate-spin" /> بجيب مجموعاتك وبفحص ميعاد الطالب في كل واحدة...</div>}
        {!loading && (targets || []).length === 0 && <div className="text-xs font-bold text-slate-500 py-2">مفيش مجموعات تانية لك — أنشئ مجموعة جديدة أولًا.</div>}
        {(targets || []).map(t => (
          <div key={t.id} className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${t.conflict || !t.capacity_ok ? 'border-slate-200 bg-slate-50 opacity-70' : 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300'}`}>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-800 flex items-center gap-1.5 flex-wrap">
                {t.name}
                {!t.grade_match && <Badge variant="warning" size="sm">مرحلة مختلفة</Badge>}
                {t.conflict && <Badge variant="danger" size="sm">عنده درس بميعادها</Badge>}
                {!t.capacity_ok && <Badge variant="neutral" size="sm">ممتلئة</Badge>}
              </div>
              <div className="text-[11px] font-bold text-slate-500 mt-0.5">{t.schedule} — {t.current_count}/{t.max_students} طالب</div>
            </div>
            <Btn size="sm" variant={t.conflict || !t.capacity_ok ? 'secondary' : 'success'} disabled={t.conflict || !t.capacity_ok || moving === t.id} onClick={() => move(t)}>
              {moving === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowLeftRight className="w-3.5 h-3.5" />} نقل
            </Btn>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================
   2) نقل طالب من تبويب الطلاب
   ============================================================ */
export const TransferStudentModal: React.FC<{
  groupId: string;
  groupName: string;
  student: { student_id: string; student_name: string };
  teacherName: string;
  onClose: () => void;
  onDone: () => void;
}> = ({ groupId, groupName, student, teacherName, onClose, onDone }) => {
  const toast = useToast();
  const [targets, setTargets] = useState<TransferTarget[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState('');

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const t = await fetchTransferTargets(student.student_id, groupId);
        if (alive) setTargets(t);
      } catch { if (alive) setTargets([]); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [student.student_id, groupId]);

  const move = async (t: TransferTarget) => {
    setMoving(t.id);
    try {
      const r: any = await transferStudentDirect(student.student_id, groupId, t.id, 'نقل من لوحة المجموعة');
      if (r?.ok) {
        await notifyParentTransfer({ studentId: student.student_id, studentName: student.student_name, fromGroupName: groupName, toGroupName: t.name, teacherName }).catch(() => {});
        toast.push('success', `تم نقل ${student.student_name} إلى «${t.name}» — وولي أمره اتصعّر تلقائيًا.`);
        onDone(); onClose();
      } else toast.push('error', r?.message || 'تعذر النقل.');
    } catch (e: any) { toast.push('error', e?.message || 'تعذر النقل.'); }
    finally { setMoving(''); }
  };

  return (
    <Modal isOpen onClose={onClose} maxWidth="lg" title={`نقل ${student.student_name} من ${groupName}`} icon={<ArrowLeftRight className="w-5 h-5" />}>
      <div className="space-y-3" dir="rtl">
        <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-900 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          المجموعات اللي تحتها خالصة على فحص تلقائي: لو الطالب عنده درس بميعاد المجموعة هتظهر بإشارة حمراء ومش هينفع ينقل عليها.
        </div>
        {loading && <div className="flex items-center gap-2 text-xs font-black text-slate-600 py-4 justify-center"><Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" /> بفحص المواعيد...</div>}
        {!loading && (targets || []).length === 0 && (
          <div className="py-6 text-center text-xs font-bold text-slate-500 flex flex-col items-center gap-2">
            <Users className="w-8 h-8 text-slate-300" /> مفيش مجموعات تانية — أنشئ مجموعة جديدة الأول.
          </div>
        )}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {(targets || []).map(t => (
            <div key={t.id} className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${t.conflict || !t.capacity_ok ? 'border-slate-200 bg-slate-50' : 'border-emerald-200 bg-emerald-50/40'}`}>
              <div className="min-w-0">
                <div className="text-xs font-black text-slate-800 flex items-center gap-1.5 flex-wrap">
                  {t.name}
                  {!t.grade_match && <Badge variant="warning" size="sm">مرحلة مختلفة ({t.grade})</Badge>}
                  {t.conflict ? <Badge variant="danger" size="sm">عنده درس بميعادها</Badge> : <Badge variant="success" size="sm">الميعاد فاضي ليه</Badge>}
                  {!t.capacity_ok && <Badge variant="neutral" size="sm">ممتلئة</Badge>}
                </div>
                <div className="text-[11px] font-bold text-slate-500 mt-1">{t.schedule} — {t.current_count}/{t.max_students} طالب</div>
              </div>
              <Btn size="sm" variant={t.conflict || !t.capacity_ok ? 'secondary' : 'success'} disabled={t.conflict || !t.capacity_ok || moving === t.id} onClick={() => move(t)}>
                {moving === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowLeftRight className="w-3.5 h-3.5" />} نقل هنا
              </Btn>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

/* ============================================================
   3) إضافة حصة
   ============================================================ */
export const AddSessionModal: React.FC<{
  groupId: string; tutorId: string; subject?: string;
  enrolledStudents: { student_id: string }[];
  onClose: () => void; onSaved: () => void;
}> = ({ groupId, tutorId, subject, enrolledStudents, onClose, onSaved }) => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !date || !start || !end || end <= start) { toast.push('error', 'أكمل البيانات: العنوان والتاريخ والوقت (النهاية بعد البداية).'); return; }
    if (!supaClient) { toast.push('error', 'قاعدة البيانات غير متاحة.'); return; }
    setSaving(true);
    try {
      const starts = `${date} ${start}`;
      const ends = `${date} ${end}`;
      const { error } = await supaClient.from('lesson_sessions').insert({
        group_id: groupId, tutor_id: tutorId, title: title.trim(), subject: subject || null,
        session_date: date, starts_at: starts, ends_at: ends, location: location || null, status: 'scheduled',
      });
      if (error) throw error;
      if (enrolledStudents.length) {
        await supaClient.from('calendar_events').insert(enrolledStudents.map(s => ({
          user_id: s.student_id, title: title.trim(), event_type: 'lesson', starts_at: starts, ends_at: ends, link: '/student/calendar',
        })));
      }
      toast.push('success', 'تمت إضافة الحصة — وظهرت في تقويم الطلاب.');
      onSaved(); onClose();
    } catch (e: any) { toast.push('error', e?.message || 'تعذر حفظ الحصة.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal isOpen onClose={onClose} maxWidth="md" title="إضافة حصة جديدة" icon={<Plus className="w-5 h-5" />}>
      <div className="space-y-3" dir="rtl">
        <div>
          <label className="block text-[11px] font-black text-slate-500 mb-1.5">عنوان الحصة</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: مراجعة الفصل الأول" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">التاريخ</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">من</label>
            <input type="time" value={start} onChange={e => setStart(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">إلى</label>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300" />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-black text-slate-500 mb-1.5">المكان (اختياري)</label>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="السنتر / أونلاين" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300" />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Btn variant="secondary" size="sm" onClick={onClose}>إلغاء</Btn>
          <Btn variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} حفظ الحصة
          </Btn>
        </div>
      </div>
    </Modal>
  );
};

/* ============================================================
   4) إنشاء امتحان
   ============================================================ */
export const AddExamModal: React.FC<{
  groupId: string; tutorId: string; subject?: string;
  onClose: () => void; onSaved: () => void;
}> = ({ groupId, tutorId, subject, onClose, onSaved }) => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [duration, setDuration] = useState('60');
  const [marks, setMarks] = useState('100');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !date || !start) { toast.push('error', 'أكمل عنوان الامتحان وتاريخه ووقته.'); return; }
    if (!supaClient) { toast.push('error', 'قاعدة البيانات غير متاحة.'); return; }
    setSaving(true);
    try {
      const startsAt = `${date} ${start}`;
      const { error } = await supaClient.from('exams').insert({
        tutor_id: tutorId, group_id: groupId, title: title.trim(), subject: subject || null,
        exam_date: date, starts_at: startsAt, duration_minutes: Number(duration) || 60,
        total_marks: Number(marks) || 100, location: location || null, status: 'scheduled',
      });
      if (error) throw error;
      toast.push('success', 'تم إنشاء الامتحان — جاهز للإدارة من صفحة الامتحان.');
      onSaved(); onClose();
    } catch (e: any) { toast.push('error', e?.message || 'تعذر إنشاء الامتحان.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal isOpen onClose={onClose} maxWidth="md" title="إنشاء امتحان للمجموعة" icon={<GraduationCap className="w-5 h-5" />}>
      <div className="space-y-3" dir="rtl">
        <div>
          <label className="block text-[11px] font-black text-slate-500 mb-1.5">عنوان الامتحان</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: امتحان أكتوبر" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">التاريخ</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">يبدأ الساعة</label>
            <input type="time" value={start} onChange={e => setStart(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">المدة (دقيقة)</label>
            <input type="number" min="10" value={duration} onChange={e => setDuration(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">الدرجة النهائية</label>
            <input type="number" min="1" value={marks} onChange={e => setMarks(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">المكان</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="القاعة" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Btn variant="secondary" size="sm" onClick={onClose}>إلغاء</Btn>
          <Btn variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GraduationCap className="w-3.5 h-3.5" />} إنشاء الامتحان
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
