import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';

import { SIGNUP_CONSENT_KEY as CONSENT_KEY } from '../../lib/legal';

interface LegalConsentGateProps {
  onAccept: () => void;
  onNavigate: (path: string) => void;
}

export const hasRecentSignupConsent = () => {
  try { return localStorage.getItem(CONSENT_KEY) === 'accepted'; } catch { return false; }
};

export const LegalConsentGate: React.FC<LegalConsentGateProps> = ({ onAccept, onNavigate }) => {
  const [accepted, setAccepted] = useState(false);

  const accept = () => {
    if (!accepted) return;
    try { localStorage.setItem(CONSENT_KEY, 'accepted'); } catch { /* ignore storage errors */ }
    onAccept();
  };

  return (
    <main className="min-h-screen w-full bg-white text-right" dir="rtl">
      <section className="w-full px-5 sm:px-8 lg:px-12 py-8 sm:py-10">
        <div className="w-full border-b border-slate-100 pb-7 sm:pb-9">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-[11px] font-black mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>حماية وشفافية</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1E3A8A] leading-tight">قبل إنشاء حسابك، راجع موافقتك</h1>
              <p className="text-sm sm:text-base text-slate-500 mt-2 leading-7 max-w-2xl">
                نعالج فقط البيانات اللازمة لتشغيل خدمات حِصّتي وحماية المستخدمين، ونوضح لك ذلك قبل التسجيل.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full py-7 sm:py-9">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-7">
            <button type="button" onClick={() => onNavigate('/legal/terms')} className="group text-right p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="font-black text-sm text-slate-800">شروط الاستخدام</div>
              <div className="text-xs text-slate-500 mt-1.5 leading-5">الحجز، الحساب، المدرسون، والمسؤوليات</div>
            </button>

            <button type="button" onClick={() => onNavigate('/legal/privacy')} className="group text-right p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="font-black text-sm text-slate-800">سياسة الخصوصية</div>
              <div className="text-xs text-slate-500 mt-1.5 leading-5">البيانات، الهوية، الأطفال، والاحتفاظ</div>
            </button>

            <button type="button" onClick={() => onNavigate('/legal/acceptable')} className="group text-right p-5 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50/40 transition">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="font-black text-sm text-slate-800">الاستخدام المقبول</div>
              <div className="text-xs text-slate-500 mt-1.5 leading-5">الممنوعات وحماية المستخدمين</div>
            </button>
          </div>

          <label className={`flex items-start gap-3 p-5 rounded-2xl border cursor-pointer select-none transition ${accepted ? 'border-blue-300 bg-blue-50/70' : 'border-slate-200 bg-slate-50/80 hover:bg-slate-50'}`}>
            <input
              id="hassty-legal-consent"
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 accent-blue-600 shrink-0 cursor-pointer"
              aria-label="الموافقة على شروط استخدام منصة حصتي وسياسة الخصوصية والاستخدام المقبول"
            />
            <span className="text-sm leading-7 text-slate-700">
              أقر بأنني قرأت وفهمت <button type="button" onClick={() => onNavigate('/legal/terms')} className="text-blue-600 font-black hover:underline">شروط الاستخدام</button> و<button type="button" onClick={() => onNavigate('/legal/privacy')} className="text-blue-600 font-black hover:underline">سياسة الخصوصية</button> و<button type="button" onClick={() => onNavigate('/legal/acceptable')} className="text-blue-600 font-black hover:underline">سياسة الاستخدام المقبول</button>، وأفهم متطلبات السن والموافقة المطبقة على الحساب.
            </span>
          </label>

          <div className="mt-5 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 leading-7 flex items-start gap-3">
            <UserCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-black mb-1">تنبيه مهم</div>
              <div>لو كان الحساب يخص قاصرًا، قد نطلب موافقة ولي الأمر أو نوقف بعض الخدمات حتى تكتمل الآلية المناسبة.</div>
            </div>
          </div>

          <button
            type="button"
            onClick={accept}
            disabled={!accepted}
            className={`w-full mt-7 py-3.5 rounded-xl text-white font-black transition flex items-center justify-center gap-2 ${accepted ? 'bg-[#2563EB] hover:bg-blue-700 cursor-pointer shadow-sm' : 'bg-slate-300 cursor-not-allowed'}`}
          >
            <span>أوافق وأتابع إنشاء الحساب</span>
            {accepted ? <CheckCircle2 className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-5">الموافقة لا تعني التنازل عن أي حق لا يجوز التنازل عنه قانونًا.</p>
        </div>
      </section>
    </main>
  );
};
