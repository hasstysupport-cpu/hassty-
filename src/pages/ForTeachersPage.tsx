import React from 'react';
import {
  TrendingDown,
  Sparkles,
  ShieldCheck,
  QrCode,
  Users,
  CheckCircle2,
  ArrowLeft,
  DollarSign,
  Calendar,
  Layers,
  Award,
  Zap,
  Smartphone
} from 'lucide-react';
import { COMMISSION_TIERS } from '../data/mockData';
import { Badge } from '../components/common/Badge';

interface ForTeachersPageProps {
  onNavigate: (path: string) => void;
}

export const ForTeachersPage: React.FC<ForTeachersPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#F8FAFF] min-h-screen pb-16 text-right">
      
      {/* 1. Hero Section for Teachers */}
      <section className="bg-white border-b border-[#E5E7EB] py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-[#10B981] text-xs font-bold border border-emerald-200 mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>بوابة المعلمين المحترفين في مصر</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#1E3A8A] leading-tight mb-5 max-w-3xl mx-auto">
            نظم حصصك، وثّق الحضور بالـ QR، ووفّر مجهودك الإداري
          </h1>

          <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed mb-8">
            منظومة متكاملة بدون اشتراك شهري ثابت. نوفر لك ماسح حضور بكاميرا هاتفك، صفحة بروفايل عام لاستقبال الطلاب، وعمولة تنازلية تنخفض كلما زاد عدد طلابك.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('/signup')}
              className="px-8 py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-xs hover:shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>سجل كمدرس الآن مجاناً</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('/teacher/dashboard')}
              className="px-6 py-3.5 bg-gray-50 hover:bg-gray-100 text-[#1E3A8A] font-bold text-sm rounded-xl border border-[#E5E7EB] transition-all cursor-pointer"
            >
              معاينة لوحة تحكم المعلم
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        
        {/* 2. Zero Monthly Fee Banner */}
        <div className="bg-[#1E3A8A] text-white rounded-3xl p-8 sm:p-10 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-right">
            <span className="text-xs font-bold bg-[#2563EB] px-3 py-1 rounded-full text-white">
              بدون أي مخاطرة مالية
            </span>
            <h3 className="text-2xl sm:text-3xl font-black">
              0 جنيه اشتراك شهري — لا ندفعك إلا عند النجاح
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              لا توجد رسوم خفية أو باقات شهرية مقيدة. استخدم النظام مجاناً وادفع فقط نسبة عمولة بسيطة تتناقص تلقائياً مع زيادة عدد طلابك.
            </p>
          </div>

          <div className="bg-white/10 border border-white/20 p-6 rounded-2xl text-center shrink-0 w-full md:w-auto">
            <span className="text-xs text-blue-200 block">أدنى نسبة عمولة في مصر</span>
            <span className="text-4xl font-black text-emerald-400 font-mono">0.5%</span>
            <span className="text-xs text-white/80 block mt-1">لكبار المعلمين والسناتر</span>
          </div>
        </div>

        {/* 3. Tiered Commission Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-10 shadow-xs">
          
          <div className="text-center max-w-2xl mx-auto mb-8">
            <Badge variant="success">نظام العمولة التنازلي العادل</Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E3A8A] mt-2 mb-2">
              جدول شرائح العمولة التنازلية
            </h2>
            <div className="p-2.5 bg-[#EFF6FF] border border-blue-200 rounded-xl text-xs font-bold text-[#2563EB] max-w-md mx-auto">
              💡 قاعدة المنصة الذهبية: «كل ما تكبر ويزيد عدد طلابك، بناخد نسبة أقل منك»
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50 text-xs font-bold text-[#1E3A8A]">
                  <th className="py-3.5 px-4 rounded-r-xl">الشريحة</th>
                  <th className="py-3.5 px-4">نطاق عدد الطلاب الفعّالين</th>
                  <th className="py-3.5 px-4">نسبة العمولة</th>
                  <th className="py-3.5 px-4">مثال تقديري للرسوم</th>
                  <th className="py-3.5 px-4 rounded-l-xl">المزايا المرافقة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-[#1F2937]">
                {COMMISSION_TIERS.map((tier, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-[#F8FAFF] transition-colors ${
                      idx === 4 || idx === 5 ? 'bg-emerald-50/40 font-bold' : ''
                    }`}
                  >
                    <td className="py-4 px-4 font-bold text-[#1E3A8A]">
                      الشريحة {idx + 1}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold">
                      {tier.range} طالب
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 bg-[#EFF6FF] text-[#2563EB] px-2.5 py-1 rounded-lg font-mono font-black border border-blue-200">
                        {tier.rate}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#6B7280]">
                      {tier.example}
                    </td>
                    <td className="py-4 px-4 text-[#10B981] font-bold flex items-center gap-1.5 pt-4">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>{tier.benefit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* 4. Teacher Features Grid */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="navy">أدوات ذكية للمعلم المصري</Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E3A8A] mt-2 mb-3">
              كل ما تحتاجه لإدارة حصصك في مكان واحد
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280]">
              صُممت المنصة بعد استشارات مع مئات المعلمين في مختلف المحافظات
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1E3A8A]">ماسح الـ QR السريع</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                افتح كاميرا الهاتف وامسح كارنيهات الطلاب عند الدخول، يسجل الحضور فوراً ويرسل إشعار لولي الأمر بدون أي دفاتر ورقية.
              </p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1E3A8A]">إدارة السناتر والمجموعات</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                قسم طلابك في مجموعات وفق السنتر أو اليوم أو المرحلة الدراسية، مع إحصائيات دقيقة لنسب الغياب والالتزام.
              </p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1E3A8A]">بروفايل معتمد لجلب طلاب جدد</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                صفحة رسمية برابط خاص بك تبرز تقييماتك الحقيقية وخبراتك، تتيح للطلاب وأولياء الأمور في منطقتك حجز مقاعد معك بسهولة.
              </p>
            </div>

          </div>
        </div>

        {/* 5. Teacher Testimonial */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 sm:p-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
              alt="أستاذ حسام إبراهيم"
              className="w-20 h-20 rounded-2xl object-cover border border-[#E5E7EB] shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-2 text-center md:text-right flex-1">
              <p className="text-sm sm:text-base text-[#1E3A8A] font-bold italic leading-relaxed">
                "قبل حصتي، كنت أضيع نصف ساعة في أخذ الغياب الورقي لكل مجموعة في السنتر وخناقات مع أولياء الأمور عن حضور أولادهم. مع الـ QR، المسألة انتهت تماماً في 3 ثواني وكل ولي أمر يصله إشعار لحظي!"
              </p>
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-[#6B7280]">
                <strong className="text-[#1F2937]">أ. حسام إبراهيم</strong>
                <span>— خبير الكيمياء للثانوية العامة (310 طالب)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. CTA Footer */}
        <div className="bg-[#EFF6FF] border border-blue-200 rounded-3xl p-8 sm:p-10 text-center space-y-4">
          <h3 className="text-2xl font-black text-[#1E3A8A]">
            جاهز لتطوير أسلوب إدارتك لحصصك؟
          </h3>
          <p className="text-xs sm:text-sm text-[#4B5563] max-w-md mx-auto">
            انضم الآن لمئات المعلمين المتميزين في مصر، التسجيل مجاني ولا يستغرق سوى دقيقتين.
          </p>
          <button
            onClick={() => onNavigate('/signup')}
            className="px-8 py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 mx-auto cursor-pointer"
          >
            <span>ابدأ التسجيل كمعلم الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
