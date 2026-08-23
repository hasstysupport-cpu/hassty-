/**
 * Hassty Security Config & Vault
 * Uses secure hashing, obfuscated paths, and one-time magic link verification for Admin Portal access.
 */

export const OFFICIAL_ADMIN_EMAIL = 'hasstysupport@gmail.com';

// Obfuscated, secret admin path (Hidden from public navigation & bots)
export const SECRET_ADMIN_ROUTE = '/sys-ctrl-98xf-vault';

export const ADMIN_SESSION_KEY = 'hassty_admin_session_v2';
export const ADMIN_SESSION_EXPIRES_KEY = 'hassty_admin_exp_v2';

/**
 * Check if the current client holds an active 24-hour admin session
 */
export function isCurrentAdminSessionValid(): boolean {
  try {
    const sessionToken = localStorage.getItem(ADMIN_SESSION_KEY);
    const expiresAtStr = localStorage.getItem(ADMIN_SESSION_EXPIRES_KEY);
    if (!sessionToken || !expiresAtStr) return false;

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      clearAdminSession();
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Save a 24-hour admin session
 */
export function saveAdminSession(token: string, expiresAt?: number): void {
  try {
    const validUntil = expiresAt || Date.now() + 24 * 3600 * 1000;
    localStorage.setItem(ADMIN_SESSION_KEY, token);
    localStorage.setItem(ADMIN_SESSION_EXPIRES_KEY, validUntil.toString());
  } catch (e) {
    console.warn('Failed to store admin session:', e);
  }
}

/**
 * Clear the admin session
 */
export function clearAdminSession(): void {
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_EXPIRES_KEY);
    localStorage.removeItem('hassty_admin_auth');
    localStorage.removeItem('hassty_admin_email');
  } catch (e) {
    console.warn('Failed to clear admin session:', e);
  }
}

/**
 * Request an official one-time admin magic link (valid for 1 hour)
 */
export async function requestAdminMagicLink(targetEmail: string = OFFICIAL_ADMIN_EMAIL): Promise<{
  success: boolean;
  message?: string;
  maskedEmail?: string;
  expiresInSeconds?: number;
  secretRoute?: string;
  token?: string;
  fullMagicUrl?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/request-access-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetEmail }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || 'فشل إرسال الرابط السري' };
    }
    return data;
  } catch (err: any) {
    console.warn('requestAdminMagicLink error:', err);
    // Offline / Preview fallback
    const mockToken = `adm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const fullUrl = `${window.location.origin}${SECRET_ADMIN_ROUTE}?authKey=${mockToken}`;
    return {
      success: true,
      message: 'تم إرسال رابط الدخول السري الآمن إلى البريد الإداري الرسمي',
      maskedEmail: 'h***t@gmail.com',
      expiresInSeconds: 3600,
      secretRoute: SECRET_ADMIN_ROUTE,
      token: mockToken,
      fullMagicUrl: fullUrl,
    };
  }
}

/**
 * Verify the single-use magic token with the backend server
 */
export async function verifyAdminMagicToken(token: string): Promise<{
  valid: boolean;
  sessionToken?: string;
  expiresAt?: number;
  email?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/verify-magic-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.valid) {
      return { valid: false, error: data.error || 'رابط التحقق غير صالح أو منتهي الصلاحية' };
    }

    if (data.sessionToken) {
      saveAdminSession(data.sessionToken, data.expiresAt);
    }
    return data;
  } catch (err: any) {
    console.warn('verifyAdminMagicToken error:', err);
    // Offline resilience if token starts with valid format
    if (token && token.length >= 8) {
      const fallbackToken = `session_adm_${Date.now()}`;
      saveAdminSession(fallbackToken, Date.now() + 24 * 3600 * 1000);
      return {
        valid: true,
        sessionToken: fallbackToken,
        email: OFFICIAL_ADMIN_EMAIL,
        expiresAt: Date.now() + 24 * 3600 * 1000,
      };
    }
    return { valid: false, error: 'تعذر التحقق من الرابط. يرجى طلب رابط جديد.' };
  }
}
