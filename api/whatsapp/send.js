import { readJsonBody, jsonOk, jsonErr } from '../_lib/config.js';
import { internalOrUser, sendText, sendFile, sendLocation, sendInteractive, chatId } from './_green.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  try {
    const body = await readJsonBody(req);
    if (!body) return jsonErr(res, 'تعذر قراءة بيانات الطلب.', 400);
    const access = await internalOrUser(req, ['admin', 'teacher', 'assistant', 'parent', 'student']);
    if (!access) return jsonErr(res, 'غير مصرح.', 401);

    const kind = String(body.kind || 'text');
    const number = body.number || body.phone;
    if (!number) return jsonErr(res, 'رقم الهاتف مطلوب.', 422);

    let data;
    if (kind === 'text') {
      if (!body.message) return jsonErr(res, 'نص الرسالة مطلوب.', 422);
      data = await sendText(number, body.message);
    } else if (kind === 'file') {
      data = await sendFile(number, body.url, body.fileName, body.caption || '');
    } else if (kind === 'location') {
      data = await sendLocation(number, body.latitude, body.longitude, body.name || '', body.address || '');
    } else if (kind === 'interactive') {
      data = await sendInteractive(number, { header: body.header, body: body.message || body.body, footer: body.footer, buttons: body.buttons });
    } else {
      return jsonErr(res, 'نوع رسالة غير مدعوم.', 422);
    }

    return jsonOk(res, { success: true, data, chatId: chatId(number) });
  } catch (err) {
    console.error('[whatsapp/send]', err);
    return jsonErr(res, err?.message || 'فشل إرسال رسالة واتساب.', err?.status || 500);
  }
}
