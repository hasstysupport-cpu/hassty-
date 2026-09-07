import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './lib/AuthContext.tsx';
import { ProfileCompletionGate } from './components/common/ProfileCompletionGate';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { LegalPage, type LegalSection } from './pages/LegalPage';
import './index.css';
import './profile-setup-responsive.css';

/* ===== شبكة الأمان 1: فشل تحميل حزم JS بعد تحديث الموقع =====
   بعد كل deploy جديد تُحذف ملفات الحزم القديمة من الخادم؛ المتصفح الذي
   كان مفتوحًا على نسخة قديمة يطلب حزمة لم تعد موجودة → 404 → شاشة بيضاء.
   الحل: نلتقط الفشل ونعيد تحميل الصفحة مرة واحدة فقط (بدون حلقة لا نهائية). */
const CHUNK_FAIL_FLAG = 'hassty_chunk_reload';
if (typeof window !== 'undefined') {
  const isChunkFailure = (msg: unknown) =>
    /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk \d+ failed|ChunkLoadError/i.test(
      String(msg || ''),
    );
  const handleChunkFailure = (msg: unknown) => {
    if (!isChunkFailure(msg)) return;
    let alreadyReloaded = false;
    try { alreadyReloaded = sessionStorage.getItem(CHUNK_FAIL_FLAG) === '1'; } catch { /* ignore */ }
    if (alreadyReloaded) return; // أعدنا التحميل بالفعل — لا ندخل في حلقة
    try { sessionStorage.setItem(CHUNK_FAIL_FLAG, '1'); } catch { /* ignore */ }
    window.location.reload();
  };
  window.addEventListener('error', (e) => handleChunkFailure((e as any)?.message || (e as any)?.target?.src || ''));
  window.addEventListener('unhandledrejection', (e) => handleChunkFailure((e as any)?.reason?.message || e?.reason || ''));
  // امسح علامة "أعدنا التحميل" بعد فترة سليمة — إشارة أن الصفحة استقرت
  window.setTimeout(() => { try { sessionStorage.removeItem(CHUNK_FAIL_FLAG); } catch { /* ignore */ } }, 15000);
}

const legalPathToSection = (path: string): LegalSection | null => {
  const match = path.match(/^\/legal\/(terms|privacy|teacher|acceptable|refund|cookies|rights)$/);
  return match ? (match[1] as LegalSection) : null;
};

const Root = () => {
  const [path, setPath] = React.useState(() => window.location.pathname || '/');

  React.useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const legalSection = legalPathToSection(path);
  const navigate = (nextPath: string) => {
    window.history.pushState({}, '', nextPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (legalSection) return <LegalPage section={legalSection} onNavigate={navigate} />;
  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <AuthProvider>
        <ProfileCompletionGate />
        <Root />
      </AuthProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
);
