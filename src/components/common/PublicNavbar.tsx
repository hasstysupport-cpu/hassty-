import React, { useState } from 'react';
import { Menu, X, LogIn, UserPlus, LayoutDashboard, LogOut, UsersRound } from 'lucide-react';
import { AccountRole } from '../../types';
import { BrandLogo } from './BrandLogo';
import { getCleanAvatarUrl } from '../../lib/avatarHelper';

interface PublicNavbarProps {
  currentPath: string;
  isLoggedIn?: boolean;
  user?: any;
  currentRole?: AccountRole;
  onNavigate: (path: string) => void;
  onOpenAuth?: (mode: 'login' | 'register', role?: AccountRole) => void;
  onOpenLogin?: () => void;
  onOpenSignup?: () => void;
  onLogout?: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ currentPath, isLoggedIn = false, user, currentRole = 'student', onNavigate, onOpenAuth, onOpenLogin, onOpenSignup, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getDashboardPath = () => {
    if (currentRole === 'teacher') return '/teacher/dashboard';
    if (currentRole === 'parent') return '/parent/dashboard';
    if (currentRole === 'assistant') return '/assistant/dashboard';
    return '/student/dashboard';
  };

  const getRoleTitle = () => {
    if (currentRole === 'teacher') return 'لوحة المعلم';
    if (currentRole === 'parent') return 'لوحة ولي الأمر';
    if (currentRole === 'assistant') return 'لوحة المساعد';
    return 'لوحة الطالب';
  };

  const userName = user?.name || 'حسابي';
  const userAvatar = getCleanAvatarUrl(user?.avatarUrl || user?.profileData?.avatarUrl, currentRole, userName);
  const navLinks = [
    { name: 'الرئيسية', path: '/' },
    { name: 'المدرسين والسناتر', path: '/search' },
    { name: 'عن المنصة', path: '/about' },
    { name: 'للمدرسين والعمولة', path: '/for-teachers' },
    { name: 'تواصل معنا', path: '/contact' },
  ];

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleLoginClick = () => onOpenLogin ? onOpenLogin() : onOpenAuth ? onOpenAuth('login') : onNavigate('/login');
  const handleSignupClick = () => onOpenSignup ? onOpenSignup() : onOpenAuth ? onOpenAuth('register') : onNavigate('/signup');
  const handleAssistantSignupClick = () => handleLinkClick('/assistant/signup');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <button onClick={() => handleLinkClick('/')} className="flex items-center gap-3 group text-right cursor-pointer"><BrandLogo size="md" /></button>

          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
              return <button key={link.path} onClick={() => handleLinkClick(link.path)} className={`px-3.5 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${isActive ? 'text-[#2563EB] bg-[#EFF6FF]' : 'text-[#1F2937] hover:text-[#2563EB] hover:bg-gray-50'}`}>{link.name}</button>;
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <button onClick={() => handleLinkClick(getDashboardPath())} className="px-4 py-2.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"><LayoutDashboard className="w-4 h-4" /><span>الذهاب إلى {getRoleTitle()}</span></button>
                <div onClick={() => handleLinkClick(getDashboardPath())} className="flex items-center gap-2 p-1.5 pr-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition-colors"><img src={userAvatar} alt={userName} className="w-7 h-7 rounded-lg object-cover border border-gray-200" referrerPolicy="no-referrer"/><span className="text-xs font-bold text-gray-800 max-w-[100px] truncate">{userName}</span></div>
                {onLogout && <button onClick={onLogout} title="تسجيل الخروج" className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-200"><LogOut className="w-4 h-4" /></button>}
              </div>
            ) : (
              <>
                <button onClick={handleAssistantSignupClick} className="px-3.5 py-2.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"><UsersRound className="w-3.5 h-3.5" /><span>انضم كمساعد</span></button>
                <button onClick={handleLoginClick} className="px-4 py-2.5 text-xs font-bold text-[#1E3A8A] hover:text-[#2563EB] hover:bg-gray-50 border border-[#E5E7EB] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"><LogIn className="w-3.5 h-3.5" /><span>تسجيل الدخول</span></button>
                <button onClick={handleSignupClick} className="px-4 py-2.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"><UserPlus className="w-3.5 h-3.5" /><span>إنشاء حساب جديد</span></button>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            {isLoggedIn && <button onClick={() => handleLinkClick(getDashboardPath())} className="p-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 flex items-center gap-1 text-xs font-bold"><img src={userAvatar} alt={userName} className="w-6 h-6 rounded-lg object-cover" referrerPolicy="no-referrer"/><span className="truncate max-w-[80px]">{userName}</span></button>}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors" aria-label="القائمة">{isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E5E7EB] px-4 pt-3 pb-6 space-y-4 animate-drawer text-right">
          {isLoggedIn && <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between"><div className="flex items-center gap-2.5"><img src={userAvatar} alt={userName} className="w-9 h-9 rounded-xl object-cover border border-blue-200" referrerPolicy="no-referrer"/><div className="flex flex-col"><span className="text-xs font-bold text-gray-900">{userName}</span><span className="text-[10px] font-semibold text-blue-600">{getRoleTitle()}</span></div></div><button onClick={() => handleLinkClick(getDashboardPath())} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs">لوحة التحكم</button></div>}
          <nav className="space-y-1">{navLinks.map((link) => { const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path)); return <button key={link.path} onClick={() => handleLinkClick(link.path)} className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-[#2563EB] bg-[#EFF6FF]' : 'text-[#1F2937] hover:bg-gray-50'}`}>{link.name}</button>; })}</nav>
          <div className="pt-3 border-t border-gray-100">
            {isLoggedIn ? <div className="space-y-2"><button onClick={() => handleLinkClick(getDashboardPath())} className="w-full py-3 text-center text-xs font-black text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl cursor-pointer flex items-center justify-center gap-2"><LayoutDashboard className="w-4 h-4" />الذهاب إلى لوحة التحكم</button>{onLogout && <button onClick={() => { setIsMobileMenuOpen(false); onLogout(); }} className="w-full py-2.5 text-center text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"><LogOut className="w-3.5 h-3.5" />تسجيل الخروج</button>}</div> : <div className="space-y-2"><button onClick={handleAssistantSignupClick} className="w-full py-2.5 text-center text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"><UsersRound className="w-3.5 h-3.5" />انضم كمساعد مدرس</button><div className="grid grid-cols-2 gap-2"><button onClick={handleLoginClick} className="w-full py-2.5 text-center text-xs font-bold text-[#1E3A8A] border border-[#E5E7EB] rounded-xl cursor-pointer">تسجيل الدخول</button><button onClick={handleSignupClick} className="w-full py-2.5 text-center text-xs font-bold text-white bg-[#2563EB] rounded-xl cursor-pointer">إنشاء حساب</button></div></div>}
          </div>
        </div>
      )}
    </header>
  );
};
