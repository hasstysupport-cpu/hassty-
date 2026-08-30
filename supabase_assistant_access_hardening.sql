-- HASSTY Assistant Access Hardening
-- Applied to Supabase project mxryrgoxofsvjsvpxzew on 2026-08-30.
-- Keeps the assistant group-access helper outside the exposed public API schema.

create or replace function private.assistant_can_access_group(p_group_id uuid, p_permission text default 'groups') returns boolean
language sql stable security definer set search_path = pg_catalog, public, pg_temp
as $$
  select exists (
    select 1
    from public.teacher_assistant_group_access ga
    join public.teacher_assistants ta on ta.id=ga.teacher_assistant_id
    where ta.assistant_id=(select auth.uid())
      and ta.status='active'
      and ga.group_id=p_group_id
      and case when p_permission='groups' then true else coalesce((ga.permissions ->> p_permission)::boolean,false) end
  );
$$;

-- RLS policies call the private helper. The public helper is not exposed as an RPC.
drop policy if exists assistant_read_teacher_groups on public.student_groups;
create policy assistant_read_teacher_groups on public.student_groups for select to authenticated using (private.assistant_can_access_group(id,'groups'));
drop policy if exists assistant_read_group_enrollments on public.group_enrollments;
create policy assistant_read_group_enrollments on public.group_enrollments for select to authenticated using (private.assistant_can_access_group(group_id,'students'));
drop policy if exists assistant_read_attendance_records on public.attendance_records;
create policy assistant_read_attendance_records on public.attendance_records for select to authenticated using (private.assistant_can_access_group(group_id,'attendance'));
drop policy if exists assistant_update_attendance_records on public.attendance_records;
create policy assistant_update_attendance_records on public.attendance_records for update to authenticated using (private.assistant_can_access_group(group_id,'attendance')) with check (private.assistant_can_access_group(group_id,'attendance'));
drop policy if exists assistant_read_payment_records on public.payment_records;
create policy assistant_read_payment_records on public.payment_records for select to authenticated using (private.assistant_can_access_group(group_id,'payments'));
drop policy if exists exams_assistant_read on public.exams;
create policy exams_assistant_read on public.exams for select to authenticated using (private.assistant_can_access_group(group_id,'view_students') or private.is_admin_strict());
drop policy if exists exam_results_assistant_read on public.exam_results;
create policy exam_results_assistant_read on public.exam_results for select to authenticated using (exists(select 1 from public.exams e where e.id=exam_results.exam_id and private.assistant_can_access_group(e.group_id,'grades')) or private.is_admin_strict());
drop function if exists public.assistant_can_access_group(uuid,text);
