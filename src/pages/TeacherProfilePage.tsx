import React, { useEffect, useMemo, useState } from 'react';
import { useSEO } from '../lib/useSEO';
import { Star, ShieldCheck, MapPin, BookOpen, Award, Users, MessageSquare, Flag, Calendar, CheckCircle2, Loader2, AlertCircle, Send, ArrowLeft, GraduationCap, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ScrollReveal } from '../components/common/ScrollReveal';
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
    ogType: 'profile',
    robots: tutor ? undefined : 'noindex, follow',
    breadcrumbs: tutor ? ['المدرسين المعتمدين', tutor.name] : ['المدرسين المعتمدين'],
    jsonLd: tutor ? {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': `https://hassty.vercel.app/tutor/${tutor.id}#profilepage`,
      url: `https://hassty.vercel.app/tutor/${tutor.id}`,
      name: `${tutor.name} - مدرس ${tutor.subject}`,
      inLanguage: 'ar-EG',
      isPartOf: { '@id': 'https://hassty.vercel.app/#website' },
      mainEntity: {
        '@type': 'Person',
        '@id': `https://hassty.vercel.app/tutor/${tutor.id}#person`,
        name: tutor.name,
        alternateName: tutor.title,
        jobTitle: `مدرس ${tutor.subject}`,
        description: tutor.bio,
        image: tutor.avatarUrl,
        knowsAbout: [tutor.subject, ...(tutor.levels || [])].filter(Boolean),
        url: `https://hassty.vercel.app/tutor/${tutor.id}`,
        address: {
          '@type': 'PostalAddress',
          addressRegion: tutor.governorate,
          addressLocality: tutor.area,
          addressCountry: 'EG',
        },
        worksFor: { '@id': 'https://hassty.vercel.app/#organization' },
      },
    } : null,
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
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F6F9FF]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#2563EB] to-[#7C3AED] shadow-lg shadow-blue-600/25">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
          <div className="text-sm font-bold text-[#1E3A8A]">جاري تحميل بيانات المدرس...</div>
        </div>
      </div>
    );
  }

  if (!tutor || loadError) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F6F9FF] px-4 py-16">
        <div className="mx-auto max-w-xl overflow-hidden rounded-[28px] border border-red-100 bg-white p-8 text-center shadow-[0_24px_70px_-30px_rgba(30,58,138,0.2)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-600/25">
            <AlertCircle className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-slate-900">تعذر فتح ملف المدرس</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">{loadError || 'هذا المدرس غير موجود أو غير موثق.'}</p>
          <button onClick={() => onNavigate('/search')} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-[#2563EB] to-[#7C3AED] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition-transform active:scale-[0.97]">
            <ArrowLeft className="w-4 h-4" />العودة للبحث
          </button>
        </div>
      </div>
    );
  }

  const breakdownItems: [string, number][] = [
    ['جودة الشرح', averageBreakdown.teaching],
    ['الالتزام بالمواعيد', averageBreakdown.punctuality],
    ['أسلوب التعامل', averageBreakdown.behavior],
    ['القيمة مقابل السعر', averageBreakdown.value],
  ];
  const hasBreakdown = breakdownItems.some(([, v]) => v > 0);

  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-[#F6F9FF] pb-16 text-right">
      {/* هالات ضوئية محيطة */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/12 via-indigo-300/8 to-transparent blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-80 w-80 rounded-full bg-gradient-to-tr from-violet-300/10 via-purple-200/8 to-transparent blur-3xl" />
      </div>

      <div className="border-b border-blue-100/60 bg-white/70 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 text-xs text-slate-500">
          <button onClick={() => onNavigate('/')} className="transition-colors hover:text-[#2563EB]">الرئيسية</button>
          <span>/</span>
          <button onClick={() => onNavigate('/search')} className="transition-colors hover:text-[#2563EB]">البحث عن مدرسين</button>
          <span>/</span>
          <span className="font-bold text-[#1E3A8A]">{tutor.name}</span>
        </div>
      </div>

      <main className="relative mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        {notice && (
          <div className={`anim-up rounded-2xl border px-4 py-3 text-sm font-bold ${notice.type === 'success' ? 'border-emerald-200 bg-gradient-to-l from-emerald-50 to-white text-emerald-800' : 'border-red-200 bg-gradient-to-l from-red-50 to-white text-red-800'}`}>{notice.text}</div>
        )}

        {/* ===== بطاقة الملف مع الغلاف المتدرّج ===== */}
        <ScrollReveal direction="up">
          <section className="relative overflow-hidden rounded-[28px] border border-blue-100/80 bg-white shadow-[0_24px_70px_-30px_rgba(30,58,138,0.3)]">
            <div className="relative h-32 bg-gradient-to-l from-[#2563EB] via-[#4F46E5] to-[#7C3AED] sm:h-40">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
              <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute left-1/4 top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
              <div className="absolute bottom-3 right-6 hidden items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-sm sm:flex">
                <ShieldCheck className="h-4 w-4" /> مدرس موثّق من إدارة حِصّتي
              </div>
            </div>

            <div className="relative px-5 pb-6 sm:px-8 sm:pb-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <div className="relative -mt-14 shrink-0 sm:-mt-16">
                  <div className="rounded-[26px] bg-gradient-to-br from-[#2563EB] to-[#7C3AED] p-[3px] shadow-xl shadow-blue-600/25">
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[23px] bg-white sm:h-32 sm:w-32">
                      {tutor.avatarUrl ? (
                        <img src={tutor.avatarUrl} alt={tutor.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-4xl font-black text-blue-300">{tutor.name.slice(0, 1)}</span>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -left-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white shadow-lg shadow-blue-600/30 ring-4 ring-white">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">{tutor.name}</h1>
                    <span className="rounded-full border border-blue-100 bg-gradient-to-l from-[#EFF6FF] to-[#F5F3FF] px-3 py-1 text-xs font-black text-[#1E3A8A]">
                      {tutor.subject || 'تخصص غير محدد'}
                    </span>
                  </div>
                  {tutor.title && <p className="mt-2 text-sm font-bold text-slate-500">{tutor.title}</p>}
                  <div className="mt-3.5 flex flex-wrap gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-2xl border border-amber-100 bg-gradient-to-l from-amber-50 to-orange-50 px-3 py-2 text-xs font-bold text-amber-700">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-500" />{tutor.rating.toFixed(1)} · {tutor.reviewsCount} تقييم
                    </span>
                    {tutor.governorate && (
                      <span className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-100 bg-gradient-to-l from-blue-50 to-indigo-50 px-3 py-2 text-xs font-bold text-slate-600">
                        <MapPin className="h-4 w-4 text-[#2563EB]" />{tutor.governorate}{tutor.area ? ` — ${tutor.area}` : ''}
                      </span>
                    )}
                    {tutor.experienceYears > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-100 bg-gradient-to-l from-violet-50 to-purple-50 px-3 py-2 text-xs font-bold text-violet-700">
                        <Award className="h-4 w-4" />{tutor.experienceYears} سنة خبرة
                      </span>
                    )}
                  </div>
                </div>

                {onOpenBooking && (
                  <div className="shrink-0 sm:pb-1">
                    <button onClick={() => onOpenBooking(tutor)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#2563EB] to-[#7C3AED] px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.97] sm:w-auto">
                      <Calendar className="w-4 h-4" />احجز مع المدرس
                    </button>
                  </div>
                )}
              </div>

              {tutor.levels.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400"><GraduationCap className="h-4 w-4" />المراحل:</span>
                  {tutor.levels.map((level, i) => (
                    <span key={i} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">{level}</span>
                  ))}
                </div>
              )}
            </div>
          </section>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ===== المحتوى الرئيسي ===== */}
          <div className="space-y-6 lg:col-span-2">
            <ScrollReveal direction="up" delay={60}>
              <section className="card-lux rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white shadow-lg shadow-blue-600/25">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-black text-[#1E3A8A]">نبذة وخبرات</h2>
                </div>
                <p className="text-sm leading-8 text-slate-600">{tutor.bio || 'لم يضف المدرس نبذة تعريفية بعد.'}</p>
                {tutor.centers.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <h3 className="mb-2.5 inline-flex items-center gap-1.5 text-sm font-black text-slate-700"><MapPin className="h-4 w-4 text-[#2563EB]" />أماكن التدريس</h3>
                    <div className="flex flex-wrap gap-2">
                      {tutor.centers.map((c, i) => (
                        <span key={i} className="rounded-xl border border-blue-100/80 bg-gradient-to-l from-[#EFF6FF] to-[#F5F3FF] px-3.5 py-2 text-xs font-bold text-[#1E3A8A]">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {hasBreakdown && (
                  <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                    {breakdownItems.map(([label, val]) => (
                      <div key={label}>
                        <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-500">{label}</span>
                          <span className="text-[#1E3A8A]">{val.toFixed(1)} / 5</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-gradient-to-l from-[#2563EB] to-[#7C3AED] shadow-sm" style={{ width: `${Math.min((val / 5) * 100, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <section className="card-lux rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white shadow-lg shadow-blue-600/25">
                      <MessageSquare className="h-5 w-5" />
                    </span>
                    <h2 className="text-lg font-black text-[#1E3A8A]">آراء الطلاب</h2>
                  </div>
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">تقييمات بعد حصص مكتملة فقط</span>
                </div>
                {reviews.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">لا توجد تقييمات حقيقية منشورة حتى الآن — كن أول من يقيّم بعد أول حصة.</div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <article key={r.id} className="rounded-2xl border border-slate-100 bg-gradient-to-l from-slate-50/60 to-white p-4 transition-colors hover:border-blue-100">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1">{[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= r.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`} />)}</div>
                          <span className="text-[11px] font-bold text-slate-400">{new Date(r.created_at).toLocaleDateString('ar-EG')}</span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-700">{r.comment || 'بدون تعليق.'}</p>
                        {r.verified_session && (
                          <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />حصة موثّقة
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={140}>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <form onSubmit={submitReview} className="card-lux space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white shadow-lg shadow-blue-600/25">
                      <Star className="h-5 w-5" />
                    </span>
                    <h2 className="text-base font-black text-[#1E3A8A]">اكتب تقييمك</h2>
                  </div>
                  {eligibleBookings.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm leading-7 text-slate-500">التقييم متاح فقط بعد إتمام حصة مع هذا المدرس — نظامنا يمنع التقييمات الوهمية لحماية الطلاب.</p>
                  ) : (
                    <>
                      <label className="block text-xs font-bold text-slate-600">الحصة المكتملة
                        <select value={selectedBookingId} onChange={e => setSelectedBookingId(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100">
                          <option value="">اختر الحصة</option>
                          {eligibleBookings.map(b => <option key={b.id} value={b.id}>{b.id.slice(0, 8)}</option>)}
                        </select>
                      </label>
                      <div>
                        <span className="text-xs font-bold text-slate-600">التقييم العام</span>
                        <div className="mt-2 flex gap-1.5">
                          {[1,2,3,4,5].map(s => (
                            <button type="button" key={s} onClick={() => setRating(s)} className="rounded-xl p-1.5 transition-transform hover:scale-110 active:scale-95" aria-label={`${s} نجوم`}>
                              <Star className={`h-7 w-7 transition-colors ${s <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[["الشرح",teachingQuality,setTeachingQuality],["الالتزام",punctuality,setPunctuality],["التعامل",behavior,setBehavior],["القيمة",valueForMoney,setValueForMoney]].map(([label,val,setter]) => (
                          <label key={label as string} className="block rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs font-bold text-slate-600">
                            {label as string}
                            <select value={val as number} onChange={e => (setter as any)(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]">
                              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </label>
                        ))}
                      </div>
                      <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="اكتب رأيك باختصار..." rows={4} className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-100" />
                      <button disabled={savingReview} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#2563EB] to-[#7C3AED] py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.97] disabled:opacity-60">
                        {savingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}إرسال التقييم
                      </button>
                    </>
                  )}
                </form>

                <form onSubmit={submitReport} className="card-lux space-y-4 rounded-3xl border border-red-100/90 bg-white p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-600/25">
                      <Flag className="h-5 w-5" />
                    </span>
                    <h2 className="text-base font-black text-red-700">الإبلاغ عن المدرس</h2>
                  </div>
                  <p className="rounded-2xl border border-red-100 bg-red-50/60 p-3.5 text-xs leading-6 text-red-600">استخدم البلاغ عند وجود مشكلة حقيقية فقط — البلاغ يذهب مباشرة للإدارة ويتمتع بسرية تامة.</p>
                  <label className="block text-xs font-bold text-slate-600">سبب البلاغ
                    <select value={reportCategory} onChange={e => setReportCategory(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-100">
                      <option value="inappropriate_conduct">سلوك غير مناسب</option>
                      <option value="external_payment_demand">طلب دفع خارج المنصة</option>
                      <option value="absence_no_notice">غياب بدون إخطار</option>
                      <option value="verbal_abuse">إساءة لفظية</option>
                      <option value="fraud">احتيال</option>
                      <option value="other">سبب آخر</option>
                    </select>
                  </label>
                  <textarea value={reportDetails} onChange={e => setReportDetails(e.target.value)} placeholder="اشرح المشكلة بالتفصيل..." rows={6} className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100" />
                  <button disabled={sendingReport} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-red-600 to-rose-600 py-3.5 text-sm font-black text-white shadow-lg shadow-red-600/25 transition-all hover:shadow-xl hover:shadow-red-600/30 active:scale-[0.97] disabled:opacity-60">
                    {sendingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}إرسال البلاغ
                  </button>
                </form>
              </div>
            </ScrollReveal>
          </div>

          {/* ===== الشريط الجانبي ===== */}
          <ScrollReveal direction="up" delay={80}>
            <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              <section className="card-lux relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6">
                <div className="pointer-events-none absolute -left-14 -top-14 h-40 w-40 rounded-full bg-gradient-to-br from-blue-100/70 to-violet-100/60 blur-2xl" />
                <div className="relative">
                  <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400"><Sparkles className="h-4 w-4 text-violet-500" />التقييم العام</div>
                  <div className="flex items-end gap-2">
                    <span className="bg-gradient-to-l from-[#2563EB] to-[#7C3AED] bg-clip-text text-5xl font-black leading-none text-transparent">{tutor.rating.toFixed(1)}</span>
                    <span className="pb-1 text-sm font-bold text-slate-400">/ 5</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1">{[1,2,3,4,5].map(s => <Star key={s} className={`h-5 w-5 ${s <= Math.round(tutor.rating) ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`} />)}</div>
                  <div className="mt-2 text-xs font-bold text-slate-400">{tutor.reviewsCount} تقييم موثّق من طلاب حضروا حصصًا فعلية</div>
                </div>

                {tutor.pricePerSession > 0 && (
                  <div className="relative mt-5 rounded-2xl border border-blue-100/80 bg-gradient-to-l from-[#EFF6FF] to-[#F5F3FF] p-4">
                    <div className="text-xs font-bold text-slate-500">سعر الحصة</div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-[#1E3A8A]">{tutor.pricePerSession}</span>
                      <span className="text-xs font-bold text-slate-400">ج.م / حصة</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600"><ShieldCheck className="h-3.5 w-3.5" />الدفع محمي عبر المنصة</div>
                  </div>
                )}

                {onOpenBooking && (
                  <button onClick={() => onOpenBooking(tutor)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#2563EB] to-[#7C3AED] py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.97]">
                    <Calendar className="w-4 h-4" />احجز مع المدرس
                  </button>
                )}
                <button onClick={() => onNavigate('/search')} className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition-all hover:border-slate-900 hover:bg-slate-900 hover:text-white active:scale-[0.97]">
                  <Users className="w-4 h-4" />مدرسين آخرين
                </button>
              </section>
            </aside>
          </ScrollReveal>
        </div>
      </main>
    </div>
  );
};
