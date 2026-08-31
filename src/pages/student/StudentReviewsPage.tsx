import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, ShieldCheck, Star, UserRound } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

interface TeacherOption { id: string; name: string; subject: string; avatar?: string; canReview: boolean; }

const RatingRow: React.FC<{ label: string; value: number; onChange: (value: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-[13px] font-bold text-gray-700">{label}</span>
    <div className="flex items-center gap-1" dir="ltr">
      {[1,2,3,4,5].map((n) => <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${label} ${n} من 5`} className={`p-1 cursor-pointer ${n <= value ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}><Star className="w-5 h-5 fill-current" /></button>)}
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

  return <div className="space-y-4 max-w-4xl mx-auto text-right" dir="rtl">
    <section className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center"><Star className="w-5 h-5 fill-current" /></div><div><h1 className="text-lg font-black text-[#1E3A8A]">تقييم المدرسين ⭐</h1><p className="text-xs text-gray-500 mt-0.5">تقييمك متاح فقط بعد إتمام حصة فعلية مع المدرس.</p></div></div>
      <div className="mt-4 grid md:grid-cols-2 gap-3">
        <select value={selectedTeacher} onChange={(e) => { setSelectedTeacher(e.target.value); setMessage(''); }} className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-[13px] font-bold cursor-pointer"><option value="">اختر مدرسًا من مدرسيني</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.subject}{!t.canReview ? ' (لم تكتمل حصة بعد)' : alreadyReviewed && selectedTeacher===t.id ? ' (تم التقييم)' : ''}</option>)}</select>
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-[11px] text-blue-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 shrink-0" />التقييم مرتبط بحضور حقيقي ولا يمكن إنشاء تقييم وهمي.</div>
      </div>
    </section>
    {selected && <section className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5"><div className="flex items-center gap-3 pb-3 border-b border-gray-100"><div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">{selected.avatar ? <img src={selected.avatar} alt={selected.name} className="w-full h-full object-cover" /> : <UserRound className="w-5 h-5 text-gray-400" />}</div><div><h2 className="text-[13px] font-black text-gray-900">{selected.name}</h2><p className="text-[11px] text-gray-500">{selected.subject}</p></div></div>
      {!selected.canReview ? <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 p-3 text-[13px] font-bold">لم تُسجل حصة مكتملة لهذا المدرس بعد، لذلك نموذج التقييم مقفول.</div> : alreadyReviewed ? <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 text-[13px] font-bold">تم تسجيل تقييمك لهذا المدرس بالفعل.</div> : <>
        <div className="mt-2"><RatingRow label="جودة الشرح" value={ratings.teaching} onChange={(v)=>setRatings(p=>({...p,teaching:v}))}/><RatingRow label="الالتزام بالمواعيد" value={ratings.punctuality} onChange={(v)=>setRatings(p=>({...p,punctuality:v}))}/><RatingRow label="التعامل والاحترام" value={ratings.behavior} onChange={(v)=>setRatings(p=>({...p,behavior:v}))}/><RatingRow label="القيمة مقابل السعر" value={ratings.value} onChange={(v)=>setRatings(p=>({...p,value:v}))}/></div>
        <textarea value={comment} onChange={(e)=>setComment(e.target.value)} rows={4} maxLength={1000} placeholder="اكتب رأيك عن التجربة..." className="w-full mt-4 rounded-xl border border-gray-300 px-3.5 py-2.5 text-[13px] resize-none focus:ring-2 focus:ring-blue-100 outline-none" />
        <button disabled={saving} onClick={()=>void submit()} className="mt-3 w-full rounded-xl bg-[#2563EB] text-white py-3 font-black text-[13px] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover:bg-blue-700"><Send className="w-4 h-4" />{saving ? 'جاري الإرسال...' : 'إرسال التقييم'}</button>
      </>}
      {message && <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-3 text-[13px] font-bold text-gray-700 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-600" />{message}</div>}
    </section>}
    {!loading && teachers.length === 0 && <section className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-400">لم يتم العثور على مدرسين مسجلين لهذا الحساب بعد.</section>}
  </div>;
};
