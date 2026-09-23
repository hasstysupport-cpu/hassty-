/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, CheckCircle2, Sparkles, GraduationCap } from 'lucide-react';
import type { SiteSettings } from '../types';

interface RevealStageProps {
  isActive: boolean;
  settings?: SiteSettings;
}

export const RevealStage: React.FC<RevealStageProps> = ({ isActive, settings }) => {
  if (!isActive) return null;

  const platformUrl = settings?.canonical_url || 'https://hassty.vercel.app/';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="w-full flex flex-col items-center justify-center select-none px-4 py-6"
    >
      {/* Background glow */}
      <div className="absolute w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] rounded-full bg-gradient-to-tr from-blue-600/20 via-sky-400/15 to-indigo-500/20 blur-3xl pointer-events-none -z-10" />

      <div className="relative flex flex-col items-center text-center max-w-lg">
        {/* Hassty Official Logo */}
        <div className="relative mb-6">
          <div
            className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-600/30 via-sky-400/25 to-blue-500/30 blur-xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-3 bg-white shadow-xl ring-4 ring-blue-100 border border-blue-200 flex items-center justify-center">
            <img
              src={settings?.logo_url || '/hassty-logo.svg'}
              alt={settings?.site_name || 'منصة حِصّتي'}
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>
        </div>

        {/* Brand Title */}
        <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
          {settings?.site_name || 'منصة حِصّتي'}
        </h3>

        {/* Milestone Statement */}
        <p className="text-base sm:text-lg font-bold text-blue-600 mb-2 leading-relaxed">
          فكرة بدأت... وتجربة تعليمية رائدة أصبحت واقعًا.
        </p>

        {/* Passion Subtitle */}
        <p className="text-xs sm:text-sm text-slate-600 mb-6 font-normal max-w-sm mx-auto leading-relaxed">
          {settings?.footer_text || 'صُنعت بشغف لتطوير تجربة التعليم.'}
        </p>

        {/* Action Button */}
        <div>
          <a
            href={platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            <GraduationCap className="w-4 h-4" />
            <span>زيارة منصة حِصّتي</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};
