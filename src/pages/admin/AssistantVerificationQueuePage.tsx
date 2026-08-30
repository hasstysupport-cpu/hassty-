import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, ExternalLink, FileBadge, FileCheck2, IdCard, Loader2, MessageSquareText, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props { onPendingCountChange?: (count: number) => void; }

type AssistantProfile = {
  full_name: string;
  phone: string;
  whatsapp_phone: string;
  governorate: string;
  city: string;
  experience_years: number;
  experience_summary: string;
  education: string;
  certificate_summary: string;
};

type VerificationDocument = {
  id: string;
  request_id: string;
  assistant_id: string;
  document_type: 'id_card' | 'qualification' | 'additional';
  storage_path: string;
  original_file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  review_status: string;
  review_note?: string | null;
  uploaded_at: string;
  reviewed_at?: string | null;
};

type RequestRow = {
  id: string;
  assistant_id: string;
  status: string;
  admin_note?: string | null;
  rejection_reason?: string | null;
  id_card_path?: string | null;
  qualification_path?: string | null;
  id_card_requested_at?: string | null;
  qualification_requested_at?: string | null;
  id_card_review_status?: string | null;
  qualification_review_status?: string | null;
  submitted_at: string;
  assistant?: AssistantProfile;
  documents: VerificationDocument[];
};

const formatSize = (bytes?: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'approved': return 'تم الاعتماد';
    case 'rejected': return 'مرفوض';
    case 'documents_requested': return 'مطلوب مستندات';
    case 'under_review': return 'تحت المراجعة';
    default: return 'قيد المراجعة الأولية';
  }
};

const docStatusLabel = (status?: string | null) => {
  switch (status) {
    case 'accepted': return 'مقبول';
    case 'rejected': return 'مرفوض';
    case 'reupload_requested': return 'إعادة رفع مطلوبة';
    case 'pending': return 'بانتظار المراجعة';
    default: return 'لم يُرفع';
  }
};

const latestDoc = (docs: VerificationDocument[], type: VerificationDocument['document_type']) =>
  docs.filter(d => d.document_type === type).sort((a, b) => +new Date(b.uploaded_at) - +new Date(a.uploaded_at))[0];

