/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AccountRole } from './types';
import { SAMPLE_TUTORS } from './data/mockData';

// Common Components
import { PublicNavbar } from './components/common/PublicNavbar';
import { LoggedInNavbar } from './components/common/LoggedInNavbar';
import { DashboardSidebar } from './components/common/DashboardSidebar';
import { Footer } from './components/Footer';

// Public & Auth Pages
import { HomePage } from './pages/HomePage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { TeacherProfilePage } from './pages/TeacherProfilePage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { ForTeachersPage } from './pages/ForTeachersPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentQRCardPage } from './pages/student/StudentQRCardPage';
import { StudentTutorsPage } from './pages/student/StudentTutorsPage';
import { StudentBookPage } from './pages/student/StudentBookPage';
import { StudentPaymentsPage } from './pages/student/StudentPaymentsPage';

// Parent Pages
import { ParentDashboardPage } from './pages/parent/ParentDashboardPage';
import { ParentAttendancePage } from './pages/parent/ParentAttendancePage';
import { ParentPaymentsPage } from './pages/parent/ParentPaymentsPage';
import { ParentSettingsPage } from './pages/parent/ParentSettingsPage';

// Teacher Pages
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage';
import { TeacherStudentsPage } from './pages/teacher/TeacherStudentsPage';
import { TeacherGroupsPage } from './pages/teacher/TeacherGroupsPage';
import { TeacherScanPage } from './pages/teacher/TeacherScanPage';
import { TeacherPaymentsPage } from './pages/teacher/TeacherPaymentsPage';
import { TeacherAvailabilityPage } from './pages/teacher/TeacherAvailabilityPage';
import { TeacherProfileEditPage } from './pages/teacher/TeacherProfileEditPage';
import { TeacherReviewsPage } from './pages/teacher/TeacherReviewsPage';

