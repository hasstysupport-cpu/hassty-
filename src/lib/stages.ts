/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/* ============================================================
   كتالوج المراحل الدراسية المصرية — مصدر الحقيقة الوحيد للواجهة
   ابتدائي (6 صفوف) ← إعدادي (3 صفوف) ← ثانوي (3 صفوف)
   ============================================================ */

export type StageKey = 'primary' | 'prep' | 'secondary';

export interface StageDef {
  key: StageKey;
  label: string;          // «ابتدائي» — القيمة المحفوظة في DB
  shortLabel: string;     // «ابتدائي»
  grades: string[];       // الصفوف داخل المرحلة (بصيغة «الصف الأول الابتدائي»)
  emoji: string;
  color: string;          // لون التوكن في الواجهة
}

export const STAGES: StageDef[] = [
  {
    key: 'primary',
    label: 'ابتدائي',
    shortLabel: 'ابتدائي',
    grades: [
      'الصف الأول الابتدائي', 'الصف الثاني الابتدائي', 'الصف الثالث الابتدائي',
      'الصف الرابع الابتدائي', 'الصف الخامس الابتدائي', 'الصف السادس الابتدائي',
    ],
    emoji: '🎒',
    color: 'emerald',
  },
  {
    key: 'prep',
    label: 'إعدادي',
    shortLabel: 'إعدادي',
    grades: [
      'الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي',
    ],
    emoji: '📘',
    color: 'amber',
  },
  {
    key: 'secondary',
    label: 'ثانوي',
    shortLabel: 'ثانوي',
    grades: [
      'الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي',
    ],
    emoji: '🎓',
    color: 'violet',
  },
];

/** كل الصفوف بالترتيب (12 صفًا) */
export const ALL_GRADES: string[] = STAGES.flatMap((s) => s.grades);

/** المراحل كقيم نصية للتحقق والتخزين */
export const STAGE_VALUES: string[] = STAGES.map((s) => s.label);

/** مرحلة الصف من اسمه — 'الصف الثالث الثانوي' → 'ثانوي' */
export function stageOfGrade(grade?: string | null): string {
  const g = String(grade || '');
  if (!g) return '';
  for (const s of STAGES) {
    if (g.includes(s.label) || g.includes(s.shortLabel)) return s.label;
    // مطابقة متسامحة: «الابتدائية/الإعدادية/الثانوية» بصيغة المؤنث
    if (g.includes(s.label + 'ة') || g.includes(s.label + 'ية')) return s.label;
  }
  return '';
}

/** صفوف مرحلة معينة */
export function gradesForStage(stageLabel?: string | null): string[] {
  const s = STAGES.find((x) => x.label === stageLabel || x.shortLabel === stageLabel);
  return s ? s.grades : [];
}

/** المرحلة تعريف كامل من اسمها */
export function stageDef(stageLabel?: string | null): StageDef | undefined {
  return STAGES.find((x) => x.label === stageLabel || x.shortLabel === stageLabel);
}

/** قيّم قائمة مراحل من أي مصدر (API/DB/ميتاداتا) — تنظف القيم غير المعروفة */
export function sanitizeStages(input: unknown): string[] {
  let list: unknown[] = [];
  if (Array.isArray(input)) list = input;
  else if (typeof input === 'string' && input.trim()) list = input.split(',');
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of list) {
    const label = String(v || '').trim();
    if (!label) continue;
    const def = stageDef(label);
    if (!def) continue;
    if (seen.has(def.label)) continue;
    seen.add(def.label);
    out.push(def.label);
  }
  return out;
}

/** شارة صغيرة لعرض المرحلة في الجداول */
export function stageBadgeTone(stage?: string | null): 'success' | 'warning' | 'info' {
  switch (stage) {
    case 'ابتدائي': return 'success';
    case 'إعدادي': return 'warning';
    case 'ثانوي': return 'info';
    default: return 'info';
  }
}
