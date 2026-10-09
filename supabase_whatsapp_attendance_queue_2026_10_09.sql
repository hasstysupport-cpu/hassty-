-- Durable per-teacher WhatsApp attendance queue for Hassty.
-- Attendance remains committed in attendance_records; outbound WhatsApp is independent.

CREATE TABLE IF NOT EXISTS public.parent_whatsapp_sender_state (
  schedule_key text PRIMARY KEY,
  next_send_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parent_whatsapp_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key text NOT NULL UNIQUE,
  attendance_id uuid REFERENCES public.attendance_records(id) ON DELETE SET NULL,
  teacher_id uuid,
  group_id uuid,
  session_id uuid,
  student_id uuid,
  parent_phone text NOT NULL,
  parent_user_id uuid,
  schedule_key text NOT NULL,
  interval_seconds integer NOT NULL DEFAULT 45 CHECK (interval_seconds >= 45),
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 10),
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.parent_whatsapp_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_whatsapp_sender_state ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.parent_whatsapp_queue FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.parent_whatsapp_sender_state FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.parent_whatsapp_queue TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.parent_whatsapp_sender_state TO service_role;

CREATE INDEX IF NOT EXISTS idx_parent_whatsapp_queue_due
  ON public.parent_whatsapp_queue (scheduled_at, next_attempt_at, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_parent_whatsapp_queue_schedule
  ON public.parent_whatsapp_queue (schedule_key, scheduled_at DESC)
  WHERE status IN ('pending', 'sending');

CREATE INDEX IF NOT EXISTS idx_parent_whatsapp_queue_stale_claim
  ON public.parent_whatsapp_queue (claimed_at)
  WHERE status = 'sending';

CREATE OR REPLACE FUNCTION public.claim_parent_whatsapp_job()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_job public.parent_whatsapp_queue%rowtype;
  v_now timestamptz := clock_timestamp();
BEGIN
  -- Recover work abandoned by a worker restart. Retry delay is persisted in the DB.
  UPDATE public.parent_whatsapp_queue
     SET status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
         next_attempt_at = CASE
           WHEN attempts >= max_attempts THEN next_attempt_at
           ELSE v_now + interval '2 minutes'
         END,
         claimed_at = NULL,
         last_error = COALESCE(last_error, 'Worker stopped while this notification was being processed.'),
         updated_at = v_now
   WHERE status = 'sending'
     AND claimed_at IS NOT NULL
     AND claimed_at < v_now - interval '3 minutes';

  -- Queue rows create their sender-state row inside the attendance transaction.
  -- Lock both the job and sender state so simultaneous workers cannot send twice
  -- from the same teacher number during its reserved interval.
  SELECT q.*
    INTO v_job
    FROM public.parent_whatsapp_queue q
    JOIN public.parent_whatsapp_sender_state s ON s.schedule_key = q.schedule_key
   WHERE q.status = 'pending'
     AND q.scheduled_at <= v_now
     AND q.next_attempt_at <= v_now
     AND s.next_send_at <= v_now
   ORDER BY q.scheduled_at ASC, q.created_at ASC
   LIMIT 1
   FOR UPDATE OF q, s SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.parent_whatsapp_queue
     SET status = 'sending',
         attempts = attempts + 1,
         claimed_at = v_now,
         updated_at = v_now
   WHERE id = v_job.id
   RETURNING * INTO v_job;

  UPDATE public.parent_whatsapp_sender_state
     SET next_send_at = v_now + make_interval(secs => v_job.interval_seconds),
         updated_at = v_now
   WHERE schedule_key = v_job.schedule_key;

  RETURN jsonb_build_object(
    'id', v_job.id,
    'payload', v_job.payload,
    'attempts', v_job.attempts,
    'maxAttempts', v_job.max_attempts
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_parent_whatsapp_job(
  p_job_id uuid,
  p_success boolean,
  p_error text DEFAULT NULL,
  p_provider_message_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_job public.parent_whatsapp_queue%rowtype;
  v_now timestamptz := clock_timestamp();
BEGIN
  SELECT * INTO v_job
    FROM public.parent_whatsapp_queue
   WHERE id = p_job_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'WhatsApp queue job not found';
  END IF;

  IF v_job.status <> 'sending' THEN
    RETURN jsonb_build_object('status', v_job.status, 'attempts', v_job.attempts);
  END IF;

  IF p_success IS TRUE THEN
    UPDATE public.parent_whatsapp_queue
       SET status = 'sent',
           sent_at = v_now,
           provider_message_id = NULLIF(p_provider_message_id, ''),
           last_error = NULL,
           claimed_at = NULL,
           updated_at = v_now
     WHERE id = p_job_id;
    RETURN jsonb_build_object('status', 'sent', 'attempts', v_job.attempts);
  END IF;

  IF v_job.attempts >= v_job.max_attempts THEN
    UPDATE public.parent_whatsapp_queue
       SET status = 'failed',
           last_error = LEFT(COALESCE(NULLIF(BTRIM(p_error), ''), 'WhatsApp delivery failed.'), 1000),
           claimed_at = NULL,
           updated_at = v_now
     WHERE id = p_job_id;
    RETURN jsonb_build_object('status', 'failed', 'attempts', v_job.attempts);
  END IF;

  UPDATE public.parent_whatsapp_queue
     SET status = 'pending',
         next_attempt_at = v_now + CASE
           WHEN v_job.attempts <= 1 THEN interval '2 minutes'
           ELSE interval '3 minutes'
         END,
         last_error = LEFT(COALESCE(NULLIF(BTRIM(p_error), ''), 'WhatsApp delivery failed.'), 1000),
         claimed_at = NULL,
         updated_at = v_now
   WHERE id = p_job_id;

  RETURN jsonb_build_object(
    'status', 'retry_scheduled',
    'attempts', v_job.attempts,
    'nextAttemptAt', v_now + CASE WHEN v_job.attempts <= 1 THEN interval '2 minutes' ELSE interval '3 minutes' END
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_parent_whatsapp_job() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_parent_whatsapp_job(uuid, boolean, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_parent_whatsapp_job() TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_parent_whatsapp_job(uuid, boolean, text, text) TO service_role;

-- Replace the immediate WhatsApp HTTP dispatch with an atomic database queue insert.
-- The separate notify_attendance_change trigger continues to create in-app notices.
CREATE OR REPLACE FUNCTION public.dispatch_parent_whatsapp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_parent_id uuid := NULL;
  v_parent_phone text := '';
  v_prefs jsonb := NULL;
  v_group_name text := '';
  v_teacher_name text := '';
  v_status_label text := '';
  v_allowed boolean := TRUE;
  v_pref_value text := NULL;
  v_payload jsonb;
  v_url text := 'https://hassty.site/api/whatsapp/notify';
  v_secret text := '';
  v_duration_seconds integer := 2700;
  v_student_count integer := 1;
  v_interval_seconds integer := 45;
  v_schedule_key text;
  v_last_scheduled_at timestamptz;
  v_scheduled_at timestamptz;
BEGIN
  IF NEW.student_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- A QR rescan often updates the same row. Do not emit a second notice unless
  -- the effective attendance, group or session actually changed.
  IF TG_OP = 'UPDATE'
     AND NEW.student_id IS NOT DISTINCT FROM OLD.student_id
     AND NEW.group_id IS NOT DISTINCT FROM OLD.group_id
     AND NEW.session_id IS NOT DISTINCT FROM OLD.session_id
     AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT sg.name INTO v_group_name
    FROM public.student_groups sg
   WHERE sg.id = NEW.group_id;

  IF NEW.tutor_id IS NOT NULL THEN
    SELECT p.full_name INTO v_teacher_name
      FROM public.profiles p
     WHERE p.id = NEW.tutor_id;
  END IF;

  v_status_label := CASE NEW.status
    WHEN 'present' THEN 'حاضر في الموعد'
    WHEN 'late' THEN 'حاضر متأخر'
    WHEN 'absent' THEN 'غياب'
    ELSE COALESCE(NEW.status, 'حضور')
  END;

  -- Prefer a linked parent account and its WhatsApp number.
  BEGIN
    SELECT p.id, NULLIF(BTRIM(p.phone), ''), p.metadata -> 'notification_prefs'
      INTO v_parent_id, v_parent_phone, v_prefs
      FROM public.parent_children pc
      JOIN public.profiles p ON p.id = pc.parent_id
     WHERE pc.child_id = NEW.student_id
       AND COALESCE(p.account_status, 'active') <> 'suspended'
     ORDER BY pc.created_at DESC NULLS LAST
     LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_parent_id := NULL;
    v_parent_phone := '';
    v_prefs := NULL;
  END;

  -- Fallback to the phone stored on the student's profile.
  IF COALESCE(v_parent_phone, '') = '' THEN
    BEGIN
      SELECT NULLIF(BTRIM(p.metadata ->> 'parentPhone'), '')
        INTO v_parent_phone
        FROM public.profiles p
       WHERE p.id = NEW.student_id;
    EXCEPTION WHEN OTHERS THEN
      v_parent_phone := '';
    END;
  END IF;

  -- Fallback to the group enrollment contact.
  IF COALESCE(v_parent_phone, '') = '' AND NEW.group_id IS NOT NULL THEN
    BEGIN
      SELECT NULLIF(BTRIM(ge.parent_phone), '')
        INTO v_parent_phone
        FROM public.group_enrollments ge
       WHERE ge.group_id = NEW.group_id
         AND ge.student_id = NEW.student_id
       ORDER BY ge.enrolled_at DESC NULLS LAST
       LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      v_parent_phone := '';
    END;
  END IF;

  v_parent_phone := COALESCE(v_parent_phone, '');

  IF v_parent_id IS NOT NULL AND v_prefs IS NOT NULL AND jsonb_typeof(v_prefs) = 'object' THEN
    v_pref_value := CASE NEW.status
      WHEN 'absent' THEN v_prefs ->> 'absence'
      WHEN 'late' THEN v_prefs ->> 'late'
      ELSE v_prefs ->> 'attendance'
    END;
    IF LOWER(COALESCE(v_pref_value, 'true')) = 'false' THEN
      v_allowed := FALSE;
    END IF;
  END IF;

  IF NOT v_allowed THEN
    RETURN NEW;
  END IF;

  -- If there is no phone, keep the old asynchronous path only for app/Web Push
  -- notifications to a linked parent account. It does not send WhatsApp in this case.
  IF v_parent_phone = '' THEN
    IF v_parent_id IS NULL THEN
      RETURN NEW;
    END IF;

    BEGIN
      SELECT decrypted_secret INTO v_secret
        FROM vault.decrypted_secrets
       WHERE name = 'whatsapp_internal_secret'
       ORDER BY created_at DESC
       LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      v_secret := '';
    END;

    IF COALESCE(v_secret, '') <> '' THEN
      v_payload := jsonb_build_object(
        'event', 'attendance',
        'recipientUserId', v_parent_id,
        'teacherUserId', NEW.tutor_id,
        'skipPush', FALSE,
        'data', jsonb_build_object(
          'studentName', COALESCE(NEW.student_name, 'الطالب'),
          'groupName', COALESCE(NULLIF(BTRIM(v_group_name), ''), 'المجموعة'),
          'teacherName', COALESCE(NULLIF(BTRIM(v_teacher_name), ''), ''),
          'status', NEW.status,
          'statusLabel', v_status_label,
          'lateMinutes', COALESCE(NEW.late_minutes, 0),
          'time', COALESCE(to_char(NEW.time, 'HH24:MI'), '')
        )
      );

      BEGIN
        PERFORM net.http_post(
          url := v_url,
          body := v_payload,
          params := '{}'::jsonb,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-whatsapp-internal-secret', v_secret
          ),
          timeout_milliseconds := 8000
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[dispatch_parent_whatsapp] app-only notify request failed: %', SQLERRM;
      END;
    END IF;

    RETURN NEW;
  END IF;

  -- Derive interval from the real session duration and the group's active roster.
  IF NEW.session_id IS NOT NULL THEN
    SELECT GREATEST(1, EXTRACT(EPOCH FROM (ls.ends_at - ls.starts_at))::integer)
      INTO v_duration_seconds
      FROM public.lesson_sessions ls
     WHERE ls.id = NEW.session_id
       AND ls.starts_at IS NOT NULL
       AND ls.ends_at IS NOT NULL
       AND ls.ends_at > ls.starts_at;
  END IF;
  IF COALESCE(v_duration_seconds, 0) <= 0 THEN
    v_duration_seconds := 2700;
  END IF;

  IF NEW.group_id IS NOT NULL THEN
    SELECT COUNT(*)::integer INTO v_student_count
      FROM public.group_enrollments ge
     WHERE ge.group_id = NEW.group_id
       AND ge.status = 'active';
  END IF;
  IF COALESCE(v_student_count, 0) <= 0 THEN
    SELECT COUNT(DISTINCT ar.student_id)::integer INTO v_student_count
      FROM public.attendance_records ar
     WHERE ar.group_id = NEW.group_id
       AND ar.date = NEW.date
       AND ar.student_id IS NOT NULL;
  END IF;
  v_student_count := GREATEST(COALESCE(v_student_count, 1), 1);
  v_interval_seconds := GREATEST(45, CEIL(v_duration_seconds::numeric / v_student_count)::integer);

  -- All groups sent from the same connected teacher number share one throttle.
  v_schedule_key := CASE
    WHEN NEW.tutor_id IS NOT NULL THEN 'teacher:' || NEW.tutor_id::text
    ELSE 'group:' || COALESCE(NEW.group_id::text, 'unknown')
  END;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_schedule_key, 0));
  INSERT INTO public.parent_whatsapp_sender_state(schedule_key, next_send_at, updated_at)
  VALUES (v_schedule_key, clock_timestamp(), clock_timestamp())
  ON CONFLICT (schedule_key) DO NOTHING;

  SELECT q.scheduled_at
    INTO v_last_scheduled_at
    FROM public.parent_whatsapp_queue q
   WHERE q.schedule_key = v_schedule_key
     AND q.status IN ('pending', 'sending')
   ORDER BY q.scheduled_at DESC
   LIMIT 1;

  IF v_last_scheduled_at IS NULL THEN
    v_scheduled_at := clock_timestamp();
  ELSE
    v_scheduled_at := GREATEST(
      clock_timestamp(),
      v_last_scheduled_at + make_interval(secs => v_interval_seconds)
    );
  END IF;

  v_payload := jsonb_build_object(
    'event', 'attendance',
    'phone', v_parent_phone,
    'recipientUserId', v_parent_id,
    'teacherUserId', NEW.tutor_id,
    'requireTeacherWhatsApp', TRUE,
    'skipPush', TRUE,
    'data', jsonb_build_object(
      'studentName', COALESCE(NEW.student_name, 'الطالب'),
      'groupName', COALESCE(NULLIF(BTRIM(v_group_name), ''), 'المجموعة'),
      'teacherName', COALESCE(NULLIF(BTRIM(v_teacher_name), ''), ''),
      'status', NEW.status,
      'statusLabel', v_status_label,
      'lateMinutes', COALESCE(NEW.late_minutes, 0),
      'time', COALESCE(to_char(NEW.time, 'HH24:MI'), '')
    )
  );

  INSERT INTO public.parent_whatsapp_queue (
    dedupe_key, attendance_id, teacher_id, group_id, session_id, student_id,
    parent_phone, parent_user_id, schedule_key, interval_seconds, payload,
    status, attempts, max_attempts, scheduled_at, next_attempt_at
  )
  VALUES (
    NEW.id::text || ':' || COALESCE(NEW.status, 'attendance') || ':' || COALESCE(NEW.group_id::text, 'none'),
    NEW.id, NEW.tutor_id, NEW.group_id, NEW.session_id, NEW.student_id,
    v_parent_phone, v_parent_id, v_schedule_key, v_interval_seconds, v_payload,
    'pending', 0, 3, v_scheduled_at, clock_timestamp()
  )
  ON CONFLICT (dedupe_key) DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.dispatch_parent_whatsapp() FROM PUBLIC, anon, authenticated;

