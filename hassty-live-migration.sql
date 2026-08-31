-- ============================================================================
-- Hassty Live Migration — 2026-09-02
-- Aligns the Supabase DB with the LIVE main-branch UI (db22c5a+)
--
-- SAFETY RULES:
--   * Only touches tables owned by the Hassty app (listed below)
--   * Never touches: profiles, tutor_profiles, auth, or non-app tables
--     (agent_users, bots, purchases, gifts, referrals... belong to another
--      system sharing this project and are left 100% untouched)
--   * Conflicting tables below were verified EMPTY (0 rows) before DROP
--   * No global policy loop: RLS policies only on Hassty app tables
--
-- Conflicting-but-EMPTY tables recreated to match live UI column contract:
--   exams, exam_slots, exam_assignments, exam_results,
--   assistant_profiles, assistant_verification_requests,
--   chat_threads, chat_messages, grade_records, payment_records,
--   student_notes, group_transfer_requests, teacher_change_requests
-- New tables created:
--   assistant_group_assignments, assistant_activity_logs,
--   exam_attendance, availability_slots
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART 1: Recreate empty tables whose columns diverged from the live UI
-- (all verified 0 rows before this migration; plain DROP so a hard dependency
--  would abort instead of silently cascading)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.exams;
DROP TABLE IF EXISTS public.exam_slots;
DROP TABLE IF EXISTS public.exam_assignments;
DROP TABLE IF EXISTS public.exam_results;
DROP TABLE IF EXISTS public.assistant_profiles;
DROP TABLE IF EXISTS public.assistant_verification_requests;
DROP TABLE IF EXISTS public.chat_threads;
DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.grade_records;
DROP TABLE IF EXISTS public.payment_records;
DROP TABLE IF EXISTS public.student_notes;
DROP TABLE IF EXISTS public.group_transfer_requests;
DROP TABLE IF EXISTS public.teacher_change_requests;

-- ----------------------------------------------------------------------------
-- PART 2: Recreate them exactly as the live UI expects (from
-- supabase_feature_completion_2026_09_01.sql, kept in sync verbatim)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exams (
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

CREATE TABLE IF NOT EXISTS public.exam_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  room TEXT,
  capacity INT DEFAULT 0,
  current_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.exam_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.exam_slots(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','confirmed','conflict','absent','excused')),
  conflict_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  earned_marks NUMERIC(6,2) DEFAULT 0,
  total_marks NUMERIC(6,2) DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','graded','published','absent')),
  teacher_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.exam_slots(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','excused')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.assistant_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  qualification TEXT,
  id_document_url TEXT,
  id_document_status TEXT DEFAULT 'pending',
  qualification_document_url TEXT,
  qualification_document_status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assistant_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_document_url TEXT,
  qualification_document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  participants UUID[] NOT NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grade_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
  title TEXT,
  subject TEXT,
  score NUMERIC(6,2),
  max_score NUMERIC(6,2) DEFAULT 100,
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  method TEXT,
  billing_type TEXT DEFAULT 'session',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled','refunded')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  receipt_url TEXT,
  notes TEXT,
  student_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assistant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info','positive','warning','critical')),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  to_group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  from_group_name TEXT,
  to_group_name TEXT,
  student_name TEXT,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  decided_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teacher_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  current_teacher_name TEXT,
  requested_teacher_name TEXT,
  student_name TEXT,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  parent_decided_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  slot_type TEXT DEFAULT 'group',
  location TEXT,
  capacity INT DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assistant_group_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  can_take_attendance BOOLEAN DEFAULT FALSE,
  can_manage_students BOOLEAN DEFAULT FALSE,
  can_view_payments BOOLEAN DEFAULT FALSE,
  can_add_notes BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assistant_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- PART 3: Indexes (all IF NOT EXISTS — safe on reruns)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS exams_tutor_idx ON public.exams(tutor_id, exam_date DESC);
CREATE INDEX IF NOT EXISTS exam_slots_exam_idx ON public.exam_slots(exam_id);
CREATE INDEX IF NOT EXISTS exam_assignments_exam_idx ON public.exam_assignments(exam_id);
CREATE INDEX IF NOT EXISTS exam_assignments_student_idx ON public.exam_assignments(student_id);
CREATE INDEX IF NOT EXISTS exam_results_exam_idx ON public.exam_results(exam_id);
CREATE INDEX IF NOT EXISTS exam_results_student_idx ON public.exam_results(student_id);
CREATE INDEX IF NOT EXISTS exam_attendance_exam_idx ON public.exam_attendance(exam_id);
CREATE INDEX IF NOT EXISTS chat_messages_thread_idx ON public.chat_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS chat_threads_participants_idx ON public.chat_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS grade_records_student_idx ON public.grade_records(student_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS payment_records_student_idx ON public.payment_records(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_records_tutor_idx ON public.payment_records(tutor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS student_notes_student_idx ON public.student_notes(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS availability_teacher_idx ON public.availability_slots(teacher_id);
CREATE INDEX IF NOT EXISTS assistant_group_assignments_assistant_idx ON public.assistant_group_assignments(assistant_id, is_active);
CREATE INDEX IF NOT EXISTS assistant_activity_assistant_idx ON public.assistant_activity_logs(assistant_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- PART 4: RLS — ONLY on Hassty app tables (matches deployed permissive
-- baseline where the client guards roles). No global loop on pg_tables.
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
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_public_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "allow_all_public_%s" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- PART 5: Realtime for interactive tables (guarded — safe on reruns)
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
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_transfer_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_change_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_results;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;
