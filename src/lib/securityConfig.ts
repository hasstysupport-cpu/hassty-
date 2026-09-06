/** Secure Hassty admin authentication helpers. */
import { supabase } from './supabase';

export const OFFICIAL_ADMIN_EMAIL = 'hasstysupport@gmail.com';
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
    const email = (session.email || OFFICIAL_ADMIN_EMAIL).toLowerCase();
    if (email !== OFFICIAL_ADMIN_EMAIL) return;
    const exp = Number(session.expiresAt || Date.now() + 24 * 60 * 60 * 1000);
    localStorage.setItem(ADMIN_SESSION_KEY, session.token);
    localStorage.setItem(ADMIN_SESSION_EXPIRES_KEY, String(exp));
    localStorage.setItem('hassty_admin_email', email);
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

/** Issue the admin login OTP through the PLATFORM mailer (/api/auth/admin-otp).
 *  Was: supabase.auth.signInWithOtp — Supabase's built-in email is capped
 *  (~2/hour on the free tier) and silently throttles, locking the admin out. */
export async function requestAdminMagicLink(targetEmail: string = OFFICIAL_ADMIN_EMAIL): Promise<{
  success: boolean;
  message?: string;
  maskedEmail?: string;
  expiresInSeconds?: number;
  secretRoute?: string;
  error?: string;
}> {
  const email = targetEmail.trim().toLowerCase();
  if (email !== OFFICIAL_ADMIN_EMAIL) {
    return { success: false, error: 'غير مصرح بهذا البريد الإداري.' };
  }

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
      maskedEmail: 'h***t@gmail.com',
      expiresInSeconds: data.expiresIn || 600,
      secretRoute: SECRET_ADMIN_ROUTE,
    };
  } catch {
    return { success: false, error: 'تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مجددًا.' };
  }
}

/** Verify the platform-issued OTP, then exchange a server-minted single-use
 *  magic-link token (returned only after the code passes) for a real session. */
export async function verifyAdminMagicToken(tokenOrCode: string): Promise<AdminAuthResult> {
  const token = tokenOrCode.trim();
  if (!token) return { valid: false, error: 'كود التحقق مطلوب.' };
  if (!supabase) return { valid: false, error: 'Supabase غير مهيأ.' };
  if (!/^\d{6}$/.test(token)) return { valid: false, error: 'كود الدخول يجب أن يكون 6 أرقام.' };

  let tokenHash = '';
  try {
    const res = await fetch('/api/auth/admin-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', code: token }),
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

  const email = (data.user.email || '').toLowerCase();
  if (email !== OFFICIAL_ADMIN_EMAIL) {
    await supabase.auth.signOut();
    return { valid: false, error: 'هذا الحساب غير مصرح له بالدخول الإداري.' };
  }

  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  const sessionToken = data.session?.access_token || '';
  if (!sessionToken) {
    return { valid: false, error: 'لم يتم إنشاء جلسة Supabase صالحة.' };
  }

  saveAdminSession({ token: sessionToken, email, expiresAt, role: 'admin' });
  return { valid: true, sessionToken, expiresAt, email };
}
