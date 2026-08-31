import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, CheckCircle2, ClipboardCheck, Plus, RefreshCw, Send, Trash2, UserRound, Users, XCircle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Btn, Card, ConfirmDialog, DataTable, EmptyState, ErrorBlock, LoadingBlock, PageHeader, StatCard, StatusBadge, Tabs, fmtDate, fmtDateTime, useToast } from '../../components/common/ui';
import { getCleanAvatarUrl } from '../../lib/avatarHelper';
import { sendParentLinkRequest } from '../../lib/parentStudentService';

/* ================================================================
   إدارة الأبناء — /parent/children
   ربط الأبناء بحساب ولي الأمر + إدارة الروابط
   ================================================================ */
export const ParentChildrenPage: React.FC = () => {
  const { user } = useAuth();
  const { push } = useToast();
  const [children, setChildren] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [code, setCode] = useState('');
  const [unlink, setUnlink] = useState<any | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [{ data: links, error: e1 }, { data: reqs, error: e2 }] = await Promise.all([
        supabase.from('parent_children').select('*').eq('parent_id', user.uid).order('created_at', { ascending: false }),
        supabase.from('parent_link_requests').select('*').eq('parent_id', user.uid).order('created_at', { ascending: false }),
      ]);
      if (e1) throw e1; if (e2) throw e2;
      const ids = (links || []).map((l: any) => l.child_id).filter(Boolean);
      const { data: profiles } = ids.length ? await supabase.from('profiles').select('id,full_name,grade,avatar_url,governorate,city,qr_code').in('id', ids) : { data: [] as any[] };
      const pmap = new Map((profiles || []).map((p: any) => [p.id, p]));
      setChildren((links || []).map((l: any) => { const p = pmap.get(l.child_id) || {}; return { ...l, _profile: p, name: p.full_name || l.child_name, grade: p.grade || 'غير محدد', avatar: getCleanAvatarUrl(p.avatar_url, 'student', p.full_name || l.child_name), qr: p.qr_code || l.child_qr_code || '' }; }));
      setRequests(reqs || []);
    } catch (e: any) { setError(e?.message || 'تعذر تحميل بيانات الأبناء.'); } finally { setLoading(false); }
  }, [user?.uid]);
  useEffect(() => { void load(); }, [load]);

  const linkChild = async () => {
    if (!user || !code.trim()) { push('error', 'أدخل كود الطالب أو رقم هاتفه.'); return; }
    setBusy(true);
    try {
      const res = await sendParentLinkRequest({ uid: user.uid, name: user.name, phone: user.phone, email: user.email, avatarUrl: user.avatarUrl }, code.trim());
      if (res.success) { push('success', res.message); setAddOpen(false); setCode(''); await load(); }
      else push('error', res.message);
    } catch (e: any) { push('error', e?.message || 'تعذر إرسال طلب الربط.'); } finally { setBusy(false); }
  };

  const removeLink = async () => {
    if (!supabase || !unlink || !user?.uid) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('parent_children').delete().eq('id', unlink.id).eq('parent_id', user.uid);
      if (error) throw error;
      push('success', 'تم إلغاء ربط الحساب.');
      await load();
    } catch (e: any) { push('error', e?.message || 'تعذر إلغاء الربط.'); } finally { setBusy(false); setUnlink(null); }
  };

  const pending = requests.filter((r) => r.status === 'pending');

  return <div className="space-y-5" dir="rtl">
    <PageHeader title="إدارة الأبناء" description="ربط حسابات الأبناء بحسابك لمتابعة حضورهم ودرجاتهم ومدفوعاتهم."
      actions={<>
        <Btn variant="secondary" size="sm" onClick={() => void load()}><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />تحديث</Btn>
        <Btn size="sm" onClick={() => setAddOpen(true)}><Plus className="w-3.5 h-3.5" />ربط ابن/ابنة</Btn>
      </>} />

    <div className="grid grid-cols-3 gap-3">
      <StatCard label="أبناء مرتبطون" value={children.length} tone="emerald" icon={<Users className="w-4 h-4" />} loading={loading} />
      <StatCard label="طلبات ربط معلقة" value={pending.length} tone="amber" icon={<Send className="w-4 h-4" />} loading={loading} />
      <StatCard label="إجمالي الطلبات" value={requests.length} tone="blue" icon={<ClipboardCheck className="w-4 h-4" />} loading={loading} />
    </div>

    {pending.length > 0 && <Card title="طلبات ربط بانتظار موافقة الطالب">
      <div className="space-y-2">{pending.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-100 flex-wrap">
          <div className="min-w-0"><span className="font-black text-xs">{r.student_name || 'طالب'}</span><span className="text-[10px] text-slate-500 ms-2">كود: {r.student_code || '—'}</span></div>
          <div className="flex items-center gap-2"><StatusBadge status="pending" label="بانتظار موافقة الطالب" /><span className="text-[10px] text-slate-400">{fmtDateTime(r.created_at)}</span></div>
        </div>
      ))}</div>
    </Card>}

    {loading ? <Card><LoadingBlock rows={3} /></Card> : error ? <Card><ErrorBlock message={error} onRetry={() => void load()} /></Card> : children.length === 0 ? <Card><EmptyState title="لا يوجد أبناء مرتبطون" description="اربط حساب ابنك/ابنتك عبر كود الطالب أو رقم هاتفه المسجل." icon={<Users className="w-7 h-7" />} action={<Btn size="sm" onClick={() => setAddOpen(true)}><Plus className="w-3.5 h-3.5" />ربط ابن/ابنة</Btn>} /></Card> : (
      <div className="grid md:grid-cols-2 gap-4">{children.map((c) => (
        <Card key={c.id}>
          <div className="flex items-start gap-3">
            <img src={c.avatar} alt={c.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-200 bg-white shrink-0" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2"><h3 className="font-black text-sm text-slate-900 truncate">{c.name}</h3><StatusBadge status="active" label="مرتبط" /></div>
              <div className="mt-1 text-[11px] text-slate-500 space-y-0.5">
                <div>الصف: {c.grade}</div>
                <div>{c._profile?.governorate || '—'} {c._profile?.city || ''}</div>
                {c.qr && <div className="font-mono text-blue-700" dir="ltr">QR: {c.qr}</div>}
              </div>
              <div className="mt-3 flex gap-2"><Btn size="sm" variant="danger" onClick={() => setUnlink(c)}><Trash2 className="w-3.5 h-3.5" />إلغاء الربط</Btn></div>
            </div>
          </div>
        </Card>
      ))}</div>
    )}

    {addOpen && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
          <h3 className="text-sm font-black text-slate-900">ربط ابن/ابنة بحسابك</h3>
          <p className="mt-1.5 text-xs text-slate-500 leading-6">أدخل كود الطالب (QR) أو رقم الهاتف المسجل. سيتلقى الطالب طلب ربط للموافقة عليه من حسابه.</p>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="كود الطالب أو رقم الهاتف" className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100" />
          <div className="mt-5 flex gap-2 justify-end">
            <Btn variant="secondary" size="sm" onClick={() => setAddOpen(false)}>إلغاء</Btn>
            <Btn size="sm" disabled={busy} onClick={() => void linkChild()}>إرسال طلب الربط</Btn>
          </div>
        </div>
      </div>
    )}
    <ConfirmDialog open={!!unlink} tone="danger" busy={busy} title="إلغاء ربط الابن/الابنة" message={`سيتم إلغاء ربط ${unlink?.name} من حسابك ولن تظهر بياناته في لوحتك.`} confirmLabel="إلغاء الربط" onConfirm={() => void removeLink()} onCancel={() => setUnlink(null)} />
  </div>;
};

