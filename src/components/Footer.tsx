import React from 'react';
import { Mail, MessageCircle, MapPin, ShieldCheck, Heart } from 'lucide-react';
import { BrandLogo } from './common/BrandLogo';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer id="footer" className="bg-white border-t border-[#E5E7EB] text-[#1F2937] pt-14 pb-8 text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-[#E5E7EB]">
          
          {/* Brand Info & Tagline (Col 1-2) */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <BrandLogo size="md" />
            </div>

            <p className="text-sm text-[#6B7280] leading-relaxed max-w-sm mb-6">
              المنصة الرائدة في مصر لربط الطلاب وأولياء الأمور بأمهر المعلمين الخصوصيين، مع منظومة حضور ذكية تعتمد على كود الـ QR وإشعارات فورية لولي الأمر.
            </p>

            <div className="flex items-center gap-3 text-sm text-[#6B7280]">
              <div className="flex items-center gap-1.5 bg-[#F8FAFF] border border-[#E5E7EB] px-3 py-1.5 rounded-xl">
                <MapPin className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-semibold">مصر — جميع المحافظات الـ 27</span>
              </div>
            </div>
          </div>

          {/* Column 1: روابط رئيسية */}
          <div>
            <h4 className="text-sm font-bold text-[#1E3A8A] mb-4">
              المنصة
            </h4>
            <ul className="space-y-2.5 text-sm text-[#6B7280]">
              <li>
                <button onClick={() => onNavigate('/')} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                  الرئيسية
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/search')} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                  نتائج البحث عن مدرسين
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                  عن المنصة ورسالتنا
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/for-teachers')} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                  بوابة المعلمين ونسب العمولة
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                  تواصل معنا والدعم الفني
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: للطلاب وأولياء الأمور */}
          <div>
            <h4 className="text-sm font-bold text-[#1E3A8A] mb-4">
              للطلاب وأولياء الأمور
            </h4>
            <ul className="space-y-2.5 text-sm text-[#6B7280]">
              <li>
                <button
                  onClick={() => onNavigate('/search')}
                  className="hover:text-[#2563EB] transition-colors cursor-pointer"
                >
                  البحث بالمادة والمحافظة
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/student/qr-card')}
                  className="hover:text-[#2563EB] transition-colors cursor-pointer"
                >
                  كارنيه الطالب وكود QR
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/signup')}
                  className="hover:text-[#2563EB] transition-colors cursor-pointer"
                >
                  إنشاء حساب طالب جديد
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/parent/dashboard')}
                  className="hover:text-[#2563EB] transition-colors cursor-pointer"
                >
                  لوحة متابعة ولي الأمر
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: للمدرسين والدعم */}
          <div>
            <h4 className="text-sm font-bold text-[#1E3A8A] mb-4">
              للمدرسين والتواصل
            </h4>
            <ul className="space-y-2.5 text-sm text-[#6B7280]">
              <li>
                <button
                  onClick={() => onNavigate('/for-teachers')}
                  className="hover:text-[#2563EB] transition-colors cursor-pointer"
                >
                  جدول العمولات والمزايا
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/teacher/dashboard')}
                  className="hover:text-[#2563EB] transition-colors cursor-pointer"
                >
                  لوحة تحكم المعلم
                </button>
              </li>
              <li className="flex items-center gap-2 pt-1 text-xs text-[#6B7280]">
                <Mail className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                <span>hasstysupport@gmail.com</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-[#6B7280]">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>واتساب: 01012345678</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Terms */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
          <p>© 2026 حِصّتي. جميع الحقوق محفوظة لجمهورية مصر العربية.</p>
          
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('/about')} className="hover:text-[#2563EB] transition-colors cursor-pointer">الشروط والأحكام</button>
            <span>•</span>
            <button onClick={() => onNavigate('/about')} className="hover:text-[#2563EB] transition-colors cursor-pointer">سياسة الخصوصية</button>
            <span>•</span>
            <button onClick={() => onNavigate('/contact')} className="hover:text-[#2563EB] transition-colors cursor-pointer">الأسئلة الشائعة</button>
          </div>
        </div>

      </div>
    </footer>
  );
};
