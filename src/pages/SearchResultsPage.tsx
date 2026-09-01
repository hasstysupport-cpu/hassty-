import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, Star, MapPin, X, Users } from 'lucide-react';
import { useSEO } from '../lib/useSEO';
import { supabase } from '../lib/supabase';
import { SUBJECTS_DATA, CITIES_BY_GOVERNORATE } from '../data/mockData';
import { LocationSelector } from '../components/common/LocationSelector';
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
  const [teachers, setTeachers] = useState<PublicTeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useSEO({
    title: subject ? `مدرسين ${subject} المعتمدين في مصر` : 'المدرسين المعتمدين | حِصّتي',
    description: 'ابحث عن المدرسين المعتمدين على منصة حِصّتي حسب المادة والمحافظة والمرحلة.',
    canonicalPath: '/search',
    keywords: `مدرس ${subject || 'خصوصي'}, مدرسين معتمدين, حِصّتي`,
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

  const filtered = useMemo(() => teachers.filter((teacher) => {
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
  }), [teachers, subject, governorate, city, grade, search]);

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

  return (
    <section dir="rtl" className="min-h-screen bg-[#F8FAFF] py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[28px] border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
            <div className="flex-1">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                المدرسون الظاهرون هنا موثقون فقط
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">ابحث عن مدرسك المعتمد</h1>
              <p className="mt-2 text-sm text-slate-500">لا تظهر أي بطاقة مدرس إلا بعد موافقة الإدارة واعتماد التوثيق.</p>
            </div>
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="اسم المدرس أو المادة أو المرحلة..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-10 text-sm outline-none focus:border-blue-400 focus:bg-white"
              />
              {search && <button onClick={() => setSearch('')} className="absolute left-3.5 top-3.5 text-slate-400"><X className="h-4 w-4" /></button>}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold outline-none">
              <option value="">كل المواد</option>
              {SUBJECTS_DATA.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>
            <LocationSelector
              selectedGovernorate={governorate}
              selectedCity={city}
              onSelectGovernorate={(value) => { setGovernorate(value); setCity(''); }}
              onSelectCity={setCity}
              showCitySelect
              placeholder="المحافظة والمدينة"
            />
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold outline-none">
              <option value="all">كل المراحل</option>
              <option value="الابتدائية">الابتدائية</option>
              <option value="الإعدادية">الإعدادية</option>
              <option value="الثانوية">الثانوية</option>
            </select>
            <button onClick={reset} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">مسح الفلاتر</button>
          </div>
          {governorate && cities.length === 0 && <div className="mt-2 text-xs text-slate-400">لا توجد مدن معرفة لهذه المحافظة.</div>}
        </div>

        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm border border-slate-200">
            <Users className="h-4 w-4 text-blue-600" />
            {loading ? 'جاري التحميل...' : `${filtered.length} مدرس معتمد`}
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-sm font-bold text-red-700">{error}</div>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {[1,2,3,4].map((item) => <div key={item} className="h-56 animate-pulse rounded-3xl bg-white border border-slate-200" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100"><Search className="h-6 w-6 text-slate-400" /></div>
            <h2 className="text-lg font-black text-slate-800">لا يوجد مدرسون معتمدون مطابقون</h2>
            <p className="mt-2 text-sm text-slate-500">جرّب تغيير المادة أو المحافظة أو المرحلة.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {filtered.map((teacher) => {
              const tutor = toTutorProfile(teacher);
              return (
                <article key={teacher.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      {teacher.avatar_url ? <img src={teacher.avatar_url} alt={teacher.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><Users className="h-7 w-7" /></div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black text-slate-900">{teacher.name}</h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-blue-700"><ShieldCheck className="h-3.5 w-3.5" /> موثق</span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-600">{teacher.title || teacher.headline || 'مدرس معتمد'}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                    {(teacher.subjects || []).slice(0, 3).map((item) => <span key={item} className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700">{item}</span>)}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{teacher.governorate}{teacher.city ? ` — ${teacher.city}` : ''}</div>
                    <div className="flex items-center gap-1.5"><Star className="h-4 w-4 text-amber-500" />{Number(teacher.rating || 0).toFixed(1)} ({teacher.reviews_count || 0})</div>
                  </div>
                  {teacher.headline && <p className="mt-4 line-clamp-2 text-sm leading-7 text-slate-600">{teacher.headline}</p>}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button onClick={() => onSelectTutor(teacher.id)} className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">عرض الملف</button>
                    <button onClick={() => onBookTutor?.(tutor)} className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700">طلب حجز</button>
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
