import React from 'react';
import {
  Users,
  ScanLine,
  Layers,
  Star,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  ArrowLeft,
  Calendar,
  Sparkles,
  QrCode
} from 'lucide-react';
import { MOCK_TEACHER_STUDENTS, MOCK_TEACHER_GROUPS } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';
import { TeacherAttendanceChart } from '../../components/teacher/TeacherAttendanceChart';

interface TeacherDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const TeacherDashboardPage: React.FC<TeacherDashboardPageProps> = ({
  onNavigate,
}) => {
  return (
    <div className="space-y-8 text-right">
      
      {/* 1. Welcome & Fast Scan Hero Card */}
      <div className="bg-[#1E3A8A] text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center lg:text-right">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 px-3 py-1 rounded-full text-blue-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>لوحة المعلم المعتمد</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            أهلاً بك، أستاذ حسام إبراهيم 👋
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            مادة الكيمياء للثانوية العامة — لديك اليوم <strong className="text-white font-bold">28 طالب</strong> حاضرين في سنتر الأهرام.
          </p>
        </div>

        {/* Big Actions: Open QR Hub for Attendance, Add Student & Confirm Fees */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => onNavigate('/teacher/scan')}
            className="w-full sm:w-auto px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ScanLine className="w-5 h-5" />
            <span>تسجيل حضور (QR)</span>
          </button>

          <button
            onClick={() => onNavigate('/teacher/scan')}
            className="w-full sm:w-auto px-4 py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>إضافة طالب بالـ QR</span>
          </button>

          <button
            onClick={() => onNavigate('/teacher/scan')}
            className="w-full sm:w-auto px-4 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <DollarSign className="w-4 h-4" />
            <span>تأكيد سداد قسط (QR)</span>
          </button>
        </div>
      </div>

      {/* 2. Key Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">إجمالي الطلاب</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1E3A8A]">310 طالب</p>
          <span className="text-[10px] text-[#10B981] font-bold">شريحة العمولة: 1.0% فقط</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">حضور اليوم</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#10B981]">28 طالب</p>
          <span className="text-[10px] text-[#6B7280]">مجموعة السبت (سنتر الأهرام)</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">أرباح الشهر المتوقعة</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-[#1E3A8A] font-mono">37,200 ج.م</p>
          <span className="text-[10px] text-emerald-700 font-bold">صافي بعد عمولة 1%</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">متوسط التقييم</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1E3A8A]">4.9 / 5.0</p>
          <span className="text-[10px] text-[#6B7280]">من 128 تقييم حقيقي</span>
        </div>

      </div>

      {/* 3. Monthly Sessions & Attendance Analytics (Recharts) */}
      <TeacherAttendanceChart />

      {/* 4. Live Check-Ins & Groups Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Live Check-in Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <span>آخر عمليات تسجيل الحضور بالـ QR اليوم</span>
            </h3>
            <button
              onClick={() => onNavigate('/teacher/scan')}
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>فتح الكاميرا والمسح</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 divide-y divide-gray-100 shadow-xs">
            {MOCK_TEACHER_STUDENTS.slice(0, 4).map((student) => (
              <div key={student.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={student.avatarUrl}
                    alt={student.name}
                    className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-bold text-[#1E3A8A] text-sm">{student.name}</h4>
                    <p className="text-[11px] text-[#6B7280]">
                      {student.groupName} — كود: <span className="font-mono text-[#2563EB]">{student.qrCode}</span>
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <Badge variant={student.attendanceRate >= 90 ? 'success' : 'warning'} size="sm">
                    حضور {student.attendanceRate}%
                  </Badge>
                  <span className="text-[10px] text-gray-400 block mt-1">تم مسح الكود اليوم ✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Groups List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2563EB]" />
              <span>مجموعاتي الحالية</span>
            </h3>
            <button
              onClick={() => onNavigate('/teacher/groups')}
              className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
            >
              إدارة
            </button>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 space-y-3 shadow-xs">
            {MOCK_TEACHER_GROUPS.map((group) => (
              <div
                key={group.id}
                className="p-3 rounded-2xl border border-gray-100 bg-gray-50/70 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#1E3A8A]">{group.name}</h4>
                  <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-md">
                    {group.currentStudents}/{group.maxCapacity} طالب
                  </span>
                </div>
                <div className="text-[11px] text-[#6B7280]">
                  {group.schedule} ({group.location})
                </div>
              </div>
            ))}

            <button
              onClick={() => onNavigate('/teacher/groups')}
              className="w-full py-2.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء مجموعة جديدة</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
