/* ============================================================
   Hassty Web Push — VAPID + subscription store (serverless)
   ============================================================
   اشتراكات إشعارات المتصفح تُخزَّن في profiles.metadata.push_subs
   (JSONB) — بدون جدول جديد ولا أي تعديل على قاعدة البيانات:
   [
     { endpoint, keys: { p256dh, auth }, ua, ts }
   ]
   الكل يتم عبر مفتاح الخدمة (service role) من الخادم فقط.
   ============================================================ */
import webpush from 'web-push';
import { SITE_URL } from './config.js';
import { dbSelect, dbUpdate } from './supabase.js';

const VAPID_PUBLIC_KEY = String(process.env.VAPID_PUBLIC_KEY || '');
const VAPID_PRIVATE_KEY = String(process.env.VAPID_PRIVATE_KEY || '');
const VAPID_SUBJECT = String(process.env.VAPID_SUBJECT || 'mailto:hasstysupport@gmail.com');

const MAX_SUBS_PER_USER = 6;

let vapidReady = false;
function ensureVapid() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) throw new Error('VAPID غير مهيأ: أضف VAPID_PUBLIC_KEY و VAPID_PRIVATE_KEY.');
  if (!vapidReady) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidReady = true;
  }
}

export function vapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

/* Read the whole profile metadata (read-modify-write-safe) */
async function readProfileMeta(userId) {
  const { ok, data } = await dbSelect('profiles', { select: 'id,metadata', id: `eq.${userId}`, limit: '1' });
  if (!ok || !Array.isArray(data) || !data.length) return null;
  const meta = data[0]?.metadata || {};
  if (!Array.isArray(meta.push_subs)) meta.push_subs = [];
  return meta;
}

export async function getPushSubscriptions(userId) {
  const meta = await readProfileMeta(userId);
  return meta ? meta.push_subs : [];
}

export async function savePushSubscription(userId, subscription, userAgent = '') {
  if (!userId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    throw new Error('بيانات اشتراك الإشعارات غير مكتملة.');
  }
  const meta = await readProfileMeta(userId);
  if (!meta) throw new Error('حساب المستخدم غير موجود.');

  const entry = {
    endpoint: String(subscription.endpoint),
    keys: { p256dh: String(subscription.keys.p256dh), auth: String(subscription.keys.auth) },
    ua: String(userAgent || '').slice(0, 180),
    ts: Date.now(),
  };
  meta.push_subs = [
    ...meta.push_subs.filter((s) => s?.endpoint !== entry.endpoint),
    entry,
  ].slice(-MAX_SUBS_PER_USER); // الأحدث يبقى — نظّف الاشتراكات القديمة الزائدة

  const { ok } = await dbUpdate('profiles', { metadata: meta }, `id=eq.${userId}`);
  if (!ok) throw new Error('تعذر حفظ اشتراك الإشعارات.');
  return entry;
}

export async function removePushSubscription(userId, endpoint) {
  if (!userId || !endpoint) return;
  const meta = await readProfileMeta(userId);
  if (!meta || !meta.push_subs.length) return;
  const next = meta.push_subs.filter((s) => s?.endpoint !== endpoint);
  if (next.length === meta.push_subs.length) return;
  meta.push_subs = next;
  await dbUpdate('profiles', { metadata: meta }, `id=eq.${userId}`);
}

/* إرسال Web Push لكل أجهزة المستخدم — لا يرمي أخطاء (best-effort)
   وينظّف الاشتراكات الميتة (404/410 = أُلغيت أو انتهت) */
export async function sendPushToUser(userId, payload = {}) {
  const subs = await getPushSubscriptions(userId).catch(() => []);
  const result = { sent: 0, total: subs.length, deadEndpoints: [] };
  if (!subs.length) return result;
  try { ensureVapid(); } catch { return result; }

  const body = JSON.stringify({
    title: payload.title || 'منصة حِصّتي',
    body: payload.body || 'لديك تحديث جديد في منصة حِصّتي',
    link: payload.link || '/',
    tag: payload.tag || 'hassty',
    icon: `${SITE_URL.replace(/\/$/, '')}/icon-192.png`,
    badge: `${SITE_URL.replace(/\/$/, '')}/icon-96.png`,
  });

  await Promise.allSettled(subs.map(async (sub) => {
    if (!sub?.endpoint || !sub?.keys) return;
    try {
      await webpush.sendNotification(sub, body);
      result.sent += 1;
    } catch (err) {
      const status = err?.statusCode || 0;
      if (status === 404 || status === 410) {
        result.deadEndpoints.push(sub.endpoint);
      }
    }
  }));

  if (result.deadEndpoints.length) {
    for (const endpoint of result.deadEndpoints) {
      await removePushSubscription(userId, endpoint).catch(() => {});
    }
  }
  return result;
}
