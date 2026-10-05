/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/** Secure Hassty admin authentication helpers.
 *  ملاحظة أمنية: لا يوجد أي بريد إداري مكتوب هنا — القايمة البيضاء
 *  محفوظة على السيرفر فقط وتُدار من لوحة الإدارة (/api/auth/admin-otp). */
import { supabase } from './supabase';

export const SECRET_ADMIN_ROUTE = '/sys-control-hassty-vault-2026';
export const ADMIN_SESSION_KEY = 'hassty_admin_session_v3';
export const ADMIN_SESSION_EXPIRES_KEY = 'hassty_admin_exp_v3';

export function isCurrentAdminSessionValid(): boolean {
  try {
    const token = localStorage.getItem(ADMIN_SESSION_KEY);
    const exp = Number(localStorage.getItem(ADMIN_SESSION_EXPIRES_KEY));
    return Boolean(token && exp && Date.now() < exp);
  } catch {
    return false;
  }
}

export function saveAdminSession(
  sessionOrToken: string | { token: string; expiresAt?: number; email?: string; role?: string },
  expiresAt?: number,
): void {
  try {
    const session = typeof sessionOrToken === 'string'
      ? { token: sessionOrToken, expiresAt }
      : sessionOrToken;
    if (!session.token) return;
    const exp = Number(session.expiresAt || Date.now() + 24 * 60 * 60 * 1000);
    localStorage.setItem(ADMIN_SESSION_KEY, session.token);
    localStorage.setItem(ADMIN_SESSION_EXPIRES_KEY, String(exp));
    if (session.email) localStorage.setItem('hassty_admin_email', session.email);
    localStorage.setItem('hassty_admin_auth', 'true');
  } catch {}
}

export function clearAdminSession(): void {
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_EXPIRES_KEY);
    localStorage.removeItem('hassty_admin_auth');
    localStorage.removeItem('hassty_admin_email');
    sessionStorage.removeItem('hassty_admin_magic_code');
    sessionStorage.removeItem('hassty_admin_magic_token');
    sessionStorage.removeItem('hassty_admin_magic_token_exp');
  } catch {}
}

type AdminAuthResult = {
  valid: boolean;
  sessionToken?: string;
  expiresAt?: number;
  email?: string;
  error?: string;
};

/** طلب رمز دخول إداري (6 أرقام) — السيرفر يتحقق من القايمة البيضاء.
 *  البريد مطلوب من المستخدم ولا يُملأ مسبقًا من الكود. */
export async function requestAdminMagicLink(targetEmail: string): Promise<{
  success: boolean;
  message?: string;
  maskedEmail?: string;
  expiresInSeconds?: number;
  secretRoute?: string;
  error?: string;
}> {
  const email = String(targetEmail || '').trim().toLowerCase();
  if (!email) return { success: false, error: 'يرجى إدخال البريد الإداري المعتمد.' };

  try {
    const res = await fetch('/api/auth/admin-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', email }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      return { success: false, error: data?.error || `تعذر إرسال الكود (${res.status}).` };
    }
    return {
      success: true,
      message: 'تم إرسال رمز الدخول الإداري إلى البريد المعتمد.',
      maskedEmail: data.maskedEmail,
      expiresInSeconds: data.expiresIn || 600,
      secretRoute: SECRET_ADMIN_ROUTE,
    };
  } catch {
    return { success: false, error: 'تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مجددًا.' };
  }
}

/** التحقق من رمز الدخول ثم تبديل توكن أحادي الاستخدام بجلسة Supabase حقيقية.
 *  السيرفر يتحقق من القايمة البيضاء قبل وأثناء التحقق. */
export async function verifyAdminMagicToken(tokenOrCode: string, targetEmail: string): Promise<AdminAuthResult> {
  const token = tokenOrCode.trim();
  const email = String(targetEmail || '').trim().toLowerCase();
  if (!token) return { valid: false, error: 'كود التحقق مطلوب.' };
  if (!email) return { valid: false, error: 'البريد الإداري مطلوب.' };
  if (!supabase) return { valid: false, error: 'Supabase غير مهيأ.' };
  if (!/^\d{6}$/.test(token)) return { valid: false, error: 'كود الدخول يجب أن يكون 6 أرقام.' };

  let tokenHash = '';
  try {
    const res = await fetch('/api/auth/admin-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', code: token, email }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      return { valid: false, error: data?.error || 'رمز الدخول غير صالح أو منتهي.' };
    }
    tokenHash = String(data.token_hash || '');
  } catch {
    return { valid: false, error: 'تعذر الاتصال بالخادم. حاول مجددًا.' };
  }
  if (!tokenHash) return { valid: false, error: 'رمز الدخول غير صالح أو منتهي.' };

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'magiclink',
  });
  if (error || !data.user) {
    return { valid: false, error: error?.message || 'رمز الدخول غير صالح أو منتهي.' };
  }

  // الجلسة يجب أن تكون لنفس البريد الذي أُرسل له الكود (القايمة تحققها السيرفر)
  const sessionEmail = (data.user.email || '').toLowerCase();
  if (sessionEmail !== email) {
    await supabase.auth.signOut();
    return { valid: false, error: 'هذا الحساب غير مصرح له بالدخول الإداري.' };
  }

  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  const sessionToken = data.session?.access_token || '';
  if (!sessionToken) {
    return { valid: false, error: 'لم يتم إنشاء جلسة Supabase صالحة.' };
  }

  saveAdminSession({ token: sessionToken, email: sessionEmail, expiresAt, role: 'admin' });
  return { valid: true, sessionToken, expiresAt, email: sessionEmail };
}

/** نداء موحد لبوابة الوصول الإداري (يتطلب توكن جلسة Supabase سارية) */
async function adminAccessCall(payload: Record<string, unknown>): Promise<any> {
  if (!supabase) throw new Error('Supabase غير مهيأ.');
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('لا توجد جلسة سارية. سجل دخولك أولًا.');
  const res = await fetch('/api/auth/admin-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `تعذر تنفيذ الطلب (${res.status}).`);
  }
  return data;
}

/** فحص جلسة Google الحالية: هل صاحبها مصرح له إداريًا؟ مع ترقية دوره تلقائيًا */
export async function verifyGoogleAdminAccess(): Promise<{
  allowed: boolean;
  email?: string;
  promoted?: boolean;
}> {
  const data = await adminAccessCall({ action: 'google-verify' });
  return { allowed: Boolean(data.allowed), email: data.email, promoted: data.promoted };
}

/** قراءة قايمة إيميلات الإدارة (أدمن فقط) */
export async function fetchAdminWhitelist(): Promise<{ emails: string[]; owner: string; max: number }> {
  return adminAccessCall({ action: 'list' });
}

/** إضافة إيميل للقايمة (أدمن فقط) */
export async function addAdminEmail(email: string): Promise<{ emails: string[]; message?: string }> {
  return adminAccessCall({ action: 'add', email });
}

/** حذف إيميل من القايمة (أدمن فقط) */
export async function removeAdminEmail(email: string): Promise<{ emails: string[]; message?: string }> {
  return adminAccessCall({ action: 'remove', email });
}
