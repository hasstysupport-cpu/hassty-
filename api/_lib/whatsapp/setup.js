/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import { jsonErr, jsonOk, readJsonBody } from '../config.js';
import { configureWebhook, internalOrUser } from '../green.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  const access = await internalOrUser(req, ['admin']);
  if (!access) return jsonErr(res, 'صلاحية الإدارة مطلوبة.', 403);
  try {
    await readJsonBody(req);
    const data = await configureWebhook();
    return jsonOk(res, { success: true, data, webhookPath: '/api/whatsapp/webhook' });
  } catch (err) {
    console.error('[whatsapp/setup]', err);
    return jsonErr(res, err?.message || 'فشل إعداد Webhook.', err?.status || 500);
  }
}
