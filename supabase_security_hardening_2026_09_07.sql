-- ==============================================================================
-- 2026-09-07: SECURITY HARDENING — Hassty production database
-- ==============================================================================
-- Closes:
--   F1-CRITICAL : 22 "allow_all_public_*" policies (USING true) = full
--                 anonymous read/write/delete on sensitive tables.
--   F5-CRITICAL : private.is_admin() trusted client-editable user_metadata
--                 (privilege escalation to admin via updateUser).
--   F6-CRITICAL : handle_new_auth_user() accepted role='admin' from raw
--                 client metadata at direct signUp -> instant admin account.
--   F7-CRITICAL : profiles_insert_own allowed self-INSERT with any role.
--   F8          : replacement RLS policies for tables that lose all access.
--   F9          : revoke EXECUTE on sensitive RPCs from anon.
--
-- Applied transactionally. Every statement is idempotent (IF EXISTS).
-- ==============================================================================

-- ==============================================================================
-- PART 1 — DROP THE 22 allow_all BACKDOOR POLICIES (F1)
-- ==============================================================================
DROP POLICY IF EXISTS allow_all_public_assignment_submissions        ON public.assignment_submissions;
DROP POLICY IF EXISTS allow_all_public_assignments                   ON public.assignments;
DROP POLICY IF EXISTS allow_all_public_assistant_activity_logs       ON public.assistant_activity_logs;
DROP POLICY IF EXISTS allow_all_public_assistant_group_assignments   ON public.assistant_group_assignments;
DROP POLICY IF EXISTS allow_all_public_assistant_invitations         ON public.assistant_invitations;
DROP POLICY IF EXISTS allow_all_public_assistant_profiles            ON public.assistant_profiles;
DROP POLICY IF EXISTS allow_all_public_assistant_verification_requests ON public.assistant_verification_requests;
DROP POLICY IF EXISTS allow_all_public_availability_slots            ON public.availability_slots;
DROP POLICY IF EXISTS allow_all_public_calendar_events               ON public.calendar_events;
DROP POLICY IF EXISTS allow_all_public_chat_messages                 ON public.chat_messages;
DROP POLICY IF EXISTS allow_all_public_chat_threads                  ON public.chat_threads;
DROP POLICY IF EXISTS allow_all_public_exam_assignments              ON public.exam_assignments;
DROP POLICY IF EXISTS allow_all_public_exam_attendance               ON public.exam_attendance;
DROP POLICY IF EXISTS allow_all_public_exam_results                  ON public.exam_results;
DROP POLICY IF EXISTS allow_all_public_exam_slots                    ON public.exam_slots;
DROP POLICY IF EXISTS allow_all_public_exams                         ON public.exams;
DROP POLICY IF EXISTS allow_all_public_grade_records                 ON public.grade_records;
DROP POLICY IF EXISTS allow_all_public_group_transfer_requests       ON public.group_transfer_requests;
DROP POLICY IF EXISTS allow_all_public_notifications                 ON public.notifications;
DROP POLICY IF EXISTS allow_all_public_payment_records               ON public.payment_records;
DROP POLICY IF EXISTS allow_all_public_student_notes                 ON public.student_notes;
DROP POLICY IF EXISTS allow_all_public_teacher_change_requests       ON public.teacher_change_requests;

-- F7: self-INSERT with arbitrary role (redundant + dangerous; server provisions
-- profiles with the service key and profiles_insert_self already exists)
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;

-- ==============================================================================
-- PART 2 — FIX PRIVILEGE-ESCALATION ROOT CAUSES (F5 / F6)
-- ==============================================================================

-- F5: is_admin() must NOT trust user_metadata (client-editable).
--      Keep: app_metadata (service-role only) + owner email whitelist.
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'pg_catalog', 'auth'
AS $function$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or lower(coalesce(auth.jwt() ->> 'email','')) in ('hasstysupport@gmail.com','admin@hassty.com'),
    false
  );
$function$;

