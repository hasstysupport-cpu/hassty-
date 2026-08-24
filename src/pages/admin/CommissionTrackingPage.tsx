import React, { useState } from 'react';
import {
  Percent,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  TrendingUp,
  CreditCard,
  Download,
  Calendar,
  Send
} from 'lucide-react';
import { TeacherCommissionTrackingItem } from '../../types';

interface CommissionTrackingPageProps {
  commissions: TeacherCommissionTrackingItem[];
  onMarkPaid: (id: string) => void;
}

export const CommissionTrackingPage: React.FC<CommissionTrackingPageProps> = ({
  commissions,
  onMarkPaid,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'overdue' | 'pending'>('all');

  const filteredCommissions = commissions.filter((c) => {
    const matchStatus = statusFilter === 'all' || c.paymentStatus === statusFilter;
    const matchSearch =
      c.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalDueEgp = commissions.reduce((sum, c) => sum + c.dueCommissionEgp, 0);
  const totalCollectedEgp = commissions
    .filter((c) => c.paymentStatus === 'paid')
    .reduce((sum, c) => sum + c.dueCommissionEgp, 0);
  const totalOverdueEgp = commissions
    .filter((c) => c.paymentStatus === 'overdue')
    .reduce((sum, c) => sum + c.dueCommissionEgp, 0);

  return (
    <div className="space-y-6 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            متابعة العمولات والتحصيلات (Commission Tracking) 💰
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            تتبع اشتراكات وعمولات المدرسين الشهرية وفق جدول الشرائح التصاعدي مع رصد السداد والمتأخرات.
          </p>
        </div>

        <div className="text-xs font-bold text-gray-700 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>دورة الفوترة: <strong className="text-blue-900 font-black">أغسطس 2026</strong></span>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Total Monthly Due */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">إجمالي العمولات المستحقة</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1E3A8A]">
            {totalDueEgp.toLocaleString()} ج.م
          </div>
          <p className="text-[10px] text-gray-400">إجمالي مستحقات المنصة عن شهر أغسطس</p>
        </div>

        {/* Total Collected */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">تم تحصيله (سداد فعلي)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {totalCollectedEgp.toLocaleString()} ج.م
          </div>
          <p className="text-[10px] text-gray-400">محصلة عبر فودافون كاش / إنستاباي / بطاقات</p>
        </div>

        {/* Overdue */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">متأخرات قيد المتابعة</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600">
            {totalOverdueEgp.toLocaleString()} ج.م
          </div>
          <p className="text-[10px] text-gray-400">تتطلب إشعار واتساب تذكيري للمعلم</p>
        </div>

      </div>

      {/* 3. Progressive Commission Tier Notice */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl text-xs text-blue-900 space-y-1">
        <div className="flex items-center gap-2 font-black">
          <Percent className="w-4 h-4 text-blue-600" />
          <span>جدول الشرائح التصاعدي لعمولات حِصّتي:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-blue-800">
          <div className="bg-white/80 p-2 rounded-xl border border-blue-100">
            • الشريحة الأولى (1 - 149 طالب): <strong>2.0%</strong>
          </div>
          <div className="bg-white/80 p-2 rounded-xl border border-blue-100">
            • الشريحة الثانية (150 - 299 طالب): <strong>1.25% - 1.5%</strong>
          </div>
          <div className="bg-white/80 p-2 rounded-xl border border-blue-100">
            • الشريحة الذهبية (300+ طالب): <strong>1.0%</strong>
          </div>
        </div>
      </div>

      {/* 4. Filters & Search */}
      <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم المدرس أو المادة..."
            className="w-full text-right pr-9 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'كل الحالات' },
            { id: 'overdue', label: 'متأخر (Overdue) ⚠️' },
            { id: 'pending', label: 'قيد الانتظار' },
            { id: 'paid', label: 'مدفوع (Paid) ✓' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Commissions Table */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4">المعلم والمادة</th>
                <th className="py-3.5 px-4">الطلاب الفعالين</th>
                <th className="py-3.5 px-4">إجمالي التحصيل الشهري</th>
                <th className="py-3.5 px-4">نسبة الشريحة</th>
                <th className="py-3.5 px-4">المستحق للمنصة</th>
                <th className="py-3.5 px-4">حالة السداد</th>
                <th className="py-3.5 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    لا توجد بيانات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                    
                    <td className="py-3.5 px-4 font-bold text-[#1E3A8A]">
                      <div>
                        <p>{item.teacherName}</p>
                        <span className="text-[10px] text-gray-400 font-normal">{item.subject}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-gray-800">
                      {item.activeStudentsCount} طالب
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gray-700">
                      {item.monthlyGrossEgp.toLocaleString()} ج.م
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {item.tierRate}%
                    </td>

                    <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm">
                      {item.dueCommissionEgp} ج.م
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        item.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        item.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {item.paymentStatus === 'paid' ? 'تم السداد ✓' : item.paymentStatus === 'overdue' ? 'متأخر ⚠️' : 'قيد التحصيل'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {item.paymentStatus !== 'paid' ? (
                        <button
                          onClick={() => onMarkPaid(item.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          تأكيد السداد ✓
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-mono">
                          {item.lastPaymentDate || 'تم الدفع'}
                        </span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
