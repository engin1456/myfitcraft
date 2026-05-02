import { create } from 'zustand';

import type { UserProfile } from '@/types/models';

interface AuthState {
  initialized: boolean;
  uid: string | null;
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  setUid: (uid: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  signOutLocal: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  initialized: false,
  uid: null,
  profile: null,
  setProfile: (profile) => set({ profile }),
  setUid: (uid) => set({ uid }),
  setInitialized: (initialized) => set({ initialized }),
  signOutLocal: () => set({ uid: null, profile: null }),
}));
