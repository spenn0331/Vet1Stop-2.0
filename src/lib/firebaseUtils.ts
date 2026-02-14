import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent as firebaseLogEvent } from 'firebase/analytics';

// Firebase configuration using environment variables for security
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '<API_KEY>',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '<AUTH_DOMAIN>',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '<PROJECT_ID>',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '<STORAGE_BUCKET>',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '<MESSAGING_SENDER_ID>',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '<APP_ID>',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '<MEASUREMENT_ID>'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { analytics, firebaseLogEvent };
