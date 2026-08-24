import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  Save,
  Trash2,
  RefreshCw,
  Clock,
  BookOpen,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { LocationSelector } from '../../components/common/LocationSelector';
import { getCleanAvatarUrl, optimizeProfileImage } from '../../lib/avatarHelper';

export const StudentProfilePage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();

  // Form states initialized with current user profile
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [governorate, setGovernorate] = useState(user?.governorate || user?.profileData?.governorate || 'القاهرة');
  const [area, setArea] = useState(user?.area || user?.profileData?.area || 'مدينة نصر');
  const [grade, setGrade] = useState(user?.profileData?.grade || 'الصف الثالث الثانوي');
  const [parentPhone, setParentPhone] = useState(user?.profileData?.parentPhone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || user?.profileData?.avatarUrl || '');

  // UI state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const qrCode = user?.profileData?.qrCode || (user?.uid ? `HASSTY-${user.uid.substring(0, 8).toUpperCase()}` : 'HASSTY-STU');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(qrCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  /**
   * Handle Photo File Selection & Client-Side Compression
   */
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('يرجى اختيار ملف صورة صالح (JPEG أو PNG).');
      return;
    }

    setIsUploadingPhoto(true);
    setErrorMessage('');

    try {
      const optimizedDataUrl = await optimizeProfileImage(file, 400);
      setAvatarUrl(optimizedDataUrl);
      setIsUploadingPhoto(false);
    } catch (err: any) {
      setIsUploadingPhoto(false);
      setErrorMessage(err.message || 'حدث خطأ أثناء معالجة الصورة.');
    }
  };

  /**
   * Remove Custom Photo and Revert to Default Fixed Avatar
   */
  const handleRemovePhoto = () => {
    setAvatarUrl('');
  };

  /**
   * Save All Profile Changes to Firestore
   */
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('يرجى كتابة الاسم بالكامل.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccessMessage('');

    try {
      await updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        governorate,
        area,
        grade,
        parentPhone: parentPhone.trim(),
        avatarUrl: avatarUrl.trim(),
      });

      setIsSaving(false);
      setSaveSuccessMessage('تم حفظ وتحديث بيانات الملف الشخصي بنجاح! ✨');
      setTimeout(() => setSaveSuccessMessage(''), 4000);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ التعديلات.');
    }
  };

  return (
    <div className="space-y-6 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">
      
      {/* 1. Header with Live Photo & QR Badge */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 sm:gap-6">
          
          {/* Avatar with Quick Upload Trigger */}
          <div className="relative group">
            <img
              src={getCleanAvatarUrl(avatarUrl, 'student', name)}
              alt={name || 'صورة الطالب'}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-white ring-4 ring-blue-50 shadow-sm bg-gray-50"
              referrerPolicy="no-referrer"
            />
            <label
              htmlFor="avatar-quick-upload"
              className="absolute -bottom-1 -left-1 p-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center"
              title="تغيير الصورة الشخصية"
            >
              <Camera className="w-4 h-4" />
              <input
                id="avatar-quick-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
                {name || 'طالب منصة حِصّتي'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
                {grade}
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              كود الطالب الموحد: <strong className="font-mono text-[#2563EB]">{qrCode}</strong>
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-[#4B5563]">
              <span className="flex items-center gap-1 text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {governorate} — {area || 'المنطقة السكنية'}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                حساب طالب نشط
              </span>
            </div>
          </div>
        </div>

        {/* Quick QR Info Card */}
        <div className="w-full md:w-auto p-4 bg-[#F8FAFF] border border-blue-100 rounded-2xl flex items-center gap-3 text-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <span className="text-gray-500 block text-[11px]">معرف الحضور الذكي</span>
            <span className="font-mono font-bold text-[#1E3A8A] text-sm">{qrCode}</span>
          </div>
        </div>
      </div>

      {/* 2. Success and Error Notifications */}
      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-800 flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Comprehensive Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* Section A: Photo Management Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-black text-[#1E3A8A] flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#2563EB]" />
              <span>الصورة الشخصية (Profile Picture)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              تظهر صورتك الشخصية لمعلميك في كشف الحضور الرقمي وكارنيه الـ QR. في حال عدم رفع صورة، يتم تطبيق الصورة الثابتة التلقائية للمنصة.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            <img
              src={getCleanAvatarUrl(avatarUrl, 'student', name)}
              alt="معاينة الصورة"
              className="w-24 h-24 rounded-3xl object-cover border-2 border-gray-200 shadow-xs bg-gray-50 shrink-0"
              referrerPolicy="no-referrer"
            />

            <div className="space-y-3 w-full">
              <div className="flex flex-wrap items-center gap-3">
                <label className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-xs active:scale-95">
                  <UploadCloud className="w-4 h-4" />
                  <span>{isUploadingPhoto ? 'جاري المعالجة...' : 'رفع صورة شخصية جديدة'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                </label>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف الصورة والعودة للشعار الثابت</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-gray-400">
                الصيغ المقبولة: JPG, PNG, WebP. يتم ضغط وتحسين الصورة تلقائياً لضمان سرعة التصفح.
              </p>
            </div>
          </div>
        </div>

        {/* Section B: Personal Information */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-black text-[#1E3A8A] flex items-center gap-2">
              <User className="w-5 h-5 text-[#2563EB]" />
              <span>البيانات الأساسية والدراسية</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              تعديل بياناتك المسجلة لمزامنتها مع حسابات معلميك وكارنيه الحضور.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                الاسم بالكامل <span className="text-[#EF4444]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-right focus:bg-white focus:outline-none focus:border-[#2563EB] transition-colors"
                />
                <User className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            {/* Mobile Phone */}
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                رقم هاتف الطالب (الموبايل) <span className="text-[#EF4444]">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB] transition-colors"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            {/* Email (Read Only info) */}
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                البريد الإلكتروني المسجل (معرف تسجيل الدخول)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  dir="ltr"
                  value={user?.email || ''}
                  className="w-full pl-4 pr-10 py-3 bg-gray-100 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-left text-gray-500 cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">
                لتغيير البريد الإلكتروني أو كلمة المرور، يرجى مراجعة إعدادات الأمان.
              </span>
            </div>

            {/* Academic Grade */}
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                الصف / المرحلة الدراسية <span className="text-[#EF4444]">*</span>
              </label>
              <div className="relative">
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
                >
                  <optgroup label="المرحلة الثانوية">
                    <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                    <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                    <option value="الصف الثالث الثانوي">الصف الثالث الثانوي (ثانوية عامة)</option>
                  </optgroup>
                  <optgroup label="المرحلة الإعدادية">
                    <option value="الصف الأول الإعدادي">الصف الأول الإعدادي</option>
                    <option value="الصف الثاني الإعدادي">الصف الثاني الإعدادي</option>
                    <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</option>
                  </optgroup>
                  <optgroup label="المرحلة الابتدائية">
                    <option value="الصف الرابع الابتدائي">الصف الرابع الابتدائي</option>
                    <option value="الصف الخامس الابتدائي">الصف الخامس الابتدائي</option>
                    <option value="الصف السادس الابتدائي">الصف السادس الابتدائي</option>
                  </optgroup>
                </select>
                <GraduationCap className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Location Selector */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
              المحافظة والمنطقة السكنية <span className="text-[#EF4444]">*</span>
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

        {/* Section C: Parent Info & Safety Notifications */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-black text-[#1E3A8A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>كود ربط ولي الأمر وإشعارات الحضور (WhatsApp)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              شارك هذا الكود مع ولي أمرك عند إنشاء حسابه أو من لوحة تحكمه ليتمكن من إرسال طلب ربط الحساب.
            </p>
          </div>

          {/* Student Join Code Box */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-xs">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-blue-900 block">كود البطاقة والربط الخاص بك:</span>
                <span className="font-mono text-sm sm:text-base font-black text-[#1E3A8A] tracking-wider select-all">
                  {qrCode}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-blue-100 text-[#2563EB] border border-blue-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">تم نسخ الكود!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الكود لولي الأمر</span>
                </>
              )}
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
              رقم واتساب ولي الأمر (WhatsApp)
            </label>
            <div className="relative">
              <input
                type="tel"
                dir="ltr"
                placeholder="010XXXXXXXX"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs sm:text-sm font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB] transition-colors"
              />
              <Phone className="w-4 h-4 text-emerald-600 absolute right-3.5 top-3.5" />
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              سيتم إرسال إشعارات الحضور وغياب الحصص التلقائية لهذا الرقم.
            </span>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات في الملف الشخصي</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};
