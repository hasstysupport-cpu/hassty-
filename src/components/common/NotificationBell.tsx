/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useEffect, useState } from 'react';
import { Bell, BellRing, Check, Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { disablePushNotifications, enablePushNotifications, getPushState, isPushSupported, type PushState } from '../../lib/pushService';

interface Props { onNavigate: (path: string) => void; }

export const NotificationBell: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const unread = items.filter((n) => !n.read_at).length;
  const [pushState, setPushState] = useState<PushState | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState('');

  const route = user?.role === 'parent' ? '/parent/notifications' : user?.role === 'teacher' ? '/teacher/notifications' : '/student/notifications';

  const load = async () => {
    if (!supabase || !user?.uid) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.uid).order('created_at', { ascending: false }).limit(8);
    setItems(data || []);
  };

  useEffect(() => {
    void load();
    if (!supabase || !user?.uid) return;
    const channel = supabase.channel(`notification-bell:${user.uid}:${Date.now().toString(36)}`).on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.uid}` }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user?.uid]);

  /* حالة إشعارات المتصفح — تُحدّث عند فتح القائمة حتى يبقى زر التفعيل متاحًا دائمًا */
  useEffect(() => {
    if (!open || !isPushSupported()) { setPushState(isPushSupported() ? null : 'unsupported'); return; }
    void getPushState().then(setPushState).catch(() => setPushState(null));
  }, [open]);

  const enablePush = async () => {
    setPushBusy(true); setPushMsg('');
    const res = await enablePushNotifications();
    setPushBusy(false);
    setPushState(res.state);
    setPushMsg(res.ok ? 'تم التفعيل ✅ هتوصلك الإشعارات فورًا.' : (res.error || 'تعذر التفعيل.'));
  };

  const disablePush = async () => {
    setPushBusy(true);
    await disablePushNotifications();
    setPushBusy(false);
    setPushState('prompt');
    setPushMsg('تم تعطيل إشعارات المتصفح على هذا الجهاز.');
  };

  const markRead = async (id: string) => {
    if (!supabase || !user?.uid) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.uid);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };

  const markAll = async () => {
    if (!supabase || !user?.uid) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.uid).is('read_at', null);
    void load();
  };

  const openNotification = async (item: any) => {
    await markRead(item.id);
    setOpen(false);
    if (item.link) onNavigate(item.link);
    else onNavigate(route);
  };

  return <div className="relative">
    <button type="button" onClick={() => setOpen((v) => !v)} className="relative p-2.5 rounded-xl border border-[#E5E7EB] text-gray-600 hover:text-[#2563EB] hover:bg-gray-50 transition-colors cursor-pointer" aria-label="الإشعارات">
      <Bell className="w-5 h-5" />
      {unread > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">{unread > 99 ? '99+' : unread}</span>}
    </button>
    {open && <div className="absolute left-0 mt-2 w-[min(24rem,calc(100vw-2rem))] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-4 z-50 text-right">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 gap-3">
        <div><h3 className="text-sm font-black text-[#1E3A8A]">الإشعارات والتنبيهات</h3><p className="text-[10px] text-gray-400 mt-0.5">{unread} غير مقروءة</p></div>
        {unread > 0 && <button type="button" onClick={() => void markAll()} className="text-[10px] font-bold text-[#2563EB]">تحديد الكل كمقروء</button>}
      </div>
      {/* إشعارات المتصفح: مدخل دائم لطلب/تعطيل الإذن — حتى لو قُفِل البانر */}
      {pushState && pushState !== 'unsupported' && (
        <div className={`mt-3 rounded-xl border p-2.5 ${pushState === 'enabled' ? 'border-emerald-100 bg-emerald-50/60' : 'border-blue-100 bg-blue-50/60'}`}>
          <div className="flex items-center gap-2">
            {pushState === 'blocked' ? <ShieldAlert className="w-4 h-4 text-[#B91C1C] shrink-0" /> : <BellRing className={`w-4 h-4 shrink-0 ${pushState === 'enabled' ? 'text-emerald-600' : 'text-[#2563EB]'}`} />}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-[#1F2937]">{pushState === 'enabled' ? 'إشعارات المتصفح مفعّلة' : pushState === 'blocked' ? 'الإشعارات محظورة من المتصفح' : 'إشعارات المتصفح غير مفعّلة'}</p>
              {pushState === 'blocked' && <p className="text-[10px] text-gray-500 leading-4 mt-0.5">فعّلها من أيقونة القفل 🔒 بجانب رابط الموقع ثم حدّث الصفحة.</p>}
              {pushMsg && pushState !== 'blocked' && <p className={`text-[10px] leading-4 mt-0.5 ${pushMsg.includes('✅') ? 'text-emerald-600' : 'text-gray-500'}`}>{pushMsg}</p>}
            </div>
            {pushState !== 'blocked' && (
              <button type="button" onClick={() => void (pushState === 'enabled' ? disablePush() : enablePush())} disabled={pushBusy} className="shrink-0 px-3 py-1.5 text-[10px] font-black rounded-lg bg-gradient-to-l from-[#2563EB] to-[#7C3AED] text-white hover:opacity-90 disabled:opacity-60 cursor-pointer">
                {pushBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : pushState === 'enabled' ? 'تعطيل' : 'تفعيل'}
              </button>
            )}
          </div>
        </div>
      )}
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
        {items.length === 0 ? <div className="py-10 text-center text-xs text-gray-400">لا توجد إشعارات حتى الآن.</div> : items.map((item) => <div key={item.id} onClick={() => void openNotification(item)} className={`py-3 px-1 rounded-xl cursor-pointer hover:bg-gray-50 ${!item.read_at ? 'bg-blue-50/40' : ''}`}>
          <div className="flex items-start gap-2"><span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!item.read_at ? 'bg-blue-600' : 'bg-gray-200'}`} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h4 className="text-xs font-black text-[#1F2937] leading-5">{item.title}</h4><span className="text-[9px] text-gray-400 whitespace-nowrap">{new Date(item.created_at).toLocaleDateString('ar-EG')}</span></div><p className="text-[11px] text-gray-500 mt-1 leading-5">{item.message}</p></div><button type="button" onClick={(e) => { e.stopPropagation(); void markRead(item.id); }} className="p-1.5 rounded-lg hover:bg-white" title="مقروء"><Check className="w-3.5 h-3.5 text-gray-400" /></button></div>
        </div>)}
      </div>
      <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between gap-2"><button type="button" onClick={() => { setOpen(false); onNavigate(route); }} className="text-xs font-black text-[#2563EB]">فتح مركز الإشعارات ←</button><button type="button" onClick={() => setOpen(false)} className="text-[10px] text-gray-400">إغلاق</button></div>
    </div>}
  </div>;
};
