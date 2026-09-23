/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useRef } from 'react';
import { motion, useScroll, useSpring, useReducedMotion } from 'motion/react';
import {
  Lightbulb,
  Palette,
  Code2,
  Cpu,
  ShieldCheck,
  Rocket,
  Sparkles,
  Milestone,
  CheckCircle2,
  HeartHandshake
} from 'lucide-react';

interface TimelineStage {
  step: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  isSpecial?: boolean;
}

const STAGES: TimelineStage[] = [
  {
    step: '01',
    title: 'الفكرة والتخطيط',
    tagline: 'كل تحول عظيم يبدأ برؤية واضحة.',
    description:
      'انطلقت حِصّتي من دراسة دقيقة للتحديات التي تواجه المعلمين والطلاب، لصياغة حل تقني يختصر الجهد ويرفع كفاءة التنظيم.',
    icon: Lightbulb
  },
  {
    step: '02',
    title: 'التصميم وتجربة المستخدم',
    tagline: 'تحويل الرؤية إلى واجهات بديهية.',
    description:
      'بناء هوية بصرية مريحة وهندسة واجهات سلسة تضمن سهولة الوصول وسرعة التنقل دون أي تعقيد.',
    icon: Palette
  },
  {
    step: '03',
    title: 'الهندسة والبرمجة',
    tagline: 'تحويل التصاميم إلى منظومة برمجية حية.',
    description:
      'برمجة الخوارزميات، وتأمين قواعد البيانات، وبناء أنظمة الـ QR وحجز المجموعات بأعلى معايير الأمان.',
    icon: Code2
  },
  {
    step: '04',
    title: 'التطوير والتكامل السحابي',
    tagline: 'التفاصيل الهندسية تصنع الفارق.',
    description:
      'تحسين الأداء، وتكامل الخدمات السحابية، وضمان استجابة المنظومة اللحظية تحت أقصى أحمال الاستخدام.',
    icon: Cpu
  },
  {
    step: '05',
    title: 'الفحص وضمان الجودة',
    tagline: 'اختبارات دقيقة لضمان أعلى موثوقية.',
    description:
      'إجراء اختبارات الأمان والسرعة والتوافق مع مختلف الهواتف والمتصفحات لضمان تجربة مستقرة خالية من الثغرات.',
    icon: ShieldCheck
  },
  {
    step: '06',
    title: 'الإطلاق والتشغيل الكامل',
    tagline: 'من الفكرة إلى أرض الواقع.',
    description:
      'جاهزية حِصّتي التامة لخدمة الميدان التعليمي وتقديم تجربة استثنائية تليق بالمعلمين والطلاب.',
    icon: Rocket,
    isSpecial: true
  }
];

