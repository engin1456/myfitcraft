import { create } from 'zustand';

import {
  fetchPresetPrograms,
  fetchUserPrograms,
} from '@/services/programs.service';
import type { ProgramBundle } from '@/features/programs/seed';
import type { Program } from '@/types/models';

interface ProgramsState {
  loaded: boolean;
  loading: boolean;
  presets: ProgramBundle[];
  myPrograms: Program[];
  load: (userId: string | null) => Promise<void>;
  reload: (userId: string | null) => Promise<void>;
}

export const useProgramsStore = create<ProgramsState>((set, get) => ({
  loaded: false,
  loading: false,
  presets: [],
  myPrograms: [],

  load: async (userId) => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const [presets, mine] = await Promise.all([
        fetchPresetPrograms(),
        userId ? fetchUserPrograms(userId) : Promise.resolve([]),
      ]);
      set({ presets, myPrograms: mine, loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  reload: async (userId) => {
    set({ loading: true, loaded: false });
    try {
      const [presets, mine] = await Promise.all([
        fetchPresetPrograms(),
        userId ? fetchUserPrograms(userId) : Promise.resolve([]),
      ]);
      set({ presets, myPrograms: mine, loaded: true });
    } finally {
      set({ loading: false });
    }
  },
}));
