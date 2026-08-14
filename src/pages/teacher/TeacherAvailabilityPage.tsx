import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Sparkles
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

interface TimeSlotItem {
  id: string;
  day: string;
  time: string;
  location: string;
  type: 'center' | 'online';
  status: 'available' | 'booked';
}

export const TeacherAvailabilityPage: React.FC = () => {
  const [slots, setSlots] = useState<TimeSlotItem[]>([
    { id: '1', day: 'السبت', time: '04:30 م - 06:30 م', location: 'سنتر الأهرام — مدينة نصر', type: 'center', status: 'available' },
    { id: '2', day: 'الأحد', time: '06:00 م - 08:00 م', location: 'سنتر الأوائل — مصر الجديدة', type: 'center', status: 'available' },
    { id: '3', day: 'الثلاثاء', time: '05:00 م - 07:00 م', location: 'سنتر الأهرام — مدينة نصر', type: 'center', status: 'booked' },
    { id: '4', day: 'الأربعاء', time: '07:00 م - 09:00 م', location: 'أونلاين (زووم)', type: 'online', status: 'available' },
    { id: '5', day: 'الخميس', time: '04:00 م - 06:00 م', location: 'سنتر القمة — التجمع الخامس', type: 'center', status: 'available' },
  ]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newDay, setNewDay] = useState('الجمعة');
  const [newTime, setNewTime] = useState('02:00 م - 04:00 م');
  const [newLocation, setNewLocation] = useState('سنتر الأهرام');
  const [newType, setNewType] = useState<'center' | 'online'>('center');

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const newSlot: TimeSlotItem = {
      id: `slot-${Date.now()}`,
      day: newDay,
      time: newTime,
      location: newType === 'online' ? 'أونلاين (زووم)' : newLocation,
      type: newType,
      status: 'available',
    };
    setSlots([...slots, newSlot]);
  };

  const handleDeleteSlot = (id: string) => {
    setSlots(slots.filter((s) => s.id !== id));
  };

  const handleSaveAll = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8 text-right max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>جدول المواعيد المتاحة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            إدارة المواعيد وجدول الحصص الأسبوعي
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            حدد أوقات وأماكن تواجدك في السناتر أو المجموعات الأونلاين ليتمكن الطلاب من الحجز معك
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التعديلات</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 text-center flex items-center justify-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          <span>تم تحديث ونشر جدول مواعيدك المتاحة بنجاح!</span>
        </div>
      )}

      {/* Add New Slot Form */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#1E3A8A] flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#2563EB]" />
          <span>إضافة موعد أو فترة جديدة</span>
        </h3>

        <form onSubmit={handleAddSlot} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-bold text-[#1F2937] mb-1">اليوم</label>
            <select
              value={newDay}
              onChange={(e) => setNewDay(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl font-bold cursor-pointer"
            >
              <option value="السبت">السبت</option>
              <option value="الأحد">الأحد</option>
              <option value="الإثنين">الإثنين</option>
              <option value="الثلاثاء">الثلاثاء</option>
              <option value="الأربعاء">الأربعاء</option>
              <option value="الخميس">الخميس</option>
              <option value="الجمعة">الجمعة</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#1F2937] mb-1">الوقت</label>
            <input
              type="text"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1F2937] mb-1">النوع</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl font-bold cursor-pointer"
            >
              <option value="center">سنتر / قاعة</option>
              <option value="online">أونلاين (بث مباشر)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#1F2937] mb-1">اسم السنتر / المنطقة</label>
            <input
              type="text"
              disabled={newType === 'online'}
              value={newType === 'online' ? 'أونلاين (زووم)' : newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right disabled:opacity-50"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة</span>
            </button>
          </div>
        </form>
      </div>

      {/* Current Slots List */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-[#1E3A8A]">المواعيد المفعلة حالياً ({slots.length})</h3>

        <div className="divide-y divide-gray-100">
          {slots.map((slot) => (
            <div key={slot.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-16 font-bold text-sm text-[#1E3A8A]">{slot.day}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1F2937]">{slot.time}</span>
                    <Badge variant={slot.type === 'center' ? 'info' : 'navy'} size="sm">
                      {slot.type === 'center' ? 'سنتر' : 'أونلاين'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">{slot.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={slot.status === 'available' ? 'success' : 'neutral'} size="sm">
                  {slot.status === 'available' ? 'متاح للحجز' : 'مكتمل'}
                </Badge>
                <button
                  onClick={() => handleDeleteSlot(slot.id)}
                  className="p-2 text-gray-400 hover:text-[#EF4444] rounded-lg transition-colors cursor-pointer"
                  title="حذف الموعد"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
