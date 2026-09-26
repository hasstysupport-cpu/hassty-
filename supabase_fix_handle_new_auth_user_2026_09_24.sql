-- ============================================================
-- Hassty — إصلاح دالة تهيئة الحسابات الجديدة | Fix handle_new_auth_user
-- تاريخ التطبيق: 2026-09-24
-- ------------------------------------------------------------
-- المشكلة: التعريف الحالي يحتوي تعبيرًا تالفًا (arrayd->>'subject')
-- يسبب خطأ وقت التشغيل لأي مستخدم role=teacher، والـ exception
-- handler يرجع كل الإدراج للوراء صامتًا → auth user بلا بروفايل
-- ولا tutor_profile — حلقة الربط المكسورة بين الأجزاء.
-- الإصلاح: تعبير المصفوفة الصحيح ARRAY[...] مع بقاء الدوال الأخرى كما هي.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_catalog'
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
      case when nullif(md->>'subject','') is null then '{}'::text[] else ARRAY[md->>'subject'] end,
      case when nullif(md->>'grade','') is null then '{}'::text[] else ARRAY[md->>'grade'] end,
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
