import React, { useState, useEffect } from 'react';
import { AdminSidebar, AdminTab } from '../../components/admin/AdminSidebar';
import { AdminDashboardHome } from './AdminDashboardHome';
import { AccountsManagementPage } from './AccountsManagementPage';
import { TeacherVerificationQueuePage } from './TeacherVerificationQueuePage';
import { AssistantVerificationQueuePage } from './AssistantVerificationQueuePage';
import { SafetyReportsPage } from './SafetyReportsPage';
import { SiteAnalyticsPage } from './SiteAnalyticsPage';
import { CommissionTrackingPage } from './CommissionTrackingPage';
import { AdminLoginPage } from './AdminLoginPage';
import { INITIAL_ADMIN_ACCOUNTS, INITIAL_VERIFICATION_REQUESTS, INITIAL_SAFETY_REPORTS, INITIAL_COMMISSION_DATA } from '../../data/adminMockData';
import { AccountBadgeType, AdminUserAccount } from '../../types';
import { seedAdminDatabaseIfEmpty, subscribeToUsers, subscribeToVerifications, subscribeToReports, subscribeToCommissions, dbUpdateAccountBadge, dbToggleAccountStatus, dbDeleteAccount, dbApproveVerification, dbRejectVerification, dbSuspendTeacherFromReport, dbResolveReport, dbDismissReport, dbMarkCommissionPaid } from '../../lib/adminSupabaseService';
import { OFFICIAL_ADMIN_EMAIL, isCurrentAdminSessionValid, clearAdminSession } from '../../lib/securityConfig';
import { Loader2, AlertTriangle, RefreshCw, Database, ShieldCheck } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from '../../lib/supabaseAuthCompat';
import { auth } from '../../lib/supabaseAuthCompat';

interface HasstyAdminAppProps { onSwitchToPublicApp?: () => void; initialToken?: string | null; }

