-- ============================================================
-- Hassty — باقة «تحكم المدرس الاحترافي» | Teacher Pro Control
-- تاريخ التطبيق: 2026-10-06
-- ------------------------------------------------------------
-- تشمل:
--   1) تخصيص أعمق للمجموعات (وصف/لون/ملاحظات/سماح تجاوز التعارض)
--   2) حضور مرن بين المجموعات (نفس المرحلة) + جدول مخصص لكل طالب
--   3) إعفاء الطلاب من المصاريف
--   4) شرائح عمولة المنصة المتدرجة (1-200: 1% / 200-500: 0.5%)
--   5) فواتير المنصة: تنزل تلقائيًا عند تحصيل 75% من المجموعة
--   6) دوال تعارض مواعيد واعية بالجداول المخصصة والوضع المرن
--   7) apply_group_slot_change بوضع «الفرض» (تجاوز التعارض والتهدئة)
-- Idempotent: آمن للتطبيق المتكرر.
-- ============================================================

-- ============================================================
-- 1) تخصيص أعمق للمجموعات
-- ============================================================
alter table public.student_groups
  add column if not exists description text,
  add column if not exists color text,                 -- مفتاح لون بصري للمجموعة (اختياري)
  add column if not exists allow_schedule_override boolean not null default true; -- المدرس يقدر يفرض المواعيد رغم التعارض

-- ============================================================
-- 2) ترقية سجل القيد: حضور مرن + جدول مخصص + إعفاء مصاريف
-- ============================================================
alter table public.group_enrollments
  add column if not exists attendance_mode text not null default 'fixed',      -- fixed | flexible
  add column if not exists custom_schedule_slots jsonb not null default '[]'::jsonb, -- ميعاد خاص لهذا الطالب في هذه المجموعة
  add column if not exists fee_exempt boolean not null default false,          -- إعفاء من المصاريف
  add column if not exists fee_exempt_reason text,
  add column if not exists fee_exempt_until date;

do $$ begin
  alter table public.group_enrollments
    add constraint enrollment_attendance_mode_chk check (attendance_mode in ('fixed','flexible'));
exception when duplicate_object then null; end $$;

-- ============================================================
-- 3) شرائح العمولة المتدرجة
-- ============================================================
create table if not exists public.commission_tiers (
  id           bigint generated always as identity primary key,
  min_students integer not null,
  max_students integer,                      -- null = بلا حد
  rate_pct     numeric(6,3) not null,
  label        text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint commission_tiers_range_chk check (max_students is null or max_students >= min_students)
);

-- البذور الافتراضية (قابلة للتعديل من لوحة الإدارة بدون أي كود)
insert into public.commission_tiers (min_students, max_students, rate_pct, label) values
  (1,   200, 1.000, 'من 1 إلى 200 طالب'),
  (200, 500, 0.500, 'من 200 إلى 500 طالب'),
  (500, null, 0.500, 'أكثر من 500 طالب')
on conflict do nothing;

alter table public.commission_tiers enable row level security;

drop policy if exists commission_tiers_read on public.commission_tiers;
create policy commission_tiers_read on public.commission_tiers
  for select to anon, authenticated using (true);

drop policy if exists commission_tiers_admin_write on public.commission_tiers;
create policy commission_tiers_admin_write on public.commission_tiers
  for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- ============================================================
-- 4) فواتير المنصة (لكل مجموعة على حدة)
--    القاعدة: عند تحصيل 75%+ من الطلاب القابلين للتحصيل في مجموعة
--    خلال فترة شهرية → تنزل فاتورة المنصة على المدرس.
-- ============================================================
create table if not exists public.platform_invoices (
  id                    uuid primary key default gen_random_uuid(),
  teacher_id            uuid not null,
  group_id              uuid not null,
  billing_period        text not null,                -- 'YYYY-MM'
  total_active_students integer not null default 0,
  exempt_students       integer not null default 0,
  billable_students     integer not null default 0,
  paid_students         integer not null default 0,
  collection_rate_pct   numeric(6,3) not null default 0,
  gross_collected_egp   numeric(12,2) not null default 0,
  tier_rate_pct         numeric(6,3) not null default 1,
  invoice_amount_egp    numeric(12,2) not null default 0,
  status                text not null default 'pending',  -- pending | due | paid | cancelled
  threshold_met_at      timestamptz,
  paid_at               timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint platform_invoices_period_chk check (billing_period ~ '^[0-9]{4}-[0-9]{2}$'),
  constraint platform_invoices_unique unique (teacher_id, group_id, billing_period)
);

create index if not exists platform_invoices_teacher_idx on public.platform_invoices (teacher_id, billing_period desc);
create index if not exists platform_invoices_group_idx on public.platform_invoices (group_id, billing_period);

alter table public.platform_invoices enable row level security;

drop policy if exists platform_invoices_teacher_read on public.platform_invoices;
create policy platform_invoices_teacher_read on public.platform_invoices
  for select to authenticated
  using (
    teacher_id = (select auth.uid())
    or exists (select 1 from public.student_groups g where g.id = platform_invoices.group_id and g.tutor_id = (select auth.uid()))
    or public.current_user_is_admin()
  );

drop policy if exists platform_invoices_admin_update on public.platform_invoices;
create policy platform_invoices_admin_update on public.platform_invoices
  for update to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- الكتابة تتم فقط عبر دالة SECURITY DEFINER أدناه (لا insert/delete مباشر للعملاء)

-- إعدادات قابلة للتعديل (عتبة الفاتورة)
insert into public.platform_settings (key, value, description, updated_at)
values ('platform_invoice_threshold_pct', '75', 'نسبة تحصيل المجموعة التي عندها تنزل فاتورة المنصة للمدرس (%)', now())
on conflict (key) do nothing;

