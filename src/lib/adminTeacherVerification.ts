import { supabase } from './supabase';

export async function approveTeacherVerificationAtomic(params: {
  requestId: string;
  teacherId: string;
  adminEmail: string;
  name?: string;
  phone?: string;
  governorate?: string;
  city?: string;
  grade?: string;
  subject?: string;
}) {
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase.rpc('admin_approve_teacher_verification', {
    p_request_id: params.requestId,
    p_teacher_id: params.teacherId,
    p_admin_email: params.adminEmail,
    p_name: params.name ?? null,
    p_phone: params.phone ?? null,
    p_governorate: params.governorate ?? null,
    p_city: params.city ?? null,
    p_grade: params.grade ?? null,
    p_subject: params.subject ?? null,
  });

  if (error) throw error;
}
