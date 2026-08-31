import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Inbox, Info, Loader2, Search, TriangleAlert, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/* ============================================================
   HASSTY DESIGN SYSTEM — Unified UI primitives
   Arabic RTL first · Mobile first · SaaS/LMS style
   ============================================================ */

const AR = 'font-[\'IBM_Plex_Sans_Arabic\',sans-serif]';

/* ---------- Count-up: numbers that glide into place (luxury detail) ---------- */
function useCountUp(value: string | number, duration = 850): string | number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : null;
  const match = typeof value === 'string' ? value.trim().match(/^(\d+)(\D*)$/) : null;
  const target = numeric ?? (match ? Number(match[1]) : null);
  const suffix = match ? match[2] : '';
  const [display, setDisplay] = useState(0);
  const current = useRef(0);
  useEffect(() => {
    if (target === null) return;
    let raf = 0;
    const from = current.current;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (target - from) * eased);
      current.current = v;
      setDisplay(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  if (target === null) return value;
  return `${display}${suffix}`;
}

/* ---------- PageHeader ---------- */
export const PageHeader: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: string;
}> = ({ title, description, actions, badge }) => (
  <div className={`anim-up flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${AR}`}>
    <div className="min-w-0 flex items-stretch gap-2.5">
      <span className="chip-grad w-1.5 rounded-full shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg sm:text-xl font-black text-grad">{title}</h1>
          {badge && <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-[color:var(--role-soft)] text-[color:var(--role-color)] border border-[color:var(--role-soft-border)]">{badge}</span>}
        </div>
        {description && <p className="text-xs text-slate-500 mt-1 leading-6 max-w-3xl">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
  </div>
);

/* ---------- StatCard ---------- */
export const StatCard: React.FC<{
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'blue' | 'emerald' | 'amber' | 'red' | 'violet' | 'slate';
  icon?: React.ReactNode;
  loading?: boolean;
  delay?: number;
}> = ({ label, value, hint, tone = 'blue', icon, loading, delay = 0 }) => {
  const gradTones: Record<string, string> = {
    blue: 'from-blue-500 to-indigo-500', emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500', red: 'from-red-500 to-rose-500',
    violet: 'from-violet-500 to-purple-500', slate: 'from-slate-500 to-slate-600',
  };
  const shown = useCountUp(value);
  return (
    <div className={`card-lux anim-up bg-white border border-slate-200 rounded-2xl p-3.5 ${AR} min-w-0`} style={delay ? { animationDelay: `${delay}ms` } : undefined}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-500 truncate">{label}</span>
        {icon && <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradTones[tone]} text-white flex items-center justify-center shrink-0 shadow-md`}>{icon}</span>}
      </div>
      <div className="mt-1.5 text-xl font-black bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent tabular-nums">
        {loading ? <span className="skeleton-lux inline-block w-16 h-6 rounded-lg" /> : shown}
      </div>
      {hint && !loading && <div className="mt-1 text-[10px] text-slate-400 truncate">{hint}</div>}
    </div>
  );
};

/* ---------- StatusBadge ---------- */
export const STATUS_TONES: Record<string, { label: string; cls: string }> = {
  // generic
  active: { label: 'نشط', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive: { label: 'متوقف', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  pending: { label: 'قيد الانتظار', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'معتمد', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'مرفوض', cls: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { label: 'ملغي', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  completed: { label: 'مكتمل', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  // attendance
  present: { label: 'حاضر', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  late: { label: 'متأخر', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  absent: { label: 'غائب', cls: 'bg-red-50 text-red-700 border-red-200' },
  excused: { label: 'بعذر', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  // payments
  paid: { label: 'مدفوع', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  overdue: { label: 'متأخر', cls: 'bg-red-50 text-red-700 border-red-200' },
  refunded: { label: 'مسترد', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  // sessions / exams
  scheduled: { label: 'مجدول', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'جارٍ الآن', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  draft: { label: 'مسودة', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  grading: { label: 'تحت التصحيح', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  published: { label: 'منشور', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  distributed: { label: 'تم التوزيع', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  // verification / docs
  under_review: { label: 'تحت المراجعة', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  not_submitted: { label: 'غير مرفوع', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  id_reupload: { label: 'أعد رفع الهوية', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  qualification_reupload: { label: 'أعد رفع المؤهل', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  // requests
  accepted: { label: 'مقبول', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  revoked: { label: 'مسحوبة', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  transferred: { label: 'محول', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  paused: { label: 'موقوف مؤقتًا', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  left: { label: 'منسحب', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  submitted: { label: 'مسلّم', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  graded: { label: 'مصحح', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  returned: { label: 'معاد', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  final: { label: 'نهائي', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  review: { label: 'مراجعة', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  confirmed: { label: 'مؤكد', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  assigned: { label: 'معيّن', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  unresolved: { label: 'غير محلول', cls: 'bg-red-50 text-red-700 border-red-200' },
  moved: { label: 'منقول', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  open: { label: 'مفتوحة', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  resolved: { label: 'محلولة', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'مغلقة', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const StatusBadge: React.FC<{ status: string; label?: string; size?: 'sm' | 'md' }> = ({ status, label, size = 'sm' }) => {
  const meta = STATUS_TONES[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border font-black shadow-xs ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} ${meta.cls}`}><span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 shrink-0" aria-hidden="true" />{label || meta.label}</span>;
};

/* ---------- State components: Loading / Empty / Error ---------- */
export const LoadingBlock: React.FC<{ label?: string; rows?: number }> = ({ label = 'جاري التحميل...', rows = 3 }) => (
  <div className={`p-5 ${AR}`} dir="rtl">
    <div className="flex items-center gap-3 text-sm text-slate-500 mb-4"><Loader2 className="w-4 h-4 animate-spin text-[color:var(--role-color)]" />{label}</div>
    <div className="space-y-3">{Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton-lux h-14 rounded-2xl" style={{ animationDelay: `${i * 120}ms` }} />)}</div>
  </div>
);

export const EmptyState: React.FC<{ title?: string; description?: string; action?: React.ReactNode; icon?: React.ReactNode }> = ({ title = 'لا توجد بيانات حتى الآن', description, action, icon }) => (
  <div className={`anim-up py-10 px-6 text-center ${AR}`} dir="rtl">
    <div className="chip-grad w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-float-slow">{icon || <Inbox className="w-6 h-6" />}</div>
    <h3 className="text-sm font-black text-slate-700">{title}</h3>
    {description && <p className="mt-1.5 text-xs text-slate-500 leading-6 max-w-md mx-auto">{description}</p>}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);

export const ErrorBlock: React.FC<{ message?: string; onRetry?: () => void }> = ({ message = 'حدث خطأ أثناء تحميل البيانات', onRetry }) => (
  <div className={`p-5 ${AR}`} dir="rtl">
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
      <TriangleAlert className="w-5 h-5 text-red-600 shrink-0" />
      <span className="text-xs font-bold text-red-800 flex-1">{message}</span>
      {onRetry && <button onClick={onRetry} className="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-700 text-[11px] font-black hover:bg-red-100 cursor-pointer">إعادة المحاولة</button>}
    </div>
  </div>
);

/* ---------- DataTable: search + sort + responsive ---------- */
export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  hideOnMobile?: boolean;
}

export function DataTable<T = any>({
  rows, columns, searchKeys, searchPlaceholder, emptyText, loading, error, onRetry, toolbar, mobileCard, pageSize = 12, onRowClick,
}: {
  rows: T[]; columns: Column<T>[]; searchKeys?: (row: T) => string; searchPlaceholder?: string;
  emptyText?: string; loading?: boolean; error?: string; onRetry?: () => void; toolbar?: React.ReactNode;
  mobileCard?: (row: T) => React.ReactNode; pageSize?: number; onRowClick?: (row: T) => void;
}) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [q, sort]);
  const filtered = useMemo(() => {
    let out = rows;
    if (q.trim() && searchKeys) { const needle = q.trim().toLowerCase(); out = out.filter((r) => searchKeys(r).toLowerCase().includes(needle)); }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) out = [...out].sort((a, b) => { const av = col.sortValue!(a), bv = col.sortValue!(b); return (av > bv ? 1 : av < bv ? -1 : 0) * sort.dir; });
    }
    return out;
  }, [rows, q, sort, columns, searchKeys]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice(page * pageSize, page * pageSize + pageSize);
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden ${AR}`} dir="rtl">
      <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
        {searchKeys && (
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder || 'ابحث...'} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300" />
          </div>
        )}
        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{filtered.length} سجل</span>
        {toolbar}
      </div>
      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={onRetry} /> : filtered.length === 0 ? (
        <EmptyState title={emptyText || 'لا توجد بيانات حتى الآن'} description="ستظهر البيانات هنا تلقائيًا بعد توفرها في قاعدة البيانات." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gradient-to-b from-slate-50 to-slate-50/40 border-b border-slate-100">
                <tr>{columns.map((c) => (
                  <th key={c.key} onClick={() => { if (c.sortValue) setSort((p) => p?.key === c.key ? { key: c.key, dir: p.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 }); }}
                    className={`p-3.5 text-[11px] font-black text-slate-500 whitespace-nowrap ${c.sortValue ? 'cursor-pointer select-none hover:text-[color:var(--role-color)]' : ''} ${c.className || ''}`}>
                    <span className="inline-flex items-center gap-1">{c.header}{sort?.key === c.key && <span className="text-[color:var(--role-color)]">{sort.dir === 1 ? '▲' : '▼'}</span>}</span>
                  </th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visible.map((row, i) => (
                  <tr key={(row as any)?.id || i} onClick={() => onRowClick?.(row)} className={`row-in text-xs hover:bg-[color:var(--role-soft)]/60 ${onRowClick ? 'cursor-pointer' : ''}`} style={{ animationDelay: `${Math.min(i * 28, 260)}ms` }}>
                    {columns.map((c) => <td key={c.key} className={`p-3.5 align-middle ${c.className || ''}`}>{c.render ? c.render(row) : (row as any)[c.key]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-50">
            {visible.map((row, i) => <div key={(row as any)?.id || i} onClick={() => onRowClick?.(row)} className={`row-in p-4 ${onRowClick ? 'cursor-pointer active:bg-slate-50' : ''}`} style={{ animationDelay: `${Math.min(i * 28, 260)}ms` }}>{mobileCard ? mobileCard(row) : columns.filter((c) => !c.hideOnMobile).slice(0, 3).map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-3 py-1">
                <span className="text-[10px] font-bold text-slate-400">{c.header}</span>
                <span className="text-xs font-bold text-slate-800 text-left min-w-0 truncate">{c.render ? c.render(row) : (row as any)[c.key]}</span>
              </div>
            ))}</div>)}
          </div>
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="p-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
              <span className="text-[11px] font-bold text-slate-500 tabular-nums">صفحة {page + 1} من {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Tabs ---------- */
export const Tabs: React.FC<{ tabs: { key: string; label: string; count?: number }[]; active: string; onChange: (key: string) => void }> = ({ tabs, active, onChange }) => (
  <div className={`anim-up flex gap-1.5 overflow-x-auto pb-1 ${AR}`} dir="rtl">
    {tabs.map((t) => (
      <button key={t.key} onClick={() => onChange(t.key)} className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap border cursor-pointer ${active === t.key ? 'bg-grad text-white border-transparent shadow-[0_10px_22px_-10px_var(--role-shadow)]' : 'bg-white text-slate-600 border-slate-200 hover:border-[color:var(--role-soft-border)] hover:text-[color:var(--role-color)] hover:-translate-y-0.5'}`}>
        {t.label}{t.count !== undefined && <span className={`ms-1.5 text-[10px] ${active === t.key ? 'text-white/80' : 'text-slate-400'}`}>({t.count})</span>}
      </button>
    ))}
  </div>
);

