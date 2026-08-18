import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Star,
  MapPin,
  BookOpen,
  PieChart as PieIcon,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { AdminUserAccount } from '../../types';

interface SiteAnalyticsPageProps {
  accounts: AdminUserAccount[];
}

const GOVERNORATES_DISTRIBUTION = [
  { governorate: 'القاهرة', users: 540, teachers: 65 },
  { governorate: 'الجيزة', users: 410, teachers: 48 },
  { governorate: 'الإسكندرية', users: 310, teachers: 36 },
  { governorate: 'الدقهلية', users: 220, teachers: 28 },
  { governorate: 'الشرقية', users: 190, teachers: 22 },
  { governorate: 'القليوبية', users: 160, teachers: 19 },
];

const MOST_SEARCHED_SUBJECTS = [
  { subject: 'الكيمياء', searches: 1420, tutorsAvailable: 42 },
  { subject: 'الفيزياء', searches: 1350, tutorsAvailable: 38 },
  { subject: 'اللغة الإنجليزية', searches: 1180, tutorsAvailable: 55 },
  { subject: 'الرياضيات (بحتة وتطبيقية)', searches: 1090, tutorsAvailable: 46 },
  { subject: 'الأحياء والجيولوجيا', searches: 940, tutorsAvailable: 31 },
  { subject: 'اللغة العربية', searches: 860, tutorsAvailable: 49 },
];

const MONTHLY_GROWTH_DETAILED = [
  { month: 'مايو', students: 340, teachers: 28, parents: 180 },
  { month: 'يونيو', students: 620, teachers: 45, parents: 310 },
  { month: 'يوليو', students: 980, teachers: 72, parents: 490 },
  { month: 'أغسطس (حالي)', students: 1450, teachers: 110, parents: 740 },
];

export const SiteAnalyticsPage: React.FC<SiteAnalyticsPageProps> = ({ accounts }) => {
  const verifiedTeachersCount = accounts.filter((a) => a.role === 'teacher' && a.badge === 'verified').length;
  const activeStudentsCount = accounts.filter((a) => a.role === 'student' && a.status === 'active').length;

  return (
    <div className="space-y-6 text-right font-['Tajawal',sans-serif]">
      
      {/* 1. Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
          إحصائيات المنصة الموسعة (Platform Analytics) 📈
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          تحليل نمو المستخدمين، التوزيع الجغرافي للمحافظات، والمواد الأكثر طلباً وبحثاً على مستوى الجمهورية.
        </p>
      </div>

      {/* 2. Top Summary KPI Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Verified Teachers */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500">إجمالي المدرسين الموثقين</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {verifiedTeachersCount > 0 ? verifiedTeachersCount : 110} مدرس
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">مفعلين ومعتمدين بالهوية الرقمية</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Active Students */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500">إجمالي الطلاب النشطين</span>
            <div className="text-2xl sm:text-3xl font-black text-[#2563EB] mt-1">
              {activeStudentsCount > 0 ? activeStudentsCount : 1450} طالب
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">مسجلين في مجموعات وسناتر نشطة</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* General Platform Rating */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500">متوسط التقييم العام للمنصة</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-1 flex items-baseline gap-1.5">
              <span>4.92</span>
              <span className="text-xs text-gray-400 font-normal">/ 5.0</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">بناء على 840+ مراجعة موثقة</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Star className="w-6 h-6 fill-amber-500" />
          </div>
        </div>

      </div>

      {/* 3. Detailed Growth Line Chart */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-[#1E3A8A]">
              نمو المستخدمين الشهري (Monthly User Growth by Role)
            </h3>
            <p className="text-xs text-gray-500">تتبع الإقبال التدريجي مع انطلاق العام الدراسي</p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MONTHLY_GROWTH_DETAILED} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
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
              <Legend />
              <Line type="monotone" dataKey="students" name="الطلاب" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="parents" name="أولياء الأمور" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="teachers" name="المدرسين" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Two Bar Charts: Governorates Distribution & Most Searched Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Governorates Distribution */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#1E3A8A]">توزيع المستخدمين حسب المحافظات</h4>
                <p className="text-[11px] text-gray-500">أكثر المحافظات نشاطاً على المنصة</p>
              </div>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={GOVERNORATES_DISTRIBUTION} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" />
                <XAxis dataKey="governorate" stroke="#94A3B8" fontSize={11} />
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
                <Bar dataKey="users" name="إجمالي المستخدمين" fill="#2563EB" radius={[8, 8, 0, 0]} />
                <Bar dataKey="teachers" name="المدرسين المعتمدين" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Searched Subjects */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#1E3A8A]">أكثر المواد الأكاديمية طلباً وبحثاً</h4>
                <p className="text-[11px] text-gray-500">معدلات البحث الأسبوعية من الطلاب</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {MOST_SEARCHED_SUBJECTS.map((item, idx) => (
              <div key={item.subject} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 text-gray-800">
                    <span className="w-5 text-gray-400 font-mono">#{idx + 1}</span>
                    <span>{item.subject}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                    <span>{item.tutorsAvailable} مدرس متاح</span>
                    <span className="text-[#2563EB] font-black">{item.searches} بحث</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                    style={{ width: `${(item.searches / 1500) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
