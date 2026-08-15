import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { MOCK_TEACHER_STUDENTS } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';

interface TeacherPaymentsPageProps {
  onNavigate?: (path: string) => void;
}

export const TeacherPaymentsPage: React.FC<TeacherPaymentsPageProps> = ({ onNavigate }) => {
  const [downloadedInvoice, setDownloadedInvoice] = useState<string | null>(null);

  const totalStudents = 310;
  const pricePerStudent = 120; // 120 EGP/session or month
  const totalRevenue = 37200; // 37,200 EGP
  const commissionTier = '1.0%'; // For 300+ students tier
  const platformFee = 372; // 372 EGP
  const netEarnings = totalRevenue - platformFee; // 36,828 EGP

  const handleDownloadInvoice = (id: string) => {
    setDownloadedInvoice(id);
    setTimeout(() => setDownloadedInvoice(null), 2500);
  };

  return (
    <div className="space-y-8 text-right">
      
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            <span>الأرباح والعمولة التدريجية</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            المستحقات المالية وحساب العمولة
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            نظام عمولة عادل وتدريجي — كلما زاد عدد طلابك تنخفض نسبة العمولة حتى تصل إلى 1% فقط
          </p>
        </div>

        <button
          onClick={() => onNavigate && onNavigate('/teacher/scan')}
          className="px-5 py-3 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-2.5 cursor-pointer active:scale-95 shrink-0"
        >
          <Receipt className="w-4 h-4 text-emerald-400" />
          <span>تأكيد تحصيل قسط بمسح الـ QR</span>
        </button>
      </div>

      {/* Tiered Commission Breakdown Box */}
      <div className="bg-gradient-to-l from-[#1E3A8A] to-[#2563EB] text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full text-blue-100">
              الشريحة الحالية: الممتازة (300+ طالب)
            </span>
            <h3 className="text-xl sm:text-2xl font-black mt-2">
              عمولة المنصة المطبقة عليك: <span className="text-emerald-300 font-mono">1.0% فقط</span>
            </h3>
          </div>
          <Badge variant="success" size="lg">أعلى شريحة توفير ✓</Badge>
        </div>

        {/* 4 Tier Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[11px] text-blue-200 block">1 - 50 طالب</span>
            <strong className="text-base font-black font-mono">5.0%</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[11px] text-blue-200 block">51 - 150 طالب</span>
            <strong className="text-base font-black font-mono">3.0%</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[11px] text-blue-200 block">151 - 300 طالب</span>
            <strong className="text-base font-black font-mono">2.0%</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/30 border-2 border-emerald-400">
            <span className="text-[11px] text-emerald-200 block">300+ طالب (شريحتك)</span>
            <strong className="text-base font-black font-mono text-emerald-300">1.0% ✓</strong>
          </div>
        </div>

        {/* Current Month Net Summary */}
        <div className="p-4 bg-white/10 rounded-2xl border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-blue-200">إجمالي إيراد شهر أغسطس (310 طالب): </span>
            <strong className="font-mono text-white font-black">{totalRevenue.toLocaleString()} ج.م</strong>
          </div>
          <div>
            <span className="text-blue-200">عمولة المنصة (1%): </span>
            <strong className="font-mono text-emerald-300 font-black">-{platformFee} ج.م</strong>
          </div>
          <div>
            <span className="text-blue-200">صافي أرباحك: </span>
            <strong className="font-mono text-white font-black text-sm">{netEarnings.toLocaleString()} ج.م</strong>
          </div>
        </div>
      </div>

      {/* Student Payments Ledger Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#1E3A8A]">سجل اشتراكات الطلاب لشهر أغسطس</h3>
          <span className="text-xs text-[#6B7280]">
            تم سداد <strong className="text-[#10B981]">298</strong> من أصل 310 طالب
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-bold text-[#1E3A8A]">
                <th className="py-3 px-4 rounded-r-xl">الطالب</th>
                <th className="py-3 px-4">المجموعة</th>
                <th className="py-3 px-4">قيمة الاشتراك</th>
                <th className="py-3 px-4">تاريخ السداد</th>
                <th className="py-3 px-4">حالة السداد</th>
                <th className="py-3 px-4 rounded-l-xl">الإيصال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-[#1F2937]">
              {MOCK_TEACHER_STUDENTS.map((std) => (
                <tr key={std.id} className="hover:bg-[#F8FAFF] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#1E3A8A]">
                    {std.name}
                  </td>
                  <td className="py-3.5 px-4 text-[#4B5563]">
                    {std.groupName}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#1E3A8A]">
                    120 ج.م
                  </td>
                  <td className="py-3.5 px-4 text-[#6B7280]">
                    2026-08-05
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={std.paymentStatus === 'paid' ? 'success' : 'danger'} size="sm">
                      {std.paymentStatus === 'paid' ? 'مسدد ✓' : 'متأخر ✗'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleDownloadInvoice(std.id)}
                      className="px-3 py-1.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloadedInvoice === std.id ? 'تم التحميل ✓' : 'إيصال'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
