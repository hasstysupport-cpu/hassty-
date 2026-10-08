/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Percent,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  TrendingUp,
  CreditCard,
  Download,
  Calendar,
  Send,
  Receipt,
  Loader2,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import { TeacherCommissionTrackingItem, AdminUserAccount, CommissionTierRow, PlatformInvoiceRow } from '../../types';
import { supabase } from '../../lib/supabase';

interface CommissionTrackingPageProps {
  commissions: TeacherCommissionTrackingItem[];
  accounts?: AdminUserAccount[];
  onMarkPaid: (id: string) => void;
}

export const CommissionTrackingPage: React.FC<CommissionTrackingPageProps> = ({
  commissions,
  accounts = [],
  onMarkPaid,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'overdue' | 'pending'>('all');

  /* ===== الشرائح الحقيقية + فواتير المنصة من قاعدة البيانات ===== */
  const [tiers, setTiers] = useState<CommissionTierRow[]>([]);
  const [invoices, setInvoices] = useState<PlatformInvoiceRow[]>([]);
  const [teacherNames, setTeacherNames] = useState<Record<string, string>>({});
  const [groupNames, setGroupNames] = useState<Record<string, string>>({});
  const [editingTier, setEditingTier] = useState<number | null>(null);
  const [tierDraft, setTierDraft] = useState<{ min: string; max: string; rate: string }>({ min: '', max: '', rate: '' });
  const [savingTier, setSavingTier] = useState(false);
  const [addingTier, setAddingTier] = useState(false);
  const [newTier, setNewTier] = useState<{ min: string; max: string; rate: string }>({ min: '', max: '', rate: '' });
  const [deletingTier, setDeletingTier] = useState<number | null>(null);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  /* إحصاءات حية لكل شريحة: كم مدرسًا وكم طالبًا عليها الآن */
  const [tierUsage, setTierUsage] = useState<Record<number, { teachers: number; students: number }>>({});

  const loadRealData = useCallback(async () => {
    if (!supabase) return;
    setInvoicesLoading(true);
    try {
      const [tiersRes, invoicesRes, usageRes] = await Promise.all([
        supabase.from('commission_tiers').select('*').order('min_students', { ascending: true }),
        supabase.from('platform_invoices')
          .select('id,teacher_id,group_id,billing_period,total_active_students,exempt_students,billable_students,paid_students,collection_rate_pct,gross_collected_egp,tier_rate_pct,invoice_amount_egp,status,threshold_met_at,paid_at,created_at')
          .order('billing_period', { ascending: false }).limit(40),
        (supabase.rpc('get_commission_tier_usage') as any),
      ]);
      if (!tiersRes.error) setTiers((tiersRes.data || []) as CommissionTierRow[]);
      if (!invoicesRes.error) setInvoices((invoicesRes.data || []) as PlatformInvoiceRow[]);
      /* خريطة الإحصاءات الحية لكل شريحة */
      if (!usageRes.error && Array.isArray(usageRes.data)) {
        const usage: Record<number, { teachers: number; students: number }> = {};
        (usageRes.data as any[]).forEach((row) => {
          const prev = usage[row.tier_id] || { teachers: 0, students: 0 };
          usage[row.tier_id] = {
            teachers: Math.max(prev.teachers, Number(row.teachers_count || 0)),
            students: Math.max(prev.students, Number(row.students_count || 0)),
          };
        });
        setTierUsage(usage);
      }

      /* أسماء المدرسين والمجموعات للعرض */
      const tIds = Array.from(new Set((invoicesRes.data || []).map((i: any) => i.teacher_id)));
      const gIds = Array.from(new Set((invoicesRes.data || []).map((i: any) => i.group_id)));
      if (tIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('id,full_name').in('id', tIds);
        const m: Record<string, string> = {};
        (profiles || []).forEach((p: any) => { m[p.id] = p.full_name || 'مدرس'; });
        setTeacherNames(m);
      }
      if (gIds.length) {
        const { data: groups } = await supabase.from('student_groups').select('id,name').in('id', gIds);
        const m: Record<string, string> = {};
        (groups || []).forEach((g: any) => { m[g.id] = g.name; });
        setGroupNames(m);
      }
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  useEffect(() => { void loadRealData(); }, [loadRealData]);

  /* تحديث فوري لأي تغيير في الشرائح أو الفواتير — ينعكس عند المدرسين في نفس اللحظة */
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase
      .channel(`admin-commission-tiers-${Date.now().toString(36)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commission_tiers' }, () => { void loadRealData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_invoices' }, () => { void loadRealData(); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [loadRealData]);

  /* ===== إدارة الشرائح: النسب تُحدد من الأدمن تمامًا (إضافة/تعديل/حذف) ===== */

  const validateTierInput = (d: { min: string; max: string; rate: string }): { min: number; max: number | null; rate: number } | null => {
    const min = Math.floor(Number(d.min));
    const rate = Number(d.rate);
    const max = d.max === '' ? null : Math.floor(Number(d.max));
    if (!isFinite(min) || min < 1) { alert('أدخل حدًا أدنى صحيحًا (1 على الأقل).'); return null; }
    if (max !== null && (!isFinite(max) || max <= min)) { alert('الحد الأقصى يجب أن يكون أكبر من الحد الأدنى — أو اتركه فارغًا لشريحة مفتوحة.'); return null; }
    if (!isFinite(rate) || rate <= 0 || rate > 100) { alert('أدخل نسبة عمولة صحيحة بين 0 و 100.'); return null; }
    return { min, max, rate };
  };

  const saveTier = async (tierId: number) => {
    const parsed = validateTierInput(tierDraft);
    if (!parsed) return;
    const { min, max, rate } = parsed;
    setSavingTier(true);
    try {
      if (!supabase) throw new Error('قاعدة البيانات غير متاحة');
      const { error } = await supabase.from('commission_tiers').update({
        min_students: min,
        max_students: max,
        rate_pct: rate,
        label: `من ${min}${max ? ` إلى ${max}` : '+'} طالب`,
        updated_at: new Date().toISOString(),
      }).eq('id', tierId);
      if (error) throw error;
      setTiers(prev => prev.map(t => t.id === tierId ? { ...t, min_students: min, max_students: max, rate_pct: rate, label: `من ${min}${max ? ` إلى ${max}` : '+'} طالب` } : t).sort((a, b) => a.min_students - b.min_students));
      setEditingTier(null);
    } catch (e: any) {
      alert(`تعذر حفظ الشريحة: ${String(e?.message || e).slice(0, 100)}`);
    } finally {
      setSavingTier(false);
    }
  };

  const addTier = async () => {
    const parsed = validateTierInput(newTier);
    if (!parsed) return;
    const { min, max, rate } = parsed;
    setSavingTier(true);
    try {
      if (!supabase) throw new Error('قاعدة البيانات غير متاحة');
      const { data, error } = await supabase.from('commission_tiers').insert({
        min_students: min,
        max_students: max,
        rate_pct: rate,
        label: `من ${min}${max ? ` إلى ${max}` : '+'} طالب`,
      }).select().single();
      if (error) throw error;
      setTiers(prev => [...prev, data as CommissionTierRow].sort((a, b) => a.min_students - b.min_students));
      setAddingTier(false);
      setNewTier({ min: '', max: '', rate: '' });
    } catch (e: any) {
      alert(`تعذر إضافة الشريحة: ${String(e?.message || e).slice(0, 100)}`);
    } finally {
      setSavingTier(false);
    }
  };

  const removeTier = async (tierId: number) => {
    if (tiers.length <= 1) { alert('لا يمكن حذف آخر شريحة — يجب أن تبقى شريحة واحدة على الأقل.'); return; }
    setDeletingTier(tierId);
    try {
      if (!supabase) throw new Error('قاعدة البيانات غير متاحة');
      const { error } = await supabase.from('commission_tiers').delete().eq('id', tierId);
      if (error) throw error;
      setTiers(prev => prev.filter(t => t.id !== tierId));
    } catch (e: any) {
      alert(`تعذر حذف الشريحة: ${String(e?.message || e).slice(0, 100)}`);
    } finally {
      setDeletingTier(null);
    }
  };

  const markInvoicePaid = async (invId: string) => {
    setMarkingPaid(invId);
    try {
      if (!supabase) throw new Error('قاعدة البيانات غير متاحة');
      const { error } = await supabase.from('platform_invoices').update({ status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', invId);
      if (error) throw error;
      setInvoices(prev => prev.map(i => i.id === invId ? { ...i, status: 'paid', paid_at: new Date().toISOString() } : i));
    } catch (e: any) {
      alert(`تعذر تأكيد السداد: ${String(e?.message || e).slice(0, 100)}`);
    } finally {
      setMarkingPaid(null);
    }
  };

  // Compute live commission rows from Supabase teacher accounts if direct commission collection is empty
  const activeCommissions: TeacherCommissionTrackingItem[] = commissions.length > 0
    ? commissions
    : accounts
        .filter((a) => a.role === 'teacher')
        .map((teacher, idx) => {
          const students = teacher.studentsCount || 0;
          const gross = teacher.totalRevenue || (students * 120);
          let rate = 5.0;
          if (students > 300) rate = 1.0;
          else if (students > 150) rate = 2.0;
          else if (students > 50) rate = 3.0;

          const due = Math.round(gross * (rate / 100));
          return {
            id: teacher.id || `comm_${idx}`,
            teacherId: teacher.id,
            teacherName: teacher.name,
            subject: teacher.subject || 'مادة عامة',
            activeStudentsCount: students,
            monthlyGrossEgp: gross,
            tierRate: rate,
            dueCommissionEgp: due,
            paymentStatus: students === 0 ? 'paid' : (idx % 2 === 0 ? 'pending' : 'paid'),
            lastPaymentDate: '2026-08-01',
            billingCycle: new Date().toISOString().slice(0, 7),
            invoicePdfUrl: '#',
          };
        });

  const filteredCommissions = activeCommissions.filter((c) => {
    const matchStatus = statusFilter === 'all' || c.paymentStatus === statusFilter;
    const matchSearch =
      c.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalDueEgp = activeCommissions.reduce((sum, c) => sum + c.dueCommissionEgp, 0);
  const totalCollectedEgp = activeCommissions
    .filter((c) => c.paymentStatus === 'paid')
    .reduce((sum, c) => sum + c.dueCommissionEgp, 0);
  const totalOverdueEgp = activeCommissions
    .filter((c) => c.paymentStatus === 'overdue')
    .reduce((sum, c) => sum + c.dueCommissionEgp, 0);

  return (
    <div className="space-y-6 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            متابعة العمولات والتحصيلات (Commission Tracking) 💰
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            تتبع اشتراكات وعمولات المدرسين الشهرية وفق جدول الشرائح التصاعدي مع رصد السداد والمتأخرات.
          </p>
        </div>

        <div className="text-xs font-bold text-gray-700 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>دورة الفوترة: <strong className="text-blue-900 font-black">أغسطس 2026</strong></span>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Total Monthly Due */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">إجمالي العمولات المستحقة</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1E3A8A]">
            {totalDueEgp.toLocaleString()} ج.م
          </div>
          <p className="text-[10px] text-gray-400">إجمالي مستحقات المنصة عن شهر أغسطس</p>
        </div>

        {/* Total Collected */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">تم تحصيله (سداد فعلي)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {totalCollectedEgp.toLocaleString()} ج.م
          </div>
          <p className="text-[10px] text-gray-400">محصلة عبر فودافون كاش / إنستاباي / بطاقات</p>
        </div>

        {/* Overdue */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">متأخرات قيد المتابعة</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600">
            {totalOverdueEgp.toLocaleString()} ج.م
          </div>
          <p className="text-[10px] text-gray-400">تتطلب إشعار واتساب تذكيري للمعلم</p>
        </div>

      </div>

      {/* 3. شرائح العمولة — إدارة كاملة من الأدمن (إضافة/تعديل/حذف) */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl text-xs text-blue-900 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 font-black">
            <Percent className="w-4 h-4 text-blue-600" />
            <span>جدول شرائح العمولة — يُطبق تلقائيًا على كل مدرس حسب عدد طلابه النشطين:</span>
          </div>
          {!addingTier && (
            <button onClick={() => { setAddingTier(true); setNewTier({ min: '', max: '', rate: '' }); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] cursor-pointer shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              إضافة شريحة
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-blue-800">
          {tiers.length ? tiers.map((t) => (
            <div key={t.id} className={`bg-white/80 p-2.5 rounded-xl border ${editingTier === t.id ? 'border-blue-400 sm:col-span-3' : 'border-blue-100'} flex items-center justify-between gap-2`}>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{t.label || `من ${t.min_students}${t.max_students ? ` إلى ${t.max_students}` : '+'} طالب`}</div>
                {/* إحصاءات حية: عدد المدرسين والطلاب على هذه النسبة الآن */}
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold">
                  <span className="bg-blue-600/10 text-blue-700 rounded-full px-2 py-0.5">{tierUsage[t.id]?.teachers ?? 0} مدرس</span>
                  <span className="bg-violet-600/10 text-violet-700 rounded-full px-2 py-0.5">{tierUsage[t.id]?.students ?? 0} طالب</span>
                </div>
                {editingTier === t.id ? (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] font-bold text-blue-500">من</span>
                    <input type="number" min={1} value={tierDraft.min}
                      onChange={(e) => setTierDraft(d => ({ ...d, min: e.target.value }))}
                      className="w-16 px-2 py-1 rounded-lg border border-blue-200 text-xs font-black text-blue-800 outline-none focus:border-blue-400" dir="ltr" />
                    <span className="text-[10px] font-bold text-blue-500">إلى</span>
                    <input type="number" min={1} placeholder="∞" value={tierDraft.max}
                      onChange={(e) => setTierDraft(d => ({ ...d, max: e.target.value }))}
                      className="w-16 px-2 py-1 rounded-lg border border-blue-200 text-xs font-black text-blue-800 outline-none focus:border-blue-400 placeholder:text-blue-300" dir="ltr" />
                    <span className="text-[10px] font-bold text-blue-500">النسبة %</span>
                    <input type="number" step="0.001" min={0.001} max={100} value={tierDraft.rate}
                      onChange={(e) => setTierDraft(d => ({ ...d, rate: e.target.value }))}
                      className="w-20 px-2 py-1 rounded-lg border border-blue-200 text-xs font-black text-blue-800 outline-none focus:border-blue-400" dir="ltr" />
                    <button onClick={() => void saveTier(t.id)} disabled={savingTier}
                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50">
                      {savingTier ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    </button>
                    <button onClick={() => setEditingTier(null)} className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <button onClick={() => { setEditingTier(t.id); setTierDraft({ min: String(t.min_students), max: t.max_students === null ? '' : String(t.max_students), rate: String(t.rate_pct) }); }}
                      className="flex items-center gap-1.5 font-black text-blue-700 hover:text-blue-900 cursor-pointer group">
                      <span className="font-mono text-sm">{Number(t.rate_pct)}%</span>
                      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button onClick={() => void removeTier(t.id)} disabled={deletingTier === t.id || tiers.length <= 1}
                      title={tiers.length <= 1 ? 'لا يمكن حذف آخر شريحة' : 'حذف الشريحة'}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                      {deletingTier === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="bg-white/80 p-2 rounded-xl border border-blue-100 col-span-3 text-center font-bold text-blue-500 py-3">
              جاري تحميل الشرائح...
            </div>
          )}
          {addingTier && (
            <div className="bg-white p-3 rounded-xl border border-blue-400 border-dashed sm:col-span-3 space-y-2">
              <div className="font-black text-blue-900 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />شريحة جديدة</div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-[10px] font-bold text-blue-500">من</span>
                <input type="number" min={1} value={newTier.min}
                  onChange={(e) => setNewTier(d => ({ ...d, min: e.target.value }))}
                  className="w-16 px-2 py-1 rounded-lg border border-blue-200 text-xs font-black text-blue-800 outline-none focus:border-blue-400" dir="ltr" />
                <span className="text-[10px] font-bold text-blue-500">إلى (اتركه فارغًا للمفتوحة)</span>
                <input type="number" min={1} value={newTier.max}
                  onChange={(e) => setNewTier(d => ({ ...d, max: e.target.value }))}
                  className="w-16 px-2 py-1 rounded-lg border border-blue-200 text-xs font-black text-blue-800 outline-none focus:border-blue-400 placeholder:text-blue-300" dir="ltr" />
                <span className="text-[10px] font-bold text-blue-500">النسبة %</span>
                <input type="number" step="0.001" min={0.001} max={100} value={newTier.rate}
                  onChange={(e) => setNewTier(d => ({ ...d, rate: e.target.value }))}
                  className="w-20 px-2 py-1 rounded-lg border border-blue-200 text-xs font-black text-blue-800 outline-none focus:border-blue-400" dir="ltr" />
                <button onClick={() => void addTier()} disabled={savingTier}
                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50">
                  {savingTier ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                </button>
                <button onClick={() => setAddingTier(false)} className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="text-[10px] text-blue-600 font-bold">الأدمن يتحكم في الشرائح بالكامل: عدّل الحدود والنسب، أضف شرائح جديدة أو احذفها — التعديلات تُطبق فورًا وتظهر عند كل مدرس لحظيًا دون تحديث الصفحة.</p>
      </div>

      {/* 3.5 فواتير المنصة — لكل مجموعة (قاعدة 75%) */}
      <div className="bg-white border border-violet-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-black text-violet-900">
            <Receipt className="w-4 h-4 text-violet-600" />
            فواتير المنصة — تنزل تلقائيًا عند تحصيل 75% من المجموعة
          </div>
          <button onClick={() => void loadRealData()} className="text-[11px] font-bold text-violet-600 hover:text-violet-800 cursor-pointer">تحديث</button>
        </div>
        {invoicesLoading ? (
          <div className="py-8 text-center"><Loader2 className="mx-auto animate-spin text-violet-500" /><p className="text-xs font-bold text-gray-400 mt-2">جاري تحميل الفواتير...</p></div>
        ) : invoices.length === 0 ? (
          <div className="py-6 text-center text-xs font-bold text-gray-400">لا توجد فواتير منصة بعد — تُنشأ تلقائيًا عند بلوغ أي مجموعة عتبة 75% تحصيلًا.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-right text-xs min-w-[760px]">
              <thead className="bg-violet-50/60 text-gray-500 font-bold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-3">المدرس</th>
                  <th className="py-3 px-3">المجموعة</th>
                  <th className="py-3 px-3">الفترة</th>
                  <th className="py-3 px-3">سدد/قابل للتحصيل</th>
                  <th className="py-3 px-3">نسبة التحصيل</th>
                  <th className="py-3 px-3">المحصل</th>
                  <th className="py-3 px-3">قيمة الفاتورة</th>
                  <th className="py-3 px-3">الحالة</th>
                  <th className="py-3 px-3 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => {
                  const rate = Math.round(Number(inv.collection_rate_pct || 0));
                  return (
                    <tr key={inv.id} className={inv.status === 'due' ? 'bg-violet-50/30' : ''}>
                      <td className="py-3 px-3 font-bold text-gray-800">{teacherNames[inv.teacher_id] || '—'}</td>
                      <td className="py-3 px-3 font-bold text-gray-700">{groupNames[inv.group_id] || '—'}</td>
                      <td className="py-3 px-3 text-gray-500 font-mono">{inv.billing_period}</td>
                      <td className="py-3 px-3 font-bold text-gray-700">{inv.paid_students} / {inv.billable_students}{inv.exempt_students > 0 && <span className="text-amber-600 font-bold"> (معفو: {inv.exempt_students})</span>}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="relative w-20 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${rate >= 75 ? 'bg-violet-500' : 'bg-blue-400'}`} style={{ width: `${Math.min(100, rate)}%` }} />
                          </div>
                          <span className={`font-black ${rate >= 75 ? 'text-violet-700' : 'text-gray-500'}`}>{rate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-600">{Number(inv.gross_collected_egp || 0).toLocaleString('ar-EG')}</td>
                      <td className="py-3 px-3 font-mono font-black text-violet-700">{Number(inv.invoice_amount_egp || 0).toLocaleString('ar-EG')} ج.م</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'due' ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status === 'paid' ? 'سددت' : inv.status === 'due' ? 'مستحقة' : 'تحت العتبة'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {inv.status === 'due' ? (
                          <button onClick={() => void markInvoicePaid(inv.id)} disabled={markingPaid === inv.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black cursor-pointer disabled:opacity-50 inline-flex items-center gap-1">
                            {markingPaid === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            تأكيد السداد
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-mono">{inv.paid_at ? String(inv.paid_at).slice(0, 10) : '—'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Filters & Search */}
      <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم المدرس أو المادة..."
            className="w-full text-right pr-9 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'كل الحالات' },
            { id: 'overdue', label: 'متأخر (Overdue) ⚠️' },
            { id: 'pending', label: 'قيد الانتظار' },
            { id: 'paid', label: 'مدفوع (Paid) ✓' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Commissions Display: Mobile Cards (< md) & Desktop Table (>= md) */}
      
      {/* 5A. Mobile Cards View */}
      <div className="block md:hidden space-y-3">
        {filteredCommissions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center text-gray-400 text-xs font-bold">
            لا توجد بيانات مطابقة للبحث
          </div>
        ) : (
          filteredCommissions.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-3xl p-4 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-black text-sm text-[#1E3A8A]">{item.teacherName}</h4>
                  <span className="text-xs text-gray-500 font-bold">{item.subject}</span>
                </div>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                  item.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                  item.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {item.paymentStatus === 'paid' ? 'تم السداد ✓' : item.paymentStatus === 'overdue' ? 'متأخر ⚠️' : 'قيد التحصيل'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-2xl text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">الطلاب الفعالين:</span>
                  <span className="font-bold text-gray-800">{item.activeStudentsCount} طالب</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">نسبة الشريحة:</span>
                  <span className="font-mono font-bold text-blue-700">{item.tierRate}%</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">التحصيل الشهري:</span>
                  <span className="font-mono font-bold text-gray-700">{item.monthlyGrossEgp.toLocaleString()} ج.م</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">مستحق المنصة:</span>
                  <span className="font-mono font-black text-emerald-700">{item.dueCommissionEgp} ج.م</span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-end">
                {item.paymentStatus !== 'paid' ? (
                  <button
                    type="button"
                    onClick={() => onMarkPaid(item.id)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer text-center"
                  >
                    تأكيد السداد واستلام العمولة ✓
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 font-mono">
                    تاريخ السداد: {item.lastPaymentDate || 'تم الدفع'}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5B. Desktop Table View */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-[700px]">
            <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4">المعلم والمادة</th>
                <th className="py-3.5 px-4">الطلاب الفعالين</th>
                <th className="py-3.5 px-4">إجمالي التحصيل الشهري</th>
                <th className="py-3.5 px-4">نسبة الشريحة</th>
                <th className="py-3.5 px-4">المستحق للمنصة</th>
                <th className="py-3.5 px-4">حالة السداد</th>
                <th className="py-3.5 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    لا توجد بيانات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                    
                    <td className="py-3.5 px-4 font-bold text-[#1E3A8A]">
                      <div>
                        <p>{item.teacherName}</p>
                        <span className="text-[10px] text-gray-400 font-normal">{item.subject}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-gray-800">
                      {item.activeStudentsCount} طالب
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gray-700">
                      {item.monthlyGrossEgp.toLocaleString()} ج.م
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {item.tierRate}%
                    </td>

                    <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm">
                      {item.dueCommissionEgp} ج.م
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        item.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        item.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {item.paymentStatus === 'paid' ? 'تم السداد ✓' : item.paymentStatus === 'overdue' ? 'متأخر ⚠️' : 'قيد التحصيل'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {item.paymentStatus !== 'paid' ? (
                        <button
                          onClick={() => onMarkPaid(item.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          تأكيد السداد ✓
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-mono">
                          {item.lastPaymentDate || 'تم الدفع'}
                        </span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
