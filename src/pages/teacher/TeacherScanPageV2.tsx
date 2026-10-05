/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, QrCode, RefreshCw, ShieldCheck, UserPlus, Banknote, XCircle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { RealQRCameraScanner } from '../../components/RealQRCameraScanner';
import { supabase } from '../../lib/supabase';
import { loadTeacherGroups } from '../../lib/teacherStore';
import { findStudentByQr, getEnrolledStudent, getTiming, recordQrAttendance } from '../../lib/attendanceService';
import { gradesMatch, gradeMismatchText } from '../../lib/gradeMatch';
import { collectStudentMonth, currentMonthKey, monthLabel } from '../../lib/studentPaymentService';
import { bestParentPhoneForEnrollment } from '../../lib/parentNotify';
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

export type ScanMode = 'attendance' | 'enroll' | 'payment';

export const TeacherScanPage: React.FC = () => {
  const { user } = useAuth();
  const teacherId = user?.uid || '';
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [scannerOpen, setScannerOpen] = useState(true);
  const [mode, setMode] = useState<ScanMode>(() => {
    // الأولوية: ?mode=payment في الرابط (دخول مباشر)، ثم علامة sessionStorage من صفحة المدفوعات
    try {
      const qp = new URLSearchParams(window.location.search).get('mode');
      if (qp === 'payment') return 'payment';
      if (sessionStorage.getItem('hassty_scan_mode') === 'payment') {
        sessionStorage.removeItem('hassty_scan_mode');
        return 'payment';
      }
    } catch { /* noop */ }
    return 'attendance';
  });
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
    if(mode!=='payment'&&!selectedGroup){setMessage({kind:'error',title:'لا توجد مجموعة',body:'اختر مجموعة مرتبطة بحساب المدرس.'});return;}
    setBusy(true); setMessage(null);
    try {
      const student=await findStudentByQr(qr);
      if(!student){setMessage({kind:'error',title:'QR غير معروف',body:`لم يتم العثور على حساب طالب حقيقي بالكود «${qr}». تأكد أن الطالب سجّل حسابه وأن الكارت مطبوع من أحدث إصدار (كارت الطالب داخل حساب الطالب) — أو جرّب البحث برقم هاتفه. لا يتم إنشاء بيانات تجريبية.`});return;}

      if(mode==='enroll'){
        const existing=await getEnrolledStudent(selectedGroup.id,student.id);
        if(existing){setMessage({kind:'info',title:'الطالب مسجل بالفعل',body:`${student.full_name||'الطالب'} موجود بالفعل في ${selectedGroup.name}.`});return;}
        if(!supabase)throw new Error('قاعدة البيانات غير متاحة.');
        // مطابقة المرحلة إلزامية: مرحلة الطالب يجب أن تطابق مرحلة المجموعة (منع اللغبطة)
        if(!String(student.grade||'').trim()){
          setMessage({kind:'error',title:'مرحلة الطالب غير محددة',body:`${student.full_name||'الطالب'} لم يحدد صفه الدراسي في حسابه. اطلب منه تحديث المرحلة من إعدادات حسابه أولًا، ثم أعد القيد في مجموعة مرحلته.`});return;
        }
        if(selectedGroup.grade && !gradesMatch(student.grade, selectedGroup.grade)){
          setMessage({kind:'error',title:'المرحلة غير مطابقة للمجموعة',body:`${student.full_name||'الطالب'} — ${gradeMismatchText(student.grade, selectedGroup.grade)}`});return;
        }
        // رقم ولي الأمر: من ربط الحساب أو إعدادات الطالب — مش نسيبها فاضية
        const parentPhone=await bestParentPhoneForEnrollment(student.id).catch(()=>'');
        const {error}=await supabase.from('group_enrollments').insert({
          group_id:selectedGroup.id, student_id:student.id, student_name:student.full_name||'طالب', student_phone:student.phone||'', parent_phone:parentPhone, qr_code:student.qr_code||qr,
          avatar_url:student.avatar_url||'', grade:student.grade||selectedGroup.grade||'', status:'active', enrolled_at:new Date().toISOString(), attendance_rate:0, total_sessions:0, attended_sessions:0, payment_status:'pending'
        });
        if(error)throw error;
        setMessage({kind:'success',title:'تم قيد الطالب',body:`${student.full_name||'الطالب'} تمت إضافته إلى ${selectedGroup.name}.${parentPhone?` رقم ولي الأمر (${parentPhone}) اتسجل مع القيد وسيصل إشعار الحضور والغياب تلقائيًا.`:' ⚠️ لم يُعثر على رقم ولي أمر — الطالب يضيفه من إعدادات حسابه.'}`});
        return;
      }

      if(mode==='payment'){
        // وضع تحصيل الاشتراك الشهري بالمسح — سجل حقيقي + إشعار ولي أمر
        const result=await collectStudentMonth({
          teacherId,
          student:{ id:student.id, full_name:student.full_name||'', qr_code:student.qr_code||'' },
          groupId:selectedGroupId||undefined,
          method:'qr_scan',
        });
        const src=result.notified.source;
        const srcLabel=src==='linked_account'?'حساب ولي الأمر المربوط':src==='student_settings'?'رقم ولي الأمر من إعدادات الطالب':src==='enrollment'?'رقم ولي الأمر من بيانات القيد':'';
        if(result.alreadyPaid){
          setMessage({kind:'info',title:'الشهر مدفوع بالفعل ✅',body:`${result.studentName} مدفوع له اشتراك ${monthLabel(result.monthKey)} (عملية ${result.invoiceNumber}). لم يتم تحصيل مبلغ مكرر${srcLabel?` — تأكيد أُرسل لـ ${srcLabel}`:''}.`});
        } else {
          setMessage({kind:'success',title:'تم تحصيل الشهر بنجاح 💰',body:`${result.studentName} — ${monthLabel(result.monthKey)} بقيمة ${result.amount.toLocaleString('ar-EG')} ج.م من ${result.groupName}.\nرقم العملية: ${result.invoiceNumber}.\nاتسجل في سجل الطلاب وهتوصل إشعارات لولي الأمر${srcLabel?` (${srcLabel})`:''}${result.notified.whatsapp?' — واتساب ✅':' ⚠️ واتساب غير مؤكد'}.`});
        }
        return;
      }

      if(!selectedIsActive || !activeSlot || !timing){
        setMessage({kind:'warning',title:'لا توجد حصة جارية',body:'يجب أن يكون المسح أثناء موعد حصة فعلية. لن يتم تسجيل غياب خارج وقت الحصة.'});
        return;
      }
      if(timing.state==='not_started'){setMessage({kind:'warning',title:'الحصة لم تبدأ بعد',body:'سيتم حساب الحالة تلقائيًا من وقت المسح الفعلي.'});return;}
      if(timing.state==='ended'){setMessage({kind:'warning',title:'الحصة انتهت',body:'لا يمكن تسجيل حضور بعد انتهاء الحصة.'});return;}

      const enrollment=await getEnrolledStudent(selectedGroup.id,student.id);
      if(!enrollment){
        // توضيح اللغبطة: نعرض المجموعات المقيد بها الطالب فعليًا (إن وجدت)
        let hisGroups='';
        try{
          const {data:his}=await supabase!.from('group_enrollments').select('group:student_groups(name,grade)').eq('student_id',student.id).eq('status','active');
          const names=(his||[]).map((h:any)=>h.group?.name).filter(Boolean);
          if(names.length) hisGroups=` الطالب مقيد حاليًا في: ${names.join('، ')}.`;
        }catch{/* تجاهل */}
        setMessage({kind:'error',title:'الطالب غير مقيد في هذه المجموعة',body:`${student.full_name||'الطالب'} ليس من طلاب «${selectedGroup.name}»${hisGroups||' — قيّده أولًا باستخدام وضع «قيد طالب» في مجموعة مرحلته نفسها.'}`});return;
      }
      // دفاع ثانٍ: حتى لو القيد قديم بمجموعة مخالفة للمرحلة، الحضور لن يُسجل إلا بمطابقة المرحلة
      if(selectedGroup.grade && student.grade && !gradesMatch(student.grade, selectedGroup.grade)){
        setMessage({kind:'error',title:'تعارض في المرحلة',body:`مرحلة الطالب «${student.grade}» لا تطابق مرحلة المجموعة «${selectedGroup.grade}» — صحح القيد أولًا.`});return;
      }

      const status=timing.state==='on_time'?'present':timing.state==='late'?'late':'absent';
      let sessionId: string | undefined;
      if (supabase) {
        const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        const { data: session } = await supabase.from('lesson_sessions')
          .select('id').eq('tutor_id', teacherId).eq('group_id', selectedGroup.id).eq('session_date', today)
          .eq('status','scheduled').order('starts_at',{ascending:true}).limit(1).maybeSingle();
        sessionId = session?.id;
      }

      const attendance = await recordQrAttendance({
        groupId:selectedGroup.id,
        studentId:student.id,
        studentName:student.full_name||enrollment.student_name||'طالب',
        qrCode:student.qr_code||qr,
        status,
        lateMinutes: timing.minutesLate,
        sessionId,
        notes:`مسح QR حقيقي. بداية الحصة ${activeSlot.startTime}، نهاية ${activeSlot.endTime}، وقت المسح ${now.toLocaleTimeString('ar-EG')}`
      });

      if(!attendance) throw new Error('تعذر حفظ سجل الحضور.');
      if(status==='present')setMessage({kind:'success',title:'حاضر في الموعد ✅',body:`تم تسجيل ${student.full_name||'الطالب'} حاضرًا خلال أول 15 دقيقة.`});
      else if(status==='late')setMessage({kind:'warning',title:'حاضر متأخر ⏰',body:`تم تسجيل ${student.full_name||'الطالب'} متأخرًا ${timing.minutesLate} دقيقة.`});
      else setMessage({kind:'error',title:'غياب ❌',body:'تم تسجيل الغياب تلقائيًا لأن وقت المسح تجاوز نصف مدة الحصة.'});
    } catch(e:any){setMessage({kind:'error',title:'فشل تنفيذ العملية',body:e?.message||'حدث خطأ غير متوقع.'});}
    finally{setBusy(false);setManualCode('');}
  },[activeSlot,busy,mode,now,selectedGroup,selectedIsActive,timing,teacherId]);

  const banner = !selectedGroup ? {label:'اختر المجموعة',icon:AlertCircle} : !activeGroup ? {label:'لا توجد حصة جارية الآن',icon:AlertCircle} : activeGroup.id!==selectedGroup.id ? {label:'المجموعة المختارة ليست الحصة الحالية',icon:AlertCircle} : timing?.state==='on_time' ? {label:'حضور في الموعد',icon:CheckCircle2} : timing?.state==='late' ? {label:`تأخير ${timing.minutesLate} دقيقة`,icon:Clock3} : timing?.state==='absent' ? {label:'بعد نصف الحصة = غياب',icon:XCircle} : timing?.state==='ended' ? {label:'الحصة انتهت',icon:XCircle} : {label:'الحصة لم تبدأ بعد',icon:Clock3};
  const BannerIcon=banner.icon;

  return <div className="space-y-5 text-right max-w-5xl mx-auto">
    <section className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full"><QrCode className="w-4 h-4"/>مسح حضور QR حقيقي</div><h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">تسجيل حضور الطلاب بالوقت الفعلي</h2><p className="text-xs text-slate-500 mt-1">الحالة تُحسب تلقائيًا من موعد المجموعة ووقت المسح — مع ربط السجل بالحصة الفعلية إن وُجدت.</p></div><div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200"><Clock3 className="w-4 h-4 text-blue-600"/>{now.toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div></div>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3"><select value={selectedGroupId} onChange={e=>setSelectedGroupId(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold"><option value="">اختر المجموعة</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name} — {g.grade||'عام'} — {g.schedule}</option>)}</select><div className="flex gap-2"><button type="button" onClick={()=>{setMode('attendance');setMessage(null)}} className={`flex-1 rounded-2xl border-2 px-3 py-3 text-sm font-black ${mode==='attendance'?'border-emerald-500 bg-emerald-50 text-emerald-800':'border-slate-200 bg-slate-50 text-slate-600'}`}><CheckCircle2 className="w-4 h-4 inline ml-1"/>حضور</button><button type="button" onClick={()=>{setMode('enroll');setMessage(null)}} className={`flex-1 rounded-2xl border-2 px-3 py-3 text-sm font-black ${mode==='enroll'?'border-blue-500 bg-blue-50 text-blue-800':'border-slate-200 bg-slate-50 text-slate-600'}`}><UserPlus className="w-4 h-4 inline ml-1"/>قيد طالب</button><button type="button" onClick={()=>{setMode('payment');setMessage(null)}} className={`flex-1 rounded-2xl border-2 px-3 py-3 text-sm font-black ${mode==='payment'?'border-amber-500 bg-amber-50 text-amber-800':'border-slate-200 bg-slate-50 text-slate-600'}`}><Banknote className="w-4 h-4 inline ml-1"/>تحصيل شهر</button></div></div>
      {mode==='payment'&&<div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] font-bold text-amber-900 flex items-start gap-2"><Banknote className="w-4 h-4 shrink-0 mt-0.5"/><span>امسح QR الطالب لتحصيل اشتراك الشهر الحالي ({monthLabel(currentMonthKey())}) — القيمة من اشتراك المجموعة، وتُسجل فورًا في سجل الطلاب وصفحات مدفوعات الطالب وولي الأمر مع إشعار واتساب + إشعارات فورية.</span></div>}
      <div className={`mt-4 rounded-2xl border px-4 py-3 flex items-center gap-3 ${banner.label.includes('الموعد')?'bg-emerald-50 border-emerald-200 text-emerald-900':banner.label.includes('تأخير')?'bg-amber-50 border-amber-200 text-amber-900':banner.label.includes('غياب')||banner.label.includes('انتهت')?'bg-red-50 border-red-200 text-red-900':'bg-slate-50 border-slate-200 text-slate-700'}`}><BannerIcon className="w-5 h-5"/><div><div className="font-black text-sm">{banner.label}</div><div className="text-[11px] opacity-80">{activeSlot?`موعد المجموعة: ${activeSlot.dayArabic} ${activeSlot.startTime} → ${activeSlot.endTime}`:'الحالة تتحدث تلقائيًا كل 5 ثوانٍ'}</div></div></div>
    </section>
    <section className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm"><RealQRCameraScanner isActive={scannerOpen} isPaused={busy} onScanSuccess={processCode}/><div className="max-w-md mx-auto mt-4 flex gap-2"><input value={manualCode} onChange={e=>setManualCode(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void processCode(manualCode)}} placeholder="أدخل كود QR يدويًا" className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-mono text-left focus:outline-none focus:border-blue-500" dir="ltr"/><button type="button" disabled={busy} onClick={()=>void processCode(manualCode)} className="px-5 rounded-2xl bg-blue-600 text-white text-sm font-black disabled:opacity-50">{busy?'جاري...':'مسح'}</button></div><div className="mt-3 flex justify-center"><button type="button" onClick={()=>setScannerOpen(v=>!v)} className="text-xs font-bold text-slate-500 hover:text-blue-700">{scannerOpen?'إيقاف الكاميرا':'تشغيل الكاميرا'}</button></div></section>
    {message&&<section className={`rounded-3xl border p-5 flex gap-3 ${message.kind==='success'?'bg-emerald-50 border-emerald-200 text-emerald-950':message.kind==='warning'?'bg-amber-50 border-amber-200 text-amber-950':message.kind==='error'?'bg-red-50 border-red-200 text-red-950':'bg-blue-50 border-blue-200 text-blue-950'}`}><div className="w-10 h-10 rounded-2xl bg-white border border-current/10 flex items-center justify-center shrink-0">{message.kind==='success'?<CheckCircle2 className="w-5 h-5"/>:message.kind==='error'?<XCircle className="w-5 h-5"/>:message.kind==='warning'?<AlertCircle className="w-5 h-5"/>:<ShieldCheck className="w-5 h-5"/>}</div><div><h3 className="font-black text-sm">{message.title}</h3><p className="text-xs mt-1 leading-6 opacity-80">{message.body}</p></div></section>}
    <button type="button" onClick={()=>void reloadGroups()} className="w-full py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-black text-xs flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4"/>تحديث المجموعات</button>
  </div>;
};
