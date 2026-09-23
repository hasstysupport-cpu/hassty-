/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Mail, Plus, Trash2, RefreshCw, CheckCircle2, AlertTriangle, Crown, Info } from 'lucide-react';
import { fetchAdminWhitelist, addAdminEmail, removeAdminEmail } from '../../lib/securityConfig';

/** صفحة أمان الوصول — إدارة قايمة إيميلات الإدارة المصرح لهم بالدخول.
 *  القايمة محفوظة على السيرفر فقط ولا تظهر في كود الواجهة نهائيًا.
 *  أي بريد مُضاف يقدر يسجل دخول جوجل ويدخل اللوحة تلقائيًا. */

const maskEmailForList = (email: string) => {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const shown = local.slice(0, 2);
  return `${shown}${'•'.repeat(Math.max(local.length - 2, 2))}@${domain}`;
};

export const AdminAccessPage: React.FC = () => {
  const [emails, setEmails] = useState<string[]>([]);
  const [owner, setOwner] = useState('');
  const [max, setMax] = useState(10);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await fetchAdminWhitelist();
      setEmails(data.emails || []);
      setOwner(data.owner || '');
      setMax(data.max || 10);
      setIsError(false);
    } catch (err: any) {
      setIsError(true);
      setMessage(err?.message || 'تعذر تحميل القايمة.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email || busy) return;
    setBusy('add');
    setMessage('');
    try {
      const res = await addAdminEmail(email);
      setEmails(res.emails || []);
      setNewEmail('');
      setIsError(false);
      setMessage(res.message || 'تمت إضافة الإيميل بنجاح.');
    } catch (err: any) {
      setIsError(true);
      setMessage(err?.message || 'تعذر إضافة الإيميل.');
    } finally {
      setBusy('');
    }
  };

  const handleRemove = async (email: string) => {
    if (busy) return;
    setBusy(email);
    setMessage('');
    try {
      const res = await removeAdminEmail(email);
      setEmails(res.emails || []);
      setIsError(false);
      setMessage(res.message || 'تم حذف الإيميل وتخفيض صلاحياته.');
    } catch (err: any) {
      setIsError(true);
      setMessage(err?.message || 'تعذر حذف الإيميل.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-[#1E3A8A] flex items-center gap-2">
          <ShieldAlert className="w-7 h-7 text-blue-600" /> أمان الوصول
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          إدارة إيميلات الإدارة المصرح لهم بالدخول للوحة التحكم عبر Google أو رمز التحقق.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 leading-6 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <b>كيف تعمل الحماية؟</b> القايمة محفوظة على الخادم فقط ولا تظهر في كود الموقع إطلاقًا.
          أي حساب جوجل بريده ضمن القايمة يدخل اللوحة تلقائيًا عند تسجيل الدخول، وأي حساب آخر يُرفض فورًا.
          حذف الإيميل من القايمة يُسقط صلاحيات حسابه الإداري مباشرة.
        </div>
      </div>

      {/* إضافة إيميل جديد */}
      <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
        <label className="block text-xs font-black text-[#1E3A8A]">إضافة إيميل إداري جديد</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="example@gmail.com"
              maxLength={120}
              dir="ltr"
              className="w-full pr-10 pl-3 py-3 rounded-xl border border-gray-200 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={!newEmail.trim() || busy === 'add' || emails.length >= max}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {busy === 'add' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إضافة
          </button>
        </div>
        <p className="text-[11px] text-slate-400">
          الحد الأقصى {max} إيميلات — المستخدم الحالي: {emails.length}. لو الحساب موجود بالفعل في المنصة سيتم ترقيته إداريًا فورًا.
        </p>
      </form>

      {/* رسالة النتيجة */}
      {message && (
        <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {isError ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {message}
        </div>
      )}

      {/* القايمة الحالية */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-[#1E3A8A]">الإيميلات المصرح لها ({emails.length})</h2>
          <button onClick={() => void load()} disabled={loading} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> تحديث
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> جارٍ التحميل...
          </div>
        ) : emails.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">لا توجد إيميلات.</div>
        ) : (
          <div className="space-y-2">
            {emails.map((email) => {
              const isOwner = email === owner;
              return (
                <div key={email} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOwner ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                      {isOwner ? <Crown className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1F2937] font-mono truncate" dir="ltr">{maskEmailForList(email)}</p>
                      <p className="text-[11px] text-slate-400">{isOwner ? 'المالك الرسمي — لا يمكن حذفه' : 'مدير مُصرّح له'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => void handleRemove(email)}
                    disabled={isOwner || busy === email}
                    title={isOwner ? 'بريد المالك محمي' : 'حذف من القايمة'}
                    className="self-start sm:self-auto px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-40 disabled:hover:bg-red-50"
                  >
                    {busy === email ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    حذف
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
