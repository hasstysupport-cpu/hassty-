import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Phone,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Users,
  KeyRound,
  MessageCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { AccountRole } from '../types';
import { whatsappService } from '../lib/whatsappService';
import { useAuth } from '../lib/AuthContext';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: (role: AccountRole, phone: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
}) => {
  const { loginUser, checkPhoneExists } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [selectedRole, setSelectedRole] = useState<AccountRole>('student');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // WhatsApp OTP State
  const [requestId, setRequestId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successInfo, setSuccessInfo] = useState<string>('');
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isGatewayConnected, setIsGatewayConnected] = useState<boolean | null>(null);

  // Check WhatsApp gateway status on mount
  useEffect(() => {
    whatsappService.checkStatus().then((res) => {
      setIsGatewayConnected(res.connected);
    });
  }, []);

  // Timer countdown for resend OTP
  useEffect(() => {
    let interval: any = null;
    if (timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerSeconds]);

  /**
   * Send WhatsApp OTP via Backend
   */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsLoading(true);
    setErrorMessage('');
    setSuccessInfo('');

    try {
      // 1. Check if phone exists (or allow dev bypass if needed)
      const { exists } = await checkPhoneExists(phone);
      if (!exists) {
        // Auto-create or allow simulated login
        console.info('Phone not pre-registered, enabling instant demo session');
      }

      // 2. Send Simulated WhatsApp OTP
      const res = await whatsappService.requestOtp(phone, 'login');
      setIsLoading(false);

      if (res.success && res.requestId) {
        setRequestId(res.requestId);
        setStep('otp');
        setTimerSeconds(60);
        setSuccessInfo(`تم توليد كود التحقق بنظام المحاكاة للرقم (${res.formattedNumber})`);
      } else {
        setErrorMessage(res.error || 'تعذر إرسال رمز التحقق، يرجى التأكد من الرقم');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage('حدث خطأ، يمكنك استخدام الدخول التجريبي المباشر أدناه');
    }
  };

  /**
   * Verify WhatsApp OTP
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== 4) {
      setErrorMessage('يرجى إدخال الـ 4 أرقام الخاصة بكود التحقق');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await whatsappService.verifyOtp(requestId, fullCode);
      setIsLoading(false);

      if (res.success && res.verified) {
        await loginUser(phone, selectedRole);
        onLoginSuccess(selectedRole, phone);
      } else {
        setErrorMessage(res.error || 'كود التحقق غير صحيح أو انتهت صلاحيته');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage('فشل التحقق من الكود، يرجى المحاولة مرة أخرى');
    }
  };

  /**
   * Quick Resend OTP
   */
  const handleResendOtp = async () => {
    if (timerSeconds > 0) return;
    setIsLoading(true);
    setErrorMessage('');
    const res = await whatsappService.requestOtp(phone, 'login');
    setIsLoading(false);
    if (res.success && res.requestId) {
      setRequestId(res.requestId);
      setTimerSeconds(60);
      setSuccessInfo('تمت إعادة إرسال كود جديد عبر واتساب');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-right">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo */}
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2.5 mb-4 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <QrCode className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-3xl font-black text-[#1E3A8A] tracking-tight font-['Tajawal',sans-serif]">
            حِصّتي
          </span>
        </button>

        <h2 className="text-2xl font-black text-[#1E3A8A]">
          تسجيل الدخول إلى حسابك
        </h2>
        <p className="mt-1 text-xs text-[#6B7280]">
          الدخول السريع والآمن برقم الهاتف وكود التحقق التجريبي المباشر (1234)
        </p>

        {/* Quick Demo Mode Badge */}
        <div className="mt-3 flex items-center justify-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <KeyRound className="w-3.5 h-3.5 text-blue-600" />
            <span>نظام تسجيل الدخول المباشر مفعّل (كود التحقق التلقائي: 1234)</span>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white border border-[#E5E7EB] py-8 px-6 sm:px-8 rounded-3xl shadow-xs space-y-6">
          
          {/* Quick Role Selector */}
          <div>
            <label className="block text-xs font-bold text-[#6B7280] mb-2">
              نوع الحساب:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedRole === 'student'
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                طالب
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('parent')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedRole === 'parent'
                    ? 'bg-[#EFF6FF] border-[#1E3A8A] text-[#1E3A8A]'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                ولي أمر
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('teacher')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedRole === 'teacher'
                    ? 'bg-emerald-50 border-[#10B981] text-[#10B981]'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                مدرس
              </button>
            </div>
          </div>

          {/* Error & Info Alerts */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'phone' ? (
            /* STEP 1: Phone Input Form */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                  رقم الهاتف المحمول (المرتبط بواتساب)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="010XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                </div>
                <p className="text-[11px] text-[#6B7280] mt-1.5 flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>سيصلك رمز تحقق سري من 4 أرقام عبر تطبيق WhatsApp فوراً.</span>
                </p>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-[#4B5563] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#2563EB] rounded-md border-gray-300 focus:ring-0"
                  />
                  <span>تذكر هذا الجهاز</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>جاري إرسال كود الواتساب...</span>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    <span>إرسال رمز التحقق عبر WhatsApp</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: WhatsApp OTP Verification Form */
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fadeIn">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>تم إرسال كود التحقق السري إلى حساب واتساب:</span>
                </div>
                <p className="text-sm font-mono font-black text-[#1E3A8A]" dir="ltr">{phone}</p>
                <p className="text-[11px] text-[#6B7280]">
                  افتح تطبيق WhatsApp الخاص بهذا الرقم وقم بإدخال الكود المكون من 4 أرقام أدناه.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp(['', '', '', '']);
                    setErrorMessage('');
                  }}
                  className="text-[11px] text-[#2563EB] hover:underline block mx-auto mt-2 cursor-pointer font-bold"
                >
                  تعديل رقم الهاتف
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#1F2937]">
                    أدخل رمز التحقق (OTP)
                  </label>
                  <button
                    type="button"
                    onClick={() => setOtp(['1', '2', '3', '4'])}
                    className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors font-black cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>ملء كود الاختبار (1234)</span>
                  </button>
                </div>
                <div className="flex justify-center gap-2.5" dir="ltr">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const newOtp = [...otp];
                        newOtp[idx] = val;
                        setOtp(newOtp);
                        if (val && idx < 3) {
                          const nextInput = document.getElementById(`otp-${idx + 1}`);
                          nextInput?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                          const prevInput = document.getElementById(`otp-${idx - 1}`);
                          prevInput?.focus();
                        }
                      }}
                      className="w-12 h-14 text-center font-mono font-black text-2xl bg-gray-50 border-2 border-blue-200 rounded-xl focus:border-[#2563EB] focus:bg-white focus:outline-none transition-colors"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>لم يصلك الكود على واتساب؟</span>
                <button
                  type="button"
                  disabled={timerSeconds > 0 || isLoading}
                  onClick={handleResendOtp}
                  className="font-bold text-[#2563EB] hover:underline disabled:text-gray-400 cursor-pointer"
                >
                  {timerSeconds > 0 ? `إعادة الإرسال بعد (${timerSeconds}ث)` : 'إعادة إرسال الكود'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 4}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>جاري التحقق والربط...</span>
                ) : (
                  <>
                    <span>تأكيد الكود والدخول</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
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

    </div>
  );
};
