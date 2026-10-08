-- ============================================================
-- Hassty — Migration 2026-10-08
-- المراحل الدراسية للمعلم (ابتدائي / إعدادي / ثانوي) عند التسجيل
-- ============================================================

-- 1) عمود المراحل على ملف المعلم (متعدد القيم)
alter table public.tutor_profiles
  add column if not exists stages text[] not null default '{}';

-- 2) فهارس للبحث/الفلترة بالمرحلة (اختياري لكن مفيد لاكتشاف المدرسين)
create index if not exists idx_tutor_profiles_stages on public.tutor_profiles using gin (stages);

-- 3) العمود قابل للقراءة عبر سياسات tutor_profiles الحالية (لا يوجد RLS صارم عليه
--    لكن الأمان يبقى كما هو: القيم نصية من قائمة مغلقة يتحقق منها الـ API)

-- 4) تعليق توثيقي
comment on column public.tutor_profiles.stages is 'المراحل الدراسية التي يدرّسها المعلم: ابتدائي / إعدادي / ثانوي (قيم من قائمة مغلقة)';

-- إعادة جدولة القيم التراثية استدلاليًا: أي معلم قديم له grades مسجلة نستنتج منها مراحله
-- (تعمل مرة واحدة فقط عندما يكون العمود جديدًا فارغًا لكل الصفوف)
update public.tutor_profiles
  set stages = array_remove(array[
    case when grades::text ilike '%ابتدائي%' then 'ابتدائي' end,
    case when grades::text ilike '%إعدادي%' or grades::text ilike '%الإعدادي%' then 'إعدادي' end,
    case when grades::text ilike '%ثانوي%' or grades::text ilike '%الثانوي%' then 'ثانوي' end
  ], null)
  where stages = '{}' and array_length(grades, 1) > 0;
