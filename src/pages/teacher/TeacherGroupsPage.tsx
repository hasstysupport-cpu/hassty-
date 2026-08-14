import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  X,
  ArrowLeft,
  Trash2,
  Edit
} from 'lucide-react';
import { MOCK_TEACHER_GROUPS, MOCK_TEACHER_STUDENTS } from '../../data/mockData';
import { TeacherGroupItem } from '../../types';
import { Badge } from '../../components/common/Badge';

export const TeacherGroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<TeacherGroupItem[]>(MOCK_TEACHER_GROUPS);
  const [selectedGroupRoster, setSelectedGroupRoster] = useState<TeacherGroupItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New group form fields
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupGrade, setNewGroupGrade] = useState('الصف الثالث الثانوي');
  const [newGroupSchedule, setNewGroupSchedule] = useState('السبت والثلاثاء 06:00 م');
  const [newGroupLocation, setNewGroupLocation] = useState('سنتر الأهرام — مدينة نصر');
  const [newGroupMax, setNewGroupMax] = useState(40);

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    const newGroup: TeacherGroupItem = {
      id: `grp-${Date.now()}`,
      name: newGroupName,
      grade: newGroupGrade,
      schedule: newGroupSchedule,
      location: newGroupLocation,
      currentStudents: 0,
      maxCapacity: Number(newGroupMax) || 35,
    };

    setGroups([...groups, newGroup]);
    setIsCreateModalOpen(false);
    setNewGroupName('');
  };

  return (
    <div className="space-y-8 text-right">
      
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>المجموعات الدراسية</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            إدارة فصول ومجموعات السناتر ({groups.length})
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            تنظيم المجموعات حسب الأيام، السنتر والمرحلة الدراسية
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء مجموعة جديدة</span>
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => {
          const occupancyRate = Math.round((group.currentStudents / group.maxCapacity) * 100);
          return (
            <div
              key={group.id}
              className="bg-white border border-[#E5E7EB] rounded-3xl p-6 hover:border-blue-300 transition-all flex flex-col justify-between shadow-xs space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-[#1E3A8A]">{group.name}</h3>
                  <Badge variant="info" size="sm">{group.grade}</Badge>
                </div>

                <div className="space-y-2 text-xs text-[#4B5563] pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{group.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{group.location}</span>
                  </div>
                </div>

                {/* Progress bar of occupancy */}
                <div className="mt-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B7280]">اكتمال العدد:</span>
                    <strong className="text-[#1E3A8A]">
                      {group.currentStudents} من {group.maxCapacity} طالب ({occupancyRate}%)
                    </strong>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        occupancyRate >= 90 ? 'bg-[#EF4444]' : 'bg-[#2563EB]'
                      }`}
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                <button
                  onClick={() => setSelectedGroupRoster(group)}
                  className="flex-1 py-2.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                >
                  عرض كشف الطلاب ({group.currentStudents})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: View Group Roster */}
      {selectedGroupRoster && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 text-right relative animate-scaleUp">
            
            <button
              onClick={() => setSelectedGroupRoster(null)}
              className="absolute left-4 top-4 p-2 text-gray-400 hover:text-gray-600 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-[#2563EB]">{selectedGroupRoster.grade}</span>
              <h3 className="text-lg font-bold text-[#1E3A8A]">
                كشف طلاب: {selectedGroupRoster.name}
              </h3>
              <p className="text-xs text-[#6B7280]">{selectedGroupRoster.schedule} — {selectedGroupRoster.location}</p>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
              {MOCK_TEACHER_STUDENTS.filter((s) => s.groupName === selectedGroupRoster.name).length > 0 ? (
                MOCK_TEACHER_STUDENTS.filter((s) => s.groupName === selectedGroupRoster.name).map((std) => (
                  <div key={std.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={std.avatarUrl}
                        alt={std.name}
                        className="w-8 h-8 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-bold text-[#1F2937]">{std.name}</div>
                        <span className="text-[10px] text-gray-400 font-mono">{std.qrCode}</span>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">حضور {std.attendanceRate}%</Badge>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[#6B7280]">
                  لا يوجد طلاب مقيدين في هذه المجموعة حالياً.
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedGroupRoster(null)}
              className="w-full py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Create New Group */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 text-right relative animate-scaleUp">
            
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute left-4 top-4 p-2 text-gray-400 hover:text-gray-600 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#1E3A8A]">إنشاء مجموعة دراسية جديدة</h3>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">
                  اسم المجموعة <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مجموعة الأحد والأربعاء — سنتر الأهرام"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">
                  المرحلة الدراسية
                </label>
                <select
                  value={newGroupGrade}
                  onChange={(e) => setNewGroupGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
                >
                  <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                  <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                  <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">
                  المواعيد والأيام
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الأحد والأربعاء 04:30 م"
                  value={newGroupSchedule}
                  onChange={(e) => setNewGroupSchedule(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">
                    المقر / السنتر
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: سنتر الأهرام"
                    value={newGroupLocation}
                    onChange={(e) => setNewGroupLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">
                    الحد الأقصى للطلاب
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newGroupMax}
                    onChange={(e) => setNewGroupMax(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>حفظ وإنشاء المجموعة</span>
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
