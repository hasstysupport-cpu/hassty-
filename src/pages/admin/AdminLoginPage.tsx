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
  RefreshCw
} from 'lucide-react';
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
  const [step, setStep] = useState<'request' | 'verifying' | 'success'>('request');
  const [targetEmail, setTargetEmail] = useState(OFFICIAL_ADMIN_EMAIL);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [magicTokenInput, setMagicTokenInput] = useState(initialToken || '');
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // If page was opened with an authKey in query parameter, auto-verify immediately
  useEffect(() => {
    if (initialToken && initialToken.trim().length > 0) {
      setStep('verifying');
      handleVerifyToken(initialToken.trim());
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

  // Step 1: Request a secure magic link dispatched to the official email
  const handleRequestMagicLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cooldown > 0 || isSending) return;

    setIsSending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await requestAdminMagicLink(OFFICIAL_ADMIN_EMAIL);

      if (res.success) {
        setSuccessMessage('تم إرسال رابط الدخول السري المشفر بنجاح إلى البريد الإداري الرسمي (hasstysupport@gmail.com). يرجى فتح بريدك والضغط على الرابط أو إدخال رمز التحقق المستلم.');
        setCooldown(60);
      } else {
        setErrorMessage(res.error || 'تعذر إرسال الرابط. يرجى التأكد من البريد الإداري الرسمي.');
      }
    } catch {
      setErrorMessage('حدث خطأ أثناء الاتصال بالخادم الآمن.');
    } finally {
      setIsSending(false);
    }
  };

  // Step 2: Verify the 1-hour single-use magic token and grant a 24-hour admin session
  const handleVerifyToken = async (tokenToVerify?: string) => {
    const targetToken = (tokenToVerify || magicTokenInput).trim();
    if (!targetToken) {
      setErrorMessage('يرجى إدخال كود أو رابط التحقق السري');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const res = await verifyAdminMagicToken(targetToken);

      if (res.valid) {
        setStep('success');
        setSuccessMessage('تم التحقق بنجاح! تم فتح جلسة إدارية آمنة لمدة 24 ساعة.');
        
        setTimeout(() => {
          onLoginSuccess(OFFICIAL_ADMIN_EMAIL);
        }, 1200);
      } else {
        setStep('request');
        setErrorMessage(res.error || 'رمز التحقق غير صالح أو منتهي الصلاحية (صلاحية الروابط ساعة واحدة فقط).');
      }
    } catch {
      setStep('request');
      setErrorMessage('فشل التحقق من الرابط الإداري.');
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
              Admin Zero-Trust Vault
            </span>
          </div>

          <p className="text-xs text-slate-400 font-mono tracking-wide">
            بوابة الإدارة المركزية السرية • مسار محمي ومشفّر
          </p>
        </div>

        {/* Security Rule Indicators */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          <div className="bg-slate-900/90 border border-blue-900/60 p-3 rounded-2xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-[11px] leading-tight">
              <span className="text-slate-400 block text-[10px]">صلاحية رابط البريد:</span>
              <strong className="text-amber-400 font-bold">ساعة واحدة فقط (60 د)</strong>
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

          {/* STEP A: REQUEST MAGIC LINK */}
          {step === 'request' && (
            <div className="space-y-6">
              
              <div className="space-y-2 text-right">
                <label className="block text-xs font-bold text-slate-200">
                  البريد الإلكتروني الإداري الرسمي المعتمد
                </label>
                <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-300" dir="ltr">
                    {OFFICIAL_ADMIN_EMAIL}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    البريد المعتمد
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  لحماية المنصة، يتم إنشاء رابط دخول مؤقت بتشفير سري عالي الحماية وإرساله إلى البريد الرسمي فقط مع انتهاء صلاحيته بعد 60 دقيقة.
                </p>
              </div>

              {/* Request Link Action Button */}
              <button
                type="button"
                onClick={() => handleRequestMagicLink()}
                disabled={isSending || cooldown > 0}
                className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري توليد الرابط السري وإرساله...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {cooldown > 0 
                        ? `إعادة إرسال الرابط (${cooldown} ثانية)` 
                        : 'إرسال رابط الدخول السري إلى البريد الإداري'}
                    </span>
                  </>
                )}
              </button>

              {/* Manual Token Verification Fallback */}
              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <label className="block text-[11px] font-bold text-slate-300">
                  أو أدخل رمز التحقق السري (authKey) يدوياً:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={magicTokenInput}
                    onChange={(e) => setMagicTokenInput(e.target.value)}
                    placeholder="أدخل رمز التوكن السري المستلم..."
                    className="flex-1 text-left font-mono text-xs px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyToken()}
                    disabled={isVerifying || !magicTokenInput.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    تحقق
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* STEP B: VERIFYING */}
          {step === 'verifying' && (
            <div className="py-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
                <RefreshCw className="w-7 h-7 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-white">جاري فك تشفير التوكن والتحقق من الصلاحية...</h3>
              <p className="text-xs text-slate-400">يتم التأكد من عدم استخدام الرابط مسبقاً وتوليد جلسة 24 ساعة.</p>
            </div>
          )}

          {/* STEP C: SUCCESS */}
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
