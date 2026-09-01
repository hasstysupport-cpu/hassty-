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

/** Send a real Supabase Auth email OTP. This creates no local-only admin identity. */
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
  if (!supabase) return { success: false, error: 'Supabase غير مهيأ.' };

  const { error } = await supabase.auth.signInWithOtp({
    email: OFFICIAL_ADMIN_EMAIL,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${window.location.origin}${SECRET_ADMIN_ROUTE}`,
    },
  });
  if (error) return { success: false, error: error.message };

  return {
    success: true,
    message: 'تم إرسال رمز الدخول الإداري الحقيقي إلى البريد المعتمد.',
    maskedEmail: 'h***t@gmail.com',
    expiresInSeconds: 3600,
    secretRoute: SECRET_ADMIN_ROUTE,
  };
}

/** Verify the Supabase Auth OTP, establishing a real authenticated session. */
export async function verifyAdminMagicToken(tokenOrCode: string): Promise<AdminAuthResult> {
  const token = tokenOrCode.trim();
  if (!token) return { valid: false, error: 'كود التحقق مطلوب.' };
  if (!supabase) return { valid: false, error: 'Supabase غير مهيأ.' };
  if (!/^\d{6}$/.test(token)) return { valid: false, error: 'كود الدخول يجب أن يكون 6 أرقام.' };

  const { data, error } = await supabase.auth.verifyOtp({
    email: OFFICIAL_ADMIN_EMAIL,
    token,
    type: 'email',
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