/* ================================================================
   طلبات تغيير المدرس — /parent/teacher-change
   ================================================================ */
export const ParentTeacherChangePage: React.FC = () => {
  const { user } = useAuth();
  const { push } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [form, setForm] = useState<{ student_id: string; subject: string; current_teacher_id: string; requested_teacher_id: string; reason: string } | null>(null);
  const [confirm, setConfirm] = useState<{ row: any; approve: boolean } | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const childIds = (await supabase.from('parent_children').select('child_id,child_name').eq('parent_id', user.uid)).data?.map((r: any) => r.child_id) || [];
      const [reqs, tchs] = await Promise.all([
        childIds.length ? supabase.from('teacher_change_requests').select('*').in('student_id', childIds).order('created_at', { ascending: false }) : Promise.resolve({ data: [] as any[] }),
        supabase.from('public_verified_teachers').select('id,name,subject,subjects,rating').limit(200),
      ]);
      setRows(reqs.data || []); setTeachers(tchs.data || []);
      const { data: links } = await supabase.from('parent_children').select('child_id,child_name').eq('parent_id', user.uid);
      setChildren(links || []);
    } catch (e: any) { setError(e?.message || 'تعذر تحميل طلبات تغيير المدرس.'); } finally { setLoading(false); }
  }, [user?.uid]);
  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    if (!supabase || !form || !user?.uid) return;
    if (!form.student_id) { push('error', 'اختر الابن/الابنة.'); return; }
    if (!form.subject.trim()) { push('error', 'حدد المادة.'); return; }
    if (!form.current_teacher_id || !form.requested_teacher_id) { push('error', 'حدد المدرس الحالي والمدرس المطلوب.'); return; }
    if (form.current_teacher_id === form.requested_teacher_id) { push('error', 'المدرس المطلوب نفس المدرس الحالي.'); return; }
    setBusy('new');
    try {
      const child = children.find((c) => c.child_id === form.student_id);
      const current = teachers.find((t) => t.id === form.current_teacher_id);
      const requested = teachers.find((t) => t.id === form.requested_teacher_id);
      const { error } = await supabase.from('teacher_change_requests').insert({
        student_id: form.student_id, student_name: child?.child_name || 'طالب', parent_id: user.uid,
        subject: form.subject.trim(), current_teacher_id: form.current_teacher_id, current_teacher_name: current?.name || 'المدرس الحالي',
        requested_teacher_id: form.requested_teacher_id, requested_teacher_name: requested?.name || 'المدرس المطلوب',
        reason: form.reason.trim() || null, status: 'pending',
      });
      if (error) throw error;
      if (form.requested_teacher_id) await supabase.from('notifications').insert({ user_id: form.requested_teacher_id, title: 'طلب انتقال طالب جديد', message: `يطلب ولي أمر الطالب ${child?.child_name || ''} الانتقال إليك في مادة ${form.subject.trim()}.`, type: 'booking', link: '/teacher/enrollment-requests' });
      push('success', 'تم إرسال طلب تغيير المدرس.');
      setForm(null); await load();
    } catch (e: any) { push('error', e?.message || 'تعذر إرسال الطلب.'); } finally { setBusy(''); }
  };

  const decide = async (row: any, approve: boolean) => {
    if (!supabase) return;
    setBusy(row.id);
    try {
      const { error } = await supabase.from('teacher_change_requests').update({ status: approve ? 'parent_approved' : 'parent_rejected', parent_decided_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', row.id);
      if (error) throw error;
      push('success', approve ? 'تمت الموافقة على طلب التغيير.' : 'تم رفض طلب التغيير.');
      await load();
    } catch (e: any) { push('error', e?.message || 'تعذر تنفيذ الإجراء.'); } finally { setBusy(''); setConfirm(null); }
  };

  const tName = (id: string) => teachers.find((t) => t.id === id)?.name || '—';

  return <div className="space-y-5" dir="rtl">
    <PageHeader title="طلبات تغيير المدرس" description="طلبات انتقال الأبناء من مدرس لآخر — تُعرض لك للموافقة أو الرفض بعد موافقة المدرس الجديد."
      actions={<>
        <Btn variant="secondary" size="sm" onClick={() => void load()}><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />تحديث</Btn>
        <Btn size="sm" onClick={() => setForm({ student_id: '', subject: '', current_teacher_id: '', requested_teacher_id: '', reason: '' })}><ArrowLeftRight className="w-3.5 h-3.5" />طلب جديد</Btn>
      </>} />

    {loading ? <Card><LoadingBlock rows={3} /></Card> : error ? <Card><ErrorBlock message={error} onRetry={() => void load()} /></Card> : rows.length === 0 ? <Card><EmptyState title="لا توجد طلبات تغيير مدرس" description="أنشئ طلبًا جديدًا عند حاجة ابنك/ابنتك للانتقال لمدرس آخر." /></Card> : (
      <div className="space-y-3">{rows.map((r) => (
        <Card key={r.id}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap"><span className="font-black text-sm">{r.student_name}</span><StatusBadge status={r.status === 'parent_approved' ? 'approved' : r.status === 'parent_rejected' ? 'rejected' : 'pending'} label={r.status === 'parent_approved' ? 'موافق عليه' : r.status === 'parent_rejected' ? 'مرفوض' : r.status === 'teacher_accepted' ? 'المدرس الجديد وافق' : r.status === 'teacher_declined' ? 'المدرس الجديد رفض' : 'قيد الانتظار'} /></div>
              <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100"><span className="text-slate-500">المادة:</span> <b>{r.subject || '—'}</b></div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100"><span className="text-slate-500">المدرس الحالي:</span> <b>{r.current_teacher_name || tName(r.current_teacher_id)}</b></div>
                <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-100"><span className="text-slate-500">المدرس المطلوب:</span> <b className="text-blue-800">{r.requested_teacher_name || tName(r.requested_teacher_id)}</b></div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100"><span className="text-slate-500">تاريخ الطلب:</span> <b>{fmtDateTime(r.requested_at || r.created_at)}</b></div>
              </div>
              {r.reason && <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100 leading-6"><b>السبب: </b>{r.reason}</div>}
            </div>
            {r.status === 'pending' && r.parent_id === user?.uid && <div className="flex gap-2 shrink-0">
              <Btn size="sm" variant="success" disabled={!!busy} onClick={() => setConfirm({ row: r, approve: true })}><CheckCircle2 className="w-3.5 h-3.5" />موافقة</Btn>
              <Btn size="sm" variant="danger" disabled={!!busy} onClick={() => setConfirm({ row: r, approve: false })}><XCircle className="w-3.5 h-3.5" />رفض</Btn>
            </div>}
          </div>
        </Card>
      ))}</div>
    )}

    {form && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" dir="rtl">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 my-8">
          <h3 className="text-sm font-black text-slate-900">طلب تغيير مدرس</h3>
          <div className="mt-4 space-y-3">
            <select value={form.student_id} onChange={(e) => setForm((p) => p ? { ...p, student_id: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none">
              <option value="">اختر الابن/الابنة...</option>{children.map((c) => <option key={c.child_id} value={c.child_id}>{c.child_name}</option>)}
            </select>
            <input value={form.subject} onChange={(e) => setForm((p) => p ? { ...p, subject: e.target.value } : p)} placeholder="المادة (مثال: رياضيات)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <select value={form.current_teacher_id} onChange={(e) => setForm((p) => p ? { ...p, current_teacher_id: e.target.value } : p)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none">
                <option value="">المدرس الحالي...</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select value={form.requested_teacher_id} onChange={(e) => setForm((p) => p ? { ...p, requested_teacher_id: e.target.value } : p)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none">
                <option value="">المدرس المطلوب...</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <textarea value={form.reason} onChange={(e) => setForm((p) => p ? { ...p, reason: e.target.value } : p)} rows={3} placeholder="سبب طلب التغيير..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none" />
          </div>
          <div className="mt-5 flex gap-2 justify-end">
            <Btn variant="secondary" size="sm" onClick={() => setForm(null)}>إلغاء</Btn>
            <Btn size="sm" disabled={busy === 'new'} onClick={() => void submit()}>إرسال الطلب</Btn>
          </div>
        </div>
      </div>
    )}
    <ConfirmDialog open={!!confirm} busy={!!busy} tone={confirm?.approve ? 'primary' : 'danger'} title={confirm?.approve ? 'الموافقة على تغيير المدرس' : 'رفض طلب التغيير'} message={confirm?.approve ? `سيتم اعتماد انتقال ${confirm?.row?.student_name} إلى ${confirm?.row?.requested_teacher_name}.` : `سيتم رفض طلب انتقال ${confirm?.row?.student_name}.`} onConfirm={() => confirm && void decide(confirm.row, confirm.approve)} onCancel={() => setConfirm(null)} />
  </div>;
};

/* ================================================================
   طلبات تحويل المجموعات — /parent/transfers
   ================================================================ */
export const ParentTransfersPage: React.FC = () => {
  const { user } = useAuth();
  const { push } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ student_id: string; to_group_id: string; reason: string } | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data: links } = await supabase.from('parent_children').select('child_id,child_name').eq('parent_id', user.uid);
      const childIds = (links || []).map((l: any) => l.child_id).filter(Boolean);
      const [reqs, grps, enrolls] = await Promise.all([
        childIds.length ? supabase.from('group_transfer_requests').select('*').in('student_id', childIds).order('created_at', { ascending: false }) : Promise.resolve({ data: [] as any[] }),
        supabase.from('student_groups').select('id,name,subject,grade,tutor_id,current_count,max_students').eq('is_active', true).limit(300),
        childIds.length ? supabase.from('group_enrollments').select('student_id,group_id,status').in('student_id', childIds) : Promise.resolve({ data: [] as any[] }),
      ]);
      setRows(reqs.data || []); setGroups(grps.data || []); setChildren(links || []); setMyEnrollments(enrolls.data || []);
    } catch (e: any) { setError(e?.message || 'تعذر تحميل طلبات التحويل.'); } finally { setLoading(false); }
  }, [user?.uid]);
  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    if (!supabase || !form || !user?.uid) return;
    if (!form.student_id) { push('error', 'اختر الابن/الابنة.'); return; }
    if (!form.to_group_id) { push('error', 'اختر المجموعة الجديدة.'); return; }
    setBusy(true);
    try {
      const child = children.find((c) => c.child_id === form.student_id);
      const current = myEnrollments.find((e) => e.student_id === form.student_id && e.status === 'active');
      const currentGroup = groups.find((g) => g.id === current?.group_id);
      const target = groups.find((g) => g.id === form.to_group_id);
      const seats = Number(target?.max_students || 0) - Number(target?.current_count || 0);
      if (seats <= 0) throw new Error('المجموعة المطلوبة ممتلئة حاليًا.');
      const { error } = await supabase.from('group_transfer_requests').insert({
        student_id: form.student_id, student_name: child?.child_name || 'طالب', parent_id: user.uid,
        from_group_id: current?.group_id || null, from_group_name: currentGroup?.name || null,
        to_group_id: form.to_group_id, to_group_name: target?.name || null,
        reason: form.reason.trim() || null, status: 'pending', requested_by: 'parent',
      });
      if (error) throw error;
      if (target?.tutor_id) await supabase.from('notifications').insert({ user_id: target.tutor_id, title: 'طلب تحويل جديد', message: `يطلب ولي أمر الطالب ${child?.child_name || ''} الانتقال إلى مجموعة ${target?.name}.`, type: 'system', link: '/teacher/transfers' });
      push('success', 'تم إرسال طلب التحويل للمدرس.');
      setForm(null); await load();
    } catch (e: any) { push('error', e?.message || 'تعذر إرسال الطلب.'); } finally { setBusy(false); }
  };

  const gName = (id: string) => groups.find((g) => g.id === id)?.name || '—';

  return <div className="space-y-5" dir="rtl">
    <PageHeader title="طلبات تحويل المجموعات" description="طلبات انتقال الأبناء بين مجموعات نفس المدرس أو مدرسين آخرين، وتُعرض للمدرس صاحب المجموعة الجديدة."
      actions={<>
        <Btn variant="secondary" size="sm" onClick={() => void load()}><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />تحديث</Btn>
        <Btn size="sm" onClick={() => setForm({ student_id: '', to_group_id: '', reason: '' })}><ArrowLeftRight className="w-3.5 h-3.5" />طلب جديد</Btn>
      </>} />

    {loading ? <Card><LoadingBlock rows={3} /></Card> : error ? <Card><ErrorBlock message={error} onRetry={() => void load()} /></Card> : rows.length === 0 ? <Card><EmptyState title="لا توجد طلبات تحويل" description="أنشئ طلب تحويل عند حاجة ابنك/ابنتك للانتقال لمجموعة أخرى." /></Card> : (
      <div className="space-y-3">{rows.map((r) => (
        <Card key={r.id}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap"><span className="font-black text-sm">{r.student_name}</span><StatusBadge status={r.status} /></div>
              <div className="mt-1.5 text-[11px] text-slate-600"><b className="text-slate-500">من:</b> {r.from_group_name || gName(r.from_group_id)} <b className="text-blue-700">← إلى:</b> {r.to_group_name || gName(r.to_group_id)}</div>
              {r.reason && <div className="mt-1 text-[11px] text-slate-500 leading-5">{r.reason}</div>}
              <div className="mt-1 text-[10px] text-slate-400">{fmtDateTime(r.created_at)}</div>
            </div>
          </div>
        </Card>
      ))}</div>
    )}

    {form && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" dir="rtl">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 my-8">
          <h3 className="text-sm font-black text-slate-900">طلب تحويل مجموعة</h3>
          <div className="mt-4 space-y-3">
            <select value={form.student_id} onChange={(e) => setForm((p) => p ? { ...p, student_id: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none">
              <option value="">اختر الابن/الابنة...</option>{children.map((c) => <option key={c.child_id} value={c.child_id}>{c.child_name}</option>)}
            </select>
            <select value={form.to_group_id} onChange={(e) => setForm((p) => p ? { ...p, to_group_id: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none">
              <option value="">اختر المجموعة الجديدة...</option>
              {groups.map((g) => { const current = myEnrollments.find((e) => e.student_id === form.student_id && e.status === 'active' && e.group_id === g.id); return current ? null : <option key={g.id} value={g.id}>{g.name} — {g.subject || 'عام'} ({g.current_count}/{g.max_students})</option>; })}
            </select>
            <textarea value={form.reason} onChange={(e) => setForm((p) => p ? { ...p, reason: e.target.value } : p)} rows={3} placeholder="سبب التحويل (اختياري)..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none" />
          </div>
          <div className="mt-5 flex gap-2 justify-end">
            <Btn variant="secondary" size="sm" onClick={() => setForm(null)}>إلغاء</Btn>
            <Btn size="sm" disabled={busy} onClick={() => void submit()}>إرسال الطلب</Btn>
          </div>
        </div>
      </div>
    )}
  </div>;
};
