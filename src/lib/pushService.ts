/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/**
 * Hassty Web Push (browser notifications).
 * يطلب إذن الإشعارات، يسجّل الـ Service Worker، ويشترك في Web Push
 * عبر مفاتيح VAPID المستضافة في الخادم (/api/push/subscribe)،
 * ويعرض إشعارات محلية للإشعارات الداخلية والماستر مفتوح في الخلفية.
 */
import { supabase } from './supabase';

export type PushState = 'enabled' | 'blocked' | 'prompt' | 'unsupported';

const LS_ENABLED = 'hassty_push_enabled';
const LS_DECLINED_AT = 'hassty_push_declined_at';
const LS_AUTOASK_AT = 'hassty_push_autoask_at';
const SS_AUTOASK_DONE = 'hassty_push_autoask_done';
const DECLINE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // تهدئة يوم واحد بعد "لاحقًا"
const AUTOASK_COOLDOWN_MS = 24 * 60 * 60 * 1000; // الطلب التلقائي مرة كل 24 ساعة كحد أقصى

/**
 * هل يمكن طلب إذن الإشعارات الآن؟ (الإذن لا يزال «افتراضيًا» وليس في فترة تهدئة)
 * تُستخدم لآلية الطلب التلقائي: أول نقرة للمستخدم بعد الدخول تُطلق نافذة المتصفح.
 */
export function canAskBrowserPermissionNow(): boolean {
  if (!isPushSupported() || typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'default') return false;
  if (wasPushDeclinedRecently()) return false;
  try {
    if (sessionStorage.getItem(SS_AUTOASK_DONE) === '1') return false;
    const at = Number(localStorage.getItem(LS_AUTOASK_AT) || 0);
    if (at > 0 && Date.now() - at < AUTOASK_COOLDOWN_MS) return false;
  } catch { /* ignore */ }
  return true;
}

/** توثيق نتيجة محاولة طلب الإذن (منع التكرار المزعج + تهدئة عند الرفض) */
export function noteBrowserPermissionAskResult(ok: boolean, denied: boolean): void {
  try {
    sessionStorage.setItem(SS_AUTOASK_DONE, '1');
    localStorage.setItem(LS_AUTOASK_AT, String(Date.now()));
    if (denied) localStorage.setItem(LS_DECLINED_AT, String(Date.now()));
    if (ok) {
      localStorage.setItem(LS_ENABLED, '1');
      localStorage.removeItem(LS_DECLINED_AT);
    }
  } catch { /* ignore */ }
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    window.isSecureContext
  );
}

export function wasPushDeclinedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(LS_DECLINED_AT) || 0);
    return at > 0 && Date.now() - at < DECLINE_COOLDOWN_MS;
  } catch {
    return false;
  }
}

export async function getPushState(): Promise<PushState> {
  if (!isPushSupported()) return 'unsupported';
  const permission = Notification.permission;
  if (permission === 'denied') return 'blocked';
  if (permission !== 'granted') return 'prompt';
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    return sub ? 'enabled' : 'prompt';
  } catch {
    return 'prompt';
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* بدون جلسة */ }
  return headers;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) throw new Error('المتصفح لا يدعم Service Worker.');
  return navigator.serviceWorker.register('/sw.js');
}

/**
 * تشغيل إشعارات المتصفح بالكامل: إذن + اشتراك Push + حفظه في الخادم.
 * يجب استدعاؤها من نقرة مستخدم (متطلب المتصفحات).
 */
export async function enablePushNotifications(): Promise<{ ok: boolean; state: PushState; error?: string }> {
  if (!isPushSupported()) return { ok: false, state: 'unsupported', error: 'متصفحك لا يدعم إشعارات الويب.' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    if (permission === 'denied') {
      try {
        localStorage.setItem(LS_DECLINED_AT, String(Date.now()));
        sessionStorage.setItem(SS_AUTOASK_DONE, '1');
      } catch { /* ignore */ }
    }
    return { ok: false, state: permission === 'denied' ? 'blocked' : 'prompt', error: 'لم يتم السماح بالإشعارات.' };
  }

  try {
    const registration = await registerServiceWorker();

    // مفتاح VAPID العام من الخادم
    const cfgRes = await fetch('/api/push/subscribe');
    const cfg = await cfgRes.json().catch(() => ({}));
    const publicKey = cfg?.publicKey || cfg?.data?.publicKey;
    if (!publicKey) throw new Error('خدمة الإشعارات غير مهيأة حاليًا.');

    const existing = await registration.pushManager.getSubscription();
    const subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(subscription.toJSON()),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.ok !== true) throw new Error(json?.error || 'فشل حفظ الاشتراك في الخادم.');

    try { localStorage.setItem(LS_ENABLED, '1'); localStorage.removeItem(LS_DECLINED_AT); } catch { /* ignore */ }
    return { ok: true, state: 'enabled' };
  } catch (err: any) {
    return { ok: false, state: 'blocked', error: err?.message || 'تعذر تفعيل الإشعارات.' };
  }
}

/** إلغاء الاشتراك من إشعارات المتصفح */
export async function disablePushNotifications(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: await authHeaders(),
        body: JSON.stringify({ endpoint: sub.endpoint }),
      }).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    }
    try { localStorage.removeItem(LS_ENABLED); } catch { /* ignore */ }
  } catch { /* best-effort */ }
}

/* ---------- إشعارات محلية (للإشعارات الداخلية عند فتح الموقع في تاب خلفي) ---------- */

export async function showLocalNotification(title: string, body: string, link?: string | null, tag?: string): Promise<void> {
  if (!isPushSupported() || Notification.permission !== 'granted') return;
  try {
    const reg = (await navigator.serviceWorker.getRegistration('/sw.js')) || (await registerServiceWorker());
    const options: NotificationOptions & { renotify?: boolean } = {
      body: body || '',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      dir: 'rtl',
      lang: 'ar',
      tag: tag || `hassty-local-${Date.now()}`,
      renotify: Boolean(tag),
      data: { link: link || '/' },
    };
    await reg.showNotification(title || 'منصة حِصّتي', options);
  } catch { /* best-effort */ }
}

/* الاستماع لنقرات الإشعارات من الـ SW (تركّز الصفحة ثم التنقل للرابط) */
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event?.data as { type?: string; link?: string } | undefined;
      if (data?.type === 'hassty-navigate' && data.link) {
        window.location.assign(data.link);
      }
    });
  } catch { /* ignore */ }
}
