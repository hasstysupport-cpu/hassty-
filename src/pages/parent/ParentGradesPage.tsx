import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, UserRound } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

export const ParentGradesPage: React.FC = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!supabase || !user?.uid) return;
      const { data } = await supabase.from('parent_children').select('child_id,child_name,student_grade').eq('parent_id', user.uid);
      const rows = data || [];
      setChildren(rows);
      if (!selected && rows[0]?.child_id) setSelected(rows[0].child_id);
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

  return <div className="space-y-5 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]" dir="rtl">
    <div><h1 className="text-2xl font-black text-[#1E3A8A]">درجات الأبناء 📊</h1><p className="text-sm text-gray-500 mt-1">عرض درجات كل ابن ومتوسط الأداء وآخر النتائج.</p></div>
    {children.length > 0 && <div className="flex flex-wrap gap-2">{children.map(c => <button key={c.child_id} onClick={()=>setSelected(c.child_id)} className={`px-4 py-2 rounded-xl border text-xs font-black ${selected===c.child_id?'bg-[#2563EB] text-white border-[#2563EB]':'bg-white text-gray-700 border-gray-200'}`}><UserRound className="inline w-4 h-4 ml-1"/>{c.child_name || 'ابن'}</button>)}</div>}
    <div className="grid grid-cols-2 gap-4"><div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs"><div className="text-xs text-gray-500">متوسط الأداء</div><div className="text-3xl font-black text-[#2563EB] mt-1">{avg}%</div></div><div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs"><div className="text-xs text-gray-500">عدد الدرجات</div><div className="text-3xl font-black text-[#1E3A8A] mt-1">{grades.length}</div></div></div>
    <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs">{!selected?<div className="py-10 text-center text-gray-400">اربط حساب الطالب بهذا الحساب لعرض الدرجات.</div>:grades.length===0?<div className="py-10 text-center text-gray-400">لا توجد درجات مسجلة لهذا الطالب حتى الآن.</div>:<div className="space-y-2">{grades.map(r=><div key={r.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3"><div><div className="font-black text-sm">{r.title}</div><div className="text-xs text-gray-500 mt-1">{r.subject || 'عام'} • {new Date(r.recorded_at).toLocaleDateString('ar-EG')}</div></div><div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-600"/><span className="font-black text-sm">{r.score} / {r.max_score}</span></div></div>)}</div>}</div>
  </div>;
};
