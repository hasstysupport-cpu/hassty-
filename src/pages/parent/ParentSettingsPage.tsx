import React, { useState } from 'react';
import {
  BellRing,
  MessageCircle,
  CheckCircle2,
  Send,
  Phone,
  ShieldCheck,
  Sparkles,
  Save
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const ParentSettingsPage: React.FC = () => {
  const [whatsappPhone, setWhatsappPhone] = useState('01234567890');
  const [notifyOnAttendance, setNotifyOnAttendance] = useState(true);
  const [notifyOnAbsence, setNotifyOnAbsence] = useState(true);
  const [notifyUpcoming, setNotifyUpcoming] = useState(true);
  const [notifyPayments, setNotifyPayments] = useState(true);

  const [testSent, setTestSent] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSendTestMessage = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8 text-right max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
          <BellRing className="w-3.5 h-3.5" />
          <span>تخصيص الإشعارات</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
          إعدادات إشعارات الواتساب والتنبيهات
        </h2>
        <p className="text-xs text-[#6B7280] mt-1">
          حدد الإشعارات التي ترغب في استلامها على تطبيق واتساب لحظة بلحظة
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 text-center flex items-center justify-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          <span>تم حفظ الإعدادات وتحديث قنوات الإشعار بنجاح!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* WhatsApp Number Section */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            <span>رقم واتساب المعتمد للإشعارات</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="tel"
                required
                dir="ltr"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
              <Phone className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
            </div>

            <button
              type="button"
              onClick={handleSendTestMessage}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 rotate-180" />
              <span>إرسال إشعار تجريبي الآن</span>
            </button>
          </div>

          {testSent && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>
                تم إرسال رسالة تجريبية: «تم تسجيل حضور زياد في حصة الكيمياء مع أ. حسام إبراهيم بنجاح في سنتر الأهرام الساعة 04:32 م»
              </span>
            </div>
          )}
        </div>

        {/* Toggle Switches Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <h3 className="text-base font-bold text-[#1E3A8A]">أنواع التنبيهات المطلوبة</h3>

          <div className="space-y-4 divide-y divide-gray-100">
            
            {/* Toggle 1: Attendance */}
            <div className="pt-3 first:pt-0 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-[#1F2937]">إشعار لحظي عند الحضور</h4>
                <p className="text-xs text-[#6B7280]">رسالة واتساب فورية لحظة مسح المعلم لكود الـ QR عند باب الحصة</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={notifyOnAttendance}
                  onChange={(e) => setNotifyOnAttendance(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
              </label>
            </div>

            {/* Toggle 2: Absence */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-[#1F2937]">تنبيه عند الغياب أو التأخر</h4>
                <p className="text-xs text-[#6B7280]">إشعار بعد مرور 20 دقيقة من بداية موعد الحصة في حال عدم مسح الكود</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={notifyOnAbsence}
                  onChange={(e) => setNotifyOnAbsence(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
              </label>
            </div>

            {/* Toggle 3: Upcoming Lessons */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-[#1F2937]">تذكير بمواعيد الحصص القادمة</h4>
                <p className="text-xs text-[#6B7280]">تذكير قبل موعد الحصة بساعتين لتجهيز الطالب</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={notifyUpcoming}
                  onChange={(e) => setNotifyUpcoming(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
              </label>
            </div>

            {/* Toggle 4: Payments */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-[#1F2937]">إشعارات الفواتير وتأكيدات السداد</h4>
                <p className="text-xs text-[#6B7280]">إرسال إيصال الدفع الإلكتروني فور تسجيل السداد بالسنتر</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={notifyPayments}
                  onChange={(e) => setNotifyPayments(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
              </label>
            </div>

          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>حفظ كافة التغييرات</span>
        </button>

      </form>

    </div>
  );
};
