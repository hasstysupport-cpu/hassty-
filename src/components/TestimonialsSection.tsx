import React from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { TESTIMONIALS_DATA } from '../data/mockData';

export const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="py-16 lg:py-24 bg-[#F8FAFF] border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-block px-3 py-1 bg-[#EFF6FF] text-[#2563EB] text-xs font-bold rounded-full mb-3">
            ثقة وتجارب حقيقية
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F2937] tracking-tight mb-4">
            قالوا عن <span className="text-[#2563EB]">حصتي</span>
          </h2>
          <p className="text-base text-[#6B7280]">
            تجارب حقيقية من أولياء أمور، طلاب، ومعلمين غيرت حصتي طريقتهم في تنظيم الدروس والالتزام.
          </p>
        </div>

        {/* 3 Testimonials Cards (Desktop row, Mobile stacked) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {TESTIMONIALS_DATA.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between hover:border-blue-300 transition-all text-right shadow-2xs"
              id={`testimonial-card-${item.id}`}
            >
              {/* Subtle large quotation mark graphic in background corner at low opacity */}
              <div 
                className="absolute -top-3 -left-3 text-blue-100 opacity-60 pointer-events-none"
                aria-hidden="true"
              >
                <Quote className="w-24 h-24 rotate-180 stroke-[1]" />
              </div>

              <div className="relative z-10">
                {/* 5-Star Rating */}
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current text-amber-400" />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-sm sm:text-base text-[#1F2937] leading-relaxed mb-6">
                  "{item.quote}"
                </p>
              </div>

              {/* Reviewer Details */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl bg-[#EFF6FF] p-2 rounded-full border border-blue-100">
                    {item.avatar}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#1E3A8A] flex items-center gap-1">
                      {item.name}
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    </h3>
                    <p className="text-xs text-[#6B7280]">{item.role}</p>
                    <p className="text-[11px] text-blue-600 font-medium">{item.governorate}</p>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
