import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Screen, Text, Card, Button } from '@/components/ui';
import { GreetingHero } from '@/components/dashboard/GreetingHero';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuthStore } from '@/stores/auth.store';
import { useReportsStore } from '@/stores/reports.store';
import { useActiveWorkoutStore } from '@/stores/activeWorkout.store';
import { useTodayProgramDay } from '@/hooks/useTodayProgramDay';
import { fetchExerciseById } from '@/services/exercises.service';
import { isStreakActive } from '@/utils/streak';
import { formatDate, formatVolume } from '@/utils/format';
import { weekDayLabel } from '@/services/userProgram.service';
import type {
  RootStackParamList,
  MainTabsParamList,
} from '@/app/navigation/types';
import type { DraftExercise, Locale, ProgramDay } from '@/types/models';
import type { ProgramBundle } from '@/features/programs/seed';

type RootNav = NativeStackNavigationProp<RootStackParamList>;
type TabNav = BottomTabNavigationProp<MainTabsParamList>;

/**
 * Saate göre 4 dilim:
 * - 05-12: Günaydın
 * - 12-18: İyi günler
 * - 18-22: İyi akşamlar
 * - 22-05: İyi geceler
 */
function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return t('dashboard.greetingMorning');
  if (hour >= 12 && hour < 18) return t('dashboard.greetingDay');
  if (hour >= 18 && hour < 22) return t('dashboard.greetingEvening');
  return t('dashboard.greetingNight');
}

/**
 * Hitap için en iyi "ad" tahmini:
 * 1. profile.displayName'in ilk kelimesi
 * 2. yoksa email'in @ öncesi (rakam/nokta temizlenmiş, baş harfi kapital)
 * 3. hiçbiri yoksa null
 */
