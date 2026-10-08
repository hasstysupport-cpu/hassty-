-- ============================================================
-- Hassty — Migration 2026-10-08 (3)
-- دمج عمود المراحل (stages) في مسارات كتابة tutor_profiles
-- ============================================================
-- السبب: تريجر prevent_unverified_teacher_insert يحوّل INSERT المتعارض إلى
-- UPDATE يدوي بدمج الحقول — وكانت قائمته قبل هذا التحديث لا تشمل stages،
-- فكانت مراحل المعلم تضيع عند التفعيل رغم إرسالها من الـ API.

create or replace function public.prevent_unverified_teacher_insert()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  profile_role text;
  existing_id uuid;
begin
  select role into profile_role from public.profiles where id = new.user_id;

  -- tutor_profiles belongs only to teacher accounts.
  if coalesce(profile_role, '') <> 'teacher' then
    return null;
  end if;

  -- If an extension row already exists, make an INSERT idempotent instead of
  -- throwing tutor_profiles_user_id_key and merge the editable fields.
  select id into existing_id
  from public.tutor_profiles
  where user_id = new.user_id
  limit 1;

  if existing_id is not null then
    update public.tutor_profiles
    set title = coalesce(new.title, title),
        bio = coalesce(new.bio, bio),
        subjects = coalesce(new.subjects, subjects),
        grades = coalesce(new.grades, grades),
        stages = coalesce(new.stages, stages),
        experience_years = coalesce(new.experience_years, experience_years),
        governorate = coalesce(new.governorate, governorate),
        city = coalesce(new.city, city),
        center_names = coalesce(new.center_names, center_names),
        price_per_month = coalesce(new.price_per_month, price_per_month),
        price_per_session = coalesce(new.price_per_session, price_per_session),
        headline = coalesce(new.headline, headline),
        experience_years_text = coalesce(new.experience_years_text, experience_years_text),
        metadata = coalesce(new.metadata, metadata),
        is_verified = coalesce(new.is_verified, is_verified),
        verification_status = coalesce(new.verification_status, verification_status),
        updated_at = now()
    where id = existing_id;
    return null;
  end if;

  -- Never allow client code to grant verification during creation.
  if coalesce(new.is_verified,false) = true then
    new.is_verified := false;
    if new.verification_status is null or new.verification_status <> 'approved' then
      new.verification_status := 'pending';
    end if;
  end if;

  return new;
end;
$function$;

-- 2) تريجر إنشاء الحساب: يحفظ مراحل المعلم من user_metadata.stages منذ اللحظة الأولى
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'auth', 'pg_catalog'
as $function$
declare
  md jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested_role text := lower(trim(coalesce(md->>'role', 'student')));
  safe_role text := case when requested_role in ('student','parent','teacher','assistant') then requested_role else 'student' end;
  v_stages text[];
begin
  -- المراحل: من user_metadata.stages (مصفوفة نصية صريحة) فقط
  if jsonb_typeof(md->'stages') = 'array' then
    select array_agg(x) into v_stages from jsonb_array_elements_text(md->'stages') as x;
  end if;
  v_stages := coalesce(v_stages, '{}'::text[]);

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
    insert into public.tutor_profiles(user_id,title,headline,bio,subjects,grades,stages,experience_years,governorate,city,price_per_session,is_verified,verification_status)
    values(new.id,'معلم '||coalesce(nullif(md->>'subject',''),'المادة'),'معلم '||coalesce(nullif(md->>'subject',''),'المادة'), '',
      case when nullif(md->>'subject','') is null then '{}'::text[] else ARRAY[md->>'subject'] end,
      case when nullif(md->>'grade','') is null then '{}'::text[] else ARRAY[md->>'grade'] end,
      v_stages,
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
