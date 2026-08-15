import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { TrendingUp, Calendar, Users, BarChart3, CheckCircle2 } from 'lucide-react';

interface MonthlyPerformanceData {
  month: string;
  sessions: number;
  attendanceRate: number;
  studentsAttended: number;
}

const MONTHLY_DATA: MonthlyPerformanceData[] = [
  { month: 'أكتوبر', sessions: 22, attendanceRate: 88, studentsAttended: 620 },
  { month: 'نوفمبر', sessions: 26, attendanceRate: 91, studentsAttended: 740 },
  { month: 'ديسمبر', sessions: 28, attendanceRate: 89, studentsAttended: 810 },
  { month: 'يناير', sessions: 24, attendanceRate: 93, studentsAttended: 760 },
  { month: 'فبراير', sessions: 30, attendanceRate: 95, studentsAttended: 910 },
  { month: 'مارس (الحالي)', sessions: 34, attendanceRate: 96, studentsAttended: 1040 },
];

export const TeacherAttendanceChart: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<'all' | 'sessions' | 'attendance'>('all');

  // Calculate high-level summary
  const totalSessions = MONTHLY_DATA.reduce((acc, curr) => acc + curr.sessions, 0);
  const avgAttendance = Math.round(
    MONTHLY_DATA.reduce((acc, curr) => acc + curr.attendanceRate, 0) / MONTHLY_DATA.length
  );
  const currentMonth = MONTHLY_DATA[MONTHLY_DATA.length - 1];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-gray-100 text-right min-w-[170px] space-y-2">
          <p className="font-black text-sm text-[#1E3A8A] border-b border-gray-100 pb-1.5 flex items-center justify-between">
            <span>{label}</span>
            <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
          </p>
          
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-4 text-[#2563EB]">
              <span className="font-bold font-mono">{payload[0]?.value} حصة</span>
              <span className="text-gray-500 font-medium">عدد الحصص:</span>
            </div>
            {payload[1] && (
              <div className="flex items-center justify-between gap-4 text-emerald-600">
                <span className="font-bold font-mono">{payload[1]?.value}%</span>
                <span className="text-gray-500 font-medium">نسبة الحضور:</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 sm:p-6 shadow-xs space-y-6 text-right">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#1E3A8A] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#2563EB]" />
            <span>إحصائيات الحصص ونسبة حضور الطلاب الشهرية</span>
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            متابعة دقيقة لعدد الحصص المنفذة والتزام الطلاب بالحضور على مدار الشهور الأخيرة
          </p>
        </div>

        {/* Metric Quick Toggles */}
        <div className="flex items-center bg-gray-100/80 p-1 rounded-xl text-xs font-bold gap-1 self-stretch sm:self-auto justify-end">
          <button
            onClick={() => setActiveMetric('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeMetric === 'all'
                ? 'bg-white text-[#1E3A8A] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setActiveMetric('sessions')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeMetric === 'sessions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            الحصص
          </button>
          <button
            onClick={() => setActiveMetric('attendance')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeMetric === 'attendance'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            نسبة الحضور
          </button>
        </div>
      </div>

      {/* Mini KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-blue-50/50 border border-blue-100/70 rounded-2xl p-3.5">
        <div className="space-y-0.5">
          <span className="text-[11px] text-gray-500 font-medium">حصص هذا الشهر:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg font-black text-[#1E3A8A] font-mono">{currentMonth.sessions}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +13%
            </span>
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] text-gray-500 font-medium">متوسط نسبة الحضور:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg font-black text-[#10B981] font-mono">{currentMonth.attendanceRate}%</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">ممتاز</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-0.5">
          <span className="text-[11px] text-gray-500 font-medium">إجمالي الحصص (آخر 6 شهور):</span>
          <p className="text-base sm:text-lg font-black text-[#1E3A8A] font-mono">{totalSessions} حصة</p>
        </div>
      </div>

      {/* Recharts Graphical Visualization */}
      <div className="w-full h-72 sm:h-80 pt-2" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={MONTHLY_DATA}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            
            <XAxis
              dataKey="month"
              tick={{ fill: '#4B5563', fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            
            {/* Left YAxis for Attendance Rate % */}
            <YAxis
              yAxisId="left"
              domain={[60, 100]}
              tick={{ fill: '#059669', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />

            {/* Right YAxis for Session Count */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 45]}
              tick={{ fill: '#2563EB', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              unit="ح"
            />

            <Tooltip content={<CustomTooltip />} />
            
            <Legend
              wrapperStyle={{ paddingTop: '14px', fontSize: '12px', fontWeight: 'bold' }}
              formatter={(value) => {
                if (value === 'sessions') return 'عدد الحصص الشهرية';
                if (value === 'attendanceRate') return 'نسبة حضور الطلاب (%)';
                return value;
              }}
            />

            {/* Sessions Bar */}
            {(activeMetric === 'all' || activeMetric === 'sessions') && (
              <Bar
                yAxisId="right"
                dataKey="sessions"
                name="sessions"
                fill="#3B82F6"
                radius={[8, 8, 0, 0]}
                barSize={28}
              />
            )}

            {/* Attendance Rate Line */}
            {(activeMetric === 'all' || activeMetric === 'attendance') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="attendanceRate"
                name="attendanceRate"
                stroke="#10B981"
                strokeWidth={3.5}
                dot={{ r: 4.5, fill: '#10B981', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#059669', stroke: '#ffffff', strokeWidth: 2.5 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
