/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  QrCode,
  CheckCircle2,
  X,
  Filter,
  Trash2,
  UserRoundSearch,
  UserCog,
  ArrowUpDown,
  RotateCcw,
  Loader2,
  GraduationCap,
  ShieldOff,
  Shuffle,
} from 'lucide-react';
import { TeacherStudentItem } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { SectionExplainer } from '../../components/common/SectionExplainer';
import { StageGradeCascade } from '../../components/common/StagePickers';
import { StudentOptionsModal } from '../../components/teacher/StudentOptionsModal';
import { useAuth } from '../../lib/AuthContext';
import { loadTeacherStudents, saveNewStudent, removeStudent, loadTeacherGroups } from '../../lib/teacherStore';
import { gradesMatch, gradeMismatchText } from '../../lib/gradeMatch';
import { STAGES, stageOfGrade } from '../../lib/stages';

interface TeacherStudentsPageProps {
  onNavigate?: (path: string) => void;
}

type AttFilter = 'all' | 'excellent' | 'ok' | 'weak';
type PayFilter = 'all' | 'paid' | 'pending';
type SortKey = 'newest' | 'oldest' | 'att-desc' | 'att-asc' | 'name';

export const TeacherStudentsPage: React.FC<TeacherStudentsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const teacherId = user?.uid || 'teacher-current';

  const [students, setStudents] = useState<TeacherStudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  /* الفلاتر */
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [attFilter, setAttFilter] = useState<AttFilter>('all');
  const [payFilter, setPayFilter] = useState<PayFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');

  const [availableGroups, setAvailableGroups] = useState<{ id: string; name: string; grade: string; slots: any[] }[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentParentPhone, setNewStudentParentPhone] = useState('');
  const [newStudentStage, setNewStudentStage] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [newStudentGroup, setNewStudentGroup] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  /* مودال خيارات الطالب */
  const [optionsFor, setOptionsFor] = useState<TeacherStudentItem | null>(null);

  const fetchStudents = async () => {
    try {
      const [list, groups] = await Promise.all([
        loadTeacherStudents(teacherId),
        loadTeacherGroups(teacherId),
      ]);
      setStudents(list);
      if (groups.length > 0) {
        setAvailableGroups(groups.map((g) => ({ id: g.id, name: g.name, grade: g.grade || '', slots: g.scheduleSlots || [] })));
      }
    } catch (e) {
      console.warn('Error loading students:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    const handleUpdate = () => { fetchStudents(); };
    window.addEventListener('hassty_teacher_students_updated', handleUpdate);
    return () => window.removeEventListener('hassty_teacher_students_updated', handleUpdate);
  }, [teacherId]);

  /* ===== الفلترة + الترتيب ===== */
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim();
    let rows = students.filter((s) => {
      if (q && !s.name?.includes(q) && !s.phone?.includes(q) && !s.qrCode?.includes(q) && !s.parentPhone?.includes(q)) return false;
      if (selectedGroup !== 'all' && s.groupName !== selectedGroup) return false;
      if (stageFilter !== 'all' && stageOfGrade(s.grade) !== stageFilter) return false;
      if (payFilter !== 'all' && s.paymentStatus !== payFilter) return false;
      if (attFilter === 'excellent' && s.attendanceRate < 85) return false;
      if (attFilter === 'ok' && (s.attendanceRate < 60 || s.attendanceRate >= 85)) return false;
      if (attFilter === 'weak' && s.attendanceRate >= 60) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortKey) {
        case 'newest': return (b.joinedDate || '').localeCompare(a.joinedDate || '');
        case 'oldest': return (a.joinedDate || '').localeCompare(b.joinedDate || '');
        case 'att-desc': return b.attendanceRate - a.attendanceRate;
        case 'att-asc': return a.attendanceRate - b.attendanceRate;
        case 'name': return (a.name || '').localeCompare(b.name || '', 'ar');
        default: return 0;
      }
    });
    return rows;
  }, [students, searchQuery, selectedGroup, stageFilter, attFilter, payFilter, sortKey]);

  const activeFilters =
    (selectedGroup !== 'all' ? 1 : 0) + (stageFilter !== 'all' ? 1 : 0) +
    (attFilter !== 'all' ? 1 : 0) + (payFilter !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedGroup('all');
    setStageFilter('all');
    setAttFilter('all');
    setPayFilter('all');
    setSortKey('newest');
  };

  /* إحصاءات سريعة حسب المرحلة */
  const stageCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of students) {
      const st = stageOfGrade(s.grade) || 'غير محدد';
      m[st] = (m[st] || 0) + 1;
    }
    return m;
  }, [students]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newStudentName) { setAddError('اكتب اسم الطالب.'); return; }
    if (!newStudentGrade) { setAddError('اختر المرحلة والصف الدراسي للطالب.'); return; }
    /* لا قيد بلا مجموعة صريحة طالما توجد مجموعات من مرحلة الطالب */
    if (availableGroups.some((g) => gradesMatch(newStudentGrade, g.grade)) && !newStudentGroup) {
      setAddError('اختر مجموعة من مرحلة الطالب أولًا — القيد في مجموعة محددة يبقي متابعته وحضوره دقيقين.');
      return;
    }
    const chosen = availableGroups.find((g) => g.name === newStudentGroup);
    if (chosen && chosen.grade && !gradesMatch(newStudentGrade, chosen.grade)) {
      setAddError(gradeMismatchText(newStudentGrade, chosen.grade));
      return;
    }

    setAdding(true);
    try {
      const added = await saveNewStudent(teacherId, {
        name: newStudentName,
        avatarUrl: '',
        grade: newStudentGrade,
        phone: newStudentPhone || '',
        parentPhone: newStudentParentPhone || '',
        qrCode: newStudentCode || `HST-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        groupName: newStudentGroup || 'المجموعة العامة',
        attendanceRate: 0,
        totalSessions: 0,
        attendedSessions: 0,
        paymentStatus: 'pending',
        joinedDate: new Date().toISOString().split('T')[0],
        status: 'active',
      });
      setStudents((prev) => [added, ...prev.filter((s) => s.id !== added.id)]);
      setAddSuccess(true);
      setTimeout(() => {
        setAddSuccess(false);
        setIsAddModalOpen(false);
        setNewStudentName(''); setNewStudentCode(''); setNewStudentPhone(''); setNewStudentParentPhone('');
      }, 1200);
    } catch (err: any) {
      setAddError(err?.message || 'تعذر قيد الطالب.');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, groupName?: string) => {
    const group = groupName ? availableGroups.find((g) => g.name === groupName) : null;
    await removeStudent(teacherId, studentId, group?.id);
    setStudents((prev) => prev.filter((s) => !(s.id === studentId && (!groupName || s.groupName === groupName))));
  };

  const openOptions = (s: TeacherStudentItem) => {
    const group = availableGroups.find((g) => g.id === s.groupId);
    setOptionsFor({ ...s, _groupSlots: group?.slots || [] } as any);
  };

  const attTone = (rate: number) => rate >= 85 ? 'text-[#10B981]' : rate >= 60 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-6 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">

      {/* شرح القسم */}
      <SectionExplainer
        storageKey="teacher_students_v2"
        title="إدارة الطلاب"
        text="كل طلابك في مكان واحد: ابحث وفلتر حسب المرحلة أو الحضور أو السداد، واضغط على أي طالب لفتح ملفه الكامل وتخصيصه."
        steps={[
          'اكتب اسم الطالب أو رقمه أو كود الـ QR في شريط البحث للوصول الفوري.',
          'استخدم الفلاتر: المرحلة (ابتدائي/إعدادي/ثانوي)، المجموعة، حالة الحضور، والسداد.',
          'اضغط على اسم الطالب أو زر البروفايل 👁 لفتح ملفه: حضوره ومدفوعاته ودرجاته وملاحظاته.',
          'زر التخصيص ⚙ يفتح خيارات الطالب: حضور مرن، جدول مخصص، إعفاء من المصاريف، ومجموعات شقيقة.',
        ]}
        notes={[
          'الطالب يُقيد فقط في مجموعة من نفس مرحلته — عشان مجموعاتك تبقى منظمة.',
          'إضافة طالب جديد تتطلب أن يكون لديه حساب على المنصة (بالـ QR أو رقم هاتفه).',
        ]}
      />

      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>سجل الطلاب الفعلي</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            إدارة الطلاب ({students.length} طالب)
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            سجلات الطلاب المسجلين فعلياً بالمجموعات والـ QR وحالات السداد
          </p>
          {/* شارات المراحل */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {STAGES.map((s) => stageCounts[s.label] ? (
              <span key={s.key} className="text-[10px] font-black bg-slate-100 border border-slate-200 text-slate-600 rounded-full px-2.5 py-1">
                {s.emoji} {s.label}: {stageCounts[s.label]}
              </span>
            ) : null)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate && onNavigate('/teacher/scan')}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>قيد طالب فوري بالـ QR</span>
          </button>
          <button
            onClick={() => { setIsAddModalOpen(true); setAddError(''); }}
            className="px-4 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة طالب يدوياً</span>
          </button>
        </div>
      </div>

      {/* شريط البحث والفلاتر */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* البحث */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="ابحث باسم الطالب، رقمه، رقم ولي أمره، أو كود الـ QR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#2563EB]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
          </div>

          {/* الترتيب */}
          <div className="relative">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="w-full lg:w-44 pr-9 pl-3 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
            >
              <option value="newest">الأحدث انضمامًا</option>
              <option value="oldest">الأقدم انضمامًا</option>
              <option value="att-desc">الأعلى حضورًا</option>
              <option value="att-asc">الأقل حضورًا</option>
              <option value="name">أبجديًا بالاسم</option>
            </select>
          </div>
        </div>

        {/* صف الفلاتر */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 pl-1">
            <Filter className="w-3.5 h-3.5" />
            فلاتر:
          </div>

          {/* المرحلة */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">كل المراحل</option>
            {STAGES.map((s) => <option key={s.key} value={s.label}>{s.emoji} {s.label}</option>)}
          </select>

          {/* المجموعة */}
          {availableGroups.length > 0 && (
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer max-w-52"
            >
              <option value="all">جميع المجموعات</option>
              {availableGroups.map((grp) => <option key={grp.name} value={grp.name}>{grp.name}</option>)}
            </select>
          )}

          {/* الحضور */}
          <select
            value={attFilter}
            onChange={(e) => setAttFilter(e.target.value as AttFilter)}
            className="px-3 py-2 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">كل حالات الحضور</option>
            <option value="excellent">حضور ممتاز (85%+)</option>
            <option value="ok">حضور متوسط (60-85%)</option>
            <option value="weak">يحتاج متابعة (أقل من 60%)</option>
          </select>

          {/* السداد */}
          <select
            value={payFilter}
            onChange={(e) => setPayFilter(e.target.value as PayFilter)}
            className="px-3 py-2 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">كل حالات السداد</option>
            <option value="paid">مسدد ✓</option>
            <option value="pending">متأخر ✗</option>
          </select>

          {activeFilters > 0 && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              مسح الفلاتر ({activeFilters})
            </button>
          )}
        </div>

        {/* عدد النتائج */}
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 border-t border-slate-100 pt-3">
          <span>
            عرض <span className="text-[#1E3A8A] font-black">{filteredStudents.length}</span> من {students.length} طالب
            {activeFilters > 0 ? ' — مع الفلاتر الحالية' : ''}
          </span>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
        </div>

        {/* جدول الطلاب */}
        {!loading && filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-bold text-[#1E3A8A]">
                  <th className="py-3 px-4 rounded-r-xl">الطالب</th>
                  <th className="py-3 px-4">المرحلة</th>
                  <th className="py-3 px-4">كود الـ QR</th>
                  <th className="py-3 px-4">المجموعة</th>
                  <th className="py-3 px-4">هاتف ولي الأمر</th>
                  <th className="py-3 px-4">نسبة الحضور</th>
                  <th className="py-3 px-4">الاشتراك</th>
                  <th className="py-3 px-4 rounded-l-xl text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-[#1F2937]">
                {filteredStudents.map((std) => (
                  <tr key={std.id + (std.enrollmentId || '') + (std.groupName || '')} className="hover:bg-[#F8FAFF] transition-colors">
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onNavigate && onNavigate(`/teacher/students/${std.id}`)}
                        className="flex items-center gap-3 cursor-pointer text-right group"
                        title="افتح ملف الطالب الكامل"
                      >
                        <img
                          src={std.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                          alt={std.name}
                          className="w-9 h-9 rounded-xl object-cover border border-gray-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold text-[#1E3A8A] group-hover:underline decoration-2 underline-offset-4">{std.name}</div>
                          <span className="text-[11px] text-[#6B7280] font-mono" dir="ltr">{std.phone || '—'}</span>
                        </div>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                        {STAGES.find((s) => s.label === stageOfGrade(std.grade))?.emoji} {std.grade || 'غير محدد'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB]" dir="ltr">
                      {std.qrCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#4B5563]">{std.groupName}</div>
                      <div className="flex gap-1 mt-1">
                        {std.attendanceMode === 'flexible' && (
                          <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-1.5 py-0.5 flex items-center gap-0.5"><Shuffle className="w-2.5 h-2.5" />مرن</span>
                        )}
                        {std.feeExempt && (
                          <span className="text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.5 flex items-center gap-0.5"><ShieldOff className="w-2.5 h-2.5" />معفو</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#6B7280]" dir="ltr">
                      {std.parentPhone || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${attTone(std.attendanceRate)}`}>{std.attendanceRate}%</span>
                      <span className="text-[10px] text-gray-400 block">({std.attendedSessions}/{std.totalSessions} حصة)</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={std.paymentStatus === 'paid' ? 'success' : 'danger'} size="sm">
                        {std.paymentStatus === 'paid' ? 'مسدد ✓' : 'متأخر ✗'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onNavigate && onNavigate(`/teacher/students/${std.id}`)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="ملف الطالب الكامل (حضور/مدفوعات/درجات/ملاحظات)"
                        >
                          <UserRoundSearch className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openOptions(std)}
                          className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          title="تخصيص الطالب: حضور مرن / جدول مخصص / إعفاء / مجموعات شقيقة"
                        >
                          <UserCog className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(std.id, std.groupName)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={`إزالة الطالب من مجموعة ${std.groupName || 'هذه'} فقط`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : loading ? (
          <div className="text-center py-12 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563EB] mx-auto" />
            <p className="text-xs font-bold text-slate-500">جاري تحميل الطلاب...</p>
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] mx-auto flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-gray-700">{students.length === 0 ? 'لا يوجد طلاب مسجلون بعد' : 'لا نتائج مطابقة للفلاتر الحالية'}</p>
            <p className="text-[11px] text-gray-400">
              {students.length === 0
                ? 'يمكنك قيد الطلاب الجدد عبر مسح بطاقة الـ QR أو الإضافة المباشرة أعلاه'
                : 'جرّب مسح الفلاتر أو تعديل كلمة البحث'}
            </p>
          </div>
        )}
      </div>

      {/* MODAL: مودال خيارات الطالب (تخصيص) */}
      {optionsFor && optionsFor.enrollmentId && (
        <StudentOptionsModal
          data={{
            enrollmentId: optionsFor.enrollmentId,
            studentId: optionsFor.id,
            studentName: optionsFor.name,
            grade: optionsFor.grade,
            groupId: optionsFor.groupId || '',
            groupName: optionsFor.groupName,
            groupSlots: (optionsFor as any)._groupSlots || [],
            attendanceMode: optionsFor.attendanceMode || 'fixed',
            customScheduleSlots: optionsFor.customScheduleSlots || [],
            feeExempt: optionsFor.feeExempt === true,
            feeExemptReason: optionsFor.feeExemptReason,
            feeExemptUntil: optionsFor.feeExemptUntil,
          }}
          teacherId={teacherId}
          onClose={() => setOptionsFor(null)}
          onUpdated={() => { void fetchStudents(); }}
        />
      )}

      {/* MODAL: إضافة طالب جديد */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إضافة طالب جديد للمجموعة"
        subtitle="أدخل بيانات الطالب أو كود بطاقة الـ QR الخاصة به"
        icon={<Plus className="w-6 h-6" />}
        maxWidth="md"
      >
        {addSuccess ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            <span>تم قيد الطالب بنجاح في المجموعة وتفعيل متابعة الـ QR!</span>
          </div>
        ) : (
          <form onSubmit={handleAddStudent} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                اسم الطالب بالكامل <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: يوسف خالد إبراهيم"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                المرحلة ثم الصف الدراسي <span className="text-[#EF4444]">*</span>
              </label>
              <StageGradeCascade
                stage={newStudentStage}
                grade={newStudentGrade}
                onStageChange={setNewStudentStage}
                onGradeChange={setNewStudentGrade}
                gradePlaceholder="اختر صف الطالب..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                كود كارنيه الطالب (اختياري)
              </label>
              <input
                type="text"
                placeholder="مثال: HST-2026-09812"
                value={newStudentCode}
                onChange={(e) => setNewStudentCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                إذا لم يكن لدى الطالب كود، سيقوم النظام بإنشاء كود فوري له تلقائياً.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">
                  رقم هاتف الطالب
                </label>
                <input
                  type="tel"
                  placeholder="010XXXXXXXX"
                  value={newStudentPhone}
                  onChange={(e) => setNewStudentPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">
                  رقم هاتف ولي الأمر
                </label>
                <input
                  type="tel"
                  placeholder="011XXXXXXXX"
                  value={newStudentParentPhone}
                  onChange={(e) => setNewStudentParentPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                المجموعة (مرحلتها تطابق مرحلة الطالب)
              </label>
              {availableGroups.length > 0 ? (
                newStudentGrade && availableGroups.some((g) => gradesMatch(newStudentGrade, g.grade)) ? (
                  <select
                    value={availableGroups.some((g) => g.name === newStudentGroup && gradesMatch(newStudentGrade, g.grade)) ? newStudentGroup : ''}
                    onChange={(e) => setNewStudentGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="">اختر مجموعة من مرحلة الطالب...</option>
                    {availableGroups.filter((g) => gradesMatch(newStudentGrade, g.grade)).map((g) => (
                      <option key={g.name} value={g.name}>{g.name} — {g.grade || 'عام'}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-800 leading-6">
                    {newStudentGrade
                      ? `لا توجد مجموعة بنفس مرحلة الطالب (${newStudentGrade}) — أنشئ مجموعة بهذه المرحلة من صفحة المجموعات أولًا.`
                      : 'اختر المرحلة والصف أولًا لتظهر لك مجموعات المرحلة المناسبة.'}
                  </div>
                )
              ) : (
                <input
                  type="text"
                  value={newStudentGroup}
                  onChange={(e) => setNewStudentGroup(e.target.value)}
                  placeholder="المجموعة العامة"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                />
              )}
            </div>

            {addError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[11px] font-bold text-red-700 flex items-start gap-2">
                <X className="w-4 h-4 shrink-0 mt-0.5" />
                {addError}
              </div>
            )}

            <button
              type="submit"
              disabled={adding}
              className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{adding ? 'جاري القيد...' : 'تأكيد إضافة الطالب في مجموعة مرحلته'}</span>
            </button>
          </form>
        )}
      </Modal>

    </div>
  );
};
