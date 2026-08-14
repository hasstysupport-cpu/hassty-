import React, { useState, useMemo } from 'react';
import { X, Search, MapPin, Star, ShieldCheck, Check, QrCode, Calendar, Users, Phone, ArrowLeft } from 'lucide-react';
import { SAMPLE_TUTORS, EGYPT_GOVERNORATES, SUBJECTS_DATA } from '../data/mockData';
import { TutorProfile } from '../types';

interface TutorDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: string;
  initialGovernorate?: string;
  onOpenQRSimulator: () => void;
  onBookLesson: (tutor: TutorProfile) => void;
}

export const TutorDiscoveryModal: React.FC<TutorDiscoveryModalProps> = ({
  isOpen,
  onClose,
  initialSubject = '',
  initialGovernorate = '',
  onOpenQRSimulator,
  onBookLesson,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [selectedGovernorate, setSelectedGovernorate] = useState(initialGovernorate);
  const [joinedTutors, setJoinedTutors] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Sync initial props when modal opens
  React.useEffect(() => {
    if (initialSubject) setSelectedSubject(initialSubject);
    if (initialGovernorate) setSelectedGovernorate(initialGovernorate);
  }, [initialSubject, initialGovernorate]);

  const filteredTutors = useMemo(() => {
    return SAMPLE_TUTORS.filter((tutor) => {
      const matchSubject = !selectedSubject || tutor.subject === selectedSubject;
      const matchGov = !selectedGovernorate || tutor.governorate === selectedGovernorate;
      const matchQuery =
        !searchQuery ||
        tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSubject && matchGov && matchQuery;
    });
  }, [selectedSubject, selectedGovernorate, searchQuery]);

  const handleJoin = (tutorId: string) => {
    if (!joinedTutors.includes(tutorId)) {
      setJoinedTutors([...joinedTutors, tutorId]);
    }
  };

  const handleCopyCode = (code: string) => {
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8 max-h-[90vh] flex flex-col text-right">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-[#F8FAFF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center">
              <Search className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1E3A8A]">دليل المدرسين المعتمدين</h2>
              <p className="text-xs text-[#6B7280]">تصفح المدرسين وتواصل معهم بكود الانضمام المباشر أو مسح الـ QR</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
            aria-label="إغلاق"
            id="btn-close-tutor-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-6 bg-white border-b border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search by text */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو المنطقة..."
              className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="">جميع المواد الدراسية</option>
              {SUBJECTS_DATA.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Governorate Filter */}
          <div>
            <select
              value={selectedGovernorate}
              onChange={(e) => setSelectedGovernorate(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="">جميع المحافظات الـ 27</option>
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Modal Results List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {filteredTutors.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-700 mb-1">لا توجد نتائج مطابقة لخيارات البحث</h3>
              <p className="text-xs text-gray-500 mb-4">جرب تغيير المادة أو المحافظة للاطلاع على مزيد من المدرسين المعتمدين.</p>
              <button
                onClick={() => {
                  setSelectedSubject('');
                  setSelectedGovernorate('');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTutors.map((tutor) => {
                const isJoined = joinedTutors.includes(tutor.id);

                return (
                  <div
                    key={tutor.id}
                    className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-blue-300 hover:shadow-xs transition-all"
                  >
                    <div>
                      {/* Tutor Header */}
                      <div className="flex items-start gap-3.5 mb-3">
                        <img
                          src={tutor.avatarUrl}
                          alt={tutor.name}
                          className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-[#1F2937] truncate flex items-center gap-1">
                              {tutor.name}
                              <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" title="مدرس موثق ومعتمد" />
                            </h3>
                            <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-md shrink-0">
                              {tutor.subject}
                            </span>
                          </div>
                          <p className="text-xs text-[#6B7280] line-clamp-1 mt-0.5">{tutor.title}</p>
                          <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-[#2563EB]" />
                            <span>{tutor.governorate} — {tutor.area}</span>
                          </p>
                        </div>
                      </div>

                      {/* Ratings & Price */}
                      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl mb-3 text-xs">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{tutor.rating}</span>
                          <span className="text-gray-400 font-normal">({tutor.reviewsCount} تقييم حقيقي)</span>
                        </div>
                        <div className="font-bold text-[#1E3A8A]">
                          {tutor.pricePerSession} ج.م <span className="font-normal text-gray-500 text-[10px]">/ الحصة</span>
                        </div>
                      </div>

                      {/* Bio snippet */}
                      <p className="text-xs text-[#6B7280] line-clamp-2 mb-3">
                        {tutor.bio}
                      </p>

                      {/* Levels */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {tutor.levels.map((lvl, idx) => (
                          <span key={idx} className="text-[10px] bg-blue-50/70 text-[#1E3A8A] px-2 py-0.5 rounded-md font-medium">
                            {lvl}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Join Code & Actions */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleCopyCode(tutor.joinCode)}
                        className="text-[11px] font-mono font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="انقر لنسخ كود الانضمام"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>{copiedCode === tutor.joinCode ? 'تم النسخ!' : `كود: ${tutor.joinCode}`}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onBookLesson(tutor)}
                          className="text-xs font-bold text-[#1E3A8A] bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>حجز حصة</span>
                        </button>

                        <button
                          onClick={() => handleJoin(tutor.id)}
                          className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            isJoined
                              ? 'bg-emerald-500 text-white'
                              : 'bg-[#2563EB] hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isJoined ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>تم الانضمام</span>
                            </>
                          ) : (
                            <>
                              <span>انضمام</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>جميع التقييمات صادرة حصراً من طلاب حضروا الحصص فعلياً وموثقة بالـ QR</span>
          </div>
          <button
            onClick={onOpenQRSimulator}
            className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>شاهد كيف تسجل حضورك بكود الـ QR</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
