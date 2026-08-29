import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './lib/AuthContext.tsx';
import { ProfileCompletionGate } from './components/common/ProfileCompletionGate';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ProfileCompletionGate />
      <App />
    </AuthProvider>
  </StrictMode>,
);
