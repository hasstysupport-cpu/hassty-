import React, { useState } from 'react';
import { QrCode, Menu, X, ArrowLeft, User, Search, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { AccountRole } from '../../types';

interface PublicNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenAuth?: (mode: 'login' | 'register', role?: AccountRole) => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  currentPath,
  onNavigate,
  onOpenAuth,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'الرئيسية', path: '/' },
    { name: 'نتائج البحث', path: '/search' },
    { name: 'عن المنصة', path: '/about' },
    { name: 'للمدرسين', path: '/for-teachers' },
    { name: 'تواصل معنا', path: '/contact' },
  ];

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
              <div className="w-11 h-11 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <QrCode className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black tracking-tight text-[#1E3A8A] font-['Tajawal',sans-serif]">
                    حِصّتي
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-[#EFF6FF] text-[#2563EB] border border-blue-200">
                    مِصر
                  </span>
                </div>
                <span className="text-xs text-[#6B7280] font-medium hidden sm:block">
                  منظومة الحصص الخصوصية والـ QR
                </span>
              </div>
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
            {/* Quick Portal Switch Dropdown for Demo */}
            <div className="relative group">
              <button
                className="px-3 py-2 text-xs font-bold text-[#1E3A8A] bg-[#F8FAFF] border border-[#E5E7EB] rounded-xl hover:border-blue-300 flex items-center gap-1.5 transition-all cursor-pointer"
                title="الانتقال المباشر للوحات التحكم التجريبية"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>لوحات التحكم</span>
              </button>
              <div className="absolute left-0 top-full pt-1 hidden group-hover:block z-50 min-w-[200px]">
                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg p-2 text-right space-y-1">
                  <div className="text-[11px] font-bold text-[#6B7280] px-2 py-1 border-b border-gray-100">
                    تصفح كـ :
                  </div>
                  <button
                    onClick={() => handleLinkClick('/student/dashboard')}
                    className="w-full text-right px-2.5 py-1.5 text-xs font-bold text-[#1F2937] hover:bg-[#EFF6FF] hover:text-[#2563EB] rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span>لوحة الطالب</span>
                    <span className="text-[10px] bg-blue-100 text-[#2563EB] px-1.5 py-0.5 rounded">زياد</span>
                  </button>
                  <button
                    onClick={() => handleLinkClick('/parent/dashboard')}
                    className="w-full text-right px-2.5 py-1.5 text-xs font-bold text-[#1F2937] hover:bg-[#EFF6FF] hover:text-[#2563EB] rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span>لوحة ولي الأمر</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">متابعة</span>
                  </button>
                  <button
                    onClick={() => handleLinkClick('/teacher/dashboard')}
                    className="w-full text-right px-2.5 py-1.5 text-xs font-bold text-[#1F2937] hover:bg-[#EFF6FF] hover:text-[#2563EB] rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span>لوحة المعلم</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">أ. حسام</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLinkClick('/login')}
              className="px-4 py-2.5 text-sm font-bold text-[#1E3A8A] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>

            <button
              onClick={() => handleLinkClick('/signup')}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold rounded-xl transition-all shadow-xs hover:shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>إنشاء حساب</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => handleLinkClick('/login')}
              className="p-2 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] rounded-xl border border-blue-200"
            >
              دخول
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl border border-[#E5E7EB] text-[#1F2937] hover:bg-gray-50 focus:outline-none cursor-pointer"
              aria-label="القائمة"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E5E7EB] px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleLinkClick(link.path)}
                  className={`w-full text-right px-4 py-3 rounded-xl text-base font-bold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#2563EB]'
                      : 'text-[#1F2937] hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-gray-100 space-y-2">
            <div className="text-xs font-bold text-[#6B7280] px-2 mb-1">لوحات التحكم السريعة:</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleLinkClick('/student/dashboard')}
                className="p-2 text-center text-xs font-bold bg-[#EFF6FF] text-[#2563EB] rounded-xl border border-blue-200"
              >
                الطالب
              </button>
              <button
                onClick={() => handleLinkClick('/parent/dashboard')}
                className="p-2 text-center text-xs font-bold bg-amber-50 text-amber-800 rounded-xl border border-amber-200"
              >
                ولي الأمر
              </button>
              <button
                onClick={() => handleLinkClick('/teacher/dashboard')}
                className="p-2 text-center text-xs font-bold bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200"
              >
                المعلم
              </button>
            </div>
          </div>

          <div className="pt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLinkClick('/login')}
              className="w-full py-2.5 text-center text-sm font-bold text-[#1E3A8A] bg-gray-50 border border-gray-200 rounded-xl cursor-pointer"
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => handleLinkClick('/signup')}
              className="w-full py-2.5 text-center text-sm font-bold text-white bg-[#2563EB] rounded-xl cursor-pointer"
            >
              إنشاء حساب
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
