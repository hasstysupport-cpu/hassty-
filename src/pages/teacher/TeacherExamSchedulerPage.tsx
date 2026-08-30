import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Loader2, Plus, RefreshCw, Save, Sparkles, Trash2, Users, XCircle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

type Group = { id: string; name: string; subject?: string; grade?: string };
type SlotDraft = { id: string; label: string; startsAt: string; endsAt: string; capacity: number };
type PreviewRow = { student_id: string; student_name: string; original_group_id: string; proposed_slot_id: string | null; proposed_slot_label: string | null; conflict_code: string; conflict_reason: string; priority_score: number };

const localToISO = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error('موعد غير صالح.');
  return d.toISOString();
};

const makeSlot = (index: number): SlotDraft => ({ id: crypto.randomUUID(), label: `المجموعة ${index + 1}`, startsAt: '17:00', endsAt: '18:00', capacity: 10 });

export const TeacherExamSchedulerPage: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [notices, setNotices] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [title, setTitle] = useState('امتحان المجموعة');
  const [groupId, setGroupId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [duration, setDuration] = useState(60);
  const [maxScore, setMaxScore] = useState(100);
  const [instructions, setInstructions] = useState('');
  const [slots, setSlots] = useState<SlotDraft[]>([makeSlot(0), makeSlot(1)]);
  const [examId, setExamId] = useState('');
  const [preview, setPreview] = useState<PreviewRow[]>([]);

  const load = async () => {
    if (!supabase || !user?.uid) return;
    setLoading(true);
    setNotices(null);
    try {
      const { data, error } = await supabase.from('student_groups').select('id,name,subject,grade').eq('tutor_id', user.uid).order('created_at', { ascending: false });
      if (error) throw error;
      const rows = data || [];
      setGroups(rows);
      setGroupId(prev => prev && rows.some((g: Group) => g.id === prev) ? prev : rows[0]?.id || '');
    } catch (e: any) {
      setNotices({ kind: 'error', text: e?.message || 'تعذر تحميل المجموعات.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [user?.uid]);

  const selectedGroup = useMemo(() => groups.find(g => g.id === groupId) || null, [groups, groupId]);
  const totalCapacity = useMemo(() => slots.reduce((n, s) => n + Math.max(0, Number(s.capacity) || 0), 0), [slots]);
  const conflictCount = preview.filter(r => r.proposed_slot_id === null).length;

  const updateSlot = (id: string, patch: Partial<SlotDraft>) => setSlots(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  const addSlot = () => setSlots(prev => [...prev, makeSlot(prev.length)]);
  const removeSlot = (id: string) => setSlots(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);

  const createOrReuseExam = async () => {
    if (!supabase || !user?.uid) throw new Error('جلسة المستخدم غير متاحة.');
    if (!groupId) throw new Error('اختر مجموعة أولًا.');
    if (!title.trim()) throw new Error('اكتب اسم الامتحان.');
    if (!examDate) throw new Error('حدد تاريخ الامتحان.');
    if (slots.some(s => !s.startsAt || !s.endsAt || s.endsAt <= s.startsAt)) throw new Error('راجع مواعيد المجموعات؛ وقت النهاية يجب أن يكون بعد البداية.');

    if (examId) {
      await supabase.from('exam_slots').delete().eq('exam_id', examId);
      const { error } = await supabase.from('exams').update({ title: title.trim(), group_id: groupId, exam_date: examDate, duration_minutes: duration, max_score: maxScore, instructions: instructions || null, status: 'draft', updated_at: new Date().toISOString() }).eq('id', examId).eq('teacher_id', user.uid);
      if (error) throw error;
      return examId;
    }

    const { data: exam, error: examError } = await supabase.from('exams').insert({ teacher_id: user.uid, group_id: groupId, title: title.trim(), exam_date: examDate, duration_minutes: duration, max_score: maxScore, instructions: instructions || null, status: 'draft' }).select('id').single();
    if (examError) throw examError;

    const slotRows = slots.map(s => ({ exam_id: exam.id, label: s.label.trim() || 'موعد امتحان', starts_at: localToISO(`${examDate}T${s.startsAt}:00`), ends_at: localToISO(`${examDate}T${s.endsAt}:00`), capacity: Math.max(1, Number(s.capacity) || 1) }));
    const { error: slotError } = await supabase.from('exam_slots').insert(slotRows);
    if (slotError) throw slotError;
    return exam.id as string;
  };

  const previewDistribution = async () => {
    if (!supabase) return;
    setPreviewing(true); setNotices(null);
    try {
      const id = await createOrReuseExam();
      setExamId(id);
      const { data, error } = await supabase.rpc('preview_exam_distribution', { p_exam_id: id });
      if (error) throw error;
      setPreview((data || []) as PreviewRow[]);
      setNotices({ kind: 'info', text: `تم تجهيز المعاينة. ${data?.length || 0} طالبًا، والسعة الإجمالية ${totalCapacity} طالب.` });
    } catch (e: any) {
      setNotices({ kind: 'error', text: e?.message || 'تعذر إنشاء معاينة التوزيع.' });
    } finally {
      setPreviewing(false);
    }
  };

  const finalize = async () => {
    if (!supabase) return;
    setBusy(true); setNotices(null);
    try {
      if (!examId) await previewDistribution();
      const id = examId || (await createOrReuseExam());
      setExamId(id);
      const { data, error } = await supabase.rpc('finalize_exam_distribution', { p_exam_id: id });
      if (error) throw error;
      const summary = data as { assigned_count?: number; conflict_count?: number } | null;
      setNotices({ kind: 'success', text: `تم اعتماد التوزيع ✅ تم توزيع ${summary?.assigned_count || 0} طالب، وباقي ${summary?.conflict_count || 0} يحتاجون معالجة.` });
      const { data: rows } = await supabase.rpc('preview_exam_distribution', { p_exam_id: id });
      setPreview((rows || []) as PreviewRow[]);
    } catch (e: any) {
      setNotices({ kind: 'error', text: e?.message || 'تعذر اعتماد التوزيع.' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return <div className="space-y-6 text-right" dir="rtl">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div><div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black"><Sparkles className="w-4 h-4"/>محرك الجدولة الذكي</div><h1 className="text-2xl font-black text-[#1E3A8A] mt-2">توزيع طلاب الامتحان</h1><p className="text-sm text-slate-500 mt-1">النظام يبحث عن موعد مناسب لكل طالب ويتجنب تعارض الحصص والامتحانات والسعة.</p></div>
      <button onClick={() => void load()} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-black flex items-center gap-2"><RefreshCw className="w-4 h-4"/>تحديث المجموعات</button>
    </div>

    {notices && <div className={`rounded-2xl border p-4 text-sm font-bold ${notices.kind === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : notices.kind === 'error' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-blue-50 border-blue-200 text-blue-900'}`}>{notices.text}</div>}

    <section className="bg-white border border-slate-200 rounded-3xl p-5 space-y-5">
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <label className="block"><span className="text-xs font-black text-slate-700">اسم الامتحان</span><input value={title} onChange={e=>setTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label>
        <label className="block"><span className="text-xs font-black text-slate-700">المجموعة</span><select value={groupId} onChange={e=>{setGroupId(e.target.value);setExamId('');setPreview([])}} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"><option value="">اختر المجموعة</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name} {g.subject ? `— ${g.subject}` : ''}</option>)}</select></label>
        <label className="block"><span className="text-xs font-black text-slate-700">تاريخ الامتحان</span><input type="date" value={examDate} onChange={e=>setExamDate(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label>
        <label className="block"><span className="text-xs font-black text-slate-700">مدة الامتحان بالدقائق</span><input type="number" min="1" max="600" value={duration} onChange={e=>setDuration(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label>
      </div>
      <div className="grid md:grid-cols-2 gap-4"><label className="block"><span className="text-xs font-black text-slate-700">الدرجة النهائية</span><input type="number" min="1" value={maxScore} onChange={e=>setMaxScore(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><label className="block"><span className="text-xs font-black text-slate-700">تعليمات الامتحان</span><textarea value={instructions} onChange={e=>setInstructions(e.target.value)} rows={2} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" placeholder="اختياري"/></label></div>
    </section>

    <section className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black text-[#1E3A8A]">مواعيد / مجموعات الامتحان</h2><p className="text-sm text-slate-500 mt-1">حدد عدد الطلاب لكل موعد. التوزيع سيحاول الموازنة بين السعة والمواعيد بدون عشوائية.</p></div><button onClick={addSlot} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center gap-2"><Plus className="w-4 h-4"/>إضافة موعد</button></div>
      <div className="space-y-3">{slots.map((s,index)=><div key={s.id} className="bg-white border border-slate-200 rounded-3xl p-5"><div className="grid md:grid-cols-4 gap-3 items-end"><label><span className="text-xs font-black text-slate-700">اسم الموعد</span><input value={s.label} onChange={e=>updateSlot(s.id,{label:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><label><span className="text-xs font-black text-slate-700">من</span><input type="time" value={s.startsAt} onChange={e=>updateSlot(s.id,{startsAt:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><label><span className="text-xs font-black text-slate-700">إلى</span><input type="time" value={s.endsAt} onChange={e=>updateSlot(s.id,{endsAt:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><div className="flex gap-2"><label className="flex-1"><span className="text-xs font-black text-slate-700">عدد الطلاب</span><input type="number" min="1" max="500" value={s.capacity} onChange={e=>updateSlot(s.id,{capacity:Number(e.target.value)})} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><button disabled={slots.length===1} onClick={()=>removeSlot(s.id)} className="mt-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 disabled:opacity-40"><Trash2 className="w-4 h-4"/></button></div></div></div>)}
      </div>
    </section>

    <section className="grid md:grid-cols-3 gap-4"><div className="bg-white border border-slate-200 rounded-3xl p-5"><div className="text-xs text-slate-500">المجموعة المختارة</div><div className="font-black text-lg text-slate-900 mt-1">{selectedGroup?.name || '—'}</div><div className="text-xs text-slate-500 mt-1">{selectedGroup?.grade || ''} {selectedGroup?.subject ? `• ${selectedGroup.subject}` : ''}</div></div><div className="bg-white border border-slate-200 rounded-3xl p-5"><div className="text-xs text-slate-500">السعة الإجمالية</div><div className="font-black text-2xl text-[#1E3A8A] mt-1">{totalCapacity}</div><div className="text-xs text-slate-500 mt-1">مقعد</div></div><div className="bg-white border border-slate-200 rounded-3xl p-5"><div className="text-xs text-slate-500">نتيجة المعاينة</div><div className="font-black text-2xl text-[#1E3A8A] mt-1">{preview.length}</div><div className="text-xs text-slate-500 mt-1">طالب • {conflictCount} تعارض</div></div></section>

    <div className="flex flex-col sm:flex-row gap-3"><button disabled={previewing || busy} onClick={()=>void previewDistribution()} className="flex-1 rounded-2xl bg-blue-600 text-white py-3.5 text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50">{previewing?<Loader2 className="w-5 h-5 animate-spin"/>:<CalendarClock className="w-5 h-5"/>}معاينة التوزيع قبل الاعتماد</button><button disabled={busy || !groupId || !examDate} onClick={()=>void finalize()} className="flex-1 rounded-2xl bg-emerald-600 text-white py-3.5 text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50">{busy?<Loader2 className="w-5 h-5 animate-spin"/>:<Save className="w-5 h-5"/>}اعتماد التوزيع النهائي</button></div>

    {preview.length > 0 && <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden"><div className="p-5 border-b border-slate-100"><h2 className="font-black text-lg text-[#1E3A8A]">المعاينة</h2><p className="text-xs text-slate-500 mt-1">اللون المنطقي هنا ليس عشوائيًا: الأخضر يعني أن المحرك وجد موعدًا، والأحمر يحتاج معالجة.</p></div><div className="overflow-x-auto"><table className="min-w-full text-xs"><thead className="bg-slate-50"><tr><th className="p-4 text-right">الطالب</th><th className="p-4 text-right">الموعد المقترح</th><th className="p-4 text-right">الحالة</th><th className="p-4 text-right">السبب</th></tr></thead><tbody>{preview.map(r=><tr key={r.student_id} className="border-t border-slate-100"><td className="p-4 font-black">{r.student_name}</td><td className="p-4">{r.proposed_slot_label || '—'}</td><td className="p-4">{r.proposed_slot_id ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 font-black"><CheckCircle2 className="w-3.5 h-3.5"/>متوافق</span> : <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-2.5 py-1 font-black"><XCircle className="w-3.5 h-3.5"/>يحتاج معالجة</span>}</td><td className="p-4 text-slate-600"><div className="flex items-center gap-1.5">{r.proposed_slot_id ? <Clock3 className="w-4 h-4 text-slate-400"/> : <AlertTriangle className="w-4 h-4 text-red-500"/>}{r.conflict_reason}</div></td></tr>)}</tbody></table></div></section>}

    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex gap-2"><Users className="w-5 h-5 shrink-0 mt-0.5"/><div><b>ملاحظة:</b> الطالب الذي لا يجد موعدًا آمنًا لا يتم وضعه بالقوة. يظهر في المعاينة كحالة تحتاج معالجة، ثم نقرر له موعدًا بديلًا في الجزء التالي من النظام.</div></div>
  </div>;
};
