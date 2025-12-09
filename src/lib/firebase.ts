// Firebase configuration and initialization
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug: Log Firebase config (without sensitive data)
console.log('[DEBUG] Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
});

// Initialize Firebase app (singleton pattern to prevent multiple initializations)
function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

// Initialize on first use
let dbInstance: Firestore | null = null;

// Get Firestore instance with long polling for Vercel compatibility
export const db: Firestore = (() => {
  if (!dbInstance) {
    const app = getFirebaseApp();
    // Use initializeFirestore with experimentalForceLongPolling for Vercel
    // This fixes WebSocket connection issues in serverless environments
    dbInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
    console.log('[DEBUG] Firestore initialized with long polling');
  }
  return dbInstance;
})();

export default getFirebaseApp();
