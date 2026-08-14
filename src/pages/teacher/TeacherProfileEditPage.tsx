import React, { useState } from 'react';
import {
  User,
  Save,
  CheckCircle2,
  MapPin,
  BookOpen,
  DollarSign,
  GraduationCap,
  Sparkles,
  Camera
} from 'lucide-react';
import { SAMPLE_TUTORS } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';

export const TeacherProfileEditPage: React.FC = () => {
  const defaultTutor = SAMPLE_TUTORS[0];

  const [name, setName] = useState(defaultTutor.name);
  const [subject, setSubject] = useState(defaultTutor.subject);
  const [headline, setHeadline] = useState(defaultTutor.headline);
  const [bio, setBio] = useState(defaultTutor.bio);
  const [governorate, setGovernorate] = useState(defaultTutor.governorate);
  const [area, setArea] = useState(defaultTutor.area);
  const [experienceYears, setExperienceYears] = useState(defaultTutor.experienceYears);
  const [pricePerSession, setPricePerSession] = useState(defaultTutor.pricePerSession);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8 text-right max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
          <User className="w-3.5 h-3.5" />
          <span>الملف الشخصي والبيانات العامة</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
          تعديل الملف التعريفي للمعلم
        </h2>
        <p className="text-xs text-[#6B7280] mt-1">
          هذه البيانات هي ما يظهر للطلاب وأولياء الأمور في صفحة البحث وملفك العام
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 text-center flex items-center justify-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          <span>تم حفظ التعديلات وتحديث ملفك العام بنجاح!</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* Photo and Identity */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
            <div className="relative">
              <img
                src={defaultTutor.avatarUrl}
                alt={name}
                className="w-24 h-24 rounded-3xl object-cover border-2 border-white ring-2 ring-blue-200 shadow-md"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                className="absolute -bottom-2 -right-2 p-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-md transition-transform cursor-pointer"
                title="تغيير الصورة الشخصية"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center sm:text-right space-y-1 flex-1">
              <h3 className="text-lg font-bold text-[#1E3A8A]">{name}</h3>
              <p className="text-xs text-[#6B7280]">كود الانضمام المباشر لطلابك: <strong className="font-mono text-[#2563EB]">{defaultTutor.joinCode}</strong></p>
              <Badge variant="success" size="sm" className="mt-1">معلم معتمد وموثق ✓</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#1F2937] mb-1">الاسم الكامل الظاهر للطلاب</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right font-bold focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1F2937] mb-1">المادة الأساسية</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right font-bold focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[#1F2937] mb-1">العنوان التعريفي البارز (Headline)</label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[#1F2937] mb-1">نبذة عنك وخبرتك الأكاديمية (Bio)</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
        </div>

        {/* Location & Pricing */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-[#1E3A8A]">الموقع وسعر الحصة</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#1F2937] mb-1">المحافظة</label>
              <input
                type="text"
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1F2937] mb-1">المنطقة / السناتر</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1F2937] mb-1">سعر الحصة (ج.م)</label>
              <input
                type="number"
                value={pricePerSession}
                onChange={(e) => setPricePerSession(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right font-mono font-bold"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>حفظ وتحديث الملف الشخصي</span>
        </button>

      </form>

    </div>
  );
};
