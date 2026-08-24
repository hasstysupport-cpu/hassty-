import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, memoryLocalCache } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

// Initialize Firestore using the standard and robust configurations for AI Studio / Web iframe environment
function createFirestoreInstance() {
  const customDbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

  try {
    if (customDbId) {
      return initializeFirestore(
        app,
        {
          experimentalAutoDetectLongPolling: true,
          localCache: memoryLocalCache(),
        },
        customDbId
      );
    } else {
      return initializeFirestore(
        app,
        {
          experimentalAutoDetectLongPolling: true,
          localCache: memoryLocalCache(),
        }
      );
    }
  } catch {
    try {
      return customDbId ? getFirestore(app, customDbId) : getFirestore(app);
    } catch (e) {
      console.warn('Fallback getFirestore initialization:', e);
      return getFirestore(app);
    }
  }
}

export const db = createFirestoreInstance();
export const auth = getAuth(app);
export default app;
