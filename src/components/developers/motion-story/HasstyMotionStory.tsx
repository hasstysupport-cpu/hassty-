/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import type { SiteSettings } from '../types';
import { STORY_STAGES } from './types';
import { StoryNavigator } from './StoryNavigator';
import { IdeaStage } from './IdeaStage';
import { DesignStage } from './DesignStage';
import { CodeStage } from './CodeStage';
import { PlatformStage } from './PlatformStage';
import { RevealStage } from './RevealStage';
import { ChevronRight, ChevronLeft, Compass } from 'lucide-react';

interface HasstyMotionStoryProps { settings?: SiteSettings; }
export const HasstyMotionStory: React.FC<HasstyMotionStoryProps> = ({ settings }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const handleNext = () => setCurrentIndex((prev) => Math.min(prev + 1, STORY_STAGES.length - 1));
  const handlePrev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));
  const currentStage = STORY_STAGES[currentIndex];
  return (
    <section id="motion-story" aria-label="قصة بناء المنصة: من الفكرة إلى حِصّتي" className="relative w-full py-20 sm:py-28 bg-gradient-to-b from-white via-blue-50/20 to-white border-b border-slate-200/60 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-100/30 blur-3xl pointer-events-none -z-10" aria-hidden="true" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 shadow-2xs mb-3.5"><Compass className="w-3.5 h-3.5 text-blue-600" /><span>قصة التحول الرقمي</span></div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">من الفكرة إلى حِصّتي</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">تفاعل مع المراحل التفاعلية من 1 إلى 5 لاستعراض رحلة التحول البرمجي والتصميمي</p>
        </div>
        <StoryNavigator currentIndex={currentIndex} onSelectIndex={setCurrentIndex} onNext={handleNext} onPrev={handlePrev} />
        <div className="relative min-h-[460px] sm:min-h-[500px] flex items-center justify-center mt-6">
          <AnimatePresence mode="wait">
            {currentStage.id === 'idea' && <IdeaStage key="stage-idea" isActive={true} />}
            {currentStage.id === 'design' && <DesignStage key="stage-design" isActive={true} />}
            {currentStage.id === 'code' && <CodeStage key="stage-code" isActive={true} />}
            {currentStage.id === 'platform' && <PlatformStage key="stage-platform" isActive={true} />}
            {currentStage.id === 'reveal' && <RevealStage key="stage-reveal" isActive={true} settings={settings} />}
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-between max-w-lg mx-auto pt-6 border-t border-slate-200/80 px-4 text-xs sm:text-sm font-semibold">
          <button onClick={handlePrev} disabled={currentIndex === 0} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none transition-colors py-2 px-3 rounded-xl hover:bg-blue-50 cursor-pointer"><ChevronRight className="w-4 h-4" /><span>المرحلة السابقة</span></button>
          <span className="text-slate-500 font-mono text-xs px-3 py-1 bg-slate-100 rounded-lg">{currentStage.stepNumber} / 05</span>
          <button onClick={handleNext} disabled={currentIndex === STORY_STAGES.length - 1} className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 disabled:opacity-30 disabled:pointer-events-none transition-colors py-2 px-3 rounded-xl hover:bg-blue-50 font-bold cursor-pointer"><span>المرحلة التالية</span><ChevronLeft className="w-4 h-4" /></button>
        </div>
      </div>
    </section>
  );
};
