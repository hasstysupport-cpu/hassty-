import React from 'react';
import { useSEO } from '../lib/useSEO';
import {
  QrCode,
  ScanLine,
  BellRing,
  Smartphone,
  Clock,
  ShieldCheck,
  Users,
  BarChart3,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  GraduationCap,
  Building2,
  UserCheck,
  Sparkles
} from 'lucide-react';

interface QrAttendancePageProps {
  onNavigate: (path: string) => void;
}

const HOW_TO_STEPS = [
  {
    name: 'اكتب اسم الطالب في المنصة',
    text: 'المدرس أو المساعد يضيف طلاب مجموعته على منصة حصتي، فيولّد النظام لكل طالب بطاقة حضور رقمية شخصية تحمل كود QR فريد لا يتكرر لأي طالب آخر.',
  },
  {
    name: 'الطالب يحمل بطاقة الـ QR بتاعته',
    text: 'الطالب يفتح بطاقته الرقمية من موبايله أو يحمل نسخة مطبوعة من كود QR، والكود يظل صالحًا طوال فترة اشتراكه في المجموعة.',
  },
  {
    name: 'المدرس يمسح الكود من موبايله',
    text: 'أول ما الطالب يدخل القاعة، المدرس يفتح ماسح الـ QR من تطبيق منصة حصتي على موبايله ويمسح كود الطالب بكاميرا الهاتف مباشرة — بدون إنترنت قوي أو أجهزة إضافية.',
  },
  {
    name: 'الحضور يتسجل لحظيًا في النظام',
    text: 'في أقل من ثانية واحدة يتسجل الطالب حاضرًا بتاريخ ووقت الحصة بدقة، ويُحدَّث عدد حضوره في تقارير المدرسة أو السنتر تلقائيًا.',
  },
  {
    name: 'ولي الأمر يستقبل إشعارًا فوريًا',
    text: 'بمجرد المسح يصل إشعار فوري لولي الأمر على الواتساب أو إشعار المتصفح يؤكد وصول ابنه للحصة في وقته — راحة نفسية كاملة بدون مكالمات متابعة.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'إيه هو نظام تسجيل حضور الطلاب بكود QR؟',
    a: 'نظام تسجيل حضور الطلاب بكود QR هو طريقة آلية لتوثيق حضور وانصراف الطلاب في الدروس الخصوصية والسناتر: كل طالب يملك بطاقة رقمية تحمل كود QR فريدًا، يمسحه المدرس بكاميرا موبايله عند دخول الطالب الحصة، فيتسجل الحضور لحظيًا بالتاريخ والوقت ويصل إشعار فوري لولي الأمر — بديل كامل عن كشوف الحضور الورقية والتسجيل اليدوي.',
  },
  {
    q: 'إزاي أسجل حضور الطلاب بكود QR من الموبايل؟',
    a: 'من منصة حصتي: افتح ماسح الـ QR من حسابك كمدرس، وجّه كاميرا الموبايل لكود الطالب، وهيتسجل الحضور في أقل من ثانية. الماسح يعمل مباشرة من متصفح الموبايل بدون تحميل تطبيقات، ويسجل حضور عشرات الطلاب في دقائق قبل بداية الحصة.',
  },
  {
    q: 'هل يمكن للسناتر ومراكز التقوية استخدام نظام الحضور بالـ QR؟',
    a: 'نعم، نظام حصتي مصمم للمدرس الفردي والمجموعات والسناتر: كل مجموعة ليها قائمة طلابها وأكوادها، والمساعد أو موظف الاستقبال يقدر يمسح أكواد الطلاب الواردين، والمالك يتابع تقارير الحضور والغياب اليومية والشهرية لكل مجموعات المركز من لوحة واحدة.',
  },
  {
    q: 'هل يوصل ولي الأمر إشعار لحظة تسجيل الحضور؟',
    a: 'نعم، أول ما المدرس يمسح كود الطالب يصل ولي الأمر إشعار فوري على الواتساب يوضح اسم الطالب ووقت وصوله للحصة، وكذلك إشعارات المتصفح (Web Push) — فلا حاجة لأي مكالمة أو رسالة يدوية للتأكد من وصول الابن.',
  },
  {
    q: 'ماذا يحدث لو الطالب نسى بطاقة الـ QR أو ضاع الموبايله؟',
    a: 'بطاقة الحضور في حصتي رقمية مرتبطة بحساب الطالب: يقدر يعيد فتحها من أي موبايل بتسجيل دخوله، والمدرس يقدر كذلك تسجيل الحضور يدويًا من قائمة المجموعة كحل بديل مؤقت، مع بقاء كل السجلات موثقة في التقارير.',
  },
  {
    q: 'هل أكواد الحضور قابلة للتزوير أو التسجيل مكان طالب آخر؟',
    a: 'كل كود QR فريد ومربوط بحساب الطالب في قاعدة البيانات، والتسجيل يوثق بالوقت الدقيق وهوية الماسح، فلا يمكن لطالب تسجيل حضور زميله مكانه — وتاريخ كامل بكل عمليات المسح يظل محفوظًا للمراجعة.',
  },
  {
    q: 'هل نظام حضور الـ QR في حصتي مجاني؟',
    a: 'نعم، نظام تسجيل الحضور بكود QR متاح لكل المدرسين الاعتماديين داخل منصة حصتي بدون اشتراك شهري — المنصة مجانية للطلاب وأولياء الأمور، والمدرس يدعم فقط عمولة تنازلية عادلة تنخفض كلما زاد عدد طلابه.',
  },
  {
    q: 'هل يمكن تصدير تقارير الحضور ومتابعة الغياب المتكرر؟',
    a: 'نعم، المنصة تولد تقارير حضور تفصيلية لكل طالب ومجموعة: عدد الحصص المسجلة، الغيابات، ونسب الانتظام، مع تمييز الغياب المتكرر — تساعد المدرس وولي الأمر على اتخاذ إجراء مبكر قبل تفاقم التأخر الدراسي.',
  },
];

