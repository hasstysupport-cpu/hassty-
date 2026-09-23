/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Developer } from './types';
import {
  Users,
  Code,
  Layers,
  Sparkles,
  TrendingUp,
  Cpu,
  Clock,
  CheckCircle
} from 'lucide-react';

interface StatsSectionProps {
  developers: Developer[];
}

export const StatsSection: React.FC<StatsSectionProps> = ({ developers }) => {
  const shouldReduceMotion = useReducedMotion();
  const smoothEasing: [number, number, number, number] = [0.22, 1, 0.36, 1];

  // Dynamic calculations based on active developers
  const activeDevsCount = developers.filter((d) => d.is_visible).length || developers.length || 2;

  const stats = [
    {
      id: 'stat-team',
      icon: Users,
      value: `${activeDevsCount}`,
      suffix: 'مطورين',
      label: 'نخبة مهندسي التطوير',
      description: 'كفاءات متخصصة في هندسة الواجهات والبنى التحتية السحابية'
    },
    {
      id: 'stat-modules',
      icon: Layers,
      value: '6+',
      suffix: 'أنظمة',
      label: 'وحدات برمجية متكاملة',
      description: 'منظومة الحضور، الفصول، الحجوزات، التقارير، والإشعارات الذكية'
    },
    {
      id: 'stat-tech',
      icon: Cpu,
      value: '12+',
      suffix: 'تقنية',
      label: 'أحدث الأدوات والتقنيات',
      description: 'React، TypeScript، Node.js، Tailwind، وأنظمة قواعد بيانات موزعة'
    },
    {
      id: 'stat-uptime',
      icon: Clock,
      value: '99.9%',
      suffix: 'استقرار',
      label: 'جاهزية وكفاءة تشغيلية',
      description: 'استجابة فائقة السرعة وأمان مشدد ومتابعة مستمرة على مدار الساعة'
    }
  ];

  return (
    <section
      id="stats"
      aria-labelledby="stats-heading"
      className="relative py-20 sm:py-24 bg-white border-b border-slate-200/60 overflow-hidden"
    >
      {/* Background Tech Dots Pattern */}
      <div
        className="absolute inset-0 bg-tech-dots opacity-40 pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-18">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: smoothEasing }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs mb-3.5"
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>أرقام وإحصائيات المنظومة</span>
          </motion.div>

          <motion.h2
            id="stats-heading"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.55, delay: 0.1, ease: smoothEasing }}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"
          >
            إنجازات تقنية تقود التميز
          </motion.h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: smoothEasing }}
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                className="group relative bg-slate-50/70 hover:bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 hover:border-blue-300 shadow-2xs hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-white text-blue-600 border border-slate-200/80 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {stat.suffix}
                    </span>
                  </div>

                  <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
                    {stat.value}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1.5">
                    {stat.label}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    {stat.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
