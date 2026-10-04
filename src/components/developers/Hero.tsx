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
import type { SiteSettings } from './types';
import {
  Code2,
  Sparkles,
  ArrowDown,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronLeft
} from 'lucide-react';

interface HeroProps {
  settings: SiteSettings;
}

export const Hero: React.FC<HeroProps> = ({ settings }) => {
  const shouldReduceMotion = useReducedMotion();
  const smoothEasing: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      id="hero"
      aria-label="القسم الرئيسي"
      className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden text-center"
    >
      {/* Ambient background lighting & grid */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 overflow-hidden"
        aria-hidden="true"
      >
        {/* Subtle Tech Grid */}
        <div className="absolute inset-0 bg-tech-grid opacity-60" />

        {/* Central Radial Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[440px] bg-gradient-to-b from-blue-100/60 via-indigo-50/40 to-transparent rounded-full blur-3xl animate-subtle-glow" />

        {/* Floating Subtle Ambient Shapes */}
        <div className="absolute top-24 -left-20 w-80 h-80 rounded-full bg-blue-100/30 blur-3xl animate-ambient-float" />
        <div className="absolute top-36 -right-20 w-96 h-96 rounded-full bg-sky-100/35 blur-3xl animate-ambient-float-alt" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 1. Official Logo Container with Architectural Frame */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: smoothEasing }}
          className="flex flex-col items-center justify-center mb-6"
        >
          <div className="relative group cursor-default">
            {/* Multi-layered Soft Aura */}
            <div
              className="absolute -inset-4 bg-gradient-to-tr from-blue-600/20 via-sky-400/20 to-indigo-600/20 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
              aria-hidden="true"
            />

            {/* Logo Card Frame */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-3xl shadow-lg ring-1 ring-blue-100 bg-white p-3.5 flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.03]">
              {/* Corner Technical Accents */}
              <span className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-blue-400/60" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-400/60" />
              <span className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-blue-400/60" />
              <span className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-400/60" />

              <img
                src={settings.logo_url || '/hassty-logo.svg'}
                alt={settings.site_name || 'منصة حِصّتي'}
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>
          </div>

          {/* Hero Badge */}
          {settings.hero_badge && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.45, ease: smoothEasing }}
              className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-50/90 text-blue-700 border border-blue-200/80 shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>{settings.hero_badge}</span>
            </motion.div>
          )}
        </motion.div>

        {/* 2. Main Title */}
        <motion.h1
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.55, ease: smoothEasing }}
          className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.2] mb-5 max-w-4xl mx-auto"
        >
          {settings.page_title || 'فريق تطوير منصة حِصّتي'}
        </motion.h1>

        {/* 3. Subtitle Description */}
        <motion.p
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.55, ease: smoothEasing }}
          className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal mb-8"
        >
          {settings.page_subtitle ||
            'نحن الفريق الهندسي المسؤول عن ابتكار وبناء منصة حِصّتي، نسخر أحدث التقنيات لتقديم بيئة تعليمية ذكية ومتكاملة للمعلمين والطلاب.'}
        </motion.p>

        {/* 4. Action Buttons */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.5, ease: smoothEasing }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12"
        >
          <button
            onClick={() => scrollToSection('developers')}
            className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
          >
            <span>تعرف على فريق التطوير</span>
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => scrollToSection('about')}
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold border border-slate-200/90 shadow-2xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>عن المنصة ورؤيتنا</span>
          </button>
        </motion.div>

        {/* 5. Trust / Technology Highlights Strip */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58, duration: 0.5, ease: smoothEasing }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-6 border-t border-slate-200/60"
        >
          <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-50/60 border border-slate-200/50">
            <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">بنية سحابية فائقة</span>
          </div>

          <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-50/60 border border-slate-200/50">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">أمان وحماية بيانات</span>
          </div>

          <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-50/60 border border-slate-200/50">
            <Terminal className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">أحدث معايير الكود</span>
          </div>

          <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-50/60 border border-slate-200/50">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">تجربة مستخدم حديثة</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
