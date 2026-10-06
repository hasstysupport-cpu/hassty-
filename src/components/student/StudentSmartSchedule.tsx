/**
 * Hassty — كارت ذكاء المواعيد للطالب (Student Smart Schedule)
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 *
 * يعرض للطالب: مجموعاته + الموعد الحالي + مواعيده المتاحة (تحديد بنقرة)
 * + أي اقتراح تغيير موعد جديد مع موافقة/رفض وحالة الرد.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, XCircle, Loader2, Clock3, Brain, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { formatTimeArabic } from '../../lib/scheduleSync';
import {
  saveAvailability, respondProposal, fetchPendingProposals, fetchMyResponses,
  fetchLastHistory, slotLabel, keyOfSlot, GroupScheduleSlotLike
} from '../../lib/smartSchedule';

interface MyGroup {
  group_id: string;
  name: string;
  subject: string;
  grade: string;
  schedule: string;
  schedule_slots: GroupScheduleSlotLike[];
  candidate_slots: GroupScheduleSlotLike[];
}

interface PendingProposal {
  id: string; group_id: string;
  old_slots: GroupScheduleSlotLike[]; proposed_slots: GroupScheduleSlotLike[];
  reason: string; old_compatibility: number; proposed_compatibility: number;
  approval_threshold: number; eligible_students: number; created_at: string;
}

export const StudentSmartSchedule: React.FC = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const [groups, setGroups] = useState<MyGroup[]>([]);
  const [myAvail, setMyAvail] = useState<Record<string, string[]>>({});
  const [proposals, setProposals] = useState<PendingProposal[]>([]);
  const [myResponses, setMyResponses] = useState<Record<string, string>>({});
  const [lastChanges, setLastChanges] = useState<Record<string, { new_schedule: string; created_at: string }>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !uid) { setLoading(false); return; }
    setLoading(true);
    try {
      const enr = await supabase
        .from('group_enrollments')
        .select('group_id, group:student_groups(id,name,subject,grade,schedule,schedule_slots,candidate_slots)')
        .eq('student_id', uid)
        .eq('status', 'active');
      if (enr.error) throw enr.error;
      const myGroups: MyGroup[] = ((enr.data || []) as any[])
        .filter(r => r.group)
        .map(r => ({
          group_id: r.group.id,
          name: r.group.name || 'مجموعة',
          subject: r.group.subject || '',
          grade: r.group.grade || '',
          schedule: r.group.schedule || '',
          schedule_slots: Array.isArray(r.group.schedule_slots) ? r.group.schedule_slots : [],
          candidate_slots: Array.isArray(r.group.candidate_slots) ? r.group.candidate_slots : [],
        }));
      setGroups(myGroups);
      const gids = myGroups.map(g => g.group_id);

      // مواعيدي المتاحة (صفوفي فقط — RLS)
      const av = await supabase.from('student_group_availability')
        .select('group_id, available_keys').eq('student_id', uid);
      const avMap: Record<string, string[]> = {};
      ((av.data || []) as any[]).forEach(r => { avMap[r.group_id] = r.available_keys || []; });
      setMyAvail(avMap);

      // الاقتراحات المعلقة + رودي + آخر تغييرات
      if (gids.length) {
        const props = await fetchPendingProposals(gids);
        setProposals(props);
        if (props.length) {
          const res = await fetchMyResponses(uid, props.map(p => p.id));
          const resMap: Record<string, string> = {};
          res.forEach(r => { resMap[r.proposal_id] = r.response; });
          setMyResponses(resMap);
        } else { setMyResponses({}); }
        const hist = await fetchLastHistory(gids);
        const histMap: Record<string, { new_schedule: string; created_at: string }> = {};
        hist.forEach(h => { if (!histMap[h.group_id]) histMap[h.group_id] = { new_schedule: h.new_schedule, created_at: h.created_at }; });
        setLastChanges(histMap);
      } else { setProposals([]); setMyResponses({}); setLastChanges({}); }
    } catch {
      // تحميل صامت — الكارت اختياري
    } finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { void load(); }, [load]);

  /** تبديل حالة موعد (متاح/غير متاح) وحفظه فوراً */
  const toggleSlot = async (g: MyGroup, slot: GroupScheduleSlotLike) => {
    if (busy || !uid) return;
    setBusy(`${g.group_id}-${slot.id}`);
    setMsg(null);
    try {
      const candidates = [...new Set([...(g.candidate_slots || []), ...(g.schedule_slots || [])])];
      const current = new Set(myAvail[g.group_id] || []);
      const k = keyOfSlot(slot);
      if (current.has(k)) current.delete(k); else current.add(k);
      const keys = Array.from(current);
      // غير المحدد = غير متاح ضمن قائمة التطبيع
      const unavailable = candidates.map(keyOfSlot).filter(kk => !keys.includes(kk));
      await saveAvailability(g.group_id, keys, unavailable);
      setMyAvail(prev => ({ ...prev, [g.group_id]: keys }));
      setMsg({ kind: 'ok', text: 'تم حفظ مواعيدك ✅ المدرس هيشوف التوافق محدث' });
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'تعذر حفظ مواعيدك' });
    } finally { setBusy(null); }
  };

  /** موافقة / رفض على اقتراح تغيير الموعد */
  const respond = async (p: PendingProposal, response: 'approve' | 'reject') => {
    if (busy) return;
    setBusy(`resp-${p.id}`);
    setMsg(null);
    try {
      const res = await respondProposal(p.id, response);
      if (res?.ok) {
        setMyResponses(prev => ({ ...prev, [p.id]: response }));
        setMsg({ kind: 'ok', text: response === 'approve' ? 'تم تسجيل موافقتك ✅ شكراً لك' : 'تم تسجيل ردك — الموعد غير مناسب لك ❌' });
      } else {
        setMsg({ kind: 'err', text: res?.message || 'تعذر تسجيل الرد' });
      }
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'تعذر تسجيل الرد' });
    } finally { setBusy(null); }
  };

  const unionSlots = useMemo(() => (g: MyGroup) => {
    const seen = new Set<string>(); const out: GroupScheduleSlotLike[] = [];
    [...(g.candidate_slots || []), ...(g.schedule_slots || [])].forEach(s => {
      const k = keyOfSlot(s);
      if (!seen.has(k)) { seen.add(k); out.push(s); }
    });
    return out;
  }, []);

  if (loading) {
    return (
      <section className="anim-up card-lux rounded-2xl bg-white border border-slate-200 p-4">
        <div className="flex items-center gap-2 text-xs font-black text-slate-700"><Brain className="w-4 h-4 text-[color:var(--role-color)]" />مواعيد المجموعات</div>
        <div className="py-4 text-center"><Loader2 className="w-5 h-5 mx-auto animate-spin text-slate-300" /></div>
      </section>
    );
  }

  if (groups.length === 0) return null;

  return (
    <section className="anim-up card-lux rounded-2xl bg-white border border-slate-200 p-4" style={{ animationDelay: '100ms' }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Brain className="w-4 h-4 text-[color:var(--role-color)]" />مواعيد المجموعات وذكاء التوافق
        </h2>
        <button onClick={() => void load()} className="text-[11px] font-bold text-slate-400 hover:text-[color:var(--role-color)] flex items-center gap-1 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />تحديث
        </button>
      </div>

      {msg && (
        <div className={`rounded-xl border px-3.5 py-2 text-[11px] font-bold mb-3 ${msg.kind === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      <div className="space-y-3">
        {groups.map(g => {
          const slots = unionSlots(g);
          const myKeys = myAvail[g.group_id] || [];
          const myKeySet = new Set(myKeys);
          const gProps = proposals.filter(p => p.group_id === g.group_id);
          const voted = myKeys.length > 0;
          return (
            <div key={g.group_id} className="rounded-xl border border-slate-200 overflow-hidden">
              {/* رأس المجموعة */}
              <button onClick={() => setExpanded(expanded === g.group_id ? null : g.group_id)}
                className="w-full text-right p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-black text-slate-900 truncate">{g.name}{g.subject ? ` • ${g.subject}` : ''}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
                    <Clock3 className="w-3 h-3 shrink-0" />
                    {g.schedule_slots.length > 0
                      ? g.schedule_slots.map(s => `${s.dayArabic || s.day} ${formatTimeArabic(s.startTime)}`).join(' و ')
                      : (g.schedule || 'الموعد يحدده المدرس')}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {gProps.length > 0 && <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-black animate-pulse">اقتراح جديد</span>}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${voted ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {voted ? `حددت ${myKeys.length} موعد` : 'حدد مواعيدك'}
                  </span>
                </div>
              </button>

              {/* اقتراح تغيير معلق */}
              {gProps.map(p => {
                const myResp = myResponses[p.id];
                return (
                  <div key={p.id} className="mx-3 mb-3 rounded-xl border-2 border-amber-300 bg-amber-50/70 p-3">
                    <div className="text-[11px] font-black text-amber-900 flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5" />اقتراح تغيير موعد المجموعة
                    </div>
                    <div className="text-[11px] font-bold text-slate-700 flex flex-wrap items-center gap-1.5">
                      <span className="line-through text-slate-400">{slotLabel(p.old_slots[0] || {} as any)}</span>
                      <span>←</span>
                      <span className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg">{slotLabel(p.proposed_slots[0] || {} as any)}</span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">السبب: {p.reason}</div>
                    {myResp ? (
                      <div className={`mt-2 text-[11px] font-black flex items-center gap-1.5 flex-wrap ${myResp === 'approve' ? 'text-emerald-700' : 'text-red-600'}`}>
                        {myResp === 'approve' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        ردك مسجل: {myResp === 'approve' ? 'الموعد الجديد يناسبني ✅' : 'غير مناسب لي ❌'}
                        <span className="text-slate-400 font-bold">(شكراً لمشاركتك — القرار النهائي للمدرس)</span>
                      </div>
                    ) : (
                      <div className="mt-2.5 flex gap-2">
                        <button onClick={() => void respond(p, 'approve')} disabled={busy !== null}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1">
                          {busy === `resp-${p.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}يناسبني ✅
                        </button>
                        <button onClick={() => void respond(p, 'reject')} disabled={busy !== null}
                          className="flex-1 py-2 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-700 text-[11px] font-black cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />غير مناسب ❌
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* تحديد مواعيدي المتاحة */}
              {expanded === g.group_id && slots.length > 0 && (
                <div className="mx-3 mb-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <div className="text-[11px] font-black text-slate-700 mb-2">حدد المواعيد اللي تقدر تحضرها (المدرس بيستخدمها لحساب أفضل موعد):</div>
                  <div className="flex flex-wrap gap-1.5">
                    {slots.map(s => {
                      const k = keyOfSlot(s);
                      const on = myKeySet.has(k);
                      return (
                        <button key={s.id || k} onClick={() => void toggleSlot(g, s)} disabled={busy !== null}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-black border cursor-pointer disabled:opacity-50 transition-all ${on ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'}`}>
                          {on ? '✓ ' : ''}{s.dayArabic || s.day} {formatTimeArabic(s.startTime)}{s.endTime ? ` - ${formatTimeArabic(s.endTime)}` : ''}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" />أنت بس اللي تشوف مواعيدك — المدرس يشوف النسب الإجمالية فقط
                  </div>
                </div>
              )}

              {/* آخر تغيير معتمد */}
              {lastChanges[g.group_id] && (
                <div className="mx-3 mb-3 text-[10px] font-bold text-slate-400">
                  آخر تغيير موعد معتمد: {lastChanges[g.group_id].new_schedule} — {new Date(lastChanges[g.group_id].created_at).toLocaleDateString('ar-EG')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
