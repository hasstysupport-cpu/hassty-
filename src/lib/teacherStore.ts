/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

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
  description: g.description || undefined,
  color: g.color || undefined,
  allowScheduleOverride: g.allow_schedule_override !== false,
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
  enrollmentId: r.id,
  groupId: r.group_id,
  attendanceMode: r.attendance_mode === 'flexible' ? 'flexible' : 'fixed',
  customScheduleSlots: Array.isArray(r.custom_schedule_slots) ? r.custom_schedule_slots : [],
  feeExempt: r.fee_exempt === true,
  feeExemptReason: r.fee_exempt_reason || undefined,
  feeExemptUntil: r.fee_exempt_until || undefined,
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
    description: group.description || null,
    color: group.color || null,
    allow_schedule_override: group.allowScheduleOverride !== false,
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

  // If studentId not provided, search by qrCode or phone (RPC الأمنية تدعم الكود والهاتف وتعمل رغم RLS)
  if (!studentId) {
    const identifier = student.qrCode || student.phone || '';
    if (identifier) {
      try {
        const { data: rpcData } = await supabase.rpc('find_student_by_qr', { p_code: identifier });
        if (rpcData?.[0]?.id) studentId = rpcData[0].id;
      } catch { /* البحث المباشر كاحتياط */ }
    }
    if (!studentId && student.qrCode) {
      const { data: byQr } = await supabase.from('profiles').select('id').eq('qr_code', student.qrCode.trim().toUpperCase()).limit(1);
      if (byQr?.[0]?.id) studentId = byQr[0].id;
    }
    if (!studentId && student.phone && student.phone.length >= 8) {
      const { data: byPhone } = await supabase.from('profiles').select('id').eq('phone', student.phone.trim()).limit(1);
      if (byPhone?.[0]?.id) studentId = byPhone[0].id;
    }
  }

  // If still not found: المخطط يمنع إنشاء بروفايل بدون حساب حقيقي (profiles مرتبط بـ auth.users)
  if (!studentId) {
    throw new Error('لا يوجد حساب طالب حقيقي بهذه البيانات. اطلب من الطالب إنشاء حساب أولًا من صفحة التسجيل، ثم أضفه بكود QR من كارت الطالب أو رقم هاتفه.');
  }

  if (student.groupName === 'بدون مجموعة') {
    const groups = await loadTeacherGroups(teacherId);
    if (groups.length) {
      await supabase.from('group_enrollments').delete().eq('student_id', studentId).in('group_id', groups.map(g => g.id));
      // إعادة حساب العدادات بعد الإخراج من كل المجموعات
      await Promise.all(groups.map(async (g) => {
        const { count } = await supabase.from('group_enrollments').select('*', { count: 'exact', head: true }).eq('group_id', g.id).eq('status', 'active');
        if (count !== null) await supabase.from('student_groups').update({ current_count: count }).eq('id', g.id);
      }));
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

  // حارس نهائي: مطابقة مرحلة الطالب مع مرحلة المجموعة إلزامية (منع اللغبطة في القيد)
  const { data: gRow } = await supabase.from('student_groups').select('grade').eq('id', group.id).limit(1).maybeSingle();
  if (gRow?.grade && student.grade && student.groupName !== 'بدون مجموعة') {
    const norm = (v: string) => String(v || '').replace(/\s+/g, '').replace(/الصف/g, '').trim();
    if (norm(student.grade) !== norm(String(gRow.grade))) {
      throw new Error(`مرحلة الطالب «${student.grade}» لا تطابق مرحلة المجموعة «${gRow.grade}» — اختر مجموعة من مرحلة الطالب نفسها.`);
    }
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
    /* بيانات صادقة: لا بيانات تجريبية — الطالب الجديد يبدأ بصفر حصص وحضور
       و«قيد المراجعة» في الدفع، وأول تسجيل حضور هو الذي يبني الإحصاءات */
    attendance_rate: student.attendanceRate ?? 0,
    total_sessions: student.totalSessions ?? 0,
    attended_sessions: student.attendedSessions ?? 0,
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

/**
 * إزالة طالب من القيد.
 * - مع groupId: إزالة محصورة من هذه المجموعة فقط (آمن — لا يمس باقي مجموعات المدرس)
 * - بدون groupId: إزالة من كل مجموعات المدرس (للحذف الكامل من سجل المدرس فقط)
 * في الحالتين: إعادة حساب current_count لكل مجموعة متأثرة.
 */
export async function removeStudent(teacherId: string, studentId: string, groupId?: string) {
  if (!supabase || !isUuid(teacherId) || !isUuid(studentId)) throw new Error('بيانات الطالب غير صالحة.');

  let affectedGroupIds: string[] = [];

  if (groupId && isUuid(groupId)) {
    // إزالة محصورة: هذه المجموعة فقط
    const { error } = await supabase.from('group_enrollments')
      .delete()
      .eq('student_id', studentId)
      .eq('group_id', groupId);
    if (error) throw error;
    affectedGroupIds = [groupId];
  } else {
    const groups = await loadTeacherGroups(teacherId);
    if (!groups.length) return;
    affectedGroupIds = groups.map(g => g.id);
    const { error } = await supabase.from('group_enrollments')
      .delete()
      .eq('student_id', studentId)
      .in('group_id', affectedGroupIds);
    if (error) throw error;
  }

  // إعادة حساب العدادات الفعلية لكل مجموعة متأثرة (حتى لا تبقى الأعداد قديمة)
  await Promise.all(affectedGroupIds.map(async (gid) => {
    const { count } = await supabase
      .from('group_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', gid)
      .eq('status', 'active');
    if (count !== null) {
      await supabase.from('student_groups').update({ current_count: count }).eq('id', gid);
    }
  }));
}
