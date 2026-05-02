import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';

import { getDb, isFirebaseConfigured } from './firebase';
import { SEED_EXERCISES } from '@/features/exercises/seed';
import type { Exercise } from '@/types/models';

const COLL = 'exercises';

/**
 * Egzersizleri yukler. Firebase'den deneme yapar; yoksa veya bossa seed'i kullanir.
 */
export async function fetchExercises(): Promise<Exercise[]> {
  if (!isFirebaseConfigured) return SEED_EXERCISES;

  try {
    const snap = await getDocs(query(collection(getDb(), COLL), orderBy('name')));
    if (snap.empty) return SEED_EXERCISES;
    const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Exercise);
    return remote;
  } catch {
    return SEED_EXERCISES;
  }
}

export async function fetchExerciseById(id: string): Promise<Exercise | null> {
  // Once seed'de bak (yerel cache hizli)
  const local = SEED_EXERCISES.find((e) => e.id === id);

  if (!isFirebaseConfigured) return local ?? null;

  try {
    const snap = await getDoc(doc(getDb(), COLL, id));
    if (snap.exists()) return { id, ...snap.data() } as Exercise;
  } catch {
    /* fall through to local */
  }
  return local ?? null;
}
