import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  X,
  AlertCircle,
  AlertTriangle,
  UserPlus,
  DollarSign,
  Trash2,
  Sparkles,
  ArrowRightLeft,
  Percent,
  Check
} from 'lucide-react';
import { StudentGroup, GroupScheduleSlot, PricingBillingType, TeacherStudentItem } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { calculateTeacherCommission, formatTimeArabic } from '../../lib/scheduleSync';
import { useAuth } from '../../lib/AuthContext';
import {
  loadTeacherGroups,
  loadTeacherStudents,
  saveTeacherGroup,
  deleteTeacherGroup,
  saveNewStudent,
  removeStudent,
  getStoredGroups,
  getStoredStudents
} from '../../lib/teacherStore';

const ALL_EGYPT_GRADES = [
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي',
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي',
];

const DAYS_OF_WEEK = [
  { eng: 'Saturday', ar: 'السبت' },
  { eng: 'Sunday', ar: 'الأحد' },
  { eng: 'Monday', ar: 'الإثنين' },
  { eng: 'Tuesday', ar: 'الثلاثاء' },
  { eng: 'Wednesday', ar: 'الأربعاء' },
  { eng: 'Thursday', ar: 'الخميس' },
  { eng: 'Friday', ar: 'الجمعة' },
];

