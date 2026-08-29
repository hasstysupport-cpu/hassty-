import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, GraduationCap, MapPin, Phone, Save, UserRound, Users, Briefcase, Sparkles } from 'lucide-react';
import { AccountRole } from '../types';
import { useAuth } from '../lib/AuthContext';

interface ProfileSetupPageProps {
  onComplete: (role: AccountRole) => void;
  onLogout?: () => void;
}

const roleCopy: Record<Exclude<AccountRole, 'admin'>, { title: string; subtitle: string; icon: React.ElementType }> = {
  student: { title: 'كمّل بياناتك كطالب', subtitle: 'خطوة واحدة ونجهز حسابك لاكتشاف المدرسين والحصص.', icon: GraduationCap },
  parent: { title: 'كمّل بيانات ولي الأمر', subtitle: 'أضف بياناتك حتى تتابع أبناءك وحضورهم ومدفوعاتهم.', icon: Users },
  teacher: { title: 'جهّز ملفك كمدرس', subtitle: 'بياناتك الأساسية هتظهر في ملفك بعد إكمال التسجيل، ثم يبدأ التحقق.', icon: Briefcase },
};

export const ProfileSetupPage: React.FC<ProfileSetupPageProps> = ({ onComplete, onLogout }) => {
  const { user, updateUserProfile } = useAuth();
  const role = (user?.role === 'admin' ? 'student' : user?.role || 'student') as Exclude<AccountRole, 'admin'>;
  const Icon = roleCopy[role].icon;

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [governorate, setGovernorate] = useState(user?.governorate || '');
  const [area, setArea] = useState(user?.area || '');
  const [grade, setGrade] = useState(user?.profileData?.grade || '');
  const [subject, setSubject] = useState(user?.profileData?.subject || '');
  const [experience, setExperience] = useState(String(user?.profileData?.experienceYears || ''));
  const [bio, setBio] = useState(user?.profileData?.bio || '');
  const [parentPhone, setParentPhone] = useState(user?.profileData?.parentPhone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const completion = useMemo(() => {
    const common = [name, phone, governorate, area].filter(Boolean).length;
    const roleFields = role === 'teacher' ? [subject, experience].filter(Boolean).length : role === 'student' ? [grade].filter(Boolean).length : 1;
    const total = role === 'teacher' ? 6 : 5;
    return Math.min(100, Math.round(((common + roleFields) / total) * 100));
  }, [name, phone, governorate, area, grade, subject, experience, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !governorate.trim() || !area.trim()) {
      setError('اكتب الاسم ورقم الموبايل والمحافظة والمنطقة عشان نكمل الحساب.');
      return;
    }
    if (role === 'student' && !grade.trim()) {
      setError('اختار المرحلة أو الصف الدراسي.');
      return;
    }
    if (role === 'teacher' && (!subject.trim() || !experience.trim())) {
      setError('اكتب المادة وسنوات الخبرة على الأقل.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        governorate: governorate.trim(),
        area: area.trim(),
        ...(role === 'student' ? { grade: grade.trim(), parentPhone: parentPhone.trim() } : {}),
        ...(role === 'teacher' ? { subject: subject.trim(), experienceYears: experience.trim(), bio: bio.trim() } : {}),
      });
      onComplete(role);
    } catch (err: any) {
      setError(err?.message || 'تعذر حفظ البيانات. جرّب مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gradient-to-b from-[#F7FAFF] via-white to-[#EEF5FF] px-4 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
        <section className="rounded-[32px] bg-[#0F2F6B] text-white p-7 sm:p-9 shadow-xl shadow-blue-900/10 overflow-hidden relative">
          <div className="absolute -top-20 -left-20 w-56 h-56 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              أول دخول
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight">{roleCopy[role].title}</h1>
              <p className="text-blue-100/80 text-sm mt-2 leading-7">{roleCopy[role].subtitle}</p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span>اكتمال الحساب</span>
                <span>{completion}%</span>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-300" style={{ width: `${completion}%` }} />
              </div>
            </div>
            <div className="space-y-3 text-xs text-blue-100/80">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300" /> حساب Google مربوط بحسابك.</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300" /> بياناتك محفوظة في Supabase.</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300" /> تقدر تعدّل ملفك من الإعدادات لاحقًا.</div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[32px] shadow-sm p-5 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-7">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5">
                <UserRound className="w-3.5 h-3.5" />
                {user?.email}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-3">بيانات الحساب الأساسية</h2>
              <p className="text-xs text-slate-500 mt-1">لن نطلب منك نفس البيانات مرة ثانية.</p>
            </div>
            {onLogout && <button onClick={onLogout} type="button" className="text-xs font-bold text-slate-500 hover:text-red-600">تسجيل الخروج</button>}
          </div>

          {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 text-red-700 p-3.5 text-xs font-bold">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="الاسم الكامل" icon={<UserRound className="w-4 h-4" />}>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="اكتب اسمك بالكامل" />
              </Field>
              <Field label="رقم الموبايل" icon={<Phone className="w-4 h-4" />}>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" inputMode="tel" placeholder="01xxxxxxxxx" />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="المحافظة" icon={<MapPin className="w-4 h-4" />}>
                <input value={governorate} onChange={(e) => setGovernorate(e.target.value)} className="input" placeholder="مثال: كفر الشيخ" />
              </Field>
              <Field label="المنطقة / المدينة" icon={<MapPin className="w-4 h-4" />}>
                <input value={area} onChange={(e) => setArea(e.target.value)} className="input" placeholder="مثال: فوه" />
              </Field>
            </div>

            {role === 'student' && (
              <>
                <Field label="الصف أو المرحلة الدراسية" icon={<BookOpen className="w-4 h-4" />}>
                  <input value={grade} onChange={(e) => setGrade(e.target.value)} className="input" placeholder="مثال: الصف الثالث الثانوي" />
                </Field>
                <Field label="رقم ولي الأمر (اختياري)" icon={<Users className="w-4 h-4" />}>
                  <input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className="input" inputMode="tel" placeholder="01xxxxxxxxx" />
                </Field>
              </>
            )}

            {role === 'teacher' && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="المادة الأساسية" icon={<BookOpen className="w-4 h-4" />}>
                    <input value={subject} onChange={(e) => setSubject(e.target.value)} className="input" placeholder="مثال: الرياضيات" />
                  </Field>
                  <Field label="سنوات الخبرة" icon={<Briefcase className="w-4 h-4" />}>
                    <input value={experience} onChange={(e) => setExperience(e.target.value)} className="input" placeholder="مثال: 8 سنوات" />
                  </Field>
                </div>
                <Field label="نبذة قصيرة عنك" icon={<Sparkles className="w-4 h-4" />}>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="input min-h-28 resize-y" placeholder="عرّف الطلاب بولادك وخبرتك وطريقة الشرح..." />
                </Field>
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800 font-bold leading-6">
                  بعد الإكمال سيظهر حسابك كمدرس غير موثّق حتى تراجع الإدارة مستندات التوثيق.
                </div>
              </>
            )}

            <button disabled={isSaving} className="w-full py-3.5 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-sm font-black transition-all shadow-lg shadow-blue-500/15 flex items-center justify-center gap-2">
              {isSaving ? <span>جاري حفظ بياناتك...</span> : <><Save className="w-4 h-4" /> حفظ وإنهاء إعداد الحساب <ArrowLeft className="w-4 h-4" /></>}
            </button>
          </form>
        </section>
      </div>
      <style>{`.input{width:100%;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;padding:12px 14px;font-size:13px;font-weight:600;outline:none;transition:.2s}.input:focus{background:#fff;border-color:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,.08)}`}</style>
    </div>
  );
};

const Field: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <label className="block">
    <span className="flex items-center gap-2 text-xs font-black text-slate-800 mb-2">{icon}{label}</span>
    {children}
  </label>
);
