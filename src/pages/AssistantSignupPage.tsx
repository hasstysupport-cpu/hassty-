import React, { useState, useEffect, useRef } from 'react';
import { BriefcaseBusiness, CheckCircle2, FileBadge, MapPin, ShieldCheck, User, Eye, EyeOff, Loader2, RefreshCw, Mail } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { authApi } from '../lib/authApi';
import { LocationSelector } from '../components/common/LocationSelector';
import { OtpCodeInput } from '../components/common/OtpCodeInput';
import { AuthShell } from '../components/common/AuthShell';
import { SIGNUP_CONSENT_KEY } from '../lib/legal';

export const AssistantSignupPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { finishPasswordLogin } = useAuth();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState(''); const [whatsappPhone, setWhatsappPhone] = useState(''); const [governorate, setGovernorate] = useState('القاهرة'); const [city, setCity] = useState('مدينة نصر');
  const [experienceYears, setExperienceYears] = useState(''); const [experienceSummary, setExperienceSummary] = useState(''); const [education, setEducation] = useState(''); const [certificateSummary, setCertificateSummary] = useState('');
  const [agreed, setAgreed] = useState(false); const [loading, setLoading] = useState(false); const [success, setSuccess] = useState(false); const [error, setError] = useState('');
  const [codeStep, setCodeStep] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [resendTimer, setResendTimer] = useState(0);
  const [otpError, setOtpError] = useState(false);
  const passwordRef = useRef('');

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!agreed) return setError('يجب الموافقة على شروط التسجيل كمساعد قبل إرسال الطلب.');
    if (!name.trim() || !email.trim() || !password || !phone.trim() || !whatsappPhone.trim() || !governorate || !city) return setError('أكمل جميع البيانات الأساسية.');
    if (!/^01[0125][0-9]{8}$/.test(phone.trim())) return setError('أدخل رقم هاتف مصري صحيح (مثال: 01012345678).');
    if (password.length < 8 || !/[0-9]/.test(password)) return setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل وتتضمن حروفًا وأرقامًا.');
    setLoading(true);
    try {
      const res = await authApi.register({
        email: email.trim().toLowerCase(), password, role: 'assistant',
        fullName: name.trim(), phone: phone.trim(), whatsappPhone: whatsappPhone.trim(),
        governorate, city, experienceYears: experienceYears || '0',
        experienceSummary: experienceSummary.trim(), education: education.trim(), certificateSummary: certificateSummary.trim(),
        consent: true,
      });
      if (!res.ok) { setError(res.error || 'تعذر إرسال الطلب.'); return; }
      try { localStorage.setItem(SIGNUP_CONSENT_KEY, 'accepted'); } catch { /* ignore */ }
      passwordRef.current = password;
      setCodeStep(true);
      setResendTimer(res.resendAfter || 60);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء إرسال الطلب.');
    } finally { setLoading(false); }
  };

  const handleVerify = async (code?: string) => {
    const fullCode = code || otpDigits.join('');
    if (fullCode.length !== 6) return;
    setLoading(true); setError('');
    try {
      const res = await authApi.verifyCode({ email: email.trim().toLowerCase(), code: fullCode, purpose: 'signup_verify' });
      if (!res.ok) {
        setError(res.error || 'رمز التفعيل غير صحيح.');
        setOtpError(true); setOtpDigits(Array(6).fill(''));
        setTimeout(() => setOtpError(false), 700);
        return;
      }
      try { await finishPasswordLogin(email.trim().toLowerCase(), passwordRef.current); } catch { /* يمكنه تسجيل الدخول يدويًا */ }
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء التحقق.');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true); setError('');
    try {
      const res = await authApi.sendCode(email.trim().toLowerCase(), 'signup_verify');
      if (res.sent === false) { setError(res.message || 'تعذر إعادة الإرسال.'); return; }
      setResendTimer(res.resendAfter || 60);
      setOtpDigits(Array(6).fill(''));
    } catch (e: any) { setError(e?.message || 'تعذر إعادة الإرسال.'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <AuthShell onNavigate={onNavigate}>
      <div className="card-lux bg-white border border-slate-200/90 rounded-3xl shadow-[0_20px_60px_-24px_rgba(30,58,138,0.25)] p-8 text-center anim-up">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/40 animate-success-ring">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">تم إرسال طلبك بنجاح ✅</h1>
        <p className="mt-3 text-sm text-slate-600 leading-7">تم تسجيل طلبك كمساعد وهو الآن تحت المراجعة. سيطلب منك فريق الإدارة بطاقة الهوية والمؤهلات عند بدء التوثيق، وسيتم التواصل معك عبر واتساب.</p>
        <button onClick={() => onNavigate('/')} className="auth-btn mt-7 px-6 py-3 rounded-2xl text-white font-black">العودة للموقع</button>
      </div>
    </AuthShell>
  );

  /* ---------- خطوة رمز التفعيل ---------- */
  if (codeStep) return (
    <AuthShell onNavigate={onNavigate} miniTitle="تفعيل حساب المساعد ✉️">
      <div className="card-lux bg-white border border-slate-200/90 rounded-3xl shadow-[0_20px_60px_-24px_rgba(30,58,138,0.25)] overflow-hidden anim-up">
        <div className="px-7 pt-7 pb-5 bg-gradient-to-l from-[#F0F9FF] via-white to-[#ECFEFF] border-b border-slate-100 flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0">
            <Mail className="w-6.5 h-6.5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">تأكيد بريدك الإلكتروني</h1>
            <p className="text-xs text-slate-500 mt-1 font-semibold">أدخل الرمز المُرسل إلى بريدك لإتمام طلب التسجيل</p>
          </div>
        </div>
        {error && <div className="mx-7 mt-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-bold flex items-center gap-2"><Loader2 style={{display:'none'}}/><span>{error}</span></div>}
        <div className="p-7 space-y-5">
          <div className="bg-[#F8FAFF] border border-slate-200 rounded-2xl px-4 py-3.5 text-center">
            <div className="text-[11px] font-bold text-slate-400 mb-0.5">الرمز أُرسل إلى</div>
            <div dir="ltr" className="text-sm font-black text-slate-700">{email}</div>
          </div>
          <OtpCodeInput value={otpDigits} onChange={setOtpDigits} onComplete={handleVerify} disabled={loading} hasError={otpError} />
          <button onClick={() => handleVerify()} disabled={loading || otpDigits.join('').length !== 6} className="auth-btn w-full p-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 btn-primary-shine disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {loading ? 'جاري التحقق...' : 'تفعيل الحساب وإرسال الطلب'}
          </button>
          <div className="flex items-center justify-between text-[12px] font-bold">
            <button type="button" onClick={handleResend} disabled={resendTimer > 0} className="text-[#0284C7] cursor-pointer disabled:text-slate-400 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              {resendTimer > 0 ? `إعادة الإرسال بعد ${resendTimer} ث` : 'إعادة إرسال الرمز'}
            </button>
            <button type="button" onClick={() => setCodeStep(false)} className="text-slate-400 hover:text-slate-600">تعديل البيانات</button>
          </div>
        </div>
      </div>
    </AuthShell>
  );

  return (
    <AuthShell onNavigate={onNavigate} width="wide" miniTitle="فريق العمل المتميز ✨">
      <div className="card-lux bg-white border border-slate-200/90 rounded-3xl shadow-[0_20px_60px_-24px_rgba(30,58,138,0.25)] overflow-hidden anim-up">
        <div className="p-6 sm:p-7 border-b border-slate-100 bg-gradient-to-l from-[#EFF6FF] via-white to-[#F5F3FF]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white flex items-center justify-center shadow-lg shadow-sky-500/30">
              <BriefcaseBusiness className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">التسجيل كمساعد مدرس</h1>
              <p className="text-xs text-slate-500 mt-1">بياناتك أولًا، ثم مراجعة وتوثيق الإدارة.</p>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="p-6 sm:p-7 space-y-6">
          <section className="space-y-4">
            <h2 className="font-black text-slate-800 flex items-center gap-2"><User className="w-5 h-5 text-[#0EA5E9]" /> البيانات الأساسية</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input required value={name} onChange={e=>setName(e.target.value)} placeholder="الاسم بالكامل" className="auth-input p-3.5 text-sm"/>
              <input required dir="ltr" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="رقم الهاتف" className="auth-input p-3.5 text-sm text-left"/>
              <input required dir="ltr" type="tel" value={whatsappPhone} onChange={e=>setWhatsappPhone(e.target.value)} placeholder="رقم واتساب للتواصل" className="auth-input p-3.5 text-sm text-left"/>
              <input required dir="ltr" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="auth-input p-3.5 text-sm text-left"/>
              <div className="relative">
                <input required dir="ltr" minLength={8} type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة مرور قوية" className="auth-input p-3.5 pl-11 text-sm text-left"/>
                <button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute left-3 top-3.5 text-slate-400">{showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button>
              </div>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="font-black text-slate-800 flex items-center gap-2"><MapPin className="w-5 h-5 text-[#0EA5E9]" /> المكان والخبرة</h2>
            <LocationSelector selectedGovernorate={governorate} selectedCity={city} onSelectGovernorate={setGovernorate} onSelectCity={setCity} showCitySelect placeholder="اختر المحافظة والمدينة"/>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="number" min="0" max="60" value={experienceYears} onChange={e=>setExperienceYears(e.target.value)} placeholder="سنوات الخبرة" className="auth-input p-3.5 text-sm"/>
              <input value={education} onChange={e=>setEducation(e.target.value)} placeholder="المؤهل الدراسي" className="auth-input p-3.5 text-sm"/>
            </div>
            <textarea value={experienceSummary} onChange={e=>setExperienceSummary(e.target.value)} placeholder="الخبرات والمهام السابقة" rows={4} className="auth-input p-3.5 text-sm resize-none"/>
            <textarea value={certificateSummary} onChange={e=>setCertificateSummary(e.target.value)} placeholder="الشهادات والدورات" rows={3} className="auth-input p-3.5 text-sm resize-none"/>
          </section>
          <section className="p-4 rounded-2xl bg-gradient-to-l from-amber-50 to-orange-50/60 border border-amber-200">
            <div className="flex items-start gap-3">
              <FileBadge className="w-5 h-5 text-amber-600 mt-0.5"/>
              <div className="text-sm text-amber-900 leading-6"><strong>التوثيق:</strong> بعد إرسال الطلب يظهر الملف للأدمن. قد يتم طلب صورة البطاقة والمؤهلات وبيانات إضافية قبل الاعتماد النهائي.</div>
            </div>
          </section>
          <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} className="mt-1 w-4 h-4"/>
            <span className="text-sm text-slate-700 leading-6">أوافق على شروط المساعدين، وأتعهد بصحة بياناتي وأوافق على التحقق من هويتي ومؤهلاتي بواسطة إدارة حِصّتي.</span>
          </label>
          {error && <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold">{error}</div>}
          <button disabled={loading} type="submit" className="auth-btn w-full py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2 disabled:opacity-50">
            <ShieldCheck className="w-5 h-5"/>
            {loading?'جاري إرسال الطلب...':'إرسال طلب التسجيل والتوثيق'}
          </button>
          <p className="text-center text-xs text-slate-400">إنشاء الحساب لا يمنح أي صلاحيات مدرس حتى تعتمد الإدارة الطلب.</p>
        </form>
      </div>
    </AuthShell>
  );
};
