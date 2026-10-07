/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/* ============================================================
   واتساب المدرس — منطق السيرفر (Evolution API)
   المسارات: /api/whatsapp/create | connect | status | send | disconnect
   قواعد صارمة:
   - teacherId من الـ Session فقط (لا يُقبل من الواجهة أبدًا).
   - اسم المثيل مشتق حسابيًا من teacherId → مستحيل الوصول
     لمثيل مدرس آخر، وأي محاولة تُرجع 403.
   - مفتاح Evolution يبقى في الـ env ولا يعود في أي استجابة.
   - حد إرسال لكل مدرس (20/دقيقة و 200/ساعة) داخل الذاكرة.
   - لا يُنشأ مثيل جديد إن وُجد واحد (نفس الاسم دائمًا).
   ============================================================ */

import { jsonOk, jsonErr, readJsonBody } from '../config.js';
import { internalOrUser } from '../green.js';
import { dbSelect, dbUpsert, dbUpdate } from '../supabase.js';
import {
  evolutionConfigured, serviceUnavailableError, describeEvolutionError, evolutionHttpStatus, EvolutionError,
  createInstance, connectInstance, connectionState, fetchInstances, sendTextMessage, logoutInstance,
  parseQrImage, parsePairingCode, parseInstanceState, mapInstanceState, parsePhoneNumber,
  parseInstanceToken, findInstanceInList,
} from '../evolution.js';

const TABLE = 'teacher_whatsapp_instances';
const QR_TTL_SECONDS = 25;          // عمر QR قبل التحديث التلقائي
const LINK_SESSION_TTL_MS = 3 * 60 * 1000; // 3 دقائق لجلسة الربط حتى لو أُغلقت الصفحة
const LAST_CHECK_WRITE_MS = 30000;  // لا نكتب last_status_check أكثر من كل 30 ثانية

/* ---------- مساعدات قاعدة البيانات ---------- */

async function getRow(teacherId) {
  const { ok, data } = await dbSelect(TABLE, { select: '*', teacher_id: `eq.${teacherId}`, limit: '1' });
  return ok && data?.[0] ? data[0] : null;
}

async function saveRow(teacherId, values, { upsert = false } = {}) {
  const row = { teacher_id: teacherId, ...values, updated_at: new Date().toISOString() };
  if (upsert) return dbUpsert(TABLE, [row], 'teacher_id');
  return dbUpdate(TABLE, values, `teacher_id=eq.${teacherId}`);
}

/* ---------- مصادقة: معلم فقط، من الـ Session ---------- */
/* تمييز واضح: 401 = جلسة منتهية/غير موجودة، 403 = دور ليس معلمًا */
async function requireTeacher(req) {
  const access = await internalOrUser(req); /* أي دور — نفحص الدور بأنفسنا */
  if (!access) return { code: 401, message: 'انتهت الجلسة — سجّل الدخول من جديد.' };
  /* السر الداخلي بلا هوية معلم — لا يُدار واتساب المدرس عبره */
  if (access.internal || access.profile?.role !== 'teacher') {
    return { code: 403, message: 'هذه الخدمة متاحة للمعلمين فقط.' };
  }
  return { access };
}

/* هل المتصل معلمًا (أيًا كان لديه ربط أو لا)؟ — يُستخدم لتوجيه status دائمًا
   لمسار المعلم بدل إهدار طلبات Green API كل 4 ثوانٍ على معلم بلا ربط */
export async function teacherCaller(req) {
  try {
    const access = await internalOrUser(req, ['teacher']);
    return access && !access.internal ? access : null;
  } catch {
    return null;
  }
}

/* هل المتصل معلم لديه مثيل؟ (يُستخدم للتوجيه الذكي في send) */
export async function teacherWithInstance(req) {
  try {
    const access = await internalOrUser(req, ['teacher']);
    if (!access || access.internal) return null;
    const row = await getRow(access.user.id);
    return row ? { access, row } : null;
  } catch {
    return null;
  }
}

/* ---------- اسم المثيل: مشتق من teacherId (تنظيف + حد طول) ---------- */

export function buildInstanceName(teacherId) {
  const clean = String(teacherId || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!clean) throw new EvolutionError('معرّف معلم غير صالح.', 400);
  return `hassty_teacher_${clean}`.slice(0, 64);
}

/* ---------- حد الإرسال لكل معلم (ذاكرة الدالة) ---------- */

