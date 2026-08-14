import React, { useState } from 'react';
import {
  QrCode,
  Phone,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Users,
  KeyRound
} from 'lucide-react';
import { AccountRole } from '../types';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: (role: AccountRole, phone: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
}) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('01098765432');
  const [otp, setOtp] = useState(['4', '8', '2', '1']);
  const [selectedRole, setSelectedRole] = useState<AccountRole>('student');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 600);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(selectedRole, phone);
    }, 600);
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
          الدخول السريع عبر رقم الهاتف وكود التحقق الفوري (SMS / واتساب)
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white border border-[#E5E7EB] py-8 px-6 sm:px-8 rounded-3xl shadow-xs space-y-6">
          
          {/* Quick Role Selector for Demo Experience */}
          <div>
            <label className="block text-xs font-bold text-[#6B7280] mb-2">
              الدخول كـ:
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
                طالب (زياد)
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
                مدرس (أ. حسام)
              </button>
            </div>
          </div>

          {step === 'phone' ? (
            /* STEP 1: Phone Input Form */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                  رقم الهاتف المحمول
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
                <p className="text-[11px] text-[#6B7280] mt-1">
                  سيصلك رمز تحقق سري في رسالة نصية أو عبر تطبيق واتساب.
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
                  <span>جاري الإرسال...</span>
                ) : (
                  <>
                    <span>إرسال كود التحقق</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP Verification Form */
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-[#EFF6FF] border border-blue-200 rounded-2xl text-center space-y-1">
                <span className="text-xs font-bold text-[#2563EB]">تم إرسال كود التحقق إلى:</span>
                <p className="text-xs font-mono font-bold text-[#1E3A8A]" dir="ltr">{phone}</p>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-[11px] text-[#2563EB] underline"
                >
                  تعديل الرقم
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-2 text-center">
                  أدخل رمز التحقق المكون من 4 أرقام
                </label>
                <div className="flex justify-center gap-2.5" dir="ltr">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const newOtp = [...otp];
                        newOtp[idx] = e.target.value;
                        setOtp(newOtp);
                      }}
                      className="w-12 h-13 text-center font-mono font-black text-xl bg-gray-50 border-2 border-blue-200 rounded-xl focus:border-[#2563EB] focus:bg-white focus:outline-none"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>جاري التحقق والدخول...</span>
                ) : (
                  <>
                    <span>تأكيد والدخول للوحة التحكم</span>
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
