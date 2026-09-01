import React,{useEffect,useMemo,useState} from 'react';
import { ShieldCheck, Layers, Users, UserCheck, Receipt, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Card, EmptyState, StatCard, PageHeader, LoadingBlock, DataTable, StatusBadge } from '../../components/common/ui';

/* ================================================================
   مساحة عمل المساعد — مقيّدة بـ assistant_group_assignments
   (المجموعات/الطلاب/الحضور/المصروفات كلها مفلترة حسب الصلاحيات)
   ================================================================ */

interface Assignment { group_id: string; can_take_attendance: boolean; can_manage_students: boolean; can_view_payments: boolean; can_add_notes: boolean; }

async function loadMyAssignments(uid: string): Promise<Assignment[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('assistant_group_assignments').select('group_id,can_take_attendance,can_manage_students,can_view_payments,can_add_notes').eq('assistant_id', uid).eq('is_active', true);
  return (data || []) as Assignment[];
}

const shortcuts: [string, string][] = [['/assistant/groups','المجموعات'],['/assistant/students','الطلاب'],['/assistant/attendance','الحضور'],['/assistant/payments','المصروفات']];

export const AssistantDashboardPage:React.FC<{onNavigate:(path:string)=>void}> = ({onNavigate})=>{
 const {user}=useAuth(); const [groups,setGroups]=useState<any[]>([]); const [assignments,setAssignments]=useState<Assignment[]>([]); const [loading,setLoading]=useState(true);
 useEffect(()=>{if(!supabase||!user?.uid)return; void (async()=>{
   const asg = await loadMyAssignments(user.uid);
   setAssignments(asg);
   const ids = asg.map(a=>a.group_id);
   if (!ids.length) { setGroups([]); setLoading(false); return; }
   const {data}=await supabase.from('student_groups').select('id,name,subject,grade,current_count,max_students,schedule,location,is_active').in('id',ids).order('created_at',{ascending:false});
   setGroups(data||[]);setLoading(false);
 })()},[user?.uid]);
 const students=useMemo(()=>groups.reduce((n,g)=>n+Number(g.current_count||0),0),[groups]);
 const canPayments = assignments.some(a=>a.can_view_payments);
 return <div className="space-y-4">
 <PageHeader title="لوحة المساعد" description="المجموعات والطلاب حسب الصلاحيات التي منحها لك المدرس فقط." />
 <section className="anim-up hero-lux rounded-2xl p-4 sm:p-5 text-white">
   <div className="hero-dots" aria-hidden="true"/>
   <div className="hero-blob w-40 h-40 -top-16 -right-14 animate-float-slow" aria-hidden="true"/>
   <div className="hero-blob w-24 h-24 -bottom-10 -left-8 animate-float-reverse" aria-hidden="true"/>
   <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
     <div>
       <h2 className="text-base font-black drop-shadow-sm">مساحة عملك كمساعد معتمد ✨</h2>
       <p className="text-[11px] text-white/85 mt-1">كل الصلاحيات محدّدة بدقة — بيانات المجموعات المسندة إليك فقط.</p>
     </div>
     <div className="flex flex-wrap gap-2">{shortcuts.map(([p,t])=><button key={p} onClick={()=>onNavigate(p)} className="rounded-xl bg-white/15 border border-white/30 backdrop-blur-sm px-3.5 py-2 text-[11px] font-black text-white cursor-pointer hover:bg-white/30 hover:-translate-y-0.5">{t}</button>)}</div>
   </div>
 </section>
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
   <StatCard delay={60} label="المجموعات المسندة" value={groups.length} tone="blue" icon={<Layers className="w-3.5 h-3.5"/>}/>
   <StatCard delay={130} label="الطلاب ضمن صلاحيتك" value={students} tone="emerald" icon={<Users className="w-3.5 h-3.5"/>}/>
   <StatCard delay={200} label="المجموعات النشطة" value={groups.filter(g=>g.is_active!==false).length} tone="violet" icon={<BarChart3 className="w-3.5 h-3.5"/>}/>
   <StatCard delay={270} label="صلاحية المصروفات" value={canPayments?'مفعّلة':'غير مفعّلة'} tone={canPayments?'emerald':'slate'} icon={<Receipt className="w-3.5 h-3.5"/>}/>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
   <Card title="حالة الصلاحيات" delay={330}>{assignments.length===0? <p className="text-[13px] leading-7 text-slate-600">لا توجد مجموعات مسندة لك بعد. سيظهر كل شيء هنا بعد أن يمنحك المدرس صلاحيات.</p> : <div className="space-y-2">{assignments.map((a,i)=>(<div key={a.group_id+i} className="row-in flex items-center justify-between text-xs bg-slate-50 rounded-xl p-2.5 hover:bg-[color:var(--role-soft)]/60 hover:border-[color:var(--role-soft-border)] border border-transparent" style={{animationDelay:`${Math.min(i*50,300)}ms`}}><span className="font-black">{groups.find(g=>g.id===a.group_id)?.name||'مجموعة'}</span><span className="flex gap-1.5">{a.can_take_attendance&&<b className="text-emerald-600">حضور</b>}{a.can_view_payments&&<b className="text-violet-600">مالية</b>}{a.can_add_notes&&<b className="text-blue-600">ملاحظات</b>}</span></div>))}</div>}</Card>
 </div>
 {loading?<Card delay={390}><LoadingBlock rows={2}/></Card>:assignments.length===0?<Card delay={390}><EmptyState title="لم يتم إسناد مجموعات لك حتى الآن" description="بعد قبول دعوة من مدرس وإسناد مجموعة سترى بياناتك هنا."/></Card>:null}
</div>;
};

