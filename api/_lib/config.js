/* ============================================================
   Hassty Auth — Shared constants & config (serverless)
   ============================================================ */

export const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://mxryrgoxofsvjsvpxzew.supabase.co';

export const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const PEPPER = process.env.AUTH_CODE_PEPPER || 'hassty-dev-pepper';

export const GMAIL_USER = process.env.GMAIL_USER || process.env.SMTP_USER || 'hasstysupport@gmail.com';
export const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').replace(/\s+/g, '');

export const SITE_URL = process.env.APP_URL || 'https://hassty.vercel.app';
export const SUPPORT_EMAIL = 'hasstysupport@gmail.com';

/* ---- Verification code policy ---- */
export const CODE_TTL_MINUTES = 10;      // صلاحية الرمز
export const CODE_RESEND_COOLDOWN = 60;  // ثوانٍ بين كل إرسال
export const CODE_MAX_ATTEMPTS = 5;      // محاولات إدخال خاطئة
export const CODE_WINDOW_HOURS = 6;      // نافذة الحد الأقصى
export const CODE_MAX_PER_WINDOW = 5;    // أقصى رموز في النافذة
export const TRUST_DEVICE_DAYS = 30;     // مدة توثيق الجهاز

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_REGEX = /^(?:\+?20)?01[0125][0-9]{8}$/;

export const ALLOWED_ROLES = ['student', 'parent', 'teacher', 'assistant'];

export const ARABIC_ERRORS = {
  server: 'حدث خطأ غير متوقع في الخادم. حاول مرة أخرى بعد قليل.',
  method: 'طريقة الطلب غير مسموحة.',
  body: 'تعذر قراءة بيانات الطلب.',
  email: 'صيغة البريد الإلكتروني غير صحيحة.',
  password: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتتضمن حروفًا وأرقامًا.',
  phone: 'رقم الهاتف غير صحيح (مثال صحيح: 01012345678).',
  name: 'يرجى إدخال الاسم الكامل (حرفان على الأقل).',
  role: 'نوع الحساب غير صحيح.',
  consent: 'يجب الموافقة على الشروط وسياسة الخصوصية لإنشاء الحساب.',
  rateLimit: 'تم تجاوز الحد المسموح من المحاولات. حاول بعد قليل.',
  cooldown: (s) => `يرجى الانتظار ${s} ثانية قبل طلب رمز جديد.`,
  wrongCode: 'رمز التحقق غير صحيح. تحقق من الرمز وحاول مجددًا.',
  expiredCode: 'انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا.',
  tooManyAttempts: 'تم تجاوز عدد المحاولات المسموح لهذا الرمز. اطلب رمزًا جديدًا.',
};

/* Mask an email for display: ab***cd@gmail.com */
export function maskEmail(email) {
  const [local, domain] = String(email || '').split('@');
  if (!domain) return 'بريدك';
  const l = local || 'user';
  return l.length > 2 ? `${l.slice(0, 2)}***${l.slice(-1)}@${domain}` : `${l[0] || '*'}***@${domain}`;
}

/* JSON response helpers */
export function jsonOk(res, data = {}, status = 200) {
  return res.status(status).json({ ok: true, ...data });
}
export function jsonErr(res, message, status = 400, extra = {}) {
  return res.status(status).json({ ok: false, error: message, ...extra });
}

/* Read + parse a JSON POST body safely */
export async function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 64 * 1024) req.destroy(); // 64KB guard
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve(null); }
    });
    req.on('error', () => resolve(null));
  });
}

/* Validate password: 8+ chars, at least one letter and one digit */
export function isValidPassword(pw) {
  return typeof pw === 'string' && pw.length >= 8 && /[A-Za-z\u0600-\u06FF]/.test(pw) && /[0-9]/.test(pw);
}
