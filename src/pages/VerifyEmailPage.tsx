import React, { useEffect, useRef, useState } from 'react';
import {
  Mail, CheckCircle2, AlertCircle, Loader2, RefreshCw, ArrowRight, KeyRound, ShieldCheck,
} from 'lucide-react';
import { AccountRole } from '../types';
import { useAuth, UserSession } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { authApi } from '../lib/authApi';
import { AuthShell } from '../components/common/AuthShell';
import { OtpCodeInput } from '../components/common/OtpCodeInput';

interface VerifyEmailPageProps {
  onNavigate: (path: string) => void;
  onVerificationSuccess: (role: AccountRole, email: string) => void;
}

type Stage = 'input' | 'code' | 'verifying' | 'success' | 'failed';

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ onNavigate, onVerificationSuccess }) => {
  const { user, finishPasswordLogin } = useAuth();

  const [stage, setStage] = useState<Stage>('input');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [otpError, setOtpError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [activatedRole, setActivatedRole] = useState<AccountRole>('student');
  const [activatedName, setActivatedName] = useState('');
  const passwordRef = useRef<string | null>(null);

  const knownEmail = user?.email || '';

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  /* ---------- auto-verification from the email link ---------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auto = params.get('auto');
    const code = params.get('code');
    const linkEmail = params.get('email');
    const purpose = (params.get('purpose') as any) || 'signup_verify';

    if (auto === '1' && code && linkEmail) {
      setStage('verifying');
      setEmail(linkEmail);
      window.history.replaceState({}, document.title, '/verify-email');
      void autoVerify(linkEmail, code, purpose);
    } else if (knownEmail) {
      setEmail(knownEmail);
    }
  }, [knownEmail]);

  const autoVerify = async (targetEmail: string, code: string, purpose: 'signup_verify' | 'login_otp' | 'password_reset') => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await authApi.verifyCode({ email: targetEmail, code, purpose: purpose === 'login_otp' ? 'signup_verify' : 'signup_verify' });
      if (res.ok) {
        setActivatedRole((res.role as AccountRole) || 'student');
        setActivatedName(res.name || '');
        setStage('success');
        setSuccessMessage('تم تفعيل حسابك بنجاح! سجّل الدخول الآن للانطلاق.');
      } else {
        setStage('failed');
        setErrorMessage(res.error || 'الرمز المستخدم في الرابط غير صالح أو مستهلك.');
      }
    } catch (e: any) {
      setStage('failed');
      setErrorMessage(e?.message || 'تعذر التحقق من الرابط.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- send the code ---------- */
  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const target = (email || knownEmail).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(target)) {
      setErrorMessage('أدخل بريدًا إلكترونيًا صحيحًا.');
      return;
    }
    setIsSendingCode(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await authApi.sendCode(target, 'signup_verify');
      if (res.sent === false) {
        setErrorMessage(res.message || 'لا يوجد تسجيل غير مكتمل بهذا البريد.');
        return;
      }
      setEmail(target);
      setOtpDigits(Array(6).fill(''));
      setStage('code');
      setResendTimer(res.resendAfter || 60);
      setSuccessMessage(`أرسلنا رمز التفعيل إلى ${res.maskedEmail || target}.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر إرسال الرمز.');
    } finally {
      setIsSendingCode(false);
    }
  };

  /* ---------- verify the code ---------- */
  const handleVerify = async (code?: string) => {
    const fullCode = code || otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('أدخل الرمز المكوّن من 6 أرقام.');
      setOtpError(true);
      setTimeout(() => setOtpError(false), 700);
      return;
    }
    const target = (email || knownEmail).trim().toLowerCase();
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await authApi.verifyCode({ email: target, code: fullCode, purpose: 'signup_verify' });
      if (!res.ok) {
        setErrorMessage(res.error || 'رمز التفعيل غير صحيح.');
        setOtpError(true);
        setOtpDigits(Array(6).fill(''));
        setTimeout(() => setOtpError(false), 700);
        return;
      }

      setActivatedRole((res.role as AccountRole) || user?.role || 'student');
      setActivatedName(res.name || user?.name || '');
      setStage('success');
      setSuccessMessage('تم تفعيل حسابك بنجاح!');

      /* logged-in unverified user → continue straight into the app */
      if (user?.uid) {
        try {
          const { data } = await supabase!.auth.getUser();
          if (data.user) {
            setTimeout(() => onVerificationSuccess(activatedRoleSafe(res.role, user.role), data.user.email || target), 900);
          }
        } catch { /* fall through to the login button */ }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء التحقق.');
    } finally {
      setIsLoading(false);
    }
  };

  const activatedRoleSafe = (resRole: any, fallback: AccountRole | undefined): AccountRole =>
    (['student', 'parent', 'teacher', 'assistant'].includes(resRole) ? resRole : fallback || 'student') as AccountRole;

  /* ============================================================ */
  return (
    <AuthShell onNavigate={onNavigate} miniTitle="تأكيد البريد الإلكتروني ✉️" width="md">
      <div className="card-lux bg-white border border-slate-200/90 rounded-3xl shadow-[0_24px_70px_-30px_rgba(30,58,138,0.35)] overflow-hidden anim-up">

        <div className="px-7 pt-7 pb-5 bg-gradient-to-l from-[#EFF6FF] via-white to-[#F5F3FF] border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              {stage === 'success' ? <CheckCircle2 className="w-6.5 h-6.5" /> : stage === 'verifying' ? <Loader2 className="w-6.5 h-6.5 animate-spin" /> : <Mail className="w-6.5 h-6.5" />}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {stage === 'success' ? 'حسابك مفعّل' : stage === 'failed' ? 'تعذر التفعيل' : 'تفعيل البريد الإلكتروني'}
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                {stage === 'verifying' ? 'جاري التحقق من الرمز...' : 'خطوة أمان أخيرة لحماية حسابك'}
              </p>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mx-7 mt-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-[13px] font-bold anim-fade">
            <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && stage !== 'input' && (
          <div className="mx-7 mt-5 flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 text-[13px] font-bold anim-fade">
            <CheckCircle2 className="w-4.5 h-4.5 mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ---------- stage: email input ---------- */}
        {(stage === 'input' || stage === 'failed') && (
          <form onSubmit={handleSendCode} className="p-7 space-y-5">
            <p className="text-[13px] text-slate-600 font-semibold leading-relaxed">
              {knownEmail
                ? 'حسابك في انتظار تأكيد البريد. اضغط زر الإرسال وسنرسل رمزًا من 6 أرقام إلى بريدك المسجّل.'
                : 'أدخل بريد الحساب الذي أنشأته وسنرسل لك رمز تفعيل من 6 أرقام.'}
            </p>
            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                dir="ltr"
                value={email || knownEmail}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="بريدك الإلكتروني"
                className="auth-input w-full p-3.5 pr-11 text-sm text-left"
                readOnly={Boolean(knownEmail)}
              />
            </div>
            <button type="submit" disabled={isSendingCode} className="auth-btn w-full p-3.5 rounded-2xl text-white font-black text-sm btn-primary-shine flex items-center justify-center gap-2 disabled:opacity-60">
              {isSendingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
              {isSendingCode ? 'جاري الإرسال...' : 'إرسال رمز التفعيل'}
            </button>
            <p className="text-center text-[12px] text-slate-400 font-bold">
              ليس لديك حساب؟ <button type="button" onClick={() => onNavigate('/signup')} className="text-[#2563EB] cursor-pointer">أنشئ حسابًا جديدًا</button>
            </p>
          </form>
        )}

        {/* ---------- stage: code ---------- */}
        {stage === 'code' && (
          <div className="p-7 space-y-5">
            <div className="bg-[#F8FAFF] border border-slate-200 rounded-2xl px-4 py-3.5 text-center">
              <div className="text-[11px] font-bold text-slate-400 mb-0.5">الرمز أُرسل إلى</div>
              <div dir="ltr" className="text-sm font-black text-slate-700">{email || knownEmail}</div>
            </div>

            <OtpCodeInput value={otpDigits} onChange={setOtpDigits} onComplete={handleVerify} disabled={isLoading} hasError={otpError} />

            <button onClick={() => handleVerify()} disabled={isLoading || otpDigits.join('').length !== 6} className="auth-btn w-full p-3.5 rounded-2xl text-white font-black text-sm btn-primary-shine flex items-center justify-center gap-2 disabled:opacity-50">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {isLoading ? 'جاري التحقق...' : 'تأكيد وتفعيل الحساب'}
            </button>

            <div className="flex items-center justify-between text-[12px] font-bold">
              <button type="button" onClick={handleSendCode} disabled={resendTimer > 0 || isSendingCode} className="text-[#2563EB] hover:text-[#1E40AF] cursor-pointer disabled:text-slate-400 flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${isSendingCode ? 'animate-spin' : ''}`} />
                {resendTimer > 0 ? `إعادة الإرسال بعد ${resendTimer} ث` : 'إعادة إرسال الرمز'}
              </button>
              <button type="button" onClick={() => onNavigate('/login')} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer">
                <ArrowRight className="w-3.5 h-3.5" />
                تسجيل الدخول
              </button>
            </div>
          </div>
        )}

        {/* ---------- stage: verifying (from link) ---------- */}
        {stage === 'verifying' && (
          <div className="p-12 flex flex-col items-center text-center">
            <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin mb-4" />
            <p className="text-sm font-black text-slate-600">جاري التحقق من الرمز...</p>
          </div>
        )}

        {/* ---------- stage: success ---------- */}
        {stage === 'success' && (
          <div className="p-10 flex flex-col items-center text-center anim-up">
            <div className="relative w-20 h-20 mb-5">
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-success-ring" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>
            <h2 className="text-xl font-black text-slate-900">تم تفعيل حسابك</h2>
            <p className="mt-2 text-sm text-slate-500 font-semibold leading-relaxed">
              {activatedName ? `${activatedName}، حسابك` : 'حسابك'} جاهز الآن بالكامل. سجّل الدخول وابدأ رحلتك مع حِصّتي.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => onNavigate('/login')} className="auth-btn px-8 p-3.5 rounded-2xl text-white font-black text-sm btn-primary-shine flex items-center gap-2">
                تسجيل الدخول
                <ArrowRight className="w-4.5 h-4.5 rotate-180" />
              </button>
              <button onClick={() => onNavigate('/')} className="px-6 p-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50">
                الرئيسية
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthShell>
  );
};
