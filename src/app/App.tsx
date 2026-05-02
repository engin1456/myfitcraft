import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider, useTheme } from './providers/ThemeProvider';
import { I18nProvider } from './providers/I18nProvider';
import { RootNavigator } from './navigation/RootNavigator';
import { ToastHost, ErrorBoundary, OfflineBanner } from '@/components/ui';
import { useAuthListener } from '@/hooks/useAuthListener';
import { useAuthStore } from '@/stores/auth.store';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* Splash zaten yüklenmediyse sessiz geç */
});

function LoadingFallback() {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  );
}

function AppShell() {
  const initialized = useAuthStore((s) => s.initialized);
  useAuthListener();

  useEffect(() => {
    if (initialized) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [initialized]);

  if (!initialized) {
    return <LoadingFallback />;
  }

  return (
    <>
      <RootNavigator />
      <OfflineBanner />
      <ToastHost />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <I18nProvider fallback={<LoadingFallback />}>
              <AppShell />
            </I18nProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
