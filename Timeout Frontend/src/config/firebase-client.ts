// Firebase configuration for frontend - CLIENT-SIDE VERSION (No Functions Needed)
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase config - using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators in development only
if (import.meta.env.DEV && typeof window !== 'undefined') {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8090);
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    console.log('🔧 Connected to Firestore and Auth emulators');
  } catch (error) {
    console.warn('⚠️ Could not connect to emulators (this is normal in production):', error);
  }
}

// Export Firebase services
export { auth, db, app };

// Export firestore methods for easy use
export {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';