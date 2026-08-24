import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Send,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Smartphone,
  Check,
  LogOut,
  GraduationCap,
  Users,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { AccountRole } from '../types';
import { useAuth, UserSession } from '../lib/AuthContext';
import { sendServerVerificationOtp, verifyServerOtp, setStoredToken } from '../lib/securityService';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: (role: AccountRole, email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
}) => {
  const { loginUser, sendPasswordReset, markEmailAsVerified } = useAuth();
  
  // Step State: 'credentials' | 'otp'
  const [authStep, setAuthStep] = useState<'credentials' | 'otp'>('credentials');
  
  // Credentials State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
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
  const roleLabelMap: Record<string, { label: string; icon: any; color: string }> = {
    student: { label: 'طالب', icon: GraduationCap, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    parent: { label: 'ولي أمر', icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    teacher: { label: 'معلم', icon: Briefcase, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    admin: { label: 'مدير المنصة', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50 border-amber-200' },
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

  /**
   * Handle Step 1: Verify Credentials and Dispatch Login OTP
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

      // 2. Dispatch Login OTP code via server
      setIsSendingOtp(true);
      try {
        const otpRes = await sendServerVerificationOtp({
          email: session.email,
          uid: session.uid,
          name: session.name,
          role: session.role,
          phone: session.phone,
          purpose: 'login',
        });

        if (otpRes.success && otpRes.requestId) {
          setRequestId(otpRes.requestId);
        }
      } catch (otpErr) {
        console.warn('Login OTP dispatch warning:', otpErr);
      } finally {
        setIsSendingOtp(false);
      }

      // 3. Move to OTP Verification Step
      setIsLoading(false);
      setAuthStep('otp');
      setResendTimer(60);
      setOtpDigits(['', '', '', '', '', '']);

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
          setErrorMessage('حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى.');
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

        // Mark verified in Firestore if not already
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
   * Handle Real Firebase Password Reset Email
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
  const RoleIcon = currentRoleInfo.icon;

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-right font-['IBM_Plex_Sans_Arabic',sans-serif] relative overflow-hidden">
      
      {/* Background Decorative Blurs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        {/* Logo */}
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2.5 mb-4 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <QrCode className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-3xl font-black text-[#1E3A8A] tracking-tight">
            حِصّتي
          </span>
        </button>

        <h2 className="text-2xl font-black text-[#1E3A8A]">
          {authStep === 'credentials' ? 'تسجيل الدخول إلى حسابك' : 'تأكيد رمز الدخول (OTP)'}
        </h2>
        <p className="mt-1 text-xs text-[#6B7280]">
          {authStep === 'credentials' 
            ? 'أدخل بيانات حسابك للمتابعة والتحقق الأمني المزدوج' 
            : 'أدخل الرمز المكون من 6 أرقام المرسل لبريدك لتأكيد الهوية'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-white border border-[#E5E7EB] py-8 px-6 sm:px-8 rounded-3xl shadow-xl space-y-6">
          
          {/* Step Indicator Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                authStep === 'credentials' ? 'bg-[#2563EB] text-white' : 'bg-emerald-600 text-white'
              }`}>
                {authStep === 'credentials' ? '1' : '✓'}
              </span>
              <span className="text-xs font-bold text-gray-700">بيانات الحساب</span>
            </div>

            <div className="h-0.5 w-12 bg-gray-200" />

            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                authStep === 'otp' ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                2
              </span>
              <span className={`text-xs font-bold ${authStep === 'otp' ? 'text-[#2563EB]' : 'text-gray-400'}`}>
                رمز OTP
              </span>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-800 flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Success Alert */}
          {otpSuccessMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">{otpSuccessMessage}</div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: CREDENTIALS FORM                                 */}
          {/* ======================================================== */}
          {authStep === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              
              {/* Email or Phone Field */}
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                  البريد الإلكتروني أو رقم الهاتف
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    dir="ltr"
                    placeholder="name@example.com أو 010xxxxxxxx"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm font-sans text-left focus:bg-white focus:outline-none focus:border-[#2563EB] transition-colors"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#1F2937]">
                    كلمة المرور
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowForgotModal(true);
                      setResetSuccessMessage('');
                      setResetErrorMessage('');
                    }}
                    className="text-xs text-[#2563EB] font-bold hover:underline cursor-pointer"
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
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm font-sans text-left focus:bg-white focus:outline-none focus:border-[#2563EB] transition-colors"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label="إظهار كلمة المرور"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Security & Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-[#4B5563] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#2563EB] rounded-md border-gray-300 focus:ring-0 cursor-pointer"
                  />
                  <span className="font-semibold text-gray-700">حفظ الجلسة</span>
                </label>

                <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-blue-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  مصادقة ثنائية بـ OTP
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التحقق وإرسال الرمز...</span>
                  </>
                ) : (
                  <>
                    <span>متابعة لتأكيد رمز OTP</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 2: OTP VERIFICATION FORM                             */}
          {/* ======================================================== */}
          {authStep === 'otp' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* User / Email Target Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">{pendingSession?.name || 'مستخدم حِصّتي'}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentRoleInfo.color}`}>
                    {currentRoleInfo.label}
                  </span>
                </div>

                <div className="text-xs font-mono font-bold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 text-center select-all flex items-center justify-center gap-2" dir="ltr">
                  <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{pendingSession?.email}</span>
                </div>
                <div className="text-[11px] text-blue-700 font-semibold text-center pt-0.5">
                  تم إرسال رمز الأمان إلى صندوق بريدك الإلكتروني ✉️
                </div>
              </div>

              {/* 6-Digit OTP Inputs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 text-center mb-2.5">
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
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-black rounded-xl border-2 transition-all outline-none shadow-xs ${
                        digit 
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-100 scale-105' 
                          : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                      } disabled:opacity-50 disabled:bg-slate-100`}
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={() => handleVerifyLoginOtp()}
                disabled={isLoading || isVerifiedSuccess || otpDigits.join('').length !== 6}
                className={`w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  isVerifiedSuccess
                    ? 'bg-emerald-600'
                    : otpDigits.join('').length === 6
                    ? 'bg-[#2563EB] hover:bg-[#1D4ED8] shadow-blue-500/25 active:scale-[0.99]'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
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

              {/* Resend & Return Controls */}
              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
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
                  className="font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
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
                        {resendTimer > 0 
                          ? `إعادة إرسال (${resendTimer}ث)` 
                          : 'إعادة إرسال الرمز'}
                      </span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* Switch to Register */}
          <div className="pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-[#6B7280]">
              ليس لديك حساب بعد؟{' '}
              <button
                onClick={() => onNavigate('/signup')}
                className="text-[#2563EB] font-bold hover:underline cursor-pointer"
              >
                إنشاء حساب جديد
              </button>
            </p>
          </div>

        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 text-right animate-scaleUp">
            
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-[#1E3A8A]">
              استعادة كلمة المرور
            </h3>
            <p className="text-xs text-[#6B7280] mt-1 mb-4">
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
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
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
                  <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                    البريد الإلكتروني المسجل
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      dir="ltr"
                      placeholder="name@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm font-sans text-left focus:bg-white focus:outline-none focus:border-[#2563EB]"
                    />
                    <Mail className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isResetting || !resetEmail.trim()}
                    className="flex-1 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
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
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