const RATE_LIMITS = { perMinute: 20, perHour: 200 };
const rateBuckets = new Map(); // teacherId → { min: [], hour: [] }

function allowSend(teacherId) {
  const now = Date.now();
  let b = rateBuckets.get(teacherId);
  if (!b) { b = { min: [], hour: [] }; rateBuckets.set(teacherId, b); }
  b.min = b.min.filter((t) => now - t < 60000);
  b.hour = b.hour.filter((t) => now - t < 3600000);
  if (b.min.length >= RATE_LIMITS.perMinute || b.hour.length >= RATE_LIMITS.perHour) return false;
  b.min.push(now);
  b.hour.push(now);
  if (rateBuckets.size > 5000) rateBuckets.clear(); // حماية ذاكرة الدالة الباردة
  return true;
}

/* ---------- تطبيع رقم الواتساب للإرسال ---------- */

export function normalizeWhatsAppNumber(value) {
  let s = String(value || '').replace(/\D/g, '');
  if (s.startsWith('0020')) s = s.slice(2);
  else if (s.startsWith('00')) s = s.slice(2);
  if (s.startsWith('0') && s.length === 11) s = `20${s.slice(1)}`; // 01012345678 → 201012345678
  if (!s.startsWith('20') && s.length === 10 && s.startsWith('01')) s = `20${s}`;
  if (s.length < 8 || s.length > 15) return null;
  return s;
}

/* ---------- الحالة الحقيقية من السيرفر (مع ترقية الهاتف عند الاتصال) ---------- */

async function queryRealStatus(row) {
  const stateRaw = parseInstanceState(await connectionState(row.instance_name));
  let status = mapInstanceState(stateRaw);
  let phone = null;

  if (status === 'connected') {
    /* رقم الواتساب: من قائمة المثيلات إذا لم نحفظه بعد */
    if (!row.phone_number) {
      try {
        const list = await fetchInstances();
        phone = parsePhoneNumber(findInstanceInList(list, row.instance_name));
      } catch { /* غير حرج — نحاول لاحقًا */ }
    }
  }
  return { status, phone };
}

/* يكتب في قاعدة البيانات فقط عند تغيّر حقيقي (يمنع إغراق الجدول بالكتابة كل 4 ثوانٍ) */
async function persistStatus(teacherId, row, status, phone) {
  const now = new Date().toISOString();
  const patch = {};
  if (row.status !== status) patch.status = status;
  if (phone && phone !== row.phone_number) patch.phone_number = phone;
  if (status === 'connected' && !row.connected_at) patch.connected_at = now;
  if (status !== 'connected' && row.connected_at && status === 'disconnected') patch.connected_at = null;
  const stale = !row.last_status_check || (Date.now() - new Date(row.last_status_check).getTime() > LAST_CHECK_WRITE_MS);
  if (Object.keys(patch).length) {
    patch.last_status_check = now;
    await saveRow(teacherId, patch);
    return { ...row, ...patch };
  }
  if (stale) {
    await dbUpdate(TABLE, { last_status_check: now }, `teacher_id=eq.${teacherId}`);
    return { ...row, last_status_check: now };
  }
  return row;
}

function statusPayload(row, extra = {}) {
  return {
    status: row?.status || 'not_linked',
    mode: 'teacher',
    instanceName: row?.instance_name || null,
    phoneNumber: row?.phone_number || null,
    connectedAt: row?.connected_at || null,
    pendingExpiresAt: row?.pending_expires_at || null,
    pendingPhoneNumber: row?.pending_phone_number || null,
    ...extra,
  };
}

function pendingLinkActive(row) {
  if (!row?.pending_expires_at) return false;
  const expires = new Date(row.pending_expires_at).getTime();
  return Number.isFinite(expires) && expires > Date.now() && ['connecting', 'qr_pending'].includes(String(row.status || ''));
}

async function expirePendingLink(teacherId, row) {
  if (!row?.pending_expires_at || pendingLinkActive(row)) return false;
  try {
    await deleteInstance(row.instance_name);
  } catch (err) {
    if (err?.status !== 404) console.error('[whatsapp/teacher/expire]', err?.message || err);
  }
  await saveRow(teacherId, {
    status: 'disconnected',
    pending_expires_at: null,
    pending_phone_number: null,
    status_message: 'انتهت مهلة جلسة ربط واتساب (3 دقائق).',
    connected_at: null,
    phone_number: null,
  });
  return true;
}

