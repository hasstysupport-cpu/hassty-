import React, { useMemo, useState } from 'react';
import {
  Activity, BarChart3, BellRing, BookOpen, Calendar, ClipboardCheck, ClipboardList,
  FileCheck2, FileText, Home, Layers, LogOut, MessageCircle, Menu, Receipt, ScanLine,
  Search, Settings2, ShieldCheck, Star, StickyNote, UserCheck, UserCog, UserPlus,
  Users, WalletCards, X, ChevronLeft
} from 'lucide-react';
import { AccountRole } from '../../types';
import { useAuth } from '../../lib/AuthContext';
import { getCleanAvatarUrl } from '../../lib/avatarHelper';

type Item = { name:string; path:string; icon:React.ComponentType<{className?:string}>; badge?:string; highlight?:boolean };
type Section = { title:string; items:Item[] };
interface Props { currentRole:AccountRole; currentPath:string; onNavigate:(path:string)=>void; onLogout?:()=>void; }

const sections = (role:AccountRole):Section[] => {
  if(role==='teacher') return [
    {title:'الرئيسية',items:[
      {name:'نظرة عامة',path:'/teacher/dashboard',icon:Activity},
      {name:'الإشعارات',path:'/teacher/notifications',icon:BellRing},
      {name:'الرسائل',path:'/teacher/messages',icon:MessageCircle},
      {name:'التقويم والجدول',path:'/teacher/calendar',icon:Calendar},
    ]},
    {title:'إدارة الطلاب',items:[
      {name:'كل الطلاب',path:'/teacher/students',icon:Users},
      {name:'المجموعات',path:'/teacher/groups',icon:Layers},
      {name:'الجلسات والحصص',path:'/teacher/sessions',icon:Calendar},
      {name:'طلبات التسجيل',path:'/teacher/enrollment-requests',icon:ClipboardList,badge:'طلبات'},
      {name:'النقل والتعويض',path:'/teacher/transfers',icon:FileText,badge:'جديد'},
      {name:'الحضور',path:'/teacher/attendance',icon:UserCheck},
      {name:'مسح حضور QR',path:'/teacher/scan',icon:ScanLine,highlight:true},
      {name:'الواجبات والتسليمات',path:'/teacher/assignments',icon:BookOpen},
      {name:'ملاحظات الطلاب',path:'/teacher/student-notes',icon:StickyNote},
    ]},
    {title:'فريق العمل',items:[{name:'المساعدون',path:'/teacher/assistants',icon:UserPlus,highlight:true}]},
    {title:'الامتحانات والتقييم',items:[
      {name:'الامتحانات والتوزيع',path:'/teacher/exams',icon:FileCheck2,highlight:true},
      {name:'دفتر الدرجات',path:'/teacher/gradebook',icon:BarChart3},
      {name:'تقييمات الطلاب',path:'/teacher/reviews',icon:Star},
    ]},
    {title:'المال والملف',items:[
      {name:'المدفوعات والأرباح',path:'/teacher/payments',icon:WalletCards},
      {name:'المواعيد المتاحة',path:'/teacher/availability',icon:Calendar},
      {name:'الملف العام',path:'/teacher/profile',icon:UserCog},
      {name:'الإعدادات',path:'/teacher/settings',icon:Settings2},
    ]},
  ];
  if(role==='assistant') return [{title:'المساعد',items:[
    {name:'الرئيسية',path:'/assistant/dashboard',icon:Activity},
    {name:'التوثيق',path:'/assistant/verification',icon:ShieldCheck,highlight:true},
    {name:'المجموعات',path:'/assistant/groups',icon:Layers},{name:'الطلاب',path:'/assistant/students',icon:Users},
    {name:'الحضور والانصراف',path:'/assistant/attendance',icon:UserCheck},{name:'المصروفات',path:'/assistant/payments',icon:Receipt},
    {name:'الدعوات',path:'/assistant/invitations',icon:UserPlus},{name:'الرسائل',path:'/assistant/messages',icon:MessageCircle},
    {name:'الإشعارات',path:'/assistant/notifications',icon:BellRing},{name:'التقويم',path:'/assistant/calendar',icon:Calendar},
    {name:'الملف الشخصي',path:'/assistant/profile',icon:UserCog},
  ]}];
  if(role==='parent') return [{title:'ولي الأمر',items:[
    {name:'الرئيسية',path:'/parent/dashboard',icon:Activity},{name:'الإشعارات',path:'/parent/notifications',icon:BellRing},
    {name:'التقويم',path:'/parent/calendar',icon:Calendar},{name:'الرسائل',path:'/parent/messages',icon:MessageCircle},
    {name:'الدرجات',path:'/parent/grades',icon:BarChart3},{name:'الحضور',path:'/parent/attendance',icon:ClipboardCheck},
    {name:'المدفوعات',path:'/parent/payments',icon:Receipt},{name:'الطلبات والموافقات',path:'/parent/requests',icon:ClipboardList,highlight:true},
    {name:'الإعدادات',path:'/parent/settings',icon:Settings2},
  ]}];
  return [{title:'الطالب',items:[
    {name:'الرئيسية',path:'/student/dashboard',icon:Activity},{name:'الإشعارات',path:'/student/notifications',icon:BellRing},
    {name:'التقويم',path:'/student/calendar',icon:Calendar},{name:'الرسائل',path:'/student/messages',icon:MessageCircle},
    {name:'الواجبات',path:'/student/assignments',icon:BookOpen},{name:'الدرجات',path:'/student/grades',icon:BarChart3},
    {name:'نتائج الامتحانات',path:'/student/exam-results',icon:FileCheck2,highlight:true},{name:'الحضور',path:'/student/attendance',icon:ClipboardCheck},
    {name:'التقييمات',path:'/student/reviews',icon:Star},{name:'كارنيه QR',path:'/student/qr-card',icon:ScanLine,badge:'رقمي'},
    {name:'الملف الشخصي',path:'/student/profile',icon:UserCog},{name:'مدرسيني',path:'/student/tutors',icon:Users},
    {name:'حجز حصة',path:'/student/book',icon:Calendar},{name:'المدفوعات',path:'/student/payments',icon:Receipt},
  ]}];
};

