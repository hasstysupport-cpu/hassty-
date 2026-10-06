-- ============================================================
-- Hassty — تدوير السر الداخلي + نقله لجدول مقفول | Secret Rotation 2026-10-06
-- ------------------------------------------------------------
-- المشكلة: السر القديم (x-whatsapp-internal-secret) كان مكتوبًا hardcoded
-- في ملفي migration بالمستودع (والمستودع عام) وفي جسم دالة
-- notify_verification_email_webhook داخل قاعدة الإنتاج.
--
-- الإصلاح:
--   1) جدول platform_internal_secrets — RLS مفعّل بدون أي policies
--      (رفض تام للـ anon/authenticated) + REVOKE صريح.
--      يقرأه فقط postgres/service_role (ودوال SECURITY DEFINER).
--   2) السر الجديد يُخزن في الجدول (تم توليده تشفيريًا — 256-bit).
--   3) إعادة كتابة الدالة لتقرأ السر من الجدول — لا أسرار في الكود بعد اليوم.
--      فشل الجلب → تخطٍّ آمن مع تحذير (لا يكسر معاملة قاعدة البيانات).
--
-- Idempotent: آمن للتطبيق المتكرر.
-- ============================================================

-- 1) جدول الأسرار الداخلية (مقفول بالكامل عن العالم الخارجي)
create table if not exists public.platform_internal_secrets (
  key        text primary key,
  value      text not null,
  note       text,
  updated_at timestamptz not null default now()
);

alter table public.platform_internal_secrets enable row level security;

-- لا سياسات على الإطلاق ⇒ anon/authenticated مرفوضان حتى مع RLS
revoke all on table public.platform_internal_secrets from anon, authenticated;
grant select on table public.platform_internal_secrets to postgres, service_role;

-- 2) السر الجديد (upsert — يسمح بتدويره لاحقًا من نفس الجملة)
insert into public.platform_internal_secrets (key, value, note)
values (
  'whatsapp_internal_secret',
  'E9jcM_FzlSv5yWy726V28SZvk_TMvyWldQKFpgbTrDQ',
  'Header x-whatsapp-internal-secret — يحمي نداءات net.http_post من DB إلى /api/admin/ops (دوّر بتاريخ 2026-10-06)'
)
on conflict (key) do update
  set value = excluded.value, updated_at = now();

-- 3) إعادة كتابة الدالة: السر يُقرأ من الجدول وقت التنفيذ
create or replace function public.notify_verification_email_webhook()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'net'
as $function$
declare
  v_url     text := 'https://hassty.site/api/admin/ops';
  v_secret  text;
  v_headers jsonb;
  v_teacher_email text;
  v_payload jsonb;
begin
  -- 🔒 السر من الجدول المقفول فقط
  select value into v_secret
    from public.platform_internal_secrets
   where key = 'whatsapp_internal_secret';

  if v_secret is null then
    raise warning 'HASSTY: platform_internal_secrets missing key whatsapp_internal_secret — skipping webhook';
    return new;
  end if;

  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-whatsapp-internal-secret', v_secret
  );

  if tg_op = 'INSERT' then
    -- طلب جديد → تنبيه بريد الإدارة
    select p.email into v_teacher_email from public.profiles p where p.id = new.teacher_id;
    v_payload := jsonb_build_object(
      'action', 'verification_email',
      'event', 'new_request',
      'teacherEmail', coalesce(v_teacher_email, ''),
      'teacherName', coalesce(new.teacher_name, ''),
      'subject', coalesce(new.subject, ''),
      'governorate', coalesce(new.governorate, ''),
      'phone', coalesce(new.phone, '')
    );
    begin
      perform net.http_post(v_url, v_payload, '{}'::jsonb, v_headers, 8000);
    exception when others then
      raise warning 'HASSTY verification email webhook (insert) failed: %', sqlerrm;
    end;
    return new;
  end if;

  -- UPDATE: عند تغيّر الحالة إلى قرار نهائي → بريد النتيجة للمدرس
  if tg_op = 'UPDATE'
     and new.status is distinct from old.status
     and new.status in ('approved', 'rejected') then
    select p.email into v_teacher_email from public.profiles p where p.id = new.teacher_id;
    v_payload := jsonb_build_object(
      'action', 'verification_email',
      'event', new.status,
      'teacherEmail', coalesce(v_teacher_email, ''),
      'teacherName', coalesce(new.teacher_name, ''),
      'reason', coalesce(new.rejection_reason, '')
    );
    begin
      perform net.http_post(v_url, v_payload, '{}'::jsonb, v_headers, 8000);
    exception when others then
      raise warning 'HASSTY verification email webhook (update) failed: %', sqlerrm;
    end;
  end if;

  return new;
end;
$function$;

-- 4) التحقق: لا أثر للسر القديم في أي دالة بعد الآن
-- (يُتحقق يدويًا بعد التطبيق بـ:
--  select proname from pg_proc where prosrc like '%<السر القديم>%')
