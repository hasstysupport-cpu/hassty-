/** @license SPDX-License-Identifier: Apache-2.0 */
import React,{useState,useEffect,useRef,lazy,Suspense} from 'react';
import { AccountRole } from './types';
import { useAuth } from './lib/AuthContext';
import { supabase } from './lib/supabase';
import { recordRequiredSignupConsents } from './lib/legal';
import { PublicNavbar } from './components/common/PublicNavbar';
import { LoggedInNavbar, titles as dashboardTitles } from './components/common/LoggedInNavbar';
import { DashboardSidebar } from './components/common/DashboardSidebar';
import { Footer } from './components/Footer';
import { DevDisclaimerFloatingPill } from './components/common/DevDisclaimerFloatingPill';
import { ToastProvider } from './components/common/ui';
import { hasRecentSignupConsent } from './lib/legal';
import { HomePage } from './pages/HomePage';
import type { LegalSection } from './pages/LegalPage';
import { SECRET_ADMIN_ROUTE } from './lib/securityConfig';

/* ===== Route-level lazy loading: role workspaces load on demand (Phase 19) ===== */
const HasstyAdminApp = lazy(() => import('./pages/admin/HasstyAdminApp').then(m => ({ default: m.HasstyAdminApp })));
/* ===== الصفحات العامة غير الرئيسية تُحمَّل عند الطلب — تقليل الحزمة الأولية (Perf) ===== */
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage').then(m => ({ default: m.SearchResultsPage })));
const TeacherProfilePage = lazy(() => import('./pages/TeacherProfilePage').then(m => ({ default: m.TeacherProfilePage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const ForTeachersPage = lazy(() => import('./pages/ForTeachersPage').then(m => ({ default: m.ForTeachersPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const AssistantSignupPage = lazy(() => import('./pages/AssistantSignupPage').then(m => ({ default: m.AssistantSignupPage })));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const ProfileSetupPage = lazy(() => import('./pages/ProfileSetupPage').then(m => ({ default: m.ProfileSetupPage })));
const LegalPage = lazy(() => import('./pages/LegalPage').then(m => ({ default: m.LegalPage })));
const NotificationsPage = lazy(() => import('./pages/PlatformFeaturesPages').then(m => ({ default: m.NotificationsPage })));
const CalendarPage = lazy(() => import('./pages/PlatformFeaturesPages').then(m => ({ default: m.CalendarPage })));
const MessagesPage = lazy(() => import('./pages/PlatformFeaturesPages').then(m => ({ default: m.MessagesPage })));
const AssignmentsPage = lazy(() => import('./pages/PlatformFeaturesPages').then(m => ({ default: m.AssignmentsPage })));
const GradesPage = lazy(() => import('./pages/PlatformFeaturesPages').then(m => ({ default: m.GradesPage })));
const AttendanceOverviewPage = lazy(() => import('./pages/PlatformFeaturesPages').then(m => ({ default: m.AttendanceOverviewPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const WhatsAppStudioPage = lazy(() => import('./pages/admin/WhatsAppStudioPage').then(m => ({ default: m.WhatsAppStudioPage })));
/* بانر طلب إذن إشعارات المتصفح (Web Push) — يُحمَّل عند الطلب داخل لوحات التحكم */
const PushPermissionBanner = lazy(() => import('./components/common/PushPermissionBanner').then(m => ({ default: m.PushPermissionBanner })));
const StudentDashboardPage = lazy(() => import('./pages/student/StudentDashboardPage').then(m => ({ default: m.StudentDashboardPage })));
const StudentQRCardPage = lazy(() => import('./pages/student/StudentQRCardPage').then(m => ({ default: m.StudentQRCardPage })));
const StudentProfilePage = lazy(() => import('./pages/student/StudentProfilePage').then(m => ({ default: m.StudentProfilePage })));
const StudentTutorsPage = lazy(() => import('./pages/student/StudentTutorsPage').then(m => ({ default: m.StudentTutorsPage })));
const StudentBookPage = lazy(() => import('./pages/student/StudentBookPage').then(m => ({ default: m.StudentBookPage })));
const StudentPaymentsPage = lazy(() => import('./pages/student/StudentPaymentsPage').then(m => ({ default: m.StudentPaymentsPage })));
const StudentReviewsPage = lazy(() => import('./pages/student/StudentReviewsPage').then(m => ({ default: m.StudentReviewsPage })));
const StudentExamsPage = lazy(() => import('./pages/student/StudentExamSettingsPages').then(m => ({ default: m.StudentExamsPage })));
const StudentExamResultsPage = lazy(() => import('./pages/student/StudentExamSettingsPages').then(m => ({ default: m.StudentExamResultsPage })));
const StudentSettingsPage = lazy(() => import('./pages/student/StudentExamSettingsPages').then(m => ({ default: m.StudentSettingsPage })));
const ParentDashboardPage = lazy(() => import('./pages/parent/ParentDashboardPage').then(m => ({ default: m.ParentDashboardPage })));
const ParentAttendancePage = lazy(() => import('./pages/parent/ParentAttendancePage').then(m => ({ default: m.ParentAttendancePage })));
const ParentPaymentsPage = lazy(() => import('./pages/parent/ParentPaymentsPage').then(m => ({ default: m.ParentPaymentsPage })));
const ParentSettingsPage = lazy(() => import('./pages/parent/ParentSettingsPage').then(m => ({ default: m.ParentSettingsPage })));
const ParentGradesPage = lazy(() => import('./pages/parent/ParentGradesPage').then(m => ({ default: m.ParentGradesPage })));
const ParentChildrenPage = lazy(() => import('./pages/parent/ParentRequestsPages').then(m => ({ default: m.ParentChildrenPage })));
const ParentTeacherChangePage = lazy(() => import('./pages/parent/ParentRequestsPages').then(m => ({ default: m.ParentTeacherChangePage })));
const ParentTransfersPage = lazy(() => import('./pages/parent/ParentRequestsPages').then(m => ({ default: m.ParentTransfersPage })));
const TeacherDashboardPage = lazy(() => import('./pages/teacher/TeacherDashboardPage').then(m => ({ default: m.TeacherDashboardPage })));
const TeacherStudentsPage = lazy(() => import('./pages/teacher/TeacherStudentsPage').then(m => ({ default: m.TeacherStudentsPage })));
const TeacherGroupsPage = lazy(() => import('./pages/teacher/TeacherGroupsPage').then(m => ({ default: m.TeacherGroupsPage })));
const TeacherScanPage = lazy(() => import('./pages/teacher/TeacherScanPage').then(m => ({ default: m.TeacherScanPage })));
const TeacherAttendancePage = lazy(() => import('./pages/teacher/TeacherAttendancePage').then(m => ({ default: m.TeacherAttendancePage })));
const TeacherPaymentsPage = lazy(() => import('./pages/teacher/TeacherPaymentsPage').then(m => ({ default: m.TeacherPaymentsPage })));
const TeacherAvailabilityPage = lazy(() => import('./pages/teacher/TeacherAvailabilityPage').then(m => ({ default: m.TeacherAvailabilityPage })));
const TeacherProfileEditPage = lazy(() => import('./pages/teacher/TeacherProfileEditPage').then(m => ({ default: m.TeacherProfileEditPage })));
const TeacherReviewsPage = lazy(() => import('./pages/teacher/TeacherReviewsPage').then(m => ({ default: m.TeacherReviewsPage })));
const TeacherAssignmentsPage = lazy(() => import('./pages/teacher/TeacherAssignmentsPage').then(m => ({ default: m.TeacherAssignmentsPage })));
const TeacherSessionsPage = lazy(() => import('./pages/teacher/TeacherSessionsPage').then(m => ({ default: m.TeacherSessionsPage })));
const TeacherEnrollmentRequestsPage = lazy(() => import('./pages/teacher/TeacherRequestsPages').then(m => ({ default: m.TeacherEnrollmentRequestsPage })));
const TeacherTransfersPage = lazy(() => import('./pages/teacher/TeacherRequestsPages').then(m => ({ default: m.TeacherTransfersPage })));
const TeacherMakeupPage = lazy(() => import('./pages/teacher/TeacherRequestsPages').then(m => ({ default: m.TeacherMakeupPage })));
const TeacherDisputesPage = lazy(() => import('./pages/teacher/TeacherRequestsPages').then(m => ({ default: m.TeacherDisputesPage })));
const TeacherStudentProfilePage = lazy(() => import('./pages/teacher/TeacherStudentPages').then(m => ({ default: m.TeacherStudentProfilePage })));
const TeacherStudentNotesPage = lazy(() => import('./pages/teacher/TeacherStudentPages').then(m => ({ default: m.TeacherStudentNotesPage })));
const TeacherSubmissionsPage = lazy(() => import('./pages/teacher/TeacherSubmissionsGradebookPages').then(m => ({ default: m.TeacherSubmissionsPage })));
const TeacherGradebookPage = lazy(() => import('./pages/teacher/TeacherSubmissionsGradebookPages').then(m => ({ default: m.TeacherGradebookPage })));
const TeacherExamsPage = lazy(() => import('./pages/teacher/TeacherExamsPages').then(m => ({ default: m.TeacherExamsPage })));
const TeacherExamDetailPage = lazy(() => import('./pages/teacher/TeacherExamsPages').then(m => ({ default: m.TeacherExamDetailPage })));
const TeacherMyAssistantsPage = lazy(() => import('./pages/teacher/TeacherAssistantPages').then(m => ({ default: m.TeacherMyAssistantsPage })));
const TeacherAssistantSearchPage = lazy(() => import('./pages/teacher/TeacherAssistantPages').then(m => ({ default: m.TeacherAssistantSearchPage })));
const AssistantInvitationsPage = lazy(() => import('./pages/assistant/AssistantInvitationsPage').then(m => ({ default: m.AssistantInvitationsPage })));
const AssistantDashboardPage = lazy(() => import('./pages/assistant/AssistantDashboardPages').then(m => ({ default: m.AssistantDashboardPage })));
const AssistantGroupsPage = lazy(() => import('./pages/assistant/AssistantDashboardPages').then(m => ({ default: m.AssistantGroupsPage })));
const AssistantStudentsPage = lazy(() => import('./pages/assistant/AssistantDashboardPages').then(m => ({ default: m.AssistantStudentsPage })));
const AssistantAttendancePage = lazy(() => import('./pages/assistant/AssistantDashboardPages').then(m => ({ default: m.AssistantAttendancePage })));
const AssistantPaymentsPage = lazy(() => import('./pages/assistant/AssistantDashboardPages').then(m => ({ default: m.AssistantPaymentsPage })));
const AssistantProfilePage = lazy(() => import('./pages/assistant/AssistantDashboardPages').then(m => ({ default: m.AssistantProfilePage })));
const AssistantVerificationPage = lazy(() => import('./pages/assistant/AssistantVerificationPage').then(m => ({ default: m.AssistantVerificationPage })));

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center py-20" dir="rtl">
    <div className="flex flex-col items-center gap-3.5">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#2563EB] animate-spin" />
        <div className="absolute inset-1.5 rounded-full border-[3px] border-transparent border-b-violet-500 animate-spin [animation-direction:reverse] [animation-duration:1.3s]" />
        <div className="absolute inset-[13px] rounded-full bg-gradient-to-br from-blue-400 to-violet-500 animate-pulse-subtle" />
      </div>
      <span className="text-xs font-bold text-slate-500 animate-pulse">جاري تحميل الصفحة...</span>
    </div>
  </div>
);

export default function App(){
 const {user,logout,loading:authLoading,refreshUser}=useAuth();
 const [currentPath,setCurrentPath]=useState<string>(()=>typeof window!=='undefined'?window.location.pathname||'/':'/');
 const isLoggedIn=!!user; const currentRole:AccountRole=user?.role||'student';
 /* معرّف المدرس يُهيّأ من الـ URL عند الدخول المباشر (محركات البحث/مشاركة الروابط)
    لأن التنقل الداخلي عبر handleSelectTutor هو المسار الوحيد الذي كان يضبطه */
 const [selectedTutorId,setSelectedTutorId]=useState<string>(()=>{if(typeof window==='undefined')return '';const m=window.location.pathname.match(/^\/tutor\/([^/?#]+)/);return m?decodeURIComponent(m[1]):''}); const [searchSubject,setSearchSubject]=useState(()=>{if(typeof window==='undefined')return '';const sp=new URLSearchParams(window.location.search);return sp.get('subject')||''}); const [searchGovernorate,setSearchGovernorate]=useState(()=>{if(typeof window==='undefined')return '';const sp=new URLSearchParams(window.location.search);return sp.get('governorate')||''}); const [searchCity,setSearchCity]=useState(()=>{if(typeof window==='undefined')return '';const sp=new URLSearchParams(window.location.search);return sp.get('city')||''});
 const [needsProfileSetup,setNeedsProfileSetup]=useState(false); const [isCheckingProfile,setIsCheckingProfile]=useState(false); const [signupLegalAccepted,setSignupLegalAccepted]=useState(()=>hasRecentSignupConsent());
 useEffect(()=>{const h=()=>{const p=window.location.pathname||'/';const m=p.match(/^\/tutor\/([^/?#]+)/);if(m)setSelectedTutorId(decodeURIComponent(m[1]));if(p==='/search'){const sp=new URLSearchParams(window.location.search);setSearchSubject(sp.get('subject')||'');setSearchGovernorate(sp.get('governorate')||'');setSearchCity(sp.get('city')||'')}setCurrentPath(p)};window.addEventListener('popstate',h);return()=>window.removeEventListener('popstate',h)},[]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant' as ScrollBehavior});if(typeof window!=='undefined'&&window.location.pathname!==currentPath){/* روابط البحث القابلة للمشاركة: ادفع الباراميترات مع /search */const entries=([['subject',searchSubject],['governorate',searchGovernorate],['city',searchCity]] as [string,string][]).filter((e)=>e[1]);const qs=currentPath==='/search'?new URLSearchParams(entries).toString():'';window.history.pushState({},'',qs?`/search?${qs}`:currentPath)}},[currentPath]);
 const handleNavigate=(path:string)=>{if(path.startsWith('/tutor/'))setSelectedTutorId(path.replace('/tutor/',''));setCurrentPath(path)};
 const handleSearchWithParams=(subject:string,governorate:string,city='')=>{setSearchSubject(subject);setSearchGovernorate(governorate);setSearchCity(city);setCurrentPath('/search')};
 const handleLogin=(role:AccountRole)=>{if(role==='admin')setCurrentPath(SECRET_ADMIN_ROUTE);else setCurrentPath(`/${role}/dashboard`)};
 /* إكمال بيانات حساب Google: صفّر علامة الحاجة للإعداد في نفس لحظة التنقل
    حتى لا يرتد المستخدم لصفحة الإعداد بعد الحفظ (حالة سباق قديمة) */
 const handleProfileSetupComplete=(role:AccountRole)=>{setNeedsProfileSetup(false);handleLogin(role)};
 const handleLogout=()=>{void logout();setNeedsProfileSetup(false);setCurrentPath('/')};
 const handleSelectTutor=(id:string)=>{setSelectedTutorId(id);setCurrentPath(`/tutor/${id}`)};
 const isDashboardRoute=currentPath.startsWith('/student')||currentPath.startsWith('/parent')||currentPath.startsWith('/teacher')||currentPath.startsWith('/assistant');
 const isAdminAppRoute=currentPath.startsWith(SECRET_ADMIN_ROUTE)||currentPath.startsWith('/admin')||(typeof window!=='undefined'&&window.location.hostname.startsWith('admin.'));
 const isUnverified=isLoggedIn&&!user?.emailVerified&&user?.role!=='admin'&&user?.role!=='assistant'; const isSignupRoute=currentPath==='/signup'; const isAssistantSignupRoute=currentPath==='/assistant/signup';
 /* المسارات العامة المعروفة — أي مسار آخر يعرض صفحة 404 */
 const knownPublicPaths=['/','/search','/about','/contact','/for-teachers','/login','/signup','/assistant/signup','/verify-email','/setup-profile','/whatsapp-studio'];
 const legalMatch0=currentPath.match(/^\/legal\/(terms|privacy|teacher|cookies|acceptable|refund|rights)$/);
 const isKnownPublicPath=knownPublicPaths.includes(currentPath)||currentPath.startsWith('/tutor')||Boolean(legalMatch0);
 useEffect(()=>{let cancelled=false;const check=async()=>{if(!user?.uid||user.role==='admin'||user.role==='assistant'||!supabase){if(!cancelled){setNeedsProfileSetup(false);setIsCheckingProfile(false)}return}setIsCheckingProfile(true);try{const{data,error}=await supabase.from('profiles').select('full_name,phone,governorate,city,grade,role,metadata').eq('id',user.uid).maybeSingle();if(error)throw error;const metadata=(data?.metadata||{}) as Record<string,any>;const role=(data?.role||user.role) as AccountRole;const commonComplete=Boolean(data?.full_name?.trim()&&data?.phone?.trim()&&data?.governorate?.trim()&&data?.city?.trim());const roleComplete=role==='teacher'?Boolean((metadata.subject||user.profileData?.subject)?.toString().trim()&&(metadata.experienceYears||user.profileData?.experienceYears)?.toString().trim()):role==='student'?Boolean((data?.grade||metadata.grade||user.profileData?.grade)?.toString().trim()):true;if(!cancelled)setNeedsProfileSetup(!data||!commonComplete||!roleComplete)}catch{if(!cancelled)setNeedsProfileSetup(false)}finally{if(!cancelled)setIsCheckingProfile(false)}};void check();return()=>{cancelled=true}},[user]);
 useEffect(()=>{if(!user?.uid||!signupLegalAccepted||user.role==='admin')return;void recordRequiredSignupConsents(user.uid).catch(()=>{})},[user?.uid,signupLegalAccepted,user?.role]);
 useEffect(()=>{if(!needsProfileSetup||!isLoggedIn||isAdminAppRoute||isUnverified)return;if(currentPath!=='/setup-profile')setCurrentPath('/setup-profile')},[needsProfileSetup,isLoggedIn,isAdminAppRoute,isUnverified,currentPath]);
 useEffect(()=>{if(isLoggedIn&&!isUnverified&&!needsProfileSetup&&!isCheckingProfile&&(currentPath==='/login'||currentPath==='/signup'||currentPath==='/setup-profile'))handleLogin(currentRole)},[isLoggedIn,currentRole,currentPath,isUnverified,needsProfileSetup,isCheckingProfile]);
 /* التحقق غير المؤكّد → صفحة التأكيد. شبكة الأمان 3: قبل التحويل نعيد مزامنة
    الجلسة من الخادم مرة واحدة — جلسة قديمة من localStorage (محفوظة لحظة السباق
    قبل تفعيل البريد، أو بعد فشل المزامنة لضعف الاتصال) كانت تسبب حلقة تحويل
    متكررة تنتهي بشاشة بيضاء عند ال refresh */
 useEffect(()=>{if(!(isUnverified&&(isDashboardRoute||currentPath==='/')))return;
   let resynced=false;try{resynced=sessionStorage.getItem('hassty_verified_resync')==='1'}catch{}
   if(!resynced){try{sessionStorage.setItem('hassty_verified_resync','1')}catch{};void refreshUser();return /* استنى المزامنة قبل أي تحويل */}
   setCurrentPath('/verify-email');
 },[isUnverified,isDashboardRoute,currentPath,refreshUser]);
 /* الزائر غير المسجّل يفتح رابط لوحة تحكم → يحوّل لصفحة الدخول (بدل 404/فراغ) */
 useEffect(()=>{if(!authLoading&&!isLoggedIn&&isDashboardRoute&&currentPath!=='/assistant/signup')setCurrentPath('/login')},[authLoading,isLoggedIn,isDashboardRoute,currentPath]);
 /* SEO: عناوين ديناميكية لمساحات العمل + منع فهرسة الصفحات الخاصة في محركات البحث */
 useEffect(()=>{const robots=document.querySelector('meta[name="robots"]');const isAssistantSignup=currentPath==='/assistant/signup';if(isAdminAppRoute){document.title='لوحة الإدارة | منصة حصتي';if(robots)robots.setAttribute('content','noindex, nofollow')}else if(isDashboardRoute&&!isAssistantSignup){document.title=`${dashboardTitles[currentPath]||'لوحة التحكم'} | منصة حصتي`;if(robots)robots.setAttribute('content','noindex, nofollow')}},[currentPath,isDashboardRoute,isAdminAppRoute,isLoggedIn]);
 /* شبكة الأمان 4: كاشف حلقات التحويل — أكثر من 10 تغييرات مسار خلال 5 ثوانٍ
    (تنقل آلي لا نهائي بسبب تعارض حالة) → نوقف الشجرة ونعرض شاشة استرداد
    بدل الانهيار في «Maximum update depth» وشاشة بيضاء */
 const [loopDetected,setLoopDetected]=useState(false); const navTimesRef=useRef<number[]>([]);
 useEffect(()=>{if(loopDetected)return;const now=Date.now();const t=navTimesRef.current;t.push(now);while(t.length&&now-t[0]>5000)t.shift();if(t.length>10){t.length=0;setLoopDetected(true);try{sessionStorage.setItem('hassty_loop_detected','1')}catch{}}},[currentPath,loopDetected]);
 if(loopDetected){return <div dir="rtl" className="min-h-screen bg-[#F6F9FF] flex items-center justify-center px-4 py-10 font-sans">
   <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-[0_24px_70px_-30px_rgba(30,58,138,0.35)] p-6 text-center">
     <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center"><svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg></div>
     <h1 className="text-base font-black text-[#1E3A8A] mb-2">توقف مؤقت في التنقل</h1>
     <p className="text-sm text-[#4B5563] leading-relaxed mb-5">اكتشفنا تحويلات متكررة غير طبيعية — غالبًا بسبب حالة قديمة في المتصفح. بياناتك في أمان، اضغط تحديث الصفحة للمتابعة.</p>
     <div className="grid grid-cols-2 gap-2.5">
       <button onClick={()=>window.location.reload()} className="px-4 py-2.5 text-sm font-black text-white rounded-xl bg-gradient-to-l from-[#2563EB] to-[#7C3AED] cursor-pointer">تحديث الصفحة</button>
       <button onClick={()=>{void logout();try{sessionStorage.clear()}catch{};window.location.assign('/')}} className="px-4 py-2.5 text-sm font-bold text-[#1E3A8A] border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer">خروج آمن</button>
     </div>
   </div></div>}
 const [initialAdminToken]=useState<string|null>(()=>typeof window!=='undefined'?new URLSearchParams(window.location.search).get('authKey'):null);
 if(isAdminAppRoute)return <ToastProvider><Suspense fallback={<PageLoader/>}><HasstyAdminApp onSwitchToPublicApp={()=>setCurrentPath('/')} initialToken={initialAdminToken}/></Suspense></ToastProvider>;
 if(isAssistantSignupRoute&&!isLoggedIn)return <Suspense fallback={<PageLoader/>}><AssistantSignupPage onNavigate={handleNavigate}/></Suspense>;
 if(isSignupRoute&&!isLoggedIn)return <div className="min-h-screen w-full bg-[#F8FAFF] text-[#1F2937] font-['IBM_Plex_Sans_Arabic',sans-serif] antialiased"><Suspense fallback={<PageLoader/>}><SignupPage onNavigate={handleNavigate} onSignupSuccess={handleLogin}/></Suspense></div>;
 if(isLoggedIn&&needsProfileSetup&&!isUnverified&&currentPath==='/setup-profile')return <div className="min-h-screen bg-[#F7FAFF] text-[#1F2937] font-['IBM_Plex_Sans_Arabic',sans-serif] antialiased"><Suspense fallback={<PageLoader/>}><ProfileSetupPage onComplete={handleProfileSetupComplete} onLogout={handleLogout}/></Suspense><DevDisclaimerFloatingPill/></div>;
 const legalMatch=currentPath.match(/^\/legal\/(terms|privacy|teacher|cookies|acceptable|refund|rights)$/); if(legalMatch)return <Suspense fallback={<PageLoader/>}><LegalPage section={legalMatch[1] as LegalSection} onNavigate={handleNavigate}/></Suspense>;
 return <ToastProvider><div data-role={currentRole} className="min-h-screen bg-[#F8FAFF] text-[#1F2937] flex flex-col antialiased">
  {isLoggedIn&&isDashboardRoute&&!isUnverified&&!needsProfileSetup?<LoggedInNavbar currentRole={currentRole} currentPath={currentPath} userName={user?.name} userAvatar={user?.avatarUrl||user?.profileData?.avatarUrl} onNavigate={handleNavigate} onRoleChange={(r)=>setCurrentPath(`/${r}/dashboard`)} onLogout={handleLogout}/>:<PublicNavbar currentPath={currentPath} isLoggedIn={isLoggedIn&&!isUnverified&&!needsProfileSetup} user={user} currentRole={currentRole} onNavigate={handleNavigate} onOpenLogin={()=>handleNavigate('/login')} onOpenSignup={()=>handleNavigate('/signup')} onLogout={handleLogout}/>}
  {isLoggedIn&&isDashboardRoute&&!isUnverified&&!needsProfileSetup&&<Suspense fallback={null}><PushPermissionBanner/></Suspense>}
  {isDashboardRoute&&isLoggedIn&&!isUnverified&&!needsProfileSetup?<div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 pb-24 sm:pb-24 lg:pb-6 flex flex-col md:flex-row gap-5 lg:gap-6 items-start"><DashboardSidebar currentRole={currentRole} currentPath={currentPath} onNavigate={handleNavigate} onLogout={handleLogout}/><main key={currentPath} className="flex-1 w-full min-w-0 page-transition"><Suspense fallback={<PageLoader/>}>
   {/* ====== STUDENT routes ====== */}
   {currentPath==='/student/dashboard'&&<StudentDashboardPage onNavigate={handleNavigate} onSelectTutor={handleSelectTutor}/>} {currentPath==='/student/qr-card'&&<StudentQRCardPage/>} {currentPath==='/student/profile'&&<StudentProfilePage/>} {currentPath==='/student/tutors'&&<StudentTutorsPage onNavigate={handleNavigate} onSelectTutor={handleSelectTutor}/>} {currentPath==='/student/book'&&<StudentBookPage/>} {currentPath==='/student/payments'&&<StudentPaymentsPage/>} {currentPath==='/student/notifications'&&<NotificationsPage onNavigate={handleNavigate}/>} {currentPath==='/student/calendar'&&<CalendarPage/>} {currentPath==='/student/messages'&&<MessagesPage/>} {currentPath==='/student/assignments'&&<AssignmentsPage/>} {currentPath==='/student/grades'&&<GradesPage/>} {currentPath==='/student/attendance'&&<AttendanceOverviewPage/>} {currentPath==='/student/reviews'&&<StudentReviewsPage/>}
   {currentPath==='/student/exams'&&<StudentExamsPage/>} {currentPath==='/student/exam-results'&&<StudentExamResultsPage/>} {currentPath==='/student/settings'&&<StudentSettingsPage/>}
   {/* ====== PARENT routes ====== */}
   {currentPath==='/parent/dashboard'&&<ParentDashboardPage onNavigate={handleNavigate}/>} {currentPath==='/parent/attendance'&&<ParentAttendancePage/>} {currentPath==='/parent/payments'&&<ParentPaymentsPage/>} {currentPath==='/parent/settings'&&<ParentSettingsPage/>} {currentPath==='/parent/notifications'&&<NotificationsPage onNavigate={handleNavigate}/>} {currentPath==='/parent/calendar'&&<CalendarPage/>} {currentPath==='/parent/messages'&&<MessagesPage/>} {currentPath==='/parent/grades'&&<ParentGradesPage/>}
   {currentPath==='/parent/children'&&<ParentChildrenPage/>} {currentPath==='/parent/teacher-change'&&<ParentTeacherChangePage/>} {currentPath==='/parent/transfers'&&<ParentTransfersPage/>}
   {/* ====== TEACHER routes ====== */}
   {currentPath==='/teacher/dashboard'&&<TeacherDashboardPage onNavigate={handleNavigate}/>} {currentPath==='/teacher/assistants'&&<TeacherMyAssistantsPage onNavigate={handleNavigate}/>} {currentPath==='/teacher/assistants/search'&&<TeacherAssistantSearchPage onNavigate={handleNavigate}/>} {currentPath==='/teacher/students'&&<TeacherStudentsPage onNavigate={handleNavigate}/>} {currentPath==='/teacher/groups'&&<TeacherGroupsPage/>} {currentPath==='/teacher/scan'&&<TeacherScanPage/>} {currentPath==='/teacher/attendance'&&<TeacherAttendancePage/>} {currentPath==='/teacher/payments'&&<TeacherPaymentsPage onNavigate={handleNavigate}/>} {currentPath==='/teacher/availability'&&<TeacherAvailabilityPage/>} {currentPath==='/teacher/profile'&&<TeacherProfileEditPage/>} {currentPath==='/teacher/reviews'&&<TeacherReviewsPage/>} {currentPath==='/teacher/notifications'&&<NotificationsPage onNavigate={handleNavigate}/>} {currentPath==='/teacher/calendar'&&<CalendarPage/>} {currentPath==='/teacher/messages'&&<MessagesPage/>} {currentPath==='/teacher/assignments'&&<TeacherAssignmentsPage/>}
   {currentPath==='/teacher/sessions'&&<TeacherSessionsPage/>} {currentPath==='/teacher/enrollment-requests'&&<TeacherEnrollmentRequestsPage onNavigate={handleNavigate}/>} {currentPath==='/teacher/transfers'&&<TeacherTransfersPage/>} {currentPath==='/teacher/makeup'&&<TeacherMakeupPage/>} {currentPath==='/teacher/attendance/disputes'&&<TeacherDisputesPage/>} {currentPath==='/teacher/assignment-submissions'&&<TeacherSubmissionsPage/>} {currentPath==='/teacher/student-notes'&&<TeacherStudentNotesPage onNavigate={handleNavigate}/>} {currentPath==='/teacher/exams'&&<TeacherExamsPage onNavigate={handleNavigate}/>} {currentPath==='/teacher/gradebook'&&<TeacherGradebookPage/>}
   {/* ====== TEACHER param routes ====== */}
   {(()=>{
     const studentMatch=currentPath.match(/^\/teacher\/students\/([^/]+)$/);
     if(studentMatch) return <TeacherStudentProfilePage studentId={decodeURIComponent(studentMatch[1])} onNavigate={handleNavigate}/>;
     const examMatch=currentPath.match(/^\/teacher\/exams\/([^/]+)$/);
     if(examMatch) return <TeacherExamDetailPage examId={decodeURIComponent(examMatch[1])} onNavigate={handleNavigate}/>;
     return null;
   })()}
   {/* ====== ASSISTANT routes ====== */}
   {currentPath==='/assistant/dashboard'&&<AssistantDashboardPage onNavigate={handleNavigate}/>} {currentPath==='/assistant/groups'&&<AssistantGroupsPage/>} {currentPath==='/assistant/students'&&<AssistantStudentsPage/>} {currentPath==='/assistant/attendance'&&<AssistantAttendancePage/>} {currentPath==='/assistant/payments'&&<AssistantPaymentsPage/>} {currentPath==='/assistant/invitations'&&<AssistantInvitationsPage onNavigate={handleNavigate}/>} {currentPath==='/assistant/notifications'&&<NotificationsPage onNavigate={handleNavigate}/>} {currentPath==='/assistant/calendar'&&<CalendarPage/>} {currentPath==='/assistant/messages'&&<MessagesPage/>} {currentPath==='/assistant/profile'&&<AssistantProfilePage/>}
   {currentPath==='/assistant/verification'&&<AssistantVerificationPage/>}
   {/* ====== dashboard 404 fallback ====== */}
   {isDashboardRoute&&![
     '/student/dashboard','/student/qr-card','/student/profile','/student/tutors','/student/book','/student/payments','/student/notifications','/student/calendar','/student/messages','/student/assignments','/student/grades','/student/attendance','/student/reviews','/student/exams','/student/exam-results','/student/settings',
     '/parent/dashboard','/parent/attendance','/parent/payments','/parent/settings','/parent/notifications','/parent/calendar','/parent/messages','/parent/grades','/parent/children','/parent/teacher-change','/parent/transfers',
     '/teacher/dashboard','/teacher/assistants','/teacher/assistants/search','/teacher/students','/teacher/groups','/teacher/scan','/teacher/attendance','/teacher/attendance/disputes','/teacher/payments','/teacher/availability','/teacher/profile','/teacher/reviews','/teacher/notifications','/teacher/calendar','/teacher/messages','/teacher/assignments','/teacher/assignment-submissions','/teacher/sessions','/teacher/enrollment-requests','/teacher/transfers','/teacher/makeup','/teacher/student-notes','/teacher/exams','/teacher/gradebook',
     '/assistant/dashboard','/assistant/groups','/assistant/students','/assistant/attendance','/assistant/payments','/assistant/invitations','/assistant/notifications','/assistant/calendar','/assistant/messages','/assistant/profile','/assistant/verification',
   ].includes(currentPath)&&!/\/teacher\/(students|exams)\/[^/]+$/.test(currentPath)&&<NotFoundPage variant="dashboard" onNavigate={handleNavigate} dashboardPath={`/${currentRole}/dashboard`}/>}
  </Suspense></main></div>:<main key={currentPath} className="flex-1 page-transition"><Suspense fallback={<PageLoader/>}>{isCheckingProfile&&isLoggedIn&&!isUnverified&&isKnownPublicPath&&currentPath!=='/setup-profile'&&<div className="max-w-3xl mx-auto px-4 py-8 text-center text-xs text-slate-500">جاري تجهيز بيانات حسابك...</div>} {currentPath==='/'&&<HomePage onNavigate={handleNavigate} onSelectTutor={handleSelectTutor} onSearchWithParams={handleSearchWithParams}/>} {currentPath==='/search'&&<SearchResultsPage onNavigate={handleNavigate} onSelectTutor={handleSelectTutor} initialSubject={searchSubject} initialGovernorate={searchGovernorate} initialCity={searchCity}/>} {currentPath.startsWith('/tutor')&&<TeacherProfilePage tutorId={selectedTutorId} onNavigate={handleNavigate} onSelectTutor={handleSelectTutor}/>} {currentPath==='/about'&&<AboutPage onNavigate={handleNavigate}/>} {currentPath==='/contact'&&<ContactPage onNavigate={handleNavigate}/>} {currentPath==='/for-teachers'&&<ForTeachersPage onNavigate={handleNavigate}/>} {currentPath==='/login'&&<LoginPage onNavigate={handleNavigate} onLoginSuccess={handleLogin}/>} {(currentPath==='/verify-email'||isUnverified)&&<VerifyEmailPage onNavigate={handleNavigate} onVerificationSuccess={handleLogin}/>} {currentPath==='/whatsapp-studio'&&<Suspense fallback={<PageLoader/>}><WhatsAppStudioPage/></Suspense>}{!isKnownPublicPath&&!isUnverified&&<NotFoundPage onNavigate={handleNavigate}/>}</Suspense></main>}
  {!isDashboardRoute&&!isLoggedIn&&<Footer onNavigate={handleNavigate}/>}<DevDisclaimerFloatingPill/>
 </div></ToastProvider>;
}
