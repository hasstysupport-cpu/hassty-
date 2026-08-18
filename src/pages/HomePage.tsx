import React from 'react';
import { useSEO } from '../lib/useSEO';
import { HeroSection } from '../components/HeroSection';
import { ProblemSolutionSection } from '../components/ProblemSolutionSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { FindTutorStepsSection } from '../components/FindTutorStepsSection';
import { SubjectsSection } from '../components/SubjectsSection';
import { AccountTypesSection } from '../components/AccountTypesSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { StatsBand } from '../components/StatsBand';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { TeacherCTASection } from '../components/TeacherCTASection';
import { AccountRole } from '../types';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onOpenQRSimulator?: () => void;
  onOpenAuth?: (mode: 'login' | 'register', role?: AccountRole) => void;
  onSearchWithParams?: (subject: string, governorate: string, city?: string) => void;
  onSelectTutor?: (tutorId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onOpenQRSimulator,
  onOpenAuth,
  onSearchWithParams,
}) => {
  useSEO({
    title: 'الرئيسية - احجز أفضل المدرسين الخصوصيين في مصر',
    description: 'ابحث عن أفضل المدرسين الخصوصيين المعتمدين لمختلف المراحل الدراسية واللغات في مصر مع نظام الحضور الذكي بالـ QR كود وإشعارات فورية لأولياء الأمور.',
    canonicalPath: '/',
  });

  const handleSearch = (subject: string, governorate: string, city: string = '') => {
    if (onSearchWithParams) {
      onSearchWithParams(subject, governorate, city);
    } else {
      onNavigate('/search');
    }
  };

  const handleQRSimulator = () => {
    if (onOpenQRSimulator) {
      onOpenQRSimulator();
    } else {
      onNavigate('/student/qr-card');
    }
  };

  const handleAuth = (mode: 'login' | 'register', role?: AccountRole) => {
    if (onOpenAuth) {
      onOpenAuth(mode, role);
    } else {
      onNavigate(mode === 'login' ? '/login' : '/signup');
    }
  };

  return (
    <div className="flex flex-col">
      {/* 1. Hero */}
      <HeroSection
        onSearch={handleSearch}
        onOpenQRSimulator={handleQRSimulator}
      />

      {/* 2. Problem / Solution */}
      <ProblemSolutionSection />

      {/* 3. How it Works */}
      <HowItWorksSection
        onOpenAuth={handleAuth}
        onOpenTutorSearch={() => onNavigate('/search')}
        onOpenQRSimulator={handleQRSimulator}
      />

      {/* 4. Find Tutor Steps */}
      <FindTutorStepsSection
        onOpenTutorSearch={() => onNavigate('/search')}
      />

      {/* 5. Subjects */}
      <SubjectsSection
        onSelectSubject={(subjectName) => handleSearch(subjectName, '')}
      />

      {/* 6. Account Types */}
      <AccountTypesSection
        onSelectRole={(role) => handleAuth('register', role)}
      />

      {/* 7. Features */}
      <FeaturesSection />

      {/* 8. Stats Band */}
      <StatsBand />

      {/* 9. Testimonials */}
      <TestimonialsSection />

      {/* 10. Teacher CTA */}
      <TeacherCTASection
        onJoinAsTeacher={() => onNavigate('/for-teachers')}
      />
    </div>
  );
};