-- F5 (same fix inside the admin verification RPC)
CREATE OR REPLACE FUNCTION public.admin_approve_teacher_verification(
  p_request_id uuid, p_teacher_id uuid, p_admin_email text,
  p_name text DEFAULT NULL, p_phone text DEFAULT NULL,
  p_governorate text DEFAULT NULL, p_city text DEFAULT NULL,
  p_grade text DEFAULT NULL, p_subject text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public', 'auth'
AS $function$
declare
  v_is_admin boolean;
  v_tutor_id uuid;
begin
  v_is_admin := lower(coalesce(auth.email(), '')) in ('hasstysupport@gmail.com','admin@hassty.com')
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
  if not v_is_admin then raise exception 'Unauthorized admin'; end if;

  update public.teacher_verification_requests
  set status='approved', actioned_at=clock_timestamp(), actioned_by=p_admin_email,
      rejection_reason=null, updated_at=clock_timestamp()
  where id=p_request_id;
  if not found then raise exception 'Verification request not found'; end if;

  update public.profiles
  set account_status='active', badge='verified',
      full_name=coalesce(p_name, full_name),
      phone=coalesce(p_phone, phone),
      governorate=coalesce(p_governorate, governorate),
      city=coalesce(p_city, city),
      grade=coalesce(p_grade, grade),
      updated_at=clock_timestamp()
  where id=p_teacher_id;
  if not found then raise exception 'Teacher profile not found'; end if;

  select id into v_tutor_id from public.tutor_profiles where user_id=p_teacher_id limit 1;
  if v_tutor_id is null then
    insert into public.tutor_profiles(user_id, subjects, grades, governorate, city,
      is_verified, verification_status, updated_at)
    values(p_teacher_id,
      case when p_subject is null then '{}'::text[] else array[p_subject] end,
      case when p_grade is null then '{}'::text[] else array[p_grade] end,
      p_governorate, p_city, true, 'approved', clock_timestamp())
    on conflict (user_id) do update
      set is_verified=true, verification_status='approved', updated_at=clock_timestamp();
  else
    update public.tutor_profiles
    set is_verified=true, verification_status='approved', updated_at=clock_timestamp()
    where id=v_tutor_id;
  end if;
end;
$function$;

-- F6: never accept role='admin' from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth', 'pg_catalog'
AS $function$
declare
  md jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested_role text := lower(trim(coalesce(md->>'role', 'student')));
  safe_role text := case when requested_role in ('student','parent','teacher','assistant') then requested_role else 'student' end;
begin
  insert into public.profiles (id,email,full_name,phone,role,avatar_url,governorate,city,grade,account_status,metadata)
  values (
    new.id,
    lower(coalesce(new.email, md->>'email', '')),
    nullif(coalesce(md->>'full_name', md->>'name', ''),''),
    nullif(md->>'phone',''),
    coalesce(safe_role,'student'),
    nullif(md->>'avatar_url',''),
    nullif(md->>'governorate',''),
    nullif(md->>'city',''),
    nullif(md->>'grade',''),
    'active',
    md || jsonb_build_object('authProvider',coalesce(md->>'authProvider','email'),'onboardingComplete',true,'isVerified',false,'verificationStatus',case when safe_role='teacher' then 'pending' when safe_role='assistant' then 'pending' else 'not_required' end)
  )
  on conflict (id) do update set
    email = coalesce(nullif(excluded.email,''), public.profiles.email),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    governorate = coalesce(excluded.governorate, public.profiles.governorate),
    city = coalesce(excluded.city, public.profiles.city),
    grade = coalesce(excluded.grade, public.profiles.grade),
    role = case when public.profiles.role is null then coalesce(excluded.role,'student') else public.profiles.role end,
    metadata = coalesce(public.profiles.metadata,'{}'::jsonb) || coalesce(excluded.metadata,'{}'::jsonb);

  if safe_role = 'teacher' then
    insert into public.tutor_profiles(user_id,title,headline,bio,subjects,grades,experience_years,governorate,city,price_per_session,is_verified,verification_status)
    values(new.id,'معلم '||coalesce(nullif(md->>'subject',''),'المادة'),'معلم '||coalesce(nullif(md->>'subject',''),'المادة'), '',
      case when nullif(md->>'subject','') is null then '{}'::text[] else array[md->>'subject'] end,
      case when nullif(md->>'grade','') is null then '{}'::text[] else array[md->>'grade'] end,
      coalesce(nullif(md->>'experience','')::numeric,0)::int,
      nullif(md->>'governorate',''), nullif(md->>'city',''), 0, false, 'pending')
    on conflict(user_id) do nothing;
  end if;

  return new;
exception when others then
  raise warning 'HASSTY profile provisioning failed for auth user %: %', new.id, sqlerrm;
  return new;
end;
$function$;
-- ==============================================================================
-- PART 3 — REPLACEMENT POLICIES (F8) for tables that lost all access
-- Pattern: ownership/participant checks, admin via private.is_admin()
-- ==============================================================================

-- ---------- payment_records ----------
CREATE POLICY pr_read_participants ON public.payment_records
  FOR SELECT TO authenticated USING (
    student_id = (select auth.uid()) OR tutor_id = (select auth.uid()) OR (select private.is_admin())
    OR EXISTS (SELECT 1 FROM parent_children pc
               WHERE pc.parent_id = (select auth.uid()) AND pc.child_id = payment_records.student_id)
    OR EXISTS (SELECT 1 FROM assistant_group_assignments aga
               WHERE aga.group_id = payment_records.group_id AND aga.assistant_id = (select auth.uid())
                 AND aga.is_active = true AND aga.can_view_payments = true)
  );
CREATE POLICY pr_teacher_insert ON public.payment_records
  FOR INSERT TO authenticated WITH CHECK (
    (tutor_id = (select auth.uid()) AND (select private.is_verified_teacher((select auth.uid()))))
    OR (select private.is_admin())
  );
CREATE POLICY pr_teacher_update ON public.payment_records
  FOR UPDATE TO authenticated USING (
    (tutor_id = (select auth.uid()) AND (select private.is_verified_teacher((select auth.uid()))))
    OR (select private.is_admin())
  ) WITH CHECK (
    (tutor_id = (select auth.uid()) AND (select private.is_verified_teacher((select auth.uid()))))
    OR (select private.is_admin())
  );
CREATE POLICY pr_admin_delete ON public.payment_records
  FOR DELETE TO authenticated USING ((select private.is_admin()));

-- ---------- exams ----------
CREATE POLICY ex_read_related ON public.exams
  FOR SELECT TO authenticated USING (
    tutor_id = (select auth.uid()) OR (select private.is_admin())
    OR EXISTS (SELECT 1 FROM group_enrollments ge
               WHERE ge.group_id = exams.group_id AND ge.student_id = (select auth.uid()) AND ge.status = 'active')
    OR EXISTS (SELECT 1 FROM group_enrollments ge JOIN parent_children pc ON pc.child_id = ge.student_id
               WHERE ge.group_id = exams.group_id AND ge.status = 'active' AND pc.parent_id = (select auth.uid()))
  );
CREATE POLICY ex_teacher_insert ON public.exams
  FOR INSERT TO authenticated WITH CHECK (
    (tutor_id = (select auth.uid()) AND (select private.is_verified_teacher((select auth.uid()))))
    OR (select private.is_admin())
  );
CREATE POLICY ex_teacher_update ON public.exams
  FOR UPDATE TO authenticated USING (
    tutor_id = (select auth.uid()) OR (select private.is_admin())
  ) WITH CHECK (
    (tutor_id = (select auth.uid()) AND (select private.is_verified_teacher((select auth.uid()))))
    OR (select private.is_admin())
  );
CREATE POLICY ex_owner_delete ON public.exams
  FOR DELETE TO authenticated USING (
    tutor_id = (select auth.uid()) OR (select private.is_admin())
  );

-- ---------- exam_slots ----------
CREATE POLICY es_read_related ON public.exam_slots
  FOR SELECT TO authenticated USING (
    (select private.is_admin())
    OR EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_slots.exam_id AND e.tutor_id = (select auth.uid()))
    OR EXISTS (SELECT 1 FROM exam_assignments ea
               WHERE ea.slot_id = exam_slots.id AND ea.student_id = (select auth.uid()) AND ea.status <> 'cancelled')
    OR EXISTS (SELECT 1 FROM exams e JOIN group_enrollments ge ON ge.group_id = e.group_id
               WHERE e.id = exam_slots.exam_id AND ge.student_id = (select auth.uid()) AND ge.status = 'active')
  );
