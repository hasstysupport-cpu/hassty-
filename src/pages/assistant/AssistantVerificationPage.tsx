import React, { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Clock3, FileCheck2, IdCard, RefreshCw, ShieldCheck, TriangleAlert, Upload } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { uploadUserFile, createPrivateDownloadUrl } from '../../lib/storageService';
import { Btn, Card, EmptyState, ErrorBlock, LoadingBlock, PageHeader, StatusBadge, StatCard, fmtDateTime, useToast } from '../../components/common/ui';

/* ================================================================
   توثيق حساب المساعد — /assistant/verification
   رفع الهوية والمؤهل + متابعة حالة كل مستند
   ================================================================ */
export const AssistantVerificationPage: React.FC = () => {
  const { user } = useAuth();
  const { push } = useToast();
  const [profile, setProfile] = useState<any | null>(null);
  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<'id' | 'qualification' | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [{ data: prof, error: pe }, { data: req }] = await Promise.all([
        supabase.from('assistant_profiles').select('*').eq('user_id', user.uid).maybeSingle(),
        supabase.from('assistant_verification_requests').select('*').eq('assistant_id', user.uid).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (pe) throw pe;
      setProfile(prof); setRequest(req || null);
    } catch (e: any) { setError(e?.message || 'تعذر تحميل حالة التوثيق.'); } finally { setLoading(false); }
  }, [user?.uid]);
  useEffect(() => { void load(); }, [load]);

  const uploadDoc = async (kind: 'id' | 'qualification', file: File) => {
    if (!supabase || !user?.uid) return;
    setUploading(kind); setBusy(true);
    try {
      // Upload to private education-files bucket (verification docs must not be public)
      let url: string | null = null;
      try {
        const uploaded = await uploadUserFile({ bucket: 'education-files', file, folder: `assistant-${kind}` });
        url = `education-files:${uploaded.path}`;
      } catch { url = null; }
      if (!url) url = `pending-upload://${user.uid}/${kind}/${encodeURIComponent(file.name)}`;
      const idField = kind === 'id' ? 'id_document_url' : 'qualification_document_url';
      const statusField = kind === 'id' ? 'id_document_status' : 'qualification_document_status';
      const { error: pe } = await supabase.from('assistant_profiles').update({ [idField]: url, [statusField]: 'pending', updated_at: new Date().toISOString() }).eq('user_id', user.uid);
      if (pe) throw pe;
      // keep verification request in sync
      const { data: existing } = await supabase.from('assistant_verification_requests').select('*').eq('assistant_id', user.uid).limit(1);
      if (existing?.[0]) await supabase.from('assistant_verification_requests').update({ [idField]: url, status: 'under_review', updated_at: new Date().toISOString() }).eq('id', existing[0].id);
      else await supabase.from('assistant_verification_requests').insert({ assistant_id: user.uid, [idField]: url, status: 'under_review' });
      push('success', 'تم رفع المستند وإرساله للمراجعة.');
      await load();
    } catch (e: any) { push('error', e?.message || 'تعذر رفع المستند.'); } finally { setBusy(false); setUploading(null); }
  };

  const submitForReview = async () => {
    if (!supabase || !user?.uid) return;
    if (!profile?.id_document_url || !profile?.qualification_document_url) { push('error', 'ارفع صورة الهوية والمؤهل أولًا.'); return; }
    setBusy(true);
    try {
      const { data: existing } = await supabase.from('assistant_verification_requests').select('*').eq('assistant_id', user.uid).limit(1);
      if (existing?.[0]) {
        const { error } = await supabase.from('assistant_verification_requests').update({ status: 'under_review', updated_at: new Date().toISOString() }).eq('id', existing[0].id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('assistant_verification_requests').insert({ assistant_id: user.uid, status: 'under_review', id_document_url: profile.id_document_url, qualification_document_url: profile.qualification_document_url });
        if (error) throw error;
      }
      await supabase.from('assistant_profiles').update({ verification_status: 'under_review', updated_at: new Date().toISOString() }).eq('user_id', user.uid);
      push('success', 'تم إرسال طلب التوثيق للمراجعة.');
      await load();
    } catch (e: any) { push('error', e?.message || 'تعذر إرسال الطلب.'); } finally { setBusy(false); }
  };

  const status = profile?.verification_status || request?.status || 'pending';
  const approved = status === 'approved';

  if (loading) return <div dir="rtl"><PageHeader title="توثيق حساب المساعد" /><Card><LoadingBlock rows={3} /></Card></div>;
  if (error) return <div dir="rtl"><PageHeader title="توثيق حساب المساعد" /><Card><ErrorBlock message={error} onRetry={() => void load()} /></Card></div>;

  const docs = [
    { kind: 'id' as const, title: 'صورة بطاقة الهوية', icon: <IdCard className="w-5 h-5" />, url: profile?.id_document_url, status: profile?.id_document_status || 'not_submitted', hint: 'صورة واضحة للبطاقة الشخصية (وجهان).' },
    { kind: 'qualification' as const, title: 'صورة المؤهل / الشهادة', icon: <FileCheck2 className="w-5 h-5" />, url: profile?.qualification_document_url, status: profile?.qualification_document_status || 'not_submitted', hint: 'شهادة التخرج أو مؤهل ذو صلة.' },
  ];

  return <div className="space-y-4" dir="rtl">
    <PageHeader title="توثيق حساب المساعد" description="حالة توثيق حسابك والمستندات المطلوبة. الحسابات الموثقة فقط تظهر في نتائج بحث المدرسين."
      actions={<Btn variant="secondary" size="sm" onClick={() => void load()}><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />تحديث</Btn>} />

    {/* Status banner */}
    <div className={`rounded-2xl border p-5 flex items-center gap-4 ${approved ? 'bg-emerald-50 border-emerald-200' : status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${approved ? 'bg-emerald-100 text-emerald-700' : status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
        {approved ? <BadgeCheck className="w-6 h-6" /> : status === 'rejected' ? <TriangleAlert className="w-6 h-6" /> : <Clock3 className="w-6 h-6" />}
      </div>
      <div className="min-w-0">
        <h2 className={`text-sm font-black ${approved ? 'text-emerald-900' : status === 'rejected' ? 'text-red-900' : 'text-amber-900'}`}>
          {approved ? 'حسابك موثق بالكامل ✓' : status === 'rejected' ? 'تم رفض طلب التوثيق' : status === 'under_review' ? 'طلبك تحت المراجعة' : 'أكمل توثيق حسابك'}
        </h2>
        <p className={`text-xs mt-1 leading-5 ${approved ? 'text-emerald-700' : status === 'rejected' ? 'text-red-700' : 'text-amber-700'}`}>
          {approved ? 'يمكنك الآن استقبال دعوات العمل من المدرسين الموثقين.' : status === 'rejected' ? 'راجع ملاحظات الإدارة وأعد رفع المستندات المطلوبة.' : status === 'under_review' ? 'سيقوم فريق حِصّتي بمراجعة المستندات وإبلاغك بالنتيجة.' : 'ارفع صورة الهوية والمؤهل ثم أرسل الطلب للمراجعة.'}
        </p>
        {request?.reviewed_at && <div className="mt-1 text-[10px] text-slate-500">آخر مراجعة: {fmtDateTime(request.reviewed_at)}{request.notes ? ` — ${request.notes}` : ''}</div>}
      </div>
    </div>

    <div className="grid grid-cols-3 gap-3">
      <StatCard label="المستندات المرفوعة" value={`${docs.filter((d) => d.status !== 'not_submitted').length}/2`} tone="blue" icon={<Upload className="w-4 h-4" />} />
      <StatCard label="المعتمدة" value={docs.filter((d) => d.status === 'approved').length} tone="emerald" icon={<ShieldCheck className="w-4 h-4" />} />
      <StatCard label="حالة الطلب" value={approved ? 'موثق' : status === 'rejected' ? 'مرفوض' : status === 'under_review' ? 'تحت المراجعة' : 'غير مكتمل'} tone={approved ? 'emerald' : status === 'rejected' ? 'red' : 'amber'} />
    </div>

    {/* Documents */}
    <div className="grid md:grid-cols-2 gap-4">{docs.map((doc) => (
      <Card key={doc.kind}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">{doc.icon}</div>
            <div><h3 className="font-black text-xs text-slate-800">{doc.title}</h3><p className="text-[10px] text-slate-500 mt-0.5 leading-4">{doc.hint}</p></div>
          </div>
          <StatusBadge status={doc.status} />
        </div>
        {doc.url && <button onClick={async () => {
          try {
            if (doc.url?.startsWith('education-files:')) { const signed = await createPrivateDownloadUrl('education-files', doc.url.replace('education-files:', ''), 3600); window.open(signed, '_blank'); }
            else push('info', 'المستند محفوظ وسيتم عرضه للمراجعة من الإدارة.');
          } catch { push('error', 'تعذر فتح المستند.'); }
        }} className="mt-3 inline-block text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer">عرض المستند المرفوع ←</button>}
        {doc.status === 'rejected' && <div className="mt-2 text-[10px] font-bold text-red-600">مطلوب إعادة الرفع — تأكد من وضوح الصورة.</div>}
        <label className="mt-4 block">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadDoc(doc.kind, f); e.target.value = ''; }} />
          <span className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black cursor-pointer transition-colors ${uploading === doc.kind ? 'bg-slate-100 text-slate-400 border-slate-200' : doc.status === 'approved' ? 'bg-white text-slate-600 border-slate-200 hover:border-blue-300' : 'bg-[#2563EB] text-white border-transparent hover:bg-blue-700'}`}>
            <Upload className="w-3.5 h-3.5" />{uploading === doc.kind ? 'جارٍ الرفع...' : doc.status === 'approved' ? 'إعادة رفع' : 'رفع المستند'}
          </span>
        </label>
      </Card>
    ))}</div>

    {!approved && (
      <Card title="إرسال الطلب للمراجعة">
        <p className="text-xs text-slate-500 leading-6">بعد رفع المستندات، أرسل طلبك ليراجعه فريق حِصّتي. ستصلك إشعارات بحالة كل مستند على حدة، وقد يُطلب منك إعادة رفع مستند غير واضح دون رفض الطلب بالكامل.</p>
        <div className="mt-4 flex justify-end"><Btn size="sm" disabled={busy || !docs.every((d) => d.status !== 'not_submitted') || status === 'under_review'} onClick={() => void submitForReview()}>
          {status === 'under_review' ? 'الطلب تحت المراجعة' : 'إرسال طلب التوثيق'}
        </Btn></div>
      </Card>
    )}
  </div>;
};
