import React from 'react';
import { QrCode, ShieldCheck, Sparkles, CalendarCheck, Wallet, BellRing, Star, ArrowRight } from 'lucide-react';
import { useCountUp } from './ui';

/* ================================================================
   AuthShell — قشرة المصادقة الفخمة (تسجيل الدخول / التسجيل / التحقق)
   تقسيم شاشة راقٍ: لوحة هوية متدرجة (يمين RTL) + منطقة النموذج (يسار)
   تتقلص لوحة الهوية لباند متدرج أنيق على الموبايل.
   ================================================================ */

interface AuthShellProps {
  /** محتوى النموذج (البطاقة البيضاء) */
  children: React.ReactNode;
  /** عنوان اللوحة الصغيرة فوق البطاقة */
  miniTitle?: string;
  /** رابط العودة (افتراضي الرئيسية) */
  backTo?: string;
  onNavigate: (path: string) => void;
  /** إخفاء شريط العودة العلوي */
  hideBack?: boolean;
  /** عرض بطاقة النموذج */
  width?: 'md' | 'wide';
}

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'حضور موثّق بـ QR',
    desc: 'تسجيل حضور فوري بالدقيقة يصل لولي الأمر لحظيًا',
  },
  {
    icon: CalendarCheck,
    title: 'مواعيد بلا فوضى',
    desc: 'جدول الحصص والامتحانات والتنبيه الذكي بالمواعيد',
  },
  {
    icon: Wallet,
    title: 'مدفوعات شفافة',
    desc: 'فواتير وسجل مصروفات دقيق لكل مجموعة ومادة',
  },
  {
    icon: BellRing,
    title: 'إشعارات لحظية',
    desc: 'نتائج وواجبات وتقييمات تصلك أولًا بأول',
  },
];

const BRAND_STATS = [
  { value: 2400, suffix: '+', label: 'مدرس معتمد' },
  { value: 97, suffix: '%', label: 'نسبة رضا الأسر' },
  { value: 18, suffix: '', label: 'محافظة مغطاة' },
];

const BrandStat: React.FC<{ value: number; suffix: string; label: string }> = ({ value, suffix, label }) => {
  const shown = useCountUp(value, 1100);
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">
        {typeof shown === 'number' ? Math.round(shown).toLocaleString('ar-EG') : shown}
        <span className="text-sky-200">{suffix}</span>
      </div>
      <div className="text-[10px] sm:text-[11px] font-bold text-blue-100/90 mt-0.5">{label}</div>
    </div>
  );
}

