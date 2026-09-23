-- Hassty — منصة حِصّتي التعليمية
-- جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
-- المبرمج: محمود على محمود مدكور
-- بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
-- ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
-- Copyright (c) Mahmoudmadkour — All Rights Reserved.

-- ============================================================
-- إصلاح RLS: صفحة "المدفوعات والأرباح" للمدرسين كانت تظهر ٠ ج.م
-- السبب: سياسات commission_tracking كانت تسمح للإدارة فقط بالقراءة
-- الحل: المدرس يقرأ صفوفه هو فقط (teacher_id = auth.uid())
-- تاريخ التنفيذ: 2026-09-02 (مُطبَّق مباشرة على قاعدة الإنتاج)
-- ============================================================

DROP POLICY IF EXISTS ct_teacher_select_own ON public.commission_tracking;

CREATE POLICY ct_teacher_select_own ON public.commission_tracking
  FOR SELECT TO authenticated
  USING (teacher_id = (select auth.uid()));

-- ملاحظة: سياسات الإدارة (ct_admin_insert/select/update) بقيت كما هي —
-- الإدارة تدير دورات العمولة، والمدرس يقرأ صفوفه فقط.
