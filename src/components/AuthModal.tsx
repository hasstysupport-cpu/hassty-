import React, { useState } from 'react';
import { X, GraduationCap, ShieldAlert, Presentation, CheckCircle2, User, Lock, Phone, MapPin, BookOpen, ArrowLeft } from 'lucide-react';
import { AccountRole } from '../types';
import { EGYPT_GOVERNORATES, SUBJECTS_DATA } from '../data/mockData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  initialRole?: AccountRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'register',
  initialRole = 'student',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<AccountRole>(initialRole);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    governorate: 'القاهرة',
    childCode: '', // for parent
    subject: 'الرياضيات', // for teacher
  });

  React.useEffect(() => {
    setMode(initialMode);
    if (initialRole) setRole(initialRole);
    setIsSuccess(false);
  }, [initialMode, initialRole, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      // simulate auto-close or redirect
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8 text-right">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-[#F8FAFF]">
          <div>
            <h2 className="text-xl font-bold text-[#1E3A8A]">
              {mode === 'login' ? 'تسجيل الدخول إلى حصتي' : 'إنشاء حساب جديد'}
            </h2>
            <p className="text-xs text-[#6B7280]">
              {mode === 'login' ? 'أدخل رقم هاتفك وكلمة المرور' : 'اختر نوع الحساب وأكمل بياناتك في دقيقة'}
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
                    ? 'bg-[#2563EB] text-white shadow-xs'
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
                    ? 'bg-[#2563EB] text-white shadow-xs'
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
                    ? 'bg-[#2563EB] text-white shadow-xs'
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
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#10B981] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#1E3A8A]">
                {mode === 'login' ? 'تم تسجيل الدخول بنجاح!' : 'تم إنشاء الحساب بنجاح!'}
              </h3>
              <p className="text-xs text-[#6B7280]">
                {role === 'student' && 'تم تجهيز كود الـ QR الرقمي الخاص بك للحصص.'}
                {role === 'parent' && 'تم ربط الحساب برقم هاتف وتفعيل إشعارات الواتساب.'}
                {role === 'teacher' && 'تم تفعيل حسابك ويمكنك الآن إضافة المجموعات والمواعيد.'}
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

              {/* Phone number */}
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                  رقم الهاتف (واتساب في مصر)
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
                <span className="text-[10px] text-gray-400 mt-1 block">
                  يستخدم لتأكيد الحساب وإرسال إشعارات الحضور
                </span>
              </div>

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

              {/* Role specific inputs */}
              {mode === 'register' && role === 'parent' && (
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                    كود الابن للربط (اختياري الآن)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: HST-8921"
                    value={formData.childCode}
                    onChange={(e) => setFormData({ ...formData, childCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB] font-mono"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    يمكنك ربطه لاحقاً من داخل لوحة التحكم
                  </span>
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
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB] text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
                id="btn-auth-submit"
              >
                <span>{mode === 'login' ? 'تسجيل الدخول' : 'تأكيد وإنشاء الحساب'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Toggle Mode */}
              <div className="pt-3 border-t border-gray-100 text-center">
                {mode === 'login' ? (
                  <p className="text-xs text-[#6B7280]">
                    ليس لديك حساب؟{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
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
                      onClick={() => setMode('login')}
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
    </div>
  );
};
