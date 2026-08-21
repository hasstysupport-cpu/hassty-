import { verifyAdminCredentialsSecurely, HASSTY_DOMAINS, TEMP_ADMIN_CREDENTIALS } from '../../lib/securityConfig';
import React, { useState } from 'react';
import {
  Lock,
  Shield,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';

interface AdminLoginPageProps {
  onLoginSuccess: (email: string) => void;
  onBackToPublicSite?: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBackToPublicSite,
}) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleFillDemoCredentials = () => {
    setEmailOrUsername(TEMP_ADMIN_CREDENTIALS.username);
    setPassword(TEMP_ADMIN_CREDENTIALS.password);
    setErrorMessage('');
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailOrUsername.trim() || !password.trim()) {
      setErrorMessage('يرجى كتابة اسم المستخدم أو البريد الإلكتروني وكلمة المرور');
      return;
    }

    setIsLoading(true);

    try {
      // Secure cryptographically hashed verification without exposing secrets
      const verification = await verifyAdminCredentialsSecurely(emailOrUsername, password);
      setIsLoading(false);

      if (verification.success) {
        onLoginSuccess(emailOrUsername.trim());
      } else {
        setErrorMessage(verification.error || 'بيانات الدخول غير صحيحة.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('حدث خطأ في معالجة طلب الدخول الآمن، يرجى المحاولة لاحقاً');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-['Tajawal',sans-serif] text-right antialiased relative overflow-hidden select-none">
      
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-xl shadow-blue-500/20 border-2 border-white/20">
            حِ
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">حِصّتي</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
              لوحة التحكم المركزية
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {HASSTY_DOMAINS.PUBLIC_URL}/admin — Admin Portal
          </p>
        </div>

        {/* Temporary Credentials Notice Box */}
        <div className="mb-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-blue-950/50 border border-blue-500/30 rounded-2xl p-4 text-xs space-y-3 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-300 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>بيانات الدخول المؤقتة للوحة الأدمن</span>
            </div>
            <button
              type="button"
              onClick={handleFillDemoCredentials}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>ملء تلقائي</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div
              onClick={() => copyToClipboard(TEMP_ADMIN_CREDENTIALS.username, 'user')}
              className="bg-slate-900/80 border border-slate-700/60 p-2.5 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-500 transition-colors"
            >
              <div>
                <span className="text-slate-400 block text-[10px]">اليوزر:</span>
                <strong className="text-white font-mono">{TEMP_ADMIN_CREDENTIALS.username}</strong>
              </div>
              {copiedField === 'user' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              )}
            </div>

            <div
              onClick={() => copyToClipboard(TEMP_ADMIN_CREDENTIALS.password, 'pass')}
              className="bg-slate-900/80 border border-slate-700/60 p-2.5 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-500 transition-colors"
            >
              <div>
                <span className="text-slate-400 block text-[10px]">الباسوورد:</span>
                <strong className="text-emerald-400 font-mono">{TEMP_ADMIN_CREDENTIALS.password}</strong>
              </div>
              {copiedField === 'pass' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              )}
            </div>
          </div>
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
              هذه البوابة مخصصة حصرياً لفريق إدارة وتشغيل منصة حِصّتي للتحكم في الحسابات وتوثيق المدرسين.
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
                  placeholder="admin أو admin@hassty.com"
                  autoComplete="username"
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
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>تشفير SHA-256</span>
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full text-right px-4 py-3 pl-11 bg-[#0F172A] border border-slate-700 rounded-2xl text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                  title={showPassword ? 'إخفاء' : 'إظهار'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 mt-2"
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

          {/* Security Banner */}
          <div className="pt-2 text-center border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>نظام محمي برقم البصمة والتشفير ضد هجمات القوة الغاشمة</span>
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
              <span>العودة إلى منصة حِصّتي الرئيسية (hassty.vercel.app)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