/* ============================================================
   POST /api/whatsapp/create — ربط واتساب (إنشاء/إعادة استخدام)
   لا ينشئ مثيلًا جديدًا أبدًا إن كان للمدرس واحد.
   ============================================================ */

export async function create(req, res) {
  if (req.method !== 'POST') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  const guard = await requireTeacher(req);
  if (!guard.access) return jsonErr(res, guard.message, guard.code);
  const access = guard.access;
  if (!evolutionConfigured()) return jsonErr(res, 'خدمة واتساب غير متاحة مؤقتًا — حاول مرة أخرى بعد قليل.', 503, { status: 'service_unavailable' });

  const body = await readJsonBody(req);
  if (!body) return jsonErr(res, 'تعذر قراءة بيانات الطلب.', 400);
  const requestedNumber = body.phone || body.number ? normalizeWhatsAppNumber(body.phone || body.number) : null;
  if ((body.phone || body.number) && !requestedNumber) return jsonErr(res, 'رقم الهاتف غير صحيح — أدخل الرقم مع كود الدولة.', 422);

  const teacherId = access.user.id;
  try {
    const name = buildInstanceName(teacherId);
    let row = await getRow(teacherId);

    if (row && !pendingLinkActive(row) && row.pending_expires_at && row.status !== 'connected') {
      await expirePendingLink(teacherId, row);
      row = await getRow(teacherId);
    }

    if (row) {
      try {
        const stateRaw = parseInstanceState(await connectionState(name));
        if (mapInstanceState(stateRaw) === 'connected') {
          const updated = await persistStatus(teacherId, row, 'connected', null);
          const phone = updated.phone_number || await tryFetchPhone(name, teacherId, updated);
          await saveRow(teacherId, { pending_expires_at: null, pending_phone_number: null });
          return jsonOk(res, statusPayload({ ...updated, phone_number: phone, pending_expires_at: null, pending_phone_number: null }, { qr: null, pairingCode: null }));
        }

        if (pendingLinkActive(row)) {
          const resumeNumber = requestedNumber || row.pending_phone_number || '';
          const conn = await connectInstance(name, resumeNumber);
          const qr = parseQrImage(conn);
          const pairingCode = parsePairingCode(conn);
          const values = {
            status: qr ? 'qr_pending' : 'connecting',
            pending_expires_at: row.pending_expires_at,
            pending_phone_number: row.pending_phone_number || requestedNumber || null,
            last_status_check: new Date().toISOString(),
          };
          await saveRow(teacherId, values);
          return jsonOk(res, statusPayload({ ...row, ...values, instance_name: name }, { qr, pairingCode, qrTtlSeconds: QR_TTL_SECONDS }));
        }
      } catch (err) {
        if (err?.status === 404) row = null;
        else throw err;
      }
    }

    let instanceToken = null;
    const created = await createInstance(name, requestedNumber || '');
    instanceToken = parseInstanceToken(created);

    const conn = await connectInstance(name, requestedNumber || '');
    const qr = parseQrImage(conn);
    const pairingCode = parsePairingCode(conn);
    const status = qr ? 'qr_pending' : 'connecting';
    const values = {
      instance_name: name,
      status,
      status_message: null,
      connected_at: null,
      pending_expires_at: new Date(Date.now() + LINK_SESSION_TTL_MS).toISOString(),
      pending_phone_number: requestedNumber || null,
      last_status_check: new Date().toISOString(),
    };
    if (instanceToken) values.instance_token = instanceToken;

    if (row) await saveRow(teacherId, values);
    else await saveRow(teacherId, values, { upsert: true });

    return jsonOk(res, statusPayload({ ...row, ...values, instance_name: name }, {
      qr,
      pairingCode,
      qrTtlSeconds: QR_TTL_SECONDS,
    }));
  } catch (err) {
    console.error('[whatsapp/teacher/create]', err?.message || err);
    const httpStatus = evolutionHttpStatus(err);
    return jsonErr(res, describeEvolutionError(err), httpStatus, { status: httpStatus === 503 ? 'service_unavailable' : 'error' });
  }
}

async function tryFetchPhone(name, teacherId, row) {
  if (row?.phone_number) return row.phone_number;
  try {
    const list = await fetchInstances();
    const phone = parsePhoneNumber(findInstanceInList(list, name));
    if (phone) { await saveRow(teacherId, { phone_number: phone }); return phone; }
  } catch { /* غير حرج */ }
  return row?.phone_number || null;
}