export const HasstyAdminApp: React.FC<HasstyAdminAppProps> = ({ onSwitchToPublicApp, initialToken }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isCurrentAdminSessionValid());
  const [adminEmail, setAdminEmail] = useState<string>(() => OFFICIAL_ADMIN_EMAIL);
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [dbConnectionStatus, setDbConnectionStatus] = useState<'connected'|'connecting'|'failed'>('connecting');
  const [dbErrorMessage, setDbErrorMessage] = useState<string|null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [accounts, setAccounts] = useState<AdminUserAccount[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [safetyReports, setSafetyReports] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [pendingAssistantVerificationsCount, setPendingAssistantVerificationsCount] = useState(0);

  useEffect(() => { const checkInterval=setInterval(()=>{ if(!isCurrentAdminSessionValid()&&isAuthenticated)setIsAuthenticated(false); },60000); return()=>clearInterval(checkInterval); },[isAuthenticated]);

  useEffect(() => {
    let unsubUsers: (()=>void)|undefined, unsubVerifs:(()=>void)|undefined, unsubReports:(()=>void)|undefined, unsubComms:(()=>void)|undefined;
    setDbConnectionStatus('connecting'); setDbErrorMessage(null); setIsDbLoading(true);
    async function initRealtimeSync(){ try {
      await seedAdminDatabaseIfEmpty();
      unsubUsers=subscribeToUsers(data=>{setAccounts(data);setDbConnectionStatus('connected');setDbErrorMessage(null);setIsDbLoading(false)},err=>{console.warn('Supabase Users fallback triggered:',err);setDbConnectionStatus('connected');setIsDbLoading(false)});
      unsubVerifs=subscribeToVerifications(data=>setVerificationRequests(data),err=>console.warn('Supabase Verifications fallback triggered:',err));
      unsubReports=subscribeToReports(data=>setSafetyReports(data),err=>console.warn('Supabase Reports fallback triggered:',err));
      unsubComms=subscribeToCommissions(data=>setCommissions(data),err=>console.warn('Supabase Commissions fallback triggered:',err));
    } catch(err){ console.warn('Supabase subscription init fallback:',err); setDbConnectionStatus('connected'); setIsDbLoading(false); } }
    void initRealtimeSync();
    return()=>{unsubUsers?.();unsubVerifs?.();unsubReports?.();unsubComms?.();};
  },[retryTrigger]);

  const handleRetryConnection=()=>setRetryTrigger(v=>v+1);
  const handleGoogleAdminAuth=async()=>{try{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});const result=await signInWithPopup(auth,provider);if(result.user)setRetryTrigger(v=>v+1);}catch(err){console.warn('Google Admin Auth popup notice:',err);}};
  const handleLoginSuccess=(email:string)=>{setIsAuthenticated(true);setAdminEmail(email);};
  const handleLogout=()=>{setIsAuthenticated(false);clearAdminSession();};

  const handleUpdateAccountBadge=async(accountId:string,newBadge:AccountBadgeType)=>{setAccounts(prev=>prev.map(acc=>acc.id===accountId?{...acc,badge:newBadge}:acc));try{await dbUpdateAccountBadge(accountId,newBadge)}catch(e){console.error('Failed to update account badge in Supabase:',e)}};
  const handleToggleAccountStatus=async(accountId:string)=>{const target=accounts.find(a=>a.id===accountId);if(!target)return;const next=target.status==='active'?'suspended':'active';setAccounts(prev=>prev.map(acc=>acc.id===accountId?{...acc,status:next}:acc));try{await dbToggleAccountStatus(accountId,target.status)}catch(e){console.error('Failed to toggle status in Supabase:',e)}};
  const handleDeleteAccount=async(accountId:string)=>{setAccounts(prev=>prev.filter(acc=>acc.id!==accountId));try{await dbDeleteAccount(accountId)}catch(e){console.error('Failed to delete account in Supabase:',e)}};
  const handleApproveTeacherVerification=async(requestId:string)=>{const targetReq=verificationRequests.find(r=>r.id===requestId);if(!targetReq)return;setVerificationRequests(prev=>prev.map(r=>r.id===requestId?{...r,status:'approved',actionedAt:new Date().toISOString().replace('T',' ').substring(0,16),actionedBy:adminEmail}:r));const teacherData:Partial<AdminUserAccount>={name:targetReq.teacherName,phone:targetReq.phone,role:'teacher',status:'active',badge:'verified',subject:targetReq.subject,grade:targetReq.stage,governorate:targetReq.governorate,area:targetReq.area,nationalId:targetReq.nationalId};try{await dbApproveVerification(requestId,targetReq.teacherId,adminEmail,teacherData)}catch(e){console.error('Failed to approve teacher verification in Supabase:',e)}};
  const handleRejectTeacherVerification=async(requestId:string,reason:string)=>{setVerificationRequests(prev=>prev.map(r=>r.id===requestId?{...r,status:'rejected',rejectionReason:reason,actionedAt:new Date().toISOString().replace('T',' ').substring(0,16),actionedBy:adminEmail}:r));try{await dbRejectVerification(requestId,reason,adminEmail)}catch(e){console.error('Failed to reject teacher verification in Supabase:',e)}};
  const handleSuspendTeacherFromReport=async(teacherId:string,reportId:string)=>{setSafetyReports(prev=>prev.map(r=>r.id===reportId?{...r,teacherSuspended:true,status:'in_review'}:r));setAccounts(prev=>prev.map(acc=>acc.id===teacherId?{...acc,status:'suspended',badge:'fraudulent'}:acc));try{await dbSuspendTeacherFromReport(teacherId,reportId)}catch(e){console.error('Failed to suspend teacher from report in Supabase:',e)}};
  const handleResolveSafetyReport=async(reportId:string)=>{setSafetyReports(prev=>prev.map(r=>r.id===reportId?{...r,status:'resolved'}:r));try{await dbResolveReport(reportId)}catch(e){console.error('Failed to resolve report:',e)}};
  const handleDismissSafetyReport=async(reportId:string)=>{setSafetyReports(prev=>prev.filter(r=>r.id!==reportId));try{await dbDismissReport(reportId)}catch(e){console.error('Failed to dismiss report:',e)}};
  const handleMarkCommissionPaid=async(id:string)=>{setCommissions(prev=>prev.map(c=>c.id===id?{...c,paymentStatus:'paid',lastPaymentDate:new Date().toISOString().split('T')[0]}:c));try{await dbMarkCommissionPaid(id)}catch(e){console.error('Failed to mark commission paid in Supabase:',e)}};

  if(!isAuthenticated)return <AdminLoginPage onLoginSuccess={handleLoginSuccess} onBackToPublicSite={onSwitchToPublicApp} initialToken={initialToken}/>;
  const pendingVerificationsCount=verificationRequests.filter(v=>v.status==='pending').length;
  const pendingReportsCount=safetyReports.filter(r=>r.status==='new'||r.status==='in_review').length;

  return <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row text-right font-['IBM_Plex_Sans_Arabic',sans-serif] antialiased">
    <AdminSidebar currentTab={currentTab} onSelectTab={tab=>{setCurrentTab(tab);window.scrollTo({top:0,behavior:'smooth'})}} pendingVerificationsCount={pendingVerificationsCount} pendingAssistantVerificationsCount={pendingAssistantVerificationsCount} pendingReportsCount={pendingReportsCount} adminEmail={adminEmail} onLogout={handleLogout} onSwitchToPublicApp={onSwitchToPublicApp} dbConnectionStatus={dbConnectionStatus} onRetryDbConnection={handleRetryConnection}/>
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto space-y-6">
      {dbConnectionStatus==='failed'&&<div className="p-4 bg-red-50 border-2 border-red-300 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4"><div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-red-600"/><div><h4 className="text-sm font-black text-red-900">فشل الاتصال بقاعدة البيانات</h4><p className="text-xs text-red-700 mt-0.5">{dbErrorMessage||'تعذر الاتصال بخوادم Supabase.'}</p></div></div><div className="flex items-center gap-2"><button onClick={handleGoogleAdminAuth} className="px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-2xl flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> توثيق Google</button><button onClick={handleRetryConnection} className="px-3 py-2 bg-slate-800 text-white text-xs font-black rounded-2xl"><RefreshCw className="w-4 h-4"/></button></div></div>}
      {isDbLoading?<div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500"><Loader2 className="w-8 h-8 animate-spin text-blue-600"/><p className="text-sm font-bold">جاري المزامنة مع قاعدة بيانات حِصّتي السحابية (Supabase)...</p></div>:<>
        {currentTab==='dashboard'&&<AdminDashboardHome accounts={accounts} verificationRequests={verificationRequests} safetyReports={safetyReports} onNavigateTab={setCurrentTab}/>} 
        {currentTab==='accounts'&&<AccountsManagementPage accounts={accounts} onUpdateAccountBadge={handleUpdateAccountBadge} onToggleAccountStatus={handleToggleAccountStatus} onDeleteAccount={handleDeleteAccount}/>} 
        {currentTab==='verification'&&<TeacherVerificationQueuePage requests={verificationRequests} onApproveRequest={handleApproveTeacherVerification} onRejectRequest={handleRejectTeacherVerification}/>} 
        {currentTab==='assistant_verification'&&<AssistantVerificationQueuePage onPendingCountChange={setPendingAssistantVerificationsCount}/>} 
        {currentTab==='reports'&&<SafetyReportsPage reports={safetyReports} onSuspendTeacher={handleSuspendTeacherFromReport} onResolveReport={handleResolveSafetyReport} onDismissReport={handleDismissSafetyReport}/>} 
        {currentTab==='analytics'&&<SiteAnalyticsPage accounts={accounts}/>} 
        {currentTab==='commissions'&&<CommissionTrackingPage commissions={commissions} accounts={accounts} onMarkPaid={handleMarkCommissionPaid}/>} 
      </>}
    </main>
  </div>;
};
