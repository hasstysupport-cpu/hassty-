import React, { useState } from 'react';
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
  Check
} from 'lucide-react';
import { MOCK_TEACHER_STUDENTS, MOCK_TEACHER_GROUPS } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';

type ScanMode = 'attendance' | 'add_student' | 'collect_fee';

export const TeacherScanPage: React.FC = () => {
  const [activeMode, setActiveMode] = useState<ScanMode>('attendance');
  const [manualCode, setManualCode] = useState('');
  const [selectedGroupForAdd, setSelectedGroupForAdd] = useState(MOCK_TEACHER_GROUPS[0].name);
  const [feeAmount, setFeeAmount] = useState('120');
  const [lastScannedResult, setLastScannedResult] = useState<{
    student: any;
    mode: ScanMode;
    message: string;
    details?: string;
  } | null>(null);
  const [isSuccessFlashing, setIsSuccessFlashing] = useState(false);

  const [scanHistory, setScanHistory] = useState<any[]>([
    {
      id: 'sc-1',
      mode: 'attendance',
      name: 'زياد أحمد محمود',
      time: '04:32:15 م',
      group: 'مجموعة السبت والثلاثاء',
      code: 'HST-2026-09812',
      badgeText: 'حضور مسجل ✓',
      badgeType: 'success'
    },
    {
      id: 'sc-2',
      mode: 'collect_fee',
      name: 'سارة محمد حسن',
      time: '04:30:40 م',
      group: 'مجموعة السبت والثلاثاء',
      code: 'HST-2026-11420',
      badgeText: 'تم تحصيل 120 ج.م ✓',
      badgeType: 'navy'
    },
    {
      id: 'sc-3',
      mode: 'add_student',
      name: 'عمر طارق إبراهيم',
      time: '04:28:10 م',
      group: 'مجموعة الأحد والأربعاء',
      code: 'HST-2026-88410',
      badgeText: 'تم القيد للمجموعة ✓',
      badgeType: 'info'
    },
  ]);

  const handleSimulateScan = (codeToUse?: string, customStudentName?: string) => {
    const code = codeToUse || manualCode || 'HST-2026-09812';
    
    // Find or mock student
    const student = MOCK_TEACHER_STUDENTS.find((s) => s.qrCode === code) || {
      name: customStudentName || 'زياد أحمد محمود',
      qrCode: code,
      phone: '01098765432',
      parentPhone: '01123456789',
      groupName: activeMode === 'add_student' ? selectedGroupForAdd : 'مجموعة السبت والثلاثاء (سنتر الأهرام)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    };

    let resultMessage = '';
    let details = '';
    let badgeText = '';
    let badgeType: 'success' | 'navy' | 'info' | 'warning' = 'success';

    if (activeMode === 'attendance') {
      resultMessage = `تم تسجيل حضور ${student.name} بنجاح!`;
      details = 'تم إرسال إشعار واتساب تلقائي لولي الأمر بوصول الطالب للسنتر.';
      badgeText = 'حضور مسجل ✓';
      badgeType = 'success';
    } else if (activeMode === 'add_student') {
      resultMessage = `تم قيد الطالب ${student.name} إلى ${selectedGroupForAdd} بنجاح!`;
      details = `تم ربط بطاقة الـ QR (${student.qrCode}) بالمجموعة وإشعار الطالب.`;
      badgeText = `مقيد في ${selectedGroupForAdd.split(' ')[0]}`;
      badgeType = 'info';
    } else if (activeMode === 'collect_fee') {
      resultMessage = `تم تأكيد سداد مبلغ ${feeAmount} ج.م للطالب ${student.name} بنجاح!`;
      details = `تم إصدار إيصال سداد إلكتروني فوري وتحديث حالة الطالب لـ "مسدد".`;
      badgeText = `تم تحصيل ${feeAmount} ج.م ✓`;
      badgeType = 'navy';
    }

    const newScan = {
      id: `sc-${Date.now()}`,
      mode: activeMode,
      name: student.name,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      group: activeMode === 'add_student' ? selectedGroupForAdd : student.groupName,
      code: student.qrCode,
      badgeText,
      badgeType
    };

    setLastScannedResult({
      student,
      mode: activeMode,
      message: resultMessage,
      details
    });

    // Trigger visual scanner flash & sound
    setIsSuccessFlashing(true);
    setTimeout(() => {
      setIsSuccessFlashing(false);
    }, 850);

    setScanHistory([newScan, ...scanHistory]);
    setManualCode('');

    // Reset toast after 5 seconds
    setTimeout(() => {
      setLastScannedResult(null);
    }, 5500);
  };

  return (
    <div className="space-y-8 text-right max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-blue-50 px-3 py-1 rounded-full border border-blue-200 mb-2">
              <QrCode className="w-3.5 h-3.5" />
              <span>نظام الـ QR الشامل للمعلم</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
              محطة عمليات الـ QR المركزية
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              تسجيل الحضور اللحظي، إضافة طلاب جدد للمجموعات، وتأكيد تحصيل مبالغ الحصص بمسحة واحدة
            </p>
          </div>

          <Badge variant="success" size="lg">الكاميرا والماسح متصلان ✓</Badge>
        </div>

        {/* 3 OPERATIONAL MODES SELECTOR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100">
          
          {/* Mode 1: Attendance Check-In */}
          <button
            onClick={() => { setActiveMode('attendance'); setLastScannedResult(null); }}
            className={`p-4 rounded-2xl border-2 text-right transition-all flex items-start gap-3.5 cursor-pointer ${
              activeMode === 'attendance'
                ? 'border-[#10B981] bg-emerald-50/70 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 bg-gray-50/60'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${
              activeMode === 'attendance' ? 'bg-[#10B981] text-white shadow-xs' : 'bg-gray-200 text-gray-600'
            }`}>
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1E3A8A] flex items-center gap-1.5">
                <span>1. تسجيل الحضور</span>
                {activeMode === 'attendance' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
              </div>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                مسح كارنيه الطالب لتسجيل دخوله للحصة وإشعار ولي أمره فوراً
              </p>
            </div>
          </button>

          {/* Mode 2: Add Student via QR */}
          <button
            onClick={() => { setActiveMode('add_student'); setLastScannedResult(null); }}
            className={`p-4 rounded-2xl border-2 text-right transition-all flex items-start gap-3.5 cursor-pointer ${
              activeMode === 'add_student'
                ? 'border-[#2563EB] bg-[#EFF6FF] shadow-sm'
                : 'border-gray-200 hover:border-gray-300 bg-gray-50/60'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${
              activeMode === 'add_student' ? 'bg-[#2563EB] text-white shadow-xs' : 'bg-gray-200 text-gray-600'
            }`}>
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1E3A8A] flex items-center gap-1.5">
                <span>2. قيد طالب جديد (QR)</span>
                {activeMode === 'add_student' && <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />}
              </div>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                مسح كود الطالب لإضافته لمجموعتك وقيده بالسجل بضغطة زر
              </p>
            </div>
          </button>

          {/* Mode 3: Collect & Confirm Fee Payment via QR */}
          <button
            onClick={() => { setActiveMode('collect_fee'); setLastScannedResult(null); }}
            className={`p-4 rounded-2xl border-2 text-right transition-all flex items-start gap-3.5 cursor-pointer ${
              activeMode === 'collect_fee'
                ? 'border-[#1E3A8A] bg-blue-50/80 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 bg-gray-50/60'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${
              activeMode === 'collect_fee' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'bg-gray-200 text-gray-600'
            }`}>
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1E3A8A] flex items-center gap-1.5">
                <span>3. تأكيد دفع المصاريف (QR)</span>
                {activeMode === 'collect_fee' && <span className="w-2 h-2 rounded-full bg-blue-900 animate-ping" />}
              </div>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                مسح الكود لتسديد اشتراك الحصة/الشهر وإصدار إيصال معتمد
              </p>
            </div>
          </button>

        </div>
      </div>

      {/* MODE SPECIFIC CONTROLS & CONTEXT */}
      {activeMode === 'add_student' && (
        <div className="p-4 sm:p-5 bg-[#EFF6FF] border border-blue-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-drawer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1E3A8A]">المجموعة المراد قيد الطالب فيها عند المسح:</h4>
              <p className="text-[11px] text-[#6B7280]">سيتم إدراج أي طالب تقوم بمسح بطاقته مباشرة في هذه المجموعة</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1F2937] shrink-0">المجموعة:</span>
            <select
              value={selectedGroupForAdd}
              onChange={(e) => setSelectedGroupForAdd(e.target.value)}
              className="px-3.5 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer shadow-xs"
            >
              {MOCK_TEACHER_GROUPS.map((g) => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {activeMode === 'collect_fee' && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-[#1E3A8A] text-white rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-drawer shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">قيمة المبلغ المراد تحصيله وتأكيده بالـ QR:</h4>
              <p className="text-[11px] text-blue-100">مسح كود الطالب سيقوم بتسديد هذا المبلغ فورا وإصدار إيصال معتمد</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-100 shrink-0">المبلغ:</span>
            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-xl border border-white/20">
              <input
                type="number"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                className="w-20 px-2 py-1 bg-white text-gray-900 font-bold font-mono rounded-lg text-xs text-center focus:outline-none"
              />
              <span className="text-xs font-bold text-white">ج.م</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <button 
                type="button" 
                onClick={() => setFeeAmount('120')}
                className={`px-2 py-1 rounded-lg border text-[11px] font-bold ${feeAmount === '120' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white/10 border-white/20 text-white'}`}
              >
                120 حصة
              </button>
              <button 
                type="button" 
                onClick={() => setFeeAmount('480')}
                className={`px-2 py-1 rounded-lg border text-[11px] font-bold ${feeAmount === '480' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white/10 border-white/20 text-white'}`}
              >
                480 شهر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCANNING TOAST BANNER (SUCCESS WITH FULL DETAILS) */}
      {lastScannedResult && (
        <div className={`p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-scaleUp text-white ${
          lastScannedResult.mode === 'attendance'
            ? 'bg-emerald-600'
            : lastScannedResult.mode === 'add_student'
            ? 'bg-[#2563EB]'
            : 'bg-[#1E3A8A]'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center font-black shrink-0 shadow-md">
              {lastScannedResult.mode === 'attendance' && <CheckCircle2 className="w-7 h-7 text-emerald-600" />}
              {lastScannedResult.mode === 'add_student' && <UserPlus className="w-7 h-7 text-[#2563EB]" />}
              {lastScannedResult.mode === 'collect_fee' && <Receipt className="w-7 h-7 text-[#1E3A8A]" />}
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold opacity-90 block">
                {lastScannedResult.mode === 'attendance' ? '✓ تم تسجيل الحضور اللحظي' : lastScannedResult.mode === 'add_student' ? '✓ تم قيد الطالب للمجموعة' : '✓ تم سداد المبلغ وإصدار الإيصال'}
              </span>
              <h3 className="text-base font-black text-white">{lastScannedResult.message}</h3>
              <p className="text-xs text-white/80">{lastScannedResult.details}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs font-mono font-bold bg-black/20 px-3 py-1.5 rounded-xl border border-white/20">
              {lastScannedResult.student.qrCode}
            </span>
          </div>
        </div>
      )}

      {/* CAMERA SCANNER VIEWPORT */}
      <div className="bg-[#1F2937] rounded-3xl p-6 sm:p-10 shadow-xl text-center relative overflow-hidden">
        
        {/* Active Mode Tag Top */}
        <div className="mb-6 inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/10 text-xs font-bold text-white">
          <ScanLine className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>الوضع النشط الآن: </span>
          <strong className="text-emerald-300">
            {activeMode === 'attendance' ? 'تسجيل الحضور' : activeMode === 'add_student' ? `إضافة طالب لـ (${selectedGroupForAdd})` : `تحصيل مبلغ (${feeAmount} ج.م)`}
          </strong>
        </div>

        {/* Scanner Viewfinder Box */}
        <div className={`relative w-64 h-64 sm:w-80 sm:h-80 mx-auto rounded-3xl border-2 p-4 flex items-center justify-center overflow-hidden bg-black/40 shadow-2xl transition-all duration-300 ${
          isSuccessFlashing
            ? 'border-emerald-400 ring-8 ring-emerald-500/30 scale-[1.02]'
            : 'border-emerald-400/60'
        }`}>
          
          {/* Success Flash Overlay & Expansion Rings */}
          {isSuccessFlashing && (
            <>
              <div className="absolute inset-0 bg-emerald-500/30 z-20 animate-scan-flash pointer-events-none" />
              <div className="absolute inset-0 border-4 border-emerald-400 rounded-3xl z-20 animate-success-ring pointer-events-none" />
            </>
          )}

          {/* Laser animated scan line (hides during flash confirmation) */}
          {!isSuccessFlashing ? (
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-lg shadow-emerald-400/50" style={{ top: '45%' }} />
          ) : (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-400 shadow-xl shadow-emerald-300" />
          )}

          {/* Corner Guides */}
          <div className={`absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg transition-colors duration-300 ${isSuccessFlashing ? 'border-emerald-300' : 'border-emerald-400'}`} />
          <div className={`absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg transition-colors duration-300 ${isSuccessFlashing ? 'border-emerald-300' : 'border-emerald-400'}`} />
          <div className={`absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 rounded-br-lg transition-colors duration-300 ${isSuccessFlashing ? 'border-emerald-300' : 'border-emerald-400'}`} />
          <div className={`absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg transition-colors duration-300 ${isSuccessFlashing ? 'border-emerald-300' : 'border-emerald-400'}`} />

          {/* Center Target Icon OR Confirmation Animation */}
          {isSuccessFlashing ? (
            <div className="relative z-30 flex flex-col items-center justify-center space-y-2 animate-scaleUp">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>
              <span className="text-sm font-black text-emerald-300 tracking-wide">
                تم المسح بنجاح!
              </span>
            </div>
          ) : (
            <div className="text-white/60 text-center space-y-2">
              <Camera className="w-12 h-12 mx-auto text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white block">وجّه الكاميرا نحو كود الطالب</span>
            </div>
          )}

        </div>

        {/* Quick Simulator Scan Action Buttons for Teacher Demo */}
        <div className="mt-6 space-y-2">
          <p className="text-xs font-bold text-gray-300">جرّب المسح التلقائي السريع لكارنيهات الطلاب:</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleSimulateScan('HST-2026-09812', 'زياد أحمد محمود')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>مسح كارنيه: زياد أحمد</span>
            </button>

            <button
              onClick={() => handleSimulateScan('HST-2026-11420', 'سارة محمد حسن')}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>مسح كارنيه: سارة حسن</span>
            </button>

            <button
              onClick={() => handleSimulateScan('HST-2026-88410', 'عمر طارق إبراهيم')}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>مسح كارنيه: عمر طارق</span>
            </button>
          </div>
        </div>

        {/* Manual Code Input Fallback */}
        <div className="mt-6 pt-6 border-t border-white/10 max-w-sm mx-auto">
          <label className="block text-xs font-bold text-gray-300 mb-2 text-right">
            أو أدخل كود الطالب يدوياً:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="مثال: HST-2026-09812"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-800 text-white border border-gray-700 rounded-xl text-xs font-mono text-center focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={() => handleSimulateScan()}
              className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 active:scale-95"
            >
              تنفيذ
            </button>
          </div>
        </div>

      </div>

      {/* RECENT QR OPERATIONS LOG */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <span>سجل عمليات الـ QR المنفذة اليوم</span>
          </h3>
          <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-3 py-1 rounded-lg">
            {scanHistory.length} عملية موثقة
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {scanHistory.map((item) => (
            <div key={item.id} className="py-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  item.mode === 'attendance'
                    ? 'bg-emerald-100 text-[#10B981]'
                    : item.mode === 'collect_fee'
                    ? 'bg-blue-100 text-[#1E3A8A]'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {item.mode === 'attendance' && <ScanLine className="w-4 h-4" />}
                  {item.mode === 'collect_fee' && <Receipt className="w-4 h-4" />}
                  {item.mode === 'add_student' && <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#1F2937] text-sm">{item.name}</h4>
                    <Badge variant={item.badgeType} size="sm">
                      {item.badgeText}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-[#6B7280]">{item.group}</span>
                </div>
              </div>

              <div className="text-left">
                <span className="font-mono font-bold text-[#2563EB] block">{item.code}</span>
                <span className="text-[10px] text-gray-400">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