export const AssistantGroupsPage:React.FC = ()=>{
 const {user}=useAuth(); const [groups,setGroups]=useState<any[]>([]); const [assignments,setAssignments]=useState<Assignment[]>([]); const [loading,setLoading]=useState(true);
 useEffect(()=>{if(!supabase||!user?.uid)return;void(async()=>{
   const asg=await loadMyAssignments(user.uid);setAssignments(asg);
   const ids=asg.map(a=>a.group_id);
   if(!ids.length){setGroups([]);setLoading(false);return}
   const{data}=await supabase.from('student_groups').select('id,name,subject,grade,current_count,max_students,schedule,location,is_active').in('id',ids);
   setGroups(data||[]);setLoading(false)})()},[user?.uid]);
 return <div className="space-y-4">
 <PageHeader title="المجموعات" description="المجموعات المسندة لك فقط — حسب صلاحيات المدرس." />
 <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 p-3 text-[11px] font-bold text-blue-800"><ShieldCheck className="w-4 h-4 shrink-0"/>البيانات المعروضة مقيّدة بصلاحياتك الفعلية في النظام.</div>
 {loading?<Card><LoadingBlock rows={2}/></Card>:groups.length===0?<Card><EmptyState title="لا توجد مجموعات مسندة لك حاليًا" description="سيظهر هنا كل ما يسنده إليك المدرس من مجموعات."/></Card>:<div className="grid grid-cols-1 xl:grid-cols-2 gap-3">{groups.map((g,i)=>{
   const asg=assignments.find(a=>a.group_id===g.id);
   return <Card key={g.id} delay={120+i*70}>
     <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-[13px] text-slate-900">{g.name}</h3><p className="text-[11px] text-slate-500 mt-0.5">{g.subject||'مادة غير محددة'} • {g.grade||'المرحلة غير محددة'}</p></div><StatusBadge status={g.is_active===false?'inactive':'active'}/></div>
     <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs"><div className="rounded-xl bg-slate-50 p-2.5"><span className="text-slate-500">الطلاب</span><b className="block mt-0.5 tabular-nums">{g.current_count||0} / {g.max_students||'-'}</b></div><div className="rounded-xl bg-slate-50 p-2.5"><span className="text-slate-500">الموعد</span><b className="block mt-0.5">{g.schedule||'غير محدد'}</b></div></div>
     <div className="mt-2.5 flex flex-wrap gap-1.5">{asg?.can_take_attendance&&<span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700">صلاحية الحضور</span>}{asg?.can_view_payments&&<span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700">صلاحية المصروفات</span>}{asg?.can_add_notes&&<span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700">صلاحية الملاحظات</span>}</div>
     <p className="mt-2.5 text-[11px] text-slate-500">{g.location||'الموقع غير محدد'}</p>
   </Card>;
 })}</div>}
</div>;
};

export const AssistantStudentsPage:React.FC = ()=>{
 const {user}=useAuth(); const [students,setStudents]=useState<any[]>([]); const [loading,setLoading]=useState(true);
 useEffect(()=>{if(!supabase||!user?.uid)return;void(async()=>{
   const asg=await loadMyAssignments(user.uid);
   const ids=asg.filter(a=>a.can_manage_students).map(a=>a.group_id);
   if(!ids.length){setStudents([]);setLoading(false);return}
   const{data}=await supabase.from('group_enrollments').select('id,group_id,student_id,student_name,student_phone,parent_phone,grade,attendance_rate,total_sessions,attended_sessions,payment_status,status,avatar_url').in('group_id',ids).eq('status','active').order('enrolled_at',{ascending:false});
   setStudents(data||[]);setLoading(false)})()},[user?.uid]);
 return <div className="space-y-4">
 <PageHeader title="الطلاب" description="طلاب المجموعات المسموح لك بإدارتها فقط (صلاحية إدارة الطلاب)." />
 <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
   {loading?new Array(4).fill(0).map((_,i)=><Card key={i}><div className="skeleton-lux h-16 rounded-xl"/></Card>)
   :students.length===0?<Card className="xl:col-span-2"><EmptyState title="لا يوجد طلاب ضمن صلاحياتك الحالية" description="طلاب المجموعات المسندة لك بصلاحية إدارة الطلاب سيظهرون هنا."/></Card>
   :students.map((s,i)=><Card key={s.id} delay={120+i*70}>
     <div className="flex justify-between gap-3"><div><h3 className="font-black text-[13px] text-slate-900">{s.student_name}</h3><p className="mt-0.5 text-[11px] text-slate-500">{s.grade||'—'} • {s.student_phone||'بدون هاتف'}</p></div><StatusBadge status={s.status||'active'}/></div>
     <div className="mt-3 grid grid-cols-3 gap-2 text-xs"><div className="rounded-xl bg-slate-50 p-2.5"><span className="text-slate-500">الحضور</span><b className="block mt-0.5 tabular-nums">{s.attendance_rate??0}%</b></div><div className="rounded-xl bg-slate-50 p-2.5"><span className="text-slate-500">الحصص</span><b className="block mt-0.5 tabular-nums">{s.attended_sessions??0}/{s.total_sessions??0}</b></div><div className="rounded-xl bg-slate-50 p-2.5"><span className="text-slate-500">المصروفات</span><b className="block mt-0.5">{s.payment_status||'غير محدد'}</b></div></div>
   </Card>)}
 </div>
</div>;
};

export const AssistantAttendancePage:React.FC = ()=>{
 const {user}=useAuth(); const [rows,setRows]=useState<any[]>([]);const [loading,setLoading]=useState(true);
 useEffect(()=>{if(!supabase||!user?.uid)return;void(async()=>{
   const asg=await loadMyAssignments(user.uid);
   const ids=asg.filter(a=>a.can_take_attendance).map(a=>a.group_id);
   if(!ids.length){setRows([]);setLoading(false);return}
   const{data}=await supabase.from('attendance_records').select('id,student_name,date,time,status,late_minutes,checked_in_at,checked_out_at,group_id,is_makeup').in('group_id',ids).order('date',{ascending:false}).order('time',{ascending:false}).limit(200);
   setRows(data||[]);setLoading(false)})()},[user?.uid]);
 return <div className="space-y-4">
 <PageHeader title="الحضور والانصراف" description="سجلات حضور المجموعات التي لديك صلاحية تسجيل الحضور بها." />
 <DataTable
   rows={rows}
   loading={loading}
   emptyText="لا توجد سجلات حضور ضمن صلاحياتك."
   searchKeys={(r)=>`${r.student_name||''} ${r.date||''} ${r.status||''}`}
   searchPlaceholder="ابحث باسم الطالب أو التاريخ..."
   columns={[
     { key:'student_name', header:'الطالب', render:(r)=><span className="font-bold">{r.student_name}</span> },
     { key:'date', header:'التاريخ' },
     { key:'status', header:'الحالة', render:(r)=><StatusBadge status={r.status}/> },
     { key:'in', header:'دخول', render:(r)=><span className="tabular-nums">{r.checked_in_at?new Date(r.checked_in_at).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}):'—'}</span> },
     { key:'out', header:'خروج', hideOnMobile:true, render:(r)=><span className="tabular-nums">{r.checked_out_at?new Date(r.checked_out_at).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}):'—'}</span> },
     { key:'late_minutes', header:'تأخير', hideOnMobile:true, render:(r)=><span className="tabular-nums">{r.late_minutes||0} د</span> },
   ]}
 />
