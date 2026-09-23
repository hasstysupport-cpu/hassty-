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
  Github,
  Linkedin,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Quote,
  Terminal,
  Code2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Send,
  MessageCircle
} from 'lucide-react';

interface DeveloperCardProps {
  developer: Developer;
  index: number;
}

export const DeveloperCard: React.FC<DeveloperCardProps> = ({ developer, index }) => {
  const shouldReduceMotion = useReducedMotion();
  const smoothEasing: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const cardDelay = index * 0.18;

  return (
    <motion.article
      id={`dev-card-${developer.id}`}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: cardDelay, ease: smoothEasing }}
      whileHover={shouldReduceMotion ? {} : { y: -6 }}
      className="group relative bg-white rounded-3xl p-6 sm:p-8 md:p-9 border border-slate-200/90 shadow-2xs hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-300 transition-all duration-300 ease-out flex flex-col justify-between"
    >
      {/* Top subtle highlight gradient bar on hover */}
      <div
        className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/60 transition-all duration-500 rounded-full"
        aria-hidden="true"
      />

      {/* Main card body */}
      <div className="flex flex-col items-center text-center">
        {/* Developer Photo Focal Element with Dual Geometric & Glow Ring */}
        <div className="relative mb-6 pt-2">
          {/* Subtle Rotating Geometric Diamond Backdrop */}
          <div
            className="absolute -inset-3 sm:-inset-4 rounded-3xl bg-gradient-to-tr from-blue-600/15 via-indigo-400/10 to-sky-400/15 border border-blue-200/40 rotate-3 group-hover:rotate-6 group-hover:scale-105 transition-transform duration-500 ease-out -z-10"
            aria-hidden="true"
          />

          {/* Soft Radial Ambient Aura */}
          <div
            className="absolute -inset-4 sm:-inset-5 rounded-full bg-gradient-to-tr from-blue-600/25 via-blue-400/20 to-sky-400/20 blur-xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 -z-10"
            aria-hidden="true"
          />

          {/* Focal Circular Photo Frame */}
          <div className="relative w-40 h-40 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full p-2 bg-white shadow-lg ring-4 ring-blue-50 border border-blue-200/80 overflow-hidden">
            <img
              src={developer.image_url || '/uploads/default-avatar.svg'}
              alt={`صورة ${developer.name}`}
              className="w-full h-full rounded-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/uploads/default-avatar.svg';
              }}
            />
          </div>

          {/* Engineering Role Floating Badge */}
          <div
            className="absolute bottom-1 right-2 sm:bottom-2 sm:right-3 w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md ring-2 ring-white group-hover:scale-110 transition-transform duration-300"
            aria-hidden="true"
          >
            {index % 2 === 0 ? (
              <Code2 className="w-4 h-4" />
            ) : (
              <Terminal className="w-4 h-4" />
            )}
          </div>
        </div>

        {/* Developer Name */}
        <h3 className="text-2xl sm:text-[26px] font-black text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">
          {developer.name}
        </h3>

        {/* Developer Role / Specialization Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs sm:text-sm font-bold text-blue-700 bg-blue-50/90 border border-blue-200/80 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{developer.role}</span>
          </span>
        </div>

        {/* Short Bio */}
        {developer.bio && (
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 max-w-md font-normal">
            {developer.bio}
          </p>
        )}

        {/* Social and Communication Channels */}
        <div className="flex items-center justify-center flex-wrap gap-2.5 mb-6">
          {developer.github_url && (
            <a
              href={developer.github_url}
              target="_blank"
              rel="noopener noreferrer"
              title="حساب GitHub"
              className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 shadow-2xs"
            >
              <Github className="w-4 h-4" />
              <span className="sr-only">GitHub</span>
            </a>
          )}

          {developer.linkedin_url && (
            <a
              href={developer.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              title="حساب LinkedIn"
              className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 shadow-2xs"
            >
              <Linkedin className="w-4 h-4" />
              <span className="sr-only">LinkedIn</span>
            </a>
          )}

          {developer.email && (
            <a
              href={`mailto:${developer.email}`}
              title="إرسال بريد إلكتروني"
              className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 shadow-2xs"
            >
              <Mail className="w-4 h-4" />
              <span className="sr-only">البريد الإلكتروني</span>
            </a>
          )}

          {developer.website_url && (
            <a
              href={developer.website_url}
              target="_blank"
              rel="noopener noreferrer"
              title="الموقع الشخصي"
              className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 shadow-2xs"
            >
              <Globe className="w-4 h-4" />
              <span className="sr-only">الموقع الشخصي</span>
            </a>
          )}

          {developer.facebook_url && (
            <a
              href={developer.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              title="حساب Facebook"
              className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 shadow-2xs"
            >
              <Facebook className="w-4 h-4" />
              <span className="sr-only">Facebook</span>
            </a>
          )}

          {developer.whatsapp_url && (
            <a
              href={developer.whatsapp_url}
              target="_blank"
              rel="noopener noreferrer"
              title="تواصل عبر WhatsApp"
              className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 shadow-2xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="sr-only">WhatsApp</span>
            </a>
          )}

          {developer.telegram_url && (
            <a
              href={developer.telegram_url}
              target="_blank"
              rel="noopener noreferrer"
              title="حساب Telegram"
              className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 shadow-2xs"
            >
              <Send className="w-4 h-4" />
              <span className="sr-only">Telegram</span>
            </a>
          )}

          {developer.instagram_url && (
            <a
              href={developer.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              title="حساب Instagram"
              className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 shadow-2xs"
            >
              <Instagram className="w-4 h-4" />
              <span className="sr-only">Instagram</span>
            </a>
          )}
        </div>
      </div>

      {/* Developer Personal Philosophy / Quote */}
      {developer.quote && (
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 text-right flex items-start gap-3 transition-colors group-hover:bg-blue-50/60 group-hover:border-blue-100">
            <Quote className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 rotate-180" />
            <p className="text-xs sm:text-[13px] text-slate-800 font-medium leading-relaxed italic">
              "{developer.quote}"
            </p>
          </div>
        </div>
      )}
    </motion.article>
  );
};
