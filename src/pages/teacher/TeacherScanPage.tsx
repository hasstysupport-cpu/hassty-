import React, { useState, useEffect } from 'react';
import {
  ScanLine,
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  UserPlus,
  QrCode,
  DollarSign,
  Receipt,
  Layers,
  Phone,
  Check,
  MessageCircle,
  Send,
  Database,
  Volume2,
  VolumeX,
  UserCheck
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { RealQRCameraScanner } from '../../components/RealQRCameraScanner';
import { dbService } from '../../lib/supabaseService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { detectActiveLiveGroup, formatTimeArabic } from '../../lib/scheduleSync';
import { PLAY_AUDIO_SOUND } from '../../lib/soundUtils';
import { StudentGroup, TeacherStudentItem } from '../../types';

type ScanMode = 'attendance' | 'add_student' | 'collect_fee';
type TimeWindowStatus = 'on_time' | 'late' | 'absent_cutoff';

const DEFAULT_GROUP: StudentGroup = {
  id: 'grp-default',
  name: 'المجموعة العامة (الصف الثالث الثانوي)',
  grade: 'الصف الثالث الثانوي',
  location: 'السنتر الرئيسي',
  currentStudents: 0,
  maxCapacity: 30,
  priceAmount: 100,
  commissionRate: 2,
  maxStudents: 30,
  studentsCount: 0,
  level: 'المرحلة الثانوية',
  schedule: 'الأحد والثلاثاء',
  timing: '04:30 م',
  centerName: 'السنتر الرئيسي',
  billingType: 'per_session',
  sessionPrice: 100,
  monthlyPrice: 400,
  days: ['Sunday', 'Tuesday'],
  timeSlot: '04:30 م'
};

export const TeacherScanPage: React.FC = () => {
  const [activeMode, setActiveMode] = useState<ScanMode>('attendance');
  const [manualCode, setManualCode] = useState('');
  const [groups, setGroups] = useState<StudentGroup[]>([DEFAULT_GROUP]);
  const [students, setStudents] = useState<TeacherStudentItem[]>([]);
  
  // Active synchronized group state
  const [selectedGroup, setSelectedGroup] = useState<StudentGroup>(DEFAULT_GROUP);
  const [isAutoSyncActive, setIsAutoSyncActive] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  
  // Timing / offset window testing
  const [feeAmount, setFeeAmount] = useState('120');
  const [simulatedOffsetMinutes, setSimulatedOffsetMinutes] = useState(5); // 0-15 on-time, 16-45 late, >45 cutoff
  
  const [lastScannedResult, setLastScannedResult] = useState<{
    student: any;
    mode: ScanMode;
    message: string;
    details?: string;
    attendanceStatus?: TimeWindowStatus;
    whatsappPreview?: string;
    isNewAutoRegistered?: boolean;
    soundPlayed?: 'success' | 'error';
  } | null>(null);
  
  const [isSuccessFlashing, setIsSuccessFlashing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [scanHistory, setScanHistory] = useState<any[]>([]);

  const [useRealCamera, setUseRealCamera] = useState(true);

  // Synchronize active group based on current clock and day
  useEffect(() => {
    const checkSchedule = () => {
      const result = detectActiveLiveGroup(groups);
      setCurrentTimeStr(result.formattedCurrentTime);
      if (isAutoSyncActive && result.activeGroup) {
        setSelectedGroup(result.activeGroup);
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [groups, isAutoSyncActive]);

  // Load groups and students from Supabase if configured
  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured) {
        const liveGroups = await dbService.getGroups();
        if (liveGroups && liveGroups.length > 0) {
          setGroups(liveGroups);
          setSelectedGroup(liveGroups[0]);
        }
      }
    }
    loadData();
  }, []);

  /**
   * Main Scan Handler - Ultra-Fast, Audio Feedback, Unknown Student Auto-Registration
   */
  const handleProcessScan = async (codeToUse?: string, customStudentName?: string) => {
    const rawCode = (codeToUse || manualCode || 'HST-2026-09812').trim();
    if (!rawCode) return;

    // 1. Check if student already exists in teacher list
    let existingStudent = students.find((s) => s.qrCode.toUpperCase() === rawCode.toUpperCase());
    let isNewAutoRegistered = false;

    if (!existingStudent) {
      // AUTO-REGISTER UNKNOWN STUDENT TO THIS TEACHER'S GROUP IMMEDIATELY!
      isNewAutoRegistered = true;
      const newStdName = customStudentName || `طالب جديد (${rawCode.slice(-5)})`;
      existingStudent = {
        id: `std-auto-${Date.now()}`,
        name: newStdName,
        grade: selectedGroup?.grade || selectedGroup?.level || 'الصف الثالث الثانوي',
        phone: '010XXXXXXXX',
        parentPhone: '011XXXXXXXX',
        qrCode: rawCode,
        groupName: selectedGroup?.name || 'مجموعة عامة',
        attendanceRate: 100,
        totalSessions: 1,
        attendedSessions: 1,
        paymentStatus: 'pending',
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`,
        joinedDate: new Date().toISOString().split('T')[0],
        status: 'active',
      };

      // Add to local teacher students state
      setStudents((prev) => [existingStudent!, ...prev]);
    }

    const student = existingStudent;
    const nowTimeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    let resultMessage = '';
    let details = '';
    let badgeText = '';
    let badgeType: 'success' | 'navy' | 'info' | 'warning' | 'danger' = 'success';
    let attendanceStatus: TimeWindowStatus = 'on_time';
    let whatsappPreview = '';
    let soundToPlay: 'success' | 'error' | 'warning' = 'success';

    if (activeMode === 'attendance') {
      if (simulatedOffsetMinutes <= 15) {
        attendanceStatus = 'on_time';
        badgeText = 'حاضر في الموعد ✅';
        badgeType = 'success';
        resultMessage = `تم تسجيل حضور: ${student.name} (في الموعد بنجاح)!`;
        details = `مجموعة: ${selectedGroup.name} — تم التوثيق الساعة ${nowTimeStr}`;
        whatsappPreview = `رسالة واتساب لولي الأمر (${student.parentPhone}): "تحية طيبة، نحيطكم علماً بوصول الطالب/ة ${student.name} لحصة الكيمياء (${selectedGroup.name}) الساعة ${nowTimeStr} في الموعد المحدد ✅"`;
        soundToPlay = 'success';
      } else if (simulatedOffsetMinutes <= 45) {
        attendanceStatus = 'late';
        badgeText = 'حاضر متأخر ⏰';
        badgeType = 'warning';
        resultMessage = `تم تسجيل: ${student.name} (حاضر متأخر +${simulatedOffsetMinutes} دقيقة)`;
        details = `وصل بعد مضي 15 دقيقة ولكن قبل انقضاء نصف الحصة — تم التوثيق وإشعار ولي الأمر.`;
        whatsappPreview = `رسالة واتساب لولي الأمر (${student.parentPhone}): "تنبيه: وصل الطالب/ة ${student.name} لحصة الكيمياء (${selectedGroup.name}) الساعة ${nowTimeStr} متأخراً بـ ${simulatedOffsetMinutes} دقيقة وتم تسجيله (حاضر متأخر) ⏰"`;
        soundToPlay = 'warning';
      } else {
        // PAST HALF SESSION -> ABSENT
        attendanceStatus = 'absent_cutoff';
        badgeText = 'غياب / تجاوز نصف الحصة ❌';
        badgeType = 'danger';
        resultMessage = `تنبيه: ${student.name} حضر بعد انقضاء نصف الحصة (+${simulatedOffsetMinutes}د)`;
        details = `تجاوز وقت الحضور المسموح به (أكثر من نصف الحصة) — تم تسجيله غياباً وإرسال إشعار فوري.`;
        whatsappPreview = `رسالة واتساب لولي الأمر (${student.parentPhone}): "تنبيه هام وعاجل: حضر الطالب/ة ${student.name} بعد انقضاء أكثر من نصف وقت الحصة (${simulatedOffsetMinutes} دقيقة). تم اعتباره غياباً يرجى مراجعة المعلم."`;
        soundToPlay = 'error';
      }

      // SAVE TO REAL DATABASE IF CONFIGURED
      if (isSupabaseConfigured) {
        dbService.recordAttendance({
          groupId: selectedGroup.id || '00000000-0000-0000-0000-000000000001',
          studentName: student.name,
          qrCode: student.qrCode,
          status: attendanceStatus === 'on_time' ? 'present' : attendanceStatus === 'late' ? 'late' : 'absent',
          homeworkStatus: 'completed',
          notes: `نافذة الحضور: ${attendanceStatus} (تأخير ${simulatedOffsetMinutes} دقيقة) - ${isNewAutoRegistered ? 'طالب مسجل آلياً' : ''}`,
        });
      }
    } else if (activeMode === 'add_student') {
      resultMessage = `تم قيد الطالب ${student.name} في ${selectedGroup.name} بنجاح!`;
      details = `تم ربط بطاقة الـ QR (${student.qrCode}) بالمجموعة وتحديث كشف الحضور.`;
      badgeText = `مقيد في ${selectedGroup.name.split(' ')[0]}`;
      badgeType = 'info';
      whatsappPreview = `رسالة واتساب لولي الأمر: "تم تسجيل قيد الطالب ${student.name} بنجاح في ${selectedGroup.name}."`;
      soundToPlay = 'success';
    } else if (activeMode === 'collect_fee') {
      const price = selectedGroup.priceAmount || Number(feeAmount) || 120;
      resultMessage = `تم تأكيد سداد مبلغ ${price} ج.م للطالب ${student.name} بنجاح!`;
      details = `تم إصدار إيصال معتمد (${selectedGroup.billingType === 'per_session' ? 'حساب بالحصة 2%' : 'حساب شهري'}).`;
      badgeText = `تم تحصيل ${price} ج.م ✓`;
      badgeType = 'navy';
      whatsappPreview = `رسالة واتساب لولي الأمر: "تم استلام مبلغ ${price} ج.م قيمة اشتراك حصة الكيمياء للطالب ${student.name}. إيصال رقم INV-${Date.now().toString().slice(-4)} ✅"`;
      soundToPlay = 'success';
    }

    // Simulated attendance log record
    if (activeMode === 'attendance') {
      console.log('Attendance logged successfully:', student.name, selectedGroup.name, nowTimeStr);
    } else if (activeMode === 'collect_fee') {
      const price = selectedGroup.priceAmount || Number(feeAmount) || 120;
      console.log('Payment collected:', student.name, price);
    }

    // Play Instant Audio Tone
    if (soundEnabled) {
      PLAY_AUDIO_SOUND(soundToPlay);
    }

    const newScan = {
      id: `sc-${Date.now()}`,
      mode: activeMode,
      name: student.name,
      time: `${nowTimeStr} ${activeMode === 'attendance' ? `(+${simulatedOffsetMinutes}د)` : ''}`,
      group: selectedGroup.name,
      code: student.qrCode,
      badgeText,
      badgeType,
      isNewAutoRegistered,
    };

    setLastScannedResult({
      student,
      mode: activeMode,
      message: resultMessage,
      details,
      attendanceStatus,
      whatsappPreview,
      isNewAutoRegistered,
      soundPlayed: soundToPlay === 'error' ? 'error' : 'success',
    });

    // Visual scanner flash
    setIsSuccessFlashing(true);
    setTimeout(() => {
      setIsSuccessFlashing(false);
    }, 600);

    setScanHistory((prev) => [newScan, ...prev]);
    setManualCode('');
  };

  return (
    <div className="space-y-6 text-right max-w-4xl mx-auto">
      
      {/* 1. Header & Live Clock Synchronization Panel */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
              <QrCode className="w-3.5 h-3.5" />
              <span>ماسح الـ QR الذكي فائق السرعة والمزامنة</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
              محطة عمليات ومسح الـ QR اللحظية
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              مزامنة المواعيد التلقائية، إشعار فوري لولي الأمر، وقيد فوري للطلاب غير المسجلين
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                soundEnabled ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-500 border-gray-300'
              }`}
              title="تفعيل/تعطيل صوت الإنذار والنجاح"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
              <span>{soundEnabled ? 'صوت التنبيه مفعّل' : 'صامت'}</span>
            </button>

            <Badge variant="success" size="lg">جاهز للمسح المتتالي ✓</Badge>
          </div>
        </div>

        {/* 2. AUTO-SYNCHRONIZED ACTIVE GROUP BANNER */}
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs animate-pulse">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600">المجموعة النشطة الحالية (مزامنة الوقت):</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                  مفعلة تلقائياً ⏰
                </span>
              </div>
              <h3 className="text-sm font-black text-[#1E3A8A] mt-0.5">{selectedGroup.name}</h3>
              <p className="text-[11px] text-gray-600">
                {selectedGroup.schedule} • {selectedGroup.location} • {selectedGroup.billingType === 'per_session' ? 'الحساب: 120 ج.م بالحصة (عمولة 2%)' : 'حساب شهري'}
              </p>
            </div>
          </div>

          {/* Group Switcher override */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <select
              value={selectedGroup.id}
              onChange={(e) => {
                const found = groups.find((g) => g.id === e.target.value);
                if (found) {
                  setSelectedGroup(found);
                  setIsAutoSyncActive(false); // Manual override
                }
              }}
              className="px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-[#1E3A8A] focus:outline-none focus:border-blue-600 cursor-pointer shadow-xs"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.schedule})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. OPERATIONAL MODES SELECTOR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Mode 1: Attendance Check-In */}
          <button
            onClick={() => { setActiveMode('attendance'); setLastScannedResult(null); }}
            className={`p-3.5 rounded-2xl border-2 text-right transition-all flex items-start gap-3 cursor-pointer ${
              activeMode === 'attendance'
                ? 'border-[#10B981] bg-emerald-50/80 shadow-xs'
                : 'border-gray-200 hover:border-gray-300 bg-gray-50/60'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shrink-0 ${
              activeMode === 'attendance' ? 'bg-[#10B981] text-white shadow-xs' : 'bg-gray-200 text-gray-600'
            }`}>
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1E3A8A] flex items-center gap-1.5">
                <span>1. تسجيل الحضور بالنافذة</span>
                {activeMode === 'attendance' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
              </div>
              <p className="text-[10px] text-[#6B7280] mt-0.5">
                أخضر (في الموعد) • برتقالي (متأخر) • أحمر (غياب بعد النصف)
              </p>
            </div>
          </button>

          {/* Mode 2: Add Student via QR */}
          <button
            onClick={() => { setActiveMode('add_student'); setLastScannedResult(null); }}
            className={`p-3.5 rounded-2xl border-2 text-right transition-all flex items-start gap-3 cursor-pointer ${
              activeMode === 'add_student'
                ? 'border-[#2563EB] bg-[#EFF6FF] shadow-xs'
                : 'border-gray-200 hover:border-gray-300 bg-gray-50/60'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shrink-0 ${
              activeMode === 'add_student' ? 'bg-[#2563EB] text-white shadow-xs' : 'bg-gray-200 text-gray-600'
            }`}>
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1E3A8A] flex items-center gap-1.5">
                <span>2. قيد طالب جديد (QR)</span>
                {activeMode === 'add_student' && <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />}
              </div>
              <p className="text-[10px] text-[#6B7280] mt-0.5">
                إضافة الطالب فورياً للمجموعة الحالية
              </p>
            </div>
          </button>

          {/* Mode 3: Collect Fee Payment */}
          <button
            onClick={() => { setActiveMode('collect_fee'); setLastScannedResult(null); }}
            className={`p-3.5 rounded-2xl border-2 text-right transition-all flex items-start gap-3 cursor-pointer ${
              activeMode === 'collect_fee'
                ? 'border-[#1E3A8A] bg-blue-50/80 shadow-xs'
                : 'border-gray-200 hover:border-gray-300 bg-gray-50/60'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shrink-0 ${
              activeMode === 'collect_fee' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'bg-gray-200 text-gray-600'
            }`}>
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1E3A8A] flex items-center gap-1.5">
                <span>3. تأكيد دفع المصاريف (QR)</span>
                {activeMode === 'collect_fee' && <span className="w-2 h-2 rounded-full bg-blue-900 animate-ping" />}
              </div>
              <p className="text-[10px] text-[#6B7280] mt-0.5">
                تحصيل وإصدار إيصال معتمد مع احتساب النسبة
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. ATTENDANCE TIME WINDOW SIMULATION CONTROLS */}
      {activeMode === 'attendance' && (
        <div className="p-4 bg-white border border-gray-200 rounded-3xl space-y-3 shadow-xs animate-drawer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <h4 className="text-xs font-bold text-[#1E3A8A]">
                محاكاة توقيت وصول الطالب بالنسبة لبداية الحصة (اختبار قاعدة نصف الحصة غياب):
              </h4>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                simulatedOffsetMinutes <= 15
                  ? 'bg-emerald-100 text-emerald-800'
                  : simulatedOffsetMinutes <= 45
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {simulatedOffsetMinutes <= 15
                ? '✅ في الموعد (0-15 دقيقة)'
                : simulatedOffsetMinutes <= 45
                ? '⏰ متأخر (16-45 دقيقة)'
                : '❌ غياب (تجاوز نصف الحصة)'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSimulatedOffsetMinutes(5)}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                simulatedOffsetMinutes === 5
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              في الموعد (+5 دقيقة) ✅
            </button>
            <button
              onClick={() => setSimulatedOffsetMinutes(25)}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                simulatedOffsetMinutes === 25
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              تأخير مقبول (+25 دقيقة) ⏰
            </button>
            <button
              onClick={() => setSimulatedOffsetMinutes(55)}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                simulatedOffsetMinutes === 55
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              بعد نصف الحصة = غياب (+55 دقيقة) ❌
            </button>
          </div>
        </div>
      )}

      {/* 5. SCANNING RESULT NOTIFICATION & LIVE WHATSAPP PREVIEW */}
      {lastScannedResult && (
        <div className="space-y-3 animate-scaleUp">
          <div
            className={`p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white ${
              lastScannedResult.attendanceStatus === 'late'
                ? 'bg-amber-600'
                : lastScannedResult.attendanceStatus === 'absent_cutoff'
                ? 'bg-red-600'
                : lastScannedResult.mode === 'add_student'
                ? 'bg-[#2563EB]'
                : lastScannedResult.mode === 'collect_fee'
                ? 'bg-[#1E3A8A]'
                : 'bg-emerald-600'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center font-black shrink-0 shadow-md">
                {lastScannedResult.attendanceStatus === 'absent_cutoff' ? (
                  <AlertCircle className="w-7 h-7 text-red-600" />
                ) : lastScannedResult.mode === 'attendance' ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                ) : lastScannedResult.mode === 'add_student' ? (
                  <UserPlus className="w-7 h-7 text-[#2563EB]" />
                ) : (
                  <Receipt className="w-7 h-7 text-[#1E3A8A]" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">{lastScannedResult.message}</h3>
                  {lastScannedResult.isNewAutoRegistered && (
                    <span className="px-2 py-0.5 bg-yellow-400 text-yellow-950 font-black text-[10px] rounded-md shadow-xs">
                      ✨ طالب جديد تم قيده آلياً
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/90">{lastScannedResult.details}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs font-mono font-bold bg-black/20 px-3 py-1.5 rounded-xl border border-white/20">
                {lastScannedResult.student.qrCode}
              </span>
            </div>
          </div>

          {/* WhatsApp Live Simulator Bubble */}
          {lastScannedResult.whatsappPreview && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#10B981] text-white flex items-center justify-center shrink-0 mt-0.5">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="space-y-1 w-full">
                <span className="font-bold text-[#10B981] flex items-center gap-1.5">
                  <span>تم إرسال إشعار واتساب تلقائي ومزامن لولي الأمر:</span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-emerald-200">فوري</span>
                </span>
                <p className="font-mono text-[11px] bg-white p-2.5 rounded-xl border border-emerald-100 leading-relaxed text-gray-800">
                  {lastScannedResult.whatsappPreview}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. REAL CAMERA SCANNER VIEWPORT */}
      <div className="bg-[#1F2937] rounded-3xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
        {/* Active Mode Tag Top */}
        <div className="mb-5 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/10 text-xs font-bold text-white">
            <ScanLine className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>الماسح نشط على: </span>
            <strong className="text-emerald-300">{selectedGroup.name}</strong>
          </div>

          <button
            type="button"
            onClick={() => setUseRealCamera(!useRealCamera)}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{useRealCamera ? 'الكاميرا الحقيقية نشطة ✓' : 'تفعيل الكاميرا الحقيقية'}</span>
          </button>
        </div>

        {/* Real Live Camera Scanner Box */}
        {useRealCamera ? (
          <div className="max-w-md mx-auto mb-5">
            <RealQRCameraScanner
              isActive={useRealCamera}
              onScanSuccess={(code) => {
                handleProcessScan(code);
              }}
            />
          </div>
        ) : (
          /* Simulated Scanner Viewfinder Box */
          <div
            className={`relative w-64 h-64 sm:w-80 sm:h-80 mx-auto rounded-3xl border-2 p-4 flex items-center justify-center overflow-hidden bg-black/40 shadow-2xl transition-all duration-300 ${
              isSuccessFlashing
                ? 'border-emerald-400 ring-8 ring-emerald-500/30 scale-[1.02]'
                : 'border-emerald-400/60'
            }`}
          >
            <div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-lg shadow-emerald-400/50"
              style={{ top: '45%' }}
            />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg border-emerald-400" />
            <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg border-emerald-400" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 rounded-br-lg border-emerald-400" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg border-emerald-400" />

            <div className="text-white/60 text-center space-y-2">
              <Camera className="w-12 h-12 mx-auto text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white block">ماسح الكود التفاعلي</span>
            </div>
          </div>
        )}

        {/* Quick Scan Action Buttons for Quick Access (Simulate fast queue) */}
        <div className="mt-5 space-y-2">
          <p className="text-xs font-bold text-gray-300">أو اضغط للمسح السريع المباشر (طابور الطلاب):</p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => handleProcessScan('HST-2026-09812', 'زياد أحمد محمود')}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>زياد أحمد (مسجل)</span>
            </button>

            <button
              onClick={() => handleProcessScan('HST-2026-11420', 'سارة محمد حسن')}
              className="px-3.5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>سارة محمد (مسجلة)</span>
            </button>

            <button
              onClick={() => handleProcessScan(`HST-NEW-${Date.now().toString().slice(-4)}`)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="طالب غير مسجل يمسح كوده لأول مرة"
            >
              <UserCheck className="w-4 h-4" />
              <span>طالب جديد غير مسجل (قيد فوري ✨)</span>
            </button>
          </div>
        </div>

        {/* Manual Code Input Fallback */}
        <div className="mt-5 pt-5 border-t border-white/10 max-w-sm mx-auto">
          <label className="block text-xs font-bold text-gray-300 mb-2 text-right">
            أو أدخل كود الطالب يدوياً:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="مثال: HST-2026-09812"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleProcessScan();
              }}
              className="flex-1 px-3.5 py-2.5 bg-black/30 border border-white/20 rounded-xl text-xs text-white text-right focus:outline-none focus:border-emerald-400 placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={() => handleProcessScan()}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              تسجيل
            </button>
          </div>
        </div>
      </div>

      {/* 7. RECENT SCAN HISTORY */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h3 className="text-base font-bold text-[#1E3A8A]">سجل عمليات المسح الأخيرة في هذه الجلسة</h3>
          </div>
          <span className="text-xs font-bold text-gray-400">{scanHistory.length} عملية مسح</span>
        </div>

        <div className="divide-y divide-gray-100">
          {scanHistory.map((scan) => (
            <div key={scan.id} className="py-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 text-[#1E3A8A] flex items-center justify-center font-black">
                  {scan.mode === 'attendance' ? '✓' : scan.mode === 'add_student' ? '+' : '$'}
                </div>
                <div>
                  <div className="font-bold text-[#1F2937] flex items-center gap-1.5">
                    <span>{scan.name}</span>
                    {scan.isNewAutoRegistered && (
                      <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold">
                        طالب جديد
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-2">
                    <span>{scan.group}</span>
                    <span>•</span>
                    <span className="font-mono">{scan.code}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-gray-400">{scan.time}</span>
                <Badge variant={scan.badgeType || 'success'} size="sm">
                  {scan.badgeText}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
