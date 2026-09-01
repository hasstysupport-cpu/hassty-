import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, FileText, LockKeyhole, Baby, GraduationCap, CheckCircle2, ArrowRight, Mail, Trash2, Eye, Database, Scale, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const POLICY_VERSION = '2026-08-29-v1';
const PRIVACY_VERSION = '2026-08-29-v1';

type LegalKind = 'terms' | 'privacy' | 'acceptable' | 'refund' | 'cookies' | 'rights' | 'teacher';

const navItems: Array<{ kind: LegalKind; title: string; icon: React.ReactNode }> = [
  { kind: 'terms', title: 'شروط الاستخدام', icon: <FileText className="w-4 h-4" /> },
  { kind: 'privacy', title: 'سياسة الخصوصية', icon: <LockKeyhole className="w-4 h-4" /> },
  { kind: 'acceptable', title: 'الاستخدام المقبول', icon: <ShieldCheck className="w-4 h-4" /> },
  { kind: 'refund', title: 'الدفع والاسترداد', icon: <Scale className="w-4 h-4" /> },
  { kind: 'cookies', title: 'ملفات الارتباط', icon: <Database className="w-4 h-4" /> },
  { kind: 'rights', title: 'حقوق البيانات', icon: <Eye className="w-4 h-4" /> },
  { kind: 'teacher', title: 'توثيق المدرسين', icon: <GraduationCap className="w-4 h-4" /> },
];

function pathToKind(path: string): LegalKind | null {
  const match = /^\/legal\/(terms|privacy|acceptable|refund|cookies|rights|teacher)$/.exec(path);
  return (match?.[1] as LegalKind) || null;
}

