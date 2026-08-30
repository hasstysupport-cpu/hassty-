-- HASSTY Phase 7: security hardening
-- Applied to Supabase project mxryrgoxofsvjsvpxzew on 2026-08-30.
-- Goals: remove anonymous execution from sensitive RPCs, pin trigger search_path,
-- and make the verified-teacher directory honor caller RLS.

begin;

revoke execute on function public.admin_approve_teacher_verification(uuid,uuid,text,text,text,text,text,text,text) from anon, public;
grant execute on function public.admin_approve_teacher_verification(uuid,uuid,text,text,text,text,text,text,text) to authenticated;
revoke execute on function public.ensure_exam_results(uuid) from anon, public;
grant execute on function public.ensure_exam_results(uuid) to authenticated;
revoke execute on function public.ensure_profile_role() from anon, public;
grant execute on function public.ensure_profile_role() to authenticated;
revoke execute on function public.finalize_exam_distribution(uuid) from anon, public;
grant execute on function public.finalize_exam_distribution(uuid) to authenticated;
revoke execute on function public.has_group_schedule_conflict(uuid,uuid) from anon, public;
grant execute on function public.has_group_schedule_conflict(uuid,uuid) to authenticated;
revoke execute on function public.lookup_student(text) from anon, public;
grant execute on function public.lookup_student(text) to authenticated;
revoke execute on function public.mark_exam_attendance(uuid,uuid,text) from anon, public;
grant execute on function public.mark_exam_attendance(uuid,uuid,text) to authenticated;
revoke execute on function public.parent_decide_teacher_change(uuid,boolean,text) from anon, public;
grant execute on function public.parent_decide_teacher_change(uuid,boolean,text) to authenticated;
revoke execute on function public.preview_exam_distribution(uuid) from anon, public;
grant execute on function public.preview_exam_distribution(uuid) to authenticated;
revoke execute on function public.publish_exam_results(uuid) from anon, public;
grant execute on function public.publish_exam_results(uuid) to authenticated;
revoke execute on function public.request_group_enrollment(uuid,text) from anon, public;
grant execute on function public.request_group_enrollment(uuid,text) to authenticated;
revoke execute on function public.request_group_transfer(uuid,uuid,text) from anon, public;
grant execute on function public.request_group_transfer(uuid,uuid,text) to authenticated;
revoke execute on function public.request_makeup_session(uuid,timestamptz,timestamptz,text) from anon, public;
grant execute on function public.request_makeup_session(uuid,timestamptz,timestamptz,text) to authenticated;
revoke execute on function public.review_group_enrollment_request(uuid,boolean,text) from anon, public;
grant execute on function public.review_group_enrollment_request(uuid,boolean,text) to authenticated;
revoke execute on function public.review_group_transfer_request(uuid,boolean,text) from anon, public;
grant execute on function public.review_group_transfer_request(uuid,boolean,text) to authenticated;
revoke execute on function public.save_exam_result(uuid,uuid,numeric,text,text) from anon, public;
grant execute on function public.save_exam_result(uuid,uuid,numeric,text,text) to authenticated;
revoke execute on function public.student_has_exam_slot_conflict(uuid,timestamptz,timestamptz,uuid) from anon, public;
grant execute on function public.student_has_exam_slot_conflict(uuid,timestamptz,timestamptz,uuid) to authenticated;
revoke execute on function public.student_has_group_schedule_conflict(uuid,timestamptz,timestamptz,uuid) from anon, public;
grant execute on function public.student_has_group_schedule_conflict(uuid,timestamptz,timestamptz,uuid) to authenticated;
revoke execute on function public.teacher_has_schedule_conflict(uuid,timestamptz,timestamptz,uuid) from anon, public;
grant execute on function public.teacher_has_schedule_conflict(uuid,timestamptz,timestamptz,uuid) to authenticated;

revoke execute on function public.accept_assistant_invitation(uuid) from anon, public;
grant execute on function public.accept_assistant_invitation(uuid) to authenticated;
revoke execute on function public.admin_update_account_badge(uuid,text) from anon, public;
grant execute on function public.admin_update_account_badge(uuid,text) to authenticated;
revoke execute on function public.admin_update_teacher_badge(uuid,text) from anon, public;
grant execute on function public.admin_update_teacher_badge(uuid,text) to authenticated;
revoke execute on function public.current_user_is_admin() from anon, public;
grant execute on function public.current_user_is_admin() to authenticated;
revoke execute on function public.submit_teacher_report(uuid,text,text) from anon, public;
grant execute on function public.submit_teacher_report(uuid,text,text) to authenticated;
revoke execute on function public.submit_teacher_review(uuid,uuid,smallint,text,smallint,smallint,smallint,smallint) from anon, public;
grant execute on function public.submit_teacher_review(uuid,uuid,smallint,text,smallint,smallint,smallint,smallint) to authenticated;

alter function public.set_assistant_updated_at() set search_path = public, pg_temp;
alter view public.public_verified_teachers set (security_invoker = true);

commit;
