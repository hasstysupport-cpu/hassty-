import { StudentGroup, TeacherStudentItem, BookingRequest } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { db, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where } from './firestoreCompat';

const STORAGE_KEY_STUDENTS = 'hassty_teacher_students_';
const STORAGE_KEY_GROUPS = 'hassty_teacher_groups_';
const STORAGE_KEY_BOOKINGS = 'hassty_teacher_bookings_';

// 1. Local Storage Helpers
export function getStoredStudents(teacherId: string): TeacherStudentItem[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_STUDENTS}${teacherId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStoredStudents(teacherId: string, students: TeacherStudentItem[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY_STUDENTS}${teacherId}`, JSON.stringify(students));
    window.dispatchEvent(new CustomEvent('hassty_teacher_students_updated', { detail: { teacherId } }));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

export function getStoredGroups(teacherId: string): StudentGroup[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_GROUPS}${teacherId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStoredGroups(teacherId: string, groups: StudentGroup[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY_GROUPS}${teacherId}`, JSON.stringify(groups));
    window.dispatchEvent(new CustomEvent('hassty_teacher_groups_updated', { detail: { teacherId } }));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

export function getStoredBookings(teacherId: string): BookingRequest[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_BOOKINGS}${teacherId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStoredBookings(teacherId: string, bookings: BookingRequest[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY_BOOKINGS}${teacherId}`, JSON.stringify(bookings));
    window.dispatchEvent(new CustomEvent('hassty_teacher_bookings_updated', { detail: { teacherId } }));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

// 2. Load Real Teacher Students
export async function loadTeacherStudents(teacherId: string): Promise<TeacherStudentItem[]> {
  const localList = getStoredStudents(teacherId);

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Try group_enrollments
      const groups = await loadTeacherGroups(teacherId);
      const groupIds = groups.map((g) => g.id).filter(Boolean);
      
      let dbStudents: TeacherStudentItem[] = [];

      if (groupIds.length > 0) {
        const { data, error } = await supabase
          .from('group_enrollments')
          .select('*')
          .in('group_id', groupIds)
          .order('enrolled_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const groupNames = new Map(groups.map((g) => [g.id, g.name]));
          dbStudents = data.map((row: any) => ({
            id: row.student_id || row.id,
            name: row.student_name || 'طالب',
            avatarUrl: row.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
            grade: row.grade || 'الصف الثالث الثانوي',
            phone: row.student_phone || '',
            parentPhone: row.parent_phone || '',
            qrCode: row.qr_code || '',
            groupName: groupNames.get(row.group_id) || 'المجموعة العامة',
            attendanceRate: Number(row.attendance_rate ?? 100),
            totalSessions: Number(row.total_sessions ?? 1),
            attendedSessions: Number(row.attended_sessions ?? 1),
            paymentStatus: (row.payment_status as any) || 'paid',
            joinedDate: row.enrolled_at ? String(row.enrolled_at).split('T')[0] : new Date().toISOString().split('T')[0],
            status: row.status === 'suspended' ? 'paused' : row.status === 'left' ? 'transferred' : 'active',
          }));
        }
      }

      // Also check app_documents collection 'teacher_students'
      const appDocSnap = await getDocs(query(collection(db, 'teacher_students'), where('teacherId', '==', teacherId)));
      if (!appDocSnap.empty) {
        const docStudents = appDocSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Merge without duplicates
        const map = new Map<string, TeacherStudentItem>();
        for (const s of [...dbStudents, ...docStudents]) {
          map.set(s.id, s);
        }
        dbStudents = Array.from(map.values());
      }

      if (dbStudents.length > 0) {
        setStoredStudents(teacherId, dbStudents);
        return dbStudents;
      }
    } catch (e) {
      console.warn('Error loading teacher students from Supabase:', e);
    }
  }

  return localList;
}

// 3. Load Real Teacher Groups
export async function loadTeacherGroups(teacherId: string): Promise<StudentGroup[]> {
  const localGroups = getStoredGroups(teacherId);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('student_groups')
        .select('*')
        .eq('tutor_id', teacherId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const dbGroups: StudentGroup[] = data.map((g: any) => ({
          id: g.id,
          name: g.name,
          subject: g.subject || 'المادة الدراسية',
          grade: g.grade,
          level: g.grade,
          schedule: g.schedule,
          scheduleSlots: g.schedule_slots || [],
          location: g.location || g.center_name || 'السنتر الرئيسي',
          studentCount: g.current_count || 0,
          currentStudents: g.current_count || 0,
          maxCapacity: g.max_students || 35,
          studentIds: g.student_ids || [],
          billingType: (g.billing_type as any) || 'per_session',
          priceAmount: g.monthly_fee || g.price_amount || 120,
          commissionRate: g.billing_type === 'monthly' ? 1.2 : 2.0,
          waitlist: [],
        }));

        setStoredGroups(teacherId, dbGroups);
        return dbGroups;
      }

      // Check app_documents
      const docSnap = await getDocs(query(collection(db, 'student_groups'), where('tutorId', '==', teacherId)));
      if (!docSnap.empty) {
        const dbGroups = docSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudentGroup));
        setStoredGroups(teacherId, dbGroups);
        return dbGroups;
      }
    } catch (e) {
      console.warn('Error loading groups from Supabase:', e);
    }
  }

  return localGroups;
}

// 4. Save/Add Real Student
export async function saveNewStudent(
  teacherId: string,
  student: Omit<TeacherStudentItem, 'id'> & { id?: string }
): Promise<TeacherStudentItem> {
  const newStudent: TeacherStudentItem = {
    id: student.id || `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...student,
    status: student.status || 'active',
    joinedDate: student.joinedDate || new Date().toISOString().split('T')[0],
  };

  // 1. Update local storage
  const currentList = getStoredStudents(teacherId);
  const updatedList = [newStudent, ...currentList.filter(s => s.id !== newStudent.id)];
  setStoredStudents(teacherId, updatedList);

  // 2. Update group student count
  if (newStudent.groupName) {
    const groups = getStoredGroups(teacherId);
    const targetGroup = groups.find(g => g.name === newStudent.groupName || g.id === newStudent.groupName);
    if (targetGroup) {
      targetGroup.studentIds = Array.from(new Set([...(targetGroup.studentIds || []), newStudent.id]));
      targetGroup.currentStudents = targetGroup.studentIds.length;
      targetGroup.studentCount = targetGroup.studentIds.length;
      setStoredGroups(teacherId, [...groups]);
    }
  }

  // 3. Persist to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const docRef = doc(db, 'teacher_students', newStudent.id);
      await setDoc(docRef, { ...newStudent, teacherId });
    } catch (e) {
      console.warn('Failed to persist student to Supabase:', e);
    }
  }

  return newStudent;
}

