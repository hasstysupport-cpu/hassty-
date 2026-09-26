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
import { sendPushToUser } from '../_lib/push.js';
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

/* ============================================================
   broadcast_notification — إشعار جماعي لكل الحسابات أو لنوع محدد
   يستبدل دالة Edge الوهمية (admin-send-notification) التي كانت
   تسبب «Failed to send a request to the Edge Function».
   الإدراج مباشرة في جدول notifications بمفتاح الخدمة — الإشعار
   يصل فورًا عبر Realtime لجرس الإشعارات، مع Web Push best-effort
   لأول PUSH_CAP حساب (حماية من تجاوز زمن الدالة).
   ============================================================ */
const BROADCAST_PUSH_CAP = 150;
const NOTIF_PAGE = 1000;

async function handleBroadcastNotification(req, res, body) {
  if (!SERVICE_KEY) return jsonErr(res, 'الخدمة غير مهيأة على السيرفر.', 500);

  const accessToken = String(body?.accessToken || '');
  const title = String(body?.title || '').trim();
  const message = String(body?.message || '').trim();
  const link = body?.link ? String(body.link).slice(0, 200) : null;
  const role = ['student', 'parent', 'teacher', 'assistant'].includes(body?.role) ? body.role : null;
  if (!title || !message) return jsonErr(res, 'العنوان ونص الإشعار مطلوبان.', 400);
  if (title.length > 200 || message.length > 1000) return jsonErr(res, 'العنوان أو النص طويل جدًا.', 400);

  /* 1) تحقق هوية المستدعي + صلاحيته الإدارية (نفس نمط delete_account) */
  const caller = await getCallerUser(accessToken);
  const callerEmail = String(caller?.email || '').toLowerCase();
  if (!caller || !(await isAdminEmail(callerEmail))) {
    return jsonErr(res, 'غير مصرح — العملية للأدمن المعتمد فقط.', 403);
  }

  const restHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };

  /* 2) جلب معرفات المستهدفين بالصفحات (profiles) */
  const ids = [];
  for (let from = 0; from < 100000; from += NOTIF_PAGE) {
    const filter = role ? `&role=eq.${role}` : '&role=in.(student,parent,teacher,assistant)';
    const url = `${SUPABASE_URL}/rest/v1/profiles?select=id${filter}&order=created_at.asc&id=gt.${ids.length ? encodeURIComponent(ids[ids.length - 1]) : '00000000-0000-0000-0000-000000000000'}`;
    const page = await fetch(url, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Range: `${from}-${from + NOTIF_PAGE - 1}` } })
      .then((r) => (r.ok ? r.json() : [])).catch(() => []);
    if (!Array.isArray(page) || !page.length) break;
    for (const row of page) if (row?.id) ids.push(row.id);
    if (page.length < NOTIF_PAGE / 2) break;
  }
  if (!ids.length) return jsonOk(res, { sent: 0, pushed: 0, role: role || 'all' });

  /* 3) إدراج الإشعارات دفعات */
  let inserted = 0;
  const CHUNK = 500;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const rows = ids.slice(i, i + CHUNK).map((uid) => ({
      user_id: uid,
      title,
      message,
      type: 'announcement',
      link,
    }));
    const insRes = await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
      method: 'POST',
      headers: { ...restHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify(rows),
    });
    if (!insRes.ok) {
      const t = await insRes.text().catch(() => '');
      return jsonErr(res, `تعذر إدراج الإشعارات (${inserted}/${ids.length}): ${t.slice(0, 150)}`, 502);
    }
    inserted += rows.length;
  }

  /* 4) Web Push best-effort لأول PUSH_CAP حساب — لا يفشل العملية */
  let pushed = 0;
  const pushTargets = ids.slice(0, BROADCAST_PUSH_CAP);
  await Promise.allSettled(pushTargets.map(async (uid) => {
    const r = await sendPushToUser(uid, { title, body: message, link: link || '/', tag: 'hassty-broadcast' }).catch(() => null);
    if (r?.sent) pushed += r.sent;
  }));

  return jsonOk(res, { sent: inserted, pushed, role: role || 'all' });
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

  if (body.action === 'broadcast_notification') {
    return handleBroadcastNotification(req, res, body);
  }

  return jsonErr(res, 'action غير معروف.', 400);
}
