import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  AdminUserAccount, 
  TeacherVerificationRequest, 
  AdminSafetyReport, 
  TeacherCommissionTrackingItem,
  AccountBadgeType
} from '../types';
import {
  INITIAL_ADMIN_ACCOUNTS,
  INITIAL_VERIFICATION_REQUESTS,
  INITIAL_SAFETY_REPORTS,
  INITIAL_COMMISSION_DATA
} from '../data/adminMockData';

const USERS_COLLECTION = 'users';
const VERIFICATIONS_COLLECTION = 'verification_requests';
const REPORTS_COLLECTION = 'safety_reports';
const COMMISSIONS_COLLECTION = 'commissions';

/**
 * Initializes Firestore collections with structured real-world data if they are empty.
 */
export async function seedAdminDatabaseIfEmpty() {
  // Real database mode - no automatic mock seeding
}

/**
 * Subscribes to real-time Users collection in Firestore
 */
export function subscribeToUsers(callback: (users: AdminUserAccount[]) => void) {
  const q = collection(db, USERS_COLLECTION);
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    const accounts: AdminUserAccount[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as any;
      return {
        id: docSnap.id,
        name: data.name || 'بدون اسم',
        phone: data.phone || '',
        email: data.email || '',
        role: data.role || 'student',
        createdAt: data.createdAt ? String(data.createdAt).split('T')[0] : '2026-08-18',
        status: data.status || 'active',
        badge: data.badge || (data.isVerified ? 'verified' : 'none'),
        subject: data.subject,
        grade: data.grade,
        governorate: data.governorate || 'القاهرة',
        area: data.area || '',
        studentsCount: Number(data.studentsCount) || 0,
        totalRevenue: Number(data.totalRevenue) || 0,
        avatarUrl: data.avatarUrl || data.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        nationalId: data.nationalId || '',
        qrCode: data.qrCode || '',
        parentPhone: data.parentPhone || '',
      };
    });
    callback(accounts);
  }, (err) => {
    console.error('Firestore subscribeToUsers error:', err);
    callback(INITIAL_ADMIN_ACCOUNTS);
  });
}

/**
 * Subscribes to real-time Verification Requests in Firestore
 */
export function subscribeToVerifications(callback: (reqs: TeacherVerificationRequest[]) => void) {
  const q = collection(db, VERIFICATIONS_COLLECTION);
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    const list: TeacherVerificationRequest[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<TeacherVerificationRequest, 'id'>)
    }));
    callback(list);
  }, (err) => {
    console.error('Firestore subscribeToVerifications error:', err);
    callback([]);
  });
}

/**
 * Subscribes to real-time Safety Reports in Firestore
 */
export function subscribeToReports(callback: (reps: AdminSafetyReport[]) => void) {
  const q = collection(db, REPORTS_COLLECTION);
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    const list: AdminSafetyReport[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AdminSafetyReport, 'id'>)
    }));
    callback(list);
  }, (err) => {
    console.error('Firestore subscribeToReports error:', err);
    callback([]);
  });
}

/**
 * Subscribes to real-time Commission records in Firestore
 */
export function subscribeToCommissions(callback: (comms: TeacherCommissionTrackingItem[]) => void) {
  const q = collection(db, COMMISSIONS_COLLECTION);
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    const list: TeacherCommissionTrackingItem[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<TeacherCommissionTrackingItem, 'id'>)
    }));
    callback(list);
  }, (err) => {
    console.error('Firestore subscribeToCommissions error:', err);
    callback([]);
  });
}

/**
 * Database write operations with immediate live reflection
 */

export async function dbUpdateAccountBadge(accountId: string, newBadge: AccountBadgeType) {
  const ref = doc(db, USERS_COLLECTION, accountId);
  await updateDoc(ref, { 
    badge: newBadge,
    isVerified: newBadge === 'verified'
  });
}

export async function dbToggleAccountStatus(accountId: string, currentStatus: 'active' | 'suspended') {
  const ref = doc(db, USERS_COLLECTION, accountId);
  const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
  await updateDoc(ref, { status: nextStatus });
}

export async function dbDeleteAccount(accountId: string) {
  const ref = doc(db, USERS_COLLECTION, accountId);
  await deleteDoc(ref);
}

export async function dbApproveVerification(
  requestId: string, 
  teacherId: string, 
  adminEmail: string,
  teacherData?: Partial<AdminUserAccount>
) {
  const reqRef = doc(db, VERIFICATIONS_COLLECTION, requestId);
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
  
  await updateDoc(reqRef, {
    status: 'approved',
    actionedAt: timestamp,
    actionedBy: adminEmail
  });

  if (teacherId) {
    const userRef = doc(db, USERS_COLLECTION, teacherId);
    await setDoc(userRef, {
      id: teacherId,
      status: 'active',
      badge: 'verified',
      isVerified: true,
      ...(teacherData || {})
    }, { merge: true });
  }
}

export async function dbRejectVerification(requestId: string, reason: string, adminEmail: string) {
  const reqRef = doc(db, VERIFICATIONS_COLLECTION, requestId);
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
  
  await updateDoc(reqRef, {
    status: 'rejected',
    rejectionReason: reason,
    actionedAt: timestamp,
    actionedBy: adminEmail
  });
}

export async function dbSuspendTeacherFromReport(teacherId: string, reportId: string) {
  const repRef = doc(db, REPORTS_COLLECTION, reportId);
  await updateDoc(repRef, {
    teacherSuspended: true,
    status: 'in_review'
  });

  if (teacherId) {
    const userRef = doc(db, USERS_COLLECTION, teacherId);
    await updateDoc(userRef, {
      status: 'suspended',
      badge: 'fraudulent'
    });
  }
}

export async function dbResolveReport(reportId: string) {
  const repRef = doc(db, REPORTS_COLLECTION, reportId);
  await updateDoc(repRef, { status: 'resolved' });
}

export async function dbDismissReport(reportId: string) {
  const repRef = doc(db, REPORTS_COLLECTION, reportId);
  await deleteDoc(repRef);
}

export async function dbMarkCommissionPaid(commissionId: string) {
  const comRef = doc(db, COMMISSIONS_COLLECTION, commissionId);
  const today = new Date().toISOString().split('T')[0];
  await updateDoc(comRef, {
    paymentStatus: 'paid',
    lastPaymentDate: today
  });
}
