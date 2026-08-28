import { supabase, isSupabaseConfigured } from './supabase';
import { StudentGroup, AttendanceRecord, TeacherStudentItem } from '../types';

export const dbService = {
  // Check if connected
  isReady: () => isSupabaseConfigured && supabase !== null,

  // Groups
  async getGroups(teacherId?: string): Promise<StudentGroup[] | null> {
    if (!supabase) return null;
    try {
      let query = supabase.from('student_groups').select('*').order('created_at', { ascending: false });
      if (teacherId) {
        query = query.eq('tutor_id', teacherId);
      }
      const { data, error } = await query;
      if (error) {
        console.warn('Error fetching groups from Supabase:', error);
        return null;
      }
      return data.map((g: any) => ({
        id: g.id,
        name: g.name,
        grade: g.grade,
        location: g.location,
        schedule: g.schedule,
        studentCount: g.current_count || 0,
        currentStudents: g.current_count || 0,
        maxCapacity: g.max_students || 30,
        isPaused: !g.is_active,
        billingType: g.billing_type || 'per_session',
        priceAmount: g.price_amount || 120,
        commissionRate: g.billing_type === 'monthly' ? 1.2 : 2.0,
      }));
    } catch (e) {
      console.warn('Supabase fetch exception:', e);
      return null;
    }
  },

  async createGroup(group: { name: string; grade: string; schedule: string; location: string; maxStudents: number; tutorId?: string }): Promise<any> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('student_groups').insert([{
        name: group.name,
        grade: group.grade,
        schedule: group.schedule,
        location: group.location,
        center_name: group.location,
        max_students: group.maxStudents,
        tutor_id: group.tutorId || '00000000-0000-0000-0000-000000000001',
      }]).select().single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase createGroup error:', e);
      return null;
    }
  },

  // Record Attendance
  async recordAttendance(record: {
    groupId: string;
    studentName: string;
    qrCode: string;
    status: 'present' | 'late' | 'absent';
    homeworkStatus?: 'completed' | 'partial' | 'not_completed';
    notes?: string;
  }): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('attendance_records').insert([{
        group_id: record.groupId,
        student_name: record.studentName,
        qr_code: record.qrCode,
        status: record.status,
        homework_status: record.homeworkStatus || 'completed',
        notes: record.notes || '',
        scanned_via_qr: true,
      }]);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase recordAttendance error:', e);
      return false;
    }
  },

  // Fetch Attendance Records
  async getAttendanceRecords(qrCode?: string): Promise<AttendanceRecord[] | null> {
    if (!supabase) return null;
    try {
      let query = supabase.from('attendance_records').select('*').order('created_at', { ascending: false });
      if (qrCode) {
        query = query.eq('qr_code', qrCode);
      }
      const { data, error } = await query;
      if (error) return null;
      return data.map((r: any) => ({
        id: r.id,
        studentId: r.student_id || r.qr_code,
        studentName: r.student_name,
        tutorId: r.tutor_id || 'tutor-1',
        tutorName: 'المعلم',
        groupName: 'المجموعة الدراسية',
        date: r.date,
        time: r.time,
        subject: 'الحصة الدراسية',
        status: r.status,
        timeWindowStatus: r.status === 'present' ? 'on_time' : 'late',
        teacherNotes: r.notes,
        homeworkAssigned: r.homework_status === 'completed' ? 'تم تسليم الواجب' : 'لم يتم التسليم',
      }));
    } catch (e) {
      return null;
    }
  },

  // Submit Safety Report
  async submitReport(report: { ticketNumber: string; reportType: string; details: string }): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('safety_reports').insert([{
        ticket_number: report.ticketNumber,
        report_type: report.reportType,
        details: report.details,
      }]);
      return !error;
    } catch (e) {
      return false;
    }
  },
};


export async function fetchTeacherGroups(teacherId: string): Promise<StudentGroup[]> {
  return (await dbService.getGroups(teacherId)) || [];
}

export async function createTeacherGroup(
  teacherId: string,
  groupData: {
    name: string;
    grade: string;
    schedule: string;
    location: string;
    maxCapacity?: number;
    billingType?: 'per_session' | 'monthly';
    priceAmount?: number;
    commissionRate?: number;
  }
): Promise<any> {
  return dbService.createGroup({
    name: groupData.name,
    grade: groupData.grade,
    schedule: groupData.schedule,
    location: groupData.location,
    maxStudents: groupData.maxCapacity || 30,
    tutorId: teacherId,
  });
}

export async function fetchTeacherStudents(teacherId: string): Promise<TeacherStudentItem[]> {
  if (!supabase) return [];
  try {
    const groups = (await dbService.getGroups(teacherId)) || [];
    const groupIds = groups.map((group) => group.id).filter(Boolean);
    if (groupIds.length === 0) return [];
    const { data, error } = await supabase
      .from('group_enrollments')
      .select('*')
      .in('group_id', groupIds)
      .order('enrolled_at', { ascending: false });
    if (error || !data) return [];
    const groupNames = new Map(groups.map((group) => [group.id, group.name]));
    return data.map((row: any) => ({
      id: row.student_id || row.id,
      name: row.student_name || 'طالب',
      avatarUrl: row.avatar_url || '',
      grade: row.grade || '',
      phone: row.student_phone || '',
      parentPhone: row.parent_phone || '',
      qrCode: row.qr_code || '',
      groupName: groupNames.get(row.group_id) || '',
      attendanceRate: Number(row.attendance_rate ?? 100),
      totalSessions: Number(row.total_sessions ?? 0),
      attendedSessions: Number(row.attended_sessions ?? 0),
      paymentStatus: row.payment_status || 'pending',
      joinedDate: row.enrolled_at ? String(row.enrolled_at).split('T')[0] : '',
      status: row.status === 'suspended' ? 'paused' : row.status === 'left' ? 'transferred' : 'active',
    }));
  } catch (error) {
    console.warn('Supabase fetchTeacherStudents error:', error);
    return [];
  }
}
