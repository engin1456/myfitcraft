import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';

import { getDb, isFirebaseConfigured } from './firebase';
import { estimate1RM } from '@/utils/calculations';
import { calculateNewStreak } from '@/utils/streak';
import { logger } from '@/utils/logger';
import { getUserProfile, updateUserProfile } from './users.service';
import type {
  ActiveWorkout,
  PersonalRecord,
  Workout,
  WorkoutLog,
} from '@/types/models';

const COLL_WORKOUTS = 'workouts';
const COLL_LOGS = 'workoutLogs';
const COLL_PRS = 'personalRecords';

export interface FinishedWorkoutResult {
  workoutId: string;
  totalVolume: number;
  totalSets: number;
  newPersonalRecords: PersonalRecord[];
  newStreak: number;
}

/**
 * Aktif workout state'inden Firestore yapilarini olusturur ve batch ile yazar.
 * - workout (1)
 * - workoutLogs (set basina 1)
 * - personalRecords (yeni rekorlar)
 */
export async function finishWorkout(params: {
  userId: string;
  active: ActiveWorkout;
  finishedAt?: number;
}): Promise<FinishedWorkoutResult> {
  const { userId, active } = params;
  const finishedAt = params.finishedAt ?? Date.now();
  const workoutId = active.workoutId.startsWith('local-')
    ? `${userId}-${finishedAt}`
    : active.workoutId;

  const completedLogs: WorkoutLog[] = [];
  let totalVolume = 0;

  for (const ex of active.exercises) {
    for (const set of ex.sets) {
      if (!set.completed || set.reps <= 0) continue;
      completedLogs.push({
        id: `${workoutId}-${ex.exerciseId}-${set.setNumber}`,
        workoutId,
        userId,
        exerciseId: ex.exerciseId,
        setNumber: set.setNumber,
        weight: set.weight,
        reps: set.reps,
        restSeconds: set.restSeconds,
        isWarmup: set.isWarmup,
        isFailure: false,
        notes: null,
        completedAt: finishedAt,
      });
      if (!set.isWarmup) {
        totalVolume += set.weight * set.reps;
      }
    }
  }

  const workout: Workout = {
    id: workoutId,
    userId,
    programId: active.programId,
    programDayId: active.programDayId,
    startedAt: active.startedAt,
    completedAt: finishedAt,
    durationSeconds: Math.round((finishedAt - active.startedAt) / 1000),
    status: 'completed',
    notes: null,
  };

  // PR detection: ayni egzersizde toplam (weight, reps) icin estimated1RM cakistirmasi
  // Once mevcut PR'lari cek
  const newPersonalRecords: PersonalRecord[] = [];

  if (isFirebaseConfigured) {
    const db = getDb();
    const prSnap = await getDocs(
      query(collection(db, COLL_PRS), where('userId', '==', userId)),
    );
    const existingPRs: Record<string, PersonalRecord> = {};
    for (const d of prSnap.docs) {
      const pr = { id: d.id, ...d.data() } as PersonalRecord;
      existingPRs[pr.exerciseId] = pr;
    }

    const bestPerExercise: Record<string, { weight: number; reps: number; e1rm: number }> = {};
    for (const log of completedLogs) {
      if (log.isWarmup) continue;
      const e1rm = estimate1RM(log.weight, log.reps);
      const cur = bestPerExercise[log.exerciseId];
      if (!cur || e1rm > cur.e1rm) {
        bestPerExercise[log.exerciseId] = { weight: log.weight, reps: log.reps, e1rm };
      }
    }

    for (const [exerciseId, best] of Object.entries(bestPerExercise)) {
      const existing = existingPRs[exerciseId];
      if (!existing || best.e1rm > existing.estimated1RM) {
        newPersonalRecords.push({
          id: `${userId}-${exerciseId}`,
          userId,
          exerciseId,
          weight: best.weight,
          reps: best.reps,
          estimated1RM: best.e1rm,
          achievedAt: finishedAt,
        });
      }
    }

    // Batch write
    const batch = writeBatch(db);
    batch.set(doc(db, COLL_WORKOUTS, workoutId), {
      ...workout,
      _serverWrittenAt: serverTimestamp(),
    });
    for (const log of completedLogs) {
      batch.set(doc(db, COLL_LOGS, log.id), log);
    }
    for (const pr of newPersonalRecords) {
      batch.set(doc(db, COLL_PRS, pr.id), pr);
    }
    await batch.commit();
  }

  // Streak guncelleme
  let newStreak = 1;
  if (isFirebaseConfigured) {
    try {
      const profile = await getUserProfile(userId);
      if (profile) {
        newStreak = calculateNewStreak(
          profile.streakCount,
          profile.lastWorkoutDate,
          finishedAt,
        );
        await updateUserProfile(userId, {
          streakCount: newStreak,
          lastWorkoutDate: finishedAt,
        });
      }
    } catch {
      /* swallow; streak guncellemesi opsiyonel */
    }
  }

  return {
    workoutId,
    totalVolume,
    totalSets: completedLogs.length,
    newPersonalRecords,
    newStreak,
  };
}

export async function fetchRecentWorkouts(
  userId: string,
  count = 10,
): Promise<Workout[]> {
  if (!isFirebaseConfigured) return [];
  try {
    // where + orderBy + limit composite index ister.
    // Index'siz: sadece where, JS'te sırala + slice.
    const snap = await getDocs(
      query(collection(getDb(), COLL_WORKOUTS), where('userId', '==', userId)),
    );
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Workout);
    items.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
    return items.slice(0, count);
  } catch (err) {
    logger.error('[workouts] fetchRecentWorkouts failed', err);
    return [];
  }
}

export async function fetchWorkoutLogs(workoutId: string): Promise<WorkoutLog[]> {
  if (!isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(
      query(collection(getDb(), COLL_LOGS), where('workoutId', '==', workoutId)),
    );
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WorkoutLog);
    items.sort((a, b) => {
      if (a.exerciseId !== b.exerciseId) return a.exerciseId.localeCompare(b.exerciseId);
      return a.setNumber - b.setNumber;
    });
    return items;
  } catch (err) {
    logger.error('[workouts] fetchWorkoutLogs failed', err);
    return [];
  }
}

export async function fetchLastLogsForExercise(
  userId: string,
  exerciseId: string,
  limitCount = 1,
): Promise<WorkoutLog[]> {
  if (!isFirebaseConfigured) return [];
  try {
    // Artık logs üzerinde direkt userId + exerciseId sorgusu (security rules da bunu zorunlu kılıyor).
    // Composite index gerekmez (eşitlik + eşitlik), JS tarafında sort ediyoruz.
    const lSnap = await getDocs(
      query(
        collection(getDb(), COLL_LOGS),
        where('userId', '==', userId),
        where('exerciseId', '==', exerciseId),
      ),
    );
    const allLogs = lSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as WorkoutLog);
    allLogs.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
    return allLogs.slice(0, limitCount * 5);
  } catch (err) {
    logger.error('[workouts] fetchLastLogsForExercise failed', err);
    return [];
  }
}

export async function fetchPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  if (!isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(
      query(collection(getDb(), COLL_PRS), where('userId', '==', userId)),
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PersonalRecord);
  } catch {
    return [];
  }
}

// Hot path icin DocumentData generic kalsin
export type _AnyDoc = DocumentData;
