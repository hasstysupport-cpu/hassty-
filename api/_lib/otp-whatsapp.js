/* ============================================================
   Hassty Auth — WhatsApp OTP delivery (best-effort, dual-channel)
   يرسل رمز التحقق على واتساب المستخدم (إن وُجد رقم مسجل) بجانب
   البريد الإلكتروني — لا يرمي أخطاء أبدًا حتى لا يعطّل تدفق الرموز.
   ============================================================ */
import { sendText } from './green.js';
import { CODE_TTL_MINUTES } from './config.js';

const PURPOSE_LABELS = {
  signup_verify: 'تفعيل الحساب',
  login_otp: 'تسجيل الدخول',
  password_reset: 'تغيير كلمة المرور',
};

export async function sendCodeWhatsApp({ phone, code, purpose, name = '' }) {
  const cleanPhone = String(phone || '').trim();
  if (!cleanPhone || !code) return { sent: false, reason: 'no_phone' };

  const label = PURPOSE_LABELS[purpose] || 'التحقق';
  const greet = name ? `\n\nأهلًا *${name}* 👋` : '';
  const message =
    `*منصة حِصّتي* 🔐\nرمز ${label}${greet}\n\nرمزك: *${code}*\n\n⏱ الرمز صالح ${CODE_TTL_MINUTES} دقائق ولمرة واحدة فقط.\n🔐 لا تشاركه مع أي شخص — فريق حِصّتي لا يطلبه أبدًا.\n\nلو لم تطلب هذا الرمز تجاهل هذه الرسالة.`;

  try {
    await sendText(cleanPhone, message);
    return { sent: true };
  } catch (err) {
    console.warn('[otp-whatsapp] send failed:', err?.message || err);
    return { sent: false, reason: err?.message || 'error' };
  }
}
