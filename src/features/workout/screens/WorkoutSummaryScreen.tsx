import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, CommonActions } from '@react-navigation/native';

import { Screen, Text, Card, Button } from '@/components/ui';
import { useTheme } from '@/app/providers/ThemeProvider';
import { fetchExerciseById } from '@/services/exercises.service';
import { fetchWorkoutLogs } from '@/services/workouts.service';
import { formatDuration, formatVolume } from '@/utils/format';
import type { Exercise, WorkoutLog } from '@/types/models';
import type { RootStackScreenProps } from '@/app/navigation/types';

interface ExerciseSummary {
  exerciseId: string;
  name: string;
  sets: number;
  topWeight: number;
  totalReps: number;
  volume: number;
}

export function WorkoutSummaryScreen({ route }: RootStackScreenProps<'WorkoutSummary'>) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const isTr = i18n.language === 'tr';

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const fetchedLogs = await fetchWorkoutLogs(route.params.workoutId);
      if (cancelled) return;
      setLogs(fetchedLogs);
      const ids = Array.from(new Set(fetchedLogs.map((l) => l.exerciseId)));
      const exs = await Promise.all(ids.map((id) => fetchExerciseById(id)));
      if (cancelled) return;
      const map: Record<string, Exercise> = {};
      for (const e of exs) if (e) map[e.id] = e;
      setExerciseMap(map);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [route.params.workoutId]);

  if (loading) {
    return (
      <Screen padded>
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (logs.length === 0) {
    return (
      <Screen padded>
        <Text muted align="center">
          {t('reports.noData')}
        </Text>
      </Screen>
    );
  }

  // Aggregations
  const summaries: ExerciseSummary[] = Object.values(
    logs.reduce<Record<string, ExerciseSummary>>((acc, log) => {
      const ex = exerciseMap[log.exerciseId];
      const name = ex ? (isTr ? ex.nameTr : ex.name) : log.exerciseId;
      const cur = acc[log.exerciseId] ?? {
        exerciseId: log.exerciseId,
        name,
        sets: 0,
        topWeight: 0,
        totalReps: 0,
        volume: 0,
      };
      cur.sets += 1;
      cur.topWeight = Math.max(cur.topWeight, log.weight);
      cur.totalReps += log.reps;
      cur.volume += log.weight * log.reps;
      acc[log.exerciseId] = cur;
      return acc;
    }, {}),
  );

  const totalVolume = summaries.reduce((s, e) => s + e.volume, 0);
  const totalSets = summaries.reduce((s, e) => s + e.sets, 0);

  const onDone = () => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }),
    );
  };

  return (
    <Screen scroll padded>
      <View style={styles.heroWrap}>
        <View style={[styles.successBadge, { backgroundColor: theme.colors.success, borderRadius: 36 }]}>
          <Text variant="title" color="#fff">
            ✓
          </Text>
        </View>
        <Text variant="title" align="center" style={styles.heroTitle}>
          {t('workout.summary')}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text variant="caption" muted>
            {t('workout.totalVolume')}
          </Text>
          <Text variant="title">{formatVolume(totalVolume)}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text variant="caption" muted>
            {t('common.set')}
          </Text>
          <Text variant="title">{totalSets}</Text>
        </Card>
      </View>

      <View style={styles.list}>
        {summaries.map((s) => (
          <Card key={s.exerciseId} style={styles.exerciseCard}>
            <Text weight="semibold">{s.name}</Text>
            <Text variant="caption" muted>
              {s.sets} set · {s.totalReps} {t('common.reps')} · top {s.topWeight} {t('common.kg')}
            </Text>
          </Card>
        ))}
      </View>

      <Button title={t('common.done')} onPress={onDone} style={styles.btn} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  successBadge: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    gap: 4,
  },
  list: {
    gap: 8,
  },
  exerciseCard: {
    gap: 4,
  },
  btn: {
    marginTop: 24,
  },
});
