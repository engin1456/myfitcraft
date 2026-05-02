import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';

import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { OnboardingScreen } from '@/features/auth/screens/OnboardingScreen';
import { ExerciseDetailScreen } from '@/features/exercises/screens/ExerciseDetailScreen';
import { ProgramDetailScreen } from '@/features/programs/screens/ProgramDetailScreen';
import { ProgramBuilderScreen } from '@/features/programs/screens/ProgramBuilderScreen';
import { ProgramScheduleScreen } from '@/features/programs/screens/ProgramScheduleScreen';
import { ActiveWorkoutScreen } from '@/features/workout/screens/ActiveWorkoutScreen';
import { WorkoutSummaryScreen } from '@/features/workout/screens/WorkoutSummaryScreen';
import { MeasurementsScreen } from '@/features/measurements/screens/MeasurementsScreen';
import { AddMeasurementScreen } from '@/features/measurements/screens/AddMeasurementScreen';
import { LegalScreen } from '@/features/legal/screens/LegalScreen';

import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useTheme();
  const { t } = useTranslation();
  const uid = useAuthStore((s) => s.uid);
  const profile = useAuthStore((s) => s.profile);
  const hasSeenIntro = useSettingsStore((s) => s.hasSeenOnboardingIntro);

  const navTheme = {
    ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  };

  // Akış kararı:
  // 1. Onboarding intro görülmediyse -> Onboarding
  // 2. Login değilse -> AuthStack
  // 3. Login ama profil eksikse -> Onboarding (profile completion)
  // 4. Aksi halde -> MainTabs
  const showIntro = !hasSeenIntro;
  const isAuthenticated = Boolean(uid);
  const needsProfileSetup = isAuthenticated && profile && !profile.onboardingCompleted;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showIntro ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !isAuthenticated ? (
          <Stack.Screen name="AuthStack" component={AuthStack} />
        ) : needsProfileSetup ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="ExerciseDetail"
              component={ExerciseDetailScreen}
              options={{ headerShown: true, title: t('navTitles.exerciseDetail') }}
            />
            <Stack.Screen
              name="ProgramDetail"
              component={ProgramDetailScreen}
              options={{ headerShown: true, title: t('navTitles.programDetail') }}
            />
            <Stack.Screen
              name="ProgramBuilder"
              component={ProgramBuilderScreen}
              options={{ headerShown: true, title: t('navTitles.programBuilder') }}
            />
            <Stack.Screen
              name="ProgramSchedule"
              component={ProgramScheduleScreen}
              options={{ headerShown: true, title: t('navTitles.programSchedule') }}
            />
            <Stack.Screen
              name="ActiveWorkout"
              component={ActiveWorkoutScreen}
              options={{ headerShown: true, title: t('navTitles.activeWorkout') }}
            />
            <Stack.Screen
              name="WorkoutSummary"
              component={WorkoutSummaryScreen}
              options={{ headerShown: true, title: t('navTitles.workoutSummary') }}
            />
            <Stack.Screen
              name="Measurements"
              component={MeasurementsScreen}
              options={{ headerShown: true, title: t('navTitles.measurements') }}
            />
            <Stack.Screen
              name="AddMeasurement"
              component={AddMeasurementScreen}
              options={{
                headerShown: true,
                title: t('navTitles.addMeasurement'),
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="Legal"
              component={LegalScreen}
              options={({ route }) => ({
                headerShown: true,
                title:
                  route.params.kind === 'privacy'
                    ? t('navTitles.privacy')
                    : t('navTitles.terms'),
              })}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
