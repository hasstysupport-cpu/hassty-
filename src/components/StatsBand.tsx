import React from 'react';
import { STATS_DATA } from '../data/mockData';

export const StatsBand: React.FC = () => {
  return (
    <section className="relative bg-[#EFF6FF] border-y border-blue-200 py-14 lg:py-16 overflow-hidden">
      {/* Subtle faint dot-grid texture */}
      <div className="absolute inset-0 bg-dot-pattern-light opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 text-center">
          {STATS_DATA.map((stat, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center p-4"
              id={`stat-item-${idx}`}
            >
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E3A8A] tracking-tight mb-2 font-['IBM_Plex_Sans_Arabic']">
                {stat.value}
              </span>
              <span className="text-base sm:text-lg font-bold text-[#1F2937] mb-1">
                {stat.label}
              </span>
              <span className="text-xs text-[#6B7280]">
                {stat.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
