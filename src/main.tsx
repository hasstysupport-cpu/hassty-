import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './lib/AuthContext.tsx';
import { ProfileCompletionGate } from './components/common/ProfileCompletionGate';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { LegalPage, type LegalSection } from './pages/LegalPage';
import { isImportFailure, smartChunkReload } from './lib/chunkRecovery';
import './index.css';
import './profile-setup-responsive.css';

/* ===== شبكة الأمان 1: فشل تحميل حزم JS (الاسترداد الذكي) =====
   بعد كل deploy جديد تُحذف ملفات الحزم القديمة، وقد يفشل تحميل حزمة أيضًا
   بسبب ضعف الاتصال. المعالجة الكاملة في src/lib/chunkRecovery.ts —
   وهي تُستدعى من هنا (أخطاء مستوى window) ومن GlobalErrorBoundary
   (أخطاء React.lazy التي لا تصل إلى window أبدًا — وهي المسار الأشيع). */
if (typeof window !== 'undefined') {
  const handlePossibleImportFailure = (msg: unknown) => {
    if (isImportFailure(msg)) void smartChunkReload();
  };
  window.addEventListener('error', (e) =>
    handlePossibleImportFailure((e as { message?: unknown })?.message ?? (e as { target?: { src?: string } })?.target?.src ?? ''),
  );
  window.addEventListener('unhandledrejection', (e) =>
    handlePossibleImportFailure((e as { reason?: { message?: string } })?.reason?.message ?? (e as { reason?: unknown })?.reason ?? ''),
  );
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
