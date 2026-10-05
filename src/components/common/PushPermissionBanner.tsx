/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import {
  canAskBrowserPermissionNow,
  enablePushNotifications,
  getPushState,
  isPushSupported,
  noteBrowserPermissionAskResult,
  showLocalNotification,
  wasPushDeclinedRecently,
  type PushState,
} from '../../lib/pushService';
import { useAuth } from '../../lib/AuthContext';

/**
 * بانر طلب إذن إشعارات المتصفح — يظهر مرة واحدة للعملاء المسجلين
 * (بعد 3 ثوانٍ من الاستقرار حتى لا يقاطع دخولهم) مع خيار «لاحقًا».
 * لا نستدعي Notification.requestPermission() إلا من نقرة مستخدم صريحة.
 */
export const PushPermissionBanner: React.FC = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | 'ok' | 'fail'>(null);
  const [failMsg, setFailMsg] = useState('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user?.uid || !isPushSupported()) return;
    timerRef.current = window.setTimeout(async () => {
      if (cancelled || wasPushDeclinedRecently()) return;
      const state: PushState = await getPushState();
      if (!cancelled && state === 'prompt') setVisible(true);
    }, 3000);
    return () => { cancelled = true; if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [user?.uid]);

  /* طلب الإذن التلقائي من المتصفح: أول نقرة للمستخدم بعد الدخول تُطلق نافذة
     إذن الإشعارات الأصلية مباشرة — بدون انتظار ضغط البانر (وهذا كان سبب
     «المتصفح لا يطلب الإذن أبدًا»). مرة واحدة في الجلسة + تهدئة يوم كحد أقصى،
     والنقرات على البانر نفسه مستثناة (زر التفعيل هناك يتكفل بالمهمة). */
  useEffect(() => {
    if (!user?.uid || !isPushSupported()) return;
    let disarmed = false;
    let listener: ((ev: Event) => void) | null = null;
    let timer: number | null = null;
    timer = window.setTimeout(() => {
      if (disarmed || !canAskBrowserPermissionNow()) return;
      listener = (ev: Event) => {
        const target = ev.target as HTMLElement | null;
        if (target?.closest?.('[data-push-banner]')) return;
        if (listener) document.removeEventListener('click', listener, true);
        listener = null;
        void (async () => {
          const res = await enablePushNotifications();
          noteBrowserPermissionAskResult(res.ok, res.state === 'blocked');
          if (res.ok) {
            void showLocalNotification(
              'تم تفعيل إشعارات حِصّتي 🔔',
              'هنبعتلك الحجوزات والحضور والمدفوعات فورًا من الموقع.',
              '/',
              'hassty-welcome',
            );
          }
        })();
      };
      document.addEventListener('click', listener, true);
    }, 1500);
    return () => {
      disarmed = true;
      if (timer) window.clearTimeout(timer);
      if (listener) document.removeEventListener('click', listener, true);
    };
  }, [user?.uid]);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem('hassty_push_declined_at', String(Date.now())); } catch { /* ignore */ }
  };

  const enable = async () => {
    setBusy(true);
    const result = await enablePushNotifications();
    setBusy(false);
    if (result.ok) {
      setDone('ok');
      window.setTimeout(() => setVisible(false), 2600);
    } else {
      setDone('fail');
      setFailMsg(result.error || 'تعذر تفعيل الإشعارات.');
      window.setTimeout(() => setVisible(false), 4200);
    }
  };

  if (!visible) return null;

  return (
    <div data-push-banner className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-6 sm:right-auto sm:w-[380px] z-[70] animate-[fadeUp_.35s_ease-out]" dir="rtl">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center">
            {done === 'fail' ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            {done === null ? (
              <>
                <h3 className="text-sm font-black text-[#1E3A8A]">فعّل إشعارات حِصّتي على هذا الجهاز 🔔</h3>
                <p className="text-xs text-gray-500 leading-5 mt-1">
                  هتصلك إشعارات الحجز والحضور والمدفوعات فورًا من الموقع مباشرة — بنفس سرعة إشعارات الواتساب، حتى والموقع مقفول.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => void enable()}
                    disabled={busy}
                    className="px-4 py-2 text-xs font-black text-white rounded-xl bg-gradient-to-l from-[#2563EB] to-[#7C3AED] hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
                  >
                    {busy ? 'جاري التفعيل...' : 'تفعيل الإشعارات'}
                  </button>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="px-3 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    لاحقًا
                  </button>
                </div>
              </>
            ) : done === 'ok' ? (
              <>
                <h3 className="text-sm font-black text-emerald-700">تم تفعيل الإشعارات ✅</h3>
                <p className="text-xs text-gray-500 leading-5 mt-1">أول إشعار هيوصلك مع أقرب تحديث — احنا معاك دايمًا.</p>
              </>
            ) : (
              <>
                <h3 className="text-sm font-black text-[#B91C1C]">لم نتمكن من تفعيل الإشعارات</h3>
                <p className="text-xs text-gray-500 leading-5 mt-1">{failMsg} — لو منعت المتصفح الإشعارات، فعّلها من إعدادات الموقع في المتصفح.</p>
              </>
            )}
          </div>
          <button type="button" onClick={dismiss} aria-label="إغلاق" className="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
