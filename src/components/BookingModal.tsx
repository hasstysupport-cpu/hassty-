import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, CheckCircle2, ShieldCheck, ArrowLeft, QrCode } from 'lucide-react';
import { TutorProfile } from '../types';

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
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [isBooked, setIsBooked] = useState(false);

  if (!isOpen || !tutor) return null;

  const days = ['الأحد القادم', 'الثلاثاء القادم', 'الخميس القادم', 'الجمعة القادمة'];
  const times = ['03:00 مساءً', '04:30 مساءً', '06:00 مساءً', '07:30 مساءً'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooked(true);
  };

  const handleReset = () => {
    setIsBooked(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8 text-right">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-[#F8FAFF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center">
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1E3A8A]">حجز حصة دراسية</h2>
              <p className="text-xs text-[#6B7280]">مع {tutor.name} ({tutor.subject})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isBooked ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#10B981] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#1E3A8A]">تم تأكيد طلب الحجز بنجاح!</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-right space-y-1.5 max-w-sm mx-auto">
                <p><strong>المعلم:</strong> {tutor.name}</p>
                <p><strong>الموعد:</strong> {selectedDay} الساعة {selectedTime}</p>
                <p><strong>المكان:</strong> {sessionType === 'center' ? `${tutor.area} (سنتر)` : sessionType === 'online' ? 'أونلاين عبر المنصة' : 'درس خاص'}</p>
                <p><strong>قيمة الحصة:</strong> {tutor.pricePerSession} ج.م</p>
                <p className="text-emerald-700 font-bold pt-1 border-t border-gray-200">
                  كود الانضمام للمجموعة: <span className="font-mono">{tutor.joinCode}</span>
                </p>
              </div>

              <p className="text-xs text-[#6B7280]">
                تم إرسال تفاصيل الحجز وكود الـ QR الخاص بك في رسالة واتساب.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <button
                  onClick={() => {
                    handleReset();
                    onOpenQRSimulator();
                  }}
                  className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>معاينة كود الـ QR للحضور</span>
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  تم
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Tutor summary banner */}
              <div className="flex items-center gap-3 p-3 bg-[#EFF6FF] border border-blue-200 rounded-xl">
                <img
                  src={tutor.avatarUrl}
                  alt={tutor.name}
                  className="w-12 h-12 rounded-lg object-cover border border-blue-200"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-[#1E3A8A] flex items-center gap-1 truncate">
                    {tutor.name}
                    <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                  </h4>
                  <p className="text-xs text-[#6B7280]">{tutor.subject} — {tutor.governorate}</p>
                </div>
                <div className="text-xs font-bold text-[#1E3A8A] bg-white px-2.5 py-1 rounded-lg border border-blue-100">
                  {tutor.pricePerSession} ج.م
                </div>
              </div>

              {/* Day selection */}
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                  اختر اليوم المناسب
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {days.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDay(d)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                        selectedDay === d
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
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
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                  اختر موعد الحصة
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {times.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTime(t)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                        selectedTime === t
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
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
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                  نوع الحضور
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSessionType('center')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
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
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
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
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                      sessionType === 'private'
                        ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    درس خاص
                  </button>
                </div>
              </div>

              {/* Student Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    اسم الطالب
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="زياد أحمد"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    رقم هاتف ولي الأمر
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB] text-left font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-3"
              >
                <span>تأكيد الحجز والحصول على كود QR</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
