import React from 'react';
import { UserCheck, Search, QrCode, ArrowLeft } from 'lucide-react';
import { HOW_IT_WORKS_STEPS } from '../data/mockData';

interface HowItWorksSectionProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenTutorSearch: () => void;
  onOpenQRSimulator: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  onOpenAuth,
  onOpenTutorSearch,
  onOpenQRSimulator,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'UserCheck':
        return <UserCheck className="w-6 h-6 stroke-[2]" />;
      case 'Search':
        return <Search className="w-6 h-6 stroke-[2]" />;
      case 'QrCode':
        return <QrCode className="w-6 h-6 stroke-[2]" />;
      default:
        return <UserCheck className="w-6 h-6 stroke-[2]" />;
    }
  };

  const handleStepClick = (stepNum: number) => {
    if (stepNum === 1) onOpenAuth('register');
    if (stepNum === 2) onOpenTutorSearch();
    if (stepNum === 3) onOpenQRSimulator();
  };

  return (
    <section id="how-it-works" className="py-16 lg:py-24 bg-white border-b border-gray-200 relative overflow-hidden bg-grid-pattern">
      {/* Background soft glow rings */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-64 h-64 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-block px-3 py-1 bg-[#EFF6FF] text-[#2563EB] text-xs font-bold rounded-full mb-3">
            رحلة سهلة وسريعة
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F2937] tracking-tight mb-4">
            كيف تعمل <span className="text-[#2563EB]">حصتي؟</span>
          </h2>
          <p className="text-base text-[#6B7280]">
            ثلاث خطوات بسيطة تبدأ بيها رحلتك مع أمهر المدرسين ونظام حضور فوري بدون أي تعقيد.
          </p>
        </div>

        {/* 3 Numbered Steps with Icons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {HOW_IT_WORKS_STEPS.map((step, idx) => (
            <div
              key={step.number}
              onClick={() => handleStepClick(step.number)}
              className="bg-[#F8FAFF] border border-gray-200 rounded-2xl p-6 sm:p-7 relative transition-all hover:border-blue-300 hover:bg-white hover:shadow-xs group cursor-pointer text-right flex flex-col justify-between"
              id={`how-it-works-step-${step.number}`}
            >
              <div>
                {/* Step Top Bar: Icon + Step Number */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white border border-blue-100 text-[#2563EB] flex items-center justify-center group-hover:bg-[#2563EB] group-hover:text-white transition-colors shadow-2xs">
                    {getIcon(step.iconName)}
                  </div>
                  
                  <span className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] font-black text-sm flex items-center justify-center border border-blue-200">
                    {step.number}
                  </span>
                </div>

                {/* Step Content */}
                <h3 className="text-lg font-bold text-[#1F2937] group-hover:text-[#2563EB] transition-colors mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Action hint indicator */}
              <div className="mt-6 pt-4 border-t border-gray-200/60 flex items-center justify-between text-xs font-semibold text-[#2563EB] group-hover:translate-x-[-2px] transition-transform">
                <span>
                  {step.number === 1 && 'أنشئ حسابك الآن'}
                  {step.number === 2 && 'تصفح المدرسين المتاحين'}
                  {step.number === 3 && 'شاهد تجربة الحضور'}
                </span>
                <ArrowLeft className="w-4 h-4 stroke-[2]" />
              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
};
