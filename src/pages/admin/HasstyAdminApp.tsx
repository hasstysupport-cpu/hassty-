import React, { useState, useEffect } from 'react';
import { AdminSidebar, AdminTab } from '../../components/admin/AdminSidebar';
import { AdminDashboardHome } from './AdminDashboardHome';
import { AccountsManagementPage } from './AccountsManagementPage';
import { TeacherVerificationQueuePage } from './TeacherVerificationQueuePage';
import { SafetyReportsPage } from './SafetyReportsPage';
import { SiteAnalyticsPage } from './SiteAnalyticsPage';
import { CommissionTrackingPage } from './CommissionTrackingPage';
import { AdminLoginPage } from './AdminLoginPage';
import {
  INITIAL_ADMIN_ACCOUNTS,
  INITIAL_VERIFICATION_REQUESTS,
  INITIAL_SAFETY_REPORTS,
  INITIAL_COMMISSION_DATA
} from '../../data/adminMockData';
import { AccountBadgeType, AdminUserAccount } from '../../types';
import {
  seedAdminDatabaseIfEmpty,
  subscribeToUsers,
  subscribeToVerifications,
  subscribeToReports,
  subscribeToCommissions,
  dbUpdateAccountBadge,
  dbToggleAccountStatus,
  dbDeleteAccount,
  dbApproveVerification,
  dbRejectVerification,
  dbSuspendTeacherFromReport,
  dbResolveReport,
  dbDismissReport,
  dbMarkCommissionPaid
} from '../../lib/adminFirestoreService';
import {
  OFFICIAL_ADMIN_EMAIL,
  isCurrentAdminSessionValid,
  clearAdminSession,
  saveAdminSession,
} from '../../lib/securityConfig';
import { Loader2, AlertTriangle, RefreshCw, Database } from 'lucide-react';

interface HasstyAdminAppProps {
  onSwitchToPublicApp?: () => void;
  initialToken?: string | null;
}

