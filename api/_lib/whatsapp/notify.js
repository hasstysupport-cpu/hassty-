import { jsonErr, jsonOk, readJsonBody } from '../config.js';
import { findProfile, findProfileByPhone, internalOrUser, sendFile, sendText } from '../green.js';
import { sendPushToUser } from '../push.js';

const templates = {
  welcome: (role, name) => `*منصة حِصّتي — أهلاً بك* 👋\n\nمرحباً *${name || 'بك'}*! تم إنشاء حسابك في منصة حِصّتي بنجاح.\nنوع الحساب: *${role === 'parent' ? 'ولي أمر' : role === 'teacher' ? 'مدرس' : role === 'assistant' ? 'مساعد' : 'طالب'}* 🎓\n\nنحن معك لتسهيل إدارة التعليم والحصص والمتابعة.`,
  booking_confirmed: (d) => `*حِصّتي — تأكيد الحجز* ✅\n\nالطالب: *${d.studentName || 'طالب'}*\nالمادة: *${d.subject || 'حصة دراسية'}*\nالمدرس: *${d.teacherName || 'المدرس'}*\nالموعد: *${d.date || ''} ${d.time || ''}*\nرقم الحجز: *${d.bookingId || '—'}*`,
  parent_link: (d) => `*حِصّتي — طلب ربط ولي أمر* 👨‍👩‍👧\n\nيرغب *${d.parentName || 'ولي أمر'}* في ربط حسابك به لمتابعة تقدمك.\nيمكنك مراجعة الطلب من لوحة التحكم والموافقة أو الرفض.`,
  parent_link_approved: (d) => `*حِصّتي — تم الربط* ✅\n\nتم ربط حساب ولي الأمر *${d.parentName || ''}* بحساب الطالب *${d.studentName || ''}* بنجاح.`,
  attendance: (d) => `*حِصّتي — إشعار حضور* ${d.status === 'late' ? '🟡' : d.status === 'absent' ? '🔴' : '🟢'}\n\nالطالب: *${d.studentName || 'طالب'}*\nالمجموعة: *${d.groupName || 'المجموعة'}*\nالحالة: *${d.statusLabel || 'حاضر'}*\nالوقت: *${d.time || ''}*${d.lateMinutes ? `\nالتأخير: *${d.lateMinutes} دقيقة*` : ''}`,
  payment: (d) => `*حِصّتي — تأكيد الدفع* 🧾✅\n\nالطالب: *${d.studentName || 'طالب'}*\n${d.groupName ? `المجموعة: *${d.groupName}*\n` : ''}المبلغ: *${Number(d.amount || 0).toLocaleString('ar-EG')} ج.م*\nرقم العملية: *${d.invoiceNumber || d.transactionId || '—'}*\nالتاريخ: *${d.date || new Date().toLocaleDateString('ar-EG')}*`,
  teacher_invoice: (d) => `*حِصّتي — فاتورة مستحقات المدرس* 💰🧾\n\nالمدرس: *${d.teacherName || 'المدرس'}*\nالفترة: *${d.period || 'الفترة الحالية'}*\nإجمالي الإيراد: *${Number(d.gross || 0).toLocaleString('ar-EG')} ج.م*\nالعمولة: *${Number(d.commission || 0).toLocaleString('ar-EG')} ج.م*\nالصافي المستحق: *${Number(d.net || 0).toLocaleString('ar-EG')} ج.م*\nرقم الفاتورة: *${d.invoiceNumber || '—'}*`,
  support: (d) => `*حِصّتي — تحديث طلب الدعم* 🎧\n\nرقم الطلب: *${d.ticketNumber || '—'}*\nالحالة: *${d.status || 'جديد'}*\n\n${d.message || 'تم تحديث طلب الدعم الخاص بك.'}`,
};

async function recipientFromBody(body) {
  if (body.phone) return String(body.phone);
  if (body.recipientUserId) {
    const p = await findProfile(body.recipientUserId);
    return p?.phone || '';
  }
  return '';
}

