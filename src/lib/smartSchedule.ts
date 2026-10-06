/**
 * Hassty — خدمة ذكاء المواعيد (Smart Group Scheduling)
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 *
 * قواعد الاستقرار (مطبقة في الـ RPC على الخادم، معروضة هنا):
 * 1) الحفاظ على استقرار المجموعة أولاً — لا تغيير لمصلحة طالب أو اثنين
 * 2) أي تغيير = اقتراح + ردود طلاب + اعتماد المدرس
 * 3) الحصص السابقة لا تتغير أبداً — التطبيق من الحصة القادمة فقط
 * 4) Schedule Lock: منع تغيير حصة تبدأ خلال lock_minutes من الإعدادات
 */

import { supabase } from './supabase';
import { GroupScheduleSlot } from '../types';
import { formatTimeArabic } from './scheduleSync';

export interface SlotStat {
  key: string;
  day: string;
  dayArabic: string;
  startTime: string;
  endTime: string;
  available: number;
  compatibility: number;
  is_current: boolean;
}

export interface ScheduleIntel {
  ok: boolean;
  group: {
    id: string; name: string; subject: string; grade: string;
    schedule: string;
    schedule_slots: GroupScheduleSlot[];
    candidate_slots: GroupScheduleSlot[];
    current_count: number;
  };
  stats: {
    total_students: number;
    voted_students: number;
    per_slot: SlotStat[];
    current_compatibility: number;
    best_alternative: SlotStat | null;
    improvement: number;
  };
  settings: {
    approval_threshold: number;
    lock_minutes: number;
    min_improvement: number;
    cooldown_hours: number;
    alert_threshold: number;
    auto_apply: boolean;
  };
  lock_until: string;
  cooldown_ok: boolean;
  last_applied_at: string | null;
  pending_proposal: {
    id: string;
    old_slots: GroupScheduleSlot[];
    proposed_slots: GroupScheduleSlot[];
    reason: string;
    old_compatibility: number;
    proposed_compatibility: number;
    eligible_students: number;
    approval_threshold: number;
    effective_from: string;
    created_at: string;
    responses: { approvals: number; rejections: number };
  } | null;
  history: HistoryRow[];
}

export interface HistoryRow {
  id: string;
  old_schedule: string;
  new_schedule: string;
  reason: string;
  old_compatibility: number;
  new_compatibility: number;
  approval_rate: number;
  approvals: number;
  rejections: number;
  eligible: number;
  sessions_updated: number;
  created_at: string;
  effective_from: string;
}

/** مفتاح موعد موحّد مطابق لـ _slot_key في قاعدة البيانات */
export const slotKey = (day: string, startTime: string): string =>
  `${String(day || '').trim().toLowerCase()}|${String(startTime || '').trim()}`;

export const keyOfSlot = (s: { day: string; startTime: string }): string => slotKey(s.day, s.startTime);

/** شكل خفيف لموعد (من أو إلى قاعدة البيانات) */
export interface GroupScheduleSlotLike { id?: string; day: string; dayArabic?: string; startTime: string; endTime?: string }

export const slotLabel = (s: { dayArabic?: string; day?: string; startTime?: string; endTime?: string }): string =>
  `${s.dayArabic || s.day || ''} ${s.startTime ? formatTimeArabic(s.startTime) : ''}${s.endTime ? ` - ${formatTimeArabic(s.endTime)}` : ''}`.trim();

const rpc = async (fn: string, params: Record<string, unknown>) => {
  if (!supabase) throw new Error('قاعدة البيانات غير متاحة');
  const { data, error } = await supabase.rpc(fn, params);
  if (error) throw error;
  return data;
};

/** ذكاء المواعيد الكامل للمدرس المالك */
export const getIntelligence = (groupId: string): Promise<ScheduleIntel> =>
  rpc('get_group_schedule_intelligence', { p_group_id: groupId });