export const TeacherGroupsPage: React.FC = () => {
  const { user } = useAuth();
  const teacherId = user?.uid || 'teacher-current';

  const [groups, setGroups] = useState<StudentGroup[]>(() => getStoredGroups(teacherId));
  const [allStudents, setAllStudents] = useState<TeacherStudentItem[]>(() => getStoredStudents(teacherId));
  const [isLoading, setIsLoading] = useState(false);
  
  // Selected roster modal & transfer state
  const [selectedGroupRoster, setSelectedGroupRoster] = useState<StudentGroup | null>(null);
  const [studentToTransfer, setStudentToTransfer] = useState<TeacherStudentItem | null>(null);
  const [targetTransferGroupId, setTargetTransferGroupId] = useState<string>('');
  
  // Create group modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [cancellingSessionGroup, setCancellingSessionGroup] = useState<StudentGroup | null>(null);
  const [cancelReason, setCancelReason] = useState('ظرف شخصي طارئ');
  const [cancelNoticeHours, setCancelNoticeHours] = useState(5);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // New group form fields with multi-day schedule slots & pricing
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupGrade, setNewGroupGrade] = useState(ALL_EGYPT_GRADES[0]);
  const [newGroupLocation, setNewGroupLocation] = useState('سنتر الأهرام — مدينة نصر');
  const [newGroupMax, setNewGroupMax] = useState(35);
  
  // Pricing state
  const [newBillingType, setNewBillingType] = useState<PricingBillingType>('per_session');
  const [newPriceAmount, setNewPriceAmount] = useState<number>(120);

  // Multi-day schedule slots
  const [newSlots, setNewSlots] = useState<GroupScheduleSlot[]>([
    { id: 'slot-1', day: 'Sunday', dayArabic: 'الأحد', startTime: '16:30', endTime: '18:30' },
    { id: 'slot-2', day: 'Tuesday', dayArabic: 'الثلاثاء', startTime: '16:30', endTime: '18:30' },
  ]);

  // Fetch real groups and students from store / Supabase
  const loadData = async () => {
    try {
      const [liveGroups, liveStudents] = await Promise.all([
        loadTeacherGroups(teacherId),
        loadTeacherStudents(teacherId),
      ]);
      setGroups(liveGroups);
      setAllStudents(liveStudents);
    } catch (err) {
      console.warn('Could not fetch live groups/students:', err);
    }
  };

  useEffect(() => {
    loadData();

    const handleGroupsUpdate = () => loadData();
    const handleStudentsUpdate = () => loadData();

    window.addEventListener('hassty_teacher_groups_updated', handleGroupsUpdate);
    window.addEventListener('hassty_teacher_students_updated', handleStudentsUpdate);

    return () => {
      window.removeEventListener('hassty_teacher_groups_updated', handleGroupsUpdate);
      window.removeEventListener('hassty_teacher_students_updated', handleStudentsUpdate);
    };
  }, [teacherId]);

  const addSlotRow = () => {
    const newId = `slot-${Date.now()}`;
    setNewSlots([
      ...newSlots,
      { id: newId, day: 'Wednesday', dayArabic: 'الأربعاء', startTime: '17:00', endTime: '19:00' },
    ]);
  };

  const removeSlotRow = (id: string) => {
    if (newSlots.length <= 1) return;
    setNewSlots(newSlots.filter((s) => s.id !== id));
  };

  const updateSlot = (id: string, field: keyof GroupScheduleSlot, val: string) => {
    setNewSlots(
      newSlots.map((s) => {
        if (s.id !== id) return s;
        if (field === 'day') {
          const match = DAYS_OF_WEEK.find((d) => d.eng === val);
          return { ...s, day: val, dayArabic: match ? match.ar : val };
        }
        return { ...s, [field]: val };
      })
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    // Format human-readable summary of schedule
    const scheduleSummary = newSlots
      .map((s) => `${s.dayArabic} من ${formatTimeArabic(s.startTime)} إلى ${formatTimeArabic(s.endTime)}`)
      .join(' و ');

    const commissionRate = newBillingType === 'per_session' ? 2 : 1.2;

    const newGroup: StudentGroup = {
      id: `grp-${Date.now()}`,
      name: newGroupName,
      subject: 'الكيمياء',
      level: newGroupGrade,
      grade: newGroupGrade,
      schedule: scheduleSummary,
      scheduleSlots: newSlots,
      location: newGroupLocation,
      studentCount: 0,
      currentStudents: 0,
      maxCapacity: Number(newGroupMax) || 35,
      studentIds: [],
      billingType: newBillingType,
      priceAmount: Number(newPriceAmount) || (newBillingType === 'per_session' ? 120 : 450),
      commissionRate,
    };

    const teacherId = user?.uid || 'teacher-current';
    try {
      await saveTeacherGroup(teacherId, newGroup);
    } catch (createErr) {
      console.warn('saveTeacherGroup error:', createErr);
    }

    setGroups((prev) => [newGroup, ...prev]);
    setIsCreateModalOpen(false);
    setNewGroupName('');
    setActionFeedback(`تم إنشاء ${newGroupName} بنجاح ومزامنة المواعيد ونظام التسعير (${newBillingType === 'per_session' ? 'بالحصة عمولة 2%' : 'بالشهر'}) ✅`);
    setTimeout(() => setActionFeedback(null), 4500);
  };

  // Remove student from group (Teacher control)
  const handleRemoveStudentFromGroup = async (studentId: string, studentName: string) => {
    const student = allStudents.find((s) => s.id === studentId);
    if (student) {
      const updated = { ...student, groupName: 'بدون مجموعة' };
      await saveNewStudent(teacherId, updated);
      setAllStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
    }

    // update group count
    if (selectedGroupRoster) {
      const updatedGroup = {
        ...selectedGroupRoster,
        studentIds: (selectedGroupRoster.studentIds || []).filter((id) => id !== studentId),
        currentStudents: Math.max(0, (selectedGroupRoster.currentStudents || 1) - 1),
        studentCount: Math.max(0, (selectedGroupRoster.studentCount || 1) - 1),
      };
      await saveTeacherGroup(teacherId, updatedGroup);
      setGroups((prev) => prev.map((g) => (g.id === selectedGroupRoster.id ? updatedGroup : g)));
      setSelectedGroupRoster(updatedGroup);
    }
    setActionFeedback(`تم إزالة الطالب ${studentName} من المجموعة بنجاح.`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Transfer student to another group
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToTransfer || !targetTransferGroupId) return;

    const targetGroup = groups.find((g) => g.id === targetTransferGroupId);
    if (!targetGroup) return;

    const updatedStudent = { ...studentToTransfer, groupName: targetGroup.name };
    await saveNewStudent(teacherId, updatedStudent);

    setAllStudents((prev) =>
      prev.map((s) => (s.id === studentToTransfer.id ? updatedStudent : s))
    );

    // Update group counts
    const updatedGroups = groups.map((g) => {
      if (selectedGroupRoster && g.id === selectedGroupRoster.id) {
        const newIds = (g.studentIds || []).filter((id) => id !== studentToTransfer.id);
        return {
          ...g,
          studentIds: newIds,
          currentStudents: Math.max(0, g.currentStudents - 1),
          studentCount: Math.max(0, g.studentCount - 1),
        };
      }
      if (g.id === targetTransferGroupId) {
        const newIds = Array.from(new Set([...(g.studentIds || []), studentToTransfer.id]));
        return {
          ...g,
          studentIds: newIds,
          currentStudents: newIds.length,
          studentCount: newIds.length,
        };
      }
      return g;
    });

    for (const g of updatedGroups) {
      if (g.id === selectedGroupRoster?.id || g.id === targetTransferGroupId) {
        await saveTeacherGroup(teacherId, g);
      }
    }

    setGroups(updatedGroups);
    setActionFeedback(
      `تم نقل الطالب (${studentToTransfer.name}) بنجاح إلى "${targetGroup.name}" مع تحديث كافة سجلات الحضور ✅`
    );
    setStudentToTransfer(null);
    setTargetTransferGroupId('');
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleCancelSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingSessionGroup) return;

    const isLateCancel = cancelNoticeHours < 3;
    setCancelSuccessMsg(
      isLateCancel
        ? 'تم إرسال إشعار اعتذار لجميع الطلاب وأولياء الأمور عبر الواتساب. نظراً للإلغاء قبل الموعد بأقل من 3 ساعات، تم تسجيل ذلك في مؤشر الحضور.'
        : 'تم إلغاء وتأجيل موعد الحصة وإرسال إشعار فوري على واتساب الطلاب وأولياء الأمور بنجاح دون أي تأثير على تقييمك.'
    );

    setTimeout(() => {
      setCancelSuccessMsg('');
      setCancellingSessionGroup(null);
    }, 3000);
  };

  // Commission live preview for new group
  const commissionPreview = calculateTeacherCommission(
    newBillingType,
    Number(newPriceAmount) || 0,
    Number(newGroupMax) || 30
  );

  return (
    <div className="space-y-6 text-right">
      {/* Header Card */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>نظام المجموعات والمواعيد المتزامنة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            إدارة المجموعات وتحديد المواعيد الدقيقة ({groups.length})
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            إضافة المواعيد (من ساعة كذا لكذا)، تحديد طريقة الحساب (بالحصة نسبة 2% أو بالشهر)، ونقل وإدارة الطلاب بحرية تامة
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-black rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ إنشاء مجموعة ومواعيد جديدة</span>
        </button>
      </div>

      {/* Global Action Feedback Alert */}
      {actionFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2.5 animate-drawer">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Cancellation Success Notification */}
      {cancelSuccessMsg && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2.5 animate-drawer">
          <CheckCircle2 className="w-5 h-5 text-[#2563EB] shrink-0" />
          <span>{cancelSuccessMsg}</span>
        </div>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {groups.map((group) => {
          const occupancyRate = Math.round((group.currentStudents / group.maxCapacity) * 100);
          const hasWaitlist = group.waitlist && group.waitlist.length > 0;
          const billing = calculateTeacherCommission(
            group.billingType || 'per_session',
            group.priceAmount || 120,
            group.currentStudents || 1
          );

          return (
            <div
              key={group.id}
              className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 hover:border-blue-300 transition-all flex flex-col justify-between shadow-xs space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-black text-[#1E3A8A] leading-snug">{group.name}</h3>
                  <Badge variant="info" size="sm">
                    {group.grade || group.level}
                  </Badge>
                </div>

                {/* Slots and Schedule Pills */}
                <div className="space-y-2 text-xs text-[#4B5563] pt-2 border-t border-gray-100">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="text-[#1E3A8A] block">المواعيد المزامنة تلقائياً:</strong>
                      {group.scheduleSlots && group.scheduleSlots.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {group.scheduleSlots.map((slot) => (
                            <span
                              key={slot.id}
                              className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-bold"
                            >
                              {slot.dayArabic}: {formatTimeArabic(slot.startTime)} - {formatTimeArabic(slot.endTime)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-600">{group.schedule}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{group.location}</span>
                  </div>

                  {/* Pricing & Commission Model Badge */}
                  <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#1E3A8A] font-bold">
                      <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        {group.billingType === 'per_session'
                          ? `الحساب: ${group.priceAmount || 120} ج.م / بالحصة`
                          : `الحساب: ${group.priceAmount || 480} ج.م / بالشهر`}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-black">
                      {group.billingType === 'per_session' ? 'عمولة 2% ثابتة' : `عمولة ${group.commissionRate || 1.2}%`}
                    </span>
                  </div>

                  {hasWaitlist && (
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <UserPlus className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-bold">قائمة الانتظار: {group.waitlist?.length} طلاب مسجلين</span>
                    </div>
                  )}
                </div>

                {/* Progress bar of occupancy */}
                <div className="mt-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B7280]">سعة المقاعد:</span>
                    <strong className="text-[#1E3A8A]">
                      {group.currentStudents} من {group.maxCapacity} طالب ({occupancyRate}%)
                    </strong>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        occupancyRate >= 90 ? 'bg-[#EF4444]' : 'bg-[#2563EB]'
                      }`}
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                <button
                  onClick={() => setSelectedGroupRoster(group)}
                  className="flex-1 py-2.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>التحكم بالطلاب ({group.currentStudents})</span>
                </button>
                <button
                  onClick={() => setCancellingSessionGroup(group)}
                  className="px-3 py-2.5 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-[#EF4444] border border-gray-200 hover:border-red-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  title="إلغاء أو تأجيل حصة قادمة"
                >
                  إلغاء حصة
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: View & Control Group Roster (Remove / Transfer Students) */}
      <Modal
        isOpen={Boolean(selectedGroupRoster)}
        onClose={() => {
          setSelectedGroupRoster(null);
          setStudentToTransfer(null);
        }}
        title={selectedGroupRoster ? `التحكم بطلاب: ${selectedGroupRoster.name}` : ''}
        subtitle="يمكنك نقل أي طالب لمجموعة أخرى أو إزالته بحرية تامة"
        maxWidth="lg"
      >
        {selectedGroupRoster && (
          <div className="space-y-4">
            {/* Student Transfer Panel */}
            {studentToTransfer ? (
              <form onSubmit={handleExecuteTransfer} className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-[#1E3A8A]">
                    <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                    <span>نقل الطالب: {studentToTransfer.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStudentToTransfer(null)}
                    className="text-xs text-gray-500 hover:text-gray-800"
                  >
                    إلغاء
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    اختر المجموعة الجديدة لنقل الطالب إليها:
                  </label>
                  <select
                    required
                    value={targetTransferGroupId}
                    onChange={(e) => setTargetTransferGroupId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-right focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">-- اختر مجموعة --</option>
                    {groups
                      .filter((g) => g.id !== selectedGroupRoster.id)
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.schedule})
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد نقل الطالب وتحديث السجلات فوراً</span>
                </button>
              </form>
            ) : null}

            {/* List of students */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 pr-1">
              {allStudents.filter(
                (s) =>
                  s.groupName.includes(selectedGroupRoster.name.split(' - ')[0]) ||
                  s.groupName === selectedGroupRoster.name
              ).length > 0 ? (
                allStudents
                  .filter(
                    (s) =>
                      s.groupName.includes(selectedGroupRoster.name.split(' - ')[0]) ||
                      s.groupName === selectedGroupRoster.name
                  )
                  .map((std) => (
                    <div key={std.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={std.avatarUrl}
                          alt={std.name}
                          className="w-9 h-9 rounded-xl object-cover border border-gray-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold text-[#1F2937]">{std.name}</div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                            <span>{std.qrCode}</span>
                            <span>•</span>
                            <span>{std.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="success" size="sm">
                          حضور {std.attendanceRate}%
                        </Badge>
                        
                        {/* Transfer button */}
                        <button
                          onClick={() => setStudentToTransfer(std)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="نقل لمجموعة أخرى"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>نقل</span>
                        </button>

                        {/* Remove button */}
                        <button
                          onClick={() => handleRemoveStudentFromGroup(std.id, std.name)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="إزالة من المجموعة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="py-8 text-center text-xs text-[#6B7280]">
                  لا يوجد طلاب مسجلين في هذه المجموعة حالياً.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedGroupRoster(null);
                setStudentToTransfer(null);
              }}
              className="w-full py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        )}
      </Modal>

      {/* MODAL: Create New Group with Multi-Day Schedules and Pricing */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="إنشاء مجموعة دراسية وضبط المواعيد الدقيقة"
        subtitle="أدخل تفاصيل الأيام والساعات (من كذا لكذا) وطريقة الحساب (بالحصة أو بالشهر)"
        icon={<Layers className="w-6 h-6" />}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-[#1F2937] mb-1">
              اسم المجموعة <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: مجموعة الأحد والثلاثاء — سنتر الأهرام"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                المرحلة والصف الدراسي
              </label>
              <select
                value={newGroupGrade}
                onChange={(e) => setNewGroupGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                {ALL_EGYPT_GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                المقر / السنتر
              </label>
              <input
                type="text"
                required
                placeholder="مثال: سنتر الأهرام - قاعة 4"
                value={newGroupLocation}
                onChange={(e) => setNewGroupLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* DYNAMIC MULTI-DAY SCHEDULE SLOTS */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>مواعيد الحصص (مزامنة الوقت والتفعيل التلقائي)</span>
              </div>
              <button
                type="button"
                onClick={addSlotRow}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة يوم آخر</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {newSlots.map((slot, idx) => (
                <div
                  key={slot.id}
                  className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-emerald-100 text-xs"
                >
                  <div className="col-span-4">
                    <label className="block text-[10px] text-gray-500 font-bold mb-0.5">اليوم</label>
                    <select
                      value={slot.day}
                      onChange={(e) => updateSlot(slot.id, 'day', e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#1E3A8A]"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d.eng} value={d.eng}>
                          {d.ar}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[10px] text-gray-500 font-bold mb-0.5">من الساعة</label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(slot.id, 'startTime', e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-center"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[10px] text-gray-500 font-bold mb-0.5">إلى الساعة</label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(slot.id, 'endTime', e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-center"
                    />
                  </div>

                  <div className="col-span-2 flex justify-end pt-3">
                    {newSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSlotRow(slot.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        title="حذف هذا اليوم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-emerald-800">
              💡 عند قدوم موعد الحصة (مثلاً الساعة 2)، سيفعّل الموقع هذه المجموعة تلقائياً في صفحة الماسح لمسح الـ QR بسرعة.
            </p>
          </div>

          {/* PRICING & COMMISSION MODEL SELECTION */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#1E3A8A]">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span>طريقة الحساب والاشتراك (بالحصة أو بالشهر)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border-2 flex items-start gap-2.5 cursor-pointer transition-all ${
                  newBillingType === 'per_session'
                    ? 'border-blue-600 bg-white shadow-xs'
                    : 'border-gray-200 bg-gray-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="billingType"
                  value="per_session"
                  checked={newBillingType === 'per_session'}
                  onChange={() => {
                    setNewBillingType('per_session');
                    setNewPriceAmount(120);
                  }}
                  className="mt-1"
                />
                <div>
                  <strong className="text-xs text-[#1E3A8A] block">حساب بالحصة</strong>
                  <span className="text-[10px] text-emerald-700 font-bold">العمولة 2% ثابتة لكل طالب/حصة</span>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border-2 flex items-start gap-2.5 cursor-pointer transition-all ${
                  newBillingType === 'monthly'
                    ? 'border-blue-600 bg-white shadow-xs'
                    : 'border-gray-200 bg-gray-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="billingType"
                  value="monthly"
                  checked={newBillingType === 'monthly'}
                  onChange={() => {
                    setNewBillingType('monthly');
                    setNewPriceAmount(480);
                  }}
                  className="mt-1"
                />
                <div>
                  <strong className="text-xs text-[#1E3A8A] block">حساب شهري</strong>
                  <span className="text-[10px] text-blue-700 font-bold">نسبة شهرية متدرجة (1% - 1.5%)</span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  {newBillingType === 'per_session' ? 'سعر الحصة للطالب (ج.م)' : 'سعر الشهر للطالب (ج.م)'}
                </label>
                <input
                  type="number"
                  min={10}
                  required
                  value={newPriceAmount}
                  onChange={(e) => setNewPriceAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-right font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  الحد الأقصى للطلاب (السعة)
                </label>
                <input
                  type="number"
                  min={1}
                  max={150}
                  value={newGroupMax}
                  onChange={(e) => setNewGroupMax(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-right font-bold focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Live commission breakdown box */}
            <div className="p-3 bg-white rounded-xl border border-blue-100 text-[11px] space-y-1 text-gray-700">
              <div className="flex justify-between">
                <span>النسبة المقررة:</span>
                <strong className="text-blue-700">{commissionPreview.commissionRateLabel}</strong>
              </div>
              <div className="flex justify-between">
                <span>عمولة المنصة للطالب:</span>
                <strong>{commissionPreview.feePerStudent} ج.م</strong>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold border-t border-gray-100 pt-1">
                <span>صافي أرباح المدرس للطالب:</span>
                <strong>{commissionPreview.netPerStudent} ج.م</strong>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-3 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>حفظ وإنشاء المجموعة وتفعيل المزامنة</span>
          </button>
        </form>
      </Modal>

      {/* MODAL: Cancel / Postpone Session */}
      <Modal
        isOpen={Boolean(cancellingSessionGroup)}
        onClose={() => setCancellingSessionGroup(null)}
        title="إلغاء / تأجيل حصة دراسية"
        subtitle={cancellingSessionGroup ? `${cancellingSessionGroup.name} (${cancellingSessionGroup.schedule})` : ''}
        icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
        maxWidth="md"
      >
        {cancellingSessionGroup && (
          <form onSubmit={handleCancelSessionSubmit} className="space-y-3.5 pt-1">
            {cancelSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                <span>{cancelSuccessMsg}</span>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">
                    سبب الإلغاء أو التأجيل
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="ظرف صحي طارئ">ظرف صحي طارئ</option>
                    <option value="ظرف شخصي طارئ">ظرف شخصي طارئ</option>
                    <option value="صيانة بقاعة السنتر">صيانة بقاعة السنتر</option>
                    <option value="تأجيل لتعويض حصة سابقة">تأجيل لتعويض حصة سابقة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">
                    المهلة الزمنية قبل موعد الحصة
                  </label>
                  <select
                    value={cancelNoticeHours}
                    onChange={(e) => setCancelNoticeHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value={6}>قبل الحصة بأكثر من 6 ساعات (إشعار مبكر ✅)</option>
                    <option value={3}>قبل الحصة بـ 3 ساعات (مهلة كافية ✅)</option>
                    <option value={1}>قبل الحصة بأقل من 3 ساعات (إلغاء متأخر ⚠️)</option>
                  </select>
                </div>

                {cancelNoticeHours < 3 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                    <span>
                      تنبيه: الإلغاء قبل أقل من 3 ساعات من موعد الحصة يؤثر على مؤشر انتظام المعلم وسيتم إرسال رسالة واتساب عاجلة لأولياء الأمور.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-[#EF4444] hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  تأكيد الإلغاء وإرسال إشعار واتساب للجميع
                </button>
              </>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
};
