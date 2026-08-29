import React, { useEffect, useState } from 'react';
import { FileText, LockKeyhole, ShieldCheck, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LEGAL_VERSIONS, recordRequiredSignupConsents } from '../../lib/legal';

const CONSENT_KEY = `hassty_required_legal_consent_${LEGAL_VERSIONS.terms}`;

export const LegalConsentGuard: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const checkRoute = () => {
      const signup = window.location.pathname === '/signup';
      const alreadyAccepted = localStorage.getItem(CONSENT_KEY) === '1';
      setVisible(signup && !alreadyAccepted);
    };
    checkRoute();
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hassty:navigation', checkRoute as EventListener);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hassty:navigation', checkRoute as EventListener);
    };
  }, []);

  useEffect(() => {
    const blockSubmit = (event: Event) => {
      if (!visible) return;
      event.preventDefault();
      event.stopPropagation();
    };
    const blockGoogle = (event: MouseEvent) => {
      if (!visible) return;
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button');
      if (!button) return;
      const text = (button.textContent || '').toLowerCase();
      if (text.includes('google')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('submit', blockSubmit, true);
    window.addEventListener('click', blockGoogle, true);
    return () => {
      window.removeEventListener('submit', blockSubmit, true);
      window.removeEventListener('click', blockGoogle, true);
    };
  }, [visible]);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user || localStorage.getItem(CONSENT_KEY) !== '1') return;
      try {
        await recordRequiredSignupConsents(session.user.id);
      } catch (error) {
        console.warn('Legal consent record warning:', error);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!visible) return null;

  const accept = () => {
    if (!accepted) return;
    localStorage.setItem(CONSENT_KEY, '1');
    setVisible(false);
    window.dispatchEvent(new Event('hassty:legal-consent'));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
        <div className="p-5 sm:p-7 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black mb-3"><ShieldCheck className="w-4 h-4" /> حماية وشفافية</div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">قبل إنشاء حسابك، راجع موافقتك</h2>
              <p className="mt-2 text-sm text-slate-600 leading-7">نريد أن تكون عارفًا بالبيانات التي نستخدمها ولماذا، وما القواعد الأساسية لاستخدام حِصّتي.</p>
            </div>
            <button type="button" aria-label="إغلاق" onClick={() => history.back()} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-5 sm:p-7 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <a href="/legal/terms" className="rounded-2xl border border-slate-200 p-3 hover:border-blue-300 hover:bg-blue-50/50 transition"><FileText className="w-5 h-5 text-blue-600 mb-2" /><span className="text-xs font-black text-slate-800">شروط الاستخدام</span></a>
            <a href="/legal/privacy" className="rounded-2xl border border-slate-200 p-3 hover:border-blue-300 hover:bg-blue-50/50 transition"><LockKeyhole className="w-5 h-5 text-emerald-600 mb-2" /><span className="text-xs font-black text-slate-800">سياسة الخصوصية</span></a>
            <a href="/legal/teacher" className="rounded-2xl border border-slate-200 p-3 hover:border-blue-300 hover:bg-blue-50/50 transition"><ShieldCheck className="w-5 h-5 text-indigo-600 mb-2" /><span className="text-xs font-black text-slate-800">توثيق المدرسين</span></a>
          </div>
          <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input aria-label="الموافقة على الشروط والخصوصية" type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 w-4 h-4 accent-blue-600" />
            <span className="text-xs sm:text-sm text-slate-700 leading-7">أقر أنني قرأت وفهمت <a className="text-blue-600 font-black hover:underline" href="/legal/terms">شروط الاستخدام</a> و<a className="text-blue-600 font-black hover:underline" href="/legal/privacy">سياسة الخصوصية</a> و<a className="text-blue-600 font-black hover:underline" href="/legal/acceptable">سياسة الاستخدام المقبول</a>، وأوافق عليها. ويمكنني سحب الموافقة أو طلب حقوق البيانات عندما يكون ذلك منطبقًا.</span>
          </label>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] leading-6 text-amber-900">لو الحساب لطفل أو قاصر، يجب أن يشارك ولي الأمر في الموافقات المطلوبة وفق القواعد القانونية المنطبقة.</div>
          <button type="button" disabled={!accepted} onClick={accept} className="w-full py-3.5 rounded-2xl bg-[#2563EB] disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-sm hover:bg-[#1D4ED8] transition">أوافق وأتابع إنشاء الحساب</button>
        </div>
      </div>
    </div>
  );
};
