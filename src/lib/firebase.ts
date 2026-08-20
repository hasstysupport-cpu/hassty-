import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, memoryLocalCache } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

// Use experimentalAutoDetectLongPolling and memoryLocalCache to prevent transport dropouts in sandboxed iframes
function createFirestoreInstance() {
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
        localCache: memoryLocalCache(),
      },
      dbId
    );
  } catch {
    try {
      return initializeFirestore(
        app,
        {
          experimentalForceLongPolling: true,
        },
        dbId
      );
    } catch {
      return dbId ? getFirestore(app, dbId) : getFirestore(app);
    }
  }
}

export const db = createFirestoreInstance();
export const auth = getAuth(app);
export default app;
