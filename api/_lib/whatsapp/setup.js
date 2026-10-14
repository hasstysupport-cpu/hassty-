/**
 * Admin health check for the Railway-hosted Evolution API.
 * Teachers connect their own WhatsApp instance from their dashboard.
 */
import { jsonErr, jsonOk } from '../config.js';
import { internalOrUser } from './auth.js';
import { evolutionConfigured, fetchInstances } from '../evolution.js';

function extractInstances(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.instances)) return payload.instances;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.response)) return payload.response;
  return [];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  const access = await internalOrUser(req, ['admin']);
  if (!access) return jsonErr(res, 'صلاحية الإدارة مطلوبة.', 403);
  if (!evolutionConfigured()) return jsonErr(res, 'إعدادات Evolution API غير مكتملة في Vercel.', 503, { provider: 'evolution' });
  try {
    const instances = extractInstances(await fetchInstances());
    return jsonOk(res, {
      success: true, provider: 'evolution', service: 'railway', setupRequired: false,
      totalInstances: instances.length,
      message: 'تم الاتصال بخدمة واتساب على Railway. ربط الأرقام يتم من لوحة كل مدرس.'
    });
  } catch (err) {
    console.error('[whatsapp/setup] Evolution API check failed:', err?.message || 'unknown error');
    return jsonErr(res, 'تعذر الاتصال بخدمة واتساب على Railway. تحقق من الخدمة ومفتاح Evolution API.', 503, { provider: 'evolution' });
  }
}