</div>;
};

export const AssistantPaymentsPage:React.FC = ()=>{
 const {user}=useAuth(); const [rows,setRows]=useState<any[]>([]);const [loading,setLoading]=useState(true);const [denied,setDenied]=useState(false);
 useEffect(()=>{if(!supabase||!user?.uid)return;void(async()=>{
   const asg=await loadMyAssignments(user.uid);
   const ids=asg.filter(a=>a.can_view_payments).map(a=>a.group_id);
   if(!ids.length){setDenied(true);setRows([]);setLoading(false);return}
   const{data}=await supabase.from('payment_records').select('id,student_id,group_id,invoice_number,amount,subject,billing_period,status,paid_at,created_at').in('group_id',ids).order('created_at',{ascending:false}).limit(200);
   setRows(data||[]);setLoading(false)})()},[user?.uid]);
 return <div className="space-y-4">
 <PageHeader title="المصروفات" description="تظهر فقط عندما يمنحك المدرس صلاحية المصروفات." />
 {denied?<Card><EmptyState title="صلاحية المصروفات غير مفعّلة" description="لم يمنحك المدرس صلاحية عرض البيانات المالية. تواصل معه لتفعيلها من صفحة فريق المساعدين." icon={<ShieldCheck className="w-6 h-6" />}/></Card>
 :<DataTable
   rows={rows}
   loading={loading}
   emptyText="لا توجد بيانات مصروفات ضمن صلاحياتك."
   searchKeys={(r)=>`${r.invoice_number||''} ${r.subject||''} ${r.billing_period||''}`}
   searchPlaceholder="ابحث برقم الفاتورة أو المادة..."
   columns={[
     { key:'invoice_number', header:'الفاتورة', render:(r)=><span className="font-mono font-bold text-blue-600">{r.invoice_number||'—'}</span> },
     { key:'amount', header:'المبلغ', render:(r)=><span className="font-black tabular-nums">{Number(r.amount||0).toLocaleString('ar-EG')} ج.م</span> },
     { key:'subject', header:'المادة' },
     { key:'billing_period', header:'الفترة', hideOnMobile:true },
     { key:'status', header:'الحالة', render:(r)=><StatusBadge status={r.status||'pending'}/> },
   ]}
 />}
</div>;
};

