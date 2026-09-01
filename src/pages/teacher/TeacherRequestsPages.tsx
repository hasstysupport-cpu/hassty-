import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, CheckCircle2, GraduationCap, ClipboardList, Phone, UserPlus, XCircle, ArrowLeftRight, RefreshCw, BellRing, UserCheck, TriangleAlert } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Btn, Card, ConfirmDialog, DataTable, EmptyState, ErrorBlock, PageHeader, StatusBadge, Tabs, fmtDateTime, useToast } from '../../components/common/ui';
import { getCleanAvatarUrl } from '../../lib/avatarHelper';

/* ================================================================
   طلبات الالتحاق (booking_requests) — قبول / رفض / إسناد لمجموعة
   ================================================================ */
export const TeacherEnrollmentRequestsPage: React.FC<{ onNavigate?: (p: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { push } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [assign, setAssign] = useState<{ request: any; groupId: string } | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [{ data: reqs, error: e1 }, { data: grps, error: e2 }] = await Promise.all([
        supabase.from('booking_requests').select('*').eq('tutor_id', user.uid).order('created_at', { ascending: false }).limit(200),
        supabase.from('student_groups').select('id,name,grade,subject,max_students,current_count').eq('tutor_id', user.uid).eq('is_active', true).order('name'),
      ]);
      if (e1) throw e1; if (e2) throw e2;
      setRows(reqs || []); setGroups(grps || []);
    } catch (e: any) { setError(e?.message || 'تعذر تحميل طلبات الالتحاق.'); } finally { setLoading(false); }
  }, [user?.uid]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!supabase || !user?.uid) return;
    const ch = supabase.channel(`enrollment-req-${user.uid}`).on('postgres_changes', { event: '*', schema: 'public', table: 'booking_requests', filter: `tutor_id=eq.${user.uid}` }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user?.uid, load]);

  const notifyStudent = async (studentId: string | null, parentPhone: string | null, title: string, message: string) => {
    try {
      const targets: string[] = [];
      if (studentId) targets.push(studentId);
      if (targets.length) await supabase?.from('notifications').insert(targets.map((uid) => ({ user_id: uid, title, message, type: 'booking', link: '/student/book' })));
    } catch { /* best effort */ }
  };

  const decide = async (req: any, approve: boolean, groupId?: string) => {
    if (!supabase || !user?.uid || busy) return;
    setBusy(req.id);
    try {
      const { error } = await supabase.from('booking_requests').update({ status: approve ? 'approved' : 'rejected', updated_at: new Date().toISOString() }).eq('id', req.id).eq('tutor_id', user.uid);
      if (error) throw error;
      if (approve && groupId && req.student_id) {
        const group = groups.find((g) => g.id === groupId);
        const seats = Number(group?.max_students || 0) - Number(group?.current_count || 0);
        if (seats <= 0) throw new Error('المجموعة المختارة ممتلئة.');
        const { error: enrollError } = await supabase.from('group_enrollments').upsert({
          group_id: groupId, student_id: req.student_id, student_name: req.student_name, student_phone: req.student_phone,
          parent_phone: req.parent_phone || null, grade: req.student_grade || req.grade || null, qr_code: null, status: 'active', payment_status: 'pending',
        }, { onConflict: 'group_id,student_id' });
        if (enrollError) throw enrollError;
        const { error: countError } = await supabase.from('student_groups').update({ current_count: Number(group?.current_count || 0) + 1, student_ids: [...((group as any).student_ids || []), req.student_id], updated_at: new Date().toISOString() }).eq('id', groupId);
        if (countError) throw countError;
      }
      await notifyStudent(req.student_id, req.parent_phone, approve ? 'تم قبول طلب الالتحاق' : 'تم رفض طلب الالتحاق', approve ? `تمت الموافقة على طلبك للانضمام إلى ${groups.find((g) => g.id === groupId)?.name || 'مجموعة المدرس'}.` : 'لم تتم الموافقة على طلب الالتحاق حاليًا.');
      push('success', approve ? 'تم قبول الطلب وإسناد الطالب للمجموعة.' : 'تم رفض الطلب.');
      await load();
    } catch (e: any) { push('error', e?.message || 'تعذر تنفيذ الإجراء.'); } finally { setBusy(''); setAssign(null); }
  };

  const byTab = useMemo(() => rows.filter((r) => tab === 'all' ? true : r.status === tab), [rows, tab]);
  const pendingCount = rows.filter((r) => r.status === 'pending').length;

  return <div className="space-y-5" dir="rtl">
    <PageHeader title="طلبات الالتحاق" description="كل طلبات الحجز والالتحاق الواردة من الطلاب وآبائهم، مع الإسناد المباشر للمجموعات." badge={`${pendingCount} قيد الانتظار`}
      actions={<Btn variant="secondary" size="sm" onClick={() => void load()}><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />تحديث</Btn>} />
    <Tabs active={tab} onChange={setTab} tabs={[
      { key: 'pending', label: 'قيد الانتظار', count: pendingCount },
      { key: 'approved', label: 'مقبولة', count: rows.filter((r) => r.status === 'approved').length },
      { key: 'rejected', label: 'مرفوضة', count: rows.filter((r) => r.status === 'rejected').length },
      { key: 'all', label: 'الكل', count: rows.length },
    ]} />
    <DataTable rows={byTab} loading={loading} error={error} onRetry={() => void load()} emptyText="لا توجد طلبات في هذا القسم"
      searchKeys={(r) => `${r.student_name || ''} ${r.student_phone || ''} ${r.subject || ''} ${r.day || ''}`}
      searchPlaceholder="ابحث باسم الطالب أو الهاتف أو المادة..."
      columns={[
        { key: 'student_name', header: 'الطالب', render: (r) => <span className="font-black">{r.student_name || '—'}</span> },
        { key: 'student_grade', header: 'الصف', render: (r) => r.student_grade || r.grade || '—', hideOnMobile: true },
        { key: 'subject', header: 'المادة', render: (r) => r.subject || '—' },
        { key: 'day', header: 'الموعد المطلوب', render: (r) => <span className="text-slate-600">{r.day || '—'} {r.time || ''}</span>, hideOnMobile: true },
        { key: 'student_phone', header: 'هاتف الطالب', render: (r) => <span className="font-mono text-[11px] text-blue-700" dir="ltr">{r.student_phone || '—'}</span>, hideOnMobile: true },
        { key: 'parent_phone', header: 'هاتف ولي الأمر', render: (r) => <span className="font-mono text-[11px] text-slate-500" dir="ltr">{r.parent_phone || '—'}</span>, hideOnMobile: true },
        { key: 'created_at', header: 'تاريخ الطلب', render: (r) => fmtDateTime(r.created_at), hideOnMobile: true },
        { key: 'status', header: 'الحالة', render: (r) => <StatusBadge status={r.status} /> },
        { key: 'actions', header: 'إجراءات', render: (r) => r.status === 'pending' ? (
          <div className="flex items-center gap-1.5">
            <Btn size="sm" variant="success" disabled={busy === r.id} onClick={() => groups.length ? setAssign({ request: r, groupId: groups[0].id }) : push('error', 'أنشئ مجموعة أولًا لإسناد الطالب.')}>
              <UserCheck className="w-3.5 h-3.5" />قبول
            </Btn>
            <Btn size="sm" variant="danger" disabled={busy === r.id} onClick={() => void decide(r, false)}>
              <XCircle className="w-3.5 h-3.5" />رفض
            </Btn>
          </div>
        ) : <span className="text-[10px] text-slate-400">تم البت في الطلب</span> },
      ]}
      mobileCard={(r) => <div className="space-y-2">
        <div className="flex items-center justify-between gap-2"><span className="font-black text-sm">{r.student_name}</span><StatusBadge status={r.status} /></div>
        <div className="text-[11px] text-slate-500">{r.subject || '—'} • {r.day || '—'} {r.time || ''}</div>
        <div className="font-mono text-[11px] text-blue-700" dir="ltr">{r.student_phone || '—'}</div>
        {r.status === 'pending' && <div className="flex gap-2 pt-1">
          <Btn size="sm" variant="success" className="flex-1" onClick={() => groups.length ? setAssign({ request: r, groupId: groups[0].id }) : push('error', 'أنشئ مجموعة أولًا.')}>قبول</Btn>
          <Btn size="sm" variant="danger" className="flex-1" onClick={() => void decide(r, false)}>رفض</Btn>
        </div>}
      </div>} />
    {/* Group assignment dialog */}
    {assign && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
          <h3 className="text-sm font-black text-slate-900">إسناد {assign.request.student_name} إلى مجموعة</h3>
          <p className="mt-1 text-xs text-slate-500 leading-6">اختر المجموعة المناسبة. سيتم تسجيل الطالب تلقائيًا وتحديث عدد المقاعد.</p>
          <select value={assign.groupId} onChange={(e) => setAssign((p) => p ? { ...p, groupId: e.target.value } : p)} className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100">
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name} — {g.subject || 'عام'} ({g.current_count}/{g.max_students} مقعد)</option>)}
          </select>
          <div className="mt-5 flex gap-2 justify-end">
            <Btn variant="secondary" size="sm" onClick={() => setAssign(null)}>إلغاء</Btn>
            <Btn variant="success" size="sm" disabled={!!busy} onClick={() => void decide(assign.request, true, assign.groupId)}>تأكيد القبول والإسناد</Btn>
          </div>
        </div>
      </div>
    )}
  </div>;
};

