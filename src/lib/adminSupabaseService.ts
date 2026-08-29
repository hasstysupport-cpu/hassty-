import { supabase } from './supabase';
import {
  AdminUserAccount,
  TeacherVerificationRequest,
  AdminSafetyReport,
  TeacherCommissionTrackingItem,
  AccountBadgeType,
} from '../types';

const ADMIN_EMAILS = new Set(['hasstysupport@gmail.com', 'admin@hassty.com']);

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  role: AdminUserAccount['role'];
  avatar_url: string | null;
  qr_code: string | null;
  governorate: string | null;
  city: string | null;
  grade: string | null;
  account_status: 'active' | 'suspended' | null;
  badge: AccountBadgeType | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at?: string;
};

type TutorRow = {
  id: string;
  user_id: string;
  title: string | null;
  bio: string | null;
  headline: string | null;
  subjects: string[] | null;
  grades: string[] | null;
  experience_years: number | null;
  experience_years_text: string | null;
  rating: number | null;
  reviews_count: number | null;
  governorate: string | null;
  city: string | null;
  center_names: string[] | null;
  price_per_month: number | null;
  price_per_session: number | null;
  punctuality_rate: number | null;
  is_verified: boolean | null;
  verification_status: 'pending' | 'approved' | 'rejected' | null;
};

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

async function loadAccountRows(): Promise<AdminUserAccount[]> {
  const client = requireSupabase();
  const [{ data: profiles, error: profileError }, { data: tutors, error: tutorError }, { data: groups, error: groupsError }, { data: enrollments, error: enrollmentsError }] = await Promise.all([
    client.from('profiles').select('id,full_name,phone,email,role,avatar_url,qr_code,governorate,city,grade,account_status,badge,metadata,created_at,updated_at').order('created_at', { ascending: false }),
    client.from('tutor_profiles').select('id,user_id,title,bio,headline,subjects,grades,experience_years,experience_years_text,rating,reviews_count,governorate,city,center_names,price_per_month,price_per_session,punctuality_rate,is_verified,verification_status'),
    client.from('student_groups').select('id,tutor_id,monthly_fee,current_count,is_active'),
    client.from('group_enrollments').select('group_id,student_id,status').eq('status', 'active'),
  ]);

  if (profileError) throw profileError;
  if (tutorError) throw tutorError;
  if (groupsError) throw groupsError;
  if (enrollmentsError) throw enrollmentsError;

  const tutorByUser = new Map<string, TutorRow>((tutors || []).map((row: any) => [row.user_id, row as TutorRow]));
  const groupById = new Map<string, any>((groups || []).map((row: any) => [row.id, row]));
  const studentsByTutor = new Map<string, Set<string>>();
  const revenueByTutor = new Map<string, number>();

  for (const enrollment of (enrollments || []) as any[]) {
    const group = groupById.get(enrollment.group_id);
    if (!group || group.is_active === false || !group.tutor_id) continue;
    if (!studentsByTutor.has(group.tutor_id)) studentsByTutor.set(group.tutor_id, new Set());
    if (enrollment.student_id) studentsByTutor.get(group.tutor_id)!.add(enrollment.student_id);
    revenueByTutor.set(group.tutor_id, (revenueByTutor.get(group.tutor_id) || 0) + Number(group.monthly_fee || 0));
  }

  return ((profiles || []) as ProfileRow[]).map((profile) => {
    const tutor = tutorByUser.get(profile.id);
    return {
      id: profile.id,
      name: profile.full_name || 'بدون اسم',
      phone: profile.phone || '',
      email: profile.email || '',
      role: profile.role || 'student',
      createdAt: profile.created_at || '',
      status: profile.account_status === 'suspended' ? 'suspended' : 'active',
      badge: tutor ? (tutor.is_verified ? 'verified' : (profile.badge || 'none')) : (profile.badge || 'none'),
      grade: profile.grade || tutor?.grades?.[0],
      subject: tutor?.subjects?.[0],
      governorate: profile.governorate || tutor?.governorate || 'القاهرة',
      area: profile.city || tutor?.city || '',
      studentsCount: studentsByTutor.get(profile.id)?.size || 0,
      totalRevenue: tutor ? (revenueByTutor.get(profile.id) || 0) : 0,
      qrCode: profile.qr_code || '',
      avatarUrl: profile.avatar_url || '',
      nationalId: String(profile.metadata?.nationalId || ''),
      parentPhone: String(profile.metadata?.parentPhone || ''),
    } as AdminUserAccount;
  });
}

