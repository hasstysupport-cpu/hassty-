import React, { useState, useEffect } from 'react';
import { useSEO } from '../lib/useSEO';
import {
  Star,
  ShieldCheck,
  MapPin,
  QrCode,
  Calendar,
  Clock,
  BookOpen,
  Award,
  Users,
  MessageSquare,
  CheckCircle2,
  Copy,
  ArrowLeft,
  Share2,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';
import { TutorProfile } from '../types';
import { Badge } from '../components/common/Badge';
import { BookingModal } from '../components/BookingModal';
import { doc, getDoc } from '../lib/supabaseCompat';
import { db } from '../lib/supabaseCompat';

interface TeacherProfilePageProps {
  tutorId: string;
  onNavigate: (path: string) => void;
  onSelectTutor?: (tutorId: string) => void;
  onOpenBooking?: (tutor: TutorProfile) => void;
  onOpenQRSimulator?: () => void;
}

export const TeacherProfilePage: React.FC<TeacherProfilePageProps> = ({
  tutorId,
  onNavigate,
  onSelectTutor,
  onOpenBooking,
  onOpenQRSimulator,
}) => {
  const [activeTab, setActiveTab] = useState<'bio' | 'reviews' | 'slots'>('bio');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [tutor, setTutor] = useState<TutorProfile>({
    id: tutorId || 'tutor-1',
    name: 'معلم معتمد',
    title: 'معلم أول معتمد بالمنصة',
    subject: 'عام',
    governorate: 'القاهرة',
    area: 'مدينة نصر',
    rating: 5.0,
    reviewsCount: 0,
    studentsCount: 0,
    pricePerSession: 100,
    isVerified: true,
    joinCode: (tutorId || 'TUTOR').substring(0, 6).toUpperCase(),
    levels: ['المرحلة الثانوية', 'المرحلة الإعدادية'],
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: 'معلم معتمد يقدم شرحاً تفاعلياً ومتابعة دورية للواجبات والدرجات.',
    experienceYears: 5,
    centers: ['السنتر الرئيسي'],
    phone: '',
    email: '',
    education: 'مؤهل تربوي معتمد',
    accountStatus: 'active',
    reviews: [],
    availableSlots: [],
  });

  useEffect(() => {
    async function fetchTutor() {
      if (!tutorId) return;
      try {
        const userDocRef = doc(db, 'users', tutorId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setTutor({
            id: userSnap.id,
            name: data.name || 'معلم معتمد',
            title: data.profileData?.title || `معلم ${data.profileData?.subject || ''}`,
            subject: data.profileData?.subject || 'عام',
            governorate: data.governorate || 'القاهرة',
            area: data.area || '',
            rating: data.profileData?.rating || 5.0,
            reviewsCount: data.profileData?.reviewsCount || 0,
            studentsCount: data.profileData?.studentsCount || 0,
            pricePerSession: data.profileData?.pricePerSession || 100,
            isVerified: data.profileData?.isVerified ?? true,
            joinCode: data.profileData?.joinCode || userSnap.id.substring(0, 6).toUpperCase(),
            levels: data.profileData?.levels || ['المرحلة الثانوية', 'المرحلة الإعدادية'],
            avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            bio: data.profileData?.bio || `معلم معتمد لمادة ${data.profileData?.subject || ''}`,
            experienceYears: data.profileData?.experienceYears || 5,
            centers: data.profileData?.centers || [],
            phone: data.phone || '',
            email: data.email || '',
            education: data.profileData?.education || 'مؤهل تربوي معتمد',
            accountStatus: 'active',
            reviews: [],
            availableSlots: [],
          });
        }
      } catch (err) {
        console.error('Error loading tutor profile:', err);
      }
    }

    fetchTutor();
  }, [tutorId]);

  useSEO({
    title: `${tutor.name} - مدرس ${tutor.subject} في ${tutor.governorate}`,
    description: `احجز حصتك مع الأستاذ ${tutor.name}، مدرس ${tutor.subject} في ${tutor.governorate} - ${tutor.area}. تقييم ${tutor.rating} من 5 ونظام حضور ذكي بالـ QR.`,
    canonicalPath: `/tutor/${tutor.id}`,
    keywords: `مدرس ${tutor.subject}, ${tutor.name}, دروس خصوصية ${tutor.governorate}, مدرس ثانوية عامة ${tutor.subject}`,
  });

  // Related tutors
  const [relatedTutors, setRelatedTutors] = useState<TutorProfile[]>([]);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(tutor.joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleBookingClick = () => {
    if (onOpenBooking) {
      onOpenBooking(tutor);
    } else {
      setIsBookingModalOpen(true);
    }
  };

  const handleSelectTutor = (newTutorId: string) => {
    if (onSelectTutor) {
      onSelectTutor(newTutorId);
    } else {
      onNavigate(`/tutor/${newTutorId}`);
    }
  };

  const handleQRClick = () => {
    if (onOpenQRSimulator) {
      onOpenQRSimulator();
    } else {
      onNavigate('/student/qr-card');
    }
  };

  // Rating breakdown stats
  const ratingBreakdown = [
    { stars: 5, percentage: 88, count: Math.round(tutor.reviewsCount * 0.88) },
    { stars: 4, percentage: 9, count: Math.round(tutor.reviewsCount * 0.09) },
    { stars: 3, percentage: 2, count: Math.round(tutor.reviewsCount * 0.02) },
    { stars: 2, percentage: 1, count: Math.round(tutor.reviewsCount * 0.01) },
    { stars: 1, percentage: 0, count: 0 },
  ];

  return (
    <div className="bg-[#F8FAFF] min-h-screen pb-16 text-right">
      
      {/* Top Breadcrumb */}
      <div className="bg-white border-b border-[#E5E7EB] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <button onClick={() => onNavigate('/')} className="hover:text-[#2563EB]">الرئيسية</button>
            <span>/</span>
            <button onClick={() => onNavigate('/search')} className="hover:text-[#2563EB]">البحث عن مدرسين</button>
            <span>/</span>
            <span className="text-[#1E3A8A] font-bold">{tutor.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Profile Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Right 2 Columns: Main Details + Tabs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                
                {/* Photo */}
                <div className="relative">
                  <img
                    src={tutor.avatarUrl}
                    alt={tutor.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-white ring-2 ring-blue-100 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  {tutor.isVerified && (
                    <div className="absolute -bottom-2 -left-2 bg-[#2563EB] text-white p-1.5 rounded-xl shadow-xs" title="معلم موثق">
                      <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h1 className="text-2xl sm:text-3xl font-black text-[#1E3A8A]">
                      {tutor.name}
                    </h1>
                    <Badge variant="info">{tutor.subject}</Badge>
                  </div>

                  <p className="text-sm font-bold text-[#4B5563] mb-3">
                    {tutor.title}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280]">
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <strong className="text-amber-950 font-black">{tutor.rating}</strong>
                      <span className="text-gray-500">({tutor.reviewsCount} تقييم حقيقي)</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{tutor.governorate} — {tutor.area}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">{tutor.studentsCount} طالب</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Levels tags */}
              <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#6B7280] ml-2">المراحل الدراسية:</span>
                {tutor.levels.map((lvl, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-bold bg-[#EFF6FF] text-[#1E3A8A] border border-blue-100 px-3 py-1 rounded-xl"
                  >
                    {lvl}
                  </span>
                ))}
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-1.5 flex items-center gap-1">
              <button
                onClick={() => setActiveTab('bio')}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'bio'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#2563EB] hover:bg-gray-50'
                }`}
              >
                نبذة والخبرات
              </button>
              <button
                onClick={() => setActiveTab('slots')}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'slots'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#2563EB] hover:bg-gray-50'
                }`}
              >
                المواعيد المتاحة والحجز
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#2563EB] hover:bg-gray-50'
                }`}
              >
                التقييمات ({tutor.reviewsCount})
              </button>
            </div>

            {/* TAB CONTENT: 1. BIO */}
            {activeTab === 'bio' && (
              <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[#1E3A8A] mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#2563EB]" />
                    <span>نبذة عن طريقة الشرح والمنهج</span>
                  </h3>
                  <p className="text-sm text-[#4B5563] leading-relaxed">
                    {tutor.bio}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="p-4 bg-[#F8FAFF] border border-[#E5E7EB] rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                      <Award className="w-4 h-4 text-[#2563EB]" />
                      <span>سنوات الخبرة</span>
                    </div>
                    <p className="text-base font-bold text-[#1E3A8A]">
                      {tutor.experienceYears || 12} سنة في تدريس الثانوية
                    </p>
                  </div>

                  <div className="p-4 bg-[#F8FAFF] border border-[#E5E7EB] rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                      <GraduationCap className="w-4 h-4 text-[#2563EB]" />
                      <span>المؤهل الأكاديمي</span>
                    </div>
                    <p className="text-xs font-bold text-[#1E3A8A]">
                      {tutor.education || 'بكالوريوس تربية وعلم نفس'}
                    </p>
                  </div>
                </div>

                {tutor.centers && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-[#6B7280] mb-2.5">
                      السناتر والمقرات المعتمدة:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tutor.centers.map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1F2937]"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 2. AVAILABLE SLOTS */}
            {activeTab === 'slots' && (
              <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#2563EB]" />
                    <span>جدول المواعيد والحصص المتاحة</span>
                  </h3>
                  <Badge variant="success">متاح للحجز الآن</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(tutor.availableSlots || []).map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        slot.status === 'available'
                          ? 'bg-[#F8FAFF] border-blue-200 hover:border-[#2563EB]'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-[#1E3A8A]">{slot.day}</span>
                        <Badge
                          variant={
                            slot.type === 'center'
                              ? 'info'
                              : slot.type === 'online'
                              ? 'navy'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {slot.type === 'center'
                            ? 'سنتر'
                            : slot.type === 'online'
                            ? 'أونلاين'
                            : 'خاص'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#4B5563] mb-3">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{slot.time}</span>
                      </div>

                      {slot.status === 'available' ? (
                        <button
                          onClick={handleBookingClick}
                          className="w-full py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>حجز هذا الموعد</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="text-center py-1.5 text-[11px] font-bold text-gray-400 bg-gray-100 rounded-xl">
                          المجموعة مكتملة العدد
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-6">
                
                {/* Rating Overview Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-[#F8FAFF] border border-[#E5E7EB] rounded-2xl items-center">
                  <div className="text-center sm:text-right">
                    <div className="text-4xl font-black text-[#1E3A8A]">{tutor.rating}</div>
                    <div className="flex items-center justify-center sm:justify-start gap-1 my-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-amber-500 fill-amber-400"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[#6B7280]">
                      بناءً على {tutor.reviewsCount} تقييم موثق
                    </span>
                  </div>

                  {/* Progress bars */}
                  <div className="sm:col-span-2 space-y-1.5">
                    {ratingBreakdown.map((item) => (
                      <div key={item.stars} className="flex items-center gap-3 text-xs">
                        <span className="w-12 text-[#6B7280] font-bold shrink-0">
                          {item.stars} نجوم
                        </span>
                        <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-left text-gray-400 font-mono text-[10px]">
                          %{item.percentage}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4 pt-2">
                  {(tutor.reviews || []).map((review) => (
                    <div
                      key={review.id}
                      className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              review.studentAvatar ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={review.studentName}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-[#1F2937]">
                              {review.studentName}
                            </h4>
                            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              طالب مسجل وحضر الحصص
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                          <span className="text-xs font-bold text-amber-900">{review.rating}</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#4B5563] leading-relaxed">
                        {review.comment}
                      </p>

                      {review.tutorReply && (
                        <div className="mt-2 mr-4 p-3 bg-blue-50/70 border-r-2 border-[#2563EB] rounded-l-xl text-xs text-[#1E3A8A] space-y-1">
                          <strong className="block text-[11px] font-bold text-[#2563EB]">
                            رد المدرس ({tutor.name}):
                          </strong>
                          <p>{review.tutorReply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>

          {/* Left Column: QR Join Code Box + Fast Actions */}
          <div className="space-y-6">
            
            {/* Prominent QR Code Join Box */}
            <div className="bg-white border-2 border-[#2563EB]/20 rounded-3xl p-6 shadow-xs text-center space-y-4">
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-bold border border-blue-200">
                <QrCode className="w-3.5 h-3.5" />
                <span>كود الانضمام للمجموعة</span>
              </div>

              {/* QR Simulator Box */}
              <div
                onClick={handleQRClick}
                className="bg-[#F8FAFF] border border-blue-200 rounded-2xl p-4 max-w-[200px] mx-auto group cursor-pointer hover:border-[#2563EB] transition-all relative"
              >
                <div className="w-36 h-36 mx-auto bg-white border border-gray-200 rounded-xl p-2 flex items-center justify-center">
                  {/* Stylized QR representation */}
                  <div className="w-full h-full bg-[#1E3A8A] rounded-lg p-2 flex flex-col justify-between text-white">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 bg-white rounded-xs p-1"><div className="w-full h-full bg-[#1E3A8A]" /></div>
                      <div className="w-6 h-6 bg-white rounded-xs p-1"><div className="w-full h-full bg-[#1E3A8A]" /></div>
                    </div>
                    <div className="text-[10px] font-mono text-center font-black">HASSTY</div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 bg-white rounded-xs p-1"><div className="w-full h-full bg-[#1E3A8A]" /></div>
                      <div className="w-4 h-4 bg-emerald-400 rounded-xs" />
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#2563EB] mt-2 block group-hover:underline">
                  اضغط لمعاينة وتجربة الماسح
                </span>
              </div>

              {/* Text Code + Copy */}
              <div>
                <label className="block text-xs font-bold text-[#6B7280] mb-1">
                  كود الانضمام المباشر
                </label>
                <div className="flex items-center gap-2 max-w-xs mx-auto">
                  <input
                    type="text"
                    readOnly
                    value={tutor.joinCode}
                    className="w-full py-2 px-3 text-center font-mono font-black text-sm text-[#1E3A8A] bg-gray-50 border border-gray-200 rounded-xl select-all"
                  />
                  <button
                    onClick={handleCopyCode}
                    className="p-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl transition-all cursor-pointer shrink-0"
                    title="نسخ الكود"
                  >
                    {copiedCode ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copiedCode && (
                  <span className="text-[11px] font-bold text-[#10B981] mt-1 block">
                    تم نسخ كود الانضمام بنجاح!
                  </span>
                )}
              </div>

              <p className="text-[11px] text-[#6B7280] leading-relaxed">
                امسح الكود من تطبيقك أو أدخل الرمز للانضمام لمجموعة المستر وتفعيل الحضور التلقائي.
              </p>

              {/* Booking CTA Button */}
              <button
                onClick={handleBookingClick}
                className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>احجز حصة تجريبية الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

            </div>

            {/* Pricing Summary Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-[#6B7280]">تفاصيل الرسوم</h4>
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <span className="text-xs text-[#1F2937]">سعر الحصة للمجموعة</span>
                <span className="text-sm font-bold text-[#1E3A8A]">{tutor.pricePerSession} ج.م</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <span className="text-xs text-[#1F2937]">إشعار الحضور لولي الأمر</span>
                <span className="text-xs font-bold text-[#10B981]">مجاني بالكامل ✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#1F2937]">طريقة الدفع</span>
                <span className="text-xs font-bold text-[#6B7280]">شهري / بالسنتر</span>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom: Similar Teachers Section */}
        <div className="mt-16 pt-10 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-[#1E3A8A]">معلمون متميزون في نفس المادة</h3>
              <p className="text-xs text-[#6B7280]">يمكنك الاطلاع على خيارات أخرى في {tutor.subject}</p>
            </div>
            <button
              onClick={() => onNavigate('/search')}
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>عرض كل المدرسين</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {relatedTutors.map((rel) => (
              <div
                key={rel.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-4 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={rel.avatarUrl}
                    alt={rel.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#E5E7EB]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#1E3A8A] truncate">{rel.name}</h4>
                    <p className="text-xs text-[#6B7280]">{rel.subject} — {rel.governorate}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                    <span>{rel.rating}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs font-bold text-[#1E3A8A]">{rel.pricePerSession} ج.م</span>
                  <button
                    onClick={() => {
                      handleSelectTutor(rel.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    عرض الملف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Embedded Booking Modal for instant booking popup */}
      <BookingModal
        tutor={tutor}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onOpenQRSimulator={() => {
          setIsBookingModalOpen(false);
          handleQRClick();
        }}
      />

    </div>
  );
};
