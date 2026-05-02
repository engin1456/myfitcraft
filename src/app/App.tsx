import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';

import { ThemeProvider, useTheme } from './providers/ThemeProvider';
import { I18nProvider } from './providers/I18nProvider';
import { RootNavigator } from './navigation/RootNavigator';
import { ToastHost, ErrorBoundary, OfflineBanner } from '@/components/ui';
import { useAuthListener } from '@/hooks/useAuthListener';
import { useAuthStore } from '@/stores/auth.store';
import { setErrorReporter } from '@/utils/logger';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !__DEV__,
    tracesSampleRate: 0.1,
    attachScreenshot: false,
    attachViewHierarchy: false,
    sendDefaultPii: false,
  });

  setErrorReporter((error, context) => {
    if (error instanceof Error) {
      Sentry.captureException(error, context ? { extra: context } : undefined);
    } else if (error !== undefined && error !== null) {
      Sentry.captureMessage(String(error), {
        level: 'error',
        extra: context,
      });
    }
  });
}

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

function App() {
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

export default SENTRY_DSN ? Sentry.wrap(App) : App;