-- ============================================================
-- 5) دالة الشريحة الفعالة للمدرس
-- ============================================================
create or replace function public.get_commission_rate_pct(p_teacher_id uuid)
returns numeric
language sql stable security definer
set search_path = 'public', 'pg_temp'
as $$
  select t.rate_pct
  from public.commission_tiers t
  where t.is_active
    and (select count(distinct ge.student_id)
          from public.group_enrollments ge
          join public.student_groups g on g.id = ge.group_id
          where g.tutor_id = p_teacher_id
            and g.is_active is distinct from false
            and ge.status = 'active'
            and ge.student_id is not null) >= t.min_students
    and (t.max_students is null
         or (select count(distinct ge.student_id)
              from public.group_enrollments ge
              join public.student_groups g on g.id = ge.group_id
              where g.tutor_id = p_teacher_id
                and g.is_active is distinct from false
                and ge.status = 'active'
                and ge.student_id is not null) <= t.max_students)
  order by t.min_students desc
  limit 1
$$;

create or replace function public.get_effective_commission_rate(p_teacher_id uuid)
returns jsonb
language plpgsql stable security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  v_students integer;
  v_tier public.commission_tiers%rowtype;
  v_next public.commission_tiers%rowtype;
begin
  select count(distinct ge.student_id) into v_students
  from public.group_enrollments ge
  join public.student_groups g on g.id = ge.group_id
  where g.tutor_id = p_teacher_id
    and g.is_active is distinct from false
    and ge.status = 'active'
    and ge.student_id is not null;

  select * into v_tier
  from public.commission_tiers
  where is_active and v_students >= min_students
    and (max_students is null or v_students <= max_students)
  order by min_students desc limit 1;

  select * into v_next
  from public.commission_tiers
  where is_active and min_students > v_students
  order by min_students asc limit 1;

  return jsonb_build_object(
    'active_students', v_students,
    'rate_pct', coalesce(v_tier.rate_pct, 1.0),
    'tier_label', v_tier.label,
    'next_tier_students', v_next.min_students,
    'next_tier_rate', v_next.rate_pct,
    'students_to_next', case when v_next.min_students is null then null else v_next.min_students - v_students end
  );
end
$$;

-- ============================================================
-- 6) تحديث/إنشاء فاتورة المنصة لمجموعة+فترة
-- ============================================================
create or replace function public.refresh_platform_invoice(p_group_id uuid, p_period text)
returns jsonb
language plpgsql security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  v_group public.student_groups%rowtype;
  v_active integer; v_exempt integer; v_billable integer; v_paid integer;
  v_gross numeric; v_rate numeric; v_threshold numeric := 75;
  v_rate_pct numeric; v_invoice public.platform_invoices%rowtype;
begin
  select * into v_group from public.student_groups where id = p_group_id;
  if not found then return jsonb_build_object('ok', false, 'message', 'المجموعة غير موجودة'); end if;

  v_threshold := 75;
  begin
    select (value #>> '{}')::numeric into v_threshold
    from public.platform_settings where key = 'platform_invoice_threshold_pct';
  exception when others then v_threshold := 75;
  end;
  if v_threshold is null or v_threshold <= 0 or v_threshold > 100 then v_threshold := 75; end if;

  select count(*) filter (where status = 'active'),
         count(*) filter (where status = 'active' and fee_exempt)
    into v_active, v_exempt
  from public.group_enrollments where group_id = p_group_id;
  v_billable := greatest(v_active - v_exempt, 0);

  -- الطلاب المسددين فعليًا لهذه المجموعة في هذه الفترة (الطلاب المعفون لا يُحتسبون)
  select count(distinct pr.student_id) into v_paid
  from public.payment_records pr
  join public.group_enrollments ge on ge.group_id = pr.group_id and ge.student_id = pr.student_id
  where pr.group_id = p_group_id
    and pr.status = 'paid'
    and pr.billing_period = p_period
    and ge.status = 'active'
    and ge.fee_exempt = false;
  v_paid := least(v_paid, v_billable);

  select coalesce(sum(pr.amount), 0) into v_gross
  from public.payment_records pr
  join public.group_enrollments ge on ge.group_id = pr.group_id and ge.student_id = pr.student_id
  where pr.group_id = p_group_id
    and pr.status = 'paid'
    and pr.billing_period = p_period
    and ge.status = 'active'
    and ge.fee_exempt = false;

  v_rate := case when v_billable > 0 then round(v_paid::numeric * 100 / v_billable, 2) else 0 end;
  v_rate_pct := coalesce(public.get_commission_rate_pct(v_group.tutor_id), 1.0);

  insert into public.platform_invoices (
    teacher_id, group_id, billing_period,
    total_active_students, exempt_students, billable_students, paid_students,
    collection_rate_pct, gross_collected_egp, tier_rate_pct, invoice_amount_egp,
    status, threshold_met_at
  ) values (
    v_group.tutor_id, p_group_id, p_period,
    v_active, v_exempt, v_billable, v_paid,
    v_rate, v_gross, v_rate_pct, round(v_gross * v_rate_pct / 100.0, 2),
    case when v_billable > 0 and v_rate >= v_threshold then 'due' else 'pending' end,
    case when v_billable > 0 and v_rate >= v_threshold then now() end
  )
  on conflict (teacher_id, group_id, billing_period) do update
    set total_active_students = excluded.total_active_students,
        exempt_students       = excluded.exempt_students,
        billable_students     = excluded.billable_students,
        paid_students         = excluded.paid_students,
        collection_rate_pct   = excluded.collection_rate_pct,
        gross_collected_egp   = excluded.gross_collected_egp,
        tier_rate_pct         = excluded.tier_rate_pct,
        invoice_amount_egp    = excluded.invoice_amount_egp,
        status = case
          when public.platform_invoices.status = 'paid' then public.platform_invoices.status  -- المدفوع لا يرجع
          when excluded.collection_rate_pct >= v_threshold then 'due'
          else 'pending'
        end,
        threshold_met_at = coalesce(public.platform_invoices.threshold_met_at, excluded.threshold_met_at),
        updated_at = now()
  returning * into v_invoice;

  return jsonb_build_object('ok', true, 'invoice', jsonb_build_object(
    'id', v_invoice.id, 'status', v_invoice.status,
    'paid_students', v_invoice.paid_students, 'billable_students', v_invoice.billable_students,
    'collection_rate_pct', v_invoice.collection_rate_pct,
    'invoice_amount_egp', v_invoice.invoice_amount_egp));
end
$$;

-- تريجر: أي دفعة جديدة/محدثة → تحديث فاتورة مجموعتها فورًا (لا يكسر الدفع أبدًا)
create or replace function public.trg_refresh_platform_invoice()
returns trigger
language plpgsql security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  begin
    if new.group_id is not null and new.billing_period is not null then
      perform public.refresh_platform_invoice(new.group_id, new.billing_period);
    end if;
  exception when others then
    raise warning 'HASSTY platform invoice refresh failed: %', sqlerrm;
  end;
  return coalesce(new, old);
end
$$;

drop trigger if exists payment_records_invoice_refresh on public.payment_records;
create trigger payment_records_invoice_refresh
after insert or update of status, amount, paid_at, group_id, billing_period
on public.payment_records
for each row execute function public.trg_refresh_platform_invoice();

-- ============================================================
-- 7) RPC تحكم المدرس بخيارات الطالب داخل مجموعته
--    (وضع الحضور / الجدول الخاص / الإعفاء)
-- ============================================================
create or replace function public.update_student_enrollment_options(
  p_enrollment_id uuid,
  p_attendance_mode text default null,       -- 'fixed' | 'flexible'
  p_custom_slots jsonb default null,         -- [] = استخدم جدول المجموعة
  p_fee_exempt boolean default null,
  p_fee_exempt_reason text default null,
  p_fee_exempt_until date default null
)
returns jsonb
language plpgsql security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  v_uid uuid := auth.uid();
  v_en public.group_enrollments%rowtype;
  v_slot jsonb;
  v_day text; v_st text; v_et text;
