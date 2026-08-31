import React, { useEffect, useMemo, useState } from 'react';
import { Receipt, Download, Wallet, Loader2, RefreshCw, AlertCircle, CheckCircle2, Clock3 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/ui';

type Payment = {
  id: string;
  invoice_number: string;
  amount: number;
  subject: string | null;
  billing_period: string | null;
  status: 'pending' | 'paid' | 'cancelled' | 'overdue';
  paid_at: string | null;
  created_at: string;
  tutor_id: string | null;
};

const statusLabel: Record<Payment['status'], string> = {
  paid: 'تم السداد', pending: 'قيد المراجعة', overdue: 'متأخر', cancelled: 'ملغي',
};

export const StudentPaymentsPageV2: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const load = async () => {
    if (!supabase || !user?.uid) { setPayments([]); setLoading(false); return; }
    setLoading(true); setError('');
    const { data, error: queryError } = await supabase.from('payment_records').select('id,invoice_number,amount,subject,billing_period,status,paid_at,created_at,tutor_id').eq('student_id', user.uid).order('created_at', { ascending: false });
    if (queryError) setError('تعذر تحميل سجل المدفوعات من قاعدة البيانات.'); else setPayments((data || []) as Payment[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, [user?.uid]);
  useEffect(() => {
    if (!supabase || !user?.uid) return;
    const channel = supabase.channel(`student-payments-${user.uid}`).on('postgres_changes', { event: '*', schema: 'public', table: 'payment_records', filter: `student_id=eq.${user.uid}` }, () => { void load(); }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user?.uid]);
  const filtered = useMemo(() => filter === 'all' ? payments : payments.filter(p => p.subject === filter), [filter, payments]);
  const paid = payments.filter(p => p.status === 'paid').reduce((sum,p) => sum + Number(p.amount), 0);
  const pending = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum,p) => sum + Number(p.amount), 0);
  const subjects = [...new Set(payments.map(p => p.subject).filter(Boolean))] as string[];
  return <div className="space-y-4 text-right" dir="rtl">
    <section className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3"><div><h1 className="text-lg font-black text-slate-900 flex items-center gap-2"><Receipt className="w-4 h-4 text-blue-600"/>سجل المدفوعات والإيصالات</h1><p className="text-[11px] text-slate-500 mt-1">هذه البيانات تُقرأ مباشرة من قاعدة البيانات.</p></div><button onClick={()=>void load()} className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer hover:border-blue-300"><RefreshCw className={`w-3.5 h-3.5 ${loading?'animate-spin':''}`}/>تحديث</button></section>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800 text-xs font-bold flex gap-2 items-center"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-3"><StatCard label="إجمالي المدفوع" value={`${paid.toLocaleString('ar-EG')} ج.م`} tone="emerald" icon={<CheckCircle2 className="w-3.5 h-3.5"/>}/><StatCard label="المبالغ المعلقة" value={`${pending.toLocaleString('ar-EG')} ج.م`} tone="amber" icon={<Clock3 className="w-3.5 h-3.5"/>}/><StatCard label="عدد العمليات" value={payments.length} tone="blue" icon={<Wallet className="w-3.5 h-3.5"/>}/></section>
    <section className="bg-white border border-slate-200 rounded-2xl p-4"><div className="flex items-center gap-3 mb-4"><Wallet className="w-4 h-4 text-blue-600"/><select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold cursor-pointer"><option value="all">كل المواد</option>{subjects.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
      {loading ? <div className="py-10 text-center"><Loader2 className="w-7 h-7 mx-auto animate-spin text-blue-600"/></div> : filtered.length === 0 ? <div className="py-10 text-center text-slate-500"><Wallet className="w-9 h-9 mx-auto mb-2 text-slate-300"/><p className="font-bold text-sm">لا توجد مدفوعات مسجلة</p><p className="text-xs mt-1">ستظهر هنا الإيصالات بمجرد تسجيل عملية دفع حقيقية.</p></div> : <div className="overflow-x-auto"><table className="w-full text-right"><thead><tr className="border-b text-[11px] text-slate-500"><th className="p-2.5">الفاتورة</th><th className="p-2.5">المادة</th><th className="p-2.5">الفترة</th><th className="p-2.5">المبلغ</th><th className="p-2.5">التاريخ</th><th className="p-2.5">الحالة</th><th className="p-2.5">الإيصال</th></tr></thead><tbody className="divide-y">{filtered.map(p=><tr key={p.id} className="text-xs"><td className="p-2.5 font-mono font-bold text-blue-600">{p.invoice_number}</td><td className="p-2.5 font-bold">{p.subject || '—'}</td><td className="p-2.5">{p.billing_period || '—'}</td><td className="p-2.5 font-black">{Number(p.amount).toLocaleString('ar-EG')} ج.م</td><td className="p-2.5 text-slate-500">{new Date(p.paid_at || p.created_at).toLocaleDateString('ar-EG')}</td><td className="p-2.5"><Badge variant={p.status === 'paid' ? 'success' : p.status === 'overdue' ? 'error' : 'warning'} size="sm">{statusLabel[p.status]}</Badge></td><td className="p-2.5"><button onClick={()=>window.print()} className="rounded-lg bg-blue-50 text-blue-700 px-2.5 py-1.5 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer hover:bg-blue-100"><Download className="w-3 h-3"/>طباعة</button></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
};