export const AuthShell: React.FC<AuthShellProps> = ({ children, miniTitle, onNavigate, backTo = '/', hideBack, width = 'md' }) => {
  return (
    <div dir="rtl" className="min-h-screen bg-[#F6F9FF] flex flex-col lg:flex-row text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">

      {/* ══════════════ لوحة الهوية (يمين — سطح المكتب) ══════════════ */}
      <aside className="auth-brand hidden lg:flex lg:w-[46%] xl:w-[44%] flex-col justify-between p-10 xl:p-14 text-white">

        {/* زخارف متحركة */}
        <div className="auth-blob w-[420px] h-[420px] -top-32 -right-24 opacity-70" aria-hidden="true" />
        <div className="auth-blob w-[300px] h-[300px] bottom-[-80px] left-[-60px] opacity-50" aria-hidden="true" />
        <div className="auth-dots" aria-hidden="true" />
        <div className="auth-ring w-[560px] h-[560px] -top-40 -left-40" aria-hidden="true" />
        <div className="auth-ring w-[380px] h-[380px] bottom-[-140px] right-[-100px]" aria-hidden="true" />

        {/* الهوية */}
        <div className="relative z-10">
          <button onClick={() => onNavigate('/')} className="flex items-center gap-3 group cursor-pointer">
            <div className="w-13 h-13 xl:w-14 xl:h-14 rounded-2xl auth-glass flex items-center justify-center group-hover:scale-105 transition-transform">
              <QrCode className="w-7 h-7 stroke-[2.2] text-white" />
            </div>
            <div>
              <div className="text-3xl xl:text-4xl font-black tracking-tight leading-none">حِصّتي</div>
              <div className="text-[10px] xl:text-[11px] text-blue-100/90 font-bold mt-1">منظومة الدروس الخصوصية الأذكى في مصر</div>
            </div>
          </button>
        </div>

        {/* المحتوى الأوسط */}
        <div className="relative z-10 space-y-7 my-8">
          <div>
            <div className="auth-glass inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-blue-50 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-sky-200" />
              منظومة متكاملة للطالب وولي الأمر والمعلم والمساعد
            </div>
            <h1 className="text-3xl xl:text-[2.6rem] font-black leading-[1.35] tracking-tight">
              كل حصة موثّقة،
              <br />
              وكل درجة <span className="text-transparent bg-clip-text bg-gradient-to-l from-sky-200 via-white to-indigo-200">محفوظة بأمان</span>
            </h1>
            <p className="text-sm text-blue-100/90 leading-relaxed mt-3 max-w-md">
              منظومة واحدة تجمع الحضور الذكي والامتحانات والمدفوعات والتقارير اللحظية — بتصميم يليق بطموح أسرتك.
            </p>
          </div>

          {/* المزايا الزجاجية */}
          <div className="grid grid-cols-2 gap-3 max-w-lg">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="auth-glass rounded-2xl p-3.5 text-right anim-up"
                style={{ animationDelay: `${140 + i * 90}ms` }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-white/15 text-sky-100 flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-black text-white">{f.title}</div>
                </div>
                <div className="text-[10px] text-blue-100/85 leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* الأسفل: إحصائيات + شهادة */}
        <div className="relative z-10 space-y-4">
          <div className="auth-glass rounded-2xl px-6 py-4 flex items-center justify-between">
            {BRAND_STATS.map((s) => <BrandStat key={s.label} value={s.value} suffix={s.suffix} label={s.label} />)}
          </div>

          <div className="auth-glass rounded-2xl p-4 flex items-start gap-3 anim-up" style={{ animationDelay: '520ms' }}>
            <div className="flex text-amber-300 pt-0.5 shrink-0">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
            </div>
            <div>
              <p className="text-xs text-white leading-relaxed font-semibold">
                «أول مرة أتابع ابني بدون مكالمات — حضوره ودرجاته ومدفوعاته قدامي لحظة بلحظة.»
              </p>
              <div className="text-[10px] text-blue-100/80 mt-1.5 font-bold">— أم يوسف، الصف الثالث الثانوي</div>
            </div>
          </div>

          <div className="text-[10px] text-blue-200/70 font-bold">
            بالمتابعة أنت توافق على <button onClick={() => onNavigate('/terms')} className="underline hover:text-white cursor-pointer">الشروط</button> و
            <button onClick={() => onNavigate('/privacy')} className="underline hover:text-white cursor-pointer mr-1">سياسة الخصوصية</button>
          </div>
        </div>
      </aside>

      {/* ══════════════ منطقة النموذج (يسار) ══════════════ */}
      <main className="flex-1 flex flex-col min-h-screen relative">

        {/* خلفية ناعمة */}
        <div className="absolute top-[-120px] left-[-120px] w-[380px] h-[380px] bg-blue-400/8 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-[-140px] right-[-100px] w-[360px] h-[360px] bg-indigo-400/8 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        {/* شريط علوي */}
        <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 pt-5">
          {/* شعار مصغر للموبايل */}
          <button onClick={() => onNavigate('/')} className="lg:hidden flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center group-active:scale-95 transition-transform">
              <QrCode className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-lg font-black text-[#1E3A8A]">حِصّتي</span>
          </button>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-bold text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            اتصال آمن ومشفّر بمعايير Supabase
          </div>

          {!hideBack && (
            <button
              onClick={() => onNavigate(backTo)}
              className="auth-trust-chip cursor-pointer hover:border-blue-300 hover:text-[#2563EB] transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
              العودة للرئيسية
            </button>
          )}
        </div>

        {/* باند الهوية المصغر (موبايل) */}
        <div className="lg:hidden relative z-10 mx-4 sm:mx-6 mt-4 auth-mobile-hero rounded-3xl p-5 text-white overflow-hidden anim-up">
          <div className="auth-blob w-40 h-40 -top-16 -right-10 opacity-60" aria-hidden="true" />
          <div className="auth-dots" aria-hidden="true" />
          <div className="relative z-10">
            <div className="text-[10px] font-bold text-blue-100/90 mb-1">منظومة الدروس الخصوصية الأذكى</div>
            <div className="text-lg font-black leading-snug">كل حصة موثّقة، وكل درجة محفوظة بأمان</div>
            <div className="flex items-center gap-4 mt-3">
              <div className="text-center">
                <div className="text-sm font-black tabular-nums">2,400<span className="text-sky-200">+</span></div>
                <div className="text-[9px] text-blue-100/85 font-bold">مدرس معتمد</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="text-sm font-black tabular-nums">97<span className="text-sky-200">%</span></div>
                <div className="text-[9px] text-blue-100/85 font-bold">رضا الأسر</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="text-sm font-black tabular-nums">18</div>
                <div className="text-[9px] text-blue-100/85 font-bold">محافظة</div>
              </div>
            </div>
          </div>
        </div>

        {/* بطاقة النموذج */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-8 relative z-10 w-full">
          {miniTitle && (
            <div className="mb-3 text-[11px] font-black text-slate-400 tracking-wide">{miniTitle}</div>
          )}
          <div className={`w-full ${width === 'wide' ? 'max-w-2xl' : 'max-w-[26.5rem]'}`}>{children}</div>
        </div>

        {/* ثقة أسفل */}
        <div className="relative z-10 pb-5 flex flex-wrap items-center justify-center gap-2 px-4">
          <span className="auth-trust-chip"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> مصادقة OTP مزدوجة</span>
          <span className="auth-trust-chip"><QrCode className="w-3.5 h-3.5 text-[#2563EB]" /> كارنيه QR رقمي</span>
          <span className="auth-trust-chip hidden sm:inline-flex"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> 4.9/5 تقييم الأسر</span>
        </div>
      </main>
    </div>
  );
};
