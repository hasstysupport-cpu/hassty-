import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Calendar, CheckCircle2, Clock3, Layers, RefreshCw, ScanLine, UserCheck, Users, XCircle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { loadTeacherGroups, loadTeacherStudents } from '../../lib/teacherStore';
import { StudentGroup, TeacherStudentItem } from '../../types';

interface Props { onNavigate: (path: string) => void; }

type PendingBooking = { id:string; studentId:string; studentName:string; subject:string; day:string; time:string; location:string; price:number; status:string; createdAt:string };

export const TeacherDashboardPageV2: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const teacherId = user?.uid || '';
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [students, setStudents] = useState<TeacherStudentItem[]>([]);
  const [bookings, setBookings] = useState<PendingBooking[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!teacherId || !supabase) { setLoading(false); return; }
    setRefreshing(true);
    try {
      const [liveGroups, liveStudents] = await Promise.all([
        loadTeacherGroups(teacherId),
        loadTeacherStudents(teacherId),
      ]);
      setGroups(liveGroups);
      setStudents(liveStudents);

      const groupIds = liveGroups.map(g => g.id);

      // Fetch bookings safely
      let bookingData: any[] = [];
      try {
        const { data: bData } = await supabase
          .from('booking_requests')
          .select('id,student_id,student_name,subject,day,time,location,price,status,created_at')
          .eq('tutor_id', teacherId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20);
        bookingData = bData || [];
      } catch (err) {
        console.warn('Booking fetch warning:', err);
      }
      setBookings(bookingData.map((r: any) => ({
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
      })));

      // Fetch attendance records safely
      let attData: any[] = [];
      try {
        if (groupIds.length > 0) {
          const { data: aData } = await supabase
            .from('attendance_records')
            .select('id,group_id,student_id,status,date,time,student_name')
            .in('group_id', groupIds)
            .order('date', { ascending: false })
            .limit(100);
          attData = aData || [];
        } else {
          const { data: aData } = await supabase
            .from('attendance_records')
            .select('id,group_id,student_id,status,date,time,student_name')
            .eq('tutor_id', teacherId)
            .order('date', { ascending: false })
            .limit(100);
          attData = aData || [];
        }
      } catch (err) {
        console.warn('Attendance fetch warning:', err);
      }
      setAttendance(attData);

    } catch (e: any) {
      setNotice(e?.message || 'تعذر تحميل بيانات لوحة المدرس.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teacherId]);

  useEffect(() => { void load(); }, [load]);

  const approve = async (id: string, approved: boolean) => {
    if (!supabase) return;
    setBusyId(id);
    setNotice(null);
    try {
      const { error } = await supabase
        .from('booking_requests')
        .update({ status: approved ? 'approved' : 'rejected', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setBookings(prev => prev.filter(b => b.id !== id));
      setNotice(approved ? 'تمت الموافقة على طلب الحجز وحفظها في قاعدة البيانات ✅' : 'تم رفض طلب الحجز وحفظ الحالة ✅');
    } catch (e: any) {
      setNotice(e?.message || 'تعذر تحديث طلب الحجز.');
    } finally {
      setBusyId(null);
    }
  };

  const attendanceRate = useMemo(() => {
    if (!attendance.length) return 0;
    const considered = attendance.filter(r => r.status === 'present' || r.status === 'late');
    return Math.round((considered.length / attendance.length) * 100);
  }, [attendance]);

  const activeStudents = students.filter(s => s.status === 'active').length;
  const uniqueStudentIds = new Set(students.map(s => s.id)).size;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {notice && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 text-blue-900 px-4 py-3 text-sm font-bold flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-blue-600">×</button>
        </div>
      )}

      <section className="anim-up hero-lux rounded-2xl p-5 sm:p-6 text-white shadow-xl">
        <div className="hero-dots" aria-hidden="true" />
        <div className="hero-blob w-44 h-44 -top-20 -right-16 animate-float-slow" aria-hidden="true" />
        <div className="hero-blob w-28 h-28 -bottom-14 -left-10 animate-float-reverse" aria-hidden="true" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/30 backdrop-blur-sm px-3 py-1.5 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              لوحة المدرس
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-3 drop-shadow-sm">أهلاً يا أستاذ {user?.name || 'المعلم'} 👋</h1>
            <p className="text-white/85 text-sm mt-2">{user?.profileData?.subject ? `مادة ${user.profileData.subject}` : 'إدارة حصصك وطلابك ومواعيدك من مكان واحد.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onNavigate('/teacher/scan')} className="btn-primary-shine rounded-2xl bg-white text-[color:var(--role-color)] px-5 py-3 text-sm font-black flex items-center gap-2 cursor-pointer shadow-lg hover:-translate-y-0.5">
              <ScanLine className="w-5 h-5" />
              مسح حضور QR
            </button>
            <button onClick={() => onNavigate('/teacher/groups')} className="rounded-2xl bg-white/15 border border-white/30 backdrop-blur-sm px-5 py-3 text-sm font-bold flex items-center gap-2 cursor-pointer hover:bg-white/30">
              <Layers className="w-5 h-5" />
              المجموعات
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat delay={60} icon={<Users />} label="الطلاب" value={uniqueStudentIds} />
        <Stat delay={130} icon={<Layers />} label="المجموعات" value={groups.length} />
        <Stat delay={200} icon={<Clock3 />} label="طلبات معلقة" value={bookings.length} />
        <Stat delay={270} icon={<Award />} label="الحضور" value={`${attendanceRate}%`} />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="anim-up card-lux xl:col-span-2 rounded-2xl bg-white border border-slate-200 p-5" style={{animationDelay:'340ms'}}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              طلبات الحجز الجديدة
            </h2>
            <button onClick={() => void load()} className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>
          {loading ? (
            <Box text="جاري تحميل الطلبات..." />
          ) : bookings.length === 0 ? (
            <Box text="لا توجد طلبات حجز معلقة حاليًا." />
          ) : (
            <div className="space-y-3">
              {bookings.map((b, i) => (
                <div key={b.id} className="row-in rounded-2xl border border-slate-200 p-4 hover:shadow-lg hover:shadow-slate-200/70 hover:border-[color:var(--role-soft-border)] hover:-translate-y-0.5" style={{animationDelay:`${Math.min(i*50,350)}ms`}}>
                  <div className="flex flex-col md:flex-row gap-3 justify-between">
                    <div>
                      <div className="font-black text-slate-900">{b.studentName}</div>
                      <div className="text-xs text-slate-500 mt-1">{b.subject} • {b.day} {b.time}</div>
                      {b.location && <div className="text-xs text-slate-500 mt-1">{b.location} {b.price ? `• ${b.price} ج.م` : ''}</div>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button disabled={busyId === b.id} onClick={() => void approve(b.id, true)} className="rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-xs font-black flex items-center gap-1.5 disabled:opacity-50">
                        <UserCheck className="w-4 h-4" />
                        موافقة
                      </button>
                      <button disabled={busyId === b.id} onClick={() => void approve(b.id, false)} className="rounded-xl bg-white border border-red-200 text-red-700 px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
                        <XCircle className="w-4 h-4" />
                        رفض
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="anim-up card-lux rounded-2xl bg-white border border-slate-200 p-5" style={{animationDelay:'420ms'}}>
          <h2 className="font-black text-slate-900 flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[color:var(--role-color)]" />
            حالة الطلاب
          </h2>
          <div className="space-y-3">
            <Mini label="إجمالي الطلاب" value={uniqueStudentIds} />
            <Mini label="طلاب نشطون" value={activeStudents} />
            <Mini label="سجلات حضور" value={attendance.length} />
            <Mini label="آخر تحديث" value={new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} />
          </div>
          <button onClick={() => onNavigate('/teacher/students')} className="chip-grad btn-primary-shine w-full mt-5 rounded-2xl py-3 text-xs font-black cursor-pointer hover:-translate-y-0.5">
            عرض كشف الطلاب
          </button>
        </section>
      </div>

      <section className="anim-up card-lux rounded-2xl bg-white border border-slate-200 p-5" style={{animationDelay:'500ms'}}>
        <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2">
          <Clock3 className="w-5 h-5 text-[color:var(--role-color)]" />
          آخر عمليات الحضور
        </h2>
        {attendance.length === 0 ? (
          <Box text="لا توجد سجلات حضور حتى الآن." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {attendance.slice(0, 8).map((r, i) => (
              <div key={r.id} className="row-in rounded-2xl bg-slate-50 border border-slate-100 p-3 flex items-center justify-between hover:border-[color:var(--role-soft-border)]" style={{animationDelay:`${Math.min(i*45,350)}ms`}}>
                <div>
                  <div className="font-black text-xs text-slate-800">{r.student_name || 'طالب'}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{r.date} • {r.time || ''}</div>
                </div>
                <span className={`text-[11px] font-black ${r.status === 'present' ? 'text-emerald-700' : r.status === 'late' ? 'text-amber-700' : 'text-red-700'}`}>
                  {r.status === 'present' ? 'حاضر' : r.status === 'late' ? 'متأخر' : 'غائب'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

function Stat({ icon, label, value, delay }: { icon: React.ReactNode; label: string; value: React.ReactNode; delay?: number }) {
  return (
    <div className="card-lux anim-up rounded-2xl bg-white border border-slate-200 p-4" style={delay ? { animationDelay: `${delay}ms` } : undefined}>
      <div className="flex items-center justify-between text-slate-500">
        <span className="text-xs font-bold">{label}</span>
        <span className="chip-grad w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-md shrink-0">{React.cloneElement(icon as React.ReactElement, { className: 'w-3.5 h-3.5' })}</span>
      </div>
      <div className="text-2xl font-black mt-2 bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent tabular-nums">{value}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}

function Box({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-6 text-center text-xs font-bold text-slate-500">
      {text}
    </div>
  );
}
