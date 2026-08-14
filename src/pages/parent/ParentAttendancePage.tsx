import React, { useState } from 'react';
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Filter,
  Users,
  Clock,
  MapPin
} from 'lucide-react';
import { MOCK_ATTENDANCE_RECORDS } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';

export const ParentAttendancePage: React.FC = () => {
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredRecords = MOCK_ATTENDANCE_RECORDS.filter((rec) => {
    if (filterSubject !== 'all' && rec.subject !== filterSubject) return false;
    if (filterStatus !== 'all' && rec.status !== filterStatus) return false;
    return true;
  });

  const presentCount = MOCK_ATTENDANCE_RECORDS.filter((r) => r.status === 'present').length;
  const absentCount = MOCK_ATTENDANCE_RECORDS.filter((r) => r.status === 'absent').length;

  return (
    <div className="space-y-8 text-right">
      
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>سجل الحضور والغياب الموثق</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
          سجل حضور وغياب الطالب (زياد أحمد)
        </h2>
        <p className="text-xs text-[#6B7280] mt-1">
          توثيق إلكتروني دقيق بالدقيقة وموقع السنتر لكل حصة تم مسح كود الـ QR فيها
        </p>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">نسبة الالتزام الإجمالية</span>
          <p className="text-2xl font-black text-[#10B981]">95%</p>
          <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#10B981] h-full rounded-full" style={{ width: '95%' }} />
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">إجمالي مرات الحضور</span>
          <p className="text-2xl font-black text-[#1E3A8A]">{presentCount} حصص</p>
          <span className="text-[11px] text-[#10B981] font-bold">تم مسح الكود بنجاح</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">مرات الغياب المسجلة</span>
          <p className="text-2xl font-black text-[#EF4444]">{absentCount} حصة</p>
          <span className="text-[11px] text-[#6B7280]">تم إشعار ولي الأمر بها فوراً</span>
        </div>
      </div>

      {/* Filterable Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-[#1E3A8A]">سجل الحصص التفصيلي</h3>

          <div className="flex items-center gap-2">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="all">كل المواد</option>
              <option value="كيمياء">كيمياء</option>
              <option value="فيزياء">فيزياء</option>
              <option value="لغة عربية">لغة عربية</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="all">كل الحالات</option>
              <option value="present">حاضر فقط</option>
              <option value="absent">غائب فقط</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-bold text-[#1E3A8A]">
                <th className="py-3 px-4 rounded-r-xl">التاريخ واليوم</th>
                <th className="py-3 px-4">المعلم والمادة</th>
                <th className="py-3 px-4">مقر الحصة / السنتر</th>
                <th className="py-3 px-4">وقت مسح الـ QR</th>
                <th className="py-3 px-4 rounded-l-xl">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-[#1F2937]">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-[#F8FAFF] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#1E3A8A]">
                    {record.date}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#1F2937]">{record.tutorName}</div>
                    <span className="text-[11px] text-[#2563EB] font-semibold">{record.subject}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#4B5563]">
                    {record.center}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#6B7280]">
                    {record.time}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={record.status === 'present' ? 'success' : 'danger'} size="sm">
                      {record.status === 'present' ? 'حاضر ✓' : 'غائب ✗'}
                    </Badge>
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