function subscribeTables<T>(channelName: string, tables: string[], loader: () => Promise<T>, callback: (data: T) => void, onError?: (error: any) => void) {
  const client = requireSupabase();
  let disposed = false;
  const load = async () => {
    try {
      const data = await loader();
      if (!disposed) callback(data);
    } catch (error) {
      if (!disposed) onError?.(error);
    }
  };
  void load();
  const channel = client.channel(channelName);
  tables.forEach((table) => channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => void load()));
  channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onError?.(new Error(`Realtime channel ${channelName}: ${status}`));
  });
  return () => {
    disposed = true;
    void client.removeChannel(channel);
  };
}

export async function seedAdminDatabaseIfEmpty() {
  const client = requireSupabase();
  const { data: teachers, error } = await client.from('profiles').select('id,role,full_name,phone,email,governorate,city,grade,metadata').eq('role', 'teacher');
  if (error) throw error;
  for (const teacher of teachers || []) {
    const { data: existing, error: requestError } = await client.from('teacher_verification_requests').select('id').eq('teacher_id', teacher.id).limit(1).maybeSingle();
    if (requestError) throw requestError;
    if (existing) continue;
    await client.from('teacher_verification_requests').insert({
      teacher_id: teacher.id,
      teacher_name: teacher.full_name || 'مدرس حِصّتي',
      phone: teacher.phone || '',
      stage: teacher.grade || '',
      governorate: teacher.governorate || 'القاهرة',
      area: teacher.city || '',
      subject: '',
      bio: '',
      experience_years: '',
      id_card_image_url: String((teacher.metadata as any)?.idCardImageUrl || ''),
      certificate_image_url: String((teacher.metadata as any)?.certificateImageUrl || ''),
      status: 'pending',
    });
  }
}

export function subscribeToUsers(callback: (users: AdminUserAccount[]) => void, onError?: (error: any) => void) {
  return subscribeTables('admin:users', ['profiles', 'tutor_profiles', 'student_groups', 'group_enrollments'], loadAccountRows, callback, onError);
}

async function loadVerificationRows(): Promise<TeacherVerificationRequest[]> {
  const { data, error } = await requireSupabase().from('teacher_verification_requests').select('*').order('submitted_at', { ascending: false });
  if (error) throw error;
  return ((data || []) as any[]).map((row) => ({
    id: row.id,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name || '',
    phone: row.phone || '',
    subject: row.subject || '',
    stage: row.stage || '',
    governorate: row.governorate || '',
    area: row.area || '',
    bio: row.bio || '',
    experienceYears: row.experience_years || '',
    idCardImageUrl: row.id_card_image_url || '',
    certificateImageUrl: row.certificate_image_url || undefined,
    submittedAt: row.submitted_at || row.created_at || '',
    status: row.status,
    rejectionReason: row.rejection_reason || undefined,
    actionedAt: row.actioned_at || undefined,
    actionedBy: row.actioned_by || undefined,
  }));
}

export function subscribeToVerifications(callback: (requests: TeacherVerificationRequest[]) => void, onError?: (error: any) => void) {
  return subscribeTables('admin:teacher-verification-requests', ['teacher_verification_requests'], loadVerificationRows, callback, onError);
}

function mapReportCategory(value?: string | null): AdminSafetyReport['category'] {
  switch ((value || '').toLowerCase()) {
    case 'inappropriate_conduct': return 'inappropriate_conduct';
    case 'external_payment_demand': return 'external_payment_demand';
    case 'absence_no_notice': return 'absence_no_notice';
    case 'verbal_abuse': return 'verbal_abuse';
    default: return 'other';
  }
}

