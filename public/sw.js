/* ============================================================
   Hassty Service Worker — Web Push notifications
   يستقبل إشعارات المتصفح (push) ويعرضها بالعربي، وعند الضغط
   عليها يفتح/يركّز صفحة المنصة على الرابط المرفق.
   ============================================================ */
const DEFAULT_ICON = '/icon-192.png';
const DEFAULT_BADGE = '/icon-96.png';

self.addEventListener('install', () => {
  // لا ننتظر أي شيء — التفعيل فوري حتى تصل الإشعارات أسرع
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'منصة حِصّتي';
  const options = {
    body: data.body || 'لديك تحديث جديد في منصة حِصّتي',
    icon: data.icon || DEFAULT_ICON,
    badge: data.badge || DEFAULT_BADGE,
    dir: 'rtl',
    lang: 'ar',
    tag: data.tag || 'hassty',
    renotify: Boolean(data.tag),
    requireInteraction: false,
    vibrate: [120, 60, 120],
    data: { link: data.link || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';
  const targetUrl = new URL(link, self.location.origin).href;

  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      try {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus();
          client.postMessage({ type: 'hassty-navigate', link: targetUrl });
          return;
        }
      } catch { /* تجاهل عملاء غير صالحين */ }
    }
    await self.clients.openWindow(targetUrl);
  })());
});
