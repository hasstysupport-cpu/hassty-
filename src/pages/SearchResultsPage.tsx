import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, Star, MapPin, X, Users, ChevronDown, Award, Sparkles } from 'lucide-react';
import { useSEO } from '../lib/useSEO';
import { supabase } from '../lib/supabase';
import { SUBJECTS_DATA, CITIES_BY_GOVERNORATE } from '../data/mockData';
import { LocationSelector } from '../components/common/LocationSelector';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { TutorProfile } from '../types';

interface PublicTeacherRow {
  id: string;
  name: string;
  title: string;
  headline: string;
  subjects: string[];
  grades: string[];
  governorate: string;
  city: string;
  rating: number;
  reviews_count: number;
  price_per_session: number;
  price_per_month: number;
  experience_years: number;
  center_names: string[];
  avatar_url: string;
  is_verified: boolean;
}

interface SearchResultsPageProps {
  initialSubject?: string;
  initialGovernorate?: string;
  initialCity?: string;
  onNavigate: (path: string) => void;
  onSelectTutor: (tutorId: string) => void;
  onBookTutor?: (tutor: TutorProfile) => void;
}

type SortKey = 'rating' | 'reviews' | 'price' | 'exp';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'rating', label: 'الأعلى تقييمًا' },
  { key: 'reviews', label: 'الأكثر تقييمات' },
  { key: 'exp', label: 'الأكثر خبرة' },
  { key: 'price', label: 'الأقل سعرًا' },
];