// 5. Delete Student
export async function removeStudent(teacherId: string, studentId: string) {
  const currentList = getStoredStudents(teacherId);
  const student = currentList.find(s => s.id === studentId);
  const updatedList = currentList.filter(s => s.id !== studentId);
  setStoredStudents(teacherId, updatedList);

  if (student?.groupName) {
    const groups = getStoredGroups(teacherId);
    const targetGroup = groups.find(g => g.name === student.groupName);
    if (targetGroup && targetGroup.studentIds) {
      targetGroup.studentIds = targetGroup.studentIds.filter(id => id !== studentId);
      targetGroup.currentStudents = targetGroup.studentIds.length;
      targetGroup.studentCount = targetGroup.studentIds.length;
      setStoredGroups(teacherId, [...groups]);
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const docRef = doc(db, 'teacher_students', studentId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Failed to delete student from Supabase:', e);
    }
  }
}

// 6. Save/Create Group
export async function saveTeacherGroup(teacherId: string, group: StudentGroup): Promise<StudentGroup> {
  const currentGroups = getStoredGroups(teacherId);
  const existingIdx = currentGroups.findIndex(g => g.id === group.id);
  let updatedGroups: StudentGroup[];
  if (existingIdx >= 0) {
    updatedGroups = [...currentGroups];
    updatedGroups[existingIdx] = group;
  } else {
    updatedGroups = [group, ...currentGroups];
  }
  setStoredGroups(teacherId, updatedGroups);

  if (isSupabaseConfigured && supabase) {
    try {
      const docRef = doc(db, 'student_groups', group.id);
      await setDoc(docRef, { ...group, tutorId: teacherId });
    } catch (e) {
      console.warn('Failed to persist group to Supabase:', e);
    }
  }

  return group;
}

// 7. Delete Group
export async function deleteTeacherGroup(teacherId: string, groupId: string) {
  const currentGroups = getStoredGroups(teacherId);
  const updatedGroups = currentGroups.filter(g => g.id !== groupId);
  setStoredGroups(teacherId, updatedGroups);

  if (isSupabaseConfigured && supabase) {
    try {
      const docRef = doc(db, 'student_groups', groupId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Failed to delete group from Supabase:', e);
    }
  }
}