begin
  if v_uid is null then raise exception 'غير مصرح'; end if;

  select * into v_en from public.group_enrollments where id = p_enrollment_id;
  if not found then raise exception 'سجل القيد غير موجود'; end if;

  if not exists (select 1 from public.student_groups g
                 where g.id = v_en.group_id and (g.tutor_id = v_uid or public.current_user_is_admin())) then
    raise exception 'المدرس المالك للمجموعة فقط من يعدل خيارات الطالب';
  end if;

  if p_attendance_mode is not null and p_attendance_mode not in ('fixed','flexible') then
    raise exception 'وضع الحضور يجب أن يكون fixed أو flexible';
  end if;

  -- تحقق صحة الجدول المخصص
  if p_custom_slots is not null then
    for v_slot in select value from jsonb_array_elements(p_custom_slots) loop
      v_day := coalesce(v_slot->>'day', v_slot->>'dayArabic');
      v_st  := v_slot->>'startTime'; v_et := v_slot->>'endTime';
      if v_day is null or v_st is null or v_et is null then
        raise exception 'كل ميعاد يحتاج يوم ووقت بداية ونهاية';
      end if;
      if nullif(v_st,'')::time is null or nullif(v_et,'')::time is null or v_et::time <= v_st::time then
        raise exception 'أوقات غير صالحة في الجدول المخصص — النهاية لازم تكون بعد البداية';
      end if;
    end loop;
  end if;

  update public.group_enrollments set
    attendance_mode      = coalesce(p_attendance_mode, attendance_mode),
    custom_schedule_slots = case when p_custom_slots is null then custom_schedule_slots
                                 when jsonb_typeof(p_custom_slots) = 'null' then '[]'::jsonb
                                 else p_custom_slots end,
    fee_exempt           = coalesce(p_fee_exempt, fee_exempt),
    fee_exempt_reason    = case when p_fee_exempt = false then null
                                else coalesce(p_fee_exempt_reason, fee_exempt_reason) end,
    fee_exempt_until     = case when p_fee_exempt = false then null
                                else coalesce(p_fee_exempt_until, fee_exempt_until) end
  where id = p_enrollment_id
  returning * into v_en;

  return jsonb_build_object('ok', true,
    'attendance_mode', v_en.attendance_mode,
    'custom_schedule_slots', v_en.custom_schedule_slots,
    'fee_exempt', v_en.fee_exempt);
end
$$;

-- ============================================================
-- 8) مجموعات شقيقة متاحة لطالب (نفس المدرس + نفس المرحلة)
--    → لعرضها عند تفعيل الحضور المرن/الإضافة لمجموعة ثانية
-- ============================================================
create or replace function public.list_student_sibling_groups(
  p_student_id uuid,
  p_teacher_id uuid default null
)
returns table (group_id uuid, group_name text, grade text, subject text,
              schedule text, schedule_slots jsonb, current_count integer, max_students integer,
              already_enrolled boolean)
language sql stable security definer
set search_path = 'public', 'pg_temp'
as $$
  select g.id, g.name, g.grade, g.subject, g.schedule, g.schedule_slots,
         g.current_count, g.max_students,
         exists (select 1 from public.group_enrollments ge2
                 where ge2.group_id = g.id and ge2.student_id = p_student_id and ge2.status = 'active')
  from public.student_groups g
  where g.is_active is distinct from false
    and (p_teacher_id is null or g.tutor_id = p_teacher_id)
    and g.grade = coalesce((select g2.grade from public.student_groups g2
                             join public.group_enrollments ge3 on ge3.group_id = g2.id
                             where ge3.student_id = p_student_id and ge3.status='active'
                             limit 1), g.grade)
  order by g.name
$$;

