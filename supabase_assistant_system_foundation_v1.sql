-- HASSTY Assistant System Foundation v1
-- Applied to Supabase project mxryrgoxofsvjsvpxzew on 2026-08-30.
-- Purpose: per-group assistant access, group policy settings, exams/slots/results,
-- teacher-change requests, and secure assistant participation in chats.

create schema if not exists private;

create or replace function private.is_admin_strict() returns boolean
language sql stable security definer set search_path = pg_catalog, auth
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or lower(coalesce(auth.jwt() ->> 'email','')) in ('hasstysupport@gmail.com','admin@hassty.com'),
    false
  );
$$;

create table if not exists public.teacher_assistant_group_access (
  id uuid primary key default gen_random_uuid(),
  teacher_assistant_id uuid not null references public.teacher_assistants(id) on delete cascade,
  group_id uuid not null references public.student_groups(id) on delete cascade,
  permissions jsonb not null default '{"view_students":true,"attendance":true,"notes":true,"payments":false,"grades":false,"messaging":true,"manage_group":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(teacher_assistant_id, group_id)
);

alter table public.student_groups add column if not exists require_first_session_registration boolean not null default false;
alter table public.student_groups add column if not exists allow_group_transfers boolean not null default true;
alter table public.student_groups add column if not exists allow_multiple_groups_same_week boolean not null default false;
alter table public.student_groups add column if not exists max_groups_per_student integer not null default 1;
alter table public.student_groups add column if not exists allow_makeup_sessions boolean not null default true;

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid not null references public.student_groups(id) on delete cascade,
  title text not null,
  exam_date date not null,
  duration_minutes integer not null default 60 check (duration_minutes between 1 and 600),
  max_score numeric(8,2) not null default 100 check (max_score > 0),
  instructions text,
  status text not null default 'draft' check (status in ('draft','scheduled','grading','published','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_slots (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  label text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null default 10 check (capacity > 0),
  created_at timestamptz not null default now(),
  unique(exam_id, label),
  check (ends_at > starts_at)
);

create table if not exists public.exam_assignments (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  slot_id uuid not null references public.exam_slots(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  original_group_id uuid references public.student_groups(id) on delete set null,
  assignment_reason text,
  status text not null default 'assigned' check (status in ('assigned','changed','cancelled')),
  created_at timestamptz not null default now(),
  unique(exam_id, student_id)
);

create table if not exists public.exam_results (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid references public.exam_assignments(id) on delete set null,
  score numeric(8,2) not null default 0 check (score >= 0),
  max_score numeric(8,2) not null check (max_score > 0),
  feedback text,
  graded_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(exam_id, student_id)
);

create table if not exists public.teacher_change_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.profiles(id) on delete set null,
  current_teacher_id uuid references public.profiles(id) on delete set null,
  requested_teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  reason text,
  status text not null default 'pending_parent' check (status in ('pending_parent','approved','rejected','cancelled')),
  parent_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_taga_teacher_group on public.teacher_assistant_group_access(teacher_assistant_id, group_id);
create index if not exists idx_exams_teacher_date on public.exams(teacher_id, exam_date);
create index if not exists idx_exam_slots_time on public.exam_slots(starts_at, ends_at);
create index if not exists idx_exam_assignments_student on public.exam_assignments(student_id);
create index if not exists idx_exam_results_student on public.exam_results(student_id);
create index if not exists idx_teacher_change_requests_parent on public.teacher_change_requests(parent_id, status);
create index if not exists idx_teacher_change_requests_student on public.teacher_change_requests(student_id, status);

alter table public.teacher_assistant_group_access enable row level security;
alter table public.exams enable row level security;
alter table public.exam_slots enable row level security;
alter table public.exam_assignments enable row level security;
alter table public.exam_results enable row level security;
alter table public.teacher_change_requests enable row level security;

create or replace function public.assistant_can_access_group(p_group_id uuid, p_permission text default 'groups') returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.teacher_assistant_group_access ga
    join public.teacher_assistants ta on ta.id=ga.teacher_assistant_id
    where ta.assistant_id=(select auth.uid())
      and ta.status='active'
      and ga.group_id=p_group_id
      and coalesce((ga.permissions ->> p_permission)::boolean,false)
  );
$$;

insert into public.teacher_assistant_group_access (teacher_assistant_id, group_id, permissions)
select ta.id, sg.id,
  jsonb_build_object(
    'view_students', coalesce((ta.permissions->>'students')::boolean,true),
    'attendance', coalesce((ta.permissions->>'attendance')::boolean,true),
    'notes', coalesce((ta.permissions->>'notes')::boolean,true),
    'payments', coalesce((ta.permissions->>'payments')::boolean,false),
    'grades', coalesce((ta.permissions->>'grades')::boolean,false),
    'messaging', coalesce((ta.permissions->>'messaging')::boolean,true),
    'manage_group', coalesce((ta.permissions->>'manage_groups')::boolean,false)
  )
from public.teacher_assistants ta
join public.student_groups sg on sg.tutor_id=ta.teacher_id
where ta.status='active'
on conflict (teacher_assistant_id, group_id) do nothing;

create or replace function public.accept_assistant_invitation(p_invitation_id uuid) returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare r public.assistant_invitations%rowtype;
declare ta_id uuid;
begin
  select * into r from public.assistant_invitations where id=p_invitation_id and assistant_id=(select auth.uid()) and status='pending' for update;
  if not found then raise exception 'Invalid invitation'; end if;
  if r.expires_at is not null and r.expires_at < now() then raise exception 'Invitation expired'; end if;
  if not exists(select 1 from public.assistant_profiles a where a.user_id=r.assistant_id and a.is_verified=true and a.verification_status='approved') then raise exception 'Assistant is not verified'; end if;
  update public.assistant_invitations set status='accepted', responded_at=now() where id=r.id;
  insert into public.teacher_assistants(teacher_id, assistant_id, status, permissions, joined_at)
  values(r.teacher_id,r.assistant_id,'active','{"students":true,"attendance":true,"notes":true,"payments":false,"grades":false,"messaging":true,"manage_groups":false}'::jsonb,now())
  on conflict (teacher_id,assistant_id) do update set status='active',ended_at=null,updated_at=now()
  returning id into ta_id;
  insert into public.teacher_assistant_group_access(teacher_assistant_id,group_id)
  select ta_id,sg.id from public.student_groups sg where sg.tutor_id=r.teacher_id
  on conflict (teacher_assistant_id,group_id) do nothing;
end;
$$;

-- Per-group access policies

drop policy if exists taga_select on public.teacher_assistant_group_access;
drop policy if exists taga_manage_teacher on public.teacher_assistant_group_access;
create policy taga_select on public.teacher_assistant_group_access for select to authenticated
using (exists(select 1 from public.teacher_assistants ta where ta.id=teacher_assistant_group_access.teacher_assistant_id and (ta.teacher_id=(select auth.uid()) or ta.assistant_id=(select auth.uid()) or private.is_admin_strict())));
create policy taga_manage_teacher on public.teacher_assistant_group_access for all to authenticated
using (exists(select 1 from public.teacher_assistants ta where ta.id=teacher_assistant_group_access.teacher_assistant_id and (ta.teacher_id=(select auth.uid()) or private.is_admin_strict())))
with check (exists(select 1 from public.teacher_assistants ta where ta.id=teacher_assistant_group_access.teacher_assistant_id and (ta.teacher_id=(select auth.uid()) or private.is_admin_strict())));

-- Exam policies

drop policy if exists exams_teacher_rw on public.exams;
drop policy if exists exams_student_read on public.exams;
drop policy if exists exams_assistant_read on public.exams;
create policy exams_teacher_rw on public.exams for all to authenticated using (teacher_id=(select auth.uid()) or private.is_admin_strict()) with check (teacher_id=(select auth.uid()) or private.is_admin_strict());
create policy exams_student_read on public.exams for select to authenticated using (exists(select 1 from public.group_enrollments ge where ge.group_id=exams.group_id and ge.student_id=(select auth.uid())) or private.is_admin_strict());
create policy exams_assistant_read on public.exams for select to authenticated using (assistant_can_access_group(group_id,'view_students') or private.is_admin_strict());

drop policy if exists exam_slots_participants on public.exam_slots;
create policy exam_slots_participants on public.exam_slots for all to authenticated
using (exists(select 1 from public.exams e where e.id=exam_slots.exam_id and (e.teacher_id=(select auth.uid()) or private.is_admin_strict())) or exists(select 1 from public.exam_assignments ea where ea.slot_id=exam_slots.id and ea.student_id=(select auth.uid())))
with check (exists(select 1 from public.exams e where e.id=exam_slots.exam_id and (e.teacher_id=(select auth.uid()) or private.is_admin_strict())));

drop policy if exists exam_assignments_teacher_manage on public.exam_assignments;
drop policy if exists exam_assignments_student_read on public.exam_assignments;
create policy exam_assignments_teacher_manage on public.exam_assignments for all to authenticated using (exists(select 1 from public.exams e where e.id=exam_assignments.exam_id and (e.teacher_id=(select auth.uid()) or private.is_admin_strict()))) with check (exists(select 1 from public.exams e where e.id=exam_assignments.exam_id and (e.teacher_id=(select auth.uid()) or private.is_admin_strict())));
create policy exam_assignments_student_read on public.exam_assignments for select to authenticated using (student_id=(select auth.uid()) or private.is_admin_strict());

drop policy if exists exam_results_teacher_manage on public.exam_results;
drop policy if exists exam_results_student_read on public.exam_results;
drop policy if exists exam_results_assistant_read on public.exam_results;
create policy exam_results_teacher_manage on public.exam_results for all to authenticated using (exists(select 1 from public.exams e where e.id=exam_results.exam_id and (e.teacher_id=(select auth.uid()) or private.is_admin_strict()))) with check (exists(select 1 from public.exams e where e.id=exam_results.exam_id and (e.teacher_id=(select auth.uid()) or private.is_admin_strict())));
create policy exam_results_student_read on public.exam_results for select to authenticated using (student_id=(select auth.uid()) or private.is_admin_strict());
create policy exam_results_assistant_read on public.exam_results for select to authenticated using (exists(select 1 from public.exams e where e.id=exam_results.exam_id and assistant_can_access_group(e.group_id,'grades')) or private.is_admin_strict());

-- Teacher change requests

drop policy if exists teacher_change_request_participants on public.teacher_change_requests;
drop policy if exists teacher_change_request_student_insert on public.teacher_change_requests;
drop policy if exists teacher_change_request_parent_update on public.teacher_change_requests;
create policy teacher_change_request_participants on public.teacher_change_requests for select to authenticated using (student_id=(select auth.uid()) or parent_id=(select auth.uid()) or current_teacher_id=(select auth.uid()) or requested_teacher_id=(select auth.uid()) or private.is_admin_strict());
create policy teacher_change_request_student_insert on public.teacher_change_requests for insert to authenticated with check (student_id=(select auth.uid()) and (parent_id is null or exists(select 1 from public.parent_children pc where pc.parent_id=teacher_change_requests.parent_id and pc.child_id=teacher_change_requests.student_id)));
create policy teacher_change_request_parent_update on public.teacher_change_requests for update to authenticated using (parent_id=(select auth.uid()) or private.is_admin_strict()) with check (parent_id=(select auth.uid()) or private.is_admin_strict());

-- Assistant participation in teacher-assistant chat

drop policy if exists chat_threads_participant_insert on public.chat_threads;
drop policy if exists chat_threads_participant_select on public.chat_threads;
drop policy if exists chat_threads_participant_update on public.chat_threads;
create policy chat_threads_participant_insert on public.chat_threads for insert to authenticated with check ((auth.uid()=student_id) or (auth.uid()=teacher_id) or (auth.uid()=parent_id) or (auth.uid()=assistant_id) or (is_support and private.is_admin_strict()));
create policy chat_threads_participant_select on public.chat_threads for select to authenticated using ((auth.uid()=student_id) or (auth.uid()=teacher_id) or (auth.uid()=parent_id) or (auth.uid()=assistant_id) or (is_support and private.is_admin_strict()) or private.is_admin_strict());
create policy chat_threads_participant_update on public.chat_threads for update to authenticated using ((auth.uid()=student_id) or (auth.uid()=teacher_id) or (auth.uid()=parent_id) or (auth.uid()=assistant_id) or (is_support and private.is_admin_strict()) or private.is_admin_strict()) with check ((auth.uid()=student_id) or (auth.uid()=teacher_id) or (auth.uid()=parent_id) or (auth.uid()=assistant_id) or (is_support and private.is_admin_strict()) or private.is_admin_strict());

drop policy if exists chat_messages_participant_insert on public.chat_messages;
drop policy if exists chat_messages_participant_select on public.chat_messages;
drop policy if exists chat_messages_participant_update on public.chat_messages;
create policy chat_messages_participant_insert on public.chat_messages for insert to authenticated with check (auth.uid()=sender_id and exists(select 1 from public.chat_threads t where t.id=chat_messages.thread_id and (auth.uid()=t.student_id or auth.uid()=t.teacher_id or auth.uid()=t.parent_id or auth.uid()=t.assistant_id or (t.is_support and private.is_admin_strict()))));
create policy chat_messages_participant_select on public.chat_messages for select to authenticated using (auth.uid()=sender_id or exists(select 1 from public.chat_threads t where t.id=chat_messages.thread_id and (auth.uid()=t.student_id or auth.uid()=t.teacher_id or auth.uid()=t.parent_id or auth.uid()=t.assistant_id or (t.is_support and private.is_admin_strict()) or private.is_admin_strict())));
create policy chat_messages_participant_update on public.chat_messages for update to authenticated using (auth.uid()=sender_id or exists(select 1 from public.chat_threads t where t.id=chat_messages.thread_id and (auth.uid()=t.student_id or auth.uid()=t.teacher_id or auth.uid()=t.parent_id or auth.uid()=t.assistant_id or (t.is_support and private.is_admin_strict()) or private.is_admin_strict()))) with check (auth.uid()=sender_id or exists(select 1 from public.chat_threads t where t.id=chat_messages.thread_id and (auth.uid()=t.student_id or auth.uid()=t.teacher_id or auth.uid()=t.parent_id or auth.uid()=t.assistant_id or (t.is_support and private.is_admin_strict()) or private.is_admin_strict())));

create index if not exists idx_teacher_assistants_teacher_status on public.teacher_assistants(teacher_id,status);
create index if not exists idx_teacher_assistants_assistant_status on public.teacher_assistants(assistant_id,status);
