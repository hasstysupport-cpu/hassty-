import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock3, MapPin, QrCode, UserCheck, UserX, Users, WalletCards, RefreshCw, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { getCleanAvatarUrl } from '../../lib/avatarHelper';
import { subscribeToStudentPendingRequests, respondToParentLinkRequest, ParentLinkRequest } from '../../lib/parentStudentService';
import { supabase } from '../../lib/supabase';

interface Props { onNavigate: (path: string) => void; onSelectTutor: (tutorId: string) => void; }

type Lesson = { id: string; tutorId: string; tutorName: string; subject: string; grade: string; date: string; time: string; location: string; status: string; price: number };
type Tutor = { id: string; name: string; subject: string; avatarUrl: string; verified: boolean; groupName: string };

export const StudentDashboardPageV2: React.FC<Props> = ({ onNavigate, onSelectTutor }) => {
  const { user } = useAuth();
  const uid = user?.uid || '';
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ParentLinkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState<{type:'success'|'error'; text:string}|null>(null);
  const [processingId, setProcessingId] = useState<string|null>(null);

  const profile = {
    name: user?.name || 'طالب',
    grade: user?.profileData?.grade || user?.grade || 'غير محدد',
    governorate: user?.governorate || user?.profileData?.governorate || '',
    city: user?.area || user?.profileData?.area || '',
    qrCode: user?.profileData?.qrCode || '',
    avatar: getCleanAvatarUrl(user?.avatarUrl || user?.profileData?.avatarUrl, 'student', user?.name),
  };

  const loadDashboard = async () => {
    if (!uid || !supabase) { setLoading(false); return; }
    setRefreshing(true);
    try {
      const [bookingsRes, enrollmentsRes, attendanceRes] = await Promise.all([
        supabase.from('booking_requests').select('id,tutor_id,subject,day,time,location,price,status,student_id,student_grade,created_at').eq('student_id', uid).order('created_at', { ascending: false }).limit(20),
        supabase.from('group_enrollments').select('group_id,student_id,student_name,student_phone,grade,status,enrolled_at,group:student_groups(id,name,subject,grade,schedule,location,tutor_id)').eq('student_id', uid).eq('status', 'active').order('enrolled_at', { ascending: false }),
        supabase.from('attendance_records').select('id,group_id,status,date,time,student_id,student_name').eq('student_id', uid).order('date', { ascending: false }).order('time', { ascending: false }).limit(50),
      ]);
      if (bookingsRes.error) throw bookingsRes.error;
      if (enrollmentsRes.error) throw enrollmentsRes.error;
      if (attendanceRes.error) throw attendanceRes.error;

      const rows = bookingsRes.data || [];
      const tutorIds = Array.from(new Set(rows.map((r:any)=>r.tutor_id).filter(Boolean).concat((enrollmentsRes.data||[]).map((r:any)=>r.group?.tutor_id).filter(Boolean))));
      let tutorMap = new Map<string, any>();
      if (tutorIds.length) {
        const { data: tutorProfiles, error } = await supabase.from('tutor_profiles').select('user_id,title,headline,subjects,is_verified,verification_status,governorate,city').in('user_id', tutorIds);
        if (error) throw error;
        tutorMap = new Map((tutorProfiles||[]).map((p:any)=>[p.user_id,p]));
      }
      const profileIds = Array.from(new Set([...tutorIds]));
      let names = new Map<string,string>();
      if (profileIds.length) {
        const { data: people, error } = await supabase.from('profiles').select('id,full_name,avatar_url').in('id', profileIds);
        if (error) throw error;
        names = new Map((people||[]).map((p:any)=>[p.id,p.full_name||'المدرس']));
      }

      const enrollmentLessons: Lesson[] = (enrollmentsRes.data||[]).map((r:any)=>({
        id:`group-${r.group_id}`, tutorId:r.group?.tutor_id||'', tutorName:names.get(r.group?.tutor_id)||'مدرس', subject:r.group?.subject||'الحصة', grade:r.grade||r.group?.grade||profile.grade, date:'', time:r.group?.schedule||'', location:r.group?.location||'', status:'active', price:0
      }));
      const bookingLessons: Lesson[] = rows.filter((r:any)=>r.status==='approved'||r.status==='pending').map((r:any)=>({
        id:r.id, tutorId:r.tutor_id, tutorName:names.get(r.tutor_id)||'مدرس', subject:r.subject||'الحصة', grade:r.student_grade||profile.grade, date:r.day||'', time:r.time||'', location:r.location||'', status:r.status, price:Number(r.price||0)
      }));
      const allLessons = [...bookingLessons, ...enrollmentLessons];
      const dedup = new Map<string,Lesson>(); allLessons.forEach(l=>dedup.set(`${l.tutorId}-${l.id}`,l)); setLessons(Array.from(dedup.values()).slice(0,12));

      const tutorDedup = new Map<string,Tutor>();
      (enrollmentsRes.data||[]).forEach((r:any)=>{
        const tid=r.group?.tutor_id; if(!tid) return; const tp=tutorMap.get(tid)||{};
        tutorDedup.set(tid,{id:tid,name:names.get(tid)||'مدرس',subject:tp.subjects?.[0]||r.group?.subject||'المادة الدراسية',avatarUrl:'',verified:tp.is_verified===true||tp.verification_status==='approved',groupName:r.group?.name||'مجموعة'});
      });
      rows.forEach((r:any)=>{ const tid=r.tutor_id; if(!tid) return; const tp=tutorMap.get(tid)||{}; if(!tutorDedup.has(tid)) tutorDedup.set(tid,{id:tid,name:names.get(tid)||'مدرس',subject:r.subject||tp.subjects?.[0]||'المادة الدراسية',avatarUrl:'',verified:tp.is_verified===true||tp.verification_status==='approved',groupName:'حجز'}); });
      setTutors(Array.from(tutorDedup.values()).slice(0,6));
      setAttendance(attendanceRes.data||[]);
    } catch (e:any) {
      setAlert({type:'error', text:e?.message||'تعذر تحميل بيانات لوحة الطالب.'});
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(()=>{ void loadDashboard(); },[uid]);
  useEffect(()=>{ if(!uid) return subscribeToStudentPendingRequests(uid,setPendingRequests); },[uid]);

  const attendanceRate = useMemo(()=>{
    if(!attendance.length) return 0;
    return Math.round(attendance.filter(r=>r.status==='present'||r.status==='late').length / attendance.length * 100);
  },[attendance]);
  const upcoming = lessons.filter(l=>l.status==='approved'||l.status==='active');

  const respond = async (id:string, approve:boolean) => {
    setProcessingId(id); setAlert(null); try { const res=await respondToParentLinkRequest(id,approve); setAlert({type:res.success?'success':'error',text:res.message}); } catch(e:any){setAlert({type:'error',text:e?.message||'حدث خطأ.'});} finally{setProcessingId(null);} };

  return <div className="space-y-6 text-right" dir="rtl">
    {alert && <div className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${alert.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-900':'bg-red-50 border-red-200 text-red-900'}`}><span className="text-sm font-bold flex items-center gap-2">{alert.type==='success'?<CheckCircle2 className="w-5 h-5"/>:<AlertCircle className="w-5 h-5"/>}{alert.text}</span><button onClick={()=>setAlert(null)}><X className="w-4 h-4"/></button></div>}

    {pendingRequests.map(req=><section key={req.id} className="rounded-3xl border-2 border-blue-200 bg-blue-50/70 p-5"><div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center"><div><div className="text-xs font-black text-blue-700 mb-1">طلب ربط ولي أمر</div><h3 className="font-black text-lg text-slate-900">{req.parentName} يطلب ربط حسابه بحسابك</h3><p className="text-xs text-slate-600 mt-1">لن يتمكن من متابعة بياناتك إلا بعد موافقتك.</p></div><div className="flex gap-2 w-full lg:w-auto"><button disabled={processingId===req.id} onClick={()=>void respond(req.id,true)} className="flex-1 lg:flex-none rounded-xl bg-emerald-600 text-white px-5 py-3 text-xs font-black">موافقة</button><button disabled={processingId===req.id} onClick={()=>void respond(req.id,false)} className="flex-1 lg:flex-none rounded-xl border border-red-200 bg-white text-red-700 px-5 py-3 text-xs font-black">رفض</button></div></div></section>)}

    <section className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm"><div className="flex flex-col md:flex-row md:items-center justify-between gap-5"><div className="flex items-center gap-4"><img src={profile.avatar} alt={profile.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200"/><div><h1 className="text-2xl font-black text-slate-900">أهلاً يا {profile.name} 👋</h1><div className="flex flex-wrap gap-2 mt-2"><span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-bold">{profile.grade}</span>{profile.governorate&&<span className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/>{profile.governorate}{profile.city?` — ${profile.city}`:''}</span>}</div></div></div><div className="flex gap-2"><button onClick={()=>onNavigate('/student/profile')} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold">البروفايل</button><button onClick={()=>onNavigate('/student/qr-card')} className="rounded-xl bg-blue-600 text-white px-4 py-3 text-xs font-black flex items-center gap-2"><QrCode className="w-4 h-4"/>كارنيه QR</button></div></div></section>

    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Stat icon={<Users/>} label="المدرسين" value={tutors.length}/><Stat icon={<Calendar/>} label="الحصص القادمة" value={upcoming.length}/><Stat icon={<CheckCircle2/>} label="نسبة الحضور" value={`${attendanceRate}%`}/><Stat icon={<WalletCards/>} label="الحجوزات" value={lessons.length}/></section>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5"><section className="xl:col-span-2 rounded-3xl bg-white border border-slate-200 p-5"><div className="flex items-center justify-between mb-4"><h2 className="font-black text-slate-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600"/>الحصص والحجوزات</h2><button onClick={()=>void loadDashboard()} className="text-xs font-bold text-slate-500 flex items-center gap-1"><RefreshCw className={`w-4 h-4 ${refreshing?'animate-spin':''}`}/>تحديث</button></div>{loading?<Empty text="جاري تحميل جدولك..."/>:upcoming.length===0?<Empty text="لا توجد حصص أو حجوزات حالية. ابدأ بحجز مدرس." action={()=>onNavigate('/student/book')}/>:<div className="space-y-3">{upcoming.slice(0,8).map(l=><div key={l.id} className="rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 justify-between"><div><div className="flex items-center gap-2"><h3 className="font-black text-slate-900">{l.subject}</h3><span className={`text-[10px] rounded-full px-2 py-1 font-bold ${l.status==='approved'?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}>{l.status==='approved'?'مؤكد':'قيد المراجعة'}</span></div><p className="text-xs text-slate-500 mt-1">{l.tutorName} • {l.groupName||''}</p></div><div className="text-xs text-slate-600 flex flex-wrap gap-3 items-center"><span className="flex items-center gap-1"><Clock3 className="w-4 h-4"/>{l.day||'حسب الجدول'} {l.time}</span>{l.location&&<span className="flex items-center gap-1"><MapPin className="w-4 h-4"/>{l.location}</span>}</div></div>)}</div>}</section>

    <section className="rounded-3xl bg-white border border-slate-200 p-5"><h2 className="font-black text-slate-900 flex items-center gap-2 mb-4"><UserCheck className="w-5 h-5 text-emerald-600"/>مدرسوني</h2>{tutors.length===0?<Empty text="لسه مفيش مدرسين مرتبطين بحسابك." action={()=>onNavigate('/student/book')}/>:<div className="space-y-3">{tutors.map(t=><button key={t.id} onClick={()=>onSelectTutor(t.id)} className="w-full text-right rounded-2xl border border-slate-200 p-3 hover:border-blue-300 hover:bg-blue-50/30 transition"><div className="flex items-center justify-between"><div><div className="font-black text-sm text-slate-900">{t.name}</div><div className="text-xs text-slate-500 mt-1">{t.subject} • {t.groupName}</div></div>{t.verified?<span className="text-emerald-600 text-xs font-black flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/>موثق</span>:<span className="text-slate-400 text-[11px]">غير موثق</span>}</div></button>)}</div>}</section></div>

    {attendance.length>0 && <section className="rounded-3xl bg-white border border-slate-200 p-5"><h2 className="font-black text-slate-900 mb-4 flex items-center gap-2"><Clock3 className="w-5 h-5 text-blue-600"/>آخر الحضور</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{attendance.slice(0,6).map(r=><div key={r.id} className="rounded-2xl bg-slate-50 p-3 flex justify-between items-center"><div><div className="font-bold text-xs text-slate-800">{r.date}</div><div className="text-[11px] text-slate-500 mt-1">{r.time||''}</div></div><span className={`text-xs font-black ${r.status==='present'?'text-emerald-700':r.status==='late'?'text-amber-700':'text-red-700'}`}>{r.status==='present'?'حاضر':r.status==='late'?'متأخر':'غائب'}</span></div>)}</div></section>}
  </div>;
};

const Stat=({icon,label,value}:{icon:React.ReactNode;label:string;value:string|number})=><div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-500">{label}</span><div className="text-blue-600">{React.cloneElement(icon as React.ReactElement,{className:'w-4 h-4'})}</div></div><div className="text-2xl font-black text-slate-900 mt-2">{value}</div></div>;
const Empty=({text,action}:{text:string;action?:()=>void})=><div className="py-10 text-center text-slate-500"><div className="font-bold text-sm">{text}</div>{action&&<button onClick={action} className="mt-3 rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-black">ابدأ الآن</button>}</div>;
