/* ============================================================
   POST /api/auth/verify-code
   التحقق من رمز البريد:
   - signup_verify → تفعيل الحساب + إكمال البروفايل + extras
   - login_otp     → إتمام تسجيل الدخول (+ توثيق الجهاز اختياريًا)
   Body: { email, code, purpose, deviceId?, trustDevice? }
   ============================================================ */
import {
  readJsonBody, jsonOk, jsonErr, ARABIC_ERRORS, EMAIL_REGEX, TRUST_DEVICE_DAYS,
} from '../_lib/config.js';
import {
  getUserById, updateUserById, findPendingByEmail, findProfileByEmail, dbDelete,
} from '../_lib/supabase.js';
import { verifyCode, trustDevice } from '../_lib/codes.js';
import { ensureProfile, createTutorProfile, createAssistantProfile, createParentLinkRequest } from '../_lib/profile.js';

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
    const purpose = String(body.purpose || '');
    if (!EMAIL_REGEX.test(email)) return jsonErr(res, ARABIC_ERRORS.email, 422);
    if (!['signup_verify', 'login_otp'].includes(purpose)) return jsonErr(res, 'نوع التحقق غير صحيح.', 422);

    /* ---------- verify the code row ---------- */
    const result = await verifyCode({ email, code: body.code, purpose });
    if (!result.ok) {
      return jsonErr(res, reasonMessage[result.reason] || ARABIC_ERRORS.wrongCode, 400, {
        reason: result.reason,
        attemptsLeft: result.attemptsLeft,
      });
    }

    /* ---------- purpose-specific actions ---------- */

    if (purpose === 'signup_verify') {
      const pending = await findPendingByEmail(email);
      const userId = pending?.user_id || result.userId;
      if (!userId) return jsonErr(res, 'لم نجد تسجيلًا معلقًا بهذا البريد. أنشئ حسابًا من جديد.', 404);

      const { ok, data: user } = await getUserById(userId);
      if (!ok) return jsonErr(res, 'تعذر الوصول للحساب. تواصل مع الدعم.', 500);
      if (String(user.email || '').toLowerCase() !== email) {
        return jsonErr(res, 'بيانات الحساب غير متطابقة. تواصل مع الدعم.', 400);
      }

      // 1) activate the account (email confirmed + verified flags)
      const role = pending?.role || user.user_metadata?.role || 'student';
      const updateRes = await updateUserById(userId, {
        email_confirm: true,
        user_metadata: { ...user.user_metadata, onboardingComplete: true, role },
        app_metadata: { ...user.app_metadata, email_verified: true, verified_at: new Date().toISOString(), role },
      });
      if (!updateRes.ok) {
        return jsonErr(res, 'تعذر تفعيل الحساب. حاول مجددًا أو تواصل مع الدعم.', 500);
      }

      // 2) complete the profile (qr / tutor row / metadata) — trigger-safe
      const sd = { ...(user.user_metadata?.signup_data || {}) };
      const data = {
        fullName: user.user_metadata?.full_name || sd.fullName,
        phone: user.user_metadata?.phone || sd.phone,
        governorate: sd.governorate || user.user_metadata?.governorate,
        city: sd.city || user.user_metadata?.city,
        grade: sd.grade || user.user_metadata?.grade,
        subject: sd.subject || user.user_metadata?.subject,
        experienceYears: sd.experienceYears || user.user_metadata?.experience_years,
        parentPhone: sd.parentPhone || user.user_metadata?.parent_phone,
        studentJoinCode: sd.studentJoinCode,
        whatsappPhone: sd.whatsappPhone || user.user_metadata?.whatsapp_phone,
        experienceSummary: sd.experienceSummary || user.user_metadata?.experience_summary,
        education: sd.education || user.user_metadata?.education,
        certificateSummary: sd.certificateSummary || user.user_metadata?.certificate_summary,
        avatarUrl: user.user_metadata?.avatar_url,
        authProvider: 'email',
        consentAcceptedAt: sd.consentAcceptedAt,
      };
      await ensureProfile({ userId, email, role, data });
      if (role === 'teacher') await createTutorProfile({ userId, data });
      if (role === 'assistant') await createAssistantProfile({ userId, email, data });

      // 3) optional parent→student link
      let parentLink = null;
      if (role === 'parent' && data.studentJoinCode) {
        parentLink = await createParentLinkRequest({ userId, email, data });
      }

      // 4) clear pending marker
      await dbDelete('auth_pending_users', `email=eq.${email}`);

      return jsonOk(res, {
        activated: true,
        role,
        name: user.user_metadata?.full_name || '',
        parentLink,
        message: 'تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول.',
      });
    }

    /* ---------- login_otp ---------- */
    let userId = result.userId;
    if (!userId) {
      const profile = await findProfileByEmail(email);
      userId = profile?.id;
    }
    if (!userId) return jsonErr(res, 'تعذر إتمام التحقق. أعد تسجيل الدخول.', 400);

    if (body.trustDevice !== false && body.deviceId) {
      await trustDevice({
        userId,
        deviceId: String(body.deviceId),
        userAgent: req.headers['user-agent'] || '',
        days: TRUST_DEVICE_DAYS,
      });
    }

    return jsonOk(res, { verified: true, message: 'تم تأكيد الرمز بنجاح.' });
  } catch (err) {
    console.error('[verify-code]', err);
    return jsonErr(res, ARABIC_ERRORS.server, 500);
  }
}
