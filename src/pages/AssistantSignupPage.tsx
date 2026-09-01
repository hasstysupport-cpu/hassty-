import React, { useState } from 'react';
import { BriefcaseBusiness, CheckCircle2, FileBadge, MapPin, ShieldCheck, User, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LocationSelector } from '../components/common/LocationSelector';
import { AuthShell } from '../components/common/AuthShell';

export const AssistantSignupPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState(''); const [whatsappPhone, setWhatsappPhone] = useState(''); const [governorate, setGovernorate] = useState('القاهرة'); const [city, setCity] = useState('مدينة نصر');
  const [experienceYears, setExperienceYears] = useState(''); const [experienceSummary, setExperienceSummary] = useState(''); const [education, setEducation] = useState(''); const [certificateSummary, setCertificateSummary] = useState('');
  const [agreed, setAgreed] = useState(false); const [loading, setLoading] = useState(false); const [success, setSuccess] = useState(false); const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!agreed) return setError('يجب الموافقة على شروط التسجيل كمساعد قبل إرسال الطلب.');
    if (!supabase) return setError('تعذر الاتصال بقاعدة البيانات.');
    if (!name.trim() || !email.trim() || !password || !phone.trim() || !whatsappPhone.trim() || !governorate || !city) return setError('أكمل جميع البيانات الأساسية.');
    if (password.length < 8) return setError('كلمة المرور يجب أن تكون 8 أحرف أو أكثر.');
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { full_name: name.trim(), role: 'assistant' }, emailRedirectTo: `${window.location.origin}/verify-email` } });
      if (authError) throw authError; if (!authData.user) throw new Error('لم يتم إنشاء الحساب.');
      const uid = authData.user.id;
      const { error: profileError } = await supabase.from('profiles').upsert({ id: uid, email: email.trim().toLowerCase(), full_name: name.trim(), phone: phone.trim(), role: 'assistant', governorate, city, account_status: 'under_review', badge: 'none', metadata: { authProvider: 'email', onboardingComplete: true, isVerified: false, verificationStatus: 'pending' } }, { onConflict: 'id' });
      if (profileError) throw profileError;
      const { error: assistantError } = await supabase.from('assistant_profiles').upsert({ user_id: uid, full_name: name.trim(), phone: phone.trim(), whatsapp_phone: whatsappPhone.trim(), governorate, city, experience_years: Number(experienceYears) || 0, experience_summary: experienceSummary.trim(), education: education.trim(), certificate_summary: certificateSummary.trim(), verification_status: 'pending', is_verified: false }, { onConflict: 'user_id' });
      if (assistantError) throw assistantError;
      const { error: requestError } = await supabase.from('assistant_verification_requests').insert({ assistant_id: uid, status: 'pending' });
      if (requestError) throw requestError;
      await supabase.from('notifications').insert({ user_id: uid, title: 'تم استلام طلب المساعد', message: 'تم استلام طلب انضمامك كمساعد. سيقوم فريق حِصّتي بالتواصل معك لاستكمال توثيق الهوية والمؤهلات.', type: 'verification', link: '/assistant/verification' });
      await supabase.auth.signOut(); setSuccess(true);
    } catch (err: any) { setError(err?.message || 'حدث خطأ أثناء إرسال الطلب.'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <AuthShell onNavigate={onNavigate}>
      <div className="card-lux bg-white border border-slate-200/90 rounded-3xl shadow-[0_20px_60px_-24px_rgba(30,58,138,0.25)] p-8 text-center anim-up">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/40 animate-success-ring">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">تم إرسال طلبك بنجاح ✅</h1>
        <p className="mt-3 text-sm text-slate-600 leading-7">تم تسجيل طلبك كمساعد وهو الآن تحت المراجعة. سيطلب منك فريق الإدارة بطاقة الهوية والمؤهلات عند بدء التوثيق، وسيتم التواصل معك عبر واتساب.</p>
        <button onClick={() => onNavigate('/')} className="auth-btn mt-7 px-6 py-3 rounded-2xl text-white font-black">العودة للموقع</button>
      </div>
    </AuthShell>
  );

  return (
    <AuthShell onNavigate={onNavigate} width="wide" miniTitle="فريق العمل المتميز ✨">
      <div className="card-lux bg-white border border-slate-200/90 rounded-3xl shadow-[0_20px_60px_-24px_rgba(30,58,138,0.25)] overflow-hidden anim-up">
        <div className="p-6 sm:p-7 border-b border-slate-100 bg-gradient-to-l from-[#EFF6FF] via-white to-[#F5F3FF]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white flex items-center justify-center shadow-lg shadow-sky-500/30">
              <BriefcaseBusiness className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">التسجيل كمساعد مدرس</h1>
              <p className="text-xs text-slate-500 mt-1">بياناتك أولًا، ثم مراجعة وتوثيق الإدارة.</p>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="p-6 sm:p-7 space-y-6">
          <section className="space-y-4">
            <h2 className="font-black text-slate-800 flex items-center gap-2"><User className="w-5 h-5 text-[#0EA5E9]" /> البيانات الأساسية</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input required value={name} onChange={e=>setName(e.target.value)} placeholder="الاسم بالكامل" className="auth-input p-3.5 text-sm"/>
              <input required dir="ltr" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="رقم الهاتف" className="auth-input p-3.5 text-sm text-left"/>
              <input required dir="ltr" type="tel" value={whatsappPhone} onChange={e=>setWhatsappPhone(e.target.value)} placeholder="رقم واتساب للتواصل" className="auth-input p-3.5 text-sm text-left"/>
              <input required dir="ltr" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="auth-input p-3.5 text-sm text-left"/>
              <div className="relative">
                <input required dir="ltr" minLength={8} type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة مرور قوية" className="auth-input p-3.5 pl-11 text-sm text-left"/>
                <button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute left-3 top-3.5 text-slate-400">{showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button>
              </div>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="font-black text-slate-800 flex items-center gap-2"><MapPin className="w-5 h-5 text-[#0EA5E9]" /> المكان والخبرة</h2>
            <LocationSelector selectedGovernorate={governorate} selectedCity={city} onSelectGovernorate={setGovernorate} onSelectCity={setCity} showCitySelect placeholder="اختر المحافظة والمدينة"/>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="number" min="0" max="60" value={experienceYears} onChange={e=>setExperienceYears(e.target.value)} placeholder="سنوات الخبرة" className="auth-input p-3.5 text-sm"/>
              <input value={education} onChange={e=>setEducation(e.target.value)} placeholder="المؤهل الدراسي" className="auth-input p-3.5 text-sm"/>
            </div>
            <textarea value={experienceSummary} onChange={e=>setExperienceSummary(e.target.value)} placeholder="الخبرات والمهام السابقة" rows={4} className="auth-input p-3.5 text-sm resize-none"/>
            <textarea value={certificateSummary} onChange={e=>setCertificateSummary(e.target.value)} placeholder="الشهادات والدورات" rows={3} className="auth-input p-3.5 text-sm resize-none"/>
          </section>
          <section className="p-4 rounded-2xl bg-gradient-to-l from-amber-50 to-orange-50/60 border border-amber-200">
            <div className="flex items-start gap-3">
              <FileBadge className="w-5 h-5 text-amber-600 mt-0.5"/>
              <div className="text-sm text-amber-900 leading-6"><strong>التوثيق:</strong> بعد إرسال الطلب يظهر الملف للأدمن. قد يتم طلب صورة البطاقة والمؤهلات وبيانات إضافية قبل الاعتماد النهائي.</div>
            </div>
          </section>
          <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} className="mt-1 w-4 h-4"/>
            <span className="text-sm text-slate-700 leading-6">أوافق على شروط المساعدين، وأتعهد بصحة بياناتي وأوافق على التحقق من هويتي ومؤهلاتي بواسطة إدارة حِصّتي.</span>
          </label>
          {error && <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold">{error}</div>}
          <button disabled={loading} type="submit" className="auth-btn w-full py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2 disabled:opacity-50">
            <ShieldCheck className="w-5 h-5"/>
            {loading?'جاري إرسال الطلب...':'إرسال طلب التسجيل والتوثيق'}
          </button>
          <p className="text-center text-xs text-slate-400">إنشاء الحساب لا يمنح أي صلاحيات مدرس حتى تعتمد الإدارة الطلب.</p>
        </form>
      </div>
    </AuthShell>
  );
};
