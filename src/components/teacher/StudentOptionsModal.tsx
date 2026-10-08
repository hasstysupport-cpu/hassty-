/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/**
 * StudentOptionsModal — تحكم المدرس الكامل بخيارات الطالب داخل مجموعته
 * ----------------------------------------------------------------
 * 1) وضع الحضور: ثابت (مواعيد مجموعته فقط) أو مرن (يحضر أي مجموعة
 *    شقيقة من نفس المرحلة في أي ميعاد — بدون فحص تعارض يوقفه)
 * 2) جدول مخصص لهذا الطالب في هذه المجموعة (يوميًا حسب حاجته)
 * 3) إعفاء من المصاريف (مع سبب وتاريخ انتهاء اختياري)
 * 4) المجموعات الشقيقة: إضافة/إظهار مجموعات نفس المرحلة للطالب
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  UserCog, CalendarClock, ShieldOff, Layers, Loader2, CheckCircle2, AlertTriangle,
  BadgeCheck, Info, Users, Plus,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { supabase } from '../../lib/supabase';
import { GroupScheduleSlot } from '../../types';

const DAYS = [
  { eng: 'Saturday', ar: 'السبت' },
  { eng: 'Sunday', ar: 'الأحد' },
  { eng: 'Monday', ar: 'الإثنين' },
  { eng: 'Tuesday', ar: 'الثلاثاء' },
  { eng: 'Wednesday', ar: 'الأربعاء' },
  { eng: 'Thursday', ar: 'الخميس' },
  { eng: 'Friday', ar: 'الجمعة' },
];

export interface StudentOptionsData {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  grade?: string;
  groupId: string;
  groupName: string;
  groupSlots?: GroupScheduleSlot[];
  attendanceMode: 'fixed' | 'flexible';
  customScheduleSlots: GroupScheduleSlot[];
  feeExempt: boolean;
  feeExemptReason?: string;
  feeExemptUntil?: string;
}

interface SiblingGroup {
  group_id: string;
  group_name: string;
  grade: string;
  subject: string | null;
  schedule: string;
  current_count: number;
  max_students: number;
  already_enrolled: boolean;
}

export const StudentOptionsModal: React.FC<{
  data: StudentOptionsData;
  teacherId: string;
  onClose: () => void;
  onUpdated: () => void;
}> = ({ data, teacherId, onClose, onUpdated }) => {
  const [tab, setTab] = useState<'schedule' | 'exemption' | 'siblings'>('schedule');

  const [mode, setMode] = useState<'fixed' | 'flexible'>(data.attendanceMode);
  const [useCustom, setUseCustom] = useState<boolean>(data.customScheduleSlots.length > 0);
  const [customSlots, setCustomSlots] = useState<GroupScheduleSlot[]>(
    data.customScheduleSlots.length ? data.customScheduleSlots : (data.groupSlots || []),
  );

  const [exempt, setExempt] = useState(data.feeExempt);
  const [exemptReason, setExemptReason] = useState(data.feeExemptReason || '');
  const [exemptUntil, setExemptUntil] = useState(data.feeExemptUntil || '');

  const [siblings, setSiblings] = useState<SiblingGroup[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const activeDays = useMemo(() => new Set(customSlots.map(s => s.day)), [customSlots]);

  useEffect(() => {
    if (tab === 'siblings' && siblings === null && supabase) {
      (supabase.rpc('list_student_sibling_groups', { p_student_id: data.studentId, p_teacher_id: teacherId }) as any)
        .then(({ data: rows }: any) => setSiblings((rows || []) as SiblingGroup[]))
        .catch(() => setSiblings([]));
    }
  }, [tab, siblings, data.studentId, teacherId]);

  const toggleCustomDay = (day: string) => {
    const exists = activeDays.has(day);
    if (exists) {
      if (customSlots.length <= 1) return;
      setCustomSlots(customSlots.filter(s => s.day !== day));
    } else {
      const ar = DAYS.find(d => d.eng === day)?.ar || day;
      const ref = customSlots[0];
      setCustomSlots([...customSlots, { id: `cs-${Date.now()}`, day, dayArabic: ar, startTime: ref?.startTime || '16:30', endTime: ref?.endTime || '18:30' }]);
    }
  };

  const saveOptions = async () => {
    setSaving(true); setMsg(null);
    try {
      if (!supabase) throw new Error('قاعدة البيانات غير متاحة');
      const finalMode = useCustom && customSlots.length && customSlots.length < ((data.groupSlots || []).length || 99) ? 'flexible' : mode;
      const { error } = await supabase.rpc('update_student_enrollment_options', {
        p_enrollment_id: data.enrollmentId,
        p_attendance_mode: finalMode,
        p_custom_slots: useCustom ? customSlots : [],
        p_fee_exempt: exempt,
        p_fee_exempt_reason: exempt ? (exemptReason.trim() || null) : null,
        p_fee_exempt_until: exempt && exemptUntil ? exemptUntil : null,
      });
      if (error) throw error;
      setMsg({ kind: 'ok', text: 'تم حفظ خيارات الطالب بنجاح ✅ — التعارضات والمصاريف اتحدثت فورًا.' });
      onUpdated();
    } catch (e: any) {
      setMsg({ kind: 'err', text: `تعذر الحفظ: ${String(e?.message || e).slice(0, 120)}` });
    } finally {
      setSaving(false);
    }
  };

  const addToSibling = async (g: SiblingGroup) => {
    if (busy || g.already_enrolled) return;
    if ((g.current_count || 0) >= (g.max_students || 35)) {
      setMsg({ kind: 'err', text: `مجموعة «${g.group_name}» ممتلئة (${g.current_count}/${g.max_students}).` });
      return;
    }
    setBusy(true);
    try {
      if (!supabase) throw new Error('قاعدة البيانات غير متاحة');
      const { error } = await supabase.from('group_enrollments').upsert({
        group_id: g.group_id,
        student_id: data.studentId,
        student_name: data.studentName,
        grade: data.grade || g.grade,
        status: 'active',
        attendance_mode: 'flexible',
        enrolled_at: new Date().toISOString(),
      }, { onConflict: 'group_id,student_id' });
      if (error) throw error;
      const { count } = await supabase.from('group_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', g.group_id).eq('status', 'active');
      if (count !== null) await supabase.from('student_groups').update({ current_count: count }).eq('id', g.group_id);
      setSiblings(prev => (prev || []).map(s => s.group_id === g.group_id ? { ...s, already_enrolled: true, current_count: (s.current_count || 0) + 1 } : s));
      setMsg({ kind: 'ok', text: `تمت إضافة ${data.studentName} لمجموعة «${g.group_name}» بوضع الحضور المرن ✅` });
      onUpdated();
    } catch (e: any) {
      setMsg({ kind: 'err', text: `تعذرت الإضافة: ${String(e?.message || e).slice(0, 120)}` });
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    { key: 'schedule' as const, label: 'المواعيد والحضور', icon: CalendarClock },
    { key: 'exemption' as const, label: 'الإعفاء من المصاريف', icon: ShieldOff },
    { key: 'siblings' as const, label: 'المجموعات الشقيقة', icon: Layers },
  ];

  return (
    <Modal
      isOpen
      onClose={onClose}
      maxWidth="lg"
      icon={<UserCog className="w-5 h-5" />}
      title={`خيارات الطالب: ${data.studentName}`}
      subtitle={`داخل مجموعة «${data.groupName}» — تحكم كامل في حضوره ومصاريفه`}
    >
      <div className="space-y-4" dir="rtl">
        {/* تبويبات */}
        <div className="flex gap-2 rounded-2xl bg-slate-100 p-1.5">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 rounded-xl py-2.5 px-2 text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${tab === t.key ? 'bg-white text-blue-800 shadow-sm border border-blue-100' : 'text-slate-500 hover:text-slate-700'}`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== تبويب المواعيد والحضور ===== */}
        {tab === 'schedule' && (
          <div className="space-y-4">
            {/* وضع الحضور */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" onClick={() => setMode('fixed')}
                className={`rounded-2xl border-2 p-4 text-right transition-all cursor-pointer ${mode === 'fixed' && !useCustom ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
                <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">📅 حضور ثابت</div>
                <div className="text-[11px] font-bold text-slate-500 mt-1.5 leading-5">يحضر مواعيد مجموعته المسجلة فقط — والنظام يفحص تعارضاته مع أي ميعاد جديد.</div>
              </button>
              <button type="button" onClick={() => setMode('flexible')}
                className={`rounded-2xl border-2 p-4 text-right transition-all cursor-pointer ${mode === 'flexible' || useCustom ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-200'}`}>
                <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">🔄 حضور مرن</div>
                <div className="text-[11px] font-bold text-slate-500 mt-1.5 leading-5">يحضر المجموعة اللي تناسبه من مجموعات نفس المرحلة — والتعارضات لا توقفه (قرار المدرس).</div>
              </button>
            </div>

            {/* الجدول المخصص */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-black text-slate-700 cursor-pointer select-none">
                  <input type="checkbox" checked={useCustom} onChange={e => { setUseCustom(e.target.checked); if (e.target.checked && customSlots.length === 0) setCustomSlots(data.groupSlots || []); }}
                    className="w-4 h-4 accent-blue-600" />
                  جدول حضور مخصص لهذا الطالب
                </label>
                {useCustom && <Badge variant="info" size="sm">{customSlots.length} ميعاد</Badge>}
              </div>

              {useCustom ? (
                <div className="p-4 space-y-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-900 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    اختر الأيام اللي بيحضرها الطالب فعليًا من مجموعة «{data.groupName}» — مثال: طالب في مجموعتين نفس المرحلة يحضر الأحد مع دي والخميس مع التانية.
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {DAYS.map(d => {
                      const inGroup = (data.groupSlots || []).some(gs => gs.day === d.eng);
                      const on = activeDays.has(d.eng);
                      return (
                        <button key={d.eng} type="button" onClick={() => toggleCustomDay(d.eng)}
                          className={`rounded-xl border py-2 text-[11px] font-black transition-all cursor-pointer ${on ? 'border-blue-500 bg-blue-600 text-white' : inGroup ? 'border-blue-100 bg-blue-50/50 text-blue-500' : 'border-slate-200 bg-white text-slate-400'}`}>
                          {d.ar}
                        </button>
                      );
                    })}
                  </div>
                  <div className="space-y-2">
                    {customSlots.map(s => (
                      <div key={s.day} className="flex items-center gap-2 rounded-xl bg-white border border-slate-100 px-3 py-2">
                        <span className="text-[11px] font-black text-slate-700 min-w-[52px]">{s.dayArabic}</span>
                        <span className="text-[10px] text-slate-400 font-bold">من</span>
                        <input type="time" value={s.startTime} onChange={e => setCustomSlots(customSlots.map(x => x.day === s.day ? { ...x, startTime: e.target.value } : x))}
                          className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold outline-none focus:border-blue-300" />
                        <span className="text-[10px] text-slate-400 font-bold">إلى</span>
                        <input type="time" value={s.endTime} onChange={e => setCustomSlots(customSlots.map(x => x.day === s.day ? { ...x, endTime: e.target.value } : x))}
                          className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold outline-none focus:border-blue-300" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-[11px] font-bold text-slate-500 text-center py-5">
                  مواعيد المجموعة الأساسية: {(data.groupSlots || []).map(s => s.dayArabic).join('، ') || '—'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== تبويب الإعفاء ===== */}
        {tab === 'exemption' && (
          <div className="space-y-4">
            <button type="button" onClick={() => setExempt(!exempt)}
              className={`w-full rounded-2xl border-2 p-4 text-right transition-all cursor-pointer ${exempt ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-200'}`}>
              <div className="text-xs font-black text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><ShieldOff className="w-4 h-4 text-amber-600" />إعفاء الطالب من مصاريف هذه المجموعة</span>
                <span className={`w-11 h-6 rounded-full relative transition-all ${exempt ? 'bg-amber-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${exempt ? 'right-0.5' : 'right-[22px]'}`} />
                </span>
              </div>
              <div className="text-[11px] font-bold text-slate-500 mt-2 leading-5">
                الطالب المعفو يُستثنى من قوائم التحصيل ومن نسبة تحصيل فاتورة المنصة (75%) — حضوره وطبيعته الأكاديمية لا يتأثران.
              </div>
            </button>

            {exempt && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-[fadeIn_.2s_ease]">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black text-slate-500 mb-1.5">سبب الإعفاء (يظهر للمدرس فقط)</label>
                  <input type="text" value={exemptReason} onChange={e => setExemptReason(e.target.value)} maxLength={200}
                    placeholder="مثال: حالة اجتماعية / تفوق دراسي / أخ للمدرس..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:border-amber-300" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1.5">ينتهي الإعفاء في (اختياري)</label>
                  <input type="date" value={exemptUntil} onChange={e => setExemptUntil(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:border-amber-300" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== تبويب المجموعات الشقيقة ===== */}
        {tab === 'siblings' && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px] font-bold text-emerald-900 flex items-start gap-2">
              <Users className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              مجموعاتك من نفس مرحلة الطالب — أضِفه لأكثر من مجموعة لو ودّه يحضر ميعادًا في كل واحدة.
            </div>
            {siblings === null ? (
              <div className="py-10 text-center"><Loader2 className="mx-auto animate-spin text-blue-600" /><p className="text-xs font-bold text-slate-500 mt-2">جاري تحميل مجموعاتك...</p></div>
            ) : siblings.filter(s => s.group_id !== data.groupId).length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-slate-500">
                مفيش مجموعات تانية من مرحلة «{data.grade || '—'}» — أنشئ مجموعة جديدة بنفس المرحلة أولًا.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pl-1">
                {siblings.filter(s => s.group_id !== data.groupId).map(g => (
                  <div key={g.group_id} className={`rounded-2xl border p-3.5 flex items-center justify-between gap-3 ${g.already_enrolled ? 'border-emerald-200 bg-emerald-50/60' : (g.current_count || 0) >= (g.max_students || 35) ? 'border-slate-200 bg-slate-50 opacity-70' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-800 flex items-center gap-1.5 flex-wrap">
                        {g.group_name}
                        {g.subject && <Badge variant="info" size="sm">{g.subject}</Badge>}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 mt-0.5">{g.schedule || '—'} · {g.current_count}/{g.max_students} طالب</div>
                    </div>
                    {g.already_enrolled ? (
                      <span className="text-[11px] font-black text-emerald-700 flex items-center gap-1 shrink-0"><BadgeCheck className="w-4 h-4" />مسجل بها</span>
                    ) : (
                      <button type="button" onClick={() => addToSibling(g)} disabled={busy}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black px-3.5 py-2 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0">
                        <Plus className="w-3.5 h-3.5" /> إضافة
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* رسالة النتيجة */}
        {msg && (
          <div className={`rounded-2xl border p-3 text-xs font-bold flex items-center gap-2 ${msg.kind === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
            {msg.kind === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            {msg.text}
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex items-center gap-2 justify-end pt-1 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50 cursor-pointer">إغلاق</button>
          {tab !== 'siblings' && (
            <button type="button" onClick={saveOptions} disabled={saving}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-black shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              حفظ الخيارات
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
