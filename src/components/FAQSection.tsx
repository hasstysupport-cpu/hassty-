import React from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

/**
 * الأسئلة الشائعة — محتوى مرئي مطابق تماماً لـ FAQPage JSON-LD في index.html
 * (شرط Google لعرض الـ FAQ Rich Result: المحتوى لازم يكون ظاهراً في الصفحة)
 * يُستخدم <details>/<summary> الأصليين ليقرأه الزاحف بدون جافاسكريبت.
 */
const FAQ_ITEMS = [
  {
    q: 'إزاي ألاقي مدرس خصوصي قريب مني في منطقتي؟',
    a: 'اكتب المادة والمحافظة ومنطقتك في خانة البحث في منصة حصتي وهتظهرلك كل المدرسين المعتمدين القريبين منك مع التقييمات وسعر الحصة والمواعيد المتاحة، وتقدر تحجز أونلاين في دقيقة واحدة.',
  },
  {
    q: 'إزاي المدرس يسجل حضور الطلاب بكود QR من الموبايل؟',
    a: 'كل طالب في منصة Hassty ليه بطاقة رقمية فيها كود QR خاص بيه. المدرس يفتح الكاميرا من التطبيق ويمسح الكود أول ما الطالب يدخل الحصة، فيتسجل الحضور تلقائياً ويوصل إشعار فوري لولي الأمر على الواتساب بوقت الوصول — من غير تسجيل يدوي ولا أخطاء.',
  },
  {
    q: 'كيف يمكنني العثور على مدرس خصوصي معتمد في منطقتي عبر منصة حصتي؟',
    a: 'يمكنك البحث بسهولة عبر كتابة المادة والمحافظة والمنطقة لتظهر لك قائمة بجميع المدرسين المعتمدين مع التقييمات، الأسعار، والمواعيد المتاحة للحجز الفوري.',
  },
  {
    q: 'كيف يعمل نظام تسجيل الحضور بكود QR وإشعارات الواتساب؟',
    a: 'يحصل كل طالب على بطاقة حضور رقمية تتضمن QR كود خاص. يقوم المدرس بمسح الكود عند دخول الطالب الحصة، ويتم إرسال إشعار فوري لولي الأمر عبر الواتساب يوضح موعد الوصول وحالة الدفع والدرجات.',
  },
  {
    q: 'هل يمكن للمدرسين الانضمام للمنصة وإنشاء مجموعات خاصة؟',
    a: 'نعم، توفر منصة حصتي بوابة متكاملة للمدرسين لإدارة المجموعات، جدول المواعيد، مسح أكواد الحضور، وتتبع الاشتراكات والمدفوعات الشهرية بكل سهولة.',
  },
  {
    q: 'ما هي رسوم استخدام منصة حصتي؟',
    a: 'لا توجد رسوم اشتراك شهرية ثابتة ولا رسوم خفية. المنصة مجانية تماماً للطلاب وأولياء الأمور، بينما يدفع المدرس عمولة تنازلية عادلة تنخفض تلقائياً كلما زاد عدد طلابه.',
  },
  {
    q: 'كيف أتواصل مع خدمة دعم منصة حصتي؟',
    a: 'فريق الدعم متاح يومياً من 9:00 صباحاً حتى 10:00 مساءً عبر الواتساب على الأرقام 201212281360 و201080158828 أو عبر البريد الإلكتروني hasstysupport@gmail.com.',
  },
];

export const FAQSection: React.FC = () => {
  return (
    <section id="faq" className="py-16 lg:py-24 bg-white border-t border-gray-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] text-[#2563EB] text-xs font-bold rounded-full mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            إجابات لكل ما يخطر ببالك
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F2937] tracking-tight mb-4">
            الأسئلة <span className="text-[#2563EB]">الشائعة</span>
          </h2>
          <p className="text-base text-[#6B7280]">
            كل ما تحتاج معرفته عن حجز المدرسين ونظام الحضور الذكي قبل بدء رحلتك مع منصة حصتي.
          </p>
        </div>

        {/* FAQ Accordion — عناصر details/summary أصلية (SEO-friendly) */}
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => (
            <details
              key={idx}
              className="group rounded-2xl border border-gray-200 bg-[#FAFBFD] open:bg-white open:border-[#BFDBFE] open:shadow-sm transition-all"
              open={idx === 0}
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4 select-none [&::-webkit-details-marker]:hidden">
                <h3 className="text-sm sm:text-base font-bold text-[#1F2937] leading-relaxed flex-1">
                  {item.q}
                </h3>
                <span className="shrink-0 w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center transition-transform duration-200 group-open:rotate-180">
                  <ChevronDown className="w-4 h-4" />
                </span>
              </summary>
              <div className="px-5 pb-5 pt-0">
                <p className="text-sm text-[#6B7280] leading-relaxed border-t border-gray-100 pt-3">
                  {item.a}
                </p>
              </div>
            </details>
          ))}
        </div>

        {/* CTA صغيرة */}
        <p className="text-center text-sm text-[#6B7280] mt-8">
          عندك سؤال تاني؟{' '}
          <a href="/contact" className="text-[#2563EB] font-bold hover:underline">
            تواصل مع فريق الدعم
          </a>
        </p>
      </div>
    </section>
  );
};