function legalDocument(kind: LegalKind) {
  const commonIntro = 'هذه السياسة مكتوبة بصورة مبسطة لتوضيح طريقة عمل حِصّتي والتزامات المستخدمين. لا تُعد هذه الصفحة استشارة قانونية، ويجب مراجعة مستشار قانوني مصري قبل الإطلاق التجاري النهائي.';
  if (kind === 'terms') return {
    title: 'شروط استخدام حِصّتي',
    icon: <FileText className="w-7 h-7" />,
    intro: commonIntro,
    sections: [
      ['1. قبول الشروط', 'باستخدام المنصة أو إنشاء حساب، يقر المستخدم بقراءة الشروط والموافقة عليها. إذا لم توافق، يجب عدم إنشاء الحساب أو استخدام الخدمات.'],
      ['2. طبيعة المنصة', 'حِصّتي منصة تقنية لتنظيم الوصول إلى خدمات الدروس والتواصل والحجوزات والحضور. لا تضمن المنصة نجاحًا دراسيًا محددًا، ولا تُعد بديلًا عن مسؤولية المدرس أو الطالب أو ولي الأمر عن القرارات التعليمية.'],
      ['3. مسؤولية الحساب', 'المستخدم مسؤول عن صحة بياناته وسرية وسائل الدخول وعن كل استخدام يتم من حسابه. يمنع مشاركة الحساب أو انتحال شخصية شخص آخر.'],
      ['4. المدرسون والتوثيق', 'المدرس مسؤول عن صحة بياناته ومستنداته وعن التزامه بالقوانين والقواعد المهنية. اعتماد المنصة يعني تحققًا إداريًا وفق إجراءاتنا، ولا يشكل ترخيصًا حكوميًا أو ضمانًا لجودة التدريس أو النتائج.'],
      ['5. الحجز والدفع', 'الحجوزات والرسوم والاسترداد تخضع للبيانات المعروضة وقت الطلب والسياسة الخاصة بالدفع والاسترداد. أي مبالغ خارج المنصة يجب ألا تُرسل إلا عبر قنوات معتمدة ومذكورة بوضوح داخل الخدمة.'],
      ['6. الحضور وQR', 'يُستخدم QR لتسجيل حضور الطالب ضمن المجموعات والحصص المصرح بها. يمنع مشاركة QR أو العبث بسجلات الحضور أو تسجيل حضور شخص آخر.'],
      ['7. السلوك المحظور', 'يحظر الاحتيال، انتحال الهوية، التهديد، التحرش، نشر محتوى غير قانوني، محاولة تجاوز الصلاحيات، اختراق الأنظمة، أو استخدام بيانات الآخرين دون إذن.'],
      ['8. التعليق والإيقاف', 'يجوز للمنصة تعليق أو إنهاء الحساب أو تقييد خدمة معينة عند الاشتباه في إساءة استخدام أو مخالفة الشروط، مع مراعاة الإجراءات والحقوق القانونية الواجبة.'],
      ['9. المحتوى وحقوق الملكية', 'يحتفظ المستخدم بحقوقه في المحتوى الذي يملكه، ويمنح المنصة فقط الترخيص التقني اللازم لتقديم الخدمة. يمنع رفع مواد لا يملك المستخدم حق استخدامها.'],
      ['10. الخدمات الخارجية', 'قد تعتمد بعض الوظائف على خدمات خارجية مثل البريد الإلكتروني أو الدفع أو التخزين السحابي. يخضع الجزء الخارجي لشروط مزود الخدمة وسياسة الخصوصية الخاصة به.'],
      ['11. التعديلات', 'قد تتغير الشروط عند إضافة وظائف أو متطلبات قانونية جديدة. سنعرض تاريخ النسخة ونوضح التغييرات الجوهرية. استمرار الاستخدام بعد النفاذ يعني قبول النسخة المحدثة، باستثناء الحالات التي يتطلب فيها القانون موافقة جديدة.'],
      ['12. التواصل', 'للاستفسارات والشكاوى المتعلقة بالشروط: hasstysupport@gmail.com'],
    ],
  };

  if (kind === 'privacy') return {
    title: 'سياسة الخصوصية وحماية البيانات',
    icon: <LockKeyhole className="w-7 h-7" />,
    intro: 'توضح هذه السياسة ما نجمعه ولماذا نستخدمه وكيف يمكن للمستخدم ممارسة حقوقه. نطبقها مع مراعاة قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020 واللائحة التنفيذية رقم 816 لسنة 2025 والإرشادات ذات الصلة الصادرة عن مركز حماية البيانات الشخصية، بحسب ما ينطبق على الخدمة.',
    sections: [
      ['1. البيانات التي قد نجمعها', 'بيانات الحساب مثل الاسم والبريد الإلكتروني ورقم الهاتف والدور الدراسي؛ بيانات الموقع التعليمية مثل المحافظة والمدينة والمرحلة والمادة؛ بيانات الحجوزات والمجموعات والحضور وQR؛ بيانات الدفع والمعاملات اللازمة لإثبات العملية؛ وبيانات تقنية أساسية مثل نوع الجهاز والسجلات الأمنية عند الحاجة.'],
      ['2. مستندات المدرس', 'قد نطلب بطاقة هوية ووثائق أو شهادات مهنية من المدرس بهدف التحقق من الهوية والمؤهلات وتقليل الاحتيال وحماية الطلاب وأولياء الأمور. لا تُعرض مستندات الهوية للعامة ضمن ملف المدرس، ويُقصر الوصول إليها على من يحتاجه لأغراض التحقق والإدارة المصرح بها وبحسب متطلبات القانون.'],
      ['3. لماذا نستخدم البيانات؟', 'لإنشاء الحساب وإدارته، تنفيذ الحجز، ربط ولي الأمر بالطالب، تشغيل الحضور، التحقق من المدرسين، منع الاحتيال وإساءة الاستخدام، معالجة المدفوعات، دعم المستخدمين، تحسين الأمان والأداء، والوفاء بالالتزامات القانونية.'],
      ['4. الأساس القانوني', 'قد يكون المعالجة قائمة على موافقة صريحة، أو ضرورة تنفيذ خدمة/عقد، أو التزام قانوني، أو حماية حق قانوني، أو مصلحة مشروعة في الحدود المسموح بها. لا نستخدم موافقة واحدة عامة لتغطية أغراض مختلفة لا يفهمها المستخدم.'],
      ['5. الأطفال والقُصّر', 'الخدمات التعليمية قد تتعامل مع بيانات الطلاب القُصّر. نطلب بيانات ولي الأمر عند الحاجة، ونطبق ضوابط إضافية على بيانات الأطفال. بالنسبة للموافقة على معالجة بيانات الطفل، نتعامل مع متطلبات الولي القانوني والسن كما تقرره القواعد السارية.'],
      ['6. المشاركة مع أطراف أخرى', 'قد نشارك الحد الأدنى اللازم مع مزودي الاستضافة والمصادقة والبريد والدفع والخدمات التقنية الذين يعالجون البيانات نيابة عنا، أو مع الجهات المختصة عندما يوجب القانون ذلك. لا نبيع البيانات الشخصية للمعلنين.'],
      ['7. النقل والتخزين', 'قد تتم معالجة بعض البيانات عبر مزودي خدمات خارج مصر بحسب البنية التقنية المستخدمة. تُدار هذه العمليات مع مراعاة متطلبات النقل أو المشاركة عبر الحدود التي تنطبق قانونيًا.'],
      ['8. الأمان', 'نستخدم ضوابط وصول وصلاحيات وقواعد أمنية وتشفيرًا أثناء النقل وإجراءات لمراقبة الحسابات والخدمات. لا توجد وسيلة إلكترونية تضمن أمانًا مطلقًا، لذلك نطلب من المستخدم حماية بيانات الدخول وعدم مشاركة الرموز.'],
      ['9. الاحتفاظ', 'نحتفظ بالبيانات فقط للمدة اللازمة للغرض الذي جُمعت من أجله أو للمدة التي يفرضها القانون أو يحتاجها إثبات الحقوق ومنع الاحتيال وحل النزاعات. قد نحتفظ بسجل الموافقات والعمليات القانونية عندما يلزم إثباتها.'],
      ['10. حقوق المستخدم', 'بحسب ما ينطبق قانونًا، قد تشمل الحقوق طلب الوصول إلى البيانات أو تصحيحها أو تحديثها أو محوها أو سحب الموافقة أو الاعتراض أو طلب تقييد بعض المعالجة. قد نطلب التحقق من الهوية قبل تنفيذ الطلب.'],
      ['11. التواصل', 'لطلبات الخصوصية وحماية البيانات: hasstysupport@gmail.com. سنعمل على توثيق الطلب ومتابعته وفق الإجراءات والمهل القانونية المنطبقة.'],
      ['12. تاريخ السريان', `آخر تحديث: 29 أغسطس 2026 — رقم النسخة ${PRIVACY_VERSION}.`],
    ],
  };

  if (kind === 'teacher') return {
    title: 'لماذا نطلب مستندات توثيق المدرس؟',
    icon: <GraduationCap className="w-7 h-7" />,
    intro: 'التوثيق ليس لإحراج المدرس أو نشر بياناته؛ الغرض الأساسي هو تقليل انتحال الهوية والملفات الوهمية ورفع مستوى الثقة داخل المنصة.',
    sections: [
      ['ما الذي قد نطلبه؟', 'بيانات الهوية الأساسية، بطاقة الهوية أو وثائق تحقق، شهادات أو مؤهلات أو مستندات مهنية مرتبطة بطلب التوثيق، وبيانات التواصل اللازمة لمراجعة الطلب.'],
      ['لماذا نحتاجها؟', 'للتحقق من أن صاحب الحساب شخص حقيقي، ومقارنة بيانات الحساب بالمستندات المقدمة، واكتشاف الحسابات الوهمية أو المتعددة أو المنسوخة، وتقليل مخاطر الاحتيال على الطلاب وأولياء الأمور.'],
      ['هل تظهر البطاقة للطلاب؟', 'لا. مستندات الهوية ليست جزءًا من الملف العام للمدرس. الذي يظهر للعامة هو حالة التوثيق وبعض البيانات العامة التي يختارها المدرس أو تتطلبها الخدمة.'],
      ['من يصل إليها؟', 'الوصول إلى المستندات مقيد بالجهات والأشخاص المصرح لهم داخل عملية المراجعة. لا يُفترض استخدامها للتسويق أو نشرها للعامة.'],
      ['هل التوثيق ضمان؟', 'لا. التوثيق إجراء تحقق من الهوية/المؤهلات وفق المعلومات والمستندات المقدمة، ولا يمثل ترخيصًا حكوميًا ولا يضمن جودة التدريس أو النتائج.'],
      ['لو لم أوافق؟', 'يمكنك عدم تقديم المستندات، لكن قد لا تتاح لك خدمات المدرسين التي تتطلب توثيقًا، مثل الظهور العام في دليل المدرسين أو إنشاء مجموعات وحجوزات كمدرس موثق.'],
      ['التعديل أو طلب الحذف', 'يمكنك التواصل معنا لطلب تصحيح البيانات أو معرفة البيانات المحتفظ بها أو طلب حذف ما يجوز حذفه قانونًا. قد نحتفظ ببعض السجلات إذا كان الاحتفاظ بها مطلوبًا قانونًا أو ضروريًا لإثبات حق أو منع احتيال.'],
    ],
  };

  const generic: Record<string, { title: string; icon: React.ReactNode; intro: string; sections: string[][] }> = {
    acceptable: { title: 'سياسة الاستخدام المقبول', icon: <ShieldCheck className="w-7 h-7" />, intro: 'استخدم حِصّتي للتعليم والخدمات المرتبطة به بصورة مشروعة وآمنة.', sections: [
      ['مسموح', 'التعلم، الحجز، إدارة المجموعات، متابعة الحضور، التواصل المحترم، ورفع المحتوى الذي يملك المستخدم حق استخدامه.'],
      ['ممنوع', 'الاحتيال، الحسابات الوهمية، سرقة الحسابات، spam، جمع بيانات الآخرين دون إذن، تغيير أو تزوير الحضور، مشاركة مستندات الآخرين، ومحاولات تجاوز أنظمة الأمان.'],
      ['بلاغات الأمان', 'يمكن الإبلاغ عن سلوك غير مناسب أو طلب مراجعة قرار متعلق بالحساب عبر قنوات الدعم.'],
    ] },
    refund: { title: 'الدفع والاسترداد', icon: <Scale className="w-7 h-7" />, intro: 'نريد أن تكون رسوم الخدمة وحالات الإلغاء والاسترداد واضحة قبل تأكيد أي عملية.', sections: [
      ['قبل الدفع', 'يجب عرض المبلغ والعملة وما إذا كانت الرسوم للحصة أو الخدمة أو الاشتراك، وأي رسوم إضافية معروفة، قبل التأكيد.'],
      ['الإلغاء والاسترداد', 'أي استرداد يعتمد على نوع الخدمة وحالتها وما هو معروض وقت الشراء والقانون واجب التطبيق. لا نعد باسترداد مبلغ لمجرد وجود طلب إذا كانت الخدمة قد نُفذت أو كان هناك استثناء قانوني.'],
      ['نزاعات الدفع', 'إذا حدثت مشكلة في عملية دفع، احتفظ بإثبات العملية وتواصل معنا فورًا عبر hasstysupport@gmail.com.'],
    ] },
    cookies: { title: 'سياسة ملفات الارتباط', icon: <Database className="w-7 h-7" />, intro: 'نستخدم ملفات الارتباط والتخزين المحلي بالقدر اللازم لتشغيل الواجهة وحفظ تفضيلات الجلسة وتحسين الأمان وتجربة الاستخدام.', sections: [
      ['ضرورية', 'تساعد في جلسة الدخول والتنقل وإعدادات الأمان والوظائف الأساسية.'],
      ['قياس وتحسين', 'قد نستخدم قياسات تقنية لتحسين الأداء أو اكتشاف الأخطاء وفق الإعدادات والموافقات المطلوبة.'],
      ['التحكم', 'يمكنك إدارة ملفات الارتباط من إعدادات المتصفح. تعطيل بعض الملفات قد يؤثر على وظائف المنصة.'],
    ] },
    rights: { title: 'حقوق البيانات وطلبات المحو', icon: <Eye className="w-7 h-7" />, intro: 'نحن نريد أن يكون للمستخدم طريق واضح لمعرفة بياناته والتحكم فيها ضمن الحدود القانونية.', sections: [
      ['الوصول', 'يمكنك طلب معرفة فئات البيانات التي نعالجها ونسخة منها متى كان ذلك متاحًا قانونًا.'],
      ['التصحيح', 'يمكنك طلب تصحيح أو تحديث البيانات غير الدقيقة.'],
      ['المحو', 'يمكنك طلب حذف البيانات التي لا يلزم الاحتفاظ بها. قد تبقى بعض السجلات عندما يفرض القانون الاحتفاظ بها أو تكون لازمة لإثبات الحقوق أو منع الاحتيال.'],
      ['سحب الموافقة', 'يمكنك سحب الموافقة في الحالات التي تعتمد المعالجة فيها على الموافقة، وقد يؤثر ذلك على توافر بعض الخدمات.'],
      ['كيف تقدم الطلب؟', 'أرسل طلبك إلى hasstysupport@gmail.com مع وصف الطلب وبيانات الحساب. قد نطلب تحققًا مناسبًا من الهوية قبل الإفصاح أو التعديل أو الحذف.'],
    ] },
  };
  return generic[kind] || generic.acceptable;
}