export const JourneyTimeline: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Scroll Progress binding for the entire section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 75%', 'end 85%']
  });

  // Smooth, high-performance spring for the filling timeline line
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001
  });

  const smoothEasing: [number, number, number, number] = [0.22, 1, 0.36, 1];

  return (
    <section
      id="journey"
      ref={containerRef}
      aria-labelledby="journey-heading"
      className="relative py-24 sm:py-32 bg-slate-50/40 border-b border-slate-200/60 overflow-hidden"
    >
      {/* Background ambient light */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 -right-32 w-80 h-80 rounded-full bg-blue-100/30 blur-3xl animate-ambient-float" />
        <div className="absolute top-2/3 -left-32 w-96 h-96 rounded-full bg-sky-100/30 blur-3xl animate-ambient-float-alt" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: smoothEasing }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs mb-4"
          >
            <Milestone className="w-3.5 h-3.5 text-blue-600" />
            <span>محطات التطور والإنجاز</span>
          </motion.div>

          <motion.h2
            id="journey-heading"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.55, delay: 0.1, ease: smoothEasing }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-5"
          >
            رحلة بناء منصة حِصّتي
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.55, delay: 0.2, ease: smoothEasing }}
            className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal"
          >
            من فكرة أولية ولدت لتبسيط التعليم، مروراً بمراحل التصميم والبرمجة الدقيقة، وصولاً إلى منظومة ذكية متكاملة.
          </motion.p>
        </div>

        {/* Timeline Track Container */}
        <div className="relative">
          {/* Central Track Line on Desktop (Centered at 50%) */}
          <div
            className="hidden md:block absolute top-6 bottom-6 right-1/2 translate-x-1/2 w-1 bg-slate-200/90 rounded-full"
            aria-hidden="true"
          >
            <motion.div
              style={{ scaleY: shouldReduceMotion ? 1 : scaleY, originY: 0 }}
              className="w-full h-full bg-gradient-to-b from-blue-500 via-blue-600 to-indigo-600 rounded-full shadow-xs"
            />
          </div>

          {/* Side Track Line on Mobile (Right aligned for RTL) */}
          <div
            className="md:hidden absolute top-4 bottom-4 right-6 sm:right-7 w-1 bg-slate-200/90 rounded-full"
            aria-hidden="true"
          >
            <motion.div
              style={{ scaleY: shouldReduceMotion ? 1 : scaleY, originY: 0 }}
              className="w-full h-full bg-gradient-to-b from-blue-500 via-blue-600 to-indigo-600 rounded-full shadow-xs"
            />
          </div>

          {/* Stages List */}
          <div className="space-y-12 sm:space-y-16 md:space-y-20 relative z-10">
            {STAGES.map((stage, index) => {
              const Icon = stage.icon;
              const isEven = index % 2 === 0;

              return (
                <div
                  key={stage.step}
                  className={`relative flex flex-col md:flex-row items-start md:items-center ${
                    isEven ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Milestone Node on Desktop (Centered) */}
                  <div
                    className="hidden md:flex absolute right-1/2 translate-x-1/2 items-center justify-center z-20"
                    aria-hidden="true"
                  >
                    <motion.div
                      initial={shouldReduceMotion ? { scale: 1 } : { scale: 0.7, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.45, delay: 0.15, ease: smoothEasing }}
                      className={`relative w-13 h-13 rounded-2xl flex items-center justify-center shadow-md transition-transform duration-300 ${
                        stage.isSpecial
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-blue-500/25'
                          : 'bg-white text-blue-600 ring-4 ring-blue-50 border border-blue-200'
                      }`}
                    >
                      {stage.isSpecial && (
                        <div className="absolute -inset-2 bg-blue-500/25 rounded-2xl blur-md animate-pulse -z-10" />
                      )}
                      <Icon className="w-5 h-5" />
                    </motion.div>
                  </div>

                  {/* Milestone Node on Mobile (Right Side on RTL) */}
                  <div
                    className="md:hidden absolute right-3.5 sm:right-4.5 top-5 z-20"
                    aria-hidden="true"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                        stage.isSpecial
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-blue-600 border-2 border-blue-600'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                    </div>
                  </div>

                  {/* Stage Card */}
                  <div
                    className={`w-full md:w-[calc(50%-2.5rem)] pr-12 sm:pr-14 md:pr-0 ${
                      isEven ? 'md:pl-0 md:pr-0' : 'md:pr-0 md:pl-0'
                    }`}
                  >
                    <motion.div
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-50px' }}
                      transition={{ duration: 0.55, ease: smoothEasing }}
                      className={`group relative rounded-3xl p-6 sm:p-8 transition-all duration-300 border ${
                        stage.isSpecial
                          ? 'bg-gradient-to-br from-white via-blue-50/50 to-blue-100/30 border-blue-300 shadow-md hover:border-blue-400 hover:shadow-xl'
                          : 'bg-white border-slate-200/90 shadow-2xs hover:shadow-lg hover:shadow-blue-900/5 hover:border-blue-300'
                      }`}
                    >
                      {/* Top highlight line */}
                      <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/50 transition-all duration-500 rounded-full" />

                      {/* Header Row: Step + Title + Icon */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`font-mono text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-lg ${
                              stage.isSpecial
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}
                          >
                            {stage.step}
                          </span>
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                            {stage.title}
                          </h3>
                        </div>

                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            stage.isSpecial
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Tagline */}
                      <p className="text-xs sm:text-sm font-bold text-blue-600 mb-2">
                        {stage.tagline}
                      </p>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        {stage.description}
                      </p>

                      {/* Special launch highlight */}
                      {stage.isSpecial && (
                        <div className="mt-4 pt-3.5 border-t border-blue-200/60 flex items-center gap-2 text-xs font-bold text-blue-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>المنظومة في حالة تشغيل كامل ومتاحة لجميع المستخدمين</span>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Closing Inspiring Card */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.65, ease: smoothEasing }}
          className="mt-16 sm:mt-24 relative rounded-3xl p-8 sm:p-12 text-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white border border-slate-800 shadow-xl overflow-hidden"
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-13 h-13 rounded-2xl bg-white/10 ring-1 ring-white/20 text-blue-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <HeartHandshake className="w-6 h-6" />
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
              وراء كل تجربة تعليمية رائدة... فريق يعمل بشغف وإتقان
            </h3>

            <p className="text-sm sm:text-base font-medium text-blue-200 leading-relaxed">
              منصة حِصّتي — نطوّر حلول اليوم لنرتقي بتعليم الغد.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
