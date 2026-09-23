/* ============================================================
   Hassty Auth — Branded Gmail mailer (serverless)
   RTL Arabic, simple & professional, matching the platform identity.
   ============================================================ */
import nodemailer from 'nodemailer';
import { GMAIL_USER, GMAIL_PASS, SITE_URL, CODE_TTL_MINUTES } from './config.js';

let cachedTransporter = null;

/* ---------- مزود البريد (Provider selection) ----------
   الأولوية: 1) Resend API (من دومين hassty.site الرسمي — الحل الاحترافي ضد السبام)
             2) SMTP خارجي (Brevo/SendGrid/غيره عبر متغيرات SMTP_*)
             3) Gmail SMTP (الخطة الاحتياطية الحالية) */
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const MAIL_FROM = process.env.MAIL_FROM || '';

function getProvider() {
  if (RESEND_API_KEY) return 'resend';
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) return 'smtp';
  return 'gmail';
}

function getFromAddress(provider) {
  if (MAIL_FROM) return MAIL_FROM;
  if (provider === 'resend') return 'منصة حِصّتي <noreply@hassty.site>';
  if (provider === 'smtp') return `"منصة حِصّتي" <${SMTP_USER}>`;
  return `"منصة حِصّتي" <${GMAIL_USER}>`;
}

