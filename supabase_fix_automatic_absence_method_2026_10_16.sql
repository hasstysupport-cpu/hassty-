-- Fix automatic-absence inserts blocked by attendance_method CHECK constraint.
-- process_automatic_absences() already writes attendance_method = 'automatic_absence'
-- and is scheduled by pg_cron every minute.
-- Apply this constraint update in Supabase before running/retrying that function.

ALTER TABLE public.attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_attendance_method_check;

ALTER TABLE public.attendance_records
  ADD CONSTRAINT attendance_records_attendance_method_check
  CHECK (
    attendance_method = ANY (
      ARRAY['qr'::text, 'manual'::text, 'system'::text, 'automatic_absence'::text]
    )
  );
