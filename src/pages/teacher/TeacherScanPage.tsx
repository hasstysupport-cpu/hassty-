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
  ShieldCheck
} from 'lucide-react';
import { MOCK_TEACHER_STUDENTS } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';

export const TeacherScanPage: React.FC = () => {
  const [manualCode, setManualCode] = useState('');
  const [lastScannedStudent, setLastScannedStudent] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([
    {
      id: 'sc-1',
      name: 'زياد أحمد محمود',
      time: '04:32:15 م',
      group: 'مجموعة السبت والثلاثاء',
      code: 'HST-2026-09812',
    },
    {
      id: 'sc-2',
      name: 'سارة محمد حسن',
      time: '04:30:40 م',
      group: 'مجموعة السبت والثلاثاء',
      code: 'HST-2026-11420',
    },
    {
      id: 'sc-3',
      name: 'عمر طارق إبراهيم',
      time: '04:28:10 م',
      group: 'مجموعة السبت والثلاثاء',
      code: 'HST-2026-88410',
    },
  ]);

  const [isScanning, setIsScanning] = useState(true);

  const handleSimulateScan = (codeToUse?: string) => {
    const code = codeToUse || manualCode || 'HST-2026-09812';
    
    // Find or mock student
    const student = MOCK_TEACHER_STUDENTS.find((s) => s.qrCode === code) || {
      name: 'زياد أحمد محمود',
      qrCode: code,
      groupName: 'مجموعة السبت والثلاثاء (سنتر الأهرام)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    };

    const newScan = {
      id: `sc-${Date.now()}`,
      name: student.name,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      group: student.groupName,
      code: student.qrCode,
    };

    setLastScannedStudent(student);
    setScanHistory([newScan, ...scanHistory]);
    setManualCode('');

    // Reset banner after 4 seconds
    setTimeout(() => {
      setLastScannedStudent(null);
    }, 4500);
  };

  return (
    <div className="space-y-8 text-right max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10B981] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-2">
              <ScanLine className="w-3.5 h-3.5" />
              <span>ماسح الحضور الذكي</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
              مسح وتوثيق حضور الطلاب بالـ QR
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              وجه كاميرا الهاتف أو الجهاز نحو كارنيه الطالب، وسيتم تسجيل الحضور وإشعار ولي الأمر فوراً
            </p>
          </div>

          <Badge variant="success" size="lg">الكاميرا متصلة وفعالة ✓</Badge>
        </div>
      </div>

      {/* SCANNING TOAST BANNER (SUCCESS) */}
      {lastScannedStudent && (
        <div className="p-4 bg-emerald-500 text-white rounded-3xl shadow-lg flex items-center justify-between gap-4 animate-scaleUp">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#10B981] flex items-center justify-center font-black shrink-0 shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-100">تم توثيق الحضور وإشعار ولي الأمر عبر واتساب ✓</span>
              <h3 className="text-base font-black text-white">{lastScannedStudent.name}</h3>
              <p className="text-[11px] text-emerald-100">{lastScannedStudent.groupName}</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold bg-white/20 px-3 py-1.5 rounded-xl">
            {lastScannedStudent.qrCode}
          </span>
        </div>
      )}

      {/* CAMERA SCANNER VIEWPORT */}
      <div className="bg-[#1F2937] rounded-3xl p-6 sm:p-10 shadow-xl text-center relative overflow-hidden">
        
        {/* Scanner Viewfinder Box */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto rounded-3xl border-2 border-emerald-400/60 p-4 flex items-center justify-center overflow-hidden bg-black/40">
          
          {/* Laser animated scan line */}
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-lg shadow-emerald-400/50" style={{ top: '45%' }} />

          {/* Corner Guides */}
          <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
          <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />

          {/* Center Target Icon */}
          <div className="text-white/60 text-center space-y-2">
            <Camera className="w-12 h-12 mx-auto text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white block">وجّه الكاميرا نحو كود الطالب</span>
          </div>

        </div>

        {/* Quick Simulator Scan Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => handleSimulateScan('HST-2026-09812')}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>تجربة مسح كارنيه: زياد أحمد</span>
          </button>

          <button
            onClick={() => handleSimulateScan('HST-2026-11420')}
            className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>تجربة مسح كارنيه: سارة حسن</span>
          </button>
        </div>

        {/* Manual Code Input Fallback */}
        <div className="mt-6 pt-6 border-t border-white/10 max-w-sm mx-auto">
          <label className="block text-xs font-bold text-gray-300 mb-2 text-right">
            أو أدخل كود الطالب يدوياً في حال عدم توفر الكاميرا:
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
              className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
            >
              تسجيل
            </button>
          </div>
        </div>

      </div>

      {/* RECENT CHECK-INS FEED */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <span>كشف الحضور اللحظي لحصة اليوم</span>
          </h3>
          <span className="text-xs font-bold text-[#10B981] bg-emerald-50 px-2.5 py-1 rounded-lg">
            {scanHistory.length} طالب حاضر
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {scanHistory.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#10B981] flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-[#1F2937] text-sm">{item.name}</h4>
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
