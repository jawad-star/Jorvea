import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase';

export async function loginWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  // Firebase handles auth persistence automatically
  return userCredential;
}

export async function signUpWithEmail(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // Firebase handles auth persistence automatically
  return userCredential;
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export function sendVerificationEmail(user: User) {
  return sendEmailVerification(user);
}

export function reloadUser(user: User) {
  return user.reload();
}

export async function logoutUser() {
  await signOut(auth);
  // Firebase handles clearing auth state automatically
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function checkStoredAuth(): Promise<boolean> {
  // Firebase handles auth persistence automatically
  // Just return whether current user exists
  return !!auth.currentUser;
}

export async function getStoredUserData() {
  // Firebase handles user data automatically
  // Just return current user data
  const user = auth.currentUser;
  if (!user) return null;
  
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
  };
}
