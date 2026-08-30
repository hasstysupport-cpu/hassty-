import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Loader2, MessageCircle, Pause, Play, Save, ShieldCheck, Users, WalletCards } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

const PERMISSIONS = [
  ['view_students', 'عرض الطلاب', Users],
  ['attendance', 'إدارة الحضور', Check],
  ['notes', 'كتابة ملاحظات الطلاب', MessageCircle],
  ['payments', 'عرض المصروفات', WalletCards],
  ['grades', 'عرض الدرجات والنتائج', ShieldCheck],
  ['messaging', 'المراسلة', MessageCircle],
  ['manage_group', 'إدارة إعدادات المجموعة', ShieldCheck],
] as const;

type PermissionKey = typeof PERMISSIONS[number][0];

export const TeacherAssistantManagePage: React.FC<{ assistantId: string; onNavigate: (path: string) => void }> = ({ assistantId, onNavigate }) => {
  const { user } = useAuth();
  const [assistant, setAssistant] = useState<any | null>(null);
  const [relation, setRelation] = useState<any | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [access, setAccess] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    if (!supabase || !user?.uid || !assistantId) return;
    setLoading(true); setError('');
    try {
      const { data: rel, error: relError } = await supabase.from('teacher_assistants').select('*').eq('teacher_id', user.uid).eq('assistant_id', assistantId).maybeSingle();
      if (relError) throw relError;
      if (!rel) throw new Error('هذا المساعد غير مرتبط بحسابك.');
      const [{ data: profile, error: profileError }, { data: groupRows, error: groupError }] = await Promise.all([
        supabase.from('assistant_profiles').select('*').eq('user_id', assistantId).maybeSingle(),
        supabase.from('student_groups').select('id,name,subject,grade,schedule,current_count,max_students,is_active').eq('tutor_id', user.uid).order('created_at', { ascending: false }),
      ]);
      if (profileError) throw profileError;
      if (groupError) throw groupError;
      const { data: accessRows, error: accessError } = await supabase.from('teacher_assistant_group_access').select('*').eq('teacher_assistant_id', rel.id);
      if (accessError) throw accessError;
      const map: Record<string, Record<string, boolean>> = {};
      for (const row of accessRows || []) map[row.group_id] = { ...(row.permissions || {}) };
      setAssistant(profile); setRelation(rel); setGroups(groupRows || []); setAccess(map);
    } catch (e: any) { setError(e?.message || 'تعذر تحميل بيانات المساعد.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [user?.uid, assistantId]);

  const defaultPermission = (key: PermissionKey) => key === 'payments' || key === 'grades' || key === 'manage_group' ? false : true;
  const getPermission = (groupId: string, key: PermissionKey) => access[groupId]?.[key] ?? defaultPermission(key);

  const togglePermission = (groupId: string, key: PermissionKey) => {
    setAccess(prev => ({ ...prev, [groupId]: { ...(prev[groupId] || {}), [key]: !getPermission(groupId, key) } }));
  };

  const saveGroup = async (groupId: string) => {
    if (!supabase || !relation) return;
    setSaving(groupId); setNotice(''); setError('');
    const permissions = PERMISSIONS.reduce<Record<string, boolean>>((out, [key]) => { out[key] = getPermission(groupId, key); return out; }, {});
    try {
      const { error: upsertError } = await supabase.from('teacher_assistant_group_access').upsert({ teacher_assistant_id: relation.id, group_id: groupId, permissions, updated_at: new Date().toISOString() }, { onConflict: 'teacher_assistant_id,group_id' });
      if (upsertError) throw upsertError;
      setAccess(prev => ({ ...prev, [groupId]: permissions }));
      setNotice('تم حفظ صلاحيات المجموعة ✅');
    } catch (e: any) { setError(e?.message || 'تعذر حفظ الصلاحيات.'); }
    finally { setSaving(null); }
  };

  const setRelationStatus = async (status: 'active'|'paused'|'revoked') => {
    if (!supabase || !relation) return;
    setBusy(true); setNotice(''); setError('');
    try {
      const { error: updateError } = await supabase.from('teacher_assistants').update({ status, ended_at: status === 'revoked' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq('id', relation.id).eq('teacher_id', user?.uid || '');
      if (updateError) throw updateError;
      setRelation((prev: any) => ({ ...prev, status }));
      setNotice(status === 'active' ? 'تم تفعيل المساعد ✅' : status === 'paused' ? 'تم إيقاف المساعد مؤقتًا.' : 'تم إنهاء ارتباط المساعد بحسابك.');
    } catch (e: any) { setError(e?.message || 'تعذر تحديث حالة المساعد.'); }
    finally { setBusy(false); }
  };

  const chatPath = useMemo(() => relation ? `/teacher/messages?assistant=${relation.assistant_id}` : '/teacher/messages', [relation]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return <div className="space-y-6 text-right" dir="rtl">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><button onClick={() => onNavigate('/teacher/assistants')} className="text-sm font-bold text-blue-600 flex items-center gap-1 mb-2"><ArrowRight className="w-4 h-4"/>العودة للمساعدين</button><h1 className="text-2xl font-black text-[#1E3A8A]">إدارة المساعد</h1><p className="text-sm text-slate-500 mt-1">حدد بالضبط المجموعات والصلاحيات التي يستطيع هذا المساعد الوصول إليها.</p></div>
      <div className="flex gap-2"><button onClick={() => onNavigate(chatPath)} className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-black flex items-center gap-2"><MessageCircle className="w-4 h-4"/>فتح المحادثة</button>{relation?.status === 'paused' ? <button disabled={busy} onClick={() => void setRelationStatus('active')} className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center gap-2"><Play className="w-4 h-4"/>تفعيل</button> : relation?.status === 'active' ? <button disabled={busy} onClick={() => void setRelationStatus('paused')} className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-black flex items-center gap-2"><Pause className="w-4 h-4"/>إيقاف مؤقت</button> : null}</div>
    </div>

    {notice && <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">{notice}</div>}
    {error && <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold">{error}</div>}

    <section className="bg-white border border-slate-200 rounded-3xl p-5">
      <div className="flex items-center gap-3"><div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center"><ShieldCheck className="w-7 h-7"/></div><div><h2 className="text-lg font-black text-slate-900">{assistant?.full_name || 'المساعد'}</h2><p className="text-xs text-slate-500 mt-1">{assistant?.governorate || '—'} — {assistant?.city || '—'} • {assistant?.education || 'المؤهل غير مذكور'}</p></div><span className={`mr-auto px-3 py-1.5 rounded-full text-xs font-black ${relation?.status === 'active' ? 'bg-emerald-50 text-emerald-700' : relation?.status === 'paused' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{relation?.status === 'active' ? 'نشط' : relation?.status === 'paused' ? 'موقوف' : 'منتهي'}</span></div>
    </section>

    <section className="space-y-4">
      <div><h2 className="text-xl font-black text-[#1E3A8A]">صلاحيات كل مجموعة</h2><p className="text-sm text-slate-500 mt-1">تقدر تدي المساعد صلاحية مختلفة لكل مجموعة. المصروفات والدرجات مقفولة افتراضيًا.</p></div>
      {groups.length === 0 ? <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500 text-sm">لا توجد مجموعات حالية.</div> : <div className="space-y-4">{groups.map(group => <article key={group.id} className="bg-white rounded-3xl border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><h3 className="font-black text-slate-900 text-lg">{group.name}</h3><p className="text-xs text-slate-500 mt-1">{group.subject || 'مادة'} • {group.grade || 'مرحلة'} • {group.current_count || 0}/{group.max_students || '—'} طالب</p><p className="text-xs text-slate-500 mt-1">{group.schedule || 'موعد غير محدد'}</p></div><button disabled={saving === group.id} onClick={() => void saveGroup(group.id)} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center justify-center gap-2"><Save className="w-4 h-4"/>{saving === group.id ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}</button></div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">{PERMISSIONS.map(([key, label, Icon]) => { const checked = getPermission(group.id, key); return <button key={key} onClick={() => togglePermission(group.id, key)} className={`text-right rounded-2xl border p-4 transition-all ${checked ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${checked ? 'text-blue-700' : 'text-slate-400'}`}/><span className={`text-xs font-black ${checked ? 'text-blue-900' : 'text-slate-600'}`}>{label}</span></div><span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${checked ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-300'}`}>{checked ? '✓' : ''}</span></div></button>; })}</div>
      </article>)}</div>}
    </section>

    {relation?.status !== 'revoked' && <section className="bg-red-50 border border-red-200 rounded-3xl p-5"><h3 className="font-black text-red-900">إنهاء ارتباط المساعد</h3><p className="text-sm text-red-700 mt-1 leading-6">سيتم منع المساعد من الوصول إلى مجموعاتك من خلال هذا الارتباط. يظل حسابه كمساعد موجودًا ويمكنه قبول دعوات مدرسين آخرين.</p><button disabled={busy} onClick={() => void setRelationStatus('revoked')} className="mt-4 px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-black">إنهاء الارتباط</button></section>}
  </div>;
};
