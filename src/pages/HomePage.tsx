import React, { lazy, Suspense } from 'react';
import { useSEO } from '../lib/useSEO';
import { HeroSection } from '../components/HeroSection';
import { StatsBand } from '../components/StatsBand';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { AccountRole } from '../types';
import '../landing.css';

/* أقسام أسفل الشاشة الأولى تُحمَّل عند الطلب — تقليل الحزمة الأولية وتحسين FCP/LCP */
const ProblemSolutionSection = lazy(() => import('../components/ProblemSolutionSection').then(m => ({ default: m.ProblemSolutionSection })));
const HowItWorksSection = lazy(() => import('../components/HowItWorksSection').then(m => ({ default: m.HowItWorksSection })));
const FindTutorStepsSection = lazy(() => import('../components/FindTutorStepsSection').then(m => ({ default: m.FindTutorStepsSection })));
const SubjectsSection = lazy(() => import('../components/SubjectsSection').then(m => ({ default: m.SubjectsSection })));
const AccountTypesSection = lazy(() => import('../components/AccountTypesSection').then(m => ({ default: m.AccountTypesSection })));
const FeaturesSection = lazy(() => import('../components/FeaturesSection').then(m => ({ default: m.FeaturesSection })));
const PlatformProofSection = lazy(() => import('../components/PlatformProofSection').then(m => ({ default: m.PlatformProofSection })));
const FAQSection = lazy(() => import('../components/FAQSection').then(m => ({ default: m.FAQSection })));
const TeacherCTASection = lazy(() => import('../components/TeacherCTASection').then(m => ({ default: m.TeacherCTASection })));

/* ===== تأجيل متدرّج لأقسام أسفل الشاشة (Performance) =====
   المشكلة: lazy() وحدها لا تكفي — React يجلب وينفّذ كل الأقسام فور التركيب أثناء
   نافذة التحميل الحرجة، فيرتفع TBT ويتأخر TTI على الشبكات الضعيفة.
   الحل: كل قسم يُركَّب فقط عند (أ) اقترابه من الشاشة (IntersectionObserver) أو
   (ب) بعد مؤقّت أمان متدرّج يضمن اكتمال DOM بالكامل لزواحف البحث والوكلاء
   حتى لو لم يلمس المستخدم الصفحة. أولًا نُحمّل chunk الأقسام عند خمول المتصفح
   (requestIdleCallback) ليكون جاهزًا فور الحاجة بدون منافسة على الشبكة. */
const warmLandingChunk = () => { void import('../components/ProblemSolutionSection'); };

const DeferredSection: React.FC<{ children: React.ReactNode; delay?: number; minHeight?: string }> = ({ children, delay = 0, minHeight = '30vh' }) => {
  const [mounted, setMounted] = React.useState(false);
  const holderRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let alive = true;
    const mount = () => { if (alive) setMounted(true); };

    // (أ) المستخدم قارب على رؤية القسم — ركّبه فورًا
    const io = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((entries) => {
          if (entries.some(e => e.isIntersecting)) { io.disconnect(); mount(); }
        }, { rootMargin: '480px 0px' })
      : null;
    if (holderRef.current && io) io.observe(holderRef.current);

    // (ب) شبكة الأمان: اكتمال الشجرة كاملة خلال ~4 ثوانٍ، متدرّج لتقسيم المهام الطويلة
    const timer = window.setTimeout(mount, 4000 + delay);

    return () => { alive = false; io?.disconnect(); window.clearTimeout(timer); };
  }, [delay]);

  return (
    <div ref={holderRef}>
      {mounted
        ? <Suspense fallback={<div aria-hidden="true" style={{ minHeight }} />}>{children}</Suspense>
        : <div aria-hidden="true" style={{ minHeight }} />}
    </div>
  );
};

/* جلب chunk الأقسام عند أول خمول — خارج النافذة الحرجة تمامًا */
if (typeof window !== 'undefined') {
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback;
  if (ric) ric(warmLandingChunk, { timeout: 3000 });
  else window.setTimeout(warmLandingChunk, 2500);
}

