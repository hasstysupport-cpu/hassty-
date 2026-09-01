import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Phone, QrCode, Receipt, Star, UserRound, CalendarDays, NotebookPen, GraduationCap } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Btn, Card, EmptyState, ErrorBlock, LoadingBlock, PageHeader, StatCard, StatusBadge, Tabs, fmtDate, fmtDateTime, fmtMoney, useToast } from '../../components/common/ui';
import { getCleanAvatarUrl } from '../../lib/avatarHelper';

/* ================================================================
   بروفايل الطالب التفصيلي — /teacher/students/:id
   يجمع: التسجيلات، الحضور، المدفوعات، الدرجات، الملاحظات
   ================================================================ */
export const TeacherStudentProfilePage: React.FC<{ studentId: string; onNavigate: (p: string) => void }> = ({ studentId, onNavigate }) => {
  const { user } = useAuth();
  const { push } = useToast();
  const [profile, setProfile] = useState<any | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');

  const load = useCallback(async () => {
    if (!supabase || !studentId) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data: myGroups } = await supabase.from('student_groups').select('id,name,tutor_id').eq('tutor_id', user?.uid || '');
      setGroups(myGroups || []);
      const myGroupIds = (myGroups || []).map((g: any) => g.id);
      const [{ data: prof, error: pe }, { data: enrolls }, { data: att }, { data: pays }, { data: gr }, { data: nt }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', studentId).maybeSingle(),
        myGroupIds.length ? supabase.from('group_enrollments').select('*').eq('student_id', studentId).in('group_id', myGroupIds) : Promise.resolve({ data: [] as any[] }),
        supabase.from('attendance_records').select('id,date,time,status,notes,homework_status,group_id').eq('student_id', studentId).order('date', { ascending: false }).limit(150),
        supabase.from('payment_records').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(60),
        supabase.from('grade_records').select('*').eq('student_id', studentId).order('recorded_at', { ascending: false }).limit(60),
        supabase.from('student_notes').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(60),
      ]);
      if (pe || !prof) throw new Error('لم يتم العثور على الطالب.');
      setProfile(prof); setEnrollments(enrolls || []); setAttendance(att || []); setPayments(pays || []); setGrades(gr || []); setNotes(nt || []);
    } catch (e: any) { setError(e?.message || 'تعذر تحميل ملف الطالب.'); } finally { setLoading(false); }
  }, [studentId, user?.uid]);
  useEffect(() => { void load(); }, [load]);

  const groupName = useCallback((id: string) => groups.find((g) => g.id === id)?.name || 'المجموعة', [groups]);
  const present = attendance.filter((a) => a.status === 'present').length;
  const late = attendance.filter((a) => a.status === 'late').length;
  const absent = attendance.filter((a) => a.status === 'absent').length;
  const attendanceRate = attendance.length ? Math.round(((present + late) / attendance.length) * 100) : 0;
  const outstanding = payments.filter((p) => p.status === 'pending' || p.status === 'overdue').reduce((s, p) => s + Number(p.amount || 0), 0);
  const avgGrade = grades.length ? Math.round(grades.reduce((s, g) => s + (Number(g.score) / Math.max(1, Number(g.max_score))) * 100, 0) / grades.length) : 0;
  const activeEnrollment = enrollments.find((e) => e.status === 'active');

  if (loading) return <div dir="rtl"><PageHeader title="ملف الطالب" /><Card><LoadingBlock rows={4} /></Card></div>;
  if (error) return <div dir="rtl"><PageHeader title="ملف الطالب" /><Card><ErrorBlock message={error} onRetry={() => void load()} /></Card></div>;
  if (!profile) return <div dir="rtl"><PageHeader title="ملف الطالب" /><Card><EmptyState title="الطالب غير موجود" /></Card></div>;

  const avatar = getCleanAvatarUrl(profile.avatar_url, 'student', profile.full_name);

  return <div className="space-y-5" dir="rtl">
    <div className="flex items-center gap-2">
      <Btn variant="ghost" size="sm" onClick={() => onNavigate('/teacher/students')}><ArrowRight className="w-4 h-4" />العودة للطلاب</Btn>
    </div>

    {/* Header card */}
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <img src={avatar} alt={profile.full_name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-white shrink-0" referrerPolicy="no-referrer" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-black text-[#1E3A8A]">{profile.full_name}</h1>
            {activeEnrollment && <StatusBadge status={activeEnrollment.status} />}
            {activeEnrollment && <StatusBadge status={activeEnrollment.payment_status} />}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><UserRound className="w-3.5 h-3.5" />{profile.grade || 'الصف غير محدد'}</span>
            {profile.governorate && <span>{profile.governorate} {profile.city ? `— ${profile.city}` : ''}</span>}
            {profile.qr_code && <span className="flex items-center gap-1 font-mono text-blue-700" dir="ltr"><QrCode className="w-3.5 h-3.5" />{profile.qr_code}</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
            <span className="font-mono text-blue-700" dir="ltr">📞 {profile.phone || '—'}</span>
            {activeEnrollment?.parent_phone && <span className="font-mono text-slate-500" dir="ltr">👨‍👩‍👦 {activeEnrollment.parent_phone}</span>}
          </div>
        </div>
      </div>
    </Card>

    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="نسبة الحضور" value={`${attendanceRate}%`} tone={attendanceRate >= 85 ? 'emerald' : attendanceRate >= 60 ? 'amber' : 'red'} hint={`${present + late}/${attendance.length} حصة`} />
      <StatCard label="غياب / تأخير" value={`${absent} / ${late}`} tone="red" />
      <StatCard label="متوسط الدرجات" value={`${avgGrade}%`} tone="violet" hint={`${grades.length} تقييم`} />
      <StatCard label="مستحقات غير مدفوعة" value={fmtMoney(outstanding)} tone={outstanding > 0 ? 'amber' : 'emerald'} />
    </div>

    <Tabs active={tab} onChange={setTab} tabs={[
      { key: 'overview', label: 'نظرة عامة' },
      { key: 'attendance', label: 'الحضور', count: attendance.length },
      { key: 'payments', label: 'المدفوعات', count: payments.length },
      { key: 'grades', label: 'الدرجات', count: grades.length },
      { key: 'notes', label: 'الملاحظات', count: notes.length },
    ]} />

    {tab === 'overview' && <div className="grid lg:grid-cols-2 gap-4">
      <Card title="المجموعات المسجل بها">
        {enrollments.length === 0 ? <EmptyState title="غير مسجل بمجموعاتك حاليًا" /> : <div className="space-y-2">{enrollments.map((e) => (
          <div key={e.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
            <div><div className="text-xs font-black">{groupName(e.group_id)}</div><div className="text-[10px] text-slate-400">انضم {fmtDate(e.enrolled_at)}</div></div>
            <div className="flex gap-1.5"><StatusBadge status={e.status} /></div>
          </div>
        ))}</div>}
      </Card>
      <Card title="آخر 8 تسجيلات حضور">
        {attendance.length === 0 ? <EmptyState title="لا يوجد سجل حضور" /> : <div className="space-y-2">{attendance.slice(0, 8).map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-2 text-xs p-2.5 rounded-xl bg-slate-50">
            <span className="font-bold">{fmtDate(a.date)} • {a.time?.slice(0, 5)}</span>
            <StatusBadge status={a.status} />
          </div>
        ))}</div>}
      </Card>
    </div>}

    {tab === 'attendance' && <Card title={`سجل الحضور الكامل (${attendance.length})`}>
      {attendance.length === 0 ? <EmptyState title="لا يوجد سجل حضور" /> : <div className="overflow-x-auto">
        <table className="w-full text-right text-xs"><thead className="text-slate-500 border-b"><tr><th className="p-3">التاريخ</th><th className="p-3">الوقت</th><th className="p-3">المجموعة</th><th className="p-3">الواجب</th><th className="p-3">الحالة</th><th className="p-3">ملاحظات</th></tr></thead>
        <tbody className="divide-y">{attendance.map((a) => <tr key={a.id}><td className="p-3 font-bold">{fmtDate(a.date)}</td><td className="p-3">{a.time?.slice(0, 5)}</td><td className="p-3">{groupName(a.group_id)}</td><td className="p-3">{a.homework_status === 'completed' ? '✔' : a.homework_status === 'partial' ? 'جزئي' : '✘'}</td><td className="p-3"><StatusBadge status={a.status} /></td><td className="p-3 text-slate-500 max-w-40 truncate">{a.notes || '—'}</td></tr>)}</tbody></table>
      </div>}
    </Card>}

    {tab === 'payments' && <Card title={`المدفوعات (${payments.length})`}>
      {payments.length === 0 ? <EmptyState title="لا توجد مدفوعات مسجلة" /> : <div className="overflow-x-auto">
        <table className="w-full text-right text-xs"><thead className="text-slate-500 border-b"><tr><th className="p-3">الفاتورة</th><th className="p-3">المبلغ</th><th className="p-3">الفترة</th><th className="p-3">الحالة</th><th className="p-3">التاريخ</th></tr></thead>
        <tbody className="divide-y">{payments.map((p) => <tr key={p.id}><td className="p-3 font-mono text-blue-700">{p.invoice_number || '—'}</td><td className="p-3 font-black">{fmtMoney(p.amount)}</td><td className="p-3">{p.billing_period || '—'}</td><td className="p-3"><StatusBadge status={p.status} /></td><td className="p-3 text-slate-500">{fmtDate(p.created_at)}</td></tr>)}</tbody></table>
      </div>}
    </Card>}

    {tab === 'grades' && <Card title={`الدرجات (${grades.length})`}>
      {grades.length === 0 ? <EmptyState title="لا توجد درجات مسجلة" /> : <div className="overflow-x-auto">
        <table className="w-full text-right text-xs"><thead className="text-slate-500 border-b"><tr><th className="p-3">التقييم</th><th className="p-3">المادة</th><th className="p-3">الدرجة</th><th className="p-3">النسبة</th><th className="p-3">التاريخ</th></tr></thead>
        <tbody className="divide-y">{grades.map((g) => <tr key={g.id}><td className="p-3 font-black">{g.title}</td><td className="p-3">{g.subject || '—'}</td><td className="p-3">{g.score} / {g.max_score}</td><td className="p-3 font-black text-[#2563EB]">{Math.round((Number(g.score) / Math.max(1, Number(g.max_score))) * 100)}%</td><td className="p-3 text-slate-500">{fmtDate(g.recorded_at)}</td></tr>)}</tbody></table>
      </div>}
    </Card>}

    {tab === 'notes' && <Card title={`الملاحظات السلوكية والأكاديمية (${notes.length})`} actions={<Btn size="sm" variant="secondary" onClick={() => onNavigate('/teacher/student-notes')}><NotebookPen className="w-3.5 h-3.5" />إدارة الملاحظات</Btn>}>
      {notes.length === 0 ? <EmptyState title="لا توجد ملاحظات" description="أضف ملاحظات سلوكية وأكاديمية من صفحة ملاحظات الطلاب." /> : <div className="space-y-2">{notes.map((n) => (
        <div key={n.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 flex-wrap"><StatusBadge status={n.severity === 'critical' ? 'rejected' : n.severity === 'warning' ? 'pending' : 'approved'} label={n.severity === 'critical' ? 'حرج' : n.severity === 'warning' ? 'تحذير' : n.severity === 'positive' ? 'إيجابي' : 'معلومة'} /><span className="text-[10px] text-slate-400">{fmtDateTime(n.created_at)}</span></div>
          <p className="mt-1.5 text-xs text-slate-700 leading-6">{n.note}</p>
        </div>
      ))}</div>}
    </Card>}
  </div>;
};

/* ================================================================
   ملاحظات الطلاب — /teacher/student-notes
   ================================================================ */
export const TeacherStudentNotesPage: React.FC<{ onNavigate?: (p: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { push } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ student_id: string; category: string; severity: string; note: string }>({ student_id: '', category: 'behavior', severity: 'info', note: '' });
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data: groups } = await supabase.from('student_groups').select('id').eq('tutor_id', user.uid);
      const ids = (groups || []).map((g: any) => g.id);
      let enrolls: any[] = [];
      if (ids.length) { const { data } = await supabase.from('group_enrollments').select('student_id,student_name,group_id,grade').in('group_id', ids).eq('status', 'active'); enrolls = data || []; }
      const studentIds = Array.from(new Set(enrolls.map((e) => e.student_id).filter(Boolean)));
      const { data: nt } = studentIds.length ? await supabase.from('student_notes').select('*').in('student_id', studentIds).order('created_at', { ascending: false }).limit(200) : { data: [] as any[] };
      const map = new Map<string, string>();
      enrolls.forEach((e: any) => map.set(e.student_id, e.student_name));
      setStudents(enrolls.map((e: any) => ({ id: e.student_id, name: e.student_name, group_id: e.group_id })));
      setNotes((nt || []).map((n: any) => ({ ...n, _student: map.get(n.student_id) || 'طالب' })));
    } catch (e: any) { setError(e?.message || 'تعذر تحميل الملاحظات.'); } finally { setLoading(false); }
  }, [user?.uid]);
  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!supabase || !user?.uid) return;
    if (!form.student_id) { push('error', 'اختر الطالب.'); return; }
    if (!form.note.trim()) { push('error', 'اكتب نص الملاحظة.'); return; }
    setSaving(true);
    try {
      const student = students.find((s) => s.id === form.student_id);
      const { error } = await supabase.from('student_notes').insert({ student_id: form.student_id, group_id: student?.group_id || null, teacher_id: user.uid, category: form.category, severity: form.severity, note: form.note.trim() });
      if (error) throw error;
      push('success', 'تمت إضافة الملاحظة.');
      setForm({ student_id: '', category: 'behavior', severity: 'info', note: '' });
      await load();
    } catch (e: any) { push('error', e?.message || 'تعذر حفظ الملاحظة.'); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!supabase) return;
    try { const { error } = await supabase.from('student_notes').delete().eq('id', id); if (error) throw error; push('success', 'تم حذف الملاحظة.'); await load(); }
    catch (e: any) { push('error', e?.message || 'تعذر الحذف.'); }
  };

  const visible = filter === 'all' ? notes : notes.filter((n) => n.category === filter);
  const cats = [['all', 'الكل'], ['behavior', 'سلوكي'], ['academic', 'أكاديمي'], ['attendance', 'حضور'], ['payment', 'مالي'], ['general', 'عام']];

  return <div className="space-y-5" dir="rtl">
    <PageHeader title="ملاحظات الطلاب" description="توثيق السلوك والأداء الأكاديمي والملاحظات المالية لكل طالب — تظهر أيضًا في ملف الطالب." />
    <Card title="إضافة ملاحظة جديدة">
      <div className="grid sm:grid-cols-3 gap-3">
        <select value={form.student_id} onChange={(e) => setForm((p) => ({ ...p, student_id: e.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100">
          <option value="">اختر الطالب...</option>
          {students.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none">
          {cats.slice(1).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={form.severity} onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none">
          <option value="info">معلومة</option><option value="positive">إيجابية</option><option value="warning">تحذير</option><option value="critical">حرجة</option>
        </select>
      </div>
      <textarea value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="نص الملاحظة..." rows={3} className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100" />
      <div className="mt-3 flex justify-end"><Btn size="sm" disabled={saving} onClick={() => void add()}>حفظ الملاحظة</Btn></div>
    </Card>

    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {cats.map(([k, v]) => <button key={k} onClick={() => setFilter(k)} className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap border cursor-pointer ${filter === k ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-slate-600 border-slate-200'}`}>{v}</button>)}
    </div>

    {loading ? <Card><LoadingBlock /></Card> : error ? <Card><ErrorBlock message={error} onRetry={() => void load()} /></Card> : visible.length === 0 ? <Card><EmptyState title="لا توجد ملاحظات" description="أضف أول ملاحظة من النموذج بالأعلى." /></Card> : (
      <div className="space-y-3">{visible.map((n) => (
        <Card key={n.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {onNavigate && n.student_id ? <button onClick={() => onNavigate(`/teacher/students/${n.student_id}`)} className="font-black text-sm text-[#2563EB] hover:underline cursor-pointer">{n._student}</button> : <span className="font-black text-sm">{n._student}</span>}
                <StatusBadge status={n.severity === 'critical' ? 'rejected' : n.severity === 'warning' ? 'pending' : 'approved'} label={n.severity === 'critical' ? 'حرج' : n.severity === 'warning' ? 'تحذير' : n.severity === 'positive' ? 'إيجابي' : 'معلومة'} />
              </div>
              <p className="mt-1.5 text-xs text-slate-700 leading-6">{n.note}</p>
              <div className="mt-1 text-[10px] text-slate-400">{fmtDateTime(n.created_at)}</div>
            </div>
            <Btn size="sm" variant="danger" onClick={() => void remove(n.id)}>حذف</Btn>
          </div>
        </Card>
      ))}</div>
    )}
  </div>;
};