/* ---------- ConfirmDialog ---------- */
export const ConfirmDialog: React.FC<{
  open: boolean; title: string; message: string; confirmLabel?: string; tone?: 'danger' | 'primary';
  onConfirm: () => void; onCancel: () => void; busy?: boolean;
}> = ({ open, title, message, confirmLabel = 'تأكيد', tone = 'primary', onConfirm, onCancel, busy }) => {
  if (!open) return null;
  return (
    <div className="anim-fade fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
      <div className="dialog-lux bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-[#EFF6FF] text-[#2563EB]'}`}>
            {tone === 'danger' ? <TriangleAlert className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h3 className={`text-sm font-black ${AR}`}>{title}</h3>
            <p className={`mt-1.5 text-xs text-slate-600 leading-6 ${AR}`}>{message}</p>
          </div>
        </div>
        <div className={`mt-6 flex gap-2 justify-end ${AR}`}>
          <button onClick={onCancel} disabled={busy} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50">إلغاء</button>
          <button onClick={onConfirm} disabled={busy} className={`px-4 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-2 cursor-pointer disabled:opacity-50 ${tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#2563EB] hover:bg-blue-700'}`}>{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

/* ---------- Toast system ---------- */
type Toast = { id: number; kind: 'success' | 'error' | 'info'; text: string };
const ToastCtx = createContext<{ push: (kind: Toast['kind'], text: string) => void }>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setItems((p) => [...p, { id, kind, text }]);
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-20 lg:bottom-6 left-4 z-[70] space-y-2 max-w-[calc(100vw-2rem)]" dir="rtl">
        {items.map((t) => (
          <div key={t.id} className={`toast-lux relative overflow-hidden bg-white border rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2.5 text-xs font-black ${AR} ${t.kind === 'success' ? 'border-emerald-200 text-emerald-800' : t.kind === 'error' ? 'border-red-200 text-red-800' : 'border-blue-200 text-blue-800'}`}>
            {t.kind === 'success' ? <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm"><CheckCircle2 className="w-4 h-4" /></span> : t.kind === 'error' ? <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-400 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm"><AlertCircle className="w-4 h-4" /></span> : <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm"><Info className="w-4 h-4" /></span>}
            <span className="leading-5">{t.text}</span>
            <button onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"><X className="w-3.5 h-3.5 text-slate-400" /></button>
            <span className={`toast-progress absolute bottom-0 inset-x-0 h-[2.5px] ${t.kind === 'success' ? 'bg-gradient-to-l from-emerald-400 to-teal-400' : t.kind === 'error' ? 'bg-gradient-to-l from-red-400 to-rose-400' : 'bg-gradient-to-l from-blue-400 to-indigo-400'}`} aria-hidden="true" />
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

/* ---------- Buttons ---------- */
export const Btn: React.FC<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md'; children: React.ReactNode; onClick?: () => void;
  disabled?: boolean; type?: 'button' | 'submit'; className?: string; title?: string;
}> = ({ variant = 'primary', size = 'md', children, onClick, disabled, type = 'button', className = '', title }) => {
  const variants: Record<string, string> = {
    primary: 'bg-grad btn-primary-shine text-white border-transparent shadow-[0_10px_22px_-10px_var(--role-shadow)] hover:shadow-[0_14px_28px_-10px_var(--role-shadow)] hover:-translate-y-[1px]',
    secondary: 'bg-white text-slate-700 border-slate-200 hover:border-[color:var(--role-soft-border)] hover:text-[color:var(--role-color)] hover:-translate-y-[1px]',
    ghost: 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100',
    danger: 'bg-gradient-to-br from-red-500 to-rose-600 text-white border-transparent shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 hover:-translate-y-[1px]',
    success: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-[1px]',
  };
  return (
    <button type={type} title={title} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${size === 'sm' ? 'px-3 py-2 text-[11px]' : 'px-4 py-2.5 text-xs'} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

/* ---------- Section card wrapper ---------- */
export const Card: React.FC<{ title?: string; children: React.ReactNode; actions?: React.ReactNode; className?: string; padded?: boolean; delay?: number }> = ({ title, children, actions, className = '', padded = true, delay }) => (
  <section className={`card-lux anim-up bg-white border border-slate-200 rounded-2xl ${padded ? 'p-4' : ''} ${className} ${AR}`} dir="rtl" style={delay ? { animationDelay: `${delay}ms` } : undefined}>
    {(title || actions) && <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-100"><h2 className="text-sm font-black text-slate-800 flex items-center gap-2"><span className="bg-grad w-2 h-2 rounded-full shrink-0" aria-hidden="true" />{title}</h2>{actions}</div>}
    {children}
  </section>
);

/* ---------- Realtime data hook (scoped, auto-cleanup) ---------- */
export function useRealtimeTable<T = any>(table: string, query: { column: string; value: string } | null, fetcher: () => Promise<T[]>, deps: any[] = []) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setError(''); setRows(await fetcher()); } catch (e: any) { setError(e?.message || 'تعذر تحميل البيانات'); } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!supabase || !query || query.value === '') return;
    const channel = supabase.channel(`${table}-rt-${query.column}-${query.value}`).on('postgres_changes', { event: '*', schema: 'public', table, filter: `${query.column}=eq.${query.value}` }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [table, query?.column, query?.value, load]);
  return { rows, loading, error, reload: load, setRows };
}

/* ---------- Small helpers ---------- */
export const fmtMoney = (v: any) => `${Number(v || 0).toLocaleString('ar-EG')} ج.م`;
export const fmtDate = (v: any) => { try { return v ? new Date(v).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'; } catch { return '—'; } };
export const fmtDateTime = (v: any) => { try { return v ? new Date(v).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'; } catch { return '—'; } };
export const fmtTime = (v: any) => { try { return v ? new Date(v).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'; } catch { return '—'; } };