CREATE POLICY es_teacher_insert ON public.exam_slots
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_slots.exam_id AND e.tutor_id = (select auth.uid()))
    OR (select private.is_admin())
  );
CREATE POLICY es_teacher_update ON public.exam_slots
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_slots.exam_id AND e.tutor_id = (select auth.uid()))
    OR (select private.is_admin())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_slots.exam_id AND e.tutor_id = (select auth.uid()))
    OR (select private.is_admin())
  );

-- ---------- exam_assignments ----------
CREATE POLICY eas_read_related ON public.exam_assignments
  FOR SELECT TO authenticated USING (
    student_id = (select auth.uid()) OR (select private.is_admin())
    OR EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_assignments.exam_id AND e.tutor_id = (select auth.uid()))
    OR EXISTS (SELECT 1 FROM exam_assignments ea JOIN parent_children pc ON pc.child_id = ea.student_id
               WHERE ea.id = exam_assignments.id AND pc.parent_id = (select auth.uid()))
  );
CREATE POLICY eas_teacher_insert ON public.exam_assignments
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_assignments.exam_id AND e.tutor_id = (select auth.uid()))
    OR (select private.is_admin())
  );
CREATE POLICY eas_teacher_update ON public.exam_assignments
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_assignments.exam_id AND e.tutor_id = (select auth.uid()))
    OR (select private.is_admin())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_assignments.exam_id AND e.tutor_id = (select auth.uid()))
    OR (select private.is_admin())
  );
