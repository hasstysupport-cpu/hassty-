/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/**
 * GroupEditModal — إنشاء / تحرير مجموعة كاملة التخصيص
 * ------------------------------------------------------
 * - كل حقول المجموعة: الاسم/المادة/المرحلة/المقر/وصف/لون/السعة/التسعير
 * - محرر مواعيد بصري: أيام أزرار toggle + وقت بداية/نهاية لكل يوم
 * - عند تحرير مجموعة بها طلاب وتغيير المواعيد → استبدال ذكي عبر
 *   replace_group_schedule (فحص تعارض + إمكان «فرض التغيير» + إعادة
 *   جدولة الحصص القادمة + إشعار الطلاب تلقائيًا)
 */

import React, { useMemo, useState } from 'react';
import {
  Layers, Clock, Plus, Trash2, AlertTriangle, Loader2, CheckCircle2, Info,
  Palette, Save, ShieldAlert,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { supabase } from '../../lib/supabase';
import { StudentGroup, GroupScheduleSlot, PricingBillingType } from '../../types';
import { saveTeacherGroup } from '../../lib/teacherStore';
import { calculateTeacherCommission, formatTimeArabic } from '../../lib/scheduleSync';

export const ALL_EGYPT_GRADES = [
  'الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي',
  'الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي',
];

export const TEACHER_SUBJECTS = [
  'الكيمياء', 'الفيزياء', 'الأحياء', 'الرياضيات', 'الجيولوجيا',
  'اللغة العربية', 'اللغة الإنجليزية', 'اللغة الفرنسية',
  'الدراسات الاجتماعية', 'التاريخ', 'الجغرافيا', 'الفلسفة والمنطق',
  'العلوم', 'الحاسب الآلي', 'مهارات أخرى',
];

const DAYS = [
  { eng: 'Saturday', ar: 'السبت' },
  { eng: 'Sunday', ar: 'الأحد' },
  { eng: 'Monday', ar: 'الإثنين' },
  { eng: 'Tuesday', ar: 'الثلاثاء' },
  { eng: 'Wednesday', ar: 'الأربعاء' },
  { eng: 'Thursday', ar: 'الخميس' },
  { eng: 'Friday', ar: 'الجمعة' },
];

export const GROUP_COLORS = [
  { key: 'blue', label: 'أزرق', dot: 'bg-[#2563EB]' },
  { key: 'emerald', label: 'أخضر', dot: 'bg-emerald-600' },
  { key: 'violet', label: 'بنفسجي', dot: 'bg-violet-600' },
  { key: 'amber', label: 'برتقالي', dot: 'bg-amber-500' },
  { key: 'rose', label: 'أحمر', dot: 'bg-rose-600' },
  { key: 'cyan', label: 'سماوي', dot: 'bg-cyan-600' },
  { key: 'slate', label: 'رمادي', dot: 'bg-slate-600' },
  { key: 'fuchsia', label: 'فوشيا', dot: 'bg-fuchsia-600' },
];

interface Props {
  mode: 'create' | 'edit';
  group?: StudentGroup;
  teacherId: string;
  activeStudents?: number;
  onClose: () => void;
  onSaved: (group: StudentGroup, opts: { created: boolean; scheduleChanged: boolean; conflicts?: any[] }) => void;
}

export const GroupEditModal: React.FC<Props> = ({ mode, group, teacherId, activeStudents = 0, onClose, onSaved }) => {
  const isEdit = mode === 'edit';

  const [name, setName] = useState(group?.name || '');
  const [subject, setSubject] = useState(group?.subject || TEACHER_SUBJECTS[0]);
  const [grade, setGrade] = useState(group?.grade || ALL_EGYPT_GRADES[0]);
  const [location, setLocation] = useState(group?.location || '');
  const [description, setDescription] = useState(group?.description || '');
  const [color, setColor] = useState(group?.color || 'blue');
  const [maxCapacity, setMaxCapacity] = useState<number | ''>(group?.maxCapacity || '');
  const [billingType, setBillingType] = useState<PricingBillingType>(group?.billingType || 'per_session');
  const [priceAmount, setPriceAmount] = useState<number | ''>(group?.priceAmount ?? '');

  /* الحالة الافتراضية: الأحد والثلاثاء 16:30-18:30 (نمط معتاد للمجموعات) */
  const initSlots = (): GroupScheduleSlot[] => {
    const src = group?.scheduleSlots && group.scheduleSlots.length ? group.scheduleSlots : [
      { id: 'slot-1', day: 'Sunday', dayArabic: 'الأحد', startTime: '16:30', endTime: '18:30' },
      { id: 'slot-2', day: 'Tuesday', dayArabic: 'الثلاثاء', startTime: '16:30', endTime: '18:30' },
    ];
    return src.map((s, i) => ({ ...s, id: s.id || `slot-${i + 1}`, dayArabic: s.dayArabic || DAYS.find(d => d.eng === s.day)?.ar || s.day }));
  };
  const [slots, setSlots] = useState<GroupScheduleSlot[]>(initSlots);

  const [busy, setBusy] = useState(false);
  const [force, setForce] = useState(false);
  const [blocked, setBlocked] = useState<{ code: string; message: string; conflicts?: any[] } | null>(null);

  const scheduleChanged = useMemo(() => {
    if (!isEdit || !group?.scheduleSlots) return false;
    const norm = (arr: GroupScheduleSlot[]) =>
      [...arr].map(s => `${s.day}|${s.startTime}|${s.endTime}`).sort().join('&');
    return norm(slots) !== norm(group.scheduleSlots);
  }, [isEdit, group, slots]);

  const activeDays = useMemo(() => new Set(slots.map(s => s.day)), [slots]);

  const toggleDay = (day: string) => {
    const exists = activeDays.has(day);
    if (exists) {
      if (slots.length <= 1) return; // ميعاد واحد على الأقل دائمًا
      setSlots(slots.filter(s => s.day !== day));
    } else {
      const ar = DAYS.find(d => d.eng === day)?.ar || day;
      setSlots([...slots, { id: `slot-${Date.now()}`, day, dayArabic: ar, startTime: '16:30', endTime: '18:30' }]);
    }
  };

  const updateSlotTime = (day: string, field: 'startTime' | 'endTime', val: string) => {
    setSlots(slots.map(s => (s.day === day ? { ...s, [field]: val } : s)));
  };

  const commission = calculateTeacherCommission(billingType, Number(priceAmount) || 0, Number(maxCapacity) || 30);

  const validate = (): string | null => {
    if (!name.trim()) return 'اكتب اسم المجموعة';
    if (!slots.length) return 'اختر يومًا واحدًا على الأقل للمواعيد';
    for (const s of slots) {
      if (!s.startTime || !s.endTime) return `حدد وقت البداية والنهاية ليوم ${s.dayArabic}`;
      if (s.endTime <= s.startTime) return `وقت نهاية ${s.dayArabic} لازم يكون بعد البداية`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) { setBlocked({ code: 'VALIDATION', message: v }); return; }

    setBusy(true); setBlocked(null);
    try {
      /* تحرير + مواعيد متغيرة + به طلاب → المسار الذكي (استبدال كامل بفحص وتنبيه) */
      if (isEdit && scheduleChanged && activeStudents > 0 && supabase) {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('replace_group_schedule', {
          p_group_id: group!.id,
          p_new_slots: slots,
          p_reason: force ? 'فرض من مودال التحرير' : 'تحرير من مودال المجموعة',
          p_force: force,
        });
        if (rpcErr) throw rpcErr;
        const res: any = rpcRes;
        if (!res?.ok) {
          setBlocked({ code: res?.code || 'UNKNOWN', message: res?.message || 'تعذر تحديث المواعيد', conflicts: res?.conflicts });
          return;
        }
      }

      const scheduleSummary = slots
        .map(s => `${s.dayArabic} من ${formatTimeArabic(s.startTime)} إلى ${formatTimeArabic(s.endTime)}`)
        .join(' و ');

      const saved = await saveTeacherGroup(teacherId, {
        id: group?.id || `grp-${Date.now()}`,
        name: name.trim(),
        subject,
        grade,
        level: grade,
        schedule: scheduleSummary,
        scheduleSlots: slots,
        location,
        description: description.trim() || undefined,
        color,
        maxCapacity: Number(maxCapacity) || 35,
        currentStudents: group?.currentStudents || 0,
        studentIds: group?.studentIds || [],
        billingType,
        priceAmount: Number(priceAmount) || (billingType === 'per_session' ? 120 : 450),
        commissionRate: group?.commissionRate ?? (billingType === 'per_session' ? 2 : 1.2),
        isPaused: group?.isPaused,
      } as StudentGroup);

      onSaved(saved, { created: !isEdit, scheduleChanged, conflicts: blocked?.conflicts });
    } catch (err: any) {
      const msg = String(err?.message || err);
      setBlocked({
        code: 'RLS',
        message: msg.includes('42501') || msg.toLowerCase().includes('row-level')
          ? 'حسابك قيد التوثيق من إدارة المنصة 🔒 — التعديل يتفعل فور اعتماد حسابك.'
          : `تعذر الحفظ: ${msg.slice(0, 140)}`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      maxWidth="lg"
      icon={<Layers className="w-5 h-5" />}
      title={isEdit ? `تحرير المجموعة: ${group?.name || ''}` : 'إنشاء مجموعة جديدة'}
      subtitle="كل التخصيصات في مكان واحد — المواعيد، التسعير، اللون، والوصف"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-1" dir="rtl">
        {/* ===== الأساسيات ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">اسم المجموعة <span className="text-rose-500">*</span></label>
            <input
              type="text" required value={name} onChange={e => setName(e.target.value)}
              placeholder="مثال: مجموعة الأحد والثلاثاء — كيمياء أولى إعدادي"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">المادة</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold cursor-pointer outline-none focus:border-blue-300">
              {TEACHER_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">المرحلة والصف</label>
            <select value={grade} onChange={e => setGrade(e.target.value)} disabled={isEdit}
              title={isEdit ? 'المرحلة لا تتغير بعد الإنشاء لسلامة قيود الطلاب — أنشئ مجموعة جديدة لمرحلة أخرى' : ''}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold cursor-pointer outline-none focus:border-blue-300 disabled:opacity-60">
              {ALL_EGYPT_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">المقر / السنتر</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="سنتر الأهرام — مدينة نصر"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-black text-slate-500 mb-1.5">وصف مختصر للمجموعة (اختياري)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={300}
            placeholder="ملاحظاتك عن طبيعة المجموعة ومستواها وأي تفاصيل تهمك..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 resize-none" />
        </div>

        {/* ===== اللون ===== */}
        <div>
          <label className="block text-[11px] font-black text-slate-500 mb-2 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" />لون تمييز المجموعة</label>
          <div className="flex flex-wrap gap-2">
            {GROUP_COLORS.map(c => (
              <button key={c.key} type="button" onClick={() => setColor(c.key)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-black transition-all cursor-pointer ${color === c.key ? 'border-blue-400 bg-blue-50 text-blue-900 ring-2 ring-blue-100' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                <span className={`w-3 h-3 rounded-full ${c.dot}`} />
                {c.label}
                {color === c.key && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* ===== محرر المواعيد البصري ===== */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black text-emerald-800 flex items-center gap-1.5"><Clock className="w-4 h-4" />مواعيد المجموعة الأسبوعية</label>
            <Badge variant={slots.length ? 'success' : 'warning'} size="sm">{slots.length} ميعاد</Badge>
          </div>

          {/* أيام toggle */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {DAYS.map(d => {
              const on = activeDays.has(d.eng);
              return (
                <button key={d.eng} type="button" onClick={() => toggleDay(d.eng)}
                  className={`rounded-xl border py-2.5 text-[11px] font-black transition-all cursor-pointer ${on ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-300'}`}>
                  {d.ar}
                </button>
              );
            })}
          </div>

          {/* أوقات كل يوم مختار */}
          <div className="space-y-2">
            {slots.map(s => (
              <div key={s.day} className="flex items-center gap-2 rounded-xl bg-white border border-emerald-100 px-3 py-2">
                <span className="text-[11px] font-black text-emerald-800 min-w-[52px]">{s.dayArabic}</span>
                <span className="text-[10px] text-slate-400 font-bold">من</span>
                <input type="time" value={s.startTime} onChange={e => updateSlotTime(s.day, 'startTime', e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold outline-none focus:border-emerald-300" />
                <span className="text-[10px] text-slate-400 font-bold">إلى</span>
                <input type="time" value={s.endTime} onChange={e => updateSlotTime(s.day, 'endTime', e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold outline-none focus:border-emerald-300" />
                <span className="text-[10px] text-slate-400 mr-auto font-mono">{formatTimeArabic(s.startTime)}</span>
              </div>
            ))}
          </div>

          {isEdit && scheduleChanged && (
            <div className={`rounded-xl border p-3 text-[11px] font-bold ${activeStudents > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-blue-50 border-blue-100 text-blue-900'} flex items-start gap-2`}>
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                {activeStudents > 0 ? (
                  <>
                    <div>غيّرت مواعيد مجموعة فيها <strong>{activeStudents} طالب</strong> — النظام هيفحص تعارضاتهم ويعيد جدولة الحصص القادمة ويبلّغهم تلقائيًا.</div>
                    <label className="flex items-center gap-2 mt-2 font-black cursor-pointer select-none">
                      <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} className="w-4 h-4 accent-amber-600" />
                      <ShieldAlert className="w-3.5 h-3.5" />
                      فرض التغيير رغم تعارض بعض الطلاب وفترة التهدئة (المدرس يتحمل قراره)
                    </label>
                  </>
                ) : 'لا يوجد طلاب نشطون في المجموعة — التغيير هيُطبق مباشرة.'}
              </div>
            </div>
          )}
        </div>

        {/* ===== السعة والتسعير ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">أقصى عدد طلاب</label>
            <input type="number" min={1} max={200} value={maxCapacity} onChange={e => setMaxCapacity(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:border-blue-300" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">طريقة الحساب</label>
            <select value={billingType} onChange={e => setBillingType(e.target.value as PricingBillingType)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold cursor-pointer outline-none focus:border-blue-300">
              <option value="per_session">بالحصة</option>
              <option value="monthly">بالشهر</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">السعر (ج.م)</label>
            <input type="number" min={0} value={priceAmount} onChange={e => setPriceAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={billingType === 'per_session' ? '120' : '450'}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold outline-none focus:border-blue-300" />
          </div>
        </div>

        {/* ملخص العمولة الحي */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-[11px] font-bold text-slate-600 flex items-center justify-between">
          <span>عمولة المنصة المتوقعة: {billingType === 'per_session' ? '2%' : `${group?.commissionRate ?? 1.2}%`}</span>
          <span className="text-slate-400">{commission.commissionRateLabel}</span>
        </div>

        {/* رسائل الحجب */}
        {blocked && (
          <div className={`rounded-2xl border p-3 text-xs font-bold ${blocked.code === 'VALIDATION' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <div>{blocked.message}</div>
                {(blocked.conflicts || []).length > 0 && (
                  <div className="text-[11px] font-bold text-rose-700 bg-white/60 rounded-xl p-2 space-y-1">
                    {blocked.conflicts.slice(0, 5).map((c: any, i: number) => (
                      <div key={i}>• {c.student_name} — عنده درس مع «{c.with_group}» يوم {c.with_day}</div>
                    ))}
                    {blocked.conflicts.length > 5 && <div>و{blocked.conflicts.length - 5} آخرين...</div>}
                  </div>
                )}
                {(blocked.code === 'MAJORITY_CONFLICT' || blocked.code === 'COOLDOWN') && (
                  <label className="flex items-center gap-2 font-black cursor-pointer select-none">
                    <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} className="w-4 h-4 accent-rose-600" />
                    <ShieldAlert className="w-3.5 h-3.5" /> فرض التغيير رغم ذلك
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex items-center gap-2 justify-end pt-1 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50 cursor-pointer">إلغاء</button>
          <button type="submit" disabled={busy}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-black shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isEdit ? 'حفظ التعديلات' : 'إنشاء المجموعة'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
