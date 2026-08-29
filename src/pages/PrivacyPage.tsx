import React from 'react';
import { LockKeyhole, Eye, Database, FileCheck, UserRoundX, ArrowRight, ShieldCheck } from 'lucide-react';

interface PrivacyPageProps { onNavigate: (path: string) => void; }

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-[#F8FAFF] text-[#1F2937] font-['IBM_Plex_Sans_Arabic',sans-serif] py-10 sm:py-14">
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <button onClick={() => onNavigate('/')} className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB] mb-6 hover:gap-3 transition-all"><ArrowRight className="w-4 h-4" /> العودة للرئيسية</button>
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-10">
        <div className="flex items-start gap-4 mb-8"><div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><LockKeyhole className="w-6 h-6" /></div><div><h1 className="text-2xl sm:text-3xl font-black text-[#1E3A8A]">سياسة الخصوصية وحماية البيانات</h1><p className="text-xs text-slate-500 mt-1">آخر تحديث: 29 أغسطس 2026 — مسودة تحتاج مراجعة قانونية قبل الإطلاق التجاري.</p></div></div>
        <div className="space-y-8 text-sm leading-8">
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2">1) ما البيانات التي نجمعها؟</h2><p>قد نجمع بيانات الحساب مثل الاسم والبريد الإلكتروني ورقم الهاتف، وبيانات الملف مثل المرحلة والمادة والمحافظة والمنطقة، وبيانات استخدام الخدمة مثل الحجوزات والحضور والتقييمات وسجلات الدعم. وقد يجمع المدرس المتقدم للتوثيق صور مستندات الهوية والمؤهلات المطلوبة للتحقق.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2 flex items-center gap-2"><Eye className="w-5 h-5 text-blue-600" />2) لماذا نستخدم هذه البيانات؟</h2><p>لتسجيل الدخول وإدارة الحساب، مطابقة الطالب بالمدرس الموثق، معالجة الحجوزات والمدفوعات، تشغيل الحضور والـQR، منع الاحتيال وإساءة الاستخدام، التواصل التشغيلي، حل النزاعات، تحسين الخدمة، والامتثال للالتزامات القانونية.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2 flex items-center gap-2"><FileCheck className="w-5 h-5 text-emerald-600" />3) لماذا نطلب بطاقة المدرس؟</h2><p>بطاقة الهوية ووثائق المؤهلات قد تُطلب فقط ضمن عملية توثيق المدرس للتحقق من الهوية وتقليل انتحال الشخصية والاحتيال وحماية الطلاب والمنصة. هذه الوثائق ليست جزءًا من بطاقة المدرس العامة، ولا ينبغي أن تظهر للطلاب أو أولياء الأمور إلا بالقدر الذي يسمح به القانون وتحتاجه الخدمة. لا نطلب هذه الوثائق من الطالب أو ولي الأمر كشرط عام لاستخدام البحث.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2 flex items-center gap-2"><Database className="w-5 h-5 text-indigo-600" />4) التخزين والحماية</h2><p>نطبق ضوابط وصول وصلاحيات قاعدة البيانات بحسب الدور، ونحد من الوصول إلى وثائق التوثيق. لا توجد حماية تقنية مطلقة؛ لذلك يجب أيضًا على المستخدم حماية كلمة المرور وعدم مشاركة رموز QR أو بيانات الدخول.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2">5) مشاركة البيانات</h2><p>قد تتم مشاركة الحد الأدنى اللازم مع مزودي البنية التحتية والخدمات التقنية اللازمة لتشغيل المنصة، أو مع أطراف أخرى عندما يكون ذلك ضروريًا لتنفيذ الخدمة أو مطلوبًا قانونيًا. بيانات التوثيق الحساسة لا تُعرض للعامة كجزء من البحث.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2">6) البريد والإشعارات والتسويق</h2><p>قد نرسل رسائل تشغيلية مثل تأكيدات الحساب والتحقق والتنبيهات المهمة. الرسائل التسويقية، عند استخدامها، يجب أن تكون وفق الأساس القانوني المطلوب مع وسيلة واضحة لإيقافها. لا نبيع بيانات المستخدمين لمعلنين.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2">7) الأطفال والقُصّر</h2><p>بعض مستخدمي حِصّتي قد يكونون طلابًا قُصّر. لذلك يجب أن يتم التعامل مع بيانات القُصّر وفق المتطلبات القانونية المعمول بها، ويجب أن يراجع ولي الأمر المعلومات والموافقات الخاصة بالحساب والبيانات عند انطباق ذلك. الخدمة ليست موجهة لجمع بيانات طفل أكثر مما يلزم لتقديم الخدمة التعليمية.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2 flex items-center gap-2"><UserRoundX className="w-5 h-5 text-red-600" />8) حقوقك</h2><p>يمكنك طلب معرفة البيانات المتعلقة بك وتصحيحها أو طلب حذفها أو تقييد بعض أوجه المعالجة أو سحب الموافقة عندما يكون الأساس هو الموافقة، مع مراعاة الحالات التي يجيز فيها القانون الاحتفاظ بالبيانات. تواصل معنا عبر البريد الموضح أدناه.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2">9) الاحتفاظ بالبيانات</h2><p>نحتفظ بالبيانات للمدة اللازمة للغرض الذي جمعت من أجله، وللمدد التي قد تفرضها متطلبات قانونية أو محاسبية أو لحماية الحقوق وفض النزاعات. لا يعني حذف الحساب بالضرورة حذف كل سجل مطلوب الاحتفاظ به قانونًا.</p></section>
          <section><h2 className="text-lg font-black text-[#1E3A8A] mb-2">10) التواصل وطلبات الخصوصية</h2><p>لطلبات الوصول أو التصحيح أو الحذف أو الاستفسارات المتعلقة بالخصوصية: <a className="text-blue-600 font-bold hover:underline" href="mailto:hasstysupport@gmail.com">hasstysupport@gmail.com</a>.</p></section>
        </div>
        <div className="mt-10 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-6 flex items-start gap-2"><ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />تعكس هذه السياسة مبادئ قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020 واللائحة التنفيذية رقم 816 لسنة 2025 بصورة تشغيلية عامة؛ يلزم تدقيق قانوني واعتماد النسخة النهائية قبل الاستخدام التجاري.</div>
      </div>
    </div>
  </div>
);
