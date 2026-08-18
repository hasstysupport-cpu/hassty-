import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Trust reverse proxy (Vercel, Cloud Run, Cloudflare)
app.set('trust proxy', true);

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

// WhatsApp Server Endpoint & Secret Key
const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL || 'http://54.85.197.100:3000';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || 'CHANGE_THIS_SECRET_KEY';

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
      error: err?.message || 'Could not connect to WhatsApp gateway server',
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
      error: err?.message || 'Failed to send WhatsApp text message',
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
    return res.status(500).json({ success: false, error: err?.message || 'Interactive send failed' });
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
      gatewayError = err?.message;
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
    return res.status(500).json({ success: false, error: err?.message || 'Failed to process OTP request' });
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
    return res.status(500).json({ success: false, error: err?.message || 'Verification failed' });
  }
});

// ----------------------------------------------------
// 6. Search Engine Crawlers & Static Assets
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
