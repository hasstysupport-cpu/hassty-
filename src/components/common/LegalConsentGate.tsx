import React, { useMemo, useState } from 'react';
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
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [acceptable, setAcceptable] = useState(false);
  const [adultOrGuardian, setAdultOrGuardian] = useState(false);

  const canContinue = useMemo(() => terms && privacy && acceptable && adultOrGuardian, [terms, privacy, acceptable, adultOrGuardian]);

  const accept = () => {
    if (!canContinue) return;
    localStorage.setItem(CONSENT_KEY, 'accepted');
    onAccept();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center px-4 py-10 text-right" dir="rtl">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-9">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><ShieldCheck className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-black text-[#1E3A8A]">قبل إنشاء حسابك</h1>
            <p className="text-sm text-slate-500 mt-1 leading-6">نريد أن تكون الصورة واضحة من البداية: ما البيانات التي نستخدمها، لماذا نطلبها، وما حقوقك.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <button onClick={() => onNavigate('/legal/terms')} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-right hover:border-blue-300 transition"><div className="font-black text-sm">شروط الاستخدام</div><div className="text-xs text-slate-500 mt-1">الحجز، الحساب، المدرسون، المسؤوليات</div></button>
          <button onClick={() => onNavigate('/legal/privacy')} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-right hover:border-blue-300 transition"><div className="font-black text-sm">سياسة الخصوصية</div><div className="text-xs text-slate-500 mt-1">البيانات، الهوية، الأطفال، الاحتفاظ</div></button>
          <button onClick={() => onNavigate('/legal/acceptable')} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-right hover:border-blue-300 transition"><div className="font-black text-sm">الاستخدام المقبول</div><div className="text-xs text-slate-500 mt-1">الممنوعات وحماية المستخدمين</div></button>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-1 w-4 h-4 accent-blue-600" />
            <span className="text-sm leading-6">قرأت وأوافق على <button type="button" onClick={() => onNavigate('/legal/terms')} className="text-blue-600 font-black">شروط الاستخدام</button>.</span>
          </label>
          <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input type="checkbox" checked={privacy} onChange={e => setPrivacy(e.target.checked)} className="mt-1 w-4 h-4 accent-blue-600" />
            <span className="text-sm leading-6">قرأت إشعار الخصوصية وفهمت أنواع البيانات التي نجمعها وأغراض استخدامها وحقوقي.</span>
          </label>
          <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input type="checkbox" checked={acceptable} onChange={e => setAcceptable(e.target.checked)} className="mt-1 w-4 h-4 accent-blue-600" />
            <span className="text-sm leading-6">أوافق على <button type="button" onClick={() => onNavigate('/legal/acceptable')} className="text-blue-600 font-black">سياسة الاستخدام المقبول</button> وأتعهد بعدم انتحال الهوية أو إساءة استخدام المنصة أو بيانات الآخرين.</span>
          </label>
          <label className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 cursor-pointer">
            <input type="checkbox" checked={adultOrGuardian} onChange={e => setAdultOrGuardian(e.target.checked)} className="mt-1 w-4 h-4 accent-blue-600" />
            <span className="text-sm leading-6"><strong>أقر بأنني أفهم متطلبات السن والموافقة:</strong> إذا كان الحساب يخص قاصرًا، فلن يُعامل هذا المربع وحده كبديل عن موافقة ولي الأمر المطلوبة قانونًا، وقد نطلب موافقة ولي الأمر أو نوقف بعض الخدمات حتى تكتمل الآلية المناسبة.</span>
          </label>
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-blue-900 leading-6 flex gap-2">
          <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>لو كنت تنشئ حسابًا لطفل صغير، الأفضل أن يبدأ ولي الأمر بحسابه أولًا. بيانات الأطفال لها متطلبات موافقة إضافية.</span>
        </div>

        <button disabled={!canContinue} onClick={accept} className="w-full mt-6 py-3.5 rounded-xl bg-[#2563EB] text-white font-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition flex items-center justify-center gap-2">
          <span>أوافق وأتابع إنشاء الحساب</span><ArrowLeft className="w-4 h-4" />
        </button>
        <p className="text-[11px] text-slate-400 text-center mt-4">الموافقة على الشروط لا تعني التنازل عن أي حق لا يجوز التنازل عنه قانونًا.</p>
      </div>
    </div>
  );
};
