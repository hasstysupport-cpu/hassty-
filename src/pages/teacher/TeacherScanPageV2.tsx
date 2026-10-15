/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { SectionExplainer } from '../../components/common/SectionExplainer';

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
  const [scannerOpen, setScannerOpen] = useState(false);
  const cameraStartRef = useRef<(() => Promise<void>) | null>(null);
  const [scanInputMode, setScanInputMode] = useState<'manual'|'auto'>('manual');
  const [scanModeLoadedFor, setScanModeLoadedFor] = useState('');
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

  // تفضيل طريقة مسح QR محفوظ لكل مدرس؛ الوضع اليدوي هو الافتراضي دائمًا.
  useEffect(() => {
    if (!teacherId) return;
    let preference: 'manual'|'auto' = 'manual';
    try {
      const saved = localStorage.getItem('hassty_qr_scan_input_mode:' + teacherId);
      if (saved === 'manual' || saved === 'auto') preference = saved;
    } catch { /* التخزين المحلي غير متاح */ }
    setScanInputMode(preference);
    // لا نطلب إذن الكاميرا تلقائيًا عند فتح الصفحة؛ يجب أن يبدأ المدرس المسح بنفسه.
    // زر «تشغيل الكاميرا» داخل الماسح يستدعي getUserMedia مباشرة من تفاعل المستخدم.
    setScanModeLoadedFor(teacherId);
  }, [teacherId]);

  useEffect(() => {
    if (!teacherId || scanModeLoadedFor !== teacherId) return;
    try { localStorage.setItem('hassty_qr_scan_input_mode:' + teacherId, scanInputMode); } catch { /* تجاهل فشل التخزين */ }
  }, [teacherId, scanInputMode, scanModeLoadedFor]);

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
    finally{setBusy(false);}
  },[activeSlot,busy,mode,now,selectedGroup,selectedIsActive,timing,teacherId]);

  const banner = !selectedGroup ? {label:'اختر المجموعة',icon:AlertCircle} : !activeGroup ? {label:'لا توجد حصة جارية الآن',icon:AlertCircle} : activeGroup.id!==selectedGroup.id ? {label:'المجموعة المختارة ليست الحصة الحالية',icon:AlertCircle} : timing?.state==='on_time' ? {label:'حضور في الموعد',icon:CheckCircle2} : timing?.state==='late' ? {label:`تأخير ${timing.minutesLate} دقيقة`,icon:Clock3} : timing?.state==='absent' ? {label:'بعد نصف الحصة = غياب',icon:XCircle} : timing?.state==='ended' ? {label:'الحصة انتهت',icon:XCircle} : {label:'الحصة لم تبدأ بعد',icon:Clock3};
  const BannerIcon=banner.icon;

  return <div className="space-y-5 text-right max-w-5xl mx-auto">

    <SectionExplainer
            storageKey="teacher_scan_v1"
            title="ماسح QR"
            text="قيد الحضور وتحصيل الاشتراكات بمسح كارت الطالب — نقرة واحدة تسجل كل شيء وتبعت إشعارًا فوريًا لولي الأمر."
            steps={['اختر وضع الماسح: تسجيل حضور، تحصيل مالي، أو قيد طالب جديد.', 'وجّه الكاميرا على كارت الطالب — النظام يتعرف عليه ويظهر بياناته قبل التأكيد.']}
            notes={['لو الكاميرا مش شغالة في المتصفح، اكتب كود الطالب يدويًا في خانة الإدخال.']}
          />

    <section className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full"><QrCode className="w-4 h-4"/>مسح حضور QR حقيقي</div><h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">تسجيل حضور الطلاب بالوقت الفعلي</h2><p className="text-xs text-slate-500 mt-1">الحالة تُحسب تلقائيًا من موعد المجموعة ووقت المسح — مع ربط السجل بالحصة الفعلية إن وُجدت.</p></div><div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200"><Clock3 className="w-4 h-4 text-blue-600"/>{now.toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div></div>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3"><select value={selectedGroupId} onChange={e=>setSelectedGroupId(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold"><option value="">اختر المجموعة</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name} — {g.grade||'عام'} — {g.schedule}</option>)}</select><div className="flex gap-2"><button type="button" onClick={()=>{setMode('attendance');setMessage(null)}} className={`flex-1 rounded-2xl border-2 px-3 py-3 text-sm font-black ${mode==='attendance'?'border-emerald-500 bg-emerald-50 text-emerald-800':'border-slate-200 bg-slate-50 text-slate-600'}`}><CheckCircle2 className="w-4 h-4 inline ml-1"/>حضور</button><button type="button" onClick={()=>{setMode('enroll');setMessage(null)}} className={`flex-1 rounded-2xl border-2 px-3 py-3 text-sm font-black ${mode==='enroll'?'border-blue-500 bg-blue-50 text-blue-800':'border-slate-200 bg-slate-50 text-slate-600'}`}><UserPlus className="w-4 h-4 inline ml-1"/>قيد طالب</button><button type="button" onClick={()=>{setMode('payment');setMessage(null)}} className={`flex-1 rounded-2xl border-2 px-3 py-3 text-sm font-black ${mode==='payment'?'border-amber-500 bg-amber-50 text-amber-800':'border-slate-200 bg-slate-50 text-slate-600'}`}><Banknote className="w-4 h-4 inline ml-1"/>تحصيل شهر</button></div></div>
      {mode==='payment'&&<div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] font-bold text-amber-900 flex items-start gap-2"><Banknote className="w-4 h-4 shrink-0 mt-0.5"/><span>امسح QR الطالب لتحصيل اشتراك الشهر الحالي ({monthLabel(currentMonthKey())}) — القيمة من اشتراك المجموعة، وتُسجل فورًا في سجل الطلاب وصفحات مدفوعات الطالب وولي الأمر مع إشعار واتساب + إشعارات فورية.</span></div>}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="font-black text-sm text-slate-800">طريقة مسح QR</div>
          <div className="text-[11px] font-bold text-slate-500">اختيارك محفوظ لحسابك — الوضع الافتراضي يدوي</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-label="اختيار طريقة مسح QR">
          <button type="button" aria-pressed={scanInputMode === 'manual'} onClick={() => { setScanInputMode('manual'); setScannerOpen(true);  }} className={scanInputMode === 'manual' ? 'rounded-2xl border-2 border-blue-500 bg-blue-50 text-blue-900 px-4 py-3 text-sm font-black flex items-center justify-center gap-2' : 'rounded-2xl border-2 border-slate-200 bg-white text-slate-600 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2'}>
            <QrCode className="w-4 h-4" /> يدوي بالكاميرا
          </button>
          <button type="button" aria-pressed={scanInputMode === 'auto'} onClick={() => { setScanInputMode('auto'); setScannerOpen(true);  }} className={scanInputMode === 'auto' ? 'rounded-2xl border-2 border-emerald-500 bg-emerald-50 text-emerald-900 px-4 py-3 text-sm font-black flex items-center justify-center gap-2' : 'rounded-2xl border-2 border-slate-200 bg-white text-slate-600 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2'}>
            <RefreshCw className="w-4 h-4" /> تلقائي بالكاميرا
          </button>
        </div>
      </div>
      <div className={`mt-4 rounded-2xl border px-4 py-3 flex items-center gap-3 ${banner.label.includes('الموعد')?'bg-emerald-50 border-emerald-200 text-emerald-900':banner.label.includes('تأخير')?'bg-amber-50 border-amber-200 text-amber-900':banner.label.includes('غياب')||banner.label.includes('انتهت')?'bg-red-50 border-red-200 text-red-900':'bg-slate-50 border-slate-200 text-slate-700'}`}><BannerIcon className="w-5 h-5"/><div><div className="font-black text-sm">{banner.label}</div><div className="text-[11px] opacity-80">{activeSlot?`موعد المجموعة: ${activeSlot.dayArabic} ${activeSlot.startTime} → ${activeSlot.endTime}`:'الحالة تتحدث تلقائيًا كل 5 ثوانٍ'}</div></div></div>
    </section>
    <section className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-slate-800">{scanInputMode === 'manual' ? 'المسح اليدوي بالكاميرا' : 'المسح التلقائي بالكاميرا'}</h3>
          <p className="text-[11px] text-slate-500 mt-1">{scanInputMode === 'manual' ? 'الكاميرا تكتشف الكود، لكن التسجيل لن يبدأ إلا بعد ضغط زر «امسح الكود».' : 'بمجرد ما الكاميرا تتعرف على QR، تبدأ معالجة الكود تلقائيًا.'}</p>
        </div>
        <button type="button" onClick={() => {
          if (scannerOpen) { setScannerOpen(false); return; }
          setScannerOpen(true);
          // ابدأ getUserMedia مباشرة داخل حدث الضغط حتى يستطيع المتصفح عرض نافذة الإذن.
          void cameraStartRef.current?.();
        }} className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">{scannerOpen ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}</button>
      </div>
      <details dir="rtl" className="group mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 sm:p-4 text-right">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm font-black text-blue-950">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <div>
              <span>لو الكاميرا مش بتطلب الإذن أو مش شغالة</span>
              <p className="mt-1 text-[11px] font-medium text-blue-800">اضغط لعرض خطوات السماح بالكاميرا من إعدادات المتصفح.</p>
            </div>
          </div>
          <span className="shrink-0 rounded-lg bg-white px-3 py-2 text-[11px] font-black text-blue-700 border border-blue-200 group-open:bg-blue-100">عرض الخطوات</span>
        </summary>
        <div className="mt-3 border-t border-blue-200 pt-3">
          <ol className="list-decimal space-y-1 pr-5 text-xs leading-6 text-blue-900">
            <li>افتح قائمة المتصفح من علامة الثلاث نقاط (⋮).</li>
            <li>ادخل على «الإعدادات»، ثم «إعدادات الموقع الإلكتروني».</li>
            <li>اضغط على «الكاميرا» واسمح لموقع Hassty باستخدامها.</li>
            <li>ارجع للمنصة واضغط على «تشغيل الكاميرا» مرة أخرى.</li>
          </ol>
          <button
            type="button"
            onClick={() => {
              setScannerOpen(true);
              void cameraStartRef.current?.();
            }}
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 active:scale-[0.99]"
          >
            <RefreshCw className="h-4 w-4" />
            حاول تشغيل الكاميرا مرة أخرى
          </button>
          <p className="mt-2 text-[10px] leading-5 text-blue-800/80">قد تختلف أسماء الإعدادات قليلًا حسب المتصفح ونوع الموبايل.</p>
        </div>
      </details>
      <RealQRCameraScanner
        startCameraRef={cameraStartRef}
        isActive={scannerOpen}
        isPaused={busy}
        scanMode={scanInputMode === 'auto' ? 'automatic' : 'manual'}
        resultMessage={message}
        onScanSuccess={processCode}
      />
    </section>
    <button type="button" onClick={()=>void reloadGroups()} className="w-full py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-black text-xs flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4"/>تحديث المجموعات</button>
  </div>;
};
