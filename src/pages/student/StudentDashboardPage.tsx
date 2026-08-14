import React from 'react';
import {
  QrCode,
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  TrendingUp,
  ArrowLeft,
  ChevronLeft,
  Sparkles,
  BookOpen,
  Award
} from 'lucide-react';
import { MOCK_CURRENT_STUDENT, MOCK_STUDENT_LESSONS, SAMPLE_TUTORS } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';

interface StudentDashboardPageProps {
  onNavigate: (path: string) => void;
  onSelectTutor: (tutorId: string) => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({
  onNavigate,
  onSelectTutor,
}) => {
  const student = MOCK_CURRENT_STUDENT;
  const upcomingLessons = MOCK_STUDENT_LESSONS.slice(0, 3);
  const myTutors = SAMPLE_TUTORS.slice(0, 3);

  return (
    <div className="space-y-8 text-right">
      
      {/* 1. Welcome & ID Card Quick Banner */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <img
            src={student.avatarUrl}
            alt={student.name}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white ring-2 ring-blue-100 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
                مرحباً، {student.name} 👋
              </h2>
              <Badge variant="info">{student.grade}</Badge>
            </div>
            <p className="text-xs text-[#6B7280]">
              كود البطاقة الرقمية: <strong className="font-mono text-[#2563EB]">{student.qrCode}</strong>
            </p>
            <div className="flex items-center gap-3 mt-3 text-xs text-[#4B5563]">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {student.governorate} — {student.area}
              </span>
            </div>
          </div>
        </div>

        {/* Quick QR Card Button */}
        <button
          onClick={() => onNavigate('/student/qr-card')}
          className="w-full md:w-auto px-5 py-3 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] border border-blue-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
        >
          <QrCode className="w-5 h-5" />
          <span>فتح كارنيه الـ QR للطباعة والمسح</span>
        </button>
      </div>

      {/* 2. Key Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">المدرسين المسجل معهم</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1E3A8A]">3 مدرسين</p>
          <span className="text-[11px] text-[#10B981] font-bold">كيمياء، فيزياء، لغة عربية</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">حصص هذا الأسبوع</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1E3A8A]">3 حصص</p>
          <span className="text-[11px] text-[#2563EB] font-bold">الحصة القادمة: غداً 04:30 م</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">نسبة الحضور الموثق</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#10B981]">95%</p>
          <span className="text-[11px] text-[#6B7280]">حضور 19 من أصل 20 حصة</span>
        </div>

      </div>

      {/* 3. Upcoming Lessons & My Tutors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Upcoming Lessons */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2563EB]" />
              <span>جدول الحصص القادمة</span>
            </h3>
            <button
              onClick={() => onNavigate('/student/book')}
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>حجز موعد إضافي</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-200 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex flex-col items-center justify-center shrink-0 border border-blue-100">
                    <span className="text-[10px] font-bold">{lesson.day}</span>
                    <span className="text-xs font-black">{lesson.time.split(' ')[0]}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#1E3A8A]">
                        {lesson.subject} — {lesson.topic}
                      </h4>
                      <Badge
                        variant={lesson.type === 'center' ? 'info' : 'navy'}
                        size="sm"
                      >
                        {lesson.type === 'center' ? 'سنتر' : 'أونلاين'}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      المعلم: {lesson.tutorName}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {lesson.time}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {lesson.location}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Badge variant="success" size="sm">مؤكد</Badge>
                  <button
                    onClick={() => onNavigate('/student/qr-card')}
                    className="p-2 bg-gray-50 hover:bg-[#EFF6FF] text-[#2563EB] rounded-xl border border-gray-200 cursor-pointer"
                    title="كود الحضور"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: My Tutors Quick List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#2563EB]" />
              <span>مدرسيني الحاليين</span>
            </h3>
            <button
              onClick={() => onNavigate('/student/tutors')}
              className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
            >
              عرض الكل
            </button>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
            {myTutors.map((tutor) => (
              <div
                key={tutor.id}
                className="p-3 rounded-xl border border-gray-100 hover:border-blue-200 bg-gray-50/60 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={tutor.avatarUrl}
                    alt={tutor.name}
                    className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#1E3A8A]">{tutor.name}</h4>
                    <span className="text-[11px] text-[#2563EB] font-semibold">{tutor.subject}</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectTutor(tutor.id)}
                  className="text-xs text-[#2563EB] font-bold hover:underline cursor-pointer"
                >
                  الملف
                </button>
              </div>
            ))}

            <button
              onClick={() => onNavigate('/search')}
              className="w-full py-2.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>البحث عن مدرس لمادة جديدة</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
