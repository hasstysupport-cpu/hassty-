import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './lib/AuthContext.tsx';
import { ProfileCompletionGate } from './components/common/ProfileCompletionGate';
import { LegalConsentGuard } from './components/common/LegalConsentGuard';
import { LegalPage, type LegalSection } from './pages/LegalPage';
import './index.css';

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
    <AuthProvider>
      <ProfileCompletionGate />
      <LegalConsentGuard />
      <Root />
    </AuthProvider>
  </StrictMode>,
);
