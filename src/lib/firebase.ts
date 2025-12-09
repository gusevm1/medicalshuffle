// Firebase configuration and initialization
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app (singleton pattern to prevent multiple initializations)
function initializeFirebase(): FirebaseApp {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

// Get Firestore instance
function getFirestoreDb(): Firestore {
  const app = initializeFirebase();
  return getFirestore(app);
}

// Initialize on first use - works in both browser and server
let dbInstance: Firestore | null = null;

// Firestore works in both browser and Node.js
export const db: Firestore = (() => {
  if (!dbInstance) {
    dbInstance = getFirestoreDb();
  }
  return dbInstance;
})();

export default initializeFirebase();
