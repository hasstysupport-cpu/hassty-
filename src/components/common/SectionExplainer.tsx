/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/**
 * SectionExplainer — شرح مبسط لكل قسم: «القسم ده بيعمل إيه؟»
 * ------------------------------------------------------------
 * صندوق معلومات مضغوط أعلى كل صفحة:
 * - سطر شرح مبسط دائم الظهور (يعمل حتى لمن لا يضغط شيئًا)
 * - زر «إزاي أستفيد منه؟» يفتح نقاط خطوة-بخطوة + ملاحظات مهمة
 * - يذكر اختيار المستخدم (localStorage) فلا يزعجه كل مرة
 */

import React, { useEffect, useState } from 'react';
import { Info, ChevronDown, Lightbulb, AlertCircle } from 'lucide-react';

export interface SectionExplainerProps {
  /** مفتاح تخزين حالة الطي — افتراضيًا يُشتق من العنوان */
  storageKey?: string;
  /** عنوان القسم (مثل: إدارة الطلاب) */
  title: string;
  /** الشرح المبسط في سطر واحد: القسم ده بيعمل إيه؟ */
  text: string;
  /** خطوات الاستفادة العملية (اختياري) */
  steps?: string[];
  /** ملاحظات مهمة / تحذيرات (اختياري) */
  notes?: string[];
  /** مبدئيًا مفتوح؟ (افتراضيًا مقفول إذا زاره قبل كده) */
  defaultOpen?: boolean;
}

export const SectionExplainer: React.FC<SectionExplainerProps> = ({
  storageKey,
  title,
  text,
  steps,
  notes,
  defaultOpen = false,
}) => {
  const key = `hassty_explainer_${storageKey || title}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(key);
      if (!seen) setOpen(true);          // أول زيارة للقسم: مفتوح ليتعرف عليه المستخدم
      else if (defaultOpen) setOpen(true); // أو إذا طُلب فتحه دائمًا
    } catch { /* ignore */ }
  }, [key, defaultOpen]);

  const toggle = () => {
    setOpen((v) => !v);
    try { localStorage.setItem(key, '1'); } catch { /* ignore */ }
  };

  return (
    <div dir="rtl" className="rounded-2xl border border-sky-200/80 bg-gradient-to-l from-sky-50 via-white to-white overflow-hidden">
      {/* السطر الدائم */}
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <p className="text-[11.5px] font-bold text-slate-700 leading-5 flex-1 min-w-0">
          <span className="font-black text-sky-800">«{title}»</span> — {text}
        </p>
        {(steps?.length || notes?.length) ? (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-label="شرح القسم"
            className="shrink-0 rounded-xl border border-sky-200 bg-white px-2.5 py-1.5 text-[10.5px] font-black text-sky-700 hover:bg-sky-50 transition-colors flex items-center gap-1 cursor-pointer"
          >
            إزاي أستفيد منه؟
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        ) : null}
      </div>

      {/* التفاصيل القابلة للفتح */}
      {open && (steps?.length || notes?.length) ? (
        <div className="border-t border-sky-100 bg-white/70 px-4 py-3 space-y-2.5 anim-fade">
          {steps?.length ? (
            <div>
              <div className="text-[11px] font-black text-slate-600 flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                خطوات الاستخدام
              </div>
              <ol className="space-y-1">
                {steps.map((s, i) => (
                  <li key={i} className="text-[11px] font-bold text-slate-600 leading-5 flex gap-2">
                    <span className="w-4.5 h-4.5 rounded-full bg-sky-100 text-sky-700 text-[9.5px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span className="flex-1">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {notes?.length ? (
            <div>
              <div className="text-[11px] font-black text-slate-600 flex items-center gap-1.5 mb-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                ملاحظات مهمة
              </div>
              <ul className="space-y-1">
                {notes.map((n, i) => (
                  <li key={i} className="text-[11px] font-bold text-amber-800/90 leading-5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5">{n}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
