import React, { useState } from 'react';
import { Sparkles, AlertCircle, X, ChevronUp } from 'lucide-react';

export const DevDisclaimerFloatingPill: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        className="fixed bottom-4 left-4 z-50 bg-[#1E3A8A] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-blue-400/30 hover:bg-[#1D4ED8] transition-all flex items-center gap-1.5 opacity-80 hover:opacity-100 cursor-pointer"
        title="إظهار تنبيه التطوير"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        <span>نسخة التطوير (Beta)</span>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50 select-none">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-white/95 backdrop-blur-md text-gray-800 text-xs font-bold px-3.5 py-2 rounded-2xl shadow-xl border border-blue-200 flex items-center gap-2 hover:bg-blue-50 transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span className="text-[11px] text-blue-900 font-extrabold">جميع البيانات الواردة في مرحلة التطوير</span>
          <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
        </button>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="fixed bottom-4 left-4 sm:left-6 z-50 max-w-[92vw] sm:max-w-md select-none animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E40AF] to-[#0D9488] text-white p-2.5 sm:px-4 sm:py-2.5 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md flex items-center justify-between gap-3">
        
        {/* Left/Right Content */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          </div>
          <div className="truncate">
            <p className="text-[11px] sm:text-xs font-bold text-white leading-tight flex items-center gap-1.5">
              <span>جميع البيانات الواردة في مرحلة التطوير والتجربة</span>
              <span className="bg-amber-400/30 text-amber-200 text-[9px] font-black px-1.5 py-0.2 rounded-md border border-amber-300/40">
                BETA
              </span>
            </p>
            <p className="text-[9.5px] text-blue-100/90 font-medium truncate mt-0.5">
              المنظومة في تحديث مستمر — تحقق الواتساب يعمل بنظام المحاكاة الفوري
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors cursor-pointer text-[10px] font-bold"
            title="تصغير"
          >
            تصغير
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-white/60 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors cursor-pointer"
            title="إخفاء التنبيه"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
