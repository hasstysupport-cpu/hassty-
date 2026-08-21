import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  AlertCircle,
  Users,
  ArrowLeft,
  Sparkles,
  Loader2,
  BookOpen
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { TutorProfile } from '../../types';

export const StudentBookPage: React.FC = () => {
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutorId, setSelectedTutorId] = useState<string>('');
  const [bookedLessons, setBookedLessons] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  useEffect(() => {
    async function loadTeachers() {
      setLoading(true);
      try {
        const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const querySnapshot = await getDocs(teachersQuery);
        const realTeachers: TutorProfile[] = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          realTeachers.push({
            id: docSnap.id,
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
            joinCode: data.profileData?.joinCode || docSnap.id.substring(0, 6).toUpperCase(),
            levels: data.profileData?.levels || ['المرحلة الثانوية'],
            avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            bio: data.profileData?.bio || `معلم معتمد لمادة ${data.profileData?.subject || ''}`,
            experienceYears: data.profileData?.experienceYears || 5,
            centers: data.profileData?.centers || [],
            phone: data.phone || '',
            email: data.email || '',
            education: data.profileData?.education || 'مؤهل تربوي معتمد',
            accountStatus: 'active',
            gender: data.profileData?.gender || 'male',
            availableSlots: data.profileData?.availableSlots || [
              { id: 's1', day: 'السبت', time: '04:30 م - 06:30 م', location: 'سنتر الأوائل', type: 'center', status: 'available' },
              { id: 's2', day: 'الثلاثاء', time: '06:00 م - 08:00 م', location: 'بث مباشر تفاعلي', type: 'online', status: 'available' }
            ]
          });
        });

        setTutors(realTeachers);
        if (realTeachers.length > 0) {
          setSelectedTutorId(realTeachers[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTeachers();
  }, []);

  const currentTutor = tutors.find((t) => t.id === selectedTutorId) || tutors[0];

  const handleConfirmBooking = () => {
    if (!selectedSlot || !currentTutor) return;

    const newLesson = {
      id: `lesson-${Date.now()}`,
      tutorName: currentTutor.name,
      tutorAvatar: currentTutor.avatarUrl,
      subject: currentTutor.subject,
      topic: 'حصة تدريبية ومراجعة',
      date: new Date().toLocaleDateString('ar-EG'),
      time: selectedSlot.time,
      day: selectedSlot.day,
      type: selectedSlot.type,
      location: selectedSlot.location,
      status: 'upcoming' as const,
      price: currentTutor.pricePerSession,
    };

    setBookedLessons([newLesson, ...bookedLessons]);
    setBookingConfirmed(true);
    setTimeout(() => {
      setBookingConfirmed(false);
      setSelectedSlot(null);
    }, 2500);
  };

  const handleCancelBooking = (id: string) => {
    setBookedLessons(bookedLessons.filter((l) => l.id !== id));
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500 font-bold">جاري تحميل المواعيد والمعلمين المعتمدين...</p>
      </div>
    );
  }

  if (tutors.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#2563EB] mx-auto flex items-center justify-center">
          <Calendar className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#1E3A8A]">لا يوجد مدرسين متاحين حالياً للحجز المباشر</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            يمكن للمدرسين المعتمدين تسجيل حساباتهم وإضافة جداول حصصهم لتظهر هنا فوراً.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-right">
      
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>حجز الحصص والمواعيد</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
          حجز موعد حصة جديدة
        </h2>
        <p className="text-xs text-[#6B7280] mt-1">
          اختر المعلم المناسب واستعرض جدول مواعيده المتاحة في السنتر أو أونلاين
        </p>
      </div>

      {bookingConfirmed && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 text-center flex items-center justify-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          <span>تم تأكيد حجز الحصة وإضافتها لجدولك وإرسال إشعار لولي الأمر! ✓</span>
        </div>
      )}

      {/* Step 1 & 2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 1 Col: Select Tutor */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#1E3A8A] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2563EB]" />
            <span>1. اختر المدرس</span>
          </h3>

          <div className="space-y-2.5">
            {tutors.map((tutor) => {
              const isSelected = tutor.id === selectedTutorId;
              return (
                <button
                  key={tutor.id}
                  onClick={() => setSelectedTutorId(tutor.id)}
                  className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-[#2563EB] bg-[#EFF6FF] shadow-xs'
                      : 'border-[#E5E7EB] bg-white hover:bg-gray-50'
                  }`}
                >
                  <img
                    src={tutor.avatarUrl}
                    alt={tutor.name}
                    className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#1E3A8A] truncate">{tutor.name}</h4>
                    <p className="text-[11px] text-[#2563EB] font-semibold">{tutor.subject}</p>
                    <span className="text-[10px] text-gray-500">{tutor.area || tutor.governorate}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Select Slot & Confirm */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-[#1E3A8A] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <span>2. المواعيد المتاحة لدى {currentTutor?.name}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(currentTutor?.availableSlots || []).map((slot: any) => {
              const isSelected = selectedSlot?.id === slot.id;
              const isAvailable = slot.status === 'available';

              return (
                <div
                  key={slot.id}
                  onClick={() => isAvailable && setSelectedSlot(slot)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EFF6FF] border-[#2563EB] ring-2 ring-blue-100 shadow-xs'
                      : isAvailable
                      ? 'bg-white border-[#E5E7EB] hover:border-blue-200'
                      : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-[#1E3A8A]">{slot.day}</span>
                    <Badge
                      variant={slot.type === 'center' ? 'info' : 'navy'}
                      size="sm"
                    >
                      {slot.type === 'center' ? 'سنتر' : 'أونلاين'}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-[#4B5563]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{slot.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{slot.location}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1E3A8A]">
                      {currentTutor?.pricePerSession} ج.م
                    </span>
                    {isAvailable ? (
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-[#2563EB]' : 'text-gray-500'}`}>
                        {isSelected ? '✓ تم التحديد' : 'اضغط للتحديد'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">مكتمل</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedSlot && (
            <div className="p-4 bg-[#F8FAFF] border border-blue-200 rounded-2xl flex items-center justify-between gap-4 animate-fadeIn">
              <div>
                <p className="text-xs text-[#6B7280]">الموعد المحدد للحجز:</p>
                <h4 className="text-sm font-bold text-[#1E3A8A]">
                  {selectedSlot.day} — {selectedSlot.time} ({selectedSlot.location})
                </h4>
              </div>

              <button
                onClick={handleConfirmBooking}
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>تأكيد الحجز الآن</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 3. My Booked Lessons List */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-[#1E3A8A]">حصصي المحجوزة الحالية</h3>

        {bookedLessons.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {bookedLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1E3A8A] text-sm">
                      {lesson.subject} — {lesson.tutorName}
                    </span>
                    <Badge variant="info" size="sm">{lesson.day}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[#6B7280] mt-1">
                    <span>الساعة: {lesson.time}</span>
                    <span>•</span>
                    <span>الموقع: {lesson.location}</span>
                    <span>•</span>
                    <span>السعر: {lesson.price} ج.م</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">مؤكد</Badge>
                  <button
                    onClick={() => handleCancelBooking(lesson.id)}
                    className="px-3 py-1.5 text-[11px] font-bold text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    إلغاء الحجز
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-4">لا توجد حصص محجوزة حالياً. يمكنك الحجز باختيار المعلم والموعد أعلاه.</p>
        )}
      </div>

    </div>
  );
};
