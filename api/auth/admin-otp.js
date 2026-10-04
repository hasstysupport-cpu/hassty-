/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/* ============================================================
   POST /api/auth/admin-otp — بوابة الوصول الإداري الكاملة
   ------------------------------------------------------------
   أ) بدون توكن (صفحة دخول الإدارة):
   - action 'send'   : إصدار رمز login_otp لأي بريد ضمن القايمة البيضاء
   - action 'verify' : التحقق من الرمز ثم سكّ hashed_token لمagic link
                       (GoTrue admin generate_link) لتبديله بجلسة حقيقية
   ب) بتوكن جلسة (Authorization: Bearer <supabase access_token>):
   - action 'google-verify' : هل صاحب الجلسة مصرح له إداريًا؟ + ترقية دوره
                              تلقائيًا إلى admin إذا كان بريده في القايمة
   - action 'list'          : عرض إيميلات الإدارة (للأدمن فقط)
   - action 'add'           : إضافة إيميل للقايمة (للأدمن فقط)
   - action 'remove'        : حذف إيميل من القايمة (للأدمن فقط)
   الأمان:
   - لا يوجد أي بريد إداري مكتوب داخل كود الواجهة — القايمة على السيرفر
   - الرموز مُجزّأة (hashed) مع cooldown 60s + 5 محاولات + 5 رموز/6h (codes.js)
   - hashed_token يُعاد فقط بعد نجاح التحقق من الرمز وهو أحادي الاستخدام
   ============================================================ */
import { readJsonBody, jsonOk, jsonErr, ARABIC_ERRORS, maskEmail } from '../_lib/config.js';
import {
  findProfileByEmail, findAuthUserByEmail, generateLink, getCallerUser,
} from '../_lib/supabase.js';
import { issueCode, verifyCode } from '../_lib/codes.js';
import { sendAuthEmail } from '../_lib/mailer.js';
import {
  OWNER_EMAIL, MAX_ADMINS, normalizeEmail, isValidEmail,
  getAdminWhitelist, isWhitelistedAdmin, setAdminWhitelist,
  setProfileRoleByEmail, resolveAdminCaller, ensureAdminAccount,
} from '../_lib/adminWhitelist.js';
const reasonMessage = {
  expired: 'انتهت صلاحية الرمز. اطلب رمزًا جديدًا.',
  exhausted: 'استنفدت عدد المحاولات. اطلب رمزًا جديدًا.',
  wrong: 'الرمز غير صحيح.',
  not_found: 'لم نجد رمزًا صالحًا. اطلب رمزًا جديدًا.',
};

function bearerToken(req) {
  const authHeader = req.headers['authorization'] || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
}

