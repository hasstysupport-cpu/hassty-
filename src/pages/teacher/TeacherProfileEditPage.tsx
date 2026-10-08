/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useEffect, useState } from 'react';
import { User, Save, CheckCircle2, MapPin, BookOpen, DollarSign, GraduationCap, Sparkles, Camera, ShieldAlert, Layers, Loader2 } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { SectionExplainer } from '../../components/common/SectionExplainer';
import { StageMultiPicker } from '../../components/common/StagePickers';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { sanitizeStages } from '../../lib/stages';

export const TeacherProfileEditPage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [subject, setSubject] = useState(user?.profileData?.subject || '');
  const [headline, setHeadline] = useState(user?.profileData?.headline || '');
  const [bio, setBio] = useState(user?.profileData?.bio || '');
  const [governorate, setGovernorate] = useState(user?.governorate || '');
  const [area, setArea] = useState(user?.area || '');
  const [pricePerSession, setPricePerSession] = useState<number | ''>(user?.profileData?.pricePerSession || '');
  /* المراحل التي يدرّسها المعلم */
  const [stages, setStages] = useState<string[]>(sanitizeStages((user?.profileData as any)?.stages));
  const [stagesLoading, setStagesLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'approved' | 'pending' | 'rejected' | 'not_submitted'>('loading');

  const joinCode = user?.profileData?.joinCode || (user?.uid ? `TCH-${user.uid.slice(0, 5).toUpperCase()}` : '');

  useEffect(() => {
    let cancelled = false;
    const loadVerification = async () => {
      if (!user?.uid) return;
      const { data, error } = await supabase
        .from('tutor_profiles')
        .select('is_verified,verification_status,stages')
        .eq('user_id', user.uid)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn('Verification status load warning:', error);
        setVerificationStatus('not_submitted');
        return;
      }
      if (data?.is_verified && data?.verification_status === 'approved') setVerificationStatus('approved');
      else if (data?.verification_status === 'pending') setVerificationStatus('pending');
      else if (data?.verification_status === 'rejected') setVerificationStatus('rejected');
      else setVerificationStatus('not_submitted');
      /* المراحل من tutor_profiles — مصدرها الحقيقي في DB */
      const dbStages = sanitizeStages(data?.stages);
      if (dbStages.length) setStages(dbStages);
      setStagesLoading(false);
    };
    void loadVerification();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stages.length === 0) {
      alert('اختر المرحلة (أو المراحل) التي تدرّسها — لا يمكن الحفظ بدون مرحلة واحدة على الأقل.');
      return;
    }
    setIsSaving(true);
    try {
      if (updateUserProfile) {
        await updateUserProfile({
          name,
          phone,
          governorate,
          area,
          profileData: {
            ...(user?.profileData || {}),
            subject,
            headline,
            bio,
            stages,
            pricePerSession: Number(pricePerSession) || 0,
          },
        });
      }
      /* المراحل تُحفظ في tutor_profiles مباشرة (المصدر الحقيقي للمجموعات والبحث) */
      if (supabase && user?.uid) {
        await supabase.from('tutor_profiles').upsert({
          user_id: user.uid,
          stages,
          headline: headline || undefined,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.warn('Save profile error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const verificationLabel = verificationStatus === 'approved' ? 'معلم موثق ✓' : verificationStatus === 'pending' ? 'طلب التوثيق قيد المراجعة' : verificationStatus === 'rejected' ? 'لم تتم الموافقة على التوثيق' : verificationStatus === 'loading' ? 'جاري التحقق من حالة التوثيق...' : 'الحساب غير موثق';

  return (
    <div className="space-y-8 text-right max-w-4xl mx-auto">
      <SectionExplainer
        storageKey="teacher_profile_edit_v1"
        title="البروفايل العام"
        text="بياناتك الظاهرة للطلاب وأولياء الأمور في البحث، وفيها تحدد مادتك والمراحل التي تدرّسها."
        steps={[
          '«المراحل التي تدرّسها» تحدد مجموعاتك المسموح بها (ابتدائي / إعدادي / ثانوي) — تعدلها هنا في أي وقت.',
          'التوثيق يظهر ملفك في دليل المدرسين للطلاب.',
          'سعر الحصة والعنوان التعريفي يظهران في نتائج البحث.',
        ]}
      />
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2"><User className="w-3.5 h-3.5" /><span>الملف الشخصي والبيانات العامة</span></div>
        <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">تعديل الملف التعريفي للمعلم</h2>
        <p className="text-xs text-[#6B7280] mt-1">هذه البيانات هي ما يظهر للطلاب وأولياء الأمور في صفحة البحث وملفك العام بعد اعتماد التوثيق.</p>
      </div>

      {savedSuccess && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 text-center flex items-center justify-center gap-2 animate-fadeIn"><CheckCircle2 className="w-5 h-5 text-[#10B981]" /><span>تم حفظ التعديلات وتحديث ملفك العام بنجاح!</span></div>}

      <div className={`rounded-3xl p-5 border ${verificationStatus === 'approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-start gap-3">
          {verificationStatus === 'approved' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" /> : <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5" />}
          <div>
            <div className="font-black text-sm text-slate-900">{verificationLabel}</div>
            <p className="text-xs leading-6 mt-1 text-slate-700">{verificationStatus === 'approved' ? 'سيظهر ملفك في دليل المدرسين الموثقين وفق سياسات المنصة.' : 'المدرس غير الموثق لا يظهر في البحث ولا يمكنه استخدام خدمات المدرسين المقيدة بالتوثيق.'}</p>
            <p className="text-[11px] text-slate-600 mt-2">التوثيق لا يعني اعتمادًا حكوميًا أو ضمانًا للنتائج التعليمية؛ هو عملية تحقق من الهوية والبيانات التي تطلبها المنصة.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
            <div className="relative">
              <img src={user?.avatarUrl || 'https://placehold.co/200x200/png?text=Teacher'} alt={name || 'المعلم'} className="w-24 h-24 rounded-3xl object-cover border-2 border-white ring-2 ring-blue-200 shadow-md" referrerPolicy="no-referrer" />
              <button type="button" className="absolute -bottom-2 -right-2 p-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-md transition-transform cursor-pointer" title="تغيير الصورة الشخصية"><Camera className="w-4 h-4" /></button>
            </div>
            <div className="text-center sm:text-right space-y-1 flex-1">
              <h3 className="text-lg font-bold text-[#1E3A8A]">{name || 'أكمل اسمك'}</h3>
              <p className="text-xs text-[#6B7280]">كود الانضمام المباشر لطلابك: <strong className="font-mono text-[#2563EB]">{joinCode || 'سيظهر بعد إكمال الحساب'}</strong></p>
              {verificationStatus === 'approved' ? <Badge variant="success" size="sm" className="mt-1">معلم موثق ✓</Badge> : <span className="inline-flex mt-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">غير موثق</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div><label className="block font-bold text-[#1F2937] mb-1">الاسم الكامل الظاهر للطلاب</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right font-bold focus:bg-white focus:outline-none focus:border-[#2563EB]" /></div>
            <div><label className="block font-bold text-[#1F2937] mb-1">المادة الأساسية</label><input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right font-bold focus:bg-white focus:outline-none focus:border-[#2563EB]" /></div>
            <div className="sm:col-span-2"><label className="block font-bold text-[#1F2937] mb-1">العنوان التعريفي البارز</label><input type="text" required value={headline} onChange={(e) => setHeadline(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right focus:bg-white focus:outline-none focus:border-[#2563EB]" /></div>
            <div className="sm:col-span-2"><label className="block font-bold text-[#1F2937] mb-1">نبذة عنك وخبرتك الأكاديمية</label><textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right focus:bg-white focus:outline-none focus:border-[#2563EB]" /></div>
          </div>

          {/* المراحل التي يدرّسها */}
          <div className="rounded-2xl border border-slate-200 bg-[#F8FAFF] p-4 space-y-3">
            <div className="text-xs font-black text-slate-600 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#2563EB]" />
              المراحل التي تدرّسها <span className="text-[#EF4444]">*</span>
            </div>
            {stagesLoading ? (
              <div className="py-4 text-center"><Loader2 className="w-4 h-4 animate-spin text-blue-600 mx-auto" /></div>
            ) : (
              <StageMultiPicker
                value={stages}
                onChange={setStages}
                hint="المجموعات التي تنشئها يجب أن تكون من هذه المراحل — ويمكنك تعديلها في أي وقت وسيُحدّث ملفك للطلاب."
              />
            )}
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-[#1E3A8A]">الموقع وسعر الحصة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div><label className="block font-bold text-[#1F2937] mb-1">المحافظة</label><input type="text" value={governorate} onChange={(e) => setGovernorate(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right" /></div>
            <div><label className="block font-bold text-[#1F2937] mb-1">المنطقة / السناتر</label><input type="text" value={area} onChange={(e) => setArea(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right" /></div>
            <div>
              <label className="block font-bold text-[#1F2937] mb-1">سعر الحصة (ج.م)</label>
              <input
                type="number"
                min="0"
                placeholder="مثلاً 120"
                value={pricePerSession === '' || pricePerSession === 0 ? '' : pricePerSession}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    setPricePerSession('');
                  } else {
                    e.target.select();
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setPricePerSession(val === '' ? '' : Number(val));
                }}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-right font-mono font-bold focus:bg-white focus:outline-none focus:border-[#2563EB] placeholder:text-gray-400 placeholder:font-normal"
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSaving} className={`w-full py-3.5 ${savedSuccess ? 'bg-emerald-600 text-white' : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'} font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50`}>
          {isSaving ? <span>جاري الحفظ والمزامنة...</span> : savedSuccess ? <><CheckCircle2 className="w-4 h-4" /><span>تم الحفظ والتحديث ✓</span></> : <><Save className="w-4 h-4" /><span>حفظ وتحديث الملف الشخصي</span></>}
        </button>
      </form>
    </div>
  );
};
