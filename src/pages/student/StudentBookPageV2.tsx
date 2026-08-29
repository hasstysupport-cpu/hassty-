import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock3, Loader2, MapPin, RefreshCw, ShieldCheck, UserCheck, Users, XCircle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

type Group = { id:string; name:string; subject:string; grade:string; schedule:string; location:string; tutorId:string; tutorName:string; tutorAvatar:string; verified:boolean; price:number; slots:any[] };
type Booking = { id:string; tutorName:string; subject:string; day:string; time:string; location:string; price:number; status:'pending'|'approved'|'rejected'; createdAt:string };

export const StudentBookPageV2: React.FC = () => {
  const { user } = useAuth();
  const [groups,setGroups]=useState<Group[]>([]);
  const [bookings,setBookings]=useState<Booking[]>([]);
  const [selectedGroupId,setSelectedGroupId]=useState('');
  const [selectedSlot,setSelectedSlot]=useState<any|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState<{kind:'success'|'error'|'info';text:string}|null>(null);

  const load=useCallback(async()=>{
    if(!supabase||!user?.uid){setLoading(false);return;}
    setLoading(true);
    try{
      const [groupsRes,bookingRes]=await Promise.all([
        supabase.from('student_groups').select('id,name,subject,grade,schedule,location,center_name,tutor_id,price_amount,billing_type,schedule_slots,is_active').eq('is_active',true).order('created_at',{ascending:false}).limit(100),
        supabase.from('booking_requests').select('id,tutor_id,subject,day,time,location,price,status,created_at').eq('student_id',user.uid).order('created_at',{ascending:false}).limit(30),
      ]);
      if(groupsRes.error)throw groupsRes.error;
      if(bookingRes.error)throw bookingRes.error;
      const rawGroups=groupsRes.data||[];
      const tutorIds=Array.from(new Set(rawGroups.map((g:any)=>g.tutor_id).filter(Boolean)));
      let tutorMap=new Map<string,any>(); let peopleMap=new Map<string,any>();
      if(tutorIds.length){
        const [tp,pp]=await Promise.all([
          supabase.from('tutor_profiles').select('user_id,subjects,is_verified,verification_status').in('user_id',tutorIds),
          supabase.from('profiles').select('id,full_name,avatar_url').in('id',tutorIds),
        ]);
        if(tp.error)throw tp.error; if(pp.error)throw pp.error;
        tutorMap=new Map((tp.data||[]).map((p:any)=>[p.user_id,p]));
        peopleMap=new Map((pp.data||[]).map((p:any)=>[p.id,p]));
      }
      const mapped=(rawGroups as any[]).map(g=>{const tp=tutorMap.get(g.tutor_id)||{}; const person=peopleMap.get(g.tutor_id)||{}; return {id:g.id,name:g.name||'مجموعة دراسية',subject:g.subject||tp.subjects?.[0]||'المادة الدراسية',grade:g.grade||'',schedule:g.schedule||'',location:g.location||g.center_name||'',tutorId:g.tutor_id,tutorName:person.full_name||'مدرس',tutorAvatar:person.avatar_url||'',verified:tp.is_verified===true||tp.verification_status==='approved',price:Number(g.price_amount||0),slots:Array.isArray(g.schedule_slots)?g.schedule_slots:[]};});
      setGroups(mapped);
      setBookings((bookingRes.data||[]).map((b:any)=>({id:b.id,tutorName:peopleMap.get(b.tutor_id)?.full_name||'مدرس',subject:b.subject||'الحصة',day:b.day||'',time:b.time||'',location:b.location||'',price:Number(b.price||0),status:b.status,createdAt:b.created_at})));
      setSelectedGroupId(prev=>mapped.some(g=>g.id===prev)?prev:mapped[0]?.id||'');
      setSelectedSlot(null);
    }catch(e:any){setNotice({kind:'error',text:e?.message||'تعذر تحميل بيانات الحجز.'});}
    finally{setLoading(false);}
  },[user?.uid]);
  useEffect(()=>{void load();},[load]);

  const selected=groups.find(g=>g.id===selectedGroupId)||null;
  const slots=useMemo(()=>selected?.slots||[],[selected]);
  const confirm=async()=>{
    if(!supabase||!user?.uid||!selected||!selectedSlot)return;
    setBusy(true);setNotice(null);
    try{
      const {data:profile,error:profileError}=await supabase.from('profiles').select('full_name,phone,grade').eq('id',user.uid).maybeSingle();
      if(profileError)throw profileError;
      const booking={student_id:user.uid,student_name:profile?.full_name||user.name||'طالب',student_phone:profile?.phone||user.phone||'',parent_phone:user.profileData?.parentPhone||'',student_grade:profile?.grade||user.profileData?.grade||selected.grade||'',tutor_id:selected.tutorId,tutor_name:selected.tutorName,subject:selected.subject,day:selectedSlot.dayArabic||selectedSlot.day||'',time:`${selectedSlot.startTime||selectedSlot.time||''}${selectedSlot.endTime?` - ${selectedSlot.endTime}`:''}`,session_type:'center',location:selectedSlot.location||selected.location||'',price:selected.price,status:'pending',notes:`طلب حجز من الطالب للمجموعة ${selected.name}`};
      const {data,error}=await supabase.from('booking_requests').insert(booking).select('id,status').single();
      if(error)throw error;
      setNotice({kind:'success',text:`تم إرسال طلب الحجز إلى ${selected.tutorName}، وحالته الآن قيد المراجعة ✅`});
      setSelectedSlot(null);
      if(data?.id)setBookings(prev=>[{id:data.id,tutorName:selected.tutorName,subject:selected.subject,day:booking.day,time:booking.time,location:booking.location,price:selected.price,status:'pending',createdAt:new Date().toISOString()},...prev]);
    }catch(e:any){setNotice({kind:'error',text:e?.message||'تعذر إنشاء طلب الحجز.'});}
    finally{setBusy(false);}
  };

  if(loading)return <div className="py-20 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600"/><p className="text-xs font-bold text-slate-500 mt-3">جاري تحميل المدرسين والمواعيد...</p></div>;

  return <div className="space-y-6 text-right" dir="rtl">
    {notice&&<div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${notice.kind==='success'?'bg-emerald-50 border-emerald-200 text-emerald-900':notice.kind==='error'?'bg-red-50 border-red-200 text-red-900':'bg-blue-50 border-blue-200 text-blue-900'}`}>{notice.text}</div>}
    <section className="rounded-3xl bg-gradient-to-br from-[#0F2F6B] to-[#2563EB] p-6 sm:p-8 text-white"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs font-bold"><Calendar className="w-4 h-4"/>حجز حصة</div><h1 className="text-2xl sm:text-3xl font-black mt-3">احجز حصتك مع مدرس موثوق 🎓</h1><p className="text-blue-100 text-sm mt-2">اختار المجموعة والموعد، وطلبك هيروح للمدرس للموافقة.</p></div><button onClick={()=>void load()} className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-xs font-bold flex items-center gap-2 self-start"><RefreshCw className="w-4 h-4"/>تحديث</button></div></section>

    {groups.length===0?<section className="rounded-3xl bg-white border border-slate-200 p-10 text-center"><Users className="w-10 h-10 mx-auto text-slate-300"/><h2 className="font-black text-slate-900 mt-3">لا توجد مجموعات متاحة للحجز حاليًا</h2><p className="text-xs text-slate-500 mt-2">سيظهر هنا المدرسون والمجموعات النشطة بعد إضافتهم وإعداد مواعيدهم.</p></section>:<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <section className="space-y-3"><h2 className="font-black text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600"/>المجموعات المتاحة</h2>{groups.map(g=><button key={g.id} onClick={()=>{setSelectedGroupId(g.id);setSelectedSlot(null)}} className={`w-full text-right rounded-2xl border p-4 transition ${g.id===selectedGroupId?'border-blue-500 bg-blue-50 shadow-sm':'border-slate-200 bg-white hover:border-blue-300'}`}><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="font-black text-sm text-slate-900 truncate">{g.name}</div><div className="text-xs text-slate-500 mt-1">{g.tutorName} • {g.subject}</div></div>{g.verified?<span className="text-emerald-600 text-[10px] font-black shrink-0 flex items-center gap-1"><ShieldCheck className="w-4 h-4"/>موثق</span>:<span className="text-slate-400 text-[10px]">قيد التحقق</span>}</div><div className="text-[11px] text-slate-500 mt-2">{g.schedule||'الموعد يحدده المدرس'} {g.price>0?`• ${g.price} ج.م`:''}</div></button>)}</section>

      <section className="lg:col-span-2 rounded-3xl bg-white border border-slate-200 p-5"><div className="flex items-center justify-between mb-4"><div><h2 className="font-black text-slate-900">{selected?.name||'اختر مجموعة'}</h2><p className="text-xs text-slate-500 mt-1">{selected?.tutorName} • {selected?.subject}</p></div>{selected?.verified&&<span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1.5 text-[11px] font-black flex items-center gap-1"><UserCheck className="w-4 h-4"/>مدرس موثق</span>}</div>{!selected?<div className="py-12 text-center text-xs text-slate-500">اختر مجموعة من القائمة.</div>:slots.length===0?<div className="rounded-2xl bg-slate-50 border border-slate-100 p-8 text-center"><Clock3 className="w-8 h-8 mx-auto text-slate-300"/><p className="text-xs font-bold text-slate-500 mt-2">المدرس لم يحدد مواعيد الحجز بعد.</p></div>:<><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{slots.map((slot:any,index:number)=>{const active=selectedSlot?.id===slot.id;return <button key={slot.id||index} onClick={()=>setSelectedSlot(slot)} className={`text-right rounded-2xl border p-4 ${active?'border-blue-500 bg-blue-50 ring-2 ring-blue-100':'border-slate-200 bg-white hover:border-blue-300'}`}><div className="font-black text-sm text-slate-900">{slot.dayArabic||slot.day}</div><div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock3 className="w-4 h-4"/>{slot.startTime} {slot.endTime?`→ ${slot.endTime}`:''}</div>{slot.location&&<div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-4 h-4"/>{slot.location}</div>}<div className="text-[11px] font-black mt-3 text-blue-700">{active?'✓ الموعد محدد':'اختيار الموعد'}</div></button>})}</div>{selectedSlot&&<div className="mt-4 rounded-2xl bg-blue-50 border border-blue-200 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between"><div><div className="text-xs text-slate-500">الموعد المختار</div><div className="font-black text-slate-900 mt-1">{selectedSlot.dayArabic||selectedSlot.day} • {selectedSlot.startTime} {selectedSlot.endTime?`→ ${selectedSlot.endTime}`:''}</div></div><button disabled={busy} onClick={()=>void confirm()} className="rounded-2xl bg-blue-600 text-white px-6 py-3 text-xs font-black flex items-center gap-2 disabled:opacity-50">{busy?<Loader2 className="w-4 h-4 animate-spin"/>:<CheckCircle2 className="w-4 h-4"/>}إرسال طلب الحجز</button></div>}</>}</section>
    </div>}

    <section className="rounded-3xl bg-white border border-slate-200 p-5"><h2 className="font-black text-slate-900 mb-4">حجوزاتي</h2>{bookings.length===0?<div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-bold text-slate-500">لا توجد حجوزات حالية.</div>:<div className="space-y-3">{bookings.map(b=><div key={b.id} className="rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row justify-between gap-3"><div><div className="font-black text-sm text-slate-900">{b.subject} • {b.tutorName}</div><div className="text-xs text-slate-500 mt-1">{b.day} • {b.time} {b.location?`• ${b.location}`:''}</div></div><span className={`self-start rounded-full px-3 py-1.5 text-[11px] font-black ${b.status==='approved'?'bg-emerald-50 text-emerald-700':b.status==='pending'?'bg-amber-50 text-amber-700':'bg-red-50 text-red-700'}`}>{b.status==='approved'?'مؤكد':b.status==='pending'?'قيد المراجعة':'مرفوض'}</span></div>)}</div>}</section>
  </div>;
};