-- ============================================================
-- 9) دوال تعارض واعية بالجدول المخصص والوضع المرن
--    (نفس التواقيع القديمة — سلوك مطوّر)
-- ============================================================
create or replace function public.student_has_group_schedule_conflict(
  p_student_id uuid, p_starts_at timestamptz, p_ends_at timestamptz, p_exclude_group_id uuid default null
)
returns boolean
language plpgsql stable security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  day_name text; s time; e time; other jsonb; slot jsonb;
begin
  if p_student_id is null or p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then return false; end if;
  day_name := case extract(isodow from (p_starts_at at time zone 'Africa/Cairo'))
    when 6 then 'Saturday' when 7 then 'Sunday' when 1 then 'Monday' when 2 then 'Tuesday'
    when 3 then 'Wednesday' when 4 then 'Thursday' when 5 then 'Friday' else '' end;
  s := (p_starts_at at time zone 'Africa/Cairo')::time;
  e := (p_ends_at at time zone 'Africa/Cairo')::time;

  for other in
    -- 🔄 جدول الطالب الخاص إن وُجد، وإلا جدول المجموعة — والمرنون لا يُفحصون أصلًا
    select case when jsonb_array_length(coalesce(ge.custom_schedule_slots, '[]'::jsonb)) > 0
                then ge.custom_schedule_slots
                else coalesce(g.schedule_slots, '[]'::jsonb) end as slots
    from public.group_enrollments ge
    join public.student_groups g on g.id = ge.group_id
    where ge.student_id = p_student_id
      and ge.status = 'active'
      and ge.attendance_mode = 'fixed'   -- الطالب المرن اختار مرونة المواعيد بنفسه
      and g.is_active is distinct from false
      and (p_exclude_group_id is null or g.id <> p_exclude_group_id)
  loop
    for slot in select value from jsonb_array_elements(coalesce(other, '[]'::jsonb)) loop
      if coalesce(slot->>'day','') = day_name
         and nullif(slot->>'startTime','') is not null
         and nullif(slot->>'endTime','') is not null
         and s < (slot->>'endTime')::time
         and (slot->>'startTime')::time < e then return true;
      end if;
    end loop;
  end loop;
  return false;
end
$$;

create or replace function public.has_group_schedule_conflict(p_student_id uuid, p_group_id uuid)
returns boolean
language plpgsql stable security definer
set search_path = 'public', 'pg_temp'
as $$
declare target jsonb; other jsonb; t jsonb; o jsonb; tday text; oday text; ts time; te time; os time; oe time;
begin
  select schedule_slots into target from public.student_groups where id = p_group_id;
  if target is null then return false; end if;
  for other in
    select case when jsonb_array_length(coalesce(ge.custom_schedule_slots, '[]'::jsonb)) > 0
                then ge.custom_schedule_slots
                else coalesce(g.schedule_slots, '[]'::jsonb) end as slots
    from public.group_enrollments ge
    join public.student_groups g on g.id = ge.group_id
    where ge.student_id = p_student_id
      and ge.status = 'active'
      and ge.attendance_mode = 'fixed'
      and ge.group_id <> p_group_id
  loop
    for t in select value from jsonb_array_elements(coalesce(target, '[]'::jsonb)) loop
      tday := coalesce(t->>'day', t->>'dayArabic', ''); ts := nullif(t->>'startTime','')::time; te := nullif(t->>'endTime','')::time;
      if ts is null or te is null then continue; end if;
      for o in select value from jsonb_array_elements(coalesce(other, '[]'::jsonb)) loop
        oday := coalesce(o->>'day', o->>'dayArabic', ''); os := nullif(o->>'startTime','')::time; oe := nullif(o->>'endTime','')::time;
        if oday = tday and os is not null and oe is not null and ts < oe and os < te then return true; end if;
      end loop;
    end loop;
  end loop;
  return false;
end
$$;

-- ============================================================
-- 10) apply_group_slot_change + وضع «الفرض»
--     p_force=true: تجاوز التهدئة وحق الأغلبية — يبقى تعارض
--     نفس المجموعة ممنوعًا منطقيًا، والطلاب المتأثرون يُبلَّغون وتبقى
--     قائمة التعارضات في الرد ليعرف المدرس بمن تأثر.
-- ============================================================
drop function if exists public.apply_group_slot_change(uuid, integer, text, text, text, text);

create or replace function public.apply_group_slot_change(
  p_group_id uuid, p_slot_index integer, p_new_day text, p_new_start text, p_new_end text,
  p_reason text default null,
  p_force boolean default false
)
returns jsonb
language plpgsql security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  v_uid uuid := auth.uid();
  v_group public.student_groups%rowtype;
  v_settings jsonb;
  v_lock_min int := 120;
  v_cooldown_h int := 72;
  v_effective timestamptz;
  v_last timestamptz;
  v_hours_left numeric;
  v_old_slots jsonb; v_new_slots jsonb;
  v_old_slot jsonb; v_new_slot jsonb;
  v_s jsonb;
  v_os time; v_oe time;
  v_sess record; v_stud record;
  v_dow int; v_new_dow int; v_shift int;
  v_new_starts timestamptz; v_new_ends timestamptz;
  v_updated int := 0;
  v_total int := 0; v_conflicts int := 0; v_rows jsonb := '[]'::jsonb;
  v_stud2 record; v_other record;
  v_summary text; v_new_summary text;
