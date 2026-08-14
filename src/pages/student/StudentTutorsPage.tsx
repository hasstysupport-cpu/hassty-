import React, { useState } from 'react';
import {
  Users,
  Plus,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  X,
  ArrowLeft,
  Search,
  MessageSquare
} from 'lucide-react';
import { SAMPLE_TUTORS } from '../../data/mockData';
import { TutorProfile } from '../../types';
import { Badge } from '../../components/common/Badge';

interface StudentTutorsPageProps {
  onNavigate: (path: string) => void;
  onSelectTutor: (tutorId: string) => void;
}

export const StudentTutorsPage: React.FC<StudentTutorsPageProps> = ({
  onNavigate,
  onSelectTutor,
}) => {
  const [tutorsList, setTutorsList] = useState<TutorProfile[]>(SAMPLE_TUTORS.slice(0, 3));
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinSuccessMessage, setJoinSuccessMessage] = useState('');

  const handleJoinTutor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput) return;

    // Look for matching tutor in SAMPLE_TUTORS
    const foundTutor = SAMPLE_TUTORS.find(
      (t) => t.joinCode.toUpperCase() === joinCodeInput.trim().toUpperCase()
    ) || SAMPLE_TUTORS[3];

    if (foundTutor) {
      if (!tutorsList.some((t) => t.id === foundTutor.id)) {
        setTutorsList([...tutorsList, foundTutor]);
      }
      setJoinSuccessMessage(`تم الانضمام بنجاح لمجموعة ${foundTutor.name} (${foundTutor.subject})!`);
      setTimeout(() => {
        setIsJoinModalOpen(false);
        setJoinSuccessMessage('');
        setJoinCodeInput('');
      }, 2000);
    }
  };

  return (
    <div className="space-y-8 text-right">
      
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>قائمة المدرسين</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            المدرسين المشترك معهم ({tutorsList.length})
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            تابع مواعيد حصصك وسجل الحضور ونسبة الالتزام مع كل معلم
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/search')}
            className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-[#1E3A8A] text-xs font-bold rounded-xl border border-[#E5E7EB] transition-colors cursor-pointer"
          >
            البحث عن مدرس جديد
          </button>
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>الانضمام بكود مدرس</span>
          </button>
        </div>
      </div>

      {/* Tutors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorsList.map((tutor) => (
          <div
            key={tutor.id}
            className="bg-white border border-[#E5E7EB] rounded-3xl p-6 hover:border-blue-300 transition-all flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={tutor.avatarUrl}
                  alt={tutor.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-[#E5E7EB] shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#1E3A8A] truncate">{tutor.name}</h3>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 text-xs font-bold text-amber-900">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                      <span>{tutor.rating}</span>
                    </div>
                  </div>
                  <Badge variant="info" size="sm" className="mt-1">{tutor.subject}</Badge>
                  <p className="text-xs text-[#6B7280] mt-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{tutor.area}</span>
                  </p>
                </div>
              </div>

              {/* Attendance & Next Lesson Info */}
              <div className="space-y-2.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">نسبة حضورك:</span>
                  <strong className="text-[#10B981] font-black">95% (19/20 حصة)</strong>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200/60 pt-2">
                  <span className="text-[#6B7280]">الحصة القادمة:</span>
                  <span className="font-bold text-[#1E3A8A]">السبت 04:30 م</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200/60 pt-2">
                  <span className="text-[#6B7280]">سعر الحصة:</span>
                  <span className="font-mono font-bold text-[#1E3A8A]">{tutor.pricePerSession} ج.م</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-2">
              <button
                onClick={() => onSelectTutor(tutor.id)}
                className="flex-1 py-2.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
              >
                عرض الملف والتقييمات
              </button>
              <button
                onClick={() => onNavigate('/student/book')}
                className="px-3 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                title="حجز موعد"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Join by code / scan */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 text-right relative animate-scaleUp">
            
            <button
              onClick={() => setIsJoinModalOpen(false)}
              className="absolute left-4 top-4 p-2 text-gray-400 hover:text-gray-600 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#1E3A8A]">الانضمام لمجموعة مدرس جديد</h3>
              <p className="text-xs text-[#6B7280]">
                اطلب من المعلم كود الانضمام الخاص به، أو امسح كود الـ QR الخاص بمجموعته.
              </p>
            </div>

            {joinSuccessMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                <span>{joinSuccessMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleJoinTutor} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                    كود الانضمام المباشر للمدرس
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: CHEM-2026 أو MATH-5520"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-center font-mono font-bold text-sm text-[#1E3A8A] uppercase focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  />
                  <div className="flex justify-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setJoinCodeInput('MATH-5520')}
                      className="text-[10px] text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100"
                    >
                      تجربة: MATH-5520
                    </button>
                    <button
                      type="button"
                      onClick={() => setJoinCodeInput('BIO-7711')}
                      className="text-[10px] text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100"
                    >
                      تجربة: BIO-7711
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>تأكيد الانضمام للمجموعة</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
