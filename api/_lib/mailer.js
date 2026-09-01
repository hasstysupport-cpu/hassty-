/* ============================================================
   Hassty Auth — Branded Gmail mailer (serverless)
   RTL Arabic, simple & professional, matching the platform identity.
   ============================================================ */
import nodemailer from 'nodemailer';
import { GMAIL_USER, GMAIL_PASS, SITE_URL, CODE_TTL_MINUTES } from './config.js';

let cachedTransporter = null;

function getTransporter() {
  if (!cachedTransporter) {
    if (!GMAIL_USER || !GMAIL_PASS) {
      throw new Error('GMAIL credentials are not configured');
    }
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });
  }
  return cachedTransporter;
}

/* ---------- Brand palette (matches the web identity) ---------- */
const C = {
  brand: '#2563EB',
  brand2: '#7C3AED',
  navy: '#1E3A8A',
  softBlue: '#EFF6FF',
  borderBlue: '#BFDBFE',
  text: '#1F2937',
  subText: '#64748B',
  bg: '#EEF2F9',
};

/* ---------- Shared layout (email-safe: tables + inline styles) ---------- */
function layout({ title, intro, code, ctaLink, ctaText, note }) {
  const codeBlock = code
    ? `
      <tr>
        <td style="padding:0 8px 18px">
          <div dir="ltr" style="font-family:'Courier New',monospace;font-size:34px;font-weight:800;color:${C.navy};background:${C.softBlue};border:2px dashed ${C.brand};border-radius:14px;padding:16px 10px;text-align:center;letter-spacing:10px;line-height:1;">${code}</div>
        </td>
      </tr>`
    : '';

  const ctaBlock = ctaLink
    ? `
      <tr>
        <td align="center" style="padding:4px 8px 18px">
          <a href="${ctaLink}" style="display:inline-block;background:${C.brand};color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;padding:13px 38px;border-radius:999px;">${ctaText || 'متابعة'}</a>
        </td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};">
    <tr>
      <td align="center" style="padding:26px 12px 36px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 8px 24px rgba(30,58,138,0.07);">

          <!-- Header -->
          <tr>
            <td bgcolor="${C.brand}" style="padding:26px 28px 22px;" align="center">
              <div style="color:#ffffff;font-size:26px;font-weight:800;letter-spacing:0.5px;">حِصّتي</div>
              <div style="color:#DBEAFE;font-size:11px;font-weight:600;margin-top:4px;">منظومة الدروس الخصوصية الأذكى</div>
            </td>
          </tr>
          <tr><td bgcolor="${C.brand2}" style="height:5px;line-height:5px;font-size:0;">&nbsp;</td></tr>

          <!-- Title -->
          <tr>
            <td style="padding:24px 28px 6px;">
              <div style="font-size:19px;font-weight:800;color:${C.navy};line-height:1.5;">${title}</div>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:0 28px 14px;">
              <div style="font-size:14px;color:${C.text};line-height:1.9;">${intro}</div>
            </td>
          </tr>

          ${codeBlock}
          ${ctaBlock}

          <!-- Expiry note -->
          <tr>
            <td style="padding:0 28px 8px;">
              <div style="font-size:12px;color:${C.subText};line-height:1.8;">⏱ الرمز صالح لمدة ${CODE_TTL_MINUTES} دقائق فقط، ويمكن استخداره مرة واحدة.</div>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:0 28px 22px;">
              <div style="font-size:12px;color:${C.subText};line-height:1.8;background:#F8FAFC;border-radius:10px;padding:10px 14px;border:1px solid #EDF2F7;">🔐 لو لم تكن أنت من طلب هذا الرمز، تجاهل هذه الرسالة ولا تشاركها مع أي شخص. فريق حِصّتي لا يطلب كلمة مرورك أبدًا.</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#F8FAFF" style="padding:16px 28px;border-top:1px solid #E2E8F0;" align="center">
              <div style="font-size:12px;color:${C.navy};font-weight:800;">حِصّتي — منصة إدارة الدروس الخصوصية</div>
              <div style="font-size:11px;color:${C.subText};margin-top:4px;">للدعم: <a href="mailto:hasstysupport@gmail.com" style="color:${C.brand};text-decoration:none;">hasstysupport@gmail.com</a></div>
              <div style="font-size:10px;color:#94A3B8;margin-top:6px;">هذه رسالة آلية — لا تردّ عليها مباشرةً.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ---------- Purpose-specific content ---------- */
const TEMPLATES = {
  signup_verify: ({ code, name, link }) => ({
    subject: `رمز تفعيل حسابك في حِصّتي: ${code}`,
    html: layout({
      title: `أهلًا ${name || ''} 👋 خطوة أخيرة لتفعيل حسابك`,
      intro: 'شكرًا لانضمامك إلى منظومة حِصّتي! أدخل رمز التحقق التالي لتأكيد ملكيتك للبريد الإلكتروني وإكمال إنشاء حسابك:',
      code,
      ctaLink: link,
      ctaText: 'تفعيل الحساب الآن',
    }),
  }),
  login_otp: ({ code, name, link }) => ({
    subject: `رمز تسجيل الدخول إلى حِصّتي: ${code}`,
    html: layout({
      title: `رمز تسجيل الدخول${name ? ` — أهلًا ${name}` : ''}`,
      intro: 'طلبات تسجيل الدخول إلى حسابك من جهاز جديد. أدخل الرمز التالي لإكمال الدخول بأمان:',
      code,
      ctaLink: link,
      ctaText: 'إكمال تسجيل الدخول',
    }),
  }),
  password_reset: ({ code, name, link }) => ({
    subject: `رمز تغيير كلمة المرور — حِصّتي: ${code}`,
    html: layout({
      title: 'تغيير كلمة مرور حسابك',
      intro: 'وصلنا طلب لإعادة تعيين كلمة مرور حسابك في حِصّتي. أدخل الرمز التالي مع كلمة المرور الجديدة:',
      code,
      ctaLink: link,
      ctaText: 'تغيير كلمة المرور',
    }),
  }),
};

/* ---------- Sender ---------- */
export async function sendAuthEmail({ to, purpose, code, name = '', extraQuery = '' }) {
  const link = `${SITE_URL}/verify-email?auto=1&purpose=${purpose}&code=${code}&email=${encodeURIComponent(to)}${extraQuery}`;
  const tpl = TEMPLATES[purpose];
  if (!tpl) throw new Error(`Unknown email purpose: ${purpose}`);

  const { subject, html } = tpl({ code, name, link });

  await getTransporter().sendMail({
    from: `"منصة حِصّتي" <${GMAIL_USER}>`,
    to,
    subject,
    html,
    text: `${subject}\n\nالرمز: ${code} — صالح ${CODE_TTL_MINUTES} دقائق.\n${link}`,
    headers: {
      'X-Entity-Ref-ID': `hassty-${purpose}-${Date.now()}`,
    },
  });

  return { subject, link };
}
