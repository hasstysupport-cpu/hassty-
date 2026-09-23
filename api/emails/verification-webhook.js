/* ============================================================
   Hassty — Verification email webhook (serverless)
   يُستدعى من تريجرات pg_net في قاعدة البيانات عند:
   - INSERT في teacher_verification_requests → تنبيه الإدارة
   - UPDATE الحالة إلى approved/rejected → بريد النتيجة للمدرس
   الحماية: سر داخلي في الهيدر (نفس نمط واتساب الداخلي).
   ============================================================ */
import { sendVerificationEmail } from '../_lib/mailer.js';
import { jsonOk, jsonErr, readJsonBody } from '../_lib/config.js';

const INTERNAL_SECRET = String(process.env.WHATSAPP_INTERNAL_SECRET || '');

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  if (!INTERNAL_SECRET || req.headers['x-whatsapp-internal-secret'] !== INTERNAL_SECRET) {
    return jsonErr(res, 'غير مصرح.', 401);
  }

  const body = await readJsonBody(req);
  if (!body || !body.event) return jsonErr(res, 'بيانات ناقصة.', 400);

  const { event, teacherEmail = '', teacherName = '', subject = '', governorate = '', phone = '', reason = '' } = body;

  if (!['approved', 'rejected', 'new_request'].includes(event)) {
    return jsonErr(res, 'نوع الحدث غير معروف.', 400);
  }
  if (event !== 'new_request' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(teacherEmail)) {
    return jsonErr(res, 'بريد المدرس غير صالح.', 400);
  }

  try {
    const result = await sendVerificationEmail({ event, teacherEmail, teacherName, subject, governorate, phone, reason });
    return jsonOk(res, { sent: true, ...result });
  } catch (err) {
    console.error('verification-webhook error:', err?.message || err);
    /* 200 مع sent:false حتى لا يُعاد التسليم بلا نهاية — الخطأ مسجل في اللوج */
    return jsonOk(res, { sent: false, error: String(err?.message || err).slice(0, 200) });
  }
}
