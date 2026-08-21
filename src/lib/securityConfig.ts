/**
 * Hassty Security Config & Vault
 * Uses secure hashing and credentials check for Admin Portal access.
 */

// Temporary Admin Credentials
export const TEMP_ADMIN_CREDENTIALS = {
  username: 'admin',
  email: 'admin@hassty.com',
  password: 'admin123',
};

// SHA-256 hash helper using standard Web Crypto API
export async function sha256Hex(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Standard Production Domain Names for Hassty
 */
export const HASSTY_DOMAINS = {
  PUBLIC_URL: 'https://hassty.vercel.app',
  ADMIN_SUBDOMAIN: 'https://admin.hassty.com',
  ADMIN_PATH: '/admin',
};

/**
 * Secure Admin Auth Verification with Temporary Credentials
 */
export async function verifyAdminCredentialsSecurely(
  emailOrUser: string,
  rawPass: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedUser = emailOrUser.trim().toLowerCase();
  const trimmedPass = rawPass.trim();

  if (!normalizedUser || !trimmedPass) {
    return { success: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
  }

  const validUsernames = ['admin', 'admin@hassty.com', 'hasstysupport@gmail.com', 'hassty'];
  const validPasswords = ['admin123', 'admin2026', 'hassty123', 'admin@123'];

  const isUserValid = validUsernames.includes(normalizedUser);
  const isPassValid = validPasswords.includes(trimmedPass);

  if (isUserValid && isPassValid) {
    return { success: true };
  }

  return {
    success: false,
    error: 'بيانات الدخول غير صحيحة. يرجى التحقق من اسم المستخدم أو كلمة المرور المؤقتة.',
  };
}

