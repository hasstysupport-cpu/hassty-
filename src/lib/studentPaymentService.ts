/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو النشر أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/**
 * studentPaymentService — تحصيل اشتراكات الطلاب الشهرية (سجل حقيقي)
 * ---------------------------------------------------------------------
 * التدفق الكامل (من مسح QR أو زر التحصيل اليدوي):
 *   1) التحقق من القيد الفعلي للطالب في مجموعات المدرس
 *   2) منع التحصيل المكرر لنفس الشهر (فحص payment_records)
 *   3) إدراج سجل دفع "مدفوع" في payment_records (يظهر فورًا للطالب وولي الأمر)
 *   4) تحديث payment_status على مستوى القيد (سجل الطلاب)
 *   5) إشعار ولي الأمر: واتساب + Web Push + جرس الإشعارات (parentNotify)
 * أي فشل في الإشعارات لا يلغي عملية التحصيل أبدًا.
 */

import { supabase } from './supabase';
import { notifyParentPayment } from './parentNotify';
import { findStudentByQr } from './attendanceService';

export interface EnrolledStudentRow {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  student_phone: string;
  parent_phone: string;
  qr_code: string;
  grade: string;
  group_id: string;
  group_name: string;
  monthly_fee: number;
  payment_status: string;
  avatar_url: string;
}

export interface CollectionStatusRow extends EnrolledStudentRow {
  /** هل الشهر المحدد مدفوع لهذا الطالب؟ */
  paid: boolean;
  invoiceNumber?: string;
  paidAt?: string;
  amount: number;
}

/** شهر الحالي بصيغة YYYY-MM حسب الساعة المحلية */
export function currentMonthKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** تسمية عربية للشهر */
export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  return new Date(y, m - 1, 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
}

