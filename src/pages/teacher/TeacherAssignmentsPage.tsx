import React, { useEffect, useState } from 'react';
import { BookOpen, CalendarClock, CheckCircle2, Plus, Send } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

export const TeacherAssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    if (!supabase || !user?.uid) return;
    const { data } = await supabase.from('assignments').select('*').eq('teacher_id', user.uid).order('created_at', { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { void load(); }, [user?.uid]);

  const create = async () => {
    if (!supabase || !user?.uid || !title.trim()) return;
    setSaving(true); setNotice('');
    const { error } = await supabase.from('assignments').insert({
      teacher_id: user.uid,
      title: title.trim(),
      description: description.trim() || null,
      subject: subject.trim() || null,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      max_score: Number(maxScore) || 100,
      attachments: [],
    });
    if (error) setNotice(error.message);
    else {
      setNotice('تم إنشاء الواجب وإرساله للمجموعة المتاحة ✅');
      setTitle(''); setDescription(''); setSubject(''); setDueAt(''); setMaxScore('100');
      void load();
    }
    setSaving(false);
  };

  return <div className="space-y-5 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]" dir="rtl">
    <div><h1 className="text-2xl font-black text-[#1E3A8A]">إدارة الواجبات 📚</h1><p className="text-sm text-gray-500 mt-1">أنشئ الواجبات وحدد موعد التسليم والدرجة، ثم تابع التسليمات والتصحيح.</p></div>
    <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-4"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Plus className="w-5 h-5"/></div><div><h2 className="font-black">واجب جديد</h2><p className="text-xs text-gray-500">المرفقات يمكن ربطها لاحقًا من مساحة ملفات المنصة.</p></div></div>
      <div className="grid md:grid-cols-2 gap-3">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="عنوان الواجب" className="rounded-2xl border border-gray-200 px-4 py-3 text-sm"/>
        <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="المادة" className="rounded-2xl border border-gray-200 px-4 py-3 text-sm"/>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="وصف وتعليمات الواجب" className="md:col-span-2 min-h-28 rounded-2xl border border-gray-200 p-4 text-sm"/>
        <label className="text-xs font-bold text-gray-600">موعد التسليم<input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)} className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"/></label>
        <label className="text-xs font-bold text-gray-600">الدرجة القصوى<input type="number" min="1" value={maxScore} onChange={e=>setMaxScore(e.target.value)} className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"/></label>
      </div>
      {notice && <div className="mt-3 p-3 rounded-2xl bg-blue-50 text-blue-800 text-xs font-bold">{notice}</div>}
      <button onClick={()=>void create()} disabled={saving || !title.trim()} className="mt-4 px-5 py-3 rounded-2xl bg-[#2563EB] disabled:opacity-40 text-white text-sm font-black flex items-center gap-2"><Send className="w-4 h-4"/>{saving?'جاري الإنشاء...':'إنشاء الواجب'}</button>
    </div>
    <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs"><h2 className="font-black mb-4">الواجبات المنشورة</h2>{items.length===0?<div className="py-10 text-center text-gray-400 text-sm">لم تنشئ واجبات بعد.</div>:<div className="grid gap-3">{items.map(a=><div key={a.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center"><BookOpen className="w-5 h-5"/></div><div className="flex-1"><h3 className="font-black text-sm">{a.title}</h3><p className="text-xs text-gray-500 mt-1">{a.subject || 'عام'}{a.due_at ? ` • التسليم ${new Date(a.due_at).toLocaleString('ar-EG')}` : ''}</p><div className="mt-2 text-[10px] font-bold text-gray-500 flex gap-3"><span className="flex items-center gap-1"><CalendarClock className="w-3 h-3"/>{a.max_score} درجة</span><span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/>نشط</span></div></div></div>)}</div>}</div>
  </div>;
};
