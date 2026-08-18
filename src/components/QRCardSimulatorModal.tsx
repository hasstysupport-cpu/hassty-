import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, QrCode, CheckCircle2, ShieldCheck, Sparkles, MessageSquare, Phone, RefreshCw, GraduationCap } from 'lucide-react';

interface QRCardSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCardSimulatorModal: React.FC<QRCardSimulatorModalProps> = ({ isOpen, onClose }) => {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'confirmed'>('idle');
  const [activeSession, setActiveSession] = useState({
    subject: 'الرياضيات - م/ أحمد عصام',
    time: 'اليوم، 04:30 مساءً',
    location: 'سنتر التفوق - الدقي، الجيزة',
    cost: '140 ج.م',
  });

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    setScanState('scanning');
    setTimeout(() => {
      setScanState('confirmed');
    }, 1200);
  };

  const handleReset = () => {
    setScanState('idle');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8 flex flex-col text-right animate-scaleUp">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-[#F8FAFF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center">
              <QrCode className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1E3A8A]">محاكي بطاقة الطالب وتسجيل الحضور</h2>
              <p className="text-xs text-[#6B7280]">شاهد كيف يعمل مسح الـ QR الآلي وإشعار ولي الأمر الفوري</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
            aria-label="إغلاق"
            id="btn-close-qr-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          
          {/* Digital Student Card Simulation */}
          <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden shadow-md">
            
            {/* Card Watermark */}
            <div className="absolute -left-6 -bottom-6 opacity-10 text-white pointer-events-none">
              <GraduationCap className="w-44 h-44" />
            </div>

            {/* Top Bar inside Card */}
            <div className="flex items-center justify-between pb-4 border-b border-white/20 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-xs font-black text-sm">
                  حصتي
                </div>
                <div>
                  <h3 className="text-sm font-bold">بطاقة الطالب الذكية</h3>
                  <p className="text-[10px] text-blue-200">الجمهورية — العام الدراسي 2026</p>
                </div>
              </div>

              <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                حساب موثق
              </span>
            </div>

            {/* Card Body */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              
              {/* Student details (8 cols) */}
              <div className="sm:col-span-8 space-y-2 text-right">
                <div>
                  <span className="text-[11px] text-blue-200 block">اسم الطالب:</span>
                  <span className="text-base sm:text-lg font-black">زياد أحمد عبد المنعم</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-blue-200 block">المرحلة:</span>
                    <span className="font-semibold">الثانوية العامة (علمي)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-200 block">المحافظة:</span>
                    <span className="font-semibold">الجيزة - الدقي</span>
                  </div>
                </div>

                <div className="pt-2 text-xs font-mono font-bold text-blue-100 flex items-center gap-2">
                  <span className="bg-black/20 px-2 py-0.5 rounded">ID: HST-8921-EG</span>
                </div>
              </div>

              {/* QR Code Container (4 cols) */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center">
                <div className="bg-white p-2.5 rounded-xl text-[#1E3A8A] shadow-inner relative">
                  <QrCode className="w-24 h-24 stroke-[1.8]" />
                  {scanState === 'scanning' && (
                    <div className="absolute inset-0 bg-blue-600/30 rounded-xl flex items-center justify-center">
                      <div className="w-full h-1 bg-emerald-400 absolute animate-bounce" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-blue-100 mt-1.5 font-medium">امسح لتسجيل الحضور</span>
              </div>

            </div>

          </div>

          {/* Live Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-xs text-[#1F2937] text-right">
              <span className="font-bold text-[#1E3A8A] block">الحصة المستهدفة للمسح:</span>
              <span>{activeSession.subject} — {activeSession.location}</span>
            </div>

            {scanState === 'idle' && (
              <button
                onClick={handleSimulateScan}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 transition-all"
                id="btn-simulate-qr-scan"
              >
                <Sparkles className="w-4 h-4" />
                <span>محاكاة مسح الكود عند دخول الحصة</span>
              </button>
            )}

            {scanState === 'scanning' && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB] py-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري توثيق الحضور وإرسال الإشعار...</span>
              </div>
            )}

            {scanState === 'confirmed' && (
              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة التجربة</span>
              </button>
            )}
          </div>

          {/* WhatsApp Notification Preview (Appears when confirmed) */}
          {scanState === 'confirmed' && (
            <div className="bg-[#E7F6E9] border border-[#25D366]/40 rounded-2xl p-5 text-right space-y-3 animate-in fade-in duration-300">
              
              <div className="flex items-center justify-between pb-2 border-b border-[#25D366]/20">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <div className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span>إشعار واتساب فوري لولي الأمر (مُرسل تلقائياً)</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold">الآن 04:30 م</span>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-emerald-200/70 text-xs leading-relaxed text-gray-800 space-y-1.5 shadow-2xs">
                <p className="font-bold text-[#1E3A8A]">
                  📍 إشعار حضور جديد — منصة حِصّتي:
                </p>
                <p>
                  نحيطكم علماً بأن الطالب <strong className="text-[#1E3A8A]">زياد أحمد</strong> قد تم تسجيل حضوره بنجاح في:
                </p>
                <ul className="text-gray-700 space-y-0.5 pr-2 font-medium">
                  <li>• المادة: <strong>رياضيات (ثانوية عامة)</strong></li>
                  <li>• المعلم: <strong>م/ أحمد عصام</strong></li>
                  <li>• الموعد: <strong>اليوم، الساعة 04:30 مساءً</strong></li>
                  <li>• الحالة: <strong className="text-emerald-600">حاضر وموثق بالـ QR ✔️</strong></li>
                </ul>
              </div>

              <p className="text-[11px] text-emerald-800">
                ✨ تم تحديث سجل الحضور في لوحة تحكم المدرس وولي الأمر بدون أي تدخل يدوي.
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 cursor-pointer"
          >
            إغلاق المعاينة
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
