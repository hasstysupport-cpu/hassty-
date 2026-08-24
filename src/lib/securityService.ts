/**
 * Hassty Platform Security Service
 * Implements Token Management, Server-Side OTP Verification, and Data Ownership Checks
 */

const TOKEN_STORAGE_KEY = 'hassty_auth_token';

export interface OtpDispatchResponse {
  success: boolean;
  requestId?: string;
  email?: string;
  maskedEmail?: string;
  expiresInSeconds?: number;
  previewCode?: string;
  activationLink?: string;
  whatsappDispatched?: boolean;
  message?: string;
  error?: string;
  waitSeconds?: number;
}

export interface OtpVerifyResponse {
  success: boolean;
  verified: boolean;
  token?: string;
  sessionToken?: string;
  uid?: string;
  email?: string;
  emailVerified?: boolean;
  message?: string;
  error?: string;
}

/**
 * Dispatch cryptographically secure email / phone OTP via backend server
 */
export async function sendServerVerificationOtp(params: {
  email: string;
  uid?: string;
  name?: string;
  role?: string;
  phone?: string;
  purpose?: 'login' | 'signup' | 'verify';
}): Promise<OtpDispatchResponse> {
  try {
    const res = await fetch('/api/auth/otp/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok && !data.error) {
      return { success: false, error: `Server error: ${res.status}` };
    }
    return data;
  } catch (err: any) {
    console.warn('sendServerVerificationOtp network error:', err);
    return { success: false, error: 'تعذر الاتصال بخادم إرسال رمز التحقق. حاول مرة أخرى.' };
  }
}

/**
 * Verify OTP on backend server and receive signed session token
 */
export async function verifyServerOtp(params: {
  requestId: string;
  code: string;
  email: string;
  uid?: string;
}): Promise<OtpVerifyResponse> {
  try {
    const res = await fetch('/api/auth/otp/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json().catch(() => ({}));
    if (data.token) {
      setStoredToken(data.token);
    }
    return data;
  } catch (err: any) {
    console.warn('verifyServerOtp network error:', err);
    return {
      success: false,
      verified: false,
      error: 'تعذر الاتصال بخادم التحقق. يرجى المحاولة مرة أخرى.',
    };
  }
}

/**
 * Validate Token with backend server
 */
export async function validateServerSession(token?: string, uid?: string): Promise<boolean> {
  const targetToken = token || getStoredToken();
  if (!targetToken) return false;

  try {
    const res = await fetch('/api/auth/verify-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${targetToken}`,
      },
      body: JSON.stringify({ token: targetToken, uid }),
    });

    const data = await res.json().catch(() => ({}));
    return !!data.valid;
  } catch {
    return false;
  }
}

/**
 * Gatekeeper check: verifies if current requesting user is the rightful owner or authorized entity for a given resource
 */
export async function checkServerDataOwnership(params: {
  requestingUid: string;
  requestingRole: string;
  resourceOwnerUid: string;
  resourceType?: string;
  parentLinkedStudents?: string[];
  teacherStudents?: string[];
}): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/check-data-ownership', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken() || ''}`,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    return !!data.authorized;
  } catch {
    return false;
  }
}

/**
 * Token Storage Helpers
 */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (e) {
    console.warn('Failed to store auth token:', e);
  }
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to remove auth token:', e);
  }
}
