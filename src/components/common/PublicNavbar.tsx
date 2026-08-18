import React, { useState } from 'react';
import { Menu, X, ArrowLeft, User, Search, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { AccountRole } from '../../types';
import { BrandLogo } from './BrandLogo';

interface PublicNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenAuth?: (mode: 'login' | 'register', role?: AccountRole) => void;
  onOpenLogin?: () => void;
  onOpenSignup?: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  currentPath,
  onNavigate,
  onOpenAuth,
  onOpenLogin,
  onOpenSignup,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleLoginClick = () => {
    if (onOpenLogin) {
      onOpenLogin();
    } else if (onOpenAuth) {
      onOpenAuth('login');
    } else {
      onNavigate('/login');
    }
  };

  const handleSignupClick = () => {
    if (onOpenSignup) {
      onOpenSignup();
    } else if (onOpenAuth) {
      onOpenAuth('register');
    } else {
      onNavigate('/signup');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Right: Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLinkClick('/')}
              className="flex items-center gap-3 group text-right cursor-pointer"
            >
              <BrandLogo size="md" />
            </button>
          </div>

          {/* Center: Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
              return (
                <button
                  key={link.path}
                  onClick={() => handleLinkClick(link.path)}
                  className={`px-3.5 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'text-[#2563EB] bg-[#EFF6FF]'
                      : 'text-[#1F2937] hover:text-[#2563EB] hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </button>
              );
            })}
          </nav>

          {/* Left: Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Login Button */}
            <button
              onClick={handleLoginClick}
              className="px-4 py-2.5 text-xs font-bold text-[#1E3A8A] hover:text-[#2563EB] hover:bg-gray-50 border border-[#E5E7EB] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>تسجيل الدخول</span>
            </button>

            {/* Register / CTA Button */}
            <button
              onClick={handleSignupClick}
              className="px-4 py-2.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>إنشاء حساب جديد</span>
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="القائمة"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E5E7EB] px-4 pt-3 pb-6 space-y-4 animate-drawer text-right">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
              return (
                <button
                  key={link.path}
                  onClick={() => handleLinkClick(link.path)}
                  className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'text-[#2563EB] bg-[#EFF6FF]'
                      : 'text-[#1F2937] hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleLoginClick}
                className="w-full py-2.5 text-center text-xs font-bold text-[#1E3A8A] border border-[#E5E7EB] rounded-xl cursor-pointer"
              >
                تسجيل الدخول
              </button>
              <button
                onClick={handleSignupClick}
                className="w-full py-2.5 text-center text-xs font-bold text-white bg-[#2563EB] rounded-xl cursor-pointer"
              >
                إنشاء حساب
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