function pickFirstName(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string | null {
  if (displayName && displayName.trim()) {
    const first = displayName.trim().split(/\s+/)[0];
    if (first) return first;
  }
  if (email && email.includes('@')) {
    const local = email.split('@')[0].replace(/[._\-+0-9]+/g, ' ').trim();
    const first = local.split(/\s+/)[0];
    if (first) return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }
  return null;
}

/**
 * Hitap metni: "Günaydın, Rabii" veya isim yoksa sadece zaman dilimi.
 */
function getGreetingWithName(
  t: (key: string) => string,
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const greeting = getGreeting(t);
  const name = pickFirstName(displayName, email);
  return name ? `${greeting}, ${name}` : greeting;
}

export function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const rootNav = useNavigation<RootNav>();
  const tabNav = useNavigation<TabNav>();
  const isTr = i18n.language === 'tr';

  const profile = useAuthStore((s) => s.profile);
  const uid = useAuthStore((s) => s.uid);
  const active = useActiveWorkoutStore((s) => s.active);
  const startWorkout = useActiveWorkoutStore((s) => s.startWorkout);
  const workouts = useReportsStore((s) => s.workouts);
  const logsByWorkout = useReportsStore((s) => s.logsByWorkout);
  const loadReports = useReportsStore((s) => s.load);

  const { bundle, todayDay, nextDay, hasActiveProgram } = useTodayProgramDay();

  useEffect(() => {
    if (uid) loadReports(uid);
  }, [uid, loadReports]);

  const lastWorkout = workouts[0];
  const streak = profile?.streakCount ?? 0;
  const streakActive = isStreakActive(profile?.lastWorkoutDate ?? null);

  const lastWorkoutVolume = lastWorkout
    ? (logsByWorkout[lastWorkout.id] ?? []).reduce(
        (s, l) => s + (l.isWarmup ? 0 : l.weight * l.reps),
        0,
      )
    : 0;

  const programName = bundle
    ? isTr
      ? bundle.program.nameTr
      : bundle.program.name
    : null;

  const todayDayName = todayDay
    ? isTr
      ? todayDay.nameTr
      : todayDay.name
    : null;

  const nextDayName = nextDay
    ? isTr
      ? nextDay.programDay.nameTr
      : nextDay.programDay.name
    : null;

  const nextWhenLabel = useMemo(() => {
    if (!nextDay) return null;
    if (nextDay.daysUntil === 0) return t('dashboard.nextWorkoutToday');
    if (nextDay.daysUntil === 1) return t('dashboard.nextWorkoutTomorrow');
    return t('dashboard.nextWorkoutInDays', { count: nextDay.daysUntil });
  }, [nextDay, t]);

  const startTodayWorkout = async () => {
    if (!todayDay || !bundle) return;
    const draftExercises = await buildDraftExercisesForDay(bundle, todayDay, isTr);
    startWorkout({
      workoutId: `local-${Date.now()}`,
      programId: bundle.program.id,
      programDayId: todayDay.id,
      programDayName: isTr ? todayDay.nameTr : todayDay.name,
      startedAt: Date.now(),
      exercises: draftExercises,
      currentExerciseIndex: 0,
    });
    rootNav.navigate('ActiveWorkout');
  };

  return (
    <Screen scroll padded withBottomInset>
      <GreetingHero
        greeting={getGreetingWithName(t, profile?.displayName, profile?.email)}
        streakCount={streak}
        streakActive={streakActive}
      />

      {/* Active workout banner — küçük versiyon, sadece bu sekmede.
          Tab bar üstünde mini banner zaten her yerde gözüktüğü için burada
          minimal bir reminder yeter. */}

      {/* Hero card — 3 farklı state */}
      {!hasActiveProgram ? (
        // 1. Aktif program yok
        <Card style={styles.heroCard} elevated>
          <Text variant="caption" muted>
            {t('dashboard.todayProgram')}
          </Text>
          <Text variant="heading">{t('dashboard.noActiveProgram')}</Text>
          <Text muted size="sm" style={{ marginTop: 4 }}>
            {t('dashboard.noActiveProgramHint')}
          </Text>
          <Button
            title={t('dashboard.selectProgram')}
            onPress={() => tabNav.jumpTo('Programs')}
            style={styles.heroButton}
          />
        </Card>
      ) : todayDay ? (
        // 2. Bugün antrenman var
        <Card
          style={[styles.heroCard, { borderColor: theme.colors.primary, borderWidth: 1 }]}
          elevated
        >
          <View style={styles.heroRow}>
            <View style={styles.heroLeft}>
              <Text variant="caption" muted>
                {programName} • {t('dashboard.trainingDay')}
              </Text>
              <Text variant="heading">{todayDayName}</Text>
            </View>
            <View
              style={[
                styles.streakBadge,
                {
                  backgroundColor: streakActive ? theme.colors.primary : theme.colors.border,
                  borderRadius: 20,
                },
              ]}
            >
              <Text size="xs" weight="bold" color={theme.colors.primaryContrast}>
                🔥 {streak}
              </Text>
            </View>
          </View>
          <Button
            title={
              active
                ? t('dashboard.continueWorkout')
                : t('dashboard.startWorkout')
            }
            onPress={() => (active ? rootNav.navigate('ActiveWorkout') : startTodayWorkout())}
            style={styles.heroButton}
          />
          {bundle ? (
            <Button
              variant="ghost"
              size="sm"
              title={t('dashboard.manageProgram')}
              onPress={() =>
                rootNav.navigate('ProgramDetail', { programId: bundle.program.id })
              }
            />
          ) : null}
        </Card>
      ) : (
        // 3. Aktif program var ama bugün dinlenme
        <Card style={styles.heroCard} elevated>
          <View style={styles.heroRow}>
            <View style={styles.heroLeft}>
              <Text variant="caption" muted>
                {programName}
              </Text>
              <Text variant="heading">🛋️ {t('dashboard.restDay')}</Text>
              <Text muted size="sm" style={{ marginTop: 4 }}>
                {t('dashboard.restDaySubtitle')}
              </Text>
            </View>
            <View
              style={[
                styles.streakBadge,
                {
                  backgroundColor: streakActive ? theme.colors.primary : theme.colors.border,
                  borderRadius: 20,
                },
              ]}
            >
              <Text size="xs" weight="bold" color={theme.colors.primaryContrast}>
                🔥 {streak}
              </Text>
            </View>
          </View>
          {nextDay && nextDayName ? (
            <View
              style={[
                styles.nextRow,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text variant="caption" muted>
                  {t('dashboard.nextWorkout')}
                </Text>
                <Text weight="semibold">
                  {weekDayLabel(nextDay.weekDay, isTr ? 'tr' : 'en', true)} • {nextDayName}
                </Text>
              </View>
              <Text size="sm" weight="medium" color={theme.colors.primary}>
                {nextWhenLabel}
              </Text>
            </View>
          ) : null}
          {bundle ? (
            <Button
              variant="ghost"
              size="sm"
              title={t('dashboard.manageProgram')}
              onPress={() =>
                rootNav.navigate('ProgramDetail', { programId: bundle.program.id })
              }
            />
          ) : null}
        </Card>
      )}

      {/* Last workout */}
      <View style={styles.section}>
        <Text variant="label" muted>
          {t('dashboard.lastWorkout')}
        </Text>
        <Card>
          {lastWorkout ? (
            <View style={styles.lastWoRow}>
              <View>
                <Text weight="semibold">
                  {formatDate(lastWorkout.startedAt, 'dd MMM', i18n.language as Locale)}
                </Text>
                <Text variant="caption" muted>
                  {Math.round((lastWorkout.durationSeconds ?? 0) / 60)} {t('common.min')}
                </Text>
              </View>
              <View style={styles.lastWoStats}>
                <Text variant="caption" muted>
                  {t('workout.totalVolume')}
                </Text>
                <Text weight="semibold">{formatVolume(lastWorkoutVolume)}</Text>
              </View>
            </View>
          ) : (
            <Text muted>{t('reports.noData')}</Text>
          )}
        </Card>
      </View>

      {/* Streak motivation */}
      {streak > 0 ? (
        <View style={styles.section}>
          <Text variant="label" muted>
            🔥 Streak
          </Text>
          <Card>
            <Text>
              {streakActive
                ? t('dashboard.streak', { count: streak })
                : `Streak'in ${streak} gün ulaştı, korumak için bugün antrenman yap!`}
            </Text>
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

/**
 * Bir program günü için DraftExercise listesi oluştur.
 * ProgramDetailScreen'deki mantığın aynısı, dashboard "Antrenmana Başla" için tek tıklama akışı.
 */
async function buildDraftExercisesForDay(
  bundle: ProgramBundle,
  day: ProgramDay,
  isTr: boolean,
): Promise<DraftExercise[]> {
  const dayExercises = bundle.exercises
    .filter((e) => e.programDayId === day.id)
    .sort((a, b) => a.orderInDay - b.orderInDay);

  const fetched = await Promise.all(
    dayExercises.map((pe) => fetchExerciseById(pe.exerciseId)),
  );

  return dayExercises.map((pe, i) => {
    const exercise = fetched[i];
    const exerciseName = exercise
      ? isTr
        ? exercise.nameTr
        : exercise.name
      : pe.exerciseId;
    return {
      exerciseId: pe.exerciseId,
      exerciseName,
      orderInDay: pe.orderInDay,
      targetSets: pe.defaultSets,
      targetReps: pe.defaultReps,
      defaultRestSeconds: pe.defaultRestSeconds,
      sets: Array.from({ length: pe.defaultSets }, (_, idx) => ({
        id: `${pe.id}-${idx + 1}`,
        setNumber: idx + 1,
        weight: 0,
        reps: 0,
        isWarmup: false,
        completed: false,
        restSeconds: pe.defaultRestSeconds,
      })),
      notes: pe.notes,
    };
  });
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  activeCard: {
    marginBottom: 12,
  },
  activeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeLeft: {
    flex: 1,
  },
  heroCard: {
    gap: 16,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeft: {
    gap: 4,
    flex: 1,
  },
  streakBadge: {
    minWidth: 56,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButton: {
    marginTop: 4,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  section: {
    marginTop: 24,
    gap: 8,
  },
  lastWoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastWoStats: {
    alignItems: 'flex-end',
  },
});
