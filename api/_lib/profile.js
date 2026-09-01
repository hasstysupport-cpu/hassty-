/* ============================================================
   Hassty Auth — Profile provisioning (server-side, service role)
   Works WITH the existing DB triggers:
   - handle_new_auth_user() auto-creates profiles on user insert
     (from user_metadata) — we only complete what it misses.
   - protect_profile_privileged_fields() blocks role changes via
     UPDATE for non-admins → role fixes require DELETE + re-INSERT.
   ============================================================ */
import crypto from 'crypto';
import { dbInsert, dbDelete, dbSelect, dbInsertIgnoreConflict, dbUpsert, dbUpdate } from './supabase.js';

const clean = (v) => (typeof v === 'string' ? v.trim() : v ?? null);

export function buildStudentQr(userId) {
  return `HASSTY-${String(userId).replace(/-/g, '').slice(0, 10).toUpperCase()}`;
}

const baseMetadata = (data, role) => ({
  authProvider: data.authProvider || 'email',
  subject: clean(data.subject) || '',
  experienceYears: clean(data.experienceYears) || '',
  parentPhone: clean(data.parentPhone) || '',
  onboardingComplete: true,
  isVerified: false,
  verificationStatus: role === 'teacher' || role === 'assistant' ? 'pending' : 'not_required',
  signupConsent: {
    terms: true,
    privacy: true,
    acceptedAt: data.consentAcceptedAt || new Date().toISOString(),
  },
});

const fullProfileRow = ({ userId, email, role, data }) => ({
  id: userId,
  email: String(email).toLowerCase(),
  full_name: clean(data.fullName),
  phone: clean(data.phone),
  role,
  avatar_url: clean(data.avatarUrl) || null,
  governorate: clean(data.governorate) || null,
  city: clean(data.city) || null,
  grade: clean(data.grade) || null,
  account_status: 'active',
  qr_code: role === 'student' ? buildStudentQr(userId) : null,
  metadata: baseMetadata(data, role),
});

/* Fresh INSERT (used when the profile row is missing or must be recreated) */
export async function createProfile(args) {
  const row = fullProfileRow(args);
  const { ok, status, data } = await dbInsert('profiles', row);
  if (!ok) {
    const details = JSON.stringify(data || {});
    if (details.includes('profiles_phone_key')) {
      throw {
        status: 422,
        error: 'phone_taken',
        message: 'رقم الهاتف مسجل بالفعل لحساب آخر. لو كان حسابك فاستخدم بريده، أو تواصل مع الدعم.',
      };
    }
    throw {
      status: 500,
      error: 'profile_insert_failed',
      message: 'تعذر إنشاء ملف الحساب.',
      details: details.slice(0, 300) + ` (HTTP ${status})`,
    };
  }
  return row;
}

/* Pre-check: is this phone number already used by another profile? */
export async function isPhoneTaken(phone, exceptEmail) {
  const p = String(phone || '').trim();
  if (!p) return false;
  const { data } = await dbSelect('profiles', {
    select: 'id,email,phone',
    phone: `eq.${p}`,
    limit: '2',
  });
  const rows = data || [];
  const others = exceptEmail ? rows.filter((r) => String(r.email || '').toLowerCase() !== String(exceptEmail).toLowerCase()) : rows;
  return others.length > 0;
}

/* PATCH completion (role untouched — trigger-protected) */
export async function patchProfile({ userId, role, data, existing }) {
  const patch = {
    qr_code: role === 'student' ? buildStudentQr(userId) : null,
    governorate: clean(data.governorate) || existing?.governorate || null,
    city: clean(data.city) || existing?.city || null,
    grade: clean(data.grade) || existing?.grade || null,
    phone: clean(data.phone) || existing?.phone || null,
    full_name: clean(data.fullName) || existing?.full_name || null,
    avatar_url: clean(data.avatarUrl) || existing?.avatar_url || null,
    metadata: { ...(existing?.metadata || {}), ...baseMetadata(data, role) },
  };
  await dbUpdate('profiles', patch, `id=eq.${userId}`);
}

/* Purge role-specific leftovers from any earlier (unverified) signup
   before recreating the profile with a different role. Safe on brand-new
   accounts — verified accounts never reach this path. */
async function purgeRoleLeftovers(userId) {
  await dbDelete('tutor_profiles', `user_id=eq.${userId}`).catch(() => {});
  await dbDelete('assistant_profiles', `user_id=eq.${userId}`).catch(() => {});
  await dbDelete('assistant_verification_requests', `assistant_id=eq.${userId}`).catch(() => {});
}

/* Recreate the auto-created profile row with the CURRENT signup role
   (register recovery path — the DB trigger blocks role UPDATEs). */
export async function resetProfileForRole({ userId, email, role, data }) {
  await purgeRoleLeftovers(userId);
  await dbDelete('profiles', `id=eq.${userId}`);
  return createProfile({ userId, email, role, data });
}

