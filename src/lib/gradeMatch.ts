/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/** تطبيع اسم المرحلة الدراسية لمقارنة دقيقة (يزيل المسافات والتطويل وكلمة الصف) */
export function normalizeGrade(v?: string | null): string {
  return String(v || '')
    .replace(/[\u0640]/g, '')
    .replace(/\s+/g, '')
    .replace(/الصف/g, '')
    .trim();
}

/**
 * مطابقة مرحلة الطالب مع مرحلة المجموعة.
 * - القيمتان موجودتان → تطابق صارم (نفس المرحلة فقط).
 * - إحداهما فارغة → true (الفاحص الأعلى يقرر السياسة: مجموعة بلا مرحلة = عامة، طالب بلا مرحلة يُمنع عند القيد).
 */
export function gradesMatch(studentGrade?: string | null, groupGrade?: string | null): boolean {
  const a = normalizeGrade(studentGrade);
  const b = normalizeGrade(groupGrade);
  if (!a || !b) return true;
  return a === b;
}

/** رسالة عدم المطابقة الجاهزة للعرض */
export function gradeMismatchText(studentGrade?: string | null, groupGrade?: string | null): string {
  return `مرحلة الطالب «${String(studentGrade || 'غير محدد')}» لا تطابق مرحلة المجموعة «${String(groupGrade || 'غير محدد')}» — القيد متاح فقط لطلاب نفس المرحلة حفاظًا على ترتيب المجموعات.`;
}
