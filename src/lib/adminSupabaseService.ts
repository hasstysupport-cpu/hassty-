import { supabase } from './supabase';
import {
  AdminUserAccount,
  TeacherVerificationRequest,
  AdminSafetyReport,
  TeacherCommissionTrackingItem,
  AccountBadgeType,
} from '../types';

type AppDocumentRow = {
  collection_name: string;
  document_id: string;
  data: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

const COLLECTIONS = {
  users: 'users',
  verifications: 'verification_requests',
  reports: 'safety_reports',
  commissions: 'commissions',
  tutors: 'tutors',
} as const;

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

function mapAccount(row: AppDocumentRow): AdminUserAccount {
  const data = row.data || {};
  return {
    id: row.document_id,
    name: data.name || data.full_name || 'بدون اسم',
    phone: data.phone || '',
    email: data.email || '',
    role: data.role || 'student',
    createdAt: data.createdAt || row.created_at || '',
    status: data.status || data.accountStatus || 'active',
    badge: data.badge || (data.isVerified ? 'verified' : 'none'),
    subject: data.subject,
    grade: data.grade,
    governorate: data.governorate || 'القاهرة',
    area: data.area || data.city || '',
    studentsCount: Number(data.studentsCount) || 0,
    totalRevenue: Number(data.totalRevenue) || 0,
    avatarUrl: data.avatarUrl || data.avatar_url || data.photoUrl || '',
    nationalId: data.nationalId || '',
    qrCode: data.qrCode || data.qr_code || '',
    parentPhone: data.parentPhone || '',
  } as AdminUserAccount;
}

async function readCollection(collectionName: string): Promise<AppDocumentRow[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('app_documents')
    .select('collection_name,document_id,data,created_at,updated_at')
    .eq('collection_name', collectionName)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as AppDocumentRow[];
}

function subscribeCollection<T>(
  collectionName: string,
  mapper: (row: AppDocumentRow) => T,
  callback: (items: T[]) => void,
  onError?: (err: any) => void,
) {
  const client = requireSupabase();
  let disposed = false;

  const load = async () => {
    try {
      const rows = await readCollection(collectionName);
      if (!disposed) callback(rows.map(mapper));
    } catch (err) {
      if (!disposed) {
        onError?.(err);
        callback([]);
      }
    }
  };

  void load();

  const channel = client
    .channel(`admin:${collectionName}:${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'app_documents',
        filter: `collection_name=eq.${collectionName}`,
      },
      () => void load(),
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError?.(new Error(`Realtime channel ${collectionName}: ${status}`));
      }
    });

  return () => {
    disposed = true;
    void client.removeChannel(channel);
  };
}

export async function seedAdminDatabaseIfEmpty() {
  // Deliberately no mock/demo seeding in production.
}

export function subscribeToUsers(
  callback: (users: AdminUserAccount[]) => void,
  onError?: (err: any) => void,
) {
  return subscribeCollection(COLLECTIONS.users, mapAccount, callback, onError);
}

export function subscribeToVerifications(
  callback: (reqs: TeacherVerificationRequest[]) => void,
  onError?: (err: any) => void,
) {
  return subscribeCollection(
    COLLECTIONS.verifications,
    (row) => ({ id: row.document_id, ...(row.data || {}) }) as TeacherVerificationRequest,
    callback,
    onError,
  );
}

export function subscribeToReports(
  callback: (reps: AdminSafetyReport[]) => void,
  onError?: (err: any) => void,
) {
  return subscribeCollection(
    COLLECTIONS.reports,
    (row) => ({ id: row.document_id, ...(row.data || {}) }) as AdminSafetyReport,
    callback,
    onError,
  );
}

export function subscribeToCommissions(
  callback: (comms: TeacherCommissionTrackingItem[]) => void,
  onError?: (err: any) => void,
) {
  return subscribeCollection(
    COLLECTIONS.commissions,
    (row) => ({ id: row.document_id, ...(row.data || {}) }) as TeacherCommissionTrackingItem,
    callback,
    onError,
  );
}

async function patchDocument(collectionName: string, documentId: string, patch: Record<string, any>) {
  const client = requireSupabase();
  const { data: current, error: readError } = await client
    .from('app_documents')
    .select('data')
    .eq('collection_name', collectionName)
    .eq('document_id', documentId)
    .maybeSingle();
  if (readError) throw readError;

  const merged = { ...(current?.data || {}), ...patch };
  const { error } = await client
    .from('app_documents')
    .upsert(
      {
        collection_name: collectionName,
        document_id: documentId,
        data: merged,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'collection_name,document_id' },
    );
  if (error) throw error;
  return merged;
}

async function deleteDocument(collectionName: string, documentId: string) {
  const client = requireSupabase();
  const { error } = await client
    .from('app_documents')
    .delete()
    .eq('collection_name', collectionName)
    .eq('document_id', documentId);
  if (error) throw error;
}

export async function dbUpdateAccountBadge(accountId: string, newBadge: AccountBadgeType) {
  const client = requireSupabase();
  await patchDocument(COLLECTIONS.users, accountId, {
    badge: newBadge,
    isVerified: newBadge === 'verified',
  });
  if (newBadge === 'verified' || newBadge === 'none') {
    const { error } = await client
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', accountId);
    if (error && error.code !== 'PGRST116') throw error;
  }
}

export async function dbUpdateAccountFullProfile(
  accountId: string,
  updates: Partial<AdminUserAccount>,
) {
  const normalizedUpdates: Record<string, any> = { ...updates };
  if (updates.badge !== undefined) {
    normalizedUpdates.isVerified = updates.badge === 'verified';
  }

  await patchDocument(COLLECTIONS.users, accountId, normalizedUpdates);

  const shouldSyncTutor =
    updates.role === 'teacher' ||
    updates.name !== undefined ||
    updates.phone !== undefined ||
    updates.subject !== undefined ||
    updates.governorate !== undefined ||
    updates.area !== undefined ||
    updates.avatarUrl !== undefined ||
    updates.badge !== undefined;

  if (shouldSyncTutor) {
    const tutorUpdates: Record<string, any> = {};
    if (updates.name !== undefined) tutorUpdates.name = updates.name;
    if (updates.phone !== undefined) tutorUpdates.phone = updates.phone;
    if (updates.subject !== undefined) tutorUpdates.subject = updates.subject;
    if (updates.governorate !== undefined) tutorUpdates.governorate = updates.governorate;
    if (updates.area !== undefined) tutorUpdates.area = updates.area;
    if (updates.avatarUrl !== undefined) tutorUpdates.avatarUrl = updates.avatarUrl;
    if (updates.badge !== undefined) tutorUpdates.isVerified = updates.badge === 'verified';
    if (updates.grade !== undefined) tutorUpdates.grade = updates.grade;

    if (Object.keys(tutorUpdates).length > 0) {
      await patchDocument(COLLECTIONS.tutors, accountId, tutorUpdates);
    }
  }
}

export async function dbToggleAccountStatus(accountId: string, currentStatus: 'active' | 'suspended') {
  await patchDocument(COLLECTIONS.users, accountId, {
    status: currentStatus === 'active' ? 'suspended' : 'active',
  });
}

export async function dbDeleteAccount(accountId: string) {
  const client = requireSupabase();
  await deleteDocument(COLLECTIONS.users, accountId);
  const { error } = await client.from('profiles').delete().eq('id', accountId);
  if (error && error.code !== 'PGRST116') throw error;
}

export async function dbApproveVerification(
  requestId: string,
  teacherId: string,
  adminEmail: string,
  teacherData?: Partial<AdminUserAccount>,
) {
  await patchDocument(COLLECTIONS.verifications, requestId, {
    status: 'approved',
    actionedAt: new Date().toISOString(),
    actionedBy: adminEmail,
  });
  if (teacherId) {
    await patchDocument(COLLECTIONS.users, teacherId, {
      status: 'active',
      badge: 'verified',
      isVerified: true,
      ...(teacherData || {}),
    });
  }
}

export async function dbRejectVerification(requestId: string, reason: string, adminEmail: string) {
  await patchDocument(COLLECTIONS.verifications, requestId, {
    status: 'rejected',
    rejectionReason: reason,
    actionedAt: new Date().toISOString(),
    actionedBy: adminEmail,
  });
}

export async function dbSuspendTeacherFromReport(teacherId: string, reportId: string) {
  await patchDocument(COLLECTIONS.reports, reportId, {
    teacherSuspended: true,
    status: 'in_review',
  });
  if (teacherId) {
    await patchDocument(COLLECTIONS.users, teacherId, {
      status: 'suspended',
      badge: 'fraudulent',
    });
  }
}

export async function dbResolveReport(reportId: string) {
  await patchDocument(COLLECTIONS.reports, reportId, { status: 'resolved' });
}

export async function dbDismissReport(reportId: string) {
  await deleteDocument(COLLECTIONS.reports, reportId);
}

export async function dbMarkCommissionPaid(commissionId: string) {
  await patchDocument(COLLECTIONS.commissions, commissionId, {
    paymentStatus: 'paid',
    lastPaymentDate: new Date().toISOString().split('T')[0],
  });
}
