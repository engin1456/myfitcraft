import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { getDb, isFirebaseConfigured } from './firebase';
import { logger } from '@/utils/logger';
import type { BodyMeasurement } from '@/types/models';

const COLL = 'bodyMeasurements';

/**
 * Tek-alan where sorgusu (composite index gerektirmez).
 * Sıralama JS tarafında yapılır — kullanıcı başına yüzlerce ölçü olmaz, perf sorun değil.
 * Eski versiyonda `where + orderBy('date')` Firestore'dan composite index istiyordu;
 * index yoksa silent fail edip boş liste dönüyordu.
 */
export async function fetchMeasurements(userId: string): Promise<BodyMeasurement[]> {
  if (!isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(
      query(collection(getDb(), COLL), where('userId', '==', userId)),
    );
    const items = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as BodyMeasurement,
    );
    items.sort((a, b) => b.date - a.date);
    logger.info(`[measurements] fetched ${items.length} for ${userId}`);
    return items;
  } catch (err) {
    logger.error('[measurements] fetch failed', err);
    return [];
  }
}

export async function saveMeasurement(m: BodyMeasurement): Promise<void> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase yapilandirilmamis');
  }
  logger.info('[measurements] saving', m.id);
  await setDoc(doc(getDb(), COLL, m.id), {
    ...m,
    _serverWrittenAt: serverTimestamp(),
  });
  logger.info('[measurements] saved', m.id);
}

export async function deleteMeasurement(id: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  await deleteDoc(doc(getDb(), COLL, id));
}
