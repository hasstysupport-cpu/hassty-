import React from 'react';
import { Mail, MessageCircle, MapPin } from 'lucide-react';
import { BrandLogo } from './common/BrandLogo';

interface FooterProps { onNavigate: (path: string) => void; }

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer id="footer" className="bg-white border-t border-[#E5E7EB] text-[#1F2937] pt-14 pb-8 text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-[#E5E7EB]">
          <div className="lg:col-span-2">
            <div className="mb-4"><BrandLogo size="md" /></div>
            <p className="text-sm text-[#6B7280] leading-relaxed max-w-sm mb-6">المنصة الرائدة في مصر لربط الطلاب وأولياء الأمور بالمدرسين الخصوصيين، مع منظومة حضور ذكية تعتمد على QR وإشعارات الخدمة.</p>
            <div className="flex items-center gap-3 text-sm text-[#6B7280]"><div className="flex items-center gap-1.5 bg-[#F8FAFF] border border-[#E5E7EB] px-3 py-1.5 rounded-xl"><MapPin className="w-4 h-4 text-[#2563EB]" /><span className="text-xs font-semibold">مصر — جميع المحافظات</span></div></div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#1E3A8A] mb-4">المنصة</h4>
            <ul className="space-y-2.5 text-sm text-[#6B7280]">
              <li><button onClick={() => onNavigate('/')} className="hover:text-[#2563EB] transition-colors">الرئيسية</button></li>
              <li><button onClick={() => onNavigate('/search')} className="hover:text-[#2563EB] transition-colors">البحث عن مدرسين</button></li>
              <li><button onClick={() => onNavigate('/about')} className="hover:text-[#2563EB] transition-colors">عن المنصة</button></li>
              <li><button onClick={() => onNavigate('/for-teachers')} className="hover:text-[#2563EB] transition-colors">بوابة المعلمين</button></li>
              <li><button onClick={() => onNavigate('/contact')} className="hover:text-[#2563EB] transition-colors">الدعم والتواصل</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#1E3A8A] mb-4">للطلاب وأولياء الأمور</h4>
            <ul className="space-y-2.5 text-sm text-[#6B7280]">
              <li><button onClick={() => onNavigate('/search')} className="hover:text-[#2563EB] transition-colors">البحث بالمادة والمحافظة</button></li>
              <li><button onClick={() => onNavigate('/signup')} className="hover:text-[#2563EB] transition-colors">إنشاء حساب</button></li>
              <li><button onClick={() => onNavigate('/legal/privacy')} className="hover:text-[#2563EB] transition-colors">كيف نحمي بياناتك؟</button></li>
              <li><button onClick={() => onNavigate('/legal/rights')} className="hover:text-[#2563EB] transition-colors">حقوق البيانات وطلبات المحو</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#1E3A8A] mb-4">للمدرسين والتواصل</h4>
            <ul className="space-y-2.5 text-sm text-[#6B7280]">
              <li><button onClick={() => onNavigate('/for-teachers')} className="hover:text-[#2563EB] transition-colors">العمولات والمزايا</button></li>
              <li><button onClick={() => onNavigate('/legal/teacher')} className="hover:text-[#2563EB] transition-colors">لماذا نطلب مستندات التوثيق؟</button></li>
              <li className="flex items-center gap-2 pt-1 text-xs"><Mail className="w-3.5 h-3.5 text-[#2563EB]" /><span>hasstysupport@gmail.com</span></li>
              <li className="flex items-center gap-2 text-xs"><MessageCircle className="w-3.5 h-3.5 text-emerald-600" /><span>واتساب: 01012345678</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col gap-4 text-xs text-[#6B7280]">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <button onClick={() => onNavigate('/legal/terms')} className="hover:text-[#2563EB]">شروط الاستخدام</button>
            <span>•</span>
            <button onClick={() => onNavigate('/legal/privacy')} className="hover:text-[#2563EB]">سياسة الخصوصية</button>
            <span>•</span>
            <button onClick={() => onNavigate('/legal/acceptable')} className="hover:text-[#2563EB]">الاستخدام المقبول</button>
            <span>•</span>
            <button onClick={() => onNavigate('/legal/refund')} className="hover:text-[#2563EB]">الدفع والاسترداد</button>
            <span>•</span>
            <button onClick={() => onNavigate('/legal/cookies')} className="hover:text-[#2563EB]">ملفات الارتباط</button>
            <span>•</span>
            <button onClick={() => onNavigate('/legal/rights')} className="hover:text-[#2563EB]">حقوق البيانات</button>
          </div>
          <p className="text-center">© 2026 حِصّتي. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};
