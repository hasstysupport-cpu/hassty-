/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Smartphone, RefreshCw, Loader2, Copy, Check, Send, FlaskConical, Unlink,
  QrCode, ShieldCheck, WifiOff, AlertTriangle, LogIn, Info, ChevronDown, MessageCircle, X,
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { teacherWhatsApp, TeacherWhatsAppState } from '../../lib/whatsappService';
import { PageHeader, Card, Btn, ConfirmDialog, useToast, fmtDateTime } from '../../components/common/ui';
import { Modal } from '../../components/common/Modal';

/* أكواد الدول الشائعة (الافتراضي مصر +20) */
const COUNTRY_CODES = [
  { code: '20', label: '🇪🇬 مصر +20' },
  { code: '966', label: '🇸🇦 السعودية +966' },
  { code: '971', label: '🇦🇪 الإمارات +971' },
  { code: '965', label: '🇰🇼 الكويت +965' },
  { code: '974', label: '🇶🇦 قطر +974' },
  { code: '973', label: '🇧🇭 البحرين +973' },
  { code: '968', label: '🇴🇲 عُمان +968' },
  { code: '962', label: '🇯🇴 الأردن +962' },
  { code: '964', label: '🇮🇶 العراق +964' },
  { code: '967', label: '🇾🇪 اليمن +967' },
  { code: '249', label: '🇸🇩 السودان +249' },
  { code: '212', label: '🇲🇦 المغرب +212' },
  { code: '213', label: '🇩🇿 الجزائر +213' },
  { code: '216', label: '🇹🇳 تونس +216' },
  { code: '218', label: '🇱🇾 ليبيا +218' },
];

const DEFAULT_TEST_MESSAGE = 'مرحبًا 👋 هذه رسالة تجريبية من Hassty.';

function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('20') && digits.length === 12) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
  return digits.length > 8 ? `+${digits}` : digits;
}

function formatPairing(code?: string | null): string {
  if (!code) return '';
  const s = String(code).toUpperCase();
  return s.length === 8 ? `${s.slice(0, 4)} ${s.slice(4)}` : s;
}

const AUTH_ERROR_HINT = 'انتهت الجلسة أو لا تملك صلاحية الوصول — سجّل الدخول من جديد.';