/* ================================================================
   طلبات التحويل بين المجموعات (group_transfer_requests)
   ================================================================ */
export const TeacherTransfersPage: React.FC = () => {
  const { user } = useAuth();
  const { push } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState<{ row: any; approve: boolean } | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data: grps, error: ge } = await supabase.from('student_groups').select('id,name,tutor_id,current_count,max_students,student_ids').eq('tutor_id', user.uid);
      if (ge) throw ge;
      setGroups(grps || []);
      const ids = (grps || []).map((g: any) => g.id);
      let reqs: any[] = [];
      if (ids.length) {
        const { data, error: te } = await supabase.from('group_transfer_requests').select('*').or(ids.map((id: string) => `to_group_id.eq.${id}`).join(',')).order('created_at', { ascending: false }).limit(200);
        if (te) throw te; reqs = data || [];
      }
      const fromIds = Array.from(new Set(reqs.map((r) => r.from_group_id).filter(Boolean)));
      if (fromIds.length) {
        const { data: fnames } = await supabase.from('student_groups').select('id,name').in('id', fromIds);
        const map = new Map((fnames || []).map((g: any) => [g.id, g.name]));
        reqs = reqs.map((r) => ({ ...r, _from_name: map.get(r.from_group_id) || r.from_group_name || '—' }));
      }
      setRows(reqs);
    } catch (e: any) { setError(e?.message || 'تعذر تحميل طلبات التحويل.'); } finally { setLoading(false); }
  }, [user?.uid]);
  useEffect(() => { void load(); }, [load]);

  const decide = async (row: any, approve: boolean) => {
    if (!supabase || !user?.uid || busy) return;
    setBusy(row.id);
    try {
      if (approve) {
        const target = groups.find((g) => g.id === row.to_group_id);
        const seats = Number(target?.max_students || 0) - Number(target?.current_count || 0);
        if (seats <= 0) throw new Error('المجموعة الهدف ممتلئة — لا يمكن إتمام التحويل.');
        if (row.student_id && row.from_group_id) {
          await supabase.from('group_enrollments').update({ status: 'transferred', updated_at: new Date().toISOString() }).eq('group_id', row.from_group_id).eq('student_id', row.student_id);
          const { data: enrollment } = await supabase.from('group_enrollments').select('*').eq('group_id', row.from_group_id).eq('student_id', row.student_id).maybeSingle();
          if (enrollment) await supabase.from('group_enrollments').upsert({ ...enrollment, id: undefined, group_id: row.to_group_id, status: 'active', enrolled_at: new Date().toISOString() }, { onConflict: 'group_id,student_id' });
          const source = groups.find((g) => g.id === row.from_group_id);
          await supabase.from('student_groups').update({ current_count: Math.max(0, Number(source?.current_count || 1) - 1) }).eq('id', row.from_group_id);
          await supabase.from('student_groups').update({ current_count: Number(target?.current_count || 0) + 1 }).eq('id', row.to_group_id);
        }
      }
      const { error } = await supabase.from('group_transfer_requests').update({ status: approve ? 'completed' : 'rejected', decided_at: new Date().toISOString(), decided_by: user.uid, updated_at: new Date().toISOString() }).eq('id', row.id);
      if (error) throw error;
      if (row.student_id) await supabase.from('notifications').insert({ user_id: row.student_id, title: approve ? 'تمت الموافقة على التحويل' : 'تم رفض طلب التحويل', message: approve ? `تم نقلك إلى ${row.to_group_name || 'المجموعة الجديدة'}.` : 'لم تتم الموافقة على طلب التحويل.', type: 'system', link: '/student/tutors' });
      push('success', approve ? 'تم تنفيذ التحويل بنجاح.' : 'تم رفض طلب التحويل.');
      await load();
    } catch (e: any) { push('error', e?.message || 'تعذر تنفيذ التحويل.'); } finally { setBusy(''); setConfirm(null); }
  };

  return <div className="space-y-5" dir="rtl">
    <PageHeader title="طلبات التحويل بين المجموعات" description="طلبات انتقال الطلاب من مجموعة إلى أخرى مع فحص المقاعد المتاحة تلقائيًا."
      actions={<Btn variant="secondary" size="sm" onClick={() => void load()}><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />تحديث</Btn>} />
    <DataTable rows={rows} loading={loading} error={error} onRetry={() => void load()} emptyText="لا توجد طلبات تحويل"
      searchKeys={(r) => `${r.student_name || ''} ${r._from_name || ''} ${r.to_group_name || ''}`}
      columns={[
        { key: 'student_name', header: 'الطالب', render: (r) => <span className="font-black">{r.student_name || '—'}</span> },
        { key: 'from', header: 'من مجموعة', render: (r) => r._from_name || '—' },
        { key: 'to', header: 'إلى مجموعة', render: (r) => <span className="text-[#2563EB] font-bold">{r.to_group_name || '—'}</span> },
        { key: 'reason', header: 'السبب', render: (r) => <span className="text-slate-500 text-[11px] leading-5 block max-w-48">{r.reason || '—'}</span>, hideOnMobile: true },
        { key: 'status', header: 'الحالة', render: (r) => <StatusBadge status={r.status} /> },
        { key: 'created_at', header: 'التاريخ', render: (r) => fmtDateTime(r.created_at), hideOnMobile: true },
        { key: 'actions', header: 'إجراءات', render: (r) => r.status === 'pending' ? (
          <div className="flex gap-1.5">
            <Btn size="sm" variant="success" disabled={!!busy} onClick={() => setConfirm({ row: r, approve: true })}><ArrowLeftRight className="w-3.5 h-3.5" />تنفيذ</Btn>
            <Btn size="sm" variant="danger" disabled={!!busy} onClick={() => setConfirm({ row: r, approve: false })}>رفض</Btn>
          </div>
        ) : <span className="text-[10px] text-slate-400">—</span> },
      ]} />
    <ConfirmDialog open={!!confirm} busy={!!busy} tone={confirm?.approve ? 'primary' : 'danger'}
      title={confirm?.approve ? 'تأكيد تنفيذ التحويل' : 'رفض طلب التحويل'}
      message={confirm?.approve ? `سيتم نقل ${confirm?.row?.student_name} إلى ${confirm?.row?.to_group_name} وتحديث المقاعد في المجموعتين.` : `سيتم رفض طلب تحويل ${confirm?.row?.student_name}.`}
      confirmLabel={confirm?.approve ? 'تنفيذ التحويل' : 'رفض نهائي'}
      onConfirm={() => confirm && void decide(confirm.row, confirm.approve)} onCancel={() => setConfirm(null)} />
  </div>;
};