export default function App() {
  // Navigation & session state
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<AccountRole>('student');
  const [selectedTutorId, setSelectedTutorId] = useState<string>(SAMPLE_TUTORS[0].id);
  const [searchSubject, setSearchSubject] = useState<string>('');
  const [searchGovernorate, setSearchGovernorate] = useState<string>('');
  const [searchCity, setSearchCity] = useState<string>('');

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPath]);

  // Route dispatcher
  const handleNavigate = (path: string) => {
    // If path starts with /tutor/ extract id
    if (path.startsWith('/tutor/')) {
      const id = path.replace('/tutor/', '');
      setSelectedTutorId(id);
    }
    setCurrentPath(path);
  };

  const handleSearchWithParams = (subject: string, governorate: string, city: string = '') => {
    setSearchSubject(subject);
    setSearchGovernorate(governorate);
    setSearchCity(city);
    setCurrentPath('/search');
  };

  // Login handler
  const handleLogin = (role: AccountRole) => {
    setIsLoggedIn(true);
    setCurrentRole(role);
    if (role === 'student') setCurrentPath('/student/dashboard');
    if (role === 'parent') setCurrentPath('/parent/dashboard');
    if (role === 'teacher') setCurrentPath('/teacher/dashboard');
  };

  // Logout handler
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPath('/');
  };

  // Select tutor to view profile
  const handleSelectTutor = (tutorId: string) => {
    setSelectedTutorId(tutorId);
    setCurrentPath(`/tutor/${tutorId}`);
  };

  // Helper to determine if current route is a dashboard route
  const isDashboardRoute =
    currentPath.startsWith('/student') ||
    currentPath.startsWith('/parent') ||
    currentPath.startsWith('/teacher');

  return (
    <div className="min-h-screen bg-[#F8FAFF] text-[#1F2937] font-['Tajawal',sans-serif] selection:bg-[#EFF6FF] selection:text-[#2563EB] flex flex-col antialiased">
      
      {/* 1. TOP NAVBAR */}
      {isLoggedIn && isDashboardRoute ? (
        <LoggedInNavbar
          currentRole={currentRole}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onRoleChange={(newRole) => {
            setCurrentRole(newRole);
            if (newRole === 'student') setCurrentPath('/student/dashboard');
            if (newRole === 'parent') setCurrentPath('/parent/dashboard');
            if (newRole === 'teacher') setCurrentPath('/teacher/dashboard');
          }}
          onLogout={handleLogout}
        />
      ) : (
        <PublicNavbar
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onOpenLogin={() => handleNavigate('/login')}
          onOpenSignup={() => handleNavigate('/signup')}
        />
      )}

      {/* 2. MAIN VIEW AREA */}
      {isDashboardRoute && isLoggedIn ? (
        // DASHBOARD LAYOUT (Sidebar + Main Content)
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 sm:pb-28 lg:pb-8 flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
          
          {/* Dashboard Sidebar */}
          <DashboardSidebar
            currentRole={currentRole}
            currentPath={currentPath}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />

          {/* Dashboard Content Container */}
          <main className="flex-1 w-full min-w-0 pb-6 page-transition">
            {/* Student Routes */}
            {currentPath === '/student/dashboard' && (
              <StudentDashboardPage onNavigate={handleNavigate} onSelectTutor={handleSelectTutor} />
            )}
            {currentPath === '/student/qr-card' && <StudentQRCardPage />}
            {currentPath === '/student/tutors' && (
              <StudentTutorsPage onNavigate={handleNavigate} onSelectTutor={handleSelectTutor} />
            )}
            {currentPath === '/student/book' && <StudentBookPage />}
            {currentPath === '/student/payments' && <StudentPaymentsPage />}

            {/* Parent Routes */}
            {currentPath === '/parent/dashboard' && (
              <ParentDashboardPage onNavigate={handleNavigate} />
            )}
            {currentPath === '/parent/attendance' && <ParentAttendancePage />}
            {currentPath === '/parent/payments' && <ParentPaymentsPage />}
            {currentPath === '/parent/settings' && <ParentSettingsPage />}

            {/* Teacher Routes */}
            {currentPath === '/teacher/dashboard' && (
              <TeacherDashboardPage onNavigate={handleNavigate} />
            )}
            {currentPath === '/teacher/students' && <TeacherStudentsPage onNavigate={handleNavigate} />}
            {currentPath === '/teacher/groups' && <TeacherGroupsPage />}
            {currentPath === '/teacher/scan' && <TeacherScanPage />}
            {currentPath === '/teacher/payments' && <TeacherPaymentsPage onNavigate={handleNavigate} />}
            {currentPath === '/teacher/availability' && <TeacherAvailabilityPage />}
            {currentPath === '/teacher/profile' && <TeacherProfileEditPage />}
            {currentPath === '/teacher/reviews' && <TeacherReviewsPage />}
          </main>
        </div>
      ) : (
        // PUBLIC / AUTH PAGES LAYOUT
        <main className="flex-1 page-transition">
          {currentPath === '/' && (
            <HomePage
              onNavigate={handleNavigate}
              onSelectTutor={handleSelectTutor}
              onSearchWithParams={handleSearchWithParams}
            />
          )}

          {currentPath === '/search' && (
            <SearchResultsPage
              onNavigate={handleNavigate}
              onSelectTutor={handleSelectTutor}
              initialSubject={searchSubject}
              initialGovernorate={searchGovernorate}
              initialCity={searchCity}
            />
          )}

          {currentPath.startsWith('/tutor') && (
            <TeacherProfilePage
              tutorId={selectedTutorId}
              onNavigate={handleNavigate}
              onSelectTutor={handleSelectTutor}
            />
          )}

          {currentPath === '/about' && <AboutPage onNavigate={handleNavigate} />}

          {currentPath === '/contact' && <ContactPage />}

          {currentPath === '/for-teachers' && (
            <ForTeachersPage onNavigate={handleNavigate} />
          )}

          {currentPath === '/login' && (
            <LoginPage onNavigate={handleNavigate} onLoginSuccess={handleLogin} />
          )}

          {currentPath === '/signup' && (
            <SignupPage onNavigate={handleNavigate} onSignupSuccess={handleLogin} />
          )}
        </main>
      )}

      {/* 3. PUBLIC FOOTER (Shown on public pages or always for comprehensive accessibility) */}
      {!isDashboardRoute && (
        <Footer onNavigate={handleNavigate} />
      )}

    </div>
  );
}
