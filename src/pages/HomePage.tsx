import React from 'react';
import { useSEO } from '../lib/useSEO';
import { HeroSection } from '../components/HeroSection';
import { ProblemSolutionSection } from '../components/ProblemSolutionSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { FindTutorStepsSection } from '../components/FindTutorStepsSection';
import { SubjectsSection } from '../components/SubjectsSection';
import { AccountTypesSection } from '../components/AccountTypesSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { TeacherCTASection } from '../components/TeacherCTASection';
import { PlatformProofSection } from '../components/PlatformProofSection';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { AccountRole } from '../types';
import '../landing.css';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onOpenQRSimulator?: () => void;
  onOpenAuth?: (mode: 'login' | 'register', role?: AccountRole) => void;
  onSearchWithParams?: (subject: string, governorate: string, city?: string) => void;
  onSelectTutor?: (tutorId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenQRSimulator, onOpenAuth, onSearchWithParams }) => {
  useSEO({ title: 'الرئيسية - حِصّتي | ابحث عن مدرسين موثقين', description: 'منصة حِصّتي تساعد الطلاب وأولياء الأمور على الوصول إلى مدرسين موثقين، حجز الحصص، ومتابعة الحضور والبيانات التعليمية في مكان واحد.', canonicalPath: '/' });

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
      <ScrollReveal direction="up" delay={40}><ProblemSolutionSection /></ScrollReveal>
      <ScrollReveal direction="up" delay={70}><HowItWorksSection onOpenAuth={handleAuth} onOpenTutorSearch={() => onNavigate('/search')} onOpenQRSimulator={handleQRSimulator} /></ScrollReveal>
      <ScrollReveal direction="up" delay={80}><FindTutorStepsSection onOpenTutorSearch={() => onNavigate('/search')} /></ScrollReveal>
      <ScrollReveal direction="up" delay={90}><SubjectsSection onSelectSubject={(subjectName) => handleSearch(subjectName, '')} /></ScrollReveal>
      <ScrollReveal direction="up" delay={90}><AccountTypesSection onSelectRole={(role) => handleAuth('register', role)} /></ScrollReveal>
      <ScrollReveal direction="up" delay={90}><FeaturesSection /></ScrollReveal>
      <ScrollReveal direction="up" delay={90}><PlatformProofSection /></ScrollReveal>
      <ScrollReveal direction="up" delay={100}><TeacherCTASection onJoinAsTeacher={() => onNavigate('/for-teachers')} /></ScrollReveal>
    </div>
  );
};
