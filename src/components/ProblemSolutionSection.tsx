import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PROBLEM_SOLUTION_CARDS } from '../data/mockData';

export const ProblemSolutionSection: React.FC = () => {
  return (
    <section id="problem-solution" className="py-16 lg:py-20 bg-[#F8FAFF] border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight mb-4">
            المشكلة اللي بتواجهك... <span className="text-[#2563EB]">وحلها مع حصتي</span>
          </h2>
          <p className="text-base sm:text-lg text-[#6B7280] leading-relaxed">
            العثور على مدرس موثوق ومتابعة مواعيد وغياب الأبناء بين كشوفات الدفاتر ورسائل الواتساب المشتتة كانت مهمة مرهقة ومصدر دائم للنزاع. حصتي بتقدم لك الحل التقني المنظم في مكان واحد.
          </p>
        </div>

        {/* 2x2 Grid of 4 White Bordered Cards with Blue Checkmarks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 max-w-4xl mx-auto">
          {PROBLEM_SOLUTION_CARDS.map((card) => (
            <div
              key={card.id}
              className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 transition-all hover:border-blue-300 hover:shadow-xs text-right flex items-start gap-4"
              id={`problem-card-${card.id}`}
            >
              {/* Blue Checkmark Icon */}
              <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5 stroke-[2.4]" />
              </div>

              {/* Card Content */}
              <div>
                <h3 className="text-base font-bold text-[#1F2937] mb-1.5">
                  {card.title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
