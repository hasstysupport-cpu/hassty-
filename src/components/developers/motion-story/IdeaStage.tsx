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
import { Lightbulb } from 'lucide-react';
interface IdeaStageProps { isActive: boolean; }
export const IdeaStage: React.FC<IdeaStageProps> = ({ isActive }) => { if (!isActive) return null; return (
  <motion.div initial={{opacity:0,scale:.94,y:14}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.96,y:-10}} transition={{duration:.35,ease:[.22,1,.36,1]}} className="w-full flex flex-col items-center justify-center select-none px-4 py-6">
    <div className="absolute w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] rounded-full bg-gradient-to-tr from-blue-500/15 via-sky-400/12 to-indigo-500/10 blur-3xl pointer-events-none -z-10" />
    <div className="relative flex flex-col items-center"><svg className="absolute -inset-10 sm:-inset-16 w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] pointer-events-none opacity-30 animate-spin" style={{animationDuration:'35s'}} viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 8"/><circle cx="50" cy="50" r="30" fill="none" stroke="#60A5FA" strokeWidth=".75" strokeDasharray="2 6"/></svg><div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-5 shadow-xl shadow-blue-600/10 ring-4 ring-blue-50 border border-blue-200 flex items-center justify-center"><div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-600/10 to-transparent pointer-events-none"/><Lightbulb className="w-12 h-12 text-blue-600 animate-pulse" /></div></div>
    <div className="text-center mt-6 sm:mt-8 max-w-md"><span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 mb-2.5">المرحلة الأولى — البداية</span><h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-2.5 tracking-tight">كل شيء بدأ بفكرة</h3><p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">فكرة بسيطة... كانت البداية لتجربة تعليمية رقمية أكثر سهولة وتنظيمًا للمعلمين والطلاب.</p></div>
  </motion.div>); };
