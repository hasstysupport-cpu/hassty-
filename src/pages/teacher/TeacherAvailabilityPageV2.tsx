import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Plus, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { GroupScheduleSlot } from '../../types';

const days = [
  ['Saturday', 'السبت'], ['Sunday', 'الأحد'], ['Monday', 'الإثنين'], ['Tuesday', 'الثلاثاء'],
  ['Wednesday', 'الأربعاء'], ['Thursday', 'الخميس'], ['Friday', 'الجمعة']
];

export const TeacherAvailabilityPage: React.FC = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<GroupScheduleSlot[]>([]);
  const [day, setDay] = useState('Sunday');
  const [startTime, setStartTime] = useState('16:30');
  const [endTime, setEndTime] = useState('18:30');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!supabase || !user?.uid) return;
    const { data, error: readError } = await supabase.from('tutor_profiles').select('availability_slots').eq('user_id', user.uid).maybeSingle();
    if (readError) { setError(readError.message); return; }
    const value = Array.isArray(data?.availability_slots) ? data.availability_slots : [];
    setSlots(value as GroupScheduleSlot[]);
  };

  useEffect(() => { void load(); }, [user?.uid]);

  const addSlot = () => {
    if (startTime >= endTime) { setError('وقت نهاية الموعد يجب أن يكون بعد وقت البداية.'); return; }
    setError('');
    const ar = days.find(d => d[0] === day)?.[1] || day;
    setSlots(prev => [...prev, { id: crypto.randomUUID(), day, dayArabic: ar, startTime, endTime }]);
  };

  const removeSlot = (id: string) => setSlots(prev => prev.filter(s => s.id !== id));

  const save = async () => {
    if (!supabase || !user?.uid) return;
    setSaving(true); setSaved(false); setError('');
    const { data: tutor, error: readError } = await supabase.from('tutor_profiles').select('id').eq('user_id', user.uid).maybeSingle();
    if (readError) { setError(readError.message); setSaving(false); return; }
    let writeError: any = null;
    if (tutor?.id) {
      ({ error: writeError } = await supabase.from('tutor_profiles').update({ availability_slots: slots, updated_at: new Date().toISOString() }).eq('id', tutor.id));
    } else {
      ({ error: writeError } = await supabase.from('tutor_profiles').insert({ user_id: user.uid, availability_slots: slots, is_verified: false, verification_status: 'pending' }));
    }
    if (writeError) setError(writeError.message); else setSaved(true);
    setSaving(false);
  };

  return <div className="space-y-5 text-right max-w-4xl mx-auto">
    <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div><div className="inline-flex items-center gap-2 text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full"><Calendar className="w-4 h-4" />مواعيد محفوظة في Supabase</div><h2 className="text-xl font-black text-slate-900 mt-2">إدارة المواعيد الأسبوعية</h2><p className="text-xs text-slate-500 mt-1">هذه المواعيد هي المصدر الذي تعتمد عليه صفحة مسح الحضور لتحديد الحصة والحالة تلقائيًا.</p></div>
        <button onClick={() => void save()} disabled={saving} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black disabled:opacity-50 flex items-center gap-2"><Save className="w-4 h-4" />{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
      </div>
      {saved && <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />تم حفظ المواعيد ونشرها للطلاب.</div>}
      {error && <div className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold">{error}</div>}
    </section>
    <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-black text-slate-900 mb-4"><Plus className="w-4 h-4 text-blue-600" />إضافة موعد</div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <select value={day} onChange={e => setDay(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold">{days.map(d => <option key={d[0]} value={d[0]}>{d[1]}</option>)}</select>
        <label className="rounded-xl border border-slate-300 px-3 py-2.5 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full outline-none" /></label>
        <label className="rounded-xl border border-slate-300 px-3 py-2.5 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full outline-none" /></label>
        <button onClick={addSlot} className="rounded-xl bg-slate-900 text-white text-sm font-black flex items-center justify-center gap-2"><Plus className="w-4 h-4" />إضافة</button>
      </div>
    </section>
    <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 mb-3">المواعيد الحالية ({slots.length})</h3>
      <div className="space-y-2">{slots.map(slot => <div key={slot.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200"><div><div className="text-sm font-black text-slate-900">{slot.dayArabic}</div><div className="text-xs text-slate-500" dir="ltr">{slot.startTime} → {slot.endTime}</div></div><button onClick={() => removeSlot(slot.id)} className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button></div>)}</div>
      {!slots.length && <div className="py-10 text-center text-xs text-slate-400">لا توجد مواعيد محفوظة بعد.</div>}
    </section>
  </div>;
};
