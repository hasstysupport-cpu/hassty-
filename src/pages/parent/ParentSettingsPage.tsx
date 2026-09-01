import React, { useState } from 'react';
import {
  BellRing,
  MessageCircle,
  CheckCircle2,
  Send,
  Phone,
  ShieldCheck,
  Sparkles,
  Save,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const ParentSettingsPage: React.FC = () => {
  const [whatsappPhone, setWhatsappPhone] = useState('01234567890');
  const [emergencyPhone, setEmergencyPhone] = useState('01011223344');
  const [notifyOnAttendance, setNotifyOnAttendance] = useState(true);
  const [notifyOnAbsence, setNotifyOnAbsence] = useState(true);
  const [notifyTenMinutesLate, setNotifyTenMinutesLate] = useState(true);
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
    <div className="space-y-4 text-right max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
          <BellRing className="w-3.5 h-3.5" />
          <span>تخصيص الإشعارات والطوارئ</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
          إعدادات إشعارات الواتساب ورقم الطوارئ
        </h2>
        <p className="text-xs text-[#6B7280] mt-1">
          حدد قنوات الاتصال والتنبيهات التلقائية عند وصول الطالب للسنتر أو تأخره
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 text-center flex items-center justify-center gap-2 animate-scaleUp">
          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          <span>تم حفظ الإعدادات وأرقام الطوارئ بنجاح!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-4">
        
        {/* Contact Numbers Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
          <h3 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            <span>أرقام الهاتف والواتساب المعتمدة</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                رقم الواتساب الأساسي للإشعارات <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB]"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                رقم هاتف الطوارئ الاحتياطي
              </label>
              <div className="relative">
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="010XXXXXXXX"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB]"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSendTestMessage}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 rotate-180" />
              <span>إرسال إشعار تجريبي الآن للتأكد</span>
            </button>
          </div>

          {testSent && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-scaleUp">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>
                تم إرسال رسالة تجريبية: «تم تسجيل حضور زياد في حصة الكيمياء مع أ. حسام إبراهيم بنجاح في سنتر الأهرام الساعة 04:32 م»
              </span>
            </div>
          )}
        </div>

        {/* Toggle Switches Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <h3 className="text-base font-bold text-[#1E3A8A]">أنواع التنبيهات المطلوبة</h3>

          <div className="space-y-4 divide-y divide-gray-100">
            
            {/* Toggle 1: Attendance */}
            <div className="pt-3 first:pt-0 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-[#1F2937]">إشعار لحظي عند الحضور بالموعد</h4>
                <p className="text-[11px] text-[#6B7280]">رسالة واتساب فورية لحظة مسح المعلم لكود الـ QR عند باب الحصة</p>
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

            {/* Toggle 2: 10 mins late alert */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-[#1F2937]">تنبيه مبكر عند التأخر (بعد 10 دقائق من الموعد)</h4>
                <p className="text-[11px] text-[#6B7280]">إشعار إذا لم يسجل الطالب حضوره خلال أول 10 دقائق للاطمئنان عليه</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={notifyTenMinutesLate}
                  onChange={(e) => setNotifyTenMinutesLate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
              </label>
            </div>

            {/* Toggle 3: Absence */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-[#1F2937]">تنبيه عند الغياب الكامل</h4>
                <p className="text-[11px] text-[#6B7280]">إشعار بعد مرور 45 دقيقة من بداية الحصة وتوفير خيار طلب حصة تعويضية</p>
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

            {/* Toggle 4: Upcoming Lessons */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-[#1F2937]">تذكير بمواعيد الحصص القادمة</h4>
                <p className="text-[11px] text-[#6B7280]">تذكير قبل موعد الحصة بساعتين لتجهيز الطالب</p>
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

            {/* Toggle 5: Payments */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-[#1F2937]">إشعارات الفواتير وتأكيدات السداد</h4>
                <p className="text-[11px] text-[#6B7280]">إرسال إيصال الدفع الإلكتروني فور تسجيل السداد بالسنتر</p>
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
          className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>حفظ كافة التغييرات</span>
        </button>

      </form>

    </div>
  );
};
