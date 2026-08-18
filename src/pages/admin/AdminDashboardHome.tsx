import React from 'react';
import {
  Users,
  Eye,
  ShieldCheck,
  AlertOctagon,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Calendar,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import { AdminUserAccount, TeacherVerificationRequest, AdminSafetyReport } from '../../types';
import { AccountBadge } from '../../components/admin/AccountBadge';
import { AdminTab } from '../../components/admin/AdminSidebar';

interface AdminDashboardHomeProps {
  accounts: AdminUserAccount[];
  verificationRequests: TeacherVerificationRequest[];
  safetyReports: AdminSafetyReport[];
  onNavigateTab: (tab: AdminTab) => void;
}

const SIGNUPS_GROWTH_DATA = [
  { week: 'الأسبوع 1', students: 120, parents: 65, teachers: 18 },
  { week: 'الأسبوع 2', students: 185, parents: 98, teachers: 26 },
  { week: 'الأسبوع 3', students: 260, parents: 140, teachers: 34 },
  { week: 'الأسبوع 4', students: 390, parents: 210, teachers: 48 },
];

export const AdminDashboardHome: React.FC<AdminDashboardHomeProps> = ({
  accounts,
  verificationRequests,
  safetyReports,
  onNavigateTab,
}) => {
  const pendingVerifications = verificationRequests.filter((v) => v.status === 'pending');
  const pendingReports = safetyReports.filter((r) => r.status === 'new' || r.status === 'in_review');

  const studentsCount = accounts.filter((a) => a.role === 'student').length;
  const parentsCount = accounts.filter((a) => a.role === 'parent').length;
  const teachersCount = accounts.filter((a) => a.role === 'teacher').length;

  return (
    <div className="space-y-6 text-right font-['Tajawal',sans-serif]">
      
      {/* 1. Header Banner */}
      <div className="bg-[#1E3A8A] text-white rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold bg-blue-500/40 text-blue-100 px-3 py-0.5 rounded-full border border-blue-400/30">
              Hassty Central Admin Engine
            </span>
            <span className="text-xs text-blue-200">تحديث فوري للبيانات</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            نظرة عامة على نشاط المنصة 📊
          </h2>
          <p className="text-xs text-blue-200 mt-1 max-w-xl">
            متابعة حركة التسجيلات، تدقيق هويات المدرسين المعلقة، ومراقبة أمان المنصة في المحافظات المصرية.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => onNavigateTab('verification')}
            className="w-full md:w-auto px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>طلبات التوثيق ({pendingVerifications.length})</span>
          </button>

          <button
            onClick={() => onNavigateTab('reports')}
            className="w-full md:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>البلاغات ({pendingReports.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Top Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Total Page Views */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">إجمالي الزيارات (الشهر)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#1E3A8A]">48,920</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +18.4%
            </span>
          </div>
          <p className="text-[10px] text-gray-400">زيارات محرك بحث المدرسين والسناتر</p>
        </div>

        {/* Signups Breakdown */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">تسجيلات جديدة (هذا الأسبوع)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#1E3A8A] flex items-center gap-2">
            <span>+{studentsCount + parentsCount + teachersCount}</span>
            <span className="text-xs font-normal text-gray-500">حساب</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold">
            <span className="text-blue-600">{studentsCount} طالب</span>
            <span className="text-gray-300">|</span>
            <span className="text-amber-600">{parentsCount} ولي أمر</span>
            <span className="text-gray-300">|</span>
            <span className="text-emerald-600">{teachersCount} مدرس</span>
          </div>
        </div>

        {/* Pending Teacher Verifications */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">توثيق مدرسين معلق</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">
              {pendingVerifications.length}
            </span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              بانتظار المراجعة
            </span>
          </div>
          <p className="text-[10px] text-gray-400">بطاقات رقم قومي وشهادات معلقة</p>
        </div>

        {/* Pending Safety Reports */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">بلاغات معلقة</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-red-600">
              {pendingReports.length}
            </span>
            <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
              تتطلب تدخلاً
            </span>
          </div>
          <p className="text-[10px] text-gray-400">شكاوى سوء سلوك أو مدفوعات خارجية</p>
        </div>
      </div>

      {/* 3. Main Chart: Growth Over Time */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-[#1E3A8A]">
              معدل نمو التسجيلات الأسبوعي (Growth Trends)
            </h3>
            <p className="text-xs text-gray-500">توزيع الحسابات الجديدة عبر فئات المنصة الثلاث</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="w-3 h-3 rounded-full bg-blue-600" /> طلاب
            </span>
            <span className="flex items-center gap-1.5 text-amber-500">
              <span className="w-3 h-3 rounded-full bg-amber-500" /> أولياء أمور
            </span>
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-3 h-3 rounded-full bg-emerald-500" /> مدرسين
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SIGNUPS_GROWTH_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorParents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="week" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '16px',
                  color: '#fff',
                  textAlign: 'right',
                  fontSize: '12px'
                }}
              />
              <Area type="monotone" dataKey="students" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStudents)" name="الطلاب" />
              <Area type="monotone" dataKey="parents" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorParents)" name="أولياء الأمور" />
              <Area type="monotone" dataKey="teachers" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorTeachers)" name="المدرسين" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Two Quick Access Lists: Verification Queue & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Quick Verification Queue */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#1E3A8A]">آخر طلبات توثيق المدرسين</h4>
                <p className="text-[11px] text-gray-500">طلبات جديدة عبر بوت التليجرام/الواتساب</p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('verification')}
              className="text-xs font-bold text-[#2563EB] hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <span>عرض الكل ({pendingVerifications.length})</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingVerifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl">
                لا توجد طلبات توثيق معلقة حالياً ✨
              </div>
            ) : (
              pendingVerifications.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-gray-50/80 hover:bg-blue-50/50 border border-gray-200 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.idCardImageUrl}
                      alt="National ID Preview"
                      className="w-10 h-10 rounded-xl object-cover border border-gray-300"
                    />
                    <div>
                      <h5 className="text-xs font-black text-[#1E3A8A]">{item.teacherName}</h5>
                      <p className="text-[11px] text-gray-500">
                        {item.subject} • {item.governorate} ({item.area})
                      </p>
                      <span className="text-[10px] text-gray-400 font-mono">{item.submittedAt}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateTab('verification')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    مراجعة الطلب
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Safety Reports */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#1E3A8A]">آخر البلاغات والشكاوى</h4>
                <p className="text-[11px] text-gray-500">بلاغات الأمان وسلوك المدرسين</p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
            >
              <span>عرض البلاغات ({pendingReports.length})</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {safetyReports.slice(0, 3).map((rep) => (
              <div
                key={rep.id}
                className="p-3.5 rounded-2xl bg-gray-50/80 hover:bg-red-50/40 border border-gray-200 transition-colors flex items-center justify-between gap-3"
              >
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rep.status === 'new' ? 'bg-red-100 text-red-800' :
                      rep.status === 'in_review' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {rep.status === 'new' ? 'جديد' : rep.status === 'in_review' ? 'قيد المراجعة' : 'تم الحل'}
                    </span>
                    <span className="text-xs font-black text-gray-800 truncate">
                      ضد: {rep.targetTeacherName}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 line-clamp-1">
                    {rep.description}
                  </p>
                  <span className="text-[10px] text-gray-400">بواسطة: {rep.reporterName} • {rep.createdAt}</span>
                </div>

                <button
                  onClick={() => onNavigateTab('reports')}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  تدقيق
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