/* Complete the profile whatever state it is in:
   - missing row → INSERT
   - role mismatch (legacy recovery / google default-student) → DELETE + INSERT
   - else → PATCH completion (qr code, location, metadata merge) */
export async function ensureProfile({ userId, email, role, data }) {
  const { data: rows } = await dbSelect('profiles', {
    select: 'id,email,full_name,phone,role,governorate,city,grade,qr_code,avatar_url,metadata',
    id: `eq.${userId}`,
    limit: '1',
  });
  const existing = rows?.[0];

  if (!existing) {
    await createProfile({ userId, email, role, data });
  } else if ((existing.role || 'student') !== role) {
    // role must change → triggers block UPDATE → recreate the row
    // (safe: unverified accounts have no FK references yet; purge defensively)
    await purgeRoleLeftovers(userId);
    await dbDelete('profiles', `id=eq.${userId}`);
    await createProfile({ userId, email, role, data });
  } else {
    await patchProfile({ userId, role, data, existing });
  }
}

/* Teacher extras: tutor_profiles row (searchable teacher profile) */
export async function createTutorProfile({ userId, data }) {
  const subject = clean(data.subject) || 'المادة';
  const grades = clean(data.grade) ? [clean(data.grade)] : [];
  await dbInsertIgnoreConflict('tutor_profiles', [{
    user_id: userId,
    title: `معلم ${subject}`,
    headline: `معلم ${subject}`,
    bio: '',
    subjects: [subject],
    grades,
    experience_years: Number(data.experienceYears) || 0,
    governorate: clean(data.governorate) || null,
    city: clean(data.city) || null,
    price_per_session: 0,
    is_verified: false,
    verification_status: 'pending',
  }], 'user_id');
}

/* Assistant extras: assistant_profiles + verification request + welcome notification */
export async function createAssistantProfile({ userId, email, data }) {
  await dbInsertIgnoreConflict('assistant_profiles', [{
    user_id: userId,
    full_name: clean(data.fullName) || '',
    phone: clean(data.phone) || '',
    whatsapp_phone: clean(data.whatsappPhone) || clean(data.phone) || '',
    governorate: clean(data.governorate) || null,
    city: clean(data.city) || null,
    experience_years: Number(data.experienceYears) || 0,
    experience_summary: clean(data.experienceSummary) || '',
    education: clean(data.education) || '',
    certificate_summary: clean(data.certificateSummary) || '',
    verification_status: 'pending',
    is_verified: false,
  }], 'user_id');

  await dbInsertIgnoreConflict('assistant_verification_requests', [{
    assistant_id: userId,
    status: 'pending',
  }], 'assistant_id');

  await dbInsert('notifications', [{
    user_id: userId,
    title: 'تم استلام طلب المساعد',
    message: 'تم استلام طلب انضمامك كمساعد. سيقوم فريق حِصّتي بالتواصل معك لاستكمال توثيق الهوية والمؤهلات.',
    type: 'verification',
    link: '/assistant/verification',
  }]).catch(() => {});
}

/* Parent extras: link request to a student by QR code / phone */
export async function createParentLinkRequest({ userId, email, data }) {
  const identifier = clean(data.studentJoinCode);
  if (!identifier) return null;

  const candidates = identifier.startsWith('HASSTY-') || identifier.startsWith('STU-')
    ? [identifier]
    : [identifier, `HASSTY-${identifier}`];

  let student = null;
  for (const code of candidates) {
    const { data: rows } = await dbSelect('profiles', {
      select: 'id,full_name,phone,avatar_url,qr_code,grade',
      qr_code: `eq.${code}`,
      role: 'eq.student',
      limit: '1',
    });
    if (rows?.length) { student = rows[0]; break; }
  }
  if (!student) {
    const digits = identifier.replace(/\D/g, '');
    if (digits.length >= 10) {
      const { data: rows } = await dbSelect('profiles', {
        select: 'id,full_name,phone,avatar_url,qr_code,grade',
        phone: `eq.${identifier.trim()}`,
        role: 'eq.student',
        limit: '1',
      });
      if (rows?.length) student = rows[0];
    }
  }
  if (!student) return { linked: false, message: 'لم يتم العثور على طالب بهذا الكود — يمكنك إضافته لاحقًا من لوحة التحكم.' };

  const request = {
    id: crypto.randomUUID(),
    parent_id: userId,
    parent_name: clean(data.fullName) || 'ولي أمر',
    parent_phone: clean(data.phone) || '',
    parent_email: String(email).toLowerCase(),
    parent_avatar_url: null,
    student_id: student.id,
    student_name: student.full_name || 'طالب منصة حِصّتي',
    student_code: student.qr_code || identifier,
    student_grade: student.grade || 'المرحلة الثانوية',
    student_avatar_url: null,
    status: 'pending',
    created_at: new Date().toISOString(),
    responded_at: null,
    decline_reason: null,
  };
  await dbUpsert('parent_link_requests', [request], 'id');
  return { linked: true, message: `تم إرسال طلب ربط بالطالب (${student.full_name || ''}).` };
}
