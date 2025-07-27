// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Firebase Storage removed - using Firestore only

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIDKI-oDIoudpfUFCnuy-dke7_FeZu1Cw",
  authDomain: "jorvea-9f876.firebaseapp.com",
  projectId: "jorvea-9f876",
  storageBucket: "jorvea-9f876.firebasestorage.app",
  messagingSenderId: "236350952922",
  appId: "1:236350952922:web:489dd879d9274195149ce3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services - AsyncStorage persistence is automatic in React Native
export const auth = getAuth(app);
export const db = getFirestore(app);
export const firestore = getFirestore(app); // Alias for consistency

// Firebase Storage removed - using only Firestore for metadata
// Videos → MUX streaming service
// Images → Base64 in Firestore documents

// Improve connection reliability
if (__DEV__) {
  console.log("🔥 Firebase initialized for development (Firestore only, no Storage)");
}

export default app;
