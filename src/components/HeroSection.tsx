import React, { useState } from 'react';
import { Search, MapPin, QrCode, BookOpen, GraduationCap, CheckCircle2, Star, ShieldCheck, Sparkles } from 'lucide-react';
import { EGYPT_GOVERNORATES } from '../data/mockData';

interface HeroSectionProps {
  onSearch: (subject: string, governorate: string) => void;
  onOpenQRSimulator: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, onOpenQRSimulator }) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(selectedSubject, selectedGovernorate);
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  ];

  return (
    <section id="hero" className="relative overflow-hidden bg-white pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-gray-100">
      {/* Background subtle radial glow (allowed subtle background accent) */}
      <div 
        className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-50/70 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-10 right-10 w-72 h-72 bg-blue-50/40 rounded-full blur-2xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Right Column (RTL start): Text Content & Search Card */}
          <div className="lg:col-span-7 flex flex-col items-start text-right z-10">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF6FF] border border-blue-200 text-[#2563EB] text-xs sm:text-sm font-semibold mb-6">
              <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-pulse"></span>
              <QrCode className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>حضور موثّق بكود QR لكل حصة</span>
            </div>

            {/* Bold Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1F2937] leading-[1.25] tracking-tight mb-5">
              اعثر على أفضل{' '}
              <span className="text-[#2563EB] relative inline-block">
                المدرسين الخصوصيين
              </span>{' '}
              القريبين منك
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-[#6B7280] leading-relaxed max-w-2xl mb-8">
              منصة متكاملة تربطك بأفضل المدرسين الموثقين في منطقتك، مع نظام تتبع آلي للحضور لضمان التزام ونجاح العملية التعليمية.
            </p>

            {/* Search Card */}
            <form
              onSubmit={handleSubmit}
              className="w-full bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-blue-200 transition-colors"
              id="hero-search-card"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                
                {/* Subject Search Input */}
                <div className="relative">
                  <label htmlFor="hero-subject-input" className="block text-xs font-semibold text-[#1F2937] mb-1.5 text-right">
                    المادة الدراسية
                  </label>
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none stroke-[2]" />
                    <input
                      id="hero-subject-input"
                      type="text"
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      placeholder="ابحث عن مادة... رياضيات، فيزياء، إنجليزي"
                      className="w-full pr-9 pl-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-[#1F2937] placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all text-right"
                    />
                  </div>
                </div>

                {/* Governorate Dropdown */}
                <div className="relative">
                  <label htmlFor="hero-governorate-select" className="block text-xs font-semibold text-[#1F2937] mb-1.5 text-right">
                    المحافظة
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none stroke-[2]" />
                    <select
                      id="hero-governorate-select"
                      value={selectedGovernorate}
                      onChange={(e) => setSelectedGovernorate(e.target.value)}
                      className="w-full pr-9 pl-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-[#1F2937] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all text-right appearance-none cursor-pointer"
                    >
                      <option value="">اختر المحافظة (كل المحافظات)</option>
                      {EGYPT_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              {/* Full-width Search Button */}
              <button
                type="submit"
                className="w-full py-3 px-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
                id="hero-search-submit-btn"
              >
                <Search className="w-5 h-5 stroke-[2.2]" />
                <span>ابحث عن مدرسك</span>
              </button>
            </form>

            {/* Social Proof Below Search */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-right">
              {/* Overlapping circular avatars */}
              <div className="flex items-center -space-x-2 space-x-reverse">
                {sampleAvatars.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt="صورة مدرس موثق"
                    className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ))}
                <div className="w-9 h-9 rounded-full bg-[#EFF6FF] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#2563EB]">
                  +2.4k
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#1F2937]">4.9 / 5</span>
                </div>
                <span className="text-xs font-medium text-[#6B7280]">
                  أكثر من <strong className="text-[#1E3A8A] font-bold">2,400 مدرس موثّق</strong> في انتظارك
                </span>
              </div>
            </div>

          </div>

          {/* Left Column: Flat-Illustration Graphic (Integrated subtly as specified) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Background geometric decorative shapes */}
            <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full border border-blue-200/60 pointer-events-none"></div>
            <div className="absolute bottom-2 -left-4 w-6 h-6 rounded-full bg-blue-100/50 pointer-events-none"></div>
            <div className="absolute top-1/2 -left-8 w-2 h-2 rounded-full bg-[#2563EB]/40 pointer-events-none"></div>

            {/* Flat Illustration / Live QR Interactive preview widget */}
            <div className="w-full max-w-md relative bg-gradient-to-b from-blue-50/50 to-white border border-blue-100 rounded-3xl p-6 sm:p-7 shadow-xs">
              
              {/* Top Card Bar */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-blue-100/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#2563EB] text-white flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#1E3A8A]">بطاقة الطالب الرقمية</h2>
                    <p className="text-[11px] text-[#6B7280]">منظومة الحضور الذكي</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  حساب معتمد
                </span>
              </div>

              {/* Graphic Elements Assembly (Open book + Cap + QR + Checkmark) */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 flex flex-col items-center text-center relative overflow-hidden">
                
                {/* Subtle soft watermark in the illustration background */}
                <div className="absolute -top-4 -left-4 opacity-5 text-[#2563EB] pointer-events-none">
                  <BookOpen className="w-32 h-32" />
                </div>

                {/* QR Code Container with interactive hover */}
                <div className="w-32 h-32 sm:w-36 sm:h-36 bg-[#F8FAFF] border-2 border-dashed border-blue-300 rounded-2xl p-2.5 flex flex-col items-center justify-center relative mb-3 group cursor-pointer"
                  onClick={onOpenQRSimulator}
                  title="اضغط لتجربة مسح كود الـ QR"
                  id="hero-qr-preview-box"
                >
                  <QrCode className="w-full h-full text-[#1E3A8A] stroke-[1.8] group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-[#2563EB]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[11px] font-bold text-[#2563EB] bg-white px-2 py-1 rounded-md shadow-xs">
                      اضغط للمعاينة
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-[#1E3A8A]">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                  <span>كود تعريفي: HST-8921</span>
                </div>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  يمسح عند كل حصة لتسجيل حضور فوري وإشعار ولي الأمر
                </p>
              </div>

              {/* Attendance confirmation simulated badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#EFF6FF] border border-blue-200 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                  <span className="font-semibold text-[#1E3A8A]">آخر عملية مسح:</span>
                  <span className="text-[#6B7280]">حصة الرياضيات (04:30 م)</span>
                </div>
                <span className="font-bold text-[#10B981] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تم الحضور
                </span>
              </div>

              {/* Bottom interactive action button */}
              <button
                onClick={onOpenQRSimulator}
                className="mt-4 w-full py-2.5 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] bg-white hover:bg-blue-50/80 border border-blue-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                id="hero-try-qr-simulator-btn"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>جرّب نظام مسح الـ QR التفاعلي الآن</span>
              </button>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
