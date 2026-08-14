import React, { useState } from 'react';
import {
  QrCode,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Info,
  MapPin
} from 'lucide-react';
import { MOCK_CURRENT_STUDENT } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';

export const StudentQRCardPage: React.FC = () => {
  const student = MOCK_CURRENT_STUDENT;
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadCard = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="space-y-8 text-right max-w-4xl mx-auto">
      
      {/* Top Intro */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
              <QrCode className="w-3.5 h-3.5" />
              <span>بطاقة الطالب الذكية</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
              كارنيه الـ QR الرقمي الخاص بك
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              هذا هو الكود الموحد لتسجيل حضورك في جميع الدروس والسناتر في مصر.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintCard}
              className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-[#1F2937] text-xs font-bold rounded-xl border border-[#E5E7EB] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكارنيه</span>
            </button>

            <button
              onClick={handleDownloadCard}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>حفظ كصورة</span>
            </button>
          </div>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>تم حفظ صورة الكارنيه بنجاح على جهازك!</span>
        </div>
      )}

      {/* ID CARD VISUAL (PRINTABLE FORMAT) */}
      <div className="bg-[#1E3A8A] text-white rounded-3xl p-6 sm:p-10 shadow-xl max-w-md mx-auto relative overflow-hidden border-4 border-blue-400/30">
        
        {/* Background Watermark/Pattern */}
        <div className="absolute -left-10 -bottom-10 opacity-10 pointer-events-none">
          <QrCode className="w-64 h-64" />
        </div>

        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/20 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">حِصّتي</h3>
              <span className="text-[10px] text-blue-200 block">بطاقة طالب معتمدة</span>
            </div>
          </div>
          <Badge variant="info" size="sm">مصر 2026</Badge>
        </div>

        {/* Card Body */}
        <div className="py-6 space-y-6 relative z-10">
          
          {/* Avatar + Info */}
          <div className="flex items-center gap-4">
            <img
              src={student.avatarUrl}
              alt={student.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white ring-2 ring-blue-300 shadow-md"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-1">
              <h4 className="text-lg font-black text-white">{student.name}</h4>
              <p className="text-xs text-blue-200 font-semibold">{student.grade}</p>
              <div className="flex items-center gap-1 text-[11px] text-blue-300">
                <MapPin className="w-3 h-3" />
                <span>{student.governorate} — {student.area}</span>
              </div>
            </div>
          </div>

          {/* LARGE QR CODE BOX */}
          <div className="bg-white p-4 rounded-2xl shadow-md text-center max-w-[220px] mx-auto border-2 border-blue-200">
            <div className="w-44 h-44 mx-auto bg-[#1E3A8A] rounded-xl p-3 flex flex-col justify-between text-white relative">
              
              {/* Stylized QR Code Visual */}
              <div className="flex justify-between">
                <div className="w-9 h-9 bg-white rounded-xs p-1"><div className="w-full h-full bg-[#1E3A8A]" /></div>
                <div className="w-9 h-9 bg-white rounded-xs p-1"><div className="w-full h-full bg-[#1E3A8A]" /></div>
              </div>
              <div className="text-center font-mono font-black text-xs tracking-widest bg-white text-[#1E3A8A] py-1 rounded-sm">
                HST-QR-2026
              </div>
              <div className="flex justify-between">
                <div className="w-9 h-9 bg-white rounded-xs p-1"><div className="w-full h-full bg-[#1E3A8A]" /></div>
                <div className="w-6 h-6 bg-emerald-400 rounded-xs" />
              </div>
            </div>

            <p className="text-[11px] font-mono font-black text-[#1E3A8A] mt-2">
              {student.qrCode}
            </p>
          </div>

        </div>

        {/* Card Footer */}
        <div className="pt-4 border-t border-white/20 flex items-center justify-between text-[11px] text-blue-200 relative z-10">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>موثق رسمياً بنظام حصتي</span>
          </span>
          <span>صالح حتى: 2026/2027</span>
        </div>

      </div>

      {/* Instructions Box */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#1E3A8A] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#2563EB]" />
          <span>كيف تستخدم هذا الكارنيه في الحصص؟</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#4B5563]">
          <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5 border border-gray-100">
            <span className="font-bold text-[#2563EB] block text-sm">1. عند دخول الحصة</span>
            <p>أظهر هذا الكود من هاتفك أو اطبع الكارنيه واحتفظ به في محفظتك المدرسية.</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5 border border-gray-100">
            <span className="font-bold text-[#2563EB] block text-sm">2. المسح السريع</span>
            <p>يقوم المعلم بمسح الكود بكاميرا هاتفه في ثانية واحدة لتسجيل حضورك.</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5 border border-gray-100">
            <span className="font-bold text-[#2563EB] block text-sm">3. إشعار ولي الأمر</span>
            <p>يصل إشعار فوري لولي أمرك على واتساب لتأكيد وصولك للحصة بأمان.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
