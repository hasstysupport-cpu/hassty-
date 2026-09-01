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
import { AccountBadgeType, AdminUserAccount } from '../../types';
import { subscribeToUsers, subscribeToVerifications, subscribeToReports, subscribeToCommissions, dbUpdateAccountBadge, dbToggleAccountStatus, dbDeleteAccount, dbRejectVerification, dbSuspendTeacherFromReport, dbResolveReport, dbDismissReport, dbMarkCommissionPaid } from '../../lib/adminSupabaseService';
import { approveTeacherVerificationAtomic } from '../../lib/adminTeacherVerification';
import { OFFICIAL_ADMIN_EMAIL, isCurrentAdminSessionValid, clearAdminSession } from '../../lib/securityConfig';
import { supabase } from '../../lib/supabase';
import { Loader2, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
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

  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (!isCurrentAdminSessionValid() && isAuthenticated) setIsAuthenticated(false);
    }, 60000);
    return () => clearInterval(checkInterval);
  }, [isAuthenticated]);

  useEffect(() => {
    let disposed = false;
    let unsubUsers: (()=>void)|undefined;
    let unsubVerifs: (()=>void)|undefined;
    let unsubReports: (()=>void)|undefined;
    let unsubComms: (()=>void)|undefined;

    const fail = (label: string, err: any) => {
      if (disposed) return;
      setDbConnectionStatus('failed');
      setDbErrorMessage(`${label}: ${err?.message || String(err) || 'تعذر قراءة البيانات من Supabase.'}`);
      setIsDbLoading(false);
    };

    const initRealtimeSync = async () => {
      setDbConnectionStatus('connecting');
      setDbErrorMessage(null);
      setIsDbLoading(true);
      try {
        if (!supabase) throw new Error('Supabase غير مُهيأ في بيئة لوحة الإدارة.');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session?.user) throw new Error('جلسة Supabase غير موجودة. أعد تسجيل الدخول.');
        const email = (sessionData.session.user.email || '').toLowerCase().trim();
        if (email !== OFFICIAL_ADMIN_EMAIL.toLowerCase() && email !== 'admin@hassty.com') throw new Error('الحساب الحالي ليس حساب إدارة معتمدًا.');
        if (!disposed) { setAdminEmail(email); setIsAuthenticated(true); }
        const markLoaded = () => { if (!disposed) { setDbConnectionStatus('connected'); setDbErrorMessage(null); setIsDbLoading(false); } };
        unsubUsers = subscribeToUsers(data => { if (!disposed) { setAccounts(data); markLoaded(); } }, err => fail('قراءة المستخدمين', err));
        unsubVerifs = subscribeToVerifications(data => { if (!disposed) setVerificationRequests(data); }, err => fail('قراءة طلبات التوثيق', err));
        unsubReports = subscribeToReports(data => { if (!disposed) setSafetyReports(data); }, err => fail('قراءة البلاغات', err));
        unsubComms = subscribeToCommissions(data => { if (!disposed) setCommissions(data); }, err => fail('قراءة العمولات', err));
      } catch (err: any) { fail('تهيئة لوحة الإدارة', err); }
    };
    void initRealtimeSync();
    return () => { disposed = true; unsubUsers?.(); unsubVerifs?.(); unsubReports?.(); unsubComms?.(); };
  }, [retryTrigger]);

  const handleRetryConnection = () => setRetryTrigger(v => v + 1);
  const handleGoogleAdminAuth = async () => {
    try {
      const provider = new GoogleAuthProvider(); provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider); if (!result?.user) return;
      const email = (result.user.email || '').toLowerCase().trim();
      if (email !== OFFICIAL_ADMIN_EMAIL.toLowerCase() && email !== 'admin@hassty.com') { setDbConnectionStatus('failed'); setDbErrorMessage('هذا البريد ليس حساب الإدارة المعتمد.'); return; }
      setAdminEmail(email); setIsAuthenticated(true); handleRetryConnection();
    } catch (err: any) { setDbConnectionStatus('failed'); setDbErrorMessage(err?.message || 'فشل تسجيل دخول Google للإدارة.'); }
  };
  const handleLoginSuccess = (email: string) => { setIsAuthenticated(true); setAdminEmail(email); handleRetryConnection(); };
  const handleLogout = () => { setIsAuthenticated(false); clearAdminSession(); };

  const failSafely = (err:any) => { setDbConnectionStatus('connected'); setDbErrorMessage(err?.message || 'فشلت العملية في Supabase.'); };
  const handleUpdateAccountBadge = async (accountId:string,newBadge:AccountBadgeType) => { try { await dbUpdateAccountBadge(accountId,newBadge); handleRetryConnection(); } catch(e){ failSafely(e); } };
  const handleToggleAccountStatus = async (accountId:string) => { const target=accounts.find(a=>a.id===accountId); if(!target)return; try { await dbToggleAccountStatus(accountId,target.status); handleRetryConnection(); } catch(e){ failSafely(e); } };
  const handleDeleteAccount = async (accountId:string) => { try { await dbDeleteAccount(accountId); handleRetryConnection(); } catch(e){ failSafely(e); } };
  const handleApproveTeacherVerification = async (requestId:string) => {
    const targetReq=verificationRequests.find(r=>r.id===requestId); if(!targetReq)return;
    try {
      await approveTeacherVerificationAtomic({ requestId, teacherId:targetReq.teacherId, adminEmail, name:targetReq.teacherName, phone:targetReq.phone, governorate:targetReq.governorate, city:targetReq.area, grade:targetReq.stage, subject:targetReq.subject });
      setVerificationRequests(prev=>prev.map(r=>r.id===requestId?{...r,status:'approved'}:r));
      handleRetryConnection();
    } catch(e){ failSafely(e); }
  };
  const handleRejectTeacherVerification = async (requestId:string,reason:string) => { try { await dbRejectVerification(requestId,reason,adminEmail); setVerificationRequests(prev=>prev.map(r=>r.id===requestId?{...r,status:'rejected',rejectionReason:reason}:r)); handleRetryConnection(); } catch(e){ failSafely(e); } };
  const handleSuspendTeacherFromReport = async (teacherId:string,reportId:string) => { try { await dbSuspendTeacherFromReport(teacherId,reportId); handleRetryConnection(); } catch(e){ failSafely(e); } };
  const handleResolveSafetyReport = async (reportId:string) => { try { await dbResolveReport(reportId); handleRetryConnection(); } catch(e){ failSafely(e); } };
  const handleDismissSafetyReport = async (reportId:string) => { try { await dbDismissReport(reportId); handleRetryConnection(); } catch(e){ failSafely(e); } };
  const handleMarkCommissionPaid = async (id:string) => { try { await dbMarkCommissionPaid(id); handleRetryConnection(); } catch(e){ failSafely(e); } };

  if(!isAuthenticated)return <AdminLoginPage onLoginSuccess={handleLoginSuccess} onBackToPublicSite={onSwitchToPublicApp} initialToken={initialToken}/>;
  const pendingVerificationsCount=verificationRequests.filter(v=>v.status==='pending').length;
  const pendingReportsCount=safetyReports.filter(r=>r.status==='new'||r.status==='in_review').length;

  return <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row text-right font-['IBM_Plex_Sans_Arabic',sans-serif] antialiased">
    <AdminSidebar currentTab={currentTab} onSelectTab={tab=>{setCurrentTab(tab);window.scrollTo({top:0,behavior:'smooth'})}} pendingVerificationsCount={pendingVerificationsCount} pendingAssistantVerificationsCount={pendingAssistantVerificationsCount} pendingReportsCount={pendingReportsCount} adminEmail={adminEmail} onLogout={handleLogout} onSwitchToPublicApp={onSwitchToPublicApp} dbConnectionStatus={dbConnectionStatus} onRetryDbConnection={handleRetryConnection}/>
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto space-y-6">
      {dbConnectionStatus==='failed'&&<div className="p-4 bg-red-50 border-2 border-red-300 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4"><div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-red-600"/><div><h4 className="text-sm font-black text-red-900">فشل قراءة بيانات لوحة الإدارة</h4><p className="text-xs text-red-700 mt-0.5">{dbErrorMessage||'تعذر القراءة من Supabase.'}</p></div></div><div className="flex items-center gap-2"><button onClick={handleGoogleAdminAuth} className="px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-2xl flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> إعادة توثيق Google</button><button onClick={handleRetryConnection} className="px-3 py-2 bg-slate-800 text-white text-xs font-black rounded-2xl" aria-label="retry"><RefreshCw className="w-4 h-4"/></button></div></div>}
      {isDbLoading?<div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500"><Loader2 className="w-8 h-8 animate-spin text-blue-600"/><p className="text-sm font-bold">جاري قراءة البيانات الحقيقية من Supabase...</p></div>:<>
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