begin
  if v_uid is null then raise exception 'غير مصرح'; end if;
  select * into v_group from public.student_groups where id = p_group_id;
  if not found then raise exception 'المجموعة غير موجودة'; end if;
  if v_group.tutor_id <> v_uid and not public.current_user_is_admin() then
    raise exception 'المدرس المالك فقط من يغير مواعيد مجموعته';
  end if;

  select value into v_settings from public.platform_settings where key = 'smart_schedule' limit 1;
  v_lock_min := coalesce((v_settings->>'lock_minutes')::int, 120);
  v_cooldown_h := coalesce((v_settings->>'cooldown_hours')::int, 72);
  v_effective := now() + make_interval(mins => greatest(v_lock_min, 0));

  -- قاعدة التهدئة: قابلة للتجاوز بوضع الفرض فقط
  if not p_force then
    select max(created_at) into v_last from public.group_schedule_history where group_id = p_group_id;
    if v_last is not null then
      v_hours_left := v_cooldown_h - (extract(epoch from (now() - v_last)) / 3600.0);
      if v_hours_left > 0 then
        return jsonb_build_object('ok', false, 'code', 'COOLDOWN', 'hours_left', ceil(v_hours_left)::int,
          'message', 'تغيير المواعيد متاح بعد ' || ceil(v_hours_left)::int || ' ساعة (فترة تهدئة لحماية الطلاب من التقلبات) — أو فعّل «فرض التغيير».');
      end if;
    end if;
  end if;

  v_old_slots := coalesce(v_group.schedule_slots, '[]'::jsonb);
  if p_slot_index < 0 or p_slot_index >= jsonb_array_length(v_old_slots) then
    raise exception 'الموعد المحدد غير موجود في المجموعة';
  end if;
  v_old_slot := v_old_slots -> p_slot_index;
  if nullif(p_new_start, '')::time is null or nullif(p_new_end, '')::time is null
     or p_new_end::time <= p_new_start::time then
    raise exception 'أوقات غير صالحة — نهاية الحصة لازم تكون بعد بدايتها';
  end if;

  v_new_slot := v_old_slot || jsonb_build_object(
    'day', p_new_day,
    'dayArabic', case p_new_day
      when 'Saturday' then 'السبت' when 'Sunday' then 'الأحد' when 'Monday' then 'الإثنين'
      when 'Tuesday' then 'الثلاثاء' when 'Wednesday' then 'الأربعاء'
      when 'Thursday' then 'الخميس' when 'Friday' then 'الجمعة'
      else coalesce(v_old_slot->>'dayArabic', p_new_day) end,
    'startTime', p_new_start, 'endTime', p_new_end);
  v_new_slots := jsonb_set(v_old_slots, array[p_slot_index::text], v_new_slot);

  -- تعارض داخل نفس المجموعة: ممنوع دائمًا (مستحيل منطقيًا)
  for v_s in select value from jsonb_array_elements(v_old_slots) loop
    if v_s is distinct from v_old_slot and coalesce(v_s->>'day', v_s->>'dayArabic', '') = p_new_day then
      v_os := nullif(v_s->>'startTime', '')::time; v_oe := nullif(v_s->>'endTime', '')::time;
      if v_os is not null and v_oe is not null and p_new_start::time < v_oe and v_os < p_new_end::time then
        return jsonb_build_object('ok', false, 'code', 'SAME_GROUP_OVERLAP',
          'message', 'الميعاد الجديد بيتعارض مع ميعاد تاني في نفس المجموعة: '
            || coalesce(v_s->>'dayArabic', v_s->>'day') || ' ' || v_os::text || ' - ' || v_oe::text);
      end if;
    end if;
  end loop;

  -- فحص تعارض الطلاب (واعٍ بالجدول المخصص + تخطي المرنين)
  for v_stud2 in
    select ge.student_id, coalesce(nullif(ge.student_name, ''), p.full_name, 'طالب') as student_name
    from public.group_enrollments ge
    left join public.profiles p on p.id = ge.student_id
    where ge.group_id = p_group_id and ge.status = 'active' and ge.student_id is not null
  loop
    v_total := v_total + 1;
    begin
      for v_other in
        select g.name as gname, el.value as slot
        from public.group_enrollments ge2
        join public.student_groups g on g.id = ge2.group_id and coalesce(g.is_active, true)
        cross join lateral jsonb_array_elements(
          case when jsonb_array_length(coalesce(ge2.custom_schedule_slots, '[]'::jsonb)) > 0
               then ge2.custom_schedule_slots
               else coalesce(g.schedule_slots, '[]'::jsonb) end
        ) el
        where ge2.student_id = v_stud2.student_id
          and ge2.status = 'active'
          and ge2.group_id <> p_group_id
          and ge2.attendance_mode = 'fixed'
      loop
        if coalesce(v_other.slot->>'day', v_other.slot->>'dayArabic', '') = coalesce(p_new_day, '') then
          v_os := nullif(v_other.slot->>'startTime', '')::time;
          v_oe := nullif(v_other.slot->>'endTime', '')::time;
          if v_os is not null and v_oe is not null and p_new_start::time < v_oe and v_os < p_new_end::time then
            v_conflicts := v_conflicts + 1;
            v_rows := v_rows || jsonb_build_object(
              'student_id', v_stud2.student_id, 'student_name', v_stud2.student_name,
              'with_group', v_other.gname,
              'with_day', coalesce(v_other.slot->>'dayArabic', v_other.slot->>'day'),
              'with_start', v_os::text, 'with_end', v_oe::text);
            exit;
          end if;
        end if;
      end loop;
    exception when others then null;
    end;
  end loop;

  -- حماية الأغلبية: تُتجاوز بوضع الفرض (المدرس يتحمل مسؤولية التعارض)
  if not p_force and v_total > 0 and v_conflicts > (v_total - v_conflicts) then
    return jsonb_build_object('ok', false, 'code', 'MAJORITY_CONFLICT',
      'total', v_total, 'conflict_count', v_conflicts, 'free_count', v_total - v_conflicts,
      'conflicts', v_rows,
      'message', 'الأغلبية (' || v_conflicts || ' من ' || v_total || ') عليهم درس في الميعاد الجديد — جرب ميعاد تاني، أو فعّل «فرض التغيير» لو متأكد.');
  end if;

  v_summary := public._schedule_summary(v_old_slots);
  v_new_summary := public._schedule_summary(v_new_slots);

  update public.student_groups
    set schedule_slots = v_new_slots,
        schedule = v_new_summary,
        candidate_slots = coalesce((
          select jsonb_agg(c - 'k' order by k) from (
            select distinct on (public._slot_key(c->>'day', c->>'startTime'))
                   c, public._slot_key(c->>'day', c->>'startTime') as k
            from jsonb_array_elements(coalesce(v_group.candidate_slots, '[]'::jsonb) || jsonb_build_array(v_new_slot)) c
            order by public._slot_key(c->>'day', c->>'startTime')
          ) t), '[]'::jsonb),
        updated_at = now()
    where id = p_group_id;

  -- إعادة جدولة الحصص القادمة فقط على اليوم القديم
  v_dow := public._day_dow(v_old_slot->>'day');
  v_new_dow := public._day_dow(p_new_day);
  if v_new_dow > 7 then v_new_dow := v_dow; end if;
  v_shift := v_new_dow - v_dow;

  for v_sess in
    select * from public.lesson_sessions
    where group_id = p_group_id and status = 'scheduled' and starts_at >= v_effective
      and extract(isodow from starts_at)::int = v_dow
    order by starts_at
  loop
    v_new_starts := ((v_sess.session_date + v_shift)::text || ' ' || p_new_start)::timestamp at time zone 'Africa/Cairo';
    while v_new_starts < v_effective loop
      v_new_starts := v_new_starts + interval '7 days';
    end loop;
    v_new_ends := ((v_new_starts at time zone 'Africa/Cairo')::date::text || ' ' || p_new_end)::timestamp at time zone 'Africa/Cairo';
    if v_new_ends <= v_new_starts then v_new_ends := v_new_ends + interval '1 day'; end if;

    delete from public.calendar_events
      where event_type = 'lesson' and starts_at = v_sess.starts_at
        and user_id in (select student_id from public.group_enrollments where group_id = p_group_id and status = 'active');
    update public.lesson_sessions
      set session_date = (v_new_starts at time zone 'Africa/Cairo')::date,
          starts_at = v_new_starts, ends_at = v_new_ends, updated_at = now()
      where id = v_sess.id;
    for v_stud in select student_id from public.group_enrollments where group_id = p_group_id and status = 'active' loop
      insert into public.calendar_events(user_id, title, event_type, starts_at, ends_at, link)
      values (v_stud.student_id, v_sess.title, 'lesson', v_new_starts, v_new_ends, '/student/calendar');
    end loop;
    v_updated := v_updated + 1;
  end loop;

  insert into public.group_schedule_history(
    group_id, proposal_id, old_slots, new_slots, old_schedule, new_schedule, reason,
    applied_by, effective_from, sessions_updated)
  values (
    p_group_id, null, v_old_slots, v_new_slots, v_summary, v_new_summary,
    coalesce(p_reason, case when p_force then 'فرض مباشر من المدرس (تجاوز التعارض)' else 'تغيير مباشر من لوحة المجموعة' end),
    v_uid, v_effective, v_updated);

  for v_stud in select student_id from public.group_enrollments where group_id = p_group_id and status = 'active' loop
    insert into public.notifications(user_id, title, message, type, link)
    values (v_stud.student_id, 'تحديث موعد المجموعة',
      'تم تغيير موعد مجموعة «' || v_group.name || '» إلى: ' || v_new_summary
      || ' — يبدأ التطبيق من الحصة القادمة، والحصص المنتهية لن تتغير.', 'schedule', '/student/dashboard');
  end loop;

  return jsonb_build_object('ok', true, 'applied', true, 'forced', p_force, 'sessions_updated', v_updated,
    'effective_from', v_effective, 'new_schedule', v_new_summary,
    'total', v_total, 'conflict_count', v_conflicts, 'free_count', v_total - v_conflicts,
    'conflicts', v_rows);
