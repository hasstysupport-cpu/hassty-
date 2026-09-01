import React from 'react';
import { BookOpen, GraduationCap, Sparkles } from 'lucide-react';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showSubtitle = true,
  className = ''
}) => {
  const iconSizes = {
    xs: 'w-7 h-7',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const titleSizes = {
    xs: 'text-[15px]',
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const isLight = variant === 'light';

  return (
    <div className={`flex items-center ${size === 'xs' ? 'gap-1.5' : 'gap-3'} select-none ${className}`} id="app-brand-logo">
      {/* Modern High-End Emblem */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1E3A8A] text-white flex items-center justify-center shadow-sm shadow-blue-600/20 relative shrink-0`}
      >
        <div className="relative flex items-center justify-center">
          <GraduationCap className={`${size === 'xs' ? 'w-3.5 h-3.5' : 'w-5 h-5'} stroke-[2.2]`} />
          <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
          </span>
        </div>
      </div>

      {/* Brand Typography & Subtitle */}
      <div className="flex flex-col text-right">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight ${titleSizes[size]} ${isLight ? 'text-white' : 'text-[#1E3A8A]'}`}>
            حِصّتي
          </span>
          {size !== 'xs' && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-blue-200">
            مصر
          </span>}
        </div>
        
        {showSubtitle && (
          <span className={`text-[11px] font-medium mt-1 leading-tight ${isLight ? 'text-blue-100' : 'text-[#6B7280]'}`}>
            المنصة الذكية للدروس الخصوصية والحضور
          </span>
        )}
      </div>
    </div>
  );
};
