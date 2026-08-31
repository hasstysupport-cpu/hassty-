import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ClipboardCheck, GraduationCap, MapPin, Percent, Save, Send, Trophy } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Btn, Card, EmptyState, ErrorBlock, LoadingBlock, PageHeader, StatCard, StatusBadge, fmtDate, fmtDateTime, fmtTime, useToast } from '../../components/common/ui';

/* ================================================================
   امتحانات الطالب — /student/exams
   ================================================================ */
export const StudentExamsPage: React.FC = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      // my groups
      const { data: myEnrollments } = await supabase.from('group_enrollments').select('group_id').eq('student_id', user.uid).eq('status', 'active');
      const groupIds = (myEnrollments || []).map((e: any) => e.group_id).filter(Boolean);
      if (!groupIds.length) { setRows([]); return; }
      const [ex, asg] = await Promise.all([
        supabase.from('exams').select('id,title,subject,exam_date,starts_at,duration_minutes,total_marks,location,status,group_id').in('group_id', groupIds).in('status', ['scheduled', 'distributed', 'in_progress', 'grading', 'published']).order('exam_date', { ascending: true }),
        supabase.from('exam_assignments').select('exam_id,slot_id,status').eq('student_id', user.uid),
      ]);
      const asgMap = new Map((asg.data || []).map((a: any) => [a.exam_id, a]));
      const slotIds = (asg.data || []).map((a: any) => a.slot_id).filter(Boolean);
      const { data: slots } = slotIds.length ? await supabase.from('exam_slots').select('id,label,starts_at,room').in('id', slotIds) : { data: [] as any[] };
      const slotMap = new Map((slots || []).map((s: any) => [s.id, s]));
      setRows((ex.data || []).map((x: any) => { const a = asgMap.get(x.id); const s = a?.slot_id ? slotMap.get(a.slot_id) : null; return { ...x, _slot: s, _assignment_status: a?.status || null }; }));
    } catch (e: any) { setError(e?.message || 'تعذر تحميل الامتحانات.'); } finally { setLoading(false); }
  }, [user?.uid]);
  useEffect(() => { void load(); }, [load]);

  const now = Date.now();
  const upcoming = rows.filter((r) => r.starts_at && new Date(r.starts_at).getTime() >= now && r.status !== 'published' && r.status !== 'cancelled');

  return <div className="space-y-5" dir="rtl">
    <PageHeader title="الامتحانات" description="كل امتحانات مجموعاتك مع الفترة واللجنة المعينة لك لكل امتحان." />
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <StatCard label="امتحانات قادمة" value={upcoming.length} tone="blue" icon={<CalendarDays className="w-4 h-4" />} loading={loading} />
      <StatCard label="امتحانات أُنجزت" value={rows.filter((r) => r.status === 'published').length} tone="emerald" icon={<CheckCircle2 className="w-4 h-4" />} loading={loading} />
      <StatCard label="إجمالي الامتحانات" value={rows.length} tone="violet" icon={<ClipboardCheck className="w-4 h-4" />} loading={loading} />
    </div>
    {loading ? <Card><LoadingBlock rows={3} /></Card> : error ? <Card><ErrorBlock message={error} onRetry={() => void load()} /></Card> : rows.length === 0 ? <Card><EmptyState title="لا توجد امتحانات حاليًا" description="ستظهر امتحانات مجموعاتك هنا فور جدولتها من المدرس." /></Card> : (
      <div className="space-y-3">{rows.map((x) => (
        <Card key={x.id}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap"><h3 className="font-black text-sm text-slate-900">{x.title}</h3><StatusBadge status={x.status} /></div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{fmtDate(x.exam_date)}</span>
                <span className="flex items-center gap-1">⏰ {fmtTime(x.starts_at)}</span>
                <span>⏱ {x.duration_minutes || 60} دقيقة</span>
                <span>💯 {x.total_marks || 100} درجة</span>
                {x.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{x.location}</span>}
              </div>
              {x._slot ? (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-[11px] font-black text-blue-800">
                  لجنتك: {x._slot.label} • {fmtTime(x._slot.starts_at)}{x._slot.room ? ` • ${x._slot.room}` : ''}
                </div>
              ) : x._assignment_status === 'unresolved' ? (
                <div className="mt-2 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5 inline-block">لم تُوزَّع على لجنة بعد — ينسّقها المدرس قريبًا.</div>
              ) : null}
            </div>
          </div>
        </Card>
      ))}</div>
    )}
  </div>;
};

