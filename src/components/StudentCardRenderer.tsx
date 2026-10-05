/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو النشر أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import {
  QrCode as QrIcon,
  ShieldCheck,
  Building2,
  GraduationCap,
  AlertCircle,
  ScanLine,
  Globe,
  Phone,
  MapPin,
  Users,
  CalendarDays,
  BadgeCheck,
} from 'lucide-react';
import { StudentProfile, StudentCardCustomization } from '../types';

export interface StudentCardRendererProps {
  student: StudentProfile;
  customization?: Partial<StudentCardCustomization>;
  showBackSide?: boolean;
  scale?: number;
  className?: string;
  id?: string;
}

/* لوحات الألوان — obsidian هو التصميم الحصري الافتراضي (أسود أوبسيديان + ذهبي) */
export const THEME_PALETTES = {
  obsidian: {
    id: 'obsidian',
    name: 'أوبسيديان ذهبي (الحصري الفاخر)',
    bgGradient: 'from-[#0C0C12] via-[#15151F] to-[#08080C]',
    solidColor: '#15151F',
    accent: '#E3C878',
    accentDeep: '#A98B3F',
    accentLight: '#F7ECD2',
    badgeBg: 'rgba(227, 200, 120, 0.14)',
    borderAccent: 'rgba(227, 200, 120, 0.45)',
  },
  emerald: {
    id: 'emerald',
    name: 'زمردي ملكي',
    bgGradient: 'from-[#02251F] via-[#004D40] to-[#01251E]',
    solidColor: '#004D40',
    accent: '#7FE0C3',
    accentDeep: '#00695C',
    accentLight: '#D7F5EC',
    badgeBg: 'rgba(127, 224, 195, 0.14)',
    borderAccent: 'rgba(127, 224, 195, 0.45)',
  },
  blue: {
    id: 'blue',
    name: 'أزرق ملكي',
    bgGradient: 'from-[#0B1B4D] via-[#1D4ED8] to-[#0A1436]',
    solidColor: '#1D4ED8',
    accent: '#9DC1FF',
    accentDeep: '#1E40AF',
    accentLight: '#E0EBFF',
    badgeBg: 'rgba(157, 193, 255, 0.14)',
    borderAccent: 'rgba(157, 193, 255, 0.45)',
  },
  purple: {
    id: 'purple',
    name: 'بنفسجي إمبراطوري',
    bgGradient: 'from-[#2A0A4A] via-[#7E22CE] to-[#1C0634]',
    solidColor: '#7E22CE',
    accent: '#E2C4FF',
    accentDeep: '#6B21A8',
    accentLight: '#F3E8FF',
    badgeBg: 'rgba(226, 196, 255, 0.14)',
    borderAccent: 'rgba(226, 196, 255, 0.45)',
  },
  gold: {
    id: 'gold',
    name: 'ذهبي VIP',
    bgGradient: 'from-[#14110A] via-[#2A2213] to-[#0B0906]',
    solidColor: '#2A2213',
    accent: '#F5D06F',
    accentDeep: '#8A6D1F',
    accentLight: '#FBF0D2',
    badgeBg: 'rgba(245, 208, 111, 0.15)',
    borderAccent: 'rgba(245, 208, 111, 0.5)',
  },
  crimson: {
    id: 'crimson',
    name: 'عنابي ياقوتي',
    bgGradient: 'from-[#3D0517] via-[#9F1239] to-[#260310]',
    solidColor: '#9F1239',
    accent: '#FFB4C4',
    accentDeep: '#881337',
    accentLight: '#FFE4EA',
    badgeBg: 'rgba(255, 180, 196, 0.14)',
    borderAccent: 'rgba(255, 180, 196, 0.45)',
  },
  slate: {
    id: 'slate',
    name: 'كربوني بلاتيني',
    bgGradient: 'from-[#101828] via-[#1E293B] to-[#0B1120]',
    solidColor: '#1E293B',
    accent: '#C7D6EA',
    accentDeep: '#334155',
    accentLight: '#EEF3F9',
    badgeBg: 'rgba(199, 214, 234, 0.14)',
    borderAccent: 'rgba(199, 214, 234, 0.4)',
  },
} as const;

export const DEFAULT_CARD_CUSTOMIZATION: StudentCardCustomization = {
  themeColor: 'obsidian',
  centerName: 'HASSTY',
  academicYear: 'عام دراسي 2026 - 2027',
  cardTitle: 'كارت طالب',
  footerText: 'منصة حِصّتي التعليمية',
  disclaimerText: 'هذا الكارت خاص بالطالب، يرجى عدم إعارته للآخرين',
  showPhone: true,
  showCity: true,
  showGroup: true,
  showIssueDate: true,
  showBarcode: true,
  showQR: true,
  showAvatar: false,
  groupNameText: 'فردي',
  issueDateText: '',
  cardOrientation: 'horizontal',
};

