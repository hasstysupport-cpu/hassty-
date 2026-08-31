import React from 'react';
import { GraduationCap, ShieldAlert, Presentation, BriefcaseBusiness, Check, ArrowLeft, MessageSquare, Award } from 'lucide-react';
import { AccountRole } from '../types';

interface AccountTypesSectionProps { onSelectRole: (role: AccountRole) => void; }

const cards: Array<{
  role: AccountRole;
  id: string;
  label: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  button: string;
}> = [
  { role:'student', id:'student', label:'الطلاب', title:'حساب الطالب', description:'بطاقة حضورك الذكية ومواعيدك بين إيديك في مكان واحد بدون فوضى الأوراق.', icon:GraduationCap, features:['كود QR خاص للحضور (كارنيه رقمي)','الانضمام للمدرسين بمسح الكود أو المعرف','جدول الحصص الأسبوعي والتنبيه بالمواعيد','حجز إلكتروني مباشر للحصص والمراجعات'], button:'إنشاء حساب طالب' },
  { role:'parent', id:'parent', label:'أولياء الأمور', title:'حساب ولي الأمر', description:'راحة بال تامة ومتابعة فورية لجميع حصص ومصروفات أبنائك مع إشعارات واتساب لحظية.', icon:ShieldAlert, features:['متابعة حضور وغياب لحظية لجميع الأبناء','إشعارات واتساب فورية عند كل مسح حضور','تتبع المدفوعات والمصروفات بدقة وشفافية','ربط آمن بكود الابن (حسابين كحد أقصى لكل طالب)'], button:'إنشاء حساب ولي أمر' },
  { role:'teacher', id:'teacher', label:'المعلمين', title:'حساب المدرس', description:'لوحة تحكم ذكية لإدارة مجموعاتك وطلابك وتوثيق الحضور والمدفوعات آلياً.', icon:Presentation, features:['لوحة تحكم كاملة لإدارة المجموعات والغياب','ظهور فوري في نتائج بحث الطلاب بالمحافظة','نظام حجز إلكتروني وإدارة السعة الاستيعابية','تقييمات حقيقية موثقة تعزز سمعتك المهنية'], button:'انضم كمعلم معتمد' },
  { role:'assistant', id:'assistant', label:'المساعدين', title:'حساب المساعد', description:'مساحة عمل مخصصة لمساعدة المدرس في إدارة المجموعات والطلاب والحضور وفق صلاحيات معتمدة.', icon:BriefcaseBusiness, features:['إدارة المجموعات والطلاب المرتبطين بالمدرس','تسجيل الحضور والانصراف ومتابعة السجلات','الوصول للمصروفات والدعوات حسب الصلاحيات','حساب مستقل مع مراجعة وتوثيق من الإدارة'], button:'انضم كمساعد مدرس' },
];

export const AccountTypesSection: React.FC<AccountTypesSectionProps> = ({ onSelectRole }) => (
  <section id="account-types" className="py-16 lg:py-24 bg-[#F8FAFF] border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-block px-3 py-1 bg-[#EFF6FF] text-[#2563EB] text-xs font-bold rounded-full mb-3">منظومة متكاملة لجميع الأطراف</div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F2937] tracking-tight mb-4">لكل واحد <span className="text-[#2563EB]">حسابه المناسب</span></h2>
        <p className="text-base text-[#6B7280]">الطالب وولي الأمر والمدرس والمساعد، كل واحد له تجربة واضحة وصلاحيات مناسبة لدوره على حِصّتي.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 items-stretch">
        {cards.map(({ role, id, label, title, description, icon: Icon, features, button }) => {
          const featured = role === 'parent';
          const assistant = role === 'assistant';
          return (
            <div key={role} id={`account-card-${id}`} className={`${featured ? 'bg-[#2563EB] text-white border-2 border-blue-400 lg:-translate-y-2 shadow-md' : assistant ? 'bg-white border-2 border-indigo-200 shadow-md' : 'bg-white border border-gray-200'} rounded-2xl p-5 sm:p-6 flex flex-col justify-between text-right hover:-translate-y-1 hover:shadow-md transition-all duration-200`}>
              {featured && <div className="mb-3 self-start bg-amber-400 text-[#1E3A8A] text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1"><Award className="w-3 h-3" /> الأكثر طلباً للأمان والمتابعة</div>}
              {assistant && <div className="mb-3 self-start bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full">مخصص لفريق المدرس</div>}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${featured ? 'bg-white/20 text-white' : assistant ? 'bg-indigo-50 text-indigo-600' : 'bg-[#EFF6FF] text-[#2563EB]'}`}><Icon className="w-6 h-6 stroke-[2]" /></div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${featured ? 'text-blue-100 bg-white/10 border border-white/20' : assistant ? 'text-indigo-700 bg-indigo-50 border border-indigo-100' : 'text-[#6B7280] bg-gray-100'}`}>{label}</span>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${featured ? 'text-white' : 'text-[#1F2937]'}`}>{title}</h3>
                <p className={`text-xs sm:text-sm mb-6 leading-relaxed ${featured ? 'text-blue-100' : 'text-[#6B7280]'}`}>{description}</p>
                <ul className="space-y-3 mb-8">
                  {features.map((feature) => <li key={feature} className={`flex items-start gap-2.5 text-sm ${featured ? 'text-white' : 'text-[#1F2937]'}`}><span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${featured ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#2563EB]'}`}><Check className="w-3.5 h-3.5 stroke-[2.5]" /></span><span>{feature}</span></li>)}
                </ul>
              </div>
              <button onClick={() => onSelectRole(role)} className={`w-full py-2.5 px-4 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${featured ? 'bg-white hover:bg-blue-50 text-[#2563EB]' : assistant ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'bg-gray-50 hover:bg-[#EFF6FF] text-[#2563EB] border border-gray-200 hover:border-blue-200'}`} id={`btn-register-${id}-role`}><span>{button}</span><ArrowLeft className="w-4 h-4 stroke-[2]" /></button>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);