async function loadSafetyRows(): Promise<AdminSafetyReport[]> {
  const client = requireSupabase();
  const [{ data: reports, error: reportError }, { data: profiles, error: profileError }] = await Promise.all([
    client.from('safety_reports').select('id,ticket_number,reporter_id,report_type,details,status,created_at,updated_at,target_teacher_id,category').order('created_at', { ascending: false }),
    client.from('profiles').select('id,full_name,phone,role'),
  ]);
  if (reportError) throw reportError;
  if (profileError) throw profileError;
  const byId = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));
  return ((reports || []) as any[]).map((row) => {
    const reporter = byId.get(row.reporter_id);
    const target = byId.get(row.target_teacher_id);
    return {
      id: row.id,
      reporterName: reporter?.full_name || 'مستخدم',
      reporterRole: reporter?.role === 'parent' ? 'parent' : 'student',
      reporterPhone: reporter?.phone || '',
      targetTeacherId: row.target_teacher_id || '',
      targetTeacherName: target?.full_name || 'غير محدد',
      category: mapReportCategory(row.category || row.report_type),
      description: row.details || '',
      createdAt: row.created_at || '',
      status: row.status === 'under_investigation' ? 'in_review' : row.status === 'open' ? 'new' : 'resolved',
      teacherSuspended: false,
    };
  });
}

export function subscribeToReports(callback: (reports: AdminSafetyReport[]) => void, onError?: (error: any) => void) {
  return subscribeTables('admin:safety-reports', ['safety_reports', 'profiles'], loadSafetyRows, callback, onError);
}

function getBillingCycle() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

function getCommissionRate(students: number) {
  if (students >= 300) return 1.0;
  if (students >= 150) return 1.5;
  return 2.0;
}

async function syncCurrentCommissionRows() {
  const client = requireSupabase();
  const billingCycle = getBillingCycle();
  const [{ data: teachers, error: teacherError }, { data: tutors, error: tutorError }, { data: groups, error: groupError }, { data: enrollments, error: enrollmentError }, { data: existing, error: existingError }] = await Promise.all([
    client.from('profiles').select('id,full_name,role').eq('role', 'teacher'),
    client.from('tutor_profiles').select('user_id,subjects').in('user_id', (await client.from('profiles').select('id').eq('role', 'teacher')).data?.map((p: any) => p.id) || []),
    client.from('student_groups').select('id,tutor_id,monthly_fee,is_active'),
    client.from('group_enrollments').select('group_id,student_id,status').eq('status', 'active'),
    client.from('commission_tracking').select('id,teacher_id,billing_cycle,payment_status,last_payment_date').eq('billing_cycle', billingCycle),
  ]);
  if (teacherError) throw teacherError;
  if (tutorError) throw tutorError;
  if (groupError) throw groupError;
  if (enrollmentError) throw enrollmentError;
  if (existingError) throw existingError;

  const groupById = new Map<string, any>((groups || []).map((g: any) => [g.id, g]));
  const studentsByTeacher = new Map<string, Set<string>>();
  const grossByTeacher = new Map<string, number>();
  for (const enrollment of enrollments || []) {
    const group = groupById.get(enrollment.group_id);
    if (!group || group.is_active === false || !group.tutor_id) continue;
    if (!studentsByTeacher.has(group.tutor_id)) studentsByTeacher.set(group.tutor_id, new Set());
    if (enrollment.student_id) studentsByTeacher.get(group.tutor_id)!.add(enrollment.student_id);
    grossByTeacher.set(group.tutor_id, (grossByTeacher.get(group.tutor_id) || 0) + Number(group.monthly_fee || 0));
  }
  const subjectByTeacher = new Map<string, string>((tutors || []).map((t: any) => [t.user_id, t.subjects?.[0] || '']));
  const existingByTeacher = new Map<string, any>((existing || []).map((r: any) => [r.teacher_id, r]));
  for (const teacher of teachers || []) {
    const count = studentsByTeacher.get(teacher.id)?.size || 0;
    const gross = grossByTeacher.get(teacher.id) || 0;
    const old = existingByTeacher.get(teacher.id);
    const rate = getCommissionRate(count);
    const due = Number((gross * rate / 100).toFixed(2));
    const { error } = await client.from('commission_tracking').upsert({
      id: old?.id,
      teacher_id: teacher.id,
      billing_cycle: billingCycle,
      active_students_count: count,
      monthly_gross_egp: gross,
      tier_rate: rate,
      due_commission_egp: due,
      payment_status: old?.payment_status || 'pending',
      last_payment_date: old?.last_payment_date || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'teacher_id,billing_cycle' });
    if (error) throw error;
  }
}