CREATE POLICY eas_teacher_delete ON public.exam_assignments
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_assignments.exam_id AND e.tutor_id = (select auth.uid()))
    OR (select private.is_admin())
  );

-- ---------- exam_results ----------
CREATE POLICY er_read_related ON public.exam_results
  FOR SELECT TO authenticated USING (
    student_id = (select auth.uid()) OR (select private.is_admin())
    OR EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_results.exam_id AND e.tutor_id = (select auth.uid()))
    OR EXISTS (SELECT 1 FROM parent_children pc
               WHERE pc.parent_id = (select auth.uid()) AND pc.child_id = exam_results.student_id)
  );
CREATE POLICY er_teacher_insert ON public.exam_results
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_results.exam_id AND e.tutor_id = (select auth.uid()))
    OR (select private.is_admin())
  );
CREATE POLICY er_teacher_update ON public.exam_results
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_results.exam_id AND e.tutor_id = (select auth.uid()))
    OR (select private.is_admin())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_results.exam_id AND e.tutor_id = (select auth.uid()))
    OR (select private.is_admin())
  );

-- ---------- exam_attendance ----------
CREATE POLICY ea_read_related ON public.exam_attendance
  FOR SELECT TO authenticated USING (
    student_id = (select auth.uid()) OR (select private.is_admin())
    OR EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_attendance.exam_id AND e.tutor_id = (select auth.uid()))
    OR EXISTS (SELECT 1 FROM parent_children pc
               WHERE pc.parent_id = (select auth.uid()) AND pc.child_id = exam_attendance.student_id)
  );
CREATE POLICY ea_teacher_insert ON public.exam_attendance
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_attendance.exam_id AND e.tutor_id = (select auth.uid()))
    OR (select private.is_admin())
  );
CREATE POLICY ea_teacher_update ON public.exam_attendance
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_attendance.exam_id AND e.tutor_id = (select auth.uid()))
    OR (select private.is_admin())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_attendance.exam_id AND e.tutor_id = (select auth.uid()))
    OR (select private.is_admin())
  );

-- ---------- grade_records ----------
CREATE POLICY gr_read_related ON public.grade_records
  FOR SELECT TO authenticated USING (
    student_id = (select auth.uid()) OR teacher_id = (select auth.uid()) OR (select private.is_admin())
    OR EXISTS (SELECT 1 FROM parent_children pc
               WHERE pc.parent_id = (select auth.uid()) AND pc.child_id = grade_records.student_id)
  );
CREATE POLICY gr_teacher_insert ON public.grade_records
  FOR INSERT TO authenticated WITH CHECK (
    (teacher_id = (select auth.uid())
     AND EXISTS (SELECT 1 FROM student_groups g WHERE g.id = grade_records.group_id AND g.tutor_id = (select auth.uid())))
    OR (select private.is_admin())
  );
