/**
 * Legacy Green API webhook retired. Old provider callbacks are ignored,
 * and this endpoint never sends outbound messages.
 */
import { jsonOk, jsonErr } from '../config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  return jsonOk(res, {
    received: true,
    ignored: true,
    provider: 'evolution',
    message: 'Legacy Green API webhook is disabled.'
  });
}
