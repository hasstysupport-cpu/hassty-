import { jsonErr, jsonOk, readJsonBody } from '../_lib/config.js';
import { configureWebhook, internalOrUser } from './_green.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  const access = await internalOrUser(req, ['admin']);
  if (!access) return jsonErr(res, 'صلاحية الإدارة مطلوبة.', 403);
  try {
    await readJsonBody(req);
    const data = await configureWebhook();
    return jsonOk(res, { success: true, data, webhookPath: '/api/whatsapp/webhook' });
  } catch (err) {
    console.error('[whatsapp/setup]', err);
    return jsonErr(res, err?.message || 'فشل إعداد Webhook.', err?.status || 500);
  }
}
