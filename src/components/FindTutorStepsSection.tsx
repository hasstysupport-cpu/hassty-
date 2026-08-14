import React from 'react';
import { MapPin, Star, UserPlus, CalendarCheck } from 'lucide-react';
import { FIND_TUTOR_STEPS } from '../data/mockData';

interface FindTutorStepsSectionProps {
  onOpenTutorSearch: () => void;
}

export const FindTutorStepsSection: React.FC<FindTutorStepsSectionProps> = ({ onOpenTutorSearch }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'MapPin':
        return <MapPin className="w-5 h-5 stroke-[2]" />;
      case 'Star':
        return <Star className="w-5 h-5 stroke-[2]" />;
      case 'UserPlus':
        return <UserPlus className="w-5 h-5 stroke-[2]" />;
      case 'CalendarCheck':
        return <CalendarCheck className="w-5 h-5 stroke-[2]" />;
      default:
        return <MapPin className="w-5 h-5 stroke-[2]" />;
    }
  };

  return (
    <section className="py-16 lg:py-20 bg-[#F8FAFF] border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight mb-3">
            إزاي تلاقي مدرسك <span className="text-[#2563EB]">بسهولة؟</span>
          </h2>
          <p className="text-base text-[#6B7280]">
            طريقة بحث ذكية ومحايدة تضمن لك الوصول لأفضل مدرس يناسب مستواك وموقعك.
          </p>
        </div>

        {/* 4-Step Process Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FIND_TUTOR_STEPS.map((step) => (
            <div
              key={step.number}
              className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 text-right flex flex-col justify-between hover:border-blue-300 hover:shadow-xs transition-all"
              id={`find-tutor-step-${step.number}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                    {getIcon(step.iconName)}
                  </div>
                  <span className="text-xs font-bold text-[#6B7280] bg-gray-100 px-2 py-0.5 rounded-md">
                    خطوة {step.number}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#1F2937] mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                  {step.description}
                </p>
              </div>

              {step.number === 1 && (
                <button
                  onClick={onOpenTutorSearch}
                  className="mt-4 pt-3 border-t border-gray-100 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
                  id="find-step-quick-search-btn"
                >
                  <span>جرب البحث التفاعلي الآن</span>
                </button>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
