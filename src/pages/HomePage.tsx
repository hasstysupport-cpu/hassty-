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

const LazySection = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div aria-hidden="true" className="min-h-[30vh]" />}>{children}</Suspense>
);

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
      <ScrollReveal direction="up" delay={40}><LazySection><ProblemSolutionSection /></LazySection></ScrollReveal>
      <ScrollReveal direction="up" delay={70}><LazySection><HowItWorksSection onOpenAuth={handleAuth} onOpenTutorSearch={() => onNavigate('/search')} onOpenQRSimulator={handleQRSimulator} /></LazySection></ScrollReveal>
      <ScrollReveal direction="up" delay={80}><LazySection><FindTutorStepsSection onOpenTutorSearch={() => onNavigate('/search')} /></LazySection></ScrollReveal>
      <ScrollReveal direction="up" delay={90}><LazySection><SubjectsSection onSelectSubject={(subjectName) => handleSearch(subjectName, '')} /></LazySection></ScrollReveal>
      <ScrollReveal direction="up" delay={90}><LazySection><AccountTypesSection onSelectRole={(role) => handleAuth('register', role)} /></LazySection></ScrollReveal>
      <ScrollReveal direction="up" delay={90}><LazySection><FeaturesSection /></LazySection></ScrollReveal>
      <ScrollReveal direction="up" delay={90}><LazySection><PlatformProofSection /></LazySection></ScrollReveal>
      <ScrollReveal direction="up" delay={90}><LazySection><FAQSection /></LazySection></ScrollReveal>
      <ScrollReveal direction="up" delay={100}><LazySection><TeacherCTASection onJoinAsTeacher={() => onNavigate('/for-teachers')} /></LazySection></ScrollReveal>
    </div>
  );
};
