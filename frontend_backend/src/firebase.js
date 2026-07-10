// ═══════════════════════════════════════════════════════════════
// Firebase Configuration — Smart Parking System
// ═══════════════════════════════════════════════════════════════
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Note: Replace these with your own credentials if you move to a new Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyBZYaNkeyAmq62HuPIWmFbcwrTiKElD47M",
  authDomain: "smart-parking-59ecb.firebaseapp.com",
  databaseURL: "https://smart-parking-59ecb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-parking-59ecb",
  storageBucket: "smart-parking-59ecb.firebasestorage.app",
  messagingSenderId: "1084291255925",
  appId: "1:1084291255925:web:1f3de6f083bb5d5f95b23c",
  measurementId: "G-QGHB4LH28K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const db = getDatabase(app);

export { app, db, analytics };
export default app;