export const DashboardSidebar:React.FC<Props> = ({currentRole,currentPath,onNavigate,onLogout}) => {
  const {user} = useAuth(); const [open,setOpen] = useState(false); const [query,setQuery] = useState('');
  const groups = useMemo(()=>sections(currentRole),[currentRole]);
  const name = user?.name || (currentRole==='teacher'?'معلم حِصّتي':currentRole==='assistant'?'مساعد حِصّتي':currentRole==='parent'?'ولي أمر حِصّتي':'طالب حِصّتي');
  const roleLabel = currentRole==='teacher'?'مساحة المدرس':currentRole==='assistant'?'مساحة المساعد':currentRole==='parent'?'مساحة ولي الأمر':'مساحة الطالب';
  const avatar = getCleanAvatarUrl(user?.avatarUrl || user?.profileData?.avatarUrl,currentRole,name);
  const filtered = useMemo(()=>{const q=query.trim().toLowerCase(); return q?groups.map(g=>({...g,items:g.items.filter(i=>i.name.toLowerCase().includes(q))})).filter(g=>g.items.length):groups;},[groups,query]);

  const Nav = () => <nav className="space-y-5">
    {filtered.map(group=><section key={group.title}>
      <div className="px-2 mb-2 text-[10px] font-black tracking-wide text-slate-400">{group.title}</div>
      <div className="space-y-1">
        {group.items.map(item=>{const Icon=item.icon,active=currentPath===item.path;return <button key={item.path} onClick={()=>{onNavigate(item.path);setOpen(false)}} className={`group w-full flex items-center justify-between gap-2 rounded-2xl px-2.5 py-2.5 border transition-all ${active?'bg-slate-950 border-slate-950 text-white shadow-sm':item.highlight?'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100':'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50'}`}>
          <span className="flex items-center gap-3 min-w-0"><span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active?'bg-white/10 text-white':item.highlight?'bg-white text-emerald-700':'bg-slate-100 text-slate-500 group-hover:text-slate-900'}`}><Icon className="w-4 h-4"/></span><span className="truncate text-[12px] font-bold">{item.name}</span></span>
          {item.badge&&<span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-md font-black ${active?'bg-white/10 text-white':'bg-white border border-slate-200 text-slate-500'}`}>{item.badge}</span>}
        </button>})}
      </div>
    </section>)}
  </nav>;

  const Profile = () => <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3.5 mb-4"><div className="flex items-center gap-3"><img src={avatar} alt={name} className="w-11 h-11 rounded-xl object-cover border border-white shadow-sm" referrerPolicy="no-referrer"/><div className="min-w-0"><div className="text-[10px] font-bold text-slate-400">{roleLabel}</div><div className="text-xs font-black text-slate-950 truncate">{name}</div></div></div><div className="mt-3 flex items-center justify-between"><span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"/>متصل الآن</span><button className="text-[10px] font-black text-slate-500 hover:text-blue-600" onClick={()=>onNavigate(currentRole==='teacher'?'/teacher/profile':currentRole==='assistant'?'/assistant/profile':currentRole==='parent'?'/parent/settings':'/student/profile')}>الحساب</button></div></div>;

  return <>
    <aside className="hidden lg:flex flex-col w-[285px] bg-white border border-slate-200 rounded-[30px] p-4 shrink-0 sticky top-24 h-[calc(100vh-7rem)] shadow-[0_18px_60px_rgba(15,23,42,0.07)] overflow-hidden">
      <div className="flex items-center justify-between mb-3 px-1"><div><div className="text-sm font-black text-slate-950">مركز التحكم</div><div className="text-[10px] text-slate-400 mt-0.5">كل أدواتك في مكان واحد</div></div><div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center"><Layers className="w-4 h-4"/></div></div>
      <Profile />
      <div className="relative mb-4"><Search className="absolute right-3 top-3 w-4 h-4 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث عن صفحة أو أداة..." className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:bg-white focus:border-blue-300"/></div>
      <div className="flex-1 overflow-y-auto pr-1 -mr-1"><Nav/></div>
      <div className="pt-3 mt-3 border-t border-slate-100 space-y-1"><button onClick={()=>onNavigate('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"><Home className="w-4 h-4"/>الموقع الرئيسي</button>{onLogout&&<button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4"/>تسجيل الخروج</button>}</div>
    </aside>

    <div className="lg:hidden w-full mb-4">
      <button onClick={()=>setOpen(true)} className="w-full rounded-2xl bg-white border border-slate-200 shadow-sm px-4 py-3.5 flex items-center justify-between"><span className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center"><Menu className="w-5 h-5"/></span><span className="text-right"><span className="block text-[10px] text-slate-400 font-bold">التنقل داخل حسابك</span><span className="block text-sm font-black text-slate-950">فتح مركز التحكم</span></span></span><span className="text-[11px] font-black text-blue-600 flex items-center gap-1">كل الأقسام<ChevronLeft className="w-4 h-4"/></span></button>
    </div>
    {open&&<div className="lg:hidden fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-sm" onClick={()=>setOpen(false)}><aside dir="rtl" onClick={e=>e.stopPropagation()} className="absolute right-0 top-0 bottom-0 w-[min(92vw,400px)] bg-white shadow-2xl flex flex-col"><div className="p-4 border-b border-slate-100 flex items-center justify-between"><div><div className="font-black text-sm">مركز التحكم</div><div className="text-[10px] text-slate-400 mt-0.5">التنقل الكامل</div></div><button onClick={()=>setOpen(false)} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><X className="w-5 h-5"/></button></div><div className="p-4"><Profile/><div className="relative"><Search className="absolute right-3 top-3 w-4 h-4 text-slate-400"/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث في الأقسام..." className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:bg-white focus:border-blue-300"/></div></div><div className="flex-1 overflow-y-auto px-4 pb-5"><Nav/></div><div className="p-4 border-t border-slate-100"><button onClick={onLogout} className="w-full rounded-xl bg-red-50 text-red-700 py-3 text-xs font-black flex items-center justify-center gap-2"><LogOut className="w-4 h-4"/>تسجيل الخروج</button></div></aside></div>}
  </>;
};
