import React from 'react';
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
  Lock
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
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingVerificationsCount,
  pendingReportsCount,
  adminEmail,
  onLogout,
  onSwitchToPublicApp,
}) => {
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

  return (
    <aside className="w-full lg:w-72 bg-[#1E3A8A] text-white flex flex-col shrink-0 border-l border-blue-900 shadow-xl min-h-screen">
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
      </div>

      {/* 2. Navigation Menu */}
      <nav className="p-4 space-y-1.5 flex-1">
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
  );
};
