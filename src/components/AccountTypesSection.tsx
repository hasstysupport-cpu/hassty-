import React from 'react';
import { GraduationCap, ShieldAlert, Presentation, BriefcaseBusiness, Check, ArrowLeft, Award } from 'lucide-react';
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
  { role:'parent', id:'parent', label:'أولياء الأمور', title:'حساب ولي الأمر', description:'راحة بال تامة ومتابعة فورية لجميع حصص ومصروفات أبنائك مع إشعارات لحظية.', icon:ShieldAlert, features:['متابعة حضور وغياب لحظية لجميع الأبناء','إشعارات فورية عند كل مسح حضور','تتبع المدفوعات والمصروفات بدقة وشفافية','ربط آمن بكود الابن (حسابين كحد أقصى لكل طالب)'], button:'إنشاء حساب ولي أمر' },
  { role:'teacher', id:'teacher', label:'المعلمين', title:'حساب المدرس', description:'لوحة تحكم ذكية لإدارة مجموعاتك وطلابك وتوثيق الحضور والمدفوعات آلياً.', icon:Presentation, features:['لوحة تحكم كاملة لإدارة المجموعات والغياب','ظهور فوري في نتائج بحث الطلاب بالمحافظة','نظام حجز إلكتروني وإدارة السعة الاستيعابية','تقييمات حقيقية موثقة تعزز سمعتك المهنية'], button:'انضم كمعلم معتمد' },
  { role:'assistant', id:'assistant', label:'المساعدين', title:'حساب المساعد', description:'مساحة عمل مخصصة لمساعدة المدرس في إدارة المجموعات والطلاب والحضور وفق صلاحيات معتمدة.', icon:BriefcaseBusiness, features:['إدارة المجموعات والطلاب المرتبطين بالمدرس','تسجيل الحضور والانصراف ومتابعة السجلات','الوصول للمصروفات والدعوات حسب الصلاحيات','حساب مستقل مع مراجعة وتوثيق من الإدارة'], button:'انضم كمساعد مدرس' },
];

export const AccountTypesSection: React.FC<AccountTypesSectionProps> = ({ onSelectRole }) => (
  <section id="account-types" className="py-16 lg:py-24 bg-[#F8FAFF] border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="hs-sec-head text-center max-w-3xl mx-auto mb-14 anim-up">
        <div className="hs-sec-badge mb-3">منظومة متكاملة لجميع الأطراف</div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1F2937] tracking-tight mb-4">لكل واحد <span className="hs-grad">حسابه المناسب</span></h2>
        <p className="text-base text-[#6B7280]">الطالب وولي الأمر والمدرس والمساعد، كل واحد له تجربة واضحة وصلاحيات مناسبة لدوره على حِصّتي.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 items-stretch">
        {cards.map(({ role, id, label, title, description, icon: Icon, features, button }, i) => {
          const featured = role === 'parent';
          return (
            <div
              key={role}
              id={`account-card-${id}`}
              className={`hs-role-card hs-role-${role} bg-white rounded-3xl p-5 sm:p-6 flex flex-col justify-between text-right anim-up ${featured ? 'border-2 border-amber-200 shadow-xl shadow-amber-500/10' : 'border border-slate-200 shadow-lg shadow-slate-900/5'}`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="hs-role-glow" aria-hidden="true" />
              {featured && <div className="mb-3 self-start bg-gradient-to-l from-amber-400 to-orange-400 text-[#1E3A8A] text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 z-10"><Award className="w-3 h-3" /> الأكثر طلبًا للأمان والمتابعة</div>}
              {id === 'assistant' && <div className="mb-3 self-start bg-sky-50 text-sky-700 text-[10px] font-black px-2.5 py-1 rounded-full z-10">مخصص لفريق المدرس</div>}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="hs-role-icon w-12 h-12 rounded-2xl flex items-center justify-center"><Icon className="w-6 h-6 stroke-[2]" /></div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${featured ? 'text-amber-700 bg-amber-50 border border-amber-200' : id === 'assistant' ? 'text-sky-700 bg-sky-50 border border-sky-100' : 'text-[#6B7280] bg-slate-100'}`}>{label}</span>
                </div>
                <h3 className="text-xl font-black mb-2 text-[#1F2937]">{title}</h3>
                <p className="text-xs sm:text-sm mb-6 leading-relaxed text-[#6B7280]">{description}</p>
                <ul className="space-y-3 mb-8">
                  {features.map((feature) => <li key={feature} className="flex items-start gap-2.5 text-sm text-[#1F2937]"><span className="hs-role-tick w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3.5 h-3.5 stroke-[2.5]" /></span><span>{feature}</span></li>)}
                </ul>
              </div>
              <button onClick={() => onSelectRole(role)} className="hs-role-cta relative z-10 w-full py-3 px-4 font-black text-sm rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer" id={`btn-register-${id}-role`}><span>{button}</span><ArrowLeft className="w-4 h-4 stroke-[2]" /></button>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);
