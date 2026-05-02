import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type AppTheme } from '@/theme';
import { useSettingsStore } from '@/stores/settings.store';

const ThemeContext = createContext<AppTheme>(darkTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themePref = useSettingsStore((s) => s.theme);
  const systemScheme = useColorScheme();

  const theme = useMemo<AppTheme>(() => {
    const resolved = themePref === 'system' ? (systemScheme ?? 'dark') : themePref;
    return resolved === 'light' ? lightTheme : darkTheme;
  }, [themePref, systemScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}
