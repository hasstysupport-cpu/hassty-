import { jsonErr, jsonOk } from '../config.js';
import { internalOrUser, getGreenState } from '../green.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return jsonErr(res, 'طريقة الطلب غير مسموحة.', 405);
  const access = await internalOrUser(req, ['admin', 'teacher', 'assistant', 'parent', 'student']);
  if (!access) return jsonErr(res, 'غير مصرح.', 401);
  try {
    const data = await getGreenState();
    const state = data?.stateInstance || data?.state || 'unknown';
    return jsonOk(res, { success: true, connected: state === 'authorized', state, data });
  } catch (err) {
    return jsonErr(res, err?.message || 'تعذر الوصول إلى GREEN API.', err?.status || 502);
  }
}
