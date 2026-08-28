import React, { useState, useEffect } from 'react';
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
  GraduationCap,
  Trash2,
  RefreshCw,
  Phone,
  Check
} from 'lucide-react';
import { ALL_EGYPT_GRADES } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../lib/AuthContext';
import { getCleanAvatarUrl } from '../../lib/avatarHelper';
import {
  ParentLinkRequest,
  subscribeToParentRequests,
  findStudentByCodeOrPhone,
  sendParentLinkRequest,
  removeParentChildLink
} from '../../lib/parentStudentService';

interface ParentDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const ParentDashboardPage: React.FC<ParentDashboardPageProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const parentName = user?.name || 'ولي الأمر';

  const [parentRequests, setParentRequests] = useState<ParentLinkRequest[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Add child state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [foundStudent, setFoundStudent] = useState<any | null>(null);
  const [searchError, setSearchError] = useState('');
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [linkSuccessMessage, setLinkSuccessMessage] = useState('');

  // Unlink state
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  // Safety report form
  const [reportReason, setReportReason] = useState('إلغاء الحصة المفاجئ بدون إشعار مبكر');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Real-time Supabase subscription to this parent's link requests
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToParentRequests(user.uid, (reqs) => {
      setParentRequests(reqs);
      if (reqs.length > 0) {
        setSelectedChildId((prev) => (prev && reqs.some(r => r.id === prev) ? prev : reqs[0].id));
      }
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Combine parent requests into selectable children
  const childrenList = parentRequests.map((req) => ({
    id: req.id,
    studentId: req.studentId,
    name: req.studentName,
    grade: req.studentGrade,
    qrCode: req.studentCode,
    avatarUrl: getCleanAvatarUrl(req.studentAvatarUrl, 'student', req.studentName),
    status: req.status,
    createdAt: req.createdAt,
    respondedAt: req.respondedAt,
    declineReason: req.declineReason,
    attendanceRate: req.status === 'approved' ? 100 : 0,
    tutorsCount: req.status === 'approved' ? 2 : 0,
    totalSessions: req.status === 'approved' ? 8 : 0,
    presentOnTime: req.status === 'approved' ? 7 : 0,
    presentLate: req.status === 'approved' ? 1 : 0,
    absentCount: 0,
    verified: req.status === 'approved'
  }));

  // Selected child or fallback default demo
  const currentChild = childrenList.find((c) => c.id === selectedChildId) || childrenList[0] || {
    id: 'placeholder',
    studentId: '',
    name: 'أحمد محمود',
    grade: 'الصف الثالث الثانوي',
    qrCode: 'HASSTY-EG8492',
    avatarUrl: getCleanAvatarUrl('', 'student', 'أحمد محمود'),
    status: 'approved',
    attendanceRate: 100,
    tutorsCount: 0,
    presentOnTime: 0,
    presentLate: 0,
    absentCount: 0,
    verified: true
  };

  /**
   * Search student by code or phone in Modal
   */
  const handleSearchStudent = async () => {
    if (!searchQuery.trim()) {
      setSearchError('يرجى إدخال كود الطالب أو رقم هاتفه أولاً.');
      setFoundStudent(null);
      return;
    }
    setIsSearchingStudent(true);
    setSearchError('');
    setFoundStudent(null);

    try {
      const student = await findStudentByCodeOrPhone(searchQuery.trim());
      if (student) {
        setFoundStudent(student);
        setSearchError('');
      } else {
        setSearchError(`لم يتم العثور على طالب مسجل بالكود أو الرقم (${searchQuery.trim()}). يرجى التأكد من كود البطاقة الخاص بالطالب.`);
      }
    } catch (err: any) {
      setSearchError('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSearchingStudent(false);
    }
  };

  /**
   * Send the link request to student
   */
  const handleSendLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    if (!foundStudent && !searchQuery.trim()) return;

    setIsSubmittingLink(true);
    setSearchError('');

    try {
      const targetCode = foundStudent?.qrCode || searchQuery.trim();
      const res = await sendParentLinkRequest(
        {
          uid: user.uid,
          name: parentName,
          phone: user.phone || user.profileData?.phone || '',
          email: user.email || '',
          avatarUrl: user.avatarUrl || user.profileData?.avatarUrl || '',
        },
        targetCode,
        foundStudent?.name
      );

      if (res.success) {
        setLinkSuccessMessage(res.message);
        setTimeout(() => {
          setLinkSuccessMessage('');
          setIsAddChildModalOpen(false);
          setSearchQuery('');
          setFoundStudent(null);
          if (res.request) {
            setSelectedChildId(res.request.id);
          }
        }, 2200);
      } else {
        setSearchError(res.message);
      }
    } catch (err: any) {
      setSearchError(err.message || 'حدث خطأ أثناء إرسال الطلب.');
    } finally {
      setIsSubmittingLink(false);
    }
  };

  /**
   * Unlink or cancel request
   */
  const handleUnlinkChild = async (reqId: string, studentId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في إلغاء ربط هذا الحساب؟')) return;
    setUnlinkingId(reqId);
    try {
      await removeParentChildLink(reqId, studentId, user?.uid || '');
      setSelectedChildId('');
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء إلغاء الربط.');
    } finally {
      setUnlinkingId(null);
    }
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
    <div className="space-y-8 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">
      
      {/* 1. Multi-Child Selector Bar */}
      <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#2563EB]" />
          <span className="text-xs sm:text-sm font-black text-[#1E3A8A]">
            الأبناء المسجلين في حسابك ({childrenList.length}):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {childrenList.map((child) => {
            const isSelected = child.id === currentChild.id;
            return (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md'
                    : child.status === 'pending'
                    ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                    : child.status === 'rejected'
                    ? 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <img
                  src={child.avatarUrl}
                  alt={child.name}
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <span>{child.name}</span>
                {child.status === 'pending' && (
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-md font-bold">
                    معلق ⏳
                  </span>
                )}
                {child.status === 'rejected' && (
                  <span className="text-[10px] bg-red-200 text-red-900 px-1.5 py-0.2 rounded-md font-bold">
                    مرفوض ✕
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => {
              setSearchError('');
              setFoundStudent(null);
              setSearchQuery('');
              setIsAddChildModalOpen(true);
            }}
            className="px-4 py-2 rounded-2xl text-xs font-bold bg-[#EFF6FF] text-[#2563EB] hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة / ربط ابن جديد</span>
          </button>
        </div>
      </div>

      {/* Status Warning Banner if current selected child is Pending or Rejected */}
      {currentChild.status === 'pending' && (
        <div className="p-5 bg-gradient-to-r from-amber-50 via-yellow-50 to-white border border-amber-200 rounded-3xl text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black">طلب الربط في انتظار موافقة الطالب ⏳</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                تم إرسال طلب ربط الحساب إلى الطالب <strong>({currentChild.name})</strong>. ستظهر لك بياناته وحضوره فور قيامه بالموافقة من حسابه.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleUnlinkChild(currentChild.id, currentChild.studentId)}
            disabled={unlinkingId === currentChild.id}
            className="px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            إلغاء الطلب
          </button>
        </div>
      )}

      {currentChild.status === 'rejected' && (
        <div className="p-5 bg-gradient-to-r from-red-50 via-rose-50 to-white border border-red-200 rounded-3xl text-red-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black">تم رفض طلب الربط من قِبل الطالب</h4>
              <p className="text-xs text-red-700 mt-0.5">
                {currentChild.declineReason || 'قام الطالب برفض طلب ربط الحساب.'} يمكنك إعادة المحاولة والتأكد من الكود.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUnlinkChild(currentChild.id, currentChild.studentId)}
              className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              حذف السجل
            </button>
            <button
              onClick={() => {
                setSearchQuery(currentChild.qrCode);
                setIsAddChildModalOpen(true);
              }}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              إعادة إرسال الطلب
            </button>
          </div>
        </div>
      )}

      {/* 2. Selected Student Header */}
      <div className="bg-[#1E3A8A] text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <img
            src={currentChild.avatarUrl}
            alt={currentChild.name}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white ring-2 ring-blue-300 shadow-sm bg-white"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                currentChild.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
              }`}>
                {currentChild.status === 'approved' ? 'مربوط ومعتمد ✓' : 'في انتظار الموافقة ⏳'}
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
              <span className="text-[11px] text-blue-100 font-mono">{user?.phone || '010XXXXXXXX'}</span>
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
          <span className="text-[11px] text-[#2563EB] font-bold">حسب جدول مجموعات الطالب</span>
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
          <span className="text-[11px] text-emerald-700 font-bold">مستوى مستقر</span>
        </div>

      </div>

      {/* 4. Educational Guidance & Fast Linking Quick Info */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#1E3A8A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
              <span>إدارة الأبناء وطلبات الربط المعتمدة</span>
            </h3>
            <p className="text-xs text-gray-500">
              يمكنك ربط أكثر من ابن بمجرد إدخال كود بطاقته الرقمية، وسيقوم النظام بإرسال طلب رسمي للطالب للموافقة والربط الفوري.
            </p>
          </div>

          <button
            onClick={() => {
              setSearchError('');
              setFoundStudent(null);
              setSearchQuery('');
              setIsAddChildModalOpen(true);
            }}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة ابن آخر بالـ QR</span>
          </button>
        </div>
      </div>

      {/* MODAL: Add Child / Send Link Request */}
      <Modal
        isOpen={isAddChildModalOpen}
        onClose={() => {
          setIsAddChildModalOpen(false);
          setFoundStudent(null);
          setSearchError('');
        }}
        title="إضافة وربط ابن جديد بحسابك"
        subtitle="أدخل كود بطاقة الطالب وسيتم إرسال طلب ربط فوري له للموافقة"
        icon={<UserPlus className="w-6 h-6 text-[#2563EB]" />}
        maxWidth="md"
      >
        {linkSuccessMessage ? (
          <div className="py-6 text-center space-y-3 animate-in fade-in duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-base font-black text-[#1E3A8A]">تم إرسال الطلب بنجاح! 🎉</h4>
            <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
              {linkSuccessMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendLinkSubmit} className="space-y-4 pt-1 text-right">
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                كود بطاقة الطالب (QR Code) أو رقم الهاتف <span className="text-red-500">*</span>
              </label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="مثال: HASSTY-98120 أو رقم هاتف الطالب"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (foundStudent) setFoundStudent(null);
                    if (searchError) setSearchError('');
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={handleSearchStudent}
                  disabled={isSearchingStudent || !searchQuery.trim()}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-black text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isSearchingStudent ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>بحث</span>
                </button>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">
                يمكنك الحصول على الكود من شاشة البروفايل أو كارنيه الـ QR الخاص بالابن.
              </span>
            </div>

            {/* Found Student Card */}
            {foundStudent && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center gap-3 animate-in fade-in duration-200">
                <img
                  src={getCleanAvatarUrl(foundStudent.avatarUrl, 'student', foundStudent.name)}
                  alt={foundStudent.name}
                  className="w-12 h-12 rounded-xl object-cover border border-blue-200 bg-white shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#1E3A8A] truncate">
                      {foundStudent.name}
                    </span>
                    <span className="text-[10px] font-bold bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                      طالب مسجل
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    {foundStudent.grade || 'المرحلة الثانوية'} — كود: <strong className="font-mono">{foundStudent.qrCode || searchQuery}</strong>
                  </p>
                </div>
              </div>
            )}

            {searchError && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{searchError}</span>
              </p>
            )}

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-600 leading-relaxed">
              💡 <strong>كيف تعمل آلية الموافقة؟</strong> بمجرد الضغط على إرسال، يظهر إشعار واضح في حساب الطالب لطلب موافقته على اعتمادك كولي أمر، وفور ضغطه على موافقة تظهر لك بياناته بالكامل.
            </div>

            <button
              type="submit"
              disabled={isSubmittingLink || (!foundStudent && !searchQuery.trim())}
              className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmittingLink ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>إرسال طلب ربط لولي الأمر</span>
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
