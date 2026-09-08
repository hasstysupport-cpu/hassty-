import { SITE_URL, SUPABASE_URL, SERVICE_KEY } from '../_lib/config.js';
import { getCallerUser, dbSelect } from '../_lib/supabase.js';

const GREEN_API_URL = String(process.env.GREEN_API_URL || '').replace(/\/$/, '');
const GREEN_API_INSTANCE_ID = String(process.env.GREEN_API_INSTANCE_ID || '');
const GREEN_API_TOKEN = String(process.env.GREEN_API_TOKEN || '');
const GREEN_API_WEBHOOK_TOKEN = String(process.env.GREEN_API_WEBHOOK_TOKEN || '');
const INTERNAL_SECRET = String(process.env.WHATSAPP_INTERNAL_SECRET || '');

export function assertGreenConfig() {
  if (!GREEN_API_URL || !GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) throw new Error('GREEN API غير مهيأ: تحقق من GREEN_API_URL و GREEN_API_INSTANCE_ID و GREEN_API_TOKEN.');
}

export function normalizePhone(value) {
  let s = String(value || '').replace(/\D/g, '');
  if (s.startsWith('0020')) s = s.slice(2);
  if (s.startsWith('0')) s = `20${s.slice(1)}`;
  if (!s.startsWith('20') && s.length === 10) s = `20${s}`;
  return s;
}

export function chatId(value) {
  const phone = normalizePhone(value);
  if (!phone) throw new Error('رقم واتساب غير صالح.');
  return phone.includes('@') ? phone : `${phone}@c.us`;
}

function endpoint(method) {
  assertGreenConfig();
  return `${GREEN_API_URL}/waInstance${encodeURIComponent(GREEN_API_INSTANCE_ID)}/${method}/${encodeURIComponent(GREEN_API_TOKEN)}`;
}

export async function greenRequest(method, body, httpMethod = 'POST') {
  const response = await fetch(endpoint(method), {
    method: httpMethod,
    headers: { 'Content-Type': 'application/json' },
    body: httpMethod === 'GET' ? undefined : JSON.stringify(body || {}),
    signal: AbortSignal.timeout(12000),
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) {
    const message = data?.message || data?.error || `GREEN API HTTP ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function sendText(number, message) {
  return greenRequest('sendMessage', { chatId: chatId(number), message: String(message || '') });
}

export async function sendFile(number, url, fileName, caption = '') {
  if (!/^https?:\/\//i.test(String(url || ''))) throw new Error('رابط الملف يجب أن يكون HTTPS عام وقابلًا للوصول.');
  return greenRequest('sendFileByUrl', { chatId: chatId(number), urlFile: url, fileName: fileName || 'hassty-file.pdf', caption });
}

export async function sendLocation(number, latitude, longitude, name = '', address = '') {
  return greenRequest('sendLocation', { chatId: chatId(number), latitude: Number(latitude), longitude: Number(longitude), nameLocation: name, address });
}

export async function sendInteractive(number, { header = '', body, footer = '', buttons = [] }) {
  const mapped = (buttons || []).slice(0, 3).map((b, i) => {
    const type = b.type === 'cta_url' ? 'url' : b.type === 'cta_call' ? 'call' : b.type === 'cta_copy' ? 'copy' : 'reply';
    return {
      type,
      buttonId: String(b.id || b.buttonId || `btn_${i + 1}`),
      buttonText: String(b.text || b.buttonText || `اختيار ${i + 1}`).slice(0, 25),
      ...(b.copy_code ? { copyCode: String(b.copy_code) } : {}),
      ...(b.url ? { url: String(b.url) } : {}),
      ...(b.phone_number ? { phoneNumber: normalizePhone(b.phone_number) } : {}),
    };
  });
  return greenRequest('sendInteractiveButtons', { chatId: chatId(number), header, body, footer, buttons: mapped });
}

export async function configureWebhook() {
  const webhookUrl = `${SITE_URL.replace(/\/$/, '')}/api/whatsapp/webhook`;
  return greenRequest('setSettings', {
    webhookUrl,
    webhookUrlToken: GREEN_API_WEBHOOK_TOKEN,
    delaySendMessagesMilliseconds: Number(process.env.GREEN_API_SEND_DELAY_MS || 700),
    incomingWebhook: 'yes',
    outgoingWebhook: 'yes',
    outgoingAPIMessageWebhook: 'yes',
    outgoingMessageWebhook: 'yes',
    stateWebhook: 'yes',
    markIncomingMessagesReadedOnReply: 'yes',
  });
}

export async function getGreenState() {
  return greenRequest('getStateInstance', {}, 'GET');
}

export function validWebhookToken(req) {
  if (!GREEN_API_WEBHOOK_TOKEN) return false;
  const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const token = String(req.headers['x-webhook-token'] || auth || '');
  return token === GREEN_API_WEBHOOK_TOKEN;
}

export function internalOrUser(req, roles = []) {
  if (INTERNAL_SECRET && req.headers['x-whatsapp-internal-secret'] === INTERNAL_SECRET) return { internal: true };
  const auth = String(req.headers.authorization || '');
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  return getCallerUser(token).then(async (user) => {
    if (!user?.id) return null;
    const { ok, data } = await dbSelect('profiles', { select: 'id,full_name,phone,role,account_status', id: `eq.${user.id}`, limit: '1' });
    const profile = ok && data?.[0] ? data[0] : null;
    if (!profile) return null;
    if (roles.length && !roles.includes(profile.role)) return null;
    if (profile.account_status === 'suspended') return null;
    return { user, profile, internal: false };
  });
}

export async function findProfile(userId) {
  const { ok, data } = await dbSelect('profiles', { select: 'id,full_name,phone,role,qr_code,grade,city', id: `eq.${userId}`, limit: '1' });
  return ok && data?.[0] ? data[0] : null;
}

export async function findProfileByPhone(phone) {
  const clean = normalizePhone(phone);
  const values = [phone, clean, `+${clean}`, `0${clean.slice(2)}`].filter(Boolean);
  for (const value of values) {
    const { ok, data } = await dbSelect('profiles', { select: 'id,full_name,phone,role,grade,city,qr_code', phone: `eq.${value}`, limit: '1' });
    if (ok && data?.[0]) return data[0];
  }
  return null;
}

export { GREEN_API_WEBHOOK_TOKEN, INTERNAL_SECRET, GREEN_API_URL, GREEN_API_INSTANCE_ID };
