import { supabase, isSupabaseConfigured } from './supabase';
import { StudentGroup, AttendanceRecord } from '../types';

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
