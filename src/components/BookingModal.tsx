import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, MapPin, CheckCircle2, ShieldCheck, ArrowLeft, QrCode, AlertCircle, Sparkles, UserPlus } from 'lucide-react';
import { TutorProfile } from '../types';
import { ALL_EGYPT_GRADES } from '../data/mockData';

interface BookingModalProps {
  tutor: TutorProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenQRSimulator: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  tutor,
  isOpen,
  onClose,
  onOpenQRSimulator,
}) => {
  const [selectedDay, setSelectedDay] = useState('الأحد القادم');
  const [selectedTime, setSelectedTime] = useState('04:30 مساءً');
  const [sessionType, setSessionType] = useState<'center' | 'online' | 'private'>('center');
  const [selectedGrade, setSelectedGrade] = useState(ALL_EGYPT_GRADES[ALL_EGYPT_GRADES.length - 3]);
  const [studentName, setStudentName] = useState('زياد أحمد عبد الله');
  const [phone, setPhone] = useState('01012345678');
  const [parentPhone, setParentPhone] = useState('01198765432');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isWaitlistMode, setIsWaitlistMode] = useState(false);

  if (!isOpen || !tutor) return null;

  const days = ['الأحد القادم', 'الثلاثاء القادم', 'الخميس القادم', 'الجمعة القادمة'];
  const times = ['03:00 مساءً', '04:30 مساءً', '06:00 مساءً', '07:30 مساءً'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setIsWaitlistMode(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-6 text-right animate-scaleUp">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-[#F8FAFF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#1E3A8A]">
                {isWaitlistMode ? 'الانضمام لقائمة الانتظار' : 'طلب حجز حصة دراسية'}
              </h2>
              <p className="text-xs text-[#6B7280]">مع {tutor.name} ({tutor.subject})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 mx-auto flex items-center justify-center">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#1E3A8A]">
                  تم إرسال طلب الحجز إلى المعلم بنجاح!
                </h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  الطلب الآن في حالة <strong>"قيد موافقة المعلم"</strong> لاعتماد تسجيلك وتحديد المقعد
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-right space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between items-center py-1 border-b border-gray-200">
                  <span className="text-gray-500">المعلم:</span>
                  <strong className="text-[#1E3A8A]">{tutor.name}</strong>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200">
                  <span className="text-gray-500">المرحلة والصف:</span>
                  <strong className="text-[#1E3A8A]">{selectedGrade}</strong>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200">
                  <span className="text-gray-500">الموعد المطلوب:</span>
                  <strong className="text-[#1E3A8A]">{selectedDay} ({selectedTime})</strong>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200">
                  <span className="text-gray-500">قيمة الحصة:</span>
                  <strong className="text-[#2563EB] font-bold">{tutor.pricePerSession} ج.م</strong>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>ستصلك رسالة واتساب فورية لولي الأمر فور مراجعة واعتماد الطلب من المعلم.</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <button
                  onClick={() => {
                    handleReset();
                    onOpenQRSimulator();
                  }}
                  className="px-4 py-2.5 bg-[#2563EB] text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>معاينة كود الـ QR والبطاقة الرقمية</span>
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Tutor summary banner */}
              <div className="flex items-center gap-3 p-3 bg-[#EFF6FF] border border-blue-200 rounded-2xl">
                <img
                  src={tutor.avatarUrl}
                  alt={tutor.name}
                  className="w-11 h-11 rounded-xl object-cover border border-blue-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-[#1E3A8A] flex items-center gap-1 truncate">
                    {tutor.name}
                    <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                  </h4>
                  <p className="text-[11px] text-[#6B7280] truncate">{tutor.subject} — {tutor.governorate}</p>
                </div>
                <div className="text-xs font-bold text-[#1E3A8A] bg-white px-2.5 py-1 rounded-xl border border-blue-100 shrink-0">
                  {tutor.pricePerSession} ج.م / حصة
                </div>
              </div>

              {/* Stage & Grade Select */}
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">
                  المرحلة والصف الدراسي <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
                >
                  {ALL_EGYPT_GRADES.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              {/* Day selection */}
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                  اختر اليوم المطلوب
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {days.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDay(d)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer text-center ${
                        selectedDay === d
                          ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slot */}
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                  اختر موعد الحصة
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {times.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTime(t)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer text-center ${
                        selectedTime === t
                          ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Type */}
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                  نوع الحضور
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSessionType('center')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer text-center ${
                      sessionType === 'center'
                        ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    مجموعة سنتر
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionType('online')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer text-center ${
                      sessionType === 'online'
                        ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    أونلاين لايف
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionType('private')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer text-center ${
                      sessionType === 'private'
                        ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    درس خاص
                  </button>
                </div>
              </div>

              {/* Student Name & Parent Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">
                    اسم الطالب
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: زياد أحمد"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">
                    رقم واتساب ولي الأمر (للإشعارات)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01198765432"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB] text-left font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* System Note about Approval */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-[#1E3A8A] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>
                  نظام حجز آمن: يتم إرسال طلبك للمعلم للموافقة عليه لضمان وجود مقعد شاغر قبل الحضور.
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>إرسال طلب الحجز للمعلم</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

            </form>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};