/* ============================================================
   POST /api/whatsapp/connect — QR جديد / استكمال الربط
   يعمل على نفس المثيل دائمًا (لا ينشئ واحدًا جديدًا).
   ============================================================ */

export async function connect(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  const guard = await requireTeacher(req);
  if (!guard.access) return jsonErr(res, guard.message, guard.code);
  const access = guard.access;
  if (!evolutionConfigured()) return jsonErr(res, 'خدمة واتساب غير متاحة مؤقتًا — حاول مرة أخرى بعد قليل.', 503, { status: 'service_unavailable' });

  const body = req.method === 'POST' ? await readJsonBody(req) : {};
  if (body === null) return jsonErr(res, 'تعذر قراءة بيانات الطلب.', 400);
  const requestedNumber = body?.phone || body?.number ? normalizeWhatsAppNumber(body.phone || body.number) : null;
  if ((body?.phone || body?.number) && !requestedNumber) return jsonErr(res, 'رقم الهاتف غير صحيح — أدخل الرقم مع كود الدولة.', 422);

  const teacherId = access.user.id;
  try {
    const name = buildInstanceName(teacherId);
    const row = await getRow(teacherId);

    /* متصل بالفعل؟ */
    if (row) {
      try {
        const stateRaw = parseInstanceState(await connectionState(name));
        if (mapInstanceState(stateRaw) === 'connected') {
          const updated = await persistStatus(teacherId, row, 'connected', null);
          const phone = updated.phone_number || await tryFetchPhone(name, teacherId, updated);
          return jsonOk(res, statusPayload({ ...updated, phone_number: phone }, { qr: null, pairingCode: null }));
        }
      } catch (err) {
        if (err?.status === 404) {
          /* المثيل غير موجود على السيرفر → نعيد إنشائه بنفس الاسم (لا يتكرر أبدًا) */
          await createInstance(name);
        } else throw err;
      }
    }

    const conn = await connectInstance(name, requestedNumber || '');
    const qr = parseQrImage(conn);
    const pairingCode = parsePairingCode(conn);
    const status = qr ? 'qr_pending' : 'connecting';
    const values = { instance_name: name, status, connected_at: null, last_status_check: new Date().toISOString() };
    if (row) await saveRow(teacherId, values);
    else await saveRow(teacherId, values, { upsert: true });
    return jsonOk(res, statusPayload({ ...row, ...values, instance_name: name }, { qr, pairingCode, qrTtlSeconds: QR_TTL_SECONDS }));
  } catch (err) {
    console.error('[whatsapp/teacher/connect]', err?.message || err);
    const httpStatus = evolutionHttpStatus(err);
    return jsonErr(res, describeEvolutionError(err), httpStatus, { status: httpStatus === 503 ? 'service_unavailable' : 'error' });
  }
}

/* ============================================================
   GET /api/whatsapp/status — polling آمن كل بضع ثوانٍ
   ============================================================ */

export async function status(req, res) {
  if (req.method !== 'GET') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  const guard = await requireTeacher(req);
  if (!guard.access) return jsonErr(res, guard.message, guard.code);
  const access = guard.access;

  const teacherId = access.user.id;
  const row = await getRow(teacherId);
  if (!row) return jsonOk(res, statusPayload(null));

  if (!evolutionConfigured()) {
    return jsonOk(res, statusPayload(row, { configured: false }));
  }

  try {
    const { status: real, phone } = await queryRealStatus(row);
    /* نحافظ على qr_pending أثناء دورة الربط حتى لا ترتعش الواجهة */
    const shown = real === 'connecting' && (row.status === 'qr_pending') ? 'qr_pending' : real;
    const updated = await persistStatus(teacherId, row, real, phone);
    const finalPhone = updated.phone_number || phone;
    return jsonOk(res, statusPayload({ ...updated, status: shown, phone_number: finalPhone }, { configured: true }));
  } catch (err) {
    /* السيرفر البعيد غير متاح: نعيد آخر حالة محفوظة + علم degraded
       حتى لا تتعطل لوحة Hassty نفسها */
    console.error('[whatsapp/teacher/status]', err?.message || err);
    if (err?.status === 404) {
      const updated = await persistStatus(teacherId, row, 'disconnected', null);
      await saveRow(teacherId, { status_message: 'جلسة الواتساب غير موجودة على السيرفر — اضغط «ربط واتساب» لإعادة إنشائها.' });
      return jsonOk(res, statusPayload(updated, { sessionMissing: true }));
    }
    return jsonOk(res, statusPayload(row, { serviceUnavailable: true }));
  }
}

