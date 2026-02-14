import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app - making sure we don't initialize multiple instances
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore and Storage (safe for SSR)
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// Initialize Auth and Analytics (client-side only)
let auth: Auth | undefined;
let analytics: Analytics | undefined;
let googleProvider: GoogleAuthProvider | undefined;

// Only initialize client-side services if running in browser
if (typeof window !== 'undefined') {
  try {
    auth = getAuth(app);

    // Only initialize analytics in production environment
    if (process.env.NODE_ENV === 'production') {
      analytics = getAnalytics(app);
    } else {
      // Create a mock analytics object for development
      analytics = {
        logEvent: (eventName: string, eventParams?: object) => {
          console.log('📊 Analytics Event (DEV):', eventName, eventParams);
        }
      } as unknown as Analytics;
    }

    googleProvider = new GoogleAuthProvider();

    // Configure Google provider
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
  } catch (error) {
    console.error('Error initializing Firebase client-side services:', error);
  }
}

export { app, auth, db, storage, analytics, googleProvider };
