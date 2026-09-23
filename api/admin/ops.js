/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/* ============================================================
   Hassty Admin — Ops endpoint (merged to stay within Hobby plan's
   12 serverless functions limit)
   Actions:
   - verification_email : يُستدعى من تريجر pg_net عند طلب توثيق جديد
                          أو اعتماد/رفض → إرسال البريد (سر داخلي)
   - delete_account     : حذف نهائي للحساب (auth + profile) بأدمن
                          معتمد عبر توكن جلسة + القايمة البيضاء
   ============================================================ */
import { sendVerificationEmail } from '../_lib/mailer.js';
import { getCallerUser, findProfileByEmail } from '../_lib/supabase.js';
import { isWhitelistedAdmin } from '../_lib/adminWhitelist.js';
import { SUPABASE_URL, SERVICE_KEY, jsonOk, jsonErr, readJsonBody } from '../_lib/config.js';

const INTERNAL_SECRET = String(process.env.WHATSAPP_INTERNAL_SECRET || '');

/* هل هذا البريد إداري؟ — القايمة الديناميكية (مصدر الحقيقة الوحيد)
   نفس القايمة المُدارة من صفحة "أمان الوصول" + دور البروفايل admin */
async function isAdminEmail(email) {
  const clean = String(email || '').toLowerCase().trim();
  if (!clean) return false;
  if (await isWhitelistedAdmin(clean)) return true;
  const profile = await findProfileByEmail(clean);
  return profile?.role === 'admin';
}

async function handleVerificationEmail(req, res, body) {
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
    console.error('verification-email error:', err?.message || err);
    /* 200 مع sent:false حتى لا يُعاد التسليم بلا نهاية — الخطأ مسجل في اللوج */
    return jsonOk(res, { sent: false, error: String(err?.message || err).slice(0, 200) });
  }
}

async function handleDeleteAccount(req, res, body) {
  if (!SERVICE_KEY) return jsonErr(res, 'الخدمة غير مهيأة على السيرفر.', 500);

  const accessToken = String(body?.accessToken || '');
  const targetUserId = String(body?.userId || '');
  if (!targetUserId) return jsonErr(res, 'معرّف الحساب مطلوب.', 400);

  /* 1) تحقق هوية المستدعي + صلاحيته الإدارية (القايمة الديناميكية) */
  const caller = await getCallerUser(accessToken);
  const callerEmail = String(caller?.email || '').toLowerCase();
  if (!caller || !(await isAdminEmail(callerEmail))) {
    return jsonErr(res, 'غير مصرح — العملية للأدمن المعتمد فقط.', 403);
  }

  /* 2) منع حذف حساب إداري من هنا */
  const restBase = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
  const profData = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(targetUserId)}&select=email,role`, {
    headers: restBase,
  }).then((r) => (r.ok ? r.json() : [])).catch(() => []);
  const targetEmail = String(profData?.[0]?.email || '').toLowerCase();
  if (profData?.[0]?.role === 'admin' || (await isAdminEmail(targetEmail))) {
    return jsonErr(res, 'لا يمكن حذف حساب إداري من هنا.', 403);
  }

  /* 3) حذف صف profiles أولًا (يفكك كل الارتباطات عبر CASCADE)
        ثم حذف حساب auth نهائيًا بصلاحيات الخدمة */
  const restHeaders = { ...restBase, 'Content-Type': 'application/json' };
  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(targetUserId)}`, { method: 'DELETE', headers: restHeaders });
  if (!profRes.ok && profRes.status !== 404) {
    const t = await profRes.text().catch(() => '');
    return jsonErr(res, `تعذر حذف ملف الحساب: ${t.slice(0, 150)}`, 502);
  }

  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(targetUserId)}`, {
    method: 'DELETE',
    headers: restHeaders,
  });
  if (!authRes.ok && authRes.status !== 404) {
    const t = await authRes.text().catch(() => '');
    return jsonErr(res, `تم حذف الملف لكن تعذر حذف حساب الدخول: ${t.slice(0, 150)}`, 502);
  }

  return jsonOk(res, { deleted: true, userId: targetUserId });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);

  const body = await readJsonBody(req);
  if (!body || !body.action) return jsonErr(res, 'بيانات ناقصة.', 400);

  if (body.action === 'verification_email') {
    /* مسار الـwebhook — سر داخلي في الهيدر (نفس نمط واتساب الداخلي) */
    if (!INTERNAL_SECRET || req.headers['x-whatsapp-internal-secret'] !== INTERNAL_SECRET) {
      return jsonErr(res, 'غير مصرح.', 401);
    }
    return handleVerificationEmail(req, res, body);
  }

  if (body.action === 'delete_account') {
    return handleDeleteAccount(req, res, body);
  }

  return jsonErr(res, 'action غير معروف.', 400);
}
