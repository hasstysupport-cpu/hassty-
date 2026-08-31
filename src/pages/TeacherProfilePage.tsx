import React, { useEffect, useMemo, useState } from 'react';
import { useSEO } from '../lib/useSEO';
import { Star, ShieldCheck, MapPin, BookOpen, Award, Users, MessageSquare, Flag, Calendar, CheckCircle2, Loader2, AlertCircle, Send, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TutorProfile } from '../types';

interface TeacherProfilePageProps {
  tutorId: string;
  onNavigate: (path: string) => void;
  onSelectTutor?: (tutorId: string) => void;
  onOpenBooking?: (tutor: TutorProfile) => void;
  onOpenQRSimulator?: () => void;
}

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  teaching_quality: number | null;
  punctuality: number | null;
  behavior: number | null;
  value_for_money: number | null;
  verified_session: boolean | null;
};

type BookingRow = { id: string; group_id: string | null; tutor_id: string; status: string };

export const TeacherProfilePage: React.FC<TeacherProfilePageProps> = ({ tutorId, onNavigate, onOpenBooking }) => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [eligibleBookings, setEligibleBookings] = useState<BookingRow[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [rating, setRating] = useState(5);
  const [teachingQuality, setTeachingQuality] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [behavior, setBehavior] = useState(5);
  const [valueForMoney, setValueForMoney] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reportCategory, setReportCategory] = useState('other');
  const [reportDetails, setReportDetails] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    if (!supabase || !tutorId) {
      setLoadError('تعذر تحميل بيانات المدرس.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      let row: any = null;
      const { data: viewRow, error: tutorError } = await supabase.from('public_verified_teachers').select('*').eq('id', tutorId).maybeSingle();
      if (!tutorError && viewRow) {
        row = viewRow;
      } else {
        const [{ data: pData }, { data: tpData }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', tutorId).maybeSingle(),
          supabase.from('tutor_profiles').select('*').eq('user_id', tutorId).maybeSingle(),
        ]);
        if (pData || tpData) {
          row = {
            id: tutorId,
            name: pData?.full_name || 'مدرس معتمد',
            title: tpData?.title || 'معلم متخصص',
            headline: tpData?.headline || '',
            bio: tpData?.bio || '',
            subjects: tpData?.subjects || [],
            grades: tpData?.grades || [],
            governorate: pData?.governorate || tpData?.governorate || '',
            city: pData?.city || tpData?.city || '',
            rating: tpData?.rating || 5.0,
            reviews_count: tpData?.reviews_count || 0,
            price_per_session: tpData?.price_per_session || 0,
            price_per_month: tpData?.price_per_month || 0,
            experience_years: tpData?.experience_years || 1,
            center_names: tpData?.center_names || [],
            avatar_url: pData?.avatar_url || '',
            metadata: { ...(pData?.metadata || {}), ...(tpData?.metadata || {}) },
          };
        }
      }

      let reviewRows: any[] = [];
      try {
        const { data: revs } = await supabase.from('tutor_reviews').select('id,rating,comment,created_at,teaching_quality,punctuality,behavior,value_for_money,verified_session').eq('tutor_id', tutorId).order('created_at', { ascending: false });
        reviewRows = revs || [];
      } catch {
        // reviews optional
      }
      if (!row) {
        setTutor(null);
        setLoadError('هذا المدرس غير موجود أو غير موثق حاليًا.');
        setLoading(false);
        return;
      }
      const levels = Array.isArray(row.grades) ? row.grades : [];
      const subjects = Array.isArray(row.subjects) ? row.subjects : [];
      const mapped: TutorProfile = {
        id: row.id,
        name: row.name || '',
        title: row.title || '',
        subject: subjects[0] || '',
        governorate: row.governorate || '',
        area: row.city || '',
        rating: Number(row.rating || 0),
        reviewsCount: Number(row.reviews_count || 0),
        studentsCount: 0,
        pricePerSession: Number(row.price_per_session || 0),
        isVerified: true,
        joinCode: String(row.metadata?.joinCode || ''),
        levels,
        avatarUrl: row.avatar_url || '',
        bio: row.bio || row.headline || '',
        experienceYears: Number(row.experience_years || 0),
        centers: Array.isArray(row.center_names) ? row.center_names : [],
        phone: '',
        email: '',
        education: String(row.metadata?.education || ''),
        accountStatus: 'active',
        reviews: [],
        availableSlots: Array.isArray(row.availability_slots) ? row.availability_slots : [],
      };
      setTutor(mapped);
      setReviews((reviewRows || []) as ReviewRow[]);
      const { data: session } = await supabase.auth.getSession();
      if (session.session?.user) {
        const userId = session.session.user.id;
        const { data: bookings, error: bookingError } = await supabase
          .from('booking_requests')
          .select('id,group_id,tutor_id,status')
          .eq('student_id', userId)
          .eq('tutor_id', tutorId);
        if (bookingError) throw bookingError;
        const bookingRows = (bookings || []) as BookingRow[];
        const groupIds = [...new Set(bookingRows.map(b => b.group_id).filter(Boolean))] as string[];
        let completedGroupIds = new Set<string>();
        if (groupIds.length) {
          const { data: sessions, error: sessionsError } = await supabase
            .from('lesson_sessions')
            .select('group_id,status')
            .eq('tutor_id', tutorId)
            .in('group_id', groupIds)
            .eq('status', 'completed');
          if (sessionsError) throw sessionsError;
          completedGroupIds = new Set((sessions || []).map((s: any) => s.group_id));
        }
        const eligible = bookingRows.filter(b => b.group_id && completedGroupIds.has(b.group_id));
        setEligibleBookings(eligible);
        if (eligible[0]) setSelectedBookingId(eligible[0].id);
      } else {
        setEligibleBookings([]);
      }
    } catch (error: any) {
      console.error('Failed to load teacher profile', error);
      setLoadError(error?.message || 'تعذر تحميل بيانات المدرس.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [tutorId]);

  useSEO({
    title: tutor ? `${tutor.name} - مدرس ${tutor.subject || ''}` : 'ملف المدرس - حِصّتي',
    description: tutor?.bio || 'ملف مدرس موثق على حِصّتي',
    canonicalPath: `/tutor/${tutorId}`,
  });

  const averageBreakdown = useMemo(() => {
    if (!reviews.length) return { teaching: 0, punctuality: 0, behavior: 0, value: 0 };
    const avg = (key: keyof ReviewRow) => reviews.reduce((sum, item) => sum + Number(item[key] || 0), 0) / reviews.length;
    return { teaching: avg('teaching_quality'), punctuality: avg('punctuality'), behavior: avg('behavior'), value: avg('value_for_money') };
  }, [reviews]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedBookingId) {
      setNotice({ type: 'error', text: 'لا يمكن كتابة تقييم قبل وجود حصة مكتملة مؤهلة للتقييم.' });
      return;
    }
    setSavingReview(true);
    setNotice(null);
    const { error } = await supabase.rpc('submit_teacher_review', {
      p_teacher_id: tutorId,
      p_booking_id: selectedBookingId,
      p_rating: rating,
      p_comment: reviewComment.trim(),
      p_teaching_quality: teachingQuality,
      p_punctuality: punctuality,
      p_behavior: behavior,
      p_value_for_money: valueForMoney,
    });
    setSavingReview(false);
    if (error) {
      setNotice({ type: 'error', text: error.message });
      return;
    }
    setReviewComment('');
    setNotice({ type: 'success', text: 'تم إرسال تقييمك بنجاح ✅' });
    await load();
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (reportDetails.trim().length < 5) {
      setNotice({ type: 'error', text: 'اكتب تفاصيل البلاغ بشكل أوضح.' });
      return;
    }
    setSendingReport(true);
    setNotice(null);
    const { error } = await supabase.rpc('submit_teacher_report', {
      p_tutor_id: tutorId,
      p_category: reportCategory,
      p_details: reportDetails.trim(),
    });
    setSendingReport(false);
    if (error) {
      setNotice({ type: 'error', text: error.message });
      return;
    }
    setReportDetails('');
    setNotice({ type: 'success', text: 'تم إرسال البلاغ للإدارة للمراجعة ✅' });
  };

  if (loading) {
    return <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center"><div className="flex items-center gap-2 font-bold text-[#1E3A8A]"><Loader2 className="w-5 h-5 animate-spin" />جاري تحميل بيانات المدرس...</div></div>;
  }

  if (!tutor || loadError) {
    return <div className="min-h-screen bg-[#F8FAFF] px-4 py-16"><div className="max-w-xl mx-auto bg-white border border-red-100 rounded-3xl p-8 text-center"><AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" /><h1 className="text-xl font-black text-gray-900">تعذر فتح ملف المدرس</h1><p className="text-sm text-gray-500 mt-2">{loadError || 'هذا المدرس غير موجود أو غير موثق.'}</p><button onClick={() => onNavigate('/search')} className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#2563EB] text-white font-bold"><ArrowLeft className="w-4 h-4" />العودة للبحث</button></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] pb-16 text-right">
      <div className="bg-white border-b border-[#E5E7EB] py-3"><div className="max-w-7xl mx-auto px-4 flex items-center gap-2 text-xs text-gray-500"><button onClick={() => onNavigate('/')} className="hover:text-blue-600">الرئيسية</button><span>/</span><button onClick={() => onNavigate('/search')} className="hover:text-blue-600">البحث عن مدرسين</button><span>/</span><span className="text-[#1E3A8A] font-bold">{tutor.name}</span></div></div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {notice && <div className={`rounded-2xl px-4 py-3 text-sm font-bold ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{notice.text}</div>}
        <section className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="relative shrink-0 w-28 h-28 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
              {tutor.avatarUrl ? <img src={tutor.avatarUrl} alt={tutor.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <span className="text-3xl font-black text-blue-200">{tutor.name.slice(0,1)}</span>}
              <div className="absolute bottom-2 left-2 bg-[#2563EB] text-white p-1.5 rounded-xl"><ShieldCheck className="w-5 h-5" /></div>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-black text-[#1E3A8A]">{tutor.name}</h1><span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-black">{tutor.subject || 'تخصص غير محدد'}</span></div>
              {tutor.title && <p className="mt-2 text-sm font-bold text-gray-600">{tutor.title}</p>}
              <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500 fill-amber-400" />{tutor.rating.toFixed(1)} ({tutor.reviewsCount} تقييم)</span>
                {tutor.governorate && <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />{tutor.governorate}{tutor.area ? ` — ${tutor.area}` : ''}</span>}
                {tutor.experienceYears > 0 && <span className="inline-flex items-center gap-1.5"><Award className="w-4 h-4" />{tutor.experienceYears} سنة خبرة</span>}
              </div>
              {tutor.levels.length > 0 && <div className="flex flex-wrap gap-2 mt-4">{tutor.levels.map((level, i) => <span key={i} className="px-3 py-1 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700">{level}</span>)}</div>}
            </div>
          </div>
          {onOpenBooking && <button onClick={() => onOpenBooking(tutor)} className="mt-6 w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#2563EB] text-white font-black inline-flex items-center justify-center gap-2"><Calendar className="w-4 h-4" />احجز مع المدرس</button>}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600" /><h2 className="text-lg font-black text-[#1E3A8A]">نبذة وخبرات</h2></div>
            <p className="text-sm leading-8 text-gray-600">{tutor.bio || 'لم يضف المدرس نبذة تعريفية بعد.'}</p>
            {tutor.centers.length > 0 && <div><h3 className="font-black text-sm mb-2">الأماكن</h3><div className="flex flex-wrap gap-2">{tutor.centers.map((c, i) => <span key={i} className="px-3 py-2 bg-gray-50 border rounded-xl text-xs font-bold">{c}</span>)}</div></div>}
            {(averageBreakdown.teaching || averageBreakdown.punctuality || averageBreakdown.behavior || averageBreakdown.value) > 0 && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100">{[['الشرح',averageBreakdown.teaching],['الالتزام',averageBreakdown.punctuality],['التعامل',averageBreakdown.behavior],['القيمة',averageBreakdown.value]].map(([label,val]) => <div key={label as string} className="bg-gray-50 rounded-2xl p-3 text-center"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 font-black text-[#1E3A8A]">{Number(val).toFixed(1)}/5</div></div>)}</div>}
          </div>
          <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" /><h2 className="font-black text-[#1E3A8A]">التقييمات</h2></div>
            <div className="text-4xl font-black text-[#1E3A8A]">{tutor.rating.toFixed(1)}</div><div className="text-xs text-gray-500">من 5 · {tutor.reviewsCount} تقييم</div>
            {tutor.pricePerSession > 0 && <div className="pt-3 border-t border-gray-100 text-sm font-black">{tutor.pricePerSession} ج.م / حصة</div>}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-600" /><h2 className="text-lg font-black text-[#1E3A8A]">آراء الطلاب</h2></div><span className="text-xs font-bold text-gray-500">تقييمات مسجلة بعد حصة مكتملة</span></div>
          {reviews.length === 0 ? <p className="text-sm text-gray-500">لا توجد تقييمات حقيقية منشورة حتى الآن.</p> : <div className="space-y-4">{reviews.map(r => <article key={r.id} className="border border-gray-100 rounded-2xl p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-1">{[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-amber-500 fill-amber-400' : 'text-gray-200'}`} />)}</div><span className="text-[11px] text-gray-400">{new Date(r.created_at).toLocaleDateString('ar-EG')}</span></div><p className="mt-3 text-sm leading-7 text-gray-700">{r.comment || 'بدون تعليق.'}</p>{r.verified_session && <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1"><CheckCircle2 className="w-4 h-4" />حصة موثقة</div>}</article>)}</div>}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={submitReview} className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-600" /><h2 className="font-black text-[#1E3A8A]">اكتب تقييمك</h2></div>
            {eligibleBookings.length === 0 ? <p className="text-sm text-gray-500 bg-gray-50 rounded-2xl p-4">التقييم متاح فقط بعد إتمام حصة مع هذا المدرس.</p> : <>
              <label className="block text-xs font-bold text-gray-600">الحصة المكتملة<select value={selectedBookingId} onChange={e => setSelectedBookingId(e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"><option value="">اختر الحصة</option>{eligibleBookings.map(b => <option key={b.id} value={b.id}>{b.id.slice(0,8)}</option>)}</select></label>
              <label className="block text-xs font-bold text-gray-600">التقييم العام<div className="flex gap-1 mt-2">{[1,2,3,4,5].map(s => <button type="button" key={s} onClick={() => setRating(s)} className="p-1" aria-label={`${s} نجوم`}><Star className={`w-7 h-7 ${s <= rating ? 'text-amber-500 fill-amber-400' : 'text-gray-200'}`} /></button>)}</div></label>
              <div className="grid grid-cols-2 gap-3">{[["الشرح",teachingQuality,setTeachingQuality],["الالتزام",punctuality,setPunctuality],["التعامل",behavior,setBehavior],["القيمة",valueForMoney,setValueForMoney]].map(([label,val,setter]) => <label key={label as string} className="text-xs font-bold text-gray-600">{label as string}<select value={val as number} onChange={e => (setter as any)(Number(e.target.value))} className="mt-2 w-full rounded-2xl border px-3 py-2">{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}</select></label>)}</div>
              <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="اكتب رأيك باختصار..." rows={4} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm" />
              <button disabled={savingReview} className="w-full rounded-2xl bg-[#2563EB] text-white py-3 font-black inline-flex items-center justify-center gap-2">{savingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}إرسال التقييم</button>
            </>}
          </form>

          <form onSubmit={submitReport} className="bg-white border border-red-100 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2"><Flag className="w-5 h-5 text-red-500" /><h2 className="font-black text-red-700">الإبلاغ عن المدرس</h2></div>
            <p className="text-xs text-gray-500">استخدم البلاغ عند وجود مشكلة حقيقية. البلاغ يذهب مباشرة للإدارة.</p>
            <label className="block text-xs font-bold text-gray-600">سبب البلاغ<select value={reportCategory} onChange={e => setReportCategory(e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"><option value="inappropriate_conduct">سلوك غير مناسب</option><option value="external_payment_demand">طلب دفع خارج المنصة</option><option value="absence_no_notice">غياب بدون إخطار</option><option value="verbal_abuse">إساءة لفظية</option><option value="fraud">احتيال</option><option value="other">سبب آخر</option></select></label>
            <textarea value={reportDetails} onChange={e => setReportDetails(e.target.value)} placeholder="اشرح المشكلة بالتفصيل..." rows={6} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm" />
            <button disabled={sendingReport} className="w-full rounded-2xl bg-red-600 text-white py-3 font-black inline-flex items-center justify-center gap-2">{sendingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}إرسال البلاغ</button>
          </form>
        </section>
      </main>
    </div>
  );
};
