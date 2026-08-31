import React, { useEffect, useState } from 'react';
import { Bell, ChevronDown, Menu, User, Settings, LogOut, CheckCheck } from 'lucide-react';
import { AccountRole } from '../../types';
import { BrandLogo } from './BrandLogo';
import { getCleanAvatarUrl } from '../../lib/avatarHelper';
import { supabase } from '../../lib/supabase';
import { AppNotification, markAllNotificationsRead, markNotificationRead, notificationTime, subscribeToNotifications } from '../../lib/notificationService';

interface LoggedInNavbarProps { currentPath: string; currentRole?: AccountRole; role?: AccountRole; pageTitle?: string; userName?: string; userAvatar?: string; onNavigate: (path: string) => void; onRoleChange?: (newRole: AccountRole) => void; onLogout?: () => void; }

const titles: Record<string,string> = {
  '/student/dashboard':'لوحة تحكم الطالب','/student/qr-card':'كارنيه الـ QR الرقمي','/student/tutors':'مدرسيني المسجلين','/student/book':'حجز حصة جديدة','/student/payments':'المدفوعات والإيصالات','/student/notifications':'الإشعارات والتنبيهات','/student/calendar':'التقويم الموحد','/student/messages':'الرسائل','/student/assignments':'الواجبات والملفات','/student/grades':'الدرجات والتقارير','/student/attendance':'سجل الحضور','/student/reviews':'تقييم المدرسين','/student/exams':'الامتحانات','/student/exam-results':'نتائج الامتحانات','/student/settings':'الإعدادات',
  '/parent/dashboard':'لوحة متابعة ولي الأمر','/parent/attendance':'سجل الحضور اللحظي','/parent/payments':'المدفوعات والمصروفات','/parent/settings':'إعدادات الإشعارات والواتساب','/parent/notifications':'الإشعارات والتنبيهات','/parent/calendar':'التقويم الموحد','/parent/messages':'الرسائل','/parent/grades':'درجات الأبناء وتقاريرهم','/parent/children':'إدارة الأبناء','/parent/teacher-change':'طلبات تغيير المدرس','/parent/transfers':'طلبات تحويل المجموعات',
  '/teacher/dashboard':'لوحة تحكم المعلم','/teacher/students':'دليل الطلاب والاشتراكات','/teacher/groups':'إدارة المجموعات والسناتر','/teacher/scan':'ماسح حضور الـ QR','/teacher/attendance':'إدارة الحضور المتطور','/teacher/attendance/disputes':'نزاعات الحضور','/teacher/payments':'الأرباح والعمولة','/teacher/availability':'إدارة المواعيد المتاحة','/teacher/profile':'تعديل البروفايل العام','/teacher/reviews':'تقييمات وآراء الطلاب','/teacher/notifications':'الإشعارات والتنبيهات','/teacher/calendar':'التقويم الموحد','/teacher/messages':'الرسائل','/teacher/assignments':'الواجبات والتصحيح','/teacher/assignment-submissions':'تسليمات الطلاب','/teacher/sessions':'الحصص والدروس','/teacher/enrollment-requests':'طلبات الالتحاق','/teacher/transfers':'طلبات التحويل','/teacher/makeup':'حصص التعويض','/teacher/student-notes':'ملاحظات الطلاب','/teacher/exams':'الامتحانات','/teacher/gradebook':'سجل الدرجات','/teacher/assistants/search':'البحث عن مساعدين',
  '/assistant/dashboard':'لوحة المساعد','/assistant/groups':'المجموعات المسندة','/assistant/students':'الطلاب ضمن صلاحيتك','/assistant/attendance':'الحضور والانصراف','/assistant/payments':'المصروفات','/assistant/invitations':'دعوات المدرسين','/assistant/profile':'الملف الشخصي','/assistant/verification':'توثيق حساب المساعد',
};

