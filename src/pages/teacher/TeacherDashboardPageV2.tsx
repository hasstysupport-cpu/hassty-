import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Award,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FileCheck2,
  Layers,
  MessageCircle,
  RefreshCw,
  ScanLine,
  Settings2,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { loadTeacherGroups, loadTeacherStudents } from '../../lib/teacherStore';
import { StudentGroup, TeacherStudentItem } from '../../types';

interface Props {
  onNavigate: (path: string) => void;
}

type PendingBooking = {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  day: string;
  time: string;
  location: string;
  price: number;
  status: string;
  createdAt: string;
};

type UpcomingExam = {
  id: string;
  title: string;
  exam_date: string;
  status: string;
  total_marks: number;
};

type AssistantSummary = {
  count: number;
  pendingInvites: number;
};

export const TeacherDashboardPageV2: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const teacherId = user?.uid || '';

  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [students, setStudents] = useState<TeacherStudentItem[]>([]);
  const [bookings, setBookings] = useState<PendingBooking[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [assistantSummary, setAssistantSummary] = useState<AssistantSummary>({ count: 0, pendingInvites: 0 });
  const [pendingTransfers, setPendingTransfers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');

  const load = useCallback(async () => {
    if (!teacherId || !supabase) {
      setLoading(false);
      return;
    }

    setRefreshing(true);
    try {
      const [liveGroups, liveStudents, bookingRes, attendanceRes, examRes, assistantsRes, invitesRes, transfersRes] = await Promise.all([
        loadTeacherGroups(teacherId),
        loadTeacherStudents(teacherId),
        supabase
          .from('booking_requests')
          .select('id,student_id,student_name,subject,day,time,location,price,status,created_at')
          .eq('tutor_id', teacherId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(12),
        supabase
          .from('attendance_records')
          .select('id,group_id,student_id,status,date,time,student_name,created_at')
          .eq('tutor_id', teacherId)
          .order('created_at', { ascending: false })
          .limit(80),
        supabase
          .from('exams')
          .select('id,title,exam_date,status,total_marks')
          .eq('teacher_id', teacherId)
          .in('status', ['scheduled', 'draft', 'published'])
          .gte('exam_date', new Date().toISOString().slice(0, 10))
          .order('exam_date', { ascending: true })
          .limit(5),
        supabase
          .from('teacher_assistants')
          .select('id,status')
          .eq('teacher_id', teacherId),
        supabase
          .from('assistant_invitations')
          .select('id,status')
          .eq('teacher_id', teacherId)
          .eq('status', 'pending'),
        supabase
          .from('group_transfer_requests')
          .select('id,status', { count: 'exact', head: true })
          .eq('teacher_id', teacherId)
          .eq('status', 'pending'),
      ]);

      if (bookingRes.error) throw bookingRes.error;
      if (attendanceRes.error) throw attendanceRes.error;

      setGroups(liveGroups || []);
      setStudents(liveStudents || []);
      setBookings(
        (bookingRes.data || []).map((r: any) => ({
          id: r.id,
          studentId: r.student_id,
          studentName: r.student_name || 'طالب',
          subject: r.subject || 'الحصة',
          day: r.day || '',
          time: r.time || '',
          location: r.location || '',
          price: Number(r.price || 0),
          status: r.status,
          createdAt: r.created_at,
        }))
      );
      setAttendance(attendanceRes.data || []);
      setUpcomingExams((examRes.data || []) as UpcomingExam[]);
      setAssistantSummary({
        count: (assistantsRes.data || []).filter((r: any) => r.status === 'active').length,
        pendingInvites: invitesRes.data?.length || 0,
      });
      setPendingTransfers(transfersRes.count || 0);
      setLastUpdated(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
    } catch (e: any) {
      setNotice(e?.message || 'تعذر تحميل بعض بيانات لوحة المدرس.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teacherId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!supabase || !teacherId) return;
    const channel = supabase
      .channel(`teacher-dashboard-${teacherId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_requests', filter: `tutor_id=eq.${teacherId}` }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records', filter: `tutor_id=eq.${teacherId}` }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teacher_assistants', filter: `teacher_id=eq.${teacherId}` }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assistant_invitations', filter: `teacher_id=eq.${teacherId}` }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams', filter: `teacher_id=eq.${teacherId}` }, () => void load())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [teacherId, load]);

  const approve = async (id: string, approved: boolean) => {
    if (!supabase || !teacherId) return;
    setBusyId(id);
    setNotice(null);
    try {
      const { error } = await supabase
        .from('booking_requests')
        .update({ status: approved ? 'approved' : 'rejected', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('tutor_id', teacherId);
      if (error) throw error;
      setBookings((prev) => prev.filter((b) => b.id !== id));
      setNotice(approved ? 'تمت الموافقة على طلب الحجز ✅' : 'تم رفض طلب الحجز ✅');
    } catch (e: any) {
      setNotice(e?.message || 'تعذر تحديث طلب الحجز.');
    } finally {
      setBusyId(null);
    }
  };

  const attendanceRate = useMemo(() => {
    if (!attendance.length) return 0;
    const considered = attendance.filter((r) => r.status === 'present' || r.status === 'late');
    return Math.round((considered.length / attendance.length) * 100);
  }, [attendance]);

  const activeStudents = students.filter((s) => s.status === 'active').length;
  const uniqueStudentIds = new Set(students.map((s) => s.id)).size;
  const upcomingExam = upcomingExams[0];

  const quickActions = [
    { label: 'إضافة مجموعة', path: '/teacher/groups', icon: Layers },
    { label: 'إدارة الطلاب', path: '/teacher/students', icon: Users },
    { label: 'المساعدون', path: '/teacher/assistants', icon: UserPlus },
    { label: 'جدولة امتحان', path: '/teacher/exams', icon: FileCheck2 },
    { label: 'مسح حضور', path: '/teacher/scan', icon: ScanLine },
    { label: 'الجدول والمواعيد', path: '/teacher/availability', icon: Calendar },
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {notice && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 text-blue-900 px-4 py-3 text-sm font-bold flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-blue-600">×</button>
        </div>
      )}

      <section className="rounded-[2rem] bg-gradient-to-br from-[#0B214F] via-[#123B84] to-[#2563EB] text-white p-6 sm:p-8 shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,white,transparent_30%),radial-gradient(circle_at_90%_80%,white,transparent_28%)]" />
        <div className="relative flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-bold">
              <Activity className="w-4 h-4 text-emerald-300" /> مركز إدارة المدرس
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mt-4">أهلاً يا أستاذ {user?.name || 'المعلم'} 👋</h1>
            <p className="text-blue-100 text-sm sm:text-base mt-3 leading-7">
              كل ما يخص طلابك ومجموعاتك ومساعديك وامتحاناتك ومواعيدك في مركز تحكم واحد.
            </p>
            <div className="flex flex-wrap gap-2 mt-5 text-xs font-bold text-blue-50">
              <span className="rounded-xl bg-white/10 px-3 py-2">{user?.profileData?.subject ? `مادة ${user.profileData.subject}` : 'ملف مدرس'}</span>
              <span className="rounded-xl bg-white/10 px-3 py-2">{lastUpdated ? `آخر تحديث ${lastUpdated}` : 'متصل الآن'}</span>
              <span className="rounded-xl bg-emerald-400/15 text-emerald-100 px-3 py-2 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> بيانات محمية</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onNavigate('/teacher/scan')} className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-5 py-3 text-sm font-black flex items-center gap-2 shadow-lg">
              <ScanLine className="w-5 h-5" /> مسح حضور QR
            </button>
            <button onClick={() => onNavigate('/teacher/exams')} className="rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 px-5 py-3 text-sm font-bold flex items-center gap-2">
              <FileCheck2 className="w-5 h-5" /> إدارة الامتحانات
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<Users />} label="الطلاب" value={uniqueStudentIds} sub={`${activeStudents} نشط`} />
        <Stat icon={<Layers />} label="المجموعات" value={groups.length} sub="مجموعاتك الحالية" />
        <Stat icon={<UserPlus />} label="المساعدون" value={assistantSummary.count} sub={assistantSummary.pendingInvites ? `${assistantSummary.pendingInvites} دعوة معلقة` : 'الفريق النشط'} />
        <Stat icon={<Award />} label="الحضور" value={`${attendanceRate}%`} sub={`${attendance.length} سجل`} />
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickActions.map(({ label, path, icon: Icon }) => (
          <button key={path} onClick={() => onNavigate(path)} className="group bg-white border border-slate-200 rounded-2xl p-4 text-right hover:border-blue-300 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"><Icon className="w-5 h-5" /></div>
            <div className="text-xs font-black text-slate-800">{label}</div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">فتح القسم <ChevronLeft className="w-3 h-3" /></div>
          </button>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="xl:col-span-2 rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="font-black text-slate-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600" /> طلبات الحجز الجديدة</h2>
              <p className="text-[11px] text-slate-500 mt-1">الموافقات تُحفظ مباشرة في حسابك.</p>
            </div>
            <button onClick={() => void load()} className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> تحديث
            </button>
          </div>
          {loading ? <Box text="جاري تحميل الطلبات..." /> : bookings.length === 0 ? <Box text="لا توجد طلبات حجز معلقة حاليًا." /> : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="rounded-2xl border border-slate-200 p-4 hover:border-blue-200 transition-colors">
                  <div className="flex flex-col md:flex-row gap-3 justify-between">
                    <div>
                      <div className="font-black text-slate-900">{b.studentName}</div>
                      <div className="text-xs text-slate-500 mt-1">{b.subject} • {b.day} {b.time}</div>
                      {b.location && <div className="text-xs text-slate-500 mt-1">{b.location} {b.price ? `• ${b.price} ج.م` : ''}</div>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button disabled={busyId === b.id} onClick={() => void approve(b.id, true)} className="rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-xs font-black flex items-center gap-1.5 disabled:opacity-50"><UserCheck className="w-4 h-4" /> موافقة</button>
                      <button disabled={busyId === b.id} onClick={() => void approve(b.id, false)} className="rounded-xl bg-white border border-red-200 text-red-700 px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"><XCircle className="w-4 h-4" /> رفض</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-black text-slate-900 flex items-center gap-2"><UserPlus className="w-5 h-5 text-emerald-600" /> فريق المساعدين</h2>
              <p className="text-[11px] text-slate-500 mt-1">إدارة ومراسلة وصلاحيات الفريق.</p>
            </div>
            <button onClick={() => onNavigate('/teacher/assistants')} className="text-[11px] font-black text-blue-700">إدارة الكل</button>
          </div>
          <div className="space-y-3">
            <Mini label="مساعدون نشطون" value={assistantSummary.count} />
            <Mini label="دعوات معلقة" value={assistantSummary.pendingInvites} />
            <Mini label="طلبات نقل" value={pendingTransfers} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={() => onNavigate('/teacher/assistants')} className="rounded-xl bg-blue-600 text-white py-2.5 text-xs font-black flex items-center justify-center gap-1.5"><UserPlus className="w-4 h-4" /> ابحث عن مساعد</button>
            <button onClick={() => onNavigate('/teacher/messages')} className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 py-2.5 text-xs font-black flex items-center justify-center gap-1.5"><MessageCircle className="w-4 h-4" /> الرسائل</button>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-black text-slate-900 flex items-center gap-2"><FileCheck2 className="w-5 h-5 text-purple-600" /> الامتحان القادم</h2>
              <p className="text-[11px] text-slate-500 mt-1">توزيع الطلاب والتصحيح من قسم الامتحانات.</p>
            </div>
            <button onClick={() => onNavigate('/teacher/exams')} className="text-[11px] font-black text-blue-700">فتح الامتحانات</button>
          </div>
          {upcomingExam ? (
            <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4">
              <div className="font-black text-slate-900">{upcomingExam.title}</div>
              <div className="text-xs text-slate-600 mt-2 flex flex-wrap gap-3"><span>📅 {new Date(upcomingExam.exam_date).toLocaleDateString('ar-EG')}</span><span>📝 {upcomingExam.total_marks || 0} درجة</span><span>الحالة: {upcomingExam.status}</span></div>
              <button onClick={() => onNavigate(`/teacher/exams/${upcomingExam.id}`)} className="mt-4 rounded-xl bg-purple-600 text-white px-4 py-2.5 text-xs font-black">فتح يوم الامتحان</button>
            </div>
          ) : <Box text="لا توجد امتحانات قادمة مسجلة حتى الآن." />}
        </section>

        <section className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-black text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> حالة الطلاب</h2>
              <p className="text-[11px] text-slate-500 mt-1">لمحة سريعة عن السجل الحالي.</p>
            </div>
            <button onClick={() => onNavigate('/teacher/students')} className="text-[11px] font-black text-blue-700">كشف الطلاب</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Mini label="إجمالي الطلاب" value={uniqueStudentIds} />
            <Mini label="طلاب نشطون" value={activeStudents} />
            <Mini label="سجلات حضور" value={attendance.length} />
            <Mini label="طلبات نقل" value={pendingTransfers} />
          </div>
          <button onClick={() => onNavigate('/teacher/students')} className="w-full mt-4 rounded-2xl bg-slate-900 text-white py-3 text-xs font-black flex items-center justify-center gap-2"><Settings2 className="w-4 h-4" /> إدارة تفاصيل الطلاب</button>
        </section>
      </div>

      <section className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-black text-slate-900 flex items-center gap-2"><Clock3 className="w-5 h-5 text-blue-600" /> آخر عمليات الحضور</h2>
            <p className="text-[11px] text-slate-500 mt-1">التحديثات تظهر تلقائيًا عند وصول تسجيل جديد.</p>
          </div>
          <button onClick={() => onNavigate('/teacher/attendance')} className="text-[11px] font-black text-blue-700">السجل الكامل</button>
        </div>
        {attendance.length === 0 ? <Box text="لا توجد سجلات حضور حتى الآن." /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {attendance.slice(0, 8).map((r) => (
              <div key={r.id} className="rounded-2xl bg-slate-50 border border-slate-100 p-3 flex items-center justify-between gap-2">
                <div className="min-w-0"><div className="font-black text-xs text-slate-800 truncate">{r.student_name || 'طالب'}</div><div className="text-[11px] text-slate-500 mt-1">{r.date} • {r.time || ''}</div></div>
                <span className={`text-[11px] font-black shrink-0 ${r.status === 'present' ? 'text-emerald-700' : r.status === 'late' ? 'text-amber-700' : 'text-red-700'}`}>{r.status === 'present' ? 'حاضر' : r.status === 'late' ? 'متأخر' : 'غائب'}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button onClick={() => onNavigate('/teacher/payments')} className="rounded-2xl bg-white border border-slate-200 p-4 text-right hover:border-blue-300 hover:shadow-sm transition-all"><WalletCards className="w-5 h-5 text-blue-600 mb-2" /><div className="font-black text-sm">المدفوعات والعمولة</div><div className="text-[11px] text-slate-500 mt-1">راجع دوراتك المالية ونسب العمولة.</div></button>
        <button onClick={() => onNavigate('/teacher/reviews')} className="rounded-2xl bg-white border border-slate-200 p-4 text-right hover:border-blue-300 hover:shadow-sm transition-all"><Award className="w-5 h-5 text-amber-500 mb-2" /><div className="font-black text-sm">التقييمات</div><div className="text-[11px] text-slate-500 mt-1">راجع تقييمات الطلاب ورد عليهم.</div></button>
        <button onClick={() => onNavigate('/teacher/profile')} className="rounded-2xl bg-white border border-slate-200 p-4 text-right hover:border-blue-300 hover:shadow-sm transition-all"><ShieldCheck className="w-5 h-5 text-emerald-600 mb-2" /><div className="font-black text-sm">الملف العام</div><div className="text-[11px] text-slate-500 mt-1">حدّث بياناتك ومعلومات ظهورك للطلاب.</div></button>
      </div>
    </div>
  );
};

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between text-slate-500"><span className="text-xs font-bold">{label}</span><span className="text-blue-600">{React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}</span></div>
      <div className="text-2xl font-black text-slate-900 mt-2">{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-1 font-bold">{sub}</div>}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span className="text-xs font-bold text-slate-600">{label}</span><span className="text-sm font-black text-slate-900">{value}</span></div>;
}

function Box({ text }: { text: string }) {
  return <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-7 text-center text-xs font-bold text-slate-500"><AlertCircle className="w-4 h-4 mx-auto mb-2 text-slate-300" />{text}</div>;
}
