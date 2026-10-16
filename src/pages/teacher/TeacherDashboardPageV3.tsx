/**
 * Hassty — Teacher Dashboard refresh
 * Dashboard overview uses live Supabase data only. No mock metrics or demo rows.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowLeft, Award, BellRing, CalendarDays, CheckCircle2, Clock3,
  CreditCard, GraduationCap, Layers3, MessageCircle, RefreshCw, ScanLine,
  ShieldAlert, Sparkles, Users, UserRoundCheck, Wallet, XCircle, Send,
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { loadTeacherGroups, loadTeacherStudents } from '../../lib/teacherStore';
import type { StudentGroup, TeacherStudentItem } from '../../types';

interface Props { onNavigate: (path: string) => void; }

type Booking = {
  id: string;
  student_id: string | null;
  student_name: string | null;
  student_grade?: string | null;
  subject: string | null;
  day: string | null;
  time: string | null;
  location: string | null;
  price: number | string | null;
  created_at: string;
};

type AttendanceRow = {
  id: string;
  group_id: string;
  student_id: string;
  status: string;
  date: string;
  time: string | null;
  student_name: string | null;
};

type AttendanceCounts = { present: number; late: number; absent: number };

const EMPTY_ATTENDANCE: AttendanceCounts = { present: 0, late: 0, absent: 0 };
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short' }).format(date);
}

function attendanceLabel(status: string) {
  if (status === 'present') return 'حاضر';
  if (status === 'late') return 'متأخر';
  if (status === 'absent') return 'غائب';
  return 'غير محدد';
}

function attendanceTone(status: string) {
  if (status === 'present') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'late') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (status === 'absent') return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

export const TeacherDashboardPageV3: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const teacherId = user?.uid || '';
  const displayName = user?.name?.trim() || 'المعلم';

  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [students, setStudents] = useState<TeacherStudentItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingCount, setBookingCount] = useState(0);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [attendanceCounts, setAttendanceCounts] = useState<AttendanceCounts>(EMPTY_ATTENDANCE);
  const [attendanceError, setAttendanceError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !teacherId || !isUuid(teacherId)) {
      setLoadError('تعذر تحديد حساب المدرس لقراءة البيانات. سجّل الخروج ثم ادخل مرة أخرى، وإذا استمرت المشكلة تواصل مع الدعم.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    setLoadError('');
    try {
      const [liveGroups, liveStudents, bookingResult, verificationResult] = await Promise.all([
        loadTeacherGroups(teacherId),
        loadTeacherStudents(teacherId),
        supabase.from('booking_requests')
          .select('id,student_id,student_name,student_grade,subject,day,time,location,price,created_at', { count: 'exact' })
          .eq('tutor_id', teacherId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('tutor_profiles')
          .select('is_verified,verification_status')
          .eq('user_id', teacherId)
          .maybeSingle(),
      ]);

      if (bookingResult.error) throw bookingResult.error;
      if (verificationResult.error) throw verificationResult.error;

      setGroups(liveGroups);
      setStudents(liveStudents);
      setBookings((bookingResult.data || []) as Booking[]);
      setBookingCount(bookingResult.count ?? bookingResult.data?.length ?? 0);
      setVerificationPending(Boolean(verificationResult.data && verificationResult.data.is_verified !== true));

      // Attendance KPIs are counted across all records in the last 30 days,
      // while only the latest 8 rows are loaded for the activity feed.
      const since = new Date();
      since.setDate(since.getDate() - 29);
      const fromDate = localDateString(since);
      const groupIds = liveGroups.map((group) => group.id);

      const recentQuery = () => groupIds.length
        ? supabase.from('attendance_records')
            .select('id,group_id,student_id,status,date,time,student_name')
            .in('group_id', groupIds)
            .gte('date', fromDate)
            .order('date', { ascending: false })
            .order('time', { ascending: false })
            .limit(8)
        : supabase.from('attendance_records')
            .select('id,group_id,student_id,status,date,time,student_name')
            .eq('tutor_id', teacherId)
            .gte('date', fromDate)
            .order('date', { ascending: false })
            .order('time', { ascending: false })
            .limit(8);

      const countForStatus = async (status: 'present' | 'late' | 'absent') => {
        const result = groupIds.length
          ? await supabase.from('attendance_records').select('id', { count: 'exact', head: true })
              .in('group_id', groupIds).gte('date', fromDate).eq('status', status)
          : await supabase.from('attendance_records').select('id', { count: 'exact', head: true })
              .eq('tutor_id', teacherId).gte('date', fromDate).eq('status', status);
        if (result.error) throw result.error;
        return result.count ?? 0;
      };

      try {
        const [attendanceResult, present, late, absent] = await Promise.all([
          recentQuery(), countForStatus('present'), countForStatus('late'), countForStatus('absent'),
        ]);
        if (attendanceResult.error) throw attendanceResult.error;
        setAttendance((attendanceResult.data || []) as AttendanceRow[]);
        setAttendanceCounts({ present, late, absent });
        setAttendanceError('');
      } catch (error: any) {
        setAttendance([]);
        setAttendanceCounts(EMPTY_ATTENDANCE);
        setAttendanceError(error?.message || 'تعذر تحميل سجلات الحضور. جرّب التحديث.');
      }
    } catch (error: any) {
      setLoadError(error?.message || 'حصلت مشكلة أثناء تحميل لوحة المدرس. جرّب التحديث.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teacherId]);

  useEffect(() => { void load(); }, [load]);

  const uniqueStudents = useMemo(
    () => new Map(students.filter((student) => student.status !== 'transferred').map((student) => [student.id, student])).size,
    [students],
  );
  const activeStudents = useMemo(
    () => new Set(students.filter((student) => student.status === 'active').map((student) => student.id)).size,
    [students],
  );
  const totalAttendance = attendanceCounts.present + attendanceCounts.late + attendanceCounts.absent;
  const attendanceRate = totalAttendance
    ? Math.round(((attendanceCounts.present + attendanceCounts.late) / totalAttendance) * 100)
    : null;
  const teacherSubject = user?.profileData?.subject?.trim();
  const todayLabel = useMemo(
    () => new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()),
    [],
  );

  return (
    <div className="space-y-5 sm:space-y-6 text-right" dir="rtl">
      {loadError && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-black">تعذر تحديث بيانات اللوحة</p>
              <p className="mt-1 text-sm leading-6">{loadError}</p>
            </div>
          </div>
          <button onClick={() => void load()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-black hover:bg-rose-100">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> إعادة المحاولة
          </button>
        </div>
      )}

      {verificationPending && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5" role="status">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-black text-amber-950">حساب المدرس لسه مش موثّق</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-amber-900/80">
                  التوثيق مجاني، ويساعد الطلاب وأولياء الأمور على التأكد من حسابك. تابع طلب التوثيق من الدعم الرسمي.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="https://chat.whatsapp.com/DDU2o4jiLASAcVeEb6BnNu" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-black text-white hover:bg-emerald-700">
                <MessageCircle className="h-4 w-4" /> دعم واتساب
              </a>
              <a href="https://t.me/+-gGdGyw60wA2MDRk" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-xs font-black text-amber-950 hover:bg-amber-100">
                <Send className="h-4 w-4" /> دعم تليجرام
              </a>
            </div>
          </div>
        </section>
      )}

      <section className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-l from-[#047857] via-[#059669] to-[#10B981] p-5 text-white shadow-[0_22px_50px_-24px_rgba(5,150,105,0.65)] sm:p-7 lg:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/95">
              <CheckCircle2 className="h-4 w-4" />
              مساحة عمل المدرس
            </div>
            <p className="mt-4 text-sm font-semibold text-emerald-50">{todayLabel}</p>
            <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
              أهلاً يا أستاذ
              <span dir="auto" className="mt-1 block break-words text-white">{displayName} 👋</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
              {teacherSubject ? `إدارة حصص ومجموعات مادة ${teacherSubject} من مكان واحد.` : 'تابع طلابك ومجموعاتك وحضورهم وطلبات الالتحاق من مكان واحد.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-white/85">
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> {loading ? 'جارٍ تحميل الطلاب' : `${uniqueStudents} طالب`}</span>
              <span className="inline-flex items-center gap-1.5"><Layers3 className="h-4 w-4" /> {loading ? 'جارٍ تحميل المجموعات' : `${groups.length} مجموعة`}</span>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:w-auto xl:min-w-[220px] xl:grid-cols-1">
            <button onClick={() => onNavigate('/teacher/scan')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-800 shadow-lg shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-white/30">
              <ScanLine className="h-5 w-5" /> مسح حضور QR
            </button>
            <button onClick={() => onNavigate('/teacher/groups')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20">
              <Layers3 className="h-5 w-5" /> إدارة المجموعات
            </button>
          </div>
        </div>
      </section>

      <section aria-label="ملخص حساب المدرس" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={<Users />} label="الطلاب" value={loading ? '—' : uniqueStudents.toLocaleString('ar-EG')} detail={loading ? 'جارٍ التحديث' : `${activeStudents.toLocaleString('ar-EG')} نشط`} onClick={() => onNavigate('/teacher/students')} />
        <StatCard icon={<Layers3 />} label="المجموعات" value={loading ? '—' : groups.length.toLocaleString('ar-EG')} detail="عرض وإدارة المجموعات" onClick={() => onNavigate('/teacher/groups')} />
        <StatCard icon={<CalendarDays />} label="طلبات الالتحاق" value={loading ? '—' : bookingCount.toLocaleString('ar-EG')} detail="تحتاج مراجعتك" onClick={() => onNavigate('/teacher/enrollment-requests')} accent={bookingCount > 0} />
        <StatCard icon={<Activity />} label="معدل الحضور" value={loading ? '—' : attendanceRate === null ? '—' : `${attendanceRate.toLocaleString('ar-EG')}٪`} detail="آخر 30 يومًا" onClick={() => onNavigate('/teacher/attendance')} />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 xl:col-span-3">
          <SectionHeading icon={<CalendarDays />} title="طلبات الالتحاق الجديدة" subtitle={bookingCount ? `عندك ${bookingCount.toLocaleString('ar-EG')} طلب قيد الانتظار` : 'آخر الطلبات الواردة من الطلاب'} actionLabel="مراجعة الطلبات" onAction={() => onNavigate('/teacher/enrollment-requests')} />
          {loading ? <LoadingRows /> : bookings.length === 0 ? (
            <EmptyState icon={<CheckCircle2 />} title="مفيش طلبات معلّقة حاليًا" description="لما طالب يطلب الانضمام لمجموعاتك، هتلاقي الطلب هنا." />
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex flex-col gap-3 py-4 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><GraduationCap className="h-5 w-5" /></span>
                    <div className="min-w-0">
                      <p className="break-words font-black text-slate-900">{booking.student_name || 'طالب جديد'}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{booking.subject || 'حصة'}{booking.student_grade ? ` • ${booking.student_grade}` : ''}</p>
                      <p className="mt-1 text-xs text-slate-600">{[booking.day, booking.time].filter(Boolean).join(' — ') || 'ميعاد غير محدد'}{booking.location ? ` • ${booking.location}` : ''}</p>
                    </div>
                  </div>
                  <button onClick={() => onNavigate('/teacher/enrollment-requests')} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-black text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100">
                    مراجعة وإسناد الطالب <ArrowLeft className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-500">
            قبول الطلب من صفحة الالتحاق يتيح لك اختيار المجموعة والتحقق من المقاعد والمرحلة قبل تسجيل الطالب.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 xl:col-span-2">
          <SectionHeading icon={<Activity />} title="متابعة الحضور" subtitle="ملخص السجلات المسجلة خلال آخر 30 يومًا" actionLabel="تفاصيل الحضور" onAction={() => onNavigate('/teacher/attendance')} />
          {attendanceError && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">{attendanceError}</p>}
          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-500">نسبة الحضور</p>
              <p className="mt-1 text-4xl font-black tracking-tight text-slate-900">{loading ? '—' : attendanceRate === null ? '—' : `${attendanceRate}٪`}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Award className="h-7 w-7" /></div>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-l from-emerald-600 to-teal-400 transition-all duration-500" style={{ width: `${attendanceRate ?? 0}%` }} />
          </div>
          {totalAttendance === 0 && !loading ? (
            <p className="mt-3 text-xs leading-5 text-slate-500">لسه مفيش سجلات حضور كفاية لحساب نسبة دقيقة في الفترة دي.</p>
          ) : (
            <div className="mt-5 grid grid-cols-3 gap-2">
              <AttendanceMini label="حاضر" value={attendanceCounts.present} tone="emerald" />
              <AttendanceMini label="متأخر" value={attendanceCounts.late} tone="amber" />
              <AttendanceMini label="غائب" value={attendanceCounts.absent} tone="rose" />
            </div>
          )}
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-xs">
            <span className="font-bold text-slate-600">إجمالي السجلات في الفترة</span>
            <span className="font-black tabular-nums text-slate-900">{totalAttendance.toLocaleString('ar-EG')}</span>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <SectionHeading icon={<Layers3 />} title="مجموعاتك" subtitle="تابع العدد الحالي والسعة المتاحة" actionLabel="كل المجموعات" onAction={() => onNavigate('/teacher/groups')} />
          {loading ? <LoadingRows /> : groups.length === 0 ? (
            <EmptyState icon={<Layers3 />} title="لسه مفيش مجموعات" description="ابدأ بإنشاء مجموعة عشان تضيف طلاب وتحدد مواعيد الحصص." actionLabel="إنشاء مجموعة" onAction={() => onNavigate('/teacher/groups')} />
          ) : (
            <div className="mt-4 space-y-3">
              {groups.slice(0, 4).map((group) => {
                const capacity = Math.max(0, Number(group.maxCapacity || 0));
                const occupied = Math.max(0, Number(group.currentStudents ?? group.studentCount ?? 0));
                const ratio = capacity ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;
                return (
                  <button key={group.id} onClick={() => onNavigate(`/teacher/group/${encodeURIComponent(group.id)}`)} className="w-full rounded-2xl border border-slate-100 p-3.5 text-right transition hover:border-emerald-200 hover:bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-900">{group.name || 'مجموعة بدون اسم'}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{[group.subject, group.grade || group.level, group.schedule].filter(Boolean).join(' • ') || 'لم يتم تحديد التفاصيل بعد'}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${group.isPaused ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>{group.isPaused ? 'متوقفة' : 'نشطة'}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">{occupied.toLocaleString('ar-EG')} من {capacity || '—'} طالب</span>
                      <span className="font-black text-slate-700">{capacity ? `${ratio}٪` : 'السعة غير محددة'}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${ratio}%` }} />
                    </div>
                  </button>
                );
              })}
              {groups.length > 4 && <button onClick={() => onNavigate('/teacher/groups')} className="w-full rounded-xl py-2 text-sm font-black text-emerald-700 hover:bg-emerald-50">عرض باقي المجموعات ({(groups.length - 4).toLocaleString('ar-EG')})</button>}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <SectionHeading icon={<Clock3 />} title="أحدث عمليات الحضور" subtitle="آخر السجلات المحفوظة من قاعدة البيانات" actionLabel="كشف الحضور" onAction={() => onNavigate('/teacher/attendance')} />
          {attendanceError ? null : loading ? <LoadingRows /> : attendance.length === 0 ? (
            <EmptyState icon={<Clock3 />} title="لسه مفيش حضور مسجّل" description="بعد أول عملية مسح QR ناجحة، سجل الحضور هيظهر هنا." actionLabel="فتح ماسح QR" onAction={() => onNavigate('/teacher/scan')} />
          ) : (
            <div className="mt-3 divide-y divide-slate-100">
              {attendance.slice(0, 6).map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-3 py-3 first:pt-1">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600"><UserRoundCheck className="h-5 w-5" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{row.student_name || 'طالب'}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(row.date)}{row.time ? ` • ${row.time}` : ''}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black ${attendanceTone(row.status)}`}>{attendanceLabel(row.status)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="font-black text-slate-900">اختصارات شغلك اليوم</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">كل اختصار يفتح الوظيفة الفعلية المرتبطة بحسابك.</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <QuickAction icon={<ScanLine />} label="مسح QR" detail="تسجيل الحضور" onClick={() => onNavigate('/teacher/scan')} />
          <QuickAction icon={<Users />} label="الطلاب" detail="الكشوف والملفات" onClick={() => onNavigate('/teacher/students')} />
          <QuickAction icon={<Layers3 />} label="المجموعات" detail="المواعيد والسعة" onClick={() => onNavigate('/teacher/groups')} />
          <QuickAction icon={<CalendarDays />} label="الحصص" detail="إدارة الجلسات" onClick={() => onNavigate('/teacher/sessions')} />
          <QuickAction icon={<Wallet />} label="المدفوعات" detail="التحصيلات المالية" onClick={() => onNavigate('/teacher/payments')} />
          <QuickAction icon={<MessageCircle />} label="واتساب" detail="إشعارات أولياء الأمور" onClick={() => onNavigate('/teacher/whatsapp')} />
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className={`h-2 w-2 rounded-full ${loadError || attendanceError ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span>{loadError || attendanceError ? 'بعض البيانات محتاجة مراجعة' : 'البيانات من قاعدة المنصة مباشرة'}</span>
        </div>
        <button onClick={() => void load()} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-100 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'جاري التحديث…' : 'تحديث البيانات'}
        </button>
      </div>
    </div>
  );
};

function StatCard({ icon, label, value, detail, onClick, accent = false }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; detail: string; onClick: () => void; accent?: boolean;
}) {
  return (
    <button onClick={onClick} className={`group min-w-0 rounded-2xl border bg-white p-3.5 text-right shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400 sm:p-4 ${accent ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200 hover:border-emerald-200'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-bold text-slate-500 sm:text-sm">{label}</span>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}>{React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-4 w-4' })}</span>
      </div>
      <p className="mt-3 text-2xl font-black tabular-nums text-slate-900 sm:text-3xl">{value}</p>
      <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{detail}</p>
    </button>
  );
}

function SectionHeading({ icon, title, subtitle, actionLabel, onAction }: {
  icon: React.ReactNode; title: string; subtitle: string; actionLabel: string; onAction: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">{icon}</span>
        <div className="min-w-0">
          <h2 className="font-black text-slate-900">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
        </div>
      </div>
      <button onClick={onAction} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-black text-emerald-700 transition hover:bg-emerald-50 sm:text-xs">
        {actionLabel}<ArrowLeft className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AttendanceMini({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'amber' | 'rose' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
    rose: 'bg-rose-50 text-rose-700',
  };
  return (
    <div className={`rounded-2xl px-2.5 py-3 text-center ${tones[tone]}`}>
      <p className="text-xs font-bold">{label}</p>
      <p className="mt-1 text-xl font-black tabular-nums">{value.toLocaleString('ar-EG')}</p>
    </div>
  );
}

function QuickAction({ icon, label, detail, onClick }: { icon: React.ReactNode; label: string; detail: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex min-w-0 flex-col items-start rounded-2xl border border-slate-200 bg-white p-3 text-right transition hover:border-emerald-200 hover:bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-400">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-emerald-700">{icon}</span>
      <span className="mt-3 text-sm font-black text-slate-900">{label}</span>
      <span className="mt-1 text-[10px] leading-4 text-slate-500">{detail}</span>
    </button>
  );
}

function EmptyState({ icon, title, description, actionLabel, onAction }: {
  icon: React.ReactNode; title: string; description: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-7 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">{icon}</span>
      <h3 className="mt-3 text-sm font-black text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{description}</p>
      {actionLabel && onAction && <button onClick={onAction} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-700">{actionLabel}</button>}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="mt-4 space-y-3" aria-label="جاري تحميل البيانات">
      {[0, 1, 2].map((item) => <div key={item} className="h-[68px] animate-pulse rounded-2xl bg-slate-100" />)}
    </div>
  );
}