export const AssistantVerificationQueuePage: React.FC<Props> = ({ onPendingCountChange }) => {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    if (!supabase) return setError('Supabase غير متاح.');
    setLoading(true); setError('');
    try {
      const { data: requests, error: reqError } = await supabase.from('assistant_verification_requests').select('*').order('created_at', { ascending: false });
      if (reqError) throw reqError;
      const ids = (requests || []).map((r: any) => r.assistant_id);
      let profiles: AssistantProfile[] = [];
      let docs: VerificationDocument[] = [];
      if (ids.length) {
        const [{ data: profileRows }, { data: documentRows, error: docsError }] = await Promise.all([
          supabase.from('assistant_profiles').select('*').in('user_id', ids),
          supabase.from('assistant_verification_documents').select('*').in('assistant_id', ids).order('uploaded_at', { ascending: false }),
        ]);
        if (docsError) throw docsError;
        profiles = (profileRows || []) as AssistantProfile[];
        docs = (documentRows || []) as VerificationDocument[];
      }
      const byId = new Map(profiles.map((p: any) => [p.user_id, p]));
      const byAssistant = new Map<string, VerificationDocument[]>();
      docs.forEach(doc => byAssistant.set(doc.assistant_id, [...(byAssistant.get(doc.assistant_id) || []), doc]));
      const mapped = (requests || []).map((r: any) => ({ ...r, assistant: byId.get(r.assistant_id), documents: byAssistant.get(r.assistant_id) || [] }));
      setRows(mapped as RequestRow[]);
      onPendingCountChange?.((mapped as RequestRow[]).filter(r => ['pending', 'documents_requested', 'under_review'].includes(r.status)).length);
    } catch (e: any) {
      setError(e?.message || 'تعذر تحميل طلبات التوثيق.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    if (!supabase) return;
    const channel = supabase.channel('assistant-verification-admin-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assistant_verification_requests' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assistant_verification_documents' }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const notify = async (userId: string, title: string, message: string) => {
    await supabase?.from('notifications').insert({ user_id: userId, title, message, type: 'verification', link: '/assistant/verification' });
  };

  const requestDocument = async (row: RequestRow, kind: 'id_card' | 'qualification') => {
    if (!supabase) return;
    setBusy(`${row.id}:${kind}:request`); setError(''); setNotice('');
    try {
      const update = kind === 'id_card'
        ? { status: 'documents_requested', id_card_requested_at: new Date().toISOString(), id_card_review_status: 'reupload_requested' }
        : { status: 'documents_requested', qualification_requested_at: new Date().toISOString(), qualification_review_status: 'reupload_requested' };
      const { error: updateError } = await supabase.from('assistant_verification_requests').update(update).eq('id', row.id);
      if (updateError) throw updateError;
      await notify(row.assistant_id, kind === 'id_card' ? 'مطلوب بطاقة الهوية' : 'مطلوب المؤهل / الشهادة', kind === 'id_card'
        ? 'طلبت الإدارة رفع بطاقة هوية واضحة لاستكمال التوثيق.'
        : 'طلبت الإدارة رفع المؤهل أو الشهادة المطلوبة لاستكمال التوثيق.');
      setNotice('تم إرسال طلب المستند للمساعد ✅');
      await load();
    } catch (e: any) {
      setError(e?.message || 'تعذر إرسال الطلب.');
    } finally {
      setBusy(null);
    }
  };

  const openDocument = async (doc: VerificationDocument) => {
    if (!supabase) return;
    setBusy(`${doc.id}:open`); setError('');
    try {
      const { data, error: signedError } = await supabase.storage.from('assistant-verification').createSignedUrl(doc.storage_path, 300);
      if (signedError) throw signedError;
      if (!data?.signedUrl) throw new Error('تعذر إنشاء رابط مؤقت للمستند.');
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      setError(e?.message || 'تعذر فتح المستند.');
    } finally {
      setBusy(null);
    }
  };

  const reviewDocument = async (row: RequestRow, doc: VerificationDocument, accepted: boolean) => {
    if (!supabase) return;
    const reason = accepted ? '' : (window.prompt('اكتب سبب رفض المستند وطلب إعادة رفعه:') || '').trim();
    if (!accepted && !reason) return;
    setBusy(`${doc.id}:review`); setError(''); setNotice('');
    try {
      const reviewStatus = accepted ? 'accepted' : 'reupload_requested';
      const { error: docError } = await supabase.from('assistant_verification_documents').update({ review_status: reviewStatus, review_note: accepted ? null : reason, reviewed_at: new Date().toISOString() }).eq('id', doc.id);
      if (docError) throw docError;
      const isId = doc.document_type === 'id_card';
      const patch = isId
        ? { id_card_review_status: reviewStatus, id_card_path: accepted ? doc.storage_path : null, status: accepted ? 'under_review' : 'documents_requested' }
        : { qualification_review_status: reviewStatus, qualification_path: accepted ? doc.storage_path : null, status: accepted ? 'under_review' : 'documents_requested' };
      const { error: reqError } = await supabase.from('assistant_verification_requests').update(patch).eq('id', row.id);
      if (reqError) throw reqError;
      await notify(row.assistant_id, accepted ? 'تم قبول المستند ✅' : 'مطلوب إعادة رفع مستند', accepted
        ? `تم قبول ${isId ? 'بطاقة الهوية' : 'المؤهل / الشهادة'} بعد المراجعة.`
        : `لم يتم قبول ${isId ? 'بطاقة الهوية' : 'المؤهل / الشهادة'}: ${reason}`);
      setNotice(accepted ? 'تم اعتماد المستند ✅' : 'تم طلب إعادة رفع المستند.');
      await load();
    } catch (e: any) {
      setError(e?.message || 'تعذر تحديث المستند.');
    } finally {
      setBusy(null);
    }
  };

  const approve = async (row: RequestRow) => {
    if (!supabase) return;
    const idDoc = latestDoc(row.documents, 'id_card');
    const qualificationDoc = latestDoc(row.documents, 'qualification');
    const idAccepted = row.id_card_review_status === 'accepted' || idDoc?.review_status === 'accepted';
    const qualificationAccepted = row.qualification_review_status === 'accepted' || qualificationDoc?.review_status === 'accepted';
    if (!idAccepted || !qualificationAccepted) {
      setError('لا يمكن اعتماد الحساب قبل قبول بطاقة الهوية والمؤهل/الشهادة.');
      return;
    }
    setBusy(`${row.id}:approve`); setError(''); setNotice('');
    try {
      const now = new Date().toISOString();
      const { error: reqError } = await supabase.from('assistant_verification_requests').update({ status: 'approved', reviewed_at: now, reviewed_by: null, rejection_reason: null, admin_note: 'تمت مراجعة الهوية والمؤهلات واعتماد الحساب.' }).eq('id', row.id);
      if (reqError) throw reqError;
      const { error: profileError } = await supabase.from('assistant_profiles').update({ verification_status: 'approved', is_verified: true, approved_at: now, rejected_at: null, rejection_reason: null }).eq('user_id', row.assistant_id);
      if (profileError) throw profileError;
      const { error: accountError } = await supabase.from('profiles').update({ account_status: 'active', badge: 'verified' }).eq('id', row.assistant_id);
      if (accountError) throw accountError;
      await notify(row.assistant_id, 'تم توثيق حسابك ✅', 'تم اعتماد هويتك ومؤهلاتك. أصبح حسابك كمساعد موثقًا ويمكنك قبول دعوات المدرسين.');
      setNotice('تم اعتماد حساب المساعد بنجاح ✅');
      await load();
    } catch (e: any) {
      setError(e?.message || 'تعذر اعتماد حساب المساعد.');
    } finally {
      setBusy(null);
    }
  };

  const reject = async (row: RequestRow) => {
    if (!supabase) return;
    const reason = (window.prompt('اكتب سبب رفض طلب توثيق المساعد:') || '').trim();
    if (!reason) return;
    setBusy(`${row.id}:reject`); setError(''); setNotice('');
    try {
      const now = new Date().toISOString();
      const { error: reqError } = await supabase.from('assistant_verification_requests').update({ status: 'rejected', reviewed_at: now, rejection_reason: reason, admin_note: reason }).eq('id', row.id);
      if (reqError) throw reqError;
      const { error: profileError } = await supabase.from('assistant_profiles').update({ verification_status: 'rejected', is_verified: false, rejected_at: now, rejection_reason: reason }).eq('user_id', row.assistant_id);
      if (profileError) throw profileError;
      const { error: accountError } = await supabase.from('profiles').update({ account_status: 'under_review', badge: 'none' }).eq('id', row.assistant_id);
      if (accountError) throw accountError;
      await notify(row.assistant_id, 'تحديث طلب التوثيق', `تم رفض طلب التوثيق حاليًا. السبب: ${reason}`);
      setNotice('تم رفض الطلب وتسجيل السبب.');
      await load();
    } catch (e: any) {
      setError(e?.message || 'تعذر رفض الطلب.');
    } finally {
      setBusy(null);
    }
  };

  const pendingCount = useMemo(() => rows.filter(r => ['pending', 'documents_requested', 'under_review'].includes(r.status)).length, [rows]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return <div className="space-y-6" dir="rtl">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black text-[#1E3A8A] flex items-center gap-2"><ShieldCheck className="w-7 h-7 text-blue-600" /> توثيق المساعدين</h1>
        <p className="text-sm text-slate-500 mt-1">مراجعة الهوية والمؤهلات ثم اعتماد الحساب قبل السماح له بالانضمام لفرق المدرسين.</p>
      </div>
      <span className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black"><Clock3 className="w-4 h-4" />{pendingCount} طلب قيد المعالجة</span>
    </div>
    {notice && <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">{notice}</div>}
    {error && <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold">{error}</div>}
    {rows.length===0 ? <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500">لا توجد طلبات توثيق حاليًا.</div> : <div className="space-y-5">
      {rows.map(row => {
        const idDoc = latestDoc(row.documents, 'id_card');
        const qualificationDoc = latestDoc(row.documents, 'qualification');
        const idAccepted = row.id_card_review_status === 'accepted' || idDoc?.review_status === 'accepted';
        const qualificationAccepted = row.qualification_review_status === 'accepted' || qualificationDoc?.review_status === 'accepted';
        return <article key={row.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-black text-[#1E3A8A]">{row.assistant?.full_name || 'مساعد'}</h2>
                <span className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-black">{statusLabel(row.status)}</span>
                {idAccepted && qualificationAccepted && row.status !== 'approved' && <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black">جاهز للاعتماد</span>}
              </div>
              <div className="grid sm:grid-cols-2 gap-2 mt-3 text-sm text-slate-600">
                <p>📞 {row.assistant?.phone || '—'}</p><p>💬 واتساب: {row.assistant?.whatsapp_phone || '—'}</p>
                <p>📍 {row.assistant?.governorate || '—'} — {row.assistant?.city || '—'}</p><p>🎓 {row.assistant?.education || 'لم يُذكر'}</p>
                <p>💼 الخبرة: {row.assistant?.experience_years ?? 0} سنة</p><p>📄 {row.assistant?.certificate_summary || 'لا توجد شهادات مضافة'}</p>
              </div>
              {row.assistant?.experience_summary && <p className="mt-3 p-3 rounded-2xl bg-slate-50 text-sm text-slate-600 leading-6">{row.assistant.experience_summary}</p>}
            </div>
            <div className="w-full xl:w-80 space-y-2">
              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="text-xs font-black text-slate-500 mb-2">مستندات التوثيق</div>
                {[
                  { label: 'بطاقة الهوية', icon: IdCard, doc: idDoc, requestKind: 'id_card' as const, accepted: idAccepted, requestStatus: row.id_card_review_status },
                  { label: 'المؤهل / الشهادة', icon: FileBadge, doc: qualificationDoc, requestKind: 'qualification' as const, accepted: qualificationAccepted, requestStatus: row.qualification_review_status },
                ].map(item => <div key={item.requestKind} className="py-3 border-t first:border-t-0 border-slate-100">
                  <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-black text-slate-800"><item.icon className="w-4 h-4 text-blue-600" />{item.label}</div><span className={`text-[11px] font-black ${item.accepted?'text-emerald-700':item.requestStatus==='reupload_requested'||item.doc?.review_status==='reupload_requested'?'text-red-700':'text-slate-500'}`}>{docStatusLabel(item.requestStatus || item.doc?.review_status)}</span></div>
                  {item.doc ? <><div className="mt-2 text-[11px] text-slate-500 truncate">{item.doc.original_file_name || item.doc.storage_path} · {formatSize(item.doc.file_size)}</div><div className="grid grid-cols-3 gap-2 mt-2"><button disabled={busy===`${item.doc.id}:open`} onClick={()=>void openDocument(item.doc)} className="rounded-xl border border-blue-200 bg-blue-50 text-blue-700 py-2.5 text-[11px] font-black flex items-center justify-center gap-1"><ExternalLink className="w-3.5 h-3.5"/>عرض</button><button disabled={busy===`${item.doc.id}:review`} onClick={()=>void reviewDocument(row,item.doc,true)} className="rounded-xl bg-emerald-600 text-white py-2.5 text-[11px] font-black flex items-center justify-center gap-1"><FileCheck2 className="w-3.5 h-3.5"/>قبول</button><button disabled={busy===`${item.doc.id}:review`} onClick={()=>void reviewDocument(row,item.doc,false)} className="rounded-xl bg-red-50 border border-red-200 text-red-700 py-2.5 text-[11px] font-black flex items-center justify-center gap-1"><RotateCcw className="w-3.5 h-3.5"/>إعادة رفع</button></div></> : <button disabled={!!busy} onClick={()=>void requestDocument(row,item.requestKind)} className="mt-2 w-full rounded-xl border border-blue-200 bg-blue-50 text-blue-700 py-2.5 text-xs font-black">طلب رفع المستند</button>}
                </div>)}
              </div>
              <div className="grid grid-cols-2 gap-2"><button disabled={!!busy||row.status==='approved'} onClick={()=>void approve(row)} className="px-3 py-3 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center gap-1 disabled:opacity-50"><CheckCircle2 className="w-4 h-4"/> اعتماد الحساب</button><button disabled={!!busy||row.status==='approved'} onClick={()=>void reject(row)} className="px-3 py-3 rounded-2xl bg-red-50 text-red-700 border border-red-200 font-black flex items-center justify-center gap-1 disabled:opacity-50"><XCircle className="w-4 h-4"/> رفض الطلب</button></div>
              <a href={`https://wa.me/${String(row.assistant?.whatsapp_phone||'').replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="w-full px-4 py-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-black flex items-center justify-center gap-2"><MessageSquareText className="w-4 h-4"/> التواصل عبر واتساب</a>
            </div>
          </div>
        </article>;
      })}
    </div>}
  </div>;
};
