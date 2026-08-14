import React from 'react';
import { GraduationCap, ShieldAlert, Presentation, Check, ArrowLeft, QrCode, MessageSquare, Award } from 'lucide-react';
import { AccountRole } from '../types';

interface AccountTypesSectionProps {
  onSelectRole: (role: AccountRole) => void;
}

export const AccountTypesSection: React.FC<AccountTypesSectionProps> = ({ onSelectRole }) => {
  return (
    <section id="account-types" className="py-16 lg:py-24 bg-[#F8FAFF] border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-block px-3 py-1 bg-[#EFF6FF] text-[#2563EB] text-xs font-bold rounded-full mb-3">
            منظومة متكاملة لجميع الأطراف
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F2937] tracking-tight mb-4">
            لكل واحد <span className="text-[#2563EB]">حسابه المناسب</span>
          </h2>
          <p className="text-base text-[#6B7280]">
            صممنا ثلاث تجارب مخصصة لتلبية احتياجات الطالب، ولي الأمر، والمعلم بدقة وسلاسة فائقة.
          </p>
        </div>

        {/* 3 Cards Side-by-Side (Desktop) / Stacked (Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {/* Card 1: حساب الطالب */}
          <div
            className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-blue-300 transition-all text-right shadow-2xs"
            id="account-card-student"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-xs font-bold text-[#6B7280] bg-gray-100 px-2.5 py-1 rounded-full">
                  الطلاب
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#1F2937] mb-2">حساب الطالب</h3>
              <p className="text-xs sm:text-sm text-[#6B7280] mb-6 leading-relaxed">
                بطاقة حضورك الذكية ومواعيدك بين إيديك في مكان واحد بدون فوضى الأوراق.
              </p>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2.5 text-sm text-[#1F2937]">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span>كود QR خاص للحضور (كارنيه رقمي)</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-[#1F2937]">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span>الانضمام للمدرسين بمسح الكود أو المعرف</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-[#1F2937]">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span>جدول الحصص الأسبوعي والتنبيه بالمواعيد</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-[#1F2937]">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span>حجز إلكتروني مباشر للحصص والمراجعات</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectRole('student')}
              className="w-full py-2.5 px-4 bg-gray-50 hover:bg-[#EFF6FF] text-[#2563EB] font-bold text-sm border border-gray-200 hover:border-blue-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              id="btn-register-student-role"
            >
              <span>إنشاء حساب طالب</span>
              <ArrowLeft className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          {/* Card 2: حساب ولي الأمر (FEATURED with Solid Blue Background) */}
          <div
            className="bg-[#2563EB] text-white rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative transform lg:-translate-y-2 border-2 border-blue-400 text-right shadow-md"
            id="account-card-parent"
          >
            {/* Top Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-[#1E3A8A] text-xs font-extrabold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>الأكثر طلباً للأمان والمتابعة</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-5 mt-1">
                <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs">
                  <ShieldAlert className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-xs font-bold text-blue-100 bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
                  أولياء الأمور
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">حساب ولي الأمر</h3>
              <p className="text-xs sm:text-sm text-blue-100 mb-6 leading-relaxed">
                راحة بال تامة ومتابعة فورية لجميع حصص ومصروفات أبنائك مع إشعارات واتساب لحظية.
              </p>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2.5 text-sm text-white">
                  <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span>متابعة حضور وغياب لحظية لجميع الأبناء</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white">
                  <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span>إشعارات واتساب فورية عند كل مسح حضور</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white">
                  <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span>تتبع المدفوعات والمصروفات بدقة وشفافية</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-white">
                  <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span>ربط آمن بكود الابن (حسابين كحد أقصى لكل طالب)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectRole('parent')}
              className="w-full py-2.5 px-4 bg-white hover:bg-blue-50 text-[#2563EB] font-black text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.99]"
              id="btn-register-parent-role"
            >
              <span>إنشاء حساب ولي أمر</span>
              <ArrowLeft className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          {/* Card 3: حساب المدرس */}
          <div
            className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-blue-300 transition-all text-right shadow-2xs"
            id="account-card-teacher"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                  <Presentation className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-xs font-bold text-[#6B7280] bg-gray-100 px-2.5 py-1 rounded-full">
                  المعلمين
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#1F2937] mb-2">حساب المدرس</h3>
              <p className="text-xs sm:text-sm text-[#6B7280] mb-6 leading-relaxed">
                لوحة تحكم ذكية لإدارة مجموعاتك وطلابك وتوثيق الحضور والمدفوعات آلياً.
              </p>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2.5 text-sm text-[#1F2937]">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span>لوحة تحكم كاملة لإدارة المجموعات والغياب</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-[#1F2937]">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span>ظهور فوري في نتائج بحث الطلاب بالمحافظة</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-[#1F2937]">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span>نظام حجز إلكتروني وإدارة السعة الاستيعابية</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-[#1F2937]">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span>تقييمات حقيقية موثقة تعزز سمعتك المهنية</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectRole('teacher')}
              className="w-full py-2.5 px-4 bg-gray-50 hover:bg-[#EFF6FF] text-[#2563EB] font-bold text-sm border border-gray-200 hover:border-blue-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              id="btn-register-teacher-role"
            >
              <span>انضم كمعلم معتمد</span>
              <ArrowLeft className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
