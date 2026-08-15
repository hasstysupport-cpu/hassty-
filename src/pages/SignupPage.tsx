import React, { useState } from 'react';
import {
  QrCode,
  Users,
  ShieldCheck,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  UploadCloud,
  MapPin,
  Sparkles,
  Phone,
  User,
  GraduationCap
} from 'lucide-react';
import { AccountRole } from '../types';
import { EGYPT_GOVERNORATES, SUBJECTS_DATA } from '../data/mockData';
import { Badge } from '../components/common/Badge';
import { LocationSelector } from '../components/common/LocationSelector';

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
  const [role, setRole] = useState<AccountRole>(initialRole);
  const [step, setStep] = useState<1 | 2 | 3>(1);

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
  const [idCardUploaded, setIdCardUploaded] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleStep1Select = (selected: AccountRole) => {
    setRole(selected);
    setStep(2);
  };

  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
    }, 600);
  };

  const handleFinish = () => {
    onSignupSuccess(role, name || (role === 'student' ? 'زياد أحمد' : role === 'teacher' ? 'أ. حسام إبراهيم' : 'ولي الأمر'));
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
            اختر نوع حسابك وانضم لمنظومة الدروس الخصوصية الأذكى في مصر
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`w-8 h-2 rounded-full ${step >= 1 ? 'bg-[#2563EB]' : 'bg-gray-200'}`} />
            <div className={`w-8 h-2 rounded-full ${step >= 2 ? 'bg-[#2563EB]' : 'bg-gray-200'}`} />
            <div className={`w-8 h-2 rounded-full ${step >= 3 ? 'bg-[#2563EB]' : 'bg-gray-200'}`} />
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

        {/* Step 2: Role Form */}
        {step === 2 && (
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 animate-step-next">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[11px] font-bold text-[#2563EB]">الخطوة 2 من 3</span>
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
                    رقم الهاتف المحمول <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01012345678"
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

                  {/* ID Card upload simulation */}
                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                      صورة بطاقة الرقم القومي (للتوثيق واعتماد الشارة الزرقاء)
                    </label>
                    <div
                      onClick={() => setIdCardUploaded(!idCardUploaded)}
                      className={`p-4 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-colors ${
                        idCardUploaded
                          ? 'border-[#10B981] bg-emerald-50'
                          : 'border-gray-300 hover:border-blue-300 bg-gray-50'
                      }`}
                    >
                      {idCardUploaded ? (
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#10B981]">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>تم رفع صورة البطاقة بنجاح (national-id.jpg)</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <UploadCloud className="w-6 h-6 text-gray-400 mx-auto" />
                          <p className="text-xs font-bold text-[#1E3A8A]">اضغط لرفع صورة وجه وظهر البطاقة</p>
                          <span className="text-[10px] text-gray-400">JPG أو PNG بحد أقصى 5 ميجابايت</span>
                        </div>
                      )}
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
                  <span>جاري إنشاء الحساب...</span>
                ) : (
                  <>
                    <span>متابعة وإنشاء الحساب</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          </div>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 3 && (
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 shadow-xs text-center space-y-5 animate-step-next">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#10B981] flex items-center justify-center mx-auto shadow-xs animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-[#1E3A8A]">
                مرحباً بك في حصتي يا {name || 'بطل'}! 🎉
              </h3>
              <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
                تم إنشاء حسابك بنجاح وتفعيل كود الـ QR الخاص بك. يمكنك الآن الدخول ومباشرة استخدام كافة الميزات.
              </p>
            </div>

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
