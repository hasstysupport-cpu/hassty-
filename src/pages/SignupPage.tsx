import React, { useState, useEffect } from 'react';
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
  MessageCircle,
  AlertCircle,
  Send,
  ExternalLink
} from 'lucide-react';
import { AccountRole } from '../types';
import { EGYPT_GOVERNORATES, SUBJECTS_DATA } from '../data/mockData';
import { Badge } from '../components/common/Badge';
import { LocationSelector } from '../components/common/LocationSelector';
import { whatsappService } from '../lib/whatsappService';
import { useAuth } from '../lib/AuthContext';

interface SignupPageProps {
  initialRole?: AccountRole;
  onNavigate: (path: string) => void;
  onSignupSuccess: (role: AccountRole, name: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({
  initialRole = 'student',
  onNavigate,
  onSignupSuccess,
}) => {
  const { signupUser, checkPhoneExists } = useAuth();
  const [role, setRole] = useState<AccountRole>(initialRole);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: role, 2: details, 3: whatsapp otp, 4: success

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [area, setArea] = useState('مدينة نصر');
  
  // Student specific
  const [grade, setGrade] = useState('الثالث الثانوي');
  const [parentPhone, setParentPhone] = useState('');

  // Parent specific
  const [studentJoinCode, setStudentJoinCode] = useState('');

  // Teacher specific
  const [subject, setSubject] = useState('كيمياء');
  const [experience, setExperience] = useState('8 سنوات');

  // WhatsApp OTP Verification State
  const [requestId, setRequestId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const handleStep1Select = (selected: AccountRole) => {
    setRole(selected);
    setStep(2);
  };

  /**
   * Submit registration details and send real WhatsApp OTP
   */
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      // 1. Verify if phone is already registered in Firestore database
      const { exists } = await checkPhoneExists(phone);
      if (exists) {
        setIsLoading(false);
        setErrorMessage(`عذراً، رقم الهاتف (${phone}) مسجل بالفعل في منصة حصتي. يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد.`);
        return;
      }

      // 2. Request OTP via WhatsApp
      const res = await whatsappService.requestOtp(phone, 'signup');
      setIsLoading(false);

      if (res.success && res.requestId) {
        setRequestId(res.requestId);
        setStep(3); // Go to OTP verification step
        setTimerSeconds(60);
      } else {
        setErrorMessage(res.error || 'تعذر إرسال رمز التحقق لرقم الواتساب');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage('حدث خطأ أثناء إرسال كود الواتساب، يرجى المحاولة مرة أخرى');
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
        await signupUser({
          phone,
          role,
          name: name.trim(),
          governorate,
          area,
          grade: role === 'student' ? grade : undefined,
          subject: role === 'teacher' ? subject : undefined,
          experience: role === 'teacher' ? experience : undefined,
          parentPhone: role === 'student' ? parentPhone : undefined,
        });

        // Send a welcome message via WhatsApp
        whatsappService.sendMessage(
          phone,
          `*مرحباً بك في منصة حِصّتي* 🎉\n\nأهلاً بك يا *${name}*! تم تفعيل حسابك بنجاح كـ (${role === 'student' ? 'طالب' : role === 'teacher' ? 'مدرس' : 'ولي أمر'}).\n\nنتمنى لك تجربة تعليمية استثنائية! 🚀`
        );
        setStep(4); // Success step
      } else {
        setErrorMessage(res.error || 'كود التحقق غير صحيح أو انتهت صلاحيته');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage('فشل التحقق من الكود، يرجى المحاولة مرة أخرى');
    }
  };

  const handleResendOtp = async () => {
    if (timerSeconds > 0) return;
    setIsLoading(true);
    setErrorMessage('');
    const res = await whatsappService.requestOtp(phone, 'signup');
    setIsLoading(false);
    if (res.success && res.requestId) {
      setRequestId(res.requestId);
      setTimerSeconds(60);
    }
  };

  const handleFinish = () => {
    onSignupSuccess(role, name);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] py-12 sm:px-6 lg:px-8 text-right">
      
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
            انضم لمنظومة الدروس الخصوصية الأذكى في مصر مع توثيق فوري عبر WhatsApp
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`w-7 h-2 rounded-full ${step >= 1 ? 'bg-[#2563EB]' : 'bg-gray-200'}`} />
            <div className={`w-7 h-2 rounded-full ${step >= 2 ? 'bg-[#2563EB]' : 'bg-gray-200'}`} />
            <div className={`w-7 h-2 rounded-full ${step >= 3 ? 'bg-[#2563EB]' : 'bg-gray-200'}`} />
            <div className={`w-7 h-2 rounded-full ${step >= 4 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
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
                    كارنيه QR مجاني
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  احصل على كارنيه QR رقمي لحضور الحصص، وابحث عن أفضل المعلمين واحجز في مجموعاتهم.
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
                    إشعارات واتساب
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  تابع حضور وغياب أبنائك لحظياً، واستقبل رسائل فورية وسجل المدفوعات لكل مدرس.
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
                  <h4 className="text-sm font-bold text-[#1E3A8A]">حساب مدرس</h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    بدون اشتراك شهري
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  سجل حضور طلابك بماسح الـ QR في ثوانٍ، وأنشئ بروفايل موثق لاستقبال الحجوزات.
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

        {/* Step 2: Role Form Details */}
        {step === 2 && (
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 animate-step-next">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[11px] font-bold text-[#2563EB]">الخطوة 2: إدخال البيانات</span>
                <h3 className="text-base font-bold text-[#1E3A8A]">
                  بيانات حساب {role === 'student' ? 'الطالب' : role === 'parent' ? 'ولي الأمر' : 'المعلم'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-[#6B7280] hover:text-[#2563EB] underline"
              >
                تغيير النوع
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRegistration} className="space-y-4">
              
              {/* Common Fields: Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                    الاسم بالكامل <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: زياد أحمد محمود"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                    رقم هاتف الواتساب <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="010XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Common: Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                    العنوان / تفاصيل الشارع
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: شارع عباس العقاد بجوار مسجد..."
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
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
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
                      >
                        <option value="الأول الثانوي">الصف الأول الثانوي</option>
                        <option value="الثاني الثانوي">الصف الثاني الثانوي</option>
                        <option value="الثالث الثانوي">الصف الثالث الثانوي</option>
                        <option value="الثالث الإعدادي">الصف الثالث الإعدادي</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                        رقم هاتف ولي الأمر (لاستقبال الإشعارات)
                      </label>
                      <input
                        type="tel"
                        placeholder="012XXXXXXXX"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
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
                      كود ربط حساب الابن (إن وجد)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: HST-2026-09812"
                      value={studentJoinCode}
                      onChange={(e) => setStudentJoinCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB]"
                    />
                    <p className="text-[11px] text-[#6B7280] mt-1">
                      يمكنك أيضاً إضافة أبنائك لاحقاً من داخل لوحة التحكم بعد الدخول.
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
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
                      >
                        {SUBJECTS_DATA.map((s) => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                        سنوات الخبرة في التدريس
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: 8 سنوات"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>جاري إرسال كود التحقق...</span>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    <span>متابعة وتأكيد رقم WhatsApp</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          </div>
        )}

        {/* Step 3: WhatsApp OTP Verification */}
        {step === 3 && (
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 animate-fadeIn">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#1E3A8A]">تأكيد رقم الهاتف عبر WhatsApp</h3>
              <p className="text-xs text-gray-500">
                أرسلنا كود تحقق سري إلى حساب واتساب للرقم <strong className="text-[#1E3A8A] font-mono" dir="ltr">{phone}</strong>
              </p>
              <p className="text-[11px] text-[#6B7280]">
                افتح تطبيق WhatsApp الخاص بهذا الرقم وقم بإدخال الكود المكون من 4 أرقام أدناه.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-2 text-center">
                  أدخل رمز التحقق (OTP)
                </label>
                <div className="flex justify-center gap-2.5" dir="ltr">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`signup-otp-${idx}`}
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
                          const nextInput = document.getElementById(`signup-otp-${idx + 1}`);
                          nextInput?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                          const prevInput = document.getElementById(`signup-otp-${idx - 1}`);
                          prevInput?.focus();
                        }
                      }}
                      className="w-12 h-14 text-center font-mono font-black text-2xl bg-gray-50 border-2 border-blue-200 rounded-xl focus:border-[#2563EB] focus:bg-white focus:outline-none transition-colors"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>لم يصلك الكود؟</span>
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
                  <span>جاري التحقق وتفعيل الحساب...</span>
                ) : (
                  <>
                    <span>تأكيد الحساب ومتابعة</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Success Confirmation */}
        {step === 4 && (
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-5 animate-step-next">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#10B981] flex items-center justify-center mx-auto shadow-xs animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-[#1E3A8A]">
                مرحباً بك في حصتي يا {name || 'أستاذ'}! 🎉
              </h3>
              <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
                {role === 'teacher'
                  ? 'تم إنشاء حساب المعلم بنجاح! لتوثيق الحساب وإظهاره للطلاب وأولياء الأمور في نتائج البحث:'
                  : 'تم تفعيل حسابك بنجاح عبر WhatsApp وإنشاء كود الـ QR الرقمي الخاص بك.'}
              </p>
            </div>

            {/* Teacher Telegram Verification Requirement Box */}
            {role === 'teacher' && (
              <div className="p-5 bg-gradient-to-br from-[#EFF6FF] to-blue-50/60 border-2 border-[#2563EB]/30 rounded-2xl text-right space-y-3.5 shadow-sm">
                <div className="flex items-center gap-2.5 text-[#1E3A8A]">
                  <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black">خطوة التوثيق وتفعيل الحساب</h4>
                    <p className="text-[11px] text-gray-500 font-medium">مطلوب لاعتماد الشارة الزرقاء والظهور في البحث</p>
                  </div>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed">
                  لكي يظهر حسابك للطلاب وأولياء الأمور كمعلم موثوق ومفعل، يرجى التواصل مع فريق الدعم المباشر عبر تليجرام لإتمام اعتماد ملفك التدريسي:
                </p>

                <a
                  href="https://t.me/MCV_M"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-[#229ED9] hover:bg-[#1E88E5] text-white font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-blue-400/30 flex items-center justify-center gap-2.5 active:scale-98"
                >
                  <Send className="w-4 h-4" />
                  <span>تواصل مع الدعم عبر Telegram (t.me/MCV_M)</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <div className="text-[10px] text-center text-gray-500 flex items-center justify-center gap-1">
                  <span>يتم الرد والاعتماد السريع على مدار 24 ساعة ⚡</span>
                </div>
              </div>
            )}

            {role === 'student' && (
              <div className="p-4 bg-[#F8FAFF] border border-blue-200 rounded-2xl max-w-xs mx-auto text-center space-y-2">
                <div className="w-20 h-20 bg-white border border-gray-200 rounded-xl mx-auto flex items-center justify-center shadow-xs">
                  <QrCode className="w-14 h-14 text-[#2563EB]" />
                </div>
                <div className="text-xs font-bold text-[#1E3A8A]">كود بطاقتك الشخصية</div>
                <div className="font-mono font-bold text-sm text-[#2563EB]">HST-2026-09812</div>
              </div>
            )}

            <button
              onClick={handleFinish}
              className="btn-primary-shine w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
