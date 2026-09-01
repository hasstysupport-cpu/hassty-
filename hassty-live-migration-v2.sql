-- ============================================================================
-- Hassty Live Migration v2 — 2026-09-01
-- Aligns the Supabase DB with the LIVE main-branch UI, column-by-column,
-- based on an exact audit of every .from('table') call in src/**.
--
-- WHAT THIS DOES (and why):
--   1. DROP + recreate the exams family + chat_messages (all verified 0 rows;
--      their parallel-agent column designs break the live UI — proven by 400s).
--   2. Keep parallel-agent tables whose design MATCHES the live UI
--      (chat_threads, assistant_profiles, assistant_verification_requests,
--       grade_records, payment_records, ...) and only ALTER-ADD the columns
--      the live UI reads/writes that are missing.
--   3. Restore FKs lost to the CASCADE drop (exam_publications, grade_records).
--   4. RLS: permissive allow_all policies scoped to Hassty app tables only
--      (matches the deployed client-guarded baseline). Per-table guarded.
--   5. Realtime publication for interactive tables (guarded).
--
-- SAFETY: no global policy loop over pg_tables; nothing outside the Hassty
-- app tables (shared system tables bots/gifts/purchases... untouched).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART 1: Recreate the exams family + chat_messages (all verified EMPTY)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.exam_attendance CASCADE;
DROP TABLE IF EXISTS public.exam_results CASCADE;
DROP TABLE IF EXISTS public.exam_assignments CASCADE;
DROP TABLE IF EXISTS public.exam_slots CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;

-- ----------------------------------------------------------------------------
-- PART 2: Recreate them exactly per the live UI column contract
--   exams: insert {tutor_id, group_id, title, subject, exam_date, starts_at,
--     duration_minutes, total_marks, location, status:'scheduled'}
--     status flow: scheduled → distributed → in_progress → grading → published
-- ----------------------------------------------------------------------------
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT,
  exam_date DATE,
  starts_at TIMESTAMPTZ,
  duration_minutes INT DEFAULT 60,
  total_marks NUMERIC(6,2) DEFAULT 100,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','distributed','in_progress','grading','published','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- exam_slots: insert {exam_id, label, starts_at, ends_at, room, capacity, current_count}
CREATE TABLE public.exam_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  room TEXT,
  capacity INT DEFAULT 0,
  current_count INT DEFAULT 0
);

-- exam_assignments: insert {exam_id, slot_id, student_id, student_name,
--   group_id, conflict_reason, status:'assigned'|'unresolved'}; update status:'moved'
CREATE TABLE public.exam_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.exam_slots(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','unresolved','moved','confirmed','conflict','absent','excused')),
  conflict_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- exam_results: upsert {exam_id, student_id, student_name, group_id,
--   earned_marks, total_marks, percentage, status:'draft'} ON CONFLICT (exam_id,student_id);
--   update → status:'final' + published_at; students read .eq('status','final')
CREATE TABLE public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  earned_marks NUMERIC(6,2) DEFAULT 0,
  total_marks NUMERIC(6,2) DEFAULT 100,
  percentage NUMERIC(6,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','final','published','absent')),
  teacher_note TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exam_id, student_id)
);

-- exam_attendance: upsert {exam_id, student_id, student_name, slot_id,
--   status:'pending'} ON CONFLICT (exam_id,student_id); order by created_at
CREATE TABLE public.exam_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.exam_slots(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','present','absent','late','excused')),
  recorded_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exam_id, student_id)
);

-- chat_messages: UI inserts/reads {thread_id, sender_id, body} (parallel design
-- used 'content' and breaks the live chat send)
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- PART 3: Columns the live UI needs but are missing on kept tables
-- ----------------------------------------------------------------------------
-- assistant_profiles: verification docs upload flow (AssistantVerificationPage)
ALTER TABLE public.assistant_profiles
  ADD COLUMN IF NOT EXISTS id_document_url TEXT,
  ADD COLUMN IF NOT EXISTS id_document_status TEXT DEFAULT 'not_submitted',
  ADD COLUMN IF NOT EXISTS qualification_document_url TEXT,
  ADD COLUMN IF NOT EXISTS qualification_document_status TEXT DEFAULT 'not_submitted';

-- assistant_verification_requests: doc URLs + admin notes shown to assistant
ALTER TABLE public.assistant_verification_requests
  ADD COLUMN IF NOT EXISTS id_document_url TEXT,
  ADD COLUMN IF NOT EXISTS qualification_document_url TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- grade_records: assignment grading writes assignment_id (TeacherSubmissionsGradebook)
ALTER TABLE public.grade_records
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL;

-- payment_records: student/parent/assistant payments read these columns
ALTER TABLE public.payment_records
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS billing_period TEXT;

-- ----------------------------------------------------------------------------
-- PART 4: Restore FKs stripped by the CASCADE drop (guarded, safe on reruns)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.exam_publications
      ADD CONSTRAINT exam_publications_exam_id_fkey
      FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_column THEN NULL;
  END;
  BEGIN
    ALTER TABLE public.grade_records
      ADD CONSTRAINT grade_records_exam_id_fkey
      FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_column THEN NULL;
  END;
END $$;

-- ----------------------------------------------------------------------------
-- PART 5: Indexes for the recreated tables (IF NOT EXISTS — rerun-safe)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS exams_tutor_idx ON public.exams(tutor_id, exam_date DESC);
CREATE INDEX IF NOT EXISTS exam_slots_exam_idx ON public.exam_slots(exam_id);
CREATE INDEX IF NOT EXISTS exam_assignments_exam_idx ON public.exam_assignments(exam_id);
CREATE INDEX IF NOT EXISTS exam_assignments_student_idx ON public.exam_assignments(student_id);
CREATE INDEX IF NOT EXISTS exam_results_exam_idx ON public.exam_results(exam_id);
CREATE INDEX IF NOT EXISTS exam_results_student_idx ON public.exam_results(student_id);
CREATE INDEX IF NOT EXISTS exam_attendance_exam_idx ON public.exam_attendance(exam_id);
CREATE INDEX IF NOT EXISTS chat_messages_thread_idx ON public.chat_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS payment_records_student_idx ON public.payment_records(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_records_tutor_idx ON public.payment_records(tutor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS student_notes_student_idx ON public.student_notes(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS availability_teacher_idx ON public.availability_slots(teacher_id);
CREATE INDEX IF NOT EXISTS assistant_group_assignments_assistant_idx ON public.assistant_group_assignments(assistant_id, is_active);
CREATE INDEX IF NOT EXISTS assistant_activity_assistant_idx ON public.assistant_activity_logs(assistant_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- PART 6: RLS — permissive allow_all on Hassty app tables ONLY (per-table
-- guarded so a missing table can never abort the loop; client guards roles)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'notifications','chat_threads','chat_messages','assignments','assignment_submissions',
    'grade_records','calendar_events','payment_records','assistant_profiles',
    'assistant_verification_requests','assistant_invitations',
    'assistant_group_assignments','assistant_activity_logs',
    'group_transfer_requests','teacher_change_requests','student_notes',
    'exams','exam_slots','exam_assignments','exam_attendance','exam_results',
    'availability_slots'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "allow_all_public_%s" ON public.%I;', tbl, tbl);
      EXECUTE format('CREATE POLICY "allow_all_public_%s" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- PART 7: Realtime for interactive tables (guarded — safe on reruns)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.assignment_submissions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_records;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.assistant_invitations;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.assistant_verification_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_transfer_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_change_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_results;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;