async function loadCommissionRows(): Promise<TeacherCommissionTrackingItem[]> {
  const client = requireSupabase();
  await syncCurrentCommissionRows();
  const [{ data: rows, error: rowError }, { data: profiles, error: profileError }, { data: tutors, error: tutorError }] = await Promise.all([
    client.from('commission_tracking').select('*').order('billing_cycle', { ascending: false }).order('due_commission_egp', { ascending: false }),
    client.from('profiles').select('id,full_name'),
    client.from('tutor_profiles').select('user_id,subjects'),
  ]);
  if (rowError) throw rowError;
  if (profileError) throw profileError;
  if (tutorError) throw tutorError;
  const names = new Map<string, string>((profiles || []).map((p: any) => [p.id, p.full_name || 'مدرس']));
  const subjects = new Map<string, string>((tutors || []).map((t: any) => [t.user_id, t.subjects?.[0] || '']));
  return ((rows || []) as any[]).map((row) => ({
    id: row.id,
    teacherId: row.teacher_id,
    teacherName: names.get(row.teacher_id) || 'مدرس',
    subject: subjects.get(row.teacher_id) || '',
    activeStudentsCount: Number(row.active_students_count || 0),
    monthlyGrossEgp: Number(row.monthly_gross_egp || 0),
    tierRate: Number(row.tier_rate || 0),
    dueCommissionEgp: Number(row.due_commission_egp || 0),
    paymentStatus: row.payment_status,
    lastPaymentDate: row.last_payment_date || undefined,
    billingCycle: row.billing_cycle,
  }));
}

export function subscribeToCommissions(callback: (commissions: TeacherCommissionTrackingItem[]) => void, onError?: (error: any) => void) {
  return subscribeTables('admin:commission-tracking', ['commission_tracking', 'student_groups', 'group_enrollments', 'profiles', 'tutor_profiles'], loadCommissionRows, callback, onError);
}

export async function createTeacherVerificationRequest(payload: Partial<TeacherVerificationRequest> & { teacherId: string; teacherName: string }) {
  const client = requireSupabase();
  const { data, error } = await client.from('teacher_verification_requests').insert({
    teacher_id: payload.teacherId,
    teacher_name: payload.teacherName,
    phone: payload.phone || '',
    subject: payload.subject || '',
    stage: payload.stage || '',
    governorate: payload.governorate || '',
    area: payload.area || '',
    bio: payload.bio || '',
    experience_years: String(payload.experienceYears || ''),
    id_card_image_url: payload.idCardImageUrl || '',
    certificate_image_url: payload.certificateImageUrl || null,
    status: 'pending',
  }).select().single();
  if (error) throw error;
  return data;
}

export async function dbUpdateAccountBadge(accountId: string, newBadge: AccountBadgeType) {
  const client = requireSupabase();
  const now = new Date().toISOString();
  const { error } = await client.from('profiles').update({ badge: newBadge, updated_at: now }).eq('id', accountId);
  if (error) throw error;
  const { error: tutorError } = await client.from('tutor_profiles').update({ is_verified: newBadge === 'verified', verification_status: newBadge === 'verified' ? 'approved' : newBadge === 'fraudulent' ? 'rejected' : 'pending', updated_at: now }).eq('user_id', accountId);
  if (tutorError) throw tutorError;
}

