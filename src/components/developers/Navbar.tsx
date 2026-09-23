/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { SiteSettings } from './types';
import {
  Menu,
  X,
  Sparkles,
  ArrowUpRight,
  Layers,
  Users,
  BarChart2,
  Milestone,
  Compass
} from 'lucide-react';

interface NavbarProps {
  settings: SiteSettings;
  onOpenAdmin?: () => void;
  isAdminLoggedIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ settings }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = ['hero', 'about', 'developers', 'stats', 'journey', 'motion-story'];
      const scrollPos = window.scrollY + 140;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'hero', label: 'الرئيسية', icon: Sparkles },
    { id: 'about', label: 'عن حِصّتي', icon: Layers },
    { id: 'developers', label: 'فريق التطوير', icon: Users },
    { id: 'stats', label: 'الإحصائيات', icon: BarChart2 },
    { id: 'journey', label: 'رحلة البناء', icon: Milestone },
    { id: 'motion-story', label: 'قصة التحول', icon: Compass }
  ];

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Name */}
          <button
            onClick={() => scrollToSection('hero')}
            className="flex items-center gap-3 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl p-1 cursor-pointer"
          >
            <div className="relative w-10 h-10 rounded-xl bg-white p-1.5 ring-1 ring-slate-200/90 shadow-2xs flex items-center justify-center transition-transform hover:scale-105">
              <img
                src={settings.logo_url || '/hassty-logo.svg'}
                alt={settings.site_name || 'منصة حِصّتي'}
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                {settings.site_name || 'حِصّتي'}
              </span>
              <span className="text-[10px] font-semibold text-blue-600">
                فريق التطوير والابتكار
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="القائمة الرئيسية"
            className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-full border border-slate-200/60 backdrop-blur-xs"
          >
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Action Area: Contact Button */}
          <div className="hidden sm:flex items-center gap-3">
            {settings.contact_email ? (
              <a
                href={`mailto:${settings.contact_email}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs"
              >
                <span>تواصل معنا</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
            ) : (
              <button
                onClick={() => scrollToSection('about')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-2xs cursor-pointer"
              >
                <span>عن المنصة</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              aria-label="تبديل القائمة"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden bg-white border-b border-slate-200 shadow-xl overflow-hidden"
          >
            <div className="px-4 pt-3 pb-6 space-y-1.5 max-w-md mx-auto">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeSection === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{link.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </button>
                );
              })}

              {settings.contact_email && (
                <div className="pt-4 mt-3 border-t border-slate-100">
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="w-full py-2.5 px-4 text-center rounded-xl text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 block"
                  >
                    تواصل عبر البريد: {settings.contact_email}
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
