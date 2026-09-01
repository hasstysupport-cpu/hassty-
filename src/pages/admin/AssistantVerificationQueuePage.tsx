import React, { useEffect, useState } from 'react';
import { CheckCircle2, FileBadge, IdCard, Loader2, MessageSquareText, ShieldCheck, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props { onPendingCountChange?: (count: number) => void; }

type RequestRow = {
  id: string; assistant_id: string; status: string; id_card_path?: string | null; qualification_path?: string | null; submitted_at: string;
  assistant?: { full_name: string; phone: string; whatsapp_phone: string; governorate: string; city: string; experience_years: number; experience_summary: string; education: string; certificate_summary: string };
};

export const AssistantVerificationQueuePage: React.FC<Props> = ({ onPendingCountChange }) => {
  const [rows, setRows] = useState<RequestRow[]>([]); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState<string | null>(null); const [error, setError] = useState('');

  const load = async () => {
    if (!supabase) return setError('Supabase غير متاح.');
    setLoading(true); setError('');
    try {
      const { data: requests, error: reqError } = await supabase.from('assistant_verification_requests').select('*').order('created_at', { ascending: false });
      if (reqError) throw reqError;
      const ids = (requests || []).map((r: any) => r.assistant_id);
      let profiles: any[] = [];
      if (ids.length) { const { data } = await supabase.from('assistant_profiles').select('*').in('user_id', ids); profiles = data || []; }
      const byId = new Map(profiles.map(p => [p.user_id, p]));
      const mapped = (requests || []).map((r: any) => ({ ...r, assistant: byId.get(r.assistant_id) }));
      setRows(mapped); onPendingCountChange?.(mapped.filter((r:any) => ['pending','documents_requested','under_review'].includes(r.status)).length);
    } catch (e: any) { setError(e?.message || 'تعذر تحميل طلبات التوثيق.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); if (!supabase) return; const channel = supabase.channel('assistant-verification-admin').on('postgres_changes', { event: '*', schema: 'public', table: 'assistant_verification_requests' }, () => void load()).subscribe(); return () => { void supabase.removeChannel(channel); }; }, []);

  const notify = async (userId: string, title: string, message: string) => { await supabase?.from('notifications').insert({ user_id: userId, title, message, type: 'verification', link: '/assistant/verification' }); };

  const requestDocument = async (row: RequestRow, kind: 'id'|'qualification') => {
    if (!supabase) return; setBusy(`${row.id}:${kind}`);
    const patch = kind === 'id' ? { status: 'documents_requested', id_card_requested_at: new Date().toISOString() } : { status: 'documents_requested', qualification_requested_at: new Date().toISOString() };
    try { const { error: updateError } = await supabase.from('assistant_verification_requests').update(patch).eq('id', row.id); if (updateError) throw updateError; await notify(row.assistant_id, kind === 'id' ? 'مطلوب توثيق الهوية' : 'مطلوب المؤهل الدراسي', kind === 'id' ? 'يرجى تجهيز صورة بطاقة الهوية لاستكمال توثيق حساب المساعد.' : 'يرجى تجهيز صورة المؤهل أو الشهادة المطلوبة لاستكمال توثيق حساب المساعد.'); await load(); }
    catch (e: any) { setError(e?.message || 'تعذر إرسال طلب الوثيقة.'); } finally { setBusy(null); }
  };

  const review = async (row: RequestRow, approve: boolean) => {
    if (!supabase) return; setBusy(row.id); setError('');
    try {
      const next = approve ? 'approved' : 'rejected';
      const { error: reqError } = await supabase.from('assistant_verification_requests').update({ status: next, reviewed_at: new Date().toISOString() }).eq('id', row.id);
      if (reqError) throw reqError;
      const { error: profileError } = await supabase.from('assistant_profiles').update({ verification_status: next, is_verified: approve, approved_at: approve ? new Date().toISOString() : null }).eq('user_id', row.assistant_id);
      if (profileError) throw profileError;
      const { error: accountError } = await supabase.from('profiles').update({ account_status: approve ? 'active' : 'under_review', badge: approve ? 'verified' : 'none' }).eq('id', row.assistant_id);
      if (accountError) throw accountError;
      await notify(row.assistant_id, approve ? 'تم اعتماد حساب المساعد ✅' : 'تحديث طلب توثيق المساعد', approve ? 'تمت الموافقة على توثيق حسابك. ستصل لك خطوات الربط بالمدرس لاحقًا.' : 'لم تتم الموافقة على الطلب في صورته الحالية. راجع الإدارة لاستكمال البيانات المطلوبة.');
      await load();
    } catch (e: any) { setError(e?.message || 'تعذر تحديث حالة الطلب.'); } finally { setBusy(null); }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  return <div className="space-y-6" dir="rtl"><div><h1 className="text-2xl font-black text-[#1E3A8A] flex items-center gap-2"><ShieldCheck className="w-7 h-7 text-blue-600" /> توثيق المساعدين</h1><p className="text-sm text-slate-500 mt-1">مراجعة بيانات المساعدين وطلب البطاقة والمؤهلات قبل الاعتماد.</p></div>{error && <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold">{error}</div>}{rows.length===0 ? <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500">لا توجد طلبات توثيق حاليًا.</div> : <div className="space-y-4">{rows.map(row => <article key={row.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm"><div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5"><div className="flex-1"><div className="flex items-center gap-3 flex-wrap"><h2 className="text-lg font-black text-[#1E3A8A]">{row.assistant?.full_name || 'مساعد'}</h2><span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-black">{row.status}</span></div><div className="grid sm:grid-cols-2 gap-2 mt-3 text-sm text-slate-600"><p>📞 {row.assistant?.phone || '—'}</p><p>💬 واتساب: {row.assistant?.whatsapp_phone || '—'}</p><p>📍 {row.assistant?.governorate || '—'} — {row.assistant?.city || '—'}</p><p>🎓 {row.assistant?.education || 'لم يُذكر'}</p><p>💼 الخبرة: {row.assistant?.experience_years ?? 0} سنة</p><p>📄 {row.assistant?.certificate_summary || 'لا توجد شهادات مضافة'}</p></div>{row.assistant?.experience_summary && <p className="mt-3 p-3 rounded-2xl bg-slate-50 text-sm text-slate-600 leading-6">{row.assistant.experience_summary}</p>}</div><div className="w-full lg:w-72 space-y-2"><button disabled={!!busy} onClick={()=>requestDocument(row,'id')} className="w-full px-4 py-3 rounded-2xl border border-blue-200 bg-blue-50 text-blue-700 font-black flex items-center justify-center gap-2"><IdCard className="w-4 h-4"/>{busy===`${row.id}:id`?'جارٍ الطلب...':'طلب بطاقة الهوية'}</button><button disabled={!!busy} onClick={()=>requestDocument(row,'qualification')} className="w-full px-4 py-3 rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-black flex items-center justify-center gap-2"><FileBadge className="w-4 h-4"/>{busy===`${row.id}:qualification`?'جارٍ الطلب...':'طلب المؤهل / الشهادة'}</button><div className="grid grid-cols-2 gap-2 pt-2"><button disabled={!!busy} onClick={()=>review(row,true)} className="px-3 py-3 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4"/> اعتماد</button><button disabled={!!busy} onClick={()=>review(row,false)} className="px-3 py-3 rounded-2xl bg-red-50 text-red-700 border border-red-200 font-black flex items-center justify-center gap-1"><XCircle className="w-4 h-4"/> رفض</button></div><div className="pt-2"><a href={`https://wa.me/${String(row.assistant?.whatsapp_phone||'').replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="w-full px-4 py-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-black flex items-center justify-center gap-2"><MessageSquareText className="w-4 h-4"/> التواصل عبر واتساب</a></div></div></div></article>)}</div>}</div>;
};
