-- ============================================================
-- Hassty — إضافة أدمن حقيقية 100% (القايمة الديناميكية مصدر الحقيقة الوحيد)
-- التاريخ: 2026-09-23
-- ------------------------------------------------------------
-- المشكلة: 3 دوال إدارية كانت تفحص قايمة أدمن مكتوبة يدويًا
--   ('hasstysupport@gmail.com','admin@hassty.com') — الثاني وهمي غير موجود،
--   وأي أدمن جديد يُضاف من صفحة "أمان الوصول" كان يُرفض من هذه الدوال.
--
-- الحل:
--   1) دالة hassty_is_admin() — فحص ديناميكي كامل:
--        أ) دور البروفايل (role='admin') — كل أدمن مُضاف من اللوحة يُرقّى تلقائيًا
--        ب) البريد ضمن القايمة البيضاء الديناميكية (metadata.admin_emails
--           لبروفايل المالك الرسمي) — نفس مصدر الحقيقة المستخدم في السيرفر
--      لا يوجد أي إيميل ثابت سوى مرساة بريد المالك الرسمي.
--   2) إعادة كتابة الدوال الثلاثة لن تستخدم hassty_is_admin()
--      بنفس التواقيع بالظبط (بدون تغيير أي واجهة استدعاء).
--   3) ترقية بروفايل المالك الرسمي إلى admin + تهيئة القايمة الديناميكية.
-- المبرمج: محمود على محمود مدكور — جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
-- الموقع ملك Mahmoudmadkour وجميع الأملاك له فقط.
-- ============================================================

-- ---------- 1) الدالة المساعدة الديناميكية ----------
create or replace function public.hassty_is_admin()
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_email text;
  v_role  text;
  v_list  jsonb;
begin
  v_email := lower(coalesce(nullif(auth.jwt() ->> 'email', ''), ''));
  if v_email = '' then
    return false;
  end if;

  -- أ) دور البروفايل نفسه admin؟ (الترقية تتم تلقائيًا عند إضافة الإيميل من اللوحة)
  select p.role into v_role
    from public.profiles p
    where p.id = auth.uid()
       or lower(p.email) = v_email
    limit 1;
  if v_role = 'admin' then
    return true;
  end if;

  -- ب) ضمن القايمة البيضاء الديناميكية؟ (محفوظة في metadata بروفايل المالك الرسمي)
  select p.metadata -> 'admin_emails' into v_list
    from public.profiles p
    where lower(p.email) = 'hasstysupport@gmail.com'  -- مرساة بريد المالك الرسمي فقط
    limit 1;
  if v_list is not null and v_list ? v_email then
    return true;
  end if;

  return false;
end;
$$;

-- ---------- 2) إعادة كتابة الدوال الثلاثة (تواقيع مطابقة تمامًا) ----------
-- (DROP أولًا لأن الدوال الأصلية فيها parameter defaults لا يمكن إزالتها بـ CREATE OR REPLACE)

drop function if exists public.admin_approve_teacher_verification(uuid,uuid,text,text,text,text,text,text,text);

-- 2-أ) اعتماد توثيق مدرس (العملية الأهم في لوحة الأدمن)
create or replace function public.admin_approve_teacher_verification(
  p_request_id uuid,
  p_teacher_id uuid,
  p_admin_email text,
  p_name text,
  p_phone text,
  p_governorate text,
  p_city text,
  p_grade text,
  p_subject text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tutor_id uuid;
begin
  if not public.hassty_is_admin() then raise exception 'Unauthorized admin'; end if;

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
$$;

drop function if exists public.admin_update_account_badge(uuid,text);

-- 2-ب) تحديث شارة أي حساب
create function public.admin_update_account_badge(
  target_user_id uuid,
  new_badge text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.hassty_is_admin() then raise exception 'admin access required'; end if;
  if new_badge not in ('none','verified','suspicious','fraudulent') then
    raise exception 'invalid badge';
  end if;
  update public.profiles set badge = new_badge, updated_at = now() where id = target_user_id;
  if not found then raise exception 'profile not found'; end if;
  if exists(select 1 from public.tutor_profiles where user_id=target_user_id) then
    update public.tutor_profiles
      set is_verified=(new_badge='verified'),
          verification_status=case when new_badge='verified' then 'approved' when new_badge='fraudulent' then 'rejected' else 'pending' end,
          updated_at=now()
    where user_id=target_user_id;
  end if;
end;
$$;

drop function if exists public.admin_update_teacher_badge(uuid,text);

-- 2-ج) تحديث شارة مدرس
create function public.admin_update_teacher_badge(
  p_teacher_id uuid,
  p_badge text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.hassty_is_admin() then raise exception 'admin access required'; end if;
  if p_badge not in ('none','verified','trusted','fraudulent') then
    raise exception 'invalid badge';
  end if;

  update public.profiles
     set badge = p_badge,
         updated_at = now()
   where id = p_teacher_id;

  update public.tutor_profiles
     set is_verified = (p_badge = 'verified'),
         verification_status = case when p_badge = 'verified' then 'approved' when p_badge = 'fraudulent' then 'rejected' else 'pending' end,
         updated_at = now()
   where user_id = p_teacher_id;
end;
$$;

-- ---------- 3) المالك أدمن حقيقي + تهيئة القايمة الديناميكية ----------
update public.profiles
set role = 'admin',
    metadata = coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object('admin_emails', jsonb_build_array('hasstysupport@gmail.com')),
    updated_at = clock_timestamp()
where lower(email) = 'hasstysupport@gmail.com';

-- ---------- تحقق نهائي ----------
select p.proname, p.prosecdef as security_definer
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('hassty_is_admin','admin_approve_teacher_verification','admin_update_account_badge','admin_update_teacher_badge');

select email, role, metadata->'admin_emails' as admin_emails
from public.profiles
where lower(email) = 'hasstysupport@gmail.com';
