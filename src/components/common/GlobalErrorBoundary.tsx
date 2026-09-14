import React from 'react';
import { isImportFailure, smartChunkReload, type RecoveryOutcome } from '../../lib/chunkRecovery';

/**
 * GlobalErrorBoundary — شبكة الأمان الأخيرة ضد «الشاشة البيضاء».
 * أي استثناء غير معالَج أثناء الرندر يُلتقط هنا ويُعرض رسالة عربية ودّية
 * مع تفاصيل الخطأ (لنسخ لقطة شاشة للدعم) وأزرار استرداد — بدل صفحة بيضاء فارغة.
 *
 * فشل تحميل الحزم (dynamic import / React.lazy) له مسار خاص:
 * React يبتلع رفض الوعد ويسلّمه هنا — ولا يصل أبدًا إلى window.onerror —
 * لذلك الاسترداد الذكي (smartChunkReload) يُطلَق من هذه النقطة:
 * يفحص الاتصال وبصمة الإصدار ثم يحدّث الصفحة تلقائيًا مرة واحدة،
 * ولو الإنترنت مقطوع ينتظر عودته ويحدّث تلقائيًا حينها.
 */
interface State {
  error: Error | null;
  info: string;
  errorId: number; // يزيد مع كل خطأ — يُستخدم لإعادة محاولة الرندر
  /** حالة الاسترداد الخاص بفشل تحميل الحزم: null = ليس خطأ حزم */
  importRecovery: null | 'checking' | 'offline' | 'cooldown';
}

