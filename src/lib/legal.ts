import { supabase } from './supabase';

export const LEGAL_VERSIONS = {
  terms: '2026-08-29-v1',
  privacy: '2026-08-29-v1',
  teacherVerification: '2026-08-29-v1',
  cookies: '2026-08-29-v1',
  acceptableUse: '2026-08-29-v1',
  refundPolicy: '2026-08-29-v1',
} as const;

export type LegalDocumentType = keyof typeof LEGAL_VERSIONS;

const dbDocumentType = (documentType: LegalDocumentType) =>
  documentType === 'teacherVerification' ? 'teacher_verification'
    : documentType === 'acceptableUse' ? 'acceptable_use'
      : documentType === 'refundPolicy' ? 'refund_policy'
        : documentType;

export async function recordLegalConsent(userId: string, documentType: LegalDocumentType, source = 'web') {
  if (!supabase) throw new Error('Supabase is not configured');
  const type = dbDocumentType(documentType);
  const version = LEGAL_VERSIONS[documentType];
  const { data: existing, error: lookupError } = await supabase
    .from('legal_consents')
    .select('id')
    .eq('user_id', userId)
    .eq('document_type', type)
    .eq('document_version', version)
    .limit(1)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return;

  const { error } = await supabase.from('legal_consents').insert({
    user_id: userId,
    document_type: type,
    document_version: version,
    source,
  });
  if (error) throw error;
}

export async function recordRequiredSignupConsents(userId: string) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  if (error) throw error;

  const required: Promise<void>[] = [
    recordLegalConsent(userId, 'terms'),
    recordLegalConsent(userId, 'privacy'),
    recordLegalConsent(userId, 'acceptableUse'),
  ];

  if (profile?.role === 'teacher') {
    required.push(recordLegalConsent(userId, 'teacherVerification'));
  }

  await Promise.all(required);
}

/* مفتاح الموافقة المحلي — توحيد التخزين عبر كل صفحات المصادقة */
export const SIGNUP_CONSENT_KEY = 'hassty_signup_legal_consent_v1';

export function hasRecentSignupConsent(): boolean {
  try { return localStorage.getItem(SIGNUP_CONSENT_KEY) === 'accepted'; } catch { return false; }
}

export function markSignupConsentAccepted(): void {
  try { localStorage.setItem(SIGNUP_CONSENT_KEY, 'accepted'); } catch { /* ignore */ }
}
