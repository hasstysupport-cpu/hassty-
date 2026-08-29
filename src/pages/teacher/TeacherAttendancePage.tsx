import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock3, LogIn, LogOut, RefreshCw, Users, XCircle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

interface LessonSession {
  id: string;
  title: string;
  subject?: string | null;
  session_date: string;
  starts_at: string;
  ends_at: string;
  location?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  group_id?: string | null;
}

interface AttendanceRow {
  id: string;
  student_id: string;
  student_name: string;
  status: 'present' | 'late' | 'absent';
  checked_in_at?: string | null;
  checked_out_at?: string | null;
  late_minutes?: number;
  attendance_method?: string;
}

const fmt = (value?: string | null) => value ? new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const TeacherAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LessonSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [lastAction, setLastAction] = useState('');

  const load = async () => {
    if (!supabase || !user?.uid) return;
    setLoading(true);
    setError('');
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('lesson_sessions')
        .select('id,title,subject,session_date,starts_at,ends_at,location,status,group_id')
        .eq('tutor_id', user.uid)
        .order('starts_at', { ascending: false })
        .limit(40);
      if (sessionError) throw sessionError;
      const nextSessions = (sessionData || []) as LessonSession[];
      setSessions(nextSessions);
      const nextId = selectedSession && nextSessions.some((s) => s.id === selectedSession)
        ? selectedSession
        : nextSessions.find((s) => s.status === 'scheduled')?.id || nextSessions[0]?.id || '';
      setSelectedSession(nextId);

      if (nextId) {
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance_records')
          .select('id,student_id,student_name,status,checked_in_at,checked_out_at,late_minutes,attendance_method')
          .eq('session_id', nextId)
          .order('checked_in_at', { ascending: true });
        if (attendanceError) throw attendanceError;
        setRows((attendanceData || []) as AttendanceRow[]);
      } else {
        setRows([]);
      }
    } catch (e: any) {
      setError(e?.message || 'تعذر تحميل سجل الحضور.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [user?.uid]);
  useEffect(() => {
    if (!selectedSession || !supabase) return;
    const channel = supabase
      .channel(`teacher-attendance:${selectedSession}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records', filter: `session_id=eq.${selectedSession}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [selectedSession]);

  const selected = useMemo(() => sessions.find((s) => s.id === selectedSession) || null, [sessions, selectedSession]);
  const stats = useMemo(() => ({
    total: rows.length,
    present: rows.filter((r) => r.status === 'present').length,
    late: rows.filter((r) => r.status === 'late').length,
    absent: rows.filter((r) => r.status === 'absent').length,
    open: rows.filter((r) => !r.checked_out_at && r.checked_in_at).length,
  }), [rows]);

  const checkout = async (row: AttendanceRow) => {
    if (!supabase || !user?.uid || !row.id || row.checked_out_at) return;
    setBusyId(row.id);
    setError('');
    try {
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('attendance_records')
        .update({ checked_out_at: now, updated_at: now })
        .eq('id', row.id)
        .eq('student_id', row.student_id);
      if (updateError) throw updateError;
      const { error: eventError } = await supabase.from('attendance_events').insert({
        attendance_id: row.id,
        student_id: row.student_id,
        group_id: selected?.group_id || null,
        event_type: 'check_out',
        actor_id: user.uid,
        occurred_at: now,
        notes: 'تسجيل خروج من لوحة المعلم',
      });
      if (eventError) throw eventError;
      setLastAction(`تم تسجيل خروج ${row.student_name} الساعة ${new Date(now).toLocaleTimeString('ar-EG')}`);
      await load();
    } catch (e: any) {
      setError(e?.message || 'تعذر تسجيل الخروج.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5 text-right" dir="rtl">
      <section className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black">
              <CalendarClock className="w-4 h-4" /> حضور وانصراف لحظي
            </div>
            <h1 className="text-2xl font-black text-[#1E3A8A] mt-2">إدارة الحضور المتطور</h1>
            <p className="text-sm text-gray-500 mt-1">مراجعة الدخول والخروج، التأخير، والحالات المسجلة لكل حصة.</p>
          </div>
          <button onClick={() => void load()} className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-black text-gray-700 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> تحديث الآن
          </button>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold">
            <option value="">اختر الحصة</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.title} — {fmt(s.starts_at)}</option>)}
          </select>
          {selected && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm">
              <div className="font-black text-[#1E3A8A]">{selected.title}</div>
              <div className="text-xs text-gray-600 mt-1">{selected.subject || 'بدون مادة'} · {selected.location || 'بدون مكان'}</div>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ['الإجمالي', stats.total, Users],
            ['حاضر', stats.present, CheckCircle2],
            ['متأخر', stats.late, Clock3],
            ['غائب', stats.absent, XCircle],
            ['لم يسجل خروج', stats.open, LogOut],
          ].map(([label, value, Icon]) => (
            <div key={String(label)} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <Icon className="w-5 h-5 text-blue-600" />
              <div className="text-[11px] text-gray-500 mt-2 font-bold">{label}</div>
              <div className="text-2xl font-black text-gray-900">{value as number}</div>
            </div>
          ))}
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>}
      {lastAction && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{lastAction}</div>}

      <section className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-gray-900">سجل الطلاب</h2>
          <span className="text-xs text-gray-500">آخر مزامنة: {new Date().toLocaleTimeString('ar-EG')}</span>
        </div>
        {loading ? <div className="py-16 text-center text-sm text-gray-400">جاري تحميل سجل الحضور...</div> : rows.length === 0 ? <div className="py-16 text-center text-sm text-gray-400">لا توجد سجلات حضور لهذه الحصة حتى الآن.</div> : <div className="divide-y divide-gray-100">{rows.map((row) => (
          <div key={row.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black shrink-0">{row.student_name?.slice(0, 1) || 'ط'}</div>
            <div className="flex-1 min-w-0"><div className="font-black text-sm text-gray-900">{row.student_name}</div><div className="text-xs text-gray-500 mt-1">دخول: {fmt(row.checked_in_at)} · خروج: {fmt(row.checked_out_at)}</div></div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black border ${row.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : row.status === 'late' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{row.status === 'present' ? 'حاضر' : row.status === 'late' ? `متأخر ${row.late_minutes || 0}د` : 'غائب'}</span>
              {row.checked_in_at && !row.checked_out_at && <button disabled={busyId === row.id} onClick={() => void checkout(row)} className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-black flex items-center gap-1.5 disabled:opacity-50"><LogOut className="w-4 h-4" />{busyId === row.id ? 'جاري...' : 'تسجيل خروج'}</button>}
              {row.checked_out_at && <span className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-black flex items-center gap-1.5"><LogOut className="w-4 h-4" />تم الخروج</span>}
            </div>
          </div>
        ))}</div>}
      </section>
    </div>
  );
};
