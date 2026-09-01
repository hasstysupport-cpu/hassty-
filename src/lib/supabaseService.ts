import { supabase, isSupabaseConfigured } from './supabase';
import { StudentGroup, AttendanceRecord, TeacherStudentItem } from '../types';

const requireClient = () => {
  if (!isSupabaseConfigured || !supabase) throw new Error('قاعدة البيانات غير متاحة حاليًا.');
  return supabase;
};
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const mapGroup = (g: any): StudentGroup => ({
  id: g.id, name: g.name, subject: g.subject || undefined, grade: g.grade || undefined, level: g.grade || undefined,
  schedule: g.schedule || '', scheduleSlots: Array.isArray(g.schedule_slots) ? g.schedule_slots : [],
  location: g.location || g.center_name || '', currentStudents: Number(g.current_count || 0), studentCount: Number(g.current_count || 0),
  maxCapacity: Number(g.max_students || 35), isPaused: g.is_active === false, billingType: g.billing_type || 'per_session',
  priceAmount: Number(g.price_amount ?? g.monthly_fee ?? 0), commissionRate: Number(g.commission_rate ?? (g.billing_type === 'monthly' ? 1.2 : 2)),
});

export const dbService = {
  isReady: () => isSupabaseConfigured && !!supabase,
  async getGroups(teacherId?: string): Promise<StudentGroup[]> {
    const db = requireClient();
    let query = db.from('student_groups').select('*').order('created_at', { ascending: false });
    if (teacherId) query = query.eq('tutor_id', teacherId);
    const { data, error } = await query; if (error) throw error; return (data || []).map(mapGroup);
  },
  async createGroup(group: { name:string; grade:string; schedule:string; location:string; maxStudents:number; tutorId:string; scheduleSlots?:any[]; subject?:string; priceAmount?:number; billingType?:'per_session'|'monthly' }) {
    const db = requireClient(); if (!uuidRe.test(group.tutorId)) throw new Error('لا يمكن إنشاء مجموعة بدون حساب مدرس صالح.');
    const { data, error } = await db.from('student_groups').insert({
      name: group.name, subject: group.subject || null, grade: group.grade, schedule: group.schedule, schedule_slots: group.scheduleSlots || [],
      location: group.location, center_name: group.location, max_students: group.maxStudents, tutor_id: group.tutorId, price_amount: group.priceAmount || 0,
      billing_type: group.billingType || 'per_session', current_count: 0, student_ids: [], is_active: true, updated_at: new Date().toISOString(),
    }).select('*').single();
    if (error) throw error; return data;
  },
  async recordAttendance(record: { groupId:string; studentId:string; studentName:string; qrCode:string; status:'present'|'late'|'absent'; homeworkStatus?:'completed'|'partial'|'not_completed'; notes?:string; scannedAt?:Date }): Promise<boolean> {
    const db = requireClient(); const now = record.scannedAt || new Date();
    const { data: group, error: groupError } = await db.from('student_groups').select('id,tutor_id').eq('id', record.groupId).maybeSingle();
    if (groupError) throw groupError; if (!group?.id || !group.tutor_id) throw new Error('المجموعة غير صالحة أو غير مرتبطة بمدرس.');
    const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    const { data: existing } = await db.from('attendance_records').select('id').eq('group_id',record.groupId).eq('student_id',record.studentId).eq('date',date).limit(1);
    const payload = { tutor_id: group.tutor_id, student_id: record.studentId, student_name: record.studentName, qr_code: record.qrCode, status: record.status, time, homework_status: record.homeworkStatus || 'not_completed', notes: record.notes || '', scanned_via_qr: true, updated_at: now.toISOString() };
    if (existing?.[0]) { const { error } = await db.from('attendance_records').update(payload).eq('id',existing[0].id); if (error) throw error; return true; }
    const { error } = await db.from('attendance_records').insert({ group_id:record.groupId, ...payload, date, created_at:now.toISOString() }); if (error) throw error; return true;
  },
  async getAttendanceRecords(qrCode?:string, studentId?:string): Promise<AttendanceRecord[]> {
    const db = requireClient(); let query = db.from('attendance_records').select('id,student_id,student_name,tutor_id,group_id,date,time,status,notes,homework_status,qr_code,created_at').order('created_at',{ascending:false}).limit(100);
    if (qrCode) query=query.eq('qr_code',qrCode); if (studentId) query=query.eq('student_id',studentId);
    const { data, error }=await query; if(error) throw error; const rows=data||[];
    const tutorIds=Array.from(new Set(rows.map((r:any)=>r.tutor_id).filter(Boolean))); const groupIds=Array.from(new Set(rows.map((r:any)=>r.group_id).filter(Boolean)));
    const [tp,gp]=await Promise.all([tutorIds.length?db.from('profiles').select('id,full_name').in('id',tutorIds):Promise.resolve({data:[],error:null} as any),groupIds.length?db.from('student_groups').select('id,name,subject,location').in('id',groupIds):Promise.resolve({data:[],error:null} as any)]);
    const tutorMap = new Map<string, string>((tp.data || []).map((p: any) => [p.id, p.full_name || 'المدرس']));
    const groupMap = new Map<string, any>((gp.data || []).map((g: any) => [g.id, g]));
    return rows.map((r: any) => {
      const g: any = groupMap.get(r.group_id) || {};
      return {
        id: r.id,
        studentId: r.student_id || '',
        studentName: r.student_name || 'طالب',
        tutorId: r.tutor_id || '',
        tutorName: tutorMap.get(r.tutor_id) || 'المدرس',
        groupName: g.name || 'المجموعة',
        date: r.date || '',
        time: r.time || '',
        subject: g.subject || 'الحصة الدراسية',
        status: r.status,
        timeWindowStatus: r.status === 'present' ? 'on_time' : r.status === 'late' ? 'late' : 'absent_cutoff',
        location: g.location || '',
        teacherNotes: r.notes || '',
        homeworkAssigned: r.homework_status === 'completed' ? 'تم تسليم الواجب' : r.homework_status === 'partial' ? 'تسليم جزئي' : 'لم يتم التسليم',
      };
    });
  },
  async submitReport(report:{ticketNumber:string;reportType:string;details:string;reporterId?:string;reporterRole?:string;targetTeacherId?:string}) { const db=requireClient(); const {error}=await db.from('safety_reports').insert({ticket_number:report.ticketNumber,report_type:report.reportType,details:report.details,reporter_id:report.reporterId||null,reporter_role:report.reporterRole||null,target_teacher_id:report.targetTeacherId||null}); if(error)throw error; return true; },
};
export async function fetchTeacherGroups(teacherId:string){return dbService.getGroups(teacherId);}
export async function createTeacherGroup(teacherId:string,groupData:{name:string;grade:string;schedule:string;location:string;maxCapacity?:number;billingType?:'per_session'|'monthly';priceAmount?:number;commissionRate?:number;subject?:string;scheduleSlots?:any[]}){return dbService.createGroup({name:groupData.name,grade:groupData.grade,schedule:groupData.schedule,location:groupData.location,maxStudents:groupData.maxCapacity||35,tutorId:teacherId,billingType:groupData.billingType,priceAmount:groupData.priceAmount,subject:groupData.subject,scheduleSlots:groupData.scheduleSlots});}
export async function fetchTeacherStudents(teacherId:string):Promise<TeacherStudentItem[]>{const db=requireClient();const groups=await dbService.getGroups(teacherId);if(!groups.length)return[];const {data,error}=await db.from('group_enrollments').select('*').in('group_id',groups.map(g=>g.id)).eq('status','active').order('enrolled_at',{ascending:false});if(error)throw error;const names=new Map(groups.map(g=>[g.id,g.name]));return(data||[]).filter((r:any)=>r.student_id).map((r:any)=>({id:r.student_id,name:r.student_name||'طالب',avatarUrl:r.avatar_url||'',grade:r.grade||'',phone:r.student_phone||'',parentPhone:r.parent_phone||'',qrCode:r.qr_code||'',groupName:names.get(r.group_id)||'',attendanceRate:Number(r.attendance_rate||0),totalSessions:Number(r.total_sessions||0),attendedSessions:Number(r.attended_sessions||0),paymentStatus:r.payment_status||'pending',joinedDate:r.enrolled_at?String(r.enrolled_at).slice(0,10):'',status:r.status==='suspended'?'paused':r.status==='left'?'transferred':'active'}));}