async function resolveAdminUserId(email) {
  const profile = await findProfileByEmail(email);
  if (profile?.id) return profile.id;
  const authUser = await findAuthUserByEmail(email);
  return authUser?.id || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, ARABIC_ERRORS.method, 405);
  try {
    const body = await readJsonBody(req);
    if (!body) return jsonErr(res, ARABIC_ERRORS.body, 400);

    const action = String(body.action || '');

    /* ---------- send: إصدار رمز دخول لأي بريد ضمن القايمة البيضاء ---------- */
    if (action === 'send') {
      const target = normalizeEmail(body.email) || OWNER_EMAIL;
      if (!isValidEmail(target)) return jsonErr(res, 'صيغة البريد غير صحيحة.', 422);
      if (!(await isWhitelistedAdmin(target))) {
        return jsonErr(res, 'غير مصرح بهذا البريد.', 403);
      }
      /* تهيئة حساب حقيقي تلقائيًا (auth + profiles) إن لم يوجد —
         بهذا يعمل الدخول الإداري حتى بقاعدة بيانات فاضية تمامًا */
      const ensured = await ensureAdminAccount(target);
      if (!ensured.ok || !ensured.userId) {
        return jsonErr(res, 'تعذر تهيئة الحساب الإداري. تواصل مع الدعم.', 500);
      }
      const userId = ensured.userId;

      const { code, expiresInSeconds } = await issueCode({
        email: target,
        userId,
        purpose: 'login_otp',
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
      });
      await sendAuthEmail({ to: target, purpose: 'login_otp', code, name: 'إدارة حِصّتي' });

      return jsonOk(res, {
        sent: true,
        expiresIn: expiresInSeconds,
        maskedEmail: maskEmail(target),
        message: 'تم إرسال رمز الدخول الإداري إلى البريد المعتمد.',
      });
    }

    /* ---------- verify: فحص الرمز ثم سكّ جلسة إدارية أحادية الاستخدام ---------- */
    if (action === 'verify') {
      const code = String(body.code || '').replace(/\D/g, '');
      if (code.length !== 6) return jsonErr(res, 'كود الدخول يجب أن يكون 6 أرقام.', 422);

      const target = normalizeEmail(body.email) || OWNER_EMAIL;
      if (!(await isWhitelistedAdmin(target))) {
        return jsonErr(res, 'غير مصرح بهذا البريد.', 403);
      }

      const result = await verifyCode({ email: target, code, purpose: 'login_otp' });
      if (!result.ok) {
        return jsonErr(res, reasonMessage[result.reason] || ARABIC_ERRORS.wrongCode, 400, {
          reason: result.reason,
          attemptsLeft: result.attemptsLeft,
        });
      }

      // إثبات امتلاك صندوق البريد → سكّ التوكن أحادي الاستخدام
      const { ok, status, data } = await generateLink({ type: 'magiclink', email: target });
      const tokenHash = data?.hashed_token || data?.properties?.hashed_token;
      if (!ok || !tokenHash) {
        return jsonErr(res, `تعذر إنشاء جلسة إدارية (${status}). حاول مجددًا.`, 502);
      }

      // ترقية الدور إلى admin في قاعدة البيانات — الدخول الإداري يصبح حقيقيًا 100%
      // (مطابق لتدفق google-verify — القايمة تحققت مسبقًا أعلاه)
      await setProfileRoleByEmail(target, 'admin').catch(() => {});

      return jsonOk(res, { verified: true, token_hash: tokenHash, email: target });
    }

    /* ---------- من هنا للأسفل: يتطلب توكن جلسة سارية ---------- */
    const caller = await getCallerUser(bearerToken(req));
    if (!caller) return jsonErr(res, 'جلسة غير صالحة. سجل دخولك أولًا.', 401);
    const callerEmail = normalizeEmail(caller.email);

    /* ---------- google-verify: هل صاحب الجلسة مصرح له؟ + ترقية تلقائية ---------- */
    if (action === 'google-verify') {
      const allowed = await isWhitelistedAdmin(callerEmail);
      if (!allowed) return jsonOk(res, { ok: true, allowed: false });

      const profile = await findProfileByEmail(callerEmail);
      let promoted = false;
      if (profile?.id && profile.role !== 'admin') {
        const r = await setProfileRoleByEmail(callerEmail, 'admin');
        promoted = Boolean(r.ok && !r.unchanged);
      }
      return jsonOk(res, { ok: true, allowed: true, email: callerEmail, promoted });
    }

    /* ---------- list / add / remove: إدارة القايمة (أدمن فقط) ---------- */
    if (action === 'list' || action === 'add' || action === 'remove') {
      const gate = await resolveAdminCaller(caller);
      if (!gate.allowed) return jsonErr(res, 'غير مصرح لك بإدارة إيميلات الإدارة.', 403);

      if (action === 'list') {
        const emails = await getAdminWhitelist();
        return jsonOk(res, { emails, owner: OWNER_EMAIL, max: MAX_ADMINS });
      }

      if (action === 'add') {
        const email = normalizeEmail(body.email);
        if (!isValidEmail(email)) return jsonErr(res, 'صيغة البريد غير صحيحة.', 422);
        /* إضافة حقيقية 100%: تهيئة حساب المالك + حفظ القايمة في قاعدة
           البيانات + إنشاء حساب auth/بروفايل فعلي للبريد المضاف */
        const ensuredOwner = await ensureAdminAccount(OWNER_EMAIL);
        if (!ensuredOwner.ok) return jsonErr(res, 'تعذر تهيئة حساب المالك. حاول مجددًا.', 500);
        const emails = await getAdminWhitelist();
        if (emails.includes(email)) return jsonOk(res, { emails, message: 'البريد مضاف بالفعل.' });
        if (emails.length >= MAX_ADMINS) {
          return jsonErr(res, `الحد الأقصى ${MAX_ADMINS} إيميلات. احذف واحدًا أولًا.`, 400);
        }
        const next = [...emails, email];
        const save = await setAdminWhitelist(next);
        if (!save.ok) return jsonErr(res, 'تعذر حفظ القايمة. حاول مجددًا.', 500);
        // إنشاء حساب حقيقي للبريد المضاف + ترقية دوره فورًا
        const ensured = await ensureAdminAccount(email).catch(() => ({ ok: false }));
        if (!ensured.ok) await setProfileRoleByEmail(email, 'admin').catch(() => {});
        return jsonOk(res, { emails: save.emails, message: 'تمت إضافة الإيميل وإنشاء حسابه الإداري بنجاح.' });
      }

      if (action === 'remove') {
        const email = normalizeEmail(body.email);
        if (email === OWNER_EMAIL) {
          return jsonErr(res, 'لا يمكن حذف بريد المالك الرسمي.', 400);
        }
        const emails = await getAdminWhitelist();
        if (!emails.includes(email)) return jsonOk(res, { emails, message: 'البريد غير موجود في القايمة.' });
        const save = await setAdminWhitelist(emails.filter((e) => e !== email));
        if (!save.ok) return jsonErr(res, 'تعذر حفظ القايمة. حاول مجددًا.', 500);
        // تخفيض دوره من لوحة الإدارة إن كان أدمن
        await setProfileRoleByEmail(email, 'student').catch(() => {});
        return jsonOk(res, { emails: save.emails, message: 'تم حذف الإيميل وتخفيض صلاحياته.' });
      }
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
