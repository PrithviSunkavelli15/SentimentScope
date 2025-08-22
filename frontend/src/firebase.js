// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmOzFMUFuN9JGdXgHF_onm2ybxsopFNwY",
  authDomain: "sentiment-scope-8c196.firebaseapp.com",
  projectId: "sentiment-scope-8c196",
  storageBucket: "sentiment-scope-8c196.firebasestorage.app",
  messagingSenderId: "720400888097",
  appId: "1:720400888097:web:f234731f32ab0fca000e60",
  measurementId: "G-C4BC40MC53"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (only in production)
let analytics = null;
isSupported().then(yes => yes ? analytics = getAnalytics(app) : null);

// Production configuration
// Uncomment these lines when you want to add production-specific features
// if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
//   // Enable persistence for offline support
//   // enableNetwork(db);
//   
//   // Set cache size for better performance
//   // setCacheSizeBytes(db, 50 * 1024 * 1024); // 50MB cache
// }

// Development configuration
// Uncomment these lines if you want to use Firebase emulators for local development
// connectAuthEmulator(auth, "http://localhost:9099");
// connectFirestoreEmulator(db, "localhost", 8080);

export { analytics };
export default app;