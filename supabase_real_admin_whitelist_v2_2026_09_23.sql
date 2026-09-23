-- ============================================================
-- Hassty — البوابة المركزية للأدمن تصبح ديناميكية 100% (v2)
-- التاريخ: 2026-09-23
-- ------------------------------------------------------------
-- المشكلة الجذرية: private.is_admin() — بوابة الأدمن المستخدمة في
--   أكتر من 105 سياسات RLS و6 دوال — كانت تفحص قايمة مكتوبة يدويًا
--   ('hasstysupport@gmail.com','admin@hassty.com') — الثاني وهمي،
--   وأي أدمن جديد من صفحة "أمان الوصول" كان يُرفض من كل الصلاحيات دي.
--
-- الحل:
--   1) hassty_is_admin() (ديناميكية):
--        أ) جلسة مميزة (postgres) = سياق خادم موثوق
--        ب) دور البروفايل role='admin' — الترقية تتم تلقائيًا من اللوحة
--        ج) البريد ضمن القايمة البيضاء الديناميكية (metadata.admin_emails
--           لبروفايل المالك الرسمي) — نفس مصدر الحقيقة في السيرفر
--   2) private.is_admin() → تستدعي hassty_is_admin() + فحص app_metadata
--      — بلا أي إيميل مكتوب يدويًا (شُيل الوهمي admin@hassty.com نهائيًا)
--   3) ترقية المالك الرسمي إلى admin حقيقي + تهيئة القايمة.
-- المبرمج: محمود على محمود مدكور — جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
-- الموقع ملك Mahmoudmadkour وجميع الأملاك له فقط.
-- ============================================================

-- ---------- 1) الدالة الديناميكية v2 (مع حراسة جلسة الخادم) ----------
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
  -- أ) جلسة خادم مميزة (Management API / psql) — سياق موثوق بصلاحيات خادم أصلًا
  if session_user in ('postgres', 'supabase_admin') then
    return true;
  end if;

  v_email := lower(coalesce(nullif(auth.jwt() ->> 'email', ''), ''));
  if v_email = '' then
    return false;
  end if;

  -- ب) دور البروفايل نفسه admin؟ (كل أدمن مُضاف من اللوحة بيرقى تلقائيًا)
  select p.role into v_role
    from public.profiles p
    where p.id = auth.uid()
       or lower(p.email) = v_email
    limit 1;
  if v_role = 'admin' then
    return true;
  end if;

  -- ج) ضمن القايمة البيضاء الديناميكية؟ (metadata.admin_emails لبروفايل المالك)
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

-- ---------- 2) البوابة المركزية تصبح ديناميكية ----------
create or replace function private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = private, public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or public.hassty_is_admin(),
    false
  );
$$;

-- ---------- 3) المالك أدمن حقيقي (التريجر الحامي الآن يسمح — البوابة ديناميكية) ----------
update public.profiles
set role = 'admin',
    metadata = coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object('admin_emails', jsonb_build_array('hasstysupport@gmail.com')),
    updated_at = clock_timestamp()
where lower(email) = 'hasstysupport@gmail.com';

-- ---------- تحقق نهائي ----------
select email, role, metadata->'admin_emails' as admin_emails
from public.profiles
where lower(email) = 'hasstysupport@gmail.com';

select p.proname, p.prosecdef as security_definer
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public','private')
  and p.proname in ('hassty_is_admin','is_admin');
