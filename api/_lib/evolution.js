/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/* ============================================================
   Evolution API client (سيرفر Hassty فقط — لا يُستدعى من المتصفح)
   - URL عام (ليس سرًا) وله fallback آمن. المفتاح من env فقط.
   - Parser مرن يتعامل مع أشكال استجابات متعددة (base64 / data URL /
     code / pairingCode / state / status / connectionStatus).
   - روابط رسمية v2.3.x: /instance/create — /instance/connect/{name} —
     /instance/connectionState/{name} — /instance/fetchInstances —
     /message/sendText/{name} — /instance/logout/{name} —
     /instance/delete/{name}
   ============================================================ */

export const EVOLUTION_URL = String(process.env.EVOLUTION_API_URL || 'https://hassty-whatsapp-api-production.up.railway.app').replace(/\/+$/, '');
const EVOLUTION_KEY = String(process.env.EVOLUTION_API_KEY || '');

export function evolutionConfigured() {
  return Boolean(EVOLUTION_URL && EVOLUTION_KEY);
}

export class EvolutionError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'EvolutionError';
    this.status = status;
    this.data = data;
  }
}

/* خدمة غير مهيأة / غير متاحة — رسالة عربية موحّدة للواجهة */
export function serviceUnavailableError() {
  return new EvolutionError('خدمة واتساب غير متاحة مؤقتًا — حاول مرة أخرى بعد قليل.', 503, { serviceUnavailable: true });
}

