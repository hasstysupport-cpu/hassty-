/* ============================================================
   Hassty WhatsApp — single dynamic serverless function.
   Routes: /api/whatsapp/status | send | setup | notify | webhook
   (Implementations live in api/_lib/whatsapp — not counted
   against the Hobby plan serverless function limit.)
   ============================================================ */
import { jsonErr } from '../_lib/config.js';
import status from '../_lib/whatsapp/status.js';
import send from '../_lib/whatsapp/send.js';
import setup from '../_lib/whatsapp/setup.js';
import notify from '../_lib/whatsapp/notify.js';
import webhook from '../_lib/whatsapp/webhook.js';

const handlers = { status, send, setup, notify, webhook };

export default async function handler(req, res) {
  const action = String(req.query?.action || '').replace(/\/+$/, '').toLowerCase();
  const handle = handlers[action];
  if (!handle) return jsonErr(res, 'مسار واتساب غير معروف.', 404);
  return handle(req, res);
}
