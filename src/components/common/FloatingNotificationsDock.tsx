/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو النشر أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/**
 * FloatingNotificationsDock — القايمة العايمة للإشعارات
 * ---------------------------------------------------------------------
 * زر عايم في كل صفحات المستخدم المسجل:
 *   - شارة بعدد الإشعارات غير المقروءة (realtime + focus + كل دقيقة)
 *   - قايمة سريعة: حالة إشعارات المتصفح (تفعيل/إيقاف/محظورة مع إرشاد)
 *     + آخر 3 إشعارات + «عرض الكل»
 * موضعها: أسفل يمين فوق شريط التنقل السفلي في الموبايل — لا تتعارض
 * مع بانر إذن الإشعارات (أسفل يسار).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellRing, BellOff, Loader2, ShieldAlert, X, ChevronLeft, CircleAlert } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { AppNotification, markNotificationRead, notificationTime } from '../../lib/notificationService';
import {
  enablePushNotifications, disablePushNotifications, getPushState, isPushSupported,
} from '../../lib/pushService';

type PushState = Awaited<ReturnType<typeof getPushState>>;

export const FloatingNotificationsDock: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || '';
  const role = user?.role || 'student';

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [pushState, setPushState] = useState<PushState>('unsupported');
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  const notificationsPath = `/${role}/notifications`;

  /* تحميل آخر الإشعارات + عدّاد غير المقروء */
  const loadNotifications = useCallback(async () => {
    if (!supabase || !userId) return;
    const { data } = await supabase
      .from('notifications')
      .select('id,user_id,title,message,type,link,read_at,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    const list = (data || []) as AppNotification[];
    setItems(list);
    setUnread(list.filter((n) => !n.read_at).length);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void getPushState().then(setPushState);
    void loadNotifications();
    const interval = window.setInterval(() => void loadNotifications(), 60000);
    const onFocus = () => void loadNotifications();
    window.addEventListener('focus', onFocus);

    let channel: any = null;
    if (supabase) {
      channel = supabase
        .channel(`dock:notifications:${userId}:${Date.now().toString(36)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => {
          void loadNotifications();
          void getPushState().then(setPushState);
        })
        .subscribe();
    }

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      if (channel && supabase) void supabase.removeChannel(channel);
    };
  }, [userId, loadNotifications]);

  /* إغلاق بالنقر خارج القايمة أو Escape */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node) || fabRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleTogglePush = async () => {
    setPushBusy(true);
    setPushMsg('');
    try {
      if (pushState === 'enabled') {
        await disablePushNotifications();
        setPushMsg('تم إيقاف إشعارات المتصفح من هذا الجهاز.');
      } else {
        const ok = await enablePushNotifications();
        if (ok) setPushMsg('تم تفعيل الإشعارات ✅ — هتوصلك كل التحديثات حتى والموقع مقفول.');
      }
      void getPushState().then(setPushState);
    } catch (err: any) {
      const name = String(err?.name || '');
      if (name === 'NotAllowedError') setPushMsg('الإذن محظور من المتصفح — فعّله يدويًا من أيقونة القفل 🔒 بجانب رابط الموقع.');
      else setPushMsg(err?.message || 'تعذر تغيير حالة الإشعارات، جرب تاني.');
    } finally {
      setPushBusy(false);
    }
  };

  const handleOpenItem = async (n: AppNotification) => {
    try { if (!n.read_at) await markNotificationRead(n.id); } catch { /* noop */ }
    setOpen(false);
    void loadNotifications();
    if (n.link) window.location.assign(n.link);
    else window.location.assign(notificationsPath);
  };

  if (!userId || !supabase) return null;

  const pushLabel: Record<PushState, string> = {
    enabled: 'مفعلة على هذا الجهاز',
    prompt: 'غير مفعلة بعد',
    blocked: 'محظورة من المتصفح',
    unsupported: 'غير مدعومة في هذا المتصفح',
  };

  return (
    <div className="fixed z-[60] right-4 sm:right-6 bottom-[5.5rem] lg:bottom-6" dir="rtl">
      {/* لوحة القايمة */}
      {open && (
        <div
          ref={panelRef}
          className="absolute bottom-full mb-3 right-0 w-[calc(100vw-2rem)] max-w-[340px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-up"
        >
          {/* الترويسة */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-blue-700 to-blue-600 text-white">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4" />
              <span className="text-xs font-black">مركز الإشعارات السريع</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10" aria-label="إغلاق">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* حالة إشعارات المتصفح */}
          <div className="px-4 py-3 border-b border-slate-100 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {pushState === 'enabled' ? <BellRing className="w-4 h-4 text-emerald-600" /> : pushState === 'blocked' ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <BellOff className="w-4 h-4 text-slate-400" />}
                <div>
                  <div className="text-[11px] font-black text-slate-900">إشعارات المتصفح</div>
                  <div className="text-[10px] text-slate-500 font-bold">{pushLabel[pushState]}</div>
                </div>
              </div>
              {isPushSupported() && pushState !== 'blocked' && pushState !== 'unsupported' && (
                <button
                  onClick={() => void handleTogglePush()}
                  disabled={pushBusy}
                  className={`text-[10px] font-black rounded-xl px-3 py-2 transition-all disabled:opacity-60 ${pushState === 'enabled' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20'}`}
                >
                  {pushBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : pushState === 'enabled' ? 'إيقاف' : 'تفعيل الآن'}
                </button>
              )}
            </div>
            {pushState === 'blocked' && (
              <p className="text-[10px] text-red-700 bg-red-50 border border-red-100 rounded-xl px-2.5 py-2 font-bold leading-relaxed">
                الإذن محظور من المتصفح — فعّله يدويًا من أيقونة القفل 🔒 بجانب رابط الموقع ثم اختر «السماح».
              </p>
            )}
            {pushMsg && <p className="text-[10px] text-blue-800 bg-blue-50 border border-blue-100 rounded-xl px-2.5 py-2 font-bold">{pushMsg}</p>}
          </div>

          {/* آخر الإشعارات */}
          <div className="max-h-[260px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-[11px] font-bold text-slate-500">لا توجد إشعارات بعد</p>
                <p className="text-[10px] text-slate-400 mt-0.5">كل التحديثات (حضور، مدفوعات، رسائل) هتظهر هنا</p>
              </div>
            ) : (
              items.slice(0, 4).map((n) => (
                <button
                  key={n.id}
                  onClick={() => void handleOpenItem(n)}
                  className={`w-full text-right px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-2.5 items-start ${!n.read_at ? 'bg-blue-50/50' : ''}`}
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.read_at ? 'bg-blue-600' : 'bg-slate-200'}`} />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black text-slate-900 truncate">{n.title}</span>
                      <span className="text-[9px] text-slate-400 shrink-0">{notificationTime(n.created_at)}</span>
                    </span>
                    {n.message && <span className="block text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</span>}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* التذييل */}
          <button
            onClick={() => { setOpen(false); window.location.assign(notificationsPath); }}
            className="w-full px-4 py-3 text-[11px] font-black text-blue-700 bg-slate-50 hover:bg-blue-50 flex items-center justify-center gap-1 transition-colors"
          >
            عرض كل الإشعارات
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* الزر العايم */}
      <button
        ref={fabRef}
        onClick={() => { setOpen((v) => !v); void getPushState().then(setPushState); }}
        aria-label="الإشعارات السريعة"
        className="relative w-13 h-13 rounded-2xl bg-gradient-to-bl from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white shadow-xl shadow-blue-900/25 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
        style={{ width: '3.25rem', height: '3.25rem' }}
      >
        <Bell className="w-5.5 h-5.5" style={{ width: '1.35rem', height: '1.35rem' }} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-md">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        {/* نبضة عند وجود إشعار جديد غير مقروء */}
        {unread > 0 && <span className="absolute inset-0 rounded-2xl animate-ping bg-blue-400/20 pointer-events-none" />}
      </button>
    </div>
  );
};
