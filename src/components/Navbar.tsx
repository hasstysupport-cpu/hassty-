import React, { useState } from 'react';
import { Menu, X, QrCode, User, ShieldCheck } from 'lucide-react';
import { AccountRole } from '../types';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'register', role?: AccountRole) => void;
  onOpenTutorSearch: () => void;
  onOpenQRSimulator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenTutorSearch,
  onOpenQRSimulator,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'الرئيسية', href: '#hero' },
    { label: 'عن المنصة', href: '#problem-solution' },
    { label: 'كيف تعمل', href: '#how-it-works' },
    { label: 'المدرسين', href: '#subjects' },
    { label: 'أنواع الحسابات', href: '#account-types' },
    { label: 'تواصل معنا', href: '#footer' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo (Right side in RTL) */}
          <a href="#hero" className="flex items-center gap-3 group focus:outline-none" id="nav-logo">
            <div className="w-11 h-11 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-sm group-hover:bg-[#1D4ED8] transition-colors">
              <QrCode className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-2xl font-black tracking-tight text-[#1E3A8A] flex items-center gap-1.5">
                حِصّتي
                <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
              </span>
              <span className="text-[11px] font-medium text-[#6B7280] -mt-1">
                منصة المدرسين وحضور الـ QR
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links (Center) */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-base font-medium text-[#1F2937] hover:text-[#2563EB] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Left Action Buttons (Desktop & Mobile) */}
          <div className="flex items-center gap-3">
            {/* Quick QR demo button */}
            <button
              onClick={onOpenQRSimulator}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              title="معاينة بطاقة QR للطالب والحضور"
              id="nav-qr-demo-btn"
            >
              <QrCode className="w-4 h-4 stroke-[2]" />
              <span>بطاقة QR للتجربة</span>
            </button>

            {/* Login Button (Outline) */}
            <button
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 text-sm font-semibold text-[#1E3A8A] border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer"
              id="nav-login-btn"
            >
              تسجيل الدخول
            </button>

            {/* Register Button (Filled Primary Blue) */}
            <button
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
              id="nav-register-btn"
            >
              <User className="w-4 h-4 stroke-[2]" />
              <span>إنشاء حساب</span>
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:text-[#2563EB] hover:bg-gray-100 focus:outline-none"
              aria-label="القائمة الرئيسية"
              id="nav-mobile-toggle"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white space-y-3">
            <div className="flex flex-col space-y-2 px-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 text-base font-medium text-[#1F2937] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-lg transition-colors text-right"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 px-2 space-y-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenQRSimulator();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-[#2563EB] bg-[#EFF6FF] border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                id="mobile-nav-qr-demo-btn"
              >
                <QrCode className="w-4 h-4" />
                <span>تجربة مسح كود الـ QR للحضور</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenTutorSearch();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-[#1E3A8A] bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                id="mobile-nav-browse-tutors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>تصفح المدرسين المعتمدين</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
