import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, FileSpreadsheet, GraduationCap, Plus, RefreshCw, Send, Users, UsersRound } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Btn, Card, ConfirmDialog, EmptyState, ErrorBlock, LoadingBlock, PageHeader, StatCard, StatusBadge, Tabs, fmtDate, fmtDateTime, fmtTime, useToast } from '../../components/common/ui';

/* ================================================================
   الامتحانات — /teacher/exams
   قائمة الامتحانات + إنشاء امتحان جديد
   ================================================================ */
export const TeacherExamsPage: React.FC<{ onNavigate: (p: string) => void; openExamId?: string }> = ({ onNavigate, openExamId }) => {
  const { user } = useAuth();
  const { push } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ title: string; group_id: string; exam_date: string; starts_at: string; duration_minutes: string; total_marks: string; location: string } | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [{ data: exams, error: e1 }, { data: grps, error: e2 }] = await Promise.all([
        supabase.from('exams').select('*').eq('tutor_id', user.uid).order('created_at', { ascending: false }).limit(100),
        supabase.from('student_groups').select('id,name,subject,grade,current_count,max_students').eq('tutor_id', user.uid).order('name'),
      ]);
      if (e1) throw e1; if (e2) throw e2;
      setRows(exams || []); setGroups(grps || []);
    } catch (e: any) { setError(e?.message || 'تعذر تحميل الامتحانات.'); } finally { setLoading(false); }
  }, [user?.uid]);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!supabase || !form || !user?.uid) return;
    if (!form.title.trim()) { push('error', 'عنوان الامتحان مطلوب.'); return; }
    if (!form.group_id) { push('error', 'اختر المجموعة.'); return; }
    if (!form.exam_date || !form.starts_at) { push('error', 'حدد تاريخ ووقت الامتحان.'); return; }
    setSaving(true);
    try {
      const group = groups.find((g) => g.id === form.group_id);
      const { data, error } = await supabase.from('exams').insert({
        tutor_id: user.uid, group_id: form.group_id, title: form.title.trim(), subject: group?.subject || null,
        exam_date: form.exam_date, starts_at: new Date(`${form.exam_date}T${form.starts_at}`).toISOString(),
        duration_minutes: Number(form.duration_minutes) || 60, total_marks: Number(form.total_marks) || 100,
        location: form.location.trim() || null, status: 'scheduled',
      }).select('*').single();
      if (error) throw error;
      push('success', 'تم إنشاء الامتحان. أضف الفترات ووزّع الطلاب.');
      setForm(null);
      onNavigate(`/teacher/exams/${data.id}`);
    } catch (e: any) { push('error', e?.message || 'تعذر إنشاء الامتحان.'); } finally { setSaving(false); }
  };

  if (openExamId) return <TeacherExamDetailPage examId={openExamId} onNavigate={onNavigate} />;

  return <div className="space-y-5" dir="rtl">
    <PageHeader title="الامتحانات" description="دورة كاملة: إنشاء ← توزيع الطلاب على الفترات ← حضور يوم الامتحان ← التصحيح ← النشر."
      actions={<>
        <Btn variant="secondary" size="sm" onClick={() => void load()}><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />تحديث</Btn>
        <Btn size="sm" onClick={() => setForm({ title: '', group_id: '', exam_date: new Date().toISOString().slice(0, 10), starts_at: '', duration_minutes: '60', total_marks: '100', location: '' })}><Plus className="w-3.5 h-3.5" />امتحان جديد</Btn>
      </>} />

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="إجمالي الامتحانات" value={rows.length} tone="blue" icon={<FileSpreadsheet className="w-4 h-4" />} loading={loading} />
      <StatCard label="مجدولة" value={rows.filter((r) => r.status === 'scheduled' || r.status === 'draft').length} tone="emerald" icon={<CalendarDays className="w-4 h-4" />} loading={loading} />
      <StatCard label="تحت التصحيح" value={rows.filter((r) => r.status === 'grading').length} tone="amber" icon={<ClipboardCheck className="w-4 h-4" />} loading={loading} />
      <StatCard label="منشورة" value={rows.filter((r) => r.status === 'published').length} tone="violet" icon={<CheckCircle2 className="w-4 h-4" />} loading={loading} />
    </div>

    {loading ? <Card><LoadingBlock rows={4} /></Card> : error ? <Card><ErrorBlock message={error} onRetry={() => void load()} /></Card> : rows.length === 0 ? <Card><EmptyState title="لا توجد امتحانات بعد" description="أنشئ أول امتحان وابدأ دورة التوزيع والحضور والتصحيح." icon={<FileSpreadsheet className="w-7 h-7" />} action={<Btn size="sm" onClick={() => setForm({ title: '', group_id: '', exam_date: new Date().toISOString().slice(0, 10), starts_at: '', duration_minutes: '60', total_marks: '100', location: '' })}><Plus className="w-3.5 h-3.5" />إنشاء امتحان</Btn>} /></Card> : (
      <div className="grid md:grid-cols-2 gap-4">{rows.map((x) => {
        const group = groups.find((g) => g.id === x.group_id);
        return <Card key={x.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap"><h3 className="font-black text-sm text-slate-900">{x.title}</h3><StatusBadge status={x.status} /></div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{fmtDate(x.exam_date)}</span>
                <span className="flex items-center gap-1.5"><UsersRound className="w-3.5 h-3.5" />{group?.name || 'المجموعة'}</span>
                <span className="flex items-center gap-1.5">⏱ {x.duration_minutes || 60} دقيقة</span>
                <span className="flex items-center gap-1.5">💯 {x.total_marks || 100} درجة</span>
              </div>
              {x.location && <div className="mt-1.5 text-[11px] text-slate-400">📍 {x.location}</div>}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Btn size="sm" className="flex-1" onClick={() => onNavigate(`/teacher/exams/${x.id}`)}>إدارة الامتحان ←</Btn>
          </div>
        </Card>;
      })}</div>
    )}

    {form && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" dir="rtl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 my-8">
          <h3 className="text-sm font-black text-slate-900">إنشاء امتحان جديد</h3>
          <div className="mt-4 space-y-3">
            <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">عنوان الامتحان *</label>
              <input value={form.title} onChange={(e) => setForm((p) => p ? { ...p, title: e.target.value } : p)} placeholder="مثال: امتحان الوحدة الرابعة — كيمياء" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" /></div>
            <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">المجموعة *</label>
              <select value={form.group_id} onChange={(e) => setForm((p) => p ? { ...p, group_id: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none">
                <option value="">اختر مجموعة...</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name} — {g.current_count} طالب</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">التاريخ *</label>
                <input type="date" value={form.exam_date} onChange={(e) => setForm((p) => p ? { ...p, exam_date: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" /></div>
              <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">وقت البداية *</label>
                <input type="time" value={form.starts_at} onChange={(e) => setForm((p) => p ? { ...p, starts_at: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" /></div>
              <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">المدة (دقيقة)</label>
                <input type="number" min={10} value={form.duration_minutes} onChange={(e) => setForm((p) => p ? { ...p, duration_minutes: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" /></div>
              <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">مجموع الدرجات</label>
                <input type="number" min={1} value={form.total_marks} onChange={(e) => setForm((p) => p ? { ...p, total_marks: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" /></div>
            </div>
            <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">الموقع / اللجنة</label>
              <input value={form.location} onChange={(e) => setForm((p) => p ? { ...p, location: e.target.value } : p)} placeholder="قاعة 3 — المركز الرئيسي" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" /></div>
          </div>
          <div className="mt-5 flex gap-2 justify-end">
            <Btn variant="secondary" size="sm" onClick={() => setForm(null)}>إلغاء</Btn>
            <Btn size="sm" disabled={saving} onClick={() => void create()}>إنشاء الامتحان</Btn>
          </div>
        </div>
      </div>
    )}
  </div>;
};

/* ================================================================
   تفاصيل الامتحان — /teacher/exams/:id
   تبويبات: التوزيع الذكي | حضور يوم الامتحان | التصحيح والنشر
   ================================================================ */
export const TeacherExamDetailPage: React.FC<{ examId: string; onNavigate: (p: string) => void }> = ({ examId, onNavigate }) => {
  const { user } = useAuth();
  const { push } = useToast();
  const [exam, setExam] = useState<any | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [groupStudents, setGroupStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('distribution');
  const [busy, setBusy] = useState(false);
  const [slotForm, setSlotForm] = useState<{ label: string; starts_at: string; room: string; capacity: string } | null>(null);
  const [publish, setPublish] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !examId) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data: ex, error: ee } = await supabase.from('exams').select('*').eq('id', examId).maybeSingle();
      if (ee || !ex) throw new Error('الامتحان غير موجود.');
      const [sl, asg, att, res] = await Promise.all([
        supabase.from('exam_slots').select('*').eq('exam_id', examId).order('starts_at'),
        supabase.from('exam_assignments').select('*').eq('exam_id', examId).order('created_at'),
        supabase.from('exam_attendance').select('*').eq('exam_id', examId).order('created_at'),
        supabase.from('exam_results').select('*').eq('exam_id', examId).order('student_name'),
      ]);
      setExam(ex); setSlots(sl.data || []); setAssignments(asg.data || []); setAttendance(att.data || []); setResults(res.data || []);
      if (ex.group_id) {
        const { data: enrolls } = await supabase.from('group_enrollments').select('student_id,student_name').eq('group_id', ex.group_id).eq('status', 'active');
        setGroupStudents(enrolls || []);
      }
    } catch (e: any) { setError(e?.message || 'تعذر تحميل بيانات الامتحان.'); } finally { setLoading(false); }
  }, [examId]);
  useEffect(() => { void load(); }, [load]);

  const addSlot = async () => {
    if (!supabase || !slotForm || !examId) return;
    if (!slotForm.label.trim() || !slotForm.starts_at) { push('error', 'أدخل اسم الفترة ووقت البداية.'); return; }
    setBusy(true);
    try {
      const starts = new Date(`${exam.exam_date}T${slotForm.starts_at}`).toISOString();
      const ends = new Date(new Date(starts).getTime() + (Number(exam.duration_minutes) || 60) * 60000).toISOString();
      const { error } = await supabase.from('exam_slots').insert({ exam_id: examId, label: slotForm.label.trim(), starts_at: starts, ends_at: ends, room: slotForm.room.trim() || null, capacity: Number(slotForm.capacity) || 35, current_count: 0 });
      if (error) throw error;
      push('success', 'تمت إضافة الفترة.');
      setSlotForm(null); await load();
    } catch (e: any) { push('error', e?.message || 'تعذر إضافة الفترة.'); } finally { setBusy(false); }
  };

  /* التوزيع الذكي: يوزع الطلاب على الفترات مع كشف النزاعات */
  const distribute = async () => {
    if (!supabase || !examId || !exam) return;
    if (!slots.length) { push('error', 'أضف فترة واحدة على الأقل قبل التوزيع.'); return; }
    if (groupStudents.length === 0) { push('error', 'لا يوجد طلاب نشطون في المجموعة.'); return; }
    setBusy(true);
    try {
      // Detect conflicts: students with another exam at overlapping time, or a lesson at same time
      const examStart = new Date(exam.starts_at); const examEnd = new Date(examStart.getTime() + (Number(exam.duration_minutes) || 60) * 60000);
      const examDay = (exam.exam_date || examStart.toISOString()).toString().slice(0, 10);
      const studentIds = groupStudents.map((s) => s.student_id).filter(Boolean);
      const [otherExams, lessons] = await Promise.all([
        supabase.from('exam_assignments').select('student_id,exam_id,slot_id,exams(exam_date,starts_at,duration_minutes)').in('student_id', studentIds).neq('exam_id', examId),
        supabase.from('lesson_sessions').select('id,group_id,starts_at,ends_at').eq('tutor_id', exam.tutor_id).gte('starts_at', examDay + 'T00:00').lte('starts_at', examDay + 'T23:59'),
      ]);
      const studentGroupsOfExam = new Set([exam.group_id]);
      // conflict = another exam for the same student ON THE SAME DAY (with overlap tolerance), or an overlapping lesson
      const conflictingExams = new Set(
        (otherExams.data || [])
          .filter((o: any) => {
            const otherDay = (o.exams?.exam_date || (o.exams?.starts_at ? String(o.exams.starts_at).slice(0, 10) : '')).toString().slice(0, 10);
            if (otherDay !== examDay) return false;
            const otherStart = o.exams?.starts_at ? new Date(o.exams.starts_at).getTime() : NaN;
            const otherEnd = otherStart + (Number(o.exams?.duration_minutes) || 60) * 60000;
            if (isNaN(otherStart)) return true; // same day, unknown time → treat as conflict
            return otherStart < examEnd.getTime() && examStart.getTime() < otherEnd;
          })
          .map((o: any) => o.student_id)
      );
      const lessonGroupIds = new Set((lessons.data || []).map((l: any) => l.group_id).filter(Boolean));
      // deterministic distribution: round-robin over slots by capacity
      const capacity = slots.map((s) => ({ id: s.id, cap: Number(s.capacity || 35), used: 0 }));
      const rows: any[] = [];
      groupStudents.forEach((student, i) => {
        let slotId: string | null = null;
        let conflict: string | null = null;
        if (conflictingExams.has(student.student_id)) conflict = 'لديه امتحان آخر في نفس اليوم';
        else if (lessonGroupIds.size && groupStudents.filter((g: any) => g.group_id && studentGroupsOfExam.has(g.group_id)).length && [...lessonGroupIds].some((lg) => studentGroupsOfExam.has(lg))) conflict = 'لديه حصة دراسية متزامنة';
        const target = capacity.find((c) => c.used < c.cap);
        if (target && !conflict) { target.used++; slotId = target.id; }
        rows.push({ exam_id: examId, slot_id: slotId, student_id: student.student_id, student_name: student.student_name, group_id: exam.group_id, conflict_reason: conflict, status: conflict ? 'unresolved' : 'assigned' });
      });
      // conflict-free students fill slots; conflicts stay unresolved (never hidden)
      const { error: del } = await supabase.from('exam_assignments').delete().eq('exam_id', examId);
      if (del) throw del;
      const { error: ins } = await supabase.from('exam_assignments').insert(rows);
      if (ins) throw ins;
      for (const c of capacity) await supabase.from('exam_slots').update({ current_count: c.used }).eq('id', c.id);
      await supabase.from('exams').update({ status: 'distributed', updated_at: new Date().toISOString() }).eq('id', examId);
      push('success', `تم التوزيع: ${rows.filter((r) => !r.conflict_reason).length} طالبًا موزعًا، ${rows.filter((r) => r.conflict_reason).length} بنزاعات مكتشفة.`);
      await load();
    } catch (e: any) { push('error', e?.message || 'تعذر تنفيذ التوزيع.'); } finally { setBusy(false); }
  };

  const startExamDay = async () => {
    if (!supabase || assignments.length === 0) { push('error', 'وزّع الطلاب أولًا.'); return; }
    setBusy(true);
    try {
      const rows = assignments.map((a) => ({ exam_id: examId, student_id: a.student_id, student_name: a.student_name, slot_id: a.slot_id, status: 'pending' }));
      const { error } = await supabase.from('exam_attendance').upsert(rows, { onConflict: 'exam_id,student_id' });
      if (error) throw error;
      await supabase.from('exams').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', examId);
      push('success', 'تم تجهيز حضور يوم الامتحان.');
      setTab('attendance'); await load();
    } catch (e: any) { push('error', e?.message || 'تعذر تجهيز الحضور.'); } finally { setBusy(false); }
  };

  const markAttendance = async (row: any, status: string) => {
    if (!supabase) return;
    try { const { error } = await supabase.from('exam_attendance').update({ status, recorded_at: new Date().toISOString() }).eq('id', row.id); if (error) throw error; setAttendance((p) => p.map((x) => x.id === row.id ? { ...x, status } : x)); }
    catch (e: any) { push('error', e?.message || 'تعذر تحديث الحضور.'); }
  };

  const startGrading = async () => {
    if (!supabase) return;
    const present = attendance.filter((a) => a.status === 'present' || a.status === 'excused');
    if (present.length === 0) { push('error', 'سجل حضور الطلاب أولًا.'); return; }
    setBusy(true);
    try {
      const rows = present.map((a) => ({ exam_id: examId, student_id: a.student_id, student_name: a.student_name, group_id: exam.group_id, earned_marks: 0, total_marks: Number(exam.total_marks) || 100, percentage: 0, status: 'draft' }));
      const { error } = await supabase.from('exam_results').upsert(rows, { onConflict: 'exam_id,student_id', ignoreDuplicates: false });
      if (error && !error.message.includes('duplicate')) throw error;
      await supabase.from('exams').update({ status: 'grading', updated_at: new Date().toISOString() }).eq('id', examId);
      push('success', 'بدأ التصحيح — أدخل درجات الطلاب.');
      setTab('grading'); await load();
    } catch (e: any) { push('error', e?.message || 'تعذر بدء التصحيح.'); } finally { setBusy(false); }
  };

  const saveResult = async (row: any, earned: string, note: string) => {
    if (!supabase || !exam) return;
    const total = Number(exam.total_marks) || 100;
    const val = Number(earned);
    if (earned === '' || isNaN(val) || val < 0 || val > total) { push('error', `درجة صحيحة من 0 إلى ${total}.`); return; }
    try {
      const { error } = await supabase.from('exam_results').update({ earned_marks: val, total_marks: total, percentage: Math.round((val / total) * 10000) / 100, teacher_note: note.trim() || null, updated_at: new Date().toISOString() }).eq('id', row.id);
      if (error) throw error;
      setResults((p) => p.map((x) => x.id === row.id ? { ...x, earned_marks: val, percentage: Math.round((val / total) * 10000) / 100 } : x));
      push('success', 'تم حفظ الدرجة (مسودة).');
    } catch (e: any) { push('error', e?.message || 'تعذر حفظ الدرجة.'); }
  };

  const publishResults = async () => {
    if (!supabase || !user?.uid || !exam) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('exam_results').update({ status: 'final', published_at: new Date().toISOString() }).eq('exam_id', examId).neq('status', 'final');
      if (error) throw error;
      // write into gradebook + notify students
      const finalResults = results.filter((r) => r.status === 'final' || true);
      await supabase.from('grade_records').insert(finalResults.filter((r: any) => r.student_id).map((r: any) => ({ student_id: r.student_id, teacher_id: exam.tutor_id, group_id: exam.group_id, exam_id: examId, title: exam.title, subject: exam.subject || null, score: r.earned_marks, max_score: r.total_marks, notes: r.teacher_note || null })));
      const presentIds = attendance.filter((a) => a.status === 'present' || a.status === 'excused').map((a) => a.student_id).filter(Boolean);
      if (presentIds.length) await supabase.from('notifications').insert(presentIds.map((uid: string) => ({ user_id: uid, title: 'نتيجة امتحان جديدة', message: `تم نشر نتيجة «${exam.title}» — تفقد درجتك الآن.`, type: 'grade', link: '/student/exam-results' })));
      const { data: parents } = await supabase.from('parent_children').select('parent_id').in('child_id', presentIds);
      const parentIds = Array.from(new Set((parents || []).map((p: any) => p.parent_id).filter(Boolean)));
      if (parentIds.length) await supabase.from('notifications').insert(parentIds.map((uid: string) => ({ user_id: uid, title: 'نتيجة امتحان ابنك/ابنتك', message: `تم نشر نتيجة «${exam.title}».`, type: 'grade', link: '/parent/grades' })));
      await supabase.from('exams').update({ status: 'published', updated_at: new Date().toISOString() }).eq('id', examId);
      push('success', 'تم نشر النتائج وإشعار الطلاب وأولياء الأمور.');
      setPublish(false); await load();
    } catch (e: any) { push('error', e?.message || 'تعذر نشر النتائج.'); } finally { setBusy(false); }
  };

  const unresolved = assignments.filter((a) => a.status === 'unresolved' || a.conflict_reason);
  const slotName = (id: string) => slots.find((s) => s.id === id)?.label || 'غير معيّن';

  if (loading) return <div dir="rtl"><div className="flex items-center gap-2 mb-4"><Btn variant="ghost" size="sm" onClick={() => onNavigate('/teacher/exams')}><ArrowRight className="w-4 h-4" />العودة للامتحانات</Btn></div><Card><LoadingBlock rows={4} /></Card></div>;
  if (error) return <div dir="rtl"><Btn variant="ghost" size="sm" onClick={() => onNavigate('/teacher/exams')}><ArrowRight className="w-4 h-4" />العودة</Btn><Card><ErrorBlock message={error} onRetry={() => void load()} /></Card></div>;
  if (!exam) return <div dir="rtl"><Card><EmptyState title="الامتحان غير موجود" action={<Btn size="sm" onClick={() => onNavigate('/teacher/exams')}>العودة للامتحانات</Btn>} /></Card></div>;

  return <div className="space-y-5" dir="rtl">
    <div className="flex items-center gap-2"><Btn variant="ghost" size="sm" onClick={() => onNavigate('/teacher/exams')}><ArrowRight className="w-4 h-4" />العودة للامتحانات</Btn></div>
    <PageHeader title={exam.title} badge={exam.status} description={`${fmtDate(exam.exam_date)} • ${fmtTime(exam.starts_at)} • ${exam.duration_minutes || 60} دقيقة • ${exam.total_marks || 100} درجة${exam.location ? ` • ${exam.location}` : ''}`} />

    {/* Workflow steps */}
    <div className="bg-white border border-slate-200 rounded-3xl p-4 flex items-center gap-2 overflow-x-auto" dir="rtl">
      {[
        { key: 'distribution', label: '1. التوزيع', done: assignments.length > 0 },
        { key: 'attendance', label: '2. حضور يوم الامتحان', done: attendance.length > 0 },
        { key: 'grading', label: '3. التصحيح', done: results.length > 0 },
        { key: 'grading', label: '4. النشر', done: exam.status === 'published' },
      ].map((s, i) => (
        <React.Fragment key={i}>
          {i > 0 && <div className={`h-px flex-1 min-w-4 ${s.done ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap ${s.done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
            {s.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />}{s.label}
          </div>
        </React.Fragment>
      ))}
    </div>

    <Tabs active={tab} onChange={setTab} tabs={[
      { key: 'distribution', label: 'التوزيع الذكي', count: assignments.length },
      { key: 'attendance', label: 'حضور الامتحان', count: attendance.length },
      { key: 'grading', label: 'التصحيح والنشر', count: results.length },
    ]} />

    {/* ============ Distribution tab ============ */}
    {tab === 'distribution' && <>
      <Card title={`فترات الامتحان (${slots.length})`} actions={<Btn size="sm" onClick={() => setSlotForm({ label: '', starts_at: '', room: '', capacity: '35' })}><Plus className="w-3.5 h-3.5" />فترة جديدة</Btn>}>
        {slots.length === 0 ? <EmptyState title="لا توجد فترات" description="أضف فترات (مجموعات لجان) لتوزيع الطلاب عليها." /> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{slots.map((s) => (
          <div key={s.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between gap-2"><span className="font-black text-xs">{s.label}</span><span className="text-[10px] font-black text-[#2563EB]">{s.current_count}/{s.capacity}</span></div>
            <div className="mt-1.5 text-[11px] text-slate-500">{fmtTime(s.starts_at)} — {fmtTime(s.ends_at)}{s.room ? ` • ${s.room}` : ''}</div>
          </div>
        ))}</div>}
      </Card>
      <Card title="التوزيع الذكي للطلاب" actions={<Btn size="sm" disabled={busy} onClick={() => void distribute()}><Users className="w-3.5 h-3.5" />توزيع الطلاب</Btn>}>
        {assignments.length === 0 ? <EmptyState title="لم يتم التوزيع بعد" description="اضغط «توزيع الطلاب» لتوزيع طلاب المجموعة على الفترات تلقائيًا مع كشف النزاعات." /> : <>
          {unresolved.length > 0 && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="text-xs font-black text-amber-800 flex items-center gap-2"><Users className="w-4 h-4" />{unresolved.length} طالبًا بنزاعات — لن يتم إخفاؤهم:</div>
            <div className="mt-2 space-y-1.5">{unresolved.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 text-[11px] bg-white rounded-xl px-3 py-2 border border-amber-100">
                <span className="font-bold text-slate-700">{a.student_name}</span>
                <span className="text-amber-700">{a.conflict_reason}</span>
                <select value={a.slot_id || ''} onChange={async (e) => { const v = e.target.value; await supabase?.from('exam_assignments').update({ slot_id: v || null, status: v ? 'moved' : 'unresolved' }).eq('id', a.id); await load(); }} className="rounded-lg border border-amber-200 text-[10px] font-bold px-2 py-1">
                  <option value="">بدون فترة</option>{slots.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            ))}</div>
          </div>}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs"><thead className="text-slate-500 border-b"><tr><th className="p-3">الطالب</th><th className="p-3">الفترة</th><th className="p-3">الحالة</th><th className="p-3">النزاع</th></tr></thead>
            <tbody className="divide-y">{assignments.filter((a) => !a.conflict_reason).map((a) => <tr key={a.id}><td className="p-3 font-bold">{a.student_name}</td><td className="p-3">{slotName(a.slot_id)}</td><td className="p-3"><StatusBadge status={a.status} /></td><td className="p-3 text-slate-400">—</td></tr>)}</tbody></table>
          </div>
          <div className="mt-4 flex justify-end"><Btn size="sm" disabled={busy || attendance.length > 0} onClick={() => void startExamDay()}>الانتقال ليوم الامتحان ←</Btn></div>
        </>}
      </Card>
    </>}

    {/* ============ Attendance tab ============ */}
    {tab === 'attendance' && <Card title={`حضور يوم الامتحان (${attendance.length})`} actions={attendance.length === 0 ? <Btn size="sm" disabled={busy} onClick={() => void startExamDay()}>تجهيز الحضور</Btn> : undefined}>
      {attendance.length === 0 ? <EmptyState title="لم يتم تجهيز الحضور" description="اضغط «تجهيز الحضور» لإنشاء قائمة حضور من التوزيع المعتمد." /> : <>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard label="حاضر" value={attendance.filter((a) => a.status === 'present').length} tone="emerald" />
          <StatCard label="غائب" value={attendance.filter((a) => a.status === 'absent').length} tone="red" />
          <StatCard label="بعذر" value={attendance.filter((a) => a.status === 'excused').length} tone="blue" />
        </div>
        <div className="space-y-2">{attendance.map((a) => (
          <div key={a.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <div><span className="font-black text-xs">{a.student_name}</span><span className="text-[10px] text-slate-400 ms-2">{slotName(a.slot_id)}</span></div>
            <div className="flex gap-1.5">
              {(['present', 'absent', 'excused'] as const).map((st) => (
                <button key={st} onClick={() => void markAttendance(a, st)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black border cursor-pointer ${a.status === st ? (st === 'present' ? 'bg-emerald-600 text-white border-emerald-600' : st === 'absent' ? 'bg-red-600 text-white border-red-600' : 'bg-blue-600 text-white border-blue-600') : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {st === 'present' ? 'حاضر' : st === 'absent' ? 'غائب' : 'بعذر'}
                </button>
              ))}
              {a.notes && <span className="text-[10px] text-slate-400 self-center">{a.notes}</span>}
            </div>
          </div>
        ))}</div>
        <div className="mt-4 flex justify-end"><Btn size="sm" disabled={busy || results.length > 0} onClick={() => void startGrading()}>بدء التصحيح ←</Btn></div>
      </>}
    </Card>}

    {/* ============ Grading tab ============ */}
    {tab === 'grading' && <Card title={`التصحيح — ${results.length} طالبًا`} actions={results.length > 0 && exam.status !== 'published' ? <Btn size="sm" variant="success" onClick={() => setPublish(true)}><Send className="w-3.5 h-3.5" />نشر النتائج</Btn> : undefined}>
      {results.length === 0 ? <EmptyState title="لم يبدأ التصحيح" description="سجّل حضور يوم الامتحان ثم اضغط «بدء التصحيح»." /> : <>
        <div className="space-y-3">{results.map((r) => <GradingRow key={r.id} row={r} total={Number(exam.total_marks) || 100} onSave={saveResult} published={exam.status === 'published'} />)}</div>
        {exam.status !== 'published' && <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-[11px] font-bold text-blue-800 leading-5">بعد النشر: سيرى الطلاب وأولياء الأمور النتائج، وستُرسل الإشعارات تلقائيًا، وسيُمنع تعديل الدرجات.</div>}
      </>}
    </Card>}

    {slotForm && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
          <h3 className="text-sm font-black text-slate-900">إضافة فترة امتحان</h3>
          <div className="mt-4 space-y-3">
            <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">اسم الفترة *</label>
              <input value={slotForm.label} onChange={(e) => setSlotForm((p) => p ? { ...p, label: e.target.value } : p)} placeholder="اللجنة الأولى" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" /></div>
            <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">وقت البداية *</label>
              <input type="time" value={slotForm.starts_at} onChange={(e) => setSlotForm((p) => p ? { ...p, starts_at: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">القاعة</label>
                <input value={slotForm.room} onChange={(e) => setSlotForm((p) => p ? { ...p, room: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" /></div>
              <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">السعة</label>
                <input type="number" min={1} value={slotForm.capacity} onChange={(e) => setSlotForm((p) => p ? { ...p, capacity: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" /></div>
            </div>
          </div>
          <div className="mt-5 flex gap-2 justify-end"><Btn variant="secondary" size="sm" onClick={() => setSlotForm(null)}>إلغاء</Btn><Btn size="sm" disabled={busy} onClick={() => void addSlot()}>إضافة الفترة</Btn></div>
        </div>
      </div>
    )}
    <ConfirmDialog open={publish} busy={busy} title="نشر نتائج الامتحان" message="سيتم إرسال النتائج للطلاب وأولياء الأمور مع إشعارات، وإضافة الدرجات لسجل الدرجات، ولن يمكن التعديل بعد النشر." confirmLabel="نشر النتائج نهائيًا" onConfirm={() => void publishResults()} onCancel={() => setPublish(false)} />
  </div>;
};

const GradingRow: React.FC<{ row: any; total: number; onSave: (row: any, earned: string, note: string) => void; published: boolean }> = ({ row, total, onSave, published }) => {
  const [earned, setEarned] = useState(String(row.earned_marks ?? ''));
  const [note, setNote] = useState(row.teacher_note || '');
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (saved) { const t = setTimeout(() => setSaved(false), 1500); return () => clearTimeout(t); } }, [saved]);
  const pct = Math.round((Number(earned || 0) / total) * 100);
  return <div className={`p-4 rounded-2xl border ${row.status === 'final' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <span className="font-black text-xs">{row.student_name}</span>
      {row.status === 'final' ? <span className="text-[10px] font-black text-emerald-700">منشورة: {row.earned_marks}/{row.total_marks} ({Math.round(Number(row.percentage))}%)</span> : <StatusBadge status={row.status} />}
    </div>
    {!published && row.status !== 'final' ? <div className="mt-3 grid sm:grid-cols-3 gap-2">
      <input value={earned} onChange={(e) => setEarned(e.target.value)} type="number" min={0} max={total} placeholder={`من ${total}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none" />
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة المعلم..." className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none sm:col-span-1" />
      <div className="flex gap-2">
        <span className={`px-3 py-2 rounded-xl text-xs font-black ${pct >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{pct}%</span>
        <Btn size="sm" className="flex-1" onClick={() => { onSave(row, earned, note); setSaved(true); }}>{saved ? '✓' : 'حفظ'}</Btn>
      </div>
    </div> : <div className="mt-2 text-[11px] text-slate-600">{row.teacher_note || 'بدون ملاحظات'} • النسبة: {Math.round(Number(row.percentage || 0))}%</div>}
  </div>;
};
