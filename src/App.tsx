/** @license SPDX-License-Identifier: Apache-2.0 */
import React,{useState,useEffect} from 'react';
import { AccountRole } from './types';
import { useAuth } from './lib/AuthContext';
import { supabase } from './lib/supabase';
import { recordRequiredSignupConsents } from './lib/legal';
import { PublicNavbar } from './components/common/PublicNavbar';
import { LoggedInNavbar } from './components/common/LoggedInNavbar';
import { DashboardSidebar } from './components/common/DashboardSidebar';
import { Footer } from './components/Footer';
import { DevDisclaimerFloatingPill } from './components/common/DevDisclaimerFloatingPill';
import { LegalConsentGate,hasRecentSignupConsent } from './components/common/LegalConsentGate';
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
import { LegalPage,LegalSection } from './pages/LegalPage';
import { NotificationsPage,CalendarPage,MessagesPage,AssignmentsPage,GradesPage,AttendanceOverviewPage } from './pages/PlatformFeaturesPages';
import { TeacherAssignmentsPage } from './pages/teacher/TeacherAssignmentsPage';
import { TeacherAttendancePage } from './pages/teacher/TeacherAttendancePage';
import { ParentGradesPage } from './pages/parent/ParentGradesPage';
import { StudentReviewsPage } from './pages/student/StudentReviewsPage';
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentQRCardPage } from './pages/student/StudentQRCardPage';
import { StudentTutorsPage } from './pages/student/StudentTutorsPage';
import { StudentBookPage } from './pages/student/StudentBookPage';
import { StudentPaymentsPage } from './pages/student/StudentPaymentsPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { ParentDashboardPage } from './pages/parent/ParentDashboardPage';
import { ParentAttendancePage } from './pages/parent/ParentAttendancePage';
import { ParentPaymentsPage } from './pages/parent/ParentPaymentsPage';
import { ParentSettingsPage } from './pages/parent/ParentSettingsPage';
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage';
import { TeacherStudentsPage } from './pages/teacher/TeacherStudentsPage';
import { TeacherGroupsPage } from './pages/teacher/TeacherGroupsPage';
import { TeacherScanPage } from './pages/teacher/TeacherScanPage';
import { TeacherPaymentsPage } from './pages/teacher/TeacherPaymentsPage';
import { TeacherAvailabilityPage } from './pages/teacher/TeacherAvailabilityPage';
import { TeacherProfileEditPage } from './pages/teacher/TeacherProfileEditPage';
import { TeacherReviewsPage } from './pages/teacher/TeacherReviewsPage';
import { TeacherAssistantsPage } from './pages/teacher/TeacherAssistantsPage';
import { TeacherAssistantManagePage } from './pages/teacher/TeacherAssistantManagePage';
import { AssistantInvitationsPage } from './pages/assistant/AssistantInvitationsPage';
import { AssistantDashboardPage,AssistantGroupsPage,AssistantStudentsPage,AssistantAttendancePage,AssistantPaymentsPage,AssistantProfilePage } from './pages/assistant/AssistantDashboardPages';

