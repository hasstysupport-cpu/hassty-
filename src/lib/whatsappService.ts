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

export const whatsappService = {
  /**
   * 1. Check connection status of WhatsApp Gateway: GET /api/v1/status
   */
  async checkStatus(): Promise<WhatsAppGatewayStatus> {
    try {
      const res = await fetch('/api/v1/status');
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
    } catch (e: any) {
      return { success: false, connected: false, error: e?.message || 'Network error' };
    }
  },

  /**
   * 2. Send Plain/Unicode Text Message: POST /api/v1/send/text
   */
  async sendMessage(number: string, message: string): Promise<WhatsAppSendResult> {
    try {
      const res = await fetch('/api/v1/send/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, message }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send WhatsApp message' };
    }
  },

  /**
   * 3. Send Interactive Message with Buttons (Copy Code, URL, Quick Reply, Call): POST /api/v1/send/interactive
   */
  async sendInteractive(params: {
    number: string;
    text: string;
    footer?: string;
    buttons: InteractiveButton[];
  }): Promise<WhatsAppSendResult> {
    try {
      const res = await fetch('/api/v1/send/interactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send interactive message' };
    }
  },

  /**
   * 4. Send Interactive List (Single Select): POST /api/v1/send/interactive
   */
  async sendInteractiveList(params: {
    number: string;
    title: string;
    text: string;
    sections: InteractiveListSection[];
  }): Promise<WhatsAppSendResult> {
    try {
      const res = await fetch('/api/v1/send/interactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          type: 'single_select',
        }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send interactive list' };
    }
  },

  /**
   * 5. Send Image: POST /api/v1/send/image
   */
  async sendImage(number: string, url: string, caption?: string): Promise<WhatsAppSendResult> {
    try {
      const res = await fetch('/api/v1/send/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, url, caption }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send image' };
    }
  },

  /**
   * 6. Send Video: POST /api/v1/send/video
   */
  async sendVideo(number: string, url: string, caption?: string): Promise<WhatsAppSendResult> {
    try {
      const res = await fetch('/api/v1/send/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, url, caption }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send video' };
    }
  },

  /**
   * 7. Send Document: POST /api/v1/send/document
   */
  async sendDocument(number: string, url: string, fileName: string, mimetype?: string): Promise<WhatsAppSendResult> {
    try {
      const res = await fetch('/api/v1/send/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, url, fileName, mimetype: mimetype || 'application/pdf' }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send document' };
    }
  },

  /**
   * 8. Send Audio / Voice note: POST /api/v1/send/audio
   */
  async sendAudio(number: string, url: string, ptt: boolean = true): Promise<WhatsAppSendResult> {
    try {
      const res = await fetch('/api/v1/send/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, url, ptt }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send audio' };
    }
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
    try {
      const res = await fetch('/api/v1/send/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send location' };
    }
  },

  /**
   * 10. Send Emoji Reaction: POST /api/v1/send/reaction
   */
  async sendReaction(params: {
    number: string;
    messageKey: { remoteJid: string; fromMe: boolean; id: string };
    emoji: string;
  }): Promise<WhatsAppSendResult> {
    try {
      const res = await fetch('/api/v1/send/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send reaction' };
    }
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
      return await res.json();
    } catch (e: any) {
      return {
        success: false,
        requestId: '',
        formattedNumber: number,
        whatsappSent: false,
        expiresInSeconds: 0,
        error: e?.message || 'Failed to request OTP',
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
      return await res.json();
    } catch (e: any) {
      return { success: false, verified: false, error: e?.message || 'OTP verification request failed' };
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
