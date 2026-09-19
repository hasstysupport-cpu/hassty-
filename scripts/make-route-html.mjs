/**
 * Prerender-lite for Hassty (React SPA + Vite)
 * =====================================================
 * المشكلة: SPA يعرض كل شيء بالجافاسكريبت — جوجل يفهرسها في "الموجة الثانية"
 * (بطيئة) وزواحف الـ AI (GPTBot/ClaudeBot/PerplexityBot) لا تنفّذ JS أصلاً
 * فترى صفحة فارغة بميتا واحدة موحدة لكل الصفحات.
 *
 * الحل: بعد vite build نولّد dist/<route>/index.html لكل صفحة عامة بنفس
 * بوstrap الـ SPA (المستخدم العادي لا يلاحظ فرقاً) لكن بميتا + JSON-LD +
 * محتوى noscript خاص بالصفحة. الملفات الثابتة تُقدَّم من Vercel مباشرة.
 *
 * التشغيل: node scripts/make-route-html.mjs  (يُستدعى تلقائياً ضمن npm run build)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const BASE = 'https://hassty.site';

/** بيانات كل صفحة عامة — يجب أن تطابق useSEO في نفس الصفحة */
const ROUTES = [
  {
    path: '/search',
    title: 'المدرسين المعتمدين للدروس الخصوصية في مصر | منصة حصتي',
    description: 'دوّر على مدرسين معتمدين قريبين منك على منصة حِصّتي: صفِّ النتائج بالمادة والمحافظة والمنطقة والمرحلة، وشوف التقييمات وأسعار الحصص واحجز فوراً.',
    keywords: 'مدرس خصوصي قريب مني, احسن مدرس خصوصي, مدرسين معتمدين في مصر, دروس خصوصية, تقوية, معلم خصوصي, دكتور رياضيات, حِصّتي, Hassty tutor search, private tutor Egypt',
    noscript: 'دليل البحث عن المدرسين الخصوصيين المعتمدين في مصر على منصة حصتي: صفِّ النتائج حسب المادة والمحافظة والمدينة والمرحلة الدراسية، وشاهد التقييمات وسعر الحصة والشهر لكل مدرس موثّق.',
    breadcrumbName: 'المدرسين المعتمدين',
  },
  {
    path: '/for-teachers',
    title: 'انضم كمدرس معتمد - نمِّ دخلك وطلّابك | منصة حصتي',
    description: 'انضم إلى منصة حصتي كمعلم معتمد واستفد من نظام إدارة المجموعات والـ QR كود لمتابعة الطلاب، أقل نسبة عمولة في مصر، وإعلانات موجهة لمنطقتك.',
    keywords: 'انضم كمدرس, سجل كمدرس خصوصي, تدريس خصوصي مصر, زيادة طلاب الدروس, نظام حضور الطلاب للمدرسين, ماسح QR للمدرسين, سناتر تعليمية, Hassty for teachers, tutor Egypt',
    noscript: 'بوابة المدرسين في منصة حصتي: بروفايل عام يستقبل الطلاب، ماسح حضور بكاميرا الهاتف عبر QR كود، إدارة مجموعات ومواعيد ومدفوعات، وعمولة تنازلية تنخفض مع زيادة عدد الطلاب — بدون أي اشتراك شهري.',
    breadcrumbName: 'انضم كمدرس',
  },
  {
    path: '/qr-attendance',
    title: 'نظام تسجيل حضور الطلاب بكود QR للمدرسين والسناتر',
    description: 'سجّل حضور الطلاب بكود QR في أقل من ثانية من موبايل المدرس: بطاقة رقمية فريدة لكل طالب، إشعار فوري لولي الأمر على الواتساب، وتقارير حضور وغياب للسناتر والمجموعات — مجانًا داخل منصة حصتي.',
    keywords: 'تسجيل حضور الطلاب ب QR, نظام حضور وانصراف QR, كود QR للحضور والانصراف, برنامج حضور الطلاب للسنتر, نظام متابعة حضور الطلاب, تسجيل الحضور بالباركود, حضور الطلاب واتساب, QR attendance system Egypt',
    noscript: 'نظام تسجيل حضور الطلاب بكود QR من منصة حصتي: كل طالب يحصل على بطاقة رقمية بكود QR فريد، والمدرس يمسح الكود بكاميرا موبايله أول ما الطالب يدخل الحصة فيتسجل الحضور لحظيًا بالتاريخ والوقت ويصل إشعار فوري لولي الأمر على الواتساب. النظام يوفر تقارير حضور وغياب لكل طالب ومجموعة، ويدعم المساعدين في السناتر ومراكز التقوية، وأكواده فريدة غير قابلة للتزوير — بديل كامل عن كشوف الحضور الورقية، ومجاني داخل منصة حصتي بدون اشتراك شهري.',
    breadcrumbName: 'نظام حضور الطلاب بكود QR',
    // محتوى GEO غني لزواحف الذكاء الاصطناعي التي لا تنفّذ JS (GPTBot/ClaudeBot/PerplexityBot)
    noscriptExtra: `
        <h2 style="font-size:18px;color:#1E3A8A;margin:24px 0 8px">إزاي بتسجّل حضور الطلاب بـ QR؟ (5 خطوات)</h2>
        <ol style="padding-inline-start:20px;line-height:2">
          <li>اكتب اسم الطالب في المنصة — يتولّد له كود QR فريد على بطاقة حضور رقمية.</li>
          <li>الطالب يفتح بطاقته من موبايله أو يحملها مطبوعة.</li>
          <li>المدرس يمسح الكود من ماسح حصتي بكاميرا الموبايل عند دخول الطالب.</li>
          <li>الحضور يتسجل لحظيًا بالتاريخ والوقت في قاعدة البيانات.</li>
          <li>ولي الأمر يستقبل إشعار واتساب فوري يؤكد وصول الطالب للحصة.</li>
        </ol>
        <h2 style="font-size:18px;color:#1E3A8A;margin:24px 0 8px">ليه أكتر من كشف الحضور الورقي؟</h2>
        <ul style="padding-inline-start:20px;line-height:2">
          <li>تسجيل 60 طالبًا في أقل من 3 دقائق بدل 10-15 دقيقة نداء بالاسم.</li>
          <li>أكواد فريدة مربوطة بحساب الطالب — مستحيل تسجيل حضور مكاني.</li>
          <li>تقارير انتظام وغياب جاهزة لكل طالب ومجموعة بضغطة واحدة.</li>
          <li>مناسب للمدرس الفردي والمجموعات والسناتر مع دعم المساعدين.</li>
          <li>مجاني للطلاب وأولياء الأمور وبدون اشتراك شهري للمدرسين.</li>
        </ul>`,
    // JSON-LD كامل لزواحف الـ AI: SoftwareApplication + HowTo + FAQPage
    pageGraph: [
      {
        '@type': 'SoftwareApplication',
        '@id': `${BASE}/qr-attendance#app`,
        name: 'حصتي — نظام تسجيل حضور الطلاب بكود QR',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        description: 'نظام حضور ذكي للدروس الخصوصية والسناتر في مصر: بطاقة QR فريدة لكل طالب، مسح بكاميرا الموبايل، إشعار فوري لولي الأمر على الواتساب، وتقارير انتظام تفصيلية.',
        url: `${BASE}/qr-attendance`,
        inLanguage: 'ar-EG',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EGP', description: 'مجاني للطلاب وأولياء الأمور وبدون اشتراك شهري للمدرسين' },
      },
      {
        '@type': 'HowTo',
        '@id': `${BASE}/qr-attendance#howto`,
        name: 'كيف تسجّل حضور الطلاب بكود QR في منصة حصتي',
        totalTime: 'PT2M',
        tool: 'موبايل المدرس بكاميرا + منصة حصتي',
        step: [
          { '@type': 'HowToStep', position: 1, name: 'اكتب اسم الطالب في المنصة', text: 'المدرس أو المساعد يضيف طلاب مجموعته على منصة حصتي، فيولّد النظام لكل طالب بطاقة حضور رقمية شخصية تحمل كود QR فريد.' },
          { '@type': 'HowToStep', position: 2, name: 'الطالب يحمل بطاقة الـ QR بتاعته', text: 'الطالب يفتح بطاقته الرقمية من موبايله أو يحمل نسخة مطبوعة من كود QR.' },
          { '@type': 'HowToStep', position: 3, name: 'المدرس يمسح الكود من موبايله', text: 'أول ما الطالب يدخل القاعة، المدرس يفتح ماسح الـ QR من منصة حصتي على موبايله ويمسح كود الطالب بكاميرا الهاتف مباشرة.' },
          { '@type': 'HowToStep', position: 4, name: 'الحضور يتسجل لحظيًا في النظام', text: 'في أقل من ثانية واحدة يتسجل الطالب حاضرًا بتاريخ ووقت الحصة بدقة، ويُحدَّث عدد حضوره في التقارير تلقائيًا.' },
          { '@type': 'HowToStep', position: 5, name: 'ولي الأمر يستقبل إشعارًا فوريًا', text: 'بمجرد المسح يصل إشعار فوري لولي الأمر على الواتساب يؤكد وصول ابنه للحصة في وقته.' },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${BASE}/qr-attendance#faq`,
        mainEntity: [
          { '@type': 'Question', name: 'إيه هو نظام تسجيل حضور الطلاب بكود QR؟', acceptedAnswer: { '@type': 'Answer', text: 'نظام آلي لتوثيق حضور وانصراف الطلاب: كل طالب يملك بطاقة رقمية بكود QR فريد يمسحه المدرس بكاميرا موبايله عند دخول الطالب، فيتسجل الحضور لحظيًا ويصل إشعار فوري لولي الأمر على الواتساب — بديل كامل عن كشوف الحضور الورقية.' } },
          { '@type': 'Question', name: 'إزاي أسجل حضور الطلاب بكود QR من الموبايل؟', acceptedAnswer: { '@type': 'Answer', text: 'افتح ماسح الـ QR من حسابك كمدرس في منصة حصتي، وجّه كاميرا الموبايل لكود الطالب، وهيتسجل الحضور في أقل من ثانية — بدون تحميل تطبيقات.' } },
          { '@type': 'Question', name: 'هل يمكن للسناتر ومراكز التقوية استخدام نظام الحضور بالـ QR؟', acceptedAnswer: { '@type': 'Answer', text: 'نعم، كل مجموعة ليها قائمة طلابها وأكوادها، والمساعد أو موظف الاستقبال يمسح أكواد الطلاب الواردين، والمالك يتابع تقارير الحضور لكل مجموعات المركز من لوحة واحدة.' } },
          { '@type': 'Question', name: 'هل يوصل ولي الأمر إشعار لحظة تسجيل الحضور؟', acceptedAnswer: { '@type': 'Answer', text: 'نعم، أول ما المدرس يمسح كود الطالب يصل ولي الأمر إشعار فوري على الواتساب يوضح اسم الطالب ووقت وصوله للحصة.' } },
          { '@type': 'Question', name: 'هل نظام حضور الـ QR في حصتي مجاني؟', acceptedAnswer: { '@type': 'Answer', text: 'نعم، متاح لكل المدرسين الاعتماديين بدون اشتراك شهري — المنصة مجانية للطلاب وأولياء الأمور، والمدرس يدفع عمولة تنازلية تنخفض كلما زاد عدد طلابه.' } },
        ],
      },
    ],
  },
  {
    path: '/about',
    title: 'عن منصة حصتي — الرؤية والرسالة التعليمية في مصر | منصة حصتي',
    description: 'تعرف على قصة منصة حصتي، المنظومة المصرية المبتكرة لربط الطلاب والمدرسين الخصوصيين بنظام الحضور الذكي بالـ QR كود وتقارير المتابعة الفورية لأولياء الأمور.',
    keywords: 'عن حصتي, رؤية منصة حصتي, فريق حصتي التعليمية, نظام حضور الطلاب QR, التعليم في مصر, Hassty Egypt',
    noscript: 'قصة منصة حصتي: منظومة تعليمية مصرية تربط الطلاب وأولياء الأمور بالمدرسين الخصوصيين الموثقين، بنظام حضور ذكي بالـ QR كود وتقارير متابعة فورية، ورؤية واضحة لتنظيم سوق الدروس الخصوصية في مصر.',
    breadcrumbName: 'عن حصتي',
  },
  {
    path: '/contact',
    title: 'اتصل بنا والدعم الفني | منصة حصتي',
    description: 'تواصل مع فريق الدعم الفني لمنصة حصتي للاستفسارات العامة ودعم المدرسين والطلاب وأولياء الأمور عبر جروبات الدعم الرسمية على تليجرام وواتساب.',
    keywords: 'اتصل بنا حصتي, دعم منصة حصتي, خدمة العملاء, مساعدة أولياء الأمور والطلاب',
    noscript: 'تواصل مع دعم منصة حصتي يومياً من 9 صباحاً حتى 10 مساءً عبر جروبات الدعم الرسمية على تليجرام وواتساب — للطلاب وأولياء الأمور والمدرسين.',
    breadcrumbName: 'اتصل بنا',
  },
  {
    path: '/login',
    title: 'تسجيل الدخول — طالب، ولي أمر، أو مدرس | منصة حصتي',
    description: 'سجّل الدخول إلى حسابك في منصة حصتي لمتابعة الحصص، الحضور بالـ QR، الدرجات، والمدفوعات. دخول آمن بكلمة المرور أو بحساب جوجل.',
    keywords: 'تسجيل دخول حصتي, دخول الطالب, دخول ولي الأمر, دخول المدرس, Hassty login',
    noscript: 'صفحة تسجيل الدخول إلى منصة حصتي للطلاب وأولياء الأمور والمدرسين والمعلمين المساعدين.',
    breadcrumbName: 'تسجيل الدخول',
  },
  {
    path: '/signup',
    title: 'إنشاء حساب جديد — طالب، ولي أمر، أو مدرس | منصة حصتي',
    description: 'أنشئ حسابك المجاني على منصة حصتي في دقيقة: حساب طالب لمتابعة الحصص والدرجات، حساب ولي أمر لمتابعة أبنائك، أو حساب مدرس لإدارة مجموعاتك وأرباحك.',
    keywords: 'إنشاء حساب حصتي, تسجيل طالب جديد, تسجيل ولي أمر, حساب مدرس, Hassty signup',
    noscript: 'إنشاء حساب مجاني على منصة حصتي: حساب طالب لمتابعة الحصص والدرجات، حساب ولي أمر لمتابعة الأبناء، أو حساب مدرس لإدارة المجموعات والأرباح.',
    breadcrumbName: 'إنشاء حساب',
  },
  {
    path: '/assistant/signup',
    title: 'التسجيل كمساعد مدرس | منصة حصتي',
    description: 'انضم كمساعد مدرس على منصة حصتي: ساعد المدرسين في الحضور والمدفوعات واربح دخلًا إضافيًا من خلال اعتماد المدرسين لك ضمن مجموعاتهم.',
    keywords: 'مساعد مدرس, وظيفة مساعد تدريس, مساعد مدرس خصوصي, Hassty assistant',
    noscript: 'التسجيل كمساعد مدرس على منصة حصتي: اعمل مع المدرسين على تسجيل الحضور والمدفوعات واكسب دخلاً إضافياً بعد اعتماد المدرسين لك.',
    breadcrumbName: 'التسجيل كمساعد',
  },
  ...[
    ['terms', 'شروط الاستخدام', 'شروط استخدام منصة حصتي: قواعد الحسابات والحجوزات والمدفوعات والاستخدام المقبول للطلاب وأولياء الأمور والمدرسين.'],
    ['privacy', 'سياسة الخصوصية', 'سياسة خصوصية منصة حصتي: كيف نجمع بيانات الطلاب وأولياء الأمور والمدرسين ونحميها ونشاركها بما يوافق القوانين المعمول بها.'],
    ['teacher', 'توثيق المعلمين وشروط الخدمة', 'شروط خدمة المعلمين وتوثيقهم على منصة حصتي: إجراءات التوثيق، العمولة التنازلية، سياسة الإلغاء والاستبدال.'],
    ['cookies', 'سياسة الكوكيز', 'سياسة ملفات تعريف الارتباط (Cookies) في منصة حصتي: ما الذي نخزنه على جهازك ولماذا وكيف تتحكم فيه.'],
    ['acceptable', 'الاستخدام المقبول', 'سياسة الاستخدام المقبول لمنصة حصتي: السلوكيات المسموحة والممنوعة على المنصة وحماية مجتمع الطلاب والمدرسين.'],
    ['refund', 'الدفع والاسترداد', 'سياسة الدفع والاسترداد في منصة حصتي: طرق الدفع، جدول المبالغ، حالات استرداد قيمة الحصص والاشتراكات.'],
    ['rights', 'حقوق البيانات', 'حقوق البيانات الشخصية على منصة حصتي: حق الوصول والتصحيح والحذف والاعتراض وفق اللوائح المعمول بها.'],
  ].map(([slug, name, desc]) => ({
    path: `/legal/${slug}`,
    title: `${name} | منصة حصتي`,
    description: desc,
    keywords: `${name}, حصتي, Hassty legal`,
    noscript: `${name} في منصة حصتي: ${desc}`,
    breadcrumbName: name,
  })),
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonldFor = (r) => {
  // صفحات بتوفر JSON-LD كامل خاص بيها (مثل /qr-attendance): نحقن الـ @graph كامل مع Breadcrumb وWebPage
  if (r.pageGraph) {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${BASE}/` },
            { '@type': 'ListItem', position: 2, name: r.breadcrumbName, item: `${BASE}${r.path}` },
          ],
        },
        {
          '@type': 'WebPage',
          '@id': `${BASE}${r.path}#webpage`,
          url: `${BASE}${r.path}`,
          name: r.title,
          description: r.description,
          isPartOf: { '@id': `${BASE}/#website` },
          inLanguage: 'ar-EG',
        },
        ...r.pageGraph,
      ],
    });
  }
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${BASE}/` },
          { '@type': 'ListItem', position: 2, name: r.breadcrumbName, item: `${BASE}${r.path}` },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': `${BASE}${r.path}#webpage`,
        url: `${BASE}${r.path}`,
        name: r.title,
        description: r.description,
        isPartOf: { '@id': `${BASE}/#website` },
        inLanguage: 'ar-EG',
      },
    ],
  });
};

