/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/**
 * StagePickers — منتقيات المراحل الدراسية الموحدة
 * ------------------------------------------------
 * 1) StageMultiPicker  : للمعلم — يختار كل المراحل التي يدرّسها (ابتدائي/إعدادي/ثانوي)
 * 2) StageGradeCascade : للطالب والمجموعات — يختار المرحلة الرئيسية ثم الصف داخلها
 */

import React from 'react';
import { GraduationCap, ChevronDown, CheckCircle2, Layers } from 'lucide-react';
import { STAGES, gradesForStage, stageOfGrade } from '../../lib/stages';

/* ============================================================
   1) StageMultiPicker — للمعلم: المراحل التي يدرّسها (متعدد)
   ============================================================ */
export const StageMultiPicker: React.FC<{
  value: string[];
  onChange: (stages: string[]) => void;
  /** نص مساعد أسفل المنتقي */
  hint?: string;
  /** حجم مضغوط (للنماذج داخل المودالات) */
  compact?: boolean;
}> = ({ value, onChange, hint, compact }) => {
  const toggle = (label: string) => {
    if (value.includes(label)) {
      if (value.length === 1) return; // على الأقل مرحلة واحدة
      onChange(value.filter((v) => v !== label));
    } else {
      onChange([...value, label]);
    }
  };

  return (
    <div dir="rtl" className="space-y-2">
      <div className={`grid grid-cols-3 ${compact ? 'gap-2' : 'gap-2.5'}`}>
        {STAGES.map((s) => {
          const on = value.includes(s.label);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.label)}
              aria-pressed={on}
              className={`relative rounded-2xl border-2 ${compact ? 'p-2.5' : 'p-3.5'} text-center transition-all cursor-pointer select-none
                ${on
                  ? 'border-[#2563EB] bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-blue-200'}`}
            >
              {on && (
                <span className="absolute top-1.5 left-1.5 text-[#2563EB]">
                  <CheckCircle2 className={compact ? 'w-4 h-4' : 'w-4.5 h-4.5'} />
                </span>
              )}
              <div className={compact ? 'text-base' : 'text-lg'}>{s.emoji}</div>
              <div className={`font-black text-slate-800 ${compact ? 'text-[11px] mt-0.5' : 'text-xs mt-1'}`}>{s.label}</div>
              <div className={`font-bold text-slate-400 ${compact ? 'text-[9px]' : 'text-[9.5px]'}`}>
                {s.grades.length} صفوف · من {ordinal(s.grades[0])} إلى {ordinal(s.grades[s.grades.length - 1])}
              </div>
            </button>
          );
        })}
      </div>
      {hint ? <p className="text-[10.5px] font-bold text-slate-400 leading-4 px-0.5">{hint}</p> : null}
    </div>
  );
};

/* ترتيب الصف بالعربي: «الأول/الثاني/...» */
function ordinal(grade: string): string {
  const m = grade.match(/الصف (الأول|الثاني|الثالث|الرابع|الخامس|السادس)/);
  return m ? m[1] : '';
}

/* ============================================================
   2) StageGradeCascade — للطالب والمجموعة: مرحلة ← صف
   ============================================================ */
export const StageGradeCascade: React.FC<{
  stage: string;
  grade: string;
  onStageChange: (stage: string) => void;
  onGradeChange: (grade: string) => void;
  /** placeholder الصف عند عدم وجود مرحلة */
  gradePlaceholder?: string;
  /** تعطيل الكل */
  disabled?: boolean;
  /** كلاس إضافي للأعمدة */
  className?: string;
}> = ({ stage, grade, onStageChange, onGradeChange, gradePlaceholder = 'اختر الصف...', disabled, className = '' }) => {
  const grades = gradesForStage(stage);

  const handleStage = (s: string) => {
    onStageChange(s);
    const g = gradesForStage(s);
    // أول صف من المرحلة الجديدة تلقائيًا — المستخدم يعدل لو حاب
    if (g.length) onGradeChange(g[0]);
  };

  return (
    <div dir="rtl" className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${className}`}>
      {/* المرحلة الرئيسية */}
      <div className="relative">
        <Layers className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <select
          value={stage}
          onChange={(e) => handleStage(e.target.value)}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-9 pl-8 text-xs font-black text-slate-700 appearance-none cursor-pointer outline-none focus:border-[#2563EB] focus:bg-white disabled:opacity-60"
        >
          <option value="">المرحلة الرئيسية...</option>
          {STAGES.map((s) => (
            <option key={s.key} value={s.label}>
              {s.emoji} المرحلة {s.label}
            </option>
          ))}
        </select>
      </div>
      {/* الصف داخل المرحلة */}
      <div className="relative">
        <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <select
          value={grades.includes(grade) ? grade : ''}
          onChange={(e) => onGradeChange(e.target.value)}
          disabled={disabled || !stage}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-9 pl-8 text-xs font-black text-slate-700 appearance-none cursor-pointer outline-none focus:border-[#2563EB] focus:bg-white disabled:opacity-60"
        >
          <option value="">{stage ? gradePlaceholder : 'اختر المرحلة أولًا...'}</option>
          {grades.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

/** استنتاج المرحلة من صف قائم (للتعديل على بيانات موجودة) */
export function initialStageForGrade(grade?: string | null): string {
  return stageOfGrade(grade);
}
