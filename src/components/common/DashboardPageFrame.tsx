import React from 'react';
import { ArrowRight, BellRing, Calendar, ChevronLeft, Home, Plus, RefreshCw, Search, Settings2 } from 'lucide-react';
import { AccountRole } from '../../types';

interface DashboardPageFrameProps {
  role: AccountRole;
  path: string;
  title: string;
  description?: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
  action?: { label: string; path: string; icon?: React.ComponentType<{className?: string}> };
}

const roleLabel = (role: AccountRole) => role === 'teacher' ? 'مساحة المدرس' : role === 'assistant' ? 'مساحة المساعد' : role === 'parent' ? 'مساحة ولي الأمر' : 'مساحة الطالب';

const pageTitle = (path: string, role: AccountRole) => {
  const labels: Record<string,string> = {
    '/teacher/dashboard':'لوحة التحكم', '/teacher/students':'الطلاب', '/teacher/groups':'المجموعات', '/teacher/assistants':'المساعدون',
    '/teacher/exams':'الامتحانات والتوزيع', '/teacher/attendance':'إدارة الحضور', '/teacher/scan':'مسح الحضور QR', '/teacher/payments':'المدفوعات والعمولة',
    '/teacher/availability':'المواعيد المتاحة', '/teacher/profile':'الملف العام', '/teacher/reviews':'التقييمات', '/teacher/messages':'الرسائل', '/teacher/calendar':'التقويم', '/teacher/assignments':'الواجبات',
    '/assistant/dashboard':'لوحة التحكم', '/assistant/groups':'المجموعات', '/assistant/students':'الطلاب', '/assistant/attendance':'الحضور والانصراف', '/assistant/payments':'المصروفات', '/assistant/invitations':'الدعوات', '/assistant/messages':'الرسائل', '/assistant/calendar':'التقويم', '/assistant/profile':'الملف الشخصي',
    '/parent/dashboard':'لوحة ولي الأمر', '/parent/attendance':'سجل الحضور', '/parent/payments':'المدفوعات', '/parent/requests':'الطلبات والموافقات', '/parent/settings':'الإعدادات', '/parent/messages':'الرسائل', '/parent/calendar':'التقويم', '/parent/grades':'الدرجات',
    '/student/dashboard':'لوحة الطالب', '/student/attendance':'الحضور', '/student/payments':'المدفوعات', '/student/exam-results':'نتائج الامتحانات', '/student/profile':'الملف الشخصي', '/student/tutors':'مدرسيني', '/student/book':'حجز حصة', '/student/messages':'الرسائل', '/student/calendar':'التقويم', '/student/grades':'الدرجات', '/student/reviews':'التقييمات'
  };
  if (labels[path]) return labels[path];
  if (path.startsWith('/teacher/students/')) return 'ملف الطالب';
  if (path.startsWith('/teacher/assistants/')) return 'إدارة المساعد';
  if (path.startsWith('/teacher/exams/')) return path.startsWith('/teacher/exam-grading/') ? 'تصحيح الامتحان' : 'يوم الامتحان';
  return roleLabel(role);
};

const quickActions = (role: AccountRole, path: string) => {
  if (role === 'teacher') {
    if (path.startsWith('/teacher/students')) return [{label:'المجموعات',path:'/teacher/groups',icon:ChevronLeft},{label:'إضافة مساعد',path:'/teacher/assistants',icon:Plus}];
    if (path.startsWith('/teacher/groups')) return [{label:'الطلاب',path:'/teacher/students',icon:ChevronLeft},{label:'الامتحانات',path:'/teacher/exams',icon:Calendar}];
    if (path.startsWith('/teacher/exams')) return [{label:'الطلاب',path:'/teacher/students',icon:ChevronLeft},{label:'التقويم',path:'/teacher/calendar',icon:Calendar}];
    return [{label:'المجموعات',path:'/teacher/groups',icon:ChevronLeft},{label:'المساعدون',path:'/teacher/assistants',icon:Plus}];
  }
  if (role === 'parent') return [{label:'الطلبات',path:'/parent/requests',icon:ChevronLeft},{label:'التقويم',path:'/parent/calendar',icon:Calendar}];
  if (role === 'assistant') return [{label:'المجموعات',path:'/assistant/groups',icon:ChevronLeft},{label:'التقويم',path:'/assistant/calendar',icon:Calendar}];
  return [{label:'مدرسيني',path:'/student/tutors',icon:ChevronLeft},{label:'التقويم',path:'/student/calendar',icon:Calendar}];
};

export const DashboardPageFrame: React.FC<DashboardPageFrameProps> = ({ role, path, title, description, onNavigate, children, action }) => {
  const actions = quickActions(role, path);
  const autoTitle = title || pageTitle(path, role);
  const autoDescription = description || (role === 'teacher' ? 'إدارة يومك التعليمي وبياناتك وعملياتك من مكان واحد.' : 'كل بياناتك وعملياتك التعليمية في مساحة منظمة.');
  return <div dir="rtl" className="space-y-5">
    <header className="rounded-3xl border border-slate-200 bg-white/95 shadow-sm p-5 sm:p-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-2">
            <Home className="w-3.5 h-3.5"/><span>{roleLabel(role)}</span><ArrowRight className="w-3.5 h-3.5"/><span className="text-blue-700">{autoTitle}</span>
          </div>
          <div className="flex items-center gap-3"><h1 className="text-2xl sm:text-3xl font-black text-slate-900">{autoTitle}</h1><span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black">مباشر</span></div>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-2xl leading-6">{autoDescription}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>onNavigate(`/${role}/notifications`)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50"><BellRing className="w-4 h-4"/>الإشعارات</button>
          {actions.map(a=>{const Icon=a.icon;return <button key={a.path} onClick={()=>onNavigate(a.path)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 hover:bg-blue-50 hover:text-blue-700"><Icon className="w-4 h-4"/>{a.label}</button>})}
          {action && <button onClick={()=>onNavigate(action.path)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2.5 text-xs font-black hover:bg-blue-700"><Plus className="w-4 h-4"/>{action.label}</button>}
        </div>
      </div>
    </header>
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-2.5">
      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500"><Search className="w-4 h-4"/>كل الأدوات الخاصة بـ {roleLabel(role)} متاحة من القائمة الجانبية.</div>
      <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} className="text-[11px] font-black text-blue-700 inline-flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5"/>تحديث العرض</button>
    </div>
    {children}
  </div>;
};
