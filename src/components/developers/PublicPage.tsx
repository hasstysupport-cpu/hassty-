/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React from 'react';
import type { Developer, SiteSettings } from './types';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { AboutSection } from './AboutSection';
import { DeveloperCard } from './DeveloperCard';
import { StatsSection } from './StatsSection';
import { JourneyTimeline } from './JourneyTimeline';
import { HasstyMotionStory } from './motion-story/HasstyMotionStory';
import { Footer } from './Footer';
import { Users } from 'lucide-react';

interface PublicPageProps {
  developers: Developer[];
  settings: SiteSettings;
  isLoading: boolean;
  isAdminLoggedIn: boolean;
  onOpenAdmin: () => void;
  onRefresh: () => void;
}

export const PublicPage: React.FC<PublicPageProps> = ({
  developers,
  settings,
  isLoading
}) => {
  // Filter visible developers for public view
  const visibleDevelopers = developers.filter((dev) => dev.is_visible);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Ambient background subtle decorative elements */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden -z-20"
        aria-hidden="true"
      >
        {/* Subtle Tech Dot Grid Pattern */}
        <div className="absolute inset-0 bg-tech-dots opacity-30" />

        {/* Top-right soft blue glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-100/30 blur-3xl animate-ambient-float" />

        {/* Mid-left floating subtle circle */}
        <div className="absolute top-1/3 -left-40 w-[420px] h-[420px] rounded-full bg-sky-50/40 blur-3xl animate-ambient-float-alt" />

        {/* Bottom-right soft indigo accent */}
        <div className="absolute bottom-20 -right-24 w-80 h-80 rounded-full bg-blue-50/40 blur-3xl animate-ambient-float" />
      </div>

      {/* Main Navbar */}
      <Navbar settings={settings} />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <Hero settings={settings} />

        {/* 2. About Section: فكرة ورؤية حِصّتي */}
        <AboutSection />

        {/* 3. Developers Section: فريق التطوير */}
        <section
          id="developers"
          aria-labelledby="developers-heading"
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28"
        >
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs mb-4">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>فريق التطوير والابتكار</span>
            </div>

            <h2
              id="developers-heading"
              className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4"
            >
              العقول الهندسية خلف منصة حِصّتي
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              نخبة من المطورين الذين كرسوا جهودهم لبناء منصة تعليمية بمعايير عالمية تجمع بين البساطة والقوة.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 animate-pulse flex flex-col items-center text-center shadow-xs"
                >
                  <div className="w-44 h-44 rounded-full bg-slate-100 mb-6 ring-4 ring-slate-50" />
                  <div className="h-6 w-44 bg-slate-100 rounded-lg mb-3" />
                  <div className="h-4 w-32 bg-slate-100 rounded-full mb-5" />
                  <div className="h-3 w-56 bg-slate-100 rounded-md mb-2" />
                  <div className="h-3 w-48 bg-slate-100 rounded-md mb-6" />
                  <div className="flex gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-slate-100" />
                    <div className="w-10 h-10 rounded-full bg-slate-100" />
                    <div className="w-10 h-10 rounded-full bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleDevelopers.length === 0 ? (
            <div className="text-center py-16 px-6 bg-blue-50/50 rounded-3xl border border-blue-100/80 max-w-lg mx-auto shadow-2xs">
              <Users className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">
                فريق التطوير والابتكار
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                يتم تحديث قائمة أعضاء الفريق والبيانات التعريفية دورياً.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-stretch">
              {visibleDevelopers.map((developer, index) => (
                <DeveloperCard
                  key={developer.id}
                  developer={developer}
                  index={index}
                />
              ))}
            </div>
          )}
        </section>

        {/* 4. Statistics Section: الإحصائيات */}
        <StatsSection developers={developers} />

        {/* 5. Journey Timeline Section: رحلة البناء */}
        <JourneyTimeline />

        {/* 6. Motion Story Scene: من الفكرة إلى حِصّتي */}
        <HasstyMotionStory settings={settings} />
      </main>

      {/* Footer */}
      <Footer settings={settings} />
    </div>
  );
};
