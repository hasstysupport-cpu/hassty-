import React, { useState } from 'react';
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

interface HasstyAdminAppProps {
  onSwitchToPublicApp?: () => void;
}

export const HasstyAdminApp: React.FC<HasstyAdminAppProps> = ({
  onSwitchToPublicApp,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('hassty_admin_auth') === 'true';
  });
  const [adminEmail, setAdminEmail] = useState<string>(() => {
    return localStorage.getItem('hassty_admin_email') || 'admin@hassty.com';
  });

  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');

  // Application Data States
  const [accounts, setAccounts] = useState<AdminUserAccount[]>(INITIAL_ADMIN_ACCOUNTS);
  const [verificationRequests, setVerificationRequests] = useState(INITIAL_VERIFICATION_REQUESTS);
  const [safetyReports, setSafetyReports] = useState(INITIAL_SAFETY_REPORTS);
  const [commissions, setCommissions] = useState(INITIAL_COMMISSION_DATA);

  // Auth Handlers
  const handleLoginSuccess = (email: string) => {
    setIsAuthenticated(true);
    setAdminEmail(email);
    localStorage.setItem('hassty_admin_auth', 'true');
    localStorage.setItem('hassty_admin_email', email);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('hassty_admin_auth');
    localStorage.removeItem('hassty_admin_email');
  };

  // Badge & Accounts Handlers
  const handleUpdateAccountBadge = (accountId: string, newBadge: AccountBadgeType) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, badge: newBadge } : acc))
    );
  };

  const handleToggleAccountStatus = (accountId: string) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? { ...acc, status: acc.status === 'active' ? 'suspended' : 'active' }
          : acc
      )
    );
  };

  const handleDeleteAccount = (accountId: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
  };

  // Verification Queue Handlers
  const handleApproveTeacherVerification = (requestId: string) => {
    const targetReq = verificationRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

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

    // Also update or add to accounts as verified
    setAccounts((prev) => {
      const exists = prev.find((a) => a.id === targetReq.teacherId || a.phone === targetReq.phone);
      if (exists) {
        return prev.map((a) =>
          a.id === exists.id ? { ...a, badge: 'verified', status: 'active' } : a
        );
      }
      const newAcc: AdminUserAccount = {
        id: targetReq.teacherId,
        name: targetReq.teacherName,
        phone: targetReq.phone,
        role: 'teacher',
        createdAt: targetReq.submittedAt.split(' ')[0],
        status: 'active',
        badge: 'verified',
        subject: targetReq.subject,
        grade: targetReq.stage,
        governorate: targetReq.governorate,
        area: targetReq.area,
        studentsCount: 0,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      };
      return [newAcc, ...prev];
    });
  };

  const handleRejectTeacherVerification = (requestId: string, reason: string) => {
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
  };

  // Safety Reports Handlers
  const handleSuspendTeacherFromReport = (teacherId: string, reportId: string) => {
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
  };

  const handleResolveSafetyReport = (reportId: string) => {
    setSafetyReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'resolved' } : r))
    );
  };

  const handleDismissSafetyReport = (reportId: string) => {
    setSafetyReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  // Commission Handler
  const handleMarkCommissionPaid = (id: string) => {
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
  };

  // If not logged in, render the secure Admin Login Page
  if (!isAuthenticated) {
    return (
      <AdminLoginPage
        onLoginSuccess={handleLoginSuccess}
        onBackToPublicSite={onSwitchToPublicApp}
      />
    );
  }

  const pendingVerificationsCount = verificationRequests.filter((v) => v.status === 'pending').length;
  const pendingReportsCount = safetyReports.filter((r) => r.status === 'new' || r.status === 'in_review').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row text-right font-['Tajawal',sans-serif] antialiased">
      
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
      />

      {/* 2. Main Content View Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
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
      </main>

    </div>
  );
};
