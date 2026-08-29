import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, QrCode, RefreshCw, ShieldCheck, UserPlus, XCircle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { RealQRCameraScanner } from '../../components/RealQRCameraScanner';
import { supabase } from '../../lib/supabase';
import { loadTeacherGroups } from '../../lib/teacherStore';
import { findStudentByQr, getEnrolledStudent, getTiming, recordQrAttendance } from '../../lib/attendanceService';
import { StudentGroup } from '../../types';

const dayNames: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
const arDays: Record<string, string> = { Saturday: 'السبت', Sunday: 'الأحد', Monday: 'الإثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة' };

function getActiveGroup(groups: StudentGroup[], now = new Date()) {
  const day = dayNames[now.getDay()];
  const minute = now.getHours() * 60 + now.getMinutes();
  for (const group of groups) {
    if (group.isPaused) continue;
    for (const slot of group.scheduleSlots || []) {
      const [sh, sm] = (slot.startTime || '').split(':').map(Number);
      const [eh, em] = (slot.endTime || '').split(':').map(Number);
      if (![sh, sm, eh, em].every(Number.isFinite)) continue;
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      if ((slot.day === day || slot.dayArabic === arDays[day]) && minute >= start && minute <= end) return { group, slot };
    }
  }
  return null;
}

export const TeacherScanPage: React.FC = () => {
  const { user } = useAuth();
  const teacherId = user?.uid || '';
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [scannerOpen, setScannerOpen] = useState(true);
  const [mode, setMode] = useState<'attendance' | 'enroll'>('attendance');
  const [now, setNow] = useState(new Date());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{kind:'success'|'warning'|'error'|'info';title:string;body:string}|null>(null);

  const reloadGroups = useCallback(async () => {
    if (!teacherId) return;
    try {
      const live = await loadTeacherGroups(teacherId);
      setGroups(live);
      setSelectedGroupId(prev => live.some(g => g.id === prev) ? prev : live[0]?.id || '');
    } catch (e:any) {
      setMessage({kind:'error',title:'تعذر تحميل المجموعات',body:e?.message || 'تحقق من اتصال قاعدة البيانات.'});
    }
  }, [teacherId]);

  useEffect(() => { void reloadGroups(); }, [reloadGroups]);
  useEffect(() => { const id=window.setInterval(()=>setNow(new Date()),5000); return()=>window.clearInterval(id); }, []);

  const auto = useMemo(()=>getActiveGroup(groups,now),[groups,now]);
  const selectedGroup = groups.find(g=>g.id===selectedGroupId)||null;
  const activeGroup = auto?.group || null;
  const activeSlot = auto?.slot || null;
  const selectedIsActive = !!selectedGroup && activeGroup?.id === selectedGroup.id;
  const timing = selectedIsActive && activeSlot ? getTiming(activeSlot.startTime,activeSlot.endTime,now):null;

  const processCode = useCallback(async (code:string) => {
    const qr=code.trim();
    if(!qr||busy)return;
    if(!selectedGroup){setMessage({kind:'error',title:'لا توجد مجموعة',body:'اختر مجموعة مرتبطة بحساب المدرس.'});return;}
    setBusy(true); setMessage(null);
    try {
      const student=await findStudentByQr(qr);
      if(!student){setMessage({kind:'error',title:'QR غير معروف',body:'لم يتم العثور على حساب طالب حقيقي بهذا الكود. لا يتم إنشاء بيانات تجريبية.'});return;}

      if(mode==='enroll'){
        const existing=await getEnrolledStudent(selectedGroup.id,student.id);
        if(existing){setMessage({kind:'info',title:'الطالب مسجل بالفعل',body:`${student.full_name||'الطالب'} موجود بالفعل في ${selectedGroup.name}.`});return;}
        if(!supabase)throw new Error('قاعدة البيانات غير متاحة.');
        const {error}=await supabase.from('group_enrollments').insert({
          group_id:selectedGroup.id,
          student_id:student.id,
          student_name:student.full_name||'طالب',
          student_phone:student.phone||'',
          parent_phone:'',
          qr_code:student.qr_code||qr,
          avatar_url:student.avatar_url||'',
          grade:student.grade||selectedGroup.grade||'',
          status:'active',
          enrolled_at:new Date().toISOString(),
          attendance_rate:0,
          total_sessions:0,
          attended_sessions:0,
          payment_status:'pending'
        });
        if(error)throw error;
        setMessage({kind:'success',title:'تم قيد الطالب',body:`${student.full_name||'الطالب'} تمت إضافته إلى ${selectedGroup.name}.`});
        return;
      }

      if(!selectedIsActive || !activeSlot || !timing){
        setMessage({kind:'warning',title:'لا توجد حصة جارية',body:'يجب أن يكون المسح أثناء موعد حصة فعلية. لن يتم تسجيل غياب خارج وقت الحصة.'});
        return;
      }
      if(timing.state==='not_started'){
        setMessage({kind:'warning',title:'الحصة لم تبدأ بعد',body:'سيتم حساب الحالة تلقائيًا من وقت المسح الفعلي.'});
        return;
      }
      if(timing.state==='ended'){
        setMessage({kind:'warning',title:'الحصة انتهت',body:'لا يمكن تسجيل حضور بعد انتهاء الحصة.'});
        return;
      }

      const enrollment=await getEnrolledStudent(selectedGroup.id,student.id);
      if(!enrollment){setMessage({kind:'error',title:'الطالب غير مقيد',body:'قيد الطالب في المجموعة أولًا باستخدام وضع «قيد طالب».'});return;}

      const status=timing.state==='on_time'?'present':timing.state==='late'?'late':'absent';
      await recordQrAttendance({
        groupId:selectedGroup.id,
        studentId:student.id,
        studentName:student.full_name||enrollment.student_name||'طالب',
        qrCode:student.qr_code||qr,
        status,
        notes:`مسح QR حقيقي. بداية الحصة ${activeSlot.startTime}، نهاية ${activeSlot.endTime}، وقت المسح ${now.toLocaleTimeString('ar-EG')}`
      });

      if(status==='present')setMessage({kind:'success',title:'حاضر في الموعد ✅',body:`تم تسجيل ${student.full_name||'الطالب'} حاضرًا خلال أول 15 دقيقة.`});
      else if(status==='late')setMessage({kind:'warning',title:'حاضر متأخر ⏰',body:`تم تسجيل ${student.full_name||'الطالب'} متأخرًا ${timing.minutesLate} دقيقة.`});
      else setMessage({kind:'error',title:'غياب ❌',body:'تم تسجيل الغياب تلقائيًا لأن وقت المسح تجاوز نصف مدة الحصة.'});
    } catch(e:any){
      setMessage({kind:'error',title:'فشل تنفيذ العملية',body:e?.message||'حدث خطأ غير متوقع.'});
    } finally{setBusy(false);setManualCode('');}
  },[activeSlot,busy,mode,now,selectedGroup,selectedIsActive,timing]);

  const banner = !selectedGroup
    ? {label:'اختر المجموعة',icon:AlertCircle}
    : !activeGroup
      ? {label:'لا توجد حصة جارية الآن',icon:AlertCircle}
      : activeGroup.id!==selectedGroup.id
        ? {label:'المجموعة المختارة ليست الحصة الحالية',icon:AlertCircle}
        : timing?.state==='on_time'
          ? {label:'حضور في الموعد',icon:CheckCircle2}
          : timing?.state==='late'
            ? {label:`تأخير ${timing.minutesLate} دقيقة`,icon:Clock3}
            : timing?.state==='absent'
              ? {label:'بعد نصف الحصة = غياب',icon:XCircle}
              : timing?.state==='ended'
                ? {label:'الحصة انتهت',icon:XCircle}
                : {label:'الحصة لم تبدأ بعد',icon:Clock3};
  const BannerIcon=banner.icon;

  return <div className="space-y-5 text-right max-w-5xl mx-auto">
    <section className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full"><QrCode className="w-4 h-4"/>مسح حضور QR حقيقي</div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">تسجيل حضور الطلاب بالوقت الفعلي</h2>
          <p className="text-xs text-slate-500 mt-1">الحالة تُحسب تلقائيًا من موعد المجموعة ووقت المسح — بدون Demo أو طالب وهمي.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200"><Clock3 className="w-4 h-4 text-blue-600"/>{now.toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={selectedGroupId} onChange={e=>setSelectedGroupId(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold">
          <option value="">اختر المجموعة</option>
          {groups.map(g=><option key={g.id} value={g.id}>{g.name} — {g.schedule}</option>)}
        </select>
        <div className="flex gap-2">
          <button type="button" onClick={()=>{setMode('attendance');setMessage(null)}} className={`flex-1 rounded-2xl border-2 px-3 py-3 text-sm font-black ${mode==='attendance'?'border-emerald-500 bg-emerald-50 text-emerald-800':'border-slate-200 bg-slate-50 text-slate-600'}`}><CheckCircle2 className="w-4 h-4 inline ml-1"/>حضور</button>
          <button type="button" onClick={()=>{setMode('enroll');setMessage(null)}} className={`flex-1 rounded-2xl border-2 px-3 py-3 text-sm font-black ${mode==='enroll'?'border-blue-500 bg-blue-50 text-blue-800':'border-slate-200 bg-slate-50 text-slate-600'}`}><UserPlus className="w-4 h-4 inline ml-1"/>قيد طالب</button>
        </div>
      </div>

      <div className={`mt-4 rounded-2xl border px-4 py-3 flex items-center gap-3 ${banner.label.includes('الموعد')?'bg-emerald-50 border-emerald-200 text-emerald-900':banner.label.includes('تأخير')?'bg-amber-50 border-amber-200 text-amber-900':banner.label.includes('غياب')||banner.label.includes('انتهت')?'bg-red-50 border-red-200 text-red-900':'bg-slate-50 border-slate-200 text-slate-700'}`}>
        <BannerIcon className="w-5 h-5"/>
        <div><div className="font-black text-sm">{banner.label}</div><div className="text-[11px] opacity-80">{activeSlot?`موعد المجموعة: ${activeSlot.dayArabic} ${activeSlot.startTime} → ${activeSlot.endTime}`:'الحالة تتحدث تلقائيًا كل 5 ثوانٍ'}</div></div>
      </div>
    </section>

    <section className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
      <RealQRCameraScanner isActive={scannerOpen} isPaused={busy} onScanSuccess={processCode}/>
      <div className="max-w-md mx-auto mt-4 flex gap-2">
        <input value={manualCode} onChange={e=>setManualCode(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void processCode(manualCode)}} placeholder="أدخل كود QR يدويًا" className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-mono text-left focus:outline-none focus:border-blue-500" dir="ltr"/>
        <button type="button" disabled={busy} onClick={()=>void processCode(manualCode)} className="px-5 rounded-2xl bg-blue-600 text-white text-sm font-black disabled:opacity-50">{busy?'جاري...':'مسح'}</button>
      </div>
      <div className="mt-3 flex justify-center"><button type="button" onClick={()=>setScannerOpen(v=>!v)} className="text-xs font-bold text-slate-500 hover:text-blue-700">{scannerOpen?'إيقاف الكاميرا':'تشغيل الكاميرا'}</button></div>
    </section>

    {message&&<section className={`rounded-3xl border p-5 flex gap-3 ${message.kind==='success'?'bg-emerald-50 border-emerald-200 text-emerald-950':message.kind==='warning'?'bg-amber-50 border-amber-200 text-amber-950':message.kind==='error'?'bg-red-50 border-red-200 text-red-950':'bg-blue-50 border-blue-200 text-blue-950'}`}>
      <div className="w-10 h-10 rounded-2xl bg-white border border-current/10 flex items-center justify-center shrink-0">{message.kind==='success'?<CheckCircle2 className="w-5 h-5"/>:message.kind==='error'?<XCircle className="w-5 h-5"/>:message.kind==='warning'?<AlertCircle className="w-5 h-5"/>:<ShieldCheck className="w-5 h-5"/>}</div>
      <div><h3 className="font-black text-sm">{message.title}</h3><p className="text-xs mt-1 leading-6 opacity-80">{message.body}</p></div>
    </section>}

    <button type="button" onClick={()=>void reloadGroups()} className="w-full py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-black text-xs flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4"/>تحديث المجموعات</button>
  </div>;
};
