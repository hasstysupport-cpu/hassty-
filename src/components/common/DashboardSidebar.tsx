import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, Calendar, ChevronLeft, ClipboardCheck, FileSpreadsheet, GraduationCap, Home, Layers, LayoutDashboard, LogOut, Menu, MessageCircle, PanelRightClose, PanelRightOpen, QrCode, Receipt, ScanLine, Search, ShieldCheck, Star, UserCheck, UserCog, UserPlus, Users, X, BookOpen, ArrowLeftRight, UserRoundSearch, ClipboardList, NotebookPen, Bell, UsersRound, Settings, BadgeCheck } from 'lucide-react';
import { AccountRole } from '../../types';
import { useAuth } from '../../lib/AuthContext';
import { getCleanAvatarUrl } from '../../lib/avatarHelper';
import { supabase } from '../../lib/supabase';

interface SidebarLinkItem { name: string; path: string; icon: React.ComponentType<{ className?: string }>; badge?: string; highlight?: boolean; counterKey?: string; }
interface SidebarSection { title: string; links: SidebarLinkItem[]; }

/* ============ Role navigation definitions (complete workspaces) ============ */
export const ROLE_SECTIONS: Record<'student' | 'parent' | 'teacher' | 'assistant', SidebarSection[]> = {
  teacher: [
    { title: 'الرئيسية', links: [
      { name: 'لوحة التحكم', path: '/teacher/dashboard', icon: LayoutDashboard },
      { name: 'الإشعارات', path: '/teacher/notifications', icon: BellRing, counterKey: 'notifications' },
      { name: 'الرسائل', path: '/teacher/messages', icon: MessageCircle },
      { name: 'التقويم', path: '/teacher/calendar', icon: Calendar },
    ]},
    { title: 'إدارة الطلاب', links: [
      { name: 'الطلاب', path: '/teacher/students', icon: Users },
      { name: 'المجموعات', path: '/teacher/groups', icon: Layers },
      { name: 'الحصص والدروس', path: '/teacher/sessions', icon: BookOpen },
      { name: 'طلبات الالتحاق', path: '/teacher/enrollment-requests', icon: UserPlus, counterKey: 'enrollment', highlight: true },
      { name: 'طلبات التحويل', path: '/teacher/transfers', icon: ArrowLeftRight, counterKey: 'transfers' },
      { name: 'حصص التعويض', path: '/teacher/makeup', icon: GraduationCap, counterKey: 'makeup' },
      { name: 'إدارة الحضور', path: '/teacher/attendance', icon: UserCheck },
      { name: 'نزاعات الحضور', path: '/teacher/attendance/disputes', icon: ClipboardList, counterKey: 'disputes' },
      { name: 'ماسح QR', path: '/teacher/scan', icon: ScanLine, highlight: true },
      { name: 'الواجبات', path: '/teacher/assignments', icon: BookOpen },
      { name: 'تسليمات الطلاب', path: '/teacher/assignment-submissions', icon: ClipboardCheck, counterKey: 'submissions' },
      { name: 'ملاحظات الطلاب', path: '/teacher/student-notes', icon: NotebookPen },
    ]},
    { title: 'الامتحانات والتقييم', links: [
      { name: 'الامتحانات', path: '/teacher/exams', icon: FileSpreadsheet },
      { name: 'سجل الدرجات', path: '/teacher/gradebook', icon: GraduationCap },
    ]},
    { title: 'فريق العمل', links: [
      { name: 'المساعدون', path: '/teacher/assistants', icon: UsersRound },
      { name: 'البحث عن مساعدين', path: '/teacher/assistants/search', icon: UserRoundSearch, highlight: true },
    ]},
    { title: 'المال والحسابات', links: [
      { name: 'المدفوعات والأرباح', path: '/teacher/payments', icon: Receipt },
    ]},
    { title: 'الملف', links: [
      { name: 'البروفايل العام', path: '/teacher/profile', icon: UserCog },
      { name: 'المواعيد المتاحة', path: '/teacher/availability', icon: Calendar },
      { name: 'التقييمات', path: '/teacher/reviews', icon: Star },
    ]},
  ],
  student: [
    { title: 'الرئيسية', links: [
      { name: 'لوحة التحكم', path: '/student/dashboard', icon: LayoutDashboard },
      { name: 'الإشعارات', path: '/student/notifications', icon: BellRing, counterKey: 'notifications' },
      { name: 'الرسائل', path: '/student/messages', icon: MessageCircle },
      { name: 'التقويم', path: '/student/calendar', icon: Calendar },
    ]},
    { title: 'الدراسة', links: [
      { name: 'مدرسيني', path: '/student/tutors', icon: Users },
      { name: 'حجز حصة', path: '/student/book', icon: Calendar },
      { name: 'الواجبات', path: '/student/assignments', icon: BookOpen },
      { name: 'الامتحانات', path: '/student/exams', icon: FileSpreadsheet },
      { name: 'نتائج الامتحانات', path: '/student/exam-results', icon: GraduationCap },
      { name: 'الدرجات', path: '/student/grades', icon: GraduationCap },
      { name: 'الحضور', path: '/student/attendance', icon: ClipboardCheck },
    ]},
    { title: 'الحساب', links: [
      { name: 'المدفوعات', path: '/student/payments', icon: Receipt },
      { name: 'كارنيه QR', path: '/student/qr-card', icon: QrCode, badge: 'رقمي' },
      { name: 'التقييمات', path: '/student/reviews', icon: Star },
      { name: 'الملف الشخصي', path: '/student/profile', icon: UserCog },
    ]},
  ],
  parent: [
    { title: 'الرئيسية', links: [
      { name: 'لوحة التحكم', path: '/parent/dashboard', icon: LayoutDashboard },
      { name: 'الإشعارات', path: '/parent/notifications', icon: BellRing, counterKey: 'notifications' },
      { name: 'الرسائل', path: '/parent/messages', icon: MessageCircle },
      { name: 'التقويم', path: '/parent/calendar', icon: Calendar },
    ]},
    { title: 'متابعة الأبناء', links: [
      { name: 'الأبناء', path: '/parent/children', icon: Users },
      { name: 'سجل الحضور', path: '/parent/attendance', icon: ClipboardCheck },
      { name: 'الدرجات', path: '/parent/grades', icon: GraduationCap },
      { name: 'تغيير المدرس', path: '/parent/teacher-change', icon: ArrowLeftRight },
      { name: 'طلبات التحويل', path: '/parent/transfers', icon: ArrowLeftRight },
    ]},
    { title: 'الحساب', links: [
      { name: 'المدفوعات', path: '/parent/payments', icon: Receipt },
      { name: 'الإعدادات', path: '/parent/settings', icon: Settings },
    ]},
  ],
  assistant: [
    { title: 'الرئيسية', links: [
      { name: 'لوحة التحكم', path: '/assistant/dashboard', icon: LayoutDashboard },
      { name: 'الإشعارات', path: '/assistant/notifications', icon: BellRing, counterKey: 'notifications' },
      { name: 'الرسائل', path: '/assistant/messages', icon: MessageCircle },
      { name: 'التقويم', path: '/assistant/calendar', icon: Calendar },
    ]},
    { title: 'العمل', links: [
      { name: 'المجموعات', path: '/assistant/groups', icon: Layers },
      { name: 'الطلاب', path: '/assistant/students', icon: Users },
      { name: 'الحضور والانصراف', path: '/assistant/attendance', icon: UserCheck },
      { name: 'المصروفات', path: '/assistant/payments', icon: Receipt },
      { name: 'الدعوات', path: '/assistant/invitations', icon: UserPlus, counterKey: 'invitations' },
    ]},
    { title: 'الملف', links: [
      { name: 'التوثيق', path: '/assistant/verification', icon: ShieldCheck, highlight: true },
      { name: 'الملف الشخصي', path: '/assistant/profile', icon: UserCog },
    ]},
  ],
};

