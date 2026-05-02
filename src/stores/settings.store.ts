import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { Locale, ThemePreference } from '@/types/models';

interface SettingsState {
  locale: Locale | null;
  theme: ThemePreference;
  hasSeenOnboardingIntro: boolean;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemePreference) => void;
  markOnboardingIntroSeen: () => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: null,
      theme: 'system',
      hasSeenOnboardingIntro: false,
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
      markOnboardingIntroSeen: () => set({ hasSeenOnboardingIntro: true }),
      reset: () =>
        set({
          locale: null,
          theme: 'system',
          hasSeenOnboardingIntro: false,
        }),
    }),
    {
      name: 'myfitcraft:settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
