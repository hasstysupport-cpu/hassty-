import React, { useState } from 'react';
import {
  Users,
  ScanLine,
  Layers,
  Star,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  ArrowLeft,
  Calendar,
  Sparkles,
  QrCode,
  Check,
  X,
  Phone,
  MessageCircle,
  FileText,
  AlertCircle,
  ShieldCheck,
  Award
} from 'lucide-react';
import { BookingRequest } from '../../types';
import { Badge } from '../../components/common/Badge';
import { TeacherAttendanceChart } from '../../components/teacher/TeacherAttendanceChart';
import { useAuth } from '../../lib/AuthContext';
import { Send, ExternalLink } from 'lucide-react';

interface TeacherDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const TeacherDashboardPage: React.FC<TeacherDashboardPageProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const teacherName = user?.name || 'المعلم';
  const teacherSubject = user?.profileData?.subject || 'المادة الأكاديمية';
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [activeSessionNotes, setActiveSessionNotes] = useState('');
  const [notesSuccess, setNotesSuccess] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleApproveRequest = (reqId: string, studentName: string) => {
    setBookingRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'approved' as const } : r))
    );
    setActionNotice(`تمت الموافقة على طلب انضمام الطالب (${studentName}) وإرسال إشعار واتساب لولي الأمر بنجاح ✅`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRejectRequest = (reqId: string, studentName: string) => {
    setBookingRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'rejected' as const, rejectionReason: 'المجموعة مكتملة العدد حالياً' } : r))
    );
    setActionNotice(`تم الاعتذار عن طلب الطالب (${studentName}) وإعلامه بالمواعيد البديلة المتاحة.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionNotes) return;
    setNotesSuccess(true);
    setTimeout(() => {
      setNotesSuccess(false);
      setActiveSessionNotes('');
    }, 3000);
  };

  const pendingRequests = bookingRequests.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-8 text-right">
      
      {/* 1. Welcome & Fast Scan Hero Card */}
      <div className="bg-[#1E3A8A] text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center lg:text-right">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 px-3 py-1 rounded-full text-blue-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>لوحة المعلم المعتمد</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            أهلاً بك، أستاذ {teacherName} 👋
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            مادة {teacherSubject} — مرحباً بك في منصة حِصّتي لإدارة الحصص والطلاب والـ QR الذكي.
          </p>
        </div>

        {/* Big Actions: Open QR Hub for Attendance, Add Student & Confirm Fees */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => onNavigate('/teacher/scan')}
            className="w-full sm:w-auto px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ScanLine className="w-5 h-5" />
            <span>تسجيل حضور (QR)</span>
          </button>

          <button
            onClick={() => onNavigate('/teacher/scan')}
            className="w-full sm:w-auto px-4 py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>إضافة طالب بالـ QR</span>
          </button>

          <button
            onClick={() => onNavigate('/teacher/groups')}
            className="w-full sm:w-auto px-4 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Layers className="w-4 h-4" />
            <span>إدارة المجموعات</span>
          </button>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-[#1E3A8A] text-xs font-bold flex items-center gap-2.5 animate-drawer">
          <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Telegram Verification Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-right">
          <div className="w-12 h-12 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-sm font-black text-[#1E3A8A]">توثيق وتفعيل حساب المعلم</h4>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                خطوة هامة
              </span>
            </div>
            <p className="text-xs text-gray-600">
              لكي يظهر حسابك للطلاب وأولياء الأمور في نتائج البحث وتفعيل الشارة الزرقاء، يرجى التواصل مع الدعم عبر Telegram.
            </p>
          </div>
        </div>

        <a
          href="https://t.me/MCV_M"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto shrink-0 px-5 py-3 bg-[#229ED9] hover:bg-[#1E88E5] text-white font-bold text-xs rounded-2xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>تواصل مع الدعم (t.me/MCV_M)</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>

      {/* 2. Key Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">إجمالي الطلاب</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1E3A8A]">310 طالب</p>
          <span className="text-[10px] text-[#10B981] font-bold">شريحة العمولة: 1.0% فقط</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">حضور اليوم بالنافذة</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#10B981]">28 طالب</p>
          <span className="text-[10px] text-[#6B7280]">24 في الموعد | 4 متأخرين</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">طلبات الحجز الجديدة</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">{pendingRequests.length} طلبات</p>
          <span className="text-[10px] text-amber-700 font-bold">تحتاج موافقتك أو رفضك</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">مؤشر الجودة والاستقرار</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1E3A8A]">98.5%</p>
          <span className="text-[10px] text-emerald-700 font-bold">معدل استمرار والتزام ممتاز</span>
        </div>

      </div>

      {/* 3. NEW: Teacher Booking Requests Approval / Rejection Section */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1E3A8A]">
                طلبات حجز الحصص الواردة ({bookingRequests.length})
              </h3>
              <p className="text-xs text-[#6B7280]">
                طلبات انضمام الطلاب للمجموعات — يمكنك قبول الطلب لحجز المقعد أو الاعتذار
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            {pendingRequests.length} قيد الانتظار
          </span>
        </div>

        {bookingRequests.length === 0 ? (
          <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-8 text-center space-y-2">
            <Clock className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs font-bold text-gray-600">لا توجد طلبات حجز معلقة حالياً</p>
            <p className="text-[11px] text-gray-400">ستظهر هنا طلبات الطلاب وأولياء الأمور فور تقديمها لتتمكن من اعتمادها أو الاعتذار عنها بنقرة واحدة.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {bookingRequests.map((req) => (
              <div
                key={req.id}
                className={`p-4 rounded-2xl border transition-all text-xs space-y-3 ${
                  req.status === 'approved'
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : req.status === 'rejected'
                    ? 'bg-gray-50 border-gray-200 opacity-70'
                    : 'bg-[#F8FAFF] border-blue-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-sm font-bold text-[#1E3A8A]">{req.studentName}</strong>
                      <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'} size="sm">
                        {req.status === 'approved' ? 'تمت الموافقة ✓' : req.status === 'rejected' ? 'تم الاعتذار ✕' : 'قيد الموافقة'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#6B7280]">{req.grade} — {req.groupName}</p>
                  </div>
                  <span className="text-[11px] font-mono text-gray-500">{req.date}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-gray-500 block">الموعد المطلوب:</span>
                    <strong className="text-[#1F2937]">{req.slotTime}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">واتساب ولي الأمر:</span>
                    <strong className="text-[#2563EB] font-mono" dir="ltr">{req.parentPhone}</strong>
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleApproveRequest(req.id, req.studentName)}
                      className="flex-1 py-2 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>قبول واعتماد الحجز</span>
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id, req.studentName)}
                      className="py-2 px-3 bg-red-50 hover:bg-red-100 text-[#EF4444] border border-red-200 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>اعتذار</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Attendance Window Rule & Quick Session Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Attendance Window Rule Box */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#2563EB]" />
            <h3 className="text-base font-bold text-[#1E3A8A]">
              نظام "نافذة تسجيل الحضور الذكية"
            </h3>
          </div>
          <p className="text-xs text-[#6B7280]">
            توزيع وتصنيف أوقات حضور الطلاب تلقائياً وفق وقت الحصة:
          </p>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <strong className="text-emerald-900">في الموعد (حتى 15 دقيقة بعد البداية):</strong>
              </div>
              <span className="text-emerald-700 font-bold">حاضر (أخضر ✅)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <strong className="text-amber-900">من 15 دقيقة وحتى منتصف الحصة:</strong>
              </div>
              <span className="text-amber-700 font-bold">حاضر متأخر (برتقالي ⏰)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-red-50 border border-red-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <strong className="text-red-900">بعد انقضاء نصف الحصة:</strong>
              </div>
              <span className="text-red-700 font-bold">غائب (أحمر ❌)</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-[#1E3A8A] flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>يتم إرسال إشعار واتساب لولي الأمر تلقائياً إذا تأخر الطالب لأكثر من 10 دقائق.</span>
          </div>
        </div>

        {/* Quick Educational Follow-up Notes */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2563EB]" />
            <h3 className="text-base font-bold text-[#1E3A8A]">
              إضافة متابعة دراسية وواجب الحصة
            </h3>
          </div>
          <p className="text-xs text-[#6B7280]">
            تظهر هذه الملاحظات والواجبات فورياً في حساب الطالب وحساب ولي الأمر
          </p>

          <form onSubmit={handleSaveNotes} className="space-y-3">
            <textarea
              rows={4}
              placeholder="مثال: تم شرح الباب الثاني (الروابط الكيميائية)، الطالب شارك بامتياز. الواجب: حل تدريبات صـ 45 حتى 48 من المذكرة."
              value={activeSessionNotes}
              onChange={(e) => setActiveSessionNotes(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
            />

            {notesSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>تم حفظ الملاحظات وإرسال ملخص الحصة لأولياء الأمور بنجاح!</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>نشر المتابعة والواجب للطلاب وأولياء الأمور</span>
            </button>
          </form>
        </div>

      </div>

      {/* 5. Monthly Sessions & Attendance Analytics (Recharts) */}
      <TeacherAttendanceChart />

    </div>
  );
};
