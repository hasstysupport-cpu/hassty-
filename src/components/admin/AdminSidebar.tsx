import React, { useState } from 'react';
import { LayoutDashboard, Users, ShieldCheck, AlertOctagon, BarChart3, Percent, LogOut, ExternalLink, Database, RefreshCw, AlertTriangle, Menu, X, Bell, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export type AdminTab = 'dashboard' | 'accounts' | 'verification' | 'reports' | 'analytics' | 'commissions';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingVerificationsCount: number;
  pendingReportsCount: number;
  adminEmail: string;
  onLogout: () => void;
  onSwitchToPublicApp?: () => void;
  dbConnectionStatus?: 'connected' | 'connecting' | 'failed';
  onRetryDbConnection?: () => void;
}

const menuItems: Array<{ id: AdminTab; label: string; subtitle: string; icon: any; key: 'verifications' | 'reports' | null }> = [
  { id: 'dashboard', label: 'نظرة عامة', subtitle: 'الرئيسية والإحصائيات الحية', icon: LayoutDashboard, key: null },
  { id: 'accounts', label: 'إدارة الحسابات', subtitle: 'الطلاب والمدرسين وأولياء الأمور', icon: Users, key: null },
  { id: 'verification', label: 'طلبات توثيق المدرسين', subtitle: 'مراجعة الهويات والاعتماد', icon: ShieldCheck, key: 'verifications' },
  { id: 'reports', label: 'البلاغات والشكاوى', subtitle: 'متابعة أمان المنصة', icon: AlertOctagon, key: 'reports' },
  { id: 'analytics', label: 'إحصائيات الموقع', subtitle: 'نمو المستخدمين والمحافظات', icon: BarChart3, key: null },
  { id: 'commissions', label: 'متابعة العمولات', subtitle: 'الشرائح والتحصيلات الشهرية', icon: Percent, key: null },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentTab, onSelectTab, pendingVerificationsCount, pendingReportsCount, adminEmail, onLogout, onSwitchToPublicApp, dbConnectionStatus = 'connected', onRetryDbConnection }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [role, setRole] = useState<'all' | 'student' | 'parent' | 'teacher'>('all');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string>('');

  const sendNotification = async () => {
    if (!title.trim() || !message.trim() || sending) return;
    if (!supabase) { setResult('Supabase غير مهيأ.'); return; }
    setSending(true); setResult('');
    try {
      const { data, error } = await supabase.functions.invoke('admin-send-notification', {
        body: { title: title.trim(), message: message.trim(), type: 'announcement', role: role === 'all' ? null : role },
      });
      if (error) throw error;
      setResult(`تم إرسال الإشعار بنجاح إلى ${data?.sent ?? 0} حساب.`);
      setTitle(''); setMessage('');
    } catch (error: any) {
      setResult(error?.message || 'تعذر إرسال الإشعار. استخدم تسجيل دخول Google الإداري المرتبط بـSupabase.');
    } finally { setSending(false); }
  };

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black text-lg">حِ</div>
          <div><div className="font-black text-white">حِصّتي <span className="text-[9px] bg-blue-500/40 px-2 py-0.5 rounded-full">ADMIN</span></div><div className="text-[10px] text-blue-200">{adminEmail}</div></div>
        </div>
        <div className="mt-3 p-2.5 rounded-xl bg-blue-950/60 border border-blue-800 flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1.5 text-emerald-300 font-bold"><span className="w-2 h-2 rounded-full bg-emerald-400" /> <Database className="w-3 h-3" /> Supabase: {dbConnectionStatus === 'connected' ? 'متصل' : dbConnectionStatus === 'connecting' ? 'جار الاتصال' : 'فشل'}</span>
          {dbConnectionStatus === 'failed' && onRetryDbConnection && <button onClick={onRetryDbConnection} className="text-blue-200"><RefreshCw className="w-3.5 h-3.5" /></button>}
        </div>
      </div>
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {menuItems.map((item) => { const Icon = item.icon; const badge = item.key === 'verifications' ? pendingVerificationsCount : item.key === 'reports' ? pendingReportsCount : 0; return <button key={item.id} onClick={() => onSelectTab(item.id)} className={`w-full text-right p-3 rounded-2xl flex items-center justify-between ${currentTab === item.id ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-blue-800/60'}`}><div className="flex items-center gap-3"><span className={`w-8 h-8 rounded-xl flex items-center justify-center ${currentTab === item.id ? 'bg-white/20' : 'bg-blue-900/60'}`}><Icon className="w-4 h-4" /></span><span><b className="block text-xs">{item.label}</b><small className="text-[10px] opacity-70">{item.subtitle}</small></span></div>{badge > 0 && <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black">{badge}</span>}</button>; })}
        <div className="pt-3 mt-2 border-t border-blue-800">
          <button onClick={() => { setNotifyOpen(true); setMobileOpen(false); }} className="w-full p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white flex items-center gap-3 text-right"><span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center"><Bell className="w-4 h-4" /></span><span><b className="block text-xs">إرسال إشعارات</b><small className="text-[10px] text-blue-200">إشعار جماعي أو حسب نوع الحساب</small></span></button>
        </div>
      </nav>
      <div className="p-3 border-t border-blue-800 space-y-2">
        {onSwitchToPublicApp && <button onClick={onSwitchToPublicApp} className="w-full p-2.5 rounded-xl bg-blue-900/70 text-blue-100 text-xs font-bold flex items-center justify-center gap-2"><ExternalLink className="w-3.5 h-3.5" /> الموقع الرئيسي</button>}
        <button onClick={onLogout} className="w-full p-2.5 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-2"><LogOut className="w-3.5 h-3.5" /> تسجيل الخروج</button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex w-72 bg-[#1E3A8A] text-white flex-col min-h-screen sticky top-0 shrink-0"><SidebarContent /></aside>
      <header className="lg:hidden sticky top-0 z-40 bg-[#1E3A8A] text-white w-full"><div className="px-4 py-3 flex items-center justify-between"><div className="font-black">حِصّتي <span className="text-[10px] text-blue-200">Admin</span></div><button onClick={() => setMobileOpen((v) => !v)} className="p-2 rounded-xl bg-blue-800">{mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button></div>{mobileOpen && <div className="min-h-[calc(100vh-64px)] flex flex-col"><SidebarContent /></div>}</header>

      {notifyOpen && <div className="fixed inset-0 z-[100] bg-slate-950/60 flex items-center justify-center p-4" dir="rtl" onMouseDown={(e) => { if (e.currentTarget === e.target) setNotifyOpen(false); }}><div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"><div className="p-5 border-b border-gray-100 flex items-center justify-between"><div><h3 className="font-black text-[#1E3A8A] flex items-center gap-2"><Bell className="w-5 h-5 text-blue-600" /> إرسال إشعار</h3><p className="text-[11px] text-gray-400 mt-1">سيصل فورًا إلى الحسابات المحددة</p></div><button onClick={() => setNotifyOpen(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button></div><div className="p-5 space-y-4"><div><label className="block text-xs font-black text-gray-700 mb-1.5">الفئة المستهدفة</label><select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full p-3 rounded-xl border border-gray-200 text-sm"><option value="all">كل الحسابات</option><option value="student">الطلاب فقط</option><option value="parent">أولياء الأمور فقط</option><option value="teacher">المدرسون فقط</option></select></div><div><label className="block text-xs font-black text-gray-700 mb-1.5">عنوان الإشعار</label><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="مثلاً: تحديث جديد في المنصة" className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" /></div><div><label className="block text-xs font-black text-gray-700 mb-1.5">نص الإشعار</label><textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={5} placeholder="اكتب الرسالة التي ستظهر للمستخدمين..." className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 resize-none" /></div>{result && <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${result.startsWith('تم') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{result.startsWith('تم') ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{result}</div>}<button disabled={sending || !title.trim() || !message.trim()} onClick={sendNotification} className="w-full py-3.5 rounded-xl bg-blue-600 disabled:bg-gray-300 text-white font-black flex items-center justify-center gap-2">{sending ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإرسال...</> : <><Send className="w-4 h-4" /> إرسال الإشعار الآن</>}</button></div></div></div>}
    </>
  );
};
