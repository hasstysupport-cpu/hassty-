/* ============================================================
   POST /api/auth/admin-otp
   بوابة دخول الإدارة عبر ميلر المنصة (Gmail SMTP) بدلًا من
   إيميلات Supabase Auth المدمجة (محدودة بـ~2/ساعة على الباقة المجانية).
   - action 'send'   : إصدار رمز login_otp للبريد الإداري الرسمي
   - action 'verify' : التحقق من الرمز، ثم سكّ hashed_token لمagic link
                       (GoTrue admin generate_link) لتبديله بجلسة حقيقية
                       من العميل عبر verifyOtp({ type:'magiclink' })
   الأمان:
   - البريد مثبّت على البريد الإداري الرسمي (يُرفض غيره 403)
   - الرموز مُجزّأة (hashed) مع cooldown 60s + 5 محاولات + 5 رموز/6h (codes.js)
   - hashed_token يُعاد فقط بعد نجاح التحقق من الرمز، وهو أحادي الاستخدام
   Body: { action: 'send' | 'verify', code? }
   ============================================================ */
import { readJsonBody, jsonOk, jsonErr, ARABIC_ERRORS } from '../_lib/config.js';
import { findProfileByEmail, findAuthUserByEmail, generateLink } from '../_lib/supabase.js';
import { issueCode, verifyCode } from '../_lib/codes.js';
import { sendAuthEmail } from '../_lib/mailer.js';

const ADMIN_EMAIL = 'hasstysupport@gmail.com';

const reasonMessage = {
  expired: 'انتهت صلاحية الرمز. اطلب رمزًا جديدًا.',
  exhausted: 'استنفدت عدد المحاولات. اطلب رمزًا جديدًا.',
  wrong: 'الرمز غير صحيح.',
  not_found: 'لم نجد رمزًا صالحًا. اطلب رمزًا جديدًا.',
};

async function resolveAdminUserId() {
  const profile = await findProfileByEmail(ADMIN_EMAIL);
  if (profile?.id) return profile.id;
  const authUser = await findAuthUserByEmail(ADMIN_EMAIL);
  return authUser?.id || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, ARABIC_ERRORS.method, 405);
  try {
    const body = await readJsonBody(req);
    if (!body) return jsonErr(res, ARABIC_ERRORS.body, 400);

    const action = String(body.action || '');

    /* ---------- send: issue the code over the platform mailer ---------- */
    if (action === 'send') {
      const requested = String(body.email || '').toLowerCase().trim();
      if (requested && requested !== ADMIN_EMAIL) {
        return jsonErr(res, 'غير مصرح بهذا البريد.', 403);
      }

      const userId = await resolveAdminUserId();
      if (!userId) return jsonErr(res, 'تعذر الوصول للحساب الإداري. تواصل مع الدعم.', 500);

      const { code, expiresInSeconds } = await issueCode({
        email: ADMIN_EMAIL,
        userId,
        purpose: 'login_otp',
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
      });
      await sendAuthEmail({ to: ADMIN_EMAIL, purpose: 'login_otp', code, name: 'إدارة حِصّتي' });

      return jsonOk(res, {
        sent: true,
        expiresIn: expiresInSeconds,
        message: 'تم إرسال رمز الدخول الإداري إلى البريد الرسمي.',
      });
    }

    /* ---------- verify: check code, then mint a single-use magic token ---------- */
    if (action === 'verify') {
      const code = String(body.code || '').replace(/\D/g, '');
      if (code.length !== 6) return jsonErr(res, 'كود الدخول يجب أن يكون 6 أرقام.', 422);

      const result = await verifyCode({ email: ADMIN_EMAIL, code, purpose: 'login_otp' });
      if (!result.ok) {
        return jsonErr(res, reasonMessage[result.reason] || ARABIC_ERRORS.wrongCode, 400, {
          reason: result.reason,
          attemptsLeft: result.attemptsLeft,
        });
      }

      // The code proved control of the admin inbox → mint the session token.
      const { ok, status, data } = await generateLink({ type: 'magiclink', email: ADMIN_EMAIL });
      const tokenHash = data?.properties?.hashed_token;
      if (!ok || !tokenHash) {
        return jsonErr(res, `تعذر إنشاء جلسة إدارية (${status}). حاول مجددًا.`, 502);
      }

      return jsonOk(res, { verified: true, token_hash: tokenHash });
    }

    return jsonErr(res, 'إجراء غير معروف.', 422);
  } catch (err) {
    if (err?.status && err?.message) {
      return jsonErr(res, err.message, err.status, { waitSeconds: err.waitSeconds, code: err.error });
    }
    console.error('[admin-otp]', err);
    return jsonErr(res, ARABIC_ERRORS.server, 500);
  }
}