interface DashboardSidebarProps { currentRole: AccountRole; currentPath: string; onNavigate: (path: string) => void; onLogout?: () => void; }

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ currentRole, currentPath, onNavigate, onLogout }) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [q, setQ] = useState('');
  const [unread, setUnread] = useState(0);
  const [counters, setCounters] = useState<Record<string, number>>({});
  const sections = ROLE_SECTIONS[(currentRole === 'teacher' || currentRole === 'student' || currentRole === 'parent' || currentRole === 'assistant') ? currentRole : 'student'];

  // Unread notifications + pending counters (real data)
  useEffect(() => {
    if (!supabase || !user?.uid) return;
    let active = true;
    const loadCounters = async () => {
      try {
        const { data: notif } = await supabase.from('notifications').select('id').eq('user_id', user.uid).is('read_at', null);
        if (!active) return;
        const n = (notif || []).length;
        setUnread(n);
        setCounters((p) => ({ ...p, notifications: n }));
        if (currentRole === 'teacher') {
          const { data: myGroups } = await supabase.from('student_groups').select('id').eq('tutor_id', user.uid);
          const groupIds = (myGroups || []).map((g: any) => g.id);
          const { data: myAssignments } = await supabase.from('assignments').select('id').eq('teacher_id', user.uid);
          const assignmentIds = (myAssignments || []).map((a: any) => a.id);
          const { data: myStudents } = groupIds.length ? await supabase.from('group_enrollments').select('student_id').in('group_id', groupIds) : { data: [] };
          const studentIds = (myStudents || []).map((s: any) => s.student_id).filter(Boolean);
          const [book, trans, makeup, disputes, subs] = await Promise.all([
            supabase.from('booking_requests').select('id').eq('tutor_id', user.uid).eq('status', 'pending'),
            groupIds.length ? supabase.from('group_transfer_requests').select('id').eq('status', 'pending').in('to_group_id', groupIds) : Promise.resolve({ data: [] }),
            studentIds.length ? supabase.from('makeup_requests').select('id').eq('status', 'pending').in('student_id', studentIds) : Promise.resolve({ data: [] }),
            supabase.from('attendance_disputes').select('id').eq('status', 'pending'),
            assignmentIds.length ? supabase.from('assignment_submissions').select('id').in('status', ['submitted', 'late']).in('assignment_id', assignmentIds) : Promise.resolve({ data: [] }),
          ]);
          if (!active) return;
          setCounters((p) => ({ ...p, enrollment: book.data?.length || 0, transfers: trans.data?.length || 0, makeup: makeup.data?.length || 0, disputes: disputes.data?.length || 0, submissions: subs.data?.length || 0 }));
        }
        if (currentRole === 'assistant') {
          const { data: inv } = await supabase.from('assistant_invitations').select('id').eq('assistant_id', user.uid).eq('status', 'pending');
          if (active) setCounters((p) => ({ ...p, invitations: inv?.length || 0 }));
        }
      } catch { /* silent — counters are best-effort */ }
    };
    void loadCounters();
    const interval = setInterval(() => void loadCounters(), 60000);
    return () => { active = false; clearInterval(interval); };
  }, [user?.uid, currentRole]);

  // close drawer on navigation + open via header menu button event
  useEffect(() => {
    setDrawerOpen(false); setQ('');
    const openDrawer = () => setDrawerOpen(true);
    window.addEventListener('hassty:open-drawer', openDrawer);
    return () => { window.removeEventListener('hassty:open-drawer', openDrawer); };
  }, [currentPath]);

  const filteredSections = useMemo(() => {
    if (!q.trim()) return sections;
    const needle = q.trim();
    return sections.map((s) => ({ ...s, links: s.links.filter((l) => l.name.includes(needle)) })).filter((s) => s.links.length > 0);
  }, [sections, q]);

  const displayName = user?.name || (currentRole === 'student' ? 'طالب حِصّتي' : currentRole === 'parent' ? 'ولي أمر حِصّتي' : currentRole === 'assistant' ? 'مساعد حِصّتي' : 'معلم حِصّتي');
  const roleLabel = currentRole === 'student' ? 'حساب طالب' : currentRole === 'parent' ? 'حساب ولي أمر' : currentRole === 'assistant' ? 'حساب مساعد' : 'حساب معلم معتمد';
  const avatarSrc = getCleanAvatarUrl(user?.avatarUrl || user?.profileData?.avatarUrl, currentRole, displayName);

  const isActive = (path: string) => currentPath === path || (path !== `/${currentRole}/dashboard` && currentPath.startsWith(path + '/'));

  const NavContent = (
    <div className="flex flex-col h-full min-h-0">
      {/* Profile block */}
      <div className={`p-3 m-2.5 bg-[#F8FAFF] border border-[#E5E7EB] rounded-xl flex items-center gap-2.5 shrink-0 ${collapsed ? 'lg:justify-center' : ''}`}>
        <img src={avatarSrc} alt={displayName} className="w-9 h-9 rounded-lg object-cover border border-white ring-2 ring-[color:var(--role-soft-border)] shadow-xs shrink-0 bg-white" referrerPolicy="no-referrer" />
        {!collapsed && <div className="min-w-0 flex-1 hidden lg:block"><span className="text-[10px] font-bold text-[#6B7280] block">{roleLabel}</span><h3 className="text-[11px] font-black text-grad truncate">{displayName}</h3></div>}
      </div>

      {/* Search inside navigation */}
      {!collapsed && (
        <div className="px-3.5 pb-1.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث في القائمة..." className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-9 pl-3 text-[11px] font-bold outline-none focus:ring-2 focus:ring-[color:var(--role-soft-border)] focus:border-[color:var(--role-color)]" />
          </div>
        </div>
      )}

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto px-2.5 pb-2.5 space-y-3 min-h-0">
        {filteredSections.map((section) => (
          <div key={section.title}>
            {!collapsed && <div className="text-[10px] font-black text-[#9CA3AF] px-3 mb-1 tracking-wide flex items-center gap-2"><span className="bg-grad w-3 h-[3px] rounded-full" aria-hidden="true" />{section.title}</div>}
            {collapsed && <div className="h-px bg-slate-100 mx-2 mb-1.5" />}
            <div className="space-y-0.5">
              {section.links.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const count = item.counterKey ? counters[item.counterKey] || 0 : 0;
                return (
                  <button key={item.path} onClick={() => onNavigate(item.path)} title={item.name}
                    className={`group relative w-full flex items-center justify-between gap-2 rounded-xl cursor-pointer ${active ? 'nav-active-lux' : item.highlight ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100' : 'text-[#1F2937] hover:bg-[color:var(--role-soft)] hover:text-[color:var(--role-color)] hover:-translate-x-0.5'} ${collapsed ? 'lg:px-2.5 lg:justify-center' : 'px-3'} py-2 text-[11px] font-bold`}>
                    {active && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-white/80" aria-hidden="true" />}
                    <div className={`flex items-center gap-2 min-w-0 ${collapsed ? 'lg:justify-center' : ''}`}>
                      <Icon className={`w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-white' : item.highlight ? 'text-emerald-700' : 'text-gray-400'}`} />
                      {!collapsed && <span className="truncate hidden lg:inline">{item.name}</span>}
                      {!collapsed && <span className="lg:hidden truncate">{item.name}</span>}
                    </div>
                    {count > 0 && <span className={`text-[10px] min-w-[18px] h-[18px] px-1 rounded-full font-black flex items-center justify-center shrink-0 ${active ? 'bg-white/25 text-white' : 'bg-gradient-to-br from-red-500 to-rose-600 text-white counter-pulse'}`}>{count > 99 ? '99+' : count}</span>}
                    {item.badge && !count && <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${active ? 'bg-white/20 text-white' : 'bg-[color:var(--role-soft)] text-[color:var(--role-color)] border border-[color:var(--role-soft-border)]'}`}>{item.badge}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {filteredSections.length === 0 && <div className="px-3 py-8 text-center text-[11px] font-bold text-slate-400">لا توجد نتائج مطابقة للبحث.</div>}
      </nav>

      {/* Footer actions */}
      <div className="pt-2 border-t border-slate-100 px-2.5 pb-3 space-y-1 shrink-0">
        <button onClick={() => onNavigate('/')} className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-[#4B5563] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-xl cursor-pointer ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}><Home className="w-4 h-4 shrink-0" /><span className={collapsed ? 'lg:hidden' : ''}>العودة للرئيسية</span></button>
        {onLogout && <button onClick={onLogout} className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-[#EF4444] hover:bg-red-50 rounded-xl cursor-pointer ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}><LogOut className="w-4 h-4 shrink-0" /><span className={collapsed ? 'lg:hidden' : ''}>تسجيل الخروج</span></button>}
        <button onClick={() => setCollapsed((v) => !v)} className="w-full hidden lg:flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer justify-center" title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}>
          {collapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white border border-[#E5E7EB] ${collapsed ? 'w-[68px]' : 'w-60 xl:w-64'} rounded-2xl p-1 shrink-0 sticky top-[74px] h-[calc(100vh-5.6rem)] overflow-hidden transition-[width] duration-300 justify-start shadow-xs`} dir="rtl">
        {NavContent}
      </aside>

      {/* Mobile: sticky header menu button is rendered in shell header; drawer here */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" dir="rtl">
          <div className="anim-fade absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="drawer-panel-lux relative z-10 w-[85vw] max-w-xs bg-white h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <span className="text-xs font-black text-grad">قائمة {roleLabel}</span>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            {NavContent}
          </div>
        </div>
      )}

      {/* Mobile bottom nav: essential shortcuts only (drawer holds the full workspace) */}
      <MobileBottomNav sections={sections} currentPath={currentPath} onNavigate={onNavigate} unread={unread} onOpenDrawer={() => setDrawerOpen(true)} />
    </>
  );
};

const MobileBottomNav: React.FC<{ sections: SidebarSection[]; currentPath: string; onNavigate: (p: string) => void; unread: number; onOpenDrawer: () => void }> = ({ sections, currentPath, onNavigate, unread, onOpenDrawer }) => {
  const shortcuts = useMemo(() => {
    const main = sections[0]?.links.slice(0, 3) || [];
    return main;
  }, [sections]);
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-1 sm:px-3 py-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(0.75rem,env(safe-area-inset-bottom))]" dir="rtl">
      {shortcuts.map((item) => {
        const Icon = item.icon;
        const active = currentPath === item.path;
        return (
          <button key={item.path} onClick={() => onNavigate(item.path)} className={`flex-1 min-w-[56px] flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-[11px] font-bold cursor-pointer ${active ? 'text-[color:var(--role-color)]' : 'text-gray-500 hover:text-[color:var(--role-color)]'}`}>
            <div className={`relative p-1 rounded-lg transition-all duration-300 ${active ? 'chip-grad text-white scale-110' : ''}`}>
              <Icon className="w-5 h-5" />
              {item.counterKey === 'notifications' && unread > 0 && <span className="counter-pulse absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
            </div>
            <span className="truncate max-w-[64px] text-[10px] leading-tight text-center">{item.name}</span>
          </button>
        );
      })}
      <button onClick={onOpenDrawer} className="flex-1 min-w-[56px] flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-[11px] font-bold text-gray-600 hover:text-[#2563EB] cursor-pointer">
        <div className="p-1 rounded-lg"><Menu className="w-5 h-5" /></div>
        <span className="truncate max-w-[64px] text-[10px] leading-tight text-center">القائمة كاملة</span>
      </button>
    </div>
  );
};
