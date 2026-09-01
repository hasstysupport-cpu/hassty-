import React, { useMemo, useState } from 'react';
import {
  GraduationCap, Users, Briefcase, CheckCircle2, AlertCircle, Loader2, UserCheck, Phone, MapPin,
  BookOpen, Award, Heart, ShieldCheck, Sparkles, ArrowRight,
} from 'lucide-react';
import { AccountRole } from '../types';
import { useAuth } from '../lib/AuthContext';
import { authApi } from '../lib/authApi';
import { LocationSelector } from '../components/common/LocationSelector';
import { SUBJECTS_DATA } from '../data/mockData';
import { SIGNUP_CONSENT_KEY } from '../lib/legal';

interface ProfileSetupPageProps {
  onComplete: (role: AccountRole) => void;
  onLogout: () => void;
}

const GRADES = [
  'الصف الأول الابتدائي', 'الصف الثاني الابتدائي', 'الصف الثالث الابتدائي',
  'الصف الرابع الابتدائي', 'الصف الخامس الابتدائي', 'الصف السادس الابتدائي',
  'الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي',
  'الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي',
];

const ROLE_CARDS: { role: AccountRole; icon: any; title: string; desc: string }[] = [
  { role: 'student', icon: GraduationCap, title: 'طالب', desc: 'احجز حصصك وتابع حضورك ودرجاتك' },
  { role: 'parent', icon: Users, title: 'ولي أمر', desc: 'تابع أبناءك لحظة بلحظة' },
  { role: 'teacher', icon: Briefcase, title: 'معلم', desc: 'أدر مجموعاتك باحترافية' },
];

