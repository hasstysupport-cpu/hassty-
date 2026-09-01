/* ============================================================
   Hassty Auth — Supabase REST / Admin-API helpers (serverless)
   Uses the service key server-side only. Never exposed to client.
   ============================================================ */
import { SUPABASE_URL, SERVICE_KEY } from './config.js';

const authHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

/* ---------- GoTrue Admin API ---------- */

async function authFetch(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method,
    headers: authHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { status: res.status, ok: res.ok, data };
}

export function getUserById(userId) {
  return authFetch(`admin/users/${userId}`);
}

export function createUser(payload) {
  return authFetch('admin/users', { method: 'POST', body: payload });
}

export function updateUserById(userId, payload) {
  return authFetch(`admin/users/${userId}`, { method: 'PUT', body: payload });
}

export function deleteUser(userId) {
  return authFetch(`admin/users/${userId}`, { method: 'DELETE' });
}

export function signOutAllSessions(userId) {
  return authFetch(`admin/users/${userId}/signouts`, { method: 'POST', body: {} });
}

export function listUsers({ page = 1, perPage = 100 } = {}) {
  return authFetch(`admin/users?page=${page}&per_page=${perPage}`);
}

/* ---------- PostgREST (service role, bypasses RLS) ---------- */

async function dbFetch(path, { method = 'GET', body, query = '', prefer } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}${query}`, {
    method,
    headers: {
      ...authHeaders,
      Prefer: prefer || (body ? 'return=representation' : 'return=minimal'),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  return { status: res.status, ok: res.ok, data };
}

export function dbSelect(table, params = {}) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return dbFetch(table, { query: qs ? `?${qs}` : '' });
}

export function dbInsert(table, rows) {
  return dbFetch(table, { method: 'POST', body: rows });
}

/* Insert ignoring unique conflicts (on_conflict cols required) */
export function dbInsertIgnoreConflict(table, rows, conflictCols) {
  return dbFetch(table, {
    method: 'POST',
    body: rows,
    query: `?on_conflict=${conflictCols}`,
    prefer: 'return=minimal, resolution=ignore-duplicates',
  });
}

/* Upsert merging duplicates (on_conflict cols required) */
export function dbUpsert(table, rows, conflictCols) {
  return dbFetch(table, {
    method: 'POST',
    body: rows,
    query: `?on_conflict=${conflictCols}`,
    prefer: 'return=representation, resolution=merge-duplicates',
  });
}

export function dbUpdate(table, values, filterQuery) {
  return dbFetch(`${table}?${filterQuery}`, { method: 'PATCH', body: values });
}

export function dbDelete(table, filterQuery) {
  return dbFetch(`${table}?${filterQuery}`, { method: 'DELETE' });
}

/* ---------- Lookup helpers ---------- */

/* Find a verified user's id by email via profiles table */
export async function findProfileByEmail(email) {
  const { ok, data } = await dbSelect('profiles', {
    select: 'id,full_name,phone,email,role,avatar_url,qr_code,governorate,city,grade,account_status,metadata',
    email: `eq.${email}`,
    limit: '1',
  });
  return ok && Array.isArray(data) && data.length ? data[0] : null;
}

/* Find a pending (unverified) registration by email */
export async function findPendingByEmail(email) {
  const { ok, data } = await dbSelect('auth_pending_users', {
    select: 'email,user_id,role,created_at',
    email: `eq.${email}`,
    limit: '1',
  });
  return ok && Array.isArray(data) && data.length ? data[0] : null;
}

/* Last-resort lookup: scan auth.users via admin API (handles legacy stuck accounts) */
export async function findAuthUserByEmail(email, maxPages = 6) {
  for (let page = 1; page <= maxPages; page++) {
    const { ok, data } = await listUsers({ page, perPage: 200 });
    if (!ok || !data?.users?.length) return null;
    const found = data.users.find((u) => String(u.email || '').toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 200) return null;
  }
  return null;
}

/* Verify a caller's access token via GoTrue and return the user (or null) */
export async function getCallerUser(accessToken) {
  if (!accessToken) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
