/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو النشر أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  BellRing,
  MessageCircle,
  CheckCircle2,
  Send,
  Phone,
  Loader2,
  Save,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { whatsappService } from '../../lib/whatsappService';
import { getPushState, isPushSupported, enablePushNotifications } from '../../lib/pushService';

interface Prefs {
  attendance: boolean;
  absence: boolean;
  late: boolean;
  upcoming: boolean;
  payments: boolean;
}

const DEFAULT_PREFS: Prefs = { attendance: true, absence: true, late: true, upcoming: true, payments: true };

export const ParentSettingsPage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();

  /* الحالة المحملة من الإعدادات المحفوظة فعلًا في الملف الشخصي (metadata) */
  const stored = (user?.profileData as any) || {};
  const [whatsappPhone, setWhatsappPhone] = useState(user?.phone || '');
  const [emergencyPhone, setEmergencyPhone] = useState(String(stored.emergencyPhone || ''));
  const [prefs, setPrefs] = useState<Prefs>({
    ...DEFAULT_PREFS,
    ...(stored.notification_prefs || {}),
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  /* حالة إشعارات المتصفح لهذا الجهاز (getPushState async) */
  const [pushState, setPushState] = useState<Awaited<ReturnType<typeof getPushState>>>('unsupported');
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => { void getPushState().then(setPushState); }, []);

  const phoneValid = /^01[0125][0-9]{8}$/.test(whatsappPhone.trim());
  const emergencyValid = !emergencyPhone.trim() || /^01[0125][0-9]{8}$/.test(emergencyPhone.trim());

  /* اختبار حقيقي: رسالة واتساب فعلية عبر بوابة GREEN API إلى رقم حسابك */
  const handleSendTestMessage = async () => {
    if (!phoneValid) {
      setTestResult({ ok: false, text: 'رقم الواتساب غير صحيح — صححه أولًا (مثال: 01012345678).' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await whatsappService.sendMessage(
        whatsappPhone.trim(),
        `*منصة حِصّتي — رسالة اختبار* ✅\n\nأهلاً ${user?.name || 'بك'}!\nهذا رقم الواتساب المعتمد لاستقبال إشعارات الحضور والغياب والمستحقات المالية لأبنائك.\n\nإشعارك وصل بنجاح — الإعدادات شغالة 💙`,
      );
      if (res?.success) setTestResult({ ok: true, text: 'تم إرسال رسالة واتساب حقيقية إلى رقمك — افحص هاتفك الآن.' });
      else setTestResult({ ok: false, text: `تعذر الإرسال الآن: ${res?.error || 'بوابة الواتساب غير متاحة حاليًا'}. الإشعارات داخل المنصة تعمل بشكل طبيعي.` });
    } catch (e: any) {
      setTestResult({ ok: false, text: e?.message || 'تعذر إرسال الرسالة التجريبية.' });
    } finally {
      setTesting(false);
    }
  };

  /* حفظ حقيقي: التفضيلات والأرقام تُخزن في الملف الشخصي في قاعدة البيانات */
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!phoneValid) { setErrorMsg('رقم الواتساب الأساسي غير صحيح (مثال: 01012345678).'); return; }
    if (!emergencyValid) { setErrorMsg('رقم الطوارئ الاحتياطي غير صحيح — أو اتركه فارغًا.'); return; }
    setLoading(true);
    try {
      await updateUserProfile({
        phone: whatsappPhone.trim(),
        profileData: {
          notification_prefs: prefs,
          emergencyPhone: emergencyPhone.trim(),
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر حفظ الإعدادات — حاول تاني.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnablePush = async () => {
    setPushBusy(true);
    try {
      await enablePushNotifications();
      void getPushState().then(setPushState);
    } catch { /* الحالة ستُحدّث على أي حال */ } finally { setPushBusy(false); }
  };

  const toggle = (key: keyof Prefs) => (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input
        type="checkbox"
        checked={prefs[key]}
        onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
    </label>
  );

  const ToggleRow = ({ title, desc, k }: { title: string; desc: string; k: keyof Prefs }) => (
    <div className="pt-4 first:pt-0 flex items-center justify-between gap-4">
      <div>
        <h4 className="text-xs font-bold text-[#1F2937]">{title}</h4>
        <p className="text-[11px] text-[#6B7280]">{desc}</p>
      </div>
      {toggle(k)}
    </div>
  );

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
          تُحفظ إعداداتك في حسابك وتُطبق فورًا على كل إشعارات الحضور والغياب والمستحقات المالية
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          <span>تم حفظ الإعدادات في حسابك بنجاح — مفعلة من الآن!</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-4">

        {/* أرقام الاتصال */}
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
                  maxLength={11}
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="010XXXXXXXX"
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB]"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
              </div>
              <p className="text-[10px] text-[#6B7280] font-semibold mt-1.5">كل إشعارات المنصة وواتساب بتوصل على الرقم ده.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                رقم هاتف الطوارئ الاحتياطي
              </label>
              <div className="relative">
                <input
                  type="tel"
                  dir="ltr"
                  maxLength={11}
                  placeholder="010XXXXXXXX"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB]"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
              </div>
            </div>
          </div>

          {/* حالة إشعارات المتصفح */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {pushState === 'enabled' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" /> : pushState === 'blocked' ? <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5" /> : <BellRing className="w-4 h-4 text-slate-400 mt-0.5" />}
              <div>
                <h4 className="text-xs font-bold text-[#1F2937]">إشعارات المتصفح على هذا الجهاز</h4>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  {pushState === 'enabled' ? 'مفعلة — هتوصلك التنبيهات حتى والموقع مقفول.' :
                    pushState === 'blocked' ? 'محظورة من المتصفح — فعّلها من أيقونة القفل 🔒 بجانب رابط الموقع.' :
                      pushState === 'unsupported' ? 'غير مدعومة في هذا المتصفح.' : 'غير مفعلة بعد — فعّلها لتصلك التنبيهات فورًا.'}
                </p>
              </div>
            </div>
            {isPushSupported() && pushState !== 'blocked' && pushState !== 'unsupported' && pushState !== 'enabled' && (
              <button type="button" onClick={() => void handleEnablePush()} disabled={pushBusy}
                className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black rounded-xl flex items-center gap-2 disabled:opacity-60">
                {pushBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
                تفعيل
              </button>
            )}
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => void handleSendTestMessage()}
              disabled={testing}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rotate-180" />}
              <span>{testing ? 'جاري الإرسال...' : 'إرسال رسالة واتساب تجريبية حقيقية'}</span>
            </button>
          </div>

          {testResult && (
            <div className={`p-3 border rounded-xl text-xs flex items-center gap-2 ${testResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
              {testResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{testResult.text}</span>
            </div>
          )}
        </div>

        {/* أنواع التنبيهات */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <h3 className="text-base font-bold text-[#1E3A8A]">أنواع التنبيهات المطلوبة</h3>
          <div className="space-y-4 divide-y divide-gray-100">
            <ToggleRow k="attendance" title="إشعار لحظي عند الحضور بالموعد" desc="رسالة واتساب فورية لحظة مسح المعلم لكود الـ QR عند باب الحصة" />
            <ToggleRow k="late" title="تنبيه عند الحضور المتأخر" desc="إشعار إذا مسح الطالب كوده بعد بداية الحصة" />
            <ToggleRow k="absence" title="تنبيه عند الغياب" desc="إشعار عند تسجيل غياب الطالب عن الحصة" />
            <ToggleRow k="upcoming" title="تذكير بمواعيد الحصص القادمة" desc="تذكير قبل موعد الحصة لتجهيز الطالب" />
            <ToggleRow k="payments" title="إشعارات الفواتير وتأكيدات السداد" desc="إيصال الدفع فور تحصيل المدرس لاشتراك الشهر + تنبيهات الاستحقاق" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{loading ? 'جاري الحفظ...' : 'حفظ كافة التغييرات'}</span>
        </button>

      </form>

    </div>
  );
};