end
$$;

-- ============================================================
-- 11) تحديث سياسات commission_tracking القديمة → بوابة الأدمن الديناميكية
--     + دالة تحديث الشريحة الشهرية من الجدول الجديد
-- ============================================================
drop policy if exists ct_admin_insert on public.commission_tracking;
drop policy if exists ct_admin_select on public.commission_tracking;
drop policy if exists ct_admin_update on public.commission_tracking;
create policy ct_admin_insert on public.commission_tracking
  for insert to authenticated with check (public.current_user_is_admin());
create policy ct_admin_select on public.commission_tracking
  for select to authenticated using (public.current_user_is_admin());
create policy ct_admin_update on public.commission_tracking
  for update to authenticated using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create or replace function public.refresh_teacher_commission_summary(p_teacher_id uuid)
returns jsonb
language plpgsql security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  v_students int; v_rate numeric; v_cycle date := date_trunc('month', now())::date;
  v_gross numeric;
  v_row public.commission_tracking%rowtype;
begin
  select (j->>'active_students')::int, (j->>'rate_pct')::numeric
    into v_students, v_rate
  from public.get_effective_commission_rate(p_teacher_id) j;

  select coalesce(sum(amount), 0) into v_gross
  from public.payment_records pr
  join public.student_groups g on g.id = pr.group_id
  where g.tutor_id = p_teacher_id and pr.status = 'paid'
    and to_char(pr.paid_at, 'YYYY-MM') = to_char(now(), 'YYYY-MM');

  insert into public.commission_tracking (teacher_id, billing_cycle, active_students_count, monthly_gross_egp, tier_rate, due_commission_egp)
  values (p_teacher_id, v_cycle, v_students, v_gross, v_rate, round(v_gross * v_rate / 100.0, 2))
  on conflict (teacher_id, billing_cycle) do update
    set active_students_count = excluded.active_students_count,
        monthly_gross_egp = excluded.monthly_gross_egp,
        tier_rate = excluded.tier_rate,
        due_commission_egp = excluded.due_commission_egp,
        updated_at = now()
  returning * into v_row;

  return jsonb_build_object('ok', true, 'students', v_students, 'rate_pct', v_rate, 'gross', v_gross);