const NOSCRIPT = (r) => {
  const inner = [
    `        <h1 style="font-size:22px;color:#1D4ED8;margin-bottom:12px">${esc(r.title)}</h1>`,
    `        <p>${esc(r.noscript)}</p>`,
    ...(r.noscriptExtra ? [r.noscriptExtra] : []),
    `        <ul style="padding-inline-start:20px">`,
    `          <li><a href="/" style="color:#2563EB">منصة حصتي — الرئيسية</a></li>`,
    `          <li><a href="/search" style="color:#2563EB">البحث عن مدرسين خصوصيين معتمدين</a></li>`,
    `        </ul>`,
    `        <p>يرجى تفعيل الجافاسكريبت لاستخدام المنصة بالكامل.</p>`,
  ].join('\n');
  return `    <noscript>\n      <div style="max-width:720px;margin:40px auto;padding:0 20px;font-family:system-ui,sans-serif;direction:rtl;text-align:right;line-height:1.9;color:#1F2937">\n${inner}\n      </div>\n    </noscript>`;
};

// ============ main ============
let html;
try {
  html = readFileSync(join(DIST, 'index.html'), 'utf8');
} catch {
  console.error('✗ dist/index.html غير موجود — شغّل vite build أولاً');
  process.exit(1);
}

let count = 0;
for (const r of ROUTES) {
  let out = html;
  const url = `${BASE}${r.path}`;

  out = out
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(r.title)}</title>`)
    .replace(/<meta name="title" content="[^"]*"\s*\/?>/, `<meta name="title" content="${esc(r.title)}" />`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(r.description)}" />`)
    .replace(/<meta name="keywords" content="[^"]*"\s*\/?>/, `<meta name="keywords" content="${esc(r.keywords)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(r.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(r.description)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${esc(r.title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${esc(r.description)}" />`);

  // محتوى noscript خاص بالصفحة (للزواحف التي لا تنفّذ JS)
  out = out.replace(/<noscript>[\s\S]*?<\/noscript>/, () => NOSCRIPT(r));

  // JSON-LD خاص بالصفحة (Breadcrumb + WebPage) قبل إغلاق head
  out = out.replace('</head>', `    <script type="application/ld+json" data-route="prerendered">${jsonldFor(r)}</script>\n  </head>`);

  const filePath = join(DIST, r.path.replace(/^\//, ''), 'index.html');
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, out);
  count++;
  console.log(`✓ prerendered ${r.path}`);
}

console.log(`\nDone: ${count} static route HTML files generated in dist/`);
