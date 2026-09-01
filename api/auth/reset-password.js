/* ============================================================
   POST /api/auth/reset-password
   استعادة كلمة المرور بالرمز (بدون رابط):
   Body: { email, code, newPassword }
   بعد النجاح: تحديث كلمة المرور + إنهاء كل الجلسات النشطة
   ============================================================ */
import {
  readJsonBody, jsonOk, jsonErr, ARABIC_ERRORS, EMAIL_REGEX, isValidPassword,
} from '../_lib/config.js';
import { findProfileByEmail, updateUserById, signOutAllSessions } from '../_lib/supabase.js';
import { verifyCode } from '../_lib/codes.js';

const reasonMessage = {
  expired: ARABIC_ERRORS.expiredCode,
  exhausted: ARABIC_ERRORS.tooManyAttempts,
  wrong: ARABIC_ERRORS.wrongCode,
  not_found: ARABIC_ERRORS.expiredCode,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, ARABIC_ERRORS.method, 405);
  try {
    const body = await readJsonBody(req);
    if (!body) return jsonErr(res, ARABIC_ERRORS.body, 400);

    const email = String(body.email || '').toLowerCase().trim();
    const newPassword = String(body.newPassword || '');
    if (!EMAIL_REGEX.test(email)) return jsonErr(res, ARABIC_ERRORS.email, 422);
    if (!isValidPassword(newPassword)) return jsonErr(res, ARABIC_ERRORS.password, 422);

    const profile = await findProfileByEmail(email);
    if (!profile) return jsonErr(res, 'رمز التحقق غير صحيح أو منتهي الصلاحية.', 400);

    const result = await verifyCode({ email, code: body.code, purpose: 'password_reset' });
    if (!result.ok) {
      return jsonErr(res, reasonMessage[result.reason] || ARABIC_ERRORS.wrongCode, 400, {
        reason: result.reason,
        attemptsLeft: result.attemptsLeft,
      });
    }

    const { ok, error } = await updateUserById(profile.id, { password: newPassword });
    if (!ok) {
      return jsonErr(res, `تعذر تحديث كلمة المرور: ${String(error?.msg || error?.message || '').slice(0, 120) || 'خطأ غير معروف'}`, 500);
    }

    // امنح الدخول الجديد أولوية — أنهِ كل الجلسات القديمة (أمن)
    await signOutAllSessions(profile.id).catch(() => {});

    return jsonOk(res, { message: 'تم تغيير كلمة المرور بنجاح! يمكنك تسجيل الدخول الآن.' });
  } catch (err) {
    console.error('[reset-password]', err);
    return jsonErr(res, ARABIC_ERRORS.server, 500);
  }
}
