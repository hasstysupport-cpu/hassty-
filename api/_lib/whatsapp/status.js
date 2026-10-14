/**
 * Platform WhatsApp status using the Railway-hosted Evolution API.
 * Teacher-specific status polling is handled by teacher.js.
 */
import { jsonErr, jsonOk } from '../config.js';
import { internalOrUser } from './auth.js';
import { evolutionConfigured, fetchInstances, parseInstanceState, mapInstanceState } from '../evolution.js';

function extractInstances(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.instances)) return payload.instances;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.response)) return payload.response;
  return [];
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  const access = await internalOrUser(req, ['admin', 'teacher', 'assistant', 'parent', 'student']);
  if (!access) return jsonErr(res, 'غير مصرح.', 401);
  if (!evolutionConfigured()) return jsonErr(res, 'خدمة واتساب على Railway غير مهيأة.', 503, { provider: 'evolution' });
  try {
    const instances = extractInstances(await fetchInstances());
    const connectedInstances = instances.filter((item) => mapInstanceState(parseInstanceState(item)) === 'connected').length;
    return jsonOk(res, {
      success: true, provider: 'evolution', service: 'railway',
      state: connectedInstances > 0 ? 'connected' : 'disconnected',
      connected: connectedInstances > 0, connectedInstances, totalInstances: instances.length
    });
  } catch (err) {
    console.error('[whatsapp/status] Evolution API check failed:', err?.message || 'unknown error');
    return jsonErr(res, 'تعذر الوصول إلى خدمة واتساب على Railway.', 503, { provider: 'evolution' });
  }
}
