/* ============================================================
   POST /api/auth/profile-complete
   إكمال بيانات الحساب لأول مرة بعد تسجيل الدخول بجوجل:
   اختيار نوع الحساب + البيانات + الموافقة على الشروط
   Headers: Authorization: Bearer <supabase access_token>
   Body: { role, fullName, phone, governorate, city, grade?, subject?,
           experienceYears?, parentPhone?, studentJoinCode?, consent }
   ============================================================ */
import {
  readJsonBody, jsonOk, jsonErr, ARABIC_ERRORS, PHONE_REGEX, ALLOWED_ROLES,
} from '../_lib/config.js';
import { getCallerUser, updateUserById, findProfileByEmail } from '../_lib/supabase.js';
import { ensureProfile, createTutorProfile, createParentLinkRequest, isPhoneTaken } from '../_lib/profile.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, ARABIC_ERRORS.method, 405);
  try {
    const body = await readJsonBody(req);
    if (!body) return jsonErr(res, ARABIC_ERRORS.body, 400);

    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const user = await getCallerUser(token);
    if (!user) return jsonErr(res, 'انتهت جلسة الدخول. سجّل الدخول مجددًا ثم أكمل بياناتك.', 401);

    const email = String(user.email || '').toLowerCase();
    const existing = await findProfileByEmail(email);
    /* auto-created minimal profile (from the DB trigger) is expected —
       only a COMPLETED profile blocks this endpoint */
    const alreadyComplete = existing && existing.phone && existing.governorate && existing.city;
    if (alreadyComplete) {
      return jsonErr(res, 'بيانات هذا الحساب مكتملة بالفعل.', 409, { code: 'already_complete' });
    }

    /* ---------- validation ---------- */
    const role = String(body.role || '');
    const fullName = String(body.fullName || '').trim();
    const phone = String(body.phone || '').trim();
    const governorate = String(body.governorate || '').trim();
    const city = String(body.city || '').trim();
    const googleName = user.user_metadata?.full_name || user.user_metadata?.name || '';

    if (!ALLOWED_ROLES.includes(role)) return jsonErr(res, ARABIC_ERRORS.role, 422);
    if ((fullName || googleName).length < 2) return jsonErr(res, ARABIC_ERRORS.name, 422);
    if (!PHONE_REGEX.test(phone)) return jsonErr(res, ARABIC_ERRORS.phone, 422);
    if (!governorate || !city) return jsonErr(res, 'يرجى اختيار المحافظة والمدينة/المنطقة.', 422);
    if (role === 'student' && !String(body.grade || '').trim()) return jsonErr(res, 'يرجى اختيار الصف الدراسي.', 422);
    if (role === 'teacher' && !String(body.subject || '').trim()) return jsonErr(res, 'يرجى تحديد المادة الدراسية.', 422);
    if (body.consent !== true) return jsonErr(res, ARABIC_ERRORS.consent, 422);

    /* ---------- phone uniqueness ---------- */
    if (await isPhoneTaken(phone, email)) {
      return jsonErr(res, 'رقم الهاتف مسجل بالفعل لحساب آخر. لو كان حسابك فسجّل الدخول ببريده، أو تواصل مع الدعم.', 422, { code: 'phone_taken' });
    }

    const data = {
      fullName: fullName || googleName,
      phone,
      governorate,
      city,
      grade: String(body.grade || '').trim() || null,
      subject: String(body.subject || '').trim() || null,
      experienceYears: String(body.experienceYears || '').trim() || null,
      parentPhone: String(body.parentPhone || '').trim() || null,
      studentJoinCode: String(body.studentJoinCode || '').trim() || null,
      avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      authProvider: 'google',
      consentAcceptedAt: new Date().toISOString(),
    };

    /* ---------- persist: auth metadata + profile + extras ---------- */
    await updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name: data.fullName,
        phone,
        role,
        governorate,
        city,
        grade: data.grade,
        subject: data.subject,
      },
      app_metadata: { ...user.app_metadata, email_verified: true, role, signup_source: 'google' },
    });

    await ensureProfile({ userId: user.id, email, role, data });
    if (role === 'teacher') await createTutorProfile({ userId: user.id, data });

    let parentLink = null;
    if (role === 'parent' && data.studentJoinCode) {
      parentLink = await createParentLinkRequest({ userId: user.id, email, data });
    }

    return jsonOk(res, {
      role,
      name: data.fullName,
      parentLink,
      message: 'تم إكمال بيانات حسابك بنجاح! جاري نقلك إلى لوحة التحكم.',
    });
  } catch (err) {
    if (err?.status && err?.message) return jsonErr(res, err.message, err.status, err.details);
    console.error('[profile-complete]', err);
    return jsonErr(res, ARABIC_ERRORS.server, 500);
  }
}
