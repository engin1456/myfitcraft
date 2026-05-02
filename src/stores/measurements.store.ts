import { create } from 'zustand';

import {
  fetchMeasurements,
  saveMeasurement,
  deleteMeasurement,
} from '@/services/measurements.service';
import { logger } from '@/utils/logger';
import type { BodyMeasurement } from '@/types/models';

interface MeasurementsState {
  loaded: boolean;
  loading: boolean;
  items: BodyMeasurement[];
  load: (userId: string) => Promise<void>;
  add: (m: BodyMeasurement) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}

/**
 * Bir Promise'ı belirli süre içinde bitmezse reddet.
 * Firestore setDoc bazen network/firewall yüzünden infinite pending kalır.
 */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race<T>([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Zaman aşımı (${ms / 1000}s) — ${label}`)),
        ms,
      ),
    ),
  ]);
}

export const useMeasurementsStore = create<MeasurementsState>((set, get) => ({
  loaded: false,
  loading: false,
  items: [],

  load: async (userId) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const items = await fetchMeasurements(userId);
      set({ items, loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  add: async (m) => {
    // Optimistic: önce local state'e ekle (UI hemen tepki verir)
    set((s) => ({ items: [m, ...s.items] }));
    try {
      // Firestore yazma 10sn timeout ile
      await withTimeout(saveMeasurement(m), 10000, 'Firestore yazma');
      logger.info('[measurements] saved', m.id);
    } catch (err) {
      // Rollback: hata varsa local state'ten geri sil
      set((s) => ({ items: s.items.filter((x) => x.id !== m.id) }));
      logger.error('[measurements] save failed', err);
      throw err;
    }
  },

  remove: async (id) => {
    // Optimistic remove + rollback on fail
    const prev = get().items;
    set((s) => ({ items: s.items.filter((x) => x.id !== id) }));
    try {
      await withTimeout(deleteMeasurement(id), 10000, 'Firestore silme');
    } catch (err) {
      set({ items: prev });
      throw err;
    }
  },

  reset: () => set({ items: [], loaded: false }),
}));
