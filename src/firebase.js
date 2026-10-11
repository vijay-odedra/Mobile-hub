// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCejmLcb-w8P15Y4Lgmf0UlcLQeoNjvJjE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "stockly-dcbdb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "stockly-dcbdb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "stockly-dcbdb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "578004292486",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:578004292486:web:adb3ef4c4264c6b3865207",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DDF3QW0FH9"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initialize Analytics conditionally (only in supported browser environments)
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export default app;
