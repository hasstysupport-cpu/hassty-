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
import {
  GraduationCap,
  BookOpen,
  Users2,
  BarChart3,
  CheckCircle,
  Layers
} from 'lucide-react';

interface PlatformStageProps {
  isActive: boolean;
}

export const PlatformStage: React.FC<PlatformStageProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="w-full flex flex-col items-center justify-center select-none px-4 py-6"
    >
      <div className="relative w-full max-w-xl flex flex-col items-center">
        {/* Converged Educational Platform Mockup */}
        <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-7 shadow-2xl shadow-blue-900/10 border border-blue-200">
          {/* Platform Top Navigation */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="w-24 h-3 bg-slate-800 rounded" />
                <div className="w-16 h-2 bg-slate-300 rounded mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span>المنظومة نشطة</span>
              </span>
            </div>
          </div>

          {/* Platform Cards: Student, Teacher */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Student Hub Card */}
            <div className="rounded-2xl bg-blue-50/70 p-3.5 border border-blue-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-900">بوابة الطلاب</span>
                <div className="w-6 h-6 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="w-full bg-white rounded-full h-1.5 overflow-hidden mb-1.5">
                <div className="bg-blue-600 h-full w-3/4 rounded-full" />
              </div>
              <div className="text-[10px] text-blue-700 font-semibold">متابعة الحصص والواجبات</div>
            </div>

            {/* Teacher Dashboard Card */}
            <div className="rounded-2xl bg-indigo-50/60 p-3.5 border border-indigo-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-950">إدارة الفصول</span>
                <div className="w-6 h-6 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                  <Users2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-indigo-700 font-semibold">تزامن فوري للمعلمين</span>
              </div>
            </div>
          </div>

          {/* Analytics Strip */}
          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">مؤشرات التقدم والتقييم</div>
                <div className="text-[10px] text-slate-500">تقارير أداء ذكية لجميع الفئات</div>
              </div>
            </div>
            <div className="w-16 h-5 rounded-md bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              لوحة متكاملة
            </div>
          </div>

          {/* Stage Badge */}
          <div className="absolute -top-3.5 -right-2 sm:-right-3 px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 ring-2 ring-white pointer-events-none">
            <Layers className="w-3.5 h-3.5" />
            <span>اكتمال المنصة</span>
          </div>
        </div>

        {/* Text Section */}
        <div className="text-center mt-6 sm:mt-8 max-w-md">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 mb-2.5">
            المرحلة الرابعة — اكتمال المنصة
          </span>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-2.5 tracking-tight">
            ومن الكود... بدأت المنصة تنبض بالحياة
          </h3>
          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            اجتمعت التصاميم والأنظمة لتشكيل بيئة تعليمية متكاملة تقدم حلولاً تفاعلية شاملة وسريعة.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