end
$$;

-- ============================================================
-- 12) فهارس + Realtime + Grants
-- ============================================================
create index if not exists group_enrollments_active_exempt_idx
  on public.group_enrollments (group_id) where (status = 'active' and fee_exempt);
create index if not exists payment_records_group_period_idx
  on public.payment_records (group_id, billing_period, status);

do $$ begin
  alter publication supabase_realtime add table public.platform_invoices;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.commission_tiers;
exception when duplicate_object then null; end $$;

-- ============================================================
-- 13) تهيئة فواتير الشهر الحالي للمجموعات النشطة (بيانات فورية للواجهات)
-- ============================================================
do $$
declare g record; v_period text := to_char(now(), 'YYYY-MM');
begin
  for g in select id from public.student_groups where is_active is distinct from false loop
    begin
      perform public.refresh_platform_invoice(g.id, v_period);
    exception when others then null;
    end;
  end loop;
end $$;

-- ============================================================
-- 14) استبدال جدول المجموعة بالكامل (من مودال التحرير)
--     p_force=true يسمح بالتطبيق رغم تعارض الطلاب وفترة التهدئة
-- ============================================================
create or replace function public.replace_group_schedule(
  p_group_id uuid,
  p_new_slots jsonb,
  p_reason text default null,
  p_force boolean default false
)
returns jsonb
language plpgsql security definer
set search_path = 'public', 'pg_temp'
as $function$
declare
  v_uid uuid := auth.uid();
  v_group public.student_groups%rowtype;
  v_settings jsonb;
  v_lock_min int := 120;
  v_cooldown_h int := 72;
  v_effective timestamptz;
  v_last timestamptz;
  v_hours_left numeric;
  v_old_slots jsonb;
  v_slot jsonb;
  v_day text; v_st text; v_et text;
  v_os time; v_oe time;
  v_stud record; v_other record;
  v_total int := 0; v_conflicts int := 0;
  v_rows jsonb := '[]'::jsonb;
  v_summary text;
  v_sess record;
  v_dow int; v_target_dow int; v_target_time text; v_target_end text;
  v_new_starts timestamptz; v_new_ends timestamptz;
  v_updated int := 0;
  v_s2 record;
