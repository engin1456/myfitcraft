import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, Text, Card, Button, Chip } from '@/components/ui';
import { useTheme } from '@/app/providers/ThemeProvider';
import { fetchProgramBundle } from '@/services/programs.service';
import { fetchExerciseById } from '@/services/exercises.service';
import { useActiveWorkoutStore } from '@/stores/activeWorkout.store';
import { useAuthStore } from '@/stores/auth.store';
import { deactivateProgram } from '@/services/userProgram.service';
import type { ProgramBundle } from '@/features/programs/seed';
import type { DraftExercise, Exercise, ProgramDay } from '@/types/models';
import type {
  RootStackParamList,
  RootStackScreenProps,
} from '@/app/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProgramDetailScreen({ route }: RootStackScreenProps<'ProgramDetail'>) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const isTr = i18n.language === 'tr';

  const [bundle, setBundle] = useState<ProgramBundle | null>(null);
  const [exercisesById, setExercisesById] = useState<Record<string, Exercise>>({});
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(false);
  const startWorkout = useActiveWorkoutStore((s) => s.startWorkout);
  const uid = useAuthStore((s) => s.uid);
  const activeProgramId = useAuthStore((s) => s.profile?.activeProgramId ?? null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const result = await fetchProgramBundle(route.params.programId);
      if (cancelled) return;
      setBundle(result);

      if (result) {
        const ids = Array.from(new Set(result.exercises.map((e) => e.exerciseId)));
        const fetched = await Promise.all(ids.map((id) => fetchExerciseById(id)));
        if (cancelled) return;
        const map: Record<string, Exercise> = {};
        for (const ex of fetched) {
          if (ex) map[ex.id] = ex;
        }
        setExercisesById(map);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [route.params.programId]);

  if (loading) {
    return (
      <Screen padded>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!bundle) {
    return (
      <Screen padded>
        <Text muted align="center">
          {t('programs.noPrograms')}
        </Text>
      </Screen>
    );
  }

  const program = bundle.program;
  const name = isTr ? program.nameTr : program.name;
  const desc = isTr ? program.descriptionTr : program.description;

  const startProgramDay = (day: ProgramDay) => {
    const dayExercises = bundle.exercises
      .filter((e) => e.programDayId === day.id)
      .sort((a, b) => a.orderInDay - b.orderInDay);

    const draftExercises: DraftExercise[] = dayExercises.map((pe) => {
      const exercise = exercisesById[pe.exerciseId];
      const exerciseName = exercise ? (isTr ? exercise.nameTr : exercise.name) : pe.exerciseId;
      return {
        exerciseId: pe.exerciseId,
        exerciseName,
        orderInDay: pe.orderInDay,
        targetSets: pe.defaultSets,
        targetReps: pe.defaultReps,
        defaultRestSeconds: pe.defaultRestSeconds,
        sets: Array.from({ length: pe.defaultSets }, (_, i) => ({
          id: `${pe.id}-${i + 1}`,
          setNumber: i + 1,
          weight: 0,
          reps: 0,
          isWarmup: false,
          completed: false,
          restSeconds: pe.defaultRestSeconds,
        })),
        notes: pe.notes,
      };
    });

    startWorkout({
      workoutId: `local-${Date.now()}`,
      programId: program.id,
      programDayId: day.id,
      programDayName: isTr ? day.nameTr : day.name,
      startedAt: Date.now(),
      exercises: draftExercises,
      currentExerciseIndex: 0,
    });
    navigation.navigate('ActiveWorkout');
  };

  const isActiveProgram = activeProgramId === program.id;

  const onDeactivate = () => {
    if (!uid) return;
    Alert.alert(
      t('programs.deactivateProgram'),
      t('programs.deactivateConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('programs.deactivateProgram'),
          style: 'destructive',
          onPress: async () => {
            setDeactivating(true);
            try {
              await deactivateProgram(uid);
            } finally {
              setDeactivating(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen scroll padded withBottomInset>
      <View style={styles.titleRow}>
        <Text variant="title" style={styles.titleFlex}>
          {name}
        </Text>
        {isActiveProgram ? (
          <View
            style={[
              styles.activeBadge,
              { backgroundColor: theme.colors.success, borderRadius: theme.radius.full },
            ]}
          >
            <Text size="xs" weight="bold" color={theme.colors.primaryContrast}>
              {t('programs.activeBadge')}
            </Text>
          </View>
        ) : null}
      </View>
      <Text muted style={styles.description}>
        {desc}
      </Text>

      <View style={styles.chipsRow}>
        <Chip label={t('programs.frequency', { count: program.frequencyPerWeek })} />
        <Chip label={t('programs.duration', { count: program.durationWeeks })} />
        <Chip label={t(`onboarding.experience${capitalize(program.level)}`)} />
      </View>

      {/* Programa abone ol CTA */}
      <Button
        title={
          isActiveProgram
            ? t('dashboard.changeProgram')
            : t('programs.selectThisProgram')
        }
        onPress={() => navigation.navigate('ProgramSchedule', { programId: program.id })}
        style={styles.ctaBtn}
      />

      {isActiveProgram ? (
        <Button
          variant="ghost"
          title={t('programs.deactivateProgram')}
          onPress={onDeactivate}
          loading={deactivating}
          style={styles.deactivateBtn}
        />
      ) : null}

      <View style={styles.daysSection}>
        <Text variant="label" muted style={styles.sectionLabel}>
          {t('programs.days')} ({bundle.days.length})
        </Text>
        {bundle.days.map((day) => {
          const dayExercises = bundle.exercises
            .filter((e) => e.programDayId === day.id)
            .sort((a, b) => a.orderInDay - b.orderInDay);
          return (
            <Card key={day.id} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text variant="heading">{isTr ? day.nameTr : day.name}</Text>
                <Button
                  size="sm"
                  fullWidth={false}
                  title={t('common.start')}
                  onPress={() => startProgramDay(day)}
                />
              </View>
              <View style={styles.exerciseList}>
                {dayExercises.map((pe) => {
                  const ex = exercisesById[pe.exerciseId];
                  return (
                    <View key={pe.id} style={styles.exerciseRow}>
                      <View style={styles.exerciseInfo}>
                        <Text>
                          {ex ? (isTr ? ex.nameTr : ex.name) : pe.exerciseId}
                        </Text>
                        <Text variant="caption" muted>
                          {pe.defaultSets} × {pe.defaultReps}
                        </Text>
                      </View>
                      <Text variant="caption" muted>
                        {pe.defaultRestSeconds}s
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleFlex: {
    flex: 1,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ctaBtn: {
    marginBottom: 8,
  },
  deactivateBtn: {
    marginBottom: 24,
  },
  description: {
    marginTop: 4,
    marginBottom: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 24,
  },
  daysSection: {
    gap: 12,
  },
  sectionLabel: {
    marginBottom: 4,
  },
  dayCard: {
    gap: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseList: {
    gap: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  exerciseInfo: {
    flex: 1,
  },
});
