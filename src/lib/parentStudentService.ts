import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp
} from './firestoreCompat';
import { db } from './firestoreCompat';
import { getCleanAvatarUrl } from './avatarHelper';

export interface ParentLinkRequest {
  id: string;
  parentId: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  parentAvatarUrl?: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  studentGrade: string;
  studentAvatarUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  respondedAt?: string;
  declineReason?: string;
}

export interface LinkedChildSummary {
  id: string;
  studentId: string;
  name: string;
  grade: string;
  qrCode: string;
  avatarUrl: string;
  phone?: string;
  governorate?: string;
  area?: string;
  status: 'approved' | 'pending' | 'rejected';
  requestId?: string;
  linkedAt: string;
  attendanceRate: number;
  tutorsCount: number;
  totalSessions: number;
  presentOnTime: number;
  presentLate: number;
  absentCount: number;
  verified: boolean;
}

/**
 * Clean & normalize student code search query
 */
export function normalizeStudentCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Search for a student in Supabase by QR code, UID, or phone
 */
export async function findStudentByCodeOrPhone(codeOrPhone: string): Promise<any | null> {
  const cleanQuery = normalizeStudentCode(codeOrPhone);
  if (!cleanQuery) return null;

  try {
    const usersRef = collection(db, 'users');

    // 1. Direct query by qrCode
    const qQr = query(usersRef, where('qrCode', '==', cleanQuery));
    const snapQr = await getDocs(qQr);
    if (!snapQr.empty) {
      const docData = snapQr.docs[0].data();
      if (docData.role === 'student') {
        return { studentId: snapQr.docs[0].id, ...docData };
      }
    }

    // 2. Direct document ID query (if it's student UID)
    const directDoc = await getDoc(doc(db, 'users', codeOrPhone.trim()));
    if (directDoc.exists() && directDoc.data().role === 'student') {
      return { studentId: directDoc.id, ...directDoc.data() };
    }

    // 3. Query with HASSTY- prefix if user only entered the suffix
    if (!cleanQuery.startsWith('HASSTY-') && !cleanQuery.startsWith('STU-')) {
      const qPrefix = query(usersRef, where('qrCode', '==', `HASSTY-${cleanQuery}`));
      const snapPrefix = await getDocs(qPrefix);
      if (!snapPrefix.empty) {
        const docData = snapPrefix.docs[0].data();
        if (docData.role === 'student') {
          return { studentId: snapPrefix.docs[0].id, ...docData };
        }
      }
    }

    // 4. Query by phone number if entered
    const rawDigits = codeOrPhone.replace(/\D/g, '');
    if (rawDigits.length >= 10) {
      const qPhone = query(usersRef, where('phone', '==', codeOrPhone.trim()));
      const snapPhone = await getDocs(qPhone);
      if (!snapPhone.empty) {
        const docData = snapPhone.docs[0].data();
        if (docData.role === 'student') {
          return { studentId: snapPhone.docs[0].id, ...docData };
        }
      }
    }

    // 5. Fallback: scan recent students in case of partial case matches
    const allStudentsQ = query(usersRef, where('role', '==', 'student'));
    const allSnap = await getDocs(allStudentsQ);
    for (const d of allSnap.docs) {
      const data = d.data();
      const studentQr = (data.qrCode || '').toUpperCase();
      const studentIdStr = d.id.toUpperCase();
      if (
        studentQr === cleanQuery ||
        studentQr.includes(cleanQuery) ||
        studentIdStr === cleanQuery ||
        studentIdStr.startsWith(cleanQuery)
      ) {
        return { studentId: d.id, ...data };
      }
    }

    return null;
  } catch (err) {
    console.error('Error finding student by code:', err);
    return null;
  }
}

/**
 * Send a parent linkage request to student
 */
export async function sendParentLinkRequest(
  parentUser: {
    uid: string;
    name: string;
    phone: string;
    email?: string;
    avatarUrl?: string;
  },
  studentCodeOrIdentifier: string,
  suggestedName?: string
): Promise<{ success: boolean; message: string; student?: any; request?: ParentLinkRequest }> {
  if (!parentUser?.uid) {
    return { success: false, message: 'يجب تسجيل الدخول كولي أمر أولاً.' };
  }

  // 1. Locate student
  const student = await findStudentByCodeOrPhone(studentCodeOrIdentifier);
  if (!student) {
    return {
      success: false,
      message: `لم يتم العثور على طالب مسجل بالكود (${studentCodeOrIdentifier}). يرجى التحقق من كود الطالب أو كود بطاقة الـ QR الخاصة به.`,
    };
  }

  const studentId = student.studentId || student.uid;
  const requestId = `req_${parentUser.uid}_${studentId}`;

  // 2. Check if request already exists
  try {
    const existingReqSnap = await getDoc(doc(db, 'parent_link_requests', requestId));
    if (existingReqSnap.exists()) {
      const existingData = existingReqSnap.data() as ParentLinkRequest;
      if (existingData.status === 'approved') {
        return {
          success: true,
          message: `حساب الطالب (${student.name}) مربوط بحسابك بالفعل كولي أمر معتمد.`,
          student,
          request: existingData,
        };
      }
      if (existingData.status === 'pending') {
        return {
          success: true,
          message: `تم إرسال طلب ربط مسبقاً للطالب (${student.name}) وهو في انتظار موافقته الآن.`,
          student,
          request: existingData,
        };
      }
    }

    // 3. Create or re-open the request
    const studentAvatar = getCleanAvatarUrl(student.avatarUrl, 'student', student.name);
    const parentAvatar = getCleanAvatarUrl(parentUser.avatarUrl, 'parent', parentUser.name);

    const newRequest: ParentLinkRequest = {
      id: requestId,
      parentId: parentUser.uid,
      parentName: parentUser.name || 'ولي أمر',
      parentPhone: parentUser.phone || '',
      parentEmail: parentUser.email || '',
      parentAvatarUrl: parentAvatar,
      studentId: studentId,
      studentName: student.name || suggestedName || 'طالب منصة حِصّتي',
      studentCode: student.qrCode || studentCodeOrIdentifier,
      studentGrade: student.grade || 'المرحلة الثانوية',
      studentAvatarUrl: studentAvatar,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'parent_link_requests', requestId), newRequest, { merge: true });

    return {
      success: true,
      message: `تم إرسال طلب الربط بنجاح إلى الطالب (${student.name})! ستظهر لك متابعته فور موافقته على الطلب من حسابه.`,
      student,
      request: newRequest,
    };
  } catch (err: any) {
    console.error('Error sending parent link request:', err);
    return {
      success: false,
      message: err.message || 'حدث خطأ أثناء إرسال طلب الربط. يرجى المحاولة مرة أخرى.',
    };
  }
}

