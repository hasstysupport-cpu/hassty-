import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, RefreshCw, Send, ShieldCheck, X, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  userName?: string;
  type?: 'signup' | 'login_notice';
  onResend?: () => Promise<void>;
  onVerifyManually?: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  userName = 'المستخدم',
  type = 'signup',
  onResend,
  onVerifyManually,
}) => {
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // 4-digit or 6-digit fast verification code
  const [code, setCode] = useState(['', '', '', '']);

  const isOfficialEmail = email.toLowerCase() === 'hasstysupport@gmail.com';

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleResend = async () => {
    if (resendCooldown > 0 || isSending) return;
    setIsSending(true);
    setErrorMessage('');
    setSendSuccess(false);

    try {
      if (onResend) {
        await onResend();
      }
      setSendSuccess(true);
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMessage('تعذر إعادة الإرسال، يرجى المحاولة لاحقاً.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const newCode = [...code];
    newCode[index] = cleaned.slice(-1);
    setCode(newCode);

    if (cleaned && index < 3) {
      const next = document.getElementById(`vcode-${index + 1}`);
      next?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prev = document.getElementById(`vcode-${index - 1}`);
      prev?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs font-['IBM_Plex_Sans_Arabic',sans-serif] text-right overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 relative my-auto p-5 sm:p-6 overflow-hidden">
        
        {/* Top Accent Strip */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute left-3.5 top-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Section */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 border border-blue-100">
            <Mail className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">
                تأكيد البريد الإلكتروني
              </h3>
              {isOfficialEmail && (
                <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                  حساب الإدارة
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              أهلاً {userName}، أرسلنا رسالة تحقق وتفعيل إلى بريدك
            </p>
          </div>
        </div>

        {/* Target Email Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-mono text-xs font-bold text-slate-800 truncate" dir="ltr">
              {email}
            </span>
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
            قيد التحقق
          </span>
        </div>

        {/* Verification Options / Code */}
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="font-bold text-slate-700">كود التحقق السريع:</span>
              <span className="text-[11px] text-slate-400">4 أرقام</span>
            </div>
            <div className="flex items-center justify-center gap-2" dir="ltr">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  id={`vcode-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  placeholder="•"
                  className="w-12 h-11 text-center text-lg font-black bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#2563EB] focus:outline-none transition-all"
                />
              ))}
            </div>
          </div>

          {/* Redirect to Verification Page */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onVerifyManually) {
                onVerifyManually();
              }
            }}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>الانتقال لصفحة إدخال كود التحقق الأمني</span>
          </button>
        </div>

        {/* Notifications */}
        {sendSuccess && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>تم إرسال رسالة التفعيل إلى بريدك الوارد بنجاح!</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-800 flex items-center gap-2 mb-3">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Footer / Resend */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isSending}
            className="text-[#2563EB] hover:text-[#1D4ED8] font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>
              {resendCooldown > 0 
                ? `إعادة الإرسال بعد (${resendCooldown} ث)` 
                : 'إعادة إرسال الرابط'}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer text-xs"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