export const HasstyAdminApp: React.FC<HasstyAdminAppProps> = ({
  onSwitchToPublicApp,
  initialToken,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return isCurrentAdminSessionValid();
  });
  const [adminEmail, setAdminEmail] = useState<string>(() => {
    return OFFICIAL_ADMIN_EMAIL;
  });

  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [isDbLoading, setIsDbLoading] = useState<boolean>(true);
  const [dbConnectionStatus, setDbConnectionStatus] = useState<'connected' | 'connecting' | 'failed'>('connecting');
  const [dbErrorMessage, setDbErrorMessage] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  // Periodically check session expiry (24 hours check)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (!isCurrentAdminSessionValid() && isAuthenticated) {
        setIsAuthenticated(false);
      }
    }, 60000); // check every minute
    return () => clearInterval(checkInterval);
  }, [isAuthenticated]);

  // Application Real-time Firestore States
  const [accounts, setAccounts] = useState<AdminUserAccount[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [safetyReports, setSafetyReports] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);

  // Initialize DB and real-time listeners
  useEffect(() => {
    let unsubUsers: (() => void) | undefined;
    let unsubVerifs: (() => void) | undefined;
    let unsubReports: (() => void) | undefined;
    let unsubComms: (() => void) | undefined;

    setDbConnectionStatus('connecting');
    setDbErrorMessage(null);
    setIsDbLoading(true);

    async function initRealtimeSync() {
      try {
        await seedAdminDatabaseIfEmpty();
        
        unsubUsers = subscribeToUsers(
          (data) => {
            setAccounts(data);
            setDbConnectionStatus('connected');
            setDbErrorMessage(null);
            setIsDbLoading(false);
          },
          (err) => {
            console.error('Firestore Users Sync Error:', err);
            setDbConnectionStatus('failed');
            setDbErrorMessage('فشل الاتصال بقاعدة البيانات (Firestore) — تعذر جلب سجلات المستخدمين');
            setIsDbLoading(false);
          }
        );

        unsubVerifs = subscribeToVerifications(
          (data) => {
            setVerificationRequests(data);
          },
          (err) => {
            console.error('Firestore Verifications Sync Error:', err);
            setDbConnectionStatus('failed');
          }
        );

        unsubReports = subscribeToReports(
          (data) => {
            setSafetyReports(data);
          },
          (err) => {
            console.error('Firestore Reports Sync Error:', err);
            setDbConnectionStatus('failed');
          }
        );

        unsubComms = subscribeToCommissions(
          (data) => {
            setCommissions(data);
          },
          (err) => {
            console.error('Firestore Commissions Sync Error:', err);
            setDbConnectionStatus('failed');
          }
        );
      } catch (err: any) {
        console.warn('Firestore subscription init warning:', err);
        setDbConnectionStatus('failed');
        setDbErrorMessage(err?.message || 'فشل الاتصال بقاعدة البيانات — يرجى التأكد من اتصال الإنترنت');
        setIsDbLoading(false);
      }
    }

    initRealtimeSync();

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubVerifs) unsubVerifs();
      if (unsubReports) unsubReports();
      if (unsubComms) unsubComms();
    };
  }, [retryTrigger]);

  const handleRetryConnection = () => {
    setRetryTrigger((prev) => prev + 1);
  };

  // Auth Handlers
  const handleLoginSuccess = (email: string) => {
    setIsAuthenticated(true);
    setAdminEmail(email);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    clearAdminSession();
  };

  // Badge & Accounts Handlers with Live Firestore DB Writes
  const handleUpdateAccountBadge = async (accountId: string, newBadge: AccountBadgeType) => {
    // Optimistic UI update
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, badge: newBadge } : acc))
    );
    try {
      await dbUpdateAccountBadge(accountId, newBadge);
    } catch (e) {
      console.error('Failed to update account badge in Firestore:', e);
    }
  };

  const handleToggleAccountStatus = async (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'suspended' : 'active';
    
    // Optimistic UI update
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, status: nextStatus } : acc))
    );
    try {
      await dbToggleAccountStatus(accountId, target.status);
    } catch (e) {
      console.error('Failed to toggle status in Firestore:', e);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    // Optimistic UI update
    setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
    try {
      await dbDeleteAccount(accountId);
    } catch (e) {
      console.error('Failed to delete account in Firestore:', e);
    }
  };

  // Verification Queue Handlers with Live Firestore DB Writes
  const handleApproveTeacherVerification = async (requestId: string) => {
    const targetReq = verificationRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    // Optimistic UI update
    setVerificationRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved' as const,
              actionedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              actionedBy: adminEmail,
            }
          : r
      )
    );

    const teacherData: Partial<AdminUserAccount> = {
      name: targetReq.teacherName,
      phone: targetReq.phone,
      role: 'teacher',
      status: 'active',
      badge: 'verified',
      subject: targetReq.subject,
      grade: targetReq.stage,
      governorate: targetReq.governorate,
      area: targetReq.area,
      nationalId: targetReq.nationalId,
    };

    try {
      await dbApproveVerification(requestId, targetReq.teacherId, adminEmail, teacherData);
    } catch (e) {
      console.error('Failed to approve teacher verification in Firestore:', e);
    }
  };

  const handleRejectTeacherVerification = async (requestId: string, reason: string) => {
    // Optimistic UI update
    setVerificationRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected' as const,
              rejectionReason: reason,
              actionedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              actionedBy: adminEmail,
            }
          : r
      )
    );

    try {
      await dbRejectVerification(requestId, reason, adminEmail);
    } catch (e) {
      console.error('Failed to reject teacher verification in Firestore:', e);
    }
  };

  // Safety Reports Handlers with Live Firestore DB Writes
  const handleSuspendTeacherFromReport = async (teacherId: string, reportId: string) => {
    // Optimistic UI update
    setSafetyReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, teacherSuspended: true, status: 'in_review' } : r
      )
    );
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === teacherId ? { ...acc, status: 'suspended', badge: 'fraudulent' } : acc
      )
    );

    try {
      await dbSuspendTeacherFromReport(teacherId, reportId);
    } catch (e) {
      console.error('Failed to suspend teacher from report in Firestore:', e);
    }
  };

  const handleResolveSafetyReport = async (reportId: string) => {
    // Optimistic UI update
    setSafetyReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'resolved' } : r))
    );

    try {
      await dbResolveReport(reportId);
    } catch (e) {
      console.error('Failed to resolve safety report in Firestore:', e);
    }
  };

  const handleDismissSafetyReport = async (reportId: string) => {
    // Optimistic UI update
    setSafetyReports((prev) => prev.filter((r) => r.id !== reportId));

    try {
      await dbDismissReport(reportId);
    } catch (e) {
      console.error('Failed to dismiss safety report in Firestore:', e);
    }
  };

  // Commission Handler with Live Firestore DB Writes
  const handleMarkCommissionPaid = async (id: string) => {
    // Optimistic UI update
    setCommissions((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              paymentStatus: 'paid',
              lastPaymentDate: new Date().toISOString().split('T')[0],
            }
          : c
      )
    );

    try {
      await dbMarkCommissionPaid(id);
    } catch (e) {
      console.error('Failed to mark commission paid in Firestore:', e);
    }
  };

  // If not logged in, render the secure Admin Login Page
  if (!isAuthenticated) {
    return (
      <AdminLoginPage
        onLoginSuccess={handleLoginSuccess}
        onBackToPublicSite={onSwitchToPublicApp}
        initialToken={initialToken}
      />
    );
  }

  const pendingVerificationsCount = verificationRequests.filter((v) => v.status === 'pending').length;
  const pendingReportsCount = safetyReports.filter((r) => r.status === 'new' || r.status === 'in_review').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row text-right font-['IBM_Plex_Sans_Arabic',sans-serif] antialiased">
      
      {/* 1. RTL Persistent Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        pendingVerificationsCount={pendingVerificationsCount}
        pendingReportsCount={pendingReportsCount}
        adminEmail={adminEmail}
        onLogout={handleLogout}
        onSwitchToPublicApp={onSwitchToPublicApp}
        dbConnectionStatus={dbConnectionStatus}
        onRetryDbConnection={handleRetryConnection}
      />

      {/* 2. Main Content View Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto space-y-6">
        {/* Database Connection Failure Alert Banner */}
        {dbConnectionStatus === 'failed' && (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-3 text-right">
              <div className="w-10 h-10 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black text-red-900">
                  فشل الاتصال بقاعدة البيانات (Database Connection Failed)
                </h4>
                <p className="text-xs text-red-700 mt-0.5">
                  {dbErrorMessage || 'تعذر الاتصال بخوادم Firestore السحابية. يرجى التحقق من اتصال الإنترنت.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleRetryConnection}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة المحاولة الآن</span>
            </button>
          </div>
        )}

        {isDbLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-bold">جاري المزامنة مع قاعدة بيانات حِصّتي السحابية (Firestore)...</p>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <AdminDashboardHome
                accounts={accounts}
                verificationRequests={verificationRequests}
                safetyReports={safetyReports}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'accounts' && (
              <AccountsManagementPage
                accounts={accounts}
                onUpdateAccountBadge={handleUpdateAccountBadge}
                onToggleAccountStatus={handleToggleAccountStatus}
                onDeleteAccount={handleDeleteAccount}
              />
            )}

            {currentTab === 'verification' && (
              <TeacherVerificationQueuePage
                requests={verificationRequests}
                onApproveRequest={handleApproveTeacherVerification}
                onRejectRequest={handleRejectTeacherVerification}
              />
            )}

            {currentTab === 'reports' && (
              <SafetyReportsPage
                reports={safetyReports}
                onSuspendTeacher={handleSuspendTeacherFromReport}
                onResolveReport={handleResolveSafetyReport}
                onDismissReport={handleDismissSafetyReport}
              />
            )}

            {currentTab === 'analytics' && (
              <SiteAnalyticsPage accounts={accounts} />
            )}

            {currentTab === 'commissions' && (
              <CommissionTrackingPage
                commissions={commissions}
                onMarkPaid={handleMarkCommissionPaid}
              />
            )}
          </>
        )}
      </main>

    </div>
  );
};