/**
 * Student Approves or Rejects a Parent Link Request
 */
export async function respondToParentLinkRequest(
  requestId: string,
  approve: boolean,
  declineReason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const reqRef = doc(db, 'parent_link_requests', requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) {
      return { success: false, message: 'طلب الربط غير موجود أو تم حذفه.' };
    }

    const reqData = reqSnap.data() as ParentLinkRequest;
    const newStatus: 'approved' | 'rejected' = approve ? 'approved' : 'rejected';
    const nowIso = new Date().toISOString();

    // 1. Update request doc
    await updateDoc(reqRef, {
      status: newStatus,
      respondedAt: nowIso,
      declineReason: declineReason || (approve ? '' : 'تم الرفض من قِبل الطالب'),
    });

    // 2. If approved, link student with parent
    if (approve) {
      // Update student user doc
      const studentDocRef = doc(db, 'users', reqData.studentId);
      const studentSnap = await getDoc(studentDocRef);
      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        const existingParents = Array.isArray(studentData.parents) ? studentData.parents : [];
        const isAlreadyPresent = existingParents.some((p: any) => p.parentId === reqData.parentId);
        
        const updatedParents = isAlreadyPresent
          ? existingParents
          : [
              ...existingParents,
              {
                parentId: reqData.parentId,
                parentName: reqData.parentName,
                parentPhone: reqData.parentPhone,
                parentEmail: reqData.parentEmail || '',
                parentAvatarUrl: reqData.parentAvatarUrl || '',
                linkedAt: nowIso,
              },
            ];

        await updateDoc(studentDocRef, {
          parentPhone: reqData.parentPhone || studentData.parentPhone || '',
          parentUid: reqData.parentId,
          parentName: reqData.parentName,
          parents: updatedParents,
        });
      }
    }

    return {
      success: true,
      message: approve
        ? `تم قبول طلب ولي الأمر (${reqData.parentName}) وربط الحساب بنجاح!`
        : `تم رفض طلب الربط من (${reqData.parentName}).`,
    };
  } catch (err: any) {
    console.error('Error responding to parent request:', err);
    return {
      success: false,
      message: err.message || 'حدث خطأ أثناء الرد على الطلب.',
    };
  }
}

/**
 * Real-time listener for incoming pending link requests for a student
 */
export function subscribeToStudentPendingRequests(
  studentUid: string,
  callback: (requests: ParentLinkRequest[]) => void
): () => void {
  if (!studentUid) {
    callback([]);
    return () => {};
  }

  const reqCollection = collection(db, 'parent_link_requests');
  const q = query(
    reqCollection,
    where('studentId', '==', studentUid),
    where('status', '==', 'pending')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ParentLinkRequest[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ParentLinkRequest);
      });
      callback(list);
    },
    (err) => {
      console.warn('Error in pending requests listener:', err);
      callback([]);
    }
  );
}

/**
 * Real-time listener for all parent requests (for parent dashboard)
 */
export function subscribeToParentRequests(
  parentUid: string,
  callback: (requests: ParentLinkRequest[]) => void
): () => void {
  if (!parentUid) {
    callback([]);
    return () => {};
  }

  const reqCollection = collection(db, 'parent_link_requests');
  const q = query(reqCollection, where('parentId', '==', parentUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ParentLinkRequest[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ParentLinkRequest);
      });
      callback(list);
    },
    (err) => {
      console.warn('Error in parent requests listener:', err);
      callback([]);
    }
  );
}

/**
 * Unlink or remove child link / cancel pending request
 */
export async function removeParentChildLink(
  requestId: string,
  studentId: string,
  parentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Delete or update request
    if (requestId) {
      await deleteDoc(doc(db, 'parent_link_requests', requestId));
    }

    // 2. Remove parent from student user profile if present
    const studentDocRef = doc(db, 'users', studentId);
    const studentSnap = await getDoc(studentDocRef);
    if (studentSnap.exists()) {
      const sData = studentSnap.data();
      if (Array.isArray(sData.parents)) {
        const filtered = sData.parents.filter((p: any) => p.parentId !== parentId);
        await updateDoc(studentDocRef, { parents: filtered });
      }
    }

    return { success: true, message: 'تم إلغاء ربط الحساب بنجاح.' };
  } catch (err: any) {
    console.error('Error removing child link:', err);
    return { success: false, message: err.message || 'حدث خطأ أثناء إلغاء الربط.' };
  }
}
