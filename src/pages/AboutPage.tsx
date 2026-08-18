import React from 'react';
import { useSEO } from '../lib/useSEO';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Users,
  Target,
  Sparkles,
  Award,
  Lock,
  ArrowLeft,
  Mail,
  MessageCircle,
  BookOpen
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  useSEO({
    title: 'عن منصة حصتي - الرؤية والرسومة التعليمية في مصر',
    description: 'تعرف على قصة منصة حصتي، المنظومة المصرية المبتكرة لربط الطلاب والمدرسين الخصوصيين بنظام الحضور الذكي بالـ QR كود وتقارير المتابعة الفورية لأولياء الأمور.',
    canonicalPath: '/about',
    keywords: 'عن حصتي, رؤية منصة حصتي, فريق حصتي التعليمية, نظام حضور الطلاب, التعليم في مصر',
  });

  return (
    <div className="bg-[#F8FAFF] min-h-screen pb-16 text-right">
      
      {/* 1. Hero / Mission Header */}
      <section className="bg-white border-b border-[#E5E7EB] py-14 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-bold border border-blue-200 mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>رسالتنا وأهدافنا في التعليم الخصوصي</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#1E3A8A] leading-tight mb-5 max-w-3xl mx-auto">
            نبني منظومة تعليمية خصوصية ذكية وموثوقة لكل بيت مصري
          </h1>

          <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
            انطلقت منصة <strong className="text-[#2563EB]">حِصّتي</strong> لحل الفوضى اليومية في الدروس الخصوصية في مصر، من خلال ربط المدرسين المتميزين بأولياء الأمور والطلاب بنظام حضور وتوثيق إلكتروني فوري عبر كود الـ QR.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        
        {/* 2. Platform Story / Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#1E3A8A]">الرؤية والهدف</h3>
            <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
              تحويل منظومة الحصص التقليدية إلى بيئة رقمية منظمة ومريحة تضمن راحة بال ولي الأمر، وتمنح الطالب تجربة سلسة، وتقلل الأعباء الإدارية عن المعلم.
            </p>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#1E3A8A]">الابتكار بالـ QR</h3>
            <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
              استبدال الدفاتر الورقية وكشوفات الغياب بكود رقمي مشفر يمسحه المعلم في ثوانٍ، لتوثيق حضور الطالب بالدقيقة وإرسال إشعار فوري لولي أمره.
            </p>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#1E3A8A]">الشفافية والأمان</h3>
            <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
              جميع التقييمات على المنصة حقيقية 100% ومكتوبة فقط من طلاب حضروا الحصص فعلياً، مع فحص هويات المعلمين والمؤهلات الأكاديمية بدقة.
            </p>
          </div>
        </div>

        {/* 3. The 3 Account Types In-Depth */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="navy">منظومة ثلاثية الأطراف</Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E3A8A] mt-2 mb-3">
              حسابات مصممة خصيصاً لكل طرف في العملية التعليمية
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280]">
              شاشات وأدوات متوافقة تماماً مع احتياجات كل مستخدم
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Student Account Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1E3A8A]">حساب الطالب</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                بطاقة رقمية تحتوي على كود QR فريد، جدول مواعيد منظم، وتنبيهات بمواعيد ومواقع الحصص في السناتر أو أونلاين.
              </p>
              <ul className="space-y-2 text-xs text-[#1F2937] pt-2 border-t border-gray-100">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> بطاقة QR قابلة للطباعة والحفظ</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> حجز مباشر في مجموعات أفضل المعلمين</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> سجل حضور ومدفوعات شفاف</li>
              </ul>
              <button
                onClick={() => onNavigate('/signup')}
                className="w-full py-2.5 bg-gray-50 hover:bg-[#EFF6FF] text-[#2563EB] text-xs font-bold rounded-xl border border-blue-200 transition-colors cursor-pointer"
              >
                تسجيل كطالب
              </button>
            </div>

            {/* Parent Account Card */}
            <div className="bg-[#1E3A8A] text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-md relative">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">حساب ولي الأمر</h3>
                <span className="text-[10px] font-bold bg-[#2563EB] text-white px-2 py-0.5 rounded-full">راحة البال</span>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                لوحة تحكم مركزية تتيح متابعة أكثر من ابن، واستقبال إشعارات واتساب فورية لحظة دخول الحصة وتسجيل الحضور.
              </p>
              <ul className="space-y-2 text-xs text-blue-50 pt-2 border-t border-white/10">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> إشعارات واتساب فورية للحضور والغياب</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> متابعة جميع الأبناء في شاشة واحدة</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> تتبع المدفوعات والاشتراكات الشهرية</li>
              </ul>
              <button
                onClick={() => onNavigate('/signup')}
                className="w-full py-2.5 bg-white hover:bg-blue-50 text-[#1E3A8A] text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                تسجيل كولي أمر
              </button>
            </div>

            {/* Teacher Account Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1E3A8A]">حساب المدرس</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                أداة إدارة شاملة للمجموعات، ماسح حضور سريع بكاميرا الهاتف، عمولة تنازلية عادلة تبدأ من 5% وتصل إلى 0.5% فقط.
              </p>
              <ul className="space-y-2 text-xs text-[#1F2937] pt-2 border-t border-gray-100">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> ماسح QR سريع بديل للدفاتر اليدوية</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> بدون أي اشتراك شهري ثابت</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> صفحة بروفايل عام موثقة لاستقبال الحجوزات</li>
              </ul>
              <button
                onClick={() => onNavigate('/for-teachers')}
                className="w-full py-2.5 bg-gray-50 hover:bg-emerald-50 text-[#10B981] text-xs font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
              >
                بوابة المعلمين
              </button>
            </div>

          </div>
        </div>

        {/* 4. Trust & Safety Section */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 sm:p-12">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-8">
            <Badge variant="success">معايير الأمان والمصداقية</Badge>
            <h3 className="text-2xl font-black text-[#1E3A8A]">
              كيف نضمن سلامة ومصداقية التجربة التعليمية؟
            </h3>
            <p className="text-xs sm:text-sm text-[#6B7280]">
              نطبق إجراءات صارمة للتحقق من هوية كل مدرس ومراجعة كل تقييم
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-5 bg-[#F8FAFF] border border-[#E5E7EB] rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E3A8A] mb-1">التحقق من بطاقة الرقم القومي</h4>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  يخضع كل مدرس لعملية مطابقة هوية دقيقة والتأكد من المؤهل الجامعي والخبرة التربوية قبل اعتماد ملفه.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-[#F8FAFF] border border-[#E5E7EB] rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#10B981] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E3A8A]">حظر التقييمات الوهمية</h4>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  لا يُسمح بكتابة التقييمات إلا للطلاب الذين سجلوا الحضور عبر الـ QR وحضروا بالفعل حصتين على الأقل.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-[#F8FAFF] border border-[#E5E7EB] rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E3A8A]">حماية وتشفير البيانات</h4>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  أرقام هواتف الطلاب وأولياء الأمور وسجلات الدفع محمية وفق أحدث معايير الأمان والخصوصية.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-[#F8FAFF] border border-[#E5E7EB] rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E3A8A]">دعم فني ومتابعة مستمرة</h4>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  فريق دعم مخصص للرد الفوري على استفسارات أولياء الأمور والمعلمين عبر تطبيق واتساب طوال أيام الأسبوع.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Team / Contact CTA */}
        <div className="bg-[#EFF6FF] border border-blue-200 rounded-3xl p-8 sm:p-10 text-center space-y-4">
          <h3 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            هل لديك أي استفسار أو ترغب في التعاون معنا؟
          </h3>
          <p className="text-xs sm:text-sm text-[#4B5563] max-w-xl mx-auto">
            فريق عمل حصتي متواجد دائماً لمساعدتك في بدء تجربتك أو الانضمام كمعلم معتمد.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('/contact')}
              className="px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>تواصل مع فريق الدعم</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('/search')}
              className="px-6 py-3 bg-white hover:bg-gray-50 text-[#1E3A8A] font-bold text-xs sm:text-sm rounded-xl border border-[#E5E7EB] transition-all cursor-pointer"
            >
              تصفح المعلمين المتاحين
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
