/**
 * Hassty — سجل الحصص لكل مجموعة
 * دفتر الحصة: حضور الطلاب، إحصاء المسجلين، وروابط ملفاتهم وتقييماتهم.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, Clock3, CheckCircle2, RefreshCw,
  ChevronDown, ChevronUp, ClipboardList, Search, UserRound, MessageSquareText,
  UserCheck, UserX, Loader2,
} from 'lucide-react';
import { Btn, Card, EmptyState, ErrorBlock, StatusBadge, fmtDate, fmtDateTime, useToast } from '../../components/common/ui';
import { Modal } from '../../components/common/Modal';
import { supabase } from '../../lib/supabase';

type AttendanceStatus = 'present' | 'late' | 'absent';
type LedgerFilter = 'all' | 'upcoming' | 'past';

interface SessionItem {
  id: string;
  title: string;
  session_date: string;
  starts_at: string;
  ends_at: string;
  location?: string;
  status: string;
}

interface GroupStudent {
  id: string;
  student_id: string;
  student_name: string;
  student_phone?: string;
  parent_phone?: string;
  grade?: string;
  qr_code?: string;
  avatar_url?: string;
}

interface AttendanceItem {
  id: string;
  group_id: string;
  tutor_id?: string;
  student_id?: string;
  student_name: string;
  qr_code: string;
  session_id?: string | null;
  date: string;
  time?: string;
  status: AttendanceStatus;
  notes?: string | null;
  scanned_via_qr?: boolean;
  attendance_method?: string;
  created_at?: string;
  checked_in_at?: string | null;
}

interface ScheduleSlotRow {
  id?: string;
  day: string;
  dayArabic?: string;
  startTime: string;
  endTime: string;
}

interface Props {
  groupId: string;
  teacherId: string;
  sessions: SessionItem[];
  students: GroupStudent[];
  scheduleSlots: ScheduleSlotRow[];
  subject?: string;
  location?: string;
  onNavigate?: (path: string) => void;
  onRefresh?: () => void | Promise<void>;
}

const statusText: Record<AttendanceStatus, string> = {
  present: 'حاضر',
  late: 'متأخر',
  absent: 'غائب',
};

const localClock = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const sessionClock = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? localClock()
    : date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};
const weekdayAr = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('ar-EG', { weekday: 'long' });
};
const DAY_NUMBER: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
  'الأحد': 0, 'الإثنين': 1, 'الاثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6,
};
const toDateKey = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const normaliseClock = (value: string) => {
  const match = String(value || '').match(/^(\\d{1,2}):(\\d{2})/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '';
};
const rawClock = (value: string) => {
  const match = String(value || '').match(/[T ](\\d{2}:\\d{2})/);
  return match?.[1] || '';
};
const localClockFromInstant = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const GroupSessionLedger: React.FC<Props> = ({ groupId, teacherId, sessions, students, scheduleSlots, subject, location, onNavigate, onRefresh }) => {
  const toast = useToast();
  const [filter, setFilter] = useState<LedgerFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceItem[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [noteStudent, setNoteStudent] = useState<GroupStudent | null>(null);
  const [noteCategory, setNoteCategory] = useState('behavior');
  const [noteSeverity, setNoteSeverity] = useState('info');
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [generatingSessions, setGeneratingSessions] = useState(false);

  const loadAttendanceRows = useCallback(async () => {
    if (!supabase || !groupId || sessions.length === 0) {
      setAttendanceRows([]);
      setRecordsError('');
      return;
    }
    const dates = sessions.map((item) => item.session_date).filter(Boolean).sort();
    if (!dates.length) {
      setAttendanceRows([]);
      return;
    }
    setLoadingRecords(true);
    setRecordsError('');
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('id,group_id,tutor_id,student_id,student_name,qr_code,session_id,date,time,status,notes,scanned_via_qr,attendance_method,created_at,checked_in_at')
        .eq('group_id', groupId)
        .gte('date', dates[0])
        .lte('date', dates[dates.length - 1])
        .order('date', { ascending: false })
        .limit(2000);
      if (error) throw error;
      setAttendanceRows((data || []) as AttendanceItem[]);
    } catch (e: any) {
      setRecordsError(e?.message || 'تعذر تحميل سجل الحضور للحصص.');
    } finally {
      setLoadingRecords(false);
    }
  }, [groupId, sessions]);

  useEffect(() => { void loadAttendanceRows(); }, [loadAttendanceRows]);

  const now = Date.now();
  const filteredSessions = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('ar');
    return [...sessions]
      .filter((session) => {
        if (filter === 'upcoming' && !(session.status === 'scheduled' && new Date(session.starts_at).getTime() >= now)) return false;
        if (filter === 'past' && session.status === 'scheduled' && new Date(session.starts_at).getTime() >= now) return false;
        if (q && !`${session.title} ${session.session_date} ${session.location || ''}`.toLocaleLowerCase('ar').includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  }, [sessions, filter, search, now]);

  const recordsForSession = useCallback((session: SessionItem) => {
    const direct = attendanceRows.filter((row) => row.session_id === session.id);
    const sameDaySessions = sessions.filter((item) => item.session_date === session.session_date && item.status !== 'cancelled');
    // سجلات قديمة من المسح لم تكن تحمل session_id؛ نربطها بالحصة إذا كان في اليوم حصة واحدة فقط.
    const legacy = sameDaySessions.length === 1
      ? attendanceRows.filter((row) => !row.session_id && row.date === session.session_date)
      : [];
    const ids = new Set(direct.map((row) => row.id));
    const combined = [...direct, ...legacy.filter((row) => !ids.has(row.id))];
    // بعض عمليات المسح القديمة قد تكون كررت التسجيل؛ نظهر أحدث سجل لكل طالب في كشف الحصة.
    const unique = new Map<string, AttendanceItem>();
    combined.forEach((row) => {
      const key = row.student_id || `name:${row.student_name}`;
      const current = unique.get(key);
      if (!current || String(row.created_at || row.time || '') >= String(current.created_at || current.time || '')) unique.set(key, row);
    });
    return [...unique.values()];
  }, [attendanceRows, sessions]);

  const selectedSession = sessions.find((item) => item.id === selectedSessionId) || null;
  const selectedRecords = selectedSession ? recordsForSession(selectedSession) : [];
  const recordedStudentIds = new Set(selectedRecords.map((row) => row.student_id).filter(Boolean));
  const presentCount = selectedRecords.filter((row) => row.status === 'present').length;
  const lateCount = selectedRecords.filter((row) => row.status === 'late').length;
  const absentCount = selectedRecords.filter((row) => row.status === 'absent').length;
  const unmarkedCount = Math.max(0, students.length - recordedStudentIds.size);

  const attendanceStats = useMemo(() => {
    const allSessionRecords = sessions.flatMap((session) => recordsForSession(session));
    const unique = new Map<string, AttendanceItem>();
    allSessionRecords.forEach((row) => unique.set(row.id, row));
    const values = [...unique.values()];
    return {
      sessions: sessions.length,
      recorded: values.length,
      present: values.filter((row) => row.status === 'present').length,
      late: values.filter((row) => row.status === 'late').length,
      absent: values.filter((row) => row.status === 'absent').length,
    };
  }, [sessions, recordsForSession]);

  const markStudent = async (session: SessionItem, student: GroupStudent, status: AttendanceStatus) => {
    if (!supabase || !teacherId) {
      toast.push('error', 'تعذر الاتصال بقاعدة البيانات أو التحقق من حساب المدرس.');
      return;
    }
    const key = `${session.id}:${student.student_id}`;
    setBusyKey(key);
    try {
      const currentRecords = recordsForSession(session);
      const existing = currentRecords.find((row) => row.student_id === student.student_id);
      let qrCode = student.qr_code || existing?.qr_code || '';
      if (!qrCode && student.student_id) {
        const { data, error } = await supabase.from('profiles').select('qr_code').eq('id', student.student_id).maybeSingle();
        if (error) throw error;
        qrCode = String(data?.qr_code || '');
      }
      if (!qrCode) throw new Error(`لا يوجد كود QR محفوظ للطالب ${student.student_name}. افتح ملفه وتأكد من إعداد الكود قبل تسجيل الحضور اليدوي.`);

      const nowIso = new Date().toISOString();
      const payload = {
        group_id: groupId,
        tutor_id: teacherId,
        student_id: student.student_id,
        student_name: student.student_name,
        qr_code: qrCode,
        session_id: session.id,
        date: session.session_date,
        time: existing?.time || sessionClock(session.starts_at),
        status,
        scanned_via_qr: existing?.scanned_via_qr ?? false,
        attendance_method: existing?.attendance_method || 'manual',
        checked_in_at: status === 'absent' ? null : (existing?.checked_in_at || nowIso),
        updated_at: nowIso,
      };

      let saved: AttendanceItem;
      if (existing) {
        const { data, error } = await supabase.from('attendance_records').update(payload).eq('id', existing.id).select('id,group_id,tutor_id,student_id,student_name,qr_code,session_id,date,time,status,notes,scanned_via_qr,attendance_method,created_at').single();
        if (error) throw error;
        saved = data as AttendanceItem;
        toast.push('success', `تم تحديث حالة ${student.student_name} إلى «${statusText[status]}».`);
      } else {
        const { data, error } = await supabase.from('attendance_records').insert({
          ...payload,
        }).select('id,group_id,tutor_id,student_id,student_name,qr_code,session_id,date,time,status,notes,scanned_via_qr,attendance_method,created_at').single();
        if (error) throw error;
        saved = data as AttendanceItem;
        toast.push('success', `تم تسجيل ${statusText[status]} للطالب ${student.student_name}.`);
      }

      setAttendanceRows((prev) => {
        const withoutSaved = prev.filter((row) => row.id !== saved.id);
        return [saved, ...withoutSaved];
      });
      // سجل تدقيق مساعد؛ لا يؤدي فشله إلى إلغاء حفظ الحضور نفسه.
      try {
        await supabase.from('attendance_events').insert({
          attendance_id: saved.id,
          student_id: student.student_id,
          group_id: groupId,
          event_type: existing ? 'attendance_status_updated' : 'attendance_status_created',
          actor_id: teacherId,
          occurred_at: nowIso,
          notes: `تحديث يدوي من سجل الحصة: ${statusText[status]}`,
        });
      } catch { /* جدول الأحداث مساعد */ }
    } catch (e: any) {
      toast.push('error', e?.message || 'تعذر حفظ حالة الحضور.');
    } finally {
      setBusyKey('');
    }
  };

  const saveStudentNote = async () => {
    if (!supabase || !teacherId || !noteStudent) return;
    if (!noteText.trim()) {
      toast.push('error', 'اكتب ملاحظة قصيرة قبل الحفظ.');
      return;
    }
    setSavingNote(true);
    try {
      const { error } = await supabase.from('student_notes').insert({
        student_id: noteStudent.student_id,
        group_id: groupId,
        teacher_id: teacherId,
        category: noteCategory,
        severity: noteSeverity,
        note: noteText.trim(),
      });
      if (error) throw error;
      toast.push('success', `تم حفظ تقييم ${noteStudent.student_name} في سجله.`);
      setNoteStudent(null);
      setNoteText('');
      setNoteCategory('behavior');
      setNoteSeverity('info');
    } catch (e: any) {
      toast.push('error', e?.message || 'تعذر حفظ تقييم الطالب.');
    } finally {
      setSavingNote(false);
    }
  };

  const generateNextEightWeeks = async () => {
    if (!supabase || !teacherId || !groupId) {
      toast.push('error', 'تعذر الاتصال بقاعدة البيانات أو التحقق من حساب المدرس.');
      return;
    }
    if (!scheduleSlots.length) {
      toast.push('error', 'المجموعة لا تحتوي على مواعيد أسبوعية محفوظة. أضف مواعيدها أولًا.');
      return;
    }

    setGeneratingSessions(true);
    try {
      const now = new Date();
      const pending: Array<Record<string, unknown>> = [];
      const plannedKeys = new Set<string>();
      let validSlots = 0;

      for (let offset = 0; offset < 56; offset += 1) {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
        const dateKey = toDateKey(day);
        const daySlots = scheduleSlots.filter((slot) => DAY_NUMBER[slot.day] === day.getDay());
        if (!daySlots.length) continue;

        const dayStartTimes = new Set(daySlots.map((slot) => normaliseClock(slot.startTime)).filter(Boolean));
        const existingStartTimes = new Set<string>();
        sessions.filter((session) => session.session_date === dateKey).forEach((session) => {
          // السجلات التي أنشأها هذا المولّد تحفظ الوقت المحلي بصيغة ISO؛ للمواعيد اليدوية القديمة نفضّل النص الأصلي لتفادي التكرار.
          const preferred = String(session.title || '').startsWith('حصة أسبوعية —')
            ? localClockFromInstant(session.starts_at)
            : rawClock(session.starts_at) || localClockFromInstant(session.starts_at);
          const fallback = preferred === rawClock(session.starts_at)
            ? localClockFromInstant(session.starts_at)
            : rawClock(session.starts_at);
          if (dayStartTimes.has(preferred)) existingStartTimes.add(preferred);
          else if (dayStartTimes.has(fallback)) existingStartTimes.add(fallback);
        });

        for (const slot of daySlots) {
          const startText = normaliseClock(slot.startTime);
          const endText = normaliseClock(slot.endTime);
          if (!startText || !endText) continue;
          const [startHour, startMinute] = startText.split(':').map(Number);
          const [endHour, endMinute] = endText.split(':').map(Number);
          if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) continue;
          const starts = new Date(day.getFullYear(), day.getMonth(), day.getDate(), startHour, startMinute, 0, 0);
          const ends = new Date(day.getFullYear(), day.getMonth(), day.getDate(), endHour, endMinute, 0, 0);
          if (ends <= starts) continue;
          validSlots += 1;
          if (starts <= now || existingStartTimes.has(startText)) continue;
          const key = `${dateKey}|${startText}`;
          if (plannedKeys.has(key)) continue;
          plannedKeys.add(key);
          pending.push({
            tutor_id: teacherId,
            group_id: groupId,
            title: `حصة أسبوعية — ${weekdayAr(dateKey)}`,
            subject: subject || null,
            session_date: dateKey,
            starts_at: starts.toISOString(),
            ends_at: ends.toISOString(),
            location: location || null,
            status: 'scheduled',
          });
        }
      }

      if (!validSlots) {
        toast.push('error', 'تعذر قراءة أوقات المواعيد الأسبوعية. راجع يوم ووقت بداية ونهاية كل موعد.');
        return;
      }
      if (!pending.length) {
        toast.push('success', 'كل مواعيد الأسابيع الثمانية القادمة مسجّلة بالفعل أو أن موعد اليوم انتهى؛ لم نضف أي سجل مكرر.');
        setShowGenerateConfirm(false);
        return;
      }

      const { data: inserted, error } = await supabase.from('lesson_sessions').insert(pending).select('id,title,session_date,starts_at,ends_at,location,status');
      if (error) throw error;

      // مزامنة اختيارية مع تقويم الطلاب — لا تحذف أو تعدّل أي سجلات سابقة.
      const events = (inserted || []).flatMap((session: any) => students.map((student) => ({
        user_id: student.student_id,
        title: session.title,
        event_type: 'lesson',
        starts_at: session.starts_at,
        ends_at: session.ends_at,
        link: '/student/calendar',
      })));
      let calendarWarning = false;
      if (events.length) {
        const { error: calendarError } = await supabase.from('calendar_events').insert(events);
        calendarWarning = !!calendarError;
      }

      toast.push(calendarWarning ? 'warning' : 'success',
        `تم إنشاء ${inserted?.length || 0} سجل حصة جديد. ${calendarWarning ? 'سجلات الحصص محفوظة، لكن تعذرت مزامنة بعضها مع تقويم الطلاب.' : 'وتمت مزامنتها مع تقويم الطلاب.'}`
      );
      setShowGenerateConfirm(false);
      await onRefresh?.();
    } catch (e: any) {
      toast.push('error', e?.message || 'تعذر إنشاء الحصص الأسبوعية.');
    } finally {
      setGeneratingSessions(false);
    }
  };

  const openSession = (session: SessionItem) => {
    setSelectedSessionId((current) => current === session.id ? null : session.id);
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي الحصص', value: attendanceStats.sessions, icon: CalendarDays, tone: 'blue' },
          { label: 'سجلات الحضور', value: attendanceStats.recorded, icon: ClipboardList, tone: 'violet' },
          { label: 'حاضر', value: attendanceStats.present, icon: CheckCircle2, tone: 'emerald' },
          { label: 'غياب', value: attendanceStats.absent, icon: UserX, tone: 'amber' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
                item.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' :
                item.tone === 'violet' ? 'bg-violet-50 text-violet-700' :
                item.tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
              }`}><Icon className="h-4 w-4" /></div>
              <div className="text-[11px] font-bold text-slate-500">{item.label}</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{item.value}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-blue-100 bg-gradient-to-l from-blue-50 to-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-black text-[#1E3A8A]">دفتر الحصص</h3>
            <p className="mt-1 text-xs leading-6 text-slate-600">كل حصة بتاريخها وموعدها وعدد طلاب المجموعة وسجل حضور كل طالب. افتح الحصة لتصحيح الحضور أو إضافة تقييم يُحفَظ في ملف الطالب.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Btn size="sm" disabled={!scheduleSlots.length || generatingSessions} onClick={() => setShowGenerateConfirm(true)}>
              {generatingSessions ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarDays className="h-3.5 w-3.5" />} تجهيز 8 أسابيع
            </Btn>
            <Btn variant="secondary" size="sm" onClick={() => { void loadAttendanceRows(); void onRefresh?.(); }}>
              <RefreshCw className={`h-3.5 w-3.5 ${loadingRecords ? 'animate-spin' : ''}`} /> تحديث السجلات
            </Btn>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {([
            ['all', 'كل الحصص'],
            ['upcoming', 'القادمة'],
            ['past', 'السابقة'],
          ] as [LedgerFilter, string][]).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)} className={`rounded-xl border px-3 py-2 text-[11px] font-black transition ${
              filter === key ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50'
            }`}>{label}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-400 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50">
          <Search className="h-4 w-4" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full min-w-0 bg-transparent text-xs font-bold text-slate-800 outline-none sm:w-52" placeholder="ابحث باسم الحصة أو التاريخ..." />
        </label>
      </div>

      {recordsError && <ErrorBlock message={recordsError} onRetry={() => void loadAttendanceRows()} />}
      {loadingRecords && attendanceRows.length === 0 ? (
        <Card><div className="py-8 text-center text-xs font-bold text-slate-500"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-blue-600" />جاري تحميل سجلات الحضور...</div></Card>
      ) : filteredSessions.length === 0 ? (
        <Card><EmptyState title={sessions.length ? 'لا توجد حصص مطابقة للبحث' : 'لا توجد حصص مسجلة للمجموعة'} description="أضف الحصص من تبويب الحصص والمواعيد، وستظهر هنا مع سجلها." icon={<CalendarDays className="h-6 w-6" />} /></Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const records = recordsForSession(session);
            const present = records.filter((row) => row.status === 'present').length;
            const late = records.filter((row) => row.status === 'late').length;
            const absent = records.filter((row) => row.status === 'absent').length;
            const marked = new Set(records.map((row) => row.student_id).filter(Boolean)).size;
            const opened = selectedSessionId === session.id;
            return (
              <Card key={session.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      session.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                      session.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-blue-50 text-blue-700'
                    }`}><CalendarDays className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900">{session.title || 'حصة المجموعة'}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{weekdayAr(session.session_date)}، {fmtDate(session.session_date)}</span>
                        <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{fmtDateTime(session.starts_at)}{session.ends_at ? ` — ${new Date(session.ends_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                        {session.location && <span>{session.location}</span>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">طلاب المجموعة: {students.length}</span>
                        <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">سُجّل: {marked}/{students.length}</span>
                        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">حاضر {present}</span>
                        <span className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700">متأخر {late}</span>
                        <span className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-black text-red-700">غائب {absent}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={session.status} size="sm" />
                    <Btn size="sm" variant={opened ? 'secondary' : 'primary'} onClick={() => openSession(session)}>
                      <ClipboardList className="h-3.5 w-3.5" />{opened ? 'إغلاق السجل' : 'فتح سجل الحصة'}
                      {opened ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Btn>
                  </div>
                </div>

                {opened && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {([
                        ['حاضر', presentCount, 'bg-emerald-50 text-emerald-700'],
                        ['متأخر', lateCount, 'bg-amber-50 text-amber-700'],
                        ['غائب', absentCount, 'bg-red-50 text-red-700'],
                        ['لم يُسجّل', unmarkedCount, 'bg-slate-100 text-slate-700'],
                      ] as [string, number, string][]).map(([label, value, cls]) => <div key={label} className={`rounded-xl p-3 ${cls}`}><div className="text-[10px] font-bold">{label}</div><div className="mt-1 text-xl font-black">{value}</div></div>)}
                    </div>
                    {session.status === 'cancelled' && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">الحصة ملغاة. يمكنك مراجعة سجلاتها السابقة، لكن تسجيل حالات جديدة متاح للحصص الفعالة فقط.</div>}
                    <div className="mb-2 text-xs font-black text-slate-700">كشف الطلاب — كل تغيير يُحفظ في قاعدة البيانات</div>
                    {students.length === 0 ? <EmptyState title="لا يوجد طلاب نشطون في المجموعة" /> : (
                      <div className="space-y-2">
                        {students.map((student) => {
                          const record = records.find((row) => row.student_id === student.student_id);
                          const status = record?.status || '';
                          const key = `${session.id}:${student.student_id}`;
                          const busy = busyKey === key;
                          return (
                            <div key={student.student_id} className="rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><UserRound className="h-4 w-4" /></div>
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-black text-slate-900">{student.student_name}</div>
                                    <div className="mt-1 text-[10px] font-bold text-slate-500">{student.grade || 'المرحلة غير محددة'}{student.student_phone ? ` · ${student.student_phone}` : ''}</div>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {status ? <StatusBadge status={status} size="sm" /> : <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">لم يُسجّل</span>}
                                  <button type="button" disabled={!onNavigate || !student.student_id} onClick={() => student.student_id && onNavigate?.(`/teacher/students/${encodeURIComponent(student.student_id)}`)} className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[10px] font-black text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><UserRound className="me-1 inline h-3 w-3" />ملف الطالب</button>
                                  <button type="button" disabled={busy || session.status === 'cancelled'} onClick={() => void markStudent(session, student, 'present')} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-black text-emerald-700 disabled:opacity-50"><UserCheck className="me-1 inline h-3 w-3" />حاضر</button>
                                  <button type="button" disabled={busy || session.status === 'cancelled'} onClick={() => void markStudent(session, student, 'late')} className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-black text-amber-700 disabled:opacity-50">متأخر</button>
                                  <button type="button" disabled={busy || session.status === 'cancelled'} onClick={() => void markStudent(session, student, 'absent')} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] font-black text-red-700 disabled:opacity-50"><UserX className="me-1 inline h-3 w-3" />غائب</button>
                                  <button type="button" onClick={() => { setNoteStudent(student); setNoteText(''); setNoteCategory('behavior'); setNoteSeverity('info'); }} className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[10px] font-black text-violet-700"><MessageSquareText className="me-1 inline h-3 w-3" />تقييم</button>
                                  {busy && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {records.filter((row) => row.student_id && !students.some((student) => student.student_id === row.student_id)).map((row) => {
                          const formerStudent: GroupStudent = { id: row.id, student_id: row.student_id as string, student_name: row.student_name, qr_code: row.qr_code };
                          const key = `${session.id}:${formerStudent.student_id}`;
                          const busy = busyKey === key;
                          return (
                            <div key={`historical-${row.id}`} className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3">
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600"><UserRound className="h-4 w-4" /></div>
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-black text-slate-800">{row.student_name}</div>
                                    <div className="mt-1 text-[10px] font-bold text-slate-500">قيد سابق أو طالب غير نشط — السجل التاريخي محفوظ</div>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <StatusBadge status={row.status} size="sm" />
                                  {onNavigate && <button type="button" onClick={() => onNavigate(`/teacher/students/${encodeURIComponent(formerStudent.student_id)}`)} className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[10px] font-black text-blue-700"><UserRound className="me-1 inline h-3 w-3" />ملف الطالب</button>}
                                  <button type="button" disabled={busy || session.status === 'cancelled'} onClick={() => void markStudent(session, formerStudent, 'present')} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-black text-emerald-700 disabled:opacity-50">حاضر</button>
                                  <button type="button" disabled={busy || session.status === 'cancelled'} onClick={() => void markStudent(session, formerStudent, 'late')} className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-black text-amber-700 disabled:opacity-50">متأخر</button>
                                  <button type="button" disabled={busy || session.status === 'cancelled'} onClick={() => void markStudent(session, formerStudent, 'absent')} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] font-black text-red-700 disabled:opacity-50">غائب</button>
                                  <button type="button" onClick={() => { setNoteStudent(formerStudent); setNoteText(''); setNoteCategory('behavior'); setNoteSeverity('info'); }} className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[10px] font-black text-violet-700"><MessageSquareText className="me-1 inline h-3 w-3" />تقييم</button>
                                  {busy && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {showGenerateConfirm && (
        <Modal isOpen onClose={() => { if (!generatingSessions) setShowGenerateConfirm(false); }} maxWidth="lg" title="تجهيز سجلات الحصص الأسبوعية" icon={<CalendarDays className="h-5 w-5" />}>
          <div className="space-y-4" dir="rtl">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-6 text-blue-900">
              سيُنشئ النظام سجلات فعلية لكل موعد أسبوعي خلال الـ 8 أسابيع القادمة، بتاريخ ووقت مستقلين، ويضيفها لتقويم الطلاب. أي حصة موجودة بالفعل أو ملغاة ستظل كما هي ولن تتكرر، والحصص السابقة لن تتغير.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-[11px] font-bold text-slate-500">مواعيد أسبوعية</div><div className="mt-1 text-xl font-black text-slate-900">{scheduleSlots.length}</div></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-[11px] font-bold text-slate-500">مدة التجهيز</div><div className="mt-1 text-xl font-black text-slate-900">56 يومًا</div></div>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" size="sm" disabled={generatingSessions} onClick={() => setShowGenerateConfirm(false)}>إلغاء</Btn>
              <Btn size="sm" disabled={generatingSessions} onClick={() => void generateNextEightWeeks()}>{generatingSessions ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarDays className="h-3.5 w-3.5" />} تأكيد وتجهيز الحصص</Btn>
            </div>
          </div>
        </Modal>
      )}

      {noteStudent && (
        <Modal isOpen onClose={() => setNoteStudent(null)} maxWidth="lg" title={`تقييم الطالب: ${noteStudent.student_name}`} icon={<MessageSquareText className="h-5 w-5" />}>
          <div className="space-y-4" dir="rtl">
            <p className="text-xs leading-6 text-slate-600">التقييم ده هيتحفظ في السجل السلوكي/الأكاديمي داخل ملف الطالب، وهيفضل مرتبط بالمجموعة والمدرس.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-[11px] font-black text-slate-600">نوع الملاحظة
                <select value={noteCategory} onChange={(e) => setNoteCategory(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold">
                  <option value="behavior">سلوكي</option><option value="academic">أكاديمي</option><option value="attendance">حضور والتزام</option><option value="payment">مالي</option><option value="general">عام</option>
                </select>
              </label>
              <label className="block text-[11px] font-black text-slate-600">أهمية الملاحظة
                <select value={noteSeverity} onChange={(e) => setNoteSeverity(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold">
                  <option value="info">معلومة عادية</option><option value="warning">يحتاج متابعة</option><option value="critical">مهم وعاجل</option>
                </select>
              </label>
            </div>
            <label className="block text-[11px] font-black text-slate-600">ملاحظات المدرس
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} maxLength={1200} placeholder="مثال: ملتزم، متعاون، يحتاج متابعة في حل الواجب..." className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-xs leading-6 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50" />
            </label>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" size="sm" onClick={() => setNoteStudent(null)}>إلغاء</Btn>
              <Btn size="sm" disabled={savingNote || !noteText.trim()} onClick={() => void saveStudentNote()}>{savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquareText className="h-3.5 w-3.5" />}حفظ التقييم</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
