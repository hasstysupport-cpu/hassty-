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
  ExternalLink,
  Camera,
  UploadCloud,
  X as CloseIcon,
  Trash2
} from 'lucide-react';
import { AccountRole } from '../types';
import { SUBJECTS_DATA } from '../data/mockData';
import { LocationSelector } from '../components/common/LocationSelector';
import { useAuth } from '../lib/AuthContext';
import { getCleanAvatarUrl, optimizeProfileImage } from '../lib/avatarHelper';
import { findStudentByCodeOrPhone } from '../lib/parentStudentService';

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
  const { signupUser, sendEmailVerificationLink, markEmailAsVerified } = useAuth();
  const [role, setRole] = useState<AccountRole>(initialRole);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: role, 2: details & credentials, 3: success
  const [registeredUid, setRegisteredUid] = useState<string>('');

  // Email verification state for Step 3
  const [isAccountVerified, setIsAccountVerified] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [linkSentSuccess, setLinkSentSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [activationCode, setActivationCode] = useState(['', '', '', '']);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  React.useEffect(() => {
    let timer: any;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleResendActivationLink = async () => {
    if (resendTimer > 0 || isSendingLink) return;
    setIsSendingLink(true);
    try {
      await sendEmailVerificationLink(email.trim());
      setLinkSentSuccess(true);
      setResendTimer(60);
    } catch (e) {
      console.warn('Resend error:', e);
    } finally {
      setIsSendingLink(false);
    }
  };

  const handleQuickActivate = async () => {
    setIsVerifyingCode(true);
    setTimeout(async () => {
      setIsVerifyingCode(false);
      setIsAccountVerified(true);
      if (registeredUid) {
        await markEmailAsVerified(registeredUid);
      }
    }, 600);
  };

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [governorate, setGovernorate] = useState('القاهرة');
  const [area, setArea] = useState('مدينة نصر');
  
  // Student specific
  const [grade, setGrade] = useState('الصف الثالث الثانوي');
  const [parentPhone, setParentPhone] = useState('');

  // Parent specific
  const [studentJoinCode, setStudentJoinCode] = useState('');
  const [isVerifyingStudent, setIsVerifyingStudent] = useState(false);
  const [verifiedStudentPreview, setVerifiedStudentPreview] = useState<any | null>(null);
  const [studentSearchError, setStudentSearchError] = useState('');

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
   * Handle Photo Upload during Signup
   */
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('يرجى اختيار ملف صورة صالح (JPEG أو PNG).');
      return;
    }

    setIsUploadingPhoto(true);
    setErrorMessage('');

    try {
      const compressed = await optimizeProfileImage(file, 400);
      setAvatarUrl(compressed);
      setIsUploadingPhoto(false);
    } catch (err: any) {
      setIsUploadingPhoto(false);
      setErrorMessage(err.message || 'حدث خطأ أثناء معالجة الصورة.');
    }
  };

  /**
   * Quick check student code during parent signup
   */
  const handleVerifyStudentCode = async () => {
    if (!studentJoinCode.trim()) {
      setStudentSearchError('يرجى كتابة كود الطالب أو رقم هاتفه أولاً.');
      setVerifiedStudentPreview(null);
      return;
    }
    setIsVerifyingStudent(true);
    setStudentSearchError('');
    try {
      const student = await findStudentByCodeOrPhone(studentJoinCode.trim());
      if (student) {
        setVerifiedStudentPreview(student);
        setStudentSearchError('');
      } else {
        setVerifiedStudentPreview(null);
        setStudentSearchError(`لم يتم العثور على طالب مسجل بهذا الكود (${studentJoinCode.trim()}). تأكد من كود الطالب أو رقم هاتفه.`);
      }
    } catch (err: any) {
      setStudentSearchError('حدث خطأ أثناء البحث عن كود الطالب.');
    } finally {
      setIsVerifyingStudent(false);
    }
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
      const session = await signupUser({
        email: email.trim(),
        password,
        role,
        name: name.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim(),
        governorate,
        area,
        grade: role === 'student' ? grade : undefined,
        subject: role === 'teacher' ? subject : undefined,
        experience: role === 'teacher' ? experience : undefined,
        parentPhone: role === 'student' ? parentPhone.trim() : undefined,
        studentJoinCode: role === 'parent' && studentJoinCode.trim() ? studentJoinCode.trim() : undefined,
      });

      if (session?.uid) {
        setRegisteredUid(session.uid);
      }

      // Automatically dispatch email verification link
      try {
        await sendEmailVerificationLink(email.trim());
        setLinkSentSuccess(true);
        setResendTimer(60);
      } catch (sendErr) {
        console.warn('Initial verification dispatch warning:', sendErr);
      }

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
      } else if (code === 'auth/network-request-failed') {
        setErrorMessage('تعذر الاتصال بالخادم، يرجى التأكد من اتصال الإنترنت والمحاولة ثانية.');
      } else {
        const msg = String(err?.message || '');
        if (msg.includes('auth/email-already-in-use')) {
          setErrorMessage('هذا البريد الإلكتروني مسجل به حساب بالفعل. يرجى تسجيل الدخول.');
        } else {
          setErrorMessage('حدث خطأ أثناء إنشاء الحساب. يرجى التأكد من صحة البيانات والمحاولة مرة أخرى.');
        }
      }
    }
  };

  const handleFinish = () => {
    onNavigate('/verify-email');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] py-12 sm:px-6 lg:px-8 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">
      
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
              
              {/* Profile Photo Upload (Optional with live preview and default fallback) */}
              <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={getCleanAvatarUrl(avatarUrl, role, name)}
                    alt="معاينة الصورة"
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-white ring-2 ring-blue-100 shadow-xs bg-white"
                  />
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-xs"
                      title="إزالة الصورة"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-right space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-bold text-gray-800">الصورة الشخصية</span>
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">اختياري</span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    يمكنك رفع صورتك الآن أو تركها لتطبيق الصورة الرمزية التلقائية.
                  </p>
                  
                  <div className="pt-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-[#2563EB] border border-blue-200 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-2xs active:scale-95">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isUploadingPhoto ? 'جاري التحميل...' : avatarUrl ? 'تغيير الصورة' : 'رفع صورة من جهازك'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        disabled={isUploadingPhoto}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

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
                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-right">
                    <div className="flex items-center gap-2 mb-2 text-blue-900 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                      <span>ربط حساب الابن / الطالب (اختياري عند التسجيل)</span>
                    </div>
                    <p className="text-xs text-blue-800/80 mb-3 leading-relaxed">
                      أدخل كود بطاقة الطالب (الـ QR أو الكود التعريفي للطالب) وسيقوم النظام فور إتمام تسجيلك بإرسال طلب ربط رسمي إلى حساب الطالب، حيث يصله إشعار للموافقة أو الرفض.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="مثال: HASSTY-ABC12345 أو رقم الهاتف"
                          value={studentJoinCode}
                          onChange={(e) => {
                            setStudentJoinCode(e.target.value);
                            if (verifiedStudentPreview) setVerifiedStudentPreview(null);
                            if (studentSearchError) setStudentSearchError('');
                          }}
                          className="w-full pl-3 pr-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono text-left uppercase focus:outline-none focus:border-[#2563EB] shadow-2xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyStudentCode}
                        disabled={isVerifyingStudent || !studentJoinCode.trim()}
                        className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {isVerifyingStudent ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>تحقق من الكود</span>
                      </button>
                    </div>

                    {/* Verification Result */}
                    {verifiedStudentPreview && (
                      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-in fade-in duration-200">
                        <img
                          src={getCleanAvatarUrl(verifiedStudentPreview.avatarUrl, 'student', verifiedStudentPreview.name)}
                          alt={verifiedStudentPreview.name}
                          className="w-10 h-10 rounded-lg object-cover border border-emerald-300 shrink-0 bg-white"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1 text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-emerald-900 truncate">
                              {verifiedStudentPreview.name}
                            </span>
                            <span className="text-[10px] font-bold bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-full">
                              طالب معتمد
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700 font-medium">
                            {verifiedStudentPreview.grade || 'المرحلة الثانوية'} — كود:{' '}
                            <span className="font-mono font-bold">{verifiedStudentPreview.qrCode || studentJoinCode}</span>
                          </p>
                          <p className="text-[10px] text-emerald-800 font-bold mt-0.5">
                            ✓ سيتم إرسال طلب ربط فوري للابن للموافقة عليه بمجرد إنهاء التسجيل.
                          </p>
                        </div>
                      </div>
                    )}

                    {studentSearchError && (
                      <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{studentSearchError}</span>
                      </p>
                    )}

                    <p className="text-[11px] text-gray-500 mt-2">
                      💡 ملاحظة: يمكنك تخطي هذه الخطوة الآن وإضافة أو ربط أبنائك في أي وقت بعد تسجيل الدخول من لوحة تحكم ولي الأمر.
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
                تم إنشاء حسابك وتفعيله بنجاح. أرسلنا أيضاً رسالة تحقق رسمية إلى بريدك الإلكتروني.
              </p>
            </div>

            {/* Email Verification Card specifically for Student and Parent Accounts */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/50 border-2 border-blue-200/80 rounded-2xl text-right space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#1E3A8A] font-bold text-xs sm:text-sm">
                  <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span>رابط تفعيل الحساب بالبريد</span>
                    <span className="block text-[11px] text-gray-500 font-normal">
                      {role === 'student' ? 'حساب الطالب' : role === 'parent' ? 'حساب ولي الأمر' : 'حساب المعلم'}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  isAccountVerified 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                    : 'bg-blue-100 text-[#2563EB] border-blue-200'
                }`}>
                  {isAccountVerified ? 'تم التفعيل والتوثيق' : 'رابط التفعيل مرسل'}
                </span>
              </div>

              {/* Email Address Display */}
              <div className="p-2.5 bg-white rounded-xl border border-blue-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-mono font-bold text-slate-800 truncate select-all" dir="ltr">
                    {email}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                  موثق
                </span>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                أرسلنا رابط تفعيل رسمي وآمن إلى بريدك الإلكتروني. اضغط على الرابط في رسالتك الواردة أو قم بالتفعيل السريع الآن.
              </p>

              {/* Resend Link and Go to Verification */}
              <div className="pt-2 border-t border-blue-100/80 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/verify-email')}
                  className="w-full sm:flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>إدخال كود التفعيل (OTP)</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendActivationLink}
                  disabled={resendTimer > 0 || isSendingLink}
                  className="w-full sm:w-auto py-2.5 px-3 rounded-xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/50 text-xs font-bold text-slate-700 hover:text-[#2563EB] transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>
                    {resendTimer > 0 
                      ? `إعادة الإرسال (${resendTimer} ث)` 
                      : 'إعادة إرسال الرابط'}
                  </span>
                </button>
              </div>

              {linkSentSuccess && (
                <p className="text-[11px] text-emerald-700 font-bold text-center">
                  ✓ تم إرسال رابط تفعيل إضافي إلى بريدك الإلكتروني بنجاح!
                </p>
              )}
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

            {/* Parent Child Link Notice */}
            {role === 'parent' && studentJoinCode.trim() && (
              <div className="p-5 bg-gradient-to-br from-emerald-50 to-blue-50/60 border border-emerald-200 rounded-2xl text-right space-y-2 shadow-xs">
                <div className="flex items-center gap-2.5 text-emerald-900">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">تم إرسال طلب ربط الطالب 👨‍👦</h4>
                    <p className="text-[11px] text-emerald-700">تم إشعار حساب الطالب بالطلب بنجاح</p>
                  </div>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed">
                  أرسلنا إشعاراً واضحاً إلى حساب الطالب للموافقة على طلب الربط. بمجرد قيام الطالب بالضغط على <strong>موافقة</strong> من حسابه، ستظهر لك بياناته وحصصه في لوحة تحكمك تلقائياً.
                </p>
              </div>
            )}

            <button
              onClick={handleFinish}
              className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>المتابعة إلى صفحة التوثيق وتأكيد الرمز</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

    </div>
  );
};

