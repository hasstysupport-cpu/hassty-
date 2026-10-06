/**
 * Hassty — لوحة ذكاء المواعيد للمدرس (Schedule Intelligence Panel)
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 *
 * تعرض: الموعد الحالي ونسبة توافق الطلاب + أفضل موعد بديل + الاقتراحات والردود
 * + سجل التغييرات — مع تطبيق قواعد الاستقرار (لا تغيير عشوائي، Schedule Lock، التهدئة).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Brain, Clock, Users, TrendingUp, TrendingDown, Send, CheckCircle2, XCircle,
  Loader2, Plus, History, Lock, AlertTriangle, MessageCircle, RefreshCw, Sparkles
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { supabase } from '../../lib/supabase';
import { formatTimeArabic } from '../../lib/scheduleSync';
import {
  ScheduleIntel, SlotStat, getIntelligence, setCandidates, createProposal,
  decideProposal, slotLabel, slotKey
} from '../../lib/smartSchedule';
import { GroupScheduleSlot } from '../../types';
import { whatsappService } from '../../lib/whatsappService';

const DAYS = [
  { eng: 'Saturday', ar: 'السبت' }, { eng: 'Sunday', ar: 'الأحد' },
  { eng: 'Monday', ar: 'الإثنين' }, { eng: 'Tuesday', ar: 'الثلاثاء' },
  { eng: 'Wednesday', ar: 'الأربعاء' }, { eng: 'Thursday', ar: 'الخميس' },
  { eng: 'Friday', ar: 'الجمعة' },
];

interface Props {
  groupId: string | null;
  onClose: () => void;
}

export const ScheduleIntelligencePanel: React.FC<Props> = ({ groupId, onClose }) => {
  const [intel, setIntel] = useState<ScheduleIntel | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err' | 'warn'; text: string } | null>(null);

  // نموذج اقتراح التغيير
  const [proposeOpen, setProposeOpen] = useState(false);
  const [targetKey, setTargetKey] = useState('');
  const [reason, setReason] = useState('');

  // نموذج إضافة موعد مرشح
  const [candDay, setCandDay] = useState(DAYS[0].eng);
  const [candStart, setCandStart] = useState('16:00');
  const [candEnd, setCandEnd] = useState('17:30');

  const load = useCallback(async () => {
    if (!groupId) return;
    setLoading(true); setMsg(null);
    try {
      const data = await getIntelligence(groupId);
      setIntel(data);
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'تعذر تحميل ذكاء المواعيد' });
    } finally { setLoading(false); }
  }, [groupId]);

  useEffect(() => { if (groupId) { void load(); setProposeOpen(false); setTargetKey(''); setReason(''); } }, [groupId]);

  if (!groupId) return null;

  const stats = intel?.stats;
  const settings = intel?.settings;
  const pending = intel?.pending_proposal;

  /** إضافة موعد مرشح جديد */
  const addCandidate = async () => {
    if (!intel || busy) return;
    setBusy('cand');
    try {
      const slots: GroupScheduleSlot[] = [...(intel.group.candidate_slots || [])];
      const exists = slots.some(s => slotKey(s.day, s.startTime) === slotKey(candDay, candStart));
      if (exists) { setMsg({ kind: 'warn', text: 'هذا الموعد مضاف بالفعل ضمن المواعيد المتاحة' }); return; }
      slots.push({ id: `cand-${Date.now()}`, day: candDay, dayArabic: DAYS.find(d => d.eng === candDay)?.ar || candDay, startTime: candStart, endTime: candEnd });
      await setCandidates(intel.group.id, slots);
      setMsg({ kind: 'ok', text: 'تمت إضافة الموعد للمواعيد المتاحة — الطلاب هيصوّتوا عليه' });
      await load();
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'تعذر إضافة الموعد' });
    } finally { setBusy(null); }
  };

  /** إنشاء اقتراح تغيير (المدرس) — الخادم يطبق قواعد الاستقرار */
  const submitProposal = async () => {
    if (!intel || !targetKey || busy) return;
    setBusy('propose');
    try {
      // الهدف: الموعد المرشح المختار (من قائمة المواعيد المتاحة)
      const target = (intel.group.candidate_slots || []).find(s => slotKey(s.day, s.startTime) === targetKey);
      if (!target) { setMsg({ kind: 'err', text: 'اختر موعداً من المواعيد المتاحة أولاً' }); return; }
      const res = await createProposal(intel.group.id, [target], reason.trim());
      if (res?.ok) {
        setMsg({ kind: 'ok', text: `تم إرسال الاقتراح لـ ${res.eligible_students} طالب ✅ التوافق: ${res.old_compatibility}% ← ${res.proposed_compatibility}%` });
        setProposeOpen(false); setReason('');
      } else {
        setMsg({ kind: 'warn', text: res?.message || 'تعذر إنشاء الاقتراح' });
      }
      await load();
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'تعذر إنشاء الاقتراح' });
    } finally { setBusy(null); }
  };

  /** قرار المدرس: اعتماد = تطبيق على الحصص القادمة فقط */
  const decide = async (decision: 'approve' | 'reject') => {
    if (!pending || busy) return;
    setBusy(decision === 'approve' ? 'decide-ok' : 'decide-no');
    try {
      const res = await decideProposal(pending.id, decision);
      if (res?.ok && res.applied) {
        setMsg({ kind: 'ok', text: `تم اعتماد الموعد الجديد وتطبيقه على ${res.sessions_updated} حصة قادمة — الحصص السابقة لم تتغير ✅` });
      } else if (res?.ok) {
        setMsg({ kind: 'ok', text: 'تم رفض الاقتراح والإبقاء على الموعد الحالي' });
      } else {
        setMsg({ kind: 'warn', text: res?.message || 'تعذر تنفيذ القرار' });
      }
      await load();
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'تعذر تنفيذ القرار' });
    } finally { setBusy(null); }
  };

  /** إرسال نص الاقتراح واتساب للطلاب (قابل للربط لاحقاً — مطلب 16) */
  const sendWhatsApp = async () => {
    if (!pending || busy || !supabase) return;
    setBusy('wa');
    try {
      const { data: rows } = await supabase
        .from('group_enrollments')
        .select('student_name, student_phone')
        .eq('group_id', groupId)
        .eq('status', 'active');
      const text = `📢 موعد مجموعة "${intel?.group.name}" مقترح للتغيير:\nمن: ${slotLabel(pending.old_slots[0] || {} as any)}\nإلى: ${slotLabel(pending.proposed_slots[0] || {} as any)}\nالسبب: ${pending.reason}\nرد بموافقتك داخل منصة حِصّتي من فضلك.`;
      let sent = 0;
      for (const r of (rows || []) as any[]) {
        const phone = String(r.student_phone || '').replace(/\D/g, '');
        if (phone.length >= 10) {
          try {
            await whatsappService.sendMessage(phone.startsWith('0') ? `2${phone}` : phone, text);
            sent++;
          } catch { /* استمرار لبقية الطلاب */ }
        }
      }
      setMsg({ kind: sent > 0 ? 'ok' : 'warn', text: sent > 0 ? `تم إرسال ${sent} رسالة واتساب للطلاب` : 'لا أرقام صالحة للإرسال أو خدمة واتساب غير متصلة' });
    } finally { setBusy(null); }
  };

  const ringColor = (pct: number) => pct >= (settings?.alert_threshold ?? 70) ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
  const barColor = (pct: number) => pct >= (settings?.alert_threshold ?? 70) ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <Modal isOpen={!!groupId} onClose={onClose} maxWidth="2xl"
      title="ذكاء المواعيد" subtitle="النظام يحسب أفضل موعد بناءً على مواعيد طلابك — مع حماية استقرار المجموعة"
      icon={<Brain className="w-5 h-5 text-[#2563EB]" />}>
      {loading && !intel ? (
        <div className="py-10 text-center"><Loader2 className="w-7 h-7 mx-auto animate-spin text-[#2563EB]" /><p className="text-xs font-bold text-gray-500 mt-2">جاري تحليل مواعيد المجموعة...</p></div>
      ) : !intel || !stats ? (
        <div className="py-8 text-center text-xs font-bold text-gray-500">{msg?.text || 'لا توجد بيانات'}</div>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pl-1">
          {msg && (
            <div className={`rounded-xl border px-3.5 py-2.5 text-xs font-bold flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : msg.kind === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {msg.kind === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{msg.text}</span>
            </div>
          )}

          {/* ===== الموعد الحالي + التوافق ===== */}
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-l from-[#EFF6FF] to-white p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold text-gray-500 mb-1">الموعد الحالي — {intel.group.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  {intel.group.schedule_slots.length > 0 ? intel.group.schedule_slots.map(s => (
                    <span key={s.id} className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-black">
                      {slotLabel(s)}
                    </span>
                  )) : <span className="text-[11px] text-gray-500">{intel.group.schedule || 'لم يحدد موعد بعد'}</span>}
                </div>
              </div>
              <div className="text-center shrink-0">
                <div className={`text-3xl font-black ${ringColor(stats.current_compatibility)}`}>{stats.current_compatibility}%</div>
                <div className="text-[10px] font-bold text-gray-500">توافق الطلاب</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="rounded-xl bg-white border border-gray-100 p-2.5 text-center">
                <div className="text-lg font-black text-[#1E3A8A]">{stats.total_students}</div>
                <div className="text-[10px] font-bold text-gray-500 flex items-center justify-center gap-1"><Users className="w-3 h-3" />طلاب المجموعة</div>
              </div>
              <div className="rounded-xl bg-white border border-gray-100 p-2.5 text-center">
                <div className="text-lg font-black text-emerald-700">{stats.per_slot.find(s => s.is_current)?.available ?? 0}</div>
                <div className="text-[10px] font-bold text-gray-500">متاحون للموعد</div>
              </div>
              <div className="rounded-xl bg-white border border-gray-100 p-2.5 text-center">
                <div className="text-lg font-black text-red-600">{Math.max(stats.total_students - (stats.per_slot.find(s => s.is_current)?.available ?? 0), 0)}</div>
                <div className="text-[10px] font-bold text-gray-500">غير متاحين</div>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 mt-2 font-bold">
              {stats.voted_students} من {stats.total_students} طالب حددوا مواعيدهم — اطلب من طلابك تحديد مواعيدهم من لوحة الطالب لنتيجة أدق
            </div>
          </div>

          {/* ===== اقتراح معلق: ردود الطلاب ===== */}
          {pending && (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <div className="text-xs font-black text-amber-900">اقتراح تغيير معلق — بانتظار ردود الطلاب وقرارك</div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-[11px] font-bold text-gray-700">
                <span className="line-through text-gray-400">{slotLabel(pending.old_slots[0] || {} as any)}</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 rotate-90" />
                <span className="px-2 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg">{slotLabel(pending.proposed_slots[0] || {} as any)}</span>
                <span className="text-gray-500">التوافق: {pending.old_compatibility}% ← {pending.proposed_compatibility}%</span>
              </div>
              <div className="text-[11px] font-bold text-gray-600">السبب: {pending.reason}</div>
              {(() => {
                const total = Math.max(pending.eligible_students, 1);
                const ap = pending.responses.approvals, rj = pending.responses.rejections;
                return (
                  <div className="space-y-1.5">
                    <div className="h-2.5 rounded-full overflow-hidden bg-white border border-amber-200 flex">
                      <div className="h-full bg-emerald-500" style={{ width: `${(ap / total) * 100}%` }} />
                      <div className="h-full bg-red-400" style={{ width: `${(rj / total) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-gray-600">
                      <span className="text-emerald-700">{ap} موافق</span>
                      <span>الحد المطلوب: {pending.approval_threshold}%</span>
                      <span className="text-red-600">{rj} معارض / {pending.eligible_students} طالب</span>
                    </div>
                  </div>
                );
              })()}
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={() => void decide('approve')} disabled={busy !== null}
                  className="flex-1 min-w-[140px] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {busy === 'decide-ok' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  اعتماد وتطبيق من الحصة القادمة
                </button>
                <button onClick={() => void decide('reject')} disabled={busy !== null}
                  className="flex-1 min-w-[110px] py-2.5 bg-white border border-red-200 hover:bg-red-50 text-red-700 text-xs font-black rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {busy === 'decide-no' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  رفض والإبقاء
                </button>
                <button onClick={() => void sendWhatsApp()} disabled={busy !== null} title="إرسال تنبيه واتساب للطلاب"
                  className="px-3.5 py-2.5 bg-[#25D366]/10 border border-[#25D366]/40 text-[#128C4A] text-xs font-black rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {busy === 'wa' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                  واتساب
                </button>
              </div>
            </div>
          )}

          {/* ===== أفضل موعد بديل ===== */}
          {!pending && stats.best_alternative && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5 mb-1"><Sparkles className="w-3.5 h-3.5" />أفضل موعد بديل مقترح</div>
                <div className="text-sm font-black text-[#1E3A8A]">{slotLabel(stats.best_alternative)}</div>
                <div className="text-[11px] font-bold text-gray-600 mt-0.5">
                  {stats.best_alternative.available} / {stats.total_students} طالب متاح — التوافق {stats.best_alternative.compatibility}%
                  <span className={`mr-2 inline-flex items-center gap-1 font-black ${stats.improvement > 0 ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {stats.improvement > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    التحسن: {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
                  </span>
                </div>
              </div>
              {!proposeOpen ? (
                <button onClick={() => { setProposeOpen(true); setTargetKey(stats.best_alternative!.key); }}
                  disabled={!intel.cooldown_ok}
                  title={!intel.cooldown_ok ? `فترة تهدئة ${settings?.cooldown_hours} ساعة بعد آخر تغيير` : ''}
                  className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0">
                  <Send className="w-3.5 h-3.5" />اقتراح تغيير الموعد
                </button>
              ) : null}
            </div>
          )}
          {!pending && !stats.best_alternative && stats.total_students > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-[11px] font-bold text-gray-600">
              أضف مواعيد متاحة بديلة (من قسم «المواعيد المتاحة» بالأسفل) وسيحسب النظام أفضلها تلقائياً بعد تصويت الطلاب.
            </div>
          )}

          {/* ===== نموذج الاقتراح ===== */}
          {proposeOpen && (
            <div className="rounded-2xl border-2 border-[#2563EB]/30 bg-white p-4 space-y-3">
              <div className="text-xs font-black text-[#1E3A8A]">إرسال اقتراح تغيير الموعد للطلاب</div>
              <div className="text-[11px] font-bold text-gray-600">
                الموعد الجديد المقترح: <span className="text-emerald-700">{slotLabel((intel.group.candidate_slots || []).find(s => slotKey(s.day, s.startTime) === targetKey) || {} as any)}</span>
                <span className="text-gray-400 mx-1">—</span>
                القاعدة: لا يتغير الموعد لمصلحة طالب أو اثنين (أقل تحسن مقبول: +{settings?.min_improvement}%)
              </div>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                placeholder="سبب التغيير (مطلوب — يُسجل في سجل المجموعة)... مثال: تعارض مع جدول المدرسة / طلب أغلبية الطلاب"
                className="w-full rounded-xl border border-gray-200 p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30" />
              <div className="flex gap-2">
                <button onClick={() => void submitProposal()} disabled={busy !== null || reason.trim().length < 3}
                  className="flex-1 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {busy === 'propose' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  إرسال الاقتراح للطلاب
                </button>
                <button onClick={() => setProposeOpen(false)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-black rounded-xl cursor-pointer">إلغاء</button>
              </div>
            </div>
          )}

          {/* ===== المواعيد المتاحة (المرشحة) + نسبة كل موعد ===== */}
          <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-[#1E3A8A] flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />المواعيد المتاحة ونسبة توافق كل موعد</div>
              <button onClick={() => void load()} className="text-[10px] font-bold text-gray-400 hover:text-[#2563EB] flex items-center gap-1 cursor-pointer"><RefreshCw className="w-3 h-3" />تحديث</button>
            </div>
            {stats.per_slot.length === 0 ? (
              <div className="text-[11px] font-bold text-gray-500">لا مواعيد بعد — أضف أول موعد بالأسفل.</div>
            ) : (
              <div className="space-y-2">
                {stats.per_slot.map(s => <SlotRow key={s.key} s={s} total={Math.max(stats.total_students, 1)} barColor={barColor} onPropose={!pending ? () => { setProposeOpen(true); setTargetKey(s.key); } : undefined} />)}
              </div>
            )}
            {/* إضافة موعد مرشح */}
            <div className="pt-2 border-t border-gray-100 flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">اليوم</label>
                <select value={candDay} onChange={e => setCandDay(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30">
                  {DAYS.map(d => <option key={d.eng} value={d.eng}>{d.ar}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">من</label>
                <input type="time" value={candStart} onChange={e => setCandStart(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">إلى</label>
                <input type="time" value={candEnd} onChange={e => setCandEnd(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30" />
              </div>
              <button onClick={() => void addCandidate()} disabled={busy !== null}
                className="py-2 px-3.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] border border-blue-200 text-[11px] font-black rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1">
                {busy === 'cand' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}إضافة موعد متاح
              </button>
            </div>
          </div>

          {/* ===== قواعد الحماية ===== */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 flex flex-wrap gap-x-5 gap-y-1.5 text-[10px] font-bold text-gray-600">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-slate-400" />قفل الحصص القريبة: {settings?.lock_minutes} دقيقة</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-slate-400" />حد موافقة الطلاب: {settings?.approval_threshold}%</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-slate-400" />أقل تحسن مقبول: +{settings?.min_improvement}%</span>
            <span className="flex items-center gap-1"><History className="w-3 h-3 text-slate-400" />تهدئة بين التغييرات: {settings?.cooldown_hours} ساعة {!intel.cooldown_ok && <b className="text-amber-700">(مفعلة الآن)</b>}</span>
          </div>

          {/* ===== سجل التغييرات ===== */}
          {intel.history.length > 0 && (
            <div className="rounded-2xl border border-gray-200 p-4">
              <div className="text-xs font-black text-[#1E3A8A] flex items-center gap-1.5 mb-2.5"><History className="w-3.5 h-3.5" />سجل تغييرات المواعيد</div>
              <div className="space-y-2">
                {intel.history.map(h => (
                  <div key={h.id} className="rounded-xl bg-gray-50 border border-gray-100 p-2.5 text-[11px]">
                    <div className="flex flex-wrap items-center gap-x-2 font-bold text-gray-700">
                      <span className="line-through text-gray-400">{h.old_schedule || '—'}</span>
                      <span>←</span>
                      <span className="text-emerald-700">{h.new_schedule}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      السبب: {h.reason} • التوافق {h.old_compatibility}% ← {h.new_compatibility}% • موافقة الطلاب {h.approval_rate}% ({h.approvals}/{h.eligible}) • حصص محدثة: {h.sessions_updated} • {new Date(h.created_at).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

/** صف موعد: نسبة التوافق + زر اقتراح سريع */
const SlotRow: React.FC<{ s: SlotStat; total: number; barColor: (p: number) => string; onPropose?: () => void }> = ({ s, total, barColor, onPropose }) => (
  <div className={`rounded-xl border p-2.5 flex items-center gap-3 ${s.is_current ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-100 bg-white'}`}>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-black text-gray-800">{s.dayArabic} {formatTimeArabic(s.startTime)} - {formatTimeArabic(s.endTime)}</span>
        {s.is_current && <span className="text-[9px] font-black bg-emerald-600 text-white rounded-full px-2 py-0.5">الحالي</span>}
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 mt-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${barColor(s.compatibility)}`} style={{ width: `${s.compatibility}%` }} />
      </div>
      <div className="text-[10px] font-bold text-gray-500 mt-1">{s.available} / {total} طالب متاح</div>
    </div>
    <div className={`text-base font-black shrink-0 ${s.compatibility >= 70 ? 'text-emerald-600' : s.compatibility >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{s.compatibility}%</div>
    {onPropose && !s.is_current && (
      <button onClick={onPropose} className="shrink-0 text-[10px] font-black text-[#2563EB] hover:bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5 cursor-pointer">اقتراح</button>
    )}
  </div>
);