async function evoFetch(path, { method = 'GET', body, timeoutMs = 25000 } = {}) {
  if (!evolutionConfigured()) throw serviceUnavailableError();
  let res;
  try {
    res = await fetch(`${EVOLUTION_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    /* انقطاع/تايم‌اوت (Railway نايم مثلًا) — لا نكشف تفاصيل داخلية */
    throw serviceUnavailableError();
  }
  const text = await res.text().catch(() => '');
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text ? { raw: text } : null; }
  /* سجل استجابات للتطوير فقط عبر EVOLUTION_DEBUG_LOGS=1 — بدون أي أسرار */
  if (process.env.EVOLUTION_DEBUG_LOGS === '1') {
    console.log(`[evolution] ${method} ${path} → ${res.status} ${JSON.stringify(data).slice(0, 600)}`);
  }
  if (!res.ok) {
    const raw = String(data?.message || data?.error || (Array.isArray(data?.response) ? data.response.join(' ') : '') || text || '');
    throw new EvolutionError(raw || `Evolution API HTTP ${res.status}`, res.status, data);
  }
  return data;
}

/* ============ Parsers مرنة (لا نفترض شكل استجابة واحد) ============ */

/* يجد أول قيمة غير فارغة من أسماء حقول متعددة — على مستوى الجذر و data و instance */
function pick(payload, fields) {
  if (payload === null || payload === undefined) return undefined;
  const sources = [payload, payload.data, payload.instance, payload.response, payload.result];
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;
    for (const f of fields) {
      const v = src[f];
      if (v !== undefined && v !== null && v !== '') return v;
    }
  }
  return undefined;
}

/* QR: يقبل data URL أو base64 خام ويُرجع data URL جاهزة للعرض في <img> */
export function parseQrImage(payload) {
  const raw = pick(payload, ['base64', 'qrcode', 'qrCode', 'qr', 'code', 'image', 'imageBase64']);
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (s.startsWith('data:image/')) return s;
  if (/^[A-Za-z0-9+/=\s]+$/.test(s.slice(0, 100))) return `data:image/png;base64,${s.replace(/\s+/g, '')}`;
  return null;
}

/* رمز الربط (يظهر فقط إن أعاده السيرفر) */
export function parsePairingCode(payload) {
  const raw = pick(payload, ['pairingCode', 'pairing_code', 'codePairing', 'devicePairingCode']);
  if (!raw) return null;
  const s = String(raw).replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  return s.length >= 6 ? s : null;
}

/* حالة الاتصال بأشكال مختلفة → state موحّدة صغيرة */
export function parseInstanceState(payload) {
  const raw = pick(payload, ['state', 'status', 'connectionStatus', 'instanceStatus', 'statusConnection']);
  return String(raw || '').trim().toLowerCase();
}

/* state (صغيرة) → حالة Hassty الداخلية */
export function mapInstanceState(state) {
  const s = String(state || '').toLowerCase();
  if (!s) return 'connecting';
  if (s === 'open' || s === 'connected' || s === 'isconnected') return 'connected';
  if (s === 'connecting' || s === 'init' || s === 'starting' || s === 'waiting' || s === 'wait_validation' || s === 'pending') return 'connecting';
  if (s === 'close' || s === 'closed' || s === 'disconnected' || s === 'logout' || s === 'notlogged' || s === 'not_logged') return 'disconnected';
  if (s.includes('qr')) return 'connecting'; // qrRead / qrReadFail أثناء دورة الربط
  if (s === 'error') return 'error';
  return 'connecting';
}

/* استخراج رقم الواتساب المتصل من أي شكل (رقم مباشر أو jid) */
export function parsePhoneNumber(payload) {
  const raw = pick(payload, ['number', 'phone', 'ownerJid', 'jid', 'wid', 'me', 'user', 'phoneNumber', 'numberWpp']);
  if (!raw) return null;
  const s = String(raw).trim();
  const jidMatch = s.match(/^(\d+)(?::\d+)?@/); // 201012345678:12@s.whatsapp.net
  if (jidMatch) return jidMatch[1];
  if (/^\d{8,16}$/.test(s)) return s;
  const digits = s.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/* توكن المثيل إن أعاده الإنشاء (hash / token / apikey) */
export function parseInstanceToken(payload) {
  const direct = pick(payload, ['hash', 'token', 'apikey']);
  if (direct && typeof direct === 'string') return direct;
  const inner = payload?.instance?.token || payload?.instance?.apikey || payload?.instance?.hash;
  return inner && typeof inner === 'string' ? inner : null;
}

/* يجد مثيلًا بالاسم داخل قائمة fetchInstances (أشكال متعددة) */
export function findInstanceInList(list, instanceName) {
  if (!Array.isArray(list)) return null;
  return list.find((it) => {
    if (!it || typeof it !== 'object') return false;
    const names = [it.instanceName, it.name, it.instance?.instanceName, it.instance?.name, it.instanceId, it.id];
    return names.map((n) => String(n || '').toLowerCase()).includes(String(instanceName).toLowerCase());
  }) || null;
}

/* ============ Endpoints الرسمية ============ */

export function createInstance(instanceName) {
  return evoFetch('/instance/create', {
    method: 'POST',
    body: {
      instanceName: String(instanceName),
      qrcode: true,
      integration: 'WHATSAPP',
      token: '',
      groupsMigrate: false,
      number: '',
    },
    timeoutMs: 30000,
  });
}

export function connectInstance(instanceName) {
  return evoFetch(`/instance/connect/${encodeURIComponent(instanceName)}`, { method: 'GET', timeoutMs: 30000 });
}

export function connectionState(instanceName) {
  return evoFetch(`/instance/connectionState/${encodeURIComponent(instanceName)}`, { method: 'GET' });
}

export function fetchInstances() {
  return evoFetch('/instance/fetchInstances', { method: 'GET', timeoutMs: 25000 });
}

export function sendTextMessage(instanceName, number, text) {
  return evoFetch(`/message/sendText/${encodeURIComponent(instanceName)}`, {
    method: 'POST',
    body: { number: String(number), textMessage: { text: String(text) }, linkPreview: true },
    timeoutMs: 25000,
  });
}

export function logoutInstance(instanceName) {
  return evoFetch(`/instance/logout/${encodeURIComponent(instanceName)}`, { method: 'DELETE' });
}

export function deleteInstance(instanceName) {
  return evoFetch(`/instance/delete/${encodeURIComponent(instanceName)}`, { method: 'DELETE' });
}

/* رسالة خطأ عربية مفهومة بدون كشف معلومات سرية.
   401 (مفتاح غير صالح) = مشكلة تهيئة يعجز المعلم عن حلها من الواجهة
   فيظهر له كـ «خدمة غير متاحة مؤقتًا»، والتفاصيل في سجلات الخادم فقط. */
export function describeEvolutionError(err) {
  const status = err?.status || 0;
  const raw = String(err?.message || '');
  if (status === 503 || status === 401) return 'خدمة واتساب غير متاحة مؤقتًا — حاول مرة أخرى بعد قليل.';
  if (status === 404) return 'جلسة الواتساب غير موجودة على السيرفر — اضغط «ربط واتساب» لإعادة إنشائها.';
  if (/number|phone|jid|not found|invalid/i.test(raw) && status === 400) return 'رقم الواتساب غير صحيح أو غير مسجل في واتساب.';
  if (status === 400) return 'تعذر إرسال الرسالة — تحقق من الرقم والصيغة ثم حاول مجددًا.';
  if (status === 429) return 'تم تجاوز حد الإرسال المسموح — انتظر قليلًا ثم حاول مجددًا.';
  return 'تعذر تنفيذ عملية الواتساب — حاول مرة أخرى بعد قليل.';
}

/* الحالة HTTP المناسبة للرد على الواجهة (401 من Railway = 503 للمستخدم) */
export function evolutionHttpStatus(err) {
  if (!err?.status || err.status === 401) return 503;
  return err.status;
}
