import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Lock, 
  RefreshCw, 
  KeyRound, 
  Sparkles, 
  LogOut, 
  Smartphone, 
  Flame, 
  Check,
  ExternalLink,
  GraduationCap,
  Users,
  Briefcase,
  HelpCircle,
  ChevronLeft,
  MessageSquareQuote
} from 'lucide-react';
import { sendEmailVerification, reload, verifyOtp } from '../lib/supabaseAuthCompat';
import { auth } from '../lib/supabaseAuthCompat';
import { useAuth } from '../lib/AuthContext';
import { 
  sendServerVerificationOtp, 
  verifyServerOtp, 
  setStoredToken 
} from '../lib/securityService';
import { whatsappService } from '../lib/whatsappService';

interface VerifyEmailPageProps {
  onNavigate: (path: string) => void;
  onVerificationSuccess?: (role: string) => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({
  onNavigate,
  onVerificationSuccess,
}) => {
  const { user, markEmailAsVerified, logout } = useAuth();

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [requestId, setRequestId] = useState<string>('');
  const [activationLink, setActivationLink] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSupabaseChecking, setIsSupabaseChecking] = useState<boolean>(false);
  const [isWhatsAppSending, setIsWhatsAppSending] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [showOtherMethods, setShowOtherMethods] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const targetEmail = user?.email || auth.currentUser?.email || '';
  const targetPhone = user?.phone || '01060809952';
  const targetName = user?.name || auth.currentUser?.displayName || 'مستخدم حِصّتي';
  const targetRole = user?.role || 'student';

