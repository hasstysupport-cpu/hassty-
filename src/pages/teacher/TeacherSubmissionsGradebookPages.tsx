import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ClipboardCheck, Clock3, GraduationCap, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Btn, Card, DataTable, EmptyState, ErrorBlock, PageHeader, StatCard, StatusBadge, Tabs, fmtDateTime, useToast } from '../../components/common/ui';

/* ================================================================
   تسليمات الطلاب للواجبات — /teacher/assignment-submissions
   ================================================================ */
export const TeacherSubmissionsPage: React.FC<{ onNavigate?: (p: string) => void }> = () => {
  const { user } = useAuth();
  const { push } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [grading, setGrading] = useState<any | null>(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data: asg, error: ae } = await supabase.from('assignments').select('id,title,subject,max_score,due_at').eq('teacher_id', user.uid).order('due_at', { ascending: false });
      if (ae) throw ae;
      setAssignments(asg || []);
      const ids = (asg || []).map((a: any) => a.id);
      if (!ids.length) { setRows([]); return; }
      const { data: subs, error: se } = await supabase.from('assignment_submissions').select('*').in('assignment_id', ids).order('submitted_at', { ascending: false }).limit(300);
      if (se) throw se;
      const amap = new Map((asg || []).map((a: any) => [a.id, a]));
      setRows((subs || []).map((s: any) => ({ ...s, _assignment: amap.get(s.assignment_id) })));
    } catch (e: any) { setError(e?.message || 'تعذر تحميل التسليمات.'); } finally { setLoading(false); }
  }, [user?.uid]);
  useEffect(() => { void load(); }, [load]);

  const grade = async () => {
    if (!supabase || !grading || !user?.uid) return;
    const max = Number(grading._assignment?.max_score || 100);
    const val = Number(score);
    if (!score.trim() || isNaN(val) || val < 0 || val > max) { push('error', `أدخل درجة صحيحة من 0 إلى ${max}.`); return; }
    setBusy(grading.id);
    try {
      const { error } = await supabase.from('assignment_submissions').update({ status: 'graded', score: val, teacher_feedback: feedback.trim() || null, graded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', grading.id);
      if (error) throw error;
      await supabase.from('grade_records').insert({ student_id: grading.student_id, teacher_id: user.uid, assignment_id: grading.assignment_id, title: grading._assignment?.title || 'واجب', subject: grading._assignment?.subject || null, score: val, max_score: max, notes: feedback.trim() || null });
      if (grading.student_id) await supabase.from('notifications').insert({ user_id: grading.student_id, title: 'تم تصحيح واجبك', message: `درجتك في «${grading._assignment?.title}»: ${val}/${max}.`, type: 'grade', link: '/student/assignments' });
      push('success', 'تم التصحيح وتسجيل الدرجة.');
      setGrading(null); setScore(''); setFeedback('');
      await load();
    } catch (e: any) { push('error', e?.message || 'تعذر حفظ التصحيح.'); } finally { setBusy(''); }
  };

  const pending = rows.filter((r) => r.status === 'submitted' || r.status === 'late');
  const byTab = useMemo(() => tab === 'all' ? rows : tab === 'pending' ? pending : rows.filter((r) => r.status === tab), [rows, tab, pending]);

  return <div className="space-y-5" dir="rtl">
    <PageHeader title="تسليمات الطلاب" description="مراجعة تسليمات الواجبات وتصحيحها وتسجيل الدرجات تلقائيًا في سجل الدرجات."
      actions={<Btn variant="secondary" size="sm" onClick={() => void load()}><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />تحديث</Btn>} />

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="بانتظار التصحيح" value={pending.length} tone="amber" icon={<Clock3 className="w-4 h-4" />} loading={loading} />
      <StatCard label="مصححة" value={rows.filter((r) => r.status === 'graded').length} tone="emerald" icon={<CheckCircle2 className="w-4 h-4" />} loading={loading} />
      <StatCard label="إجمالي التسليمات" value={rows.length} tone="blue" icon={<ClipboardCheck className="w-4 h-4" />} loading={loading} />
      <StatCard label="واجبات نشطة" value={assignments.length} tone="violet" icon={<BookOpen className="w-4 h-4" />} loading={loading} />
    </div>

    <Tabs active={tab} onChange={setTab} tabs={[
      { key: 'pending', label: 'بانتظار التصحيح', count: pending.length },
      { key: 'graded', label: 'مصححة', count: rows.filter((r) => r.status === 'graded').length },
      { key: 'late', label: 'متأخرة', count: rows.filter((r) => r.status === 'late').length },
      { key: 'all', label: 'الكل', count: rows.length },
    ]} />

    <DataTable rows={byTab} loading={loading} error={error} onRetry={() => void load()} emptyText="لا توجد تسليمات"
      searchKeys={(r) => `${r.student_name || 'طالب'} ${r._assignment?.title || ''}`}
      searchPlaceholder="ابحث بالواجب..."
      columns={[
        { key: 'assignment', header: 'الواجب', render: (r) => <div><div className="font-black">{r._assignment?.title || '—'}</div><div className="text-[10px] text-slate-400">{r._assignment?.subject || 'عام'}</div></div> },
        { key: 'student', header: 'الطالب', render: (r) => <span className="font-bold">طالب مسجل</span> },
        { key: 'answer', header: 'الحل', render: (r) => <span className="text-slate-500 text-[11px] block max-w-56 truncate">{r.answer_text ? r.answer_text.slice(0, 60) + (r.answer_text.length > 60 ? '...' : '') : 'بدون نص'}</span>, hideOnMobile: true },
        { key: 'submitted_at', header: 'تاريخ التسليم', render: (r) => fmtDateTime(r.submitted_at), hideOnMobile: true },
        { key: 'status', header: 'الحالة', render: (r) => <StatusBadge status={r.status} /> },
        { key: 'actions', header: 'إجراءات', render: (r) => r.status === 'submitted' || r.status === 'late' ? (
          <Btn size="sm" onClick={() => { setGrading(r); setScore(r.score ? String(r.score) : ''); setFeedback(r.teacher_feedback || ''); }}><GraduationCap className="w-3.5 h-3.5" />تصحيح</Btn>
        ) : <span className="text-[11px] font-black text-emerald-700">{r.score ?? '—'} / {r._assignment?.max_score || 100}</span> },
      ]} />

    {grading && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" dir="rtl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 my-8">
          <h3 className="text-sm font-black text-slate-900">تصحيح: {grading._assignment?.title}</h3>
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 max-h-52 overflow-y-auto text-xs text-slate-700 leading-6 whitespace-pre-wrap">{grading.answer_text || 'لا يوجد نص — مرفقات فقط.'}</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">الدرجة (من {grading._assignment?.max_score || 100})</label>
              <input value={score} onChange={(e) => setScore(e.target.value)} type="number" min={0} max={grading._assignment?.max_score || 100} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" /></div>
            <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">الحالة بعد التصحيح</label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-emerald-700">مصحح ✓</div></div>
          </div>
          <div className="mt-3"><label className="text-[11px] font-black text-slate-500 block mb-1.5">ملاحظات المعلم</label>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none" placeholder="أداء جيد بشكل عام، يُنصح بمراجعة..." /></div>
          <div className="mt-5 flex gap-2 justify-end">
            <Btn variant="secondary" size="sm" onClick={() => setGrading(null)}>إلغاء</Btn>
            <Btn size="sm" disabled={!!busy} onClick={() => void grade()}><Send className="w-3.5 h-3.5" />حفظ التصحيح</Btn>
          </div>
        </div>
      </div>
    )}
  </div>;
};

