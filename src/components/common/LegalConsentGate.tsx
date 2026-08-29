import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';

const CONSENT_KEY = 'hassty_signup_legal_consent_v1';

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
    <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center px-4 py-10 text-right" dir="rtl">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-9">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><ShieldCheck className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-black text-[#1E3A8A]">قبل إنشاء حسابك</h1>
            <p className="text-sm text-slate-500 mt-1 leading-6">راجع موافقتك قبل التسجيل: الشروط، الخصوصية، الاستخدام المقبول، ومتطلبات السن والموافقة.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <button type="button" onClick={() => onNavigate('/legal/terms')} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-right hover:border-blue-300 transition">
            <div className="font-black text-sm">شروط الاستخدام</div>
            <div className="text-xs text-slate-500 mt-1">الحجز، الحساب، المدرسون، المسؤوليات</div>
          </button>
          <button type="button" onClick={() => onNavigate('/legal/privacy')} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-right hover:border-blue-300 transition">
            <div className="font-black text-sm">سياسة الخصوصية</div>
            <div className="text-xs text-slate-500 mt-1">البيانات، الهوية، الأطفال، الاحتفاظ</div>
          </button>
          <button type="button" onClick={() => onNavigate('/legal/acceptable')} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-right hover:border-blue-300 transition">
            <div className="font-black text-sm">الاستخدام المقبول</div>
            <div className="text-xs text-slate-500 mt-1">الممنوعات وحماية المستخدمين</div>
          </button>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-slate-50 select-none">
          <input
            id="hassty-legal-consent"
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 accent-blue-600 shrink-0 cursor-pointer"
            aria-label="الموافقة على شروط استخدام منصة حصتي وسياسة الخصوصية والاستخدام المقبول"
          />
          <div className="text-sm leading-6 text-slate-700">
            <span>أقر بأنني قرأت وفهمت </span>
            <button type="button" onClick={() => onNavigate('/legal/terms')} className="text-blue-600 font-black hover:underline">شروط الاستخدام</button>
            <span> و</span>
            <button type="button" onClick={() => onNavigate('/legal/privacy')} className="text-blue-600 font-black hover:underline">سياسة الخصوصية</button>
            <span> و</span>
            <button type="button" onClick={() => onNavigate('/legal/acceptable')} className="text-blue-600 font-black hover:underline">سياسة الاستخدام المقبول</button>
            <span>، وأفهم متطلبات السن والموافقة المطبقة على الحساب.</span>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-blue-900 leading-6 flex gap-2">
          <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>لو كان الحساب يخص قاصرًا، قد نطلب موافقة ولي الأمر أو نوقف بعض الخدمات حتى تكتمل الآلية المناسبة.</span>
        </div>

        <button
          type="button"
          disabled={!accepted}
          onClick={accept}
          className={`w-full mt-6 py-3.5 rounded-xl text-white font-black transition flex items-center justify-center gap-2 ${accepted ? 'bg-[#2563EB] hover:bg-blue-700 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'}`}
        >
          <span>أوافق وأتابع إنشاء الحساب</span>
          {accepted ? <CheckCircle2 className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </button>
        <p className="text-[11px] text-slate-400 text-center mt-4">الموافقة لا تعني التنازل عن أي حق لا يجوز التنازل عنه قانونًا.</p>
      </div>
    </div>
  );
};
