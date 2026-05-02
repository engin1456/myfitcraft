import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';

import { Screen, Text, Card, Button } from '@/components/ui';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useActiveWorkoutStore } from '@/stores/activeWorkout.store';
import { useAuthStore } from '@/stores/auth.store';
import { isFirebaseConfigured } from '@/services/firebase';
import { finishWorkout } from '@/services/workouts.service';
import { fetchLastLogsForExercise } from '@/services/workouts.service';
import { SetRow } from '@/components/workout/SetRow';
import { RestTimer } from '@/components/workout/RestTimer';
import type { DraftSet, WorkoutLog } from '@/types/models';

export function ActiveWorkoutScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  useKeepAwake();

  const active = useActiveWorkoutStore((s) => s.active);
  const updateSet = useActiveWorkoutStore((s) => s.updateSet);
  const addSet = useActiveWorkoutStore((s) => s.addSet);
  const removeSet = useActiveWorkoutStore((s) => s.removeSet);
  const setCurrentExercise = useActiveWorkoutStore((s) => s.setCurrentExercise);
  const cancelWorkout = useActiveWorkoutStore((s) => s.cancelWorkout);
  const finish = useActiveWorkoutStore((s) => s.finishWorkout);
  const uid = useAuthStore((s) => s.uid);

  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previousByExercise, setPreviousByExercise] = useState<Record<string, WorkoutLog[]>>({});

  const elapsedRef = useRef<number>(0);
  const [, forceTick] = useState(0);

  // Süreyi her saniye tick'le
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      elapsedRef.current = Math.round((Date.now() - active.startedAt) / 1000);
      forceTick((n) => n + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [active]);

  // Geçen sefer karşılaştırması için son log'ları çek
  useEffect(() => {
    if (!active || !uid || !isFirebaseConfigured) return;
    let cancelled = false;
    (async () => {
      const map: Record<string, WorkoutLog[]> = {};
      for (const ex of active.exercises) {
        const logs = await fetchLastLogsForExercise(uid, ex.exerciseId, 1);
        if (cancelled) return;
        if (logs.length > 0) map[ex.exerciseId] = logs;
      }
      if (!cancelled) setPreviousByExercise(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [active, uid]);

  if (!active) {
    return (
      <Screen padded>
        <View style={styles.center}>
          <Text muted align="center">
            Aktif antrenman yok
          </Text>
          <Button
            title={t('common.back')}
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={styles.btnSmall}
          />
        </View>
      </Screen>
    );
  }

  const currentIndex = active.currentExerciseIndex;
  const exercise = active.exercises[currentIndex];

  const onToggleSet = (setId: string, idx: number, set: DraftSet) => {
    const newCompleted = !set.completed;
    updateSet(currentIndex, setId, { completed: newCompleted });
    if (newCompleted && set.restSeconds && set.restSeconds > 0) {
      setRestRemaining(set.restSeconds);
    }
  };

  /**
   * Egzersizler arası geçiş. Sadece sıradakine giderken kısa bir
   * "geçiş dinlenmesi" tetikle (hareketin defaultRestSeconds'una bağlı).
   */
  const goToExercise = (newIndex: number) => {
    if (newIndex === currentIndex) return;
    const nextEx = active.exercises[newIndex];
    setCurrentExercise(newIndex);

    // Sadece ileri giderken (yeni egzersize) dinlenme tetikle.
    // Geri dönüşte (önceki) tetikleme — kullanıcı sete bakmaya dönüyordur.
    if (newIndex > currentIndex && nextEx?.defaultRestSeconds) {
      // Tipik egzersiz değişim molası: hareketin default'undan biraz daha kısa,
      // veya en az 60 sn. Toparlanma + ekipman değişimi için.
      const transitionRest = Math.max(60, Math.min(nextEx.defaultRestSeconds, 120));
      setRestRemaining(transitionRest);
    }
  };

  const onAbandon = () => {
    Alert.alert(t('workout.abandonWorkout'), t('workout.abandonConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('workout.abandonWorkout'),
        style: 'destructive',
        onPress: () => {
          cancelWorkout();
          navigation.dispatch(CommonActions.goBack());
        },
      },
    ]);
  };

  const onFinish = async () => {
    const totalCompletedSets = active.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed && s.reps > 0).length,
      0,
    );
    if (totalCompletedSets === 0) {
      Alert.alert(t('workout.finishWorkout'), 'Tamamlanmis set yok');
      return;
    }

    if (!uid) {
      cancelWorkout();
      navigation.goBack();
      return;
    }

    setSubmitting(true);
    try {
      const result = await finishWorkout({ userId: uid, active });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      finish();
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: 'MainTabs' },
            { name: 'WorkoutSummary', params: { workoutId: result.workoutId } },
          ],
        }),
      );
    } catch {
      Alert.alert(t('common.appName'), t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const elapsed = elapsedRef.current;
  const elapsedLabel = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}`;

  const previousLogs = previousByExercise[exercise.exerciseId] ?? [];

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <View style={[styles.headerWrap, { paddingHorizontal: theme.spacing.lg }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text variant="caption" muted>
              {active.programDayName ?? t('workout.active')}
            </Text>
            <Text variant="title">{exercise.exerciseName}</Text>
          </View>
          <Pressable onPress={onAbandon} style={styles.abandonBtn}>
            <Text color={theme.colors.danger} weight="semibold">
              ×
            </Text>
          </Pressable>
        </View>
        <View style={styles.metaRow}>
          <Text variant="caption" muted>
            {t('workout.duration')}: {elapsedLabel}
          </Text>
          <Text variant="caption" muted>
            {currentIndex + 1} / {active.exercises.length}
          </Text>
        </View>
      </View>

      <FlatList
        data={exercise.sets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: theme.spacing.lg, paddingBottom: 240 },
        ]}
        ListHeaderComponent={
          <View style={styles.tableHeader}>
            <Text variant="caption" muted style={[styles.colSet]}>
              SET
            </Text>
            <Text variant="caption" muted style={styles.colPrev}>
              {t('workout.lastTime').toUpperCase()}
            </Text>
            <Text variant="caption" muted style={styles.colInput}>
              KG
            </Text>
            <Text variant="caption" muted style={styles.colInput}>
              {t('workout.reps').toUpperCase()}
            </Text>
            <View style={styles.colCheck} />
          </View>
        }
        renderItem={({ item, index }) => {
          const prev = previousLogs.find((l) => l.setNumber === item.setNumber);
          return (
            <SetRow
              set={item}
              onChange={(patch) => updateSet(currentIndex, item.id, patch)}
              onToggleComplete={() => onToggleSet(item.id, index, item)}
              onRemove={() => removeSet(currentIndex, item.id)}
              previousReps={prev?.reps}
              previousWeight={prev?.weight}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        ListFooterComponent={
          <View style={styles.footerActions}>
            <Button
              variant="ghost"
              size="sm"
              title={`+ ${t('workout.addSet')}`}
              onPress={() => addSet(currentIndex)}
            />
          </View>
        }
      />

      <View style={[styles.bottomBar, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <View style={styles.navRow}>
          <Button
            variant="ghost"
            size="sm"
            title={`‹ ${t('workout.previousExercise')}`}
            onPress={() => goToExercise(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            fullWidth={false}
          />
          <Button
            variant="ghost"
            size="sm"
            title={`${t('workout.nextExercise')} ›`}
            onPress={() =>
              goToExercise(Math.min(active.exercises.length - 1, currentIndex + 1))
            }
            disabled={currentIndex === active.exercises.length - 1}
            fullWidth={false}
          />
        </View>
        <Button
          title={t('workout.finishWorkout')}
          loading={submitting}
          onPress={onFinish}
        />
      </View>

      {restRemaining !== null ? (
        <RestTimer
          durationSeconds={restRemaining}
          onSkip={() => setRestRemaining(null)}
          onComplete={() => setRestRemaining(null)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSmall: {
    marginTop: 12,
  },
  headerWrap: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  abandonBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  colSet: {
    width: 32,
    textAlign: 'center',
  },
  colPrev: {
    width: 56,
    textAlign: 'center',
  },
  colInput: {
    flex: 1,
    textAlign: 'center',
  },
  colCheck: {
    width: 40,
  },
  footerActions: {
    marginTop: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 96,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});
