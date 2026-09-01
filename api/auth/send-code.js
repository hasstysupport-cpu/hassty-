/* ============================================================
   POST /api/auth/send-code
   إعادة إرسال الرموز:
   - signup_verify : إعادة إرسال رمز تفعيل حساب معلق
   - password_reset: رمز استعادة كلمة المرور (لحساب مفعل)
   Body: { email, purpose }
   ============================================================ */
import {
  readJsonBody, jsonOk, jsonErr, ARABIC_ERRORS, EMAIL_REGEX, maskEmail,
} from '../_lib/config.js';
import { findPendingByEmail, findProfileByEmail, findAuthUserByEmail, dbUpsert, getUserById } from '../_lib/supabase.js';
import { issueCode } from '../_lib/codes.js';
import { sendAuthEmail } from '../_lib/mailer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, ARABIC_ERRORS.method, 405);
  try {
    const body = await readJsonBody(req);
    if (!body) return jsonErr(res, ARABIC_ERRORS.body, 400);

    const email = String(body.email || '').toLowerCase().trim();
    const purpose = String(body.purpose || '');
    if (!EMAIL_REGEX.test(email)) return jsonErr(res, ARABIC_ERRORS.email, 422);
    if (!['signup_verify', 'password_reset'].includes(purpose)) return jsonErr(res, 'نوع الرمز غير صحيح.', 422);

    /* ---------- signup_verify: pending registration ---------- */
    if (purpose === 'signup_verify') {
      let pending = await findPendingByEmail(email);
      let userId = pending?.user_id;

      if (!userId) {
        // legacy stuck account (exists in auth, no profile, unconfirmed)
        const legacy = await findAuthUserByEmail(email);
        if (legacy && !legacy.email_confirmed_at) {
          userId = legacy.id;
          await dbUpsert('auth_pending_users', [{ email, user_id: userId, role: legacy.user_metadata?.role || 'student' }], 'email');
        }
      }

      if (!userId) {
        return jsonOk(res, { sent: false, message: 'لا يوجد تسجيل غير مكتمل بهذا البريد. أنشئ حسابًا جديدًا أو سجّل الدخول.' });
      }

      const { code, expiresInSeconds } = await issueCode({
        email, userId, purpose, ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
      });
      const { data: user } = await getUserById(userId);
      await sendAuthEmail({ to: email, purpose, code, name: user?.user_metadata?.full_name || '' });

      return jsonOk(res, {
        sent: true,
        maskedEmail: maskEmail(email),
        expiresIn: expiresInSeconds,
        message: 'تم إرسال رمز التفعيل إلى بريدك.',
      });
    }

    /* ---------- password_reset: active account ---------- */
    const profile = await findProfileByEmail(email);
    if (!profile) {
      // neutral response — لا نكشف وجود البريد من عدمه
      return jsonOk(res, { sent: false, generic: true, message: 'إن كان هذا البريد مسجلًا لدينا فستصلك رسالة خلال لحظات.' });
    }

    const { code, expiresInSeconds } = await issueCode({
      email, userId: profile.id, purpose, ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
    });
    await sendAuthEmail({ to: email, purpose, code, name: profile.full_name || '' });

    return jsonOk(res, {
      sent: true,
      maskedEmail: maskEmail(email),
      expiresIn: expiresInSeconds,
      message: 'أرسلنا رمز استعادة كلمة المرور إلى بريدك.',
    });
  } catch (err) {
    if (err?.status && err?.message) return jsonErr(res, err.message, err.status, { waitSeconds: err.waitSeconds, code: err.error });
    console.error('[send-code]', err);
    return jsonErr(res, ARABIC_ERRORS.server, 500);
  }
}
