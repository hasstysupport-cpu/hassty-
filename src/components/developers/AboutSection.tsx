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
import {
  GraduationCap,
  QrCode,
  CalendarCheck,
  BarChart3,
  Smartphone,
  Shield,
  Zap,
  BookOpen,
  Users2,
  CheckCircle2
} from 'lucide-react';

export const AboutSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const smoothEasing: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const corePillars = [
    {
      icon: QrCode,
      title: 'تسجيل الحضور الذكي بـ QR',
      description:
        'منظومة سريعة ودقيقة تمكن المعلمين من تسجيل حضور الطلاب لحظياً وتوليد تقارير حضور غياب فورية تمنع التلاعب وتختصر الوقت.',
      accent: 'blue'
    },
    {
      icon: CalendarCheck,
      title: 'جدولة الحصص وحجز المجموعات',
      description:
        'إدارة مواعيد الدروس والسناتر والمجموعات التعليمية مع إشعارات تنبيهية مباشرة للطلاب وأولياء الأمور لتنظيم المواعيد.',
      accent: 'indigo'
    },
    {
      icon: BarChart3,
      title: 'تحليلات أداء وتقييمات دورية',
      description:
        'لوحات تحكم بيانية ذكية توفر للمعلم والطالب رؤية شاملة لمعدلات الحضور، درجات الاختبارات، والمستوى التحصيلي العام.',
      accent: 'sky'
    },
    {
      icon: Smartphone,
      title: 'تجربة مستخدم سريعة وسلسة',
      description:
        'واجهات متجاوبة بالكامل مصممة للعمل بكفاءة قصوى على الهواتف الذكية والأجهزة اللوحية وأجهزة الكمبيوتر مع دعم وضع عدم الاتصال.',
      accent: 'emerald'
    }
  ];

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative py-20 sm:py-28 bg-slate-50/50 border-y border-slate-200/60 overflow-hidden"
    >
      {/* Ambient background decoration */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-0 w-96 h-96 rounded-full bg-blue-100/30 blur-3xl animate-ambient-float" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-50/40 blur-3xl animate-ambient-float-alt" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: smoothEasing }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs mb-4"
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <span>رؤية منصة حِصّتي</span>
          </motion.div>

          <motion.h2
            id="about-heading"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.55, delay: 0.1, ease: smoothEasing }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-5"
          >
            إعادة صياغة تجربة التعليم الرقمي
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.55, delay: 0.2, ease: smoothEasing }}
            className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal"
          >
            انطلقت منصة حِصّتي لتكون الحل الرقمي الأكثر كفاءة وسهولة للمعلمين والسناتر التعليمية والطلاب، حيث تجمع بين التنظيم الدقيق وسرعة الإنجاز والواجهات المريحة.
          </motion.p>
        </div>

        {/* Feature Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-16">
          {corePillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: idx * 0.12, ease: smoothEasing }}
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                className="group relative bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-2xs hover:shadow-lg hover:shadow-blue-900/5 hover:border-blue-300 transition-all duration-300"
              >
                {/* Top Subtle Highlight */}
                <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/50 transition-all duration-500 rounded-full" />

                <div className="flex items-start gap-5">
                  <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-2xs">
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Technical Architecture Highlights Card */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: smoothEasing }}
          className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-8 sm:p-10 md:p-12 shadow-xl border border-slate-800 overflow-hidden"
        >
          {/* Ambient light inside card */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-4 text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span>معايير هندسية متقدمة</span>
              </span>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                بُنيت المنصة بأحدث أطر العمل البرمجية لضمان الاستقرار الفائق
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                يعمل فريق التطوير على صيانة وتحسين المنظومة باستمرار عبر اختبارات آلية، وتأمين مشدد للبيانات الحساسة، وقواعد بيانات موزعة تضمن سرعة استجابة تصل لأجزاء من الثانية حتى في أوقات الذروة.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>تحديثات مستمرة ومزايا دورية</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>دعم فني واستجابة سريعة</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>حماية تامة لخصوصية الطلاب</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>واجهات سهلة تناسب جميع الأعمار</span>
                </div>
              </div>
            </div>

            {/* Architecture Graphic Box */}
            <div className="lg:col-span-1 bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 backdrop-blur-xs text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Users2 className="w-7 h-7" />
              </div>
              <div className="text-base font-bold text-white mb-1">منظومة موحدة</div>
              <div className="text-xs text-slate-400 mb-4">ربط سلس بين المدرس والطالب وولي الأمر</div>
              <div className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30">
                100% جاهزية تشغيلية
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
