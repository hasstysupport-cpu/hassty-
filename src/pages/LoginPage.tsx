import React, { useState } from 'react';
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
} from 'lucide-react';
import { AccountRole } from '../types';
import { useAuth } from '../lib/AuthContext';
import { sendServerVerificationOtp } from '../lib/securityService';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: (role: AccountRole, email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
}) => {
  const { loginUser, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Forgot Password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [resetErrorMessage, setResetErrorMessage] = useState('');

  /**
   * Handle Real Firebase Email/Password Login
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const session = await loginUser(email, password);
      setIsLoading(false);

      // Check email verification status: If unverified, mandatory redirect to dedicated /verify-email page
      if (!session.emailVerified && session.role !== 'admin') {
        // Trigger server-side OTP dispatch for email & WhatsApp
        try {
          await sendServerVerificationOtp({
            email: session.email,
            uid: session.uid,
            name: session.name,
            role: session.role,
            phone: session.phone,
            purpose: 'login',
          });
        } catch (e) {
          console.warn('Initial OTP dispatch on login warning:', e);
        }
        
        onNavigate('/verify-email');
      } else {
        onLoginSuccess(session.role, session.email);
      }
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

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-right font-['Tajawal',sans-serif]">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
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
          تسجيل الدخول إلى حسابك
        </h2>
        <p className="mt-1 text-xs text-[#6B7280]">
          أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى لوحة التحكم
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white border border-[#E5E7EB] py-8 px-6 sm:px-8 rounded-3xl shadow-xs space-y-6">
          
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-800 flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
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

            {/* Remember Me / Session Persistence */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-[#4B5563] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#2563EB] rounded-md border-gray-300 focus:ring-0 cursor-pointer"
                />
                <span className="font-semibold text-gray-700">حفظ الجلسة والبقاء متصلاً</span>
              </label>

              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                اتصال مشفر وآمن
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>جاري التحقق وتسجيل الدخول...</span>
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

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
