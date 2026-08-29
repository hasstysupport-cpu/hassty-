import React, { useState } from 'react';
import { AlertOctagon, CheckCircle2, XCircle, Search, UserX, Phone, Calendar, ShieldAlert, X, MessageCircle, Ticket } from 'lucide-react';
import { AdminSafetyReport } from '../../types';
import { SupportTicketsPage } from './SupportTicketsPage';

interface SafetyReportsPageProps {
  reports: AdminSafetyReport[];
  onSuspendTeacher: (teacherId: string, reportId: string) => void;
  onResolveReport: (reportId: string) => void;
  onDismissReport: (reportId: string) => void;
}

export const SafetyReportsPage: React.FC<SafetyReportsPageProps> = ({ reports, onSuspendTeacher, onResolveReport, onDismissReport }) => {
  const [section, setSection] = useState<'reports' | 'tickets'>('reports');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'in_review' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [suspendModalReport, setSuspendModalReport] = useState<AdminSafetyReport | null>(null);

  const filteredReports = reports.filter((r) => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || r.targetTeacherName.toLowerCase().includes(q) || r.reporterName.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.reporterPhone.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  const getCategoryLabel = (category: AdminSafetyReport['category']) => {
    switch (category) {
      case 'external_payment_demand': return 'طلب تحويلات خارجية غير مسجلة 💸';
      case 'absence_no_notice': return 'غياب مفاجئ بدون إشعار للطلاب ⏱️';
      case 'inappropriate_conduct': return 'سلوك أو أسلوب غير لائق ⚠️';
      case 'verbal_abuse': return 'إساءة لفظية أو تجاوز 🚫';
      default: return 'شكوى إدارية أو عامة 📋';
    }
  };

  return (
    <div className="space-y-6 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">
      <div className="bg-white border border-gray-200 rounded-3xl p-3 flex flex-col sm:flex-row gap-2">
        <button onClick={() => setSection('reports')} className={`flex-1 px-4 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${section === 'reports' ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}><AlertOctagon className="w-4 h-4" /> البلاغات والشكاوى</button>
        <button onClick={() => setSection('tickets')} className={`flex-1 px-4 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${section === 'tickets' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}><Ticket className="w-4 h-4" /> تذاكر دعم العملاء</button>
      </div>

      {section === 'tickets' ? <SupportTicketsPage /> : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">سجل البلاغات والشكاوى 🚨</h2><p className="text-xs text-gray-500 mt-0.5">متابعة فورية للبلاغات المقدمة من الطلاب وأولياء الأمور ضد المدرسين المخالفين.</p></div>
            <span className="px-3.5 py-1.5 rounded-2xl text-xs font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1.5"><AlertOctagon className="w-4 h-4 text-red-600" /><span>{reports.filter(r => r.status === 'new').length} بلاغات جديدة</span></span>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80"><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ابحث بالمعلم، مقدم البلاغ، أو التفاصيل..." className="w-full text-right pr-9 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all" /><Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" /></div>
            <div className="flex flex-wrap items-center gap-2">{[
              { id: 'all', label: 'كل البلاغات' }, { id: 'new', label: 'جديد' }, { id: 'in_review', label: 'قيد المراجعة' }, { id: 'resolved', label: 'تم الحل' },
            ].map((tab) => <button key={tab.id} onClick={() => setStatusFilter(tab.id as any)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${statusFilter === tab.id ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{tab.label}</button>)}</div>
          </div>

          <div className="space-y-4">
            {filteredReports.length === 0 ? <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center text-gray-400 space-y-2 shadow-xs"><CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" /><p className="text-sm font-bold text-gray-600">لا توجد بلاغات تطابق الخيارات الحالية</p><p className="text-xs text-gray-400">سجل الأمان خالٍ من الشكاوى المعلقة</p></div> : filteredReports.map((report) => (
              <div key={report.id} className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-xs transition-all space-y-4 ${report.status === 'new' ? 'border-red-300 ring-2 ring-red-100/50' : 'border-gray-200'}`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${report.status === 'new' ? 'bg-red-100 text-red-800' : report.status === 'in_review' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{report.status === 'new' ? '🚨 بلاغ جديد' : report.status === 'in_review' ? '🔍 قيد المراجعة' : '✅ تم الحل'}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800">{getCategoryLabel(report.category)}</span>
                      <span className="text-xs text-gray-400 font-mono flex items-center gap-1"><Calendar className="w-3 h-3" />{report.createdAt}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold"><div className="text-gray-900">المعلم المشكو في حقه: <span className="text-red-700 font-black">{report.targetTeacherName}</span></div><span className="text-gray-300">|</span><div className="text-gray-600">مقدم البلاغ: <span className="text-gray-900 font-bold">{report.reporterName}</span> ({report.reporterRole === 'student' ? 'طالب' : 'ولي أمر'})</div><span className="text-gray-300">|</span><div className="text-gray-500 font-mono flex items-center gap-1"><Phone className="w-3 h-3" />{report.reporterPhone}</div></div>
                    <div className="p-4 bg-red-50/40 border border-red-100 rounded-2xl text-xs text-gray-800 leading-relaxed"><span className="font-bold text-red-900 block">تفاصيل الشكوى:</span><p className="mt-1">{report.description}</p></div>
                    {report.teacherSuspended && <div className="p-2.5 bg-red-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> تم إيقاف حساب هذا المدرس بناءً على البلاغ 🔒</div>}
                  </div>
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                    {!report.teacherSuspended && <button onClick={() => setSuspendModalReport(report)} className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"><UserX className="w-4 h-4" /><span>إيقاف حساب المدرس</span></button>}
                    {report.status !== 'resolved' && <button onClick={() => onResolveReport(report.id)} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"><CheckCircle2 className="w-4 h-4" /><span>تحديد كمحلول</span></button>}
                    {report.status !== 'resolved' && <button onClick={() => onDismissReport(report.id)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"><XCircle className="w-3.5 h-3.5" /><span>رفض البلاغ</span></button>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {suspendModalReport && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"><div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-red-300 text-right"><div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto"><UserX className="w-7 h-7" /></div><div className="text-center space-y-1.5"><h3 className="text-base font-black text-gray-900">إيقاف حساب المعلم فوراً؟</h3><p className="text-xs text-gray-600">أنت على وشك إيقاف حساب المعلم <strong className="text-red-600">{suspendModalReport.targetTeacherName}</strong>.</p></div><div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-[11px] text-red-800"><span className="font-bold">مضمون البلاغ:</span><p className="mt-1 line-clamp-3">{suspendModalReport.description}</p></div><div className="grid grid-cols-2 gap-2"><button onClick={() => { onSuspendTeacher(suspendModalReport.targetTeacherId, suspendModalReport.id); setSuspendModalReport(null); }} className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black cursor-pointer">نعم، أوقف الحساب</button><button onClick={() => setSuspendModalReport(null)} className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer">إلغاء</button></div></div></div>}
        </>
      )}
    </div>
  );
};
