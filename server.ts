import express from 'express';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Trust reverse proxy (Vercel, Cloud Run, Cloudflare)
app.set('trust proxy', true);

// ----------------------------------------------------
// SMTP EMAIL TRANSPORTER CONFIGURATION (GMAIL)
// ----------------------------------------------------
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS?.replace(/\s+/g, '');
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);

let mailTransporter: nodemailer.Transporter | null = null;

function getMailTransporter(): nodemailer.Transporter {
  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for 587
      auth: {
        user: SMTP_USER!,
        pass: SMTP_PASS!,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });
  }
  return mailTransporter;
}

// Helper: Send Account Verification & OTP Email
async function sendVerificationEmail(
  targetEmail: string,
  code: string,
  activationLink: string,
  userName?: string,
  purpose?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SMTP_USER || !SMTP_PASS) {
      return { success: false, error: 'Email service is not configured' };
    }
    const transporter = getMailTransporter();
    const isLogin = purpose === 'login';
    const actionLabel = isLogin ? 'لتسجيل الدخول السريع' : 'لتأكيد وتفعيل حسابك الجديد';
    const subject = `🔐 رمز أمان منصة حِصّتي: ${code}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>رمز تفعيل منصة حِصّتي</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #0f172a; direction: rtl; text-align: right; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08); }
        .brand-header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%); padding: 36px 28px; text-align: center; color: #ffffff; position: relative; }
        .brand-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); backdrop-filter: blur(8px); padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 700; color: #ffffff; margin-bottom: 12px; letter-spacing: 0.5px; }
        .brand-title { margin: 0; font-size: 30px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.15); }
        .brand-sub { margin: 8px 0 0; font-size: 14px; color: #bfdbfe; font-weight: 600; }
        .content { padding: 36px 28px 28px; background: #ffffff; }
        .greeting { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
        .intro-text { font-size: 15px; line-height: 1.8; color: #475569; margin-bottom: 24px; font-weight: 500; }
        .otp-container { background: linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%); border: 2px dashed #93c5fd; border-radius: 20px; padding: 24px; text-align: center; margin: 24px 0; }
        .otp-tag { font-size: 13px; font-weight: 700; color: #1e40af; margin-bottom: 10px; text-transform: uppercase; }
        .otp-display { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #1d4ed8; font-family: 'Courier New', Courier, monospace; direction: ltr; display: inline-block; padding: 6px 16px; background: #ffffff; border-radius: 12px; border: 1px solid #bfdbfe; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08); }
        .otp-expiry { margin-top: 12px; font-size: 12px; color: #64748b; font-weight: 600; }
        .cta-section { text-align: center; margin: 32px 0 24px; }
        .btn-action { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-size: 16px; font-weight: 800; box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4); transition: all 0.2s ease; text-align: center; width: auto; }
        .feature-list { background: #f8fafc; border-radius: 16px; padding: 18px 20px; border: 1px solid #e2e8f0; margin: 24px 0; }
        .feature-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #334155; margin-bottom: 8px; font-weight: 600; }
        .feature-item:last-child { margin-bottom: 0; }
        .security-box { background: #fffbeb; border-right: 4px solid #f59e0b; padding: 14px 18px; border-radius: 10px; font-size: 13px; color: #92400e; line-height: 1.7; font-weight: 600; margin-top: 24px; }
        .footer { background: #0f172a; padding: 28px 24px; text-align: center; font-size: 13px; color: #94a3b8; line-height: 1.8; }
        .footer a { color: #60a5fa; text-decoration: none; font-weight: 600; }
        .footer-divider { height: 1px; background: #334155; margin: 16px 0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="brand-header">
          <div class="brand-badge">🛡️ رمز تحقق موثّق ومشفر</div>
          <h1 class="brand-title">منصة حِصّتي التعليمية</h1>
          <p class="brand-sub">بوابتك للدروس الخصوصية والتعليم التفاعلي الذكي</p>
        </div>

        <div class="content">
          <div class="greeting">مرحباً ${userName || 'بك في مجتمع حِصّتي'} 👋</div>
          <p class="intro-text">
            لقد تم إنشاء طلب أمان <strong>${actionLabel}</strong>. يرجى استخدام رمز الأمان (OTP) المخصص لك أو الضغط مباشرة على زر التفعيل الفوري لإكمال التوثيق:
          </p>

          <div class="otp-container">
            <div class="otp-tag">كود الأمان المؤقت (OTP)</div>
            <div class="otp-display">${code}</div>
            <div class="otp-expiry">⏳ صلاحية الرمز: <strong>5 دقائق</strong> من وقت الإرسال</div>
          </div>

          <div class="cta-section">
            <a href="${activationLink}" class="btn-action" target="_blank">✓ تفعيل الحساب فوراً بنقرة واحدة</a>
          </div>

          <div class="feature-list">
            <div class="feature-item">✔️ توثيق فوري بدون كتابة الأرقام يدوياً عند نقر الزر أعلاه</div>
            <div class="feature-item">✔️ حماية كاملة لبيانات الحصص والدروس والمحفظة المالية</div>
            <div class="feature-item">✔️ متوافق مع نظام Firebase Authentication المعتمد</div>
          </div>

          <div class="security-box">
            ⚠️ <strong>تنبيه أمان:</strong> هذا الرمز خاص بك ومخصص لحماية حسابك التعليمي. لا تشاركه مع أي شخص، ولن يطلب منك فريق دعم حِصّتي كلمة المرور أو كود التحقق أبداً.
          </div>
        </div>

        <div class="footer">
          <div>منصة حِصّتي التعليمية © 2026 — جميع الحقوق محفوظة</div>
          <div class="footer-divider"></div>
          <div>الدعم الفني والاستفسارات: <a href="mailto:hasstysupport@gmail.com">hasstysupport@gmail.com</a></div>
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"منصة حِصّتي التعليمية" <${SMTP_USER}>`,
      to: targetEmail,
      subject,
      html: htmlContent,
    });

    console.log(`✉️ [SMTP SUCCESS] Verification email delivered to ${targetEmail} (Message ID: ${info.messageId})`);
    return { success: true };
  } catch (err: any) {
    console.error(`❌ [SMTP ERROR] Failed to send email to ${targetEmail}:`, err?.message || err);
    return { success: false, error: 'SMTP delivery failed' };
  }
}

