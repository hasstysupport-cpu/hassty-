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
import crypto from 'crypto';
import {
  dbSelect, dbUpdate, dbInsert, findProfileByEmail, findAuthUserByEmail, createUser,
} from './supabase.js';

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

/** كتابة القايمة كاملة داخل metadata بروفايل المالك
 *  (مع تهيئة حساب المالك تلقائيًا إن لم يوجد — قاعدة فاضية تعمل) */
export async function setAdminWhitelist(list) {
  const clean = sanitizeList(list);
  let profile = await findProfileByEmail(OWNER_EMAIL);
  if (!profile?.id) {
    await ensureAdminAccount(OWNER_EMAIL).catch(() => {});
    profile = await findProfileByEmail(OWNER_EMAIL);
  }
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

/* ============================================================
   ensureAdminAccount — تهيئة حساب إداري حقيقي تلقائيًا
   ------------------------------------------------------------
   يضمن أن أي بريد مصرح له إداريًا له:
   1) حساب auth حقيقي في Supabase (password عشوائي + email_confirm)
   2) صف profiles حقيقي (ينشئه تريجر handle_new_auth_user تلقائيًا،
      وننشئه يدويًا كحل احتياطي إن لم يصل التريجر)
   يُستدعى قبل إرسال رمز الدخول الإداري وقبل إضافة إيميل للقايمة —
   بهذا تعمل إضافة الأدمن والدخول الإداري حتى بقاعدة بيانات فاضية تمامًا.
   ============================================================ */
export async function ensureAdminAccount(email) {
  const clean = normalizeEmail(email);
  if (!isValidEmail(clean)) return { ok: false, error: 'invalid_email' };

  // 1) حساب auth موجود؟
  let authUser = await findAuthUserByEmail(clean);
  if (!authUser?.id) {
    const password = crypto.randomBytes(24).toString('base64url');
    const res = await createUser({
      email: clean,
      password,
      email_confirm: true,
      user_metadata: { role: 'admin', full_name: 'إدارة حِصّتي' },
    });
    if (!res.ok) {
      // سباق بسيط: لو أُنشئ بالتوازي نحاول قراءته مرة أخرى
      authUser = await findAuthUserByEmail(clean);
      if (!authUser?.id) return { ok: false, error: 'create_user_failed', status: res.status };
    } else {
      authUser = res.data;
    }
  }
  const userId = authUser.id;

  // 2) بروفايل موجود؟ (التريجر ينشئه — نتحقق وننشئه احتياطيًا إن لزم)
  let profile = await findProfileByEmail(clean);
  if (!profile?.id) {
    await new Promise((r) => setTimeout(r, 700));
    profile = await findProfileByEmail(clean);
    if (!profile?.id) {
      const ins = await dbInsert('profiles', {
        id: userId,
        email: clean,
        full_name: 'إدارة حِصّتي',
        phone: null,
        role: 'admin',
        account_status: 'active',
        metadata: {
          role: 'admin',
          authProvider: 'server_provisioned',
          onboardingComplete: true,
          isVerified: true,
          verificationStatus: 'not_required',
        },
      });
      if (!ins.ok) return { ok: false, error: 'profile_insert_failed' };
      profile = await findProfileByEmail(clean);
    }
  }

  // 3) ترقية الدور إلى admin (هادئ — بعض التريجرات قد تمنع غيرها)
  await setProfileRoleByEmail(clean, 'admin').catch(() => {});
  return { ok: true, userId: profile?.id || userId, email: clean, created: true };
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
