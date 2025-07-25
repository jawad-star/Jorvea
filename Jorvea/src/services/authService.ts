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
import { authStorage } from '../utils/authStorage';

export async function loginWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Store auth data in AsyncStorage
  await authStorage.setAuthToken(userCredential.user.uid);
  await authStorage.setUserData({
    uid: userCredential.user.uid,
    email: userCredential.user.email,
    emailVerified: userCredential.user.emailVerified,
  });
  
  return userCredential;
}

export async function signUpWithEmail(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Store auth data in AsyncStorage
  await authStorage.setAuthToken(userCredential.user.uid);
  await authStorage.setUserData({
    uid: userCredential.user.uid,
    email: userCredential.user.email,
    emailVerified: userCredential.user.emailVerified,
  });
  
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
  await authStorage.clearAuthData();
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function checkStoredAuth(): Promise<boolean> {
  return await authStorage.isLoggedIn();
}

export async function getStoredUserData() {
  return await authStorage.getUserData();
}
