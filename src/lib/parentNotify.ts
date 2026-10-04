/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو النشر أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/**
 * parentNotify — طبقة إشعارات ولي الأمر الموحدة
 * ------------------------------------------------------------
 * الترتيب الذكي لحل جهة إشعار ولي الأمر:
 *   1) ربط حساب ولي أمر فعلي (parent_children → profiles الأب)
 *   2) رقم ولي الأمر المسجل في إعدادات الطالب (profiles.metadata.parentPhone)
 *   3) رقم ولي الأمر المحفوظ على مستوى القيد في المجموعة (group_enrollments.parent_phone)
 *
 * كل إشعار يُرسل بالتوازي عبر قناتين:
 *   - واتساب (GREEN API عبر /api/whatsapp/notify)
 *   - Web Push لأجهزة ولي الأمر إن كان مربوطًا بحساب (أو رقمه مسجل بحساب)
 *   - إشعار داخلي في جدول notifications يظهر في جرس ولي الأمر
 * فشل أي قناة لا يوقف بقية القنوات أبدًا.
 */

import { supabase } from './supabase';
import { whatsappService } from './whatsappService';

export interface ParentContacts {
  parentPhone: string;
  parentUserId: string;
  parentName: string;
  /** من أين جاء الرقم: linked_account | student_settings | enrollment */
  source: 'linked_account' | 'student_settings' | 'enrollment' | 'none';
  /** تفضيلات إشعارات ولي الأمر المحفوظة من إعداداته (إن وُجد حساب) */
  prefs: NotificationPrefs;
}

