import { StudentGroup, TeacherStudentItem, BookingRequest } from '../types';
import { supabase } from './supabase';

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const mapGroup = (g: any): StudentGroup => ({
  id: g.id,
  name: g.name,
  subject: g.subject || undefined,
  level: g.grade || undefined,
  grade: g.grade || undefined,
  schedule: g.schedule || '',
  scheduleSlots: Array.isArray(g.schedule_slots) ? g.schedule_slots : [],
  location: g.location || g.center_name || '',
  studentCount: Number(g.current_count || 0),
  currentStudents: Number(g.current_count || 0),
  maxCapacity: Number(g.max_students || 35),
  studentIds: Array.isArray(g.student_ids) ? g.student_ids : [],
  waitlist: [],
  isPaused: g.is_active === false,
  billingType: g.billing_type || 'per_session',
  priceAmount: Number(g.price_amount ?? g.monthly_fee ?? 120),
  commissionRate: Number(g.commission_rate ?? (g.billing_type === 'monthly' ? 1.2 : 2)),
});

const mapStudent = (r: any, groupName = ''): TeacherStudentItem => ({
  id: r.student_id,
  name: r.student_name || 'طالب',
  avatarUrl: r.avatar_url || '',
  grade: r.grade || '',
  phone: r.student_phone || '',
  parentPhone: r.parent_phone || '',
  qrCode: r.qr_code || '',
  groupName,
  attendanceRate: Number(r.attendance_rate ?? 0),
  totalSessions: Number(r.total_sessions ?? 0),
  attendedSessions: Number(r.attended_sessions ?? 0),
  paymentStatus: r.payment_status || 'pending',
  joinedDate: r.enrolled_at ? String(r.enrolled_at).slice(0, 10) : '',
  status: r.status === 'suspended' ? 'paused' : r.status === 'left' ? 'transferred' : 'active',
});

export const getStoredStudents = (_teacherId: string): TeacherStudentItem[] => [];
export const getStoredGroups = (_teacherId: string): StudentGroup[] => [];
export const getStoredBookings = (_teacherId: string): BookingRequest[] => [];
export const setStoredStudents = (_teacherId: string, _students: TeacherStudentItem[]) => {};
export const setStoredGroups = (_teacherId: string, _groups: StudentGroup[]) => {};
export const setStoredBookings = (_teacherId: string, _bookings: BookingRequest[]) => {};

export async function loadTeacherGroups(teacherId: string): Promise<StudentGroup[]> {
  if (!supabase || !isUuid(teacherId)) return [];
  const { data, error } = await supabase.from('student_groups').select('*').eq('tutor_id', teacherId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapGroup);
}

export async function loadTeacherStudents(teacherId: string): Promise<TeacherStudentItem[]> {
  if (!supabase || !isUuid(teacherId)) return [];
  const groups = await loadTeacherGroups(teacherId);
  if (!groups.length) return [];
  const names = new Map(groups.map(g => [g.id, g.name]));
  const { data, error } = await supabase.from('group_enrollments').select('*').in('group_id', groups.map(g => g.id)).eq('status', 'active').order('enrolled_at', { ascending: false });
  if (error) throw error;
  return (data || []).filter((r: any) => r.student_id).map((r: any) => mapStudent(r, names.get(r.group_id) || ''));
}

export async function saveTeacherGroup(teacherId: string, group: StudentGroup): Promise<StudentGroup> {
  if (!supabase || !isUuid(teacherId)) throw new Error('حساب المدرس غير صالح.');
  const id = isUuid(group.id) ? group.id : crypto.randomUUID();
  group.id = id;
  const { data, error } = await supabase.from('student_groups').upsert({
    id,
    tutor_id: teacherId,
    name: group.name,
    subject: group.subject || null,
    grade: group.grade || group.level || null,
    schedule: group.schedule || '',
    schedule_slots: group.scheduleSlots || [],
    location: group.location || null,
    center_name: group.centerName || group.location || null,
    max_students: group.maxCapacity || group.maxStudents || 35,
    current_count: group.currentStudents || 0,
    monthly_fee: group.billingType === 'monthly' ? group.priceAmount : null,
    price_amount: group.priceAmount || 0,
    billing_type: group.billingType || 'per_session',
    student_ids: group.studentIds || [],
    is_active: group.isPaused !== true,
    updated_at: new Date().toISOString(),
  }).select('*').single();
  if (error) throw error;
  Object.assign(group, mapGroup(data));
  return group;
}

