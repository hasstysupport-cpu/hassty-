import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  QrCode,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Filter,
  Layers,
  ArrowLeft,
  GraduationCap
} from 'lucide-react';
import { TeacherStudentItem } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

interface TeacherStudentsPageProps {
  onNavigate?: (path: string) => void;
}

export const TeacherStudentsPage: React.FC<TeacherStudentsPageProps> = ({ onNavigate }) => {
  const [students, setStudents] = useState<TeacherStudentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentGroup, setNewStudentGroup] = useState('المجموعة العامة');
  const [addSuccess, setAddSuccess] = useState(false);

  const filteredStudents = students.filter((s) => {
    if (searchQuery && !s.name.includes(searchQuery) && !s.phone.includes(searchQuery) && !s.qrCode.includes(searchQuery)) {
      return false;
    }
    if (selectedGroup !== 'all' && s.groupName !== selectedGroup) {
      return false;
    }
    return true;
  });

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName) return;

    const newStudent: TeacherStudentItem = {
      id: `std-${Date.now()}`,
      name: newStudentName,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      grade: 'الصف الثالث الثانوي',
      phone: newStudentPhone || '010XXXXXXXX',
      parentPhone: '012XXXXXXXX',
      qrCode: newStudentCode || `HST-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      groupName: newStudentGroup,
      attendanceRate: 100,
      totalSessions: 1,
      attendedSessions: 1,
      paymentStatus: 'paid',
      joinedDate: new Date().toISOString().split('T')[0],
    };

    setStudents([newStudent, ...students]);
    setAddSuccess(true);
    setTimeout(() => {
      setAddSuccess(false);
      setIsAddModalOpen(false);
      setNewStudentName('');
      setNewStudentCode('');
      setNewStudentPhone('');
    }, 1500);
  };

  return (
    <div className="space-y-8 text-right">
      
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>سجل الطلاب المقيدين</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            إدارة الطلاب ({students.length} طالب)
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            بيانات الطلاب، أكواد الـ QR، نسب الحضور وحالة سداد الاشتراكات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate && onNavigate('/teacher/scan')}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>قيد طالب فوري بالـ QR</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة يدوية</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="ابحث باسم الطالب، رقم الهاتف أو كود الـ QR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#2563EB]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
          </div>

        </div>

        {/* Students Table */}
        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-bold text-[#1E3A8A]">
                  <th className="py-3 px-4 rounded-r-xl">الطالب</th>
                  <th className="py-3 px-4">كود الـ QR</th>
                  <th className="py-3 px-4">المجموعة المقيد بها</th>
                  <th className="py-3 px-4">هاتف ولي الأمر</th>
                  <th className="py-3 px-4">نسبة الحضور</th>
                  <th className="py-3 px-4 rounded-l-xl">الاشتراك الشهري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-[#1F2937]">
                {filteredStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-[#F8FAFF] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={std.avatarUrl}
                          alt={std.name}
                          className="w-9 h-9 rounded-xl object-cover border border-gray-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold text-[#1E3A8A]">{std.name}</div>
                          <span className="text-[11px] text-[#6B7280] font-mono">{std.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB]">
                      {std.qrCode}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#4B5563]">
                      {std.groupName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#6B7280]">
                      {std.parentPhone}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#10B981]">{std.attendanceRate}%</span>
                      <span className="text-[10px] text-gray-400 block">({std.attendedSessions}/{std.totalSessions} حصة)</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={std.paymentStatus === 'paid' ? 'success' : 'danger'} size="sm">
                        {std.paymentStatus === 'paid' ? 'مسدد ✓' : 'متأخر ✗'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] mx-auto flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-gray-700">لا يوجد طلاب مسجلون بعد</p>
            <p className="text-[11px] text-gray-400">يمكنك قيد الطلاب عبر مسح بطاقة الـ QR أو الإضافة المباشرة أعلاه</p>
          </div>
        )}

      </div>

      {/* MODAL: Add New Student */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إضافة طالب جديد للمجموعة"
        subtitle="أدخل بيانات الطالب أو كود بطاقة الـ QR الخاصة به"
        icon={<Plus className="w-6 h-6" />}
        maxWidth="md"
      >
        {addSuccess ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            <span>تم قيد الطالب بنجاح في المجموعة وتفعيل متابعة الـ QR!</span>
          </div>
        ) : (
          <form onSubmit={handleAddStudent} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                اسم الطالب بالكامل <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: يوسف خالد إبراهيم"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                كود كارنيه الطالب (اختياري)
              </label>
              <input
                type="text"
                placeholder="مثال: HST-2026-09812"
                value={newStudentCode}
                onChange={(e) => setNewStudentCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                إذا لم يكن لدى الطالب كود، سيقوم النظام بإنشاء كود فوري له.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">
                  رقم هاتف الطالب
                </label>
                <input
                  type="tel"
                  placeholder="010XXXXXXXX"
                  value={newStudentPhone}
                  onChange={(e) => setNewStudentPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">
                  المجموعة
                </label>
                <input
                  type="text"
                  value={newStudentGroup}
                  onChange={(e) => setNewStudentGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تأكيد إضافة الطالب</span>
            </button>
          </form>
        )}
      </Modal>

    </div>
  );
};
