import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  MessageCircle,
  Bell,
  ArrowLeft,
  DollarSign,
  MapPin,
  Sparkles,
  QrCode
} from 'lucide-react';
import { MOCK_CURRENT_STUDENT, MOCK_ATTENDANCE_RECORDS, SAMPLE_TUTORS } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';

interface ParentDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const ParentDashboardPage: React.FC<ParentDashboardPageProps> = ({
  onNavigate,
}) => {
  const student = MOCK_CURRENT_STUDENT;
  const recentActivities = MOCK_ATTENDANCE_RECORDS.slice(0, 4);

  return (
    <div className="space-y-8 text-right">
      
      {/* 1. Student Tracking Header */}
      <div className="bg-[#1E3A8A] text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <img
            src={student.avatarUrl}
            alt={student.name}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white ring-2 ring-blue-300 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full text-blue-100">
                متابعة الطالب
              </span>
              <span className="text-xs text-blue-200">{student.grade}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {student.name}
            </h2>
            <p className="text-xs text-blue-200 mt-1">
              كود البطاقة المربوطة: <strong className="font-mono text-white">{student.qrCode}</strong>
            </p>
          </div>
        </div>

        {/* WhatsApp Alert Status Pill */}
        <div className="bg-white/10 border border-white/20 p-4 rounded-2xl flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-300 block">إشعارات الواتساب نشطة ✓</span>
            <span className="text-[11px] text-blue-100 font-mono">01234567890</span>
          </div>
        </div>
      </div>

      {/* 2. Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">عدد المدرسين المتابعين</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1E3A8A]">3 مدرسين</p>
          <span className="text-[11px] text-[#2563EB] font-bold">كيمياء، فيزياء، لغة عربية</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">نسبة حضور الابن</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#10B981]">95%</p>
          <span className="text-[11px] text-[#6B7280]">19 حضور من أصل 20 حصة</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">آخر تسجيل حضور</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-[#1E3A8A]">كيمياء — أمس</p>
          <span className="text-[11px] text-[#10B981] font-bold">تم المسح الساعة 04:32 م</span>
        </div>

      </div>

      {/* 3. Real-Time Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Live Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <span>سجل النشاط والحضور اللحظي</span>
            </h3>
            <button
              onClick={() => onNavigate('/parent/attendance')}
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>عرض سجل الحضور الكامل</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 divide-y divide-gray-100 shadow-xs">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      act.status === 'present'
                        ? 'bg-emerald-50 text-[#10B981]'
                        : 'bg-red-50 text-[#EF4444]'
                    }`}
                  >
                    {act.status === 'present' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>

                  <div>
                    <h4 className="font-bold text-[#1E3A8A] text-sm">
                      {act.status === 'present' ? 'حضر بنجاح: ' : 'غياب: '}
                      {act.subject} مع {act.tutorName}
                    </h4>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      {act.center} — مسح كود الـ QR الساعة {act.time}
                    </p>
                    <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                      {act.date}
                    </span>
                  </div>
                </div>

                <Badge variant={act.status === 'present' ? 'success' : 'danger'} size="sm">
                  {act.status === 'present' ? 'حاضر ✓' : 'غائب'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Quick Links */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#1E3A8A]">إجراءات سريعة</h3>

          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 space-y-3 shadow-xs">
            <button
              onClick={() => onNavigate('/parent/attendance')}
              className="w-full p-3.5 bg-gray-50 hover:bg-[#EFF6FF] text-right rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-[#1E3A8A] block">سجل الحضور الشهري</span>
                <span className="text-[10px] text-[#6B7280]">كافة التواريخ وأوقات المسح</span>
              </div>
              <ArrowLeft className="w-4 h-4 text-[#2563EB]" />
            </button>

            <button
              onClick={() => onNavigate('/parent/payments')}
              className="w-full p-3.5 bg-gray-50 hover:bg-[#EFF6FF] text-right rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-[#1E3A8A] block">سجل المدفوعات والفواتير</span>
                <span className="text-[10px] text-[#6B7280]">الإيصالات الشهرية لجميع المعلمين</span>
              </div>
              <ArrowLeft className="w-4 h-4 text-[#2563EB]" />
            </button>

            <button
              onClick={() => onNavigate('/parent/settings')}
              className="w-full p-3.5 bg-gray-50 hover:bg-[#EFF6FF] text-right rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-[#1E3A8A] block">إعدادات إشعارات الواتساب</span>
                <span className="text-[10px] text-[#6B7280]">تخصيص التنبيهات والأرقام</span>
              </div>
              <ArrowLeft className="w-4 h-4 text-[#2563EB]" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
