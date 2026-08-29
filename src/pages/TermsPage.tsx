import React from 'react';
import { FileText, ShieldCheck, UserCheck, Ban, Scale, ArrowRight, Mail } from 'lucide-react';

interface TermsPageProps { onNavigate: (path: string) => void; }

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-[#F8FAFF] text-[#1F2937] font-['IBM_Plex_Sans_Arabic',sans-serif] py-10 sm:py-14">
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <button onClick={() => onNavigate('/')} className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB] mb-6 hover:gap-3 transition-all">
        <ArrowRight className="w-4 h-4" /> العودة للرئيسية
      </button>
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-10">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><FileText className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1E3A8A]">شروط استخدام منصة حِصّتي</h1>
            <p className="text-xs text-slate-500 mt-1">آخر تحديث: 29 أغسطس 2026 — هذه مسودة تشغيلية وتحتاج مراجعة قانونية محلية قبل الإطلاق التجاري.</p>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-8">
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2">1) قبول الشروط</h2><p>باستخدام حِصّتي أو إنشاء حساب، تقر بأنك قرأت هذه الشروط وسياسة الخصوصية وتوافق عليهما. إذا لم توافق، فلا تنشئ حسابًا ولا تستخدم الخدمات.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2">2) طبيعة المنصة</h2><p>حِصّتي منصة تقنية لتسهيل اكتشاف المدرسين والتواصل والحجز وإدارة المجموعات والحضور والمدفوعات والتقييمات. المنصة لا تضمن نتيجة تعليمية محددة ولا تحل محل التعاقد المباشر بين الطالب/ولي الأمر والمدرس.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2 flex items-center gap-2"><UserCheck className="w-5 h-5 text-blue-600" />3) دقة البيانات والحساب</h2><p>يجب تقديم بيانات صحيحة ومحدثة وعدم انتحال شخصية أي شخص أو إنشاء أكثر من حساب بغرض التحايل. لكل مستخدم مسؤولية الحفاظ على بيانات الدخول وعدم مشاركتها.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" />4) توثيق المدرسين</h2><p>قد نطلب من المدرس بيانات ووثائق إثبات الهوية والمؤهلات المهنية عند طلب التوثيق. تُستخدم هذه المواد للتحقق من الهوية والأهلية وتقليل الاحتيال وحماية الطلاب والمنصة، ولا تُعرض للعامة كجزء من الملف العام إلا بالقدر المسموح به. لا يعني التوثيق ضمانًا لجودة التدريس أو إقرارًا قانونيًا بصلاحية أي مدرس لممارسة مهنة منظمة.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2">5) الحضور والحجوزات</h2><p>قد تستخدم المنصة أوقات الحصص وعمليات مسح QR لإنشاء سجلات حضور مثل: حاضر، متأخر، غائب. يجب على المستخدمين عدم تزوير الحضور أو مشاركة رمز QR أو استخدامه نيابة عن شخص آخر. القرارات المتعلقة بالتعويض أو النزاعات تخضع لسياسات المنصة وإجراءات المراجعة.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2 flex items-center gap-2"><Ban className="w-5 h-5 text-red-600" />6) الاستخدامات المحظورة</h2><p>يحظر استخدام المنصة للغش، الاحتيال، التهديد أو الإساءة، جمع بيانات الآخرين دون إذن، التحرش، التمييز، نشر محتوى غير قانوني، أو محاولة اختراق الأنظمة أو تجاوز الصلاحيات أو العبث بسجلات الحضور.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2">7) التقييمات والمحتوى</h2><p>يجب أن تكون التقييمات واقعية وغير مضللة. تحتفظ حِصّتي بحق إزالة المحتوى المخالف أو المسيء ووقف الحساب عند الحاجة وفق القانون وهذه الشروط.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2">8) المدفوعات والنزاعات</h2><p>تُعرض الأسعار والرسوم قبل إتمام أي عملية دفع. أي استرداد أو نزاع مالي يخضع لشروط الخدمة المعنية وأدوات الدفع المستخدمة. لا ترسل بيانات بطاقتك البنكية داخل المحادثات أو ملفات غير مخصصة للدفع.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2">9) الحسابات الموقوفة وإنهاء الخدمة</h2><p>يمكن تعليق أو إنهاء الحساب عند خرق الشروط، وجود نشاط احتيالي، تعريض المستخدمين للخطر، أو وجود طلب قانوني. قد نحتفظ بسجلات لازمة للامتثال أو فض النزاعات بعد إغلاق الحساب.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2 flex items-center gap-2"><Scale className="w-5 h-5 text-indigo-600" />10) القانون والاختصاص</h2><p>تُفسر هذه الشروط بما يتفق مع القوانين المصرية السارية بالقدر المنطبق. لا تهدف هذه الصفحة إلى استبعاد أي حق إلزامي للمستهلك أو المستخدم بموجب القانون.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2">11) التواصل القانوني</h2><p>للاستفسارات المتعلقة بالشروط أو طلبات الحقوق القانونية والبيانات: <a className="text-blue-600 font-bold hover:underline" href="mailto:hasstysupport@gmail.com">hasstysupport@gmail.com</a>.</p></section>
        </div>
        <div className="mt-10 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-6 flex items-start gap-2"><Mail className="w-4 h-4 shrink-0 mt-0.5" />هذه الصفحة سياسة تشغيلية للموقع وليست استشارة أو رأيًا قانونيًا. يوصى بمراجعتها واعتمادها من محامٍ مصري مختص قبل الإطلاق التجاري.</div>
      </div>
    </div>
  </div>
);