/* ================================================================
   نتائج الامتحانات — /student/exam-results
   ================================================================ */
export const StudentExamResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data, error: e } = await supabase.from('exam_results').select('*, exams(title,subject,exam_date,group_id)').eq('student_id', user.uid).eq('status', 'final').order('published_at', { ascending: false }).limit(100);
      if (e) throw e;
      setRows(data || []);
    } catch (e: any) { setError(e?.message || 'تعذر تحميل النتائج.'); } finally { setLoading(false); }
  }, [user?.uid]);
  useEffect(() => { void load(); }, [load]);

  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + Number(r.percentage || 0), 0) / rows.length) : 0;
  const best = rows.length ? Math.max(...rows.map((r) => Number(r.percentage || 0))) : 0;

  return <div className="space-y-5" dir="rtl">
    <PageHeader title="نتائج الامتحانات" description="درجاتك المنشورة في الامتحانات بعد اعتماد المدرس لها." />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="المتوسط العام" value={`${avg}%`} tone={avg >= 50 ? 'emerald' : 'amber'} icon={<Percent className="w-4 h-4" />} loading={loading} />
      <StatCard label="أعلى نتيجة" value={`${Math.round(best)}%`} tone="violet" icon={<Trophy className="w-4 h-4" />} loading={loading} />
      <StatCard label="امتحانات مقيّمة" value={rows.length} tone="blue" icon={<GraduationCap className="w-4 h-4" />} loading={loading} />
      <StatCard label="ناجح" value={rows.filter((r) => Number(r.percentage) >= 50).length} tone="emerald" icon={<CheckCircle2 className="w-4 h-4" />} loading={loading} />
    </div>
    {loading ? <Card><LoadingBlock rows={3} /></Card> : error ? <Card><ErrorBlock message={error} onRetry={() => void load()} /></Card> : rows.length === 0 ? <Card><EmptyState title="لا توجد نتائج منشورة بعد" description="ستظهر درجاتك هنا فور نشر المدرس لنتائج الامتحانات." /></Card> : (
      <div className="space-y-3">{rows.map((r) => {
        const pct = Number(r.percentage || 0);
        const passed = pct >= 50;
        return <Card key={r.id}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-black text-sm text-slate-900">{r.exams?.title || 'امتحان'}</h3>
              <div className="mt-1 text-[11px] text-slate-500">{r.exams?.subject || '—'} • {fmtDate(r.exams?.exam_date)}</div>
              {r.teacher_note && <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 rounded-xl p-2.5 border border-slate-100 leading-5">💬 {r.teacher_note}</div>}
              <div className="mt-1.5 text-[10px] text-slate-400">نُشرت {fmtDateTime(r.published_at)}</div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center">
                <div className={`text-2xl font-black tabular-nums ${passed ? 'text-emerald-600' : 'text-red-600'}`}>{Math.round(pct)}%</div>
                <div className="text-[11px] font-bold text-slate-500 tabular-nums">{r.earned_marks} / {r.total_marks}</div>
              </div>
              <StatusBadge status={passed ? 'approved' : 'rejected'} label={passed ? 'ناجح' : 'راسب'} size="md" />
            </div>
          </div>
        </Card>;
      })}</div>
    )}
  </div>;
};

/* ================================================================
   إعدادات الطالب — /student/settings
   ================================================================ */
