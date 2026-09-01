/* ============================================================
   Hassty Auth — Verification code engine (DB-backed, hashed)
   Flow: issue() creates a 6-digit code (hashed w/ pepper) in the
   DB; verify() validates with attempt limits. No in-memory state.
   ============================================================ */
import crypto from 'crypto';
import { dbSelect, dbInsert, dbUpdate, dbInsertIgnoreConflict } from './supabase.js';
import {
  PEPPER,
  CODE_TTL_MINUTES,
  CODE_RESEND_COOLDOWN,
  CODE_MAX_ATTEMPTS,
  CODE_WINDOW_HOURS,
  CODE_MAX_PER_WINDOW,
} from './config.js';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const hashCode = (email, code) => sha256(`${String(email).toLowerCase()}::${code}::${PEPPER}`);
export const hashDevice = (userId, deviceId) => sha256(`device::${userId}::${deviceId}::${PEPPER}`);

const genCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

const iso = (msFromNow) => new Date(Date.now() + msFromNow).toISOString();

/* ---------- Issue a code ----------
   Returns { code, expiresInSeconds }
   Throws { status, error, waitSeconds } on rate limits. */
export async function issueCode({ email, userId, purpose, ip }) {
  const cleanEmail = String(email).toLowerCase().trim();

  // 1) cooldown — last code for this email+purpose must be older than 60s
  const { data: recent } = await dbSelect('auth_verification_codes', {
    select: 'created_at',
    email: `eq.${cleanEmail}`,
    purpose: `eq.${purpose}`,
    order: 'created_at.desc',
    limit: '1',
  });
  if (recent?.length) {
    const lastMs = Date.parse(recent[0].created_at);
    const age = (Date.now() - lastMs) / 1000;
    if (age < CODE_RESEND_COOLDOWN) {
      const wait = Math.ceil(CODE_RESEND_COOLDOWN - age);
      throw { status: 429, error: 'cooldown', waitSeconds: wait, message: `يرجى الانتظار ${wait} ثانية قبل طلب رمز جديد.` };
    }
  }

  // 2) window limit — max N codes per email+purpose per 6h
  const since = new Date(Date.now() - CODE_WINDOW_HOURS * 3600 * 1000).toISOString();
  const { data: windowRows } = await dbSelect('auth_verification_codes', {
    select: 'id',
    email: `eq.${cleanEmail}`,
    purpose: `eq.${purpose}`,
    created_at: `gte.${since}`,
    limit: '100',
  });
  if ((windowRows?.length || 0) >= CODE_MAX_PER_WINDOW) {
    throw { status: 429, error: 'rate_limit', message: `تم تجاوز الحد المسموح (${CODE_MAX_PER_WINDOW} رموز خلال ${CODE_WINDOW_HOURS} ساعات). حاول لاحقًا.` };
  }

  // 3) invalidate previous unconsumed codes for this email+purpose
  await dbUpdate(
    'auth_verification_codes',
    { consumed_at: new Date().toISOString() },
    `email=eq.${cleanEmail}&purpose=eq.${purpose}&consumed_at=is.null`
  );

  // 4) create the new code
  const code = genCode();
  const { error: insertError } = await dbInsert('auth_verification_codes', [{
    email: cleanEmail,
    user_id: userId || null,
    purpose,
    code_hash: hashCode(cleanEmail, code),
    expires_at: iso(CODE_TTL_MINUTES * 60 * 1000),
    ip: ip || null,
  }]);
  if (insertError) throw { status: 500, error: 'insert_failed', message: 'تعذر إنشاء رمز التحقق.' };

  return { code, expiresInSeconds: CODE_TTL_MINUTES * 60 };
}

/* ---------- Verify a code ----------
   Returns { ok, userId? }
   Failure: { ok:false, reason: 'expired'|'wrong'|'exhausted'|'not_found' } */
export async function verifyCode({ email, code, purpose }) {
  const cleanEmail = String(email).toLowerCase().trim();
  const cleanCode = String(code || '').replace(/\D/g, '');
  if (cleanCode.length !== 6) return { ok: false, reason: 'wrong' };

  const { data: rows } = await dbSelect('auth_verification_codes', {
    select: 'id,user_id,code_hash,expires_at,consumed_at,attempts',
    email: `eq.${cleanEmail}`,
    purpose: `eq.${purpose}`,
    order: 'created_at.desc',
    limit: '1',
  });
  const row = rows?.[0];
  if (!row || row.consumed_at) return { ok: false, reason: 'not_found' };

  if (Date.parse(row.expires_at) < Date.now()) {
    await dbUpdate('auth_verification_codes', { consumed_at: new Date().toISOString() }, `id=eq.${row.id}`);
    return { ok: false, reason: 'expired' };
  }

  if ((row.attempts || 0) >= CODE_MAX_ATTEMPTS) {
    await dbUpdate('auth_verification_codes', { consumed_at: new Date().toISOString() }, `id=eq.${row.id}`);
    return { ok: false, reason: 'exhausted' };
  }

  const hashed = hashCode(cleanEmail, cleanCode);
  const match =
    hashed.length === (row.code_hash || '').length &&
    crypto.timingSafeEqual(Buffer.from(hashed), Buffer.from(row.code_hash || 'x'.repeat(hashed.length)));

  if (!match) {
    await dbUpdate('auth_verification_codes', { attempts: (row.attempts || 0) + 1 }, `id=eq.${row.id}`);
    return { ok: false, reason: 'wrong', attemptsLeft: Math.max(0, CODE_MAX_ATTEMPTS - (row.attempts || 0) - 1) };
  }

  await dbUpdate('auth_verification_codes', { consumed_at: new Date().toISOString() }, `id=eq.${row.id}`);
  return { ok: true, userId: row.user_id };
}

/* ---------- Trusted devices ---------- */
export async function isTrustedDevice(userId, deviceId) {
  if (!userId || !deviceId) return false;
  const { data } = await dbSelect('auth_trusted_devices', {
    select: 'id,expires_at',
    user_id: `eq.${userId}`,
    device_hash: `eq.${hashDevice(userId, deviceId)}`,
    limit: '1',
  });
  if (!data?.length) return false;
  return Date.parse(data[0].expires_at) > Date.now();
}

export async function trustDevice({ userId, deviceId, userAgent, days = 30 }) {
  if (!userId || !deviceId) return;
  const dh = hashDevice(userId, deviceId);
  const expires = iso(days * 24 * 3600 * 1000);
  await dbUpdate(
    'auth_trusted_devices',
    { expires_at: expires, user_agent: (userAgent || '').slice(0, 250) },
    `user_id=eq.${userId}&device_hash=eq.${dh}`
  );
  await dbInsertIgnoreConflict('auth_trusted_devices', [{
    user_id: userId,
    device_hash: dh,
    user_agent: (userAgent || '').slice(0, 250),
    expires_at: expires,
  }], 'user_id,device_hash');
}
