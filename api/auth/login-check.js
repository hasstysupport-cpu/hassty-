/* ============================================================
   POST /api/auth/login-check
   يُنادى بعد نجاح كلمة المرور (مع توكن الجلسة):
   - جهاز موثوق + بريد مؤكد → { otpRequired: false }
   - غير ذلك → إرسال رمز OTP للبريد → { otpRequired: true }
   Body: { deviceId }
   Headers: Authorization: Bearer <supabase access_token>
   ============================================================ */
import {
  readJsonBody, jsonOk, jsonErr, ARABIC_ERRORS, maskEmail, CODE_TTL_MINUTES,
} from '../_lib/config.js';
import { getCallerUser } from '../_lib/supabase.js';
import { isTrustedDevice, issueCode } from '../_lib/codes.js';
import { sendAuthEmail } from '../_lib/mailer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, ARABIC_ERRORS.method, 405);
  try {
    const body = await readJsonBody(req);
    if (!body) return jsonErr(res, ARABIC_ERRORS.body, 400);

    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const user = await getCallerUser(token);
    if (!user) return jsonErr(res, 'جلسة الدخول غير صالحة. أعد إدخال بياناتك.', 401);

    const email = String(user.email || '').toLowerCase();
    const deviceId = String(body.deviceId || '').trim();

    /* unconfirmed account → client should switch to the activation flow */
    if (!user.email_confirmed_at) {
      return jsonOk(res, { otpRequired: false, action: 'unconfirmed' });
    }

    /* trusted device → skip OTP */
    if (deviceId && (await isTrustedDevice(user.id, deviceId))) {
      return jsonOk(res, { otpRequired: false, action: 'trusted' });
    }

    /* new device → send login OTP */
    const { code, expiresInSeconds } = await issueCode({
      email,
      userId: user.id,
      purpose: 'login_otp',
      ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
    });
    await sendAuthEmail({ to: email, purpose: 'login_otp', code, name: user.user_metadata?.full_name || '' });

    return jsonOk(res, {
      otpRequired: true,
      action: 'otp',
      maskedEmail: maskEmail(email),
      expiresIn: expiresInSeconds,
      ttlMinutes: CODE_TTL_MINUTES,
      message: 'أرسلنا رمز التحقق إلى بريدك لتأمين الدخول من هذا الجهاز.',
    });
  } catch (err) {
    if (err?.status && err?.message) return jsonErr(res, err.message, err.status, { waitSeconds: err.waitSeconds, code: err.error });
    console.error('[login-check]', err);
    return jsonErr(res, ARABIC_ERRORS.server, 500);
  }
}