/* ================================================================
   حصص التعويض (makeup_requests)
   ================================================================ */
export const TeacherMakeupPage: React.FC = () => {
  const { user } = useAuth();
  const { push } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data: groups } = await supabase.from('student_groups').select('id').eq('tutor_id', user.uid);
      const ids = (groups || []).map((g: any) => g.id);
      let studentIds: string[] = [];
      if (ids.length) { const { data: enrolls } = await supabase.from('group_enrollments').select('student_id').in('group_id', ids).eq('status', 'active'); studentIds = (enrolls || []).map((e: any) => e.student_id).filter(Boolean); }
      const [mk, att] = await Promise.all([
        studentIds.length ? supabase.from('makeup_requests').select('*').in('student_id', studentIds).order('created_at', { ascending: false }).limit(200) : Promise.resolve({ data: [] as any[] }),
        supabase.from('attendance_records').select('id,student_name,student_id,date,status,group_id').order('date', { ascending: false }).limit(500),
      ]);
      const attMap = new Map((att.data || []).map((a: any) => [a.id, a]));
      const enriched = (mk.data || []).map((r: any) => { const a = attMap.get(r.attendance_id); return { ...r, _student: r.student_id ? undefined : a?.student_name, _date: a?.date, _status: a?.status, _group: a?.group_id }; });
      setRows(enriched);
    } catch (e: any) { setError(e?.message || 'تعذر تحميل طلبات التعويض.'); } finally { setLoading(false); }
  }, [user?.uid]);
  useEffect(() => { void load(); }, [load]);

  const decide = async (row: any, approve: boolean) => {
    if (!supabase || busy) return;
    setBusy(row.id);
    try {
      const { error } = await supabase.from('makeup_requests').update({ status: approve ? 'approved' : 'rejected', updated_at: new Date().toISOString() }).eq('id', row.id);
      if (error) throw error;
      if (row.student_id) await supabase.from('notifications').insert({ user_id: row.student_id, title: approve ? 'تمت الموافقة على حصة التعويض' : 'تم رفض طلب التعويض', message: approve ? `تمت الموافقة على تعويض الحصة في ${row.target_group || 'المجموعة'}.` : 'لم تتم الموافقة على حصة التعويض.', type: 'attendance', link: '/student/attendance' });
      push('success', approve ? 'تمت الموافقة على حصة التعويض.' : 'تم رفض الطلب.');
      await load();
    } catch (e: any) { push('error', e?.message || 'تعذر تنفيذ الإجراء.'); } finally { setBusy(''); }
  };

  const byTab = useMemo(() => rows.filter((r) => tab === 'all' ? true : r.status === tab), [rows, tab]);
  return <div className="space-y-5" dir="rtl">
    <PageHeader title="حصص التعويض" description="طلبات تعويض الحصص الغيابية المقدمة من أولياء الأمور والطلاب."
      actions={<Btn variant="secondary" size="sm" onClick={() => void load()}><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />تحديث</Btn>} />
    <Tabs active={tab} onChange={setTab} tabs={[
      { key: 'pending', label: 'قيد الانتظار', count: rows.filter((r) => r.status === 'pending').length },
      { key: 'approved', label: 'معتمدة', count: rows.filter((r) => r.status === 'approved').length },
      { key: 'rejected', label: 'مرفوضة', count: rows.filter((r) => r.status === 'rejected').length },
      { key: 'all', label: 'الكل', count: rows.length },
    ]} />
    <DataTable rows={byTab} loading={loading} error={error} onRetry={() => void load()} emptyText="لا توجد طلبات تعويض"
      searchKeys={(r) => `${r._student || ''} ${r.student_id || ''} ${r.target_group || ''}`}
      columns={[
        { key: 'student', header: 'الطالب', render: (r) => <span className="font-black">{r._student || 'طالب مسجل'}</span> },
        { key: 'missed', header: 'الحصة الغيابية', render: (r) => <span className="text-slate-600 text-[11px]">{r._date || '—'} {r._status ? '• ' : ''}{r._status === 'absent' ? 'غياب' : r._status === 'late' ? 'تأخير' : ''}</span> },
        { key: 'target_group', header: 'مجموعة التعويض', render: (r) => <span className="text-[#2563EB] font-bold">{r.target_group || '—'}</span> },
        { key: 'status', header: 'الحالة', render: (r) => <StatusBadge status={r.status} /> },
        { key: 'created_at', header: 'تاريخ الطلب', render: (r) => fmtDateTime(r.created_at), hideOnMobile: true },
        { key: 'actions', header: 'إجراءات', render: (r) => r.status === 'pending' ? (
          <div className="flex gap-1.5">
            <Btn size="sm" variant="success" disabled={!!busy} onClick={() => void decide(r, true)}><GraduationCap className="w-3.5 h-3.5" />اعتماد</Btn>
            <Btn size="sm" variant="danger" disabled={!!busy} onClick={() => void decide(r, false)}>رفض</Btn>
          </div>
        ) : <span className="text-[10px] text-slate-400">—</span> },
      ]} />
  </div>;
};