export async function deleteTeacherGroup(teacherId: string, groupId: string) {
  if (!supabase || !isUuid(teacherId) || !isUuid(groupId)) throw new Error('بيانات المجموعة غير صالحة.');
  const { error } = await supabase.from('student_groups').delete().eq('id', groupId).eq('tutor_id', teacherId);
  if (error) throw error;
}

export async function saveNewStudent(teacherId: string, student: Omit<TeacherStudentItem, 'id'> & { id?: string }): Promise<TeacherStudentItem> {
  if (!supabase || !isUuid(teacherId)) throw new Error('حساب المدرس غير صالح.');

  let studentId = student.id && isUuid(student.id) ? student.id : '';

  // If studentId not provided, search by qrCode or phone
  if (!studentId) {
    if (student.qrCode) {
      const { data: byQr } = await supabase.from('profiles').select('id').eq('qr_code', student.qrCode.trim().toUpperCase()).limit(1);
      if (byQr?.[0]?.id) studentId = byQr[0].id;
    }
    if (!studentId && student.phone && student.phone.length >= 8) {
      const { data: byPhone } = await supabase.from('profiles').select('id').eq('phone', student.phone.trim()).limit(1);
      if (byPhone?.[0]?.id) studentId = byPhone[0].id;
    }
  }

  // If still not found, create a student profile record
  if (!studentId) {
    studentId = crypto.randomUUID();
    const qrCode = student.qrCode || `HASSTY-STU-${Math.floor(100000 + Math.random() * 900000)}`;
    const phone = student.phone || `010${Math.floor(10000000 + Math.random() * 90000000)}`;
    await supabase.from('profiles').upsert({
      id: studentId,
      full_name: student.name,
      phone,
      role: 'student',
      grade: student.grade || 'الصف الثالث الثانوي',
      qr_code: qrCode,
      avatar_url: student.avatarUrl || '',
      account_status: 'active',
      badge: 'none',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  if (student.groupName === 'بدون مجموعة') {
    const groups = await loadTeacherGroups(teacherId);
    if (groups.length) {
      await supabase.from('group_enrollments').delete().eq('student_id', studentId).in('group_id', groups.map(g => g.id));
    }
    return { ...student, id: studentId, status: 'active' } as TeacherStudentItem;
  }

  // Find or create group
  let { data: groups } = await supabase.from('student_groups').select('id,name,current_count').eq('tutor_id', teacherId).eq('name', student.groupName || 'المجموعة العامة').limit(1);
  let group = groups?.[0];
  if (!group) {
    const newGroup = await saveTeacherGroup(teacherId, {
      id: crypto.randomUUID(),
      name: student.groupName || 'المجموعة العامة',
      schedule: 'مواعيد منتظمة',
      location: 'السنتر',
      grade: student.grade,
      priceAmount: 120,
      billingType: 'per_session',
      studentIds: [studentId],
      currentStudents: 0,
      maxCapacity: 35,
      commissionRate: 2,
    });
    group = { id: newGroup.id, name: newGroup.name, current_count: 0 };
  }

  const { error } = await supabase.from('group_enrollments').upsert({
    group_id: group.id,
    student_id: studentId,
    student_name: student.name,
    student_phone: student.phone || '',
    parent_phone: student.parentPhone || '',
    qr_code: student.qrCode || '',
    avatar_url: student.avatarUrl || '',
    grade: student.grade || '',
    status: 'active',
    enrolled_at: new Date().toISOString(),
    attendance_rate: student.attendanceRate || 100,
    total_sessions: student.totalSessions || 1,
    attended_sessions: student.attendedSessions || 1,
    payment_status: student.paymentStatus || 'pending',
  }, { onConflict: 'group_id,student_id' });
  if (error) throw error;

  // Update current count on student_groups
  const { count } = await supabase.from('group_enrollments').select('*', { count: 'exact', head: true }).eq('group_id', group.id).eq('status', 'active');
  if (count !== null) {
    await supabase.from('student_groups').update({ current_count: count }).eq('id', group.id);
  }

  return { ...student, id: studentId, status: student.status || 'active' } as TeacherStudentItem;
}

export async function removeStudent(teacherId: string, studentId: string) {
  if (!supabase || !isUuid(teacherId) || !isUuid(studentId)) throw new Error('بيانات الطالب غير صالحة.');
  const groups = await loadTeacherGroups(teacherId);
  if (!groups.length) return;
  const { error } = await supabase.from('group_enrollments').delete().eq('student_id', studentId).in('group_id', groups.map(g => g.id));
  if (error) throw error;
}