function buildInvoiceNumber(monthKey: string): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HST-${monthKey.replace('-', '')}-${rand}`;
}

/** كل الطلاب المسجلين في مجموعات المدرس + حالة الشهر المطلوب */
export async function loadTeacherCollectionStatus(teacherId: string, monthKey = currentMonthKey()): Promise<CollectionStatusRow[]> {
  if (!supabase || !teacherId) return [];

  const { data: enrollments, error } = await supabase
    .from('group_enrollments')
    .select('id, student_id, student_name, student_phone, parent_phone, qr_code, grade, payment_status, avatar_url, group_id, student_groups!inner(id, name, tutor_id, monthly_fee)')
    .eq('status', 'active')
    .eq('student_groups.tutor_id', teacherId);

  if (error) throw error;
  const rows = (enrollments || []) as any[];
  if (rows.length === 0) return [];

  const studentIds = Array.from(new Set(rows.map((r) => r.student_id).filter(Boolean)));
  const groupIds = Array.from(new Set(rows.map((r) => r.group_id).filter(Boolean)));

  // سجلات الدفع المدفوعة للشهر المطلوب لهؤلاء الطلاب
  const paidMap = new Map<string, { invoiceNumber: string; paidAt: string; amount: number }>();
  if (studentIds.length > 0) {
    const { data: payments } = await supabase
      .from('payment_records')
      .select('student_id, group_id, invoice_number, paid_at, amount')
      .eq('tutor_id', teacherId)
      .eq('billing_type', 'monthly')
      .eq('billing_period', monthKey)
      .eq('status', 'paid')
      .in('student_id', studentIds);
    for (const p of (payments || []) as any[]) {
      if (!p.student_id) continue;
      // مفتاح الطالب داخل المجموعة المحددة إن وُجدت، وإلا الطالب عمومًا
      const key = p.group_id ? `${p.student_id}:${p.group_id}` : p.student_id;
      if (!paidMap.has(key)) paidMap.set(key, { invoiceNumber: p.invoice_number || '', paidAt: p.paid_at || '', amount: Number(p.amount || 0) });
    }
  }

  const studentKey = (r: any) => `${r.student_id}:${r.group_id}`;
  return rows
    .filter((r) => r.student_id && r.group_id)
    .map((r) => {
      const paid = paidMap.get(studentKey(r)) || paidMap.get(r.student_id);
      return {
        enrollment_id: r.id,
        student_id: r.student_id,
        student_name: r.student_name || 'طالب',
        student_phone: r.student_phone || '',
        parent_phone: r.parent_phone || '',
        qr_code: r.qr_code || '',
        grade: r.grade || '',
        group_id: r.group_id,
        group_name: (r.student_groups as any)?.name || 'المجموعة',
        monthly_fee: Number((r.student_groups as any)?.monthly_fee || 0),
        payment_status: r.payment_status || 'pending',
        avatar_url: r.avatar_url || '',
        paid: !!paid,
        invoiceNumber: paid?.invoiceNumber,
        paidAt: paid?.paidAt,
        amount: Number((r.student_groups as any)?.monthly_fee || 0),
      };
    });
}

/** سجل آخر عمليات التحصيل للمدرس */
export async function loadRecentCollections(teacherId: string, limit = 12): Promise<any[]> {
  if (!supabase || !teacherId) return [];
  const { data, error } = await supabase
    .from('payment_records')
    .select('id, student_id, student_name, group_id, amount, billing_period, status, paid_at, method, invoice_number, notes')
    .eq('tutor_id', teacherId)
    .eq('billing_type', 'monthly')
    .order('paid_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export interface CollectMonthResult {
  ok: true;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  monthKey: string;
  amount: number;
  invoiceNumber: string;
  alreadyPaid: boolean;
  notified: { whatsapp: boolean; pushUserId: string; source: string };
}

export interface CollectMonthInput {
  teacherId: string;
  /** الطالب المحدد من مسح QR أو من القائمة */
  student: { id: string; full_name?: string; qr_code?: string };
  /** مجموعة محددة (من القيد) — إن تُرك فارغًا سيُستخدم أول قيد نشط */
  groupId?: string;
  monthKey?: string;
  /** تجاوز المبلغ إن لزم (افتراضيًا monthly_fee من المجموعة) */
  amountOverride?: number;
  method?: string;
  notes?: string;
}

/**
 * تحصيل اشتراك شهر لطالب — الكتابة الحقيقية في سجل الطلاب + إشعار ولي الأمر
 * تُستخدم من مسح QR في صفحة الماسح ومن زر التحصيل في صفحة المدفوعات.
 */
export async function collectStudentMonth(input: CollectMonthInput): Promise<CollectMonthResult> {
  if (!supabase) throw new Error('قاعدة البيانات غير متاحة.');
  if (!input.teacherId) throw new Error('جلسة المدرس غير صالحة.');
  if (!input.student?.id) throw new Error('بيانات الطالب غير صالحة.');

  const monthKey = input.monthKey || currentMonthKey();

  // 1) قيد الطالب النشط في مجموعات هذا المدرس
  let enrollmentQuery = supabase
    .from('group_enrollments')
    .select('id, group_id, student_name, payment_status, student_groups!inner(id, name, tutor_id, monthly_fee)')
    .eq('student_id', input.student.id)
    .eq('status', 'active')
    .eq('student_groups.tutor_id', input.teacherId)
    .limit(1);
  if (input.groupId) enrollmentQuery = enrollmentQuery.eq('group_id', input.groupId);

  const { data: enrollmentRow, error: enrollmentError } = await enrollmentQuery.maybeSingle();
  if (enrollmentError) throw enrollmentError;
  if (!enrollmentRow) {
    throw new Error('الطالب غير مقيد في أي مجموعة من مجموعاتك — قيّده أولًا بوضع «قيد طالب».');
  }

  const group = (enrollmentRow as any).student_groups || {};
  const groupId = enrollmentRow.group_id as string;
  const groupName = group.name || 'المجموعة';
  const amount = Number(input.amountOverride ?? group.monthly_fee ?? 0);
  const studentName = input.student.full_name || enrollmentRow.student_name || 'طالب';

  // 2) منع التكرار: هل الشهر مدفوع بالفعل لهذا الطالب في هذه المجموعة؟
  const { data: existingPaid } = await supabase
    .from('payment_records')
    .select('id, invoice_number, paid_at')
    .eq('tutor_id', input.teacherId)
    .eq('student_id', input.student.id)
    .eq('group_id', groupId)
    .eq('billing_type', 'monthly')
    .eq('billing_period', monthKey)
    .eq('status', 'paid')
    .limit(1)
    .maybeSingle();

  let invoiceNumber = buildInvoiceNumber(monthKey);
  if (existingPaid) {
    // مدفوع بالفعل — نرسل تأكيدًا فقط دون كتابة جديدة
    invoiceNumber = (existingPaid as any).invoice_number || invoiceNumber;
    const notified = await notifyParentPayment({
      studentId: input.student.id,
      groupId,
      studentName,
      groupName,
      amount,
      invoiceNumber,
      billingType: 'monthly',
      billingPeriod: monthKey,
    });
    return {
      ok: true, studentId: input.student.id, studentName, groupId, groupName,
      monthKey, amount, invoiceNumber, alreadyPaid: true, notified: { ...notified, source: notified.source },
    };
  }

  // 3) إدراج سجل الدفع المدفوع (يظهر للطالب وولي الأمر فورًا في صفحات المدفوعات)
  const { error: insertError } = await supabase.from('payment_records').insert({
    student_id: input.student.id,
    tutor_id: input.teacherId,
    group_id: groupId,
    amount,
    currency: 'EGP',
    method: input.method || 'qr_scan',
    billing_type: 'monthly',
    billing_period: monthKey,
    status: 'paid',
    paid_at: new Date().toISOString(),
    student_name: studentName,
    invoice_number: invoiceNumber,
    subject: groupName,
    notes: input.notes || `تحصيل اشتراك ${monthLabel(monthKey)}${input.method === 'qr_scan' ? ' عبر مسح QR' : ''}`,
  });
  if (insertError) throw insertError;

  // 4) تحديث سجل الطلاب (القيد): حالة الدفع = مدفوع
  try {
    await supabase
      .from('group_enrollments')
      .update({ payment_status: 'paid' })
      .eq('id', (enrollmentRow as any).id);
  } catch (err) { console.warn('[payments] enrollment status update skipped:', (err as any)?.message); }

  // 5) إشعار ولي الأمر (واتساب + push + جرس)
  const notified = await notifyParentPayment({
    studentId: input.student.id,
    groupId,
    studentName,
    groupName,
    amount,
    invoiceNumber,
    billingType: 'monthly',
    billingPeriod: monthKey,
  });

  return {
    ok: true, studentId: input.student.id, studentName, groupId, groupName,
    monthKey, amount, invoiceNumber, alreadyPaid: false,
    notified: { ...notified, source: notified.source },
  };
}

/** العثور على طالب من QR + التحقق أنه مقيد بمجموعات المدرس (لوضع التحصيل بالمسح) */
export async function findCollectableStudent(teacherId: string, qrCode: string) {
  if (!supabase) return { student: null, enrollment: null };
  // البحث الموحد: RPC الأمنية find_student_by_qr + الاحتياطي المباشر — يعمل للمدرس رغم RLS
  const student = await findStudentByQr(qrCode);
  if (!student) return { student: null, enrollment: null };

  const { data: enrollment } = await supabase
    .from('group_enrollments')
    .select('id, group_id, student_name, payment_status, student_groups!inner(id, name, tutor_id, monthly_fee)')
    .eq('student_id', student.id)
    .eq('status', 'active')
    .eq('student_groups.tutor_id', teacherId)
    .limit(1)
    .maybeSingle();

  return { student, enrollment: enrollment || null };
}
