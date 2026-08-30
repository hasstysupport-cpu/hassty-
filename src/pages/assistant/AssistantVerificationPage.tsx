import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, FileBadge2, FileCheck2, IdCard, Loader2, ShieldCheck, UploadCloud, XCircle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

type VerificationRequest = {
  id: string;
  status: string;
  admin_note?: string | null;
  rejection_reason?: string | null;
  id_card_path?: string | null;
  qualification_path?: string | null;
  id_card_requested_at?: string | null;
  qualification_requested_at?: string | null;
  documents_submitted_at?: string | null;
  id_card_review_status?: string | null;
  qualification_review_status?: string | null;
  updated_at?: string;
};

type VerificationDocument = {
  id: string;
  document_type: 'id_card' | 'qualification' | 'additional';
  storage_path: string;
  original_file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  review_status: string;
  review_note?: string | null;
  uploaded_at: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

const statusLabel = (status: string) => {
  switch (status) {
    case 'approved': return 'تم التوثيق';
    case 'rejected': return 'مرفوض';
    case 'documents_requested': return 'مطلوب رفع مستندات';
    case 'under_review': return 'تحت المراجعة';
    default: return 'قيد المراجعة الأولية';
  }
};

const statusClass = (status: string) => {
  if (status === 'approved') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (status === 'rejected') return 'bg-red-50 border-red-200 text-red-700';
  if (status === 'under_review') return 'bg-blue-50 border-blue-200 text-blue-700';
  return 'bg-amber-50 border-amber-200 text-amber-700';
};

export const AssistantVerificationPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<'id_card' | 'qualification' | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    if (!supabase || !user?.uid) return;
    setLoading(true);
    setError('');
    const [{ data: req, error: reqError }, { data: docs, error: docsError }] = await Promise.all([
      supabase.from('assistant_verification_requests').select('*').eq('assistant_id', user.uid).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('assistant_verification_documents').select('*').eq('assistant_id', user.uid).order('uploaded_at', { ascending: false }),
    ]);
    if (reqError) setError(reqError.message);
    else setRequest(req);
    if (docsError) setError(prev => prev || docsError.message);
    else setDocuments(docs || []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [user?.uid]);

  const latest = useMemo(() => {
    const byType = new Map<string, VerificationDocument>();
    for (const doc of documents) if (!byType.has(doc.document_type)) byType.set(doc.document_type, doc);
    return byType;
  }, [documents]);

  const upload = async (kind: 'id_card' | 'qualification', file: File) => {
    if (!supabase || !user?.uid || !request) return;
    setNotice(''); setError('');
    if (!ALLOWED_TYPES.has(file.type)) {
      setError('نوع الملف غير مسموح. استخدم JPG أو PNG أو WEBP أو PDF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('الحد الأقصى لحجم المستند 10 ميجابايت.');
      return;
    }
    setUploading(kind);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${user.uid}/${kind}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('assistant-verification').upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { error: docError } = await supabase.from('assistant_verification_documents').insert({
        request_id: request.id,
        assistant_id: user.uid,
        document_type: kind,
        storage_path: path,
        original_file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        review_status: 'pending',
      });
      if (docError) {
        await supabase.storage.from('assistant-verification').remove([path]);
        throw docError;
      }

      await supabase.from('notifications').insert({
        user_id: user.uid,
        title: kind === 'id_card' ? 'تم رفع بطاقة الهوية' : 'تم رفع المؤهل الدراسي',
        message: 'تم استلام المستند بنجاح وسيتم مراجعته من إدارة حِصّتي.',
        type: 'verification',
        link: '/assistant/verification',
      });
      setNotice('تم رفع المستند بنجاح ✅');
      await load();
    } catch (e: any) {
      setError(e?.message || 'تعذر رفع المستند.');
    } finally {
      setUploading(null);
    }
  };

  const openDocument = async (doc: VerificationDocument) => {
    if (!supabase) return;
    setOpening(doc.id); setError('');
    try {
      const { data, error: signedError } = await supabase.storage.from('assistant-verification').createSignedUrl(doc.storage_path, 300);
      if (signedError) throw signedError;
      if (!data?.signedUrl) throw new Error('تعذر إنشاء رابط مؤقت للمستند.');
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      setError(e?.message || 'تعذر فتح المستند.');
    } finally {
      setOpening(null);
    }
  };

  const handleInput = (kind: 'id_card' | 'qualification', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void upload(kind, file);
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  const idDoc = latest.get('id_card');
  const qualificationDoc = latest.get('qualification');
  const idRequested = Boolean(request?.id_card_requested_at) || request?.id_card_review_status === 'reupload_requested';
  const qualificationRequested = Boolean(request?.qualification_requested_at) || request?.qualification_review_status === 'reupload_requested';
  const canUpload = request && request.status !== 'approved';

  return <div className="space-y-6 text-right" dir="rtl">
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-[#1E3A8A] flex items-center gap-2"><ShieldCheck className="w-7 h-7 text-blue-600" /> توثيق حساب المساعد</h1>
        <p className="mt-1 text-sm text-slate-500">تابع حالة التوثيق وارفع المستندات المطلوبة من الإدارة.</p>
      </div>
      {onNavigate && <button onClick={() => onNavigate('/assistant/dashboard')} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-black">العودة للوحة المساعد</button>}
    </div>

    {request && <div className={`rounded-3xl border p-5 ${statusClass(request.status)}`}>
      <div className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6" /><div><div className="text-xs font-black">حالة الحساب</div><div className="text-lg font-black mt-1">{statusLabel(request.status)}</div></div></div>
      {request.admin_note && <p className="mt-4 pt-4 border-t border-current/10 text-sm leading-6">ملاحظة الإدارة: {request.admin_note}</p>}
      {request.rejection_reason && <p className="mt-3 text-sm leading-6">سبب الرفض: {request.rejection_reason}</p>}
    </div>}

    {!request && <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900"><div className="font-black">لا يوجد طلب توثيق حاليًا.</div><p className="text-sm mt-2 leading-6">تم فتح هذه الصفحة للحسابات المساعدة، وسيظهر فيها طلب التوثيق بمجرد إنشائه.</p></div>}

    {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{notice}</div>}
    {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}

    <div className="grid lg:grid-cols-2 gap-5">
      <section className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-start gap-3"><div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center"><IdCard className="w-6 h-6" /></div><div><h2 className="font-black text-slate-900">بطاقة الهوية</h2><p className="text-xs text-slate-500 mt-1">صورة واضحة للوجهين عند طلب الإدارة.</p></div></div>
        <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs space-y-2"><div>الحالة: <b>{request?.id_card_review_status || (idDoc?.review_status || 'لم تُرفع')}</b></div>{idDoc?.original_file_name && <div className="truncate">الملف: <b>{idDoc.original_file_name}</b></div>}</div>
        <div className="mt-4 flex gap-2">
          {idDoc && <button disabled={opening===idDoc.id} onClick={() => void openDocument(idDoc)} className="flex-1 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 py-3 text-xs font-black flex items-center justify-center gap-2"><FileCheck2 className="w-4 h-4" />{opening===idDoc.id?'جاري الفتح...':'عرض المستند'}</button>}
          {canUpload && <label className={`flex-1 rounded-xl py-3 text-xs font-black flex items-center justify-center gap-2 cursor-pointer ${idRequested?'bg-blue-600 text-white':'border border-slate-200 bg-white text-slate-700'}`}><UploadCloud className="w-4 h-4" />{uploading==='id_card'?'جاري الرفع...':idRequested?'رفع / إعادة رفع البطاقة':'رفع البطاقة'}<input hidden type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={!!uploading} onChange={e=>handleInput('id_card',e)} /></label>}
        </div>
        {!idRequested && request?.status === 'pending' && <p className="mt-3 text-[11px] text-slate-400">انتظر طلب الإدارة قبل رفع المستند، ما لم تكن هناك ملاحظة تطلبه.</p>}
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-start gap-3"><div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center"><FileBadge2 className="w-6 h-6" /></div><div><h2 className="font-black text-slate-900">المؤهل / الشهادة</h2><p className="text-xs text-slate-500 mt-1">ارفع المؤهل أو الشهادة التي طلبتها الإدارة.</p></div></div>
        <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs space-y-2"><div>الحالة: <b>{request?.qualification_review_status || (qualificationDoc?.review_status || 'لم تُرفع')}</b></div>{qualificationDoc?.original_file_name && <div className="truncate">الملف: <b>{qualificationDoc.original_file_name}</b></div>}</div>
        <div className="mt-4 flex gap-2">
          {qualificationDoc && <button disabled={opening===qualificationDoc.id} onClick={() => void openDocument(qualificationDoc)} className="flex-1 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 py-3 text-xs font-black flex items-center justify-center gap-2"><FileCheck2 className="w-4 h-4" />{opening===qualificationDoc.id?'جاري الفتح...':'عرض المستند'}</button>}
          {canUpload && <label className={`flex-1 rounded-xl py-3 text-xs font-black flex items-center justify-center gap-2 cursor-pointer ${qualificationRequested?'bg-blue-600 text-white':'border border-slate-200 bg-white text-slate-700'}`}><UploadCloud className="w-4 h-4" />{uploading==='qualification'?'جاري الرفع...':qualificationRequested?'رفع / إعادة رفع المؤهل':'رفع المؤهل'}<input hidden type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={!!uploading} onChange={e=>handleInput('qualification',e)} /></label>}
        </div>
      </section>
    </div>

    <section className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
      <div className="flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-blue-700 mt-0.5" /><div><h3 className="font-black text-blue-950">حماية المستندات</h3><p className="mt-1 text-xs leading-6 text-blue-900/80">المستندات ترفع إلى مساحة خاصة ولا تُعرض كرابط عام. العرض يتم من خلال رابط مؤقت عند وجود صلاحية للوصول.</p><p className="mt-2 text-[11px] text-blue-900/60">لا ترفع أي مستند غير مطلوب، وتأكد أن الصورة واضحة وغير مقصوصة.</p></div></div>
    </section>

    {request?.status === 'approved' && <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900"><div className="flex items-center gap-2 font-black"><CheckCircle2 className="w-5 h-5" /> حسابك موثق بالفعل.</div><p className="text-xs mt-2 leading-6">لم تعد بحاجة لإعادة رفع المستندات إلا إذا طلبت الإدارة ذلك.</p></div>}
    {request?.status === 'rejected' && <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-900"><div className="flex items-center gap-2 font-black"><XCircle className="w-5 h-5" /> يحتاج الطلب إلى مراجعة الإدارة.</div><p className="text-xs mt-2 leading-6">راجع سبب الرفض وأعد رفع المستند المطلوب بعد تصحيح المشكلة.</p></div>}
    {(request?.status === 'pending' || request?.status === 'documents_requested' || request?.status === 'under_review') && <div className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-slate-700 font-black text-sm"><Clock3 className="w-4 h-4" />سيتم تحديث الحالة تلقائيًا بعد مراجعة الإدارة.</div></div>}
  </div>;
};
