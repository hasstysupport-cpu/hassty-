/** @license SPDX-License-Identifier: Apache-2.0 */
import React, { useEffect, useState } from 'react';
import { AccountRole } from './types';
import { useAuth } from './lib/AuthContext';
import { supabase } from './lib/supabase';
import { recordRequiredSignupConsents } from './lib/legal';
import { PublicNavbar } from './components/common/PublicNavbar';
import { LoggedInNavbar } from './components/common/LoggedInNavbar';
import { DashboardSidebar } from './components/common/DashboardSidebar';
import { Footer } from './components/Footer';
import { DevDisclaimerFloatingPill } from './components/common/DevDisclaimerFloatingPill';
import { LegalConsentGate, hasRecentSignupConsent } from './components/common/LegalConsentGate';
import { HomePage } from './pages/HomePage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { TeacherProfilePage } from './pages/TeacherProfilePage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { ForTeachersPage } from './pages/ForTeachersPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AssistantSignupPage } from './pages/AssistantSignupPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { WhatsAppStudioPage } from './pages/admin/WhatsAppStudioPage';
import { HasstyAdminApp } from './pages/admin/HasstyAdminApp';
import { SECRET_ADMIN_ROUTE } from './lib/securityConfig';
import { LegalPage, LegalSection } from './pages/LegalPage';
import { NotificationsPage, CalendarPage, MessagesPage, AssignmentsPage, GradesPage, AttendanceOverviewPage } from './pages/PlatformFeaturesPages';
import { TeacherAssignmentsPage } from './pages/teacher/TeacherAssignmentsPage';
import { TeacherAttendancePage } from './pages/teacher/TeacherAttendancePage';
import { ParentGradesPage } from './pages/parent/ParentGradesPage';
import { ParentRequestsPage } from './pages/parent/ParentRequestsPage';
import { StudentReviewsPage } from './pages/student/StudentReviewsPage';
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentQRCardPage } from './pages/student/StudentQRCardPage';
import { StudentTutorsPage } from './pages/student/StudentTutorsPage';
import { StudentBookPage } from './pages/student/StudentBookPage';
import { StudentPaymentsPage } from './pages/student/StudentPaymentsPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { StudentExamResultsPage } from './pages/student/StudentExamResultsPage';
import { ParentDashboardPage } from './pages/parent/ParentDashboardPage';
import { ParentAttendancePage } from './pages/parent/ParentAttendancePage';
import { ParentPaymentsPage } from './pages/parent/ParentPaymentsPage';
import { ParentSettingsPage } from './pages/parent/ParentSettingsPage';
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage';
import { TeacherStudentsPage } from './pages/teacher/TeacherStudentsPage';
import { TeacherStudentProfilePage } from './pages/teacher/TeacherStudentProfilePage';
import { TeacherGroupsPage } from './pages/teacher/TeacherGroupsPage';
import { TeacherScanPage } from './pages/teacher/TeacherScanPage';
import { TeacherPaymentsPage } from './pages/teacher/TeacherPaymentsPage';
import { TeacherAvailabilityPage } from './pages/teacher/TeacherAvailabilityPage';
import { TeacherProfileEditPage } from './pages/teacher/TeacherProfileEditPage';
import { TeacherReviewsPage } from './pages/teacher/TeacherReviewsPage';
import { TeacherAssistantsPage } from './pages/teacher/TeacherAssistantsPage';
import { TeacherAssistantManagePage } from './pages/teacher/TeacherAssistantManagePage';
import { TeacherExamSchedulerPage } from './pages/teacher/TeacherExamSchedulerPage';
import { TeacherExamDayPage } from './pages/teacher/TeacherExamDayPage';
import { TeacherExamGradingPage } from './pages/teacher/TeacherExamGradingPage';
import { AssistantInvitationsPage } from './pages/assistant/AssistantInvitationsPage';
import { AssistantVerificationPage } from './pages/assistant/AssistantVerificationPage';
import { AssistantDashboardPage, AssistantGroupsPage, AssistantStudentsPage, AssistantAttendancePage, AssistantPaymentsPage, AssistantProfilePage } from './pages/assistant/AssistantDashboardPages';

