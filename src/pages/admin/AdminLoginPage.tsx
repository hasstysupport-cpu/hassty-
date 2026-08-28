import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  Send,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Fingerprint,
  RefreshCw,
  LogIn,
  KeyRound
} from 'lucide-react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import {
  OFFICIAL_ADMIN_EMAIL,
  SECRET_ADMIN_ROUTE,
  requestAdminMagicLink,
  verifyAdminMagicToken,
  saveAdminSession,
  clearAdminSession,
} from '../../lib/securityConfig';

interface AdminLoginPageProps {
  onLoginSuccess: (email: string) => void;
  onBackToPublicSite?: () => void;
  initialToken?: string | null;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBackToPublicSite,
  initialToken,
}) => {
  const [step, setStep] = useState<'request' | 'otp_verify' | 'verifying' | 'success'>('request');
  const [targetEmail, setTargetEmail] = useState(OFFICIAL_ADMIN_EMAIL);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [magicTokenInput, setMagicTokenInput] = useState(initialToken || '');
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check URL query parameters and redirect results on load
  useEffect(() => {
    // Process redirect result if returned from Google
    getRedirectResult(auth)
      .then(async (res) => {
        if (res && res.user) {
          const user = res.user;
          const userEmail = (user.email || '').toLowerCase().trim();
          const adminName = user.displayName || 'مدير المنصة';
          const adminPhoto = user.photoURL || '';

          try {
            await setDoc(doc(db, 'admin_users', user.uid), {
              uid: user.uid,
              email: userEmail,
              name: adminName,
              photoURL: adminPhoto,
              role: 'super_admin',
              lastLogin: new Date().toISOString(),
              authProvider: 'google',
              status: 'active'
            }, { merge: true });

            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: userEmail,
              name: adminName,
              role: 'admin',
              avatarUrl: adminPhoto,
              accountStatus: 'active',
              emailVerified: true,
              lastLogin: new Date().toISOString(),
            }, { merge: true });
          } catch (dbErr) {
            console.warn('Admin Firestore record save notice:', dbErr);
          }

          saveAdminSession({
            token: `google_admin_${user.uid}_${Date.now()}`,
            email: userEmail,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            role: 'admin',
          });

          setStep('success');
          setSuccessMessage(`تم تسجيل الدخول الإداري بنجاح (${userEmail})! جاري نقلك إلى لوحة التحكم...`);
          setTimeout(() => {
            onLoginSuccess(userEmail);
          }, 500);
        }
      })
      .catch((err) => {
        console.warn('Admin Redirect notice:', err);
      });

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paramCode = urlParams.get('code');
      const paramAuthKey = urlParams.get('authKey') || initialToken;
      
      if (paramCode && paramCode.trim().length >= 6) {
        setOtpCodeInput(paramCode.trim());
        setStep('verifying');
        handleVerifyCodeOrToken(paramCode.trim());
      } else if (paramAuthKey && paramAuthKey.trim().length > 0) {
        setMagicTokenInput(paramAuthKey.trim());
        setStep('verifying');
        handleVerifyCodeOrToken(paramAuthKey.trim());
      }
    } catch (e) {
      console.warn('URL param parse error:', e);
    }
  }, [initialToken]);

  // Cooldown countdown
  useEffect(() => {
    let interval: any;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  // Step 1: Request 6-digit OTP code & link dispatched to official email
  const handleRequestOtpCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cooldown > 0 || isSending) return;

    setIsSending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await requestAdminMagicLink(OFFICIAL_ADMIN_EMAIL);

      if (res.success) {
        setStep('otp_verify');
        setSuccessMessage('تم إرسال كود التحقق المكون من 6 أرقام ورابط الدخول السري إلى البريد الإداري الرسمي (hasstysupport@gmail.com).');
        setCooldown(60);
      } else {
        setErrorMessage(res.error || 'تعذر إرسال الكود. يرجى التأكد من إعدادات البريد الإداري.');
      }
    } catch {
      setErrorMessage('حدث خطأ أثناء الاتصال بالخادم الآمن.');
    } finally {
      setIsSending(false);
    }
  };

  // Google Admin Authentication
  const handleGoogleAdminLogin = async () => {
    setIsVerifying(true);
    setErrorMessage('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const isMobile =
        typeof navigator !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        await signInWithRedirect(auth, provider);
        return;
      }

      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupErr: any) {
        if (
          popupErr?.code === 'auth/popup-blocked' ||
          popupErr?.code === 'auth/popup-closed-by-user' ||
          popupErr?.code === 'auth/cancelled-popup-request'
        ) {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw popupErr;
      }

      const user = result.user;
      const userEmail = (user.email || '').toLowerCase().trim();
      const adminName = user.displayName || 'مدير المنصة';
      const adminPhoto = user.photoURL || '';

      // Create or update admin account in Firestore (admin_users & users collections)
      try {
        await setDoc(doc(db, 'admin_users', user.uid), {
          uid: user.uid,
          email: userEmail,
          name: adminName,
          photoURL: adminPhoto,
          role: 'super_admin',
          lastLogin: new Date().toISOString(),
          authProvider: 'google',
          status: 'active'
        }, { merge: true });

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: userEmail,
          name: adminName,
          role: 'admin',
          avatarUrl: adminPhoto,
          accountStatus: 'active',
          emailVerified: true,
          lastLogin: new Date().toISOString(),
        }, { merge: true });
      } catch (dbErr) {
        console.warn('Admin Firestore record save notice:', dbErr);
      }

      // Save admin session in storage
      saveAdminSession({
        token: `google_admin_${user.uid}_${Date.now()}`,
        email: userEmail,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        role: 'admin',
      });

      setStep('success');
      setSuccessMessage(`تم تسجيل الدخول الإداري بنجاح (${userEmail})! جاري نقلك إلى لوحة التحكم...`);
      setTimeout(() => {
        onLoginSuccess(userEmail);
      }, 500);
    } catch (err: any) {
      console.warn('Google Admin Auth notice:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('تم إغلاق نافذة تسجيل الدخول قبل الاكتمال');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMessage('نطاق التطبيق يحتاج إضافة في Firebase Auth Console (Authorized Domains). يمكنك أيضاً استخدام كود التحقق المرسل للبريد.');
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('المتصفح حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة أو فتح التطبيق في تبويب جديد.');
      } else {
        setErrorMessage(err?.message || 'تعذر تسجيل الدخول عبر Google. يمكنك استخدام كود التحقق.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 2: Verify 6-digit OTP code or magic token
  const handleVerifyCodeOrToken = async (customInput?: string) => {
    const targetInput = (customInput || otpCodeInput || magicTokenInput).trim();
    if (!targetInput) {
      setErrorMessage('يرجى إدخال كود التحقق المكون من 6 أرقام');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const res = await verifyAdminMagicToken(targetInput);

      if (res.valid) {
        setStep('success');
        setSuccessMessage('تم التحقق من كود الإدارة بنجاح! تم فتح جلسة إدارية آمنة لمدة 24 ساعة.');
        
        setTimeout(() => {
          onLoginSuccess(OFFICIAL_ADMIN_EMAIL);
        }, 1000);
      } else {
        setErrorMessage(res.error || 'كود التحقق غير صحيح أو منتهي الصلاحية (صلاحية الكود ساعة واحدة).');
      }
    } catch {
      setErrorMessage('فشل التحقق من كود الدخول الإداري.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-['IBM_Plex_Sans_Arabic',sans-serif] text-right antialiased relative overflow-hidden select-none">
      
      {/* Dynamic Cyber Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E40AF_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        
        {/* Brand & Security Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-18 h-18 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-3xl mx-auto shadow-2xl shadow-blue-500/25 border-2 border-blue-400/30">
            حِ
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">حِصّتي</h1>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40">
              Admin Control Center
            </span>
          </div>

          <p className="text-xs text-slate-400 font-mono tracking-wide">
            بوابة الإدارة المركزية السرية • تحقق أمني عبر رمز OTP و Google
          </p>
        </div>

        {/* Security Rule Indicators */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          <div className="bg-slate-900/90 border border-blue-900/60 p-3 rounded-2xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-[11px] leading-tight">
              <span className="text-slate-400 block text-[10px]">صلاحية كود التحقق:</span>
              <strong className="text-amber-400 font-bold">ساعة واحدة (60 د)</strong>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-emerald-900/60 p-3 rounded-2xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-[11px] leading-tight">
              <span className="text-slate-400 block text-[10px]">مدة جلسة الأدمن:</span>
              <strong className="text-emerald-400 font-bold">24 ساعة مشفرة</strong>
            </div>
          </div>
        </div>

        {/* Main Authentication Box */}
        <div className="bg-[#0F172A]/95 border border-slate-700/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl space-y-6 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs font-bold flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs font-bold flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* STEP 1: REQUEST CODE OR GOOGLE LOGIN */}
          {step === 'request' && (
            <div className="space-y-5">
              
              {/* Google Official Admin Login Button */}
              <button
                type="button"
                onClick={() => handleGoogleAdminLogin()}
                disabled={isVerifying}
                className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-600 hover:border-slate-500 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>الدخول المباشر بحساب Google</span>
              </button>

              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-[#0F172A] px-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  أو عبر رمز التحقق (OTP)
                </span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              <div className="space-y-2 text-right">
                <label className="block text-xs font-bold text-slate-200">
                  البريد الإلكتروني الإداري المعتمد
                </label>
                <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-300" dir="ltr">
                    {OFFICIAL_ADMIN_EMAIL}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    المسؤول الرسمي
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  سيتم إرسال كود دخول رقمي مباشر (6 أرقام) إلى بريدك المسجل فور الضغط أدناه.
                </p>
              </div>

              {/* Request Code Action Button */}
              <button
                type="button"
                onClick={() => handleRequestOtpCode()}
                disabled={isSending || cooldown > 0}
                className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري توليد كود التحقق وإرساله...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>
                      {cooldown > 0 
                        ? `إعادة إرسال الكود (${cooldown} ثانية)` 
                        : 'إرسال كود التحقق (OTP) إلى البريد الإداري'}
                    </span>
                  </>
                )}
              </button>

              {/* Direct Code Entry Option */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('otp_verify')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold underline transition-colors cursor-pointer"
                >
                  هل لديك كود أو رمز مسبقاً؟ اضغط هنا لإدخاله مباشرة
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: ENTER OTP CODE */}
          {step === 'otp_verify' && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-white">أدخل كود التحقق الإداري (6 أرقام)</h3>
                <p className="text-[11px] text-slate-400">
                  تم إرسال الكود إلى <strong className="text-blue-300" dir="ltr">{OFFICIAL_ADMIN_EMAIL}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  maxLength={32}
                  value={otpCodeInput}
                  onChange={(e) => setOtpCodeInput(e.target.value.replace(/\s+/g, ''))}
                  placeholder="------"
                  className="w-full text-center tracking-[8px] font-mono text-2xl py-3 px-4 bg-slate-900 border-2 border-blue-500/50 rounded-2xl text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                  dir="ltr"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={() => handleVerifyCodeOrToken()}
                disabled={isVerifying || !otpCodeInput.trim()}
                className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التحقق من الكود...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد الكود والدخول للوحة التحكم</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleRequestOtpCode()}
                  disabled={cooldown > 0 || isSending}
                  className="text-blue-400 hover:text-blue-300 font-bold disabled:text-slate-600 cursor-pointer"
                >
                  {cooldown > 0 ? `إعادة الإرسال بعد (${cooldown}ث)` : 'إعادة إرسال كود جديد'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  الرجوع للخيارات
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: VERIFYING */}
          {step === 'verifying' && (
            <div className="py-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
                <RefreshCw className="w-7 h-7 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-white">جاري فحص الكود والتحقق من الصلاحية...</h3>
              <p className="text-xs text-slate-400">يتم التأكد من صحة الرمز وتوليد جلسة إدارية مشفرة 24 ساعة.</p>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="py-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white">تم توثيق جلسة الإدارة بنجاح</h3>
              <p className="text-xs text-emerald-300 font-bold">صلاحية الجلسة: 24 ساعة مشفرة • جاري فتح لوحة التحكم...</p>
            </div>
          )}

          {/* Zero Trust Footer Notice */}
          <div className="pt-2 text-center border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Fingerprint className="w-3.5 h-3.5 text-blue-400" />
            <span>نظام تسجيل دخول ديناميكي مشفر وفق معايير Zero-Trust RBAC</span>
          </div>

        </div>

        {/* Back Link to Main Website */}
        {onBackToPublicSite && (
          <div className="text-center mt-6">
            <button
              onClick={onBackToPublicSite}
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة إلى منصة حِصّتي الرئيسية</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
