import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  TutorProfile, 
  TeacherGroupItem, 
  TeacherStudentItem, 
  AttendanceRecord, 
  PaymentRecord, 
  BookingRequest 
} from '../types';

// ==========================================
// 1. Teacher & Groups Services
// ==========================================

export async function fetchTeacherGroups(teacherId: string): Promise<TeacherGroupItem[]> {
  try {
    const q = query(collection(db, 'groups'), where('teacherId', '==', teacherId));
    const querySnapshot = await getDocs(q);
    const groups: TeacherGroupItem[] = [];
    querySnapshot.forEach((doc) => {
      groups.push({ id: doc.id, ...doc.data() } as TeacherGroupItem);
    });
    return groups;
  } catch (error) {
    console.error('Error fetching teacher groups:', error);
    return [];
  }
}

export async function createTeacherGroup(teacherId: string, groupData: Partial<TeacherGroupItem>): Promise<string> {
  const newDocRef = doc(collection(db, 'groups'));
  const payload = {
    ...groupData,
    id: newDocRef.id,
    teacherId,
    currentStudents: 0,
    maxCapacity: groupData.maxCapacity || 30,
    createdAt: new Date().toISOString(),
  };
  await setDoc(newDocRef, payload);
  return newDocRef.id;
}

// ==========================================
// 2. Teacher Students Services
// ==========================================

export async function fetchTeacherStudents(teacherId: string): Promise<TeacherStudentItem[]> {
  try {
    const q = query(collection(db, 'teacher_students'), where('teacherId', '==', teacherId));
    const querySnapshot = await getDocs(q);
    const students: TeacherStudentItem[] = [];
    querySnapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() } as TeacherStudentItem);
    });
    return students;
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    return [];
  }
}

export async function addStudentToTeacher(teacherId: string, studentData: Partial<TeacherStudentItem>): Promise<string> {
  const newDocRef = doc(collection(db, 'teacher_students'));
  const payload = {
    ...studentData,
    id: newDocRef.id,
    teacherId,
    attendanceRate: 100,
    totalSessions: 1,
    attendedSessions: 1,
    paymentStatus: studentData.paymentStatus || 'paid',
    joinedDate: new Date().toISOString().split('T')[0],
    status: 'active',
  };
  await setDoc(newDocRef, payload);
  return newDocRef.id;
}

// ==========================================
// 3. Attendance Recording Services
// ==========================================

export async function recordAttendance(record: Partial<AttendanceRecord>): Promise<string> {
  const newDocRef = doc(collection(db, 'attendance'));
  const payload = {
    ...record,
    id: newDocRef.id,
    date: record.date || new Date().toISOString().split('T')[0],
    time: record.time || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    qrVerifiedAt: new Date().toISOString(),
  };
  await setDoc(newDocRef, payload);
  return newDocRef.id;
}

export async function fetchTeacherAttendanceToday(teacherId: string): Promise<AttendanceRecord[]> {
  const today = new Date().toISOString().split('T')[0];
  try {
    const q = query(
      collection(db, 'attendance'),
      where('tutorId', '==', teacherId),
      where('date', '==', today)
    );
    const querySnapshot = await getDocs(q);
    const records: AttendanceRecord[] = [];
    querySnapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
    });
    return records;
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }
}

// ==========================================
// 4. Booking Requests
// ==========================================

export async function fetchBookingRequests(teacherId: string): Promise<BookingRequest[]> {
  try {
    const q = query(collection(db, 'booking_requests'), where('tutorId', '==', teacherId));
    const querySnapshot = await getDocs(q);
    const requests: BookingRequest[] = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() } as BookingRequest);
    });
    return requests;
  } catch (error) {
    console.error('Error fetching booking requests:', error);
    return [];
  }
}
