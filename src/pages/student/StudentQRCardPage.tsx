import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Info,
  MapPin,
  Copy,
  Check,
  Image as ImageIcon,
  CreditCard,
  Eye
} from 'lucide-react';
import { MOCK_CURRENT_STUDENT } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';
import { downloadStudentQRImage, downloadFullStudentCardImage } from '../../utils/qrImageGenerator';

export const StudentQRCardPage: React.FC = () => {
  const student = MOCK_CURRENT_STUDENT;
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'card' | 'qrOnly'>('card');

  // Generate crisp QR code on mount
  useEffect(() => {
    QRCode.toDataURL(student.qrCode, {
      width: 400,
      margin: 1,
      color: {
        dark: '#1E3A8A',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    }).then((url) => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error('Failed to generate QR code data URL', err);
    });
  }, [student.qrCode]);

  const handleDownloadQRImage = async () => {
    try {
      setIsDownloading(true);
      await downloadStudentQRImage(student);
      setDownloadSuccessMessage('تم حفظ صورة كود الـ QR بنجاح على جهازك (PNG)!');
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadFullCard = async () => {
    try {
      setIsDownloading(true);
      await downloadFullStudentCardImage(student);
      setDownloadSuccessMessage('تم حفظ صورة الكارنيه بالكامل بنجاح على جهازك (PNG)!');
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(student.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (navigator.share && qrDataUrl) {
      try {
        await navigator.share({
          title: `كود حضور الطالب: ${student.name}`,
          text: `كود تسجيل حضور الطالب في منصة حصتي: ${student.qrCode}`,
        });
      } catch {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="space-y-8 text-right max-w-4xl mx-auto">
      
      {/* Top Intro & Action Center */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
              <QrCode className="w-3.5 h-3.5" />
              <span>بطاقة وكود الطالب الذكي</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
              كود الـ QR الرقمي لتسجيل الحضور
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1 max-w-xl">
              احفظ كود الـ QR كصورة في معرض الصور بهاتفك أو محفظتك للوصول السريع ومسح الحضور حتى بدون اتصال بالإنترنت.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadQRImage}
              disabled={isDownloading}
              className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              title="حفظ كود الـ QR كملف صورة بجهازك"
            >
              <Download className="w-4 h-4" />
              <span>حفظ الـ QR كصورة</span>
            </button>

            <button
              onClick={handleDownloadFullCard}
              disabled={isDownloading}
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              title="حفظ صورة الكارنيه كاملاً بجودة عالية"
            >
              <CreditCard className="w-4 h-4" />
              <span>حفظ الكارنيه كاملاً</span>
            </button>

            <button
              onClick={handlePrintCard}
              className="px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-[#1F2937] text-xs font-bold rounded-xl border border-[#E5E7EB] transition-colors flex items-center gap-1.5 cursor-pointer"
              title="طباعة ورقية"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* View Switcher Bar */}
        <div className="flex items-center justify-between border-t border-gray-100 mt-6 pt-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Eye className="w-3.5 h-3.5 text-gray-400" />
            <span>طريقة المعاينة:</span>
            <div className="inline-flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveView('card')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'card'
                    ? 'bg-white text-[#1E3A8A] shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                كارنيه الطالب الكامل
              </button>
              <button
                onClick={() => setActiveView('qrOnly')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'qrOnly'
                    ? 'bg-white text-[#2563EB] shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                كود الـ QR المباشر
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="text-xs text-gray-600 hover:text-[#2563EB] font-bold flex items-center gap-1 cursor-pointer bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم نسخ الرمز' : 'نسخ رمز الكود'}</span>
            </button>

            <button
              onClick={handleShare}
              className="text-xs text-gray-600 hover:text-[#2563EB] font-bold flex items-center gap-1 cursor-pointer bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة</span>
            </button>
          </div>
        </div>
      </div>

      {downloadSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm font-bold text-emerald-800 flex items-center justify-center gap-2 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {/* ACTIVE VIEW DISPLAY */}
      {activeView === 'card' ? (
        /* ID CARD VISUAL (PRINTABLE FORMAT) */
        <div className="bg-[#1E3A8A] text-white rounded-3xl p-6 sm:p-10 shadow-xl max-w-md mx-auto relative overflow-hidden border-4 border-blue-400/30">
          
          {/* Background Watermark/Pattern */}
          <div className="absolute -left-10 -bottom-10 opacity-10 pointer-events-none">
            <QrCode className="w-64 h-64" />
          </div>

          {/* Card Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/20 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">حِصّتي</h3>
                <span className="text-[10px] text-blue-200 block">بطاقة طالب معتمدة</span>
              </div>
            </div>
            <Badge variant="info" size="sm">مصر 2026</Badge>
          </div>

          {/* Card Body */}
          <div className="py-6 space-y-6 relative z-10">
            
            {/* Avatar + Info */}
            <div className="flex items-center gap-4">
              <img
                src={student.avatarUrl}
                alt={student.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white ring-2 ring-blue-300 shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-1">
                <h4 className="text-lg font-black text-white">{student.name}</h4>
                <p className="text-xs text-blue-200 font-semibold">{student.grade}</p>
                <div className="flex items-center gap-1 text-[11px] text-blue-300">
                  <MapPin className="w-3 h-3" />
                  <span>{student.governorate} — {student.area}</span>
                </div>
              </div>
            </div>

            {/* REAL HIGH RESOLUTION QR CODE BOX */}
            <div className="bg-white p-4 rounded-2xl shadow-md text-center max-w-[240px] mx-auto border-2 border-blue-200">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${student.name}`}
                  className="w-48 h-48 mx-auto rounded-lg object-contain"
                />
              ) : (
                <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                  جاري تجهيز الكود...
                </div>
              )}

              <p className="text-xs font-mono font-black text-[#1E3A8A] mt-2 bg-blue-50 py-1 px-2 rounded-md">
                {student.qrCode}
              </p>
            </div>

          </div>

          {/* Card Footer */}
          <div className="pt-4 border-t border-white/20 flex items-center justify-between text-[11px] text-blue-200 relative z-10">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>موثق رسمياً بنظام حصتي</span>
            </span>
            <span>صالح حتى: 2026/2027</span>
          </div>

        </div>
      ) : (
        /* PURE QR CODE PREVIEW CARD */
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-10 shadow-lg max-w-sm mx-auto text-center space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#1E3A8A]">{student.name}</h3>
            <p className="text-xs text-gray-500">{student.grade} • {student.governorate}</p>
          </div>

          <div className="p-4 bg-blue-50/50 rounded-2xl border-2 border-blue-100 inline-block">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt={student.qrCode}
                className="w-56 h-56 mx-auto rounded-xl shadow-xs"
              />
            )}
            <p className="text-sm font-mono font-black text-[#2563EB] mt-3">
              {student.qrCode}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleDownloadQRImage}
              className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل هذه الصورة على الهاتف الآن</span>
            </button>
          </div>
        </div>
      )}

      {/* Offline Storage Tip Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-white border border-blue-200/80 rounded-3xl p-5 sm:p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Smartphone className="w-6 h-6" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-[#1E3A8A]">
            نصيحة: احفظ الصورة في المفضلة بمعرض صور هاتفك
          </h4>
          <p className="text-xs text-[#4B5563] leading-relaxed">
            عند حفظ الصورة على جهازك، ستتمكن من إظهار الكود للمدرس في أي وقت عند باب السنتر أو الحصة حتى بدون إنترنت أو باقة بيانات.
          </p>
        </div>
      </div>

      {/* Instructions Box */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#1E3A8A] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#2563EB]" />
          <span>كيف تستخدم هذا الكارنيه في الحصص؟</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#4B5563]">
          <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5 border border-gray-100">
            <span className="font-bold text-[#2563EB] block text-sm">1. عند دخول الحصة</span>
            <p>أظهر الصورة المحفوظة على هاتفك أو اطبع الكارنيه واحتفظ به في محفظتك المدرسية.</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5 border border-gray-100">
            <span className="font-bold text-[#2563EB] block text-sm">2. المسح السريع</span>
            <p>يقوم المعلم بمسح الكود بكاميرا هاتفه في ثانية واحدة لتسجيل حضورك الفوري.</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5 border border-gray-100">
            <span className="font-bold text-[#2563EB] block text-sm">3. إشعار ولي الأمر</span>
            <p>يصل إشعار فوري لولي أمرك على واتساب لتأكيد وصولك للحصة وسداد المصاريف بأمان.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

