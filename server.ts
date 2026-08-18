import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// WhatsApp Server Endpoint & Secret Key (configured via env or defaults for testing)
const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL || 'http://54.85.197.100:3000';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || 'CHANGE_THIS_SECRET_KEY';

// In-Memory Temporary Store for OTP requests
interface OtpEntry {
  requestId: string;
  number: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OtpEntry>();

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) {
      otpStore.delete(key);
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
      formattedNumber,
      data,
    });
  } catch (err: any) {
    console.error('Error sending WhatsApp message:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to send WhatsApp message via gateway',
    });
  }
});

// ----------------------------------------------------
// 3. Interactive Messages & Buttons: POST /api/v1/send/interactive
// ----------------------------------------------------
app.post('/api/v1/send/interactive', async (req, res) => {
  try {
    const { number, text, footer, buttons, title, sections } = req.body;
    if (!number || (!text && !title)) {
      return res.status(400).json({ success: false, error: 'number and text/title are required' });
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
// 4. Media Endpoints: Image, Video, Document, Audio, Location
// ----------------------------------------------------
app.post('/api/v1/send/image', async (req, res) => {
  try {
    const { number, url, caption } = req.body;
    const formattedNumber = formatEgyptianNumber(number);

    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/v1/send/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': WHATSAPP_API_KEY },
      body: JSON.stringify({ number: formattedNumber, url, caption }),
    });
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json({ success: response.ok, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/send/video', async (req, res) => {
  try {
    const { number, url, caption } = req.body;
    const formattedNumber = formatEgyptianNumber(number);

    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/v1/send/video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': WHATSAPP_API_KEY },
      body: JSON.stringify({ number: formattedNumber, url, caption }),
    });
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json({ success: response.ok, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/send/document', async (req, res) => {
  try {
    const { number, url, fileName, mimetype } = req.body;
    const formattedNumber = formatEgyptianNumber(number);

    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/v1/send/document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': WHATSAPP_API_KEY },
      body: JSON.stringify({ number: formattedNumber, url, fileName, mimetype }),
    });
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json({ success: response.ok, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/send/audio', async (req, res) => {
  try {
    const { number, url, ptt } = req.body;
    const formattedNumber = formatEgyptianNumber(number);

    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/v1/send/audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': WHATSAPP_API_KEY },
      body: JSON.stringify({ number: formattedNumber, url, ptt }),
    });
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json({ success: response.ok, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/send/location', async (req, res) => {
  try {
    const { number, latitude, longitude, name, address } = req.body;
    const formattedNumber = formatEgyptianNumber(number);

    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/v1/send/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': WHATSAPP_API_KEY },
      body: JSON.stringify({ number: formattedNumber, latitude, longitude, name, address }),
    });
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json({ success: response.ok, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/send/reaction', async (req, res) => {
  try {
    const { number, messageKey, emoji } = req.body;
    const formattedNumber = formatEgyptianNumber(number);

    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/v1/send/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': WHATSAPP_API_KEY },
      body: JSON.stringify({ number: formattedNumber, messageKey, emoji }),
    });
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json({ success: response.ok, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 5. Safe OTP Engine: POST /api/otp/send
// ----------------------------------------------------
app.post('/api/otp/send', async (req, res) => {
  try {
    const { number, purpose } = req.body;
    if (!number) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const formattedNumber = formatEgyptianNumber(number);
    
    // Generate secure 4-digit code
    const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(requestId, {
      requestId,
      number: formattedNumber,
      code: generatedCode,
      expiresAt,
      attempts: 0,
    });

    const purposeText = purpose === 'signup' ? 'لإنشاء حسابك الجديد' : 'لتسجيل الدخول إلى حسابك';
    const message = `*منصة حِصّتي — كود التحقق السريع* 🔐\n\nرمز التحقق الخاص بك ${purposeText} هو:\n\n\`\`\`${generatedCode}\`\`\`\n\n⏳ هذا الرمز صالح لمدة 5 دقائق فقط. يرجى عدم مشاركته مع أي شخص حفاظاً على أمان حسابك.`;

    let whatsappSent = false;
    let gatewayError = null;

    try {
      // 1. Try sending with interactive Copy Code button (with both button structures supported by Baileys interactive route)
      const interactivePayload = {
        number: formattedNumber,
        text: `*منصة حِصّتي — كود التحقق السريع* 🔐\n\nرمز التحقق الخاص بك ${purposeText} هو:\n\n\`\`\`${generatedCode}\`\`\`\n\n⏳ هذا الرمز صالح لمدة 5 دقائق فقط. يرجى عدم مشاركته مع أي شخص.`,
        footer: 'منصة حِصّتي التعليمية',
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
      }).catch((err) => {
        return null;
      });
      clearTimeout(timeout);

      if (gatewayResponse) {
        const resData = await gatewayResponse.json().catch(() => ({}));

        if (gatewayResponse.ok && resData.success !== false) {
          whatsappSent = true;
        } else {
          gatewayError = resData.error || `Interactive status ${gatewayResponse.status}`;
        }
      }

      // 2. If interactive failed on Baileys (e.g. 500 Invalid media type if Baileys requires media/template header or client doesn't support proto), fallback to /api/v1/send/text
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
        });
        clearTimeout(textTimeout);

        const textData = await textResponse.json().catch(() => ({}));

        if (textResponse.ok && textData.success !== false) {
          whatsappSent = true;
        } else {
          gatewayError = textData.error || `Text status: ${textResponse.status}`;
        }
      }
    } catch (e: any) {
      gatewayError = e?.message || 'WhatsApp Gateway unreachable';
      console.warn('WhatsApp gateway send error:', gatewayError);
    }

    return res.json({
      success: true,
      requestId,
      formattedNumber,
      whatsappSent,
      gatewayError: gatewayError || undefined,
      expiresInSeconds: 300,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'OTP generation failed' });
  }
});

// ----------------------------------------------------
// 6. Safe OTP Verification: POST /api/otp/verify
// ----------------------------------------------------
app.post('/api/otp/verify', (req, res) => {
  try {
    const { requestId, code } = req.body;
    if (!requestId || !code) {
      return res.status(400).json({ success: false, error: 'requestId and code are required' });
    }

    const entry = otpStore.get(requestId);
    if (!entry) {
      return res.status(400).json({ success: false, error: 'انتهت صلاحية رمز التحقق أو تم استخدامه مسبقاً' });
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(requestId);
      return res.status(400).json({ success: false, error: 'انتهت مدة صلاحية الرمز (5 دقائق)، يرجى طلب رمز جديد' });
    }

    entry.attempts += 1;
    if (entry.attempts > 5) {
      otpStore.delete(requestId);
      return res.status(400).json({ success: false, error: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة' });
    }

    if (entry.code !== code.trim()) {
      return res.status(400).json({ success: false, error: 'رمز التحقق غير صحيح، يرجى التأكد وإعادة المحاولة' });
    }

    // Success - consume OTP
    otpStore.delete(requestId);

    return res.json({
      success: true,
      verified: true,
      number: entry.number,
      message: 'تم التحقق بنجاح',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Verification error' });
  }
});

// ----------------------------------------------------
// Vite & Static Asset Handling
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
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
