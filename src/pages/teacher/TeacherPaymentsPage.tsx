import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Wallet,
  RefreshCw,
  UserCheck,
  UserX
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { TeacherStudentItem } from '../../types';
import { useAuth } from '../../lib/AuthContext';
import { fetchTeacherStudents } from '../../lib/supabaseService';
import { db } from '../../lib/supabaseCompat';
import { doc, updateDoc } from '../../lib/supabaseCompat';

interface TeacherPaymentsPageProps {
  onNavigate?: (path: string) => void;
}

export const TeacherPaymentsPage: React.FC<TeacherPaymentsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [downloadedInvoice, setDownloadedInvoice] = useState<string | null>(null);
  const [students, setStudents] = useState<TeacherStudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const teacherId = user?.uid || 'current_teacher';

  const loadStudents = async () => {
    setLoading(true);
    try {
      if (teacherId) {
        const data = await fetchTeacherStudents(teacherId);
        setStudents(data);
      }
    } catch (err) {
      console.error('Error loading students for payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [teacherId]);

  const totalStudents = students.length;
  const paidStudentsCount = students.filter(s => s.paymentStatus === 'paid').length;
  const pricePerStudent = 120;
  const totalRevenue = paidStudentsCount * pricePerStudent;
  
  // Calculate commission tier
  let commissionRate = 0.05;
  let commissionTierLabel = '1 - 50 طالب (5.0%)';
  if (totalStudents > 300) {
    commissionRate = 0.01;
    commissionTierLabel = '300+ طالب (1.0%)';
  } else if (totalStudents > 150) {
    commissionRate = 0.02;
    commissionTierLabel = '151 - 300 طالب (2.0%)';
  } else if (totalStudents > 50) {
    commissionRate = 0.03;
    commissionTierLabel = '51 - 150 طالب (3.0%)';
  }

  const platformFee = Math.round(totalRevenue * commissionRate);
  const netEarnings = totalRevenue - platformFee;

  const handleTogglePaymentStatus = async (studentId: string, currentStatus: string) => {
    setUpdatingId(studentId);
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    try {
      const ref = doc(db, 'teacher_students', studentId);
      await updateDoc(ref, { paymentStatus: newStatus });
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, paymentStatus: newStatus as any } : s));
    } catch (err) {
      console.error('Failed to update student payment status in Supabase:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDownloadInvoice = (id: string) => {
    setDownloadedInvoice(id);
    setTimeout(() => setDownloadedInvoice(null), 2500);
  };

  return (
    <div className="space-y-8 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">
      
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            <span>الأرباح والعمولة التدريجية (قاعدة بيانات حية)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            المستحقات المالية وحساب العمولة
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            نظام عمولة عادل وتدريجي — مربوط مباشرة ببيانات اشتراكات طلابك في قاعدة البيانات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadStudents()}
            disabled={loading}
            className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-2xl transition-all cursor-pointer disabled:opacity-50"
            title="تحديث البيانات من الخادم"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => onNavigate && onNavigate('/teacher/scan')}
            className="px-5 py-3 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-2.5 cursor-pointer active:scale-95 shrink-0"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>تأكيد تحصيل قسط بمسح الـ QR</span>
          </button>
        </div>
      </div>

      {/* Tiered Commission Breakdown Box */}
      <div className="bg-gradient-to-l from-[#1E3A8A] to-[#2563EB] text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full text-blue-100">
              الشريحة الحالية: {commissionTierLabel}
            </span>
            <h3 className="text-xl sm:text-2xl font-black mt-2">
              عمولة المنصة المطبقة عليك: <span className="text-emerald-300 font-mono">{(commissionRate * 100).toFixed(1)}%</span>
            </h3>
          </div>
          <Badge variant="success" size="lg">نظام عمولة تدريجي ✓</Badge>
        </div>

        {/* 4 Tier Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className={`p-3.5 rounded-2xl ${totalStudents <= 50 ? 'bg-emerald-500/30 border-2 border-emerald-400' : 'bg-white/10 border border-white/10'}`}>
            <span className="text-[11px] text-blue-200 block">1 - 50 طالب</span>
            <strong className="text-base font-black font-mono">5.0%</strong>
          </div>

          <div className={`p-3.5 rounded-2xl ${totalStudents > 50 && totalStudents <= 150 ? 'bg-emerald-500/30 border-2 border-emerald-400' : 'bg-white/10 border border-white/10'}`}>
            <span className="text-[11px] text-blue-200 block">51 - 150 طالب</span>
            <strong className="text-base font-black font-mono">3.0%</strong>
          </div>

          <div className={`p-3.5 rounded-2xl ${totalStudents > 150 && totalStudents <= 300 ? 'bg-emerald-500/30 border-2 border-emerald-400' : 'bg-white/10 border border-white/10'}`}>
            <span className="text-[11px] text-blue-200 block">151 - 300 طالب</span>
            <strong className="text-base font-black font-mono">2.0%</strong>
          </div>

          <div className={`p-3.5 rounded-2xl ${totalStudents > 300 ? 'bg-emerald-500/30 border-2 border-emerald-400' : 'bg-white/10 border border-white/10'}`}>
            <span className="text-[11px] text-emerald-200 block">300+ طالب</span>
            <strong className="text-base font-black font-mono text-emerald-300">1.0% ✓</strong>
          </div>
        </div>

        {/* Current Month Net Summary */}
        <div className="p-4 bg-white/10 rounded-2xl border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-blue-200">إجمالي إيراد التحصيل ({paidStudentsCount} مسددين من {totalStudents}): </span>
            <strong className="font-mono text-white font-black">{totalRevenue.toLocaleString()} ج.م</strong>
          </div>
          <div>
            <span className="text-blue-200">عمولة المنصة: </span>
            <strong className="font-mono text-emerald-300 font-black">-{platformFee} ج.م</strong>
          </div>
          <div>
            <span className="text-blue-200">صافي أرباحك الفعلية: </span>
            <strong className="font-mono text-white font-black text-sm">{netEarnings.toLocaleString()} ج.م</strong>
          </div>
        </div>
      </div>

      {/* Student Payments Ledger Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#1E3A8A]">سجل اشتراكات الطلاب المباشر من Supabase</h3>
          <span className="text-xs text-[#6B7280]">
            إجمالي الطلاب المسجلين: <strong className="text-[#10B981]">{totalStudents}</strong> (مسدد: {paidStudentsCount})
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-xs">جاري تحميل بيانات المدفوعات والاشتراكات الحية...</p>
          </div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-bold text-[#1E3A8A]">
                  <th className="py-3 px-4 rounded-r-xl">الطالب</th>
                  <th className="py-3 px-4">المجموعة</th>
                  <th className="py-3 px-4">قيمة الاشتراك</th>
                  <th className="py-3 px-4">تاريخ التسجيل</th>
                  <th className="py-3 px-4">حالة السداد</th>
                  <th className="py-3 px-4">تعديل الحالة</th>
                  <th className="py-3 px-4 rounded-l-xl">الإيصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-[#1F2937]">
                {students.map((std) => (
                  <tr key={std.id} className="hover:bg-[#F8FAFF] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#1E3A8A]">
                      {std.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#4B5563]">
                      {std.groupName || 'مجموعة عامة'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1E3A8A]">
                      {pricePerStudent} ج.م
                    </td>
                    <td className="py-3.5 px-4 text-[#6B7280]">
                      {std.joinedDate || '2026-08-01'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={std.paymentStatus === 'paid' ? 'success' : 'danger'} size="sm">
                        {std.paymentStatus === 'paid' ? 'مسدد ✓' : 'متأخر ✗'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleTogglePaymentStatus(std.id, std.paymentStatus)}
                        disabled={updatingId === std.id}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {updatingId === std.id ? 'جاري التحديث...' : std.paymentStatus === 'paid' ? 'تغيير لمتأخر' : 'تأكيد السداد'}
                      </button>
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
        ) : (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-gray-600">لا توجد بيانات طلاب مسجلة في حسابك حالياً</p>
            <p className="text-[11px] text-gray-400">يمكنك إضافة الطلاب في صفحة المجموعات أو مسح رمز QR للطلاب لحساب الأرباح والعمولات تلقائياً.</p>
            <button
              onClick={() => onNavigate && onNavigate('/teacher/students')}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              إضافة طلاب جدد
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
