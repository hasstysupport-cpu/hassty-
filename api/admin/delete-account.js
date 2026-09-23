/* ============================================================
   Hassty Admin — Hard account deletion (serverless)
   المشكلة التي يحلها: dbDeleteAccount في الواجهة كانت تحذف صف
   profiles فقط → حساب auth.users يبقى حيًا فيستطيع المالك الدخول
   من جديد ويُعاد إنشاء ملفه. هذا الـ endpoint يحذف حساب auth
   بالكامل (بصلاحيات service role) بعد التحقق من هوية أدمن
   معتمد عبر القائمة البيضاء.
   ============================================================ */
import { getCallerUser } from '../_lib/supabase.js';
import { SUPABASE_URL, SERVICE_KEY, jsonOk, jsonErr, readJsonBody } from '../_lib/config.js';

const ADMIN_EMAILS = new Set(['hasstysupport@gmail.com', 'admin@hassty.com']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  if (!SERVICE_KEY) return jsonErr(res, 'الخدمة غير مهيأة على السيرفر.', 500);

  const body = await readJsonBody(req);
  const accessToken = String(body?.accessToken || req.headers.authorization?.replace(/^Bearer\s+/i, '') || '');
  const targetUserId = String(body?.userId || '');

  if (!targetUserId) return jsonErr(res, 'معرّف الحساب مطلوب.', 400);

  /* 1) تحقق هوية المستدعي + صلاحيته الإدارية (القايمة البيضاء) */
  const caller = await getCallerUser(accessToken);
  const callerEmail = String(caller?.email || '').toLowerCase();
  if (!caller || !ADMIN_EMAILS.has(callerEmail)) {
    return jsonErr(res, 'غير مصرح — العملية للأدمن المعتمد فقط.', 403);
  }

  /* 2) منع حذف حساب إداري من هنا */
  const restBase = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
  const profData = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(targetUserId)}&select=email,role`, {
    headers: restBase,
  }).then((r) => (r.ok ? r.json() : [])).catch(() => []);
  const targetEmail = String(profData?.[0]?.email || '').toLowerCase();
  if (ADMIN_EMAILS.has(targetEmail)) {
    return jsonErr(res, 'لا يمكن حذف حساب إداري من هنا.', 403);
  }

  /* 3) حذف صف profiles أولًا (يفكك كل الارتباطات العامة عبر CASCADE)
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
