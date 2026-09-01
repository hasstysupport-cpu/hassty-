/**
 * Hassty Auth API client
 * ======================
 * Real client for the serverless auth endpoints (/api/auth/*).
 * NO local fallbacks, NO mock codes — verification happens on the server.
 */
import { supabase } from './supabase';

const TOKEN_KEY = 'hassty_auth_token';
const DEVICE_KEY = 'hassty_device_id';

/* ---------- device identity (for trusted-device OTP skipping) ---------- */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'no-device';
  }
}

/* ---------- token storage (kept from securityService) ---------- */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.warn('Failed to store auth token:', e);
  }
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.warn('Failed to remove auth token:', e);
  }
}

/* ---------- generic POST ---------- */
async function post<T = any>(path: string, body: any, withAuth = false): Promise<T & { ok: boolean; error?: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (withAuth) {
    if (!supabase) throw new Error('Supabase غير مُهيأ.');
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('انتهت جلسة الدخول. سجّل الدخول مجددًا.');
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`/api/auth${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    return { ok: false, error: 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مجددًا.' } as T & { ok: false; error: string };
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok || data?.ok === false) {
    return { ...(data || {}), ok: false, error: data?.error || `تعذر تنفيذ الطلب (${res.status}).` };
  }
  return { ...(data || {}), ok: true };
}

/* ---------- payload types ---------- */
export interface RegisterPayload {
  email: string;
  password: string;
  role: 'student' | 'parent' | 'teacher' | 'assistant';
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  grade?: string;
  subject?: string;
  experienceYears?: string;
  parentPhone?: string;
  studentJoinCode?: string;
  avatarUrl?: string;
  /** assistant-only extras */
  whatsappPhone?: string;
  experienceSummary?: string;
  education?: string;
  certificateSummary?: string;
  consent: boolean;
}

export interface ProfileCompletePayload extends Omit<RegisterPayload, 'password' | 'email' | 'consent'> {
  email?: string;
  consent: boolean;
}

export type CodePurpose = 'signup_verify' | 'login_otp' | 'password_reset';

/* ---------- the API ---------- */
export const authApi = {
  register: (payload: RegisterPayload) => post('/register', payload),

  sendCode: (email: string, purpose: CodePurpose) =>
    post('/send-code', { email, purpose }),

  verifyCode: (params: { email: string; code: string; purpose: CodePurpose; deviceId?: string; trustDevice?: boolean }) =>
    post('/verify-code', params),

  loginCheck: (deviceId: string) => post('/login-check', { deviceId }, true),

  resetPassword: (params: { email: string; code: string; newPassword: string }) =>
    post('/reset-password', params),

  profileComplete: (payload: ProfileCompletePayload) => post('/profile-complete', payload, true),
};

/* ---------- password strength (UX meter) ---------- */
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Za-z\u0600-\u06FF]/.test(pw) && /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9\u0600-\u06FF]/.test(pw)) score++;
  const labels = ['ضعيفة جدًا', 'ضعيفة', 'متوسطة', 'قوية', 'قوية جدًا'];
  return { score: Math.min(score, 4) as 0 | 1 | 2 | 3 | 4, label: labels[Math.min(score, 4)] };
}
