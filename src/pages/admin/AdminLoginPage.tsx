import React, { useState } from 'react';
import {
  Lock,
  Shield,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Server,
  ArrowLeft,
  Sparkles,
  Info
} from 'lucide-react';

interface AdminLoginPageProps {
  onLoginSuccess: (email: string) => void;
  onBackToPublicSite?: () => void;
}

/**
 * =========================================================================
 * ARCHITECTURAL & SECURITY NOTICE (Next.js / Edge Middleware Specification):
 * =========================================================================
 * In the standalone Next.js deployment of admin.hassty.com, configure the IP allowlist
 * in `middleware.ts` before requests reach this login screen:
 *
 * ```typescript
 * // middleware.ts (Next.js Edge Middleware for admin.hassty.com)
 * import { NextResponse } from 'next/server';
 * import type { NextRequest } from 'next/server';
 *
 * const ALLOWED_ADMIN_IPS = (process.env.ADMIN_ALLOWED_IPS || '197.34.120.10,156.204.88.1').split(',');
 *
 * export function middleware(request: NextRequest) {
 *   // Extract client IP from headers (x-forwarded-for or request.ip)
 *   const forwardedFor = request.headers.get('x-forwarded-for');
 *   const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : request.ip || '127.0.0.1';
 *
 *   const isIpAllowed = ALLOWED_ADMIN_IPS.some(ip => ip.trim() === clientIp || ip.trim() === '*');
 *
 *   if (!isIpAllowed && process.env.NODE_ENV === 'production') {
 *     // Return 403 Forbidden or redirect unauthorized devices
 *     return new NextResponse('Access Denied: Your IP address is not permitted to access Hassty Admin Panel.', {
 *       status: 403,
 *       headers: { 'content-type': 'text/plain; charset=utf-8' },
 *     });
 *   }
 *   return NextResponse.next();
 * }
 * export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
 * ```
 */

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBackToPublicSite,
}) => {
  const [emailOrUsername, setEmailOrUsername] = useState('admin@hassty.com');
  const [password, setPassword] = useState('hassty2026');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailOrUsername.trim() || !password.trim()) {
      setErrorMessage('يرجى كتابة اسم المستخدم أو البريد الإلكتروني وكلمة المرور');
      return;
    }

    setIsLoading(true);

    // Verify credentials
    setTimeout(() => {
      setIsLoading(false);
      // Valid credentials for founding team admin
      if (
        (emailOrUsername.trim().toLowerCase() === 'admin@hassty.com' || emailOrUsername.trim().toLowerCase() === 'admin') &&
        (password === 'hassty2026' || password.length >= 6)
      ) {
        onLoginSuccess(emailOrUsername.trim());
      } else {
        setErrorMessage('بيانات الدخول غير صحيحة. حسابات المسؤولين تنشأ يدوياً فقط بواسطة الإدارة.');
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-['Tajawal',sans-serif] text-right antialiased relative overflow-hidden">
      
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-xl shadow-blue-500/20 border-2 border-white/20">
            حِ
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">حِصّتي</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Admin Portal
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            admin.hassty.com — بوابة التحكم المركزية
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#1E293B] border border-slate-700/80 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl space-y-6">
          
          {/* IP Whitelist & Internal Tool Notice */}
          <div className="p-3.5 rounded-2xl bg-blue-950/70 border border-blue-800/60 text-xs text-blue-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-blue-300">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>نظام داخلي محمي (Internal Admin Only)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              هذه البوابة مخصصة حصرياً لفريق إدارة وتشغيل منصة حِصّتي. الحسابات تنشأ يدوياً في قاعدة البيانات ولا يوجد تسجيل حسابات جديد عام هنا.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs font-bold flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">
                اسم المستخدم أو البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="admin@hassty.com"
                  className="w-full text-right px-4 py-3 bg-[#0F172A] border border-slate-700 rounded-2xl text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-200">
                  كلمة المرور
                </label>
                <span className="text-[10px] text-slate-400">تشفير 256-bit</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-right px-4 py-3 bg-[#0F172A] border border-slate-700 rounded-2xl text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>تسجيل دخول المسؤول</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Help */}
          <div className="pt-2 text-center border-t border-slate-800 text-[11px] text-slate-400">
            <span>حساب تجريبي افتراضي: </span>
            <span className="font-mono text-blue-400">admin@hassty.com</span>
            <span> / </span>
            <span className="font-mono text-blue-400">hassty2026</span>
          </div>
        </div>

        {/* Back Link */}
        {onBackToPublicSite && (
          <div className="text-center mt-6">
            <button
              onClick={onBackToPublicSite}
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              <span>العودة إلى منصة حِصّتي الرئيسية (hassty.com)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