const roleLabels: Record<AccountRole,{title:string;badge:string;path:string;fallback:string}> = {
  student:{title:'حساب طالب',badge:'bg-blue-50 text-blue-700 border-blue-200',path:'/student/profile',fallback:'طالب حِصّتي'},
  parent:{title:'حساب ولي أمر',badge:'bg-amber-50 text-amber-800 border-amber-200',path:'/parent/settings',fallback:'ولي أمر حِصّتي'},
  teacher:{title:'حساب مدرس',badge:'bg-emerald-50 text-emerald-800 border-emerald-200',path:'/teacher/profile',fallback:'معلم حِصّتي'},
  assistant:{title:'حساب مساعد',badge:'bg-teal-50 text-teal-800 border-teal-200',path:'/teacher/dashboard',fallback:'مساعد حِصّتي'},
  admin:{title:'حساب إدارة',badge:'bg-purple-50 text-purple-800 border-purple-200',path:'/admin',fallback:'مدير حِصّتي'},
};

export const LoggedInNavbar: React.FC<LoggedInNavbarProps> = ({currentPath,currentRole,role:propRole,pageTitle, userName:propUserName,userAvatar:propUserAvatar,onNavigate,onRoleChange,onLogout}) => {
  const role=propRole||currentRole||'student'; const meta=roleLabels[role]||roleLabels.student; const userName=propUserName||meta.fallback; const userAvatar=getCleanAvatarUrl(propUserAvatar,role,userName);
  const [notifications,setNotifications]=useState<AppNotification[]>([]); const [open,setOpen]=useState(false); const [userMenu,setUserMenu]=useState(false); const [userId,setUserId]=useState<string|null>(null);
  useEffect(()=>{let active=true;let unsubscribe=()=>{};(async()=>{if(!supabase)return;const {data}=await supabase.auth.getUser();if(!active||!data.user)return;setUserId(data.user.id);unsubscribe=subscribeToNotifications(data.user.id,setNotifications,(error)=>console.warn('Notifications load:',error));})();return()=>{active=false;unsubscribe();};},[]);
  const unread=notifications.filter(n=>!n.read_at).length;
  const openNotification=async(item:AppNotification)=>{try{if(!item.read_at)await markNotificationRead(item.id);}catch(e){console.warn('Mark notification read:',e);}setOpen(false);if(item.link)onNavigate(item.link);};
  const markAllRead=async()=>{if(!userId||unread===0)return;try{await markAllNotificationsRead(userId);}catch(e){console.warn('Mark all notifications read:',e);}};
  const switchRole=(next:AccountRole)=>{if(onRoleChange)onRoleChange(next);else if(next!=='admin')onNavigate(`/${next}/dashboard`);};
  const title=pageTitle||titles[currentPath]||'لوحة التحكم';
  return (
    <header className="sticky top-0 z-40 glass border-b border-[#E5E7EB]">
      <div className="h-[2px] bg-grad opacity-70" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[54px] gap-2">
          {/* right side (RTL start): menu + logo + page title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button onClick={()=>window.dispatchEvent(new Event('hassty:open-drawer'))} className="lg:hidden p-2 rounded-lg border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-gray-50 cursor-pointer shrink-0" aria-label="القائمة"><Menu className="w-[18px] h-[18px]"/></button>
            <button onClick={()=>onNavigate('/')} className="shrink-0 cursor-pointer" aria-label="الرئيسية"><BrandLogo size="xs" showSubtitle={false}/></button>
            <div className="h-5 w-px bg-gray-200 hidden sm:block"/>
            <h1 className="text-[13px] sm:text-[15px] font-black text-grad truncate">{title}</h1>
          </div>
          {/* left side (RTL end): role switcher + notifications + user */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden lg:flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5 gap-0.5 text-[10px] font-bold">
              {(['student','parent','teacher'] as AccountRole[]).map(r=>
                <button key={r} onClick={()=>switchRole(r)} className={`px-2 py-1 rounded-md ${role===r?'bg-grad text-white shadow-sm':'text-gray-600 hover:text-blue-600 cursor-pointer'}`}>{r==='student'?'طالب':r==='parent'?'ولي أمر':'مدرس'}</button>)}
            </div>
            <div className="relative">
              <button onClick={()=>{setOpen(v=>!v);setUserMenu(false);}} className="relative p-2 rounded-lg border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-gray-50 cursor-pointer" aria-label="الإشعارات">
                <Bell className="w-[18px] h-[18px]"/>
                {unread>0&&<span className="counter-pulse absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">{unread>99?'99+':unread}</span>}
              </button>
              {open&&<div className="dropdown-lux absolute left-0 mt-2 w-[calc(100vw-2rem)] sm:w-[360px] max-w-[360px] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50 text-right">
                <div className="p-3.5 flex items-center justify-between border-b border-gray-100">
                  <div><h3 className="text-[13px] font-black text-[#1E3A8A]">الإشعارات والتنبيهات</h3><p className="text-[10px] text-gray-400 mt-0.5">تحديثات مباشرة من المنصة</p></div>
                  {unread>0&&<button onClick={markAllRead} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"><CheckCheck className="w-3.5 h-3.5"/>تحديد الكل كمقروء</button>}
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {notifications.length===0?
                    <div className="p-8 text-center text-xs text-gray-400">لا توجد إشعارات حتى الآن 🔔</div>
                  :notifications.map(item=>
                    <button key={item.id} onClick={()=>openNotification(item)} className={`w-full text-right p-3 border-b border-gray-50 hover:bg-gray-50 ${!item.read_at?'bg-blue-50/40':'bg-white'}`}>
                      <div className="flex items-start gap-2.5">
                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${item.type==='attendance'?'bg-emerald-50 text-emerald-600':item.type==='payment'?'bg-violet-50 text-violet-600':item.type==='booking'?'bg-blue-50 text-blue-600':item.type==='support'?'bg-amber-50 text-amber-600':'bg-gray-100 text-gray-600'}`}><Bell className="w-4 h-4"/></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2"><h4 className="text-xs font-black text-gray-800">{item.title}</h4><span className="text-[10px] text-gray-400 shrink-0">{notificationTime(item.created_at)}</span></div>
                          <p className="text-[11px] text-gray-500 mt-1 leading-5">{item.message}</p>
                          {!item.read_at&&<span className="inline-block mt-1.5 w-2 h-2 rounded-full bg-blue-600"/>}
                        </div>
                      </div>
                    </button>)}
                </div>
              </div>}
            </div>
            <div className="relative">
              <button onClick={()=>{setUserMenu(v=>!v);setOpen(false);}} className="flex items-center gap-1.5 p-1 sm:pr-2.5 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer">
                <img src={userAvatar} alt={userName} className="w-7 h-7 rounded-md object-cover border border-gray-200" referrerPolicy="no-referrer"/>
                <div className="hidden sm:flex flex-col text-right leading-tight"><span className="text-[11px] font-bold text-gray-800 max-w-[110px] truncate">{userName}</span><span className="text-[9px] text-blue-600 font-semibold">{meta.title}</span></div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400"/>
              </button>
              {userMenu&&<div className="dropdown-lux absolute left-0 mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl p-1.5 z-50 text-right">
                <button onClick={()=>{onNavigate(meta.path);setUserMenu(false);}} className="w-full text-right px-3 py-2 text-xs font-bold text-gray-700 hover:bg-blue-50 rounded-xl flex items-center gap-2 cursor-pointer"><User className="w-4 h-4 text-gray-400"/>الملف الشخصي</button>
                {role==='parent'&&<button onClick={()=>{onNavigate('/parent/settings');setUserMenu(false);}} className="w-full text-right px-3 py-2 text-xs font-bold text-gray-700 hover:bg-blue-50 rounded-xl flex items-center gap-2 cursor-pointer"><Settings className="w-4 h-4 text-gray-400"/>إعدادات الإشعارات</button>}
                {role==='teacher'&&<button onClick={()=>{onNavigate('/teacher/profile');setUserMenu(false);}} className="w-full text-right px-3 py-2 text-xs font-bold text-gray-700 hover:bg-blue-50 rounded-xl flex items-center gap-2 cursor-pointer"><Settings className="w-4 h-4 text-gray-400"/>تعديل البروفايل</button>}
                <div className="mt-1 pt-1 border-t border-gray-100"><button onClick={()=>{setUserMenu(false);onLogout?.();}} className="w-full text-right px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 cursor-pointer"><LogOut className="w-4 h-4"/>تسجيل الخروج</button></div>
              </div>}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
