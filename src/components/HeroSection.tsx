import React, { useState } from 'react';
import { Search, QrCode, BookOpen, GraduationCap, CheckCircle2, Star, ShieldCheck, Sparkles, Compass, Atom, Award } from 'lucide-react';
import { LocationSelector } from './common/LocationSelector';

interface HeroSectionProps {
  onSearch: (subject: string, governorate: string, city?: string) => void;
  onOpenQRSimulator: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, onOpenQRSimulator }) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Require Governorate and City
    if (!selectedGovernorate) {
      setErrorMessage('يرجى تحديد المحافظة أولاً للمتابعة');
      return;
    }
    if (!selectedCity) {
      setErrorMessage(`يرجى تحديد المدينة أو المنطقة داخل محافظة ${selectedGovernorate}`);
      return;
    }

    setErrorMessage('');
    onSearch(selectedSubject, selectedGovernorate, selectedCity);
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  ];

  return (
    <section id="hero" className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-blue-100/80 bg-hero-mesh">
      
      {/* 1. Branded Atmospheric Gradient Layers */}
      <div 
        className="absolute top-0 right-1/4 -translate-y-1/3 w-[600px] sm:w-[800px] h-[500px] bg-gradient-to-br from-blue-400/15 via-indigo-300/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div 
        className="absolute top-1/3 left-0 -translate-x-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-sky-400/15 via-blue-200/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-0 right-10 w-[450px] h-[400px] bg-gradient-to-tl from-emerald-300/12 via-teal-100/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* 2. Branded Watermark: Giant QR & Egyptian Educational Motif */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full pointer-events-none -z-10 overflow-hidden select-none opacity-40 sm:opacity-55">
        {/* Large Decorative QR Matrix Watermark */}
        <div className="absolute top-6 left-[2%] sm:left-[8%] w-56 h-56 sm:w-80 sm:h-80 border-2 border-blue-200/40 rounded-3xl p-6 flex flex-col justify-between -rotate-6">
          <div className="flex justify-between">
            <div className="w-10 h-10 border-4 border-blue-300/50 rounded-lg p-1.5 flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-400/40 rounded-xs" />
            </div>
            <div className="w-10 h-10 border-4 border-blue-300/50 rounded-lg p-1.5 flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-400/40 rounded-xs" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-blue-400/30 rounded-xs" />
            <div className="w-6 h-2 bg-blue-400/30 rounded-xs" />
            <div className="w-2 h-6 bg-blue-400/30 rounded-xs" />
          </div>
          <div className="flex justify-between items-end">
            <div className="w-10 h-10 border-4 border-blue-300/50 rounded-lg p-1.5 flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-400/40 rounded-xs" />
            </div>
            <div className="text-[10px] font-mono font-black text-blue-300/40 tracking-widest">HASSTY-QR</div>
          </div>
        </div>

        {/* Floating Geometric Concentric Orbital Rings */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full border border-blue-200/30 animate-spin-slow" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full border border-dashed border-sky-300/40" />
      </div>

      {/* 3. Floating Interactive Brand Identity Badges (Responsive: Works on Mobile & Desktop) */}
      {/* Badge 1: Top Right - Science & Physics */}
      <div className="absolute top-4 sm:top-12 right-[3%] sm:right-[7%] p-2 sm:p-3 rounded-2xl bg-white/90 backdrop-blur-xs border border-blue-100 shadow-sm animate-float-slow pointer-events-none flex items-center gap-2 z-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
          <Atom className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="text-right">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#1E3A8A] block">علوم وفيزياء</span>
          <span className="text-[8px] sm:text-[9px] text-[#6B7280] hidden sm:block">شرح وتجارب عملية</span>
        </div>
      </div>

      {/* Badge 2: Middle Left - Math & Engineering */}
      <div className="absolute top-24 sm:top-36 left-[2%] sm:left-[5%] p-2 sm:p-3 rounded-2xl bg-white/90 backdrop-blur-xs border border-emerald-100 shadow-sm animate-float-reverse pointer-events-none flex items-center gap-2 z-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0">
          <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="text-right">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#1E3A8A] block">رياضيات وهندسة</span>
          <span className="text-[8px] sm:text-[9px] text-[#6B7280] hidden sm:block">فهم وحل مسائل</span>
        </div>
      </div>

      {/* Badge 3: Bottom Right - Top Verified Tutors */}
      <div className="absolute bottom-8 sm:bottom-16 right-[2%] sm:right-[4%] p-2 sm:p-3 rounded-2xl bg-white/90 backdrop-blur-xs border border-amber-100 shadow-sm animate-float-reverse pointer-events-none hidden sm:flex items-center gap-2 z-0">
        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
          <Award className="w-4 h-4" />
        </div>
        <div className="text-right">
          <span className="text-[11px] font-bold text-[#1E3A8A] block">أعلى التقييمات</span>
          <span className="text-[9px] text-[#6B7280]">مدرسين أوائل معتمدين</span>
        </div>
      </div>

      {/* Floating Decorative Brand Glyphs */}
      <div className="absolute top-16 right-[22%] w-3.5 h-3.5 rounded-full bg-blue-500/25 animate-float-slow pointer-events-none"></div>
      <div className="absolute top-44 left-[14%] w-5 h-5 rounded-lg border-2 border-blue-400/35 rotate-12 animate-float-reverse pointer-events-none"></div>
      <div className="absolute bottom-28 left-[18%] w-3 h-3 rounded-full bg-emerald-400/35 animate-float-slow pointer-events-none"></div>
      <div className="absolute top-2/3 right-[6%] w-4 h-4 rounded-md border-2 border-amber-300/40 -rotate-12 animate-float-slow pointer-events-none hidden sm:block"></div>
      <div className="absolute bottom-8 left-1/3 w-2.5 h-2.5 rounded-full bg-indigo-400/30 animate-pulse pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Right Column (RTL start): Text Content & Search Card */}
          <div className="lg:col-span-7 flex flex-col items-start text-right z-10">
            
            {/* Pill Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-5 sm:mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-[#2563EB] text-xs sm:text-sm font-bold shadow-2xs">
                <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-pulse"></span>
                <QrCode className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>حضور موثّق بكود QR لكل حصة</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-gray-200 text-[#4B5563] text-xs font-semibold shadow-2xs">
                <span>🇪🇬</span>
                <span>تغطية شاملة لجميع المحافظات</span>
              </div>
            </div>

            {/* Bold Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E3A8A] leading-[1.25] tracking-tight mb-4">
              اعثر على أفضل{' '}
              <span className="text-[#2563EB] relative inline-block">
                المدرسين الخصوصيين
                <span className="absolute bottom-1 right-0 left-0 h-2 bg-blue-200/50 -z-10 rounded-full"></span>
              </span>{' '}
              القريبين منك
            </h1>

            {/* Subheadline */}
            <p className="text-sm sm:text-base lg:text-lg text-[#4B5563] leading-relaxed max-w-2xl mb-7 font-normal">
              منصة متكاملة تربطك بأفضل المدرسين الموثقين في منطقتك، مع نظام تتبع آلي للحضور لضمان التزام ونجاح العملية التعليمية.
            </p>

            {/* Search Card */}
            <form
              onSubmit={handleSubmit}
              className="w-full bg-white/95 backdrop-blur-xs border border-blue-100/90 rounded-3xl p-4 sm:p-6 shadow-xl shadow-blue-900/5 hover:border-blue-300 transition-all relative z-10"
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

                {/* Governorate & City Smart Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 text-right flex items-center justify-between">
                    <span>المحافظة والمدينة <span className="text-[#EF4444] font-bold">*</span></span>
                    {selectedGovernorate && !selectedCity && (
                      <span className="text-[10px] text-[#2563EB] font-bold animate-pulse">
                        الآن حدد المدينة/المنطقة
                      </span>
                    )}
                  </label>
                  <LocationSelector
                    selectedGovernorate={selectedGovernorate}
                    selectedCity={selectedCity}
                    onSelectGovernorate={(gov) => {
                      setSelectedGovernorate(gov);
                      setSelectedCity('');
                      setErrorMessage('');
                    }}
                    onSelectCity={(city) => {
                      setSelectedCity(city);
                      setErrorMessage('');
                    }}
                    showCitySelect={true}
                    placeholder="اختر المحافظة ثم المدينة (مطلوب)"
                  />
                </div>

              </div>

              {/* Validation alert banner */}
              {errorMessage && (
                <div className="mb-3.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-drawer">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Full-width Search Button */}
              <button
                type="submit"
                className="btn-primary-shine w-full py-3.5 px-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-base rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
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
            <div className="w-full max-w-md relative bg-gradient-to-b from-blue-50/60 to-white border border-blue-100 rounded-3xl p-6 sm:p-7 shadow-xs animate-float-slow">
              
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