export const TeacherWhatsAppPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const toast = useToast();

  /* الحالة العامة */
  const [st, setSt] = useState<TeacherWhatsAppState | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'auth_error' | 'fatal'>('loading');
  const [degraded, setDegraded] = useState(false);        // خدمة السيرفر غير متاحة مؤقتًا
  const [sessionMissing, setSessionMissing] = useState(false);
  const [linking, setLinking] = useState(false);          // جاري إنشاء الاتصال

  /* ربط برقم الهاتف + Pairing Code */
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [pairCountryCode, setPairCountryCode] = useState('20');
  const [pairPhoneInput, setPairPhoneInput] = useState('');
  const [pairingBusy, setPairingBusy] = useState(false);

  /* QR Modal */
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [qrNonce, setQrNonce] = useState(0);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrCountdown, setQrCountdown] = useState(0);
  const [qrTtl, setQrTtl] = useState(25);
  const [copied, setCopied] = useState(false);
  const refreshingQrRef = useRef(false);

  /* إرسال رسائل */
  const [sendModal, setSendModal] = useState<null | 'test' | 'normal'>(null);
  const [countryCode, setCountryCode] = useState('20');
  const [phoneInput, setPhoneInput] = useState('');
  const [messageInput, setMessageInput] = useState(DEFAULT_TEST_MESSAGE);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<null | { ok: boolean; text: string }>(null);

  /* فصل */
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const pollBusyRef = useRef(false);

  /* ============ polling آمن كل 4 ثوانٍ (يتوقف لو الصفحة مخفية أو فيه عملية جارية) ============ */
  const poll = useCallback(async () => {
    if (pollBusyRef.current || document.hidden || linking) return;
    pollBusyRef.current = true;
    try {
      const res = await teacherWhatsApp.status();
      if (res?.ok === true) {
        setSt(res);
        setDegraded(res.status === 'service_unavailable');
        setSessionMissing(Boolean(res.sessionMissing));
        setLoadState('ready');
        if (res.status === 'connected' && qrModalOpen) {
          setQrModalOpen(false);
          toast.push('success', 'تم ربط واتساب بنجاح 🎉');
        }
      } else if (res?.success === false) {
        const msg = String(res.error || '');
        if (msg.includes('مصرح') || msg.includes('المعلمين') || msg.includes('انتهت')) {
          setLoadState('auth_error');
        } else {
          /* خطأ عابر — نحتفظ بآخر حالة معروفة */
          setDegraded(true);
          setLoadState((p) => (p === 'auth_error' ? p : 'ready'));
        }
      }
    } catch {
      setDegraded(true);
    } finally {
      pollBusyRef.current = false;
    }
  }, [linking, qrModalOpen, toast]);

  useEffect(() => {
    void poll();
    const id = setInterval(() => void poll(), 4000);
    return () => clearInterval(id);
  }, [poll]);

  /* إعادة الجلب فورًا عند رجوع التبويب للمقدمة */
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) void poll(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [poll]);

  /* ============ عدّاد انتهاء QR + تحديث تلقائي ============ */
  useEffect(() => {
    if (!qrModalOpen || !qr) return;
    setQrCountdown(qrTtl);
    const id = setInterval(() => setQrCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [qr, qrNonce, qrModalOpen, qrTtl]);

  const refreshQr = useCallback(async (auto = false) => {
    if (refreshingQrRef.current) return;
    refreshingQrRef.current = true;
    try {
      const res = await teacherWhatsApp.connect();
      if (res?.ok === true) {
        if (res.status === 'connected') {
          setQrModalOpen(false);
          setSt(res);
          toast.push('success', 'تم ربط واتساب بنجاح 🎉');
          return;
        }
        setQr(res.qr || null);
        if (res.qr) setQrNonce((n) => n + 1);
        setPairingCode(res.pairingCode || null);
        if (res.qrTtlSeconds) setQrTtl(res.qrTtlSeconds);
        setSt((p) => (p ? { ...p, ...res } : res));
      } else if (res?.error) {
        toast.push('error', res.error);
      }
    } catch {
      if (!auto) toast.push('error', 'تعذر تحديث رمز QR — حاول مرة أخرى.');
    } finally {
      refreshingQrRef.current = false;
    }
  }, [toast]);

  /* انتهاء العدّاد → تحديث تلقائي للرمز (طالما المودال مفتوحًا وفيه QR) */
  useEffect(() => {
    if (qrModalOpen && qr && qrCountdown === 0 && !linking && !refreshingQrRef.current) {
      void refreshQr(true);
    }
  }, [qrCountdown, qrModalOpen, qr, linking, refreshQr]);

  /* ============ ربط واتساب ============ */
  const startLinking = useCallback(async () => {
    if (linking) return;
    setLinking(true);
    setLoadState((p) => (p === 'auth_error' ? p : 'ready'));
    try {
      const res = await teacherWhatsApp.create();
      if (res?.ok === true) {
        setSt(res);
        setDegraded(false);
        setSessionMissing(false);
        if (res.status === 'connected') {
          toast.push('success', 'واتساب متصل بالفعل ✅');
          return;
        }
        setQr(res.qr || null);
        if (res.qr) setQrNonce((n) => n + 1);
        setPairingCode(res.pairingCode || null);
        if (res.qrTtlSeconds) setQrTtl(res.qrTtlSeconds);
        setQrModalOpen(true);
      } else {
        toast.push('error', res?.error || 'تعذر بدء ربط واتساب — حاول مرة أخرى.');
        if (res?.error && (String(res.error).includes('غير متاحة') || String(res.error).includes('متاح'))) setDegraded(true);
      }
    } catch {
      toast.push('error', 'تعذر بدء ربط واتساب — تحقق من اتصالك وحاول مجددًا.');
    } finally {
      setLinking(false);
    }
  }, [linking, toast]);

  /* ============ الربط الحقيقي برقم الهاتف + Pairing Code ============ */
  const pairingFullNumber = `${pairCountryCode}${pairPhoneInput.replace(/\D/g, '')}`;
  const pairingPhoneValid = pairPhoneInput.replace(/\D/g, '').length >= 8
    && pairPhoneInput.replace(/\D/g, '').length <= 14;

  const openPairingModal = useCallback(() => {
    setPairCountryCode('20');
    setPairPhoneInput('');
    setPairingModalOpen(true);
  }, []);

  const requestPairingCode = useCallback(async () => {
    if (pairingBusy || !pairingPhoneValid) return;
    setPairingBusy(true);
    setLoadState((p) => (p === 'auth_error' ? p : 'ready'));
    try {
      const res = await teacherWhatsApp.create(pairingFullNumber);
      if (res?.ok === true) {
        setSt(res);
        setDegraded(false);
        setSessionMissing(false);
        if (res.status === 'connected') {
          setPairingModalOpen(false);
          toast.push('success', 'واتساب متصل بالفعل ✅');
          return;
        }
        setQr(res.qr || null);
        if (res.qr) setQrNonce((n) => n + 1);
        setPairingCode(res.pairingCode || null);
        if (res.qrTtlSeconds) setQrTtl(res.qrTtlSeconds);
        setPairingModalOpen(false);
        setQrModalOpen(true);
        if (res.pairingCode) {
          toast.push('success', 'تم إنشاء رمز ربط واتساب الحقيقي ✅');
        } else {
          toast.push('error', 'لم يُرجع السيرفر رمز الربط بعد. جرّب تحديث الرمز.');
        }
      } else {
        toast.push('error', res?.error || 'تعذر إنشاء رمز الربط — حاول مرة أخرى.');
      }
    } catch {
      toast.push('error', 'تعذر الاتصال بخدمة واتساب — حاول مرة أخرى.');
    } finally {
      setPairingBusy(false);
    }
  }, [pairingBusy, pairingPhoneValid, pairingFullNumber, toast]);

  /* ============ نسخ رمز الربط ============ */
  const copyPairing = useCallback(async () => {
    if (!pairingCode) return;
    const text = formatPairing(pairingCode).replace(/\s/g, '');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback للمتصفحات القديمة */
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* تجاهل */ }
      document.body.removeChild(el);
    }
  }, [pairingCode]);

  /* ============ إرسال (تجربة / رسالة) ============ */
  const fullNumber = `${countryCode}${phoneInput.replace(/\D/g, '')}`;
  const phoneValid = phoneInput.replace(/\D/g, '').length >= 8 && phoneInput.replace(/\D/g, '').length <= 14;

  const openSendModal = useCallback((mode: 'test' | 'normal') => {
    setSendModal(mode);
    setSendResult(null);
    setSending(false);
    setMessageInput(mode === 'test' ? DEFAULT_TEST_MESSAGE : '');
    setPhoneInput('');
    setCountryCode('20');
  }, []);

  const doSend = useCallback(async () => {
    if (sending || !phoneValid || !messageInput.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await teacherWhatsApp.send(fullNumber, messageInput.trim());
      if (res?.ok === true || res?.success === true) {
        setSendResult({ ok: true, text: 'تم إرسال الرسالة بنجاح.' });
        toast.push('success', '✅ تم إرسال الرسالة بنجاح.');
      } else {
        setSendResult({ ok: false, text: res?.error || 'تعذر إرسال الرسالة.' });
        toast.push('error', '❌ تعذر إرسال الرسالة.');
      }
    } catch {
      setSendResult({ ok: false, text: 'تعذر إرسال الرسالة — تحقق من اتصالك وحاول مجددًا.' });
      toast.push('error', '❌ تعذر إرسال الرسالة.');
    } finally {
      setSending(false);
    }
  }, [sending, phoneValid, messageInput, fullNumber, toast]);

  /* ============ فصل واتساب ============ */
  const doDisconnect = useCallback(async () => {
    if (disconnecting) return;
    setDisconnecting(true);
    try {
      const res = await teacherWhatsApp.disconnect();
      if (res?.ok === true || res?.success === true) {
        toast.push('success', 'تم فصل واتساب — يمكنك إعادة الربط في أي وقت.');
        setDisconnectConfirm(false);
        setQr(null);
        setPairingCode(null);
        await poll();
      } else {
        toast.push('error', res?.error || 'تعذر فصل واتساب — حاول مرة أخرى.');
      }
    } catch {
      toast.push('error', 'تعذر فصل واتساب — حاول مرة أخرى.');
    } finally {
      setDisconnecting(false);
    }
  }, [disconnecting, poll, toast]);

  /* ============ الحالة المشتقة للعرض ============ */
  const status = st?.status || 'not_linked';
  const isConnected = status === 'connected';
  const isLinkedButOffline = status === 'disconnected' || status === 'qr_pending' || status === 'connecting' || status === 'error';

  /* ================================================================ */

  return (
    <div className="space-y-5 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">
      <PageHeader
        title="واتساب المدرس"
        badge="جديد"
        description="اربط رقم واتساب الخاص بك لإرسال رسائل الطلاب والتنبيهات من رقمك مباشرة."
        actions={isConnected ? (
          <Btn variant="secondary" size="sm" onClick={() => void poll()}><RefreshCw className="w-3.5 h-3.5" />تحديث الحالة</Btn>
        ) : undefined}
      />

      {/* الخدمة غير متاحة مؤقتًا — لا تتعطل لوحة Hassty نفسها */}
      {degraded && (
        <div className="anim-up bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3" dir="rtl">
          <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><WifiOff className="w-5 h-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-black text-amber-900">⚠️ خدمة واتساب غير متاحة مؤقتًا</div>
            <div className="text-xs text-amber-700 mt-0.5">حاول مرة أخرى بعد قليل.</div>
          </div>
          <Btn variant="secondary" size="sm" onClick={() => { setDegraded(false); void poll(); }}><RefreshCw className="w-3.5 h-3.5" />إعادة المحاولة</Btn>
        </div>
      )}

      {/* الجلسة منتهية / غير مصرح */}
      {loadState === 'auth_error' ? (
        <Card>
          <div className="flex flex-col items-center text-center gap-3 py-8">
            <span className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center"><LogIn className="w-7 h-7" /></span>
            <div className="text-base font-black text-slate-800">انتهت الجلسة</div>
            <p className="text-xs text-slate-500 max-w-sm leading-6">{AUTH_ERROR_HINT}</p>
            <Btn variant="primary" onClick={() => onNavigate ? onNavigate('/login') : (window.location.href = '/login')}>
              <LogIn className="w-4 h-4" />تسجيل الدخول
            </Btn>
          </div>
        </Card>
      ) : loadState === 'loading' && !st ? (
        /* تحميل أولي */
        <Card><div className="space-y-3 py-4">
          <div className="skeleton-lux h-8 w-40 rounded-xl mx-auto" />
          <div className="skeleton-lux h-4 w-64 rounded-lg mx-auto" />
          <div className="skeleton-lux h-44 w-full max-w-md rounded-2xl mx-auto" />
        </div></Card>
      ) : (
        <>
          {/* ============ البطاقة الرئيسية ============ */}
          <Card>
            {isConnected ? (
              /* ---------- متصل ---------- */
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="relative">
                  <span className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30"><Smartphone className="w-8 h-8" /></span>
                  <span className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-white border-2 border-emerald-400 flex items-center justify-center" aria-hidden="true"><span className="w-3 h-3 rounded-full bg-emerald-500 status-pulse" /></span>
                </div>
                <div className="text-base font-black text-emerald-700">🟢 واتساب متصل</div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <span className="text-xs font-bold text-slate-500">رقم واتساب المرتبط:</span>
                  <span className="text-lg font-black text-slate-800 tracking-wide select-all" dir="ltr">{formatPhoneDisplay(st?.phoneNumber) || '—'}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-black text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 status-pulse" />متصل الآن
                  </span>
                  {st?.connectedAt && <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-500">مرتبط منذ {fmtDateTime(st.connectedAt)}</span>}
                </div>
                <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
                  <Btn variant="secondary" onClick={() => openSendModal('test')}><FlaskConical className="w-4 h-4" />تجربة الرقم</Btn>
                  <Btn variant="primary" onClick={() => openSendModal('normal')}><Send className="w-4 h-4" />إرسال رسالة</Btn>
                  <Btn variant="danger" onClick={() => setDisconnectConfirm(true)}><Unlink className="w-4 h-4" />فصل واتساب</Btn>
                </div>
              </div>
            ) : (
              /* ---------- غير مرتبط / بحاجة ربط ---------- */
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <span className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center"><Smartphone className="w-8 h-8" /></span>
                <div className="text-base font-black text-slate-700">🔴 واتساب غير متصل</div>
                <p className="text-xs text-slate-500 max-w-md leading-6">
                  {sessionMissing
                    ? 'جلسة الواتساب غير موجودة على السيرفر — اضغط «ربط واتساب» لإعادة إنشائها.'
                    : 'لم يُربط أي رقم واتساب بحسابك بعد. اربط رقمك لإرسال رسائل الطلاب والتنبيهات من رقمك أنت مباشرة، دون أرقام المنصة.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-2xl mt-1">
                  {[
                    { icon: <QrCode className="w-4 h-4" />, t: 'امسح QR من واتساب هاتفك' },
                    { icon: <MessageCircle className="w-4 h-4" />, t: 'رسائلك تظهر من رقمك' },
                    { icon: <ShieldCheck className="w-4 h-4" />, t: 'مثيل خاص بك وحدك' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-600">
                      <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-[color:var(--role-color)] flex items-center justify-center shrink-0">{f.icon}</span>
                      <span className="min-w-0">{f.t}</span>
                    </div>
                  ))}
                </div>
                <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
                  <Btn variant="primary" onClick={() => void startLinking()} disabled={linking || pairingBusy}>
                    {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                    {linking ? 'جاري تجهيز QR...' : 'ربط عبر QR'}
                  </Btn>
                  <Btn variant="secondary" onClick={openPairingModal} disabled={linking || pairingBusy}>
                    <Smartphone className="w-4 h-4" />
                    ربط برقم الهاتف والرمز
                  </Btn>
                </div>
                {isLinkedButOffline && (
                  <p className="text-[10px] text-slate-400">يوجد ربط سابق بحسابك — الضغط على «ربط واتساب» سيعيد استخدام نفس الجلسة بدون تكرار.</p>
                )}
              </div>
            )}
          </Card>

          {/* حالة جاري الاتصال (خارج المودال — أثناء polling بعد بدء الربط) */}
          {status === 'connecting' && !qrModalOpen && !isConnected && (
            <Card>
              <div className="flex items-center justify-center gap-2.5 py-3 text-xs font-black text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin text-[color:var(--role-color)]" />
                جاري الاتصال بخدمة الواتساب...
              </div>
            </Card>
          )}

          {/* شرح مبسط + خصوصية */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="كيف يعمل الربط؟">
              <ol className="space-y-2.5 text-xs text-slate-600 leading-6 list-decimal ps-4">
                <li>اضغط <strong className="text-slate-800">«ربط واتساب»</strong> — تُنشأ جلسة خاصة بحسابك مرة واحدة فقط.</li>
                <li>افتح واتساب هاتفك ثم: <strong className="text-slate-800">الإعدادات ← الأجهزة المرتبطة ← ربط جهاز</strong>.</li>
                <li>امسح رمز <strong className="text-slate-800">QR</strong> الظاهر، أو استخدم <strong className="text-slate-800">رمز الربط</strong> إن وُجد.</li>
                <li>بعد نجاح الربط تتحول الحالة إلى <strong className="text-emerald-600">«واتساب متصل»</strong> ويظهر رقمك.</li>
                <li>كل رسائلك للطلاب وأولياء الأمور ستُرسل من رقمك أنت مباشرة.</li>
              </ol>
            </Card>
            <Card title="الخصوصية والأمان">
              <ul className="space-y-2.5 text-xs text-slate-600 leading-6">
                <li className="flex gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>مفاتيح السيرفر تبقى داخل أنظمة Hassty فقط — لا تظهر في متصفحك إطلاقًا.</span></li>
                <li className="flex gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>كل مدرس له جلسته الخاصة، ولا يمكن لمدرس آخر الوصول إليها.</span></li>
                <li className="flex gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>حالة الربط محفوظة في حسابك — تبقى بعد تحديث الصفحة أو تسجيل الخروج والدخول.</span></li>
                <li className="flex gap-2"><Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /><span>فصل واتساب لا يحذف حسابك ولا أي بيانات أخرى في Hassty.</span></li>
              </ul>
            </Card>
          </div>
        </>
      )}

      {/* ============ مودال ربط الهاتف + Pairing Code ============ */}
      <Modal
        isOpen={pairingModalOpen}
        onClose={() => { if (!pairingBusy) setPairingModalOpen(false); }}
        title="ربط واتساب برقم الهاتف"
        subtitle="اكتب نفس الرقم الموجود على هاتفك، وسنطلب من WhatsApp إنشاء رمز ربط حقيقي."
        maxWidth="md"
        icon={<Smartphone className="w-6 h-6" />}
      >
        <div className="space-y-4" dir="rtl">
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-900 leading-6">
            <div className="font-black mb-1">كيف يعمل؟</div>
            <div>بعد إنشاء الرمز افتح واتساب ← الأجهزة المرتبطة ← ربط جهاز ← الربط برقم الهاتف، ثم أدخل الرمز الظاهر لك.</div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700">رقم واتساب المرتبط</label>
            <div className="flex gap-2" dir="ltr">
              <div className="relative shrink-0 w-36">
                <select
                  value={pairCountryCode}
                  onChange={(e) => setPairCountryCode(e.target.value)}
                  className="w-full appearance-none h-11 rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-black text-slate-700 outline-none focus:border-[color:var(--role-color)] cursor-pointer"
                  disabled={pairingBusy}
                >
                  {COUNTRY_CODES.map((cc) => <option key={cc.code} value={cc.code}>{cc.label}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <input
                value={pairPhoneInput}
                onChange={(e) => setPairPhoneInput(e.target.value.replace(/[^\d\s]/g, ''))}
                inputMode="tel"
                dir="ltr"
                placeholder="1012345678"
                disabled={pairingBusy}
                className="flex-1 min-w-0 h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold tracking-wide outline-none focus:border-[color:var(--role-color)] placeholder:text-slate-300"
              />
            </div>
            {pairPhoneInput && (
              <div className={`text-[11px] font-bold ${pairingPhoneValid ? 'text-emerald-600' : 'text-red-500'}`} dir="ltr">
                +{pairingFullNumber}
                {!pairingPhoneValid && ' — رقم غير مكتمل'}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Btn
              variant="primary"
              onClick={() => void requestPairingCode()}
              disabled={pairingBusy || !pairingPhoneValid}
            >
              {pairingBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              {pairingBusy ? 'جاري إنشاء الرمز...' : 'إنشاء رمز الربط'}
            </Btn>
            <Btn variant="ghost" onClick={() => { if (!pairingBusy) setPairingModalOpen(false); }} disabled={pairingBusy}>
              <X className="w-4 h-4" />إلغاء
            </Btn>
          </div>
        </div>
      </Modal>

      {/* ============ مودال QR ============ */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="اربط واتسابك"
        maxWidth="lg"
        icon={<QrCode className="w-6 h-6" />}
      >
        <div className="space-y-4">
          <div className="text-xs text-slate-600 text-center leading-6 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
            افتح واتساب من هاتفك ثم:
            <span className="font-black text-slate-800"> الأجهزة المرتبطة ← ربط جهاز ← امسح QR</span>
          </div>

          {/* منطقة QR */}
          <div className="flex flex-col items-center gap-3">
            {qr ? (
              <div className="relative bg-white border-2 border-dashed border-slate-300 rounded-2xl p-3">
                <img src={qr} alt="رمز QR لربط واتساب" className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl" />
                {qrCountdown > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 min-w-7 h-7 px-1.5 rounded-full bg-slate-800 text-white text-[11px] font-black flex items-center justify-center tabular-nums shadow-md" dir="ltr">
                    {qrCountdown}s
                  </span>
                )}
              </div>
            ) : (
              <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold">جاري تجهيز الرمز...</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs font-black text-slate-600">
              <span className="w-2 h-2 rounded-full bg-amber-400 status-pulse" />
              {qrCountdown === 0 && qr ? 'انتهت صلاحية الرمز — جاري تحديثه...' : 'في انتظار المسح...'}
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="grid grid-cols-2 gap-2.5">
            <Btn variant="secondary" onClick={() => void refreshQr(false)} disabled={linking}>
              <RefreshCw className="w-4 h-4" />تحديث الرمز
            </Btn>
            <Btn variant="ghost" onClick={() => setQrModalOpen(false)}><X className="w-4 h-4" />إلغاء</Btn>
          </div>

          {/* رمز الربط — يظهر فقط إن أعاده السيرفر */}
          {pairingCode && (
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center gap-2 justify-center text-xs font-bold text-slate-500">
                <span className="h-px bg-slate-200 flex-1" aria-hidden="true" />
                أو استخدم رمز الربط
                <span className="h-px bg-slate-200 flex-1" aria-hidden="true" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="px-6 py-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 select-all" dir="ltr">
                  <span className="text-2xl sm:text-3xl font-black tracking-[0.2em] text-blue-900 font-mono">{formatPairing(pairingCode)}</span>
                </div>
                <Btn variant="secondary" size="sm" onClick={() => void copyPairing()}>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'تم النسخ' : 'نسخ الرمز'}
                </Btn>
                <p className="text-[11px] text-slate-500 text-center leading-5 max-w-xs">
                  على الهاتف: <strong className="text-slate-700">الأجهزة المرتبطة ← ربط جهاز ← الربط برقم الهاتف</strong> ثم أدخل الرمز.
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ============ مودال الإرسال (تجربة / رسالة) ============ */}
      <Modal
        isOpen={sendModal !== null}
        onClose={() => { if (!sending) { setSendModal(null); setSendResult(null); } }}
        title={sendModal === 'test' ? 'تجربة إرسال رسالة' : 'إرسال رسالة واتساب'}
        subtitle={sendModal === 'test' ? 'تُرسل هذه الرسالة من رقم واتسابك المتصل للتأكد أن كل شيء يعمل.' : 'الرسالة تُرسل من رقم واتسابك أنت مباشرة.'}
        icon={sendModal === 'test' ? <FlaskConical className="w-6 h-6" /> : <Send className="w-6 h-6" />}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* الرقم */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700">رقم الهاتف</label>
            <div className="flex gap-2" dir="ltr">
              <div className="relative shrink-0 w-36">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full appearance-none h-11 rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-black text-slate-700 outline-none focus:border-[color:var(--role-color)] cursor-pointer"
                >
                  {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <input
                value={phoneInput}
                onChange={(e) => { setPhoneInput(e.target.value.replace(/[^\d\s]/g, '')); setSendResult(null); }}
                inputMode="tel"
                dir="ltr"
                placeholder="1012345678"
                className="flex-1 min-w-0 h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold tracking-wide outline-none focus:border-[color:var(--role-color)] placeholder:text-slate-300"
              />
            </div>
            {phoneInput && (
              <div className={`text-[11px] font-bold ${phoneValid ? 'text-emerald-600' : 'text-red-500'}`} dir="ltr">
                +{fullNumber}
                {!phoneValid && ' — رقم غير مكتمل'}
              </div>
            )}
          </div>

          {/* الرسالة */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700">الرسالة</label>
            <textarea
              value={messageInput}
              onChange={(e) => { setMessageInput(e.target.value.slice(0, 1000)); setSendResult(null); }}
              rows={4}
              placeholder="اكتب رسالتك هنا..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm leading-7 outline-none focus:border-[color:var(--role-color)] resize-none"
            />
            <div className="text-[10px] text-slate-400 text-left" dir="ltr">{messageInput.length}/1000</div>
          </div>

          {/* النتيجة */}
          {sendResult && (
            <div className={`rounded-xl border px-3.5 py-3 text-xs font-black flex items-center gap-2 ${sendResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`} dir="rtl">
              {sendResult.ok ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span className="min-w-0 break-words">{sendResult.ok ? '✅ تم إرسال الرسالة بنجاح.' : `❌ ${sendResult.text}`}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Btn
              variant={sendModal === 'test' ? 'primary' : 'success'}
              onClick={() => void doSend()}
              disabled={sending || !phoneValid || !messageInput.trim()}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'جاري الإرسال...' : sendModal === 'test' ? 'إرسال تجربة' : 'إرسال عبر واتساب'}
            </Btn>
            <Btn variant="ghost" onClick={() => { if (!sending) { setSendModal(null); setSendResult(null); } }} disabled={sending}>إغلاق</Btn>
          </div>
        </div>
      </Modal>

      {/* ============ تأكيد الفصل ============ */}
      <ConfirmDialog
        open={disconnectConfirm}
        title="فصل واتساب"
        message="هل أنت متأكد أنك تريد فصل رقم واتساب من Hassty؟"
        confirmLabel={disconnecting ? 'جاري الفصل...' : 'فصل واتساب'}
        tone="danger"
        busy={disconnecting}
        onConfirm={() => void doDisconnect()}
        onCancel={() => { if (!disconnecting) setDisconnectConfirm(false); }}
      />
    </div>
  );
};

export default TeacherWhatsAppPage;
