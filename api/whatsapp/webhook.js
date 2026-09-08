import { jsonOk, jsonErr, readJsonBody } from '../_lib/config.js';
import { validWebhookToken, findProfileByPhone, sendText } from './_green.js';

function extractText(body) {
  return String(
    body?.messageData?.textMessageData?.textMessage ||
    body?.messageData?.extendedTextMessageData?.text ||
    body?.messageData?.quotedMessageData?.text ||
    ''
  ).trim();
}

function senderPhone(body) {
  const id = body?.senderData?.sender || body?.senderData?.chatId || body?.chatId || '';
  return String(id).replace(/@c\.us$/, '').replace(/@lid$/, '').replace(/\D/g, '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  if (!validWebhookToken(req)) return jsonErr(res, 'غير مصرح.', 401);
  try {
    const body = await readJsonBody(req);
    if (!body) return jsonErr(res, 'بيانات Webhook غير صالحة.', 400);
    const type = String(body.typeWebhook || '');
    if (type !== 'incomingMessageReceived') return jsonOk(res, { received: true, ignored: true });

    const phone = senderPhone(body);
    const text = extractText(body).toLowerCase();
    if (!phone) return jsonOk(res, { received: true, ignored: true });

    const profile = await findProfileByPhone(phone);
    if (!profile) {
      await sendText(phone, '*منصة حِصّتي* 👋\nأهلاً بك. لم نتمكن من ربط هذا الرقم بحساب حِصّتي. يمكنك التواصل مع الدعم من موقعنا.');
      return jsonOk(res, { received: true, matched: false });
    }

    let reply = '';
    if (/^(اهلا|أهلا|مرحبا|مرحبا|hi|hello)\b/.test(text)) {
      reply = `أهلاً *${profile.full_name || 'بك'}* 👋\nأنا مساعد حِصّتي على واتساب. اكتب: *مساعدة* لمعرفة الأوامر المتاحة.`;
    } else if (/(مساعدة|help|menu|القائمة)/.test(text)) {
      reply = '*حِصّتي — المساعد* 🤖\n\n• اكتب *الدعم* لمعلومات الدعم.\n• اكتب *الموقع* لرابط المنصة.\n• اكتب *حالة الحساب* للتواصل مع الدعم حول حسابك.\n\nالإشعارات المهمة مثل الحجز والحضور والدفع والفواتير تُرسل تلقائيًا على هذا الرقم.';
    } else if (/(الموقع|الرابط|site|website)/.test(text)) {
      reply = '🌐 منصة حِصّتي:\nhttps://hassty.vercel.app';
    } else if (/(الدعم|support)/.test(text)) {
      reply = '🎧 الدعم الفني عبر واتساب: تواصل مع فريق حِصّتي من صفحة اتصل بنا داخل المنصة.';
    } else {
      return jsonOk(res, { received: true, matched: true, replied: false });
    }

    await sendText(phone, reply);
    return jsonOk(res, { received: true, matched: true, replied: true });
  } catch (err) {
    console.error('[whatsapp/webhook]', err);
    return jsonErr(res, 'تم استقبال Webhook لكن حدث خطأ أثناء المعالجة.', 500);
  }
}
