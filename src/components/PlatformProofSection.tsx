import React from 'react';
import { BellRing, CheckCircle2, ClipboardCheck, LockKeyhole, QrCode, Search, ShieldCheck, Sparkles } from 'lucide-react';

const highlights = [
  {
    icon: ShieldCheck,
    title: 'مدرسون موثقون أولاً',
    text: 'المدرس لا يظهر في دليل البحث ولا يستخدم خدمات المدرسين قبل اعتماد التوثيق من الإدارة.',
    tag: 'أمان وثقة',
  },
  {
    icon: QrCode,
    title: 'حضور ذكي بالـ QR',
    text: 'تسجيل الحضور مرتبط بالحصة الفعلية ووقت المسح، مع احتساب الحاضر والمتأخر والغياب تلقائياً.',
    tag: 'تتبع لحظي',
  },
  {
    icon: BellRing,
    title: 'متابعة ولي الأمر',
    text: 'ربط الأبناء وعرض الحضور والحجوزات والمدفوعات من حساب ولي الأمر في مكان واحد.',
    tag: 'متابعة واضحة',
  },
  {
    icon: ClipboardCheck,
    title: 'حجوزات منظمة',
    text: 'طلب الحجز ينتقل من الطالب إلى المدرس ثم إلى حالة معتمدة أو مرفوضة من قاعدة بيانات واحدة.',
    tag: 'بدون لخبطة',
  },
];

export const PlatformProofSection: React.FC = () => {
  return (
    <section className="hs-proof-section relative overflow-hidden py-20 lg:py-28 bg-white border-y border-slate-100" dir="rtl">
      <div className="absolute inset-0 pointer-events-none opacity-70" aria-hidden="true">
        <div className="absolute -top-24 right-[8%] h-64 w-64 rounded-full bg-blue-100/55 blur-3xl" />
        <div className="absolute -bottom-24 left-[8%] h-72 w-72 rounded-full bg-emerald-100/45 blur-3xl" />
        <div className="absolute inset-0 hs-grid-fade" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16 hs-reveal hs-reveal-up is-visible">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700">
            <Sparkles className="w-3.5 h-3.5" />
            تجربة مبنية على بيانات حقيقية
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
            كل جزء في <span className="text-blue-600">حِصّتي</span> له وظيفة واضحة
          </h2>
          <p className="mt-4 text-sm sm:text-base leading-8 text-slate-600">
            بدل أرقام تجريبية وشعارات شكلية، الواجهة تشرح للمستخدم ما الذي سيحصل عليه فعلاً وكيف تعمل المنصة.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-6">
          {highlights.map(({ icon: Icon, title, text, tag }, index) => (
            <article
              key={title}
              className={`hs-proof-card hs-reveal hs-reveal-up ${index === 0 ? 'is-visible' : ''}`}
              style={{ ['--hs-reveal-delay' as string]: `${index * 90}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="hs-proof-icon">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-500">
                  {tag}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-black text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                موجودة داخل النظام
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 lg:mt-12 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-5 sm:p-6 shadow-[0_18px_50px_rgba(37,99,235,0.08)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white border border-blue-100 text-blue-600 shadow-sm">
                <LockKeyhole className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">المبدأ الأساسي</p>
                <p className="mt-1 text-sm leading-7 text-slate-600">لا توجد شارة توثيق أو صلاحية مدرس مخفية في الواجهة؛ الاعتماد نفسه هو مفتاح ظهور المدرس واستخدام الخدمات.</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 border border-slate-200 text-xs font-black text-slate-700 shadow-sm">
              <Search className="w-4 h-4 text-blue-600" />
              ابحث عن مدرس معتمد فقط
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
