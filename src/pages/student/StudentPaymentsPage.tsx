import React, { useState } from 'react';
import {
  Receipt,
  Download,
  CheckCircle2,
  Clock,
  Filter,
  DollarSign,
  FileText,
  Search,
  Wallet
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { PaymentRecord } from '../../types';

export const StudentPaymentsPage: React.FC = () => {
  const [filterSubject, setFilterSubject] = useState('all');
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const filteredPayments = payments.filter((p) => {
    if (filterSubject !== 'all' && p.subject !== filterSubject) return false;
    return true;
  });

  const totalPaid = payments.filter((p) => p.status === 'paid').reduce(
    (acc, cur) => acc + cur.amount,
    0
  );

  const handleDownloadInvoice = (id: string) => {
    setDownloadedId(id);
    setTimeout(() => setDownloadedId(null), 2500);
  };

  return (
    <div className="space-y-8 text-right">
      
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
          <Receipt className="w-3.5 h-3.5" />
          <span>المدفوعات والإيصالات</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
          سجل المدفوعات والاشتراكات الشهرية
        </h2>
        <p className="text-xs text-[#6B7280] mt-1">
          شفافية كاملة في توثيق مدفوعات الحصص والاشتراكات وإمكانية تحميل إيصال إلكتروني معتمد
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">إجمالي المدفوع حتى الآن</span>
          <p className="text-2xl font-black text-[#1E3A8A] font-mono">{totalPaid.toLocaleString()} ج.م</p>
          <span className="text-[11px] text-[#10B981] font-bold">جميع المدفوعات موثقة بالسناتر</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">اشتراك الشهر الحالي</span>
          <p className="text-2xl font-black text-[#2563EB] font-mono">0 ج.م</p>
          <span className="text-[11px] text-[#2563EB] font-bold">لا توجد متأخرات</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">مستحقات معلقة</span>
          <p className="text-2xl font-black text-emerald-600 font-mono">0 ج.م</p>
          <span className="text-[11px] text-[#6B7280]">لا توجد مبالغ مستحقة</span>
        </div>
      </div>

      {/* Filter Bar & Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-[#1E3A8A]">بيان الحركات المالية</h3>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B7280]">تصفية بالمادة:</span>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="all">كل المواد</option>
              <option value="كيمياء">كيمياء</option>
              <option value="فيزياء">فيزياء</option>
              <option value="لغة عربية">لغة عربية</option>
              <option value="رياضيات">رياضيات</option>
            </select>
          </div>
        </div>

        {/* Table / Empty state */}
        {filteredPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-bold text-[#1E3A8A]">
                  <th className="py-3 px-4 rounded-r-xl">رقم الإيصال</th>
                  <th className="py-3 px-4">المعلم والمادة</th>
                  <th className="py-3 px-4">الشهر / الفترة</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">تاريخ السداد</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 rounded-l-xl">الإيصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-[#1F2937]">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-[#F8FAFF] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB]">
                      {payment.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#1E3A8A]">{payment.tutorName}</div>
                      <span className="text-[11px] text-[#6B7280]">{payment.subject}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#4B5563]">
                      {payment.month}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-black text-sm text-[#1E3A8A]">
                      {payment.amount} ج.م
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7280]">
                      {payment.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={payment.status === 'paid' ? 'success' : 'warning'} size="sm">
                        {payment.status === 'paid' ? 'تم السداد' : 'قيد المراجعة'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleDownloadInvoice(payment.id)}
                        className="px-3 py-1.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{downloadedId === payment.id ? 'تم التحميل ✓' : 'تحميل PDF'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-gray-600">لا توجد سجلات مدفوعات مسجلة حالياً</p>
            <p className="text-[11px] text-gray-400">ستظهر هنا فواتير وإيصالات الاشتراكات بعد سدادها لدى السنتر أو المدرس</p>
          </div>
        )}
      </div>

    </div>
  );
};
