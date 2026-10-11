-- Migration source for automatic no-show detection in Hassty.
-- Apply after the WhatsApp attendance queue migration.
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE INDEX IF NOT EXISTS idx_attendance_auto_absence_lookup
  ON public.attendance_records (group_id, student_id, date, session_id);

CREATE OR REPLACE FUNCTION public.process_automatic_absences()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_local_now timestamp without time zone;
  v_local_date date;
  v_dow integer;
  v_day_en text;
  v_day_ar text;
  v_created integer := 0;
BEGIN
  -- Prevent concurrent runs from creating duplicate absence records.
  IF NOT pg_try_advisory_xact_lock(hashtextextended('hassty:auto-absence:v1', 0)) THEN
    RETURN jsonb_build_object('ok', true, 'skipped', 'another run is active', 'created', 0);
  END IF;

  v_local_now := v_now AT TIME ZONE 'Africa/Cairo';
  v_local_date := v_local_now::date;
  v_dow := EXTRACT(DOW FROM v_local_now)::integer;

  v_day_en := CASE v_dow
    WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
    ELSE 'Saturday' END;
  -- Normalize hamza/alif variants so older Arabic schedule strings still match.
  v_day_ar := CASE v_dow
    WHEN 0 THEN 'الاحد' WHEN 1 THEN 'الاثنين' WHEN 2 THEN 'الثلاثاء'
    WHEN 3 THEN 'الاربعاء' WHEN 4 THEN 'الخميس' WHEN 5 THEN 'الجمعة'
    ELSE 'السبت' END;

  WITH group_data AS (
    SELECT
      sg.id AS group_id,
      sg.tutor_id,
      sg.name AS group_name,
      sg.schedule,
      CASE
        WHEN jsonb_typeof(sg.schedule_slots) = 'array' THEN sg.schedule_slots
        ELSE '[]'::jsonb
      END AS schedule_slots,
      regexp_replace(COALESCE(sg.schedule, ''), '[أإآا]', 'ا', 'g') AS normalized_schedule
    FROM public.student_groups sg
    WHERE sg.is_active IS DISTINCT FROM FALSE
  ),
  slot_minutes AS (
    SELECT
      gd.group_id, gd.tutor_id, gd.group_name,
      CASE WHEN slot->>'startTime' ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
        THEN split_part(slot->>'startTime', ':', 1)::integer * 60
           + split_part(slot->>'startTime', ':', 2)::integer
        ELSE NULL END AS start_minute,
      CASE WHEN slot->>'endTime' ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
        THEN split_part(slot->>'endTime', ':', 1)::integer * 60
           + split_part(slot->>'endTime', ':', 2)::integer
        ELSE NULL END AS end_minute
    FROM group_data gd
    CROSS JOIN LATERAL jsonb_array_elements(gd.schedule_slots) AS slot
    WHERE
      (
        lower(COALESCE(slot->>'day', '')) = lower(v_day_en)
        OR regexp_replace(COALESCE(slot->>'dayArabic', ''), '[أإآا]', 'ا', 'g') = v_day_ar
      )
  ),
  legacy_schedule_minutes AS (
    SELECT
      gd.group_id, gd.tutor_id, gd.group_name,
      CASE
        WHEN m.parts[3] ILIKE 'مساء%' OR m.parts[3] IN ('م', 'pm')
          THEN ((m.parts[1]::integer % 12) + 12) * 60 + m.parts[2]::integer
        WHEN m.parts[3] ILIKE 'صباح%' OR m.parts[3] IN ('ص', 'am')
          THEN (m.parts[1]::integer % 12) * 60 + m.parts[2]::integer
        ELSE m.parts[1]::integer * 60 + m.parts[2]::integer
      END AS start_minute,
      CASE
        WHEN m.parts[3] ILIKE 'مساء%' OR m.parts[3] IN ('م', 'pm')
          THEN ((m.parts[1]::integer % 12) + 12) * 60 + m.parts[2]::integer
        WHEN m.parts[3] ILIKE 'صباح%' OR m.parts[3] IN ('ص', 'am')
          THEN (m.parts[1]::integer % 12) * 60 + m.parts[2]::integer
        ELSE m.parts[1]::integer * 60 + m.parts[2]::integer
      END + 120 AS end_minute
    FROM group_data gd
    CROSS JOIN LATERAL (
      SELECT regexp_match(
        COALESCE(gd.schedule, ''),
        '([0-9]{1,2}):([0-9]{2})[[:space:]]*(صباحًا|صباحا|ص|مساءً|مساء|م|am|pm)?',
        'i'
      ) AS parts
    ) m
    WHERE jsonb_array_length(gd.schedule_slots) = 0
      AND m.parts IS NOT NULL
      AND position(v_day_ar IN gd.normalized_schedule) > 0
  ),
  recurring_minutes AS (
    SELECT group_id, tutor_id, group_name, start_minute, end_minute
    FROM slot_minutes
    WHERE start_minute IS NOT NULL AND end_minute IS NOT NULL
    UNION ALL
    SELECT group_id, tutor_id, group_name, start_minute, end_minute
    FROM legacy_schedule_minutes
    WHERE start_minute IS NOT NULL AND end_minute IS NOT NULL
  ),
  recurring_events AS (
    SELECT DISTINCT ON (rm.group_id, rm.start_minute)
      rm.group_id,
      rm.tutor_id,
      rm.group_name,
      NULL::uuid AS session_id,
      ((v_local_date::timestamp + make_interval(mins => rm.start_minute))
        AT TIME ZONE 'Africa/Cairo') AS starts_at,
      ((v_local_date::timestamp + make_interval(mins =>
        rm.end_minute + CASE WHEN rm.end_minute <= rm.start_minute THEN 1440 ELSE 0 END))
        AT TIME ZONE 'Africa/Cairo') AS ends_at,
      '[auto-absence:' || to_char(v_local_date, 'YYYY-MM-DD') || ':' ||
        lpad((rm.start_minute / 60)::text, 2, '0') || ':' ||
        lpad((rm.start_minute % 60)::text, 2, '0') || ']' AS marker
    FROM recurring_minutes rm
    WHERE NOT EXISTS (
      -- If the teacher created an explicit session for the same scheduled slot,
      -- process that session instead of generating a second event.
      SELECT 1
      FROM public.lesson_sessions ls
      WHERE ls.group_id = rm.group_id
        AND ls.status <> 'cancelled'
        AND (ls.starts_at AT TIME ZONE 'Africa/Cairo')::date = v_local_date
        AND abs(EXTRACT(EPOCH FROM (
          ls.starts_at -
          ((v_local_date::timestamp + make_interval(mins => rm.start_minute))
            AT TIME ZONE 'Africa/Cairo')
        ))) < 90
    )
    ORDER BY rm.group_id, rm.start_minute, rm.end_minute
  ),
  explicit_session_events AS (
    SELECT DISTINCT ON (ls.group_id, ls.starts_at)
      ls.group_id,
      ls.tutor_id,
      sg.name AS group_name,
      ls.id AS session_id,
      ls.starts_at,
      ls.ends_at,
      '[auto-absence:' || to_char(ls.starts_at AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD:HH24:MI')
        || ':' || ls.id::text || ']' AS marker
    FROM public.lesson_sessions ls
    JOIN public.student_groups sg ON sg.id = ls.group_id
    WHERE ls.group_id IS NOT NULL
      AND ls.status IN ('scheduled', 'in_progress', 'completed')
      AND sg.is_active IS DISTINCT FROM FALSE
      AND (ls.starts_at AT TIME ZONE 'Africa/Cairo')::date = v_local_date
      AND ls.ends_at > ls.starts_at
    ORDER BY ls.group_id, ls.starts_at, ls.created_at DESC
  ),
  due_events AS (
    SELECT e.*
    FROM (
      SELECT * FROM explicit_session_events
      UNION ALL
      SELECT * FROM recurring_events
    ) e
    WHERE v_now >= e.starts_at + ((e.ends_at - e.starts_at) / 2)
      AND e.ends_at > e.starts_at
  ),
  to_mark AS (
    SELECT
      e.group_id,
      e.tutor_id,
      e.group_name,
      e.session_id,
      e.starts_at,
      e.ends_at,
      e.marker,
      ge.student_id,
      COALESCE(NULLIF(BTRIM(p.full_name), ''), ge.student_name, 'طالب') AS student_name,
      COALESCE(NULLIF(BTRIM(p.qr_code), ''), NULLIF(BTRIM(ge.qr_code), '')) AS qr_code
    FROM due_events e
    JOIN public.group_enrollments ge
      ON ge.group_id = e.group_id
     AND ge.status = 'active'
     AND ge.student_id IS NOT NULL
    LEFT JOIN public.profiles p ON p.id = ge.student_id
    WHERE COALESCE(p.account_status, 'active') <> 'suspended'
      AND COALESCE(NULLIF(BTRIM(p.qr_code), ''), NULLIF(BTRIM(ge.qr_code), '')) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.attendance_records ar
        WHERE ar.group_id = e.group_id
          AND ar.student_id = ge.student_id
          AND ar.date = v_local_date
          AND (
            (e.session_id IS NOT NULL AND ar.session_id = e.session_id)
            OR (ar.checked_in_at IS NOT NULL
                AND ar.checked_in_at >= e.starts_at
                AND ar.checked_in_at < e.ends_at)
            OR (ar.notes IS NOT NULL AND position(e.marker IN ar.notes) > 0)
          )
      )
  ),
  inserted AS (
    INSERT INTO public.attendance_records (
      group_id, tutor_id, student_id, student_name, qr_code, session_id,
      date, time, status, homework_status, notes, scanned_via_qr,
      attendance_method, checked_in_at, checked_out_at, late_minutes,
      created_at, updated_at
    )
    SELECT
      m.group_id,
      m.tutor_id,
      m.student_id,
      m.student_name,
      m.qr_code,
      m.session_id,
      v_local_date,
      ((m.starts_at + ((m.ends_at - m.starts_at) / 2)) AT TIME ZONE 'Africa/Cairo')::time,
      'absent',
      'not_completed',
      'غياب تلقائي: لم يتم تسجيل الحضور حتى مرور نصف مدة الحصة. ' ||
        'موعد الحصة ' ||
        to_char(m.starts_at AT TIME ZONE 'Africa/Cairo', 'HH24:MI') || '–' ||
        to_char(m.ends_at AT TIME ZONE 'Africa/Cairo', 'HH24:MI') || ' ' || m.marker,
      FALSE,
      'automatic_absence',
      NULL,
      NULL,
      0,
      v_now,
      v_now
    FROM to_mark m
    RETURNING id
  )
  SELECT count(*)::integer INTO v_created FROM inserted;

  RETURN jsonb_build_object(
    'ok', true,
    'created', v_created,
    'localDate', to_char(v_local_date, 'YYYY-MM-DD'),
    'checkedAt', v_now,
    'timezone', 'Africa/Cairo'
  );
END;
$function$


REVOKE ALL ON FUNCTION public.process_automatic_absences() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_automatic_absences() TO service_role;

DO $setup$
DECLARE
  v_jobid bigint;
BEGIN
  FOR v_jobid IN
    SELECT jobid FROM cron.job WHERE jobname = 'hassty-auto-absence-every-minute'
  LOOP
    PERFORM cron.unschedule(v_jobid);
  END LOOP;

  PERFORM cron.schedule(
    'hassty-auto-absence-every-minute',
    '* * * * *',
    'SELECT public.process_automatic_absences();'
  );
END;
$setup$;
