import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, MessageCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

export const AssistantInvitationsPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const load = async () => {
    if (!supabase || !user?.uid) return;
    const { data, error } = await supabase.from('assistant_invitations').select('*').eq('assistant_id', user.uid).order('created_at', { ascending: false });
    if (error) setNotice(error.message); else setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, [user?.uid]);

  const respond = async (id: string, accepted: boolean) => {
    if (!supabase) return;
    setBusy(id); setNotice('');
    if (accepted) {
      const { error } = await supabase.rpc('accept_assistant_invitation', { p_invitation_id: id });
      if (error) setNotice(error.message); else setNotice('تم قبول الدعوة وربط حسابك بالمدرس بنجاح ✅');
    } else {
      const { error } = await supabase.from('assistant_invitations').update({ status: 'rejected', responded_at: new Date().toISOString() }).eq('id', id).eq('assistant_id', user?.uid || '');
      if (error) setNotice(error.message); else setNotice('تم رفض الدعوة.');
    }
    await load(); setBusy(null);
  };

  const chat = async (teacherId: string) => {
    if (!supabase || !user?.uid) return;
    const { data } = await supabase.from('chat_threads').select('*').eq('teacher_id', teacherId).eq('assistant_id', user.uid).limit(1).maybeSingle();
    if (data) onNavigate(`/assistant/messages?thread=${data.id}`);
    else {
      const created = await supabase.from('chat_threads').insert({ teacher_id: teacherId, assistant_id: user.uid, is_support: false }).select('*').single();
      if (created.data) onNavigate(`/assistant/messages?thread=${created.data.id}`);
    }
  };

  return <div className="space-y-6 text-right" dir="rtl"><div><h1 className="text-2xl font-black text-[#1E3A8A]">دعوات المدرسين 🤝</h1><p className="text-sm text-slate-500 mt-1">راجع الدعوات المرسلة إليك وقم بقبولها أو رفضها.</p></div>{notice&&<div className="rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 p-3 text-sm font-bold">{notice}</div>}{loading?<div className="py-16 text-center text-sm text-slate-400">جاري تحميل الدعوات...</div>:items.length===0?<div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">لا توجد دعوات حاليًا.</div>:<div className="space-y-4">{items.map(i=><article key={i.id} className="bg-white rounded-3xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-black text-slate-900">دعوة للانضمام إلى فريق مدرس</h2><p className="text-xs text-slate-500 mt-1">{new Date(i.created_at).toLocaleString('ar-EG')}</p><p className="text-sm text-slate-600 mt-3 leading-6">{i.message || 'دعوة للانضمام إلى فريق المساعدين على حِصّتي.'}</p></div><span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-black text-slate-700">{i.status}</span></div>{i.status==='pending'&&<div className="grid sm:grid-cols-3 gap-2 mt-5"><button disabled={busy===i.id} onClick={()=>void respond(i.id,true)} className="rounded-xl bg-emerald-600 text-white py-3 text-xs font-black flex items-center justify-center gap-1.5"><CheckCircle2 className="w-4 h-4"/>قبول الدعوة</button><button disabled={busy===i.id} onClick={()=>void respond(i.id,false)} className="rounded-xl bg-red-50 text-red-700 border border-red-200 py-3 text-xs font-black flex items-center justify-center gap-1.5"><XCircle className="w-4 h-4"/>رفض</button><button onClick={()=>void chat(i.teacher_id)} className="rounded-xl bg-blue-50 text-blue-700 border border-blue-200 py-3 text-xs font-black flex items-center justify-center gap-1.5"><MessageCircle className="w-4 h-4"/>محادثة مع المدرس</button></div>}{i.status!=='pending'&&<div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500"><Clock3 className="w-4 h-4"/>تمت معالجة الدعوة.</div>}</article>)}</div>}</div>;
};
