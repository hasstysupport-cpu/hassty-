import React from 'react';
import { Home, Search, Headphones, QrCode, Compass } from 'lucide-react';
import { useSEO } from '../lib/useSEO';
import { BrandLogo } from '../components/common/BrandLogo';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
  /** public = صفحة كاملة (مسارات عامة غير معروفة) | dashboard = مدمجة داخل مساحة العمل */
  variant?: 'public' | 'dashboard';
  /** مسار لوحة التحكم للعودة إليه (وضع dashboard فقط) */
  dashboardPath?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate, variant = 'public', dashboardPath }) => {
  useSEO({
    title: '404 - الصفحة غير موجودة',
    description: 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها. عد للرئيسية أو تصفح المدرسين المعتمدين على منصة حصتي.',
    robots: 'noindex, follow',
    ogType: 'website',
  });

  const buttons = (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
      {variant === 'dashboard' ? (
        <button
          onClick={() => onNavigate(dashboardPath || '/student/dashboard')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-black text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-[0.97]"
        >
          <Home className="w-4 h-4" />
          العودة للوحة التحكم
        </button>
      ) : (
        <button
          onClick={() => onNavigate('/')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-black text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-[0.97]"
        >
          <Home className="w-4 h-4" />
          العودة للرئيسية
        </button>
      )}
      <button
        onClick={() => onNavigate('/search')}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-[#1E3A8A] bg-white border border-blue-200 hover:bg-blue-50 rounded-xl transition-all cursor-pointer active:scale-[0.97]"
      >
        <Search className="w-4 h-4" />
        تصفح المدرسين المعتمدين
      </button>
      <button
        onClick={() => onNavigate('/contact')}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all cursor-pointer active:scale-[0.97]"
      >
        <Headphones className="w-4 h-4" />
        تواصل مع الدعم
      </button>
    </div>
  );

  const illustration = (
    <div className="relative w-40 h-40 sm:w-44 sm:h-44 mx-auto" aria-hidden="true">
      {/* بطاقة QR "الضائعة" — هوية المنصة */}
      <div className="absolute inset-0 rounded-3xl bg-white border-2 border-dashed border-blue-200 shadow-xl shadow-blue-900/5 rotate-3 flex items-center justify-center">
        <div className="grid grid-cols-5 gap-1.5 opacity-90">
          {Array.from({ length: 25 }).map((_, i) => (
            <span
              key={i}
              className={`w-3.5 h-3.5 rounded-[4px] ${
                [0, 1, 2, 4, 5, 7, 9, 10, 12, 14, 16, 18, 20, 21, 22, 24, 8, 13].includes(i)
                  ? 'bg-gradient-to-br from-[#1E3A8A] to-[#2563EB]'
                  : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>
      {/* شارة بوصلة "المسار غير معروف" */}
      <div className="absolute -bottom-3 -left-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-violet-600/25 -rotate-6">
        <Compass className="w-6 h-6" />
      </div>
    </div>
  );

  if (variant === 'dashboard') {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center" dir="rtl">
        {illustration}
        <h2 className="mt-8 text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-l from-[#2563EB] to-[#7C3AED]">404</h2>
        <p className="mt-2 text-sm font-bold text-[#1E3A8A]">الصفحة غير موجودة</p>
        <p className="mt-1 text-xs text-slate-500">المسار الذي طلبته غير متاح في مساحة عملك.</p>
        <div className="mt-6">{buttons}</div>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-clip min-h-[70vh] flex items-center justify-center bg-hero-mesh py-16 px-4" dir="rtl">
      {/* خلفيات متدرجة زخرفية (مقصوصة داخل الجذر) */}
      <div className="absolute top-0 right-1/4 -translate-y-1/3 w-[500px] h-[400px] bg-gradient-to-br from-blue-400/15 via-indigo-300/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 -translate-x-1/4 w-[450px] h-[400px] bg-gradient-to-tr from-sky-400/15 via-blue-200/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" aria-hidden="true" />

      <div className="relative max-w-2xl w-full text-center">
        <div className="flex justify-center mb-8">
          <BrandLogo size="md" />
        </div>

        {illustration}

        <div className="mt-8 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-blue-300" aria-hidden="true" />
          <QrCode className="w-5 h-5 text-[#2563EB]" />
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-blue-300" aria-hidden="true" />
        </div>

        <h1 className="mt-4 text-5xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-l from-[#2563EB] via-[#4F46E5] to-[#7C3AED] select-none">
          ٤٠٤
        </h1>
        <h2 className="mt-3 text-xl sm:text-2xl font-black text-[#1E3A8A]">الصفحة غير موجودة</h2>
        <p className="mt-3 text-sm sm:text-[15px] text-gray-600 leading-7 max-w-md mx-auto">
          يبدو أنك وصلت لمسار غير موجود أو تم نقله. لا تقلق — كود الـ QR بتاعك لسه شغال،
          اختر من هنا وكمّل رحلتك مع حِصّتي:
        </p>

        <div className="mt-8">{buttons}</div>

        <p className="mt-8 text-[11px] text-gray-400">
          إذا وصلت لهذه الصفحة من رابط داخل المنصة، بلّغ الدعم الفني حتى نصلحه في أسرع وقت.
        </p>
      </div>
    </div>
  );
};
