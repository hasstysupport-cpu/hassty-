import React from 'react';
import { Presentation, ArrowLeft, CheckCircle2, ShieldCheck, Users, Sparkles } from 'lucide-react';

interface TeacherCTASectionProps {
  onJoinAsTeacher: () => void;
}

export const TeacherCTASection: React.FC<TeacherCTASectionProps> = ({ onJoinAsTeacher }) => {
  return (
    <section className="bg-[#1E3A8A] text-white py-16 lg:py-20 relative overflow-hidden">
      {/* Background subtle geometric accents and gentle animated glows */}
      <div 
        className="absolute top-0 right-0 w-[450px] h-[450px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-subtle"
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-400/15 rounded-full blur-3xl pointer-events-none animate-pulse-subtle"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-xs font-semibold mb-6">
            <Presentation className="w-4 h-4 text-[#2563EB] bg-white rounded-full p-0.5" />
            <span>انضم لمجتمع معلمي مصر المتميزين</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-5 leading-tight">
            هل أنت مدرس وتبحث عن تنظيم مجموعاتك والوصول لمزيد من الطلاب؟
          </h2>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-blue-100/90 leading-relaxed max-w-2xl mx-auto mb-8">
            انضم لآلاف المعلمين الذين يعتمدون على حصتي لأتمتة الحضور بالـ QR، وتلقي حجوزات الطلاب بسهولة، بدون أي تعقيدات محاسبية.
          </p>

          {/* Key Advantages Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-10 text-xs sm:text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>بدون أي اشتراك شهري ثابت</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>عمولة عادلة تنخفض مع زيادة طلابك</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>لوحة تحكم ذكية للحضور والماليات</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onJoinAsTeacher}
              className="w-full sm:w-auto px-8 py-4 bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-base rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              id="teacher-cta-join-btn"
            >
              <span>انضم كمدرس الآن</span>
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          <p className="text-xs text-blue-200/80 mt-4">
            التسجيل والتوثيق يستغرق أقل من دقيقتين
          </p>

        </div>
      </div>
    </section>
  );
};
