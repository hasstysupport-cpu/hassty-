import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import {
  User,
  Phone,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Globe,
  Sparkles,
  QrCode as QrIcon,
  ShieldCheck,
  Building2,
  GraduationCap,
  AlertCircle,
  Award
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

export const THEME_PALETTES = {
  emerald: {
    id: 'emerald',
    name: 'حِصّتي زمردي (الأصلي المعتمد)',
    bgGradient: 'from-[#005E51] via-[#004D40] to-[#00382E]',
    solidColor: '#005E51',
    accentLight: '#E0F2F1',
    textHighlight: '#80CBC4',
    badgeBg: 'rgba(255, 255, 255, 0.20)',
    borderAccent: 'rgba(255, 255, 255, 0.30)',
  },
  blue: {
    id: 'blue',
    name: 'أزرق ملكي فاخر (Royal Blue)',
    bgGradient: 'from-[#1E40AF] via-[#1D4ED8] to-[#172554]',
    solidColor: '#1D4ED8',
    accentLight: '#EFF6FF',
    textHighlight: '#93C5FD',
    badgeBg: 'rgba(255, 255, 255, 0.20)',
    borderAccent: 'rgba(255, 255, 255, 0.30)',
  },
  purple: {
    id: 'purple',
    name: 'بنفسجي إمبراطوري (Imperial Purple)',
    bgGradient: 'from-[#6B21A8] via-[#7E22CE] to-[#3B0764]',
    solidColor: '#7E22CE',
    accentLight: '#FAF5FF',
    textHighlight: '#D8B4FE',
    badgeBg: 'rgba(255, 255, 255, 0.20)',
    borderAccent: 'rgba(255, 255, 255, 0.30)',
  },
  gold: {
    id: 'gold',
    name: 'أسود وذهبي VIP (Luxury Gold)',
    bgGradient: 'from-[#18181B] via-[#27272A] to-[#09090B]',
    solidColor: '#18181B',
    accentLight: '#FEF08A',
    textHighlight: '#FACC15',
    badgeBg: 'rgba(250, 204, 21, 0.18)',
    borderAccent: 'rgba(250, 204, 21, 0.40)',
  },
  crimson: {
    id: 'crimson',
    name: 'عنابي ياقوتي (Crimson Ruby)',
    bgGradient: 'from-[#9F1239] via-[#BE123C] to-[#4C0519]',
    solidColor: '#BE123C',
    accentLight: '#FFE4E6',
    textHighlight: '#FDA4AF',
    badgeBg: 'rgba(255, 255, 255, 0.20)',
    borderAccent: 'rgba(255, 255, 255, 0.30)',
  },
  slate: {
    id: 'slate',
    name: 'كربوني داكن (Carbon Modern)',
    bgGradient: 'from-[#334155] via-[#1E293B] to-[#0F172A]',
    solidColor: '#1E293B',
    accentLight: '#F1F5F9',
    textHighlight: '#94A3B8',
    badgeBg: 'rgba(255, 255, 255, 0.18)',
    borderAccent: 'rgba(255, 255, 255, 0.25)',
  },
};

export const DEFAULT_CARD_CUSTOMIZATION: StudentCardCustomization = {
  themeColor: 'emerald',
  centerName: 'HASSTY',
  academicYear: 'عام دراسي 2026 - 2027',
  cardTitle: 'كارت طالب',
  footerText: 'POWERED BY HASSTY',
  disclaimerText: 'هذا الكارت خاص بالطالب، يرجى عدم إعارته للآخرين',
  showPhone: true,
  showCity: true,
  showGroup: true,
  showIssueDate: true,
  showBarcode: true,
  showQR: true,
  showAvatar: false,
  groupNameText: 'فردي',
  issueDateText: '2026 / 08 / 18',
  cardOrientation: 'horizontal',
};

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

  const activeTheme = THEME_PALETTES[config.themeColor] || THEME_PALETTES.emerald;
  const barcodeValue = (student.studentIdNumber || student.qrCode || '2026HST09812').replace(/[^0-9A-Za-z]/g, '').slice(0, 14) || '2026HST09812';

  // Generate crisp SVG Barcode
  useEffect(() => {
    if (barcodeRef.current && config.showBarcode) {
      try {
        JsBarcode(barcodeRef.current, barcodeValue, {
          format: 'CODE128',
          width: 1.8,
          height: 48,
          displayValue: false,
          margin: 0,
          background: 'transparent',
          lineColor: '#09090b',
        });
      } catch {
        try {
          JsBarcode(barcodeRef.current, '2026HST09812', {
            format: 'CODE128',
            width: 1.8,
            height: 48,
            displayValue: false,
            margin: 0,
            background: 'transparent',
            lineColor: '#09090b',
          });
        } catch (e) {
          console.error('Barcode render error:', e);
        }
      }
    }
  }, [barcodeValue, config.showBarcode, showBackSide]);

  // Generate mini QR code
  useEffect(() => {
    QRCode.toDataURL(student.qrCode || 'HASSTY-2026HST09812', {
      width: 256,
      margin: 1,
      color: {
        dark: '#004D40',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [student.qrCode]);

  // Spaced out barcode text: "2 0 2 6 H S T 0 9 8 1 2"
  const formattedBarcodeDigits = barcodeValue.split('').join(' ');

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-[640px] flex items-center justify-center overflow-visible mx-auto ${className}`}
      style={{
        height: `${Math.round(380 * activeScale)}px`,
      }}
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
        {/* Outer PVC Card Wrapper with subtle 3D border and glossy finish */}
        <div
          className="w-full h-full rounded-[24px] overflow-hidden shadow-2xl relative border border-slate-700/20 bg-white"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            fontFamily: "'IBM Plex Sans Arabic', 'Cairo', system-ui, sans-serif",
            direction: 'ltr',
          }}
        >
          {/* Realistic Card Glare Overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-40 opacity-25 mix-blend-overlay"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.1) 100%)',
            }}
          />

          {!showBackSide ? (
            /* ========================================================================= */
            /* FRONT SIDE (PERFECT SPLIT: LEFT WHITE + RIGHT EMERALD WAVE)               */
            /* ========================================================================= */
            <div className="w-full h-full flex flex-row relative" style={{ direction: 'ltr' }}>
              
              {/* --------------------------------------------------------------------- */}
              {/* LEFT SIDE: White Section (~42% Width = 268px)                         */}
              {/* --------------------------------------------------------------------- */}
              <div
                className="w-[268px] h-full bg-white p-5 pr-4 flex flex-col justify-between items-stretch text-right relative z-10 shrink-0"
                style={{ direction: 'rtl' }}
              >
                
                {/* 1. Header: كارت طالب + عام دراسي */}
                <div className="space-y-1 pt-1 z-10">
                  <h1 className="text-2xl font-black text-gray-950 tracking-tight leading-none">
                    {config.cardTitle || 'كارت طالب'}
                  </h1>
                  <p className="text-[11px] font-bold text-gray-400">
                    {config.academicYear || 'عام دراسي 2026 - 2027'}
                  </p>
                </div>

                {/* 2. Real Barcode & Spaced Code Numbers */}
                {config.showBarcode && (
                  <div className="w-full flex flex-col items-center justify-center my-auto px-1 z-10">
                    <div className="w-full flex justify-center items-center py-0.5">
                      <svg ref={barcodeRef} className="max-w-[215px] h-[52px] w-full" />
                    </div>
                    <div className="text-center mt-1">
                      <span className="text-[15px] font-black text-gray-900 font-mono tracking-[0.24em] inline-block">
                        {formattedBarcodeDigits}
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. Left Footer: Hassty Platform Brand & Mini QR Code */}
                <div className="w-full flex items-center justify-between pt-2 border-t border-gray-100/90 z-10">
                  
                  {/* Brand & URL */}
                  <div className="space-y-0.5 text-right">
                    <p className="text-[11px] font-black tracking-wider text-gray-700 uppercase">
                      {config.footerText || 'POWERED BY HASSTY'}
                    </p>
                    <p className="text-[9.5px] font-bold text-gray-400">
                      www.hassty.com
                    </p>
                  </div>

                  {/* QR Code */}
                  {config.showQR && (
                    <div className="shrink-0 flex items-center justify-center">
                      <div className="w-13 h-13 bg-white p-0.5 rounded-lg border border-teal-800/30 shadow-2xs flex items-center justify-center overflow-hidden">
                        {qrDataUrl ? (
                          <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                        ) : (
                          <QrIcon className="w-8 h-8 text-teal-700" />
                        )}
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* --------------------------------------------------------------------- */}
              {/* SVG ORGANIC CURVED WAVE SEPARATOR (from X=268 to X=640)              */}
              {/* --------------------------------------------------------------------- */}
              <div className="absolute inset-0 pointer-events-none z-20">
                <svg
                  viewBox="0 0 640 380"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  {/* Organic wave shape spanning the right portion */}
                  <path
                    d="M 268,0 C 248,95 305,185 260,275 C 242,315 255,360 268,380 L 640,380 L 640,0 Z"
                    fill={`url(#hasstyGradient-${config.themeColor})`}
                  />
                  <defs>
                    <linearGradient id={`hasstyGradient-${config.themeColor}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={activeTheme.solidColor} />
                      <stop offset="60%" stopColor={activeTheme.solidColor} />
                      <stop offset="100%" stopColor="#00332A" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* RIGHT SIDE: Luxury Colored Wave Section (~58% Width = 372px)          */}
              {/* --------------------------------------------------------------------- */}
              <div
                className={`w-[372px] h-full bg-gradient-to-bl ${activeTheme.bgGradient} text-white p-6 pl-7 flex flex-col justify-between relative z-30 ml-auto text-right shrink-0`}
                style={{ direction: 'rtl' }}
              >
                
                {/* Background ambient lighting and Graduation Cap Watermark */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-black/20 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -left-4 -bottom-4 opacity-10 pointer-events-none">
                  <GraduationCap className="w-48 h-48 text-white" />
                </div>

                {/* 1. TOP HEADER: HASSTY / BRANDING */}
                <div className="flex flex-col items-start z-10 pb-0.5 text-right">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black tracking-wide text-white leading-tight">
                      {config.centerName || 'HASSTY'}
                    </h2>
                    <GraduationCap className="w-5 h-5 text-teal-300 opacity-90 inline-block" />
                  </div>
                  <span className="text-[11.5px] font-semibold text-teal-100/90 block">
                    إدارة الحضور والتعليم الذكي
                  </span>
                </div>

                {/* 2. STUDENT DATA ROWS */}
                <div className="space-y-2 z-10 my-auto py-0.5">
                  
                  {/* Field 1: اسم الطالب */}
                  <div className="space-y-0.5 text-right">
                    <span className="text-teal-200/90 text-xs font-bold block">
                      اسم الطالب:
                    </span>
                    <h3 className="text-2xl font-black text-white leading-tight drop-shadow-xs truncate max-w-[290px]">
                      {student.name || 'زياد أحمد عبد الله'}
                    </h3>
                  </div>

                  {/* Field 2: المجموعة */}
                  {config.showGroup && (
                    <div className="flex items-center justify-between text-[13px] font-bold">
                      <span className="text-teal-200/90 font-bold text-xs">
                        المجموعة:
                      </span>
                      <span className="text-white font-black text-[14px]">
                        {config.groupNameText || student.groupName || 'فردي'}
                      </span>
                    </div>
                  )}

                  {/* Field 3: رقم الهاتف */}
                  {config.showPhone && (
                    <div className="flex items-center justify-between text-[13px] font-bold">
                      <span className="text-teal-200/90 font-bold text-xs">
                        رقم الهاتف:
                      </span>
                      <span className="font-mono font-black text-white text-[14.5px] tracking-wider" style={{ direction: 'ltr' }}>
                        {student.phone || '01012345678'}
                      </span>
                    </div>
                  )}

                  {/* Field 4: تاريخ الإصدار */}
                  {config.showIssueDate && (
                    <div className="flex items-center justify-between text-[12.5px] font-bold">
                      <span className="text-teal-200/90 font-bold text-xs">
                        تاريخ الإصدار:
                      </span>
                      <span className="font-mono font-black text-white/95 text-[13px]" style={{ direction: 'ltr' }}>
                        {config.issueDateText || '2026 / 08 / 18'}
                      </span>
                    </div>
                  )}

                  {/* Field 5: المدينة / المحافظة */}
                  {config.showCity && (
                    <div className="flex items-center justify-between text-[12.5px] font-bold">
                      <span className="text-teal-200/90 font-bold text-xs">
                        المدينة:
                      </span>
                      <span className="font-bold text-white/95 truncate max-w-[180px] text-[13px]">
                        {student.governorate || 'القاهرة'} {student.area ? `– ${student.area}` : '– حي السفارات'}
                      </span>
                    </div>
                  )}

                </div>

                {/* 3. BOTTOM DISCLAIMER */}
                <div className="pt-1.5 flex items-center justify-start text-[10px] text-teal-100/80 z-10">
                  <span className="truncate max-w-[280px]">
                    {config.disclaimerText || 'هذا الكارت خاص بالطالب، يرجى عدم إعارته للآخرين'}
                  </span>
                </div>

              </div>

            </div>
          ) : (
            /* ========================================================================= */
            /* BACK SIDE: Official Regulations & Emergency Contacts                      */
            /* ========================================================================= */
            <div className="w-full h-full bg-slate-900 text-white p-6 flex flex-col justify-between text-right relative overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-400" />
                  <span className="font-black text-sm text-white">
                    تعليمات وشروط استخدام بطاقة الطالب — منصة حِصّتي
                  </span>
                </div>
                <span className="text-[10px] text-teal-300 font-mono bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                  ID: {student.studentIdNumber || '2026HST09812'}
                </span>
              </div>

              {/* Rules List */}
              <div className="space-y-2 text-[11px] text-gray-300 my-auto py-1">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[9px]">
                    1
                  </span>
                  <p>يجب إبراز هذا الكارت عند بوابة السنتر أو قاعة الحصة لتسجيل الحضور الإلكتروني الفوري.</p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[9px]">
                    2
                  </span>
                  <p>بمجرد مسح الكود، يتم إرسال إشعار فوري لولي الأمر عبر واتساب لتأكيد وقت الحضور والغياب.</p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[9px]">
                    3
                  </span>
                  <p>في حال فقدان الكارت يرجى إبلاغ إدارة السنتر فوراً لإعادة إصداره وإلغاء الكود السابق.</p>
                </div>
              </div>

              {/* Footer Contact & Emergency Bar */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>هاتف طوارئ ولي الأمر: {student.emergencyParentPhone || student.parentPhone || '01000000000'}</span>
                </div>
                <span className="font-bold text-teal-400">HASSTY Smart Attendance</span>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
