import React, { useState, useEffect } from 'react';
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
  Check,
  GraduationCap,
  UserCog,
  ShieldCheck,
  UserCheck,
  UserX,
  Phone,
  Mail,
  X
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../lib/AuthContext';
import { getCleanAvatarUrl } from '../../lib/avatarHelper';
import {
  ParentLinkRequest,
  subscribeToStudentPendingRequests,
  respondToParentLinkRequest
} from '../../lib/parentStudentService';

interface StudentDashboardPageProps {
  onNavigate: (path: string) => void;
  onSelectTutor: (tutorId: string) => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({
  onNavigate,
  onSelectTutor,
}) => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<ParentLinkRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToStudentPendingRequests(user.uid, (requests) => {
      setPendingRequests(requests);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handleRespond = async (requestId: string, approve: boolean) => {
    setProcessingId(requestId);
    setActionAlert(null);
    try {
      const res = await respondToParentLinkRequest(requestId, approve);
      if (res.success) {
        setActionAlert({ type: 'success', message: res.message });
      } else {
        setActionAlert({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'حدث خطأ أثناء معالجة الطلب.' });
    } finally {
      setProcessingId(null);
    }
  };

  const student = {
    name: user?.name || 'طالب منصة حصتي',
    grade: user?.profileData?.grade || 'المرحلة الثانوية',
    qrCode: user?.profileData?.qrCode || (user?.uid ? `HASSTY-${user.uid.substring(0, 8).toUpperCase()}` : 'HASSTY-STU'),
    phone: user?.phone || '',
    avatarUrl: getCleanAvatarUrl(user?.avatarUrl || user?.profileData?.avatarUrl, 'student', user?.name),
    governorate: user?.governorate || user?.profileData?.governorate || 'القاهرة',
    area: user?.area || user?.profileData?.area || '',
  };
  const upcomingLessons: any[] = [];
  const myTutors: any[] = [];

  return (
    <div className="space-y-8 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">
      
      {/* Alert Feedback Toast */}
      {actionAlert && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs border animate-in fade-in slide-in-from-top-2 duration-200 ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-bold">{actionAlert.message}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 0. Pending Parent Link Requests Banner (High Priority) */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          {pendingRequests.map((req) => (
            <div
              key={req.id}
              className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white border-2 border-blue-300 rounded-3xl p-5 sm:p-6 shadow-md animate-in fade-in duration-300"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                
                {/* Left/Main Parent Info */}
                <div className="flex items-start sm:items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={getCleanAvatarUrl(req.parentAvatarUrl, 'parent', req.parentName)}
                      alt={req.parentName}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white ring-2 ring-blue-200 shadow-sm bg-white"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-black bg-blue-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                        طلب ربط ولي أمر جديد 👨‍👦
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium">
                        بتاريخ {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-[#1E3A8A]">
                      {req.parentName} يطلب اعتماد حسابه كولي أمر لك
                    </h3>

                    <p className="text-xs text-gray-600 mt-1 leading-relaxed max-w-xl">
                      عند موافقتك، سيتمكن ولي الأمر من متابعة مواعيد حصصك، وتأكيد تسجيل حضورك عبر الـ QR، واستلام تقارير الحضور والغياب.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-500 font-medium">
                      {req.parentPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span dir="ltr" className="font-mono">{req.parentPhone}</span>
                        </span>
                      )}
                      {req.parentEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{req.parentEmail}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions: Accept / Reject */}
                <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-blue-100">
                  <button
                    onClick={() => handleRespond(req.id, true)}
                    disabled={processingId === req.id}
                    className="flex-1 md:flex-initial px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {processingId === req.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    <span>موافقة واعتماد ولي الأمر</span>
                  </button>

                  <button
                    onClick={() => handleRespond(req.id, false)}
                    disabled={processingId === req.id}
                    className="px-4 py-3 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-200 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <UserX className="w-4 h-4" />
                    <span>رفض الطلب</span>
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 1. Welcome & ID Card Quick Banner */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <img
            src={student.avatarUrl}
            alt={student.name}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white ring-2 ring-blue-100 shadow-sm bg-gray-50 shrink-0"
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
              <span className="flex items-center gap-1 text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {student.governorate} {student.area ? `— ${student.area}` : ''}
              </span>
              <button
                onClick={() => onNavigate('/student/profile')}
                className="text-[#2563EB] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <UserCog className="w-3.5 h-3.5" />
                <span>تعديل الملف الشخصي</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => onNavigate('/student/profile')}
            className="w-full sm:w-auto px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <UserCog className="w-4 h-4 text-gray-500" />
            <span>تعديل البروفايل</span>
          </button>
          <button
            onClick={() => onNavigate('/student/qr-card')}
            className="w-full sm:w-auto px-5 py-3 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] border border-blue-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <QrCode className="w-5 h-5" />
            <span>فتح كارنيه الـ QR</span>
          </button>
        </div>
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
          <p className="text-2xl font-black text-[#1E3A8A]">{myTutors.length} مدرسين</p>
          <span className="text-[11px] text-gray-500 font-medium">مجموعات نشطة</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">حصص هذا الأسبوع</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1E3A8A]">{upcomingLessons.length} حصص</p>
          <span className="text-[11px] text-gray-500 font-medium">وفق جدولك الدراسي</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">حالة الحساب</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#10B981]">حساب مفعل</p>
          <span className="text-[11px] text-emerald-700 font-bold">جاهز لمسح الـ QR عند الحضور</span>
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
              onClick={() => onNavigate('/search')}
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>حجز موعد إضافي</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingLessons.length > 0 ? (
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
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1">
                        المعلم: {lesson.tutorName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onNavigate('/student/qr-card')}
                      className="px-3 py-2 bg-gray-50 hover:bg-[#EFF6FF] text-[#2563EB] rounded-xl border border-gray-200 cursor-pointer text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>كود الحضور</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] mx-auto flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#1E3A8A]">لا توجد حصص مجدولة بعد</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                تصفح قائمة المدرسين المعتمدين لموادك الدراسية واحجز حصصك بسهولة للحصول على مواعيدك مباشرة في هذا الجدول.
              </p>
              <button
                onClick={() => onNavigate('/search')}
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <BookOpen className="w-4 h-4" />
                <span>ابحث عن معلّمك الآن</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Col: My Tutors Quick List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#2563EB]" />
              <span>مدرسيني</span>
            </h3>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 space-y-4">
            {myTutors.length > 0 ? (
              myTutors.map((tutor) => (
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
              ))
            ) : (
              <div className="text-center py-6 space-y-2">
                <GraduationCap className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-xs font-bold text-gray-700">لم تشترك مع أي معلم بعد</p>
                <p className="text-[11px] text-gray-400">انضم لمجموعات معلميك المفضلين ليتم إدراجهم في قائمتك.</p>
              </div>
            )}

            <button
              onClick={() => onNavigate('/search')}
              className="w-full py-2.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
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

