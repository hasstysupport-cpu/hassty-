-- ============================================================================
-- Hassty — Teacher Verification Flow Completion (2026-09-23)
-- ============================================================================
-- المشكلة المؤكدة بالبيانات الحية:
--   جدول teacher_verification_requests فاضي (0 صف) بينما يوجد 6 مدرسين
--   → طابور التوثيق في لوحة الأدمن كان فاضيًا دائمًا، ولا يصل أي طلب.
--   التسجيل يضبط الحالة "pending" لكن لا شيء ينشئ صف الطلب الذي يراه الأدمن.
--
-- الإصلاح:
--   1) Trigger تلقائي: عند إنشاء tutor_profiles غير موثق (كل مسارات التسجيل)
--      يُنشأ طلب توثيق pending + إشعار للمدرس باستلام طلبه.
--   2) Backfill: كل مدرس موجود حاليًا يحصل على طلب pending جديد
--      (ت trg_sync_teacher_verification_state يعيد ضبط حالته لـ"انتظار"
--       تلقائيًا في tutor_profiles وprofiles — بما فيها المعتمدين سابقًا
--       بطلب من الإدارة: أي حساب موجود يُعاد لقائمة الانتظار).
--   3) ملاحظة: public_verified_teachers الحي مفحوص — يعرض الموثقين فقط
--      (is_verified=true AND verification_status='approved') ولا يحتاج تغييرًا.
-- ============================================================================

-- (1) إنشاء طلب التوثيق تلقائيًا عند تسجيل مدرس جديد
create or replace function public.handle_unverified_tutor_created()
returns trigger
language plpgsql
security definer
set search_path = 'pg_catalog', 'public'
as $function$
declare
  v_pending int;
begin
  -- صفوف موثقة مسبقًا (أدوات الأدمن) لا تحتاج طلبًا
  if coalesce(new.is_verified, false) = true then
    return new;
  end if;

  -- لا تكرر الطلب إن كان هناك طلب انتظار قائم
  select count(*) into v_pending
    from public.teacher_verification_requests
    where teacher_id = new.user_id and status = 'pending';
  if v_pending > 0 then
    return new;
  end if;

  insert into public.teacher_verification_requests
    (teacher_id, teacher_name, phone, subject, stage, governorate, area, experience_years, status)
  select
    new.user_id,
    coalesce(nullif(trim(p.full_name), ''), 'مدرس جديد'),
    coalesce(p.phone, ''),
    coalesce(array_to_string(new.subjects, '،'), coalesce(p.metadata->>'subject', ''), ''),
    coalesce(p.grade, ''),
    coalesce(p.governorate, ''),
    coalesce(p.city, ''),
    coalesce(new.experience_years::text, ''),
    'pending'
  from public.profiles p
  where p.id = new.user_id;

  perform public.create_notification(
    new.user_id,
    'تم استلام طلب توثيق حسابك',
    'طلب توثيق حسابك كمدرس قيد المراجعة من إدارة منصة حِصّتي، وسيتم إشعارك بالنتيجة بعد المراجعة.',
    'verification',
    '/teacher/dashboard',
    null
  );

  return new;
end;
$function$;

drop trigger if exists trg_unverified_tutor_verification on public.tutor_profiles;
create trigger trg_unverified_tutor_verification
after insert on public.tutor_profiles
for each row execute function public.handle_unverified_tutor_created();

-- (2) إعادة كل الحسابات الموجودة لقائمة الانتظار:
--     إنشاء طلب pending لكل مدرس لا يملك طلب انتظار حاليًا
--     (trg_sync_teacher_verification_state يقوم بباقي المزامنة تلقائيًا:
--      tutor_profiles → pending، profiles.metadata → pending، badge → none)
insert into public.teacher_verification_requests
  (teacher_id, teacher_name, phone, subject, stage, governorate, area, experience_years, status)
select
  p.id,
  coalesce(nullif(trim(p.full_name), ''), 'مدرس جديد'),
  coalesce(p.phone, ''),
  coalesce(array_to_string(tp.subjects, '،'), coalesce(p.metadata->>'subject', ''), ''),
  coalesce(p.grade, ''),
  coalesce(p.governorate, ''),
  coalesce(p.city, ''),
  coalesce(tp.experience_years::text, ''),
  'pending'
from public.profiles p
left join public.tutor_profiles tp on tp.user_id = p.id
where p.role = 'teacher'
  and not exists (
    select 1 from public.teacher_verification_requests v
    where v.teacher_id = p.id and v.status = 'pending'
  );
