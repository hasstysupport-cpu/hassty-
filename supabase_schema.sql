-- ==============================================================================
-- HASSTY Platform - Complete Master Supabase Schema
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student', 'parent', 'assistant', 'admin')),
  avatar_url TEXT,
  qr_code TEXT UNIQUE,
  governorate TEXT,
  city TEXT,
  grade TEXT,
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending')),
  badge TEXT NOT NULL DEFAULT 'none' CHECK (badge IN ('none', 'super_tutor', 'center_partner', 'verified_tutor')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tutor Profiles Table
CREATE TABLE IF NOT EXISTS public.tutor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  headline TEXT,
  bio TEXT,
  subjects TEXT[] DEFAULT '{}',
  grades TEXT[] DEFAULT '{}',
  experience_years INT DEFAULT 1,
  experience_years_text TEXT,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  reviews_count INT DEFAULT 0,
  governorate TEXT,
  city TEXT,
  center_names TEXT[] DEFAULT '{}',
  price_per_month INT DEFAULT 0,
  price_per_session INT DEFAULT 0,
  punctuality_rate NUMERIC(5, 2) DEFAULT 100.0,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Student Groups Table
CREATE TABLE IF NOT EXISTS public.student_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  grade TEXT,
  schedule TEXT,
  schedule_slots JSONB DEFAULT '[]'::jsonb,
  location TEXT,
  center_name TEXT,
  max_students INT DEFAULT 35,
  current_count INT DEFAULT 0,
  monthly_fee INT DEFAULT 0,
  price_amount INT DEFAULT 0,
  billing_type TEXT DEFAULT 'per_session' CHECK (billing_type IN ('per_session', 'monthly')),
  commission_rate NUMERIC(5, 2) DEFAULT 2.0,
  student_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Group Enrollments Table
CREATE TABLE IF NOT EXISTS public.group_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_phone TEXT,
  parent_phone TEXT,
  qr_code TEXT,
  avatar_url TEXT,
  grade TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'left', 'paused', 'transferred')),
  attendance_rate NUMERIC(5, 2) DEFAULT 0,
  total_sessions INT DEFAULT 0,
  attended_sessions INT DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'overdue')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, student_id)
);

-- 5. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  qr_code TEXT NOT NULL,
  session_id UUID,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent')),
  homework_status TEXT DEFAULT 'pending' CHECK (homework_status IN ('completed', 'partial', 'not_completed', 'pending')),
  notes TEXT,
  is_makeup BOOLEAN DEFAULT FALSE,
  scanned_via_qr BOOLEAN DEFAULT TRUE,
  attendance_method TEXT DEFAULT 'qr',
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  late_minutes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Lesson Sessions Table
CREATE TABLE IF NOT EXISTS public.lesson_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + interval '2 hours',
  location TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Attendance Events Table
CREATE TABLE IF NOT EXISTS public.attendance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Booking Requests Table
CREATE TABLE IF NOT EXISTS public.booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_phone TEXT NOT NULL,
  parent_phone TEXT,
  grade TEXT,
  student_grade TEXT,
  subject TEXT,
  day TEXT,
  time TEXT,
  location TEXT,
  price NUMERIC(10, 2) DEFAULT 0,
  group_id UUID REFERENCES public.student_groups(id),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Parent-Children Link Table
CREATE TABLE IF NOT EXISTS public.parent_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  child_qr_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

-- 10. Parent Link Requests Table
CREATE TABLE IF NOT EXISTS public.parent_link_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  parent_email TEXT,
  parent_avatar_url TEXT,
  student_name TEXT,
  student_code TEXT,
  student_grade TEXT,
  student_avatar_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  responded_at TIMESTAMPTZ,
  decline_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tutor Reviews Table
CREATE TABLE IF NOT EXISTS public.tutor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_name TEXT,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
  comment TEXT,
  teaching_quality NUMERIC(3, 2) DEFAULT 5.0,
  punctuality NUMERIC(3, 2) DEFAULT 5.0,
  behavior NUMERIC(3, 2) DEFAULT 5.0,
  value_for_money NUMERIC(3, 2) DEFAULT 5.0,
  verified_session BOOLEAN DEFAULT FALSE,
  booking_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Attendance Disputes Table
CREATE TABLE IF NOT EXISTS public.attendance_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Makeup Requests Table
CREATE TABLE IF NOT EXISTS public.makeup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_group TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Teacher Verification Requests Table
CREATE TABLE IF NOT EXISTS public.teacher_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  stage TEXT,
  governorate TEXT,
  area TEXT,
  bio TEXT,
  experience_years TEXT,
  id_card_image_url TEXT,
  certificate_image_url TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  actioned_at TIMESTAMPTZ,
  actioned_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Commission Tracking Table
CREATE TABLE IF NOT EXISTS public.commission_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  billing_cycle DATE NOT NULL,
  active_students_count INT NOT NULL DEFAULT 0,
  monthly_gross_egp NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tier_rate NUMERIC(6, 3) NOT NULL DEFAULT 2.0,
  due_commission_egp NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'overdue', 'pending')),
  last_payment_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(teacher_id, billing_cycle)
);

-- 16. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  user_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NULL,
  subject TEXT NOT NULL DEFAULT 'استفسار عام',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_reply TEXT NULL,
  replied_by TEXT NULL,
  replied_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Safety Reports Table
CREATE TABLE IF NOT EXISTS public.safety_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id),
  reporter_role TEXT,
  target_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  category TEXT,
  details TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_investigation', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Generic Documents Table (Compat Layer)
CREATE TABLE IF NOT EXISTS public.app_documents (
  collection_name TEXT NOT NULL,
  document_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_name, document_id)
);

-- ==============================================================================
-- Public Verified Teachers VIEW
-- ==============================================================================
CREATE OR REPLACE VIEW public.public_verified_teachers AS
SELECT
  p.id,
  p.full_name AS name,
  p.avatar_url,
  p.phone,
  p.email,
  p.governorate,
  p.city,
  tp.title,
  tp.headline,
  tp.bio,
  tp.subjects,
  tp.grades,
  tp.rating,
  tp.reviews_count,
  tp.price_per_session,
  tp.price_per_month,
  tp.experience_years,
  tp.experience_years_text,
  tp.center_names,
  tp.is_verified,
  tp.verification_status,
  tp.punctuality_rate,
  tp.metadata,
  tp.created_at,
  tp.updated_at
FROM public.profiles p
JOIN public.tutor_profiles tp ON tp.user_id = p.id
WHERE p.role = 'teacher' AND p.account_status = 'active';

-- ==============================================================================
-- Row-Level Security (RLS) & Permissive Policies
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_link_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.makeup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_documents ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and public anon keys
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

-- ==============================================================================
-- Enable Realtime for all core tables
-- ==============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tutor_profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_groups;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_enrollments;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_sessions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_children;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_link_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tutor_reviews;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_verification_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_documents;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;
