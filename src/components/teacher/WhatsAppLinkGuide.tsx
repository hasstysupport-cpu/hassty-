import React, { useState } from 'react';
import { CheckCircle2, QrCode, Smartphone } from 'lucide-react';

type GuideMode = 'qr' | 'code';

const QR_STEPS = [
  {
    title: 'افتح الأجهزة المرتبطة',
    text: 'افتح واتساب على هاتفك، واضغط على القائمة ⋮ ثم اختر «الأجهزة المرتبطة».',
    image: '/whatsapp-link-guide/1-menu-linked-devices.webp',
    alt: 'واتساب مع قائمة الأجهزة المرتبطة',
  },
  {
    title: 'اضغط ربط جهاز',
    text: 'من شاشة الأجهزة المرتبطة اضغط على «ربط جهاز» لفتح أداة مسح رمز QR.',
    image: '/whatsapp-link-guide/2-link-a-device.webp',
    alt: 'زر ربط جهاز في واتساب',
  },
  {
    title: 'امسح رمز QR الظاهر في Hassty',
    text: 'وجّه كاميرا واتساب إلى رمز QR الموجود في نافذة الربط داخل Hassty، وانتظر حتى يتم الاتصال.',
    image: '/whatsapp-link-guide/3-scan-qr.webp',
    alt: 'شاشة مسح رمز QR في واتساب',
  },
];

const CODE_STEPS = [
  {
    title: 'افتح الأجهزة المرتبطة',
    text: 'افتح واتساب على هاتفك، ثم من القائمة ⋮ اختر «الأجهزة المرتبطة» واضغط «ربط جهاز».',
    image: 'https://mobiletrans.wondershare.com/images/images2026/transfer-whatsapp-from-oppo-to-iphone-5.jpg',
    alt: 'واتساب مع قائمة الأجهزة المرتبطة',
  },
  {
    title: 'اختر الربط برقم الهاتف',
    text: 'بعد فتح شاشة مسح QR، اضغط «الربط برقم الهاتف بدلًا من ذلك».',
    image: 'https://www.nextpit.de/img/Link-WhatsApp-via-laptop-on-the-phone-step-1.png?class=gallery_preview',
    alt: 'خيار الربط برقم الهاتف بدلًا من QR',
  },
  {
    title: 'استخدم الرمز الذي يظهر في Hassty',
    text: 'سيظهر لك رمز ربط في Hassty. استخدمه في شاشة إدخال الرمز داخل واتساب لإكمال ربط الجهاز.',
    image: '/whatsapp-link-guide/5-enter-code.webp',
    alt: 'شاشة إدخال رمز الربط في واتساب',
  },
];

export const WhatsAppLinkGuide: React.FC = () => {
  const [mode, setMode] = useState<GuideMode>('qr');
  const steps = mode === 'qr' ? QR_STEPS : CODE_STEPS;

  return (
    <section className="space-y-4" dir="rtl">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                {mode === 'qr' ? <QrCode className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-800">📱 شرح ربط واتساب مع Hassty</h2>
                <p className="text-xs text-slate-500 mt-0.5">اختار الطريقة اللي هتستخدمها وشوف الخطوات بالصور واحدة واحدة.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setMode('qr')}
              className={`rounded-xl px-3 py-2.5 text-xs sm:text-sm font-black transition ${mode === 'qr' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-700'}`}
            >
              📷 الربط بـ QR
            </button>
            <button
              type="button"
              onClick={() => setMode('code')}
              className={`rounded-xl px-3 py-2.5 text-xs sm:text-sm font-black transition ${mode === 'code' ? 'bg-white text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:text-slate-700'}`}
            >
              🔢 الربط بالرمز
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <article key={step.title} className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-l from-slate-50 to-white">
              <div className="flex items-start gap-3">
                <span className={`w-10 h-10 rounded-2xl shrink-0 text-white flex items-center justify-center font-black text-sm shadow-sm ${mode === 'qr' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-black text-slate-800">الخطوة {index + 1}: {step.title}</div>
                  <p className="text-xs sm:text-sm text-slate-500 leading-6 mt-1">{step.text}</p>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-5 bg-slate-50">
              <div className="mx-auto max-w-sm rounded-3xl bg-white border border-slate-200 p-2 sm:p-3 shadow-sm">
                <img
                  src={step.image}
                  alt={step.alt}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[560px] object-contain rounded-2xl"
                />
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 px-3.5 py-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 leading-6">
                  <span className="font-black">اعمل الخطوة دي ثم انتقل للي بعدها.</span>
                  {index === steps.length - 1 && ' بعد نجاح الربط ستظهر حالة واتساب متصل داخل Hassty.'}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 leading-6">
        <strong>تنبيه أمان:</strong> رمز الربط خاص بحسابك. لا ترسله لأي شخص ولا تدخله في أي موقع أو تطبيق خارج واتساب وHassty.
      </div>
    </section>
  );
};

export default WhatsAppLinkGuide;
