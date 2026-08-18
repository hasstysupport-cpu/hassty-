import React, { useState } from 'react';
import { Bell, ChevronDown, User, Settings, LogOut, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { AccountRole } from '../../types';
import { BrandLogo } from './BrandLogo';

interface LoggedInNavbarProps {
  currentPath: string;
  currentRole?: AccountRole;
  role?: AccountRole;
  pageTitle?: string;
  userName?: string;
  userAvatar?: string;
  onNavigate: (path: string) => void;
  onRoleChange?: (newRole: AccountRole) => void;
  onLogout?: () => void;
}

export const LoggedInNavbar: React.FC<LoggedInNavbarProps> = ({
  currentPath,
  currentRole,
  role: propRole,
  pageTitle: propPageTitle,
  userName: propUserName,
  userAvatar: propUserAvatar,
  onNavigate,
  onRoleChange,
  onLogout,
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const role: AccountRole = propRole || currentRole || 'student';

  const roleLabels: Record<AccountRole, { title: string; badgeClass: string; defaultPath: string; defaultName: string; defaultAvatar: string }> = {
    student: {
      title: 'حساب طالب',
      badgeClass: 'bg-[#EFF6FF] text-[#2563EB] border-blue-200',
      defaultPath: '/student/dashboard',
      defaultName: 'زياد أحمد (3 ثانوي)',
      defaultAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    },
    parent: {
      title: 'حساب ولي أمر',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      defaultPath: '/parent/dashboard',
      defaultName: 'أحمد عبد الله',
      defaultAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    teacher: {
      title: 'حساب مدرس',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      defaultPath: '/teacher/dashboard',
      defaultName: 'أ. حسام إبراهيم',
      defaultAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
  };

  const currentRoleMeta = roleLabels[role] || roleLabels.student;
  const userName = propUserName || currentRoleMeta.defaultName;
  const userAvatar = propUserAvatar || currentRoleMeta.defaultAvatar;

  // Derive dynamic page title if not provided
  const getDynamicTitle = () => {
    if (propPageTitle) return propPageTitle;
    if (currentPath === '/student/dashboard') return 'لوحة تحكم الطالب';
    if (currentPath === '/student/qr-card') return 'كارنيه الـ QR الرقمي';
    if (currentPath === '/student/tutors') return 'مدرسيني المسجلين';
    if (currentPath === '/student/book') return 'حجز حصة جديدة';
    if (currentPath === '/student/payments') return 'المدفوعات والإيصالات';

    if (currentPath === '/parent/dashboard') return 'لوحة متابعة ولي الأمر';
    if (currentPath === '/parent/attendance') return 'سجل الحضور اللحظي';
    if (currentPath === '/parent/payments') return 'المدفوعات والمصروفات';
    if (currentPath === '/parent/settings') return 'إعدادات الإشعارات والواتساب';

    if (currentPath === '/teacher/dashboard') return 'لوحة تحكم المعلم';
    if (currentPath === '/teacher/students') return 'دليل الطلاب والاشتراكات';
    if (currentPath === '/teacher/groups') return 'إدارة المجموعات والسناتر';
    if (currentPath === '/teacher/scan') return 'ماسح حضور الـ QR';
    if (currentPath === '/teacher/payments') return 'الأرباح والعمولة';
    if (currentPath === '/teacher/availability') return 'إدارة المواعيد المتاحة';
    if (currentPath === '/teacher/profile') return 'تعديل البروفايل العام';
    if (currentPath === '/teacher/reviews') return 'تقييمات وآراء الطلاب';

    return 'لوحة التحكم';
  };

  const pageTitle = getDynamicTitle();

  const handleSwitchRole = (newRole: AccountRole) => {
    if (onRoleChange) {
      onRoleChange(newRole);
    } else {
      if (newRole === 'student') onNavigate('/student/dashboard');
      if (newRole === 'parent') onNavigate('/parent/dashboard');
      if (newRole === 'teacher') onNavigate('/teacher/dashboard');
    }
  };

  const notifications = [
    {
      id: '1',
      title: 'تم تسجيل حضور الكيمياء بنجاح ✓',
      time: 'منذ 15 دقيقة',
      desc: 'تم مسح كود QR في سنتر الأهرام الساعة 04:32 م',
      unread: true,
    },
    {
      id: '2',
      title: 'تذكير بموعد حصة الرياضيات',
      time: 'اليوم الساعة 06:00 م',
      desc: 'حصة التفاضل والتكامل مع م. أحمد عصام',
      unread: true,
    },
    {
      id: '3',
      title: 'إيصال دفع إلكتروني جديد',
      time: 'أمس',
      desc: 'تم إصدار إيصال سداد شهر أغسطس برقم INV-2026-8801',
      unread: false,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Right: Logo & Page Title */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center group cursor-pointer text-right"
              title="العودة للصفحة الرئيسية"
            >
              <BrandLogo size="sm" showSubtitle={false} />
            </button>

            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
                <span>{pageTitle}</span>
              </h1>
            </div>
          </div>

          {/* Left: Role switcher, Notifications & Profile dropdown */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Quick Role Switcher for preview ease */}
            <div className="hidden md:flex items-center bg-gray-50 border border-[#E5E7EB] rounded-xl p-1 gap-1 text-xs font-bold">
              <button
                onClick={() => handleSwitchRole('student')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  role === 'student' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-gray-600 hover:text-[#2563EB]'
                }`}
              >
                طالب
              </button>
              <button
                onClick={() => handleSwitchRole('parent')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  role === 'parent' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-gray-600 hover:text-[#1E3A8A]'
                }`}
              >
                ولي أمر
              </button>
              <button
                onClick={() => handleSwitchRole('teacher')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  role === 'teacher' ? 'bg-[#10B981] text-white shadow-xs' : 'text-gray-600 hover:text-[#10B981]'
                }`}
              >
                مدرس
              </button>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsUserMenuOpen(false);
                }}
                className="relative p-2.5 rounded-xl border border-[#E5E7EB] text-gray-600 hover:text-[#2563EB] hover:bg-gray-50 transition-colors cursor-pointer"
                aria-label="الإشعارات"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#EF4444] rounded-full ring-2 ring-white" />
              </button>

              {isNotificationsOpen && (
                <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-4 z-50 text-right">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-[#1E3A8A]">الإشعارات والتنبيهات</h3>
                    <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
                      2 جديدة
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto my-2">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2.5 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer ${
                          item.unread ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-[#1F2937]">{item.title}</h4>
                          <span className="text-[10px] text-gray-400 shrink-0">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-[#6B7280] mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-gray-100 text-center">
                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
                    >
                      تحديد الكل كمقروء
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-[#E5E7EB] hover:border-blue-300 transition-all cursor-pointer"
              >
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-lg object-cover border border-gray-200"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-[#1F2937] leading-tight truncate max-w-[120px]">
                    {userName}
                  </span>
                  <span className="text-[10px] text-[#2563EB] font-semibold">
                    {currentRoleMeta.title}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-2 z-50 text-right">
                  <div className="p-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-[#1F2937] truncate">{userName}</p>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 border ${currentRoleMeta.badgeClass}`}>
                      {currentRoleMeta.title}
                    </span>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        onNavigate(currentRoleMeta.defaultPath);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-right px-3 py-2 text-xs font-bold text-gray-700 hover:bg-[#EFF6FF] hover:text-[#2563EB] rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      <span>الملف الشخصي</span>
                    </button>
                    {role === 'parent' && (
                      <button
                        onClick={() => {
                          onNavigate('/parent/settings');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-right px-3 py-2 text-xs font-bold text-gray-700 hover:bg-[#EFF6FF] hover:text-[#2563EB] rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-gray-400" />
                        <span>إعدادات الإشعارات</span>
                      </button>
                    )}
                    {role === 'teacher' && (
                      <button
                        onClick={() => {
                          onNavigate('/teacher/profile');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-right px-3 py-2 text-xs font-bold text-gray-700 hover:bg-[#EFF6FF] hover:text-[#2563EB] rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-gray-400" />
                        <span>تعديل البروفايل العام</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (onLogout) {
                          onLogout();
                        } else {
                          onNavigate('/');
                        }
                      }}
                      className="w-full text-right px-3 py-2 text-xs font-bold text-[#EF4444] hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-[#EF4444]" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

