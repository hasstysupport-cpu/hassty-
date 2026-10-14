/**
 * Shared authentication and profile lookups for WhatsApp routes.
 * This module deliberately has no WhatsApp-provider dependency.
 */
import { getCallerUser, dbSelect } from '../supabase.js';

const INTERNAL_SECRET = String(process.env.WHATSAPP_INTERNAL_SECRET || '');
const QUEUE_WORKER_SECRET = String(process.env.WHATSAPP_QUEUE_WORKER_SECRET || '');

export async function internalOrUser(req, roles = []) {
  const supplied = String(req.headers['x-whatsapp-internal-secret'] || '');
  if ((INTERNAL_SECRET && supplied === INTERNAL_SECRET) ||
      (QUEUE_WORKER_SECRET && supplied === QUEUE_WORKER_SECRET)) return { internal: true };

  const auth = String(req.headers.authorization || '');
  const token = auth.replace(/^Bearer\\s+/i, '');
  if (!token) return null;
  return getCallerUser(token).then(async (user) => {
    if (!user?.id) return null;
    const { ok, data } = await dbSelect('profiles', {
      select: 'id,full_name,phone,role,account_status', id: `eq.${user.id}`, limit: '1'
    });
    const profile = ok && data?.[0] ? data[0] : null;
    if (!profile || (roles.length && !roles.includes(profile.role)) || profile.account_status === 'suspended') return null;
    return { user, profile, internal: false };
  });
}

export async function findProfile(userId) {
  const { ok, data } = await dbSelect('profiles', {
    select: 'id,full_name,phone,role,qr_code,grade,city', id: `eq.${userId}`, limit: '1'
  });
  return ok && data?.[0] ? data[0] : null;
}

function normalizePhone(value) {
  let phone = String(value || '').replace(/\\D/g, '');
  if (phone.startsWith('0020')) phone = phone.slice(2);
  if (phone.startsWith('0')) phone = `20${phone.slice(1)}`;
  if (!phone.startsWith('20') && phone.length === 10) phone = `20${phone}`;
  return phone;
}

export async function findProfileByPhone(phone) {
  const clean = normalizePhone(phone);
  const values = [phone, clean, `+${clean}`, `0${clean.slice(2)}`].filter(Boolean);
  for (const value of values) {
    const { ok, data } = await dbSelect('profiles', {
      select: 'id,full_name,phone,role,grade,city,qr_code', phone: `eq.${value}`, limit: '1'
    });
    if (ok && data?.[0]) return data[0];
  }
  return null;
}
