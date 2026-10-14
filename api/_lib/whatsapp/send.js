/**
 * Legacy generic send route. Green API is retired.
 * Teacher sends are routed to the authenticated teacher's Evolution instance.
 */
import { jsonErr } from '../config.js';
import { internalOrUser } from './auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  const access = await internalOrUser(req, ['admin', 'teacher', 'assistant', 'parent']);
  if (!access) return jsonErr(res, 'غير مصرح.', 401);
  return jsonErr(
    res,
    'تم إيقاف الإرسال العام القديم. أرسل من مسار واتساب المدرس المتصل عبر Railway/Evolution حتى لا تُرسل الرسالة من رقم غير صحيح.',
    409,
    { provider: 'evolution', setupRequired: 'teacher_whatsapp_connection' }
  );
}
