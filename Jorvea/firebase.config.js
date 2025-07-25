// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

export const auth = getAuth(app);