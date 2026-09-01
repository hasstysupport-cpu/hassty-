import React, { useState, useEffect, useCallback } from 'react';
import { CalendarClock, CheckCircle2, Clock3, LogOut, RefreshCw, Users, XCircle, Layers } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { loadTeacherGroups } from '../../lib/teacherStore';
import { StudentGroup } from '../../types';

export const TeacherAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const teacherId = user?.uid || '';
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastAction, setLastAction] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fmt = (v?: string | null) => {
    if (!v) return '-';
    try {
      const d = new Date(v);
      if (isNaN(d.getTime())) return v;
      return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return v;
    }
  };

  const load = useCallback(async () => {
    if (!supabase || !teacherId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const liveGroups = await loadTeacherGroups(teacherId);
      setGroups(liveGroups);

      const groupIds = liveGroups.map(g => g.id);
      if (groupIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      let query = supabase.from('attendance_records').select('*');

      if (selectedGroupId && selectedGroupId !== 'all') {
        query = query.eq('group_id', selectedGroupId);
      } else {
        query = query.in('group_id', groupIds);
      }

      const { data, error: queryError } = await query
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .limit(100);

      if (queryError) throw queryError;
      setRows(data || []);
    } catch (e: any) {
      setError(e?.message || 'تعذر تحميل سجل الحضور.');
    } finally {
      setLoading(false);
    }
  }, [teacherId, selectedGroupId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime subscription for attendance records
  useEffect(() => {
    if (!supabase || !teacherId) return;
    const channel = supabase
      .channel(`attendance-teacher-${teacherId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => {
        void load();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [teacherId, load]);

  const stats = {
    total: rows.length,
    present: rows.filter((r) => r.status === 'present').length,
    late: rows.filter((r) => r.status === 'late').length,
    absent: rows.filter((r) => r.status === 'absent').length,
    open: rows.filter((r) => r.checked_in_at && !r.checked_out_at).length,
  };

  const checkout = async (row: any) => {
    if (!supabase || !user) return;
    setBusyId(row.id);
    setError('');
    try {
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('attendance_records')
        .update({ checked_out_at: now, updated_at: now })
        .eq('id', row.id);
      if (updateError) throw updateError;

      try {
        await supabase.from('attendance_events').insert({
          attendance_id: row.id,
          student_id: row.student_id,
          group_id: row.group_id || null,
          event_type: 'check_out',
          actor_id: user.uid,
          occurred_at: now,
          notes: 'تسجيل خروج من لوحة المعلم',
        });
      } catch {
        // ignore if optional table
      }

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
            <h1 className="text-2xl font-black text-[#1E3A8A] mt-2">إدارة الحضور والغياب</h1>
            <p className="text-sm text-gray-500 mt-1">مراجعة الحضور المباشر عبر رمز QR، أوقات الدخول والخروج، ونسب الالتزام لكل مجموعة.</p>
          </div>
          <button
            onClick={() => void load()}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-black text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-100 transition"
          >
            <RefreshCw className="w-4 h-4" /> تحديث الآن
          </button>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 shrink-0" />
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع المجموعات ({groups.length})</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} {g.subject ? `(${g.subject})` : ''}
                </option>
              ))}
            </select>
          </div>
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
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">جاري تحميل سجل الحضور من قاعدة البيانات...</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">لا توجد سجلات حضور مسجلة حتى الآن.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map((row) => (
              <div key={row.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black shrink-0">
                  {row.student_name?.slice(0, 1) || 'ط'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm text-gray-900">{row.student_name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    التاريخ: {row.date} {row.time ? `الساعة ${row.time}` : ''} · دخول: {fmt(row.checked_in_at)} · خروج: {fmt(row.checked_out_at)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black border ${
                      row.status === 'present'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : row.status === 'late'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {row.status === 'present' ? 'حاضر' : row.status === 'late' ? `متأخر ${row.late_minutes || 0}د` : 'غائب'}
                  </span>
                  {row.checked_in_at && !row.checked_out_at && (
                    <button
                      disabled={busyId === row.id}
                      onClick={() => void checkout(row)}
                      className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-black flex items-center gap-1.5 disabled:opacity-50 hover:bg-blue-900"
                    >
                      <LogOut className="w-4 h-4" />
                      {busyId === row.id ? 'جاري...' : 'تسجيل خروج'}
                    </button>
                  )}
                  {row.checked_out_at && (
                    <span className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-black flex items-center gap-1.5">
                      <LogOut className="w-4 h-4" />
                      تم الخروج
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