async function sendViaResend(mail) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: mail.from,
      to: [mail.to],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      headers: mail.headers,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend API ${res.status}: ${body.slice(0, 300)}`);
  }
}

/* ---------- توجيه بريد حسابات الاختبار (QA) ----------
   حسابات الاختبار أدناه لها عناوين بريد وهمية لا يملكها أحد،
   لذا يُسلَّم رمزها إلى بريد الدعم الرسمي (GMAIL_USER) الذي نتحكم به —
   هكذا يمكن تسجيل الدخول بأي حساب اختبار وقراءة رمز OTP فعليًا.
   (مطابقة العنوان حرفيًا 100% — لا توجيه لأي بريد مستخدم حقيقي) */
const QA_ACCOUNT_REDIRECT = new Set([
  'qa.teacher.hassty@gmail.com',
  'qa.student.hassty@gmail.com',
  'qa.parent.hassty@gmail.com',
  'qa.assistant.hassty@gmail.com',
  'qa.newparent.hassty@gmail.com',
  'qa.newstudent.hassty@gmail.com',
  'seed.teacher.hassty@gmail.com',
  'seed.mariem.hassty@gmail.com',
  'seed.omar.hassty@gmail.com',
  'seed.salma.hassty@gmail.com',
  'seed.karim.hassty@gmail.com',
]);

function getTransporter() {
  if (!cachedTransporter) {
    if (getProvider() === 'smtp') {
      cachedTransporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
    } else {
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
function layout({ title, intro, code, ctaLink, ctaText, note, hideExpiry }) {
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

  const expiryBlock = (code && !hideExpiry)
    ? `
      <tr>
        <td style="padding:0 28px 8px;">
          <div style="font-size:12px;color:${C.subText};line-height:1.8;">⏱ الرمز صالح لمدة ${CODE_TTL_MINUTES} دقائق فقط، ويمكن استخدامه مرة واحدة.</div>
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

          ${expiryBlock}

          ${note ? `
          <!-- QA routing note -->
          <tr>
            <td style="padding:0 28px 8px;">
              <div style="font-size:12px;color:#9A3412;line-height:1.8;background:#FFF7ED;border-radius:10px;padding:10px 14px;border:1px solid #FED7AA;">🧪 ${note}</div>
            </td>
          </tr>` : ''}

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
              <div style="font-size:11px;color:${C.subText};margin-top:4px;">للدعم: <a href="https://t.me/+-gGdGyw60wA2MDRk" style="color:${C.brand};text-decoration:none;">جروب تليجرام</a> أو <a href="https://chat.whatsapp.com/DDU2o4jiLASAcVeEb6BnNu" style="color:${C.brand};text-decoration:none;">جروب واتساب</a></div>
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
  signup_verify: ({ code, name, link, note }) => ({
    subject: `رمز تفعيل حسابك في حِصّتي: ${code}`,
    html: layout({
      title: `أهلًا ${name || ''} 👋 خطوة أخيرة لتفعيل حسابك`,
      intro: 'شكرًا لانضمامك إلى منظومة حِصّتي! أدخل رمز التحقق التالي لتأكيد ملكيتك للبريد الإلكتروني وإكمال إنشاء حسابك:',
      code,
      ctaLink: link,
      ctaText: 'تفعيل الحساب الآن',
      note,
    }),
  }),
  login_otp: ({ code, name, link, note }) => ({
    subject: `رمز تسجيل الدخول إلى حِصّتي: ${code}`,
    html: layout({
      title: `رمز تسجيل الدخول${name ? ` — أهلًا ${name}` : ''}`,
      intro: 'طلبات تسجيل الدخول إلى حسابك من جهاز جديد. أدخل الرمز التالي لإكمال الدخول بأمان:',
      code,
      ctaLink: link,
      ctaText: 'إكمال تسجيل الدخول',
      note,
    }),
  }),
  password_reset: ({ code, name, link, note }) => ({
    subject: `رمز تغيير كلمة المرور — حِصّتي: ${code}`,
    html: layout({
      title: 'تغيير كلمة مرور حسابك',
      intro: 'وصلنا طلب لإعادة تعيين كلمة مرور حسابك في حِصّتي. أدخل الرمز التالي مع كلمة المرور الجديدة:',
      code,
      ctaLink: link,
      ctaText: 'تغيير كلمة المرور',
      note,
    }),
  }),
  teacher_verification_approved: ({ name, link }) => ({
    subject: 'تم اعتماد حسابك كمعلم موثق في حِصّتي',
    html: layout({
      title: `تهانينا ${name || 'أستاذ'}! تم اعتماد حسابك ✅`,
      intro: 'بعد مراجعة إدارة منصة حِصّتي، تم اعتماد توثيق حسابك كمدرس. أصبح حسابك الآن موثقًا رسميًا، وظهر اسمك في دليل المدرسين المعتمدين على المنصة، ويمكن للطلاب وأولياء الأمور الوصول إليك بثقة.',
      ctaLink: link || `${SITE_URL}/login`,
      ctaText: 'الدخول إلى لوحة المدرس',
      hideExpiry: true,
    }),
  }),
  teacher_verification_rejected: ({ name, reason, link }) => ({
    subject: 'بخصوص طلب توثيق حسابك في حِصّتي',
    html: layout({
      title: `${name ? `${name}، ` : ''}لم يتم اعتماد طلب التوثيق حاليًا`,
      intro: `شكرًا لاهتمامك بالانضمام كمدرس موثق في منصة حِصّتي. بعد المراجعة، لم يتم اعتماد طلب التوثيق في الوقت الحالي.${reason ? `<br><br><b>سبب القرار:</b> ${reason}` : ''}<br><br>يمكنك التواصل مع فريق الدعم للاستفسار عن التفاصيل أو إعادة التقديم بعد استيفاء المتطلبات.`,
      ctaLink: link || `${SITE_URL}/contact`,
      ctaText: 'التواصل مع الدعم',
      hideExpiry: true,
    }),
  }),
  teacher_verification_admin_alert: ({ name, subject: subj, governorate, phone }) => ({
    subject: `طلب توثيق مدرس جديد بانتظار المراجعة: ${name || 'مدرس جديد'}`,
    html: layout({
      title: 'طلب توثيق مدرس جديد في الطابور',
      intro: `مدرس جديد سجّل في المنصة وطلب توثيق حسابه:<br><br>\n<b>الاسم:</b> ${name || '—'}<br>\n<b>المادة:</b> ${subj || '—'}<br>\n<b>المحافظة:</b> ${governorate || '—'}<br>\n<b>الهاتف:</b> ${phone || '—'}<br><br>\nالطلب في انتظار مراجعتكم من طابور التوثيق في لوحة الإدارة.`,
      ctaLink: `${SITE_URL}/admin`,
      ctaText: 'فتح لوحة الإدارة',
      hideExpiry: true,
    }),
  }),
};

