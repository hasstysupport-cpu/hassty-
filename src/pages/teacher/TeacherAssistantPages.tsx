import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, ClipboardCheck, Layers, MapPin, MessageCircle, Receipt, Search, Send, ShieldCheck, UserCheck, UserRoundSearch, Users } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Btn, Card, ConfirmDialog, EmptyState, ErrorBlock, LoadingBlock, PageHeader, StatCard, StatusBadge, fmtDateTime, useToast } from '../../components/common/ui';
import { getCleanAvatarUrl } from '../../lib/avatarHelper';

/* ================================================================
   فريق المساعدين — /teacher/assistants
   المساعدون المرتبطون + الدعوات المعلقة + الصلاحيات لكل مجموعة
   ================================================================ */
export const TeacherMyAssistantsPage: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { push } = useToast();
  const [team, setTeam] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [perm, setPerm] = useState<{ assistant: any; group_id: string } | null>(null);
  const [removing, setRemoving] = useState<any | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [inv, grps, asg] = await Promise.all([
        supabase.from('assistant_invitations').select('*').eq('teacher_id', user.uid).in('status', ['pending', 'accepted', 'revoked']).order('created_at', { ascending: false }),
        supabase.from('student_groups').select('id,name,subject,grade,current_count').eq('tutor_id', user.uid).order('name'),
        supabase.from('assistant_group_assignments').select('*').eq('teacher_id', user.uid).eq('is_active', true),
      ]);
      const acceptedIds = (inv.data || []).filter((i: any) => i.status === 'accepted').map((i: any) => i.assistant_id).filter(Boolean);
      const pendingList = (inv.data || []).filter((i: any) => i.status === 'pending');
      const ids = [...acceptedIds, ...pendingList.map((p: any) => p.assistant_id)].filter(Boolean);
      const { data: profiles } = ids.length ? await supabase.from('profiles').select('id,full_name,phone,avatar_url,governorate,city').in('id', Array.from(new Set(ids))) : { data: [] as any[] };
      const pmap = new Map((profiles || []).map((p: any) => [p.id, p]));
      setGroups(grps.data || []);
      setAssignments(asg.data || []);
      setTeam(acceptedIds.map((id: string) => { const inv0 = (inv.data || []).find((i: any) => i.assistant_id === id && i.status === 'accepted'); const p = pmap.get(id) || {}; return { id, ...p, invited_at: inv0?.created_at, _assignments: (asg.data || []).filter((a: any) => a.assistant_id === id) }; }));
      setInvites(pendingList.map((i: any) => ({ ...i, _profile: pmap.get(i.assistant_id) || {} })));
    } catch (e: any) { setError(e?.message || 'تعذر تحميل فريق المساعدين.'); } finally { setLoading(false); }
  }, [user?.uid]);
  useEffect(() => { void load(); }, [load]);

  const revoke = async () => {
    if (!supabase || !removing) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('assistant_invitations').update({ status: 'revoked', responded_at: new Date().toISOString() }).eq('id', removing.invite_id).eq('teacher_id', user?.uid || '');
      if (error) throw error;
      await supabase.from('assistant_group_assignments').update({ is_active: false }).eq('assistant_id', removing.id).eq('teacher_id', user?.uid || '');
      if (removing.id) await supabase.from('notifications').insert({ user_id: removing.id, title: 'تم إنهاء التعاون', message: 'قام المدرس بإنهاء تعاونك كمساعد في فريقه.', type: 'system', link: '/assistant/invitations' });
      push('success', 'تم إنهاء تعاون المساعد وإيقاف صلاحياته.');
      await load();
    } catch (e: any) { push('error', e?.message || 'تعذر تنفيذ الإجراء.'); } finally { setBusy(false); setRemoving(null); }
  };

  const savePermissions = async (permissions: { can_take_attendance: boolean; can_manage_students: boolean; can_view_payments: boolean; can_add_notes: boolean }) => {
    if (!supabase || !perm || !user?.uid) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('assistant_group_assignments').upsert({
        teacher_id: user.uid, assistant_id: perm.assistant.id, group_id: perm.group_id, ...permissions, is_active: true, assigned_at: new Date().toISOString(),
      }, { onConflict: 'assistant_id,group_id' });
      if (error) throw error;
      if (perm.assistant.id) await supabase.from('notifications').insert({ user_id: perm.assistant.id, title: 'تحديث صلاحياتك', message: 'قام المدرس بتحديث صلاحياتك على إحدى المجموعات.', type: 'system', link: '/assistant/groups' });
      push('success', 'تم حفظ الصلاحيات.');
      setPerm(null); await load();
    } catch (e: any) { push('error', e?.message || 'تعذر حفظ الصلاحيات.'); } finally { setBusy(false); }
  };

  const activeAssignmentCount = assignments.length;

  return <div className="space-y-5" dir="rtl">
    <PageHeader title="فريق المساعدين" description="المساعدون المتعاونون معك، الدعوات المعلقة، وصلاحيات كل مساعد لكل مجموعة."
      actions={<>
        <Btn variant="secondary" size="sm" onClick={() => onNavigate('/teacher/assistants/search')}><UserRoundSearch className="w-3.5 h-3.5" />البحث عن مساعدين</Btn>
        <Btn variant="ghost" size="sm" onClick={() => void load()}>تحديث</Btn>
      </>} />

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="مساعدون نشطون" value={team.length} tone="emerald" icon={<Users className="w-4 h-4" />} loading={loading} />
      <StatCard label="دعوات معلقة" value={invites.length} tone="amber" icon={<Send className="w-4 h-4" />} loading={loading} />
      <StatCard label="إسنادات مجموعات" value={activeAssignmentCount} tone="blue" icon={<Layers className="w-4 h-4" />} loading={loading} />
      <StatCard label="مجموعاتي" value={groups.length} tone="violet" icon={<Layers className="w-4 h-4" />} loading={loading} />
    </div>

    {loading ? <Card><LoadingBlock rows={3} /></Card> : error ? <Card><ErrorBlock message={error} onRetry={() => void load()} /></Card> : <>
      {/* Pending invitations */}
      {invites.length > 0 && <Card title={`دعوات بانتظار الرد (${invites.length})`}>
        <div className="space-y-2">{invites.map((i) => (
          <div key={i.id} className="p-3 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0"><span className="font-black text-xs">{i._profile?.full_name || 'مساعد'}</span><span className="text-[10px] text-slate-500 ms-2">{fmtDateTime(i.created_at)}</span></div>
            <div className="flex items-center gap-2">
              <StatusBadge status="pending" label="بانتظار رد المساعد" />
              <Btn size="sm" variant="danger" onClick={() => setRemoving({ ...i._profile, id: i.assistant_id, invite_id: i.id, name: i._profile?.full_name })}>سحب الدعوة</Btn>
            </div>
          </div>
        ))}</div>
      </Card>}

      {/* Team members */}
      {team.length === 0 ? <Card><EmptyState title="لا يوجد مساعدون في فريقك بعد" description="ابحث عن مساعدين موثقين وأرسل لهم دعوات الانضمام." icon={<Users className="w-7 h-7" />} action={<Btn size="sm" onClick={() => onNavigate('/teacher/assistants/search')}>البحث عن مساعدين</Btn>} /></Card> : (
        <div className="space-y-4">{team.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start gap-4 flex-wrap">
              <img src={getCleanAvatarUrl(a.avatar_url, 'assistant', a.full_name)} alt={a.full_name} className="w-12 h-12 rounded-2xl object-cover border border-slate-200 bg-white shrink-0" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><h3 className="font-black text-sm text-slate-900">{a.full_name || 'مساعد'}</h3><StatusBadge status="accepted" label="نشط" /></div>
                <div className="mt-1 text-[11px] text-slate-500 flex flex-wrap gap-x-3"><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.governorate || '—'} {a.city || ''}</span>{a.phone && <span className="font-mono" dir="ltr">{a.phone}</span>}<span>انضم {fmtDateTime(a.invited_at)}</span></div>
                {/* Group assignments with permissions */}
                <div className="mt-3 space-y-2">
                  {a._assignments.length === 0 && <div className="text-[11px] text-slate-400 bg-slate-50 rounded-xl p-2.5">لم يتم إسناد مجموعات لهذا المساعد بعد — المجموعات غير المسندة لن تظهر له.</div>}
                  {a._assignments.map((asg: any) => {
                    const g = groups.find((x) => x.id === asg.group_id);
                    return <div key={asg.id} className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex-wrap">
                      <div className="min-w-0"><span className="text-xs font-black">{g?.name || 'مجموعة'}</span>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {asg.can_take_attendance && <StatusBadge status="active" label="الحضور" />}
                          {asg.can_manage_students && <StatusBadge status="active" label="إدارة الطلاب" />}
                          {asg.can_view_payments && <StatusBadge status="active" label="المصروفات" />}
                          {asg.can_add_notes && <StatusBadge status="active" label="الملاحظات" />}
                        </div></div>
                      <Btn size="sm" variant="secondary" onClick={() => setPerm({ assistant: a, group_id: asg.group_id })}>تعديل الصلاحيات</Btn>
                    </div>;
                  })}
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <select onChange={async (e) => { const v = e.target.value; if (v) setPerm({ assistant: a, group_id: v }); e.target.value = ''; }} defaultValue="" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold outline-none cursor-pointer">
                    <option value="">+ إسناد مجموعة...</option>
                    {groups.filter((g) => !a._assignments.some((x: any) => x.group_id === g.id)).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <Btn size="sm" variant="danger" onClick={() => setRemoving({ ...a, invite_id: (invites.find((i) => i.assistant_id === a.id)?.id) || null, name: a.full_name })}>إنهاء التعاون</Btn>
                </div>
              </div>
            </div>
          </Card>
        ))}</div>
      )}
    </>}

    {perm && <PermissionDialog assistant={perm.assistant} groupId={perm.group_id} groupName={groups.find((g) => g.id === perm.group_id)?.name || ''} existing={assignments.find((x) => x.assistant_id === perm.assistant.id && x.group_id === perm.group_id)} busy={busy} onSave={savePermissions} onClose={() => setPerm(null)} />}
    <ConfirmDialog open={!!removing} busy={busy} tone="danger" title="إنهاء تعاون المساعد" message={`سيتم إيقاف كل صلاحيات ${removing?.name} على مجموعاتك وإبلاغه بذلك.`} confirmLabel="إنهاء التعاون" onConfirm={() => void revoke()} onCancel={() => setRemoving(null)} />
  </div>;
};

