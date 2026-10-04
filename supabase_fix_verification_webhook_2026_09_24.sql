-- ============================================================
-- Hassty — إصلاح تريجر بريد التوثيق | Fix notify_verification_email_webhook
-- تاريخ التطبيق: 2026-09-24
-- ------------------------------------------------------------
-- المشكلة: الاستدعاء net.http_post(url, text, int, jsonb) لا يطابق
-- توقيع pg_net المركب على المشروع (url, jsonb, params, headers, timeout)
-- → الخطأ 42883 يصعد عبر سلسلة التريجرات ويرجّع كل معاملة إنشاء
--   طلب التوثيق (وبروفايل المدرس الجديد) للوراء صامتًا.
-- الإصلاح:
--   1) استدعاء بالتوقيع الصحيح: net.http_post(url, body jsonb, params, headers, timeout)
--   2) عزل نداء الإيميل داخل exception handler خاص — فشل الإيميل
--      لا يكسر أبدًا عملية قاعدة البيانات الأساسية (الترابط يبقى سليمًا).
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_verification_email_webhook()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'net'
AS $function$
declare
  v_url text := 'https://hassty.site/api/admin/ops';
  v_secret text := 'k7hd6oMmdzKFNGoq48SNZ2iFwwTAmd0i';
  v_headers jsonb := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-whatsapp-internal-secret', 'k7hd6oMmdzKFNGoq48SNZ2iFwwTAmd0i'
  );
  v_teacher_email text;
  v_payload jsonb;
begin
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
