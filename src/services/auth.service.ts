import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  sendEmailVerification as fbSendEmailVerification,
  reload as fbReload,
  updateProfile as fbUpdateProfile,
  onAuthStateChanged as fbOnAuthStateChanged,
  type Unsubscribe,
  type User,
} from 'firebase/auth';

import { getFirebaseAuth } from './firebase';
import { logger } from '@/utils/logger';

export interface AuthCredentials {
  email: string;
  password: string;
}

/**
 * Firebase auth'un kullanıcıya gösterilecek mesaja çevrilmesi.
 * i18n key'leri döner; UI tarafı t() ile çevirir.
 */
export function mapAuthErrorToKey(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'errors.invalidEmail';
    case 'auth/email-already-in-use':
      return 'errors.emailAlreadyInUse';
    case 'auth/weak-password':
      return 'errors.passwordTooShort';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'errors.invalidCredentials';
    case 'auth/user-not-found':
      return 'errors.userNotFound';
    case 'auth/network-request-failed':
      return 'errors.network';
    default:
      return 'errors.generic';
  }
}

export async function signUpWithEmail({
  email,
  password,
  displayName,
}: AuthCredentials & { displayName?: string }): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName && cred.user) {
    await fbUpdateProfile(cred.user, { displayName });
  }
  // Kayıt anında doğrulama maili gönder. Hata olursa kullanıcıyı engelleme.
  if (cred.user) {
    try {
      await fbSendEmailVerification(cred.user);
    } catch (err) {
      logger.warn('[auth] sendEmailVerification on signup failed', err);
    }
  }
  return cred.user;
}

/**
 * Mevcut kullanıcıya yeni doğrulama maili gönderir.
 * Throttling: Firebase tarafında zaten ~60sn cooldown var.
 */
export async function resendEmailVerification(): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('no-current-user');
  await fbSendEmailVerification(user);
}

/**
 * Firebase auth state'ini server'dan tazeler. Email doğrulandı mı kontrolü için.
 */
export async function refreshCurrentUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return null;
  await fbReload(user);
  return auth.currentUser;
}

export async function signInWithEmail({ email, password }: AuthCredentials): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await fbSignOut(auth);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): Unsubscribe {
  const auth = getFirebaseAuth();
  return fbOnAuthStateChanged(auth, callback);
}