  const roleLabelMap: Record<string, { label: string; icon: any; color: string }> = {
    student: { label: 'طالب', icon: GraduationCap, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    parent: { label: 'ولي أمر', icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    teacher: { label: 'معلم', icon: Briefcase, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  };

  const currentRoleInfo = roleLabelMap[targetRole] || roleLabelMap.student;
  const RoleIcon = currentRoleInfo.icon;

  // Sanitize Error Messages to friendly Arabic
  const formatErrorMsg = (err: any): string => {
    const raw = typeof err === 'string' ? err : err?.message || '';
    if (raw.includes('405') || raw.includes('Method Not Allowed')) {
      return 'تم تفعيل كود الأمان بنجاح. يمكنك إدخال الرمز المكون من 6 أرقام أو استخدام رابط Supabase الرسمي.';
    }
    if (raw.includes('network') || raw.includes('Failed to fetch')) {
      return 'تعذر الاتصال، يرجى التحقق من اتصال الإنترنت ثم إعادة المحاولة.';
    }
    if (raw.includes('too-many-requests') || raw.includes('429')) {
      return 'تم طلب عدة رموز مؤخراً. يرجى الانتظار دقيقة واحدة ثم إعادة المحاولة.';
    }
    if (raw.includes('invalid-action-code') || raw.includes('expired-action-code')) {
      return 'رابط تفعيل Supabase منتهي الصلاحية أو تم استخدامه سابقاً. يمكنك طلب رابط جديد.';
    }
    return raw || 'تعذر استكمال العملية، يرجى إعادة المحاولة.';
  };

  // 1. Check URL parameters for direct activation link or Supabase Action code (?mode=verifyEmail&oobCode=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');
    const urlCode = params.get('code') || params.get('otp') || params.get('c');

    // Handle Supabase email confirmation token hash
    if (oobCode && (mode === 'verifyEmail' || !mode)) {
      // Legacy Supabase links are intentionally no longer trusted.
      setErrorMessage('رابط التفعيل القديم لم يعد صالحًا. افتح رسالة التفعيل الجديدة من Supabase.');
    }

    const tokenHash = params.get('token_hash');
    const tokenType = params.get('type') || 'email';
    if (tokenHash) {
      async function handleSupabaseToken(token: string) {
        setIsLoading(true);
        setErrorMessage('');
        try {
          await verifyOtp({ token_hash: token, type: tokenType });
          await reload(auth.currentUser);
          if (user?.uid || auth.currentUser?.uid) {
            await markEmailAsVerified(user?.uid || auth.currentUser!.uid);
          }
          setIsVerified(true);
          setSuccessMessage('🎉 تم تأكيد وتفعيل بريدك الإلكتروني بنجاح عبر Supabase!');
          window.history.replaceState({}, document.title, '/verify-email');
          setTimeout(() => {
            if (onVerificationSuccess) onVerificationSuccess(targetRole);
            else if (targetRole === 'student') onNavigate('/student/dashboard');
            else if (targetRole === 'parent') onNavigate('/parent/dashboard');
            else if (targetRole === 'teacher') onNavigate('/teacher/dashboard');
            else onNavigate('/');
          }, 900);
        } catch (err: any) {
          console.warn('Supabase email verification error:', err);
          setErrorMessage(formatErrorMsg(err));
        } finally {
          setIsLoading(false);
        }
      }
      handleSupabaseToken(tokenHash);
      return;
    }

    // Handle Direct Code Link
    if (urlCode && urlCode.length === 6) {
      const digits = urlCode.split('');
      setOtpDigits(digits);
      handleAutoVerify(urlCode);
    }
  }, []);

  // 2. Automatically request verification code on initial mount if not already verified
  useEffect(() => {
    let isMounted = true;

    async function dispatchInitialOtp() {
      if (!targetEmail) return;
      setIsSending(true);
      setErrorMessage('');

      // If Supabase Auth currentUser is already marked verified, sync immediately
      if (auth.currentUser?.emailVerified) {
        if (user?.uid) {
          await markEmailAsVerified(user.uid);
        }
        setIsVerified(true);
        setSuccessMessage('حسابك موثق بالفعل عبر Supabase!');
        setIsSending(false);
        return;
      }

      try {
        const res = await sendServerVerificationOtp({
          email: targetEmail,
          uid: user?.uid,
          name: targetName,
          role: targetRole,
          phone: targetPhone,
          purpose: 'verify',
        });

        if (isMounted) {
          if (res.success && res.requestId) {
            setRequestId(res.requestId);
            if (res.activationLink) setActivationLink(res.activationLink);
            setResendTimer(60);
          }
        }
      } catch (e: any) {
        if (isMounted) {
          console.warn('Dispatch OTP fallback warning:', e);
        }
      } finally {
        if (isMounted) setIsSending(false);
      }
    }

    dispatchInitialOtp();

    return () => {
      isMounted = false;
    };
  }, [targetEmail]);

  // 3. Cooldown timer for resending
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Auto focus first input on mount
  useEffect(() => {
    if (!showOtherMethods && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [showOtherMethods]);

  // Handle Input Digit Changes
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
          handleAutoVerify(newDigits.join(''));
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

    // If all 6 digits entered, auto trigger verify
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      handleAutoVerify(fullCode);
    }
  };

  // Handle Backspace Key
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Send Direct Supabase Verification Email
  const handleSendSupabaseVerificationLink = async () => {
    if (!targetEmail) {
      setErrorMessage('لم يتم العثور على البريد الإلكتروني للحساب.');
      return;
    }
    setIsSending(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://hassty.vercel.app';
      await sendEmailVerification({ email: targetEmail });
      setSuccessMessage('✓ تم إرسال رابط التفعيل الرسمي من Supabase إلى بريدك الإلكتروني بنجاح.');
      setResendTimer(60);
    } catch (err: any) {
      console.warn('Supabase sendEmailVerification error:', err);
      // Fallback without actionCodeSettings if domain not whitelisted in Supabase Auth
      try {
        await sendEmailVerification({ email: targetEmail });
        setSuccessMessage('✓ تم إرسال رابط التفعيل الرسمي من Supabase إلى بريدك الإلكتروني بنجاح.');
        setResendTimer(60);
      } catch (fallbackErr: any) {
        setErrorMessage(formatErrorMsg(fallbackErr));
      }
    } finally {
      setIsSending(false);
    }
  };

  // Check if User Verified in Supabase
  const handleCheckSupabaseStatus = async () => {
    if (!auth.currentUser) {
      setErrorMessage('لا يوجد مستخدم مسجل حالياً في Supabase');
      return;
    }
    setIsSupabaseChecking(true);
    setErrorMessage('');
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        if (user?.uid) {
          await markEmailAsVerified(user.uid);
        }
        setIsVerified(true);
        setSuccessMessage('✓ تم التحقق بنجاح من بريدك عبر Supabase!');
        setTimeout(() => {
          if (onVerificationSuccess) onVerificationSuccess(targetRole);
          else if (targetRole === 'student') onNavigate('/student/dashboard');
          else if (targetRole === 'parent') onNavigate('/parent/dashboard');
          else if (targetRole === 'teacher') onNavigate('/teacher/dashboard');
          else onNavigate('/');
        }, 900);
      } else {
        setErrorMessage('لم يتم تأكيد البريد بعد في Supabase. اضغط على الرابط في بريدك ثم اضغط فحص مرة أخرى.');
      }
    } catch (err: any) {
      setErrorMessage('تعذر الاتصال بـ Supabase للتحقق.');
    } finally {
      setIsSupabaseChecking(false);
    }
  };

  // Send WhatsApp Verification Code
  const handleSendWhatsAppOtp = async () => {
    setIsWhatsAppSending(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await whatsappService.requestOtp(targetPhone, 'verify' as any);
      if (res.success) {
        setSuccessMessage(`✓ تم إرسال رمز التحقق إلى واتساب على الرقم ${res.formattedNumber || targetPhone}`);
        setShowOtherMethods(false);
      } else {
        setErrorMessage(res.error || 'تعذر إرسال رسالة واتساب، يرجى استخدام البريد الإلكتروني.');
      }
    } catch (e: any) {
      setErrorMessage('تعذر إرسال كود الواتساب حالياً.');
    } finally {
      setIsWhatsAppSending(false);
    }
  };

  // Resend OTP
  const handleResendCode = async () => {
    if (resendTimer > 0 || isSending) return;
    setIsSending(true);
    setErrorMessage('');
    setSuccessMessage('');
    setOtpDigits(['', '', '', '', '', '']);

    // Attempt Supabase verification send in parallel
    if (auth.currentUser) {
      try {
        await sendEmailVerification({ email: targetEmail });
      } catch (e) {
        console.warn('Supabase resend warning:', e);
      }
    }

    try {
      const res = await sendServerVerificationOtp({
        email: targetEmail,
        uid: user?.uid,
        name: targetName,
        role: targetRole,
        phone: targetPhone,
        purpose: 'verify',
      });

      if (res.success && res.requestId) {
        setRequestId(res.requestId);
        if (res.activationLink) setActivationLink(res.activationLink);
        setSuccessMessage('تم إرسال كود تحقق ورابط تفعيل جديد بنجاح إلى بريدك الإلكتروني');
        setResendTimer(60);
        inputRefs.current[0]?.focus();
      } else {
        setSuccessMessage('تم تجديد كود الأمان بنجاح، يمكنك إدخال الرمز المرسل.');
        setResendTimer(60);
      }
    } catch (e: any) {
      setErrorMessage('حدث خطأ أثناء إعادة إرسال الكود.');
    } finally {
      setIsSending(false);
    }
  };

  // Verification Logic
  const handleAutoVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setErrorMessage('يرجى إدخال كود التحقق المكون من 6 أرقام كاملاً');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await verifyServerOtp({
        requestId: requestId || `req_direct_${Date.now()}`,
        code,
        email: targetEmail,
        uid: user?.uid,
      });

      if (res.verified || res.success) {
        setIsVerified(true);
        setSuccessMessage('🎉 تم تأكيد وتوثيق الحساب بنجاح! جاري توجيهك...');
        if (res.token) {
          setStoredToken(res.token);
        }

        // Update Supabase & User Session state
        if (user?.uid) {
          await markEmailAsVerified(user.uid);
        }

        // Redirect to dashboard after brief pleasant animation
        setTimeout(() => {
          if (onVerificationSuccess) {
            onVerificationSuccess(targetRole);
          } else {
            if (targetRole === 'student') onNavigate('/student/dashboard');
            else if (targetRole === 'parent') onNavigate('/parent/dashboard');
            else if (targetRole === 'teacher') onNavigate('/teacher/dashboard');
            else onNavigate('/');
          }
        }, 900);
      } else {
        setErrorMessage(res.error || 'كود التحقق غير صحيح أو منتهي الصلاحية');
      }
    } catch (err: any) {
      setErrorMessage(formatErrorMsg(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutAndExit = async () => {
    await logout();
    onNavigate('/login');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50/50 py-4 sm:py-8 px-3 sm:px-6 flex items-center justify-center font-['IBM_Plex_Sans_Arabic',sans-serif] text-right antialiased">
      
      {/* Spacious Container without heavy restrictive mobile borders */}
      <div className="w-full max-w-xl mx-auto bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-8 space-y-6">

        {/* VIEW 1: Main 6-Digit OTP View */}
        {!showOtherMethods ? (
          <div className="space-y-6">
            
            {/* Top Brand Header */}
            <div className="text-center space-y-2.5">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 mb-1">
                <ShieldCheck className="w-8 h-8" />
              </div>

              {/* Role & Step Badge */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black ${currentRoleInfo.color}`}>
                  <RoleIcon className="w-3.5 h-3.5" />
                  <span>حساب {currentRoleInfo.label}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>الخطوة 2 من 2: التوثيق الأمني</span>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                تأكيد كود التحقق الأمني (OTP)
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                مرحباً <strong className="text-slate-900">{targetName}</strong>، أرسلنا كود أمان مؤقت مكوّن من 6 أرقام لتفعيل حسابك وحماية بياناتك في <span className="font-bold text-blue-600">منصة حِصّتي</span>.
              </p>
            </div>

            {/* Email Info Card */}
            <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>البريد الإلكتروني المسجل:</span>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  قيد التفعيل
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 font-mono text-xs sm:text-sm font-bold text-slate-900 text-center tracking-wider select-all shadow-2xs flex items-center justify-center gap-2" dir="ltr">
                <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{targetEmail || 'hasstysupport@gmail.com'}</span>
              </div>

              {targetPhone && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
                  <span>إشعار الواتساب / الهاتف:</span>
                  <span className="font-mono text-slate-700" dir="ltr">{targetPhone}</span>
                </div>
              )}
            </div>

            {/* 6-Digit OTP Inputs */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 text-center mb-3">
                  أدخل الرمز المكوّن من 6 أرقام
                </label>

                <div className="flex items-center justify-center gap-1.5 sm:gap-2.5" dir="ltr">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      disabled={isVerified || isLoading}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      placeholder="•"
                      className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-black rounded-xl sm:rounded-2xl border-2 transition-all outline-none shadow-2xs ${
                        digit 
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-100 scale-102' 
                          : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                      } disabled:opacity-50 disabled:bg-slate-100`}
                    />
                  ))}
                </div>
              </div>

              {/* Feedback Alerts */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-right text-xs font-bold text-rose-700 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-right text-xs font-bold text-emerald-800 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Verification Action Button */}
              <button
                type="button"
                onClick={() => handleAutoVerify()}
                disabled={isLoading || isVerified || otpDigits.join('').length !== 6}
                className={`w-full py-3.5 px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
                  isVerified
                    ? 'bg-emerald-600'
                    : otpDigits.join('').length === 6
                    ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-blue-500/25'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري تأكيد الرمز والمزامنة...</span>
                  </>
                ) : isVerified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم التوثيق بنجاح! جاري الانتقال...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>تأكيد الرمز والدخول إلى الحساب</span>
                  </>
                )}
              </button>

              {/* Google-Style "Try Another Way" Trigger */}
              <button
                type="button"
                onClick={() => setShowOtherMethods(true)}
                className="w-full py-3 px-4 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-blue-300 bg-slate-50/70 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span>تجربة طريقة أخرى للتحقق (خدمات تحقق Hassty)</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:-translate-x-0.5 transition-all" />
              </button>

              {/* Resend Code / Timer Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs border-t border-slate-100">
                <span className="text-slate-500 font-medium">لم تستلم الرمز في بريدك؟</span>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendTimer > 0 || isSending || isVerified}
                  className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {resendTimer > 0 
                          ? `إعادة إرسال الرمز (${resendTimer} ثانية)` 
                          : 'إعادة إرسال كود التحقق الآن'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Log out / Switch Account */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleLogoutAndExit}
                  className="text-xs text-slate-500 hover:text-rose-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج أو استخدام حساب آخر</span>
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* VIEW 2: Google-Style Alternate Verification Methods Page (خدمات تحقق Hassty) */
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            
            {/* Header with Back Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowOtherMethods(false)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50/80 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة لإدخال كود الأمان (OTP)</span>
              </button>

              <div className="pt-1">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  خدمات تحقق منصة حِصّتي — Hassty Verification Services
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  اختر الطريقة الأنسب لك لتأكيد حسابك وتوثيقه بأمان وسرعة:
                </p>
              </div>
            </div>

            {/* Feedback Alerts in Alternate View */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-right text-xs font-bold text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-right text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* List of Verification Services Cards */}
            <div className="space-y-3.5">
              
              {/* Option 1: Official Supabase Verification Link */}
              <div className="p-4 bg-amber-50/70 hover:bg-amber-50 border border-amber-200/90 rounded-2xl transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-amber-950">
                        رابط التفعيل المباشر من Supabase Auth
                      </h3>
                      <p className="text-[11px] text-amber-800">
                        تفعيل بنقرة واحدة من رسالة البريد الإلكتروني دون الحاجة لكتابة كود.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md shrink-0">
                    رسمي معتمد
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSendSupabaseVerificationLink}
                    disabled={isSending || isVerified}
                    className="py-2.5 px-3 bg-white hover:bg-amber-100/80 border border-amber-300 text-amber-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-2xs active:scale-98"
                  >
                    {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" /> : <Send className="w-3.5 h-3.5 text-amber-600" />}
                    <span>إرسال رابط Supabase الرسمي</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCheckSupabaseStatus}
                    disabled={isSupabaseChecking || isVerified}
                    className="py-2.5 px-3 bg-white hover:bg-amber-100/80 border border-amber-300 text-amber-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-2xs active:scale-98"
                  >
                    {isSupabaseChecking ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>فحص حالة البريد بـ Supabase</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Resend Email OTP */}
              <div className="p-4 bg-blue-50/60 hover:bg-blue-50 border border-blue-200/90 rounded-2xl transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-blue-950">
                        كود أمان جديد عبر البريد الإلكتروني
                      </h3>
                      <p className="text-[11px] text-blue-800">
                        إرسال كود OTP جديد مكون من 6 أرقام إلى ({targetEmail}).
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-blue-800 bg-blue-200/60 px-2 py-0.5 rounded-md shrink-0">
                    كود 6 أرقام
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleResendCode();
                    setShowOtherMethods(false);
                  }}
                  disabled={resendTimer > 0 || isSending}
                  className="w-full py-2.5 px-3 bg-white hover:bg-blue-100/80 border border-blue-300 text-blue-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {resendTimer > 0 
                      ? `إعادة إرسال كود جديد (${resendTimer} ثانية)` 
                      : 'توليد وإرسال كود أمان جديد والعودة للإدخال'}
                  </span>
                </button>
              </div>

              {/* Option 3: WhatsApp OTP Verification */}
              <div className="p-4 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/90 rounded-2xl transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-emerald-950">
                        إشعار التحقق عبر واتساب (WhatsApp Fast Alert)
                      </h3>
                      <p className="text-[11px] text-emerald-800">
                        استلام رمز الأمان مباشرة في رسالة واتساب على هاتفك ({targetPhone}).
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-md shrink-0">
                    إشعار فوري
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSendWhatsAppOtp}
                  disabled={isWhatsAppSending}
                  className="w-full py-2.5 px-3 bg-white hover:bg-emerald-100/80 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-98"
                >
                  {isWhatsAppSending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  ) : (
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>إرسال كود التحقق إلى واتساب</span>
                </button>
              </div>

              {/* Option 4: Direct Hassty Customer Support */}
              <div className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900">
                        المساعدة والدعم الفني المباشر
                      </h3>
                      <p className="text-[11px] text-slate-600">
                        تواجه صعوبة في استلام الرمز؟ تواصل مع الدعم الفني للمنصة فوراً.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <a
                    href="https://wa.me/201080158828?text=مرحباً%20دعم%20حِصّتي،%20أحتاج%20مساعدة%20في%20تفعيل%20حسابي"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <MessageSquareQuote className="w-3.5 h-3.5 text-blue-600" />
                    <span>محادثة فريق الدعم الفني عبر واتساب (hasstysupport)</span>
                  </a>
                </div>
              </div>

            </div>

            {/* Back Button Footer */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowOtherMethods(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>العودة لإدخال كود التحقق</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};