export const StudentSettingsPage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const { push } = useToast();
  const [prefs, setPrefs] = useState({ notify_assignments: true, notify_grades: true, notify_payments: true, notify_attendance: true });
  const [profile, setProfile] = useState({ full_name: '', phone: '', governorate: '', city: '', grade: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    void (async () => {
      const { data } = await supabase.from('profiles').select('full_name,phone,governorate,city,grade,metadata').eq('id', user.uid).maybeSingle();
      if (data) {
        setProfile({ full_name: data.full_name || '', phone: data.phone || '', governorate: data.governorate || '', city: data.city || '', grade: data.grade || '' });
        const meta = (data.metadata || {}) as any;
        setPrefs({ notify_assignments: meta.notify_assignments ?? true, notify_grades: meta.notify_grades ?? true, notify_payments: meta.notify_payments ?? true, notify_attendance: meta.notify_attendance ?? true });
      }
      setLoading(false);
    })();
  }, [user?.uid]);

  const save = async () => {
    if (!supabase || !user?.uid) return;
    if (!profile.full_name.trim()) { push('error', 'الاسم مطلوب.'); return; }
    if (!profile.phone.trim()) { push('error', 'رقم الهاتف مطلوب.'); return; }
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('profiles').select('metadata').eq('id', user.uid).maybeSingle();
      const meta = { ...(existing?.metadata || {}), ...prefs };
      const { error } = await supabase.from('profiles').update({ full_name: profile.full_name.trim(), phone: profile.phone.trim(), governorate: profile.governorate.trim() || null, city: profile.city.trim() || null, grade: profile.grade.trim() || null, metadata: meta, updated_at: new Date().toISOString() }).eq('id', user.uid);
      if (error) throw error;
      await updateUserProfile({ name: profile.full_name.trim(), phone: profile.phone.trim() });
      push('success', 'تم حفظ الإعدادات بنجاح.');
    } catch (e: any) { push('error', e?.message || 'تعذر حفظ الإعدادات.'); } finally { setSaving(false); }
  };

  const toggles = [
    { key: 'notify_assignments' as const, label: 'تنبيهات الواجبات الجديدة' },
    { key: 'notify_grades' as const, label: 'تنبيهات الدرجات والنتائج' },
    { key: 'notify_payments' as const, label: 'تنبيهات المدفوعات والمستحقات' },
    { key: 'notify_attendance' as const, label: 'تنبيهات الحضور والغياب' },
  ];

  if (loading) return <div dir="rtl"><PageHeader title="الإعدادات" /><Card><LoadingBlock rows={3} /></Card></div>;

  return <div className="space-y-5" dir="rtl">
    <PageHeader title="الإعدادات" description="بياناتك الشخصية وتفضيلات الإشعارات." />
    <Card title="البيانات الشخصية">
      <div className="grid sm:grid-cols-2 gap-3">
        {[['full_name', 'الاسم الكامل *'], ['phone', 'رقم الهاتف *'], ['governorate', 'المحافظة'], ['city', 'المدينة'], ['grade', 'الصف الدراسي']].map(([k, label]) => (
          <div key={k}><label className="text-[11px] font-black text-slate-500 block mb-1.5">{label}</label>
            <input value={(profile as any)[k]} onChange={(e) => setProfile((p) => ({ ...p, [k]: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100" /></div>
        ))}
      </div>
    </Card>
    <Card title="تفضيلات الإشعارات">
      <div className="space-y-2">{toggles.map((t) => (
        <button key={t.key} onClick={() => setPrefs((p) => ({ ...p, [t.key]: !p[t.key] }))} className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl border text-right cursor-pointer transition-colors ${prefs[t.key] ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-xs font-black text-slate-800">{t.label}</span>
          <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${prefs[t.key] ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${prefs[t.key] ? 'right-1' : 'right-6'}`} /></div>
        </button>
      ))}</div>
    </Card>
    <div className="flex justify-end"><Btn size="sm" disabled={saving} onClick={() => void save()}><Save className="w-3.5 h-3.5" />{saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}</Btn></div>
  </div>;
};
