/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/* ============================================================
   إدارة قايمة إيميلات الإدارة (Admin Whitelist) — بدون أي SQL يدوي
   ------------------------------------------------------------
   - التخزين: metadata.admin_emails داخل بروفايل المالك الرسمي
     (متغير البيئة ADMIN_OFFICIAL_EMAIL) — لا يحتاج جدول جديد.
   - القراءة/الكتابة تتم فقط داخل دوال السيرفر بمفتاح service role،
     ولن يظهر البريد إطلاقًا في حزمة الواجهة (Bundle).
   - بريد المالك الرسمي محمي دائمًا ولا يمكن حذفه من القايمة.
   ============================================================ */
import { dbSelect, dbUpdate, findProfileByEmail } from './supabase.js';

export const OWNER_EMAIL = String(process.env.ADMIN_OFFICIAL_EMAIL || 'hasstysupport@gmail.com')
  .toLowerCase()
  .trim();

export const MAX_ADMINS = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value) {
  return String(value || '').toLowerCase().trim();
}

export function isValidEmail(value) {
  return EMAIL_RE.test(normalizeEmail(value));
}

/** تنظيف القايمة: إيميلات صحيحة فقط + بدون تكرار + المالك أولًا + حد أقصى */
function sanitizeList(list) {
  const out = [];
  for (const item of Array.isArray(list) ? list : []) {
    const email = normalizeEmail(item);
    if (EMAIL_RE.test(email) && !out.includes(email)) out.push(email);
  }
  if (!out.includes(OWNER_EMAIL)) out.unshift(OWNER_EMAIL);
  return out.slice(0, MAX_ADMINS);
}

/** قراءة القايمة الحالية (مع ضمان وجود المالك) */
export async function getAdminWhitelist() {
  const profile = await findProfileByEmail(OWNER_EMAIL);
  const stored = profile?.metadata?.admin_emails;
  if (Array.isArray(stored) && stored.length) return sanitizeList(stored);
  return sanitizeList([]);
}

/** هل هذا البريد مصرح له إداريًا؟ */
export async function isWhitelistedAdmin(email) {
  const clean = normalizeEmail(email);
  if (!clean) return false;
  const list = await getAdminWhitelist();
  return list.includes(clean);
}

/** كتابة القايمة كاملة داخل metadata بروفايل المالك */
export async function setAdminWhitelist(list) {
  const clean = sanitizeList(list);
  const profile = await findProfileByEmail(OWNER_EMAIL);
  if (!profile?.id) return { ok: false, error: 'owner_profile_missing', emails: clean };
  const fresh = await dbSelect('profiles', {
    select: 'id,metadata',
    id: `eq.${profile.id}`,
    limit: '1',
  });
  const metadata = { ...(fresh?.data?.[0]?.metadata || profile.metadata || {}) };
  metadata.admin_emails = clean;
  const { error } = await dbUpdate(
    'profiles',
    { metadata, updated_at: new Date().toISOString() },
    `id=eq.${profile.id}`,
  );
  if (error) return { ok: false, error: error?.message || 'update_failed', emails: clean };
  return { ok: true, emails: clean };
}

/** تغيير دور بروفايل مستخدم بالبريد (ترقية/تخفيض) */
export async function setProfileRoleByEmail(email, role) {
  const clean = normalizeEmail(email);
  if (!clean) return { ok: false, error: 'no_email' };
  const profile = await findProfileByEmail(clean);
  if (!profile?.id) return { ok: false, error: 'profile_not_found' };
  if (profile.role === role) return { ok: true, unchanged: true };
  const { error } = await dbUpdate(
    'profiles',
    { role, updated_at: new Date().toISOString() },
    `id=eq.${profile.id}`,
  );
  return error ? { ok: false, error: error?.message || 'update_failed' } : { ok: true };
}

/** بوابة صلاحية: هل صاحب التوكن أدمن؟ (بريد في القايمة أو دور admin) */
export async function resolveAdminCaller(callerUser) {
  const email = normalizeEmail(callerUser?.email);
  if (!email) return { allowed: false, email: '' };
  if (await isWhitelistedAdmin(email)) return { allowed: true, email };
  const profile = await findProfileByEmail(email);
  if (profile?.role === 'admin') return { allowed: true, email };
  return { allowed: false, email };
}
