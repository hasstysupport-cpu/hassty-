import React, { useEffect, useRef, useState } from 'react';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, RefreshCw,
  ArrowRight, KeyRound, Smartphone, GraduationCap, Send, Loader2,
} from 'lucide-react';
import { AccountRole } from '../types';
import { useAuth, UserSession } from '../lib/AuthContext';
import { authApi, getDeviceId } from '../lib/authApi';
import { AuthShell } from '../components/common/AuthShell';
import { OtpCodeInput } from '../components/common/OtpCodeInput';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: (role: AccountRole, email: string) => void;
}

type Stage = 'credentials' | 'otp' | 'activate' | 'success';

const GoogleIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.44a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.58-5.16 3.58-8.81Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.1Z" />
    <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.42-3.42A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.86 8.87 4.75 12 4.75Z" />
  </svg>
);

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLoginSuccess }) => {
  const { beginPasswordLogin, finishPasswordLogin, loginWithGoogle } = useAuth();

  const [stage, setStage] = useState<Stage>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [otpError, setOtpError] = useState(false);

  /* pending login info (password kept in memory only — never persisted) */
  const pendingEmail = useRef('');
  const pendingPassword = useRef('');
  const pendingName = useRef('');
  const pendingRole = useRef<AccountRole>('student');

  /* OTP state */
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [otpPurpose, setOtpPurpose] = useState<'login_otp' | 'signup_verify'>('login_otp');
  const [resendTimer, setResendTimer] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);

  /* forgot-password modal */
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [resetCode, setResetCode] = useState(Array(6).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotInfo, setForgotInfo] = useState('');

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const startTimer = (seconds = 60) => setResendTimer(seconds);

  /* ============ STEP 1 — credentials ============ */
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await beginPasswordLogin(email.trim(), password);

      if (result.status === 'complete') {
        pendingRole.current = result.session.role;
        pendingName.current = result.session.name || '';
        setStage('success');
        setSuccessMessage(`أهلًا بك مجددًا ${result.session.name || ''} 👋`);
        setTimeout(() => onLoginSuccess(result.session.role, result.session.email), 650);
        return;
      }

      if (result.status === 'otp_required') {
        pendingEmail.current = result.email;
        pendingName.current = result.name;
        pendingPassword.current = password;
        setOtpPurpose('login_otp');
        setOtpDigits(Array(6).fill(''));
        setStage('otp');
        startTimer();
        setSuccessMessage(`أرسلنا رمز التحقق إلى ${result.email} لتأمين الدخول من هذا الجهاز.`);
        return;
      }

      /* unconfirmed → send an activation code */
      pendingEmail.current = result.email;
      pendingName.current = result.name || '';
      pendingPassword.current = password;
      setOtpPurpose('signup_verify');
      setOtpDigits(Array(6).fill(''));
      setStage('activate');
      await sendActivationCode(result.email, true);
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('Invalid login credentials')) {
        setErrorMessage('بيانات الدخول غير صحيحة. تأكد من البريد وكلمة المرور.');
      } else if (msg.includes('too many requests') || msg.includes('rate limit')) {
        setErrorMessage('محاولات كثيرة خاطئة — انتظر قليلًا ثم حاول مجددًا.');
      } else {
        setErrorMessage(msg || 'حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ============ activation code sender (unconfirmed accounts) ============ */
  const sendActivationCode = async (targetEmail: string, silent = false) => {
    if (!silent) {
      if (resendTimer > 0 || isSendingCode) return;
    }
    setIsSendingCode(true);
    setErrorMessage('');
    try {
      const res = await authApi.sendCode(targetEmail, 'signup_verify');
      if (res.sent === false) {
        setErrorMessage(res.message || 'تعذر إرسال رمز التفعيل.');
      } else {
        startTimer(res.resendAfter || 60);
        setSuccessMessage(`أرسلنا رمز التفعيل إلى ${res.maskedEmail || targetEmail}.`);
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'تعذر إرسال رمز التفعيل.');
    } finally {
      setIsSendingCode(false);
    }
  };

  /* ============ STEP 2 — OTP / activation verify ============ */
  const handleVerifyCode = async (code?: string) => {
    const fullCode = code || otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('يرجى إدخال رمز التحقق المكوّن من 6 أرقام.');
      setOtpError(true);
      setTimeout(() => setOtpError(false), 700);
      return;
    }
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await authApi.verifyCode({
        email: pendingEmail.current,
        code: fullCode,
        purpose: otpPurpose,
        deviceId: getDeviceId(),
        trustDevice: otpPurpose === 'login_otp' ? trustDevice : false,
      });

      if (!res.ok) {
        setErrorMessage(res.error || 'رمز التحقق غير صحيح.');
        setOtpError(true);
        setOtpDigits(Array(6).fill(''));
        setTimeout(() => setOtpError(false), 700);
        return;
      }

      /* code confirmed → (re)establish the session with the password in memory */
      const session: UserSession = await finishPasswordLogin(pendingEmail.current, pendingPassword.current);
      pendingRole.current = session.role;
      pendingName.current = session.name || '';
      setStage('success');
      setSuccessMessage(`تم التحقق بنجاح ✅ أهلًا بك ${session.name || ''}`);
      setTimeout(() => onLoginSuccess(session.role, session.email), 650);
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('Email not confirmed')) {
        setErrorMessage('لم يتم تفعيل الحساب بعد. اطلب رمز تفعيل جديد من خلال زر الإعادة.');
      } else {
        setErrorMessage(msg || 'حدث خطأ أثناء التحقق. حاول مجددًا.');
      }
      setOtpError(true);
      setTimeout(() => setOtpError(false), 700);
    } finally {
      setIsLoading(false);
    }
  };

  /* ============ resend login OTP (re-auth → login-check sends a new code) ============ */
  const handleResendLoginOtp = async () => {
    if (resendTimer > 0 || isSendingCode) return;
    setIsSendingCode(true);
    setErrorMessage('');
    try {
      const result = await beginPasswordLogin(pendingEmail.current, pendingPassword.current);
      if (result.status === 'otp_required') {
        setOtpDigits(Array(6).fill(''));
        startTimer();
        setSuccessMessage('تم إرسال رمز جديد إلى بريدك.');
      } else {
        setErrorMessage('انتهت صلاحية الجلسة. أعد إدخال بياناتك.');
        setStage('credentials');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'تعذر إعادة إرسال الرمز.');
    } finally {
      setIsSendingCode(false);
    }
  };

  /* ============ Google ============ */
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر تسجيل الدخول بحساب Google.');
      setIsGoogleLoading(false);
    }
  };

  /* ============ forgot password (2 steps) ============ */
  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setForgotError('أدخل بريدك الإلكتروني أولًا في حقل البريد أعلاه.');
      return;
    }
    setForgotBusy(true);
    setForgotError('');
    setForgotInfo('');
    try {
      const res = await authApi.sendCode(email.trim().toLowerCase(), 'password_reset');
      setForgotInfo(res.message || 'أرسلنا رمز استعادة كلمة المرور إلى بريدك.');
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err?.message || 'تعذر إرسال رمز الاستعادة.');
    } finally {
      setForgotBusy(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = resetCode.join('');
    if (code.length !== 6) {
      setForgotError('أدخل رمز الاستعادة المكوّن من 6 أرقام.');
      return;
    }
    if (newPassword.length < 8) {
      setForgotError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل وتتضمن حروفًا وأرقامًا.');
      return;
    }
    setForgotBusy(true);
    setForgotError('');
    try {
      const res = await authApi.resetPassword({ email: email.trim().toLowerCase(), code, newPassword });
      if (!res.ok) {
        setForgotError(res.error || 'رمز الاستعادة غير صحيح أو منتهي.');
        return;
      }
      setForgotStep(3);
      setPassword('');
    } catch (err: any) {
      setForgotError(err?.message || 'تعذر تغيير كلمة المرور.');
    } finally {
      setForgotBusy(false);
    }
  };

  const closeForgot = () => {
    setShowForgot(false);
    setForgotStep(1);
    setResetCode(Array(6).fill(''));
    setNewPassword('');
    setForgotError('');
    setForgotInfo('');
  };

  /* ============================================================ */
  return (
    <AuthShell onNavigate={onNavigate} miniTitle="مرحبًا بعودتك 👋" width="md">
      <div className="card-lux bg-white border border-slate-200/90 rounded-3xl shadow-[0_24px_70px_-30px_rgba(30,58,138,0.35)] overflow-hidden anim-up">

        {/* ---------- header ---------- */}
        <div className="px-7 pt-7 pb-5 bg-gradient-to-l from-[#EFF6FF] via-white to-[#F5F3FF] border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-[#2563EB] bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              {stage === 'success' ? <CheckCircle2 className="w-6.5 h-6.5" /> : stage === 'credentials' ? <ShieldCheck className="w-6.5 h-6.5" /> : <KeyRound className="w-6.5 h-6.5" />}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {stage === 'success' ? 'تم تسجيل الدخول' :
                  stage === 'credentials' ? 'تسجيل الدخول إلى حسابك' :
                    stage === 'otp' ? 'رمز تأكيد الدخول' : 'تفعيل حسابك'}
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                {stage === 'credentials' && 'منظومة حِصّتي — كل حصة موثّقة وكل درجة محفوظة'}
                {stage === 'otp' && 'أرسلنا رمزًا من 6 أرقام إلى بريدك المسجّل'}
                {stage === 'activate' && 'حسابك في انتظار تأكيد البريد — أدخل الرمز المُرسل'}
                {stage === 'success' && 'جاري نقلك إلى لوحة التحكم...'}
              </p>
            </div>
          </div>
        </div>

        {/* ---------- messages ---------- */}
        {errorMessage && (
          <div className="mx-7 mt-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-[13px] font-bold anim-fade">
            <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && stage !== 'credentials' && (
          <div className="mx-7 mt-5 flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 text-[13px] font-bold anim-fade">
            <CheckCircle2 className="w-4.5 h-4.5 mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ═══════════ STAGE: credentials ═══════════ */}
        {stage === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="p-7 space-y-5">
            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="بريدك الإلكتروني"
                className="auth-input w-full p-3.5 pr-11 text-sm text-left"
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="auth-input w-full p-3.5 pr-11 pl-11 text-sm text-left"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="إظهار كلمة المرور">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setShowForgot(true)} className="text-xs font-bold text-[#2563EB] hover:text-[#1E40AF] cursor-pointer">
                نسيت كلمة المرور؟
              </button>
              <span className="text-[11px] text-slate-400 font-semibold">دخول محمي بـ OTP</span>
            </div>

            <button type="submit" disabled={isLoading} className="auth-btn w-full p-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 btn-primary-shine">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>

            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
              <span className="flex-1 h-px bg-slate-200" />
              أو
              <span className="flex-1 h-px bg-slate-200" />
            </div>

            <button type="button" onClick={handleGoogleLogin} disabled={isGoogleLoading} className="w-full p-3.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 font-black text-sm flex items-center justify-center gap-2.5 hover:border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-60">
              {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
              {isGoogleLoading ? 'جاري فتح Google...' : 'المتابعة بحساب Google'}
            </button>

            <p className="text-center text-[13px] text-slate-500 font-semibold pt-1">
              ليس لديك حساب؟{' '}
              <button type="button" onClick={() => onNavigate('/signup')} className="text-[#2563EB] font-black hover:text-[#1E40AF] cursor-pointer">
                أنشئ حسابك الآن
              </button>
            </p>
          </form>
        )}

        {/* ═══════════ STAGE: otp / activate ═══════════ */}
        {(stage === 'otp' || stage === 'activate') && (
          <div className="p-7 space-y-5">
            <div className="bg-[#F8FAFF] border border-slate-200 rounded-2xl px-4 py-3.5 text-center">
              <div className="text-[11px] font-bold text-slate-400 mb-0.5">الرمز أُرسل إلى</div>
              <div dir="ltr" className="text-sm font-black text-slate-700">{pendingEmail.current}</div>
            </div>

            <OtpCodeInput
              value={otpDigits}
              onChange={setOtpDigits}
              onComplete={handleVerifyCode}
              disabled={isLoading}
              hasError={otpError}
            />

            {stage === 'otp' && (
              <label className="flex items-center justify-center gap-2.5 cursor-pointer select-none bg-sky-50/70 border border-sky-100 rounded-2xl px-4 py-3">
                <input type="checkbox" checked={trustDevice} onChange={(e) => setTrustDevice(e.target.checked)} className="w-4 h-4 accent-[#2563EB] cursor-pointer" />
                <span className="text-[12px] font-bold text-slate-600 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#2563EB]" />
                  وثّق هذا الجهاز لتخطي الرمز لمدة 30 يومًا
                </span>
              </label>
            )}

            <button
              onClick={() => handleVerifyCode()}
              disabled={isLoading || otpDigits.join('').length !== 6}
              className="auth-btn w-full p-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 btn-primary-shine disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {isLoading ? 'جاري التحقق...' : 'تأكيد الرمز وإكمال الدخول'}
            </button>

            <div className="flex items-center justify-between text-[12px] font-bold">
              <button
                type="button"
                onClick={stage === 'otp' ? handleResendLoginOtp : () => sendActivationCode(pendingEmail.current)}
                disabled={resendTimer > 0 || isSendingCode}
                className="text-[#2563EB] hover:text-[#1E40AF] cursor-pointer disabled:text-slate-400 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSendingCode ? 'animate-spin' : ''}`} />
                {resendTimer > 0 ? `إعادة الإرسال بعد ${resendTimer} ث` : 'إعادة إرسال الرمز'}
              </button>
              <button type="button" onClick={() => { setStage('credentials'); setErrorMessage(''); setSuccessMessage(''); }} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer">
                <ArrowRight className="w-3.5 h-3.5" />
                تغيير البيانات
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ STAGE: success ═══════════ */}
        {stage === 'success' && (
          <div className="p-10 flex flex-col items-center text-center anim-up">
            <div className="relative w-20 h-20 mb-5">
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-success-ring" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>
            <h2 className="text-xl font-black text-slate-900">تم الدخول بنجاح</h2>
            <p className="mt-2 text-sm text-slate-500 font-semibold flex items-center gap-2">
              <GraduationCap className="w-4.5 h-4.5 text-[#2563EB]" />
              جاري تجهيز لوحة التحكم الخاصة بك...
            </p>
          </div>
        )}
      </div>

      {/* ═══════════ forgot password modal ═══════════ */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm overflow-y-auto" onClick={closeForgot}>
          <div className="card-lux dialog-lux bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-8 text-right" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <KeyRound className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">استعادة كلمة المرور</h2>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    {forgotStep === 1 ? 'سنرسل رمزًا إلى بريدك المسجّل' : forgotStep === 2 ? 'أدخل الرمز وكلمة المرور الجديدة' : 'تم بنجاح'}
                  </p>
                </div>
              </div>
              <button onClick={closeForgot} className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 cursor-pointer">
                <span className="text-lg font-black leading-none">×</span>
              </button>
            </div>

            {forgotError && (
              <div className="mx-6 mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3.5 py-2.5 text-xs font-bold">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{forgotError}
              </div>
            )}
            {forgotInfo && forgotStep === 2 && (
              <div className="mx-6 mt-4 flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3.5 py-2.5 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />{forgotInfo}
              </div>
            )}

            {forgotStep === 1 && (
              <form onSubmit={handleForgotEmail} className="p-6 space-y-4">
                <p className="text-[13px] text-slate-600 leading-7 font-semibold">
                  سنرسل رمزًا من 6 أرقام إلى <span dir="ltr" className="font-black text-slate-800">{email || 'بريدك'}</span> لتغيير كلمة مرورك بأمان.
                </p>
                <button type="submit" disabled={forgotBusy} className="auth-btn w-full p-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 btn-primary-shine disabled:opacity-60">
                  {forgotBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4.5 h-4.5" />}
                  {forgotBusy ? 'جاري الإرسال...' : 'إرسال رمز الاستعادة'}
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                <OtpCodeInput value={resetCode} onChange={setResetCode} hasError={!!forgotError} autoFocus />
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="كلمة المرور الجديدة"
                    className="auth-input w-full p-3.5 pr-11 pl-11 text-sm text-left"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowNewPassword((v) => !v)} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold">8 أحرف على الأقل وتتضمن حروفًا وأرقامًا. سيتم إنهاء كل الجلسات النشطة بعد التغيير.</p>
                <button type="submit" disabled={forgotBusy} className="auth-btn w-full p-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 btn-primary-shine disabled:opacity-60">
                  {forgotBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {forgotBusy ? 'جاري التغيير...' : 'تأكيد كلمة المرور الجديدة'}
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/40 animate-success-ring">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900">تم تغيير كلمة المرور</h3>
                <p className="mt-2 text-sm text-slate-500 font-semibold">سجّل الدخول الآن بكلمة المرور الجديدة.</p>
                <button onClick={closeForgot} className="auth-btn mt-6 px-8 p-3 rounded-2xl text-white font-black text-sm">حسنًا</button>
              </div>
            )}
          </div>
        </div>
      )}
    </AuthShell>
  );
};
