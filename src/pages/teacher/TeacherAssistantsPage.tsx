import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Search, UserCheck, Users, MapPin, BriefcaseBusiness, Settings2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

export const TeacherAssistantsPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [assistants, setAssistants] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const load = async () => {
    if (!supabase || !user?.uid) return;
    const [{ data: a }, { data: l }] = await Promise.all([
      supabase.from('assistant_profiles').select('*').eq('is_verified', true).eq('verification_status', 'approved').order('created_at', { ascending: false }),
      supabase.from('teacher_assistants').select('*').eq('teacher_id', user.uid).order('created_at', { ascending: false }),
    ]);
    setAssistants(a || []); setLinks(l || []);
  };
  useEffect(() => { void load(); }, [user?.uid]);

  const filtered = useMemo(() => assistants.filter(a => {
    const hay = `${a.full_name || ''} ${a.education || ''} ${a.experience_summary || ''}`.toLowerCase();
    return (!search || hay.includes(search.trim().toLowerCase())) && (!location || `${a.governorate || ''} ${a.city || ''}`.toLowerCase().includes(location.trim().toLowerCase()));
  }), [assistants, search, location]);

  const invite = async (assistantId: string) => {
    if (!supabase || !user?.uid) return;
    setBusy(assistantId); setNotice('');
    const { error } = await supabase.from('assistant_invitations').insert({ teacher_id: user.uid, assistant_id: assistantId, status: 'pending', message: 'ندعوك للانضمام إلى فريق المساعدين الخاص بالمدرس على حِصّتي.' });
    if (error) setNotice(error.code === '23505' ? 'يوجد بالفعل طلب دعوة لهذا المساعد.' : error.message);
    else { setNotice('تم إرسال الدعوة للمساعد ✅'); await supabase.from('notifications').insert({ user_id: assistantId, title: 'دعوة من مدرس', message: 'أرسل لك مدرس دعوة للانضمام إلى فريقه كمساعد.', type: 'assistant_invitation', link: '/assistant/invitations' }); }
    setBusy(null); await load();
  };

  const startChat = async (assistantId: string) => {
    if (!supabase || !user?.uid) return;
    setBusy(assistantId);
    const existing = await supabase.from('chat_threads').select('*').eq('teacher_id', user.uid).eq('assistant_id', assistantId).limit(1).maybeSingle();
    if (existing.data) { onNavigate(`/teacher/messages?thread=${existing.data.id}`); setBusy(null); return; }
    const { data, error } = await supabase.from('chat_threads').insert({ teacher_id: user.uid, assistant_id: assistantId, is_support: false }).select('*').single();
    if (error) setNotice(error.message); else if (data) onNavigate(`/teacher/messages?thread=${data.id}`);
    setBusy(null);
  };

  const activeTeam = links.filter(l => l.status === 'active');

  return <div className="space-y-6 text-right" dir="rtl">
    <section className="bg-white rounded-3xl border border-slate-200 p-6"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black"><Users className="w-4 h-4"/>فريق المساعدين</div><h1 className="text-2xl font-black text-[#1E3A8A] mt-2">البحث عن مساعد مدرس</h1><p className="text-sm text-slate-500 mt-1">ابحث عن مساعدين موثقين، تواصل معهم، ثم أرسل دعوة رسمية.</p></div><button onClick={()=>onNavigate('/teacher/dashboard')} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-black">العودة للوحة المدرس</button></div></section>

    <section className="bg-white rounded-3xl border border-slate-200 p-5"><div className="grid md:grid-cols-2 gap-3"><div className="relative"><Search className="absolute right-3 top-3.5 w-4 h-4 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالاسم أو الخبرة أو المؤهل" className="w-full pr-10 pl-3 py-3 rounded-xl border border-slate-200 text-sm"/></div><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="المحافظة أو المدينة" className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm"/></div></section>

    {notice && <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl p-3 text-sm font-bold">{notice}</div>}

    {activeTeam.length > 0 && <section className="space-y-3"><div><h2 className="text-xl font-black text-[#1E3A8A]">فريقي الحالي</h2><p className="text-sm text-slate-500 mt-1">إدارة المساعدين المرتبطين بحسابك وصلاحياتهم.</p></div><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{activeTeam.map(link => { const a = assistants.find(x => x.user_id === link.assistant_id); return <article key={link.id} className="bg-white rounded-3xl border border-emerald-200 p-5"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><UserCheck className="w-5 h-5"/></div><div className="min-w-0"><h3 className="font-black text-slate-900 truncate">{a?.full_name || 'مساعد'}</h3><p className="text-xs text-emerald-700 font-bold mt-1">مرتبط ونشط</p></div></div><div className="grid grid-cols-2 gap-2 mt-4"><button onClick={()=>onNavigate(`/teacher/assistants/${link.assistant_id}`)} className="rounded-xl bg-blue-600 text-white py-2.5 text-xs font-black flex items-center justify-center gap-1"><Settings2 className="w-4 h-4"/>إدارة الصلاحيات</button><button onClick={()=>void startChat(link.assistant_id)} className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 py-2.5 text-xs font-black flex items-center justify-center gap-1"><MessageCircle className="w-4 h-4"/>محادثة</button></div></article>; })}</div></section>}

    <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map(a=>{const link=links.find(l=>l.assistant_id===a.user_id);const active=link?.status==='active';return <article key={a.user_id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm"><div className="flex items-start gap-3"><div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center"><BriefcaseBusiness className="w-6 h-6"/></div><div className="min-w-0 flex-1"><h2 className="font-black text-slate-900 truncate">{a.full_name}</h2><div className="text-xs text-emerald-700 font-black mt-1 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5"/>مساعد موثق</div></div></div><div className="mt-4 space-y-2 text-xs text-slate-600"><div className="flex gap-2"><MapPin className="w-4 h-4 text-slate-400"/>{a.governorate || '—'} {a.city ? `— ${a.city}` : ''}</div><div><b>المؤهل:</b> {a.education || 'غير مذكور'}</div><div><b>الخبرة:</b> {a.experience_years || 0} سنة</div>{a.experience_summary&&<p className="leading-6 text-slate-500">{a.experience_summary}</p>}</div><div className="grid grid-cols-2 gap-2 mt-5">{active?<button onClick={()=>onNavigate(`/teacher/assistants/${a.user_id}`)} className="rounded-xl bg-blue-600 text-white py-2.5 text-xs font-black flex items-center justify-center gap-1"><Settings2 className="w-4 h-4"/>إدارة المساعد</button>:<button disabled={!!busy || link?.status==='pending'} onClick={()=>void invite(a.user_id)} className="rounded-xl bg-blue-600 text-white py-2.5 text-xs font-black disabled:opacity-50">{link?.status==='pending'?'الدعوة قيد الانتظار':busy===a.user_id?'جارٍ...':'إرسال دعوة'}</button>}<button disabled={!!busy} onClick={()=>void startChat(a.user_id)} className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 py-2.5 text-xs font-black flex items-center justify-center gap-1"><MessageCircle className="w-4 h-4"/>مراسلة</button></div></article>})}</section>
    {!filtered.length&&<div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-sm text-slate-400">لا يوجد مساعدين موثقين مطابقين للبحث.</div>}
  </div>;
};
