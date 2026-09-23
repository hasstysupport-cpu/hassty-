-- ============================================================================
-- Hassty — Email webhook triggers for teacher verification (2026-09-23)
-- يرسل بريدًا تلقائيًا عبر endpoint المؤكد على Vercel:
--   INSERT في teacher_verification_requests → تنبيه بريد الإدارة
--   UPDATE status → approved/rejected → بريد النتيجة للمدرس
-- يتطلب pg_net (异步 HTTP من قاعدة البيانات).
-- ============================================================================

create extension if not exists pg_net;

create or replace function public.notify_verification_email_webhook()
returns trigger
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'net'
as $function$
declare
  v_url text := 'https://hassty.site/api/emails/verification-webhook';
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
      'event', 'new_request',
      'teacherEmail', coalesce(v_teacher_email, ''),
      'teacherName', coalesce(new.teacher_name, ''),
      'subject', coalesce(new.subject, ''),
      'governorate', coalesce(new.governorate, ''),
      'phone', coalesce(new.phone, '')
    );
    perform net.http_post(v_url, v_payload::text, 8000, v_headers);
    return new;
  end if;

  -- UPDATE: عند تغيّر الحالة إلى قرار نهائي → بريد النتيجة للمدرس
  if tg_op = 'UPDATE'
     and new.status is distinct from old.status
     and new.status in ('approved', 'rejected') then
    select p.email into v_teacher_email from public.profiles p where p.id = new.teacher_id;
    v_payload := jsonb_build_object(
      'event', new.status,
      'teacherEmail', coalesce(v_teacher_email, ''),
      'teacherName', coalesce(new.teacher_name, ''),
      'reason', coalesce(new.rejection_reason, '')
    );
    perform net.http_post(v_url, v_payload::text, 8000, v_headers);
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_verification_email_webhook on public.teacher_verification_requests;
create trigger trg_verification_email_webhook
after insert or update of status on public.teacher_verification_requests
for each row execute function public.notify_verification_email_webhook();