/* ================================================================
   سجل الدرجات — /teacher/gradebook
   درجات الطلاب: واجبات + امتحانات لكل مجموعة
   ================================================================ */
export const TeacherGradebookPage: React.FC<{ onNavigate?: (p: string) => void }> = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [groupId, setGroupId] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data: grps } = await supabase.from('student_groups').select('id,name,subject').eq('tutor_id', user.uid).order('name');
      setGroups(grps || []);
      if (!grps?.length) { setRows([]); setStudents([]); return; }
      const first = groupId || (grps[0] as any).id;
      if (!groupId) setGroupId(first);
      const [{ data: enrolls }, { data: grades }] = await Promise.all([
        supabase.from('group_enrollments').select('student_id,student_name').eq('group_id', first).eq('status', 'active'),
        supabase.from('grade_records').select('*').eq('group_id', first).order('recorded_at', { ascending: false }),
      ]);
      setStudents(enrolls || []);
      const ids = (enrolls || []).map((e: any) => e.student_id).filter(Boolean);
      const { data: examResults } = ids.length ? await supabase.from('exam_results').select('*').in('student_id', ids).eq('status', 'final') : { data: [] as any[] };
      const rowsMap = new Map<string, any>();
      (enrolls || []).forEach((e: any) => { if (e.student_id) rowsMap.set(e.student_id, { student_id: e.student_id, name: e.student_name, records: [], examRecords: [] }); });
      (grades || []).forEach((g: any) => { const r = rowsMap.get(g.student_id); if (r) r.records.push(g); });
      (examResults || []).forEach((x: any) => { const r = rowsMap.get(x.student_id); if (r) r.examRecords.push(x); });
      setRows(Array.from(rowsMap.values()));
    } catch (e: any) { setError(e?.message || 'تعذر تحميل سجل الدرجات.'); } finally { setLoading(false); }
  }, [user?.uid, groupId]);
  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => {
    const all = rows.flatMap((r) => [...r.records.map((g: any) => Number(g.score) / Math.max(1, Number(g.max_score))), ...r.examRecords.map((x: any) => Number(x.percentage) / 100)]);
    return { avg: all.length ? Math.round((all.reduce((s: number, v: number) => s + v, 0) / all.length) * 100) : 0, total: all.length, top: all.length ? Math.round(Math.max(...all) * 100) : 0 };
  }, [rows]);

  return <div className="space-y-5" dir="rtl">
    <PageHeader title="سجل الدرجات" description="ملخص درجات كل طالب في المجموعة — واجبات وامتحانات — مع المتوسط وأعلى درجة." />
    <div className="flex gap-2 overflow-x-auto pb-1">
      {groups.map((g) => <button key={g.id} onClick={() => setGroupId(g.id)} className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap border cursor-pointer ${groupId === g.id ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-slate-600 border-slate-200'}`}>{g.name}</button>)}
    </div>
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="متوسط المجموعة" value={`${stats.avg}%`} tone="blue" loading={loading} />
      <StatCard label="عدد التقييمات" value={stats.total} tone="violet" loading={loading} />
      <StatCard label="أعلى درجة" value={`${stats.top}%`} tone="emerald" loading={loading} />
    </div>
    {loading ? <Card><div className="py-10 text-center text-sm text-slate-500">جاري التحميل...</div></Card>
      : error ? <Card><ErrorBlock message={error} onRetry={() => void load()} /></Card>
      : rows.length === 0 ? <Card><EmptyState title="لا يوجد طلاب في هذه المجموعة" /></Card>
      : <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="text-slate-500 border-b"><tr><th className="p-3">الطالب</th><th className="p-3">واجبات</th><th className="p-3">امتحانات</th><th className="p-3">المتوسط العام</th></tr></thead>
            <tbody className="divide-y">{rows.map((r: any) => {
              const vals = [...r.records.map((g: any) => Number(g.score) / Math.max(1, Number(g.max_score))), ...r.examRecords.map((x: any) => Number(x.percentage) / 100)];
              const avg = vals.length ? Math.round((vals.reduce((s: number, v: number) => s + v, 0) / vals.length) * 100) : 0;
              return <tr key={r.student_id} className="hover:bg-slate-50">
                <td className="p-3 font-black">{r.name}</td>
                <td className="p-3">{r.records.map((g: any, i: number) => <span key={i} className="inline-block me-1.5 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black">{g.title}: {g.score}/{g.max_score}</span>)}</td>
                <td className="p-3">{r.examRecords.length ? r.examRecords.map((x: any, i: number) => <span key={i} className="inline-block me-1.5 px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 text-[10px] font-black">{x.earned_marks}/{x.total_marks}</span>) : <span className="text-slate-400">—</span>}</td>
                <td className="p-3 font-black"><span className={`px-2 py-1 rounded-lg ${avg >= 75 ? 'bg-emerald-50 text-emerald-700' : avg >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{avg}%</span></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </Card>}
  </div>;
};
