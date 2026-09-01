import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Send,
  ShieldCheck,
  RefreshCw,
  Check,
  UserCheck
} from 'lucide-react';
import { AccountRole } from '../types';
import { useAuth, UserSession } from '../lib/AuthContext';
import { sendServerVerificationOtp, verifyServerOtp, setStoredToken } from '../lib/securityService';
import { AuthShell } from '../components/common/AuthShell';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: (role: AccountRole, email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
}) => {
  const { loginUser, loginWithGoogle, sendPasswordReset, markEmailAsVerified } = useAuth();
  
  // Step State: 'credentials' | 'otp'
  const [authStep, setAuthStep] = useState<'credentials' | 'otp'>('credentials');
  
  // Credentials State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Pending Session Info for OTP Verification
  const [pendingSession, setPendingSession] = useState<UserSession | null>(null);
  
  // OTP Verification State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [requestId, setRequestId] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string>('');
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Forgot Password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [resetErrorMessage, setResetErrorMessage] = useState('');

  // Role labels
  const roleLabelMap: Record<string, { label: string; color: string }> = {
    student: { label: 'طالب', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    parent: { label: 'ولي أمر', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    teacher: { label: 'معلم', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    admin: { label: 'مدير المنصة', color: 'bg-violet-50 text-violet-700 border-violet-200' },
    assistant: { label: 'مساعد', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  };

  // Cooldown timer for OTP resending
  useEffect(() => {
    let interval: any;
    if (authStep === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authStep, resendTimer]);

  // Focus first OTP box when entering OTP step
  useEffect(() => {
    if (authStep === 'otp') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [authStep]);

  // Check if a redirect error occurred
  useEffect(() => {
    try {
      const storedErr = localStorage.getItem('hassty_google_auth_error');
      if (storedErr) {
        const parsed = JSON.parse(storedErr);
        if (parsed.code === 'auth/unauthorized-domain') {
          setErrorMessage('نطاق الموقع غير معتمد في Supabase Auth Authorized Domains.');
        } else {
          setErrorMessage(parsed.message || 'تعذر استكمال تسجيل الدخول عبر Google.');
        }
        localStorage.removeItem('hassty_google_auth_error');
      }
    } catch {
      // ignore
    }
  }, []);

  /**
   * Handle One-Click Google Login
   */
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    try {
      const session = await loginWithGoogle('student');
      if (session) {
        setIsVerifiedSuccess(true);
        setOtpSuccessMessage('🎉 تم تسجيل الدخول بنجاح بحساب Google! جاري التوجيه...');
        setTimeout(() => {
          onLoginSuccess(session.role, session.email);
        }, 500);
      }
    } catch (err: any) {
      console.warn('Google signin error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('تم إغلاق نافذة تسجيل الدخول عبر Google قبل الاكتمال.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMessage('نطاق الموقع غير مضاف في Supabase Auth Authorized Domains. يرجى الدخول بالبريد وكلمة المرور.');
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('حجب المتصفح النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة للمتابعة.');
      } else {
        setErrorMessage(err?.message || 'تعذر تسجيل الدخول بحساب Google. يمكنك المحاولة مجدداً أو الدخول ببيانات الحساب.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  /**
   * Handle Step 1: Verify Credentials and Complete Login
   */
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      // 1. Verify credentials via AuthContext
      const session = await loginUser(email, password);
      setPendingSession(session);
      setIsVerifiedSuccess(true);
      setOtpSuccessMessage(`🎉 مرحباً بك مجدداً ${session.name || ''}! جاري نقلك للوحة التحكم...`);

      setTimeout(() => {
        onLoginSuccess(session.role, session.email);
      }, 500);

    } catch (err: any) {
      setIsLoading(false);
      console.error('Login error:', err);

      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setErrorMessage('بيانات الدخول غير صحيحة. يرجى التأكد من البريد أو رقم الهاتف وكلمة المرور.');
      } else if (code === 'auth/wrong-password') {
        setErrorMessage('كلمة المرور غير صحيحة. يمكنك استعادة كلمة المرور عبر الرابط أدناه.');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('صيغة البريد الإلكتروني غير صالحة.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('تم حظر المحاولات مؤقتاً بسبب كثرة المحاولات الخاطئة. يرجى المحاولة بعد قليل.');
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة، أو الحساب غير مسجل بعد.');
      } else {
        const msg = String(err?.message || '');
        if (msg.includes('operation-not-allowed')) {
          setErrorMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        } else {
          setErrorMessage('حدث خطأ أثناء تسجيل الدخول، يرجى التأكد من صحة البيانات والمحاولة مرة أخرى.');
        }
      }
    }
  };

  /**
   * Handle OTP Digit input change & auto-verify
   */
  const handleDigitChange = (index: number, value: string) => {
    // Check if pasted full 6-digit code
    if (value.length > 1) {
      const sanitized = value.replace(/\D/g, '').slice(0, 6);
      if (sanitized.length > 0) {
        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = sanitized[i] || '';
        }
        setOtpDigits(newDigits);
        const nextIndex = Math.min(sanitized.length, 5);
        inputRefs.current[nextIndex]?.focus();
        if (sanitized.length === 6) {
          handleVerifyLoginOtp(newDigits.join(''));
        }
        return;
      }
    }

    const singleDigit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = singleDigit;
    setOtpDigits(newDigits);
    setErrorMessage('');

    // Advance focus
    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits entered
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      handleVerifyLoginOtp(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  /**
   * Complete Login OTP Verification
   */
  const handleVerifyLoginOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setErrorMessage('يرجى إدخال رمز التحقق المكون من 6 أرقام كاملاً');
      return;
    }

    if (!pendingSession) {
      setErrorMessage('انتهت جلسة تسجيل الدخول. يرجى إعادة المحاولة.');
      setAuthStep('credentials');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await verifyServerOtp({
        requestId: requestId || `req_login_${Date.now()}`,
        code,
        email: pendingSession.email,
        uid: pendingSession.uid,
      });

      if (res.verified || res.success) {
        setIsVerifiedSuccess(true);
        setOtpSuccessMessage('🎉 تم تأكيد الرمز بنجاح! جاري توجيهك إلى لوحة التحكم...');

        if (res.token) {
          setStoredToken(res.token);
        }

        // Mark verified in Supabase if not already
        if (pendingSession.uid) {
          await markEmailAsVerified(pendingSession.uid);
        }

        // Finish login
        setTimeout(() => {
          onLoginSuccess(pendingSession.role, pendingSession.email);
        }, 900);
      } else {
        setErrorMessage(res.error || 'رمز التحقق غير صحيح أو منتهي الصلاحية');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل التحقق من كود تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend OTP in Step 2
   */
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isSendingOtp || !pendingSession) return;
    setIsSendingOtp(true);
    setErrorMessage('');
    setOtpSuccessMessage('');
    setOtpDigits(['', '', '', '', '', '']);

    try {
      const res = await sendServerVerificationOtp({
        email: pendingSession.email,
        uid: pendingSession.uid,
        name: pendingSession.name,
        role: pendingSession.role,
        phone: pendingSession.phone,
        purpose: 'login',
      });

      if (res.success && res.requestId) {
        setRequestId(res.requestId);
        setOtpSuccessMessage('تم إرسال رمز تحقق جديد بنجاح إلى بريدك الإلكتروني.');
        setResendTimer(60);
        inputRefs.current[0]?.focus();
      } else {
        setErrorMessage(res.error || 'تعذر إرسال رمز التحقق. يرجى المحاولة لاحقاً.');
      }
    } catch (e: any) {
      setErrorMessage('حدث خطأ أثناء إعادة إرسال الكود.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  /**
   * Handle Real Supabase Password Reset Email
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setIsResetting(true);
    setResetErrorMessage('');
    setResetSuccessMessage('');

    try {
      await sendPasswordReset(resetEmail.trim());
      setIsResetting(false);
      setResetSuccessMessage(`تم إرسال رابط إعادة تعيين كلمة المرور إلى (${resetEmail}). يرجى مراجعة صندوق الوارد والبريد غير الهام (Spam).`);
    } catch (err: any) {
      setIsResetting(false);
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setResetErrorMessage('لا يوجد حساب مسجل بهذا البريد الإلكتروني.');
      } else if (code === 'auth/invalid-email') {
        setResetErrorMessage('صيغة البريد الإلكتروني غير صحيحة.');
      } else {
        setResetErrorMessage('تعذر إرسال رابط استعادة كلمة المرور. يرجى المحاولة مجدداً.');
      }
    }
  };

  const currentRoleInfo = pendingSession?.role ? (roleLabelMap[pendingSession.role] || roleLabelMap.student) : roleLabelMap.student;

  return (
    <AuthShell onNavigate={onNavigate} miniTitle="مرحباً بعودتك 👋">

      {/* ═══════════ بطاقة المصادقة الفخمة ═══════════ */}
      <div className="card-lux bg-white border border-slate-200/90 rounded-3xl shadow-[0_20px_60px_-24px_rgba(30,58,138,0.25)] p-6 sm:p-7 space-y-5 anim-up">

        {/* رأس البطاقة + مؤشر الخطوات */}
        <div className="pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
              <QrCode className="w-5.5 h-5.5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                {authStep === 'credentials' ? 'تسجيل الدخول' : 'تأكيد رمز الدخول'}
              </h2>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                {authStep === 'credentials' ? 'أدخل بياناتك للمتابعة والتحقق الأمني المزدوج' : 'أدخل الرمز المرسل لبريدك لتأكيد الهوية'}
              </p>
            </div>
          </div>

          <div className="auth-steps">
            <div className={`dot ${authStep === 'credentials' ? 'active' : 'done'}`}>
              {authStep === 'credentials' ? '1' : <Check className="w-3 h-3" />}
            </div>
            <span className="text-[10px] font-black text-slate-500">بيانات الحساب</span>
            <div className={`bar ${authStep === 'otp' ? 'active' : ''}`} />
            <div className={`dot ${authStep === 'otp' ? 'active' : ''}`}>2</div>
            <span className={`text-[10px] font-black ${authStep === 'otp' ? 'text-[#2563EB]' : 'text-slate-400'}`}>رمز OTP</span>
          </div>
        </div>

        {/* تنبيهات */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-800 flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {otpSuccessMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">{otpSuccessMessage}</div>
          </div>
        )}

        {/* ═══ الخطوة 1: بيانات الدخول ═══ */}
        {authStep === 'credentials' && (
          <div className="space-y-4 anim-up">

            {/* Google One-Click Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-300 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 active:scale-[0.99] hover:-translate-y-0.5"
            >
              {isGoogleLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-blue-700 font-bold">جاري تسجيل الدخول عبر Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>الدخول السريع بحساب Google</span>
                </>
              )}
            </button>

            {/* فاصل */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 font-bold shrink-0">أو بالبريد وكلمة المرور</span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-4">

              {/* البريد أو الهاتف */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">البريد الإلكتروني أو رقم الهاتف</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    dir="ltr"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input pl-10 pr-11 py-3 text-sm text-left"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* كلمة المرور */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-slate-700">كلمة المرور</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowForgotModal(true);
                      setResetSuccessMessage('');
                      setResetErrorMessage('');
                    }}
                    className="text-[11px] text-[#2563EB] font-bold hover:underline cursor-pointer"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    dir="ltr"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input pl-10 pr-11 py-3 text-sm text-left"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="إظهار كلمة المرور"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* حفظ الجلسة + شارة الأمان */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                  />
                  <span className="font-bold">حفظ الجلسة</span>
                </label>
                <span className="text-[10px] text-blue-700 font-bold bg-gradient-to-l from-blue-50 to-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-blue-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                  مصادقة ثنائية بـ OTP
                </span>
              </div>

              {/* زر المتابعة */}
              <button
                type="submit"
                disabled={isLoading}
                className="auth-btn w-full py-3.5 font-black text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التحقق وإرسال الرمز...</span>
                  </>
                ) : (
                  <>
                    <span>متابعة لتأكيد رمز OTP</span>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ═══ الخطوة 2: تأكيد OTP ═══ */}
        {authStep === 'otp' && (
          <div className="space-y-5 animate-fadeIn">

            {/* بطاقة الحساب المستهدف */}
            <div className="p-4 rounded-2xl bg-gradient-to-l from-slate-50 to-blue-50/60 border border-blue-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800 leading-none">{pendingSession?.name || 'مستخدم حِصّتي'}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{pendingSession?.email}</div>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${currentRoleInfo.color}`}>
                  {currentRoleInfo.label}
                </span>
              </div>
              <div className="text-[11px] text-blue-700 font-bold text-center pt-1">
                تم إرسال رمز الأمان إلى صندوق بريدك الإلكتروني ✉️
              </div>
            </div>

            {/* خانات OTP */}
            <div>
              <label className="block text-xs font-black text-slate-700 text-center mb-3">
                أدخل رمز OTP المكوّن من 6 أرقام
              </label>
              <div className="flex items-center justify-center gap-2" dir="ltr">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    disabled={isVerifiedSuccess || isLoading}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    placeholder="•"
                    className={`auth-otp ${isVerifiedSuccess ? 'done' : digit ? 'filled' : ''} disabled:opacity-60`}
                  />
                ))}
              </div>
            </div>

            {/* زر التأكيد */}
            <button
              type="button"
              onClick={() => handleVerifyLoginOtp()}
              disabled={isLoading || isVerifiedSuccess || otpDigits.join('').length !== 6}
              className={`w-full py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isVerifiedSuccess
                  ? 'bg-gradient-to-l from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30'
                  : otpDigits.join('').length === 6
                  ? 'auth-btn'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق وتأكيد الدخول...</span>
                </>
              ) : isVerifiedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تم التحقق! جاري الدخول...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>تأكيد رمز OTP والدخول</span>
                </>
              )}
            </button>

            {/* عناصر التحكم */}
            <div className="pt-3 flex items-center justify-between text-xs border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setAuthStep('credentials');
                  setErrorMessage('');
                  setOtpSuccessMessage('');
                }}
                className="text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
              >
                ← تغيير الحساب أو كلمة المرور
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || isSendingOtp || isVerifiedSuccess}
                className="font-bold text-[#2563EB] hover:text-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
              >
                {isSendingOtp ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>
                      {resendTimer > 0 ? `إعادة إرسال (${resendTimer}ث)` : 'إعادة إرسال الرمز'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* التحويل للتسجيل */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            ليس لديك حساب بعد؟{' '}
            <button
              onClick={() => onNavigate('/signup')}
              className="text-[#2563EB] font-black hover:underline cursor-pointer"
            >
              إنشاء حساب جديد
            </button>
          </p>
        </div>
      </div>

      {/* ═══ نافذة استعادة كلمة المرور ═══ */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm" onClick={() => setShowForgotModal(false)}>
          <div
            className="dialog-lux bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
              <KeyRound className="w-5.5 h-5.5" />
            </div>

            <h3 className="text-lg font-black text-slate-900">استعادة كلمة المرور</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً مباشراً لتعيين كلمة مرور جديدة فوراً.
            </p>

            {resetSuccessMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{resetSuccessMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2.5 bg-gradient-to-l from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/25 text-white rounded-xl text-xs font-black cursor-pointer transition-all"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetErrorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{resetErrorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">البريد الإلكتروني المسجل</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      dir="ltr"
                      placeholder="name@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="auth-input pl-4 pr-11 py-3 text-sm text-left"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isResetting || !resetEmail.trim()}
                    className="auth-btn flex-1 py-3 text-white rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isResetting ? (
                      <span>جاري الإرسال...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>إرسال رابط الاستعادة</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black cursor-pointer transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </AuthShell>
  );
};