export interface NotificationPrefs {
  attendance: boolean;
  absence: boolean;
  late: boolean;
  upcoming: boolean;
  payments: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = { attendance: true, absence: true, late: true, upcoming: true, payments: true };

const EMPTY: ParentContacts = { parentPhone: '', parentUserId: '', parentName: '', source: 'none', prefs: DEFAULT_PREFS };

const cleanPhone = (value: string | null | undefined): string => {
  const digits = String(value || '').replace(/[^\d+]/g, '');
  return digits.length >= 10 ? digits : '';
};

/** قراءة تفضيلات الإشعارات من metadata ولي الأمر */
function readPrefs(metadata: any): NotificationPrefs {
  const p = (metadata as any)?.notification_prefs;
  if (!p || typeof p !== 'object') return DEFAULT_PREFS;
  return {
    attendance: p.attendance !== false,
    absence: p.absence !== false,
    late: p.late !== false,
    upcoming: p.upcoming !== false,
    payments: p.payments !== false,
  };
}

/** حل جهة إشعار ولي الأمر بذكاء عبر القنوات الثلاث */
export async function resolveParentContacts(studentId: string, groupId?: string): Promise<ParentContacts> {
  if (!supabase || !studentId) return EMPTY;

  // 1) حساب ولي أمر مربوط فعليًا
  try {
    const { data: link } = await supabase
      .from('parent_children')
      .select('parent_id, child_name')
      .eq('child_id', studentId)
      .limit(1)
      .maybeSingle();
    if (link?.parent_id) {
      const { data: parent } = await supabase
        .from('profiles')
        .select('id, full_name, phone, metadata')
        .eq('id', link.parent_id)
        .maybeSingle();
      if (parent?.id) {
        return {
          parentUserId: parent.id,
          parentPhone: cleanPhone(parent.phone),
          parentName: parent.full_name || '',
          source: 'linked_account',
          prefs: readPrefs(parent.metadata),
        };
      }
    }
  } catch { /* نكمل للبديل التالي */ }

  // 2) رقم ولي الأمر من إعدادات الطالب (metadata.parentPhone)
  try {
    const { data: student } = await supabase
      .from('profiles')
      .select('id, metadata')
      .eq('id', studentId)
      .maybeSingle();
    const fromSettings = cleanPhone((student?.metadata as any)?.parentPhone);
    if (fromSettings) {
      // هل الرقم مملوك لحساب ولي أمر فعلي؟ (لوصل push كمان)
      let parentUserId = '';
      try {
        const { data: byPhone } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('phone', fromSettings)
          .eq('role', 'parent')
          .limit(1)
          .maybeSingle();
        if (byPhone?.id) parentUserId = byPhone.id;
      } catch { /* تجاهل */ }
      return { parentPhone: fromSettings, parentUserId, parentName: '', source: 'student_settings', prefs: DEFAULT_PREFS };
    }
  } catch { /* نكمل للبديل التالي */ }

  // 3) رقم ولي الأمر من بيانات القيد في المجموعة
  if (groupId) {
    try {
      const { data: enrollment } = await supabase
        .from('group_enrollments')
        .select('parent_phone')
        .eq('group_id', groupId)
        .eq('student_id', studentId)
        .limit(1)
        .maybeSingle();
      const fromEnrollment = cleanPhone(enrollment?.parent_phone);
      if (fromEnrollment) return { parentPhone: fromEnrollment, parentUserId: '', parentName: '', source: 'enrollment', prefs: DEFAULT_PREFS };
    } catch { /* تجاهل */ }
  }

  return EMPTY;
}

/** أفضل رقم متاح للقيد عند التسجيل/التعديل — يُستخدم عند قيد الطالب بالمسح */
export async function bestParentPhoneForEnrollment(studentId: string, studentProfile?: { metadata?: any; phone?: string }): Promise<string> {
  const contacts = await resolveParentContacts(studentId);
  if (contacts.parentPhone) return contacts.parentPhone;
  return cleanPhone((studentProfile as any)?.metadata?.parentPhone) || '';
}

interface InAppInsert { userId: string; title: string; message: string; type: string; link?: string; }

/** إشعار داخلي في جرس ولي الأمر — لا يرمي خطأ أبدًا */
async function insertInApp(insert: InAppInsert): Promise<void> {
  if (!supabase || !insert.userId) return;
  try {
    await supabase.from('notifications').insert({
      user_id: insert.userId,
      title: insert.title,
      message: insert.message,
      type: insert.type,
      link: insert.link || null,
    });
  } catch (err) {
    console.warn('[parentNotify] in-app insert skipped:', (err as any)?.message);
  }
}

export interface ParentPaymentNotifyInput {
  studentId: string;
  groupId?: string;
  studentName: string;
  groupName?: string;
  amount: number;
  invoiceNumber: string;
  billingType: 'monthly' | 'per_session';
  billingPeriod?: string;
  link?: string;
}

/** إشعار تأكيد دفع/تحصيل — واتساب + Push + جرس ولي الأمر */
export async function notifyParentPayment(input: ParentPaymentNotifyInput): Promise<{ whatsapp: boolean; pushUserId: string; source: ParentContacts['source'] }> {
  const contacts = await resolveParentContacts(input.studentId, input.groupId);
  const typeLabel = input.billingType === 'monthly' ? 'اشتراك شهري' : 'حصة دراسية';

  let whatsapp = false;
  if (contacts.parentPhone && contacts.prefs.payments) {
    try {
      const res = await whatsappService.notifyEvent('payment', {
        studentName: input.studentName,
        groupName: input.groupName || '',
        amount: input.amount,
        invoiceNumber: input.invoiceNumber,
        billingType: input.billingType,
        typeLabel,
        billingPeriod: input.billingPeriod || '',
        date: new Date().toLocaleDateString('ar-EG'),
        link: input.link,
      }, contacts.parentUserId || undefined, contacts.parentPhone);
      whatsapp = res?.success === true;
    } catch (err) { console.warn('[parentNotify] payment whatsapp failed:', (err as any)?.message); }
  }

  if (contacts.parentUserId) {
    await insertInApp({
      userId: contacts.parentUserId,
      title: 'تأكيد دفع 🧾',
      message: `${input.studentName} — ${typeLabel} بقيمة ${Number(input.amount || 0).toLocaleString('ar-EG')} ج.م (عملية ${input.invoiceNumber})${input.groupName ? ` — ${input.groupName}` : ''}`,
      type: 'payment',
      link: input.link || '/parent/payments',
    });
  }

  return { whatsapp, pushUserId: contacts.parentUserId, source: contacts.source };
}

export interface ParentAttendanceNotifyInput {
  studentId: string;
  groupId: string;
  groupName: string;
  studentName: string;
  status: 'present' | 'late' | 'absent';
  lateMinutes?: number;
  timeString: string;
}

/** إشعار حضور/غياب — واتساب + Push + جرس ولي الأمر */
export async function notifyParentAttendance(input: ParentAttendanceNotifyInput): Promise<{ whatsapp: boolean; pushUserId: string; source: ParentContacts['source'] }> {
  const contacts = await resolveParentContacts(input.studentId, input.groupId);
  const statusLabel = input.status === 'present' ? 'حاضر في الموعد' : input.status === 'late' ? 'حاضر متأخر' : 'غياب';
  const statusKey = input.status === 'present' ? 'on_time' : input.status === 'late' ? 'late' : 'absent';

  /* احترام تفضيلات ولي الأمر: الغياب يتبع pref الغياب، والتأخير pref التأخر */
  const allowed = input.status === 'absent'
    ? contacts.prefs.absence
    : input.status === 'late'
      ? contacts.prefs.late
      : contacts.prefs.attendance;

  let whatsapp = false;
  if (contacts.parentPhone && allowed) {
    try {
      const res = await whatsappService.sendAttendanceNotice({
        parentPhone: contacts.parentPhone,
        studentName: input.studentName,
        groupName: input.groupName,
        status: statusKey as 'on_time' | 'late' | 'absent_cutoff',
        offsetMinutes: Math.max(0, input.lateMinutes || 0),
        timeString: input.timeString,
      });
      whatsapp = res?.success === true;
    } catch (err) { console.warn('[parentNotify] attendance whatsapp failed:', (err as any)?.message); }
  }

  if (contacts.parentUserId && allowed) {
    await insertInApp({
      userId: contacts.parentUserId,
      title: `إشعار حضور ${input.status === 'late' ? '🟡' : input.status === 'absent' ? '🔴' : '🟢'}`,
      message: `${input.studentName} — ${statusLabel} في ${input.groupName} (${input.timeString})${input.status === 'late' ? ` — تأخير ${input.lateMinutes} دقيقة` : ''}`,
      type: 'attendance',
      link: '/parent/attendance',
    });
  }

  return { whatsapp, pushUserId: contacts.parentUserId, source: contacts.source };
}

export interface ParentReminderNotifyInput {
  studentId: string;
  groupId?: string;
  studentName: string;
  groupName?: string;
  monthLabel: string;
  amount: number;
  teacherName?: string;
}

/** تنبيه استحقاق مالي (تذكير واتساب + جرس ولي الأمر) */
export async function notifyParentDuesReminder(input: ParentReminderNotifyInput): Promise<{ whatsapp: boolean; pushUserId: string; source: ParentContacts['source']; parentPhone: string }> {
  const contacts = await resolveParentContacts(input.studentId, input.groupId);

  let whatsapp = false;
  if (contacts.parentPhone) {
    try {
      const msg = `*منصة حِصّتي — تنبيه استحقاق* 💳\n\nالطالب: *${input.studentName}*\n${input.groupName ? `المجموعة: *${input.groupName}*\n` : ''}الاشتراك المستحق: *${input.monthLabel}*\nالمبلغ: *${Number(input.amount || 0).toLocaleString('ar-EG')} ج.م*\n\nبرجاء سداد الاشتراك في أقرب وقت${input.teacherName ? ` — ${input.teacherName}` : ''}.`;
      const res = await whatsappService.sendMessage(contacts.parentPhone, msg);
      whatsapp = res?.success === true;
    } catch (err) { console.warn('[parentNotify] reminder whatsapp failed:', (err as any)?.message); }
  }

  if (contacts.parentUserId) {
    await insertInApp({
      userId: contacts.parentUserId,
      title: 'تنبيه استحقاق مالي 💳',
      message: `${input.studentName} — اشتراك ${input.monthLabel} المستحق ${Number(input.amount || 0).toLocaleString('ar-EG')} ج.م${input.groupName ? ` — ${input.groupName}` : ''}`,
      type: 'payment',
      link: '/parent/payments',
    });
  }

  return { whatsapp, pushUserId: contacts.parentUserId, source: contacts.source, parentPhone: contacts.parentPhone };
}

/** إشعار ولي الأمر عند التحويل بين المجموعات/المدرسين */
export async function notifyParentTransfer(input: { studentId: string; studentName: string; fromGroupName?: string; toGroupName?: string; teacherName?: string; }): Promise<{ whatsapp: boolean; pushUserId: string }> {
  const contacts = await resolveParentContacts(input.studentId);

  let whatsapp = false;
  if (contacts.parentPhone) {
    try {
      const msg = `*منصة حِصّتي — تحديث تحويل الطالب* 🔄\n\nالطالب: *${input.studentName}*\n${input.fromGroupName ? `من: *${input.fromGroupName}*\n` : ''}${input.toGroupName ? `إلى: *${input.toGroupName}*\n` : ''}${input.teacherName ? `المدرس: *${input.teacherName}*\n` : ''}\nتم تنفيذ التحويل بنجاح وتحديث قيد الطالب.`;
      const res = await whatsappService.sendMessage(contacts.parentPhone, msg);
      whatsapp = res?.success === true;
    } catch (err) { console.warn('[parentNotify] transfer whatsapp failed:', (err as any)?.message); }
  }

  if (contacts.parentUserId) {
    await insertInApp({
      userId: contacts.parentUserId,
      title: 'تحديث تحويل الطالب 🔄',
      message: `${input.studentName}: تم التحويل${input.fromGroupName ? ` من ${input.fromGroupName}` : ''}${input.toGroupName ? ` إلى ${input.toGroupName}` : ''} بنجاح.`,
      type: 'system',
      link: '/parent/dashboard',
    });
  }

  return { whatsapp, pushUserId: contacts.parentUserId };
}
