/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو النشر أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DollarSign, RefreshCw, Loader2, AlertCircle, TrendingUp, Banknote, QrCode,
  BellRing, CheckCircle2, BadgeCheck, Clock, History, Users, X
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Badge } from '../../components/common/Badge';
import {
  loadTeacherCollectionStatus, loadRecentCollections, collectStudentMonth,
  currentMonthKey, monthLabel, CollectionStatusRow,
} from '../../lib/studentPaymentService';
import { notifyParentDuesReminder } from '../../lib/parentNotify';

export const TeacherPaymentsPageV2: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const teacherId = user?.uid || '';

  /* حالة العمولات (كما كانت) */
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* حالة تحصيل الطلاب */
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [students, setStudents] = useState<CollectionStatusRow[]>([]);
  const [collectionHistory, setCollectionHistory] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [busyStudent, setBusyStudent] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [activeStudentsCount, setActiveStudentsCount] = useState(0);

  const loadCommissions = useCallback(async () => {
    if (!supabase || !teacherId) return;
    const { data: r, error: e } = await supabase
      .from('commission_tracking')
      .select('id,billing_cycle,active_students_count,monthly_gross_egp,tier_rate,due_commission_egp,payment_status,last_payment_date,created_at')
      .eq('teacher_id', teacherId)
      .order('billing_cycle', { ascending: false })
      .limit(24);
    if (e) { setError('تعذر تحميل العمولات من Supabase.'); return; }
    const { count } = await supabase.from('group_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active');
    setRows(r || []);
    setActiveStudentsCount(count || 0);
  }, [teacherId]);

  const loadCollections = useCallback(async () => {
    if (!supabase || !teacherId) return;
    setLoadingStudents(true);
    try {
      const [list, history] = await Promise.all([
        loadTeacherCollectionStatus(teacherId, monthKey),
        loadRecentCollections(teacherId, 12),
      ]);
      setStudents(list);
      setCollectionHistory(history);
    } catch (e: any) {
      setNotice({ kind: 'error', text: e?.message || 'تعذر تحميل بيانات تحصيل الطلاب.' });
    } finally {
      setLoadingStudents(false);
    }
  }, [teacherId, monthKey]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    await Promise.all([loadCommissions(), loadCollections()]);
    setLoading(false);
  }, [loadCommissions, loadCollections]);

  useEffect(() => { void load(); }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void loadCollections(); }, [monthKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /* تحديث فوري عند تغيّر سجلات الدفع (realtime) */
  useEffect(() => {
    if (!supabase || !teacherId) return;
    const ch = supabase
      .channel(`teacher-payments-${teacherId}-${Date.now().toString(36)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_records', filter: `tutor_id=eq.${teacherId}` }, () => void loadCollections())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commission_tracking', filter: `tutor_id=eq.${teacherId}` }, () => void loadCommissions())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [teacherId, loadCollections, loadCommissions]);

  const handleCollect = async (row: CollectionStatusRow) => {
    if (busyStudent) return;
    setBusyStudent(row.student_id);
    setNotice(null);
    try {
      const result = await collectStudentMonth({
        teacherId,
        student: { id: row.student_id, full_name: row.student_name, qr_code: row.qr_code },
        groupId: row.group_id,
        method: 'manual',
      });
      if (result.alreadyPaid) {
        setNotice({ kind: 'info', text: `${result.studentName} مدفوع له ${monthLabel(result.monthKey)} بالفعل (عملية ${result.invoiceNumber}).` });
      } else {
        setNotice({ kind: 'success', text: `تم تحصيل ${result.amount.toLocaleString('ar-EG')} ج.م من ${result.studentName} — ${monthLabel(result.monthKey)} — عملية ${result.invoiceNumber}.${result.notified.whatsapp ? ' وصل واتساب لولي الأمر ✅' : ''}` });
      }
      await loadCollections();
    } catch (e: any) {
      setNotice({ kind: 'error', text: e?.message || 'فشل التحصيل.' });
    } finally {
      setBusyStudent(null);
    }
  };

  const handleRemind = async (row: CollectionStatusRow) => {
    if (busyStudent) return;
    setBusyStudent(row.student_id);
    setNotice(null);
    try {
      const res = await notifyParentDuesReminder({
        studentId: row.student_id,
        groupId: row.group_id,
        studentName: row.student_name,
        groupName: row.group_name,
        monthLabel: monthLabel(monthKey),
        amount: row.amount,
        teacherName: user?.name || '',
      });
      if (res.whatsapp) setNotice({ kind: 'success', text: `تم إرسال تذكير واتساب لولي أمر ${row.student_name} (${res.parentPhone ? res.parentPhone : 'الرقم المسجل'}) ✅` });
      else if (res.pushUserId) setNotice({ kind: 'info', text: `تم إرسال إشعار داخل المنصة لحساب ولي أمر ${row.student_name} (واتساب غير متاح حاليًا).` });
      else setNotice({ kind: 'error', text: `لا يوجد رقم ولي أمر لـ ${row.student_name} — الطالب يضيفه من إعدادات حسابه أو يربط حساب ولي أمر.` });
    } catch (e: any) {
      setNotice({ kind: 'error', text: e?.message || 'فشل إرسال التذكير.' });
    } finally {
      setBusyStudent(null);
    }
  };

  /* إحصائيات التحصيل للشهر */
  const stats = useMemo(() => {
    const paid = students.filter((s) => s.paid);
    const unpaid = students.filter((s) => !s.paid);
    const collectedTotal = paid.reduce((sum, s) => sum + (s.amount || 0), 0);
    const expectedTotal = students.reduce((sum, s) => sum + (s.amount || 0), 0);
    return { paid: paid.length, unpaid: unpaid.length, collectedTotal, expectedTotal };
  }, [students]);

  const latest = rows[0];
  const gross = Number(latest?.monthly_gross_egp || 0);
  const due = Number(latest?.due_commission_egp || 0);
  const paidCommissions = rows.filter((r) => r.payment_status === 'paid').reduce((s, r) => s + Number(r.due_commission_egp || 0), 0);
  const rate = Number(latest?.tier_rate || 0);
  const status = (latest?.payment_status || 'pending') as string;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ===== الترويسة ===== */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 flex justify-between">
        <div>
          <div className="text-xs font-black text-blue-700 flex gap-2 items-center"><DollarSign className="w-4 h-4" />المستحقات المالية</div>
          <h1 className="text-2xl font-black mt-2">تحصيل الطلاب وأرباحك</h1>
          <p className="text-xs text-slate-500 mt-1">اقبض اشتراك الطلاب بالمسح أو بزر واحد — كل عملية بتتسجل في سجل الطلاب وبتوصل لولي الأمر فورًا.</p>
        </div>
        <button onClick={() => void load()} className="rounded-xl border px-3 py-2 text-xs font-bold flex gap-2 items-center h-fit"><RefreshCw className={loading ? 'animate-spin' : ''} />تحديث</button>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800 flex gap-2 items-center"><AlertCircle className="w-4 h-4" />{error}</div>}
      {notice && (
        <div className={`rounded-2xl border p-3 text-xs font-bold flex gap-2 items-center justify-between ${notice.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : notice.kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
          <span className="flex items-center gap-2">{notice.kind === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{notice.text}</span>
          <button onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ===== قسم تحصيل الطلاب (الجديد) ===== */}
      <section className="bg-white border-2 border-amber-200/70 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full"><Banknote className="w-4 h-4" />تحصيل اشتراكات الطلاب</div>
            <h2 className="text-lg font-black mt-2">سجل اشتراك شهر {monthLabel(monthKey)}</h2>
            <p className="text-xs text-slate-500 mt-0.5">اضغط «تحصيل» لتسجيل السداد فورًا — أو امسح كارت الطالب من صفحة الماسح.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                try { sessionStorage.setItem('hassty_scan_mode', 'payment'); } catch { /* noop */ }
                if (onNavigate) onNavigate('/teacher/scan');
                else window.location.href = '/teacher/scan?mode=payment';
              }}
              className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black px-4 py-2.5 flex items-center gap-2 shadow-md shadow-amber-500/20"
            >
              <QrCode className="w-4 h-4" />مسح QR للتحصيل
            </button>
            <select
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold"
            >
              {Array.from({ length: 6 }).map((_, i) => {
                const d = new Date(); d.setMonth(d.getMonth() - i);
                const key = currentMonthKey(d);
                return <option key={key} value={key}>{monthLabel(key)}</option>;
              })}
            </select>
          </div>
        </div>

        {/* شريط إحصائيات التحصيل */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MiniStat label="محصل هذا الشهر" value={`${stats.collectedTotal.toLocaleString('ar-EG')} ج.م`} tone="emerald" />
          <MiniStat label="متوقع إجمالًا" value={`${stats.expectedTotal.toLocaleString('ar-EG')} ج.م`} tone="slate" />
          <MiniStat label="سددوا" value={`${stats.paid} طالب`} tone="blue" />
          <MiniStat label="لم يسددوا" value={`${stats.unpaid} طالب`} tone={stats.unpaid > 0 ? 'amber' : 'emerald'} />
        </div>

        {loadingStudents ? (
          <div className="py-10 text-center"><Loader2 className="mx-auto animate-spin text-amber-500" /><p className="text-xs font-bold text-slate-500 mt-2">جاري قراءة سجل الطلاب...</p></div>
        ) : students.length === 0 ? (
          <div className="py-10 text-center text-slate-500">
            <Users className="mx-auto mb-2 text-slate-300 w-10 h-10" />
            <p className="font-bold text-sm">لا يوجد طلاب مقيدون في مجموعاتك بعد</p>
            <p className="text-xs mt-1">قيّد الطلاب من صفحة ماسح QR (وضع «قيد طالب») وستظهر القائمة هنا.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500">
                  <th className="p-3">الطالب</th>
                  <th className="p-3">المجموعة</th>
                  <th className="p-3">الاشتراك</th>
                  <th className="p-3">حالة {monthLabel(monthKey)}</th>
                  <th className="p-3">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((s) => (
                  <tr key={s.enrollment_id} className={`text-xs ${s.paid ? 'bg-emerald-50/40' : ''}`}>
                    <td className="p-3">
                      <div className="font-black text-slate-900">{s.student_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{s.qr_code || s.student_phone || '—'}</div>
                    </td>
                    <td className="p-3 text-slate-600 font-bold">{s.group_name}</td>
                    <td className="p-3 font-black">{s.amount.toLocaleString('ar-EG')} ج.م</td>
                    <td className="p-3">
                      {s.paid ? (
                        <Badge variant="success" size="sm">سدد ✅</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">غير مسدد</Badge>
                      )}
                      {s.paid && s.invoiceNumber && <div className="text-[9px] text-slate-400 font-mono mt-1" dir="ltr">{s.invoiceNumber}</div>}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {s.paid ? (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" />تم التحصيل</span>
                        ) : (
                          <>
                            <button
                              onClick={() => void handleCollect(s)}
                              disabled={!!busyStudent}
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {busyStudent === s.student_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Banknote className="w-3.5 h-3.5" />}
                              تحصيل
                            </button>
                            <button
                              onClick={() => void handleRemind(s)}
                              disabled={!!busyStudent}
                              title="تذكير واتساب لولي الأمر"
                              className="rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-black px-2.5 py-2 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <BellRing className="w-3.5 h-3.5" />تذكير
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===== سجل آخر التحصيلات ===== */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5">
        <div className="flex items-center gap-2 font-black mb-4"><History className="w-5 h-5 text-blue-600" />آخر عمليات التحصيل</div>
        {collectionHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">لا توجد عمليات تحصيل مسجلة بعد — أول تحصيل هيظهر هنا مع إشعار ولي الأمر.</p>
        ) : (
          <div className="space-y-2">
            {collectionHistory.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><Banknote className="w-4 h-4" /></div>
                  <div>
                    <div className="text-xs font-black text-slate-900">{h.student_name || 'طالب'}</div>
                    <div className="text-[10px] text-slate-500">{monthLabel(h.billing_period || '')} {h.method === 'qr_scan' ? '— مسح QR' : ''}</div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xs font-black text-emerald-700">{Number(h.amount || 0).toLocaleString('ar-EG')} ج.م</div>
                  <div className="text-[9px] text-slate-400 flex items-center gap-1 justify-end"><Clock className="w-2.5 h-2.5" />{h.paid_at ? new Date(h.paid_at).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== إحصائيات + عمولة المنصة (كما كانت) ===== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="الطلاب النشطون" value={activeStudentsCount} />
        <Stat label="إجمالي الشهر" value={`${gross.toLocaleString('ar-EG')} ج.م`} />
        <Stat label="عمولة المنصة" value={`${due.toLocaleString('ar-EG')} ج.م`} />
        <Stat label="نسبة العمولة" value={`${rate}%`} />
      </section>

      <section className="bg-white border rounded-3xl p-5">
        <div className="flex items-center gap-2 font-black mb-4"><TrendingUp className="w-5 h-5 text-blue-600" />الدورات المالية (عمولة المنصة)</div>
        {loading ? (
          <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-blue-600" /></div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-slate-500"><DollarSign className="mx-auto mb-2 text-slate-300" /><p className="font-bold">لا توجد دورة عمولة مسجلة بعد</p><p className="text-xs mt-1">سيظهر السجل عند إنشاء دورة مالية حقيقية.</p></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-right">
            <thead><tr className="border-b text-xs text-slate-500"><th className="p-3">الدورة</th><th className="p-3">الطلاب</th><th className="p-3">الإجمالي</th><th className="p-3">العمولة</th><th className="p-3">الحالة</th></tr></thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id} className="text-xs">
                  <td className="p-3">{new Date(r.billing_cycle).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</td>
                  <td className="p-3 font-bold">{r.active_students_count}</td>
                  <td className="p-3">{Number(r.monthly_gross_egp).toLocaleString('ar-EG')} ج.م</td>
                  <td className="p-3 font-black">{Number(r.due_commission_egp).toLocaleString('ar-EG')} ج.م</td>
                  <td className="p-3"><Badge variant={r.payment_status === 'paid' ? 'success' : r.payment_status === 'overdue' ? 'danger' : 'warning'} size="sm">{r.payment_status === 'paid' ? 'تم السداد' : r.payment_status === 'overdue' ? 'متأخر' : 'قيد التحصيل'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>
      <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
        <span>حالة الدورة الحالية: <strong className="text-slate-900">{status === 'paid' ? 'تم السداد' : status === 'overdue' ? 'متأخر' : 'قيد التحصيل'}</strong></span>
        <span>إجمالي العمولات المسددة تاريخيًا: <strong className="text-slate-900">{paidCommissions.toLocaleString('ar-EG')} ج.م</strong></span>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white border rounded-2xl p-4"><div className="text-xs text-slate-500 font-bold">{label}</div><div className="text-2xl font-black mt-2">{value}</div></div>
);

const MiniStat = ({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'slate' | 'blue' | 'amber' }) => {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
  } as const;
  return (
    <div className={`border rounded-2xl p-3.5 ${tones[tone]}`}>
      <div className="text-[10px] font-bold opacity-70">{label}</div>
      <div className="text-lg font-black mt-1">{value}</div>
    </div>
  );
};
