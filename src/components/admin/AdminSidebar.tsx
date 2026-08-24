import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  AlertOctagon,
  BarChart3,
  Percent,
  LogOut,
  Shield,
  ExternalLink,
  ChevronLeft,
  Server,
  Lock,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

export type AdminTab = 
  | 'dashboard' 
  | 'accounts' 
  | 'verification' 
  | 'reports' 
  | 'analytics' 
  | 'commissions';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingVerificationsCount: number;
  pendingReportsCount: number;
  adminEmail: string;
  onLogout: () => void;
  onSwitchToPublicApp?: () => void;
  dbConnectionStatus?: 'connected' | 'connecting' | 'failed';
  onRetryDbConnection?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingVerificationsCount,
  pendingReportsCount,
  adminEmail,
  onLogout,
  onSwitchToPublicApp,
  dbConnectionStatus = 'connected',
  onRetryDbConnection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      id: 'dashboard' as AdminTab,
      label: 'نظرة عامة',
      subtitle: 'الرئيسية والإحصائيات الحية',
      icon: LayoutDashboard,
    },
    {
      id: 'accounts' as AdminTab,
      label: 'إدارة الحسابات',
      subtitle: 'الطلاب والمدرسين وأولياء الأمور',
      icon: Users,
    },
    {
      id: 'verification' as AdminTab,
      label: 'طلبات توثيق المدرسين',
      subtitle: 'مراجعة الهويات والاعتماد',
      icon: ShieldCheck,
      badgeCount: pendingVerificationsCount,
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      id: 'reports' as AdminTab,
      label: 'البلاغات والشكاوى',
      subtitle: 'متابعة أمان المنصة',
      icon: AlertOctagon,
      badgeCount: pendingReportsCount,
      badgeColor: 'bg-red-600 text-white animate-pulse',
    },
    {
      id: 'analytics' as AdminTab,
      label: 'إحصائيات الموقع',
      subtitle: 'نمو المستخدمين والمحافظات',
      icon: BarChart3,
    },
    {
      id: 'commissions' as AdminTab,
      label: 'متابعة العمولات',
      subtitle: 'الشرائح والتحصيلات الشهرية',
      icon: Percent,
    },
  ];

  const totalNotifications = pendingVerificationsCount + pendingReportsCount;
  const currentTabObj = menuItems.find((m) => m.id === currentTab) || menuItems[0];
  const CurrentIcon = currentTabObj.icon;

  const handleSelect = (tab: AdminTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* =========================================================================
          1. MOBILE TOP APP BAR (Visible on < lg screens only)
         ========================================================================= */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#1E3A8A] text-white border-b border-blue-900 shadow-md">
        <div className="px-4 py-3 flex items-center justify-between">
          
          {/* Brand & Active Tab */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
              حِ
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-white">حِصّتي</span>
                <span className="text-[9px] font-bold uppercase bg-blue-500/40 text-blue-200 px-1.5 py-0.2 rounded border border-blue-400/30">
                  Admin
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-0.5" title="قاعدة البيانات متصلة" />
              </div>
              <div className="flex items-center gap-1 text-[11px] text-blue-200 font-bold">
                <CurrentIcon className="w-3 h-3 text-blue-300" />
                <span>{currentTabObj.label}</span>
              </div>
            </div>
          </div>

          {/* Toggle Menu Button */}
          <div className="flex items-center gap-2">
            {totalNotifications > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white shadow-xs animate-pulse">
                {totalNotifications} جديد
              </span>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-blue-800/80 hover:bg-blue-700 text-white flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer border border-blue-600/50"
              aria-label="قائمة الأقسام الإدارية"
            >
              {mobileMenuOpen ? (
                <>
                  <X className="w-4 h-4 text-red-300" />
                  <span>إغلاق</span>
                </>
              ) : (
                <>
                  <Menu className="w-4 h-4 text-blue-200" />
                  <span>الأقسام</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu / Drawer overlay */}
        {mobileMenuOpen && (
          <div className="bg-[#172554] border-t border-blue-800/80 px-4 py-4 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            
            {/* Status indicators */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-800 flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <Database className="w-3 h-3 text-emerald-400" />
                <span className="truncate">Firestore: {dbConnectionStatus === 'connected' ? 'متصل' : 'جار الاتصال'}</span>
              </div>
              <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-800 flex items-center gap-1.5 text-blue-300 font-mono">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span className="truncate">IP: محمي</span>
              </div>
            </div>

            {/* Navigation items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full text-right p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer text-xs ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-blue-100 hover:bg-blue-800/60 bg-blue-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-blue-800 text-blue-200'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold">{item.label}</span>
                    </div>

                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${item.badgeColor}`}>
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Footer with quick buttons */}
            <div className="pt-3 border-t border-blue-800/80 flex items-center justify-between gap-2">
              <div className="text-[11px] text-blue-300 font-mono truncate max-w-[150px]">
                {adminEmail}
              </div>
              <div className="flex items-center gap-2">
                {onSwitchToPublicApp && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSwitchToPublicApp();
                    }}
                    className="py-1.5 px-3 bg-blue-900/80 hover:bg-blue-800 text-blue-100 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>الموقع الرئيسي</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>خروج</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </header>

      {/* =========================================================================
          2. DESKTOP PERSISTENT SIDEBAR (Visible on lg: screens and up)
         ========================================================================= */}
      <aside className="hidden lg:flex w-72 bg-[#1E3A8A] text-white flex-col shrink-0 border-l border-blue-900 shadow-xl min-h-screen sticky top-0 self-start">
        {/* 1. Header & Brand */}
        <div className="p-6 border-b border-blue-800/80">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black text-lg shadow-md ring-2 ring-white/20">
              حِ
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-white">حِصّتي</span>
                <span className="text-[10px] font-bold uppercase bg-blue-500/40 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">
                  Admin Panel
                </span>
              </div>
              <p className="text-[11px] text-blue-200 font-medium">
                لوحة الإدارة المركزية (admin.hassty.com)
              </p>
            </div>
          </div>

          {/* Security & IP Environment Indicator */}
          <div className="mt-3 p-2.5 rounded-xl bg-blue-950/60 border border-blue-700/50 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Lock className="w-3.5 h-3.5" />
              <span>IP Allowlist: محمي</span>
            </div>
            <span className="text-[10px] text-blue-300 font-mono">197.34.120.*</span>
          </div>

          {/* Database Connection Live Status Indicator */}
          <div className={`mt-2 p-2.5 rounded-xl border flex items-center justify-between text-[11px] transition-all ${
            dbConnectionStatus === 'connected'
              ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
              : dbConnectionStatus === 'connecting'
              ? 'bg-amber-950/40 border-amber-700/60 text-amber-300'
              : 'bg-red-950/60 border-red-700/70 text-red-200'
          }`}>
            <div className="flex items-center gap-1.5 font-bold">
              {dbConnectionStatus === 'connected' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>قاعدة البيانات: متصل (Live)</span>
                </>
              ) : dbConnectionStatus === 'connecting' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>جاري الاتصال بقاعدة البيانات...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
                  <span>فشل الاتصال بقاعدة البيانات</span>
                </>
              )}
            </div>

            {dbConnectionStatus === 'failed' && onRetryDbConnection && (
              <button
                onClick={onRetryDbConnection}
                className="px-2 py-0.5 bg-red-800/80 hover:bg-red-700 text-white rounded text-[10px] font-black transition-colors cursor-pointer"
              >
                إعادة الاتصال
              </button>
            )}
          </div>
        </div>

        {/* 2. Navigation Menu */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-black uppercase text-blue-300 tracking-wider">
            أقسام الإدارة
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full text-right p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/40 translate-x-1'
                    : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-900/60 text-blue-200'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{item.label}</p>
                    <p className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-blue-300'}`}>
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 3. Footer / Admin Info */}
        <div className="p-4 border-t border-blue-800/80 bg-blue-950/40 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
              <Shield className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-white truncate">فريق التأسيس (Admin)</p>
              <p className="text-[10px] text-blue-300 font-mono truncate">{adminEmail}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {onSwitchToPublicApp && (
              <button
                onClick={onSwitchToPublicApp}
                className="py-2 px-2.5 bg-blue-900/80 hover:bg-blue-800 text-blue-100 hover:text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="زيارة منصة الطلاب والمدرسين"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>الموقع الرئيسي</span>
              </button>
            )}

            <button
              onClick={onLogout}
              className="py-2 px-2.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
