import { create } from 'zustand';

import type { Exercise, MuscleGroup, Equipment } from '@/types/models';
import { fetchExercises } from '@/services/exercises.service';

interface ExercisesState {
  loaded: boolean;
  loading: boolean;
  items: Exercise[];
  searchQuery: string;
  muscleFilter: MuscleGroup | null;
  equipmentFilter: Equipment | null;
  load: () => Promise<void>;
  reload: () => Promise<void>;
  setSearchQuery: (q: string) => void;
  setMuscleFilter: (m: MuscleGroup | null) => void;
  setEquipmentFilter: (eq: Equipment | null) => void;
  clearFilters: () => void;
}

export const useExercisesStore = create<ExercisesState>((set, get) => ({
  loaded: false,
  loading: false,
  items: [],
  searchQuery: '',
  muscleFilter: null,
  equipmentFilter: null,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const items = await fetchExercises();
      set({ items, loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  reload: async () => {
    set({ loading: true, loaded: false });
    try {
      const items = await fetchExercises();
      set({ items, loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setMuscleFilter: (m) => set({ muscleFilter: m }),
  setEquipmentFilter: (eq) => set({ equipmentFilter: eq }),
  clearFilters: () =>
    set({ searchQuery: '', muscleFilter: null, equipmentFilter: null }),
}));

/**
 * Filtre uygulanmis sonuc - selector pattern, useShallow gerekmiyor cunku array
 * her render'da yeniden hesaplaniyor (kotu pratik); useFilteredExercises hook
 * memoize ederek bu sorunu cozer.
 */
export function selectFilteredExercises(state: ExercisesState): Exercise[] {
  const q = state.searchQuery.trim().toLowerCase();
  return state.items.filter((ex) => {
    if (state.muscleFilter && ex.primaryMuscle !== state.muscleFilter) return false;
    if (state.equipmentFilter && ex.equipment !== state.equipmentFilter) return false;
    if (q.length > 0) {
      const hay = `${ex.name} ${ex.nameTr}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