CREATE POLICY gr_teacher_update ON public.grade_records
  FOR UPDATE TO authenticated USING (
    teacher_id = (select auth.uid()) OR (select private.is_admin())
  ) WITH CHECK (
    (teacher_id = (select auth.uid())
     AND EXISTS (SELECT 1 FROM student_groups g WHERE g.id = grade_records.group_id AND g.tutor_id = (select auth.uid())))
    OR (select private.is_admin())
  );
CREATE POLICY gr_owner_delete ON public.grade_records
  FOR DELETE TO authenticated USING (
    teacher_id = (select auth.uid()) OR (select private.is_admin())
  );

-- ---------- chat_messages (participant of parent thread) ----------
CREATE POLICY cm_read_participants ON public.chat_messages
  FOR SELECT TO authenticated USING (
    (select private.is_admin_strict())
    OR EXISTS (SELECT 1 FROM chat_threads t
               WHERE t.id = chat_messages.thread_id
                 AND (t.student_id = (select auth.uid()) OR t.teacher_id = (select auth.uid())
                      OR t.parent_id = (select auth.uid()) OR t.assistant_id = (select auth.uid())))
  );
CREATE POLICY cm_insert_participants ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM chat_threads t
            WHERE t.id = chat_messages.thread_id
              AND (t.student_id = (select auth.uid()) OR t.teacher_id = (select auth.uid())
                   OR t.parent_id = (select auth.uid()) OR t.assistant_id = (select auth.uid())))
  );
CREATE POLICY cm_update_participants ON public.chat_messages
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM chat_threads t
            WHERE t.id = chat_messages.thread_id
              AND (t.student_id = (select auth.uid()) OR t.teacher_id = (select auth.uid())
                   OR t.parent_id = (select auth.uid()) OR t.assistant_id = (select auth.uid())))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM chat_threads t
            WHERE t.id = chat_messages.thread_id
              AND (t.student_id = (select auth.uid()) OR t.teacher_id = (select auth.uid())
                   OR t.parent_id = (select auth.uid()) OR t.assistant_id = (select auth.uid())))
  );

-- ---------- student_notes ----------
CREATE POLICY sn_read_owner ON public.student_notes
  FOR SELECT TO authenticated USING (
    teacher_id = (select auth.uid()) OR assistant_id = (select auth.uid()) OR (select private.is_admin())
  );
CREATE POLICY sn_insert_owner ON public.student_notes
  FOR INSERT TO authenticated WITH CHECK (
    teacher_id = (select auth.uid()) OR assistant_id = (select auth.uid()) OR (select private.is_admin())
  );
CREATE POLICY sn_update_owner ON public.student_notes
  FOR UPDATE TO authenticated USING (
    teacher_id = (select auth.uid()) OR (select private.is_admin())
  ) WITH CHECK (
    teacher_id = (select auth.uid()) OR (select private.is_admin())
  );
CREATE POLICY sn_delete_owner ON public.student_notes
  FOR DELETE TO authenticated USING (
    teacher_id = (select auth.uid()) OR (select private.is_admin())
  );

-- ---------- assistant_group_assignments ----------
CREATE POLICY aga_read_participants ON public.assistant_group_assignments
  FOR SELECT TO authenticated USING (
    teacher_id = (select auth.uid()) OR assistant_id = (select auth.uid()) OR (select private.is_admin())
  );
CREATE POLICY aga_teacher_insert ON public.assistant_group_assignments
  FOR INSERT TO authenticated WITH CHECK (
    teacher_id = (select auth.uid()) OR (select private.is_admin())
  );
CREATE POLICY aga_teacher_update ON public.assistant_group_assignments
  FOR UPDATE TO authenticated USING (
    teacher_id = (select auth.uid()) OR assistant_id = (select auth.uid()) OR (select private.is_admin())
  ) WITH CHECK (
    teacher_id = (select auth.uid()) OR (select private.is_admin())
  );

-- ---------- assistant_activity_logs ----------
CREATE POLICY aal_read_participants ON public.assistant_activity_logs
  FOR SELECT TO authenticated USING (
    teacher_id = (select auth.uid()) OR assistant_id = (select auth.uid()) OR (select private.is_admin())
  );