export const ProfileSetupPage: React.FC<ProfileSetupPageProps> = ({ onComplete, onLogout }) => {
  const { user } = useAuth();
  const googleFirstLogin = typeof window !== 'undefined' && Boolean(localStorage.getItem('hassty_google_login_started_at'));

  const [role, setRole] = useState<AccountRole>('student');
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [governorate, setGovernorate] = useState(user?.governorate || 'القاهرة');
  const [city, setCity] = useState(user?.area || 'مدينة نصر');
  const [grade, setGrade] = useState('الصف الثالث الثانوي');
  const [subject, setSubject] = useState('الرياضيات');
  const [experienceYears, setExperienceYears] = useState('3 - 5 سنوات');
  const [studentJoinCode, setStudentJoinCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const roleInfo = ROLE_CARDS.find((r) => r.role === role)!;
  const nameReady = fullName.trim().length >= 3 || (user?.name || '').trim().length >= 3;

  const validate = (): string | null => {
    if (!nameReady) return 'أدخل اسمك الكامل (3 أحرف على الأقل).';
    if (!/^01[0125][0-9]{8}$/.test(phone.trim())) return 'أدخل رقم هاتف مصري صحيح (مثال: 01012345678).';
    if (!governorate || !city) return 'اختر المحافظة والمدينة/المنطقة.';
    if (role === 'student' && !grade) return 'اختر الصف الدراسي.';
    if (role === 'teacher' && !subject) return 'اختر المادة الدراسية.';
    if (!agreeTerms || !agreePrivacy) return 'يجب الموافقة على الشروط وسياسة الخصوصية.';
    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setError('');
    setIsSaving(true);
    try {
      const res = await authApi.profileComplete({
        role,
        fullName: fullName.trim() || user?.name || '',
        phone: phone.trim(),
        governorate,
        city,
        grade: role === 'student' ? grade : undefined,
        subject: role === 'teacher' ? subject : undefined,
        experienceYears: role === 'teacher' ? experienceYears : undefined,
        studentJoinCode: role === 'parent' && studentJoinCode.trim() ? studentJoinCode.trim() : undefined,
        consent: true,
      });
      if (!res.ok) {
        setError(res.error || 'تعذر حفظ البيانات. حاول مجددًا.');
        return;
      }
      try { localStorage.setItem(SIGNUP_CONSENT_KEY, 'accepted'); } catch { /* ignore */ }
      onComplete((res.role as AccountRole) || role);
    } catch (err: any) {
      setError(err?.message || 'تعذر حفظ البيانات.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#F6F9FF] text-right font-['IBM_Plex_Sans_Arabic',sans-serif] flex flex-col">
      {/* خلفية ناعمة */}
      <div className="absolute top-[-120px] left-[-120px] w-[380px] h-[380px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[-140px] right-[-100px] w-[360px] h-[360px] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="flex-1 flex items-center justify-center px-4 py-10 relative z-10">
        <div className="w-full max-w-2xl card-lux bg-white border border-slate-200/90 rounded-3xl shadow-[0_24px_70px_-30px_rgba(30,58,138,0.35)] overflow-hidden anim-up" data-role={role}>

          {/* header */}
          <div className="px-7 pt-7 pb-5 bg-gradient-to-l from-[#EFF6FF] via-white to-[#F5F3FF] border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                <Sparkles className="w-6.5 h-6.5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-black text-slate-900 leading-tight">أكمل بيانات حسابك</h1>
                <p className="text-xs text-slate-500 mt-1 font-semibold">
                  {googleFirstLogin ? 'مرحبًا بك عبر Google 👋 خطوة أخيرة لتخصيص تجربتك' : 'خطوة أخيرة لتخصيص تجربتك في حِصّتي'}
                  {user?.email && <span dir="ltr" className="block text-[10px] text-slate-400 mt-0.5">{user.email}</span>}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-7 mt-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-[13px] font-bold anim-fade">
              <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="p-7 space-y-5">
            {/* ---------- role ---------- */}
            <div className="space-y-2.5">
              <div className="text-xs font-black text-slate-600">١. اختر نوع حسابك</div>
              <div className="grid sm:grid-cols-3 gap-3">
                {ROLE_CARDS.map((card) => (
                  <button
                    key={card.role}
                    type="button"
                    data-role={card.role}
                    onClick={() => setRole(card.role)}
                    className={`role-card p-4 text-right ${role === card.role ? 'selected' : ''}`}
                  >
                    <span className="role-check"><CheckCircle2 className="w-4 h-4" /></span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundImage: 'var(--role-grad)' }}>
                        <card.icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-900">{card.title}</div>
                        <div className="text-[10px] text-slate-500 font-semibold leading-snug mt-0.5">{card.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ---------- data ---------- */}
            <div className="space-y-4">
              <div className="text-xs font-black text-slate-600">٢. بياناتك الأساسية</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="relative">
                  <UserCheck className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={`الاسم الكامل${user?.name ? ' (من حسابك)' : ''}`} className="auth-input w-full p-3.5 pr-11 text-sm" />
                </div>
                <div className="relative">
                  <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input dir="ltr" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" className="auth-input w-full p-3.5 pr-11 text-sm text-left" />
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3 text-xs font-black text-slate-600">
                  <MapPin className="w-4 h-4 text-[#2563EB]" />
                  المحافظة والمدينة
                </div>
                <LocationSelector
                  selectedGovernorate={governorate}
                  selectedCity={city}
                  onSelectGovernorate={setGovernorate}
                  onSelectCity={setCity}
                  showCitySelect
                  placeholder="اختر محافظتك ومدينتك"
                />
              </div>

              {role === 'student' && (
                <div className="relative">
                  <GraduationCap className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select value={grade} onChange={(e) => setGrade(e.target.value)} className="auth-input w-full p-3.5 pr-11 text-sm appearance-none cursor-pointer">
                    {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              )}

              {role === 'teacher' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <BookOpen className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select value={subject} onChange={(e) => setSubject(e.target.value)} className="auth-input w-full p-3.5 pr-11 text-sm appearance-none cursor-pointer">
                      {SUBJECTS_DATA.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <Award className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className="auth-input w-full p-3.5 pr-11 text-sm appearance-none cursor-pointer">
                      {['أقل من سنة', 'سنة - 3 سنوات', '3 - 5 سنوات', '5 - 10 سنوات', 'أكثر من 10 سنوات'].map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {role === 'parent' && (
                <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-4">
                  <label className="text-xs font-black text-slate-700 flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-amber-500" />
                    كود الطالب (اختياري)
                  </label>
                  <input dir="ltr" value={studentJoinCode} onChange={(e) => setStudentJoinCode(e.target.value)} placeholder="HASSTY-XXXXXX أو رقم هاتف الطالب" className="auth-input w-full p-3 text-sm text-left" />
                </div>
              )}
            </div>

            {/* ---------- consent ---------- */}
            <div className="space-y-2.5">
              <div className="text-xs font-black text-slate-600">٣. الموافقة</div>
              <div className="bg-[#F8FAFF] border border-slate-200 rounded-2xl p-4 space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-1 w-4 h-4 accent-[#2563EB] cursor-pointer" />
                  <span className="text-[12px] font-bold text-slate-600 leading-relaxed">
                    أوافق على <span className="text-[#2563EB] font-black">الشروط والأحكام</span>
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-1 w-4 h-4 accent-[#2563EB] cursor-pointer" />
                  <span className="text-[12px] font-bold text-slate-600 leading-relaxed">
                    أوافق على <span className="text-[#2563EB] font-black">سياسة الخصوصية</span> ومعالجة بياناتي لأغراض المنصة التعليمية
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onLogout} className="px-5 p-3.5 rounded-2xl border-2 border-slate-200 text-slate-500 font-black text-sm hover:bg-slate-50">
                خروج
              </button>
              <button type="submit" disabled={isSaving || !agreeTerms || !agreePrivacy} className="auth-btn flex-1 p-3.5 rounded-2xl text-white font-black text-sm btn-primary-shine flex items-center justify-center gap-2 disabled:opacity-50">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {isSaving ? 'جاري الحفظ...' : `إكمال حسابي كـ ${roleInfo.title}`}
                <ArrowRight className="w-4.5 h-4.5 rotate-180" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="pb-5 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        بياناتك محمية ومشفّرة — تُستخدم فقط داخل المنصة
      </div>
    </div>
  );
};