const FEATURES = [
  { icon: ScanLine, title: 'مسح بكاميرا الموبايل', desc: 'ماسح QR مدمج يعمل من متصفح الهاتف مباشرة — بدون أجهزة قارئ إضافية ولا تطبيقات من المتاجر.' },
  { icon: Clock, title: 'تسجيل في أقل من ثانية', desc: 'كل طالب بيتسجل حاضر بمسح واحد، ومجموعة كاملة (60 طالب) بتاخد أقل من 3 دقائق قبل الحصة.' },
  { icon: BellRing, title: 'إشعار فوري لولي الأمر', desc: 'إشعار واتساب لحظي يوثق وصول الطالب ووقته — يقلل مكالمات الاستفسار ويبني ثقة مطلقة مع أولياء الأمور.' },
  { icon: ShieldCheck, title: 'أكواد فريدة غير قابلة للتلاعب', desc: 'كل كود مربوط بحساب الطالب، والتسجيل يوثق بالوقت وهوية المسح — استحالة تسجيل حضور مكاني.' },
  { icon: BarChart3, title: 'تقارير حضور وغياب', desc: 'نسب انتظام لكل طالب ومجموعة، تتبع الغياب المتكرر، وسجل كامل بالتواريخ قابل للمراجعة في أي وقت.' },
  { icon: Users, title: 'دعم المساعدين', desc: 'المدرس يعتمد مساعدًا له لمسح أكواد الطلاب وإدارة الحضور — مثالي للسناتر والمجموعات الكبيرة.' },
  { icon: Smartphone, title: 'بطاقات رقمية دائمة', desc: 'بطاقة الطالب الرقمية بـ QR تُفتح من أي موبايل وتصلح للطباعة — ضائعة؟ تُستعاد فورًا بالتسجيل.' },
  { icon: Sparkles, title: 'بدون أوراق ولا Excel', desc: 'وداعًا لكشوف الحضور الورقية وملفات الإكسل — كل شيء آلي محفوظ سحابيًا ولا يضيع أبدًا.' },
];

