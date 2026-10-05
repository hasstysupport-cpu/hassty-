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
  ShieldAlert,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Send,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Award,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

interface TeacherVerificationBannerProps {
  teacherId?: string;
  teacherName?: string;
}

const SUPPORT_GROUPS = [
  {
    id: 'whatsapp',
    name: 'جروب واتساب الرسمي',
    desc: 'انضم لجروب المعلمين على واتساب لتقديم طلب التوثيق الفوري',
    url: 'https://chat.whatsapp.com/DDU2o4jiLASAcVeEb6BnNu',
    icon: MessageCircle,
    colorClasses: 'from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-emerald-700/20',
    badgeText: 'واتساب',
  },
  {
    id: 'telegram',
    name: 'جروب تليجرام الرسمي',
    desc: 'انضم لجروب الدعم الفني والمعلمين على تليجرام',
    url: 'https://t.me/+-gGdGyw60wA2MDRk',
    icon: Send,
    colorClasses: 'from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-sky-600/20',
    badgeText: 'تليجرام',
  },
];

export const TeacherVerificationBanner: React.FC<TeacherVerificationBannerProps> = ({
  teacherId: propTeacherId,
  teacherName: propTeacherName,
}) => {
  const { user } = useAuth();
  const teacherId = propTeacherId || user?.uid || '';
  const teacherName = propTeacherName || user?.name || 'يا أستاذنا';

  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;

    async function checkVerification() {
      // 1) فحص حالة التوثيق السريعة من الـ Auth context إن وجدت
      if (user?.profileData?.verificationStatus === 'approved' || user?.profileData?.isVerified === true) {
        if (alive) {
          setIsVerified(true);
          setLoading(false);
        }
        return;
      }

      if (!teacherId || !supabase) {
        if (alive) {
          setIsVerified(false);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tutor_profiles')
          .select('is_verified, verification_status')
          .eq('user_id', teacherId)
          .maybeSingle();

        if (error) throw error;

        const verified = data?.is_verified === true || data?.verification_status === 'approved';
        if (alive) {
          setIsVerified(verified);
        }
      } catch (err) {
        // في حالة الخطأ، نعتمد على بيانات الـ session كإجراء احتياطي
        const fallback = user?.profileData?.verificationStatus === 'approved' || user?.profileData?.isVerified === true;
        if (alive) setIsVerified(fallback);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void checkVerification();

    return () => {
      alive = false;
    };
  }, [teacherId, user]);

  // لو الحساب موثّق بالفعل، لا نعرض البانر
  if (loading || isVerified === true) {
    return null;
  }

  const copyTemplateText = () => {
    const text = `السلام عليكم ورحمة الله وبركاته،\nأنا مسجل جديد كمعلم في منصة حِصّتي وأود التقدم بطلب توثيق حسابي مجاناً:\n- اسم المعلم: ${teacherName}\n- البريد الإلكتروني: ${user?.email || '—'}\n- رقم الهاتف: ${user?.phone || '—'}\nبرجاء مراجعة الحساب واعتماده لظهوري للطلاب. شكراً لكم!`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div
      dir="rtl"
      className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white shadow-md relative z-30 transition-all border-b border-amber-400/40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
        {collapsed ? (
          // وضع التصغير (Slim bar)
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-200 animate-ping" />
              <ShieldAlert className="w-5 h-5 text-amber-200 shrink-0" />
              <span className="text-xs sm:text-sm font-black">
                تنبيه مهم: حسابك كمعلم يحتاج إلى تقديم طلب توثيق مجاني لتفعيل ظهورك للطلاب في البحث.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={SUPPORT_GROUPS[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-black inline-flex items-center gap-1 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>جروب واتساب</span>
              </a>
              <a
                href={SUPPORT_GROUPS[1].url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-black inline-flex items-center gap-1 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>جروب تليجرام</span>
              </a>
              <button
                onClick={() => setCollapsed(false)}
                className="px-2.5 py-1 text-xs font-bold text-amber-100 hover:text-white inline-flex items-center gap-1 bg-black/15 hover:bg-black/25 rounded-lg cursor-pointer transition-all"
                title="عرض التفاصيل"
              >
                <span>تفاصيل التوثيق</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          // وضع العرض الكامل (Expanded bar)
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
                  <ShieldAlert className="w-5 h-5 text-amber-100" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-white/25 text-[11px] font-black tracking-wide uppercase border border-white/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-200" />
                      طلب توثيق مجاني 100%
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/20 text-[11px] font-bold text-amber-100 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      خطوة إلزامية لتفعيل استقبال الحجوزات
                    </span>
                  </div>

                  <h2 className="text-sm sm:text-base font-black text-white leading-snug">
                    أهلاً بك يا أستاذ {teacherName}! يرجى التقدّم بطلب توثيق مجاني لحسابك في أحد جروبات الدعم الرسمية
                  </h2>

                  <p className="text-xs sm:text-sm text-amber-100/95 font-medium mt-1 leading-relaxed max-w-4xl">
                    حتى يظهر ملفك التعريفي في محرك بحث الطلاب وأولياء الأمور وتبدأ في إضافة المجموعات وحجز الحصص،
                    يشترط إرسال طلب اعتماد مجاني وبسيط داخل جروب الدعم الفني. التوثيق مجاني بالكامل وبدون أي رسوم اشتراك.
                  </p>
                </div>
              </div>

              {/* زر تصغير البانر */}
              <button
                onClick={() => setCollapsed(true)}
                className="text-amber-200 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer shrink-0 transition-all flex items-center gap-1 text-xs"
                title="تصغير الإشعار"
              >
                <span className="hidden sm:inline text-[11px] font-bold">تصغير</span>
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            {/* أزرار جروبات الدعم الرسمية وروابطها المباشرة */}
            <div className="mt-3.5 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-black text-amber-100">
                  اختر أحد الجروبات وانضم للتوثيق الآن:
                </span>

                {SUPPORT_GROUPS.map((group) => {
                  const Icon = group.icon;
                  return (
                    <a
                      key={group.id}
                      href={group.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-l ${group.colorClasses} shadow-sm active:scale-95 transition-all`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{group.name}</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  );
                })}

                {/* زر نسخ رسالة التوثيق التلقائية لتسهيل الإرسال */}
                <button
                  type="button"
                  onClick={copyTemplateText}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 border border-white/30 text-white cursor-pointer active:scale-95 transition-all"
                  title="نسخ صيغة طلب التوثيق لإرسالها مباشرة في الجروب"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span className="text-emerald-200 font-black">تم نسخ رسالة التوثيق!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-200" />
                      <span>نسخ صيغة طلب التوثيق</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-amber-200 font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>الموافقة تتم سريعاً بعد مراجعة الإدارة في الجروب</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
