/* ============================================================
   POST /api/auth/register
   إنشاء حساب جديد (معلّق حتى تأكيد البريد) + إرسال رمز التفعيل
   Body: { email, password, role, fullName, phone, governorate, city,
           grade?, subject?, experienceYears?, parentPhone?,
           studentJoinCode?, avatarUrl?, consent }
   ============================================================ */
import {
  readJsonBody, jsonOk, jsonErr, ARABIC_ERRORS, EMAIL_REGEX, PHONE_REGEX,
  ALLOWED_ROLES, isValidPassword, maskEmail, CODE_TTL_MINUTES, CODE_RESEND_COOLDOWN,
} from '../_lib/config.js';
import { createUser, updateUserById, findProfileByEmail, findPendingByEmail, findAuthUserByEmail, dbInsert } from '../_lib/supabase.js';
import { issueCode } from '../_lib/codes.js';
import { sendAuthEmail } from '../_lib/mailer.js';
import { isPhoneTaken } from '../_lib/profile.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, ARABIC_ERRORS.method, 405);
  try {
    const body = await readJsonBody(req);
    if (!body) return jsonErr(res, ARABIC_ERRORS.body, 400);

    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '');
    const role = String(body.role || '');
    const fullName = String(body.fullName || '').trim();
    const phone = String(body.phone || '').trim();
    const governorate = String(body.governorate || '').trim();
    const city = String(body.city || '').trim();

    /* ---------- validation ---------- */
    if (!EMAIL_REGEX.test(email)) return jsonErr(res, ARABIC_ERRORS.email, 422);
    if (!isValidPassword(password)) return jsonErr(res, ARABIC_ERRORS.password, 422);
    if (!ALLOWED_ROLES.includes(role)) return jsonErr(res, ARABIC_ERRORS.role, 422);
    if (fullName.length < 2) return jsonErr(res, ARABIC_ERRORS.name, 422);
    if (!PHONE_REGEX.test(phone)) return jsonErr(res, ARABIC_ERRORS.phone, 422);
    if (!governorate || !city) return jsonErr(res, 'يرجى اختيار المحافظة والمدينة/المنطقة.', 422);
    if (role === 'student' && !String(body.grade || '').trim()) return jsonErr(res, 'يرجى اختيار الصف الدراسي.', 422);
    if (role === 'teacher' && !String(body.subject || '').trim()) return jsonErr(res, 'يرجى تحديد المادة الدراسية.', 422);
    if (body.consent !== true) return jsonErr(res, ARABIC_ERRORS.consent, 422);

    /* ---------- phone uniqueness (profiles.phone is UNIQUE) ---------- */
    if (await isPhoneTaken(phone, email)) {
      return jsonErr(res, 'رقم الهاتف مسجل بالفعل لحساب آخر. لو كان حسابك فسجّل الدخول ببريده، أو تواصل مع الدعم.', 422, { code: 'phone_taken' });
    }

    /* ---------- already a verified user? ---------- */
    const existingProfile = await findProfileByEmail(email);
    if (existingProfile) {
      return jsonErr(res, 'هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول مباشرة أو استعادة كلمة المرور.', 409, { code: 'email_taken' });
    }

    const signupData = {
      fullName, phone, governorate, city, role,
      grade: String(body.grade || '').trim() || null,
      subject: String(body.subject || '').trim() || null,
      experienceYears: String(body.experienceYears || '').trim() || null,
      parentPhone: String(body.parentPhone || '').trim() || null,
      studentJoinCode: String(body.studentJoinCode || '').trim() || null,
      avatarUrl: String(body.avatarUrl || '').trim() || null,
      authProvider: 'email',
      consentAcceptedAt: new Date().toISOString(),
    };

    /* ---------- create (or recover) the auth user ---------- */
    let userId = null;

    const pending = await findPendingByEmail(email);
    if (pending) userId = pending.user_id;

    if (!userId) {
      // try creating a fresh user (pending, unconfirmed → cannot log in until verified)
      const created = await createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
          full_name: fullName,
          phone,
          role,
          governorate,
          city,
          grade: signupData.grade,
          subject: signupData.subject,
          experience_years: signupData.experienceYears,
          parent_phone: signupData.parentPhone,
          avatar_url: signupData.avatarUrl,
          signup_data: signupData,
        },
        app_metadata: { role, signup_source: 'web' },
      });

      if (created.ok && created.data?.id) {
        userId = created.data.id;
      } else {
        // "already registered" → recover a legacy stuck account (no profile, unconfirmed)
        const legacy = await findAuthUserByEmail(email);
        if (legacy && !legacy.email_confirmed_at) {
          userId = legacy.id;
          await updateUserById(userId, {
            password,
            user_metadata: {
              ...legacy.user_metadata,
              full_name: fullName,
              phone,
              role,
              governorate,
              city,
              signup_data: signupData,
            },
            app_metadata: { ...legacy.app_metadata, role, signup_source: 'web_recovery' },
          });
        } else if (legacy) {
          // confirmed account without profile (Google user) — never hijack it with a password
          return jsonErr(res, 'هذا البريد مرتبط بحساب جوجل. سجّل الدخول عبر Google ثم أكمل بياناتك.', 409, { code: 'google_account' });
        } else {
          return jsonErr(res, 'تعذر إنشاء الحساب. تأكد من صحة البريد وحاول مجددًا.', 500);
        }
      }
    } else {
      // existing pending registration → update its password & data
      await updateUserById(userId, { password, user_metadata: { role, full_name: fullName, phone, signup_data: signupData } });
    }

    /* ---------- store pending marker ---------- */
    await dbInsert('auth_pending_users', [{ email, user_id: userId, role }]);

    /* ---------- issue code + send branded email ---------- */
    const { code, expiresInSeconds } = await issueCode({
      email, userId, purpose: 'signup_verify', ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
    });
    await sendAuthEmail({ to: email, purpose: 'signup_verify', code, name: fullName });

    return jsonOk(res, {
      userId,
      maskedEmail: maskEmail(email),
      expiresIn: expiresInSeconds,
      resendAfter: CODE_RESEND_COOLDOWN,
      message: 'تم إنشاء حسابك بنجاح! أرسلنا رمز التفعيل إلى بريدك الإلكتروني.',
      ttlMinutes: CODE_TTL_MINUTES,
    });
  } catch (err) {
    if (err?.status && err?.message) return jsonErr(res, err.message, err.status, { waitSeconds: err.waitSeconds, code: err.error });
    console.error('[register]', err);
    return jsonErr(res, ARABIC_ERRORS.server, 500);
  }
}
