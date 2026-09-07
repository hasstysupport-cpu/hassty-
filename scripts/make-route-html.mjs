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
const BASE = 'https://hassty.vercel.app';

/** بيانات كل صفحة عامة — يجب أن تطابق useSEO في نفس الصفحة */
const ROUTES = [
  {
    path: '/search',
    title: 'المدرسين المعتمدين للدروس الخصوصية في مصر | منصة حصتي',
    description: 'ابحث عن المدرسين المعتمدين على منصة حِصّتي حسب المادة والمحافظة والمرحلة الدراسية مع التقييمات والأسعار ومواعيد الحجز الفوري.',
    keywords: 'مدرس خصوصي, مدرسين معتمدين, حِصّتي, مدرسين مصر, دروس خصوصية, مدرسين ثانوية عامة',
    noscript: 'دليل البحث عن المدرسين الخصوصيين المعتمدين في مصر على منصة حصتي: صفِّ النتائج حسب المادة والمحافظة والمدينة والمرحلة الدراسية، وشاهد التقييمات وسعر الحصة والشهر لكل مدرس موثّق.',
    breadcrumbName: 'المدرسين المعتمدين',
  },
  {
    path: '/for-teachers',
    title: 'انضم كمدرس معتمد - نمِّ دخلك وطلّابك | منصة حصتي',
    description: 'انضم إلى منصة حصتي كمعلم معتمد واستفد من نظام إدارة المجموعات والـ QR كود لمتابعة الطلاب، أقل نسبة عمولة في مصر، وإعلانات موجهة لمنطقتك.',
    keywords: 'انضم كمدرس, تدريس خصوصي مصر, زيادة طلاب الدروس, نظام حضور الطلاب للمدرسين, سناتر تعليمية',
    noscript: 'بوابة المدرسين في منصة حصتي: بروفايل عام يستقبل الطلاب، ماسح حضور بكاميرا الهاتف عبر QR كود، إدارة مجموعات ومواعيد ومدفوعات، وعمولة تنازلية تنخفض مع زيادة عدد الطلاب — بدون أي اشتراك شهري.',
    breadcrumbName: 'انضم كمدرس',
  },
  {
    path: '/about',
    title: 'عن منصة حصتي — الرؤية والرسالة التعليمية في مصر | منصة حصتي',
    description: 'تعرف على قصة منصة حصتي، المنظومة المصرية المبتكرة لربط الطلاب والمدرسين الخصوصيين بنظام الحضور الذكي بالـ QR كود وتقارير المتابعة الفورية لأولياء الأمور.',
    keywords: 'عن حصتي, رؤية منصة حصتي, فريق حصتي التعليمية, نظام حضور الطلاب, التعليم في مصر',
    noscript: 'قصة منصة حصتي: منظومة تعليمية مصرية تربط الطلاب وأولياء الأمور بالمدرسين الخصوصيين الموثقين، بنظام حضور ذكي بالـ QR كود وتقارير متابعة فورية، ورؤية واضحة لتنظيم سوق الدروس الخصوصية في مصر.',
    breadcrumbName: 'عن حصتي',
  },
  {
    path: '/contact',
    title: 'اتصل بنا والدعم الفني | منصة حصتي',
    description: 'تواصل مع فريق الدعم الفني لمنصة حصتي للاستفسارات العامة، دعم المدرسين والطلاب، أو عبر الواتساب والبريد الإلكتروني المباشر.',
    keywords: 'اتصل بنا حصتي, دعم منصة حصتي, خدمة العملاء, مساعدة أولياء الأمور والطلاب',
    noscript: 'تواصل مع دعم منصة حصتي يومياً من 9 صباحاً حتى 10 مساءً: واتساب 201212281360 و 201080158828 أو البريد الإلكتروني hasstysupport@gmail.com — للطلاب وأولياء الأمور والمدرسين.',
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
const jsonldFor = (r) => JSON.stringify({
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

const NOSCRIPT = (r) => {
  const inner = [
    `        <h1 style="font-size:22px;color:#1D4ED8;margin-bottom:12px">${esc(r.title)}</h1>`,
    `        <p>${esc(r.noscript)}</p>`,
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
