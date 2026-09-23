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
  Mail,
  Phone,
  Sparkles,
  Github,
  ArrowUp
} from 'lucide-react';

interface FooterProps {
  settings: SiteSettings;
  onOpenAdmin?: () => void;
  isAdminLoggedIn?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  const shouldReduceMotion = useReducedMotion();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="relative border-t border-slate-200/80 bg-slate-900 text-slate-300 pt-16 pb-12 overflow-hidden">
      {/* Background soft ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-48 pointer-events-none -z-10"
        aria-hidden="true"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[540px] h-[180px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1.5 ring-1 ring-slate-700 shadow-md flex items-center justify-center">
                <img
                  src={settings.logo_url || '/hassty-logo.svg'}
                  alt={settings.site_name || 'منصة حِصّتي'}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                {settings.site_name || 'منصة حِصّتي'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal max-w-sm">
              {settings.page_subtitle ||
                'الصفحة التعريفية الرسمية بفريق تطوير وبناء منصة حِصّتي التعليمية، المنصة المتخصصة في تقديم تجربة تعليمية رقمية متطورة.'}
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-950/60 border border-blue-800/60 text-[11px] font-semibold text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>{settings.footer_text || 'صُنعت بشغف لتطوير تجربة التعليم'}</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              أقسام الموقع
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => scrollToSection('hero')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  الرئيسية
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  عن منصة حِصّتي
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('developers')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  فريق مهندسي التطوير
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('stats')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  إحصائيات المنظومة
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('journey')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  محطات رحلة البناء
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('motion-story')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  قصة التحول التفاعلية
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact Channels */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              قنوات التواصل
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              {settings.contact_email && (
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="flex items-center gap-2 text-slate-300 hover:text-blue-400 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>{settings.contact_email}</span>
                </a>
              )}
              {settings.contact_phone && (
                <a
                  href={`tel:${settings.contact_phone}`}
                  className="flex items-center gap-2 text-slate-300 hover:text-blue-400 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span dir="ltr">{settings.contact_phone}</span>
                </a>
              )}
              {settings.github_org_url && (
                <a
                  href={settings.github_org_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-300 hover:text-blue-400 transition-colors"
                >
                  <Github className="w-3.5 h-3.5 text-blue-400" />
                  <span>GitHub Organization</span>
                </a>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>العودة للأعلى</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>{settings.copyright_text || 'جميع الحقوق محفوظة © منصة حِصّتي'}</p>
          <span className="text-slate-500 text-[11px]">فريق التطوير والابتكار</span>
        </div>

        <div className="pt-4 text-center">
          <a
            href="https://hassty.site"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-blue-400 text-xs font-semibold transition-colors"
            dir="ltr"
          >
            hassty.site
          </a>
        </div>
      </div>
    </footer>
  );
};
