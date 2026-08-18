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
  Award,
  Receipt,
  AlertCircle,
  CreditCard,
  Check
} from 'lucide-react';
import { MOCK_CURRENT_STUDENT, MOCK_STUDENT_LESSONS, SAMPLE_TUTORS, MOCK_PAYMENTS } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../lib/AuthContext';

interface StudentDashboardPageProps {
  onNavigate: (path: string) => void;
  onSelectTutor: (tutorId: string) => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({
  onNavigate,
  onSelectTutor,
}) => {
  const { user } = useAuth();
  const student = {
    ...MOCK_CURRENT_STUDENT,
    name: user?.name || MOCK_CURRENT_STUDENT.name,
    grade: user?.profileData?.grade || MOCK_CURRENT_STUDENT.grade,
    qrCode: user?.profileData?.qrCode || MOCK_CURRENT_STUDENT.qrCode,
    phone: user?.phone || MOCK_CURRENT_STUDENT.phone,
  };
  const upcomingLessons = MOCK_STUDENT_LESSONS.slice(0, 3);
  const myTutors = SAMPLE_TUTORS.slice(0, 3);

  // Payment statuses mapping per tutor/subject
  const tutorPaymentStatuses: Record<string, { status: 'paid' | 'pending' | 'overdue'; label: string; amount: number; dueText: string }> = {
    't1': { status: 'paid', label: 'مدفوع بالكامل', amount: 480, dueText: 'مسدد لشهر أغسطس' },
    't2': { status: 'paid', label: 'مدفوع بالكامل', amount: 560, dueText: 'مسدد لشهر أغسطس' },
    't5': { status: 'pending', label: 'قسط قادم مستحق', amount: 440, dueText: 'مستحق بحلول 15 أغسطس' }
  };

  const pendingPaymentsCount = Object.values(tutorPaymentStatuses).filter(p => p.status === 'pending').length;

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
          className="w-full md:w-auto px-5 py-3 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] border border-blue-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <QrCode className="w-5 h-5" />
          <span>فتح كارنيه الـ QR للطباعة والمسح</span>
        </button>
      </div>

      {/* 2. Key Stats Row (Includes Fee / Payment Status Badge) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">المدرسين المسجل معهم</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1E3A8A]">3 مدرسين</p>
          <span className="text-[11px] text-[#10B981] font-bold">كيمياء، رياضيات، فيزياء</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">حصص هذا الأسبوع</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1E3A8A]">3 حصص</p>
          <span className="text-[11px] text-[#2563EB] font-bold">الحصة القادمة: الأحد 04:30 م</span>
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

        {/* Payment / Installment Status Card */}
        <div 
          onClick={() => onNavigate('/student/payments')}
          className="bg-white border border-[#E5E7EB] hover:border-blue-300 rounded-2xl p-5 space-y-2 cursor-pointer transition-all hover:shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">حالة مصاريف الشهر</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-[#2563EB] transition-colors">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingPaymentsCount > 0 ? (
              <Badge variant="warning" size="sm" icon={<Clock className="w-3 h-3" />}>
                قسط قادم مستحق
              </Badge>
            ) : (
              <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                مدفوع بالكامل
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between pt-0.5 text-[11px]">
            <span className="text-gray-500">مستحق: <strong>440 ج.م</strong> (الفيزياء)</span>
            <span className="text-[#2563EB] font-bold group-hover:underline">التفاصيل ←</span>
          </div>
        </div>

      </div>

      {/* 2.5. Visual Payment & Installment Badges Overview Banner */}
      <div className="bg-gradient-to-r from-blue-50/70 via-white to-amber-50/50 border border-[#E5E7EB] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E3A8A]">مؤشر سداد مصاريف الحصص والأقساط</h3>
              <p className="text-[11px] text-[#6B7280]">متابعة فورية للمصاريف المسددة والأقساط المستحقة لكل مادة دراسية</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('/student/payments')}
            className="self-start sm:self-center text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] bg-white border border-blue-200 hover:border-blue-300 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>عرض سجل الإيصالات والمدفوعات</span>
          </button>
        </div>

        {/* Badges per subject / tutor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Chemistry - Paid */}
          <div className="bg-white border border-emerald-100 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1E3A8A]">الكيمياء — أ. حسام إبراهيم</div>
                <div className="text-[10px] text-gray-500">480 ج.م / شهر أغسطس</div>
              </div>
            </div>
            <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
              مدفوع
            </Badge>
          </div>

          {/* Mathematics - Paid */}
          <div className="bg-white border border-emerald-100 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1E3A8A]">الرياضيات — م. أحمد عصام</div>
                <div className="text-[10px] text-gray-500">560 ج.م / شهر أغسطس</div>
              </div>
            </div>
            <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
              مدفوع
            </Badge>
          </div>

          {/* Physics - Due / Pending */}
          <div className="bg-white border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs ring-1 ring-amber-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1E3A8A]">الفيزياء — أ. طارق عبد العليم</div>
                <div className="text-[10px] text-amber-800 font-semibold">440 ج.م • يستحق 15 أغسطس</div>
              </div>
            </div>
            <Badge variant="warning" size="sm" icon={<AlertCircle className="w-3 h-3" />}>
              قسط مستحق
            </Badge>
          </div>
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
            {upcomingLessons.map((lesson) => {
              const paymentInfo = tutorPaymentStatuses[lesson.tutorId || ''] || { status: 'paid', label: 'مدفوع' };
              const isPaid = paymentInfo.status === 'paid';

              return (
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[#1E3A8A]">
                          {lesson.subject} — {lesson.topic}
                        </h4>
                        <Badge
                          variant={lesson.type === 'center' ? 'info' : 'navy'}
                          size="sm"
                        >
                          {lesson.type === 'center' ? 'سنتر' : 'أونلاين'}
                        </Badge>
                        {/* Visual Payment Badge on each lesson */}
                        <Badge
                          variant={isPaid ? 'success' : 'warning'}
                          size="sm"
                          icon={isPaid ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        >
                          {isPaid ? 'المصاريف: مدفوعة' : 'المصاريف: قسط مستحق'}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1">
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
                    <button
                      onClick={() => onNavigate('/student/qr-card')}
                      className="px-3 py-2 bg-gray-50 hover:bg-[#EFF6FF] text-[#2563EB] rounded-xl border border-gray-200 cursor-pointer text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                      title="كود الحضور"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>كود الحضور</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: My Tutors Quick List with Payment Badges */}
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
            {myTutors.map((tutor) => {
              const paymentInfo = tutorPaymentStatuses[tutor.id] || { status: 'paid', label: 'مدفوع' };
              const isPaid = paymentInfo.status === 'paid';

              return (
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
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-[#1E3A8A]">{tutor.name}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-[#2563EB] font-semibold">{tutor.subject}</span>
                        <span>•</span>
                        <Badge
                          variant={isPaid ? 'success' : 'warning'}
                          size="sm"
                        >
                          {isPaid ? 'مدفوع' : 'مستحق'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectTutor(tutor.id)}
                    className="text-xs text-[#2563EB] font-bold hover:underline cursor-pointer"
                  >
                    الملف
                  </button>
                </div>
              );
            })}

            <button
              onClick={() => onNavigate('/search')}
              className="w-full py-2.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2 active:scale-95"
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