/* ================================================================
   نزاعات الحضور (attendance_disputes)
   ================================================================ */
export const TeacherDisputesPage: React.FC = () => {
  const { user } = useAuth();
  const { push } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data: disputes, error: de } = await supabase.from('attendance_disputes').select('*').order('created_at', { ascending: false }).limit(200);
      if (de) throw de;
      const attIds = (disputes || []).map((d: any) => d.attendance_id).filter(Boolean);
      const [{ data: atts }, { data: students }] = await Promise.all([
        attIds.length ? supabase.from('attendance_records').select('id,student_name,date,time,status,group_id,notes').in('id', attIds) : Promise.resolve({ data: [] as any[] }),
        supabase.from('profiles').select('id,full_name').in('id', Array.from(new Set((disputes || []).map((d: any) => d.student_id).filter(Boolean)))),
      ]);
      const attMap = new Map((atts || []).map((a: any) => [a.id, a]));
      const nameMap = new Map((students || []).map((s: any) => [s.id, s.full_name]));
      setRows((disputes || []).map((d: any) => { const a = attMap.get(d.attendance_id); return { ...d, _name: d.student_id ? nameMap.get(d.student_id) || 'طالب' : a?.student_name || 'طالب', _date: a?.date, _time: a?.time, _status: a?.status }; }));
    } catch (e: any) { setError(e?.message || 'تعذر تحميل النزاعات.'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const resolve = async (row: any, approve: boolean) => {
    if (!supabase || busy) return;
    setBusy(row.id);
    try {
      const { error } = await supabase.from('attendance_disputes').update({ status: approve ? 'approved' : 'rejected', updated_at: new Date().toISOString() }).eq('id', row.id);
      if (error) throw error;
      if (approve && row.attendance_id) await supabase.from('attendance_records').update({ status: 'present', updated_at: new Date().toISOString() }).eq('id', row.attendance_id);
      if (row.student_id) await supabase.from('notifications').insert({ user_id: row.student_id, title: approve ? 'تم قبول النزاع وتصحيح الحضور' : 'تم رفض نزاع الحضور', message: approve ? 'تم تصحيح حالة الحضور إلى «حاضر» بعد مراجعة النزاع.' : 'بعد المراجعة لم يتم قبول نزاع الحضور.', type: 'attendance', link: '/student/attendance' });
      if (row.parent_id) await supabase.from('notifications').insert({ user_id: row.parent_id, title: 'نتيجة نزاع الحضور', message: approve ? 'تم قبول النزاع وتصحيح حالة الحضور.' : 'تم رفض نزاع الحضور بعد المراجعة.', type: 'attendance', link: '/parent/attendance' });
      push('success', approve ? 'تم قبول النزاع وتصحيح الحضور.' : 'تم رفض النزاع.');
      await load();
    } catch (e: any) { push('error', e?.message || 'تعذر تنفيذ الإجراء.'); } finally { setBusy(''); }
  };

  const byTab = useMemo(() => rows.filter((r) => tab === 'all' ? true : r.status === tab), [rows, tab]);
  return <div className="space-y-5" dir="rtl">
    <PageHeader title="نزاعات الحضور" description="اعتراضات أولياء الأمور والطلاب على تسجيلات الحضور، مع تصحيح الحالة تلقائيًا عند القبول." />
    <Tabs active={tab} onChange={setTab} tabs={[
      { key: 'pending', label: 'بانتظار المراجعة', count: rows.filter((r) => r.status === 'pending').length },
      { key: 'approved', label: 'مقبولة', count: rows.filter((r) => r.status === 'approved').length },
      { key: 'rejected', label: 'مرفوضة', count: rows.filter((r) => r.status === 'rejected').length },
      { key: 'all', label: 'الكل', count: rows.length },
    ]} />
    {loading ? <Card><div className="py-10 text-center text-sm text-slate-500">جاري تحميل النزاعات...</div></Card>
      : error ? <Card><ErrorBlock message={error} onRetry={() => void load()} /></Card>
      : byTab.length === 0 ? <Card><EmptyState title="لا توجد نزاعات في هذا القسم" description="ستظهر هنا الاعتراضات على الحضور فور تقديمها من أولياء الأمور." icon={<ClipboardList className="w-7 h-7" />} /></Card>
      : <div className="space-y-3">{byTab.map((r) => (
        <Card key={r.id}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm text-slate-900">{r._name}</span>
                <StatusBadge status={r._status || 'unknown'} />
                <StatusBadge status={r.status} />
              </div>
              <div className="text-[11px] text-slate-500">الحصة: {r._date || '—'} • {r._time || '—'}</div>
              <div className="text-xs text-slate-700 leading-6 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <b className="text-slate-800">سبب الاعتراض: </b>{r.reason || '—'}
                {r.notes && <><br /><span className="text-slate-500">{r.notes}</span></>}
              </div>
              <div className="text-[10px] text-slate-400">{fmtDateTime(r.created_at)}</div>
            </div>
            {r.status === 'pending' && <div className="flex gap-2 shrink-0">
              <Btn size="sm" variant="success" disabled={!!busy} onClick={() => void resolve(r, true)}><CheckCircle2 className="w-3.5 h-3.5" />قبول وتصحيح</Btn>
              <Btn size="sm" variant="danger" disabled={!!busy} onClick={() => void resolve(r, false)}><XCircle className="w-3.5 h-3.5" />رفض</Btn>
            </div>}
          </div>
        </Card>
      ))}</div>}
  </div>;
};
