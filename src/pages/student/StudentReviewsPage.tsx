import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, ShieldCheck, Star, UserRound } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

interface TeacherOption { id: string; name: string; subject: string; avatar?: string; canReview: boolean; }

const RatingRow: React.FC<{ label: string; value: number; onChange: (value: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-gray-100 last:border-0">
    <span className="text-sm font-bold text-gray-700">{label}</span>
    <div className="flex items-center gap-1" dir="ltr">
      {[1,2,3,4,5].map((n) => <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${label} ${n} من 5`} className={`p-1 transition ${n <= value ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}><Star className="w-6 h-6 fill-current" /></button>)}
    </div>
  </div>
);

export const StudentReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [ratings, setRatings] = useState({ teaching: 5, punctuality: 5, behavior: 5, value: 5 });
  const [comment, setComment] = useState('');
  const [existing, setExisting] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!supabase || !user?.uid) return;
      setLoading(true);
      const { data: enrollments } = await supabase.from('group_enrollments').select('group_id').eq('student_id', user.uid).eq('status', 'active');
      const groupIds = (enrollments || []).map((x:any) => x.group_id).filter(Boolean);
      if (!groupIds.length) { setTeachers([]); setLoading(false); return; }
      const { data: groups } = await supabase.from('student_groups').select('id,tutor_id,subject').in('id', groupIds);
      const tutorIds = Array.from(new Set((groups || []).map((g:any) => g.tutor_id).filter(Boolean)));
      if (!tutorIds.length) { setTeachers([]); setLoading(false); return; }
      const { data: profiles } = await supabase.from('profiles').select('id,full_name,avatar_url').in('id', tutorIds);
      const { data: tutorProfiles } = await supabase.from('tutor_profiles').select('user_id,subjects').in('user_id', tutorIds);
      const { data: completed } = await supabase.from('lesson_sessions').select('group_id,tutor_id,status,ends_at').in('group_id', groupIds).eq('status','completed').lte('ends_at', new Date().toISOString());
      const { data: reviews } = await supabase.from('tutor_reviews').select('id,tutor_id,rating,comment,teaching_quality,punctuality,behavior,value_for_money').eq('student_id', user.uid);
      setExisting(reviews || []);
      setTeachers((profiles || []).map((p:any) => {
        const group = (groups || []).find((g:any) => g.tutor_id === p.id);
        const tp = (tutorProfiles || []).find((t:any) => t.user_id === p.id);
        const hasCompleted = (completed || []).some((s:any) => s.tutor_id === p.id);
        return { id: p.id, name: p.full_name || 'مدرس حِصّتي', subject: group?.subject || tp?.subjects?.[0] || 'مادة تعليمية', avatar: p.avatar_url || '', canReview: hasCompleted };
      }));
      setLoading(false);
    };
    void load();
  }, [user?.uid]);

  const selected = useMemo(() => teachers.find((t) => t.id === selectedTeacher) || null, [teachers, selectedTeacher]);
  const alreadyReviewed = existing.some((r) => r.tutor_id === selectedTeacher);

  const submit = async () => {
    if (!supabase || !user?.uid || !selected) return;
    if (!selected.canReview) { setMessage('يمكنك التقييم بعد إتمام حصة فعلية مع المدرس.'); return; }
    if (alreadyReviewed) { setMessage('سبق لك تقييم هذا المدرس.'); return; }
    setSaving(true); setMessage('');
    try {
      const { error } = await supabase.from('tutor_reviews').insert({
        tutor_id: selected.id,
        student_id: user.uid,
        rating: Math.round((ratings.teaching + ratings.punctuality + ratings.behavior + ratings.value) / 4),
        teaching_quality: ratings.teaching,
        punctuality: ratings.punctuality,
        behavior: ratings.behavior,
        value_for_money: ratings.value,
        verified_session: true,
        comment: comment.trim() || null,
      });
      if (error) throw error;
      setExisting((p) => [...p, { tutor_id: selected.id }]);
      setMessage('تم إرسال تقييمك بنجاح ⭐ شكرًا لمساعدتنا على تحسين تجربة الطلاب.');
      setComment('');
    } catch (e:any) {
      setMessage(e?.message || 'تعذر إرسال التقييم الآن.');
    } finally { setSaving(false); }
  };

  return <div className="space-y-5 max-w-4xl mx-auto text-right" dir="rtl">
    <section className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-sm">
      <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center"><Star className="w-6 h-6 fill-current" /></div><div><h1 className="text-2xl font-black text-[#1E3A8A]">تقييم المدرسين ⭐</h1><p className="text-sm text-gray-500 mt-1">تقييمك متاح فقط بعد إتمام حصة فعلية مع المدرس.</p></div></div>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <select value={selectedTeacher} onChange={(e) => { setSelectedTeacher(e.target.value); setMessage(''); }} className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold"><option value="">اختر مدرسًا من مدرسيني</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.subject}{!t.canReview ? ' (لم تكتمل حصة بعد)' : alreadyReviewed && selectedTeacher===t.id ? ' (تم التقييم)' : ''}</option>)}</select>
        <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-xs text-blue-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5" />التقييم مرتبط بحضور حقيقي ولا يمكن إنشاء تقييم وهمي.</div>
      </div>
    </section>
    {selected && <section className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-sm"><div className="flex items-center gap-3 pb-4 border-b border-gray-100"><div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center">{selected.avatar ? <img src={selected.avatar} alt={selected.name} className="w-full h-full object-cover" /> : <UserRound className="w-6 h-6 text-gray-400" />}</div><div><h2 className="font-black text-gray-900">{selected.name}</h2><p className="text-xs text-gray-500">{selected.subject}</p></div></div>
      {!selected.canReview ? <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 p-4 text-sm font-bold">لم تُسجل حصة مكتملة لهذا المدرس بعد، لذلك نموذج التقييم مقفول.</div> : alreadyReviewed ? <div className="mt-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 text-sm font-bold">تم تسجيل تقييمك لهذا المدرس بالفعل.</div> : <>
        <div className="mt-3"><RatingRow label="جودة الشرح" value={ratings.teaching} onChange={(v)=>setRatings(p=>({...p,teaching:v}))}/><RatingRow label="الالتزام بالمواعيد" value={ratings.punctuality} onChange={(v)=>setRatings(p=>({...p,punctuality:v}))}/><RatingRow label="التعامل والاحترام" value={ratings.behavior} onChange={(v)=>setRatings(p=>({...p,behavior:v}))}/><RatingRow label="القيمة مقابل السعر" value={ratings.value} onChange={(v)=>setRatings(p=>({...p,value:v}))}/></div>
        <textarea value={comment} onChange={(e)=>setComment(e.target.value)} rows={5} maxLength={1000} placeholder="اكتب رأيك عن التجربة..." className="w-full mt-5 rounded-2xl border border-gray-300 px-4 py-3 text-sm resize-none" />
        <button disabled={saving} onClick={()=>void submit()} className="mt-4 w-full rounded-2xl bg-[#2563EB] text-white py-3.5 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"><Send className="w-4 h-4" />{saving ? 'جاري الإرسال...' : 'إرسال التقييم'}</button>
      </>}
      {message && <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-200 p-4 text-sm font-bold text-gray-700 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-600" />{message}</div>}
    </section>}
    {!loading && teachers.length === 0 && <section className="bg-white border border-gray-200 rounded-3xl p-10 text-center text-sm text-gray-400">لم يتم العثور على مدرسين مسجلين لهذا الحساب بعد.</section>}
  </div>;
};
