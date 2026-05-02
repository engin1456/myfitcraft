import { create } from 'zustand';

import {
  fetchPersonalRecords,
  fetchRecentWorkouts,
  fetchWorkoutLogs,
} from '@/services/workouts.service';
import { fetchMeasurements } from '@/services/measurements.service';
import type {
  BodyMeasurement,
  PersonalRecord,
  Workout,
  WorkoutLog,
} from '@/types/models';

interface ReportsState {
  loaded: boolean;
  loading: boolean;
  workouts: Workout[];
  logsByWorkout: Record<string, WorkoutLog[]>;
  personalRecords: PersonalRecord[];
  measurements: BodyMeasurement[];
  load: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  loaded: false,
  loading: false,
  workouts: [],
  logsByWorkout: {},
  personalRecords: [],
  measurements: [],

  load: async (userId) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      // 90 günlük pencere — hem tutarlılık ısı haritası hem de uzun trend için yeterli.
      const [workouts, prs, measurements] = await Promise.all([
        fetchRecentWorkouts(userId, 100),
        fetchPersonalRecords(userId),
        fetchMeasurements(userId),
      ]);
      // Logları paralel çek (sıralı await zincirinden çok daha hızlı)
      const entries = await Promise.all(
        workouts.map(async (w) => [w.id, await fetchWorkoutLogs(w.id)] as const),
      );
      const logsByWorkout: Record<string, WorkoutLog[]> = {};
      for (const [id, logs] of entries) logsByWorkout[id] = logs;
      set({
        workouts,
        logsByWorkout,
        personalRecords: prs,
        measurements,
        loaded: true,
      });
    } finally {
      set({ loading: false });
    }
  },

  reset: () =>
    set({
      workouts: [],
      logsByWorkout: {},
      personalRecords: [],
      measurements: [],
      loaded: false,
    }),
}));