begin
  if v_uid is null then raise exception 'غير مصرح'; end if;
  select * into v_group from public.student_groups where id = p_group_id;
  if not found then raise exception 'المجموعة غير موجودة'; end if;
  if v_group.tutor_id <> v_uid and not public.current_user_is_admin() then
    raise exception 'المدرس المالك فقط من يغير مواعيد مجموعته';
  end if;

  -- تحقق صحة الجدول الجديد
  if jsonb_typeof(p_new_slots) <> 'array' or jsonb_array_length(p_new_slots) = 0 then
    raise exception 'الجدول الجديد فاضي — كل مجموعة لازم ميعاد واحد على الأقل';
  end if;
  for v_slot in select value from jsonb_array_elements(p_new_slots) loop
    v_day := coalesce(v_slot->>'day', v_slot->>'dayArabic');
    v_st := v_slot->>'startTime'; v_et := v_slot->>'endTime';
    if v_day is null or nullif(v_st,'')::time is null or nullif(v_et,'')::time is null or v_et::time <= v_st::time then
      raise exception 'مواعيد غير صالحة — تأكد أن كل ميعاد فيه يوم ووقت بداية ونهاية صحيحين';
    end if;
  end loop;
  -- تعارض داخلي بين مواعيد المجموعة الجديدة نفسها
  for v_s2 in
    select a.value as a, b.value as b
    from jsonb_array_elements(p_new_slots) a, jsonb_array_elements(p_new_slots) b
    where a.ord < b.ord
  loop
    if coalesce(v_s2.a->>'day','') = coalesce(v_s2.b->>'day','')
       and (v_s2.a->>'startTime')::time < (v_s2.b->>'endTime')::time
       and (v_s2.b->>'startTime')::time < (v_s2.a->>'endTime')::time then
      raise exception 'المواعيد الجديدة فيها تعارض داخلي في نفس اليوم';
    end if;
  end loop;

  select value into v_settings from public.platform_settings where key = 'smart_schedule' limit 1;
  v_lock_min := coalesce((v_settings->>'lock_minutes')::int, 120);
  v_cooldown_h := coalesce((v_settings->>'cooldown_hours')::int, 72);
  v_effective := now() + make_interval(mins => greatest(v_lock_min, 0));

  if not p_force then
    select max(created_at) into v_last from public.group_schedule_history where group_id = p_group_id;
    if v_last is not null then
      v_hours_left := v_cooldown_h - (extract(epoch from (now() - v_last)) / 3600.0);
      if v_hours_left > 0 then
        return jsonb_build_object('ok', false, 'code', 'COOLDOWN', 'hours_left', ceil(v_hours_left)::int,
          'message', 'تغيير المواعيد متاح بعد ' || ceil(v_hours_left)::int || ' ساعة (فترة تهدئة) — أو فعّل «فرض التغيير».');
      end if;
    end if;
  end if;

  v_old_slots := coalesce(v_group.schedule_slots, '[]'::jsonb);

  -- فحص تعارض الطلاب مع المواعيد الجديدة
  for v_stud in
    select ge.student_id, coalesce(nullif(ge.student_name, ''), p.full_name, 'طالب') as student_name
    from public.group_enrollments ge
    left join public.profiles p on p.id = ge.student_id
    where ge.group_id = p_group_id and ge.status = 'active' and ge.student_id is not null
  loop
    v_total := v_total + 1;
    begin
      for v_other in
        select g.name as gname, el.value as slot
        from public.group_enrollments ge2
        join public.student_groups g on g.id = ge2.group_id and coalesce(g.is_active, true)
        cross join lateral jsonb_array_elements(
          case when jsonb_array_length(coalesce(ge2.custom_schedule_slots, '[]'::jsonb)) > 0
               then ge2.custom_schedule_slots
               else coalesce(g.schedule_slots, '[]'::jsonb) end
        ) el
        where ge2.student_id = v_stud.student_id and ge2.status = 'active'
          and ge2.group_id <> p_group_id and ge2.attendance_mode = 'fixed'
      loop
        for v_slot in select value from jsonb_array_elements(p_new_slots) loop
          if coalesce(v_slot->>'day','') = coalesce(v_other.slot->>'day', v_other.slot->>'dayArabic','')
             and (v_slot->>'startTime')::time < nullif(v_other.slot->>'endTime','')::time
             and nullif(v_other.slot->>'startTime','')::time < (v_slot->>'endTime')::time then
            v_conflicts := v_conflicts + 1;
            v_rows := v_rows || jsonb_build_object(
              'student_id', v_stud.student_id, 'student_name', v_stud.student_name,
              'with_group', v_other.gname,
              'with_day', coalesce(v_other.slot->>'dayArabic', v_other.slot->>'day'));
            exit;
          end if;
        end loop;
      end loop;
    exception when others then null;
    end;
  end loop;

  -- إلغاء التكرار: طالب واحد يُحتسب مرة واحدة فقط
  select count(*) into v_conflicts from (
    select distinct student_id from jsonb_to_recordset(v_rows) as x(student_id uuid)
  ) t;

  if not p_force and v_total > 0 and v_conflicts > (v_total - v_conflicts) then
    return jsonb_build_object('ok', false, 'code', 'MAJORITY_CONFLICT',
      'total', v_total, 'conflict_count', v_conflicts, 'free_count', v_total - v_conflicts,
      'conflicts', v_rows,
      'message', 'الأغلبية (' || v_conflicts || ' من ' || v_total || ') عندهم دروس تتعارض مع الجدول الجديد — فعّل «فرض التغيير» لو متأكد.');
  end if;

  v_summary := public._schedule_summary(p_new_slots);

  update public.student_groups
    set schedule_slots = p_new_slots,
        schedule = v_summary,
        updated_at = now()
  where id = p_group_id;

  -- إعادة جدولة الحصص القادمة على الجدول الجديد
  for v_sess in
    select * from public.lesson_sessions
    where group_id = p_group_id and status = 'scheduled' and starts_at >= v_effective
    order by starts_at
  loop
    v_dow := extract(isodow from v_sess.starts_at)::int;
    select min((s->>'startTime')), min((s->>'endTime'))
      into v_target_time, v_target_end
    from jsonb_array_elements(p_new_slots) s
    where public._day_dow(s->>'day') = v_dow;

    if v_target_time is null then
      -- اليوم لم يعد في الجدول → أول ميعاد متاح بعده
      select s->>'day', s->>'startTime', s->>'endTime'
        into v_day, v_target_time, v_target_end
      from jsonb_array_elements(p_new_slots) s
      order by public._day_dow(s->>'day') limit 1;
      v_target_dow := public._day_dow(v_day);
      v_new_starts := ((v_sess.session_date + (v_target_dow - v_dow))::text || ' ' || v_target_time)::timestamp at time zone 'Africa/Cairo';
      while v_new_starts < v_effective loop
        v_new_starts := v_new_starts + interval '7 days';
      end loop;
    else
      v_new_starts := (v_sess.session_date::text || ' ' || v_target_time)::timestamp at time zone 'Africa/Cairo';
      while v_new_starts < v_effective loop
        v_new_starts := v_new_starts + interval '7 days';
      end loop;
    end if;
    v_new_ends := ((v_new_starts at time zone 'Africa/Cairo')::date::text || ' ' || v_target_end)::timestamp at time zone 'Africa/Cairo';
    if v_new_ends <= v_new_starts then v_new_ends := v_new_ends + interval '1 day'; end if;

    delete from public.calendar_events
      where event_type = 'lesson' and starts_at = v_sess.starts_at
        and user_id in (select student_id from public.group_enrollments where group_id = p_group_id and status = 'active');
    update public.lesson_sessions
      set session_date = (v_new_starts at time zone 'Africa/Cairo')::date,
          starts_at = v_new_starts, ends_at = v_new_ends, updated_at = now()
      where id = v_sess.id;
    insert into public.calendar_events(user_id, title, event_type, starts_at, ends_at, link)
    select student_id, v_sess.title, 'lesson', v_new_starts, v_new_ends, '/student/calendar'
    from public.group_enrollments where group_id = p_group_id and status = 'active';
    v_updated := v_updated + 1;
  end loop;

  insert into public.group_schedule_history(
    group_id, proposal_id, old_slots, new_slots, old_schedule, new_schedule, reason,
    applied_by, effective_from, sessions_updated)
  values (
    p_group_id, null, v_old_slots, p_new_slots, public._schedule_summary(v_old_slots), v_summary,
    coalesce(p_reason, case when p_force then 'استبدال كامل للجدول بفرض من المدرس' else 'استبدال كامل للجدول من مودال التحرير' end),
    v_uid, v_effective, v_updated);

  for v_stud in select student_id from public.group_enrollments where group_id = p_group_id and status = 'active' loop
    insert into public.notifications(user_id, title, message, type, link)
    values (v_stud.student_id, 'تحديث مواعيد المجموعة',
      'تم تحديث مواعيد مجموعة «' || v_group.name || '» إلى: ' || v_summary
      || ' — يبدأ التطبيق من الحصة القادمة.', 'schedule', '/student/dashboard');
  end loop;

  return jsonb_build_object('ok', true, 'applied', true, 'forced', p_force,
    'sessions_updated', v_updated, 'effective_from', v_effective, 'new_schedule', v_summary,
    'total', v_total, 'conflict_count', v_conflicts, 'free_count', v_total - v_conflicts,
    'conflicts', v_rows);
end $function$;
