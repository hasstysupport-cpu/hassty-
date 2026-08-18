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
    <section id="hero" className="relative overflow-hidden pt-6 pb-14 lg:pt-12 lg:pb-20 border-b border-blue-100/80 bg-hero-mesh">
      
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

      {/* 2. Floating Interactive Brand Identity Badges (Visible on Desktop only to prevent mobile overlap) */}
      <div className="hidden lg:flex absolute top-12 right-[5%] p-3 rounded-2xl bg-white/90 backdrop-blur-xs border border-blue-100 shadow-sm animate-float-slow pointer-events-none items-center gap-2 z-0">
        <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
          <Atom className="w-4 h-4" />
        </div>
        <div className="text-right">
          <span className="text-[11px] font-bold text-[#1E3A8A] block">علوم وفيزياء</span>
          <span className="text-[9px] text-[#6B7280]">شرح وتجارب عملية</span>
        </div>
      </div>

      <div className="hidden lg:flex absolute top-36 left-[3%] p-3 rounded-2xl bg-white/90 backdrop-blur-xs border border-emerald-100 shadow-sm animate-float-reverse pointer-events-none items-center gap-2 z-0">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0">
          <Compass className="w-4 h-4" />
        </div>
        <div className="text-right">
          <span className="text-[11px] font-bold text-[#1E3A8A] block">رياضيات وهندسة</span>
          <span className="text-[9px] text-[#6B7280]">فهم وحل مسائل</span>
        </div>
      </div>

      <div className="hidden lg:flex absolute bottom-12 right-[3%] p-3 rounded-2xl bg-white/90 backdrop-blur-xs border border-amber-100 shadow-sm animate-float-reverse pointer-events-none items-center gap-2 z-0">
        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
          <Award className="w-4 h-4" />
        </div>
        <div className="text-right">
          <span className="text-[11px] font-bold text-[#1E3A8A] block">أعلى التقييمات</span>
          <span className="text-[9px] text-[#6B7280]">مدرسين أوائل معتمدين</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          
          {/* Right Column (RTL start): Text Content & Search Card */}
          <div className="lg:col-span-7 flex flex-col items-start text-right z-10">
            
            {/* Pill Badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-blue-200 text-[#1E3A8A] text-xs font-bold shadow-2xs">
                <span>🇪🇬</span>
                <span>تغطية شاملة لجميع المحافظات والمراحل من ابتدائي حتى ثانوي</span>
              </div>
            </div>

            {/* Bold Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#1E3A8A] leading-[1.3] tracking-tight mb-3">
              اعثر على أفضل{' '}
              <span className="text-[#2563EB] relative inline-block">
                المدرسين الخصوصيين
                <span className="absolute bottom-1 right-0 left-0 h-2 bg-blue-200/50 -z-10 rounded-full"></span>
              </span>{' '}
              القريبين منك
            </h1>

            {/* Subheadline */}
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed max-w-2xl mb-6 font-normal">
              منصة متكاملة تربطك بأفضل المدرسين المعتمدين في منطقتك، مع نظام تتبع عادل للحضور والواجبات لضمان التزام وتفوق الأبناء.
            </p>

            {/* Search Card */}
            <form
              onSubmit={handleSubmit}
              className="w-full bg-white border border-blue-100 rounded-3xl p-4 sm:p-6 shadow-xl shadow-blue-900/5 hover:border-blue-300 transition-all relative z-10"
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
                      placeholder="ابحث عن مادة... رياضيات، فيزياء، عربي"
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
                className="w-full py-3.5 px-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-base rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
                id="hero-search-submit-btn"
              >
                <Search className="w-5 h-5 stroke-[2.2]" />
                <span>ابحث عن مدرسك</span>
              </button>
            </form>

            {/* Social Proof Below Search */}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-right">
              {/* Overlapping circular avatars */}
              <div className="flex items-center -space-x-2 space-x-reverse">
                {sampleAvatars.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt="صورة مدرس موثق"
                    className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ))}
                <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#2563EB]">
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
                  أكثر من <strong className="text-[#1E3A8A] font-bold">2,400 مدرس معتمد</strong> في انتظارك
                </span>
              </div>
            </div>

          </div>

          {/* Left Column: Flat-Illustration Graphic */}
          <div className="lg:col-span-5 relative flex items-center justify-center mt-4 lg:mt-0">
            
            {/* Flat Illustration / Live Student Card preview widget */}
            <div className="w-full max-w-md relative bg-gradient-to-b from-blue-50/60 to-white border border-blue-100 rounded-3xl p-5 sm:p-6 shadow-xs">
              
              {/* Top Card Bar */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-blue-100/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#2563EB] text-white flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#1E3A8A]">بطاقة الطالب والمتابعة</h2>
                    <p className="text-[11px] text-[#6B7280]">منظومة الحضور والواجبات</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  حساب معتمد
                </span>
              </div>

              {/* Graphic Elements Assembly */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex flex-col items-center text-center relative overflow-hidden">
                <div className="w-28 h-28 sm:w-32 sm:h-32 bg-[#F8FAFF] border-2 border-dashed border-blue-300 rounded-2xl p-2 flex flex-col items-center justify-center relative mb-2 group cursor-pointer"
                  onClick={onOpenQRSimulator}
                  title="اضغط لمعاينة بطاقة الحضور"
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
                  توثيق حضور فوري بالدقيقة وإرسال تقرير الواجب لولي الأمر
                </p>
              </div>

              {/* Attendance confirmation simulated badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#EFF6FF] border border-blue-200 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                  <span className="font-semibold text-[#1E3A8A]">آخر تسجيل:</span>
                  <span className="text-[#6B7280]">حصة الكيمياء (04:32 م)</span>
                </div>
                <span className="font-bold text-[#10B981] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  حاضر في الموعد
                </span>
              </div>

              {/* Bottom interactive action button */}
              <button
                onClick={onOpenQRSimulator}
                className="mt-3.5 w-full py-2.5 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] bg-white hover:bg-blue-50/80 border border-blue-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                id="hero-try-qr-simulator-btn"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>جرّب محاكي البطاقة الذكية وتسجيل الحضور</span>
              </button>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