export const QrAttendancePage: React.FC<QrAttendancePageProps> = ({ onNavigate }) => {
  useSEO({
    title: 'نظام تسجيل حضور الطلاب بكود QR للمدرسين والسناتر',
    description: 'سجّل حضور الطلاب بكود QR في أقل من ثانية من موبايل المدرس: بطاقة رقمية فريدة لكل طالب، إشعار فوري لولي الأمر على الواتساب، وتقارير حضور وغياب للسناتر والمجموعات — مجانًا داخل منصة حصتي.',
    keywords: 'تسجيل حضور الطلاب ب QR, نظام حضور وانصراف QR, كود QR للحضور والانصراف, برنامج حضور الطلاب للسنتر, نظام متابعة حضور الطلاب, تسجيل الحضور بالباركود, بطاقة حضور QR, حضور الطلاب واتساب, نظام حضور للمدرس الخصوصي, QR attendance system, student attendance QR code Egypt',
    canonicalPath: '/qr-attendance',
    breadcrumbs: ['نظام حضور الطلاب بكود QR'],
    jsonLd: {
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://hassty.site/qr-attendance#app',
          name: 'حصتي — نظام تسجيل حضور الطلاب بكود QR',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          description: 'نظام حضور ذكي للدروس الخصوصية والسناتر في مصر: بطاقة QR فريدة لكل طالب، مسح بكاميرا الموبايل، إشعار فوري لولي الأمر على الواتساب، وتقارير انتظام تفصيلية.',
          url: 'https://hassty.site/qr-attendance',
          inLanguage: 'ar-EG',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EGP', description: 'مجاني للطلاب وأولياء الأمور وبدون اشتراك شهري للمدرسين' },
        },
        {
          '@type': 'HowTo',
          '@id': 'https://hassty.site/qr-attendance#howto',
          name: 'كيف تسجّل حضور الطلاب بكود QR في منصة حصتي',
          totalTime: 'PT2M',
          tool: 'موبايل المدرس بكاميرا + منصة حصتي',
          step: HOW_TO_STEPS.map((s, i) => ({
            '@type': 'HowToStep',
            position: i + 1,
            name: s.name,
            text: s.text,
          })),
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://hassty.site/qr-attendance#faq',
          mainEntity: FAQ_ITEMS.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ],
    },
  });

  return (
    <div className="bg-white text-[#1F2937]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F6F9FF] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-sm font-bold mb-6">
                <QrCode className="w-4 h-4" /> نظام حضور ذكي — أحدث ميزات منصة حصتي
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E3A8A] leading-tight mb-6">
                تسجيل حضور الطلاب بكود QR — <span className="text-[#2563EB]">ثانية واحدة</span> وولي الأمر يعرف
              </h1>
              <p className="text-lg text-[#4B5563] leading-relaxed mb-8">
                نظام تسجيل حضور الطلاب بكود QR في منصة حصتي هو طريقة آلية لتوثيق حضور وانصراف الطلاب في الدروس الخصوصية والمجموعات والسناتر: كل طالب ياخد بطاقة رقمية بكود QR فريد، المدرس يمسحه بكاميرا موبايله أول ما الطالب يدخل، فيتسجل الحضور لحظيًا بالتاريخ والوقت — ويوصل إشعار فوري لولي الأمر على الواتساب. بديل كامل عن كشوف الحضور الورقية والتسجيل اليدوي والأخطاء البشرية.
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => onNavigate('/signup')} className="px-8 py-4 rounded-2xl bg-gradient-to-l from-[#2563EB] to-[#7C3AED] text-white font-black shadow-lg shadow-blue-200 hover:shadow-xl transition-all flex items-center gap-2">
                  ابدأ مجانًا الآن <ArrowLeft className="w-5 h-5" />
                </button>
                <button onClick={() => onNavigate('/for-teachers')} className="px-8 py-4 rounded-2xl border-2 border-[#BFDBFE] bg-white text-[#1D4ED8] font-black hover:bg-[#EFF6FF] transition-colors">
                  بوابة المدرسين
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-[2rem] border border-[#E5E7EB] shadow-2xl shadow-blue-100 p-8 max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center">
                    <ScanLine className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-[#1E3A8A]">ماسح حضور حصتي</p>
                    <p className="text-xs text-[#6B7280]">كاميرا الموبايل — بدون تطبيقات</p>
                  </div>
                </div>
                {[
                  { n: 'محمود أحمد', t: 'الرياضيات — 4:00 م', ok: true },
                  { n: 'سارة محمد', t: 'الرياضيات — 4:01 م', ok: true },
                  { n: 'أحمد خالد', t: 'الرياضيات — 4:02 م', ok: true },
                ].map((r) => (
                  <div key={r.n} className="flex items-center justify-between bg-[#F8FAFF] border border-[#E5E7EB] rounded-2xl px-4 py-3 mb-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-bold text-[#1F2937]">{r.n}</p>
                        <p className="text-xs text-[#6B7280]">{r.t}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">حاضر ✓</span>
                  </div>
                ))}
                <div className="mt-4 p-3 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-emerald-800 font-bold text-center">
                  <BellRing className="w-4 h-4 inline ml-1" /> إشعار واتساب وصل لولي الأمر لحظة المسح
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-[#1E3A8A] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            { v: 'أقل من ثانية', l: 'زمن تسجيل الطالب الواحد' },
            { v: '3 دقائق', l: 'لمجموعة من 60 طالبًا كاملة' },
            { v: 'لحظي', l: 'إشعار ولي الأمر على الواتساب' },
            { v: '0 جنيه', l: 'بدون اشتراك شهري للمدرس' },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-2xl lg:text-3xl font-black text-white mb-1">{s.v}</p>
              <p className="text-xs lg:text-sm text-blue-200 font-semibold">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HowTo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl lg:text-3xl font-black text-[#1E3A8A] text-center mb-4">إزاي بتسجّل حضور الطلاب بـ QR؟ 5 خطوات بس</h2>
        <p className="text-center text-[#6B7280] max-w-2xl mx-auto mb-12 leading-relaxed">
          من إضافة الطالب حتى إشعار ولي الأمر — المنظومة كلها اتحكمت لحظة واحدة بدون أوراق وبدون برامج معقدة، من موبايل المدرس فقط.
        </p>
        <ol className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 list-none">
          {HOW_TO_STEPS.map((s, i) => (
            <li key={s.name} className="bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-sm relative">
              <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white font-black flex items-center justify-center mb-4">{i + 1}</div>
              <h3 className="font-black text-[#1E3A8A] mb-2 text-sm lg:text-base">{s.name}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section className="bg-[#F8FAFF] border-y border-[#E5E7EB] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-black text-[#1E3A8A] text-center mb-4">مميزات نظام الحضور بالـ QR في حصتي</h2>
          <p className="text-center text-[#6B7280] max-w-2xl mx-auto mb-12 leading-relaxed">
            كل حاجة محتاجها المدرس والسنتر وولي الأمر في منظومة متابعة حضور متكاملة — شغالة من المتصفح على أي موبايل أو كمبيوتر.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-[#2563EB]" />
                </div>
                <h3 className="font-black text-[#1E3A8A] mb-2">{f.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl lg:text-3xl font-black text-[#1E3A8A] text-center mb-4">الطريقة اليدوية مقابل نظام حصتي بالـ QR</h2>
        <p className="text-center text-[#6B7280] max-w-2xl mx-auto mb-12 leading-relaxed">
          مقارنة صريحة بين كشف الحضور الورقي التقليدي ونظام تسجيل الحضور بكود QR — في الوقت والجهد والثقة.
        </p>
        <div className="overflow-x-auto rounded-3xl border border-[#E5E7EB] shadow-sm">
          <table className="w-full text-sm lg:text-base bg-white">
            <thead>
              <tr className="bg-[#1E3A8A] text-white">
                <th className="text-right px-5 py-4 font-black">وجه المقارنة</th>
                <th className="text-right px-5 py-4 font-black">الكشف الورقي / اليدوي</th>
                <th className="text-right px-5 py-4 font-black">نظام حصتي بالـ QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {[
                ['زمن تسجيل 60 طالبًا', '10–15 دقيقة ونداء بالاسم', 'أقل من 3 دقائق بمسح الكود'],
                ['إشعار ولي الأمر', 'مكالمات ورسايل يدوية بعد الحصة', 'إشعار واتساب لحظة دخول الطالب'],
                ['دقة السجلات', 'أخطاء يدوية وسمات ناقصة', 'تاريخ ووقت دقيق + هوية المسح'],
                ['حماية من التزوير', 'توقيع مكان زميل ممكن جدًا', 'كود فريد مربوط بحساب الطالب'],
                ['تقارير وإحصائيات', 'جمع يدوي من أوراق شهرية', 'تقارير انتظام جاهزة بضغطة'],
                ['الحفظ والأرشفة', 'أوراق بتضيع وبتتهتك', 'سجلات سحابية لا تضيع أبدًا'],
              ].map((row) => (
                <tr key={row[0]}>
                  <td className="px-5 py-4 font-bold text-[#1E3A8A]">{row[0]}</td>
                  <td className="px-5 py-4 text-[#6B7280]"><XCircle className="w-4 h-4 inline ml-1.5 text-red-400" />{row[1]}</td>
                  <td className="px-5 py-4 text-[#374151] font-semibold"><CheckCircle2 className="w-4 h-4 inline ml-1.5 text-emerald-500" />{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Who benefits */}
      <section className="bg-[#F8FAFF] border-y border-[#E5E7EB] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-black text-[#1E3A8A] text-center mb-12">مين بيستفيد من نظام الحضور بالـ QR؟</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: GraduationCap,
                title: 'للمدرس الخصوصي',
                lines: [
                  'سجل حضور موثّق يحمي المدرس في أي خلاف مع ولي الأمر عن الانتظام.',
                  'وقت أقل في النداء والتسجيل — وقت أكتر في الشرح.',
                  'أساس عادل لحساب الاشتراكات والحصص المستحقة شهريًا.',
                ],
              },
              {
                icon: Building2,
                title: 'للسناتر ومراكز التقوية',
                lines: [
                  'موظف الاستقبال أو المساعد يمسح أكواد الطلاب الواردين بسلاسة.',
                  'تقارير حضور يومية وشهرية لكل المجموعات من لوحة واحدة.',
                  'مظهر احترافي أمام أولياء الأمور يرفع تقييم المركز.',
                ],
              },
              {
                icon: UserCheck,
                title: 'لولي الأمر',
                lines: [
                  'إشعار لحظي على الواتساب أول ما ابنك يدخل الحصة.',
                  'راحة بال كاملة بدون مكالمات متابعة أو قلق.',
                  'تقارير انتظام شهرية توضح التزام ابنك ودرجاته.',
                ],
              },
            ].map((b) => (
              <div key={b.title} className="bg-white rounded-3xl border border-[#E5E7EB] p-7 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center mb-4">
                  <b.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-black text-[#1E3A8A] mb-4 text-lg">{b.title}</h3>
                <ul className="space-y-3 text-sm text-[#4B5563] leading-relaxed">
                  {b.lines.map((l) => (
                    <li key={l} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{l}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl lg:text-3xl font-black text-[#1E3A8A] text-center mb-12">أسئلة شائعة عن تسجيل الحضور بكود QR</h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map((f) => (
            <details key={f.q} className="group bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
              <summary className="cursor-pointer px-6 py-4 font-bold text-[#1E3A8A] flex items-center justify-between gap-4 list-none">
                <span className="flex items-center gap-3"><QrCode className="w-5 h-5 text-[#2563EB] shrink-0" />{f.q}</span>
                <span className="text-[#2563EB] text-xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="px-6 pb-5 pt-1 text-[#4B5563] leading-relaxed text-sm lg:text-base">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-l from-[#2563EB] to-[#7C3AED] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl lg:text-3xl font-black text-white mb-4">جاهز توقّع الكشف الورقي وتسجّل حضور طلابك بـ QR؟</h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-8">
            أنشئ حسابك المجاني على منصة حصتي في دقيقة، وولّد بطاقات QR لطلابك النهارده — الحضور والإشعارات والتقارير كلها هتشتغل أوتوماتيك.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => onNavigate('/signup')} className="px-8 py-4 rounded-2xl bg-white text-[#1D4ED8] font-black shadow-lg hover:bg-blue-50 transition-colors flex items-center gap-2">
              أنشئ حسابك المجاني <ArrowLeft className="w-5 h-5" />
            </button>
            <button onClick={() => onNavigate('/search')} className="px-8 py-4 rounded-2xl border-2 border-white/40 text-white font-black hover:bg-white/10 transition-colors">
              اكتشف المدرسين المعتمدين
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
