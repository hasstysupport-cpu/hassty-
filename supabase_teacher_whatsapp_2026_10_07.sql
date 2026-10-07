/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

-- ============================================================
-- واتساب المدرس (Evolution API) — 2026-10-07
-- جدول ربط رقم واتساب خاص بكل مدرس (علاقة 1 → 1)
-- كل القراءات/الكتابات تتم حصريًا عبر /api/whatsapp/* بالـ
-- service role؛ لا سياسات RLS للعملاء إطلاقًا حتى عمود
-- instance_token (سرّي) لا يمكن أن يصل للمتصفح.
-- ============================================================

create table if not exists public.teacher_whatsapp_instances (
  id                uuid primary key default gen_random_uuid(),
  teacher_id        uuid not null references public.profiles(id) on delete cascade,
  instance_name     text not null unique,
  instance_token    text,
  phone_number      text,
  status            text not null default 'disconnected',
  status_message    text,
  connected_at      timestamptz,
  last_status_check timestamptz,
  pending_expires_at timestamptz,
  pending_phone_number text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint teacher_whatsapp_one_per_teacher unique (teacher_id),
  constraint teacher_whatsapp_status_chk
    check (status in ('connecting', 'qr_pending', 'connected', 'disconnected', 'error'))
);

create index if not exists teacher_whatsapp_instances_teacher_idx
  on public.teacher_whatsapp_instances (teacher_id);

create index if not exists teacher_whatsapp_pending_expiry_idx
  on public.teacher_whatsapp_instances (pending_expires_at);

alter table public.teacher_whatsapp_instances enable row level security;

-- لا تضاف أي سياسة للعملاء: RLS مفعّل بلا سياسات = الجدول محجوب
-- تمامًا لكل الأدوار عبر مفاتيح anon/authenticated. جميع العمليات
-- تمر من Hassty API بالـ service role بعد التحقق من الجلسة، و
-- teacherId يُستخرج من الـ Session ولا يُؤخذ من الواجهة أبدًا.
