-- HASSTY Admin / Supabase migration
-- Applied to project mxryrgoxofsvjsvpxzew on 2026-08-29.

alter table public.profiles add column if not exists account_status text not null default 'active';
alter table public.profiles add column if not exists badge text not null default 'none';
alter table public.profiles add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.tutor_profiles add column if not exists is_verified boolean not null default false;
alter table public.tutor_profiles add column if not exists verification_status text not null default 'pending';
alter table public.tutor_profiles add column if not exists price_per_session integer default 0;
alter table public.tutor_profiles add column if not exists headline text;
alter table public.tutor_profiles add column if not exists experience_years_text text;
alter table public.tutor_profiles add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.tutor_profiles add column if not exists updated_at timestamptz default now();
create unique index if not exists tutor_profiles_user_id_unique on public.tutor_profiles(user_id);

alter table public.safety_reports add column if not exists target_teacher_id uuid references public.profiles(id) on delete set null;
alter table public.safety_reports add column if not exists category text;

create table if not exists public.teacher_verification_requests (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  teacher_name text not null,
  phone text,
  subject text,
  stage text,
  governorate text,
  area text,
  bio text,
  experience_years text,
  id_card_image_url text,
  certificate_image_url text,
  submitted_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  actioned_at timestamptz,
  actioned_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commission_tracking (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  billing_cycle date not null,
  active_students_count integer not null default 0,
  monthly_gross_egp numeric(12,2) not null default 0,
  tier_rate numeric(6,3) not null default 2.0,
  due_commission_egp numeric(12,2) not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('paid','overdue','pending')),
  last_payment_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(teacher_id,billing_cycle)
);

alter table public.teacher_verification_requests enable row level security;
alter table public.commission_tracking enable row level security;

drop policy if exists tv_teacher_select on public.teacher_verification_requests;
drop policy if exists tv_teacher_insert on public.teacher_verification_requests;
drop policy if exists tv_admin_select on public.teacher_verification_requests;
drop policy if exists tv_admin_insert on public.teacher_verification_requests;
drop policy if exists tv_admin_update on public.teacher_verification_requests;
create policy tv_teacher_select on public.teacher_verification_requests for select to authenticated using ((select auth.uid()) = teacher_id);
create policy tv_teacher_insert on public.teacher_verification_requests for insert to authenticated with check ((select auth.uid()) = teacher_id);
create policy tv_admin_select on public.teacher_verification_requests for select to authenticated using ((select auth.email()) in ('hasstysupport@gmail.com','admin@hassty.com'));
create policy tv_admin_insert on public.teacher_verification_requests for insert to authenticated with check ((select auth.email()) in ('hasstysupport@gmail.com','admin@hassty.com'));
create policy tv_admin_update on public.teacher_verification_requests for update to authenticated using ((select auth.email()) in ('hasstysupport@gmail.com','admin@hassty.com')) with check ((select auth.email()) in ('hasstysupport@gmail.com','admin@hassty.com'));

drop policy if exists ct_admin_select on public.commission_tracking;
drop policy if exists ct_admin_insert on public.commission_tracking;
drop policy if exists ct_admin_update on public.commission_tracking;
create policy ct_admin_select on public.commission_tracking for select to authenticated using ((select auth.email()) in ('hasstysupport@gmail.com','admin@hassty.com'));
create policy ct_admin_insert on public.commission_tracking for insert to authenticated with check ((select auth.email()) in ('hasstysupport@gmail.com','admin@hassty.com'));
create policy ct_admin_update on public.commission_tracking for update to authenticated using ((select auth.email()) in ('hasstysupport@gmail.com','admin@hassty.com')) with check ((select auth.email()) in ('hasstysupport@gmail.com','admin@hassty.com'));

alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.tutor_profiles;
alter publication supabase_realtime add table public.student_groups;
alter publication supabase_realtime add table public.group_enrollments;
alter publication supabase_realtime add table public.attendance_records;
alter publication supabase_realtime add table public.booking_requests;
alter publication supabase_realtime add table public.attendance_disputes;
alter publication supabase_realtime add table public.makeup_requests;
alter publication supabase_realtime add table public.safety_reports;
alter publication supabase_realtime add table public.teacher_verification_requests;
alter publication supabase_realtime add table public.commission_tracking;