interface HomePageProps {
  onNavigate: (path: string) => void;
  onOpenQRSimulator?: () => void;
  onOpenAuth?: (mode: 'login' | 'register', role?: AccountRole) => void;
  onSearchWithParams?: (subject: string, governorate: string, city?: string) => void;
  onSelectTutor?: (tutorId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenQRSimulator, onOpenAuth, onSearchWithParams }) => {
  useSEO({
    title: 'ابحث عن مدرسين خصوصيين موثقين في مصر',
    description: 'منصة حِصّتي (Hassty) تساعد الطلاب وأولياء الأمور على الوصول لمدرسين موثقين قريبين منهم: دوّر على مدرسك، احجز الحصة أونلاين، وتابع تسجيل حضور الطلاب بكود QR والدرجات — كل ده في مكان واحد.',
    canonicalPath: '/',
    keywords: 'مدرسين خصوصيين, مدرس قريب مني, احسن مدرس خصوصي, دكتور رياضيات, تقوية, دروس خصوصية, حجز مدرس خصوصي, مدرسين معتمدين مصر, حضور QR, منصة حصتي, Hassty, QR attendance, private tutor Egypt',
    ogImage: 'https://hassty.vercel.app/og-image.png',
  });

  const handleSearch = (subject: string, governorate: string, city: string = '') => onSearchWithParams ? onSearchWithParams(subject, governorate, city) : onNavigate('/search');
  const handleQRSimulator = () => onOpenQRSimulator ? onOpenQRSimulator() : onNavigate('/student/qr-card');
  const handleAuth = (mode: 'login' | 'register', role?: AccountRole) => {
    if (role === 'assistant' && mode === 'register') { onNavigate('/assistant/signup'); return; }
    if (onOpenAuth) onOpenAuth(mode, role);
    else onNavigate(mode === 'login' ? '/login' : '/signup');
  };

  return (
    <div className="hs-home-shell flex flex-col bg-white overflow-hidden">
      <ScrollReveal direction="up" delay={0} className="contents"><HeroSection onSearch={handleSearch} onOpenQRSimulator={handleQRSimulator} /></ScrollReveal>
      <StatsBand />
      <ScrollReveal direction="up" delay={40}><DeferredSection delay={0}><ProblemSolutionSection /></DeferredSection></ScrollReveal>
      <ScrollReveal direction="up" delay={70}><DeferredSection delay={250}><HowItWorksSection onOpenAuth={handleAuth} onOpenTutorSearch={() => onNavigate('/search')} onOpenQRSimulator={handleQRSimulator} /></DeferredSection></ScrollReveal>
      <ScrollReveal direction="up" delay={80}><DeferredSection delay={500}><FindTutorStepsSection onOpenTutorSearch={() => onNavigate('/search')} /></DeferredSection></ScrollReveal>
      <ScrollReveal direction="up" delay={90}><DeferredSection delay={750}><SubjectsSection onSelectSubject={(subjectName) => handleSearch(subjectName, '')} /></DeferredSection></ScrollReveal>
      <ScrollReveal direction="up" delay={90}><DeferredSection delay={1000}><AccountTypesSection onSelectRole={(role) => handleAuth('register', role)} /></DeferredSection></ScrollReveal>
      <ScrollReveal direction="up" delay={90}><DeferredSection delay={1250}><FeaturesSection /></DeferredSection></ScrollReveal>
      <ScrollReveal direction="up" delay={90}><DeferredSection delay={1500}><PlatformProofSection /></DeferredSection></ScrollReveal>
      <ScrollReveal direction="up" delay={90}><DeferredSection delay={1750}><FAQSection /></DeferredSection></ScrollReveal>
      <ScrollReveal direction="up" delay={100}><DeferredSection delay={2000}><TeacherCTASection onJoinAsTeacher={() => onNavigate('/for-teachers')} /></DeferredSection></ScrollReveal>
    </div>
  );
};