/** حفظ مواعيد الطالب المتاحة/غير المتاحة لمجموعة (مفاتيح day|HH:MM) */
export const saveAvailability = (groupId: string, availableKeys: string[], unavailableKeys: string[], note?: string) =>
  rpc('save_student_availability', { p_group_id: groupId, p_available: availableKeys, p_unavailable: unavailableKeys, p_note: note || null });

/** تحديث قائمة المواعيد المرشحة للمجموعة (المدرس) */
export const setCandidates = (groupId: string, slots: GroupScheduleSlot[]) =>
  rpc('set_group_candidates', { p_group_id: groupId, p_slots: slots });

/** إنشاء اقتراح تغيير موعد (المدرس) — يطبق قواعد الاستقرار على الخادم */
export const createProposal = (groupId: string, proposedSlots: GroupScheduleSlot[], reason: string) =>
  rpc('create_schedule_proposal', { p_group_id: groupId, p_proposed_slots: proposedSlots, p_reason: reason });

/** رد الطالب: approve | reject */
export const respondProposal = (proposalId: string, response: 'approve' | 'reject') =>
  rpc('respond_schedule_proposal', { p_proposal_id: proposalId, p_response: response });

/** قرار المدرس: approve (تطبيق على الحصص القادمة فقط) | reject */
export const decideProposal = (proposalId: string, decision: 'approve' | 'reject') =>
  rpc('decide_schedule_proposal', { p_proposal_id: proposalId, p_decision: decision });

/** صفوف توفر الطالب (عبر كل المجموعات) — للتوافق في الحجز */
export const fetchMyAvailability = async (studentId: string): Promise<{ group_id: string; available_keys: string[] }[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('student_group_availability')
    .select('group_id, available_keys')
    .eq('student_id', studentId);
  if (error) return [];
  return (data || []) as { group_id: string; available_keys: string[] }[];
};

/** الاقتراحات المعلقة لمجموعات معينة (يقرأها أعضاء المجموعة) */
export const fetchPendingProposals = async (groupIds: string[]) => {
  if (!supabase || groupIds.length === 0) return [];
  const { data, error } = await supabase
    .from('group_schedule_proposals')
    .select('id, group_id, old_slots, proposed_slots, reason, old_compatibility, proposed_compatibility, eligible_students, approval_threshold, effective_from, created_at')
    .in('group_id', groupIds)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []) as {
    id: string; group_id: string; old_slots: GroupScheduleSlot[]; proposed_slots: GroupScheduleSlot[];
    reason: string; old_compatibility: number; proposed_compatibility: number;
    eligible_students: number; approval_threshold: number; effective_from: string; created_at: string;
  }[];
};

/** رود الطالب على اقتراحات محددة */
export const fetchMyResponses = async (studentId: string, proposalIds: string[]) => {
  if (!supabase || proposalIds.length === 0) return [] as { proposal_id: string; response: string }[];
  const { data, error } = await supabase
    .from('group_schedule_responses')
    .select('proposal_id, response')
    .eq('student_id', studentId)
    .in('proposal_id', proposalIds);
  if (error) return [];
  return (data || []) as { proposal_id: string; response: string }[];
};

/** آخر سجل تغييرات لمجموعات معينة (لعرضه للطالب) */
export const fetchLastHistory = async (groupIds: string[]) => {
  if (!supabase || groupIds.length === 0) return [];
  const { data, error } = await supabase
    .from('group_schedule_history')
    .select('id, group_id, new_schedule, reason, created_at')
    .in('group_id', groupIds)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return [];
  return (data || []) as { id: string; group_id: string; new_schedule: string; reason: string; created_at: string }[];
};

/** نسبة توافق مواعيد الطالب مع مواعيد مجموعة (للحجز — مطلب 10) */
export const computeFitPercent = (myAvailableKeys: string[], groupSlots: GroupScheduleSlot[]): number => {
  if (!groupSlots || groupSlots.length === 0) return -1; // لا مواعيد محددة
  if (!myAvailableKeys || myAvailableKeys.length === 0) return -1; // الطالب لم يحدد مواعيده
  const mySet = new Set(myAvailableKeys);
  const hits = groupSlots.filter(s => mySet.has(keyOfSlot(s))).length;
  return Math.round((hits / groupSlots.length) * 100);
};

