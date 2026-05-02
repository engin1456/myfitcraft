import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { getDb, isFirebaseConfigured } from './firebase';
import { logger } from '@/utils/logger';
import {
  PRESET_PROGRAMS,
  getPresetProgram,
  type ProgramBundle,
} from '@/features/programs/seed';
import type { Program, ProgramDay, ProgramExercise } from '@/types/models';

const COLL_PROGRAMS = 'programs';
const COLL_DAYS = 'programDays';
const COLL_EXERCISES = 'programExercises';

export async function fetchPresetPrograms(): Promise<ProgramBundle[]> {
  // Preset programlar dogrudan seed'den. Firebase'de saklamaya gerek yok
  // (bandwidth tasarrufu) ama istersek future-proof.
  return PRESET_PROGRAMS;
}

export async function fetchUserPrograms(userId: string): Promise<Program[]> {
  if (!isFirebaseConfigured) return [];
  try {
    // where + orderBy farklı alanlar → composite index gerektirir.
    // Index'siz çalışsın: sadece where, sıralama JS'te.
    const snap = await getDocs(
      query(collection(getDb(), COLL_PROGRAMS), where('ownerId', '==', userId)),
    );
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Program);
    items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return items;
  } catch (err) {
    logger.error('[programs] fetchUserPrograms failed', err);
    return [];
  }
}

export async function fetchProgramBundle(programId: string): Promise<ProgramBundle | null> {
  // Preset ise direkt dondur
  const preset = getPresetProgram(programId);
  if (preset) return preset;

  if (!isFirebaseConfigured) return null;

  try {
    const db = getDb();
    const programDoc = await getDocs(
      query(collection(db, COLL_PROGRAMS), where('__name__', '==', programId)),
    );
    if (programDoc.empty) return null;
    const program = { id: programDoc.docs[0].id, ...programDoc.docs[0].data() } as Program;

    const daysSnap = await getDocs(
      query(collection(db, COLL_DAYS), where('programId', '==', programId)),
    );
    const days = daysSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProgramDay);
    days.sort((a, b) => a.dayOrder - b.dayOrder);

    const dayIds = days.map((d) => d.id).slice(0, 30); // Firestore 'in' cap
    const exercises: ProgramExercise[] = [];
    if (dayIds.length > 0) {
      const exercisesSnap = await getDocs(
        query(
          collection(db, COLL_EXERCISES),
          where('programDayId', 'in', dayIds),
        ),
      );
      for (const d of exercisesSnap.docs) {
        exercises.push({ id: d.id, ...d.data() } as ProgramExercise);
      }
      exercises.sort((a, b) => a.orderInDay - b.orderInDay);
    }

    return { program, days, exercises };
  } catch (err) {
    logger.error('[programs] fetchProgramBundle failed', err);
    return null;
  }
}

export async function saveUserProgram(bundle: ProgramBundle): Promise<void> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase yapilandirilmamis');
  }
  const db = getDb();
  const batch = writeBatch(db);

  batch.set(doc(db, COLL_PROGRAMS, bundle.program.id), {
    ...bundle.program,
    _serverWrittenAt: serverTimestamp(),
  });
  for (const d of bundle.days) {
    batch.set(doc(db, COLL_DAYS, d.id), d);
  }
  for (const ex of bundle.exercises) {
    batch.set(doc(db, COLL_EXERCISES, ex.id), ex);
  }

  await batch.commit();
}

export async function deleteUserProgram(programId: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  const db = getDb();
  const batch = writeBatch(db);

  // Days + exercises de sil
  const daysSnap = await getDocs(
    query(collection(db, COLL_DAYS), where('programId', '==', programId)),
  );
  const dayIds = daysSnap.docs.map((d) => d.id);

  for (const dayId of dayIds) {
    batch.delete(doc(db, COLL_DAYS, dayId));
    const exSnap = await getDocs(
      query(collection(db, COLL_EXERCISES), where('programDayId', '==', dayId)),
    );
    for (const e of exSnap.docs) {
      batch.delete(doc(db, COLL_EXERCISES, e.id));
    }
  }
  batch.delete(doc(db, COLL_PROGRAMS, programId));
  await batch.commit();
}
