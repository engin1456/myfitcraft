/**
 * Tek seferlik script: Google Play reviewer için test hesabı oluşturur.
 * Auth user + Firestore profile.
 *
 * Kullanım:
 *   node scripts/create-test-user.js
 *
 * Çıktı: hesap bilgileri (Play Console'a yapıştır)
 */
require('dotenv').config();
const { initializeApp } = require('firebase/app');
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const EMAIL = 'myfitcraft.app+playreview@gmail.com';
const PASSWORD = 'PlayReview2026!';
const DISPLAY_NAME = 'Play Reviewer';

(async () => {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD);
    console.log('[1/3] Auth user created:', cred.user.uid);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      cred = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
      console.log('[1/3] Auth user already exists, signed in:', cred.user.uid);
    } else {
      throw e;
    }
  }

  try {
    await updateProfile(cred.user, { displayName: DISPLAY_NAME });
    console.log('[2/3] displayName set on Auth user');
  } catch (e) {
    console.warn('[2/3] could not update displayName:', e.code || e.message);
  }

  const uid = cred.user.uid;
  const now = Date.now();
  const ref = doc(db, 'users', uid);
  const existing = await getDoc(ref);

  const profile = existing.exists()
    ? {
        ...existing.data(),
        displayName: DISPLAY_NAME,
        email: EMAIL,
      }
    : {
        uid,
        email: EMAIL,
        displayName: DISPLAY_NAME,
        photoURL: null,
        goal: 'maintain',
        height: 175,
        weight: 75,
        experienceLevel: 'intermediate',
        locale: 'tr',
        theme: 'system',
        createdAt: now,
        onboardingCompleted: true,
        streakCount: 0,
        lastWorkoutDate: null,
        isPremium: false,
        activeProgramId: null,
        programSchedule: null,
        programStartedAt: null,
        targetWeight: null,
      };

  await setDoc(ref, profile, { merge: true });
  console.log('[3/3] Firestore profile written:', existing.exists() ? '(merged)' : '(new)');

  console.log('\n=== PLAY CONSOLE TEST CREDENTIALS ===');
  console.log('Email   :', EMAIL);
  console.log('Password:', PASSWORD);
  console.log('UID     :', uid);
  console.log('=====================================\n');
  process.exit(0);
})().catch((e) => {
  console.error('FAIL:', e.code || e.message);
  process.exit(1);
});