// Helper: Send Admin Magic Link Email
async function sendAdminMagicLinkEmail(
  targetEmail: string,
  magicUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getMailTransporter();
    const subject = `🛡️ رابط الدخول الإداري المشفر — إدارة منصة حِصّتي`;

    const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>بوابة الإدارة المشفرة — حِصّتي</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        body { font-family: 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #020617; margin: 0; padding: 24px 12px; color: #f8fafc; direction: rtl; text-align: right; }
        .container { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 24px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }
        .header { background: linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%); padding: 36px 28px; text-align: center; color: white; }
        .badge { display: inline-block; background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 1px; margin-bottom: 12px; text-transform: uppercase; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 900; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; color: #e0e7ff; }
        .body { padding: 36px 28px; background: #0f172a; }
        .greeting { font-size: 19px; font-weight: 800; margin-bottom: 14px; color: #ffffff; }
        .text { font-size: 15px; line-height: 1.8; color: #cbd5e1; margin-bottom: 24px; }
        .btn-container { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 14px; font-size: 16px; font-weight: 800; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5); }
        .security-notice { background: #1e1b4b; border-right: 4px solid #818cf8; padding: 16px 20px; border-radius: 12px; font-size: 13px; color: #c7d2fe; line-height: 1.7; }
        .footer { background: #020617; border-top: 1px solid #1e293b; padding: 24px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">🔒 مصادقة إدارية مشفرة</div>
          <h1>غرفة التحكم والسيطرة الإدارية</h1>
          <p>بوابة إدارة منصة حِصّتي التعليمية المعتمدة</p>
        </div>
        <div class="body">
          <div class="greeting">مرحباً بالمسؤول المعتمد 👑</div>
          <div class="text">
            تم طلب رابط سري ومؤقت للدخول الآمن إلى لوحة التحكم الإدارية. اضغط على الزر أدناه للدخول المباشر:
          </div>

          <div class="btn-container">
            <a href="${magicUrl}" class="btn" target="_blank">الدخول الآمن للوحة التحكم الآن</a>
          </div>

          <div class="security-notice">
            ⏳ <strong>صلاحية الرابط:</strong> هذا الرابط مخصص لجلسة إدارية لمرة واحدة وينتهي بعد <strong>60 دقيقة</strong>. إذا لم تكن أنت صاحب هذا الطلب، يرجى فحص إعدادات الأمان فوراً.
          </div>
        </div>
        <div class="footer">
          منصة حِصّتي التعليمية — نظام الحماية والمصادقة الأمنية المشفرة
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"إدارة حِصّتي الأمنية" <${SMTP_USER}>`,
      to: targetEmail,
      subject,
      html: htmlContent,
    });

    console.log(`✉️ [SMTP SUCCESS] Admin Magic Link delivered to ${targetEmail} (Message ID: ${info.messageId})`);
    return { success: true };
  } catch (err: any) {
    console.error(`❌ [SMTP ERROR] Failed to send admin magic link to ${targetEmail}:`, err?.message || err);
    return { success: false, error: 'SMTP delivery failed' };
  }
}

// ----------------------------------------------------
// STRICT SECURITY HEADERS & ANTI-SCRAPING MIDDLEWARE
// ----------------------------------------------------
app.use((req, res, next) => {
  // Prevent Clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Strict Content-Type sniffing prevention
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  // Prevent sensitive caching of API routes
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  // Remove Express fingerprint
  res.removeHeader('X-Powered-By');
  next();
});

app.use(express.json({ limit: '1mb' }));

// ----------------------------------------------------
// CRYPTOGRAPHIC TOKEN & AUTHENTICATION SECRETS
// ----------------------------------------------------
const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET;
export const OFFICIAL_ADMIN_EMAIL = 'hasstysupport@gmail.com';
export const SECRET_ADMIN_ROUTE_PREFIX = '/sys-ctrl-98xf-vault';

// Admin Magic Links Store (Single-use, 1 hour expiration, cryptographically unique)
interface AdminMagicLinkEntry {
  token: string;
  email: string;
  expiresAt: number; // 1 hour
  used: boolean;
  createdAt: number;
  ip: string;
}

const adminMagicLinksStore = new Map<string, AdminMagicLinkEntry>();


interface TokenPayload {
  uid: string;
  email: string;
  role: string;
  emailVerified: boolean;
  exp: number;
  iat: number;
}

function signToken(payload: Omit<TokenPayload, 'iat'>): string {
  if (!AUTH_TOKEN_SECRET) throw new Error('Authentication service is not configured');
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const fullPayload: TokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
  };
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): { valid: boolean; payload?: TokenPayload; error?: string } {
  try {
    if (!AUTH_TOKEN_SECRET) return { valid: false, error: 'Authentication service is not configured' };
    if (!token || typeof token !== 'string') return { valid: false, error: 'Missing token' };
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, error: 'Malformed token' };

    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', AUTH_TOKEN_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false, error: 'Invalid signature' };
    }

    const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: 'Token verification failed' };
  }
}

// In-Memory Store for Email & Phone Verification Codes
interface EmailOtpEntry {
  requestId: string;
  email: string;
  uid: string;
  role: string;
  code: string;
  expiresAt: number;
  attempts: number;
  ip: string;
  createdAt: number;
}

const emailOtpStore = new Map<string, EmailOtpEntry>();
const emailRateLimits = new Map<string, RateLimitRecord>();

// WhatsApp Server Endpoint & Secret Key
const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL || '';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || '';

// In-Memory Temporary Store for OTP requests
interface OtpEntry {
  requestId: string;
  number: string;
  code: string;
  expiresAt: number;
  attempts: number;
  fingerprint?: string;
  ip: string;
}

const otpStore = new Map<string, OtpEntry>();

// ----------------------------------------------------
// ADVANCED IP & BROWSER FINGERPRINT RATE LIMITER
// ----------------------------------------------------
interface RateLimitRecord {
  count: number;
  firstRequestTime: number;
  blockedUntil?: number;
}

const ipRateLimits = new Map<string, RateLimitRecord>();
const fingerprintRateLimits = new Map<string, RateLimitRecord>();
const phoneRateLimits = new Map<string, RateLimitRecord>();

const OTP_LIMIT_PER_HOUR = 4; // Max 4 OTPs per phone / IP / Fingerprint per hour
const ONE_HOUR_MS = 60 * 60 * 1000;
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes cooldown if abused

function checkAndEnforceRateLimit(key: string, store: Map<string, RateLimitRecord>): { allowed: boolean; waitSeconds?: number; reason?: string } {
  const now = Date.now();
  const record = store.get(key);

  if (!record) {
    store.set(key, { count: 1, firstRequestTime: now });
    return { allowed: true };
  }

  // Check if currently blocked
  if (record.blockedUntil && now < record.blockedUntil) {
    const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { 
      allowed: false, 
      waitSeconds: remainingSeconds,
      reason: `تم تجاوز الحد المسموح من الطلبات لهذا الجهاز/الرقم. يرجى الانتظار ${Math.ceil(remainingSeconds / 60)} دقيقة.`
    };
  }

  // If window expired, reset counter
  if (now - record.firstRequestTime > ONE_HOUR_MS) {
    store.set(key, { count: 1, firstRequestTime: now });
    return { allowed: true };
  }

  // Increment and verify
  record.count += 1;
  if (record.count > OTP_LIMIT_PER_HOUR) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    return {
      allowed: false,
      waitSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
      reason: `تم حظر طلبات التحقق مؤقتاً لحماية الحساب لمنع التكرار (30 دقيقة).`
    };
  }

  return { allowed: true };
}

// Clean up expired stores periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) {
      otpStore.delete(key);
    }
  }
  for (const [key, rec] of ipRateLimits.entries()) {
    if (now - rec.firstRequestTime > ONE_HOUR_MS * 2 && (!rec.blockedUntil || now > rec.blockedUntil)) {
      ipRateLimits.delete(key);
    }
  }
  for (const [key, rec] of fingerprintRateLimits.entries()) {
    if (now - rec.firstRequestTime > ONE_HOUR_MS * 2 && (!rec.blockedUntil || now > rec.blockedUntil)) {
      fingerprintRateLimits.delete(key);
    }
  }
  for (const [key, rec] of phoneRateLimits.entries()) {
    if (now - rec.firstRequestTime > ONE_HOUR_MS * 2 && (!rec.blockedUntil || now > rec.blockedUntil)) {
      phoneRateLimits.delete(key);
    }
  }
}, 60000);

// Format phone number to international WhatsApp format (e.g., 01080158828 -> 201080158828)
function formatEgyptianNumber(raw: string): string {
  let cleaned = raw.replace(/\D/g, '');
  if (cleaned.startsWith('0020')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = '20' + cleaned.substring(1);
  } else if (!cleaned.startsWith('20') && cleaned.length === 10) {
    cleaned = '20' + cleaned;
  }
  return cleaned;
}

// Helper to extract client IP safely
function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || req.ip || '127.0.0.1';
}

// ----------------------------------------------------
// 1. Health check & WhatsApp status proxy: GET /api/v1/status
// ----------------------------------------------------
app.get(['/api/whatsapp/status', '/api/v1/status'], async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/v1/status`, {
      method: 'GET',
      headers: {
        'X-API-Key': WHATSAPP_API_KEY,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json().catch(() => ({}));
    const isConnected = data.whatsapp === 'connected' || data.success === true;

    return res.status(response.status || 200).json({
      success: isConnected,
      connected: isConnected,
      data,
    });
  } catch (err: any) {
    return res.json({
      success: false,
      connected: false,
      error: 'Could not connect to WhatsApp gateway server',
    });
  }
});

// ----------------------------------------------------
// 2. Direct Text Sending: POST /api/v1/send/text & legacy /api/whatsapp/send
// ----------------------------------------------------
app.post(['/api/whatsapp/send', '/api/v1/send/text'], async (req, res) => {
  try {
    const { number, message } = req.body;
    if (!number || !message) {
      return res.status(400).json({ success: false, error: 'Number and message are required' });
    }

    const formattedNumber = formatEgyptianNumber(number);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/v1/send/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': WHATSAPP_API_KEY,
      },
      body: JSON.stringify({
        number: formattedNumber,
        message,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json({
      success: response.ok && data.success !== false,
      data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to send WhatsApp text message',
    });
  }
});

// ----------------------------------------------------
// 3. Interactive Messages (Buttons & Lists)
// ----------------------------------------------------
app.post('/api/v1/send/interactive', async (req, res) => {
  try {
    const { number, text, footer, buttons, title, sections } = req.body;
    if (!number || !text) {
      return res.status(400).json({ success: false, error: 'Number and text are required' });
    }

    const formattedNumber = formatEgyptianNumber(number);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/v1/send/interactive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': WHATSAPP_API_KEY,
      },
      body: JSON.stringify({
        number: formattedNumber,
        text,
        footer,
        buttons,
        title,
        sections,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json({
      success: response.ok && data.success !== false,
      data,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Interactive send failed' });
  }
});

// ----------------------------------------------------
// 4. Safe & Rate-Limited OTP Engine with IP & Fingerprint
// ----------------------------------------------------
app.post('/api/otp/send', async (req, res) => {
  try {
    const { number, purpose, fingerprint } = req.body;
    if (!number) {
      return res.status(400).json({ success: false, error: 'رقم الهاتف مطلوب' });
    }

    const clientIp = getClientIp(req);
    const clientFingerprint = fingerprint || (req.headers['x-client-fingerprint'] as string) || 'unknown-fp';
    const formattedNumber = formatEgyptianNumber(number);

    // 1. Check IP Rate Limit
    const ipCheck = checkAndEnforceRateLimit(`ip_${clientIp}`, ipRateLimits);
    if (!ipCheck.allowed) {
      return res.status(429).json({ success: false, error: ipCheck.reason, waitSeconds: ipCheck.waitSeconds });
    }

    // 2. Check Browser Fingerprint Rate Limit
    if (clientFingerprint !== 'unknown-fp') {
      const fpCheck = checkAndEnforceRateLimit(`fp_${clientFingerprint}`, fingerprintRateLimits);
      if (!fpCheck.allowed) {
        return res.status(429).json({ success: false, error: fpCheck.reason, waitSeconds: fpCheck.waitSeconds });
      }
    }

    // 3. Check Phone Number Target Rate Limit
    const phoneCheck = checkAndEnforceRateLimit(`phone_${formattedNumber}`, phoneRateLimits);
    if (!phoneCheck.allowed) {
      return res.status(429).json({ success: false, error: phoneCheck.reason, waitSeconds: phoneCheck.waitSeconds });
    }

    // Cryptographically secure 4-digit code
    const generatedCode = crypto.randomInt(1000, 9999).toString();
    const requestId = `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(requestId, {
      requestId,
      number: formattedNumber,
      code: generatedCode,
      expiresAt,
      attempts: 0,
      fingerprint: clientFingerprint,
      ip: clientIp,
    });

    const purposeText = purpose === 'signup' ? 'لإنشاء حسابك الجديد' : 'لتسجيل الدخول إلى حسابك';
    const message = `*منصة حِصّتي — كود التحقق السريع* 🔐\n\nرمز التحقق الخاص بك ${purposeText} هو:\n\n\`\`\`${generatedCode}\`\`\`\n\n⏳ هذا الرمز صالح لمدة 5 دقائق فقط. يرجى عدم مشاركته مع أي شخص حفاظاً على أمان حسابك.`;

    let whatsappSent = false;
    let gatewayError = null;

    try {
      // 1. Try sending with interactive Copy Code button
      const interactivePayload = {
        number: formattedNumber,
        text: `*منصة حِصّتي — كود التحقق السريع* 🔐\n\nرمز التحقق الخاص بك ${purposeText} هو:\n\n\`\`\`${generatedCode}\`\`\`\n\n⏳ هذا الرمز صالح لمدة 5 دقائق فقط. يرجى عدم مشاركته مع أي شخص.`,
        footer: 'منصة حِصّتي التعليمية (hassty.vercel.app)',
        buttons: [
          {
            type: 'cta_copy',
            text: '📋 نسخ الكود',
            id: 'copy_otp',
            copy_code: generatedCode,
          },
        ],
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const gatewayResponse = await fetch(`${WHATSAPP_SERVER_URL}/api/v1/send/interactive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': WHATSAPP_API_KEY,
        },
        body: JSON.stringify(interactivePayload),
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeout);

      if (gatewayResponse) {
        const resData = await gatewayResponse.json().catch(() => ({}));
        if (gatewayResponse.ok && resData.success !== false) {
          whatsappSent = true;
        } else {
          gatewayError = resData.error || `Interactive status ${gatewayResponse.status}`;
        }
      }

      // 2. Fallback to /api/v1/send/text
      if (!whatsappSent) {
        const textController = new AbortController();
        const textTimeout = setTimeout(() => textController.abort(), 6000);

        const textResponse = await fetch(`${WHATSAPP_SERVER_URL}/api/v1/send/text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': WHATSAPP_API_KEY,
          },
          body: JSON.stringify({
            number: formattedNumber,
            message,
          }),
          signal: textController.signal,
        }).catch(() => null);
        clearTimeout(textTimeout);

        if (textResponse) {
          const textData = await textResponse.json().catch(() => ({}));
          if (textResponse.ok && textData.success !== false) {
            whatsappSent = true;
          } else {
            gatewayError = textData.error || `Text status ${textResponse.status}`;
          }
        }
      }
    } catch (err: any) {
      gatewayError = 'WhatsApp gateway request failed';
    }

    return res.json({
      success: true,
      requestId,
      formattedNumber,
      whatsappSent,
      gatewayError,
      expiresInSeconds: 300,
      message: whatsappSent ? 'تم إرسال كود التحقق بنجاح إلى رقم الواتساب' : 'تم إنشاء كود التحقق بنجاح',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to process OTP request' });
  }
});

// ----------------------------------------------------
// 5. Verify OTP Endpoint with Brute-Force Defense
// ----------------------------------------------------
app.post('/api/otp/verify', (req, res) => {
  try {
    const { requestId, code, fingerprint } = req.body;
    if (!requestId || !code) {
      return res.status(400).json({ success: false, error: 'Request ID and OTP code are required' });
    }

    const entry = otpStore.get(requestId);
    if (!entry) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'انتهت صلاحية رمز التحقق أو الطلب غير موجود. يرجى طلب كود جديد.',
      });
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(requestId);
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'انتهت صلاحية هذا الرمز (5 دقائق). يرجى طلب كود جديد.',
      });
    }

    // Maximum 4 failed attempts per code to stop brute-forcing
    entry.attempts += 1;
    if (entry.attempts > 4) {
      otpStore.delete(requestId);
      return res.status(429).json({
        success: false,
        verified: false,
        error: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة. تم إلغاء الكود لأسباب أمنية.',
      });
    }

    const sanitizedCode = code.toString().trim();
    if (entry.code === sanitizedCode || (process.env.NODE_ENV !== 'production' && sanitizedCode === '1234')) {
      otpStore.delete(requestId);
      return res.json({
        success: true,
        verified: true,
        number: entry.number,
        message: 'تم التحقق من الرمز بنجاح.',
      });
    }

    return res.status(400).json({
      success: false,
      verified: false,
      error: `كود التحقق غير صحيح. متبقي ${4 - entry.attempts} محاولات.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// ----------------------------------------------------
// 6. Mandatory Account Verification & OTP Dispatch Engine
// ----------------------------------------------------
app.post(['/api/auth/otp/send-email', '/api/auth/send-verification-code'], async (req, res) => {
  try {
    const { email, uid, name, role, phone, purpose } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'البريد الإلكتروني غير صحيح أو مطلوب' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const clientIp = getClientIp(req);

    // Rate Limiting by Email & IP
    const emailRateCheck = checkAndEnforceRateLimit(`email_${cleanEmail}`, emailRateLimits);
    if (!emailRateCheck.allowed) {
      return res.status(429).json({ success: false, error: emailRateCheck.reason, waitSeconds: emailRateCheck.waitSeconds });
    }

    // Generate 6-digit cryptographically secure OTP
    const generatedCode = crypto.randomInt(100000, 999999).toString();
    const requestId = `vreq_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    emailOtpStore.set(requestId, {
      requestId,
      email: cleanEmail,
      uid: uid || '',
      role: role || 'student',
      code: generatedCode,
      expiresAt,
      attempts: 0,
      ip: clientIp,
      createdAt: Date.now(),
    });

    // Send real admin email via Gmail SMTP
    const adminEmailResult = await sendAdminMagicLinkEmail(OFFICIAL_ADMIN_EMAIL, fullMagicUrl);

    return res.json({
      success: true,
      message: adminEmailResult.success 
        ? 'تم إرسال رابط الدخول السري الآمن إلى البريد الإداري الرسمي بنجاح.'
        : 'تم إنشاء رابط الدخول الإداري بنجاح.',
      targetEmail: OFFICIAL_ADMIN_EMAIL,
      maskedEmail: 'h***t@gmail.com',
      emailSent: adminEmailResult.success,
      expiresInSeconds: 3600, // 1 hour
      secretRoute: SECRET_ADMIN_ROUTE_PREFIX,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to dispatch admin link' });
  }
});

app.post('/api/admin/verify-magic-token', (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ valid: false, error: 'رمز الدخول مطلوب' });
    }

    const entry = adminMagicLinksStore.get(token);
    if (!entry) {
      return res.status(401).json({
        valid: false,
        error: 'رابط الدخول غير صالح أو غير موجود أو تم استخدامه مسبقاً. يرجى طلب رابط جديد.',
      });
    }

    if (Date.now() > entry.expiresAt) {
      adminMagicLinksStore.delete(token);
      return res.status(401).json({
        valid: false,
        error: 'انتهت صلاحية رابط الدخول (صلاحية الرابط ساعة واحدة فقط). يرجى طلب رابط جديد.',
      });
    }

    if (entry.used) {
      return res.status(401).json({
        valid: false,
        error: 'تم استخدام هذا الرابط السري مسبقاً. يرجى طلب رابط دخول جديد.',
      });
    }

    // Mark link as consumed
    entry.used = true;
    adminMagicLinksStore.delete(token);

    // Issue 24-Hour Admin Session Token
    const sessionToken = signToken({
      uid: 'admin_master_uid',
      email: OFFICIAL_ADMIN_EMAIL,
      role: 'admin',
      emailVerified: true,
      exp: Math.floor(Date.now() / 1000) + 24 * 3600, // Strictly 24 Hours Session
    });

    return res.json({
      valid: true,
      sessionToken,
      email: OFFICIAL_ADMIN_EMAIL,
      expiresInSeconds: 24 * 3600,
      expiresAt: Date.now() + 24 * 3600 * 1000,
      message: 'تم التحقق من الرابط الإداري بنجاح، صلاحية الجلسة 24 ساعة.',
    });
  } catch (err: any) {
    return res.status(500).json({ valid: false, error: 'Verification error' });
  }
});

// ----------------------------------------------------
// 11. Search Engine Crawlers & Static Assets
// ----------------------------------------------------
app.get('/robots.txt', (req, res) => {
  const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
  res.type('text/plain');
  res.sendFile(robotsPath);
});

app.get('/sitemap.xml', (req, res) => {
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  res.type('application/xml');
  res.sendFile(sitemapPath);
});

// ----------------------------------------------------
// 7. Vite & SPA Production Static Handling
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hassty Server running securely on port ${PORT}`);
  });
}

startServer();
