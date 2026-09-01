import React from 'react';
import { useCountUp } from './common/ui';

const LUX_STATS = [
  { value: 2400, suffix: '+', label: 'مدرس معتمد', desc: 'في 18 محافظة مصرية' },
  { value: 97, suffix: '%', label: 'رضا أولياء الأمور', desc: 'متابعة لحظية موثوقة' },
  { value: 35000, suffix: '+', label: 'حصة موثّقة بالـ QR', desc: 'حضور بالدقيقة والثانية' },
  { value: 99.9, suffix: '%', label: 'جاهزية النظام', desc: 'استقرار على مدار العام' },
];

const LuxStat: React.FC<{ value: number; suffix: string; label: string; desc: string; delay: number }> = ({ value, suffix, label, desc, delay }) => {
  const shown = useCountUp(value, 1300);
  const display = typeof shown === 'number'
    ? (value >= 1000 ? Math.round(shown).toLocaleString('en-US') : (value % 1 !== 0 ? shown.toFixed(1) : String(Math.round(shown))))
    : shown;
  return (
    <div className="flex flex-col items-center justify-center p-4 anim-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="hs-stat-num text-3xl sm:text-4xl lg:text-[2.75rem] font-black tracking-tight mb-1.5 leading-none">
        {display}<span className="text-sky-200 text-2xl sm:text-3xl">{suffix}</span>
      </div>
      <div className="text-sm sm:text-base font-black text-white mb-0.5">{label}</div>
      <div className="text-[11px] text-blue-100/80 font-semibold">{desc}</div>
    </div>
  );
}

export const StatsBand: React.FC = () => {
  return (
    <section className="hs-stats-band text-white py-12 lg:py-14 relative" dir="rtl" aria-label="إحصائيات المنصة">
      {/* زخارف متحركة */}
      <div className="hs-stats-blob w-[380px] h-[380px] -top-40 right-[8%] opacity-60" aria-hidden="true" />
      <div className="hs-stats-blob w-[300px] h-[300px] bottom-[-120px] left-[4%] opacity-40" aria-hidden="true" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at 70% 40%, rgba(0,0,0,0.5), transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 70% 40%, rgba(0,0,0,0.5), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8 anim-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold text-blue-50">
            أرقام حِصّتي تنطق بالثقة
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 text-center">
          {LUX_STATS.map((s, i) => (
            <LuxStat key={s.label} {...s} delay={120 + i * 110} />
          ))}
        </div>
      </div>
    </section>
  );
};
