import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, UserRound, Percent, ClipboardList, GraduationCap } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader, StatCard, EmptyState } from '../../components/common/ui';

export const ParentGradesPage: React.FC = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!supabase || !user?.uid) return;
      const { data } = await supabase.from('parent_children').select('child_id,child_name,student_grade').eq('parent_id', user.uid);
      const rows = data || [];
      setChildren(rows);
      if (!selected && rows[0]?.child_id) setSelected(rows[0].child_id);
      setLoading(false);
    };
    void load();
  }, [user?.uid]);

  useEffect(() => {
    const load = async () => {
      if (!supabase || !selected) { setGrades([]); return; }
      const { data } = await supabase.from('grade_records').select('*').eq('student_id', selected).order('recorded_at', { ascending: false });
      setGrades(data || []);
    };
    void load();
  }, [selected]);

  const avg = useMemo(() => grades.length ? Math.round(grades.reduce((s, r) => s + (Number(r.score) / Number(r.max_score)) * 100, 0) / grades.length) : 0, [grades]);

  return <div className="space-y-4 text-right" dir="rtl">
    <PageHeader title="درجات الأبناء 📊" description="عرض درجات كل ابن ومتوسط الأداء وآخر النتائج." />
    {children.length > 0 && <div className="flex flex-wrap gap-2">{children.map(c => <button key={c.child_id} onClick={()=>setSelected(c.child_id)} className={`px-3.5 py-2 rounded-xl border text-xs font-black flex items-center gap-1.5 cursor-pointer ${selected===c.child_id?'bg-[#2563EB] text-white border-[#2563EB]':'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}><UserRound className="w-3.5 h-3.5"/>{c.child_name || 'ابن'}</button>)}</div>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="متوسط الأداء" value={`${avg}%`} tone={avg >= 50 ? 'emerald' : 'amber'} icon={<Percent className="w-3.5 h-3.5" />} loading={loading} />
      <StatCard label="عدد الدرجات" value={grades.length} tone="blue" icon={<ClipboardList className="w-3.5 h-3.5" />} loading={loading} />
      <StatCard label="أعلى نتيجة" value={grades.length ? `${Math.round(Math.max(...grades.map((r) => (Number(r.score) / Number(r.max_score)) * 100)))}%` : '—'} tone="violet" icon={<GraduationCap className="w-3.5 h-3.5" />} loading={loading} />
      <StatCard label="الأبناء المرتبطون" value={children.length} tone="slate" icon={<UserRound className="w-3.5 h-3.5" />} loading={loading} />
    </div>
    <Card title="سجل الدرجات">
      {!selected ? <EmptyState title="لا يوجد أبناء مرتبطون" description="اربط حساب الطالب بهذا الحساب لعرض الدرجات." />
      : grades.length === 0 ? <EmptyState title="لا توجد درجات مسجلة" description="ستظهر درجات هذا الطالب هنا فور تسجيلها من المدرس." />
      : <div className="space-y-2">{grades.map(r=><div key={r.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3"><div><div className="font-black text-[13px]">{r.title}</div><div className="text-[11px] text-gray-500 mt-0.5">{r.subject || 'عام'} • {new Date(r.recorded_at).toLocaleDateString('ar-EG')}</div></div><div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-600"/><span className="font-black text-sm tabular-nums">{r.score} / {r.max_score}</span></div></div>)}</div>}
    </Card>
  </div>;
};
