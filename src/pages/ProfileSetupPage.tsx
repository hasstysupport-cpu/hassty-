import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, GraduationCap, MapPin, Phone, Save, UserRound, Users, Briefcase, Sparkles } from 'lucide-react';
import { AccountRole } from '../types';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

interface ProfileSetupPageProps {
  onComplete: (role: AccountRole) => void;
  onLogout?: () => void;
}

type SetupRole = Exclude<AccountRole, 'admin'>;

const roleCopy: Record<SetupRole, { title: string; subtitle: string; icon: React.ElementType }> = {
  student: { title: 'كمّل بياناتك كطالب', subtitle: 'خطوة واحدة ونجهز حسابك لاكتشاف المدرسين والحصص.', icon: GraduationCap },
  parent: { title: 'كمّل بيانات ولي الأمر', subtitle: 'أضف بياناتك حتى تتابع أبناءك وحضورهم ومدفوعاتهم.', icon: Users },
  teacher: { title: 'جهّز ملفك كمدرس', subtitle: 'بياناتك الأساسية هتظهر في ملفك بعد إكمال التسجيل، ثم يبدأ التحقق.', icon: Briefcase },
};

export const ProfileSetupPage: React.FC<ProfileSetupPageProps> = ({ onComplete, onLogout }) => {
  const { user, updateUserProfile } = useAuth();
  const googleFirstLogin = typeof window !== 'undefined' && Boolean(localStorage.getItem('hassty_google_login_started_at'));
  const [role, setRole] = useState<SetupRole>((user?.role === 'admin' ? 'student' : user?.role || 'student') as SetupRole);
  const Icon = roleCopy[role].icon;

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [governorate, setGovernorate] = useState(user?.governorate || '');
  const [area, setArea] = useState(user?.area || '');
  const [grade, setGrade] = useState(user?.profileData?.grade || '');
  const [subject, setSubject] = useState(user?.profileData?.subject || '');
  const [experience, setExperience] = useState(String(user?.profileData?.experienceYears || ''));
  const [bio, setBio] = useState(user?.profileData?.bio || '');
  const [parentPhone, setParentPhone] = useState(user?.profileData?.parentPhone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [setupLegalAccepted, setSetupLegalAccepted] = useState(false);
  const [setupLegalBlocked, setSetupLegalBlocked] = useState(false); // setup-legal-consent-v1

  const completion = useMemo(() => {
    const common = [name, phone, governorate, area].filter(Boolean).length;
    const roleFields = role === 'teacher' ? [subject, experience].filter(Boolean).length : role === 'student' ? [grade].filter(Boolean).length : 1;
    const total = role === 'teacher' ? 6 : 5;
    return Math.min(100, Math.round(((common + roleFields) / total) * 100));
  }, [name, phone, governorate, area, grade, subject, experience, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupLegalAccepted) { setSetupLegalBlocked(true); return; }
    if (!user?.uid) {
      setError('تعذر تحديد حسابك الحالي. سجّل الدخول مرة أخرى.');
      return;
    }
    if (!name.trim() || !phone.trim() || !governorate.trim() || !area.trim()) {
      setError('اكتب الاسم ورقم الموبايل والمحافظة والمنطقة عشان نكمل الحساب.');
      return;
    }
    if (role === 'student' && !grade.trim()) {
      setError('اختار المرحلة أو الصف الدراسي.');
      return;
    }
    if (role === 'teacher' && (!subject.trim() || !experience.trim())) {
      setError('اكتب المادة وسنوات الخبرة على الأقل.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        governorate: governorate.trim(),
        area: area.trim(),
        role,
        ...(role === 'student' ? { grade: grade.trim(), parentPhone: parentPhone.trim() } : {}),
        ...(role === 'teacher' ? { subject: subject.trim(), experienceYears: experience.trim(), bio: bio.trim() } : {}),
      });

      if (googleFirstLogin && supabase) {
        const { data: existingProfile, error: profileReadError } = await supabase
          .from('profiles')
          .select('metadata,qr_code')
          .eq('id', user.uid)
          .maybeSingle();
        if (profileReadError) throw profileReadError;

        const metadata = {
          ...((existingProfile?.metadata || {}) as Record<string, any>),
          onboardingCompleted: true,
          onboardingSource: 'google',
          ...(role === 'student' ? { grade: grade.trim(), parentPhone: parentPhone.trim() } : {}),
          ...(role === 'teacher' ? { subject: subject.trim(), experienceYears: experience.trim(), bio: bio.trim() } : {}),
        };

        const profilePayload: Record<string, any> = {
          id: user.uid,
          full_name: name.trim(),
          phone: phone.trim(),
          governorate: governorate.trim(),
          city: area.trim(),
          role,
          account_status: 'active',
          metadata,
          updated_at: new Date().toISOString(),
        };

        if (role === 'student' && !existingProfile?.qr_code) {
          profilePayload.qr_code = `HASSTY-${user.uid.substring(0, 8).toUpperCase()}`;
        }

        const { error: profileWriteError } = await supabase
          .from('profiles')
          .upsert(profilePayload, { onConflict: 'id' });
        if (profileWriteError) throw profileWriteError;

        if (role === 'teacher') {
          const { error: tutorError } = await supabase
            .from('tutor_profiles')
            .upsert({
              user_id: user.uid,
              title: `معلم ${subject.trim()}`,
              headline: `معلم ${subject.trim()}`,
              bio: bio.trim() || null,
              subjects: [subject.trim()],
              grades: grade ? [grade.trim()] : [],
              experience_years: Number.parseInt(experience.replace(/[^0-9]/g, ''), 10) || 0,
              experience_years_text: experience.trim(),
              governorate: governorate.trim(),
              city: area.trim(),
              is_verified: false,
              verification_status: 'pending',
              metadata: { onboardingCompleted: true, onboardingSource: 'google' },
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
          if (tutorError) throw tutorError;
        }

        localStorage.removeItem('hassty_google_login_started_at');
        localStorage.removeItem('hassty_google_profile_setup');

        const destination = role === 'teacher' ? '/teacher/dashboard' : role === 'parent' ? '/parent/dashboard' : '/student/dashboard';
        window.location.assign(destination);
        return;
      }

      onComplete(role);
    } catch (err: any) {
      setError(err?.message || 'تعذر حفظ البيانات. جرّب مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.09),_transparent_30%),linear-gradient(180deg,#F7FAFF_0%,#FFFFFF_52%,#EEF5FF_100%)] px-3 py-4 sm:px-4 sm:py-8 lg:py-12">
      <div className="mx-auto grid w-full max-w-5xl items-start gap-4 sm:gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <section className="relative hidden overflow-hidden rounded-[28px] bg-[#0F2F6B] p-7 text-white shadow-xl shadow-blue-900/10 lg:block lg:rounded-[32px] lg:p-9">
          <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold">
              <Sparkles className="h-4 w-4" />
              {googleFirstLogin ? 'أول تسجيل بحساب Google' : 'إكمال الحساب'}
            </div>

            {googleFirstLogin && (
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-sm font-black">اختار نوع حسابك أولًا</p>
                <p className="mt-1 text-xs leading-6 text-blue-100/80">مش هنفترض إنك طالب. اختار الدور اللي يناسبك قبل ما نكمل بيانات الحساب.</p>
              </div>
            )}

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <Icon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black leading-tight sm:text-3xl">{roleCopy[role].title}</h1>
              <p className="mt-2 text-sm leading-7 text-blue-100/80">{roleCopy[role].subtitle}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <div className="mb-2 flex items-center justify-between text-xs font-bold">
                <span>اكتمال الحساب</span>
                <span>{completion}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${completion}%` }} />
              </div>
            </div>
            <div className="space-y-3 text-xs text-blue-100/80">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> حساب Google مربوط بحسابك.</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> بياناتك محفوظة في Supabase.</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> تقدر تعدّل ملفك من الإعدادات لاحقًا.</div>
            </div>
          </div>
        </section>

        <section className="min-w-0 w-full rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6 lg:rounded-[32px] lg:p-8">
          <div className="mb-5 flex items-start justify-between gap-3 sm:mb-7">
            <div className="min-w-0">
              <div className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 sm:text-xs">
                <UserRound className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 truncate" dir="ltr">{user?.email}</span>
              </div>
              <h2 className="mt-3 text-xl font-black leading-tight text-slate-900 sm:text-2xl">{googleFirstLogin ? 'اختار دورك وكمّل حسابك' : 'بيانات الحساب الأساسية'}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">لن نطلب منك نفس البيانات مرة ثانية.</p>
            </div>
            {onLogout && <button onClick={onLogout} type="button" className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-red-50 hover:text-red-600">تسجيل الخروج</button>}
          </div>

          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 lg:hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-blue-900">{roleCopy[role].title}</p>
              <p className="mt-0.5 text-[11px] leading-5 text-slate-600">{googleFirstLogin ? 'اختار الدور المناسب ثم أكمل البيانات.' : roleCopy[role].subtitle}</p>
            </div>
            <div className="shrink-0 text-center">
              <div className="text-sm font-black text-blue-700">{completion}%</div>
              <div className="text-[9px] font-bold text-slate-500">اكتمل</div>
            </div>
          </div>

          {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700">{error}</div>}

          {googleFirstLogin && (
            <div className="mb-6 grid grid-cols-3 gap-2">
              {(Object.keys(roleCopy) as SetupRole[]).map((candidate) => {
                const CandidateIcon = roleCopy[candidate].icon;
                const active = role === candidate;
                return (
                  <button key={candidate} type="button" onClick={() => setRole(candidate)} className={`min-w-0 rounded-2xl border-2 p-3 text-center transition-all ${active ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300'}`}>
                    <CandidateIcon className="mx-auto mb-1.5 h-5 w-5" />
                    <span className="text-[11px] font-black sm:text-xs">{candidate === 'student' ? 'طالب' : candidate === 'parent' ? 'ولي أمر' : 'مدرس'}</span>
                  </button>
                );
              })}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم الكامل" icon={<UserRound className="h-4 w-4" />}>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="اكتب اسمك بالكامل" autoComplete="name" />
              </Field>
              <Field label="رقم الموبايل" icon={<Phone className="h-4 w-4" />}>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" inputMode="tel" placeholder="01xxxxxxxxx" autoComplete="tel" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="المحافظة" icon={<MapPin className="h-4 w-4" />}>
                <input value={governorate} onChange={(e) => setGovernorate(e.target.value)} className="input" placeholder="مثال: كفر الشيخ" autoComplete="address-level1" />
              </Field>
              <Field label="المنطقة / المدينة" icon={<MapPin className="h-4 w-4" />}>
                <input value={area} onChange={(e) => setArea(e.target.value)} className="input" placeholder="مثال: فوه" autoComplete="address-level2" />
              </Field>
            </div>

            {role === 'student' && (
              <>
                <Field label="الصف أو المرحلة الدراسية" icon={<BookOpen className="h-4 w-4" />}>
                  <input value={grade} onChange={(e) => setGrade(e.target.value)} className="input" placeholder="مثال: الصف الثالث الثانوي" />
                </Field>
                <Field label="رقم ولي الأمر (اختياري)" icon={<Users className="h-4 w-4" />}>
                  <input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className="input" inputMode="tel" placeholder="01xxxxxxxxx" autoComplete="tel" />
                </Field>
              </>
            )}

            {role === 'teacher' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="المادة الأساسية" icon={<BookOpen className="h-4 w-4" />}>
                    <input value={subject} onChange={(e) => setSubject(e.target.value)} className="input" placeholder="مثال: الرياضيات" />
                  </Field>
                  <Field label="سنوات الخبرة" icon={<Briefcase className="h-4 w-4" />}>
                    <input value={experience} onChange={(e) => setExperience(e.target.value)} className="input" placeholder="مثال: 8 سنوات" />
                  </Field>
                </div>
                <Field label="نبذة قصيرة عنك" icon={<Sparkles className="h-4 w-4" />}>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="input min-h-28 resize-y" placeholder="عرّف الطلاب بخبرتك وطريقة الشرح..." />
                </Field>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-bold leading-6 text-amber-800">
                  بعد الإكمال سيظهر حسابك كمدرس غير موثّق حتى تراجع الإدارة مستندات التوثيق.
                </div>
              </>
            )}

            <button disabled={isSaving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/15 transition-all hover:bg-[#1D4ED8] disabled:opacity-60">
              {isSaving ? <span>جاري حفظ بياناتك...</span> : <><Save className="h-4 w-4" /> حفظ وإنهاء إعداد الحساب <ArrowLeft className="h-4 w-4" /></>}
            </button>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 sm:p-4">
              <label className="flex cursor-pointer items-start gap-3" dir="rtl">
                <input type="checkbox" checked={setupLegalAccepted} onChange={(e) => { setSetupLegalAccepted(e.target.checked); setSetupLegalBlocked(false); }} className="mt-1 h-5 w-5 shrink-0 accent-blue-600" />
                <span className="text-xs leading-6 text-slate-700 sm:text-sm">أوافق على <button type="button" onClick={() => window.open('/legal/terms','_blank','noopener,noreferrer')} className="font-black text-blue-700 underline">شروط الاستخدام</button> و<button type="button" onClick={() => window.open('/legal/privacy','_blank','noopener,noreferrer')} className="font-black text-blue-700 underline">سياسة الخصوصية</button>، وأؤكد أن البيانات التي قدمتها صحيحة.</span>
              </label>
              {setupLegalBlocked && <p className="mt-2 text-xs font-black text-red-600">لا يمكن إنهاء إعداد الحساب قبل الموافقة على الشروط والخصوصية.</p>}
            </div>
          </form>
        </section>
      </div>
      <style>{`.input{width:100%;min-width:0;box-sizing:border-box;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;padding:12px 14px;font-size:13px;font-weight:600;outline:none;transition:.2s}.input:focus{background:#fff;border-color:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,.08)}.input::placeholder{color:#94a3b8}.input:disabled{cursor:not-allowed;opacity:.65}@media (max-width:639px){.input{border-radius:14px;padding:11px 12px;font-size:13px}.input:focus{box-shadow:0 0 0 3px rgba(37,99,235,.08)}}`}</style>
    </main>
  );
};

const Field: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <label className="block min-w-0">
    <span className="mb-2 flex items-center gap-2 text-xs font-black text-slate-800">{icon}{label}</span>
    {children}
  </label>
);
