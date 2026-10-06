/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/* ============================================================
   Hassty WhatsApp — single dynamic serverless function.
   Routes: /api/whatsapp/status | send | setup | notify | webhook
           + teacher (Evolution): create | connect | disconnect

   التوجيه الذكي (دون كسر أي نظام قائم):
   - status/send: المعلم الذي ربط رقمه الخاص (Evolution) تُخدم
     طلباته من مثيله هو؛ كل الآخرين (أدمن/مساعد/ولي أمر/معلم بلا
     ربط) يسيرون على مسار Green API كما كان تمامًا.
   (Implementations live in api/_lib/whatsapp — not counted
   against the Hobby plan serverless function limit.)
   ============================================================ */
import { jsonErr } from '../_lib/config.js';
import status from '../_lib/whatsapp/status.js';
import send from '../_lib/whatsapp/send.js';
import setup from '../_lib/whatsapp/setup.js';
import notify from '../_lib/whatsapp/notify.js';
import webhook from '../_lib/whatsapp/webhook.js';
import teacherWhatsApp, { teacherCaller, teacherWithInstance } from '../_lib/whatsapp/teacher.js';

/* المعلم (بربط أو بدونه) → مسار واتساب المدرس دائمًا حتى لا يهدر polling
   طلبات Green API؛ كل الآخرين (أدمن/مساعد/ولي أمر/طالب) على Green كما كان.
   الإرسال: فقط المعلم المرتبط فعليًا يُحوّل لمثيله الخاص. */
async function routeStatus(req, res) {
  const t = await teacherCaller(req);
  if (t) return teacherWhatsApp.status(req, res);
  return status(req, res);
}

async function routeSend(req, res) {
  const t = await teacherWithInstance(req);
  if (t) return teacherWhatsApp.send(req, res);
  return send(req, res);
}

const handlers = {
  status: routeStatus,
  send: routeSend,
  setup,
  notify,
  webhook,
  create: teacherWhatsApp.create,
  connect: teacherWhatsApp.connect,
  disconnect: teacherWhatsApp.disconnect,
};

export default async function handler(req, res) {
  const action = String(req.query?.action || '').replace(/\/+$/, '').toLowerCase();
  const handle = handlers[action];
  if (!handle) return jsonErr(res, 'مسار واتساب غير معروف.', 404);
  return handle(req, res);
}