export async function dbUpdateAccountFullProfile(accountId: string, updates: Partial<AdminUserAccount>) {
  const client = requireSupabase();
  const { data: current, error: currentError } = await client.from('profiles').select('metadata').eq('id', accountId).maybeSingle();
  if (currentError) throw currentError;
  const metadata = { ...(current?.metadata || {}) };
  if (updates.nationalId !== undefined) metadata.nationalId = updates.nationalId;
  if (updates.parentPhone !== undefined) metadata.parentPhone = updates.parentPhone;
  const profilePatch: Record<string, any> = { metadata, updated_at: new Date().toISOString() };
  if (updates.name !== undefined) profilePatch.full_name = updates.name;
  if (updates.phone !== undefined) profilePatch.phone = updates.phone;
  if (updates.email !== undefined) profilePatch.email = updates.email || null;
  if (updates.role !== undefined) profilePatch.role = updates.role;
  if (updates.governorate !== undefined) profilePatch.governorate = updates.governorate;
  if (updates.area !== undefined) profilePatch.city = updates.area;
  if (updates.grade !== undefined) profilePatch.grade = updates.grade;
  if (updates.avatarUrl !== undefined) profilePatch.avatar_url = updates.avatarUrl || null;
  if (updates.status !== undefined) profilePatch.account_status = updates.status;
  if (updates.badge !== undefined) profilePatch.badge = updates.badge;
  const { error } = await client.from('profiles').update(profilePatch).eq('id', accountId);
  if (error) throw error;

  const isTeacher = updates.role === 'teacher' || updates.subject !== undefined || updates.grade !== undefined || updates.governorate !== undefined || updates.area !== undefined || updates.name !== undefined || updates.avatarUrl !== undefined;
  if (isTeacher) {
    const { data: tutor, error: tutorReadError } = await client.from('tutor_profiles').select('id').eq('user_id', accountId).maybeSingle();
    if (tutorReadError) throw tutorReadError;
    const tutorPatch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.subject !== undefined) tutorPatch.subjects = [updates.subject];
    if (updates.grade !== undefined) tutorPatch.grades = [updates.grade];
    if (updates.name !== undefined) tutorPatch.title = `معلم ${updates.subject || 'المادة'}`;
    if (updates.governorate !== undefined) tutorPatch.governorate = updates.governorate;
    if (updates.area !== undefined) tutorPatch.city = updates.area;
    if (updates.avatarUrl !== undefined) tutorPatch.metadata = { avatarUrl: updates.avatarUrl };
    if (tutor) {
      const { error } = await client.from('tutor_profiles').update(tutorPatch).eq('id', tutor.id);
      if (error) throw error;
    } else {
      const { error } = await client.from('tutor_profiles').insert({ user_id: accountId, ...tutorPatch, is_verified: updates.badge === 'verified', verification_status: updates.badge === 'verified' ? 'approved' : 'pending' });
      if (error) throw error;
    }
  }
}

export async function dbToggleAccountStatus(accountId: string, currentStatus: 'active' | 'suspended') {
  const { error } = await requireSupabase().from('profiles').update({ account_status: currentStatus === 'active' ? 'suspended' : 'active', updated_at: new Date().toISOString() }).eq('id', accountId);
  if (error) throw error;
}

export async function dbDeleteAccount(accountId: string) {
  const { error } = await requireSupabase().from('profiles').delete().eq('id', accountId);
  if (error) throw error;
}