const todayEgypt = () => new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });

export const StudentCardRenderer: React.FC<StudentCardRendererProps> = ({
  student,
  customization = {},
  showBackSide = false,
  scale,
  className = '',
  id = 'student-card-renderer',
}) => {
  const config: StudentCardCustomization = {
    ...DEFAULT_CARD_CUSTOMIZATION,
    ...customization,
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);
  const [autoScale, setAutoScale] = useState<number>(1);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Responsive scale calculation based on parent container width
  useEffect(() => {
    const calculateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth;
        if (availableWidth > 0 && availableWidth < 640) {
          const calculated = Math.min(1, Math.max(0.32, (availableWidth - 8) / 640));
          setAutoScale(calculated);
        } else {
          setAutoScale(1);
        }
      }
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => calculateScale());
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', calculateScale);
      if (observer) observer.disconnect();
    };
  }, []);

  const activeScale = scale !== undefined ? scale : autoScale;

  const activeTheme = (THEME_PALETTES as any)[config.themeColor] || (THEME_PALETTES as any).obsidian;
  const accent = (activeTheme as any).accent || '#E3C878';
  const accentDeep = (activeTheme as any).accentDeep || '#A98B3F';
  const accentLight = (activeTheme as any).accentLight || '#F7ECD2';

  /* الكود الحقيقي الموحد (profiles.qr_code — نفس ما يقرأه ماسح المدرس) */
  const cardCode = student.qrCode || student.qrCodeValue || '';
  const barcodeValue = (student.studentIdNumber || cardCode.replace(/[^0-9A-Za-z-]/g, '') || '2026HST01').replace(/-/g, '').slice(0, 14) || '2026HST01';

  // Generate crisp SVG Barcode
  useEffect(() => {
    if (barcodeRef.current && config.showBarcode) {
      try {
        JsBarcode(barcodeRef.current, barcodeValue, {
          format: 'CODE128',
          width: 1.7,
          height: 40,
          displayValue: false,
          margin: 0,
          background: 'transparent',
          lineColor: accentDeep,
        });
      } catch {
        try {
          JsBarcode(barcodeRef.current, '2026HST01', {
            format: 'CODE128',
            width: 1.7,
            height: 40,
            displayValue: false,
            margin: 0,
            background: 'transparent',
            lineColor: accentDeep,
          });
        } catch (e) {
          console.error('Barcode render error:', e);
        }
      }
    }
  }, [barcodeValue, config.showBarcode, showBackSide, accentDeep]);

  // Generate the PROMINENT QR — دقة عالية + تصحيح أخطاء H ليقرأ فورًا حتى من شاشة مضيئة
  useEffect(() => {
    QRCode.toDataURL(cardCode || 'HASSTY-2026HST01', {
      width: 512,
      margin: 1,
      color: { dark: '#0B0B10', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [cardCode]);

  const issueDateText = config.issueDateText || todayEgypt();
  const spacedCode = cardCode.replace(/-/g, ' ');

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-[640px] flex items-center justify-center overflow-visible mx-auto ${className}`}
      style={{ height: `${Math.round(380 * activeScale)}px` }}
    >
      <div
        id={id}
        className="relative select-none shrink-0"
        style={{
          width: '640px',
          height: '380px',
          minWidth: '640px',
          minHeight: '380px',
          transform: `scale(${activeScale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* الغلاف الخارجي PVC مع إطار ذهبي رفيع */}
        <div
          className="w-full h-full rounded-[26px] overflow-hidden relative"
          style={{
            background: activeTheme.bgGradient.includes('from-') ? undefined : activeTheme.solidColor,
            boxShadow: `0 30px 60px -18px rgba(0,0,0,0.55), 0 0 0 1px ${activeTheme.borderAccent}`,
            fontFamily: "'IBM Plex Sans Arabic', 'Cairo', system-ui, sans-serif",
            direction: 'ltr',
          }}
        >
          {/* الخلفية المتدرجة الفاخرة */}
          <div className={`absolute inset-0 bg-gradient-to-bl ${activeTheme.bgGradient}`} />

          {/* نقشة قطرية خفيفة (فخامة) */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" aria-hidden>
            <defs>
              <pattern id={`hst-diag-${config.themeColor}`} width="14" height="14" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="14" stroke="#FFFFFF" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#hst-diag-${config.themeColor})`} />
          </svg>

          {/* إطار داخلي ذهبي رفيع */}
          <div className="absolute inset-[10px] rounded-[18px] pointer-events-none" style={{ border: `1.5px solid ${activeTheme.borderAccent}`, opacity: 0.75 }} />

          {/* بريق هولوغرافي واقعي */}
          <div
            className="absolute inset-0 pointer-events-none z-40 opacity-30 mix-blend-overlay"
            style={{ background: 'linear-gradient(125deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.04) 38%, rgba(0,0,0,0.12) 72%, rgba(255,255,255,0.18) 100%)' }}
          />

          {!showBackSide ? (
            /* ================================================================ */
            /* الوجه الأمامي: يسار QR بارز + يمين بيانات الطالب الفاخرة          */
            /* ================================================================ */
            <div className="w-full h-full flex flex-row relative z-10">

              {/* ---------------- الجانب الأيسر: QR بارز في لوح أبيض ---------------- */}
              <div className="w-[252px] h-full p-4 pl-5 flex flex-col items-center justify-between shrink-0" style={{ direction: 'rtl' }}>

                {/* شارة رسمية أعلى اللوح */}
                <div className="w-full flex items-center justify-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: accent }} />
                  <span className="text-[10px] font-black tracking-wide" style={{ color: accent }}>
                    كارت رسمي معتمد
                  </span>
                </div>

                {/* لوح الـ QR البارز — إطار مزدوج ذهبي */}
                {config.showQR ? (
                  <div className="relative rounded-[20px] p-[7px]" style={{ background: `linear-gradient(140deg, ${accent}, ${accentDeep} 55%, ${accent})`, boxShadow: '0 14px 30px -10px rgba(0,0,0,0.65)' }}>
                    <div className="rounded-[15px] bg-white p-[9px]">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="QR كود الطالب الفريد" className="w-[150px] h-[150px] object-contain block" />
                      ) : (
                        <div className="w-[150px] h-[150px] flex items-center justify-center"><QrIcon className="w-16 h-16 text-slate-300" /></div>
                      )}
                    </div>
                    {/* مؤشرات المسح في الأركان */}
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2" style={{ borderColor: accent, background: '#0C0C12' }} />
                    <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full border-2" style={{ borderColor: accent, background: '#0C0C12' }} />
                  </div>
                ) : <div className="h-[170px]" />}

                {/* تلميح المسح + الكود الفريد */}
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1 text-[9.5px] font-bold" style={{ color: accentLight }}>
                    <ScanLine className="w-3 h-3" />
                    <span>امسح الكود — حضور فوري في ثوانٍ</span>
                  </div>
                  <div className="font-mono font-black text-[12.5px] tracking-[0.18em]" style={{ color: accent }} dir="ltr">
                    {cardCode || 'HASSTY-XXXXXXXXXX'}
                  </div>
                </div>

                {/* الباركود الصغير أسفل اللوح */}
                {config.showBarcode && (
                  <div className="w-full flex flex-col items-center gap-0.5 pb-1">
                    <svg ref={barcodeRef} className="w-[190px] h-[34px]" />
                    <span className="text-[8.5px] font-mono tracking-[0.3em]" style={{ color: accentLight, opacity: 0.85 }} dir="ltr">
                      {barcodeValue.split('').join(' ')}
                    </span>
                  </div>
                )}
              </div>

              {/* فاصل عمودي ذهبي متدرج */}
              <div className="w-[2px] h-[calc(100%-56px)] self-center rounded-full" style={{ background: `linear-gradient(180deg, transparent, ${accent}, transparent)`, opacity: 0.55 }} />

              {/* ---------------- الجانب الأيمن: هوية الطالب والمنصة ---------------- */}
              <div className="flex-1 h-full p-5 pr-6 flex flex-col justify-between relative" style={{ direction: 'rtl' }}>

                {/* توهجات خلفية */}
                <div className="absolute top-0 left-0 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: `${accent}14` }} />
                <div className="absolute -bottom-8 -right-8 opacity-[0.07] pointer-events-none">
                  <GraduationCap className="w-44 h-44 text-white" />
                </div>

                {/* الترويسة: علامة المنصة + شارة التحقق */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(140deg, ${accent}, ${accentDeep})`, boxShadow: '0 6px 14px -4px rgba(0,0,0,0.5)' }}>
                      <GraduationCap className="w-5.5 h-5.5 text-[#0C0C12]" />
                    </div>
                    <div className="space-y-0">
                      <h2 className="text-xl font-black text-white leading-none tracking-tight">{config.centerName || 'HASSTY'}</h2>
                      <p className="text-[9.5px] font-bold" style={{ color: accent }}>منصة حِصّتي التعليمية</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-black" style={{ borderColor: activeTheme.borderAccent, background: activeTheme.badgeBg, color: accent }}>
                    <BadgeCheck className="w-3 h-3" />
                    <span>موثّق 2026/2027</span>
                  </div>
                </div>

                {/* بيانات الطالب */}
                <div className="space-y-[7px] my-1 relative z-10">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black tracking-wide" style={{ color: accent }}>اسم الطالب</span>
                    <h3 className="text-[25px] font-black text-white leading-tight drop-shadow-sm truncate max-w-[320px]">{student.name || 'اسم الطالب'}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-[6px] pt-1">
                    <CardField icon={<GraduationCap className="w-3 h-3" />} label="الصف" value={student.grade || '—'} accent={accent} />
                    {config.showGroup && <CardField icon={<Users className="w-3 h-3" />} label="المجموعة" value={config.groupNameText || student.groupName || 'فردي'} accent={accent} />}
                    {config.showPhone && <CardField icon={<Phone className="w-3 h-3" />} label="الهاتف" value={student.phone || '—'} accent={accent} mono />}
                    {config.showCity && <CardField icon={<MapPin className="w-3 h-3" />} label="المحافظة" value={`${student.governorate || 'القاهرة'}${student.area ? ` – ${student.area}` : ''}`} accent={accent} />}
                    {config.showIssueDate && <CardField icon={<CalendarDays className="w-3 h-3" />} label="إصدار الكارت" value={issueDateText} accent={accent} mono />}
                    <CardField icon={<Globe className="w-3 h-3" />} label="المنصة" value="hassty.site" accent={accent} mono />
                  </div>
                </div>

                {/* الشريط السفلي: المنصة + إخلاء المسؤولية */}
                <div className="relative z-10 rounded-2xl px-3.5 py-2 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.045)', border: `1px solid ${activeTheme.borderAccent}` }}>
                  <span className="text-[9.5px] font-bold truncate max-w-[300px]" style={{ color: accentLight, opacity: 0.9 }}>
                    {config.disclaimerText || 'هذا الكارت خاص بالطالب، يرجى عدم إعارته للآخرين'}
                  </span>
                  <span className="text-[10px] font-black tracking-widest shrink-0" style={{ color: accent }} dir="ltr">
                    hassty.site
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* ================================================================ */
            /* الوجه الخلفي: التعليمات + طوارئ ولي الأمر + هوية المنصة           */
            /* ================================================================ */
            <div className="w-full h-full relative z-10 text-white p-6 flex flex-col justify-between" style={{ direction: 'rtl' }}>

              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: activeTheme.borderAccent }}>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" style={{ color: accent }} />
                  <span className="font-black text-sm text-white">تعليمات استخدام كارت الطالب — منصة حِصّتي</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ color: accent, borderColor: activeTheme.borderAccent, background: activeTheme.badgeBg }} dir="ltr">
                  ID: {cardCode || '—'}
                </span>
              </div>

              <div className="space-y-2.5 text-[11px] text-gray-300 my-auto py-1">
                {[
                  'يجب إبراز هذا الكارت عند بوابة السنتر أو قاعة الحصة لتسجيل الحضور الإلكتروني الفوري — المسح يستغرق أقل من ثانيتين.',
                  'بمجرد مسح الكود يُسجل الحضور في سجل المدرس ويصل إشعار فوري لولي الأمر (واتساب + إشعارات المنصة) بتأكيد الحضور أو الغياب.',
                  'كود QR الفريد خاص بك وحدك ولا يعمل مع أي طالب آخر — في حال فقدان الكارت أعد إصداره فورًا من صفحة الكارت داخل المنصة.',
                  'يمكن للمدرس تحصيل الاشتراك الشهري بمسح نفس الكود، ويصل إيصال الدفع لولي الأمر تلقائيًا.',
                ].map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full font-bold flex items-center justify-center shrink-0 mt-0.5 text-[9px]" style={{ background: activeTheme.badgeBg, color: accent, border: `1px solid ${activeTheme.borderAccent}` }}>
                      {idx + 1}
                    </span>
                    <p className="leading-relaxed">{rule}</p>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t flex items-center justify-between text-[10px] text-gray-400" style={{ borderColor: activeTheme.borderAccent }}>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>هاتف طوارئ ولي الأمر: {student.emergencyParentPhone || student.parentPhone || 'غير مسجل — أضفه من الإعدادات'}</span>
                </div>
                <span className="font-black flex items-center gap-1" style={{ color: accent }}>
                  <Globe className="w-3 h-3" /> hassty.site
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* حقل بيانات صغير موحد */
const CardField = ({ icon, label, value, accent, mono = false }: { icon: React.ReactNode; label: string; value: string; accent: string; mono?: boolean }) => (
  <div className="space-y-0">
    <span className="text-[9px] font-bold flex items-center gap-1" style={{ color: accent, opacity: 0.85 }}>
      {icon}
      <span>{label}</span>
    </span>
    <span className={`block text-[12.5px] font-black text-white truncate ${mono ? 'font-mono tracking-wide' : ''}`} style={mono ? { direction: 'ltr', textAlign: 'right' } : undefined}>
      {value}
    </span>
  </div>
);
