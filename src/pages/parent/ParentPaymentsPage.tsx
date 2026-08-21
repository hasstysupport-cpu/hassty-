import React, { useState } from 'react';
import {
  Receipt,
  Download,
  DollarSign,
  CheckCircle2,
  Calendar,
  CreditCard,
  Wallet
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { PaymentRecord } from '../../types';

export const ParentPaymentsPage: React.FC = () => {
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const handleDownloadInvoice = (id: string) => {
    setDownloadedId(id);
    setTimeout(() => setDownloadedId(null), 2500);
  };

  const totalPaid = payments.reduce((acc, cur) => acc + cur.amount, 0);

  return (
    <div className="space-y-8 text-right">
      
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
          <Receipt className="w-3.5 h-3.5" />
          <span>متابعة الرسوم والاشتراكات</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
          مدفوعات واشتراكات دروس الابن
        </h2>
        <p className="text-xs text-[#6B7280] mt-1">
          سجل شفاف لجميع المبالغ المسددة للمعلمين والسناتر مع إيصالات إلكترونية رسمية
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">إجمالي ما تم سداده</span>
          <p className="text-2xl font-black text-[#1E3A8A] font-mono">{totalPaid.toLocaleString()} ج.م</p>
          <span className="text-[11px] text-[#10B981] font-bold">موثق بالكامل</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">المستحق للشهر الحالي</span>
          <p className="text-2xl font-black text-[#2563EB] font-mono">0 ج.م</p>
          <span className="text-[11px] text-[#2563EB] font-bold">لا توجد مستحقات</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">المستحقات القادمة</span>
          <p className="text-2xl font-black text-[#4B5563] font-mono">0 ج.م</p>
          <span className="text-[11px] text-[#6B7280]">لا توجد مطالبات حالية</span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <h3 className="text-base font-bold text-[#1E3A8A]">سجل الإيصالات والفواتير</h3>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-bold text-[#1E3A8A]">
                  <th className="py-3 px-4 rounded-r-xl">رقم الفاتورة</th>
                  <th className="py-3 px-4">المعلم والمادة</th>
                  <th className="py-3 px-4">الفترة</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">تاريخ السداد</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 rounded-l-xl">الإيصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-[#1F2937]">
                {payments.map((payment) => (
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
                      <Badge variant="success" size="sm">مسدد ✓</Badge>
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
            <p className="text-xs font-bold text-gray-600">لا توجد فواتير أو مدفوعات مسجلة بعد</p>
            <p className="text-[11px] text-gray-400">ستظهر هنا إيصالات الرسوم بعد تسديد اشتراكات الحصص</p>
          </div>
        )}
      </div>

    </div>
  );
};
