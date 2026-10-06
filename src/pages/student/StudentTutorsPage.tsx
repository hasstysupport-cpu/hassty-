/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Users,
  Star,
  MapPin,
  BookOpen,
  GraduationCap,
  Loader2,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

interface StudentTutorsPageProps {
  onNavigate: (path: string) => void;
  onSelectTutor: (tutorId: string) => void;
}

interface MyTutorCard {
  id: string;
  name: string;
  subject: string;
  avatarUrl: string;
  governorate: string;
  city: string;
  rating: number | null;
  reviewsCount: number | null;
  pricePerSession: number | null;
  groups: { id: string; name: string; subject: string }[];
}

/**
 * مدرسيني المسجلين — البيانات الحقيقية من قاعدة البيانات:
 * قيود الطالب النشطة → مجموعاتها → ملفات المدرسين (عبر سياسة profiles_select_my_tutors)
 * سابقًا كانت الصفحة فارغة دائمًا لأنها لم تكن تقرأ من DB إطلاقًا + «انضمام بكود» وهمي بلا أي كتابة — أُزيل.
 */
export const StudentTutorsPage: React.FC<StudentTutorsPageProps> = ({
  onNavigate,
  onSelectTutor,
}) => {
  const { user } = useAuth();
  const [tutors, setTutors] = useState<MyTutorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase || !user?.uid) { if (active) { setLoading(false); } return; }
      setLoading(true);
      setError('');
      try {
        const { data: enrollments, error: e1 } = await supabase
          .from('group_enrollments').select('group_id').eq('student_id', user.uid).eq('status', 'active');
        if (e1) throw e1;
        const groupIds = Array.from(new Set((enrollments || []).map((x: any) => x.group_id).filter(Boolean)));
        if (!groupIds.length) { if (active) { setTutors([]); setLoading(false); } return; }

        const { data: groups, error: e2 } = await supabase
          .from('student_groups').select('id,tutor_id,subject,name').in('id', groupIds);
        if (e2) throw e2;
        const tutorIds = Array.from(new Set((groups || []).map((g: any) => g.tutor_id).filter(Boolean)));
        if (!tutorIds.length) { if (active) { setTutors([]); setLoading(false); } return; }

        const [profilesRes, tutorProfilesRes] = await Promise.all([
          supabase.from('profiles').select('id,full_name,avatar_url,governorate,city,account_status').in('id', tutorIds),
          supabase.from('tutor_profiles').select('user_id,subjects,rating,reviews_count,price_per_session').in('user_id', tutorIds),
        ]);
        if (profilesRes.error) throw profilesRes.error;

        const cards: MyTutorCard[] = (profilesRes.data || []).map((p: any) => {
          const myGroups = (groups || []).filter((g: any) => g.tutor_id === p.id);
          const tp = (tutorProfilesRes.data || []).find((t: any) => t.user_id === p.id);
          const tpSubjects = Array.isArray(tp?.subjects) ? tp.subjects : [];
          const groupSubjects = myGroups.map((g: any) => g.subject).filter(Boolean);
          const subject = groupSubjects[0] || tpSubjects[0] || 'مادة تعليمية';
          return {
            id: p.id,
            name: p.full_name || 'مدرس حِصّتي',
            subject,
            avatarUrl: p.avatar_url || '',
            governorate: p.governorate || '',
            city: p.city || '',
            rating: tp?.rating != null ? Number(tp.rating) : null,
            reviewsCount: tp?.reviews_count != null ? Number(tp.reviews_count) : null,
            pricePerSession: tp?.price_per_session != null ? Number(tp.price_per_session) : null,
            groups: myGroups.map((g: any) => ({ id: g.id, name: g.name || 'مجموعة', subject: g.subject || subject })),
          };
        });
        if (active) setTutors(cards);
      } catch (err: any) {
        console.error('MyTutors load error:', err);
        if (active) setError(err?.message || 'تعذر تحميل مدرسينك حاليًا.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [user?.uid]);

  return (
    <div className="space-y-4 text-right">

      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>قائمة المدرسين</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            المدرسين المشترك معهم ({tutors.length})
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            مدرسوك في المجموعات النشطة — تابع حصصك وقدّر تقييمك بعد أول حصة مكتملة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/search')}
            className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-[#1E3A8A] text-xs font-bold rounded-xl border border-[#E5E7EB] transition-colors cursor-pointer"
          >
            البحث عن مدرس جديد
          </button>
          <button
            onClick={() => onNavigate('/student/reviews')}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Star className="w-4 h-4" />
            <span>قيّم مدرسك</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-700">{error}</div>
      )}

      {/* Tutors Grid */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-bold mt-3">جاري تحميل مدرسينك...</p>
        </div>
      ) : tutors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tutors.map((tutor) => (
            <div
              key={tutor.id}
              className="bg-white border border-[#E5E7EB] rounded-2xl p-4 hover:border-blue-300 flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-start gap-4 mb-4">
                  {tutor.avatarUrl ? (
                    <img
                      src={tutor.avatarUrl}
                      alt={tutor.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-[#E5E7EB] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 shrink-0 flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-[#2563EB]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-[#1E3A8A] truncate">{tutor.name}</h3>
                      {tutor.rating != null && (
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 text-xs font-bold text-amber-900 shrink-0">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                          <span>{tutor.rating.toFixed(1)}</span>
                          {tutor.reviewsCount != null && <span className="text-[10px] text-amber-700">({tutor.reviewsCount})</span>}
                        </div>
                      )}
                    </div>
                    <Badge variant="info" size="sm" className="mt-1">{tutor.subject}</Badge>
                    {(tutor.city || tutor.governorate) && (
                      <p className="text-xs text-[#6B7280] mt-1.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{tutor.city || tutor.governorate}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* المجموعات المشترك بها مع هذا المدرس */}
                <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <div className="flex items-center gap-1.5 text-[#6B7280] font-bold mb-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>مجموعاتك معه ({tutor.groups.length})</span>
                  </div>
                  {tutor.groups.map((g) => (
                    <div key={g.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-2.5 py-1.5">
                      <span className="font-bold text-[#1E3A8A] truncate">{g.name}</span>
                      <span className="text-[10px] text-gray-500 shrink-0">{g.subject}</span>
                    </div>
                  ))}
                  {tutor.pricePerSession != null && tutor.pricePerSession > 0 && (
                    <div className="flex items-center justify-between border-t border-gray-200/60 pt-2">
                      <span className="text-[#6B7280]">سعر الحصة:</span>
                      <span className="font-mono font-bold text-[#1E3A8A]">{tutor.pricePerSession} ج.م</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-2">
                <button
                  onClick={() => onSelectTutor(tutor.id)}
                  className="flex-1 py-2.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <span>عرض الملف والتقييمات</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigate('/student/reviews')}
                  className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  title="اكتب تقييمًا للمدرس"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>قيّم</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] mx-auto flex items-center justify-center">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#1E3A8A]">لم تشترك مع أي معلم بعد</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              الاشتراك بيتم لما المدرس يضيفك لمجموعته — ابحث عن معلّمي مرحلتك وموادك الدراسية وتواصل معه.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('/search')}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              دليل المدرسين المعتمدين
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
