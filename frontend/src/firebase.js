// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate that all required environment variables are set
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

requiredEnvVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    console.error('Please create a .env file with your Firebase configuration.');
    console.error('See SETUP.md for detailed instructions.');
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

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