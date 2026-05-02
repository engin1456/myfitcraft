import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { ActiveWorkout, DraftSet } from '@/types/models';

interface ActiveWorkoutState {
  active: ActiveWorkout | null;
  startWorkout: (workout: ActiveWorkout) => void;
  updateSet: (exerciseIndex: number, setId: string, patch: Partial<DraftSet>) => void;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setId: string) => void;
  setCurrentExercise: (index: number) => void;
  cancelWorkout: () => void;
  finishWorkout: () => void;
}

/**
 * Aktif workout state'i AsyncStorage'a persist edilir; uygulama kapansa bile
 * antrenman kaldığı yerden devam edebilir.
 */
export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set) => ({
      active: null,
      startWorkout: (workout) => set({ active: workout }),
      updateSet: (exerciseIndex, setId, patch) =>
        set((state) => {
          if (!state.active) return state;
          const exercises = state.active.exercises.map((ex, idx) => {
            if (idx !== exerciseIndex) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
            };
          });
          return { active: { ...state.active, exercises } };
        }),
      addSet: (exerciseIndex) =>
        set((state) => {
          if (!state.active) return state;
          const exercises = state.active.exercises.map((ex, idx) => {
            if (idx !== exerciseIndex) return ex;
            const lastSet = ex.sets[ex.sets.length - 1];
            const newSet: DraftSet = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              setNumber: ex.sets.length + 1,
              weight: lastSet?.weight ?? 0,
              reps: 0,
              isWarmup: false,
              completed: false,
              restSeconds: ex.defaultRestSeconds,
            };
            return { ...ex, sets: [...ex.sets, newSet] };
          });
          return { active: { ...state.active, exercises } };
        }),
      removeSet: (exerciseIndex, setId) =>
        set((state) => {
          if (!state.active) return state;
          const exercises = state.active.exercises.map((ex, idx) => {
            if (idx !== exerciseIndex) return ex;
            const filtered = ex.sets.filter((s) => s.id !== setId);
            return {
              ...ex,
              sets: filtered.map((s, i) => ({ ...s, setNumber: i + 1 })),
            };
          });
          return { active: { ...state.active, exercises } };
        }),
      setCurrentExercise: (index) =>
        set((state) => {
          if (!state.active) return state;
          return { active: { ...state.active, currentExerciseIndex: index } };
        }),
      cancelWorkout: () => set({ active: null }),
      finishWorkout: () => set({ active: null }),
    }),
    {
      name: 'myfitcraft:activeWorkout',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
