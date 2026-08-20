import React from 'react';
import { MOCK_CURRENT_STUDENT } from '../../data/mockData';
import { StudentCardDesigner } from '../../components/StudentCardDesigner';
import { Smartphone, Info, ShieldCheck } from 'lucide-react';

export const StudentQRCardPage: React.FC = () => {
  const student = MOCK_CURRENT_STUDENT;

  return (
    <div className="space-y-8 text-right max-w-6xl mx-auto py-2" dir="rtl">
      
      {/* 1. Main Interactive Student Card Studio */}
      <StudentCardDesigner student={student} />

      {/* 2. Offline Storage & Usage Banner */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-white border border-teal-200/80 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-gray-900">
              نصيحة: احفظ صورة الكارت في المفضلة بمعرض صور هاتفك
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              عند حفظ صورة الكارت على جهازك أو طباعتها، ستتمكن من مسح الحضور الفوري عند باب السنتر أو الحصة حتى بدون إنترنت.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-teal-800 bg-white/80 px-3.5 py-2 rounded-xl border border-teal-200 shrink-0">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>كارت معتمد من السنتر لعام 2026/2027</span>
        </div>
      </div>

      {/* 3. Instructions Guide */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-teal-600" />
          <span>كيف يتم استخدام الكارنيه لتسجيل الحضور الإلكتروني؟</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-600">
          <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5 border border-gray-100">
            <span className="font-bold text-teal-700 block text-sm">1. إبراز الكارت</span>
            <p>أظهر صورة الكارت على شاشة هاتفك أو الكارت المطبوع عند بوابة الدخول.</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5 border border-gray-100">
            <span className="font-bold text-teal-700 block text-sm">2. المسح السريع</span>
            <p>يمسح المساعد أو المعلم الباركود أو الـ QR بكاميرا الهاتف في ثانية واحدة.</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5 border border-gray-100">
            <span className="font-bold text-teal-700 block text-sm">3. إشعار فوري لولي الأمر</span>
            <p>يصل إشعار واتساب تلقائي وفوري لولي الأمر لتأكيد الحضور ووقت الدخول بأمان.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
