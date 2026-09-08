/**
 * Hassty WhatsApp client.
 * GREEN API credentials stay server-side in Vercel API functions.
 */
import { supabase } from './supabase';
export interface WhatsAppSendResult { success: boolean; messageId?: string; formattedNumber?: string; data?: any; error?: string; }
export interface WhatsAppGatewayStatus { success: boolean; connected: boolean; state?: string; data?: any; error?: string; }
export type InteractiveButton =
  | { type: 'quick_reply'; text: string; id: string }
  | { type: 'cta_url'; text: string; url: string }
  | { type: 'cta_copy'; text: string; id: string; copy_code: string }
  | { type: 'cta_call'; text: string; phone_number: string };
export interface InteractiveListSection { title: string; rows: Array<{ header?: string; title: string; description?: string; id: string }>; }

async function post(path: string, body?: any, method = 'POST') {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    /* Best-effort auth: attach the Supabase access token when a session exists,
       so /api/whatsapp/* serverless functions can verify the caller. */
    try {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (token) headers.Authorization = `Bearer ${token}`;
      }
    } catch { /* anonymous calls stay allowed for the webhook side */ }
    const res = await fetch(path, { method, headers, body: method === 'GET' ? undefined : JSON.stringify(body || {}) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json?.error || `WhatsApp API ${res.status}`, data: json };
    return json;
  } catch (err: any) { return { success: false, error: err?.message || 'فشل الاتصال بخدمة الواتساب' }; }
}

async function sendKind(kind: string, body: any): Promise<WhatsAppSendResult> {
  const result = await post('/api/whatsapp/send', { ...body, kind });
  return { success: result.success === true || result.ok === true, messageId: result.data?.idMessage || result.data?.messageId, formattedNumber: body.number, data: result.data || result, error: result.error };
}

export const whatsappService = {
  async checkStatus(): Promise<WhatsAppGatewayStatus> {
    const result = await post('/api/whatsapp/status', undefined, 'GET');
    return { success: result.success === true || result.ok === true, connected: result.connected === true, state: result.state, data: result.data, error: result.error };
  },
  async setupWebhook() { return post('/api/whatsapp/setup', {}); },
  async sendMessage(number: string, message: string) { return sendKind('text', { number, message }); },
  async sendInteractive(params: { number: string; text: string; footer?: string; header?: string; buttons: InteractiveButton[] }) {
    return sendKind('interactive', { number: params.number, message: params.text, footer: params.footer, header: params.header, buttons: params.buttons });
  },
  async sendInteractiveList(params: { number: string; title: string; text: string; sections: InteractiveListSection[] }) {
    const lines = params.sections.flatMap(section => [section.title, ...section.rows.map(row => `• ${row.title}${row.description ? ` — ${row.description}` : ''}`)]);
    return sendKind('text', { number: params.number, message: `*${params.title}*\n\n${params.text}\n\n${lines.join('\n')}` });
  },
  async sendImage(number: string, url: string, caption?: string) { return sendKind('file', { number, url, fileName: 'hassty-image.jpg', caption }); },
  async sendVideo(number: string, url: string, caption?: string) { return sendKind('file', { number, url, fileName: 'hassty-video.mp4', caption }); },
  async sendDocument(number: string, url: string, fileName: string, _mimetype?: string) { return sendKind('file', { number, url, fileName, caption: '' }); },
  async sendAudio(number: string, url: string, _ptt = true) { return sendKind('file', { number, url, fileName: 'hassty-audio.mp3', caption: '' }); },
  async sendLocation(params: { number: string; latitude: number; longitude: number; name?: string; address?: string }) { return sendKind('location', params); },
  async sendReaction(_params: { number: string; messageKey: { remoteJid: string; fromMe: boolean; id: string }; emoji: string }) { return { success: false, error: 'التفاعلات المباشرة غير مفعلة حاليًا في طبقة GREEN API.' }; },
  async notifyEvent(event: string, data: any = {}, recipientUserId?: string, phone?: string) { return post('/api/whatsapp/notify', { event, data, recipientUserId, phone }); },
  async sendAttendanceNotice(params: { parentPhone: string; studentName: string; groupName: string; status: 'on_time' | 'late' | 'absent_cutoff'; offsetMinutes: number; timeString: string }) {
    const status = params.status === 'on_time' ? 'present' : params.status === 'late' ? 'late' : 'absent';
    const statusLabel = params.status === 'on_time' ? 'حاضر في الموعد' : params.status === 'late' ? 'حاضر متأخر' : 'غائب';
    return this.notifyEvent('attendance', { studentName: params.studentName, groupName: params.groupName, status, statusLabel, lateMinutes: params.offsetMinutes, time: params.timeString }, undefined, params.parentPhone);
  },
  async sendPaymentReceipt(params: { parentPhone: string; studentName: string; groupName: string; amount: number; invoiceNumber: string; billingType: 'per_session' | 'monthly'; fileUrl?: string; fileName?: string }) {
    return this.notifyEvent('payment', { ...params, typeLabel: params.billingType === 'per_session' ? 'حصة دراسية' : 'اشتراك شهري' }, undefined, params.parentPhone);
  },
  async sendTeacherInvoice(params: { teacherPhone: string; teacherName?: string; period: string; gross: number; commission: number; net: number; invoiceNumber: string; fileUrl?: string; fileName?: string }) {
    return this.notifyEvent('teacher_invoice', params, undefined, params.teacherPhone);
  },
  async sendWelcome(params: { phone: string; role: 'student' | 'parent' | 'teacher' | 'assistant'; name: string; userId?: string }) {
    return this.notifyEvent('welcome', { role: params.role, name: params.name }, params.userId, params.phone);
  },
};
