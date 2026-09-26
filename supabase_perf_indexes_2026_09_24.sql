-- ============================================================
-- Hassty — فهارس الأداء | Performance Indexes
-- تاريخ التطبيق: 2026-09-24
-- الهدف: تسريع الاستعلامات الشائعة + تغطية كل أعمدة FK
-- ملاحظة: الجداول فارغة حاليًا (تصفير كامل) — إنشاء الفهارس فوري ورخيص
-- ============================================================

-- ---------- 1) أعمدة FK بدون فهارس (35 عمودًا) ----------
CREATE INDEX IF NOT EXISTS idx_aal_group ON public.assistant_activity_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_aal_teacher ON public.assistant_activity_logs(teacher_id);
CREATE INDEX IF NOT EXISTS idx_aga_group ON public.assistant_group_assignments(group_id);
CREATE INDEX IF NOT EXISTS idx_aga_teacher ON public.assistant_group_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_aprofiles_approved_by ON public.assistant_profiles(approved_by);
CREATE INDEX IF NOT EXISTS idx_asn_created_by ON public.assistant_student_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_avr_reviewed_by ON public.assistant_verification_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_group ON public.exam_assignments(group_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_slot ON public.exam_assignments(slot_id);
CREATE INDEX IF NOT EXISTS idx_exam_attendance_slot ON public.exam_attendance(slot_id);
CREATE INDEX IF NOT EXISTS idx_exam_publications_published_by ON public.exam_publications(published_by);
CREATE INDEX IF NOT EXISTS idx_exam_results_group ON public.exam_results(group_id);
CREATE INDEX IF NOT EXISTS idx_exams_group ON public.exams(group_id);
CREATE INDEX IF NOT EXISTS idx_fix_log_bot ON public.fix_log(bot_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_assignment ON public.grade_records(assignment_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_exam ON public.grade_records(exam_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_group ON public.grade_records(group_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_teacher ON public.grade_records(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ger_parent ON public.group_enrollment_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_ger_reviewed_by ON public.group_enrollment_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_gtr_decided_by ON public.group_transfer_requests(decided_by);
CREATE INDEX IF NOT EXISTS idx_gtr_from_group ON public.group_transfer_requests(from_group_id);
CREATE INDEX IF NOT EXISTS idx_gtr_parent ON public.group_transfer_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_gtr_student ON public.group_transfer_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_msr_group ON public.makeup_session_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_msr_reviewed_by ON public.makeup_session_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_msr_student ON public.makeup_session_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_group ON public.payment_records(group_id);
CREATE INDEX IF NOT EXISTS idx_sn_assistant ON public.student_notes(assistant_id);
CREATE INDEX IF NOT EXISTS idx_sn_group ON public.student_notes(group_id);
CREATE INDEX IF NOT EXISTS idx_sn_teacher ON public.student_notes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tcr_current_teacher ON public.teacher_change_requests(current_teacher_id);
CREATE INDEX IF NOT EXISTS idx_tcr_parent ON public.teacher_change_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_tcr_requested_teacher ON public.teacher_change_requests(requested_teacher_id);
CREATE INDEX IF NOT EXISTS idx_tcr_student ON public.teacher_change_requests(student_id);

-- ---------- 2) فهارس البحث والقراءات الساخنة ----------
-- دليل المدرسين العام (الفلتر الأساسي في البحث)
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_verified ON public.tutor_profiles(is_verified, verification_status);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_location ON public.tutor_profiles(governorate, city);

-- لوحة الأدمن: ترتيب الحسابات بالأحدث
CREATE INDEX IF NOT EXISTS idx_profiles_role_created ON public.profiles(role, created_at DESC);

-- طابور التوثيق: pending بالأحدث
CREATE INDEX IF NOT EXISTS idx_tvr_status_submitted ON public.teacher_verification_requests(status, submitted_at DESC);

-- البلاغات المفتوحة
CREATE INDEX IF NOT EXISTS idx_safety_reports_status ON public.safety_reports(status);

-- المجموعات النشطة للمدرس
CREATE INDEX IF NOT EXISTS idx_student_groups_tutor_active ON public.student_groups(tutor_id, is_active);

-- تحديث إحصائيات المخطط بعد إنشاء الفهارس
ANALYZE;
