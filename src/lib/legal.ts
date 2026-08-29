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

export async function recordLegalConsent(
  userId: string,
  documentType: LegalDocumentType,
  source = 'web'
) {
  const { error } = await supabase.from('legal_consents').insert({
    user_id: userId,
    document_type: documentType === 'teacherVerification' ? 'teacher_verification' : documentType === 'acceptableUse' ? 'acceptable_use' : documentType === 'refundPolicy' ? 'refund_policy' : documentType,
    document_version: LEGAL_VERSIONS[documentType],
    source,
  });
  if (error) throw error;
}

export async function recordRequiredSignupConsents(userId: string) {
  await Promise.all([
    recordLegalConsent(userId, 'terms'),
    recordLegalConsent(userId, 'privacy'),
    recordLegalConsent(userId, 'acceptableUse'),
  ]);
}