/* ============================================================
   POST /api/whatsapp/send — إرسال من رقم المعلم نفسه
   (body: phone|number + message — الاسم من الجلسة فقط)
   ============================================================ */

export async function send(req, res) {
  if (req.method !== 'POST') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  const guard = await requireTeacher(req);
  if (!guard.access) return jsonErr(res, guard.message, guard.code);
  const access = guard.access;

  const teacherId = access.user.id;
  try {
    const body = await readJsonBody(req);
    if (!body) return jsonErr(res, 'تعذر قراءة بيانات الطلب.', 400);

    const row = await getRow(teacherId);
    if (!row) return jsonErr(res, 'لم يتم ربط واتساب بعد — افتح صفحة «واتساب المدرس» واربطه أولًا.', 409);
    if (!evolutionConfigured()) return jsonErr(res, 'خدمة واتساب غير متاحة مؤقتًا — حاول مرة أخرى بعد قليل.', 503, { status: 'service_unavailable' });

    /* التحقق من الحالة أولًا: يجب أن يكون متصلًا */
    let stateRaw;
    try {
      stateRaw = parseInstanceState(await connectionState(row.instance_name));
    } catch (err) {
      if (err?.status === 404) return jsonErr(res, 'جلسة الواتساب غير موجودة على السيرفر — اضغط «ربط واتساب» لإعادة إنشائها.', 409);
      throw err;
    }
    if (mapInstanceState(stateRaw) !== 'connected') {
      return jsonErr(res, 'واتساب المدرس غير متصل حاليًا — اربطه من صفحة «واتساب المدرس» ثم حاول مجددًا.', 409, { status: 'disconnected' });
    }

    const number = normalizeWhatsAppNumber(body.phone || body.number);
    if (!number) return jsonErr(res, 'رقم الهاتف غير صحيح — أدخل رقمًا صحيحًا مع كود الدولة.', 422);
    const message = String(body.message || '').trim().slice(0, 3000);
    if (!message) return jsonErr(res, 'نص الرسالة مطلوب.', 422);

    if (!allowSend(teacherId)) {
      return jsonErr(res, 'تم تجاوز الحد المسموح من الرسائل — انتظر قليلًا ثم حاول مجددًا.', 429);
    }

    const data = await sendTextMessage(row.instance_name, number, message);
    return jsonOk(res, { success: true, via: 'teacher_evolution', data });
  } catch (err) {
    console.error('[whatsapp/teacher/send]', err?.message || err);
    return jsonErr(res, describeEvolutionError(err), evolutionHttpStatus(err));
  }
}

/* ============================================================
   POST /api/whatsapp/disconnect — فصل واتساب
   يخرج من الجلسة ويحدّث الحالة — لا يحذف حساب المدرس
   ولا أي بيانات أخرى في Hassty.
   ============================================================ */

export async function disconnect(req, res) {
  if (req.method !== 'POST') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  const guard = await requireTeacher(req);
  if (!guard.access) return jsonErr(res, guard.message, guard.code);
  const access = guard.access;

  const teacherId = access.user.id;
  const row = await getRow(teacherId);
  if (!row) return jsonOk(res, { success: true, status: 'not_linked' });

  try {
    await logoutInstance(row.instance_name);
  } catch (err) {
    /* لو الجلسة غير موجودة أصلًا على السيرفر نكمل الفصل محليًا بشكل طبيعي */
    if (err?.status !== 404) console.error('[whatsapp/teacher/disconnect:logout]', err?.message || err);
  }

  try {
    await saveRow(teacherId, {
      status: 'disconnected',
      status_message: 'تم فصل واتساب بواسطة المعلم.',
      connected_at: null,
      phone_number: null,
      last_status_check: new Date().toISOString(),
    });
    return jsonOk(res, { success: true, status: 'disconnected' });
  } catch (err) {
    console.error('[whatsapp/teacher/disconnect]', err?.message || err);
    return jsonErr(res, 'تعذر فصل واتساب — حاول مرة أخرى بعد قليل.', 500);
  }
}

/* التجميع الافتراضي — يستخدمه مسار /api/whatsapp/[action] */
export default { create, connect, status, send, disconnect };
