import React, { useMemo } from 'react';
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

export const SiteAnalyticsPage: React.FC<SiteAnalyticsPageProps> = ({ accounts }) => {
  const verifiedTeachersCount = accounts.filter((a) => a.role === 'teacher' && (a.badge === 'verified' || a.badge === 'super_tutor')).length;
  const totalTeachersCount = accounts.filter((a) => a.role === 'teacher').length;
  const activeStudentsCount = accounts.filter((a) => a.role === 'student' && a.status === 'active').length;
  const parentsCount = accounts.filter((a) => a.role === 'parent').length;
  const totalAccounts = accounts.length;

  // Compute real governorates distribution from actual registered accounts
  const governoratesDistribution = useMemo(() => {
    const map: { [gov: string]: { users: number; teachers: number } } = {};
    accounts.forEach((acc) => {
      const gov = acc.governorate || 'القاهرة';
      if (!map[gov]) {
        map[gov] = { users: 0, teachers: 0 };
      }
      map[gov].users += 1;
      if (acc.role === 'teacher') {
        map[gov].teachers += 1;
      }
    });

    const entries = Object.entries(map).map(([governorate, data]) => ({
      governorate,
      users: data.users,
      teachers: data.teachers,
    }));

    if (entries.length === 0) {
      return [
        { governorate: 'القاهرة', users: 0, teachers: 0 },
        { governorate: 'الجيزة', users: 0, teachers: 0 },
        { governorate: 'الإسكندرية', users: 0, teachers: 0 },
      ];
    }
    return entries;
  }, [accounts]);

  // Compute real subjects distribution from registered teachers
  const subjectsDistribution = useMemo(() => {
    const map: { [sub: string]: number } = {};
    accounts.filter((a) => a.role === 'teacher' && a.subject).forEach((t) => {
      const sub = t.subject!;
      map[sub] = (map[sub] || 0) + 1;
    });

    const entries = Object.entries(map).map(([subject, count]) => ({
      subject,
      tutorsAvailable: count,
    }));

    return entries;
  }, [accounts]);

  // Growth chart based on real data
  const monthlyGrowth = useMemo(() => {
    return [
      { month: 'بداية التشغيل', students: 0, teachers: 0, parents: 0 },
      { month: 'الشهر الحالي', students: activeStudentsCount, teachers: totalTeachersCount, parents: parentsCount },
    ];
  }, [activeStudentsCount, totalTeachersCount, parentsCount]);

  return (
    <div className="space-y-6 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">
      
      {/* 1. Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
          إحصائيات المنصة الموسعة (Platform Analytics) 📈
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          تحليل دقيق ومباشر لبيانات المستخدمين والمدرسين المسجلين في منصة حِصّتي.
        </p>
      </div>

      {/* 2. Top Summary KPI Numbers (Real Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Verified Teachers */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500">المدرسين الموثقين</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {verifiedTeachersCount} مدرس
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">من إجمالي {totalTeachersCount} مدرس مسجل</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Active Students */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500">الطلاب المسجلين</span>
            <div className="text-2xl sm:text-3xl font-black text-[#2563EB] mt-1">
              {activeStudentsCount} طالب
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">حسابات طلاب نشطة في النظام</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Registered Accounts */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500">إجمالي مستخدمي المنصة</span>
            <div className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1 flex items-baseline gap-1.5">
              <span>{totalAccounts}</span>
              <span className="text-xs text-gray-400 font-normal">مستخدم</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">يشمل الطلاب والمدرسين وأولياء الأمور</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Star className="w-6 h-6 fill-indigo-600" />
          </div>
        </div>

      </div>

      {/* 3. Detailed Growth Line Chart */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-[#1E3A8A]">
              نمو المستخدمين (User Growth by Role)
            </h3>
            <p className="text-xs text-gray-500">تتبع الإقبال الفعلي عبر فئات المنصة</p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
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

      {/* 4. Two Real Distribution Sections */}
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
                <p className="text-[11px] text-gray-500">وفق بيانات العناوين المسجلة للمستخدمين</p>
              </div>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={governoratesDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" />
                <XAxis dataKey="governorate" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
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
                <Bar dataKey="teachers" name="المدرسين" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Available Subjects */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#1E3A8A]">توزيع المواد للمدرسين المسجلين</h4>
                <p className="text-[11px] text-gray-500">المواد الدراسية المسجلة في حسابات المدرسين</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {subjectsDistribution.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                لا يوجد مدرسين مسجلين بمواد دراسية حتى الآن ✨
              </div>
            ) : (
              subjectsDistribution.map((item, idx) => (
                <div key={item.subject} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2 text-gray-800">
                      <span className="w-5 text-gray-400 font-mono">#{idx + 1}</span>
                      <span>{item.subject}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                      <span className="text-[#2563EB] font-black">{item.tutorsAvailable} مدرس مسجل</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                      style={{ width: `${Math.min(100, (item.tutorsAvailable / Math.max(1, totalTeachersCount)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
