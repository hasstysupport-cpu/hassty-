import React, { useState, useMemo } from 'react';
import { useSEO } from '../lib/useSEO';
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Filter,
  ArrowLeft,
  X,
  BookOpen,
  Calendar,
  Users,
  QrCode,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SAMPLE_TUTORS, EGYPT_GOVERNORATES, CITIES_BY_GOVERNORATE, SUBJECTS_DATA } from '../data/mockData';
import { TutorProfile } from '../types';
import { Badge } from '../components/common/Badge';
import { LocationSelector } from '../components/common/LocationSelector';

interface SearchResultsPageProps {
  initialSubject?: string;
  initialGovernorate?: string;
  onNavigate: (path: string) => void;
  onSelectTutor: (tutorId: string) => void;
  onBookTutor?: (tutor: TutorProfile) => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  initialSubject = '',
  initialGovernorate = '',
  onNavigate,
  onSelectTutor,
  onBookTutor,
}) => {
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [selectedGovernorate, setSelectedGovernorate] = useState(initialGovernorate);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useSEO({
    title: selectedSubject ? `مدرسين ${selectedSubject} المعتمدين في مصر` : 'البحث عن المدرسين الخصوصيين المعتمدين',
    description: `ابحث عن أفضل المدرسين الخصوصيين في ${selectedSubject || 'جميع المواد'} بمحافظة ${selectedGovernorate || 'مصر'} مع تقييمات الطلاب، الأسعار، وحجز الحصص الفوري.`,
    canonicalPath: '/search',
    keywords: `مدرس ${selectedSubject || 'خصوصي'}, مدرسين ثانوية عامة, دروس خصوصية ${selectedGovernorate || 'مصر'}, حجز حصص`,
  });

  const availableCities = useMemo(() => {
    if (!selectedGovernorate || !CITIES_BY_GOVERNORATE[selectedGovernorate]) {
      return [];
    }
    return CITIES_BY_GOVERNORATE[selectedGovernorate];
  }, [selectedGovernorate]);

  // Handle governorate change
  const handleGovernorateChange = (gov: string) => {
    setSelectedGovernorate(gov);
    setSelectedCity('');
    setCurrentPage(1);
  };

  // Filtered tutors
  const filteredTutors = useMemo(() => {
    return SAMPLE_TUTORS.filter((tutor) => {
      // Query filter
      if (
        searchQuery &&
        !tutor.name.includes(searchQuery) &&
        !tutor.subject.includes(searchQuery) &&
        !tutor.bio.includes(searchQuery)
      ) {
        return false;
      }

      // Subject filter
      if (selectedSubject && tutor.subject !== selectedSubject) {
        return false;
      }

      // Governorate filter
      if (selectedGovernorate && tutor.governorate !== selectedGovernorate) {
        return false;
      }

      // City filter
      if (selectedCity && !tutor.area.includes(selectedCity)) {
        return false;
      }

      // Stage filter
      if (selectedStage !== 'all') {
        const matchesStage = tutor.levels.some((lvl) => lvl.includes(selectedStage));
        if (!matchesStage) return false;
      }

      return true;
    });
  }, [searchQuery, selectedSubject, selectedGovernorate, selectedCity, selectedStage, selectedType]);

  const totalPages = Math.ceil(filteredTutors.length / itemsPerPage) || 1;
  const displayedTutors = filteredTutors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleResetFilters = () => {
    setSelectedSubject('');
    setSelectedGovernorate('');
    setSelectedCity('');
    setSelectedStage('all');
    setSelectedType('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="bg-[#F8FAFF] min-h-screen pb-16 text-right">
      
      {/* 1. Top Filter Header / Search Bar */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-20 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="ابحث باسم المدرس، المادة أو الكلمة المفتاحية..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all text-right"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Subject Select */}
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#2563EB] cursor-pointer hover:bg-white"
              >
                <option value="">كل المواد الدراسية</option>
                {SUBJECTS_DATA.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Smart Location Selector Dropdown */}
              <div className="w-full sm:w-auto min-w-[200px]">
                <LocationSelector
                  selectedGovernorate={selectedGovernorate}
                  selectedCity={selectedCity}
                  onSelectGovernorate={(gov) => {
                    handleGovernorateChange(gov);
                    setCurrentPage(1);
                  }}
                  onSelectCity={(city) => {
                    setSelectedCity(city);
                    setCurrentPage(1);
                  }}
                  showCitySelect={true}
                  placeholder="المحافظة والمدينة..."
                />
              </div>

              {/* Stage Filter */}
              <select
                value={selectedStage}
                onChange={(e) => {
                  setSelectedStage(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                <option value="all">كل المراحل</option>
                <option value="الثانوية">المرحلة الثانوية</option>
                <option value="الإعدادية">المرحلة الإعدادية</option>
                <option value="الابتدائية">المرحلة الابتدائية</option>
              </select>

              {/* Lesson Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                <option value="all">كل أنواع الحصص</option>
                <option value="center">مجموعات سنتر</option>
                <option value="online">أونلاين لايف</option>
                <option value="private">درس خصوصي منزلي</option>
              </select>

              {(selectedSubject || selectedGovernorate || selectedCity || selectedStage !== 'all' || searchQuery) && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2 text-xs font-bold text-[#EF4444] hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إعادة تعيين</span>
                </button>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* 2. Results Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Top Summary Banner */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1E3A8A]">
                {filteredTutors.length > 0 ? (
                  <span>
                    تم العثور على <strong className="text-[#2563EB] font-black">{filteredTutors.length}</strong> معلم متاح
                    {selectedSubject && ` لمادة ${selectedSubject}`}
                    {selectedGovernorate && ` في ${selectedGovernorate}`}
                  </span>
                ) : (
                  <span>لا توجد نتائج مطابقة لبحثك</span>
                )}
              </h2>
              <p className="text-xs text-[#6B7280]">
                جميع المدرسين موثقون رسمياً مع تقييمات حقيقية ونظام حضور ذكي بالـ QR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs text-[#6B7280]">ترتيب حسب:</span>
            <span className="text-xs font-bold text-[#1E3A8A] bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
              الأعلى تقييماً
            </span>
          </div>
        </div>

        {/* 3. Tutors Grid / List */}
        {displayedTutors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {displayedTutors.map((tutor) => (
              <div
                key={tutor.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 hover:border-blue-300 transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  
                  {/* Top card row: Avatar + Name + Rating */}
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={tutor.avatarUrl}
                      alt={tutor.name}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border border-[#E5E7EB] shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base sm:text-lg font-black text-[#1E3A8A] flex items-center gap-1.5 truncate">
                          {tutor.name}
                          {tutor.isVerified && (
                            <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" title="مدرس موثق" />
                          )}
                        </h3>

                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg shrink-0">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                          <span className="text-xs font-black text-amber-900">{tutor.rating}</span>
                          <span className="text-[10px] text-gray-500">({tutor.reviewsCount})</span>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-[#2563EB] mt-0.5 truncate">
                        {tutor.title}
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-xs text-[#6B7280]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {tutor.governorate} — {tutor.area}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">
                          {tutor.studentsCount} طالب مسجل
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio snippet */}
                  <p className="text-xs text-[#4B5563] leading-relaxed line-clamp-2 mb-4 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    {tutor.bio}
                  </p>

                  {/* Levels badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tutor.levels.map((lvl, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-bold bg-[#F8FAFF] text-[#1E3A8A] border border-[#E5E7EB] px-2 py-0.5 rounded-lg"
                      >
                        {lvl}
                      </span>
                    ))}
                  </div>

                </div>

                {/* Card Footer: Pricing + Action Buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-[#6B7280] block">سعر الحصة</span>
                    <span className="text-base font-black text-[#1E3A8A]">
                      {tutor.pricePerSession} <span className="text-xs font-normal">ج.م</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectTutor(tutor.id)}
                      className="px-4 py-2 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                    >
                      عرض الملف الكامل
                    </button>
                    <button
                      onClick={() => onSelectTutor(tutor.id)}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>حجز الحصة</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center max-w-xl mx-auto my-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#1E3A8A]">لم نتمكن من العثور على مدرسين مطابقين لبحثك</h3>
            <p className="text-xs text-[#6B7280] max-w-md mx-auto leading-relaxed">
              جرّب توسيع نطاق البحث باختيار كل المحافظات، أو إزالة بعض الفلاتر مثل المرحلة أو نوع الحصة لتظهر لك كافة الخيارات المتاحة.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-2.5 bg-[#2563EB] text-white text-xs font-bold rounded-xl hover:bg-[#1D4ED8] transition-all cursor-pointer"
            >
              عرض جميع المدرسين المتاحين
            </button>
          </div>
        )}

        {/* 4. Pagination */}
        {filteredTutors.length > itemsPerPage && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
              aria-label="الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white text-gray-700 border-[#E5E7EB] hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
              aria-label="الصفحة التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
