import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock3, MapPin, QrCode, UserCheck, Users, WalletCards, RefreshCw, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { getCleanAvatarUrl } from '../../lib/avatarHelper';
import { subscribeToStudentPendingRequests, respondToParentLinkRequest, ParentLinkRequest } from '../../lib/parentStudentService';
import { supabase } from '../../lib/supabase';
import { StatCard } from '../../components/common/ui';

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

  return <div className="space-y-4 text-right" dir="rtl">
    {alert && <div className={`anim-up rounded-xl border px-4 py-2.5 flex items-center justify-between gap-3 ${alert.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-900':'bg-red-50 border-red-200 text-red-900'}`}><span className="text-xs font-bold flex items-center gap-2">{alert.type==='success'?<CheckCircle2 className="w-4 h-4"/>:<AlertCircle className="w-4 h-4"/>}{alert.text}</span><button onClick={()=>setAlert(null)} className="cursor-pointer"><X className="w-3.5 h-3.5"/></button></div>}

    {pendingRequests.map(req=><section key={req.id} className="anim-up rounded-2xl border border-blue-200 bg-blue-50/70 p-4"><div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center"><div><div className="text-[11px] font-black text-blue-700 mb-0.5">طلب ربط ولي أمر</div><h3 className="font-black text-sm text-slate-900">{req.parentName} يطلب ربط حسابه بحسابك</h3><p className="text-[11px] text-slate-600 mt-1">لن يتمكن من متابعة بياناتك إلا بعد موافقتك.</p></div><div className="flex gap-2 w-full lg:w-auto"><button disabled={processingId===req.id} onClick={()=>void respond(req.id,true)} className="flex-1 lg:flex-none rounded-xl bg-emerald-600 text-white px-5 py-2.5 text-xs font-black cursor-pointer disabled:opacity-50">موافقة</button><button disabled={processingId===req.id} onClick={()=>void respond(req.id,false)} className="flex-1 lg:flex-none rounded-xl border border-red-200 bg-white text-red-700 px-5 py-2.5 text-xs font-black cursor-pointer disabled:opacity-50">رفض</button></div></div></section>)}

    <section className="anim-up hero-lux rounded-2xl p-4 sm:p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="hero-dots" aria-hidden="true" />
      <div className="hero-blob w-44 h-44 -top-20 -right-16 animate-float-slow" aria-hidden="true" />
      <div className="hero-blob w-28 h-28 -bottom-14 -left-10 animate-float-reverse" aria-hidden="true" />
      <div className="relative flex items-center gap-3.5">
        <span className="relative shrink-0">
          <span className="absolute -inset-1 rounded-[14px] bg-white/25 blur-[2px]" aria-hidden="true" />
          <img src={profile.avatar} alt={profile.name} className="relative w-12 h-12 rounded-xl object-cover border-2 border-white/60"/>
        </span>
        <div>
          <h1 className="text-lg font-black drop-shadow-sm">أهلاً يا {profile.name} 👋</h1>
          <div className="flex flex-wrap gap-2 mt-1.5 items-center"><span className="rounded-full bg-white/20 border border-white/30 backdrop-blur-sm text-white px-2.5 py-0.5 text-[11px] font-bold">{profile.grade}</span>{profile.governorate&&<span className="text-[11px] text-white/85 flex items-center gap-1"><MapPin className="w-3 h-3"/>{profile.governorate}{profile.city?` — ${profile.city}`:''}</span>}</div>
        </div>
      </div>
      <div className="relative flex gap-2"><button onClick={()=>onNavigate('/student/profile')} className="rounded-xl bg-white/15 border border-white/30 backdrop-blur-sm px-4 py-2.5 text-xs font-bold text-white cursor-pointer hover:bg-white/30">البروفايل</button><button onClick={()=>onNavigate('/student/qr-card')} className="rounded-xl bg-white text-[color:var(--role-color)] px-4 py-2.5 text-xs font-black flex items-center gap-2 cursor-pointer hover:bg-blue-50 shadow-lg hover:-translate-y-0.5"><QrCode className="w-4 h-4"/>كارنيه QR</button></div>
    </section>

    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3"><StatCard delay={60} label="المدرسين" value={tutors.length} tone="blue" icon={<Users className="w-3.5 h-3.5"/>}/><StatCard delay={130} label="الحصص القادمة" value={upcoming.length} tone="violet" icon={<Calendar className="w-3.5 h-3.5"/>}/><StatCard delay={200} label="نسبة الحضور" value={`${attendanceRate}%`} tone="emerald" icon={<CheckCircle2 className="w-3.5 h-3.5"/>}/><StatCard delay={270} label="الحجوزات" value={lessons.length} tone="amber" icon={<WalletCards className="w-3.5 h-3.5"/>}/></section>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4"><section className="anim-up xl:col-span-2 card-lux rounded-2xl bg-white border border-slate-200 p-4" style={{animationDelay:'340ms'}}><div className="flex items-center justify-between mb-3"><h2 className="text-sm font-black text-slate-900 flex items-center gap-2"><Calendar className="w-4 h-4 text-[color:var(--role-color)]"/>الحصص والحجوزات</h2><button onClick={()=>void loadDashboard()} className="text-[11px] font-bold text-slate-500 flex items-center gap-1 cursor-pointer hover:text-[color:var(--role-color)]"><RefreshCw className={`w-3.5 h-3.5 ${refreshing?'animate-spin':''}`}/>تحديث</button></div>{loading?<Empty text="جاري تحميل جدولك..."/>:upcoming.length===0?<Empty text="لا توجد حصص أو حجوزات حالية. ابدأ بحجز مدرس." action={()=>onNavigate('/student/book')}/>:<div className="space-y-2.5">{upcoming.slice(0,8).map((l,i)=><div key={l.id} className="row-in rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row gap-2.5 justify-between hover:shadow-lg hover:shadow-slate-200/70 hover:border-[color:var(--role-soft-border)] hover:-translate-y-0.5" style={{animationDelay:`${Math.min(i*45,360)}ms`}}><div><div className="flex items-center gap-2"><h3 className="text-[13px] font-black text-slate-900">{l.subject}</h3><span className={`text-[10px] rounded-full px-2 py-0.5 font-bold ${l.status==='approved'?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}>{l.status==='approved'?'مؤكد':'قيد المراجعة'}</span></div><p className="text-[11px] text-slate-500 mt-1">{l.tutorName} • {l.groupName||''}</p></div><div className="text-[11px] text-slate-600 flex flex-wrap gap-3 items-center"><span className="flex items-center gap-1"><Clock3 className="w-3.5 h-3.5"/>{l.day||'حسب الجدول'} {l.time}</span>{l.location&&<span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/>{l.location}</span>}</div></div>)}</div>}</section>

    <section className="anim-up card-lux rounded-2xl bg-white border border-slate-200 p-4" style={{animationDelay:'420ms'}}><h2 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-3"><UserCheck className="w-4 h-4 text-emerald-600"/>مدرسوني</h2>{tutors.length===0?<Empty text="لسه مفيش مدرسين مرتبطين بحسابك." action={()=>onNavigate('/student/book')}/>:<div className="space-y-2.5">{tutors.map((t,i)=><button key={t.id} onClick={()=>onSelectTutor(t.id)} className="row-in w-full text-right rounded-xl border border-slate-200 p-3 hover:border-[color:var(--role-soft-border)] hover:bg-[color:var(--role-soft)] hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 cursor-pointer" style={{animationDelay:`${Math.min(i*45,360)}ms`}}><div className="flex items-center justify-between"><div><div className="text-[13px] font-black text-slate-900">{t.name}</div><div className="text-[11px] text-slate-500 mt-0.5">{t.subject} • {t.groupName}</div></div>{t.verified?<span className="text-emerald-600 text-[11px] font-black flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/>موثق</span>:<span className="text-slate-400 text-[10px]">غير موثق</span>}</div></button>)}</div>}</section></div>

    {attendance.length>0 && <section className="anim-up card-lux rounded-2xl bg-white border border-slate-200 p-4" style={{animationDelay:'500ms'}}><h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><Clock3 className="w-4 h-4 text-[color:var(--role-color)]"/>آخر الحضور</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">{attendance.slice(0,6).map((r,i)=><div key={r.id} className="row-in rounded-xl bg-slate-50 border border-slate-100 p-3 flex justify-between items-center hover:border-[color:var(--role-soft-border)]" style={{animationDelay:`${Math.min(i*45,360)}ms`}}><div><div className="font-bold text-xs text-slate-800">{r.date}</div><div className="text-[10px] text-slate-500 mt-0.5">{r.time||''}</div></div><span className={`text-xs font-black ${r.status==='present'?'text-emerald-700':r.status==='late'?'text-amber-700':'text-red-700'}`}>{r.status==='present'?'حاضر':r.status==='late'?'متأخر':'غائب'}</span></div>)}</div></section>}
  </div>;
};

const Empty=({text,action}:{text:string;action?:()=>void})=><div className="py-8 text-center text-slate-500"><div className="font-bold text-sm">{text}</div>{action&&<button onClick={action} className="mt-3 rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-black cursor-pointer hover:bg-blue-700">ابدأ الآن</button>}</div>;
