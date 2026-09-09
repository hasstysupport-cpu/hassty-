/* ============================================================
   GET  /api/push/subscribe  → { publicKey }  (VAPID عام للمتصفح)
   POST /api/push/subscribe  → حفظ اشتراك إشعارات المتصفح للمستخدم الحالي
   DELETE /api/push/subscribe → إزالة اشتراك
   المصادقة: Supabase Bearer access token (مثل باقي دوال النطاق)
   ============================================================ */
import { jsonOk, jsonErr, readJsonBody } from '../_lib/config.js';
import { getCallerUser } from '../_lib/supabase.js';
import { vapidPublicKey, savePushSubscription, removePushSubscription } from '../_lib/push.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return jsonOk(res, { publicKey: vapidPublicKey(), supported: Boolean(vapidPublicKey()) });
    }

    if (req.method !== 'POST' && req.method !== 'DELETE') {
      return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
    }

    const body = await readJsonBody(req);
    if (!body) return jsonErr(res, 'تعذر قراءة بيانات الطلب.', 400);

    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = await getCallerUser(token);
    if (!user?.id) return jsonErr(res, 'غير مصرح.', 401);
    if (!body.endpoint) return jsonErr(res, 'بيانات الاشتراك غير مكتملة.', 400);

    if (req.method === 'DELETE') {
      await removePushSubscription(user.id, String(body.endpoint));
      return jsonOk(res, { removed: true });
    }

    if (!body.keys?.p256dh || !body.keys?.auth) {
      return jsonErr(res, 'بيانات الاشتراك غير مكتملة.', 400);
    }

    await savePushSubscription(
      user.id,
      { endpoint: String(body.endpoint), keys: body.keys },
      String(req.headers['user-agent'] || ''),
    );
    return jsonOk(res, { saved: true });
  } catch (err) {
    console.error('[push/subscribe]', err);
    return jsonErr(res, err?.message || 'فشل تسجيل اشتراك الإشعارات.', err?.status || 500);
  }
}
