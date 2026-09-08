import { jsonErr, jsonOk, readJsonBody } from '../config.js';
import { dbSelect } from '../supabase.js';
import { findProfile, internalOrUser, sendFile, sendText } from '../green.js';

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
    if (!phone) return jsonErr(res, 'لا يوجد رقم واتساب للمستلم.', 422);
    if (!templates[event]) return jsonErr(res, 'حدث واتساب غير معروف.', 422);

    const message = templates[event](data.role || access.profile?.role || '', data.name || access.profile?.full_name || '', data);
    const sent = await sendText(phone, message);
    let invoice = null;
    if (event === 'teacher_invoice' || (event === 'payment' && data.fileUrl)) {
      const fileUrl = data.fileUrl;
      if (fileUrl) invoice = await sendFile(phone, fileUrl, data.fileName || `hassty-${data.invoiceNumber || 'invoice'}.pdf`, 'فاتورة منصة حِصّتي 🧾');
    }
    return jsonOk(res, { success: true, sent, invoice });
  } catch (err) {
    console.error('[whatsapp/notify]', err);
    return jsonErr(res, err?.message || 'فشل إرسال إشعار واتساب.', err?.status || 500);
  }
}
