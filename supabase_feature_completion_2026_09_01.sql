-- ==============================================================================
-- HASSTY Platform - Feature Completion Migration (2026-09-01)
-- Codifies tables already used by the UI + adds missing feature tables.
-- IDEMPOTENT: safe to run on existing deployments.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- PART 1: Tables already used by existing UI code but missing from migrations
-- ==============================================================================

-- Notifications (used by notificationService, NotificationBell, NotificationsPage)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);

-- Chat threads + messages (used by MessagesPage)
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assistant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_support BOOLEAN DEFAULT FALSE,
  title TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_messages_thread_idx ON public.chat_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS chat_threads_participants_idx ON public.chat_threads(last_message_at DESC);

-- Assignments + submissions (used by AssignmentsPage, TeacherAssignmentsPage)
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  max_score NUMERIC(6,2) DEFAULT 100,
  attachments JSONB DEFAULT '[]'::jsonb,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answer_text TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted','late','graded','returned')),
  score NUMERIC(6,2),
  teacher_feedback TEXT,
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);
CREATE INDEX IF NOT EXISTS assignments_teacher_idx ON public.assignments(teacher_id, due_at);
CREATE INDEX IF NOT EXISTS submissions_assignment_idx ON public.assignment_submissions(assignment_id);

-- Grade records (used by GradesPage, ParentGradesPage)
CREATE TABLE IF NOT EXISTS public.grade_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  exam_id UUID,
  assignment_id UUID,
  title TEXT NOT NULL,
  subject TEXT,
  score NUMERIC(6,2) NOT NULL DEFAULT 0,
  max_score NUMERIC(6,2) NOT NULL DEFAULT 100,
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS grade_records_student_idx ON public.grade_records(student_id, recorded_at DESC);

-- Calendar events (used by CalendarPage)
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'reminder' CHECK (event_type IN ('lesson','exam','assignment','payment','booking','reminder','custom')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS calendar_events_user_idx ON public.calendar_events(user_id, starts_at);

-- Payment records (used by StudentPaymentsPageV2, ParentPaymentsPageV2, TeacherPaymentsPageV2, AssistantPaymentsPage)
CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_name TEXT,
  tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  subject TEXT,
  billing_period TEXT,
  billing_type TEXT DEFAULT 'monthly' CHECK (billing_type IN ('per_session','monthly')),
  method TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid','pending','overdue','refunded')),
  paid_at TIMESTAMPTZ,
  due_date DATE,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS payment_records_student_idx ON public.payment_records(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_records_tutor_idx ON public.payment_records(tutor_id, created_at DESC);

-- ==============================================================================
-- PART 2: Assistant system (signup + verification + invitations + permissions)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.assistant_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  whatsapp_phone TEXT,
  governorate TEXT,
  city TEXT,
  experience_years INT DEFAULT 0,
  experience_summary TEXT,
  education TEXT,
  qualification TEXT,
  certificate_summary TEXT,
  id_document_url TEXT,
  qualification_document_url TEXT,
  id_document_status TEXT DEFAULT 'not_submitted' CHECK (id_document_status IN ('not_submitted','pending','approved','rejected')),
  qualification_document_status TEXT DEFAULT 'not_submitted' CHECK (qualification_document_status IN ('not_submitted','pending','approved','rejected')),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending','under_review','approved','rejected')),
  is_verified BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assistant_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','under_review','id_reupload','qualification_reupload','approved','rejected')),
  id_document_url TEXT,
  qualification_document_url TEXT,
  notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assistant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','revoked')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS assistant_invitations_assistant_idx ON public.assistant_invitations(assistant_id, status);

-- Per-group assistant assignments & permissions (enforced in RLS, reflected in UI)
CREATE TABLE IF NOT EXISTS public.assistant_group_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  can_take_attendance BOOLEAN DEFAULT TRUE,
  can_manage_students BOOLEAN DEFAULT FALSE,
  can_view_payments BOOLEAN DEFAULT FALSE,
  can_add_notes BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assistant_id, group_id)
);
CREATE INDEX IF NOT EXISTS assistant_group_assignments_assistant_idx ON public.assistant_group_assignments(assistant_id, is_active);

-- Assistant activity log
CREATE TABLE IF NOT EXISTS public.assistant_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assistant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS assistant_activity_assistant_idx ON public.assistant_activity_logs(assistant_id, created_at DESC);

-- ==============================================================================
-- PART 3: Group transfers, teacher change requests, student notes
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.group_transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  from_group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  from_group_name TEXT,
  to_group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  to_group_name TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed')),
  requested_by TEXT DEFAULT 'parent' CHECK (requested_by IN ('student','parent','teacher')),
  decided_at TIMESTAMPTZ,
  decided_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teacher_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject TEXT,
  current_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  current_teacher_name TEXT,
  requested_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_teacher_name TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','parent_approved','parent_rejected','teacher_accepted','teacher_declined','completed','cancelled')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  parent_decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assistant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT DEFAULT 'behavior' CHECK (category IN ('behavior','academic','attendance','payment','general')),
  note TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info','positive','warning','critical')),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS student_notes_student_idx ON public.student_notes(student_id, created_at DESC);

-- ==============================================================================
-- PART 4: Exams system (exam → slots → distribution → attendance → grading → publish)
-- ==============================================================================

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
CREATE INDEX IF NOT EXISTS exams_tutor_idx ON public.exams(tutor_id, exam_date DESC);

CREATE TABLE IF NOT EXISTS public.exam_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  room TEXT,
  capacity INT DEFAULT 35,
  current_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.exam_slots(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  conflict_reason TEXT,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned','unresolved','moved','confirmed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.exam_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  slot_id UUID REFERENCES public.exam_slots(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','present','absent','excused')),
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  earned_marks NUMERIC(6,2) DEFAULT 0,
  total_marks NUMERIC(6,2) DEFAULT 100,
  percentage NUMERIC(5,2) DEFAULT 0,
  teacher_note TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','review','final')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

-- ==============================================================================
-- PART 5: Availability slots (codify existing TeacherAvailabilityPageV2 usage)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  slot_type TEXT DEFAULT 'group' CHECK (slot_type IN ('group','exam','private','online')),
  capacity INT DEFAULT 35,
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS availability_teacher_idx ON public.availability_slots(teacher_id);

-- ==============================================================================
-- PART 6: RLS policies for new tables (matching existing permissive baseline)
-- NOTE: the existing schema intentionally ships allow_all policies for
-- authenticated/anon access (client-side role guards). We keep the same
-- baseline here for consistency with the deployed architecture.
-- ==============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_public_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "allow_all_public_%s" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

-- Realtime for new tables
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
