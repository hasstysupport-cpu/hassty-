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
  Copy,
  ExternalLink,
  GraduationCap,
  Users,
  Briefcase
} from 'lucide-react';
import { applyActionCode, sendEmailVerification, reload } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { 
  sendServerVerificationOtp, 
  verifyServerOtp, 
  setStoredToken 
} from '../lib/securityService';

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
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isFirebaseChecking, setIsFirebaseChecking] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [maskedEmail, setMaskedEmail] = useState<string>('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const targetEmail = user?.email || auth.currentUser?.email || '';
  const targetPhone = user?.phone || '';
  const targetName = user?.name || auth.currentUser?.displayName || 'مستخدم حِصّتي';
  const targetRole = user?.role || 'student';

  const roleLabelMap: Record<string, { label: string; icon: any; color: string }> = {
    student: { label: 'طالب', icon: GraduationCap, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    parent: { label: 'ولي أمر', icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    teacher: { label: 'معلم', icon: Briefcase, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  };

  const currentRoleInfo = roleLabelMap[targetRole] || roleLabelMap.student;
  const RoleIcon = currentRoleInfo.icon;

  // 1. Check URL parameters for direct activation link or Firebase Action code (?mode=verifyEmail&oobCode=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');
    const urlCode = params.get('code') || params.get('otp') || params.get('c');

    // Handle Official Firebase Auth Action Link
    if (oobCode && (mode === 'verifyEmail' || !mode)) {
      async function handleFirebaseActionCode(code: string) {
        setIsLoading(true);
        setErrorMessage('');
        try {
          await applyActionCode(auth, code);
          if (auth.currentUser) {
            await reload(auth.currentUser);
          }
          if (user?.uid || auth.currentUser?.uid) {
            await markEmailAsVerified(user?.uid || auth.currentUser!.uid);
          }
          setIsVerified(true);
          setSuccessMessage('🎉 تم تأكيد وتفعيل بريدك الإلكتروني بنجاح عبر Firebase!');
          setTimeout(() => {
            if (onVerificationSuccess) onVerificationSuccess(targetRole);
            else if (targetRole === 'student') onNavigate('/student/dashboard');
            else if (targetRole === 'parent') onNavigate('/parent/dashboard');
            else if (targetRole === 'teacher') onNavigate('/teacher/dashboard');
            else onNavigate('/');
          }, 1200);
        } catch (fbErr: any) {
          console.warn('Firebase applyActionCode error:', fbErr);
          setErrorMessage('رمز تفعيل Firebase غير صالح أو منتهي الصلاحية. يمكنك طلب رابط جديد.');
        } finally {
          setIsLoading(false);
        }
      }
      handleFirebaseActionCode(oobCode);
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

      // If Firebase Auth currentUser is already marked verified, sync immediately
      if (auth.currentUser?.emailVerified) {
        if (user?.uid) {
          await markEmailAsVerified(user.uid);
        }
        setIsVerified(true);
        setSuccessMessage('حسابك موثق بالفعل عبر Firebase!');
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
            if (res.maskedEmail) setMaskedEmail(res.maskedEmail);
            if (res.activationLink) setActivationLink(res.activationLink);
            setResendTimer(60);
          } else {
            setErrorMessage(res.error || 'تعذر إرسال كود التحقق. يرجى إعادة الإرسال.');
          }
        }
      } catch (e: any) {
        if (isMounted) {
          setErrorMessage('حدث خطأ أثناء طلب رمز التحقق.');
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
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

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

  // Send Direct Firebase Verification Email
  const handleSendFirebaseVerificationLink = async () => {
    if (!auth.currentUser) {
      setErrorMessage('يرجى التأكد من تسجيل الدخول بحسابك لإرسال رابط تفعيل Firebase.');
      return;
    }
    setIsSending(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await sendEmailVerification(auth.currentUser);
      setSuccessMessage('✓ تم إرسال رابط التفعيل الرسمي من Firebase إلى بريدك الإلكتروني بنجاح.');
      setResendTimer(60);
    } catch (err: any) {
      console.warn('Firebase sendEmailVerification error:', err);
      setErrorMessage(err?.message || 'فشل إرسال رابط التفعيل عبر Firebase');
    } finally {
      setIsSending(false);
    }
  };

  // Check if User Verified in Firebase
  const handleCheckFirebaseStatus = async () => {
    if (!auth.currentUser) {
      setErrorMessage('لا يوجد مستخدم مسجل حالياً في Firebase');
      return;
    }
    setIsFirebaseChecking(true);
    setErrorMessage('');
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        if (user?.uid) {
          await markEmailAsVerified(user.uid);
        }
        setIsVerified(true);
        setSuccessMessage('✓ تم التحقق بنجاح من بريدك عبر Firebase!');
        setTimeout(() => {
          if (onVerificationSuccess) onVerificationSuccess(targetRole);
          else if (targetRole === 'student') onNavigate('/student/dashboard');
          else if (targetRole === 'parent') onNavigate('/parent/dashboard');
          else if (targetRole === 'teacher') onNavigate('/teacher/dashboard');
          else onNavigate('/');
        }, 900);
      } else {
        setErrorMessage('لم يتم تأكيد البريد بعد في Firebase. اضغط على الرابط في بريدك ثم اضغط فحص مرة أخرى.');
      }
    } catch (err: any) {
      setErrorMessage('تعذر الاتصال بـ Firebase للتحقق.');
    } finally {
      setIsFirebaseChecking(false);
    }
  };

  // Resend OTP
  const handleResendCode = async () => {
    if (resendTimer > 0 || isSending) return;
    setIsSending(true);
    setErrorMessage('');
    setSuccessMessage('');
    setOtpDigits(['', '', '', '', '', '']);

    // Attempt Firebase verification send in parallel
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
      } catch (e) {
        console.warn('Firebase resend warning:', e);
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
        setErrorMessage(res.error || 'تعذر إرسال كود التحقق. يرجى المحاولة لاحقاً.');
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

        // Update Firestore & User Session state
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
      setErrorMessage(err?.message || 'فشل التحقق من الكود');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (activationLink) {
      navigator.clipboard.writeText(activationLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleLogoutAndExit = async () => {
    await logout();
    onNavigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900/5 py-12 px-4 sm:px-6 flex items-center justify-center relative overflow-hidden">
      
      {/* Background Decorative Rings */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-10 relative z-10">
        
        {/* Top Brand Stripe */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 rounded-t-3xl" />

        {/* Header Section */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 mb-1">
            <ShieldCheck className="w-9 h-9" />
          </div>

          {/* Role & Step Badge */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-extrabold ${currentRoleInfo.color}`}>
              <RoleIcon className="w-3.5 h-3.5" />
              <span>حساب {currentRoleInfo.label}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>الخطوة 2 من 2: التوثيق الأمني</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            تأكيد كود التحقق الأمني (OTP)
          </h1>

          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            مرحباً <strong className="text-slate-900">{targetName}</strong>، أرسلنا كود أمان مؤقت مكوّن من 6 أرقام لتفعيل حسابك وحماية بياناتك التعليمية في <span className="font-bold text-blue-600">منصة حِصّتي</span>.
          </p>
        </div>

        {/* Email & Account Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>البريد الإلكتروني المسجل:</span>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              قيد التفعيل
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-sm font-bold text-slate-900 text-center tracking-wider select-all shadow-xs flex items-center justify-center gap-2" dir="ltr">
            <Mail className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{targetEmail || 'hasstysupport@gmail.com'}</span>
          </div>

          <div className="text-[11px] text-blue-700 font-semibold text-center pt-0.5">
            تم إرسال رمز الأمان ورابط التفعيل إلى بريدك الإلكتروني ✉️
          </div>
        </div>

        {/* 6-Digit OTP Inputs Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 text-center mb-3">
              أدخل الرمز المكوّن من 6 أرقام
            </label>

            <div className="flex items-center justify-center gap-2 sm:gap-3" dir="ltr">
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
                  className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-black rounded-2xl border-2 transition-all outline-none shadow-xs ${
                    digit 
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-4 ring-blue-100 scale-105' 
                      : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100'
                  } disabled:opacity-50 disabled:bg-slate-100`}
                />
              ))}
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-right text-xs font-bold text-rose-700 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-right text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Verification Action Button */}
          <button
            type="button"
            onClick={() => handleAutoVerify()}
            disabled={isLoading || isVerified || otpDigits.join('').length !== 6}
            className={`w-full py-4 px-4 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
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
                <span>جاري التحقق والمزامنة في Firebase...</span>
              </>
            ) : isVerified ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>تم التوثيق بنجاح! جاري الانتقال...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>تأكيد الرمز والدخول إلى الحساب</span>
              </>
            )}
          </button>

          {/* Firebase Direct Actions Card */}
          <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-xs text-amber-950 font-bold">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" />
                خدمات تفعيل Firebase Auth الرسمية:
              </span>
              <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-bold">
                المعتمد
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleSendFirebaseVerificationLink}
                disabled={isSending || isVerified}
                className="py-2.5 px-3 bg-white hover:bg-amber-100/70 border border-amber-300 text-amber-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-98"
              >
                <Send className="w-3.5 h-3.5 text-amber-600" />
                <span>إرسال رابط Firebase الرسمي</span>
              </button>

              <button
                type="button"
                onClick={handleCheckFirebaseStatus}
                disabled={isFirebaseChecking || isVerified}
                className="py-2.5 px-3 bg-white hover:bg-amber-100/70 border border-amber-300 text-amber-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-98"
              >
                {isFirebaseChecking ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>فحص حالة البريد بـ Firebase</span>
              </button>
            </div>
          </div>

          {/* Resend Code / Timer Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-100">
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
          <div className="pt-3 text-center">
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
    </div>
  );
};
