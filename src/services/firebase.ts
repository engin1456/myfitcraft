import Constants from 'expo-constants';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  // @ts-expect-error - getReactNativePersistence runtime'da firebase/auth içinde var ama tip dışa aktarılmıyor
  getReactNativePersistence,
  getAuth,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FirebaseExtraConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

function readConfig(): FirebaseExtraConfig {
  const extra = (Constants.expoConfig?.extra ?? {}) as { firebase?: FirebaseExtraConfig };
  return extra.firebase ?? {};
}

function isConfigured(cfg: FirebaseExtraConfig): cfg is Required<FirebaseExtraConfig> {
  return Boolean(
    cfg.apiKey &&
      cfg.authDomain &&
      cfg.projectId &&
      cfg.storageBucket &&
      cfg.messagingSenderId &&
      cfg.appId,
  );
}

const cfg = readConfig();

/**
 * Firebase yapılandırılmamışsa uygulama yine de açılsın diye lazy / safe init.
 * Geliştirici .env dosyasını doldurmadan UI iskelesini görebilsin.
 */
export const isFirebaseConfigured = isConfigured(cfg);

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase yapılandırılmamış. .env dosyasında EXPO_PUBLIC_FIREBASE_* değerlerini doldur.',
    );
  }
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(cfg as Required<FirebaseExtraConfig>);
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  const app = getFirebaseApp();
  try {
    _auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Hot-reload sırasında zaten init edildiyse getAuth ile yakala
    _auth = getAuth(app);
  }
  return _auth;
}

export function getDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getFirebaseApp());
  return _db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (_storage) return _storage;
  _storage = getStorage(getFirebaseApp());
  return _storage;
}