export default function App() {
  const { user, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState(() => (typeof window !== 'undefined' ? window.location.pathname || '/' : '/'));
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [searchSubject, setSearchSubject] = useState('');
  const [searchGovernorate, setSearchGovernorate] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [signupLegalAccepted, setSignupLegalAccepted] = useState(() => hasRecentSignupConsent());

  const isLoggedIn = !!user;
  const currentRole: AccountRole = user?.role || 'student';
  const isDashboardRoute = currentPath.startsWith('/student') || currentPath.startsWith('/parent') || currentPath.startsWith('/teacher') || currentPath.startsWith('/assistant');
  const isAdminAppRoute = currentPath.startsWith(SECRET_ADMIN_ROUTE) || currentPath.startsWith('/admin') || (typeof window !== 'undefined' && window.location.hostname.startsWith('admin.'));
  const isUnverified = isLoggedIn && !user?.emailVerified && user?.role !== 'admin' && user?.role !== 'assistant';

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname || '/');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window !== 'undefined' && window.location.pathname !== currentPath) window.history.pushState({}, '', currentPath);
  }, [currentPath]);

  const handleNavigate = (path: string) => {
    if (path.startsWith('/tutor/')) setSelectedTutorId(path.replace('/tutor/', ''));
    setCurrentPath(path);
  };

  const handleLogin = (role: AccountRole) => setCurrentPath(role === 'admin' ? SECRET_ADMIN_ROUTE : `/${role}/dashboard`);
  const handleLogout = () => { void logout(); setNeedsProfileSetup(false); setCurrentPath('/'); };
  const handleSelectTutor = (id: string) => { setSelectedTutorId(id); setCurrentPath(`/tutor/${id}`); };
  const handleSearchWithParams = (subject: string, governorate: string, city = '') => {
    setSearchSubject(subject); setSearchGovernorate(governorate); setSearchCity(city); setCurrentPath('/search');
  };

  useEffect(() => {
    let cancelled = false;
    const checkProfile = async () => {
      if (!user?.uid || user.role === 'admin' || user.role === 'assistant' || !supabase) {
        if (!cancelled) { setNeedsProfileSetup(false); setIsCheckingProfile(false); }
        return;
      }
      setIsCheckingProfile(true);
      try {
        const { data, error } = await supabase.from('profiles').select('full_name,phone,governorate,city,grade,role,metadata').eq('id', user.uid).maybeSingle();
        if (error) throw error;
        const metadata = (data?.metadata || {}) as Record<string, any>;
        const role = (data?.role || user.role) as AccountRole;
        const commonComplete = Boolean(data?.full_name?.trim() && data?.phone?.trim() && data?.governorate?.trim() && data?.city?.trim());
        const roleComplete = role === 'teacher'
          ? Boolean((metadata.subject || user.profileData?.subject)?.toString().trim() && (metadata.experienceYears || user.profileData?.experienceYears)?.toString().trim())
          : role === 'student'
            ? Boolean((data?.grade || metadata.grade || user.profileData?.grade)?.toString().trim())
            : true;
        if (!cancelled) setNeedsProfileSetup(!data || !commonComplete || !roleComplete);
      } catch {
        if (!cancelled) setNeedsProfileSetup(false);
      } finally {
        if (!cancelled) setIsCheckingProfile(false);
      }
    };
    void checkProfile();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user?.uid || !signupLegalAccepted || user.role === 'admin') return;
    void recordRequiredSignupConsents(user.uid).catch(() => {});
  }, [user?.uid, signupLegalAccepted, user?.role]);

  useEffect(() => {
    if (!needsProfileSetup || !isLoggedIn || isAdminAppRoute || isUnverified) return;
    if (currentPath !== '/setup-profile') setCurrentPath('/setup-profile');
  }, [needsProfileSetup, isLoggedIn, isAdminAppRoute, isUnverified, currentPath]);

  useEffect(() => {
    if (isLoggedIn && !isUnverified && !needsProfileSetup && !isCheckingProfile && ['/login', '/signup', '/setup-profile'].includes(currentPath)) handleLogin(currentRole);
  }, [isLoggedIn, currentRole, currentPath, isUnverified, needsProfileSetup, isCheckingProfile]);

  useEffect(() => {
    if (isUnverified && (isDashboardRoute || currentPath === '/')) setCurrentPath('/verify-email');
  }, [isUnverified, isDashboardRoute, currentPath]);

  const [initialAdminToken] = useState(() => (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('authKey') : null));

  if (isAdminAppRoute) return <HasstyAdminApp onSwitchToPublicApp={() => setCurrentPath('/')} initialToken={initialAdminToken} />;
  if (currentPath === '/assistant/signup' && !isLoggedIn) return <AssistantSignupPage onNavigate={handleNavigate} />;

  if (currentPath === '/signup' && !isLoggedIn) {
    return <div className="min-h-screen w-full bg-[#F8FAFF]">{!signupLegalAccepted ? <LegalConsentGate onAccept={() => setSignupLegalAccepted(true)} onNavigate={handleNavigate} /> : <SignupPage onNavigate={handleNavigate} onSignupSuccess={handleLogin} />}</div>;
  }

  if (isLoggedIn && needsProfileSetup && !isUnverified && currentPath === '/setup-profile') {
    return <div className="min-h-screen bg-[#F7FAFF]"><ProfileSetupPage onComplete={handleLogin} onLogout={handleLogout} /><DevDisclaimerFloatingPill /></div>;
  }

  const legalMatch = currentPath.match(/^\/legal\/(terms|privacy|teacher|cookies|acceptable|refund|rights)$/);
  if (legalMatch) return <LegalPage section={legalMatch[1] as LegalSection} onNavigate={handleNavigate} />;

  const dashboardPage = (() => {
    if (currentPath === '/student/dashboard') return <StudentDashboardPage onNavigate={handleNavigate} onSelectTutor={handleSelectTutor} />;
    if (currentPath === '/student/qr-card') return <StudentQRCardPage />;
    if (currentPath === '/student/profile') return <StudentProfilePage />;
    if (currentPath === '/student/tutors') return <StudentTutorsPage onNavigate={handleNavigate} onSelectTutor={handleSelectTutor} />;
    if (currentPath === '/student/book') return <StudentBookPage />;
    if (currentPath === '/student/payments') return <StudentPaymentsPage />;
    if (currentPath === '/student/exam-results') return <StudentExamResultsPage />;
    if (currentPath === '/student/notifications') return <NotificationsPage onNavigate={handleNavigate} />;
    if (currentPath === '/student/calendar') return <CalendarPage />;
    if (currentPath === '/student/messages') return <MessagesPage />;
    if (currentPath === '/student/assignments') return <AssignmentsPage />;
    if (currentPath === '/student/grades') return <GradesPage />;
    if (currentPath === '/student/attendance') return <AttendanceOverviewPage />;
    if (currentPath === '/student/reviews') return <StudentReviewsPage />;
    if (currentPath === '/parent/dashboard') return <ParentDashboardPage onNavigate={handleNavigate} />;
    if (currentPath === '/parent/attendance') return <ParentAttendancePage />;
    if (currentPath === '/parent/payments') return <ParentPaymentsPage />;
    if (currentPath === '/parent/settings') return <ParentSettingsPage />;
    if (currentPath === '/parent/requests') return <ParentRequestsPage />;
    if (currentPath === '/parent/notifications') return <NotificationsPage onNavigate={handleNavigate} />;
    if (currentPath === '/parent/calendar') return <CalendarPage />;
    if (currentPath === '/parent/messages') return <MessagesPage />;
    if (currentPath === '/parent/grades') return <ParentGradesPage />;
    if (currentPath === '/teacher/dashboard') return <TeacherDashboardPage onNavigate={handleNavigate} />;
    if (currentPath === '/teacher/assistants') return <TeacherAssistantsPage onNavigate={handleNavigate} />;
    if (currentPath.startsWith('/teacher/assistants/')) return <TeacherAssistantManagePage assistantId={currentPath.split('/')[3] || ''} onNavigate={handleNavigate} />;
    if (currentPath === '/teacher/students') return <TeacherStudentsPage onNavigate={handleNavigate} />;
    if (currentPath.startsWith('/teacher/students/')) return <TeacherStudentProfilePage studentId={currentPath.split('/')[3] || ''} onNavigate={handleNavigate} />;
    if (currentPath === '/teacher/groups') return <TeacherGroupsPage />;
    if (currentPath === '/teacher/exams') return <TeacherExamSchedulerPage />;
    if (currentPath.startsWith('/teacher/exams/')) return <TeacherExamDayPage examId={currentPath.split('/')[3] || ''} />;
    if (currentPath.startsWith('/teacher/exam-grading/')) return <TeacherExamGradingPage examId={currentPath.split('/')[2] || ''} />;
    if (currentPath === '/teacher/scan') return <TeacherScanPage />;
    if (currentPath === '/teacher/attendance') return <TeacherAttendancePage />;
    if (currentPath === '/teacher/payments') return <TeacherPaymentsPage onNavigate={handleNavigate} />;
    if (currentPath === '/teacher/availability') return <TeacherAvailabilityPage />;
    if (currentPath === '/teacher/profile') return <TeacherProfileEditPage />;
    if (currentPath === '/teacher/reviews') return <TeacherReviewsPage />;
    if (currentPath === '/teacher/notifications') return <NotificationsPage onNavigate={handleNavigate} />;
    if (currentPath === '/teacher/calendar') return <CalendarPage />;
    if (currentPath === '/teacher/messages') return <MessagesPage />;
    if (currentPath === '/teacher/assignments') return <TeacherAssignmentsPage />;
    if (currentPath === '/assistant/dashboard') return <AssistantDashboardPage onNavigate={handleNavigate} />;
    if (currentPath === '/assistant/verification') return <AssistantVerificationPage onNavigate={handleNavigate} />;
    if (currentPath === '/assistant/groups') return <AssistantGroupsPage />;
    if (currentPath === '/assistant/students') return <AssistantStudentsPage />;
    if (currentPath === '/assistant/attendance') return <AssistantAttendancePage />;
    if (currentPath === '/assistant/payments') return <AssistantPaymentsPage />;
    if (currentPath === '/assistant/invitations') return <AssistantInvitationsPage onNavigate={handleNavigate} />;
    if (currentPath === '/assistant/notifications') return <NotificationsPage onNavigate={handleNavigate} />;
    if (currentPath === '/assistant/calendar') return <CalendarPage />;
    if (currentPath === '/assistant/messages') return <MessagesPage />;
    if (currentPath === '/assistant/profile') return <AssistantProfilePage />;
    return null;
  })();

  const publicPage = (() => {
    if (isCheckingProfile && isLoggedIn && !isUnverified && currentPath !== '/setup-profile') return <div className="max-w-3xl mx-auto px-4 py-8 text-center text-xs text-slate-500">جاري تجهيز بيانات حسابك...</div>;
    if (currentPath === '/') return <HomePage onNavigate={handleNavigate} onSelectTutor={handleSelectTutor} onSearchWithParams={handleSearchWithParams} />;
    if (currentPath === '/search') return <SearchResultsPage onNavigate={handleNavigate} onSelectTutor={handleSelectTutor} initialSubject={searchSubject} initialGovernorate={searchGovernorate} initialCity={searchCity} />;
    if (currentPath.startsWith('/tutor/')) return <TeacherProfilePage tutorId={selectedTutorId} onNavigate={handleNavigate} onSelectTutor={handleSelectTutor} />;
    if (currentPath === '/about') return <AboutPage onNavigate={handleNavigate} />;
    if (currentPath === '/contact') return <ContactPage />;
    if (currentPath === '/for-teachers') return <ForTeachersPage onNavigate={handleNavigate} />;
    if (currentPath === '/login') return <LoginPage onNavigate={handleNavigate} onLoginSuccess={handleLogin} />;
    if (currentPath === '/verify-email' || isUnverified) return <VerifyEmailPage onNavigate={handleNavigate} onVerificationSuccess={handleLogin} />;
    if (currentPath === '/whatsapp-studio') return <WhatsAppStudioPage />;
    return <div className="min-h-[40vh] flex items-center justify-center text-sm text-slate-500">الصفحة غير موجودة.</div>;
  })();

  return (
    <div className="min-h-screen bg-[#F8FAFF] text-[#1F2937] flex flex-col">
      {isLoggedIn && isDashboardRoute && !isUnverified && !needsProfileSetup ? (
        <LoggedInNavbar currentRole={currentRole} currentPath={currentPath} userName={user?.name} userAvatar={user?.avatarUrl || user?.profileData?.avatarUrl} onNavigate={handleNavigate} onRoleChange={(role) => setCurrentPath(`/${role}/dashboard`)} onLogout={handleLogout} />
      ) : (
        <PublicNavbar currentPath={currentPath} isLoggedIn={isLoggedIn && !isUnverified && !needsProfileSetup} user={user} currentRole={currentRole} onNavigate={handleNavigate} onOpenLogin={() => handleNavigate('/login')} onOpenSignup={() => handleNavigate('/signup')} onLogout={handleLogout} />
      )}

      {isDashboardRoute && isLoggedIn && !isUnverified && !needsProfileSetup ? (
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 flex flex-col md:flex-row gap-6 items-start">
          <DashboardSidebar currentRole={currentRole} currentPath={currentPath} onNavigate={handleNavigate} onLogout={handleLogout} />
          <main className="flex-1 w-full min-w-0 pb-6 page-transition">{dashboardPage || <div className="py-16 text-center text-sm text-slate-500">الصفحة غير موجودة.</div>}</main>
        </div>
      ) : (
        <main className="flex-1 page-transition">{publicPage}</main>
      )}

      {!isDashboardRoute && !isLoggedIn && <Footer onNavigate={handleNavigate} />}
      <DevDisclaimerFloatingPill />
    </div>
  );
}
