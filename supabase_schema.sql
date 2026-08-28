-- ==============================================================================
-- HASSTY (حِصّتي) - Complete Supabase PostgreSQL Schema
-- Run this entire script in your Supabase SQL Editor (SQL Editor -> New query -> Run)
-- ==============================================================================

-- 1. PROFILES TABLE (المستخدمين: معلم، طالب، ولي أمر)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student', 'parent', 'admin')),
  avatar_url TEXT,
  qr_code TEXT UNIQUE,
  governorate TEXT,
  city TEXT,
  grade TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TUTOR PROFILES TABLE (بيانات المعلم الإضافية والمواد والتقييمات)
CREATE TABLE IF NOT EXISTS public.tutor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  bio TEXT,
  subjects TEXT[] DEFAULT '{}',
  grades TEXT[] DEFAULT '{}',
  experience_years INT DEFAULT 1,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  reviews_count INT DEFAULT 0,
  governorate TEXT,
  city TEXT,
  center_names TEXT[] DEFAULT '{}',
  price_per_month INT DEFAULT 0,
  punctuality_rate NUMERIC(5, 2) DEFAULT 100.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENT GROUPS TABLE (المجموعات الدراسية)
CREATE TABLE IF NOT EXISTS public.student_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  schedule TEXT NOT NULL,
  location TEXT NOT NULL,
  center_name TEXT NOT NULL,
  max_students INT DEFAULT 30,
  current_count INT DEFAULT 0,
  monthly_fee INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GROUP ENROLLMENTS TABLE (قيد الطلاب في المجموعات)
CREATE TABLE IF NOT EXISTS public.group_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_phone TEXT,
  parent_phone TEXT,
  qr_code TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'left')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ATTENDANCE RECORDS TABLE (سجل الحضور الذكي بالـ QR)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  qr_code TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent')),
  homework_status TEXT DEFAULT 'pending' CHECK (homework_status IN ('completed', 'partial', 'not_completed', 'pending')),
  notes TEXT,
  is_makeup BOOLEAN DEFAULT FALSE,
  scanned_via_qr BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PARENT CHILD LINKS TABLE (ربط أولياء الأمور بالأبناء)
CREATE TABLE IF NOT EXISTS public.parent_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  child_qr_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

-- 7. BOOKING REQUESTS TABLE (طلبات حجز الحصص والمجموعات)
CREATE TABLE IF NOT EXISTS public.booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_phone TEXT NOT NULL,
  parent_phone TEXT,
  grade TEXT NOT NULL,
  group_id UUID REFERENCES public.student_groups(id),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ATTENDANCE DISPUTES TABLE (تظلمات أولياء الأمور على الحضور)
CREATE TABLE IF NOT EXISTS public.attendance_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id),
  parent_id UUID REFERENCES public.profiles(id),
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MAKEUP SESSIONS TABLE (طلبات الحصص التعويضية)
CREATE TABLE IF NOT EXISTS public.makeup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id),
  original_attendance_id UUID REFERENCES public.attendance_records(id),
  requested_group_id UUID REFERENCES public.student_groups(id),
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SAFETY & MISCONDUCT REPORTS TABLE (بلاغات وشكاوى الأمان)
CREATE TABLE IF NOT EXISTS public.safety_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id),
  report_type TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_investigation', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) FOR PUBLIC ACCESS (OR POLICIES)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.makeup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read & write for app usage (Standard starter policies)
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public read tutors" ON public.tutor_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert tutors" ON public.tutor_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tutors" ON public.tutor_profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public read groups" ON public.student_groups FOR SELECT USING (true);
CREATE POLICY "Allow public insert groups" ON public.student_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update groups" ON public.student_groups FOR UPDATE USING (true);

CREATE POLICY "Allow public read enrollments" ON public.group_enrollments FOR SELECT USING (true);
CREATE POLICY "Allow public insert enrollments" ON public.group_enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update enrollments" ON public.group_enrollments FOR UPDATE USING (true);

CREATE POLICY "Allow public read attendance" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Allow public insert attendance" ON public.attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update attendance" ON public.attendance_records FOR UPDATE USING (true);

CREATE POLICY "Allow public read bookings" ON public.booking_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert bookings" ON public.booking_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update bookings" ON public.booking_requests FOR UPDATE USING (true);

CREATE POLICY "Allow public read disputes" ON public.attendance_disputes FOR SELECT USING (true);
CREATE POLICY "Allow public insert disputes" ON public.attendance_disputes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read makeups" ON public.makeup_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert makeups" ON public.makeup_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read reports" ON public.safety_reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert reports" ON public.safety_reports FOR INSERT WITH CHECK (true);

-- 11. LEGACY APP DOCUMENTS (Supabase replacement for all former Firestore collections)
CREATE TABLE IF NOT EXISTS public.app_documents (
  collection_name TEXT NOT NULL,
  document_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_name, document_id)
);

CREATE INDEX IF NOT EXISTS idx_app_documents_collection ON public.app_documents(collection_name);
CREATE INDEX IF NOT EXISTS idx_app_documents_updated_at ON public.app_documents(updated_at DESC);
ALTER TABLE public.app_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_app_documents" ON public.app_documents;
DROP POLICY IF EXISTS "authenticated_write_app_documents" ON public.app_documents;
DROP POLICY IF EXISTS "public_read_app_documents" ON public.app_documents;
DROP POLICY IF EXISTS "public_write_app_documents" ON public.app_documents;
CREATE POLICY "public_read_app_documents" ON public.app_documents
  FOR SELECT USING (true);
CREATE POLICY "public_write_app_documents" ON public.app_documents
  FOR ALL
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_app_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_documents_updated_at ON public.app_documents;
CREATE TRIGGER trg_app_documents_updated_at
BEFORE UPDATE ON public.app_documents
FOR EACH ROW EXECUTE FUNCTION public.set_app_documents_updated_at();
