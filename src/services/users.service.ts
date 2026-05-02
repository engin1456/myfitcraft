import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';

import { getDb } from './firebase';
import type { UserProfile } from '@/types/models';

const USERS_COLLECTION = 'users';

function userDoc(uid: string) {
  return doc(getDb(), USERS_COLLECTION, uid);
}

function fromDoc(uid: string, data: DocumentData | undefined): UserProfile | null {
  if (!data) return null;
  return {
    uid,
    email: data.email ?? null,
    displayName: data.displayName ?? null,
    photoURL: data.photoURL ?? null,
    goal: data.goal ?? null,
    height: data.height ?? null,
    weight: data.weight ?? null,
    experienceLevel: data.experienceLevel ?? null,
    locale: data.locale ?? 'tr',
    theme: data.theme ?? 'system',
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    onboardingCompleted: Boolean(data.onboardingCompleted),
    streakCount: data.streakCount ?? 0,
    lastWorkoutDate: data.lastWorkoutDate ?? null,
    isPremium: Boolean(data.isPremium),
    activeProgramId: data.activeProgramId ?? null,
    programSchedule: Array.isArray(data.programSchedule) ? data.programSchedule : null,
    programStartedAt: data.programStartedAt ?? null,
    targetWeight: data.targetWeight ?? null,
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDoc(uid));
  if (!snap.exists()) return null;
  return fromDoc(uid, snap.data());
}

export async function createUserProfile(profile: Partial<UserProfile> & { uid: string }) {
  const ref = userDoc(profile.uid);
  const initial: Omit<UserProfile, 'uid'> = {
    email: profile.email ?? null,
    displayName: profile.displayName ?? null,
    photoURL: profile.photoURL ?? null,
    goal: null,
    height: null,
    weight: null,
    experienceLevel: null,
    locale: profile.locale ?? 'tr',
    theme: profile.theme ?? 'system',
    createdAt: Date.now(),
    onboardingCompleted: false,
    streakCount: 0,
    lastWorkoutDate: null,
    isPremium: false,
    activeProgramId: null,
    programSchedule: null,
    programStartedAt: null,
    targetWeight: null,
  };
  await setDoc(ref, { ...initial, _serverCreatedAt: serverTimestamp() }, { merge: true });
  return { ...initial, uid: profile.uid } as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  patch: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>,
) {
  await updateDoc(userDoc(uid), { ...patch, _updatedAt: serverTimestamp() });
}

export async function ensureUserProfile(params: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<UserProfile> {
  const existing = await getUserProfile(params.uid);
  if (existing) return existing;
  return createUserProfile(params);
}