export const AssistantProfilePage:React.FC = ()=>{const {user}=useAuth(); const [profile,setProfile]=useState<any|null>(null); const [verified,setVerified]=useState<boolean|null>(null);
 useEffect(()=>{if(!supabase||!user?.uid)return;void(async()=>{const{data}=await supabase.from('assistant_profiles').select('*').eq('user_id',user.uid).maybeSingle();setProfile(data||null);setVerified(data?.is_verified??false)})()},[user?.uid]);
 return <div className="space-y-4"><PageHeader title="الملف الشخصي" description="بيانات حسابك كمساعد."/><Card title="بيانات الحساب"><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]"><div><span className="text-slate-500 block mb-1 text-xs">الاسم</span><b>{profile?.full_name||user?.name||'—'}</b></div><div><span className="text-slate-500 block mb-1 text-xs">البريد</span><b>{user?.email||'—'}</b></div><div><span className="text-slate-500 block mb-1 text-xs">الهاتف</span><b>{profile?.phone||user?.phone||'—'}</b></div><div><span className="text-slate-500 block mb-1 text-xs">واتساب</span><b>{profile?.whatsapp_phone||'—'}</b></div><div><span className="text-slate-500 block mb-1 text-xs">المحافظة</span><b>{profile?.governorate||user?.governorate||'—'}</b></div><div><span className="text-slate-500 block mb-1 text-xs">المدينة</span><b>{profile?.city||'—'}</b></div><div><span className="text-slate-500 block mb-1 text-xs">الخبرة</span><b>{profile?.experience_years||0} سنة</b></div><div><span className="text-slate-500 block mb-1 text-xs">حالة التوثيق</span><b className={verified?'text-emerald-600':'text-amber-600'}>{verified?'موثق ✓':profile?.verification_status||'قيد الاكتمال'}</b></div></div></Card></div>};