export async function dbApproveVerification(requestId: string, teacherId: string, adminEmail: string, teacherData?: Partial<AdminUserAccount>) {
  const client = requireSupabase();
  const now = new Date().toISOString();
  if (!isAdminEmail(adminEmail)) throw new Error('Unauthorized admin');
  const { error: requestError } = await client.from('teacher_verification_requests').update({ status: 'approved', actioned_at: now, actioned_by: adminEmail, rejection_reason: null, updated_at: now }).eq('id', requestId);
  if (requestError) throw requestError;
  const profilePatch: Record<string, any> = { account_status: 'active', badge: 'verified', updated_at: now };
  if (teacherData?.name !== undefined) profilePatch.full_name = teacherData.name;
  if (teacherData?.phone !== undefined) profilePatch.phone = teacherData.phone;
  if (teacherData?.governorate !== undefined) profilePatch.governorate = teacherData.governorate;
  if (teacherData?.area !== undefined) profilePatch.city = teacherData.area;
  if (teacherData?.grade !== undefined) profilePatch.grade = teacherData.grade;
  const { error: profileError } = await client.from('profiles').update(profilePatch).eq('id', teacherId);
  if (profileError) throw profileError;
  const { data: tutor, error: tutorReadError } = await client.from('tutor_profiles').select('id').eq('user_id', teacherId).maybeSingle();
  if (tutorReadError) throw tutorReadError;
  const tutorPatch: Record<string, any> = { is_verified: true, verification_status: 'approved', updated_at: now };
  if (teacherData?.subject !== undefined) tutorPatch.subjects = [teacherData.subject];
  if (teacherData?.grade !== undefined) tutorPatch.grades = [teacherData.grade];
  if (teacherData?.governorate !== undefined) tutorPatch.governorate = teacherData.governorate;
  if (teacherData?.area !== undefined) tutorPatch.city = teacherData.area;
  if (tutor) {
    const { error } = await client.from('tutor_profiles').update(tutorPatch).eq('id', tutor.id);
    if (error) throw error;
  } else {
    const { error } = await client.from('tutor_profiles').insert({ user_id: teacherId, ...tutorPatch });
    if (error) throw error;
  }
}

export async function dbRejectVerification(requestId: string, reason: string, adminEmail: string) {
  const client = requireSupabase();
  const now = new Date().toISOString();
  if (!isAdminEmail(adminEmail)) throw new Error('Unauthorized admin');
  const { data: request, error: requestReadError } = await client.from('teacher_verification_requests').select('teacher_id').eq('id', requestId).maybeSingle();
  if (requestReadError) throw requestReadError;
  const { error } = await client.from('teacher_verification_requests').update({ status: 'rejected', rejection_reason: reason, actioned_at: now, actioned_by: adminEmail, updated_at: now }).eq('id', requestId);
  if (error) throw error;
  if (request?.teacher_id) {
    const { error: tutorError } = await client.from('tutor_profiles').update({ is_verified: false, verification_status: 'rejected', updated_at: now }).eq('user_id', request.teacher_id);
    if (tutorError) throw tutorError;
    const { error: profileError } = await client.from('profiles').update({ badge: 'none', updated_at: now }).eq('id', request.teacher_id);
    if (profileError) throw profileError;
  }
}

export async function dbSuspendTeacherFromReport(teacherId: string, reportId: string) {
  const client = requireSupabase();
  const now = new Date().toISOString();
  const { error: reportError } = await client.from('safety_reports').update({ status: 'under_investigation', updated_at: now }).eq('id', reportId);
  if (reportError) throw reportError;
  const { error: profileError } = await client.from('profiles').update({ account_status: 'suspended', badge: 'fraudulent', updated_at: now }).eq('id', teacherId);
  if (profileError) throw profileError;
  const { error: tutorError } = await client.from('tutor_profiles').update({ is_verified: false, verification_status: 'rejected', updated_at: now }).eq('user_id', teacherId);
  if (tutorError) throw tutorError;
}

export async function dbResolveReport(reportId: string) {
  const { error } = await requireSupabase().from('safety_reports').update({ status: 'resolved', updated_at: new Date().toISOString() }).eq('id', reportId);
  if (error) throw error;
}

export async function dbDismissReport(reportId: string) {
  const { error } = await requireSupabase().from('safety_reports').delete().eq('id', reportId);
  if (error) throw error;
}

export async function dbMarkCommissionPaid(commissionId: string) {
  const { error } = await requireSupabase().from('commission_tracking').update({ payment_status: 'paid', last_payment_date: new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString() }).eq('id', commissionId);
  if (error) throw error;
}