export const LegalComplianceLayer: React.FC = () => {
  const [path, setPath] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [teacherAck, setTeacherAck] = useState(false);
  const [consentSaved, setConsentSaved] = useState(false);
  const [bannerError, setBannerError] = useState('');

  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    const id = window.setInterval(sync, 250);
    return () => { window.removeEventListener('popstate', sync); window.clearInterval(id); };
  }, []);

  const kind = useMemo(() => pathToKind(path), [path]);

  useEffect(() => {
    setTermsAccepted(false);
    setTeacherAck(false);
    setConsentSaved(false);
    setBannerError('');
  }, [path]);

  useEffect(() => {
    if (path !== '/signup') return;
    const submitGuard = (event: Event) => {
      if (!termsAccepted) {
        event.preventDefault();
        event.stopPropagation();
        setBannerError('لا يمكن إنشاء الحساب قبل قراءة والموافقة على شروط الاستخدام وسياسة الخصوصية.');
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        return;
      }
      if (!consentSaved) {
        setBannerError('جاري حفظ موافقة الخصوصية… اضغط حفظ الموافقة ثم أعد المحاولة.');
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener('submit', submitGuard, true);
    return () => document.removeEventListener('submit', submitGuard, true);
  }, [path, termsAccepted, consentSaved]);

  const saveConsent = async () => {
    setBannerError('');
    try {
      const email = (document.querySelector('input[type="email"]') as HTMLInputElement | null)?.value?.trim().toLowerCase() || '';
      const roleText = Array.from(document.querySelectorAll('button')).find((button) => /طالب بـ|ولي أمر بـ|مدرس بـ|طالب|ولي أمر|مدرس/.test(button.textContent || ''))?.textContent || '';
      if (supabase) {
        const { error } = await supabase.from('legal_consents').insert({
          email: email || null,
          policy_version: POLICY_VERSION,
          privacy_version: PRIVACY_VERSION,
          terms_accepted: true,
          teacher_verification_acknowledged: teacherAck,
          consent_text: `قبول الشروط والخصوصية — ${POLICY_VERSION}`,
          user_agent: navigator.userAgent,
          consented_at: new Date().toISOString(),
          role_hint: roleText.includes('مدرس') ? 'teacher' : roleText.includes('ولي') ? 'parent' : roleText.includes('طالب') ? 'student' : null,
        });
        if (error) throw error;
      }
      setConsentSaved(true);
      setBannerError('تم حفظ الموافقة ✅');
    } catch (error: any) {
      setConsentSaved(false);
      setBannerError(error?.message || 'تعذر حفظ الموافقة. حاول مرة أخرى.');
    }
  };

  const legalDoc = kind ? legalDocument(kind) : null;

  return (
    <>
      {legalDoc && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/35 backdrop-blur-sm p-3 sm:p-6" dir="rtl">
          <div className="min-h-full flex items-start justify-center py-4 sm:py-8">
            <div className="w-full max-w-5xl rounded-[2rem] bg-white shadow-2xl border border-slate-200 overflow-hidden">
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-5 sm:px-8 py-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">{legalDoc.icon}</div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900">{legalDoc.title}</h1>
                    <p className="text-[11px] text-slate-500 mt-0.5">آخر تحديث: 29 أغسطس 2026</p>
                  </div>
                </div>
                <button onClick={() => window.history.back()} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500" aria-label="إغلاق"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 sm:p-8">
                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm leading-7 text-slate-700">{legalDoc.intro}</div>
                <div className="mt-6 space-y-5">
                  {legalDoc.sections.map(([heading, body]) => (
                    <section key={heading} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                      <h2 className="font-black text-slate-900 mb-2">{heading}</h2>
                      <p className="text-sm text-slate-600 leading-8">{body}</p>
                    </section>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 leading-7">
                  هذه الصياغة تهدف إلى توضيح المنتج وتقليل الالتباس ولا تُغني عن مراجعة قانونية متخصصة قبل الإطلاق التجاري، خصوصًا ما يتعلق بالتراخيص، ونقل البيانات عبر الحدود، وبيانات القُصّر، والتسويق المباشر.
                </div>
                <button onClick={() => window.history.back()} className="mt-6 w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2"><ArrowRight className="w-4 h-4" /> الرجوع للموقع</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {path === '/signup' && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-5 sm:w-[430px] z-[110]" dir="rtl">
          <div className="rounded-3xl bg-white border border-slate-200 shadow-2xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0"><ShieldCheck className="w-5 h-5" /></div>
              <div>
                <div className="font-black text-slate-900 text-sm">قبل إنشاء الحساب</div>
                <p className="text-[11px] leading-6 text-slate-600 mt-1">نستخدم بيانات الحساب لتشغيل الخدمة وحماية المستخدمين. للمدرسين، قد نطلب مستندات تحقق مثل بطاقة الهوية والشهادات لأغراض التوثيق ومنع الانتحال. لا نعرض مستندات الهوية للعامة.</p>
              </div>
            </div>
            <label className="mt-4 flex items-start gap-2 cursor-pointer text-xs text-slate-700 leading-6">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); setConsentSaved(false); setBannerError(''); }} className="mt-1 w-4 h-4 accent-blue-600" />
              <span>قرأت ووافقت على <button type="button" onClick={() => window.history.pushState({}, '', '/legal/terms')} className="text-blue-700 font-bold underline">شروط الاستخدام</button> و<button type="button" onClick={() => window.history.pushState({}, '', '/legal/privacy')} className="text-blue-700 font-bold underline">سياسة الخصوصية</button> وأفهم أغراض معالجة بياناتي.</span>
            </label>
            <label className="mt-2 flex items-start gap-2 cursor-pointer text-xs text-slate-700 leading-6">
              <input type="checkbox" checked={teacherAck} onChange={(e) => { setTeacherAck(e.target.checked); setConsentSaved(false); }} className="mt-1 w-4 h-4 accent-emerald-600" />
              <span>أقرّ بأن فهمي لدور التوثيق للمدرس يشمل معالجة مستندات الهوية/المؤهلات عند الحاجة، وفق سياسة التوثيق والخصوصية.</span>
            </label>
            <button disabled={!termsAccepted || consentSaved} onClick={saveConsent} className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-45 text-white text-xs font-black flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> {consentSaved ? 'تم حفظ الموافقة' : 'حفظ الموافقة والمتابعة'}</button>
            {bannerError && <div className={`mt-2 text-[11px] font-bold ${consentSaved ? 'text-emerald-700' : 'text-red-700'}`}>{bannerError}</div>}
            <div className="mt-3 text-[10px] text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> طلبات الخصوصية: hasstysupport@gmail.com <Trash2 className="w-3 h-3 mr-2" /> طلبات المحو متاحة وفق القانون</div>
          </div>
        </div>
      )}
    </>
  );
};

export { POLICY_VERSION, PRIVACY_VERSION, navItems };
