/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/**
 * GroupDashboardPage — لوحة تحكم كاملة لمجموعة واحدة (يفتحها المدرس بأول ضغطة على المجموعة)
 * تبويبات: نظرة عامة · الطلاب · الحصص والمواعيد (تغيير ميعاد بفحص توافق + نقل المتعارضين) · الامتحانات · سجل المواعيد
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowRight, Users, CalendarClock, GraduationCap, History, LayoutDashboard, Clock,
  MapPin, DollarSign, Plus, Phone, UserX, ArrowLeftRight, CalendarDays, TrendingUp,
  ListChecks, Loader2, RefreshCw, UserCog, FileSpreadsheet, FileText,
} from 'lucide-react';
import { PageHeader, StatCard, Tabs, Card, Btn, DataTable, StatusBadge, LoadingBlock, ErrorBlock, EmptyState, ConfirmDialog, useToast, fmtMoney, fmtDate, fmtDateTime, Column } from '../../components/common/ui';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { formatTimeArabic } from '../../lib/scheduleSync';
import type { StudentGroup, GroupScheduleSlot } from '../../types';
import { ChangeSlotModal, TransferStudentModal, AddSessionModal, AddExamModal, SlotRow } from '../../components/teacher/GroupScheduleControls';
import { StudentOptionsModal, StudentOptionsData } from '../../components/teacher/StudentOptionsModal';
import { exportToExcel, exportToPdf } from '../../utils/exportData';

const DAY_ORDER = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const dayAr = (d: string) => ({ Saturday: 'السبت', Sunday: 'الأحد', Monday: 'الإثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة' } as Record<string, string>)[d] || d;

interface EnrollmentRow {
  id: string; student_id: string; student_name: string; student_phone?: string;
  parent_phone?: string; grade?: string; qr_code?: string; avatar_url?: string;
  attendance_rate?: number; total_sessions?: number; attended_sessions?: number;
  payment_status?: string; enrolled_at?: string;
  attendance_mode?: 'fixed' | 'flexible'; custom_schedule_slots?: any[];
  fee_exempt?: boolean; fee_exempt_reason?: string; fee_exempt_until?: string;
}
interface SessionRow { id: string; title: string; session_date: string; starts_at: string; ends_at: string; location?: string; status: string; }
interface ExamRow { id: string; title: string; exam_date: string; starts_at?: string; duration_minutes?: number; total_marks?: number; location?: string; status: string; }
interface HistoryRow { id: string; old_schedule?: string; new_schedule?: string; reason?: string; sessions_updated?: number; created_at: string; }
interface AttendanceRow { id: string; student_name: string; status: string; date: string; time?: string; }

type TabKey = 'overview' | 'students' | 'schedule' | 'exams' | 'history';

export const GroupDashboardPage: React.FC<{ groupId: string; onNavigate?: (path: string) => void }> = ({ groupId, onNavigate }) => {
  const { user } = useAuth();
  const toast = useToast();
  const teacherName = user?.name || 'المدرس';
  const teacherId = user?.uid || '';

  const [group, setGroup] = useState<StudentGroup | null>(null);
  const [students, setStudents] = useState<EnrollmentRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRow[]>([]);
  const [monthRate, setMonthRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabKey>('overview');

  // المودالات
  const [changeSlot, setChangeSlot] = useState<{ slot: SlotRow; index: number } | null>(null);
  const [transferStudent, setTransferStudent] = useState<EnrollmentRow | null>(null);
  const [removeStudent, setRemoveStudent] = useState<EnrollmentRow | null>(null);
  const [removing, setRemoving] = useState(false);
  const [addSession, setAddSession] = useState(false);
  const [addExam, setAddExam] = useState(false);
  const [cancelSession, setCancelSession] = useState<SessionRow | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [studentOptions, setStudentOptions] = useState<StudentOptionsData | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !groupId) { setError('قاعدة البيانات غير متاحة.'); setLoading(false); return; }
    try {
      setError('');
      const gq = supabase.from('student_groups').select('*').eq('id', groupId).maybeSingle();
      const [gres] = await Promise.all([gq]);
      if (gres.error) throw gres.error;
      const g: any = gres.data;
      if (!g) { setError('المجموعة غير موجودة أو تم حذفها.'); setLoading(false); return; }
      setGroup({
        id: g.id, name: g.name, subject: g.subject || undefined, grade: g.grade || undefined, level: g.grade || undefined,
        schedule: g.schedule || '', scheduleSlots: Array.isArray(g.schedule_slots) ? g.schedule_slots : [],
        location: g.location || g.center_name || '', currentStudents: Number(g.current_count || 0),
        maxCapacity: Number(g.max_students || 35), billingType: g.billing_type || 'per_session',
        priceAmount: Number(g.price_amount ?? g.monthly_fee ?? 0), commissionRate: Number(g.commission_rate ?? 2),
      } as StudentGroup);

      const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
      const [sres, sessres, exres, hres, ares, mres] = await Promise.all([
        supabase.from('group_enrollments').select('*').eq('group_id', groupId).eq('status', 'active').order('enrolled_at', { ascending: false }),
        supabase.from('lesson_sessions').select('id,title,session_date,starts_at,ends_at,location,status').eq('group_id', groupId).order('starts_at', { ascending: false }).limit(40),
        supabase.from('exams').select('id,title,exam_date,starts_at,duration_minutes,total_marks,location,status').eq('group_id', groupId).order('exam_date', { ascending: false }).limit(20),
        supabase.from('group_schedule_history').select('id,old_schedule,new_schedule,reason,sessions_updated,created_at').eq('group_id', groupId).order('created_at', { ascending: false }).limit(15),
        supabase.from('attendance_records').select('id,student_name,status,date,time').eq('group_id', groupId).order('date', { ascending: false }).limit(8),
        supabase.from('attendance_records').select('status').eq('group_id', groupId).gte('date', monthAgo).limit(500),
      ]);
      setStudents((sres.data || []) as EnrollmentRow[]);
      setSessions((sessres.data || []) as SessionRow[]);
      setExams((exres.data || []) as ExamRow[]);
      setHistory((hres.data || []) as HistoryRow[]);
      setRecentAttendance((ares.data || []) as AttendanceRow[]);
      const m: any[] = (mres.data || []) as any[];
      setMonthRate(m.length ? Math.round(m.filter(r => r.status === 'present' || r.status === 'late').length / m.length * 100) : null);
    } catch (e: any) {
      setError(e?.message || 'تعذر تحميل بيانات المجموعة.');
    } finally { setLoading(false); }
  }, [groupId]);

  useEffect(() => { void load(); }, [load]);

  const upcoming = useMemo(() => {
    const nowIso = new Date().toISOString();
    return sessions.filter(s => s.status === 'scheduled' && s.starts_at >= nowIso).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }, [sessions]);
  const past = useMemo(() => {
    const nowIso = new Date().toISOString();
    return sessions.filter(s => s.status !== 'scheduled' || s.starts_at < nowIso).sort((a, b) => b.starts_at.localeCompare(a.starts_at)).slice(0, 8);
  }, [sessions]);

  /* إزالة طالب (تحويل الحالة إلى left + تحديث العدد) */
  const doRemoveStudent = async () => {
    if (!removeStudent || !supabase) return;
    setRemoving(true);
    try {
      const { error: err } = await supabase.from('group_enrollments').update({ status: 'left' }).eq('id', removeStudent.id);
      if (err) throw err;
      const { count } = await supabase.from('group_enrollments').select('*', { count: 'exact', head: true }).eq('group_id', groupId).eq('status', 'active');
      if (count !== null) await supabase.from('student_groups').update({ current_count: count, updated_at: new Date().toISOString() }).eq('id', groupId);
      toast.push('success', `تم إزالة ${removeStudent.student_name} من المجموعة.`);
      setRemoveStudent(null);
      void load();
      window.dispatchEvent(new Event('hassty_teacher_groups_updated'));
    } catch (e: any) { toast.push('error', e?.message || 'تعذرت الإزالة.'); }
    finally { setRemoving(false); }
  };

  /* إلغاء حصة قادمة */
  const doCancelSession = async () => {
    if (!cancelSession || !supabase) return;
    setCancelling(true);
    try {
      const { error: err } = await supabase.from('lesson_sessions').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', cancelSession.id);
      if (err) throw err;
      toast.push('success', 'تم إلغاء الحصة.');
      setCancelSession(null);
      void load();
    } catch (e: any) { toast.push('error', e?.message || 'تعذر الإلغاء.'); }
    finally { setCancelling(false); }
  };

  if (loading) return <LoadingBlock label="جاري فتح لوحة المجموعة..." rows={4} />;
  if (error && !group) return <ErrorBlock message={error} onRetry={() => { setLoading(true); void load(); }} />;
  if (!group) return null;

  const slots: GroupScheduleSlot[] = group.scheduleSlots || [];
  const nextSession = upcoming[0];

  const studentColumns: Column<EnrollmentRow>[] = [
    { key: 'student_name', header: 'الطالب', render: r => (
      <span className="font-black text-slate-800 flex items-center gap-1.5 flex-wrap">
        {r.student_name}
        {r.attendance_mode === 'flexible' && <Badge variant="info" size="sm">مرن</Badge>}
        {r.fee_exempt && <Badge variant="warning" size="sm">معفو</Badge>}
        {(r.custom_schedule_slots?.length || 0) > 0 && <Badge variant="neutral" size="sm">جدول خاص</Badge>}
      </span>
    ) },
    { key: 'grade', header: 'المرحلة', hideOnMobile: true, render: r => r.grade || '—' },
    { key: 'student_phone', header: 'هاتف الطالب', hideOnMobile: true, render: r => r.student_phone ? <span className="flex items-center gap-1 text-[11px]" dir="ltr"><Phone className="w-3 h-3 text-slate-400" />{r.student_phone}</span> : '—' },
    { key: 'parent_phone', header: 'ولي الأمر', hideOnMobile: true, render: r => r.parent_phone ? <span className="flex items-center gap-1 text-[11px]" dir="ltr"><Phone className="w-3 h-3 text-emerald-500" />{r.parent_phone}</span> : '—' },
    { key: 'attendance_rate', header: 'الحضور', sortValue: r => Number(r.attendance_rate || 0), render: r => {
      const rate = Math.round(Number(r.attendance_rate ?? 0));
      return <span className={`font-black ${rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{rate}%</span>;
    } },
    { key: 'payment_status', header: 'الدفع', render: r => <StatusBadge status={r.fee_exempt ? 'exempt' : r.payment_status === 'paid' ? 'paid' : 'overdue'} size="sm" label={r.fee_exempt ? 'معفو' : undefined} /> },
    { key: 'actions', header: 'إجراءات', render: r => (
      <div className="flex items-center gap-1.5">
        <button onClick={() => setStudentOptions({
          enrollmentId: r.id,
          studentId: r.student_id,
          studentName: r.student_name,
          grade: r.grade,
          groupId,
          groupName: group.name,
          groupSlots: slots,
          attendanceMode: r.attendance_mode || 'fixed',
          customScheduleSlots: r.custom_schedule_slots || [],
          feeExempt: r.fee_exempt === true,
          feeExemptReason: r.fee_exempt_reason,
          feeExemptUntil: r.fee_exempt_until,
        })} className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors" title="خيارات الطالب: حضور مرن — جدول خاص — إعفاء — مجموعات شقيقة">
          <UserCog className="w-3 h-3" /> خيارات
        </button>
        <button onClick={() => setTransferStudent(r)} className="px-2.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors" title="نقل لمجموعة أخرى (بفحص المواعيد)">
          <ArrowLeftRight className="w-3 h-3" /> نقل
        </button>
        <button onClick={() => setRemoveStudent(r)} className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors">
          <UserX className="w-3 h-3" /> إزالة
        </button>
      </div>
    ) },
  ];

  /* تصدير طلاب المجموعة */
  const exportColumns = [
    { key: 'student_name', label: 'اسم الطالب', width: 22 },
    { key: 'grade', label: 'المرحلة', width: 18 },
    { key: 'student_phone', label: 'هاتف الطالب', width: 14 },
    { key: 'parent_phone', label: 'هاتف ولي الأمر', width: 14 },
    { key: 'attendanceLabel', label: 'نسبة الحضور', width: 11 },
    { key: 'sessionsLabel', label: 'حضر/إجمالي الحصص', width: 14 },
    { key: 'paymentLabel', label: 'حالة الدفع', width: 12 },
    { key: 'joined', label: 'تاريخ الالتحاق', width: 12 },
  ];
  const exportRows = students.map(r => ({
    ...r,
    attendanceLabel: `${Math.round(Number(r.attendance_rate || 0))}%`,
    sessionsLabel: `${r.attended_sessions || 0} / ${r.total_sessions || 0}`,
    paymentLabel: r.fee_exempt ? 'معفو من المصاريف' : r.payment_status === 'paid' ? 'سدد' : 'غير مسدد',
    joined: r.enrolled_at ? String(r.enrolled_at).slice(0, 10) : '—',
  }));
  const doExport = async (kind: 'excel' | 'pdf') => {
    try {
      if (kind === 'excel') {
        await exportToExcel({ filename: `طلاب-${group.name}-${new Date().toISOString().slice(0, 10)}`, sheetName: 'الطلاب', columns: exportColumns, rows: exportRows });
      } else {
        await exportToPdf({
          filename: `طلاب-${group.name}-${new Date().toISOString().slice(0, 10)}`,
          title: `طلاب مجموعة «${group.name}»`,
          subtitle: `${group.subject || ''} · ${group.grade || ''} · ${group.schedule}`,
          columns: exportColumns, rows: exportRows,
          footer: `إجمالي الطلاب: ${students.length} — معفيون: ${students.filter(s => s.fee_exempt).length}`,
        });
      }
      toast.push('success', 'تم التصدير بنجاح ✅');
    } catch (e: any) { toast.push('error', `تعذر التصدير: ${String(e?.message || e).slice(0, 80)}`); }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <PageHeader
        title={group.name}
        description={[group.subject, group.grade, group.location].filter(Boolean).join(' · ')}
        badge="لوحة المجموعة"
        actions={<>
          {onNavigate && <Btn variant="secondary" size="sm" onClick={() => onNavigate('/teacher/groups')}><ArrowRight className="w-3.5 h-3.5" /> كل المجموعات</Btn>}
          <Btn variant="ghost" size="sm" onClick={() => { setLoading(true); void load(); }} title="تحديث"><RefreshCw className="w-3.5 h-3.5" /></Btn>
        </>}
      />

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="الطلاب المسجلون" value={group.currentStudents} hint={`من ${group.maxCapacity} مقعد`} tone="blue" icon={<Users className="w-3.5 h-3.5" />} />
        <StatCard label="نسبة الحضور (30 يوم)" value={monthRate === null ? '—' : `${monthRate}%`} hint="حاضر + متأخر" tone="emerald" icon={<TrendingUp className="w-3.5 h-3.5" />} />
        <StatCard label="الحصة القادمة" value={nextSession ? fmtDate(nextSession.session_date) : 'لا يوجد'} hint={nextSession ? `${fmtDateTime(nextSession.starts_at)}` : 'أضف حصة من تبويب الحصص'} tone="violet" icon={<CalendarClock className="w-3.5 h-3.5" />} />
        <StatCard label="الامتحانات" value={exams.length} hint={exams[0]?.title || 'لا امتحانات بعد'} tone="amber" icon={<GraduationCap className="w-3.5 h-3.5" />} />
      </div>

      <Tabs
        active={tab}
        onChange={k => setTab(k as TabKey)}
        tabs={[
          { key: 'overview', label: 'نظرة عامة' },
          { key: 'students', label: 'الطلاب', count: students.length },
          { key: 'schedule', label: 'الحصص والمواعيد' },
          { key: 'exams', label: 'الامتحانات', count: exams.length },
          { key: 'history', label: 'سجل المواعيد', count: history.length },
        ]}
      />

      {/* ============ نظرة عامة ============ */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="بيانات المجموعة">
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1.5">
                  {slots.length > 0 ? slots.map((s, i) => (
                    <span key={s.id || i} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-bold">
                      {s.dayArabic || dayAr(s.day)}: {formatTimeArabic(s.startTime)} - {formatTimeArabic(s.endTime)}
                    </span>
                  )) : <span className="text-slate-500 font-bold">{group.schedule || 'لا مواعيد محددة'}</span>}
                </div>
              </div>
              {group.location && <div className="flex items-center gap-2 text-slate-600"><MapPin className="w-4 h-4 text-slate-400" />{group.location}</div>}
              <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  {group.billingType === 'per_session' ? `${group.priceAmount} ج.م / بالحصة` : `${group.priceAmount} ج.م / بالشهر`}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-black">{fmtMoney(group.priceAmount * group.currentStudents)} إجمالي شهري</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">نسبة إشغال المقاعد</span>
                <span className="text-xs font-black text-slate-800">{group.currentStudents}/{group.maxCapacity}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-l from-blue-500 to-violet-500 rounded-full" style={{ width: `${Math.min(100, Math.round(group.currentStudents / Math.max(1, group.maxCapacity) * 100))}%` }} />
              </div>
            </div>
          </Card>

          <Card title="الحصص القادمة" actions={<Btn size="sm" variant="ghost" onClick={() => setTab('schedule')}>إدارة الحصص</Btn>}>
            {upcoming.length === 0 ? (
              <EmptyState title="لا حصص قادمة" description="أضف حصة جديدة من تبويب الحصص والمواعيد." icon={<CalendarClock className="w-6 h-6" />} />
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 4).map(s => (
                  <div key={s.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-800 truncate">{s.title}</div>
                      <div className="text-[11px] font-bold text-slate-500">{fmtDate(s.session_date)} — {fmtDateTime(s.starts_at).split('، ').pop()}</div>
                    </div>
                    <StatusBadge status="scheduled" size="sm" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="آخر سجلات الحضور" className="lg:col-span-2">
            {recentAttendance.length === 0 ? (
              <EmptyState title="لا سجلات حضور بعد" description="سجّل الحضور بمسح كود الطالب من صفحة المسح." icon={<ListChecks className="w-6 h-6" />} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recentAttendance.map(a => (
                  <div key={a.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2 text-xs">
                    <span className="font-black text-slate-800 truncate">{a.student_name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold text-slate-400">{a.date}</span>
                      <StatusBadge status={a.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ============ الطلاب ============ */}
      {tab === 'students' && (
        <div className="space-y-3">
          <div className="flex items-center justify-end gap-2">
            <Btn variant="secondary" size="sm" onClick={() => void doExport('excel')}><FileSpreadsheet className="w-3.5 h-3.5" /> تصدير Excel</Btn>
            <Btn variant="secondary" size="sm" onClick={() => void doExport('pdf')}><FileText className="w-3.5 h-3.5" /> تصدير PDF</Btn>
          </div>
          <DataTable
            rows={students}
            columns={studentColumns}
            searchKeys={r => `${r.student_name} ${r.student_phone || ''} ${r.parent_phone || ''}`}
            searchPlaceholder="ابحث باسم الطالب أو الهاتف..."
            emptyText="لا طلاب مسجلين بعد — أضفهم من صفحة الطلاب أو بالمسح"
            mobileCard={r => (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between"><span className="text-xs font-black text-slate-800">{r.student_name}</span><StatusBadge status={r.fee_exempt ? 'exempt' : r.payment_status === 'paid' ? 'paid' : 'overdue'} size="sm" label={r.fee_exempt ? 'معفو' : undefined} /></div>
                <div className="flex items-center justify-between text-[11px]"><span className="text-slate-400 font-bold">الحضور</span><span className="font-black">{Math.round(Number(r.attendance_rate || 0))}%</span></div>
                <div className="flex gap-1.5 pt-1">
                  <button onClick={() => setStudentOptions({ enrollmentId: r.id, studentId: r.student_id, studentName: r.student_name, grade: r.grade, groupId, groupName: group.name, groupSlots: slots, attendanceMode: r.attendance_mode || 'fixed', customScheduleSlots: r.custom_schedule_slots || [], feeExempt: r.fee_exempt === true, feeExemptReason: r.fee_exempt_reason, feeExemptUntil: r.fee_exempt_until })} className="flex-1 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black cursor-pointer">خيارات</button>
                  <button onClick={() => setTransferStudent(r)} className="flex-1 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-black cursor-pointer">نقل</button>
                  <button onClick={() => setRemoveStudent(r)} className="flex-1 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[10px] font-black cursor-pointer">إزالة</button>
                </div>
              </div>
            )}
          />
        </div>
      )}

      {/* ============ الحصص والمواعيد ============ */}
      {tab === 'schedule' && (
        <div className="space-y-4">
          <Card title="المواعيد الأسبوعية — تغيير الميعاد بفحص توافق الطلاب">
            {slots.length === 0 ? (
              <EmptyState title="لا مواعيد أسبوعية محفوظة" description="أضف مواعيد المجموعة من تعديل بيانات المجموعة." icon={<Clock className="w-6 h-6" />} />
            ) : (
              <div className="space-y-2.5">
                {slots.map((s, i) => (
                  <div key={s.id || i} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-md shrink-0"><CalendarDays className="w-4.5 h-4.5" /></span>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-800">{s.dayArabic || dayAr(s.day)}</div>
                        <div className="text-[11px] font-bold text-slate-500">{formatTimeArabic(s.startTime)} إلى {formatTimeArabic(s.endTime)}</div>
                      </div>
                    </div>
                    <Btn size="sm" variant="primary" onClick={() => setChangeSlot({ slot: s as SlotRow, index: i })}>
                      <Clock className="w-3.5 h-3.5" /> تغيير الميعاد
                    </Btn>
                  </div>
                ))}
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-900 flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 shrink-0 mt-0.5" />
                  عند تغيير الميعاد: النظام يفحص كل طالب — هل عنده درس في الميعاد الجديد عند مدرس تاني؟ يعرض لك كام طالب عليه وكام فاضي، ولو 1-2 بس عليهم ينقلهم لمجموعة تانية مع فحص ميعادها كمان. الحصص المنتهية لا تتغير أبدًا.
                </div>
              </div>
            )}
          </Card>

          <Card title="الحصص القادمة" actions={<Btn size="sm" variant="primary" onClick={() => setAddSession(true)}><Plus className="w-3.5 h-3.5" /> إضافة حصة</Btn>}>
            {upcoming.length === 0 ? (
              <EmptyState title="لا حصص قادمة" description="أضف حصة جديدة وستظهر في تقويم الطلاب تلقائيًا." icon={<CalendarClock className="w-6 h-6" />} />
            ) : (
              <div className="space-y-2">
                {upcoming.map(s => (
                  <div key={s.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-800 truncate">{s.title}</div>
                      <div className="text-[11px] font-bold text-slate-500">{fmtDate(s.session_date)} — {fmtDateTime(s.starts_at)}{s.location ? ` — ${s.location}` : ''}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={s.status} size="sm" />
                      <button onClick={() => setCancelSession(s)} className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[10px] font-black cursor-pointer transition-colors">إلغاء</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {past.length > 0 && (
            <Card title="حصص سابقة">
              <div className="space-y-2">
                {past.map(s => (
                  <div key={s.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-2 opacity-80">
                    <div className="min-w-0">
                      <span className="text-xs font-black text-slate-700">{s.title}</span>
                      <span className="text-[11px] font-bold text-slate-400 ms-2">{fmtDate(s.session_date)}</span>
                    </div>
                    <StatusBadge status={s.status} size="sm" />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ============ الامتحانات ============ */}
      {tab === 'exams' && (
        <Card title="امتحانات المجموعة" actions={<Btn size="sm" variant="primary" onClick={() => setAddExam(true)}><Plus className="w-3.5 h-3.5" /> إنشاء امتحان</Btn>}>
          {exams.length === 0 ? (
            <EmptyState title="لا امتحانات بعد" description="أنشئ أول امتحان للمجموعة — وستتمكن من إدارة الأسئلة والتصحيح والنتائج من صفحة الامتحان." icon={<GraduationCap className="w-6 h-6" />} />
          ) : (
            <div className="space-y-2">
              {exams.map(ex => (
                <div key={ex.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-800">{ex.title}</div>
                    <div className="text-[11px] font-bold text-slate-500">
                      {fmtDate(ex.exam_date)}{ex.starts_at ? ` — ${fmtDateTime(ex.starts_at)}` : ''} — {ex.total_marks || 100} درجة{ex.location ? ` — ${ex.location}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={ex.status} size="sm" />
                    {onNavigate && <Btn size="sm" variant="secondary" onClick={() => onNavigate(`/teacher/exams/${ex.id}`)}>إدارة الامتحان</Btn>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ============ سجل المواعيد ============ */}
      {tab === 'history' && (
        <Card title="سجل تغييرات المواعيد — كل تغيير مسجل بالكامل">
          {history.length === 0 ? (
            <EmptyState title="لا تغييرات بعد" description="أي تغيير في مواعيد المجموعة سيظهر هنا بالتفصيل: من أي ميعاد إلى أي ميعاد وكم حصة اتحدثت." icon={<History className="w-6 h-6" />} />
          ) : (
            <div className="space-y-2.5">
              {history.map(h => (
                <div key={h.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-xs font-black text-slate-800">{h.new_schedule || '—'}</div>
                    <span className="text-[10px] font-bold text-slate-400">{fmtDateTime(h.created_at)}</span>
                  </div>
                  {h.old_schedule && h.old_schedule !== h.new_schedule && (
                    <div className="text-[11px] font-bold text-slate-500 mt-1">كان: {h.old_schedule}</div>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {h.sessions_updated !== null && h.sessions_updated !== undefined && (
                      <Badge variant="info" size="sm">{h.sessions_updated} حصة قادمة اتحدثت</Badge>
                    )}
                    {h.reason && <Badge variant="neutral" size="sm">{h.reason}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ===== المودالات ===== */}
      {changeSlot && (
        <ChangeSlotModal
          groupId={groupId} groupName={group.name}
          slot={changeSlot.slot} slotIndex={changeSlot.index}
          teacherName={teacherName}
          onClose={() => setChangeSlot(null)}
          onApplied={() => { void load(); window.dispatchEvent(new Event('hassty_teacher_groups_updated')); }}
        />
      )}
      {transferStudent && (
        <TransferStudentModal
          groupId={groupId} groupName={group.name}
          student={{ student_id: transferStudent.student_id, student_name: transferStudent.student_name }}
          teacherName={teacherName}
          onClose={() => setTransferStudent(null)}
          onDone={() => { void load(); window.dispatchEvent(new Event('hassty_teacher_groups_updated')); }}
        />
      )}
      {addSession && (
        <AddSessionModal
          groupId={groupId} tutorId={teacherId} subject={group.subject}
          enrolledStudents={students.map(s => ({ student_id: s.student_id }))}
          onClose={() => setAddSession(false)}
          onSaved={() => void load()}
        />
      )}
      {addExam && (
        <AddExamModal
          groupId={groupId} tutorId={teacherId} subject={group.subject}
          onClose={() => setAddExam(false)}
          onSaved={() => void load()}
        />
      )}
      <ConfirmDialog
        open={!!removeStudent}
        title={`إزالة ${removeStudent?.student_name || ''} من المجموعة؟`}
        message="هتتحول حالته إلى منسحب وسيتم تحديث عدد الطلاب. سجلات الحضور القديمة هتفضل محفوظة. لو عايز تنقله لمجموعة تانية استخدم زر «نقل» بدل كده."
        confirmLabel="إزالة من المجموعة" tone="danger" busy={removing}
        onConfirm={doRemoveStudent} onCancel={() => setRemoveStudent(null)}
      />
      <ConfirmDialog
        open={!!cancelSession}
        title="إلغاء الحصة؟"
        message={cancelSession ? `هيتم إلغاء «${cancelSession.title}» بتاريخ ${fmtDate(cancelSession.session_date)} — الطلاب هيشوفوا الحالة ملغاة في تقويمهم.` : ''}
        confirmLabel="إلغاء الحصة" tone="danger" busy={cancelling}
        onConfirm={doCancelSession} onCancel={() => setCancelSession(null)}
      />

      {/* خيارات الطالب: حضور مرن / جدول خاص / إعفاء / مجموعات شقيقة */}
      {studentOptions && (
        <StudentOptionsModal
          data={studentOptions}
          teacherId={teacherId}
          onClose={() => setStudentOptions(null)}
          onUpdated={() => void load()}
        />
      )}
    </div>
  );
};