/* نصوص إشعارات المتصفح (Web Push) — نفس أحداث الواتساب بدون تنسيق ماركداون */
const roleHome = (role) => role === 'parent' ? '/parent/dashboard' : role === 'teacher' ? '/teacher/dashboard' : role === 'assistant' ? '/assistant/dashboard' : '/student/dashboard';
const plain = (s) => String(s || '').replace(/\*/g, '');
const pushTemplates = {
  welcome: (d, role) => ({ title: 'أهلاً بك في منصة حِصّتي 🎓', body: `تم إنشاء حسابك بنجاح يا ${plain(d.name) || 'صديقنا'} — نورت المنصة!`, link: roleHome(d.role || role) }),
  booking_confirmed: (d) => ({ title: 'تأكيد الحجز ✅', body: `حصة ${plain(d.subject) || 'دراسية'} مع ${plain(d.teacherName) || 'المدرس'} — ${plain(d.date)} ${plain(d.time)}`.trim(), link: d.link || '/student/book' }),
  parent_link: (d) => ({ title: 'طلب ربط ولي أمر 👨‍👩‍👧', body: `يرغب ${plain(d.parentName) || 'ولي أمر'} في ربط حسابه بمتابعتك.`, link: d.link || '/student/notifications' }),
  parent_link_approved: (d) => ({ title: 'تم الربط بنجاح ✅', body: `تم ربط ${plain(d.parentName) || 'ولي الأمر'} بالطالب ${plain(d.studentName) || ''}.`.trim(), link: d.link || '/parent/dashboard' }),
  attendance: (d) => ({ title: `إشعار حضور ${d.status === 'late' ? '🟡' : d.status === 'absent' ? '🔴' : '🟢'}`, body: `${plain(d.studentName) || 'الطالب'} — ${plain(d.statusLabel) || 'حاضر'} ${plain(d.time) || ''}`.trim(), link: d.link || '/parent/attendance' }),
  payment: (d) => ({ title: 'تأكيد الدفع 🧾', body: `${plain(d.studentName) || ''} — ${Number(d.amount || 0).toLocaleString('ar-EG')} ج.م (عملية ${plain(d.invoiceNumber || d.transactionId) || '—'})`.trim(), link: d.link || '/parent/payments' }),
  teacher_invoice: (d) => ({ title: 'فاتورة مستحقاتك 💰', body: `الصافي المستحق: ${Number(d.net || 0).toLocaleString('ar-EG')} ج.م — فاتورة ${plain(d.invoiceNumber) || ''}`.trim(), link: d.link || '/teacher/payments' }),
  support: (d) => ({ title: 'تحديث طلب الدعم 🎧', body: plain(d.message) || `حالة الطلب ${plain(d.status) || 'تم تحديثها'}.`, link: d.link || '/student/notifications' }),
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  try {
    const body = await readJsonBody(req);
    if (!body) return jsonErr(res, 'تعذر قراءة بيانات الطلب.', 400);
    const access = await internalOrUser(req, ['admin', 'teacher', 'assistant', 'parent', 'student']);
    if (!access) return jsonErr(res, 'غير مصرح.', 401);

    const phone = await recipientFromBody(body);
    const event = String(body.event || '');
    const data = body.data || {};
    if (!templates[event]) return jsonErr(res, 'حدث واتساب غير معروف.', 422);

    /* معرّف المستلم للإشعارات (Web Push): recipientUserId مباشرة، أو ابحث بالرقم */
    let pushUserId = body.recipientUserId || '';
    if (!pushUserId && phone) {
      const byPhone = await findProfileByPhone(phone).catch(() => null);
      pushUserId = byPhone?.id || '';
    }

    if (!phone && !pushUserId) return jsonErr(res, 'لا يوجد رقم واتساب ولا معرّف مستخدم للمستلم.', 422);

    const message = templates[event](data.role || access.profile?.role || '', data.name || access.profile?.full_name || '', data);

    /* 1) واتساب (إن وُجد رقم) */
    let sent = null;
    if (phone) sent = await sendText(phone, message);

    let invoice = null;
    if (event === 'teacher_invoice' || (event === 'payment' && data.fileUrl)) {
      const fileUrl = data.fileUrl;
      if (fileUrl && phone) invoice = await sendFile(phone, fileUrl, data.fileName || `hassty-${data.invoiceNumber || 'invoice'}.pdf`, 'فاتورة منصة حِصّتي 🧾');
    }

    /* 2) إشعارات المتصفح (Web Push) — نفس الإشعار لأجهزة المستخدم حتى لو مقفّل الموقع */
    let push = { sent: 0, total: 0 };
    if (pushUserId) {
      try {
        const pt = pushTemplates[event](data, access.profile?.role || data.role || '');
        push = await sendPushToUser(pushUserId, { ...pt, tag: `hassty-${event}` });
      } catch (pushErr) {
        console.error('[whatsapp/notify] push failed:', pushErr?.message);
      }
    }

    return jsonOk(res, { success: true, sent, invoice, push });
  } catch (err) {
    console.error('[whatsapp/notify]', err);
    return jsonErr(res, err?.message || 'فشل إرسال إشعار واتساب.', err?.status || 500);
  }
}