/** حقل اختيار مخصص (select) بأسهم أنيقة — نفس لغة التصميم الفخمة */
const LuxSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  ariaLabel?: string;
}> = ({ value, onChange, children, icon, ariaLabel }) => (
  <div className="relative">
    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#2563EB]">{icon}</div>
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3.5 pr-10 pl-9 text-sm font-bold text-slate-700 outline-none transition-all hover:border-blue-300 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
);

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  initialSubject = '',
  initialGovernorate = '',
  initialCity = '',
  onNavigate: _onNavigate,
  onSelectTutor,
  onBookTutor,
}) => {
  const [subject, setSubject] = useState(initialSubject);
  const [governorate, setGovernorate] = useState(initialGovernorate);
  const [city, setCity] = useState(initialCity);
  const [grade, setGrade] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('rating');
  const [teachers, setTeachers] = useState<PublicTeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useSEO({
    title: subject ? `مدرسين ${subject} المعتمدين في مصر` : 'المدرسين المعتمدين للدروس الخصوصية في مصر',
    description: 'دوّر على مدرسين معتمدين قريبين منك على منصة حِصّتي: صفِّ النتائج بالمادة والمحافظة والمنطقة والمرحلة، وشوف التقييمات وأسعار الحصص واحجز فوراً.',
    canonicalPath: '/search',
    breadcrumbs: ['المدرسين المعتمدين'],
    keywords: `مدرس ${subject || 'خصوصي'} قريب مني, احسن مدرس ${subject || 'خصوصي'}, مدرسين معتمدين في مصر, دروس خصوصية, تقوية, معلم خصوصي, حِصّتي, Hassty tutor search`,
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      if (!supabase) {
        setTeachers([]);
        setError('قاعدة البيانات غير متاحة حاليًا.');
        setLoading(false);
        return;
      }
      try {
        const { data, error: queryError } = await supabase
          .from('public_verified_teachers')
          .select('*')
          .order('rating', { ascending: false })
          .order('reviews_count', { ascending: false });
        if (!active) return;
        if (!queryError && data) {
          setTeachers(data as PublicTeacherRow[]);
          setLoading(false);
          return;
        }

        // Fallback: Query tutor_profiles & profiles directly
        const { data: tpList, error: tpError } = await supabase
          .from('tutor_profiles')
          .select('*')
          .order('rating', { ascending: false });
        if (tpError) throw tpError;

        const userIds = (tpList || []).map((t: any) => t.user_id).filter(Boolean);
        let profileMap = new Map<string, any>();
        if (userIds.length > 0) {
          const { data: profs } = await supabase.from('profiles').select('*').in('id', userIds);
          profileMap = new Map((profs || []).map((p: any) => [p.id, p]));
        }

        const combined: PublicTeacherRow[] = (tpList || []).map((t: any) => {
          const p = profileMap.get(t.user_id) || {};
          return {
            id: t.user_id,
            name: p.full_name || 'مدرس معتمد',
            title: t.title || 'معلم متخصص',
            headline: t.headline || '',
            subjects: Array.isArray(t.subjects) ? t.subjects : [],
            grades: Array.isArray(t.grades) ? t.grades : [],
            governorate: p.governorate || t.governorate || '',
            city: p.city || t.city || '',
            rating: Number(t.rating || 5.0),
            reviews_count: Number(t.reviews_count || 0),
            price_per_session: Number(t.price_per_session || 0),
            price_per_month: Number(t.price_per_month || 0),
            experience_years: Number(t.experience_years || 1),
            center_names: Array.isArray(t.center_names) ? t.center_names : [],
            avatar_url: p.avatar_url || '',
            is_verified: t.is_verified === true || t.verification_status === 'approved',
          };
        });

        if (active) {
          setTeachers(combined);
        }
      } catch (err: any) {
        console.error('Verified teacher directory error:', err);
        if (active) {
          setTeachers([]);
          setError('تعذر تحميل المدرسين المعتمدين حاليًا.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const list = teachers.filter((teacher) => {
      if (subject && !(teacher.subjects || []).some((s) => s === subject || s.includes(subject))) return false;
      if (governorate && teacher.governorate !== governorate) return false;
      if (city && teacher.city !== city) return false;
      if (grade !== 'all' && !(teacher.grades || []).some((g) => g.includes(grade))) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = [teacher.name, teacher.title, teacher.headline, ...(teacher.subjects || []), ...(teacher.grades || [])].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...list];
    if (sortBy === 'rating') sorted.sort((a, b) => b.rating - a.rating || b.reviews_count - a.reviews_count);
    else if (sortBy === 'reviews') sorted.sort((a, b) => b.reviews_count - a.reviews_count || b.rating - a.rating);
    else if (sortBy === 'exp') sorted.sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0));
    else if (sortBy === 'price') sorted.sort((a, b) => (a.price_per_session || Infinity) - (b.price_per_session || Infinity));
    return sorted;
  }, [teachers, subject, governorate, city, grade, search, sortBy]);

  const cities = governorate ? (CITIES_BY_GOVERNORATE[governorate] || []) : [];

  const toTutorProfile = (teacher: PublicTeacherRow): TutorProfile => ({
    id: teacher.id,
    name: teacher.name,
    title: teacher.title,
    subject: teacher.subjects?.[0] || '',
    governorate: teacher.governorate,
    area: teacher.city,
    rating: Number(teacher.rating || 0),
    reviewsCount: Number(teacher.reviews_count || 0),
    studentsCount: 0,
    pricePerSession: Number(teacher.price_per_session || 0),
    isVerified: true,
    joinCode: '',
    levels: teacher.grades || [],
    avatarUrl: teacher.avatar_url || '',
    bio: teacher.headline || '',
    experienceYears: teacher.experience_years || 0,
    centers: teacher.center_names || [],
    phone: '',
    email: '',
    education: '',
    accountStatus: 'active',
    reviews: [],
    availableSlots: [],
  });

  const reset = () => {
    setSubject('');
    setGovernorate('');
    setCity('');
    setGrade('all');
    setSearch('');
  };

  const hasActiveFilters = Boolean(subject || governorate || city || grade !== 'all' || search);

  return (
    <section dir="rtl" className="relative min-h-screen overflow-hidden bg-[#F6F9FF] py-8 sm:py-12">
      {/* هالات ضوئية محيطة — نفس أجواء الصفحة الرئيسية */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/15 via-indigo-300/10 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -left-24 h-80 w-80 rounded-full bg-gradient-to-tr from-violet-300/12 via-purple-200/10 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-gradient-to-tl from-emerald-300/10 via-teal-100/10 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ===== بطاقة البحث الرئيسية ===== */}
        <ScrollReveal direction="up">
          <div className="relative mb-8 overflow-hidden rounded-[28px] border border-blue-100/80 bg-white p-6 shadow-[0_24px_70px_-30px_rgba(30,58,138,0.28)] sm:p-8">
            <div className="absolute inset-x-12 top-0 h-[3px] rounded-b-full bg-gradient-to-l from-[#2563EB] to-[#7C3AED] opacity-60" />
            <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-blue-100/70 to-violet-100/60 blur-2xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end">
              <div className="flex-1">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-gradient-to-l from-emerald-50 to-teal-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  مدرسون موثّقون من الإدارة فقط
                </div>
                <h1 className="text-2xl font-black leading-snug text-slate-900 sm:text-4xl">
                  ابحث عن{' '}
                  <span className="bg-gradient-to-l from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">مدرسك المعتمد</span>
                </h1>
                <p className="mt-2.5 max-w-lg text-sm leading-7 text-slate-500 sm:text-base">
                  لا تظهر أي بطاقة مدرس إلا بعد موافقة الإدارة واعتماد التوثيق — قيّم، قارن الأسعار، واحجز في دقيقة.
                </p>
              </div>

              <div className="relative w-full lg:max-w-md">
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white shadow-lg shadow-blue-600/25">
                    <Search className="h-4 w-4" />
                  </span>
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="اسم المدرس أو المادة أو المرحلة..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3.5 pr-14 pl-11 text-sm font-medium outline-none transition-all placeholder:text-slate-400 hover:border-blue-200 focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute left-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500" aria-label="مسح البحث">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="relative mt-6 grid grid-cols-1 gap-3.5 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
              <LuxSelect value={subject} onChange={setSubject} icon={<Sparkles className="h-4 w-4" />} ariaLabel="المادة">
                <option value="">كل المواد</option>
                {SUBJECTS_DATA.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
              </LuxSelect>
              <LocationSelector
                selectedGovernorate={governorate}
                selectedCity={city}
                onSelectGovernorate={(value) => { setGovernorate(value); setCity(''); }}
                onSelectCity={setCity}
                showCitySelect
                placeholder="المحافظة والمدينة"
                className="[&_button]:rounded-2xl [&_button]:py-3.5"
              />
              <LuxSelect value={grade} onChange={setGrade} icon={<Users className="h-4 w-4" />} ariaLabel="المرحلة">
                <option value="all">كل المراحل</option>
                <option value="الابتدائية">الابتدائية</option>
                <option value="الإعدادية">الإعدادية</option>
                <option value="الثانوية">الثانوية</option>
              </LuxSelect>
              <button
                onClick={reset}
                disabled={!hasActiveFilters}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm font-bold text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                مسح الفلاتر
              </button>
            </div>
            {governorate && cities.length === 0 && <div className="mt-2.5 text-xs text-slate-400">لا توجد مدن معرفة لهذه المحافظة.</div>}
          </div>
        </ScrollReveal>

        {/* ===== شريط النتائج والترتيب ===== */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-gradient-to-l from-[#EFF6FF] to-[#F5F3FF] px-4 py-2.5 text-sm font-black text-[#1E3A8A] shadow-sm">
            <Users className="h-4 w-4 text-[#2563EB]" />
            {loading ? 'جاري التحميل...' : `${filtered.length} مدرس معتمد`}
          </div>
          <div className="w-full sm:w-52">
            <LuxSelect value={sortBy} onChange={(v) => setSortBy(v as SortKey)} icon={<Award className="h-4 w-4" />} ariaLabel="ترتيب النتائج">
              {SORT_OPTIONS.map((opt) => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
            </LuxSelect>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-gradient-to-l from-red-50 to-white p-8 text-center text-sm font-bold text-red-700">{error}</div>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-3xl border border-slate-200/80 bg-gradient-to-l from-slate-100/90 via-slate-50 to-slate-100/90" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-12 text-center shadow-sm">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-blue-100/60 to-violet-100/50 blur-2xl" />
            <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white shadow-lg shadow-blue-600/25">
              <Search className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-black text-slate-800">لا يوجد مدرسون معتمدون مطابقون</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-slate-500">جرّب تغيير المادة أو المحافظة أو المرحلة — أو امسح الفلاتر لتصفّح كل المدرسين المعتمدين.</p>
            {hasActiveFilters && (
              <button onClick={reset} className="mt-5 rounded-2xl bg-gradient-to-l from-[#2563EB] to-[#7C3AED] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition-transform active:scale-[0.97]">
                مسح الفلاتر وعرض الجميع
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((teacher, idx) => {
              const tutor = toTutorProfile(teacher);
              return (
                <article
                  key={teacher.id}
                  className="card-lux anim-up flex flex-col rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm"
                  style={{ animationDelay: `${Math.min(idx * 60, 360)}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 rounded-[22px] bg-gradient-to-br from-[#2563EB] to-[#7C3AED] p-[2.5px] shadow-lg shadow-blue-600/20">
                      <div className="h-16 w-16 overflow-hidden rounded-[19px] bg-slate-50">
                        {teacher.avatar_url ? (
                          <img src={teacher.avatar_url} alt={teacher.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xl font-black text-blue-300">{teacher.name.slice(0, 1)}</div>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black text-slate-900">{teacher.name}</h3>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-100 bg-gradient-to-l from-blue-50 to-violet-50 px-2.5 py-1 text-[11px] font-extrabold text-blue-700">
                          <ShieldCheck className="h-3.5 w-3.5" /> موثّق
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-bold text-slate-500">{teacher.title || teacher.headline || 'مدرس معتمد'}</p>
                      <div className="mt-1.5 flex items-center gap-1 text-xs font-bold text-slate-600">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        {Number(teacher.rating || 0).toFixed(1)}
                        <span className="text-slate-400">({teacher.reviews_count || 0} تقييم)</span>
                      </div>
                    </div>
                  </div>

                  {(teacher.subjects || []).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {(teacher.subjects || []).slice(0, 3).map((item) => (
                        <span key={item} className="rounded-xl border border-blue-100/80 bg-gradient-to-l from-[#EFF6FF] to-[#F5F3FF] px-3 py-1.5 text-[11px] font-bold text-[#1E3A8A]">{item}</span>
                      ))}
                    </div>
                  )}

                  {teacher.headline && <p className="mt-3.5 line-clamp-2 min-h-10 text-sm leading-7 text-slate-600">{teacher.headline}</p>}

                  <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-bold">
                      <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
                      <span className="truncate">{teacher.governorate}{teacher.city ? ` — ${teacher.city}` : '— كل المحافظات'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <Award className="h-4 w-4 shrink-0 text-violet-500" />
                      <span className="truncate">{teacher.experience_years || 0} سنة خبرة</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4">
                    <div className="mb-3 flex items-end justify-between gap-3">
                      {Number(teacher.price_per_session) > 0 ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-black text-[#1E3A8A]">{teacher.price_per_session}</span>
                          <span className="text-[11px] font-bold text-slate-400">ج.م / حصة</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">السعر عند الحجز</span>
                      )}
                      {(teacher.grades || []).length > 0 && (
                        <span className="truncate text-[11px] font-bold text-slate-400">{(teacher.grades || []).slice(0, 2).join(' · ')}</span>
                      )}
                    </div>
                    <div className="flex gap-2.5">
                      <button onClick={() => onSelectTutor(teacher.id)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition-all hover:border-slate-900 hover:bg-slate-900 hover:text-white active:scale-[0.97]">
                        عرض الملف
                      </button>
                      <button onClick={() => onBookTutor?.(tutor)} className="flex-1 rounded-2xl bg-gradient-to-l from-[#2563EB] to-[#7C3AED] px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.97]">
                        طلب حجز
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