const PermissionDialog: React.FC<{ assistant: any; groupId: string; groupName: string; existing: any; busy: boolean; onSave: (p: { can_take_attendance: boolean; can_manage_students: boolean; can_view_payments: boolean; can_add_notes: boolean }) => void; onClose: () => void }> = ({ assistant, groupName, existing, busy, onSave, onClose }) => {
  const [attendance, setAttendance] = useState(existing?.can_take_attendance ?? true);
  const [manage, setManage] = useState(existing?.can_manage_students ?? false);
  const [payments, setPayments] = useState(existing?.can_view_payments ?? false);
  const [notes, setNotes] = useState(existing?.can_add_notes ?? true);
  const perms = [
    { label: 'تسجيل الحضور والانصراف', value: attendance, set: setAttendance, hint: 'استخدام ماسح QR وتسجيل الحضور' },
    { label: 'إدارة الطلاب', value: manage, set: setManage, hint: 'عرض وتعديل بيانات الطلاب' },
    { label: 'عرض المصروفات المالية', value: payments, set: setPayments, hint: 'رؤية سجلات مدفوعات المجموعة' },
    { label: 'إضافة ملاحظات', value: notes, set: setNotes, hint: 'توثيق ملاحظات سلوكية وأكاديمية' },
  ];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 my-8">
        <h3 className="text-sm font-black text-slate-900">صلاحيات {assistant.full_name || 'المساعد'}</h3>
        <p className="mt-1 text-xs text-slate-500">مجموعة: <b className="text-slate-700">{groupName}</b></p>
        <div className="mt-4 space-y-2">{perms.map((p) => (
          <button key={p.label} onClick={() => p.set(!p.value)} className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl border text-right cursor-pointer transition-colors ${p.value ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <div><div className="text-xs font-black text-slate-800">{p.label}</div><div className="text-[10px] text-slate-500 mt-0.5">{p.hint}</div></div>
            <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${p.value ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${p.value ? 'right-1' : 'right-6'}`} /></div>
          </button>
        ))}</div>
        <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 p-3 text-[10px] font-bold text-blue-800 leading-5">تُطبَّق الصلاحيات على بيانات المساعد في مساحة عمله، ويُحدد نظام RLS النفاذ الفعلي.</div>
        <div className="mt-5 flex gap-2 justify-end">
          <Btn variant="secondary" size="sm" onClick={onClose}>إلغاء</Btn>
          <Btn size="sm" disabled={busy} onClick={() => onSave({ can_take_attendance: attendance, can_manage_students: manage, can_view_payments: payments, can_add_notes: notes })}>حفظ الصلاحيات</Btn>
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   البحث عن مساعدين — /teacher/assistants/search
   (نسخة مطورة من صفحة البحث الأصلية مع فلاتر موثقة)
   ================================================================ */
export const TeacherAssistantSearchPage: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { push } = useToast();
  const [assistants, setAssistants] = useState<any[]>([]);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [minExp, setMinExp] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data, error: e } = await supabase.from('assistant_profiles').select('*').order('created_at', { ascending: false }).limit(300);
      if (e) throw e;
      setAssistants(data || []);
      const { data: inv } = await supabase.from('assistant_invitations').select('assistant_id,status').eq('teacher_id', user.uid).in('status', ['pending', 'accepted']);
      setInvited(new Set((inv || []).map((i: any) => i.assistant_id).filter(Boolean)));
    } catch (e: any) { setError(e?.message || 'تعذر تحميل قائمة المساعدين.'); } finally { setLoading(false); }
  }, [user?.uid]);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => assistants.filter((a) => {
    const hay = `${a.full_name || ''} ${a.education || ''} ${a.qualification || ''} ${a.experience_summary || ''}`.toLowerCase();
    const matchesQ = !q.trim() || hay.includes(q.trim().toLowerCase());
    const matchesLoc = !location.trim() || `${a.governorate || ''} ${a.city || ''}`.includes(location.trim());
    const matchesExp = !minExp || Number(a.experience_years || 0) >= Number(minExp);
    const matchesVerified = !verifiedOnly || (a.is_verified && a.verification_status === 'approved');
    return matchesQ && matchesLoc && matchesExp && matchesVerified;
  }), [assistants, q, location, minExp, verifiedOnly]);

  const invite = async (assistantId: string) => {
    if (!supabase || !user?.uid) return;
    setBusy(assistantId);
    try {
      const { error } = await supabase.from('assistant_invitations').insert({ teacher_id: user.uid, assistant_id: assistantId, status: 'pending', message: 'ندعوك للانضمام إلى فريق المساعدين الخاص بالمدرس على حِصّتي.' });
      if (error) throw error.code === '23505' ? new Error('توجد دعوة مرسلة لهذا المساعد بالفعل.') : error;
      await supabase.from('notifications').insert({ user_id: assistantId, title: 'دعوة من مدرس', message: 'أرسل لك مدرس دعوة للانضمام إلى فريقه كمساعد.', type: 'system', link: '/assistant/invitations' });
      setInvited((p) => new Set(p).add(assistantId));
      push('success', 'تم إرسال الدعوة للمساعد.');
    } catch (e: any) { push('error', e?.message || 'تعذر إرسال الدعوة.'); } finally { setBusy(''); }
  };

  const startChat = async (assistantId: string) => {
    if (!supabase || !user?.uid) return;
    setBusy(assistantId);
    try {
      const { data: existing } = await supabase.from('chat_threads').select('*').eq('teacher_id', user.uid).eq('assistant_id', assistantId).limit(1);
      if (existing?.[0]) { onNavigate('/teacher/messages'); return; }
      const { data, error } = await supabase.from('chat_threads').insert({ teacher_id: user.uid, assistant_id: assistantId, is_support: false }).select('*').single();
      if (error) throw error;
      onNavigate('/teacher/messages');
    } catch (e: any) { push('error', e?.message || 'تعذر بدء المحادثة.'); } finally { setBusy(''); }
  };

  return <div className="space-y-5" dir="rtl">
    <PageHeader title="البحث عن مساعدين" description="ابحث عن مساعدين حسب الموقع والخبرة والمؤهل وحالة التوثيق، ثم أرسل دعوة رسمية."
      actions={<Btn variant="secondary" size="sm" onClick={() => onNavigate('/teacher/assistants')}><ArrowRight className="w-3.5 h-3.5" />فريقي الحالي</Btn>} />

    <Card>
      <div className="grid md:grid-cols-4 gap-3">
        <div className="relative"><Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="الاسم / الخبرة / المؤهل" className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none" /></div>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="المحافظة أو المدينة" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none" />
        <select value={minExp} onChange={(e) => setMinExp(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none">
          <option value="">أي خبرة</option><option value="1">سنة+</option><option value="2">سنتان+</option><option value="3">3 سنوات+</option><option value="5">5 سنوات+</option>
        </select>
        <button onClick={() => setVerifiedOnly((v) => !v)} className={`px-3 py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer ${verifiedOnly ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}>
          <ShieldCheck className="w-4 h-4" />{verifiedOnly ? 'الموثقون فقط' : 'الكل'}
        </button>
      </div>
    </Card>

    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <StatCard label="نتائج البحث" value={filtered.length} tone="blue" icon={<UserRoundSearch className="w-4 h-4" />} loading={loading} />
      <StatCard label="دعوات مرسلة" value={invited.size} tone="amber" icon={<Send className="w-4 h-4" />} />
      <StatCard label="إجمالي المساعدين" value={assistants.length} tone="violet" icon={<Users className="w-4 h-4" />} />
    </div>

    {loading ? <Card><LoadingBlock rows={3} /></Card> : error ? <Card><ErrorBlock message={error} onRetry={() => void load()} /></Card> : filtered.length === 0 ? <Card><EmptyState title="لا يوجد مساعدون مطابقون للبحث" description="جرّب توسيع نطاق البحث أو تعطيل فلتر التوثيق." /></Card> : (
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map((a) => {
        const linked = invited.has(a.user_id);
        return <Card key={a.user_id}>
          <div className="flex items-start gap-3">
            <img src={getCleanAvatarUrl(null, 'assistant', a.full_name)} alt={a.full_name} className="w-12 h-12 rounded-2xl object-cover border border-slate-200 bg-white" referrerPolicy="no-referrer" />
            <div className="min-w-0 flex-1">
              <h3 className="font-black text-sm text-slate-900 truncate">{a.full_name || 'مساعد'}</h3>
              {a.is_verified ? <div className="text-[11px] text-emerald-700 font-black mt-1 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" />مساعد موثق</div> : <StatusBadge status={a.verification_status || 'pending'} />}
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-[11px] text-slate-600">
            <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" />{a.governorate || '—'} {a.city ? `— ${a.city}` : ''}</div>
            <div><b>المؤهل:</b> {a.education || a.qualification_summary || 'غير مذكور'}</div>
            <div><b>الخبرة:</b> {a.experience_years || 0} سنة</div>
            {a.experience_summary && <p className="leading-5 text-slate-500 line-clamp-2">{a.experience_summary}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Btn size="sm" disabled={!!busy || linked} onClick={() => void invite(a.user_id)}>{linked ? 'دعوة مرسلة' : busy === a.user_id ? 'جارٍ...' : 'إرسال دعوة'}</Btn>
            <Btn size="sm" variant="secondary" disabled={!!busy} onClick={() => void startChat(a.user_id)}><MessageCircle className="w-3.5 h-3.5" />مراسلة</Btn>
          </div>
        </Card>;
      })}</div>
    )}
  </div>;
};
