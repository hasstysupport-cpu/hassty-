import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Clock3, MapPin, Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Btn, Card, ConfirmDialog, DataTable, LoadingBlock, PageHeader, StatCard, StatusBadge, fmtDate, fmtDateTime, fmtTime, useToast } from '../../components/common/ui';

interface SessionForm { id?: string; title: string; group_id: string; session_date: string; starts_at: string; ends_at: string; location: string; status: string; }

const emptyForm: SessionForm = { title: '', group_id: '', session_date: new Date().toISOString().slice(0, 10), starts_at: '', ends_at: '', location: '', status: 'scheduled' };

export const TeacherSessionsPage: React.FC = () => {
  const { user } = useAuth();
  const { push } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<SessionForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<any | null>(null);
  const [tab, setTab] = useState('all');

  const load = useCallback(async () => {
    if (!supabase || !user?.uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [{ data: sessions, error: e1 }, { data: grps, error: e2 }] = await Promise.all([
        supabase.from('lesson_sessions').select('*').eq('tutor_id', user.uid).order('starts_at', { ascending: false }).limit(300),
        supabase.from('student_groups').select('id,name,subject,grade,location,current_count,max_students').eq('tutor_id', user.uid).order('name'),
      ]);
      if (e1) throw e1; if (e2) throw e2;
      const gmap = new Map((grps || []).map((g: any) => [g.id, g]));
      setRows((sessions || []).map((s: any) => ({ ...s, _group: gmap.get(s.group_id) })));
      setGroups(grps || []);
    } catch (e: any) { setError(e?.message || 'تعذر تحميل الحصص.'); } finally { setLoading(false); }
  }, [user?.uid]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!supabase || !user?.uid) return;
    const ch = supabase.channel(`sessions-${user.uid}`).on('postgres_changes', { event: '*', schema: 'public', table: 'lesson_sessions', filter: `tutor_id=eq.${user.uid}` }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user?.uid, load]);

  const save = async () => {
    if (!supabase || !form || !user?.uid) return;
    if (!form.title.trim()) { push('error', 'عنوان الحصة مطلوب.'); return; }
    if (!form.group_id) { push('error', 'اختر المجموعة المرتبطة بالحصة.'); return; }
    if (!form.session_date || !form.starts_at || !form.ends_at) { push('error', 'حدد تاريخ ووقت بداية ونهاية الحصة.'); return; }
    setSaving(true);
    try {
      const starts = new Date(`${form.session_date}T${form.starts_at}`).toISOString();
      const ends = new Date(`${form.session_date}T${form.ends_at}`).toISOString();
      const payload = { tutor_id: user.uid, group_id: form.group_id, title: form.title.trim(), subject: groups.find((g) => g.id === form.group_id)?.subject || null, session_date: form.session_date, starts_at: starts, ends_at: ends, location: form.location.trim() || groups.find((g) => g.id === form.group_id)?.location || null, status: form.status, updated_at: new Date().toISOString() };
      const { error } = form.id ? await supabase.from('lesson_sessions').update(payload).eq('id', form.id).eq('tutor_id', user.uid) : await supabase.from('lesson_sessions').insert(payload);
      if (error) throw error;
      // Sync to calendar events for the group's students
      const group = groups.find((g) => g.id === form.group_id);
      if (group && !form.id) {
        const { data: enrolls } = await supabase.from('group_enrollments').select('student_id').eq('group_id', group.id).eq('status', 'active');
        const ids = (enrolls || []).map((e: any) => e.student_id).filter(Boolean);
        if (ids.length) await supabase.from('calendar_events').insert(ids.map((uid: string) => ({ user_id: uid, title: `حصة: ${form.title.trim()}`, event_type: 'lesson', starts_at: starts, ends_at: ends, link: '/student/calendar' })));
      }
      push('success', form.id ? 'تم تحديث الحصة.' : 'تم إنشاء الحصة وإضافتها لتقويم الطلاب.');
      setForm(null);
      await load();
    } catch (e: any) { push('error', e?.message || 'تعذر حفظ الحصة.'); } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!supabase || !del) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('lesson_sessions').delete().eq('id', del.id).eq('tutor_id', user?.uid || '');
      if (error) throw error;
      push('success', 'تم حذف الحصة.');
      await load();
    } catch (e: any) { push('error', e?.message || 'تعذر حذف الحصة.'); } finally { setSaving(false); setDel(null); }
  };

  const today = new Date().toISOString().slice(0, 10);
  const byTab = useMemo(() => rows.filter((r) => {
    if (tab === 'today') return r.session_date === today;
    if (tab === 'upcoming') return r.starts_at && new Date(r.starts_at) >= new Date();
    if (tab === 'completed') return r.status === 'completed';
    if (tab === 'cancelled') return r.status === 'cancelled';
    return true;
  }), [rows, tab, today]);

  const openEdit = (row: any) => setForm({ id: row.id, title: row.title || '', group_id: row.group_id || '', session_date: (row.session_date || '').slice(0, 10), starts_at: row.starts_at ? new Date(row.starts_at).toTimeString().slice(0, 5) : '', ends_at: row.ends_at ? new Date(row.ends_at).toTimeString().slice(0, 5) : '', location: row.location || '', status: row.status || 'scheduled' });

  return <div className="space-y-5" dir="rtl">
    <PageHeader title="الحصص والدروس" description="جدولة الحصص وربطها بالمجموعات، مع مزامنة تلقائية لتقويم الطلاب وولاة الأمور."
      actions={<>
        <Btn variant="secondary" size="sm" onClick={() => void load()}><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />تحديث</Btn>
        <Btn size="sm" onClick={() => setForm({ ...emptyForm })}><Plus className="w-3.5 h-3.5" />حصة جديدة</Btn>
      </>} />

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="حصص اليوم" value={rows.filter((r) => r.session_date === today).length} tone="blue" icon={<CalendarPlus className="w-4 h-4" />} loading={loading} />
      <StatCard label="حصص قادمة" value={rows.filter((r) => r.starts_at && new Date(r.starts_at) >= new Date()).length} tone="emerald" icon={<Clock3 className="w-4 h-4" />} loading={loading} />
      <StatCard label="مكتملة" value={rows.filter((r) => r.status === 'completed').length} tone="violet" icon={<Users className="w-4 h-4" />} loading={loading} />
      <StatCard label="ملغاة" value={rows.filter((r) => r.status === 'cancelled').length} tone="red" icon={<MapPin className="w-4 h-4" />} loading={loading} />
    </div>
    {/* tabs row */}
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {[['all', 'الكل'], ['today', 'اليوم'], ['upcoming', 'القادمة'], ['completed', 'المكتملة'], ['cancelled', 'الملغاة']].map(([k, label]) => (
        <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap border cursor-pointer ${tab === k ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-slate-600 border-slate-200 hover:text-[#2563EB]'}`}>{label}</button>
      ))}
    </div>

    <DataTable rows={byTab} loading={loading} error={error} onRetry={() => void load()} emptyText="لا توجد حصص في هذا القسم"
      searchKeys={(r) => `${r.title || ''} ${r._group?.name || ''} ${r.subject || ''} ${r.location || ''}`}
      searchPlaceholder="ابحث بعنوان الحصة أو المجموعة..."
      columns={[
        { key: 'title', header: 'الحصة', render: (r) => <div><div className="font-black">{r.title}</div><div className="text-[10px] text-slate-400">{r.subject || '—'}</div></div> },
        { key: 'group', header: 'المجموعة', render: (r) => r._group?.name || '—', hideOnMobile: true },
        { key: 'date', header: 'التاريخ', render: (r) => <span className="text-slate-600">{fmtDate(r.session_date)}</span> },
        { key: 'time', header: 'الوقت', render: (r) => <span className="text-slate-600 text-[11px]">{fmtTime(r.starts_at)} — {fmtTime(r.ends_at)}</span> },
        { key: 'location', header: 'الموقع', render: (r) => r.location || '—', hideOnMobile: true },
        { key: 'status', header: 'الحالة', render: (r) => <StatusBadge status={r.status} /> },
        { key: 'actions', header: 'إجراءات', render: (r) => <div className="flex gap-1.5">
          <Btn size="sm" variant="secondary" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" />تعديل</Btn>
          <Btn size="sm" variant="danger" onClick={() => setDel(r)}><Trash2 className="w-3.5 h-3.5" /></Btn>
        </div> },
      ]}
      mobileCard={(r) => <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2"><span className="font-black text-sm">{r.title}</span><StatusBadge status={r.status} /></div>
        <div className="text-[11px] text-slate-500">{fmtDate(r.session_date)} • {fmtTime(r.starts_at)}</div>
        <div className="text-[11px] text-slate-400">{r._group?.name || '—'} • {r.location || '—'}</div>
        <div className="flex gap-2 pt-1"><Btn size="sm" variant="secondary" className="flex-1" onClick={() => openEdit(r)}>تعديل</Btn><Btn size="sm" variant="danger" onClick={() => setDel(r)}>حذف</Btn></div>
      </div>} />

    {/* Create/Edit dialog */}
    {form && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" dir="rtl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 my-8">
          <h3 className="text-sm font-black text-slate-900">{form.id ? 'تعديل الحصة' : 'إنشاء حصة جديدة'}</h3>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[11px] font-black text-slate-500 block mb-1.5">عنوان الحصة *</label>
              <input value={form.title} onChange={(e) => setForm((p) => p ? { ...p, title: e.target.value } : p)} placeholder="مثال: مراجعة الوحدة الثالثة" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-500 block mb-1.5">المجموعة *</label>
              <select value={form.group_id} onChange={(e) => setForm((p) => p ? { ...p, group_id: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100">
                <option value="">اختر مجموعة...</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name} — {g.subject || 'عام'} ({g.current_count}/{g.max_students})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">التاريخ *</label>
                <input type="date" value={form.session_date} onChange={(e) => setForm((p) => p ? { ...p, session_date: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" /></div>
              <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">البداية *</label>
                <input type="time" value={form.starts_at} onChange={(e) => setForm((p) => p ? { ...p, starts_at: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" /></div>
              <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">النهاية *</label>
                <input type="time" value={form.ends_at} onChange={(e) => setForm((p) => p ? { ...p, ends_at: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" /></div>
            </div>
            <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">الموقع</label>
              <input value={form.location} onChange={(e) => setForm((p) => p ? { ...p, location: e.target.value } : p)} placeholder="مركز / أونلاين / منزل الطالب" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none" /></div>
            <div><label className="text-[11px] font-black text-slate-500 block mb-1.5">الحالة</label>
              <select value={form.status} onChange={(e) => setForm((p) => p ? { ...p, status: e.target.value } : p)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none">
                <option value="scheduled">مجدولة</option><option value="in_progress">جارية</option><option value="completed">مكتملة</option><option value="cancelled">ملغاة</option>
              </select></div>
          </div>
          <div className="mt-5 flex gap-2 justify-end">
            <Btn variant="secondary" size="sm" onClick={() => setForm(null)}>إلغاء</Btn>
            <Btn size="sm" disabled={saving} onClick={() => void save()}>{form.id ? 'حفظ التعديلات' : 'إنشاء الحصة'}</Btn>
          </div>
        </div>
      </div>
    )}
    <ConfirmDialog open={!!del} tone="danger" busy={saving} title="حذف الحصة" message={`سيتم حذف «${del?.title}» نهائيًا من جدول الحصص.`} confirmLabel="حذف نهائي" onConfirm={() => void remove()} onCancel={() => setDel(null)} />
  </div>;
};
