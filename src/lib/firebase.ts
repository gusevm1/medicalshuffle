'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;

function getApp(): FirebaseApp {
  if (_app) return _app;

  if (getApps().length === 0) {
    _app = initializeApp(firebaseConfig);
  } else {
    _app = getApps()[0];
  }
  return _app;
}

function getDb(): Firestore {
  if (_db) return _db;

  const app = getApp();

  // Check if Firestore has already been initialized
  try {
    // Try to initialize with long polling settings
    _db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch {
    // If already initialized, just get the existing instance
    _db = getFirestore(app);
  }

  return _db;
}

// Export a getter that lazily initializes
export const db = typeof window !== 'undefined' ? getDb() : (null as unknown as Firestore);
export default typeof window !== 'undefined' ? getApp() : (null as unknown as FirebaseApp);