/** وصف عربي لنسبة التوافق */
export const fitLabel = (fit: number): { text: string; tone: 'good' | 'mid' | 'bad' | 'unknown' } => {
  if (fit < 0) return { text: 'حدد مواعيدك', tone: 'unknown' };
  if (fit >= 80) return { text: `تناسبك ${fit}%`, tone: 'good' };
  if (fit >= 50) return { text: `تناسبك ${fit}%`, tone: 'mid' };
  return { text: `تناسبك ${fit}% فقط`, tone: 'bad' };
};

/* ============================================================
   لوحة تحكم المجموعة — فحص التعارض + تطبيق التغيير + النقل
   ============================================================ */

/** نتيجة فحص تعارض ميعاد جديد لطلاب المجموعة */
export interface SlotConflictResult {
  ok: boolean;
  code?: string;
  message?: string;
  total?: number;
  conflict_count?: number;
  free_count?: number;
  conflicts?: { student_id: string; student_name: string; with_group: string; with_day: string; with_start: string; with_end: string }[];
}

/** فحص: هل الميعاد الجديد مناسب لكل الطلاب؟ (p_excludeIndex = فهرس السلويت اللي بنغيره) */
export const analyzeSlotConflict = (groupId: string, day: string, startTime: string, endTime: string, excludeIndex?: number): Promise<SlotConflictResult> =>
  rpc('analyze_group_slot_conflict', { p_group_id: groupId, p_day: day, p_start_time: startTime, p_end_time: endTime, p_exclude_index: excludeIndex ?? null });

/** نتيجة تطبيق تغيير الميعاد */
export interface ApplySlotResult extends SlotConflictResult {
  applied?: boolean;
  sessions_updated?: number;
  effective_from?: string;
  new_schedule?: string;
  hours_left?: number;
}

/** تطبيق تغيير ميعاد حصة أسبوعية — الحصص القادمة فقط
 *  p_force: فرض التغيير رغم تعارض بعض الطلاب وفترة التهدئة (قرار المدرس) */
export const applySlotChange = (groupId: string, slotIndex: number, day: string, startTime: string, endTime: string, reason?: string, force = false): Promise<ApplySlotResult> =>
  rpc('apply_group_slot_change', { p_group_id: groupId, p_slot_index: slotIndex, p_new_day: day, p_new_start: startTime, p_new_end: endTime, p_reason: reason || null, p_force: force });

/** هدف نقل محتمل (مجموعة أخرى للمدرس) */
export interface TransferTarget {
  id: string;
  name: string;
  grade?: string;
  grade_match: boolean;
  schedule: string;
  slots: GroupScheduleSlot[];
  current_count: number;
  max_students: number;
  capacity_ok: boolean;
  /** الطالب عنده درس في ميعاد هذه المجموعة؟ */
  conflict: boolean;
}

/** مجموعات المدرس الأخرى كأهداف نقل مع فحص تعارض ميعاد الطالب لكل واحدة */
export const fetchTransferTargets = (studentId: string, fromGroupId: string): Promise<TransferTarget[]> =>
  rpc('list_group_transfer_targets', { p_student_id: studentId, p_from_group: fromGroupId });

/** نقل مباشر لطالب بين مجموعات المدرس — بفحص إلزامي لتعارض الميعاد */
export const transferStudentDirect = (studentId: string, fromGroupId: string, toGroupId: string, reason?: string) =>
  rpc('transfer_student_direct', { p_student_id: studentId, p_from_group: fromGroupId, p_to_group: toGroupId, p_reason: reason || null });

/** ألوان شارة التوافق */
export const fitToneClass = (tone: 'good' | 'mid' | 'bad' | 'unknown'): string => {
  switch (tone) {
    case 'good': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'mid': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'bad': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};
