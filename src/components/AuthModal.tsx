import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  GraduationCap,
  ShieldAlert,
  Presentation,
  CheckCircle2,
  User,
  Lock,
  Phone,
  MapPin,
  BookOpen,
  ArrowLeft,
  Mail,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { AccountRole } from '../types';
import { EGYPT_GOVERNORATES, SUBJECTS_DATA } from '../data/mockData';
import { useAuth } from '../lib/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  initialRole?: AccountRole;
  onSuccess?: (role: AccountRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'register',
  initialRole = 'student',
  onSuccess,
}) => {
  const { loginUser, signupUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<AccountRole>(initialRole);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    governorate: 'القاهرة',
    childCode: '', // for parent
    subject: 'الرياضيات', // for teacher
  });

  useEffect(() => {
    setMode(initialMode);
    if (initialRole) setRole(initialRole);
    setIsSuccess(false);
    setErrorMessage('');
    setIsLoading(false);
  }, [initialMode, initialRole, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const session = await loginUser(formData.email, formData.password);
        setIsLoading(false);
        setIsSuccess(true);
        if (onSuccess) onSuccess(session.role);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const session = await signupUser({
          email: formData.email,
          password: formData.password,
          role,
          name: formData.fullName,
          phone: formData.phone,
          governorate: formData.governorate,
          subject: role === 'teacher' ? formData.subject : undefined,
        });
        setIsLoading(false);
        setIsSuccess(true);
        if (onSuccess) onSuccess(session.role);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setIsLoading(false);
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setErrorMessage('هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.');
      } else if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setErrorMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (code === 'auth/weak-password') {
        setErrorMessage('كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام.');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('صيغة البريد الإلكتروني غير صالحة.');
      } else {
        setErrorMessage(err.message || 'حدث خطأ. يرجى التأكد من البيانات والمحاولة مجدداً.');
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm overflow-y-auto">
      <div className="card-lux dialog-lux bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-8 text-right">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-l from-[#EFF6FF] via-white to-[#F5F3FF]">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {mode === 'login' ? 'تسجيل الدخول إلى حصتي' : 'إنشاء حساب جديد'}
            </h2>
            <p className="text-xs text-[#6B7280] font-semibold">
              {mode === 'login' ? 'أدخل بريدك الإلكتروني وكلمة المرور' : 'اختر نوع الحساب وأكمل بياناتك للبدء'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
            aria-label="إغلاق"
            id="btn-close-auth-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Role Selector Tabs (Only in Register mode or when changing) */}
        {mode === 'register' && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-2">
              
              {/* Student tab */}
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  role === 'student'
                    ? 'chip-grad'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
                id="tab-role-student"
              >
                <GraduationCap className="w-4 h-4" />
                <span>طالب</span>
              </button>

              {/* Parent tab */}
              <button
                type="button"
                onClick={() => setRole('parent')}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  role === 'parent'
                    ? 'chip-grad'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
                id="tab-role-parent"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>ولي أمر</span>
              </button>

              {/* Teacher tab */}
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  role === 'teacher'
                    ? 'chip-grad'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
                id="tab-role-teacher"
              >
                <Presentation className="w-4 h-4" />
                <span>مدرس</span>
              </button>

            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#10B981] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#1E3A8A]">
                {mode === 'login' ? 'تم تسجيل الدخول بنجاح!' : 'تم إنشاء الحساب وإرسال رابط التحقق!'}
              </h3>
              <p className="text-xs text-[#6B7280]">
                {role === 'student' && 'تم تجهيز كود الـ QR الرقمي الخاص بك للحصص.'}
                {role === 'parent' && 'تم تفعيل حساب ولي الأمر بنجاح.'}
                {role === 'teacher' && 'تم تفعيل حسابك كمعلم في منصة حِصّتي.'}
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer"
              >
                الانتقال للرئيسية
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name (Register only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                    الاسم بالكامل
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder={
                        role === 'student'
                          ? 'اسم الطالب ثلاثي'
                          : role === 'parent'
                          ? 'اسم ولي الأمر'
                          : 'اسم الأستاذ / المعلم'
                      }
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB] text-left font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Phone number (Register only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                    رقم الهاتف المحمول
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      placeholder="01012345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB] text-left font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              {/* Governorate (Register only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                    المحافظة
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                    <select
                      value={formData.governorate}
                      onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                      className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
                    >
                      {EGYPT_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {mode === 'register' && role === 'teacher' && (
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                    المادة الأساسية
                  </label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
                    >
                      {SUBJECTS_DATA.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pr-9 pl-10 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB] text-left"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="auth-btn w-full py-3 disabled:opacity-50 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer mt-2"
                id="btn-auth-submit"
              >
                <span>
                  {isLoading
                    ? 'جاري التحقق والتنفيذ...'
                    : mode === 'login'
                    ? 'تسجيل الدخول'
                    : 'تأكيد وإنشاء الحساب'}
                </span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Toggle Mode */}
              <div className="pt-3 border-t border-gray-100 text-center">
                {mode === 'login' ? (
                  <p className="text-xs text-[#6B7280]">
                    ليس لديك حساب؟{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMessage('');
                      }}
                      className="font-bold text-[#2563EB] hover:underline cursor-pointer"
                    >
                      أنشئ حساباً جديداً
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-[#6B7280]">
                    لديك حساب بالفعل؟{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage('');
                      }}
                      className="font-bold text-[#2563EB] hover:underline cursor-pointer"
                    >
                      تسجيل الدخول
                    </button>
                  </p>
                )}
              </div>

            </form>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};