export class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null, info: '', errorId: 0, importRecovery: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, importRecovery: isImportFailure(error) ? 'checking' : null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // للتوثيق: آخر خطأ قابل للفحص من الدعم (window.__HASSTY_LAST_ERROR__)
    try {
      (window as any).__HASSTY_LAST_ERROR__ = {
        message: String(error?.message || error),
        stack: String(error?.stack || '').slice(0, 2000),
        componentStack: String(info?.componentStack || '').slice(0, 2000),
        at: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
      };
    } catch { /* ignore */ }
    console.error('[Hassty] خطأ غير معالَج:', error, info?.componentStack);

    // ⚡ المسار الحقيقي لفشل تحميل الحزم: React.lazy رفض الوعد وسلّمه لنا هنا.
    // ننتظر 600ms حتى تُرسم بطاقة الخطأ أولًا (المستخدم يرى شيئًا بدل وميض أبيض)
    // ثم نطلق الاسترداد الذكي: فحص الاتصال/الإصدار ← تحديث تلقائي واحد محروس.
    if (isImportFailure(error)) {
      window.setTimeout(() => { void this.runImportRecovery(); }, 600);
    }
  }

  private runImportRecovery = async () => {
    try {
      const outcome: RecoveryOutcome = await smartChunkReload();
      if (outcome === 'offline') this.setState({ importRecovery: 'offline' });
      else if (outcome === 'cooldown') this.setState({ importRecovery: 'cooldown' });
      // outcome === 'reload' → الصفحة ستُعاد تحميلها بالفعل من داخل smartChunkReload
    } catch { /* ignore */ }
  };

  private retry = () => {
    // React.lazy يخزّن الوعد المرفوض نهائيًا — إعادة الرندر وحدها لن تعيد تحميل الحزمة.
    // لفشل الحزم: «إعادة المحاولة» = استرداد ذكي (يتخطى فترة التهدئة لأن المستخدم هو من طلب).
    if (this.state.error && isImportFailure(this.state.error)) {
      void smartChunkReload({ force: true });
      return;
    }
    this.setState((s) => ({ error: null, errorId: s.errorId + 1, importRecovery: null }));
  };

  private goHome = () => {
    try { sessionStorage.removeItem('hassty_loop_detected'); } catch { /* ignore */ }
    window.location.assign('/');
  };

  private hardReload = () => {
    try { sessionStorage.removeItem('hassty_loop_detected'); } catch { /* ignore */ }
    window.location.reload();
  };

  private copyError = async () => {
    const txt = `[حصتي] تقرير خطأ\n${(window as any).__HASSTY_LAST_ERROR__?.url || window.location.href}\n${this.state.error?.message || ''}\n${(window as any).__HASSTY_LAST_ERROR__?.stack || ''}`;
    try { await navigator.clipboard.writeText(txt); } catch { /* ignore */ }
  };

  render() {
    const { error, importRecovery } = this.state;
    if (!error) return this.props.children;

    const isLoop = /Maximum update depth|update depth exceeded/i.test(String(error.message || ''));
    const isImport = isImportFailure(error);
    return (
      <div dir="rtl" className="min-h-screen bg-[#F6F9FF] flex items-center justify-center px-4 py-10 font-sans">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-[0_24px_70px_-30px_rgba(30,58,138,0.35)] overflow-hidden">
          <div className="px-6 pt-6 pb-5 bg-gradient-to-l from-[#EFF6FF] via-white to-[#F5F3FF] border-b border-slate-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-black text-[#1E3A8A]">حدث خطأ غير متوقع</h1>
              <p className="text-xs text-[#6B7280] mt-0.5">الصفحة واجهت مشكلة مؤقتة — بياناتك في أمان.</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {isImport ? (
              <p className="text-sm text-[#374151] leading-relaxed">
                فشل تحميل أحد ملفات الموقع من الإنترنت — أشيع سبب هو ضعف الاتصال لحظة فتح الصفحة.
                جرّب <span className="font-bold">«إعادة المحاولة»</span>، ولو استمرت المشكلة اتأكد إن الشبكة شغالة واضغط
                <span className="font-bold"> «تحديث الصفحة»</span>.
              </p>
            ) : (
              <p className="text-sm text-[#374151] leading-relaxed">
                جرّب زر <span className="font-bold">«إعادة المحاولة»</span> — لو استمرت المشكلة اضغط
                <span className="font-bold"> «تحديث الصفحة»</span>. لو تكررت كثيرًا انسخ تفاصيل الخطأ وابعتهالا لدعم واتساب.
              </p>
            )}

            {isImport && importRecovery === 'checking' && (
              <p className="text-xs bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-3 py-2.5 leading-relaxed">
                بنحاول نصلّح المشكلة تلقائيًا... الصفحة هتتحدّث لحظة لو لزم الأمر.
              </p>
            )}
            {isImport && importRecovery === 'offline' && (
              <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2.5 leading-relaxed">
                مفيش اتصال بالإنترنت حاليًا. أول ما الاتصال يرجع، الصفحة هتتحدّث تلقائيًا من غير ما تعمل حاجة.
              </p>
            )}
            {isImport && importRecovery === 'cooldown' && (
              <p className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 leading-relaxed">
                حاولنا الإصلاح التلقائي قبل قليل. اضغط «تحديث الصفحة»، ولو المشكلة استمرت جرّب إغلاق التبويب وفتحه من جديد.
              </p>
            )}

            {isLoop && (
              <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 leading-relaxed">
                سبب الخطأ: تكرار تحويلات داخلي سريع (غالبًا بسبب حالة جلسة قديمة في المتصفح). زر «تحديث الصفحة» يعالجها فورًا.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <button onClick={this.retry} className="px-4 py-2.5 text-sm font-black text-white rounded-xl bg-gradient-to-l from-[#2563EB] to-[#7C3AED] active:scale-[0.97] transition-transform cursor-pointer">
                إعادة المحاولة
              </button>
              <button onClick={this.hardReload} className="px-4 py-2.5 text-sm font-bold text-[#1E3A8A] border border-slate-300 rounded-xl hover:bg-slate-50 active:scale-[0.97] transition cursor-pointer">
                تحديث الصفحة
              </button>
              <button onClick={this.goHome} className="px-4 py-2.5 text-sm font-bold text-[#1E3A8A] border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer">
                الرئيسية
              </button>
              <button onClick={this.copyError} className="px-4 py-2.5 text-sm font-bold text-[#2563EB] bg-[#EFF6FF] border border-blue-200 rounded-xl hover:bg-blue-100 cursor-pointer">
                نسخ تفاصيل الخطأ
              </button>
            </div>
            <details className="text-[11px] text-slate-500">
              <summary className="cursor-pointer select-none font-bold">تفاصيل تقنية (للدعم)</summary>
              <pre dir="ltr" className="mt-2 max-h-40 overflow-auto bg-slate-50 border border-slate-200 rounded-lg p-2.5 whitespace-pre-wrap">{String(error.message || '')}
{(window as any).__HASSTY_LAST_ERROR__?.stack?.slice(0, 600) || ''}</pre>
            </details>
          </div>
        </div>
      </div>
    );
  }
}
