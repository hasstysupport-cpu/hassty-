-- HASSTY: prevent duplicate/orphan tutor_profiles during account editing
-- Applied to Supabase project mxryrgoxofsvjsvpxzew on 2026-08-29.

create or replace function public.prevent_unverified_teacher_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  profile_role text;
  existing_id uuid;
begin
  select role into profile_role from public.profiles where id = new.user_id;

  if coalesce(profile_role, '') <> 'teacher' then
    return null;
  end if;

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

  if coalesce(new.is_verified,false) = true then
    new.is_verified := false;
    if new.verification_status is null or new.verification_status <> 'approved' then
      new.verification_status := 'pending';
    end if;
  end if;

  return new;
end;
$function$;

delete from public.tutor_profiles t
using public.profiles p
where p.id = t.user_id
  and p.role <> 'teacher';