/* ---------- Verification-flow sender (webhook-driven) ----------
   event: 'approved' | 'rejected' | 'new_request'
   approved/rejected → بريد المدرس | new_request → بريد الدعم (الإدارة) */
export async function sendVerificationEmail({ event, teacherEmail, teacherName = '', subject = '', governorate = '', phone = '', reason = '' }) {
  const EVENTS = {
    approved: { tpl: TEMPLATES.teacher_verification_approved, to: teacherEmail },
    rejected: { tpl: TEMPLATES.teacher_verification_rejected, to: teacherEmail },
    new_request: { tpl: TEMPLATES.teacher_verification_admin_alert, to: SUPPORT_EMAIL },
  };
  const entry = EVENTS[event];
  if (!entry) throw new Error(`Unknown verification event: ${event}`);
  if (!entry.to) return { skipped: true, reason: 'no recipient' };

  const { subject: subj, html } = entry.tpl({ name: teacherName, subject, governorate, phone, reason });
  const provider = getProvider();
  const mail = {
    from: getFromAddress(provider),
    to: entry.to,
    subject: subj,
    html,
    text: subj,
    headers: {
      'X-Entity-Ref-ID': `hassty-verif-${event}-${Date.now()}`,
      'Auto-Submitted': 'auto-generated',
    },
  };

  if (provider === 'resend') {
    await sendViaResend(mail);
  } else {
    await getTransporter().sendMail(mail);
  }
  return { ok: true, provider, to: entry.to };
}

/* ---------- Sender ---------- */
/* الروابط تختلف حسب الغرض:
   - signup_verify  → صفحة التفعيل (تفعيل تلقائي بالرابط)
   - password_reset → فتح نافذة الاستعادة في صفحة الدخول مع الرمز جاهزًا
   - login_otp      → العودة لصفحة الدخول (الرمز يُدخل حيث بدأت العملية) */
export async function sendAuthEmail({ to, purpose, code, name = '', extraQuery = '' }) {
  const enc = encodeURIComponent(to);
  const links = {
    signup_verify: `${SITE_URL}/verify-email?auto=1&purpose=signup_verify&code=${code}&email=${enc}${extraQuery}`,
    login_otp: `${SITE_URL}/login`,
    password_reset: `${SITE_URL}/login?reset=1&code=${code}&email=${enc}${extraQuery}`,
  };
  const link = links[purpose] || links.signup_verify;
  const tpl = TEMPLATES[purpose];
  if (!tpl) throw new Error(`Unknown email purpose: ${purpose}`);

  /* QA test accounts → deliver to the support inbox we control */
  const isQaAccount = QA_ACCOUNT_REDIRECT.has(to);
  const recipient = isQaAccount ? GMAIL_USER : to;
  const note = isQaAccount
    ? `رمز مخصّص لحساب اختبار: ${to} — تُسلَّم رموز جميع حسابات الاختبار إلى بريد الدعم.`
    : undefined;

  const { subject, html } = tpl({ code, name, link, note });

  const provider = getProvider();
  const mail = {
    from: getFromAddress(provider),
    to: recipient,
    subject,
    html,
    text: `${subject}\n\nالرمز: ${code} — صالح ${CODE_TTL_MINUTES} دقائق.\n${link}${isQaAccount ? `\n(رمز حساب اختبار: ${to})` : ''}`,
    headers: {
      'X-Entity-Ref-ID': `hassty-${purpose}-${Date.now()}`,
      'Auto-Submitted': 'auto-generated',
      ...(isQaAccount ? { 'X-Hassty-QA-Account': to } : {}),
    },
  };

  if (provider === 'resend') {
    await sendViaResend(mail);
  } else {
    await getTransporter().sendMail(mail);
  }

  return { subject, link, provider };
}