export default function App(){
 const {user,logout}=useAuth();
 const [currentPath,setCurrentPath]=useState<string>(()=>typeof window!=='undefined'?window.location.pathname||'/':'/');
 const isLoggedIn=!!user; const currentRole:AccountRole=user?.role||'student';
 const [selectedTutorId,setSelectedTutorId]=useState(''); const [searchSubject,setSearchSubject]=useState(''); const [searchGovernorate,setSearchGovernorate]=useState(''); const [searchCity,setSearchCity]=useState('');
 const [needsProfileSetup,setNeedsProfileSetup]=useState(false); const [isCheckingProfile,setIsCheckingProfile]=useState(false); const [signupLegalAccepted,setSignupLegalAccepted]=useState(()=>hasRecentSignupConsent());
 useEffect(()=>{const h=()=>setCurrentPath(window.location.pathname||'/');window.addEventListener('popstate',h);return()=>window.removeEventListener('popstate',h)},[]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'smooth'});if(typeof window!=='undefined'&&window.location.pathname!==currentPath)window.history.pushState({},'',currentPath)},[currentPath]);
 const handleNavigate=(path:string)=>{if(path.startsWith('/tutor/'))setSelectedTutorId(path.replace('/tutor/',''));setCurrentPath(path)};
 const handleSearchWithParams=(subject:string,governorate:string,city='')=>{setSearchSubject(subject);setSearchGovernorate(governorate);setSearchCity(city);setCurrentPath('/search')};
 const handleLogin=(role:AccountRole)=>{if(role==='admin')setCurrentPath(SECRET_ADMIN_ROUTE);else setCurrentPath(`/${role}/dashboard`)};
 const handleLogout=()=>{void logout();setNeedsProfileSetup(false);setCurrentPath('/')};
 const handleSelectTutor=(id:string)=>{setSelectedTutorId(id);setCurrentPath(`/tutor/${id}`)};
 const isDashboardRoute=currentPath.startsWith('/student')||currentPath.startsWith('/parent')||currentPath.startsWith('/teacher')||currentPath.startsWith('/assistant');
 const isAdminAppRoute=currentPath.startsWith(SECRET_ADMIN_ROUTE)||currentPath.startsWith('/admin')||(typeof window!=='undefined'&&window.location.hostname.startsWith('admin.'));
 const isUnverified=isLoggedIn&&!user?.emailVerified&&user?.role!=='admin'&&user?.role!=='assistant';
 const isSignupRoute=currentPath==='/signup'; const isAssistantSignupRoute=currentPath==='/assistant/signup';
 useEffect(()=>{let cancelled=false;const check=async()=>{if(!user?.uid||user.role==='admin'||user.role==='assistant'||!supabase){if(!cancelled){setNeedsProfileSetup(false);setIsCheckingProfile(false)}return}setIsCheckingProfile(true);try{const{data,error}=await supabase.from('profiles').select('full_name,phone,governorate,city,grade,role,metadata').eq('id',user.uid).maybeSingle();if(error)throw error;const metadata=(data?.metadata||{}) as Record<string,any>;const role=(data?.role||user.role) as AccountRole;const commonComplete=Boolean(data?.full_name?.trim()&&data?.phone?.trim()&&data?.governorate?.trim()&&data?.city?.trim());const roleComplete=role==='teacher'?Boolean((metadata.subject||user.profileData?.subject)?.toString().trim()&&(metadata.experienceYears||user.profileData?.experienceYears)?.toString().trim()):role==='student'?Boolean((data?.grade||metadata.grade||user.profileData?.grade)?.toString().trim()):true;if(!cancelled)setNeedsProfileSetup(!data||!commonComplete||!roleComplete)}catch{if(!cancelled)setNeedsProfileSetup(false)}finally{if(!cancelled)setIsCheckingProfile(false)}};void check();return()=>{cancelled=true}},[user]);
 useEffect(()=>{if(!user?.uid||!signupLegalAccepted||user.role==='admin')return;void recordRequiredSignupConsents(user.uid).catch(()=>{})},[user?.uid,signupLegalAccepted,user?.role]);
 useEffect(()=>{if(!needsProfileSetup||!isLoggedIn||isAdminAppRoute||isUnverified)return;if(currentPath!=='/setup-profile')setCurrentPath('/setup-profile')},[needsProfileSetup,isLoggedIn,isAdminAppRoute,isUnverified,currentPath]);
 useEffect(()=>{if(isLoggedIn&&!isUnverified&&!needsProfileSetup&&!isCheckingProfile&&(currentPath==='/login'||currentPath==='/signup'||currentPath==='/setup-profile'))handleLogin(currentRole)},[isLoggedIn,currentRole,currentPath,isUnverified,needsProfileSetup,isCheckingProfile]);
 useEffect(()=>{if(isUnverified&&(isDashboardRoute||currentPath==='/'))setCurrentPath('/verify-email')},[isUnverified,isDashboardRoute,currentPath]);
 const [initialAdminToken]=useState<string|null>(()=>typeof window!=='undefined'?new URLSearchParams(window.location.search).get('authKey'):null);
 if(isAdminAppRoute)return <HasstyAdminApp onSwitchToPublicApp={()=>setCurrentPath('/')} initialToken={initialAdminToken}/>;
 if(isAssistantSignupRoute&&!isLoggedIn)return <AssistantSignupPage onNavigate={handleNavigate}/>;
 if(isSignupRoute&&!isLoggedIn)return <div className="min-h-screen w-full bg-[#F8FAFF] text-[#1F2937] font-['IBM_Plex_Sans_Arabic',sans-serif] antialiased">{!signupLegalAccepted?<LegalConsentGate onAccept={()=>setSignupLegalAccepted(true)} onNavigate={handleNavigate}/>:<SignupPage onNavigate={handleNavigate} onSignupSuccess={handleLogin}/>}</div>;
 if(isLoggedIn&&needsProfileSetup&&!isUnverified&&currentPath==='/setup-profile')return <div className="min-h-screen bg-[#F7FAFF] text-[#1F2937] font-['IBM_Plex_Sans_Arabic',sans-serif] antialiased"><ProfileSetupPage onComplete={handleLogin} onLogout={handleLogout}/><DevDisclaimerFloatingPill/></div>;
 const legalMatch=currentPath.match(/^\/legal\/(terms|privacy|teacher|cookies|acceptable|refund|rights)$/); if(legalMatch)return <LegalPage section={legalMatch[1] as LegalSection} onNavigate={handleNavigate}/>;
 return <div className="min-h-screen bg-[#F8FAFF] text-[#1F2937] flex flex-col antialiased">
  {isLoggedIn&&isDashboardRoute&&!isUnverified&&!needsProfileSetup?<LoggedInNavbar currentRole={currentRole} currentPath={currentPath} userName={user?.name} userAvatar={user?.avatarUrl||user?.profileData?.avatarUrl} onNavigate={handleNavigate} onRoleChange={(r)=>setCurrentPath(`/${r}/dashboard`)} onLogout={handleLogout}/>:<PublicNavbar currentPath={currentPath} isLoggedIn={isLoggedIn&&!isUnverified&&!needsProfileSetup} user={user} currentRole={currentRole} onNavigate={handleNavigate} onOpenLogin={()=>handleNavigate('/login')} onOpenSignup={()=>handleNavigate('/signup')} onLogout={handleLogout}/>} 
  {isDashboardRoute&&isLoggedIn&&!isUnverified&&!needsProfileSetup?<div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 sm:pb-28 lg:pb-8 flex flex-col md:flex-row gap-6 lg:gap-8 items-start"><DashboardSidebar currentRole={currentRole} currentPath={currentPath} onNavigate={handleNavigate} onLogout={handleLogout}/><main className="flex-1 w-full min-w-0 pb-6 page-transition">
   {currentPath==='/student/dashboard'&&<StudentDashboardPage onNavigate={handleNavigate} onSelectTutor={handleSelectTutor}/>} {currentPath==='/student/qr-card'&&<StudentQRCardPage/>} {currentPath==='/student/profile'&&<StudentProfilePage/>} {currentPath==='/student/tutors'&&<StudentTutorsPage onNavigate={handleNavigate} onSelectTutor={handleSelectTutor}/>} {currentPath==='/student/book'&&<StudentBookPage/>} {currentPath==='/student/payments'&&<StudentPaymentsPage/>} {currentPath==='/student/notifications'&&<NotificationsPage onNavigate={handleNavigate}/>} {currentPath==='/student/calendar'&&<CalendarPage/>} {currentPath==='/student/messages'&&<MessagesPage/>} {currentPath==='/student/assignments'&&<AssignmentsPage/>} {currentPath==='/student/grades'&&<GradesPage/>} {currentPath==='/student/attendance'&&<AttendanceOverviewPage/>} {currentPath==='/student/reviews'&&<StudentReviewsPage/>}
   {currentPath==='/parent/dashboard'&&<ParentDashboardPage onNavigate={handleNavigate}/>} {currentPath==='/parent/attendance'&&<ParentAttendancePage/>} {currentPath==='/parent/payments'&&<ParentPaymentsPage/>} {currentPath==='/parent/settings'&&<ParentSettingsPage/>} {currentPath==='/parent/notifications'&&<NotificationsPage onNavigate={handleNavigate}/>} {currentPath==='/parent/calendar'&&<CalendarPage/>} {currentPath==='/parent/messages'&&<MessagesPage/>} {currentPath==='/parent/grades'&&<ParentGradesPage/>}
   {currentPath==='/teacher/dashboard'&&<TeacherDashboardPage onNavigate={handleNavigate}/>} {currentPath==='/teacher/assistants'&&<TeacherAssistantsPage onNavigate={handleNavigate}/>} {currentPath.startsWith('/teacher/assistants/')&&<TeacherAssistantManagePage assistantId={currentPath.split('/')[3]||''} onNavigate={handleNavigate}/>} {currentPath==='/teacher/students'&&<TeacherStudentsPage onNavigate={handleNavigate}/>} {currentPath==='/teacher/groups'&&<TeacherGroupsPage/>} {currentPath==='/teacher/scan'&&<TeacherScanPage/>} {currentPath==='/teacher/attendance'&&<TeacherAttendancePage/>} {currentPath==='/teacher/payments'&&<TeacherPaymentsPage onNavigate={handleNavigate}/>} {currentPath==='/teacher/availability'&&<TeacherAvailabilityPage/>} {currentPath==='/teacher/profile'&&<TeacherProfileEditPage/>} {currentPath==='/teacher/reviews'&&<TeacherReviewsPage/>} {currentPath==='/teacher/notifications'&&<NotificationsPage onNavigate={handleNavigate}/>} {currentPath==='/teacher/calendar'&&<CalendarPage/>} {currentPath==='/teacher/messages'&&<MessagesPage/>} {currentPath==='/teacher/assignments'&&<TeacherAssignmentsPage/>}
   {currentPath==='/assistant/dashboard'&&<AssistantDashboardPage onNavigate={handleNavigate}/>} {currentPath==='/assistant/groups'&&<AssistantGroupsPage/>} {currentPath==='/assistant/students'&&<AssistantStudentsPage/>} {currentPath==='/assistant/attendance'&&<AssistantAttendancePage/>} {currentPath==='/assistant/payments'&&<AssistantPaymentsPage/>} {currentPath==='/assistant/invitations'&&<AssistantInvitationsPage onNavigate={handleNavigate}/>} {currentPath==='/assistant/notifications'&&<NotificationsPage onNavigate={handleNavigate}/>} {currentPath==='/assistant/calendar'&&<CalendarPage/>} {currentPath==='/assistant/messages'&&<MessagesPage/>} {currentPath==='/assistant/profile'&&<AssistantProfilePage/>}
  </main></div>:<main className="flex-1 page-transition">{isCheckingProfile&&isLoggedIn&&!isUnverified&&currentPath!=='/setup-profile'&&<div className="max-w-3xl mx-auto px-4 py-8 text-center text-xs text-slate-500">جاري تجهيز بيانات حسابك...</div>} {currentPath==='/'&&<HomePage onNavigate={handleNavigate} onSelectTutor={handleSelectTutor} onSearchWithParams={handleSearchWithParams}/>} {currentPath==='/search'&&<SearchResultsPage onNavigate={handleNavigate} onSelectTutor={handleSelectTutor} initialSubject={searchSubject} initialGovernorate={searchGovernorate} initialCity={searchCity}/>} {currentPath.startsWith('/tutor')&&<TeacherProfilePage tutorId={selectedTutorId} onNavigate={handleNavigate} onSelectTutor={handleSelectTutor}/>} {currentPath==='/about'&&<AboutPage onNavigate={handleNavigate}/>} {currentPath==='/contact'&&<ContactPage/>} {currentPath==='/for-teachers'&&<ForTeachersPage onNavigate={handleNavigate}/>} {currentPath==='/login'&&<LoginPage onNavigate={handleNavigate} onLoginSuccess={handleLogin}/>} {(currentPath==='/verify-email'||isUnverified)&&<VerifyEmailPage onNavigate={handleNavigate} onVerificationSuccess={handleLogin}/>} {currentPath==='/whatsapp-studio'&&<WhatsAppStudioPage/>}</main>}
  {!isDashboardRoute&&!isLoggedIn&&<Footer onNavigate={handleNavigate}/>}<DevDisclaimerFloatingPill/>
 </div>;
}
