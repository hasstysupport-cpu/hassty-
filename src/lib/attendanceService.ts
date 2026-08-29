import { supabase } from './supabase';

export type AttendanceStatus = 'present' | 'late' | 'absent';

const parseTime = (value: string) => {
  const [hours, minutes] = String(value || '').split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

export async function findStudentByQr(qrCode: string) {
  if (!supabase) return null;
  const clean = qrCode.trim().toUpperCase();
  if (!clean) return null;
  const values = clean.startsWith('HASSTY-') || clean.startsWith('STU-') ? [clean] : [clean, `HASSTY-${clean}`];
  for (const code of values) {
    const { data, error } = await supabase.from('profiles').select('id,full_name,phone,avatar_url,qr_code,grade,role,account_status').eq('qr_code', code).eq('role', 'student').neq('account_status', 'suspended').limit(1);
    if (!error && data?.[0]) return data[0];
  }
  return null;
}

export async function getEnrolledStudent(groupId: string, studentId: string) {
  if (!supabase || !groupId || !studentId) return null;
  const { data, error } = await supabase.from('group_enrollments').select('*').eq('group_id', groupId).eq('student_id', studentId).eq('status', 'active').limit(1);
  if (error || !data?.[0]) return null;
  return data[0];
}

export function getTiming(startTime: string, endTime: string, now = new Date()) {
  const start = parseTime(startTime);
  const endInput = parseTime(endTime);
  if (start === null || endInput === null) return { state: 'invalid' as const, minutesInto: 0, minutesLate: 0, duration: 0 };
  const end = endInput > start ? endInput : start + 120;
  const current = now.getHours() * 60 + now.getMinutes();
  const duration = Math.max(1, end - start);
  const minutesInto = current - start;
  const gracePeriod = 15;
  const halfDuration = Math.floor(duration / 2);
  if (current < start) return { state: 'not_started' as const, minutesInto: 0, minutesLate: 0, duration };
  if (current > end) return { state: 'ended' as const, minutesInto: duration, minutesLate: Math.max(0, minutesInto), duration };
  if (minutesInto <= gracePeriod) return { state: 'on_time' as const, minutesInto: Math.max(0, minutesInto), minutesLate: 0, duration };
  if (minutesInto <= halfDuration) return { state: 'late' as const, minutesInto, minutesLate: minutesInto, duration };
  return { state: 'absent' as const, minutesInto, minutesLate: minutesInto, duration };
}

const toDateParts = (now: Date) => ({
  date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
});

export async function recordQrAttendance(input: {
  groupId: string;
  studentId: string;
  studentName: string;
  qrCode: string;
  status: AttendanceStatus;
  notes: string;
  scannedAt?: Date;
  sessionId?: string;
  lateMinutes?: number;
}) {
  if (!supabase) throw new Error('قاعدة البيانات غير متاحة.');
  if (!input.groupId || !input.studentId) throw new Error('بيانات الطالب أو المجموعة غير صالحة.');
  const now = input.scannedAt || new Date();
  const parts = toDateParts(now);
  let query = supabase.from('attendance_records').select('id').eq('group_id', input.groupId).eq('student_id', input.studentId).eq('date', parts.date).order('created_at', { ascending: false }).limit(1);
  if (input.sessionId) query = query.eq('session_id', input.sessionId);
  const { data: existing, error: existingError } = await query;
  if (existingError) throw existingError;

  const payload = {
    group_id: input.groupId,
    student_id: input.studentId,
    student_name: input.studentName,
    qr_code: input.qrCode,
    date: parts.date,
    time: parts.time,
    status: input.status,
    homework_status: 'not_completed',
    notes: input.notes,
    scanned_via_qr: true,
    attendance_method: 'qr',
    session_id: input.sessionId || null,
    checked_in_at: now.toISOString(),
    late_minutes: Math.max(0, input.lateMinutes || 0),
    updated_at: now.toISOString(),
  };

  if (existing?.[0]) {
    const { data, error } = await supabase.from('attendance_records').update(payload).eq('id', existing[0].id).select('*').single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from('attendance_records').insert({ ...payload, created_at: now.toISOString() }).select('*').single();
  if (error) throw error;
  return data;
}

export async function checkoutAttendance(attendanceId: string, studentId: string, actorId: string, notes = 'تسجيل خروج') {
  if (!supabase) throw new Error('قاعدة البيانات غير متاحة.');
  const now = new Date().toISOString();
  const { data, error } = await supabase.from('attendance_records').update({ checked_out_at: now, updated_at: now }).eq('id', attendanceId).eq('student_id', studentId).is('checked_out_at', null).select('*').single();
  if (error) throw error;
  const event = await supabase.from('attendance_events').insert({ attendance_id: attendanceId, student_id: studentId, group_id: data.group_id, event_type: 'check_out', actor_id: actorId, occurred_at: now, notes });
  if (event.error) throw event.error;
  return data;
}
