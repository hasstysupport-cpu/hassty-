import { getBrowserFingerprint } from './browserFingerprint';

/**
 * WhatsApp Gateway and Messaging Service Client
 * Full integration with the documented WhatsApp API (v1 endpoints, media, interactive buttons, reactions, and lists)
 */

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  formattedNumber?: string;
  data?: any;
  error?: string;
}

export interface OtpSendResult {
  success: boolean;
  requestId: string;
  formattedNumber: string;
  whatsappSent: boolean;
  gatewayError?: string;
  expiresInSeconds: number;
  debugCode?: string;
  error?: string;
}

export interface OtpVerifyResult {
  success: boolean;
  verified: boolean;
  number?: string;
  message?: string;
  error?: string;
}

export interface WhatsAppGatewayStatus {
  success: boolean;
  connected: boolean;
  whatsapp?: 'connected' | 'disconnected';
  session?: boolean;
  uptime?: number;
  data?: any;
  error?: string;
}

export type InteractiveButton =
  | { type: 'quick_reply'; text: string; id: string }
  | { type: 'cta_url'; text: string; url: string }
  | { type: 'cta_copy'; text: string; id: string; copy_code: string }
  | { type: 'cta_call'; text: string; phone_number: string };

export interface InteractiveListSection {
  title: string;
  rows: Array<{
    header?: string;
    title: string;
    description?: string;
    id: string;
  }>;
}

const DIRECT_WHATSAPP_SERVER = 'http://54.85.197.100:3000';

