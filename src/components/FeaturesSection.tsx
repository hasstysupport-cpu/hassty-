import React from 'react';
import {
  QrCode,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Receipt,
  MapPin
} from 'lucide-react';
import { FEATURES_DATA } from '../data/mockData';

export const FeaturesSection: React.FC = () => {
  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'QrCode':
        return <QrCode className="w-6 h-6 stroke-[2]" />;
      case 'Calendar':
        return <Calendar className="w-6 h-6 stroke-[2]" />;
      case 'MessageSquare':
        return <MessageSquare className="w-6 h-6 stroke-[2]" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 stroke-[2]" />;
      case 'Receipt':
        return <Receipt className="w-6 h-6 stroke-[2]" />;
      case 'Map':
      case 'MapPin':
        return <MapPin className="w-6 h-6 stroke-[2]" />;
      default:
        return <ShieldCheck className="w-6 h-6 stroke-[2]" />;
    }
  };

  return (
    <section id="features" className="py-16 lg:py-24 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-block px-3 py-1 bg-[#EFF6FF] text-[#2563EB] text-xs font-bold rounded-full mb-3">
            كل ما تحتاجه في تجربة واحدة
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F2937] tracking-tight mb-4">
            مميزات <span className="text-[#2563EB]">حصتي</span>
          </h2>
          <p className="text-base text-[#6B7280]">
            بنية تحتية متطورة مصممة خصيصاً لخدمة المنظومة التعليمية للدروس الخصوصية في مصر.
          </p>
        </div>

        {/* 6-Item Grid (3x2 on desktop, 1-2 on mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES_DATA.map((feat) => (
            <div
              key={feat.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 text-right transition-all hover:border-blue-300 hover:shadow-xs group flex flex-col justify-between"
              id={`feature-card-${feat.id}`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                    {getFeatureIcon(feat.iconName)}
                  </div>
                  {feat.highlight && (
                    <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-blue-200">
                      {feat.highlight}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-[#1F2937] group-hover:text-[#2563EB] transition-colors mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
