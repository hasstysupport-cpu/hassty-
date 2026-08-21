import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  MessageCircle,
  Bell,
  ArrowLeft,
  DollarSign,
  MapPin,
  Sparkles,
  QrCode,
  Plus,
  UserPlus,
  FileText,
  AlertTriangle,
  X,
  Send,
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import { ALL_EGYPT_GRADES } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../lib/AuthContext';

interface ParentDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const ParentDashboardPage: React.FC<ParentDashboardPageProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const parentName = user?.name || 'ولي الأمر';
  const [children, setChildren] = useState<any[]>([
    {
      id: 'child-1',
      name: 'أحمد ' + (user?.name ? user.name.split(' ')[0] : 'محمود'),
      grade: 'الصف الثالث الثانوي (علمي علوم)',
      qrCode: 'STU-EG849201',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      attendanceRate: 100,
      tutorsCount: 0,
      totalSessions: 0,
      presentOnTime: 0,
      presentLate: 0,
      absentCount: 0,
      verified: true
    }
  ]);
  const [selectedChildId, setSelectedChildId] = useState('child-1');
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  // Add child form
  const [newChildName, setNewChildName] = useState('');
  const [newChildCode, setNewChildCode] = useState('');
  const [newChildGrade, setNewChildGrade] = useState(ALL_EGYPT_GRADES[4]);
  const [addChildSuccess, setAddChildSuccess] = useState(false);

  // Safety report form
  const [reportReason, setReportReason] = useState('إلغاء الحصة المفاجئ بدون إشعار مبكر');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const currentChild = children.find((c) => c.id === selectedChildId) || children[0] || {
    id: 'default',
    name: 'الطالب',
    grade: 'المرحلة الثانوية',
    qrCode: 'STU-000000',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    attendanceRate: 100,
    tutorsCount: 0,
    presentOnTime: 0,
    presentLate: 0,
    absentCount: 0
  };
  const recentActivities: any[] = [];

  const handleAddChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName || !newChildCode) return;

    const newChildObj = {
      id: `child-${Date.now()}`,
      name: newChildName,
      grade: newChildGrade,
      qrCode: newChildCode,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      attendanceRate: 100,
      tutorsCount: 1,
      totalSessions: 1,
      presentOnTime: 1,
      presentLate: 0,
      absentCount: 0,
      verified: true
    };

    setChildren([...children, newChildObj]);
    setAddChildSuccess(true);
    setTimeout(() => {
      setAddChildSuccess(false);
      setIsAddChildModalOpen(false);
      setNewChildName('');
      setNewChildCode('');
    }, 1500);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setIsReportModalOpen(false);
      setReportDetails('');
    }, 2500);
  };

  return (
    <div className="space-y-8 text-right">
      
      {/* 1. Multi-Child Selector Bar */}
      <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#2563EB]" />
          <span className="text-xs sm:text-sm font-black text-[#1E3A8A]">
            الأبناء المسجلين في حسابك ({children.length}):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                child.id === currentChild.id
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <img
                src={child.avatarUrl}
                alt={child.name}
                className="w-5 h-5 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span>{child.name}</span>
              <span className="text-[10px] opacity-80">({child.grade.split(' ')[0]})</span>
            </button>
          ))}

          <button
            onClick={() => setIsAddChildModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-[#EFF6FF] text-[#2563EB] hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ربط ابن جديد</span>
          </button>
        </div>
      </div>

      {/* 2. Selected Student Header */}
      <div className="bg-[#1E3A8A] text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <img
            src={currentChild.avatarUrl}
            alt={currentChild.name}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white ring-2 ring-blue-300 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full text-blue-100">
                متابعة الحصص
              </span>
              <span className="text-xs text-blue-200">{currentChild.grade}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {currentChild.name}
            </h2>
            <p className="text-xs text-blue-200 mt-1">
              كود البطاقة المربوطة: <strong className="font-mono text-white">{currentChild.qrCode}</strong>
            </p>
          </div>
        </div>

        {/* WhatsApp Alert Status Pill & Safety Report Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="bg-white/10 border border-white/20 p-3.5 rounded-2xl flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-300 block">إشعارات الواتساب نشطة ✓</span>
              <span className="text-[11px] text-blue-100 font-mono">01234567890</span>
            </div>
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="w-full sm:w-auto px-3.5 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-300/40 text-red-200 hover:text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>إبلاغ عن مشكلة</span>
          </button>
        </div>
      </div>

      {/* 3. Overview Stats Cards with Attendance Window Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
        
        <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">المعلمين المسجلين</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1E3A8A]">{currentChild.tutorsCount} معلمين</p>
          <span className="text-[11px] text-[#2563EB] font-bold">كيمياء، فيزياء، لغة عربية</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">حاضر بالموعد (أخضر)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#10B981]">{currentChild.presentOnTime} حصة</p>
          <span className="text-[11px] text-emerald-700 font-bold">في نافذة الـ 15 دقيقة الأولى</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">حاضر متأخر (برتقالي)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">{currentChild.presentLate} حصص</p>
          <span className="text-[11px] text-amber-700 font-bold">وصل بين 15 د إلى نصف الحصة</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">نسبة الالتزام الكلية</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1E3A8A]">{currentChild.attendanceRate}%</p>
          <span className="text-[11px] text-emerald-700 font-bold">مستوى ممتاز ومستقر</span>
        </div>

      </div>

      {/* 4. Real-Time Activity Feed & Educational Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Live Feed & Notes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <span>سجل الحضور اللحظي لـ ({currentChild.name})</span>
            </h3>
            <button
              onClick={() => onNavigate('/parent/attendance')}
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>عرض سجل الحضور الكامل</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-3">
            {recentActivities.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentActivities.map((act) => (
                  <div key={act.id} className="pt-3.5 first:pt-0 flex flex-col gap-2 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            act.status === 'present'
                              ? 'bg-emerald-50 text-[#10B981]'
                              : 'bg-red-50 text-[#EF4444]'
                          }`}
                        >
                          {act.status === 'present' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        </div>

                        <div>
                          <h4 className="font-bold text-[#1E3A8A] text-sm">
                            {act.status === 'present' ? 'حضر بنجاح: ' : 'غياب: '}
                            {act.subject} مع {act.tutorName}
                          </h4>
                          <p className="text-[11px] text-[#6B7280] mt-0.5">
                            {act.center} — مسح كود الـ QR الساعة {act.time}
                          </p>
                          <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                            {act.date}
                          </span>
                        </div>
                      </div>

                      <Badge variant={act.status === 'present' ? 'success' : 'danger'} size="sm">
                        {act.status === 'present' ? 'حاضر في الموعد ✅' : 'غائب'}
                      </Badge>
                    </div>

                    {/* Educational Follow-up note from teacher if present */}
                    {act.teacherNotes && (
                      <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-[11px] text-[#1E3A8A] flex items-start gap-2">
                        <FileText className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                        <div>
                          <strong>ملاحظة وواجب المعلم:</strong> {act.teacherNotes}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 space-y-2">
                <Clock className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-xs font-bold text-gray-700">لا توجد سجلات حضور مسجلة حتى الآن</p>
                <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                  بمجرد قيام الطالب بمسح كود الـ QR عند دخول الحصة في السنتر، ستصلك الإشعارات اللحظية ويظهر السجل هنا فوراً.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Links */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#1E3A8A]">خدمات أولياء الأمور</h3>

          <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-3 shadow-xs">
            <button
              onClick={() => onNavigate('/parent/attendance')}
              className="w-full p-3.5 bg-gray-50 hover:bg-[#EFF6FF] text-right rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-[#1E3A8A] block">سجل الحضور والتظلمات</span>
                <span className="text-[10px] text-[#6B7280]">طلب حصة تعويضية أو مراجعة حضور</span>
              </div>
              <ArrowLeft className="w-4 h-4 text-[#2563EB]" />
            </button>

            <button
              onClick={() => onNavigate('/parent/payments')}
              className="w-full p-3.5 bg-gray-50 hover:bg-[#EFF6FF] text-right rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-[#1E3A8A] block">سجل المدفوعات والإيصالات</span>
                <span className="text-[10px] text-[#6B7280]">فواتير واشتراكات الأبناء</span>
              </div>
              <ArrowLeft className="w-4 h-4 text-[#2563EB]" />
            </button>

            <button
              onClick={() => onNavigate('/parent/settings')}
              className="w-full p-3.5 bg-gray-50 hover:bg-[#EFF6FF] text-right rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-[#1E3A8A] block">إعدادات أرقام الواتساب والطوارئ</span>
                <span className="text-[10px] text-[#6B7280]">تعديل رقم ولي الأمر ورقم الطوارئ</span>
              </div>
              <ArrowLeft className="w-4 h-4 text-[#2563EB]" />
            </button>
          </div>
        </div>

      </div>

      {/* MODAL: Link / Add New Child */}
      <Modal
        isOpen={isAddChildModalOpen}
        onClose={() => setIsAddChildModalOpen(false)}
        title="ربط حساب ابن إضافي"
        subtitle="أدخل كود الطالب من بطاقة الـ QR الخاصة به"
        icon={<UserPlus className="w-6 h-6" />}
        maxWidth="md"
      >
        {addChildSuccess ? (
          <div className="py-6 text-center text-xs text-emerald-800 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-bold">تم ربط حساب الطالب بنجاح!</p>
          </div>
        ) : (
          <form onSubmit={handleAddChildSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                اسم الابن / الابنة <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: يوسف أحمد"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                المرحلة والصف الدراسي
              </label>
              <select
                value={newChildGrade}
                onChange={(e) => setNewChildGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                {ALL_EGYPT_GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                كود بطاقة الطالب (QR Code) <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: HST-2026-44910"
                value={newChildCode}
                onChange={(e) => setNewChildCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-center focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-[#1E3A8A]">
              سيتم إرسال رمز تحقق سريع عبر رسالة واتساب لتأكيد ملكية بطاقة الطالب.
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>تأكيد وربط الحساب</span>
            </button>
          </form>
        )}
      </Modal>

      {/* MODAL: Safety & Misconduct Report */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="إرسال بلاغ أو شكوى لإدارة المنصة"
        subtitle="نظام حماية الطلاب وأولياء الأمور — سرية تامة ومتابعة فورية"
        icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
        maxWidth="md"
      >
        {reportSubmitted ? (
          <div className="py-6 text-center text-xs text-emerald-800 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-bold">تم استلام البلاغ برقم تذكرة #SAF-2026-901</p>
            <p className="text-[#6B7280]">سيقوم فريق إدارة الجودة بالتواصل معكم ومراجعة الأمر مع المعلم فوراً.</p>
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                نوع الشكوى / المخالفة
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
              >
                <option value="إلغاء الحصة المفاجئ بدون إشعار مبكر">إلغاء الحصة المفاجئ بدون إشعار مبكر</option>
                <option value="عدم تسجيل الحضور بالـ QR في الموعد">عدم تسجيل الحضور بالـ QR في الموعد</option>
                <option value="سلوك أو أسلوب غير لائق من المعلم أو السنتر">سلوك أو أسلوب غير لائق من المعلم أو السنتر</option>
                <option value="خلاف في قيمة المصاريف أو التحصيل">خلاف في قيمة المصاريف أو التحصيل</option>
                <option value="أخرى">سبب آخر</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                تفاصيل البلاغ
              </label>
              <textarea
                rows={4}
                required
                placeholder="اشرح ما حدث بالتفصيل للمساعدة في حل المشكلة بسرعة..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#EF4444] hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Send className="w-4 h-4" />
              <span>إرسال البلاغ للإدارة للمتابعة</span>
            </button>
          </form>
        )}
      </Modal>

    </div>
  );
};