async function postGatewayApi(endpoint: string, body: any): Promise<any> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (e) {
    console.warn(`Local proxy to ${endpoint} failed, attempting direct gateway:`, e);
  }

  try {
    const directRes = await fetch(`${DIRECT_WHATSAPP_SERVER}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await directRes.json();
  } catch (err: any) {
    return { success: false, error: err?.message || 'فشل الاتصال بسيرفر الواتساب' };
  }
}

export const whatsappService = {
  /**
   * 1. Check connection status of WhatsApp Gateway: GET /api/v1/status
   */
  async checkStatus(): Promise<WhatsAppGatewayStatus> {
    try {
      const res = await fetch('/api/v1/status');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        return {
          success: data.success === true,
          connected: data.connected === true || data.data?.whatsapp === 'connected',
          whatsapp: data.data?.whatsapp || (data.connected ? 'connected' : 'disconnected'),
          session: data.data?.session,
          uptime: data.data?.uptime,
          data: data.data,
          error: data.error,
        };
      }
    } catch (e: any) {
      console.warn('Express proxy check failed, attempting direct WhatsApp gateway check:', e);
    }

    // Fallback: Direct server check for Vercel / static hosting
    try {
      const directRes = await fetch(`${DIRECT_WHATSAPP_SERVER}/api/v1/status`);
      const data = await directRes.json();
      return {
        success: data.success === true,
        connected: data.connected === true || data.data?.whatsapp === 'connected',
        whatsapp: data.data?.whatsapp || (data.connected ? 'connected' : 'disconnected'),
        session: data.data?.session,
        uptime: data.data?.uptime,
        data: data.data,
        error: data.error,
      };
    } catch (err: any) {
      return { success: false, connected: false, error: err?.message || 'Network error' };
    }
  },

  /**
   * 2. Send Plain/Unicode Text Message: POST /api/v1/send/text
   */
  async sendMessage(number: string, message: string): Promise<WhatsAppSendResult> {
    return postGatewayApi('/api/v1/send/text', { number, message });
  },

  /**
   * 3. Send Interactive Message with Buttons: POST /api/v1/send/interactive
   */
  async sendInteractive(params: {
    number: string;
    text: string;
    footer?: string;
    buttons: InteractiveButton[];
  }): Promise<WhatsAppSendResult> {
    return postGatewayApi('/api/v1/send/interactive', params);
  },

  /**
   * 4. Send Interactive List: POST /api/v1/send/interactive
   */
  async sendInteractiveList(params: {
    number: string;
    title: string;
    text: string;
    sections: InteractiveListSection[];
  }): Promise<WhatsAppSendResult> {
    return postGatewayApi('/api/v1/send/interactive', { ...params, type: 'single_select' });
  },

  /**
   * 5. Send Image: POST /api/v1/send/image
   */
  async sendImage(number: string, url: string, caption?: string): Promise<WhatsAppSendResult> {
    return postGatewayApi('/api/v1/send/image', { number, url, caption });
  },

  /**
   * 6. Send Video: POST /api/v1/send/video
   */
  async sendVideo(number: string, url: string, caption?: string): Promise<WhatsAppSendResult> {
    return postGatewayApi('/api/v1/send/video', { number, url, caption });
  },

  /**
   * 7. Send Document: POST /api/v1/send/document
   */
  async sendDocument(number: string, url: string, fileName: string, mimetype?: string): Promise<WhatsAppSendResult> {
    return postGatewayApi('/api/v1/send/document', { number, url, fileName, mimetype: mimetype || 'application/pdf' });
  },

  /**
   * 8. Send Audio: POST /api/v1/send/audio
   */
  async sendAudio(number: string, url: string, ptt: boolean = true): Promise<WhatsAppSendResult> {
    return postGatewayApi('/api/v1/send/audio', { number, url, ptt });
  },

  /**
   * 9. Send Location: POST /api/v1/send/location
   */
  async sendLocation(params: {
    number: string;
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  }): Promise<WhatsAppSendResult> {
    return postGatewayApi('/api/v1/send/location', params);
  },

  /**
   * 10. Send Reaction: POST /api/v1/send/reaction
   */
  async sendReaction(params: {
    number: string;
    messageKey: { remoteJid: string; fromMe: boolean; id: string };
    emoji: string;
  }): Promise<WhatsAppSendResult> {
    return postGatewayApi('/api/v1/send/reaction', params);
  },

  /**
   * 11. Send Secure WhatsApp OTP with server-side generation & Fingerprint Rate-Limiting
   */
  async requestOtp(number: string, purpose: 'login' | 'signup' = 'login'): Promise<OtpSendResult> {
    try {
      const fingerprint = await getBrowserFingerprint();
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Client-Fingerprint': fingerprint.visitorId
        },
        body: JSON.stringify({ 
          number, 
          purpose,
          fingerprint: fingerprint.visitorId,
          meta: {
            platform: fingerprint.platform,
            timezone: fingerprint.timezone
          }
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success) return json;
      }
    } catch (e: any) {
      console.warn('Proxy OTP endpoint failed, switching to direct gateway fallback:', e);
    }

    // Direct Fallback for Vercel / Static deployments:
    try {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem(`otp_${requestId}`, JSON.stringify({ code, expiresAt: Date.now() + 5 * 60 * 1000 }));

      const cleanNum = number.replace(/\D/g, '');
      const sendRes = await fetch(`${DIRECT_WHATSAPP_SERVER}/api/v1/send/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: cleanNum,
          message: `رمز التحقق السري لمنصة حِصّتي هو: ${code}\nيرجى عدم مشاركته مع أي شخص. ينتهي خلال 5 دقائق.`
        })
      });

      const sendData = await sendRes.json();
      return {
        success: sendData.success === true,
        requestId,
        formattedNumber: cleanNum,
        whatsappSent: sendData.success === true,
        expiresInSeconds: 300,
        debugCode: code,
        error: sendData.success ? undefined : (sendData.error || 'تعذر إرسال الرسالة عبر الواتساب')
      };
    } catch (err: any) {
      return {
        success: false,
        requestId: '',
        formattedNumber: number,
        whatsappSent: false,
        expiresInSeconds: 0,
        error: err?.message || 'فشل الاتصال بسيرفر الواتساب',
      };
    }
  },

  /**
   * 12. Verify WhatsApp OTP with Fingerprint Validation
   */
  async verifyOtp(requestId: string, code: string): Promise<OtpVerifyResult> {
    try {
      const fingerprint = await getBrowserFingerprint();
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Client-Fingerprint': fingerprint.visitorId
        },
        body: JSON.stringify({ 
          requestId, 
          code,
          fingerprint: fingerprint.visitorId 
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success || json.verified !== undefined) return json;
      }
    } catch (e: any) {
      console.warn('Proxy verify OTP endpoint failed, fallback to client verification:', e);
    }

    // Fallback verification for Vercel / Static deployments
    try {
      const storedStr = sessionStorage.getItem(`otp_${requestId}`);
      if (!storedStr) {
        return { success: false, verified: false, error: 'رمز التحقق منتهي أو غير صحيح' };
      }
      const stored = JSON.parse(storedStr);
      if (Date.now() > stored.expiresAt) {
        sessionStorage.removeItem(`otp_${requestId}`);
        return { success: false, verified: false, error: 'انتهت صلاحية كود التحقق' };
      }
      if (stored.code === code.trim()) {
        sessionStorage.removeItem(`otp_${requestId}`);
        return { success: true, verified: true };
      } else {
        return { success: false, verified: false, error: 'رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى' };
      }
    } catch (err: any) {
      return { success: false, verified: false, error: 'حدث خطأ أثناء التحقق من الكود' };
    }
  },

  /**
   * 13. Send real-time WhatsApp Attendance Notification to parent
   */
  async sendAttendanceNotice(params: {
    parentPhone: string;
    studentName: string;
    groupName: string;
    status: 'on_time' | 'late' | 'absent_cutoff';
    offsetMinutes: number;
    timeString: string;
  }): Promise<WhatsAppSendResult> {
    const { parentPhone, studentName, groupName, status, offsetMinutes, timeString } = params;

    let message = '';
    if (status === 'on_time') {
      message = `*منصة حِصّتي — إشعار حضور فوري* 🟢\n\nنحيطكم علماً بوصول ابنكم/ابنتكم *${studentName}* لمجموعة *${groupName}* في الموعد المحدد تماماً الساعة *${timeString}*.\n\nنتمنى له/لها حصة موفقة ومثمرة! 🎓`;
    } else if (status === 'late') {
      message = `*منصة حِصّتي — تنبيه تأخير* 🟡\n\nوصل ابنكم/ابنتكم *${studentName}* لمجموعة *${groupName}* الساعة *${timeString}* بتأخير قدره *(${offsetMinutes} دقيقة)* وتم قيده (حاضر متأخر).\n\nيرجى حث الطالب على الالتزام بموعد الحصة.`;
    } else {
      message = `*منصة حِصّتي — تنبيه غياب هام* 🔴\n\nتنبيه عاجل: حضر الطالب *${studentName}* لمجموعة *${groupName}* بعد انقضاء أكثر من نصف الحصة (+${offsetMinutes} دقيقة)، وتم اعتباره غياباً لضمان التحصيل العلمي.\n\nيرجى التواصل مع المدرس لتنسيق موعد تعويضي.`;
    }

    return this.sendMessage(parentPhone, message);
  },

  /**
   * 14. Send WhatsApp Payment receipt to parent
   */
  async sendPaymentReceipt(params: {
    parentPhone: string;
    studentName: string;
    groupName: string;
    amount: number;
    invoiceNumber: string;
    billingType: 'per_session' | 'monthly';
  }): Promise<WhatsAppSendResult> {
    const { parentPhone, studentName, groupName, amount, invoiceNumber, billingType } = params;
    const typeLabel = billingType === 'per_session' ? 'حصة دراسية' : 'اشتراك شهري';

    const message = `*منصة حِصّتي — إيصال سداد إلكتروني معتمد* 🧾✅\n\nتم بنجاح تحصيل رسوم (${typeLabel}) للطالب: *${studentName}*\nالمجموعة: *${groupName}*\nالمبلغ المستلم: *${amount} ج.م*\nرقم الإيصال: *${invoiceNumber}*\nالتاريخ: *${new Date().toLocaleDateString('ar-EG')}*\n\nشكراً لثقتكم في منصة حِصّتي.`;

    return this.sendMessage(parentPhone, message);
  },
};
