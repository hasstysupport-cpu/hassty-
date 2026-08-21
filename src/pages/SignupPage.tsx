import React, { useState } from 'react';
import {
  QrCode,
  Users,
  ShieldCheck,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Sparkles,
  Phone,
  User,
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Send,
  ExternalLink
} from 'lucide-react';
import { AccountRole } from '../types';
import { SUBJECTS_DATA } from '../data/mockData';
import { LocationSelector } from '../components/common/LocationSelector';
import { useAuth } from '../lib/AuthContext';

interface SignupPageProps {
  initialRole?: AccountRole;
  onNavigate: (path: string) => void;
  onSignupSuccess: (role: AccountRole, email: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({
  initialRole = 'student',
  onNavigate,
  onSignupSuccess,
}) => {
  const { signupUser } = useAuth();
  const [role, setRole] = useState<AccountRole>(initialRole);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: role, 2: details & credentials, 3: success

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [area, setArea] = useState('مدينة نصر');
  
  // Student specific
  const [grade, setGrade] = useState('الصف الثالث الثانوي');
  const [parentPhone, setParentPhone] = useState('');

  // Parent specific
  const [studentJoinCode, setStudentJoinCode] = useState('');

  // Teacher specific
  const [subject, setSubject] = useState('كيمياء');
  const [experience, setExperience] = useState('5 سنوات');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleStep1Select = (selected: AccountRole) => {
    setRole(selected);
    setStep(2);
  };

  /**
   * Submit Real Firebase Email/Password & Profile Registration
   */
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !phone.trim()) {
      setErrorMessage('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await signupUser({
        email: email.trim(),
        password,
        role,
        name: name.trim(),
        phone: phone.trim(),
        governorate,
        area,
        grade: role === 'student' ? grade : undefined,
        subject: role === 'teacher' ? subject : undefined,
        experience: role === 'teacher' ? experience : undefined,
        parentPhone: role === 'student' ? parentPhone.trim() : undefined,
      });

      setIsLoading(false);
      setStep(3); // Show real success confirmation
    } catch (err: any) {
      setIsLoading(false);
      console.error('Signup error:', err);
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setErrorMessage('هذا البريد الإلكتروني مسجل به حساب بالفعل. يرجى تسجيل الدخول أو استخدام بريد آخر.');
      } else if (code === 'auth/weak-password') {
        setErrorMessage('كلمة المرور ضعيفة. يرجى كتابة 6 خانات على الأقل.');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('صيغة البريد الإلكتروني غير صالحة.');
      } else {
        setErrorMessage(err.message || 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const handleFinish = () => {
    onSignupSuccess(role, email);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] py-12 sm:px-6 lg:px-8 text-right font-['Tajawal',sans-serif]">
      
      <div className="max-w-xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2.5 mb-3 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
              <QrCode className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-2xl font-black text-[#1E3A8A] tracking-tight">
              حِصّتي
            </span>
          </button>

          <h2 className="text-2xl font-black text-[#1E3A8A]">
            إنشاء حساب جديد
          </h2>
          <p className="mt-1 text-xs text-[#6B7280]">
            انضم لمنظومة الدروس الخصوصية الأذكى في مصر مع توثيق آمن بالبريد الإلكتروني
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`w-8 h-2 rounded-full transition-all ${step >= 1 ? 'bg-[#2563EB]' : 'bg-gray-200'}`} />
            <div className={`w-8 h-2 rounded-full transition-all ${step >= 2 ? 'bg-[#2563EB]' : 'bg-gray-200'}`} />
            <div className={`w-8 h-2 rounded-full transition-all ${step >= 3 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          </div>
        </div>

        {/* Step 1: Select Role */}
        {step === 1 && (
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 animate-step-prev">
            <h3 className="text-base font-bold text-[#1E3A8A] text-center mb-4">
              الخطوة 1: حدد نوع الحساب المناسب لك
            </h3>

            {/* Student Card */}
            <button
              onClick={() => handleStep1Select('student')}
              className={`w-full p-4.5 rounded-2xl border-2 text-right transition-all flex items-start gap-4 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] ${
                role === 'student'
                  ? 'border-[#2563EB] bg-[#EFF6FF] shadow-sm'
                  : 'border-gray-200 hover:border-blue-200 bg-gray-50/50'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1E3A8A]">حساب طالب</h4>
                  <span className="text-[10px] font-bold text-[#2563EB] bg-blue-100 px-2 py-0.5 rounded-md">
                    كارنيه QR رسمي
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  احصل على بطاقة QR رقمية رسمية لتسجيل الحضور، وابحث عن أفضل المعلمين واحجز حصصك.
                </p>
              </div>
            </button>

            {/* Parent Card */}
            <button
              onClick={() => handleStep1Select('parent')}
              className={`w-full p-4.5 rounded-2xl border-2 text-right transition-all flex items-start gap-4 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] ${
                role === 'parent'
                  ? 'border-[#1E3A8A] bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-blue-200 bg-gray-50/50'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1E3A8A]">حساب ولي أمر</h4>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                    متابعة لحظية
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  تابع حضور وغياب أبنائك لحظياً، واستقبل تقارير الدروس والواجبات وسجل المدفوعات.
                </p>
              </div>
            </button>

            {/* Teacher Card */}
            <button
              onClick={() => handleStep1Select('teacher')}
              className={`w-full p-4.5 rounded-2xl border-2 text-right transition-all flex items-start gap-4 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] ${
                role === 'teacher'
                  ? 'border-[#10B981] bg-emerald-50 shadow-sm'
                  : 'border-gray-200 hover:border-emerald-200 bg-gray-50/50'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-xs">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1E3A8A]">حساب معلم</h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    إدارة ذكية
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  سجل حضور طلابك بماسح الـ QR في ثوانٍ، وأنشئ بروفايل موثق لاستقبال الحجوزات وإدارة المجموعات.
                </p>
              </div>
            </button>

            <div className="pt-2 text-center">
              <p className="text-xs text-[#6B7280]">
                لديك حساب بالفعل؟{' '}
                <button
                  onClick={() => onNavigate('/login')}
                  className="text-[#2563EB] font-bold hover:underline cursor-pointer"
                >
                  تسجيل الدخول
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Form Details */}
        {step === 2 && (
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 animate-step-next">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[11px] font-bold text-[#2563EB]">الخطوة 2: إدخال البيانات الشخصية</span>
                <h3 className="text-base font-bold text-[#1E3A8A]">
                  بيانات حساب {role === 'student' ? 'الطالب' : role === 'parent' ? 'ولي الأمر' : 'المعلم'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-[#6B7280] hover:text-[#2563EB] underline cursor-pointer"
              >
                تغيير النوع
              </button>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-800 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmitRegistration} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                  الاسم بالكامل <span className="text-[#EF4444]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمد علي"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm text-right focus:bg-white focus:outline-none focus:border-[#2563EB] transition-colors"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                    البريد الإلكتروني <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      dir="ltr"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm text-left focus:bg-white focus:outline-none focus:border-[#2563EB] transition-colors"
                    />
                    <Mail className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                    كلمة المرور (6 خانات على الأقل) <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      dir="ltr"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm text-left focus:bg-white focus:outline-none focus:border-[#2563EB] transition-colors"
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3.5 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Phone & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                    رقم الهاتف المحمول <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      placeholder="010XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB] transition-colors"
                    />
                    <Phone className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                    المحافظة والمدينة <span className="text-[#EF4444]">*</span>
                  </label>
                  <LocationSelector
                    selectedGovernorate={governorate}
                    selectedCity={area}
                    onSelectGovernorate={(gov) => setGovernorate(gov || 'القاهرة')}
                    onSelectCity={(city) => setArea(city)}
                    showCitySelect={true}
                    placeholder="اختر المحافظة والمدينة"
                  />
                </div>
              </div>

              {/* Student Specific Fields */}
              {role === 'student' && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                        السنة الدراسية <span className="text-[#EF4444]">*</span>
                      </label>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full px-3.5 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm text-right focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
                      >
                        <option value="الصف الأول الابتدائي">الصف الأول الابتدائي</option>
                        <option value="الصف الثاني الابتدائي">الصف الثاني الابتدائي</option>
                        <option value="الصف الثالث الابتدائي">الصف الثالث الابتدائي</option>
                        <option value="الصف الرابع الابتدائي">الصف الرابع الابتدائي</option>
                        <option value="الصف الخامس الابتدائي">الصف الخامس الابتدائي</option>
                        <option value="الصف السادس الابتدائي">الصف السادس الابتدائي</option>
                        <option value="الصف الأول الإعدادي">الصف الأول الإعدادي</option>
                        <option value="الصف الثاني الإعدادي">الصف الثاني الإعدادي</option>
                        <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</option>
                        <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                        <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                        <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                        رقم هاتف ولي الأمر (لإشعارات الحضور)
                      </label>
                      <input
                        type="tel"
                        dir="ltr"
                        placeholder="012XXXXXXXX"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        className="w-full px-3.5 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Parent Specific Fields */}
              {role === 'parent' && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                      كود ربط حساب الابن (اختياري)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: HASSTY-09812"
                      value={studentJoinCode}
                      onChange={(e) => setStudentJoinCode(e.target.value)}
                      className="w-full px-3.5 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB]"
                    />
                    <p className="text-[11px] text-[#6B7280] mt-1">
                      يمكنك أيضاً ربط أبنائك من خلال لوحة التحكم بعد تسجيل الدخول.
                    </p>
                  </div>
                </div>
              )}

              {/* Teacher Specific Fields */}
              {role === 'teacher' && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                        المادة الأساسية <span className="text-[#EF4444]">*</span>
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3.5 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm text-right focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
                      >
                        {SUBJECTS_DATA.map((s) => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                        سنوات الخبرة
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: 5 سنوات"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full px-3.5 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {isLoading ? (
                  <span>جاري إنشاء وتفعيل الحساب...</span>
                ) : (
                  <>
                    <span>إنشاء الحساب فوراً</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          </div>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 3 && (
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-5 animate-step-next">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#10B981] flex items-center justify-center mx-auto shadow-xs animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-[#1E3A8A]">
                مرحباً بك في حِصّتي يا {name}! 🎉
              </h3>
              <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
                تم إنشاء حسابك وتفعيله بنجاح. أرسلنا أيضاً رابط تأكيد للبريد الإلكتروني <span className="font-mono font-bold text-[#1E3A8A]">{email}</span>.
              </p>
            </div>

            {/* Teacher Telegram Support Box */}
            {role === 'teacher' && (
              <div className="p-5 bg-gradient-to-br from-[#EFF6FF] to-blue-50/60 border border-[#2563EB]/20 rounded-2xl text-right space-y-3 shadow-xs">
                <div className="flex items-center gap-2.5 text-[#1E3A8A]">
                  <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">شارة المعلم المعتمد</h4>
                    <p className="text-[11px] text-gray-500">تم تسجيل حسابك كمعلم في دليل منصة حِصّتي</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  يمكنك الآن إضافة مجموعاتك وجداول الحصص وتوليد باركود الحضور للطلاب مباشرة.
                </p>
              </div>
            )}

            <button
              onClick={handleFinish}
              className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>الدخول إلى لوحة التحكم</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

    </div>
  );
};

