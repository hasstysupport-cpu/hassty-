import React, { useState } from 'react';
import {
  Palette,
  Sliders,
  Download,
  Printer,
  RotateCw,
  Eye,
  Check,
  Sparkles,
  Layers,
  Settings2,
  FileText,
  HelpCircle,
  Share2,
  Copy,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  LayoutGrid
} from 'lucide-react';
import { StudentProfile, StudentCardCustomization } from '../types';
import { StudentCardRenderer, THEME_PALETTES, DEFAULT_CARD_CUSTOMIZATION } from './StudentCardRenderer';
import { exportStudentCardHighResPNG } from '../utils/studentCardExporter';

interface StudentCardDesignerProps {
  student: StudentProfile;
  initialCustomization?: Partial<StudentCardCustomization>;
  onSaveCustomization?: (customization: StudentCardCustomization) => void;
  allowEditing?: boolean;
}

export const StudentCardDesigner: React.FC<StudentCardDesignerProps> = ({
  student,
  initialCustomization,
  onSaveCustomization,
  allowEditing = true,
}) => {
  const [config, setConfig] = useState<StudentCardCustomization>({
    ...DEFAULT_CARD_CUSTOMIZATION,
    ...initialCustomization,
  });

  const [activeTab, setActiveTab] = useState<'themes' | 'branding' | 'fields' | 'batch'>('themes');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      await exportStudentCardHighResPNG(student, config);
      setSaveToast('تم تنزيل صورة الكارت بجودة Ultra HD 300 DPI جاهزة للطباعة!');
      setTimeout(() => setSaveToast(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(student.qrCode || student.studentIdNumber || '34167025');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. TOP HEADER & SUMMARY BANNER */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نظام بطاقات الطلاب والسنتر الذكي</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            كارنيه الطالب المعتمد (PVC ID Card Studio)
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
            تصميم هندسي منظم فائق الجودة مطابق لكارنيهات السنترات والمدرسين مع شريط باركود رقمي، رمز QR مدمج، وتحكم كامل في الألوان والبيانات.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            title="تنزيل الكارت بصيغة PNG عالية الجودة 300 DPI"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'جاري التجهيز...' : 'تنزيل الكارت HD'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
            title="طباعة الكارت بأبعاد بطاقة الهوية الرسمية"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة فورية</span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm font-bold text-emerald-800 flex items-center justify-center gap-2 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* 2. MAIN STUDIO GRID (CARD PREVIEW ON LEFT/CENTER + ORGANIZED CONTROLS ON RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: LIVE CARD PREVIEW & STAGE (7 COLS)                          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Card Presentation Stage */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-8 rounded-3xl border border-slate-700 shadow-xl flex flex-col items-center justify-center min-h-[340px] sm:min-h-[440px] relative overflow-hidden">
            
            {/* Stage ambient grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />

            {/* Top Stage Bar */}
            <div className="w-full flex items-center justify-between z-10 mb-4 sm:mb-6 pb-3 border-b border-slate-700/60 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-slate-300">
                  {isFlipped ? 'معاينة الوجه الخلفي (الشروط والتعليمات)' : 'معاينة الوجه الأمامي (البطاقة الرسمية)'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold rounded-xl border border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 transition-transform ${isFlipped ? 'rotate-180' : ''}`} />
                  <span>{isFlipped ? 'عرض الوجه الأمامي' : 'قلب الكارت للخلف'}</span>
                </button>
              </div>
            </div>

            {/* The Actual Rendered Card */}
            <div className="z-10 py-1 sm:py-2 w-full flex justify-center">
              <StudentCardRenderer
                student={student}
                customization={config}
                showBackSide={isFlipped}
                className="transition-transform duration-300 hover:scale-[1.01]"
              />
            </div>

            {/* Bottom Helper Indicators */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 z-10 mt-6 pt-3 border-t border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>أبعاد الطباعة القياسية: CR80 (85.6mm × 53.9mm)</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyCode}
                  className="text-slate-300 hover:text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'تم نسخ الرمز' : 'نسخ الكود'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل PNG</span>
                </button>
              </div>
            </div>

          </div>

          {/* Quick Specifications Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex items-center justify-between gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>جاهز للاستخدام الفوري على ماسحات الباركود والكاميرات عند باب القاعة.</span>
            </div>
            <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg">
              {student.qrCode || 'HASSTY-34167025'}
            </span>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: ORGANIZED CUSTOMIZATION TABS & SETTINGS (5 COLS)           */}
        {/* ========================================================================= */}
        {allowEditing && (
          <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xs space-y-5">
            
            {/* Customization Tabs Navigation */}
            <div>
              <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-600" />
                <span>لوحة التحكم وتخصيص البطاقة</span>
              </h3>

              <div className="grid grid-cols-3 gap-1.5 bg-gray-100 p-1 rounded-2xl border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('themes')}
                  className={`py-2 px-1 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'themes'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>الألوان</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('branding')}
                  className={`py-2 px-1 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'branding'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>السنتر</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('fields')}
                  className={`py-2 px-1 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'fields'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>الحقول</span>
                </button>
              </div>
            </div>

            {/* TAB 1: THEMES & COLOR PALETTES */}
            {activeTab === 'themes' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-800 block">
                    اختر ثيم اللون الرئيسي للكارت:
                  </label>
                  <p className="text-[11px] text-gray-500">
                    يتم تطبيق اللون فوراً على التموج المنحني للبطاقة والأيقونات.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(Object.keys(THEME_PALETTES) as (keyof typeof THEME_PALETTES)[]).map((key) => {
                    const theme = THEME_PALETTES[key];
                    const isSelected = config.themeColor === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setConfig({ ...config, themeColor: key })}
                        className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden flex items-center gap-3 ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50/60'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl shadow-xs shrink-0 flex items-center justify-center text-white bg-gradient-to-bl ${theme.bgGradient}`}
                        >
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-xs font-black text-gray-900 block truncate">
                            {theme.name.split('(')[0]}
                          </span>
                          <span className="text-[10px] text-gray-500 block truncate">
                            {theme.name.includes('(') ? theme.name.split('(')[1].replace(')', '') : 'فاخر'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: BRANDING & CENTER INFO */}
            {activeTab === 'branding' && (
              <div className="space-y-3.5 text-xs animate-fadeIn">
                <div>
                  <label className="font-bold text-gray-800 block mb-1">اسم السنتر / الأكاديمية أو المدرس:</label>
                  <input
                    type="text"
                    value={config.centerName}
                    onChange={(e) => setConfig({ ...config, centerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-teal-500 outline-none transition-all"
                    placeholder="منظومة حِصّتي — HASSTY أو اسم السنتر"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-800 block mb-1">العام الدراسي:</label>
                  <input
                    type="text"
                    value={config.academicYear}
                    onChange={(e) => setConfig({ ...config, academicYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-teal-500 outline-none transition-all"
                    placeholder="عام دراسي 2026 - 2027"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-800 block mb-1">عنوان البطاقة الرئيسية:</label>
                  <input
                    type="text"
                    value={config.cardTitle}
                    onChange={(e) => setConfig({ ...config, cardTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-teal-500 outline-none transition-all"
                    placeholder="كارت طالب"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-800 block mb-1">شعار التذييل السفلي (Footer Text):</label>
                  <input
                    type="text"
                    value={config.footerText}
                    onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-teal-500 outline-none transition-all"
                    placeholder="POWERED BY HASSTY"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-800 block mb-1">التنبيه والتحذير الأمني السفلي:</label>
                  <input
                    type="text"
                    value={config.disclaimerText}
                    onChange={(e) => setConfig({ ...config, disclaimerText: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-teal-500 outline-none transition-all"
                    placeholder="هذا الكارت خاص بالطالب لدى منصة حِصّتي، يرجى عدم إعارته للآخرين"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: FIELDS & DATA TOGGLES */}
            {activeTab === 'fields' && (
              <div className="space-y-4 animate-fadeIn text-xs">
                
                {/* Field Value Overrides */}
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-gray-800 block mb-1">نص المجموعة / الشعبة:</label>
                    <input
                      type="text"
                      value={config.groupNameText || student.groupName || 'فردي'}
                      onChange={(e) => setConfig({ ...config, groupNameText: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-teal-500 outline-none"
                      placeholder="فردي / سنتر النخبة"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-800 block mb-1">تاريخ الإصدار والإنشاء:</label>
                    <input
                      type="text"
                      value={config.issueDateText}
                      onChange={(e) => setConfig({ ...config, issueDateText: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-teal-500 outline-none"
                      placeholder="2026 / 08 / 18"
                    />
                  </div>
                </div>

                {/* Visibility Checkboxes */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="font-bold text-gray-800 block">إظهار / إخفاء عناصر البطاقة:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'showPhone', label: 'رقم الهاتف' },
                      { key: 'showCity', label: 'المدينة والمحافظة' },
                      { key: 'showGroup', label: 'اسم المجموعة' },
                      { key: 'showIssueDate', label: 'تاريخ الإصدار' },
                      { key: 'showBarcode', label: 'الباركود الرقمي' },
                      { key: 'showQR', label: 'كود الـ QR المصغر' },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(config[item.key as keyof StudentCardCustomization])}
                          onChange={(e) =>
                            setConfig({ ...config, [item.key]: e.target.checked })
                          }
                          className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                        />
                        <span className="font-bold text-gray-800">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Reset Defaults Button */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setConfig(DEFAULT_CARD_CUSTOMIZATION)}
                className="text-xs text-gray-500 hover:text-red-600 font-bold transition-colors cursor-pointer"
              >
                إعادة ضبط للتصميم الافتراضي
              </button>

              <button
                type="button"
                onClick={() => {
                  onSaveCustomization?.(config);
                  setSaveToast('تم حفظ التخصيصات بنجاح!');
                  setTimeout(() => setSaveToast(null), 3000);
                }}
                className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200 transition-colors cursor-pointer"
              >
                حفظ التخصيص
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
