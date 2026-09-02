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