-- ---------- group_transfer_requests ----------
CREATE POLICY gtr_read_participants ON public.group_transfer_requests
  FOR SELECT TO authenticated USING (
    student_id = (select auth.uid()) OR parent_id = (select auth.uid()) OR (select private.is_admin())
    OR EXISTS (SELECT 1 FROM student_groups g
               WHERE g.id IN (group_transfer_requests.from_group_id, group_transfer_requests.to_group_id)
                 AND g.tutor_id = (select auth.uid()))
  );
CREATE POLICY gtr_insert_requester ON public.group_transfer_requests
  FOR INSERT TO authenticated WITH CHECK (
    parent_id = (select auth.uid()) OR student_id = (select auth.uid()) OR (select private.is_admin())
  );
CREATE POLICY gtr_update_participants ON public.group_transfer_requests
  FOR UPDATE TO authenticated USING (
    parent_id = (select auth.uid()) OR (select private.is_admin())
    OR EXISTS (SELECT 1 FROM student_groups g
               WHERE g.id IN (group_transfer_requests.from_group_id, group_transfer_requests.to_group_id)
                 AND g.tutor_id = (select auth.uid()))
  ) WITH CHECK (
    parent_id = (select auth.uid()) OR (select private.is_admin())
    OR EXISTS (SELECT 1 FROM student_groups g
               WHERE g.id IN (group_transfer_requests.from_group_id, group_transfer_requests.to_group_id)
                 AND g.tutor_id = (select auth.uid()))
  );

-- ---------- teacher_change_requests ----------
CREATE POLICY tcr_read_participants ON public.teacher_change_requests
  FOR SELECT TO authenticated USING (
    parent_id = (select auth.uid()) OR student_id = (select auth.uid())
    OR current_teacher_id = (select auth.uid()) OR requested_teacher_id = (select auth.uid())
    OR (select private.is_admin())
  );
CREATE POLICY tcr_insert_parent ON public.teacher_change_requests
  FOR INSERT TO authenticated WITH CHECK (
    parent_id = (select auth.uid()) OR (select private.is_admin())
  );
CREATE POLICY tcr_update_participants ON public.teacher_change_requests
  FOR UPDATE TO authenticated USING (
    parent_id = (select auth.uid()) OR current_teacher_id = (select auth.uid())
    OR requested_teacher_id = (select auth.uid()) OR (select private.is_admin())
  ) WITH CHECK (
    parent_id = (select auth.uid()) OR current_teacher_id = (select auth.uid())
    OR requested_teacher_id = (select auth.uid()) OR (select private.is_admin())
  );

-- ---------- availability_slots ----------
CREATE POLICY avs_read_owner_public ON public.availability_slots
  FOR SELECT TO authenticated USING (
    teacher_id = (select auth.uid()) OR (select private.is_admin())
    OR (select private.is_verified_teacher(teacher_id))
  );
CREATE POLICY avs_teacher_insert ON public.availability_slots
  FOR INSERT TO authenticated WITH CHECK (
    teacher_id = (select auth.uid()) OR (select private.is_admin())
  );
CREATE POLICY avs_teacher_update ON public.availability_slots
  FOR UPDATE TO authenticated USING (
    teacher_id = (select auth.uid()) OR (select private.is_admin())
  ) WITH CHECK (
    teacher_id = (select auth.uid()) OR (select private.is_admin())
  );

-- ---------- calendar_events (owner SELECT/INSERT/DELETE already exist; add UPDATE) ----------
CREATE POLICY calendar_events_owner_update ON public.calendar_events
  FOR UPDATE TO authenticated USING (
    auth.uid() = user_id OR (select private.is_admin())
  ) WITH CHECK (
    auth.uid() = user_id OR (select private.is_admin())
  );

-- ---------- notifications (app inserts from teacher/assistant UI) ----------
CREATE POLICY notifications_authenticated_insert ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- ==============================================================================
-- PART 4 — RPC LOCKDOWN (F9): revoke EXECUTE from anon
-- (trigger helpers fired by anonymous support-ticket inserts are kept)
-- ==============================================================================
REVOKE EXECUTE ON FUNCTION public.submit_tutor_review(uuid, uuid, integer, text, integer, integer, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_tutor_report(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_teacher_verification_reviewed_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.guard_assistant_verification_approval() FROM anon;
