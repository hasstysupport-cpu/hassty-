import React, { useMemo, useRef, useState } from 'react';
import {
  GraduationCap, Users, Briefcase, CheckCircle2, AlertCircle, Loader2, Mail, Lock, Eye, EyeOff,
  RefreshCw, ArrowRight, Phone, MapPin, BookOpen, Sparkles, ShieldCheck, UserCheck, Award, KeyRound, Heart,
} from 'lucide-react';
import { AccountRole } from '../types';
import { useAuth } from '../lib/AuthContext';
import { authApi, passwordStrength } from '../lib/authApi';
import { AuthShell } from '../components/common/AuthShell';
import { OtpCodeInput } from '../components/common/OtpCodeInput';
import { LocationSelector } from '../components/common/LocationSelector';
import { SUBJECTS_DATA } from '../data/mockData';
import { SIGNUP_CONSENT_KEY } from '../lib/legal';

interface SignupPageProps {
  onNavigate: (path: string) => void;
  onSignupSuccess: (role: AccountRole, email: string) => void;
}

const GRADES = [
  'الصف الأول الابتدائي', 'الصف الثاني الابتدائي', 'الصف الثالث الابتدائي',
  'الصف الرابع الابتدائي', 'الصف الخامس الابتدائي', 'الصف السادس الابتدائي',
  'الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي',
  'الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي',
];

const EXPERIENCE_OPTIONS = ['أقل من سنة', 'سنة - 3 سنوات', '3 - 5 سنوات', '5 - 10 سنوات', 'أكثر من 10 سنوات'];

const ROLE_CARDS: { role: AccountRole; icon: any; title: string; desc: string; tag: string }[] = [
  { role: 'student', icon: GraduationCap, title: 'طالب', desc: 'احجز حصصك، تابع حضورك بالـ QR ودرجاتك لحظيًا', tag: 'الأكثر استخدامًا' },
  { role: 'parent', icon: Users, title: 'ولي أمر', desc: 'تابع أبناءك: الحضور، الدرجات، والمدفوعات من مكان واحد', tag: 'متابعة كاملة' },
  { role: 'teacher', icon: Briefcase, title: 'معلم', desc: 'أدارة مجموعاتك وحضورك وامتحاناتك وفواتيرك باحترافية', tag: 'للمدرسين' },
];


type Step = 1 | 2 | 3 | 4 | 5; // 1 role · 2 data · 3 credentials+consent · 4 email code · 5 success

const GoogleIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.44a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.58-5.16 3.58-8.81Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.1Z" />
    <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.42-3.42A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.86 8.87 4.75 12 4.75Z" />
  </svg>
);

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate, onSignupSuccess }) => {
  const { signupUser, finishPasswordLogin, loginWithGoogle } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  /* step 1 — role */
  const [role, setRole] = useState<AccountRole>('student');

  /* step 2 — profile data */
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [city, setCity] = useState('مدينة نصر');
  const [grade, setGrade] = useState('الصف الثالث الثانوي');
  const [subject, setSubject] = useState('الرياضيات');
  const [experienceYears, setExperienceYears] = useState('3 - 5 سنوات');
  const [studentJoinCode, setStudentJoinCode] = useState('');

  /* step 3 — credentials + consent */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  /* step 4 — code */
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [resendTimer, setResendTimer] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const passwordRef = useRef('');

  const strength = useMemo(() => passwordStrength(password), [password]);
  const roleInfo = ROLE_CARDS.find((r) => r.role === role)!;

  React.useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const goStep = (s: Step) => {
    setStep(s);
    setErrorMessage('');
    setSuccessMessage('');
  };

  /* ============ step 2 validation ============ */
  const validateData = (): string | null => {
    if (fullName.trim().length < 3) return 'أدخل اسمك الكامل (3 أحرف على الأقل).';
    if (!/^01[0125][0-9]{8}$/.test(phone.trim())) return 'أدخل رقم هاتف مصري صحيح (مثال: 01012345678).';
    if (!governorate || !city) return 'اختر المحافظة والمدينة/المنطقة.';
    if (role === 'student' && !grade) return 'اختر الصف الدراسي.';
    if (role === 'teacher' && !subject) return 'اختر المادة الدراسية.';
    return null;
  };

  /* ============ step 3: register ============ */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim().toLowerCase())) return setErrorMessage('أدخل بريدًا إلكترونيًا صحيحًا.');
    if (strength.score < 2) return setErrorMessage('كلمة المرور ضعيفة — اجعلها 8 أحرف على الأقل وتتضمن حروفًا وأرقامًا.');
    if (password !== confirmPassword) return setErrorMessage('كلمتا المرور غير متطابقتين.');
    if (!agreeTerms || !agreePrivacy) return setErrorMessage('يجب الموافقة على الشروط وسياسة الخصوصية لإنشاء الحساب.');

    const dataError = validateData();
    if (dataError) return setErrorMessage(dataError);

    setIsLoading(true);
    try {
      const res = await signupUser({
        email: email.trim().toLowerCase(),
        password,
        role,
        fullName: fullName.trim(),
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
        setErrorMessage(res.error || 'تعذر إنشاء الحساب. حاول مجددًا.');
        return;
      }

      /* mark consent locally — the app records it in legal_consents after login */
      try { localStorage.setItem(SIGNUP_CONSENT_KEY, 'accepted'); } catch { /* ignore */ }

      passwordRef.current = password;
      setOtpDigits(Array(6).fill(''));
      setResendTimer(res.resendAfter || 60);
      goStep(4);
      setSuccessMessage(`أرسلنا رمز التفعيل إلى ${res.maskedEmail || email}. فحص صندوق الوارد (والبريد غير الهام).`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر إنشاء الحساب.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ============ step 4: verify email code ============ */
  const handleVerify = async (code?: string) => {
    const fullCode = code || otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('أدخل رمز التفعيل المكوّن من 6 أرقام.');
      setOtpError(true);
      setTimeout(() => setOtpError(false), 700);
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await authApi.verifyCode({ email: email.trim().toLowerCase(), code: fullCode, purpose: 'signup_verify' });
      if (!res.ok) {
        setErrorMessage(res.error || 'رمز التفعيل غير صحيح.');
        setOtpError(true);
        setOtpDigits(Array(6).fill(''));
        setTimeout(() => setOtpError(false), 700);
        return;
      }

      /* account active → log in directly */
      const session = await finishPasswordLogin(email.trim().toLowerCase(), passwordRef.current);
      goStep(5);
      setSuccessMessage(`تم تفعيل حسابك بنجاح 🎉 أهلًا بك ${session.name || ''} في حِصّتي`);
      setTimeout(() => onSignupSuccess(session.role, session.email), 900);
    } catch (err: any) {
      const msg = String(err?.message || '');
      setErrorMessage(msg.includes('Email not confirmed') ? 'لم يكتمل التفعيل بعد — تأكد من الرمز وحاول مجددًا.' : msg || 'حدث خطأ أثناء التفعيل.');
      setOtpError(true);
      setTimeout(() => setOtpError(false), 700);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || isSendingCode) return;
    setIsSendingCode(true);
    setErrorMessage('');
    try {
      const res = await authApi.sendCode(email.trim().toLowerCase(), 'signup_verify');
      if (res.sent === false) {
        setErrorMessage(res.message || 'تعذر إعادة إرسال الرمز.');
      } else {
        setResendTimer(res.resendAfter || 60);
        setSuccessMessage('تم إرسال رمز جديد إلى بريدك.');
        setOtpDigits(Array(6).fill(''));
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'تعذر إعادة إرسال الرمز.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر فتح Google.');
      setIsGoogleLoading(false);
    }
  };

  /* ============================================================ */
  const stepsMeta = [
    { n: 1, label: 'نوع الحساب' },
    { n: 2, label: 'بياناتك' },
    { n: 3, label: 'الحساب' },
    { n: 4, label: 'التفعيل' },
  ];
  const showSteps = step >= 1 && step <= 4;

  return (
    <AuthShell onNavigate={onNavigate} miniTitle="انضم إلى حِصّتي ✨" width={step === 2 || step === 3 ? 'wide' : 'md'}>
      <div className="card-lux bg-white border border-slate-200/90 rounded-3xl shadow-[0_24px_70px_-30px_rgba(30,58,138,0.35)] overflow-hidden anim-up" data-role={role}>

        {/* ---------- header + steps rail ---------- */}
        <div className="px-7 pt-6 pb-5 bg-gradient-to-l from-[#EFF6FF] via-white to-[#F5F3FF] border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              {step === 5 ? <CheckCircle2 className="w-6.5 h-6.5" /> : step === 4 ? <KeyRound className="w-6.5 h-6.5" /> : <Sparkles className="w-6.5 h-6.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {step === 1 && 'إنشاء حساب جديد'}
                {step === 2 && 'بياناتك الأساسية'}
                {step === 3 && 'البريد وكلمة المرور'}
                {step === 4 && 'تأكيد بريدك الإلكتروني'}
                {step === 5 && 'حسابك جاهز!'}
              </h1>
              {showSteps && (
                <div className="auth-steps mt-2.5">
                  {stepsMeta.map((s, i) => (
                    <React.Fragment key={s.n}>
                      <div className={`dot ${step === s.n ? 'active' : step > s.n ? 'done' : ''}`} title={s.label} />
                      {i < stepsMeta.length - 1 && <div className={`bar ${step > s.n ? 'active' : ''}`} />}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mx-7 mt-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-[13px] font-bold anim-fade">
            <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && step === 4 && (
          <div className="mx-7 mt-5 flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 text-[13px] font-bold anim-fade">
            <CheckCircle2 className="w-4.5 h-4.5 mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ═══════════ STEP 1 — نوع الحساب ═══════════ */}
        {step === 1 && (
          <div className="p-7 space-y-4">
            <p className="text-[13px] text-slate-500 font-semibold text-center mb-1">اختر نوع حسابك — كل نوع له عالمه الخاص المصمم له</p>
            {ROLE_CARDS.map((card) => (
              <button
                key={card.role}
                type="button"
                data-role={card.role}
                onClick={() => setRole(card.role)}
                className={`role-card w-full p-5 text-right ${role === card.role ? 'selected' : ''}`}
              >
                <span className="role-check"><CheckCircle2 className="w-4 h-4" /></span>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ backgroundImage: 'var(--role-grad)' }}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-base font-black text-slate-900">{card.title}</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{card.tag}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">{card.desc}</p>
                  </div>
                </div>
              </button>
            ))}

            <div className="bg-sky-50/70 border border-sky-100 rounded-2xl px-4 py-3 text-[12px] font-bold text-slate-600 flex items-center gap-2">
              <UserCheck className="w-4.5 h-4.5 text-[#0EA5E9] shrink-0" />
              <span>مساعد مدرس؟ التسجيل يتم عبر دعوة من المعلم — <button type="button" onClick={() => onNavigate('/assistant/signup')} className="text-[#0284C7] font-black underline cursor-pointer">سجّل كمساعد من هنا</button></span>
            </div>

            <button type="button" onClick={() => goStep(2)} className="auth-btn w-full p-3.5 rounded-2xl text-white font-black text-sm btn-primary-shine flex items-center justify-center gap-2">
              متابعة كـ {roleInfo.title}
              <ArrowRight className="w-4.5 h-4.5 rotate-180" />
            </button>

            <button type="button" onClick={() => handleGoogleSignup()} disabled={isGoogleLoading} className="w-full p-3.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 font-black text-sm flex items-center justify-center gap-2.5 hover:border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-60">
              {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
              التسجيل السريع بحساب Google
            </button>

            <p className="text-center text-[13px] text-slate-500 font-semibold pt-1">
              لديك حساب بالفعل؟{' '}
              <button type="button" onClick={() => onNavigate('/login')} className="text-[#2563EB] font-black hover:text-[#1E40AF] cursor-pointer">سجّل الدخول</button>
            </p>
          </div>
        )}

        {/* ═══════════ STEP 2 — البيانات ═══════════ */}
        {step === 2 && (
          <div className="p-7 space-y-4">
            <div className="flex items-center gap-3 bg-[#F8FAFF] border border-slate-200 rounded-2xl p-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundImage: 'var(--role-grad)' }}>
                <roleInfo.icon className="w-5 h-5" />
              </div>
              <div className="text-[13px] font-black text-slate-700">تسجيل كـ {roleInfo.title}</div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="relative">
                <UserCheck className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="الاسم الكامل" className="auth-input w-full p-3.5 pr-11 text-sm" autoComplete="name" />
              </div>
              <div className="relative">
                <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input dir="ltr" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" className="auth-input w-full p-3.5 pr-11 text-sm text-left" autoComplete="tel" />
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 bg-white">
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
                    {EXPERIENCE_OPTIONS.map((x) => <option key={x} value={x}>{x}</option>)}
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
                <p className="text-[11px] text-slate-500 font-semibold mt-2 leading-relaxed">لو معك كود كارنيه ابنك، اكتبه هنا وسنرسل طلب ربط تلقائيًا بعد التفعيل — تقدر تضيفه لاحقًا من لوحة التحكم.</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => goStep(1)} className="px-5 p-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 flex items-center gap-1.5">
                <ArrowRight className="w-4 h-4" />
                رجوع
              </button>
              <button
                type="button"
                onClick={() => { const err = validateData(); if (err) setErrorMessage(err); else goStep(3); }}
                className="auth-btn flex-1 p-3.5 rounded-2xl text-white font-black text-sm btn-primary-shine flex items-center justify-center gap-2"
              >
                متابعة
                <ArrowRight className="w-4.5 h-4.5 rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 3 — البريد وكلمة المرور + الموافقة ═══════════ */}
        {step === 3 && (
          <form onSubmit={handleRegister} className="p-7 space-y-4">
            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="بريدك الإلكتروني" className="auth-input w-full p-3.5 pr-11 text-sm text-left" autoComplete="email" />
            </div>
            <p className="text-[11px] text-slate-400 font-semibold -mt-2">سيصلك رمز التفعيل على هذا البريد — تأكد أنه صحيح.</p>

            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type={showPassword ? 'text' : 'password'} required dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="auth-input w-full p-3.5 pr-11 pl-11 text-sm text-left" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-label="إظهار كلمة المرور">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {password && (
              <div className="space-y-1.5">
                <div className="pw-meter"><div style={{ width: `${(strength.score / 4) * 100}%`, backgroundColor: ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#10B981'][strength.score] }} /></div>
                <div className="text-[11px] font-bold text-slate-500">قوة كلمة المرور: <span className={strength.score >= 3 ? 'text-emerald-600' : 'text-amber-600'}>{strength.label}</span></div>
              </div>
            )}

            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type={showPassword ? 'text' : 'password'} required dir="ltr" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="تأكيد كلمة المرور" className="auth-input w-full p-3.5 pr-11 text-sm text-left" autoComplete="new-password" />
            </div>

            {/* ---------- زر الموافقة ---------- */}
            <div className="bg-[#F8FAFF] border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-black text-slate-700 flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-[#2563EB]" />
                الموافقة المطلوبة قبل إنشاء الحساب
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-1 w-4 h-4 accent-[#2563EB] cursor-pointer" />
                <span className="text-[12px] font-bold text-slate-600 leading-relaxed">
                  أوافق على{' '}
                  <button type="button" onClick={(e) => { e.preventDefault(); onNavigate('/legal/terms'); }} className="text-[#2563EB] underline font-black cursor-pointer">الشروط والأحكام</button>
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-1 w-4 h-4 accent-[#2563EB] cursor-pointer" />
                <span className="text-[12px] font-bold text-slate-600 leading-relaxed">
                  أوافق على{' '}
                  <button type="button" onClick={(e) => { e.preventDefault(); onNavigate('/legal/privacy'); }} className="text-[#2563EB] underline font-black cursor-pointer">سياسة الخصوصية</button>{' '}
                  ومعالجة بياناتي لأغر المنصة التعليمية
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => goStep(2)} className="px-5 p-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 flex items-center gap-1.5">
                <ArrowRight className="w-4 h-4" />
                رجوع
              </button>
              <button type="submit" disabled={isLoading || !agreeTerms || !agreePrivacy} className="auth-btn flex-1 p-3.5 rounded-2xl text-white font-black text-sm btn-primary-shine flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {isLoading ? 'جاري إنشاء الحساب...' : 'أوافق وأنشئ حسابي'}
              </button>
            </div>
          </form>
        )}

        {/* ═══════════ STEP 4 — رمز التفعيل ═══════════ */}
        {step === 4 && (
          <div className="p-7 space-y-5">
            <div className="bg-[#F8FAFF] border border-slate-200 rounded-2xl px-4 py-3.5 text-center">
              <div className="text-[11px] font-bold text-slate-400 mb-0.5">أدخل الرمز المُرسل إلى</div>
              <div dir="ltr" className="text-sm font-black text-slate-700">{email}</div>
            </div>

            <OtpCodeInput value={otpDigits} onChange={setOtpDigits} onComplete={handleVerify} disabled={isLoading} hasError={otpError} />

            <button onClick={() => handleVerify()} disabled={isLoading || otpDigits.join('').length !== 6} className="auth-btn w-full p-3.5 rounded-2xl text-white font-black text-sm btn-primary-shine flex items-center justify-center gap-2 disabled:opacity-50">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {isLoading ? 'جاري التفعيل...' : 'تفعيل حسابي'}
            </button>

            <div className="flex items-center justify-between text-[12px] font-bold">
              <button type="button" onClick={handleResend} disabled={resendTimer > 0 || isSendingCode} className="text-[#2563EB] hover:text-[#1E40AF] cursor-pointer disabled:text-slate-400 flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${isSendingCode ? 'animate-spin' : ''}`} />
                {resendTimer > 0 ? `إعادة الإرسال بعد ${resendTimer} ث` : 'إعادة إرسال الرمز'}
              </button>
              <button type="button" onClick={() => goStep(3)} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer">
                <ArrowRight className="w-3.5 h-3.5" />
                تعديل البريد
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 5 — نجاح ═══════════ */}
        {step === 5 && (
          <div className="p-10 flex flex-col items-center text-center anim-up">
            <div className="relative w-20 h-20 mb-5">
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-success-ring" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>
            <h2 className="text-xl font-black text-slate-900">تم إنشاء وتفعيل حسابك</h2>
            <p className="mt-2 text-sm text-slate-500 font-semibold leading-relaxed">{successMessage}</p>
            <p className="mt-1 text-xs text-slate-400 font-bold">جاري نقلك إلى لوحة التحكم...</p>
          </div>
        )}
      </div>
    </AuthShell>
  );
};
