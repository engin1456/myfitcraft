import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Screen, Text, Card, Chip, CardSkeleton, EmptyState } from '@/components/ui';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuthStore } from '@/stores/auth.store';
import { useReportsStore } from '@/stores/reports.store';
import { useProgramsStore } from '@/stores/programs.store';
import { fetchExerciseById } from '@/services/exercises.service';
import { WeightChart } from '@/components/charts/WeightChart';
import { MuscleDistributionChart } from '@/components/charts/MuscleDistributionChart';
import { ConsistencyHeatmap } from '@/components/charts/ConsistencyHeatmap';
import { InsightCard } from '@/components/reports/InsightCard';
import {
  WeeklySummaryCard,
  type WeeklySummary,
} from '@/components/reports/WeeklySummaryCard';
import { BMICard } from '@/components/reports/BMICard';
import { TargetWeightCard } from '@/components/reports/TargetWeightCard';
import { formatDate, formatDuration, formatVolume } from '@/utils/format';
import { runInsights, type Insight } from '@/utils/insights';
import type {
  BodyMeasurement,
  Exercise,
  Locale,
  MuscleGroup,
  PersonalRecord,
} from '@/types/models';
import type {
  MainTabsParamList,
  RootStackParamList,
} from '@/app/navigation/types';

type RootNav = NativeStackNavigationProp<RootStackParamList>;
type TabNav = BottomTabNavigationProp<MainTabsParamList>;

type Range = 'week' | 'month' | '3month' | 'all';
type Tab = 'performance' | 'body';

const DAY_MS = 24 * 60 * 60 * 1000;

export function ReportsScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isTr = i18n.language === 'tr';
  const rootNav = useNavigation<RootNav>();
  const tabNav = useNavigation<TabNav>();

  const uid = useAuthStore((s) => s.uid);
  const profile = useAuthStore((s) => s.profile);
  const workouts = useReportsStore((s) => s.workouts);
  const logsByWorkout = useReportsStore((s) => s.logsByWorkout);
  const personalRecords = useReportsStore((s) => s.personalRecords);
  const measurements = useReportsStore((s) => s.measurements);
  const loaded = useReportsStore((s) => s.loaded);
  const loading = useReportsStore((s) => s.loading);
  const load = useReportsStore((s) => s.load);
  const presets = useProgramsStore((s) => s.presets);
  const myPrograms = useProgramsStore((s) => s.myPrograms);

  const [range, setRange] = useState<Range>('month');
  const [tab, setTab] = useState<Tab>('performance');
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise>>({});

  useEffect(() => {
    if (uid) load(uid);
  }, [uid, load]);

  const onRefresh = useCallback(() => {
    if (uid) load(uid);
  }, [uid, load]);

  // Tüm egzersiz id'lerini bir kerede çek (PR, kas dağılımı için lazım)
  useEffect(() => {
    let cancelled = false;
    const ids = new Set<string>();
    for (const pr of personalRecords) ids.add(pr.exerciseId);
    for (const list of Object.values(logsByWorkout)) {
      for (const l of list) ids.add(l.exerciseId);
    }
    if (ids.size === 0) return;
    Promise.all(Array.from(ids).map((id) => fetchExerciseById(id))).then((arr) => {
      if (cancelled) return;
      const map: Record<string, Exercise> = {};
      for (const e of arr) if (e) map[e.id] = e;
      setExerciseMap(map);
    });
    return () => {
      cancelled = true;
    };
  }, [personalRecords, logsByWorkout]);

  const rangeWindow = useMemo(() => {
    const now = Date.now();
    switch (range) {
      case 'week':
        return { cutoff: now - 7 * DAY_MS, days: 7 };
      case 'month':
        return { cutoff: now - 30 * DAY_MS, days: 30 };
      case '3month':
        return { cutoff: now - 90 * DAY_MS, days: 90 };
      case 'all':
        return { cutoff: 0, days: null };
    }
  }, [range]);

  const cutoff = rangeWindow.cutoff;

  const filteredWorkouts = useMemo(
    () => workouts.filter((w) => w.startedAt >= cutoff),
    [workouts, cutoff],
  );

  // Önceki dönem (delta için): aynı uzunlukta, cutoff'tan önce.
  const previousWorkouts = useMemo(() => {
    if (rangeWindow.days === null) return [];
    const prevStart = cutoff - rangeWindow.days * DAY_MS;
    return workouts.filter((w) => w.startedAt >= prevStart && w.startedAt < cutoff);
  }, [workouts, cutoff, rangeWindow]);

  // Aktif programı bul (preset veya kullanıcının kendi programı olabilir)
  const activeProgram = useMemo(() => {
    if (!profile?.activeProgramId) return null;
    const presetMatch = presets.find((b) => b.program.id === profile.activeProgramId);
    if (presetMatch) return presetMatch.program;
    return myPrograms.find((p) => p.id === profile.activeProgramId) ?? null;
  }, [profile?.activeProgramId, presets, myPrograms]);

  const insights = useMemo(
    () =>
      runInsights({
        profile,
        activeProgram,
        workouts,
        logsByWorkout,
        personalRecords,
        measurements,
        exerciseMap,
      }),
    [profile, activeProgram, workouts, logsByWorkout, personalRecords, measurements, exerciseMap],
  );

  // ───────── Aggregations ─────────
  const computeTotals = useCallback(
    (ws: typeof workouts) => {
      let totalVolume = 0;
      let totalSets = 0;
      let totalDuration = 0;
      let durationSamples = 0;
      for (const w of ws) {
        const logs = logsByWorkout[w.id] ?? [];
        for (const l of logs) {
          if (l.isWarmup) continue;
          totalVolume += l.weight * l.reps;
          totalSets += 1;
        }
        if (w.durationSeconds && w.durationSeconds > 0) {
          totalDuration += w.durationSeconds;
          durationSamples += 1;
        }
      }
      return {
        totalVolume,
        totalSets,
        totalWorkouts: ws.length,
        avgDuration: durationSamples > 0 ? Math.round(totalDuration / durationSamples) : 0,
      };
    },
    [logsByWorkout],
  );

  const totals = useMemo(() => computeTotals(filteredWorkouts), [computeTotals, filteredWorkouts]);
  const previousTotals = useMemo(
    () => computeTotals(previousWorkouts),
    [computeTotals, previousWorkouts],
  );

  /** İki dönem totals'u arasında yüzdelik delta (-100, +∞). null = previous 0 idi → karşılaştırma anlamsız. */
  const deltas = useMemo(() => {
    const calc = (curr: number, prev: number): number | null => {
      if (prev <= 0) return null;
      return Math.round(((curr - prev) / prev) * 100);
    };
    return {
      workouts: calc(totals.totalWorkouts, previousTotals.totalWorkouts),
      volume: calc(totals.totalVolume, previousTotals.totalVolume),
      sets: calc(totals.totalSets, previousTotals.totalSets),
      avgDuration: calc(totals.avgDuration, previousTotals.avgDuration),
    };
  }, [totals, previousTotals]);

  /** Bu hafta (Pazartesi 00:00 → Pazar 23:59) özeti — range'den bağımsız. */
  const weeklySummary: WeeklySummary = useMemo(() => {
    const now = new Date();
    const dow = now.getDay(); // 0=Pazar
    const diff = dow === 0 ? -6 : 1 - dow;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    const ts = weekStart.getTime();
    let workoutCnt = 0;
    let setCnt = 0;
    let volume = 0;
    for (const w of workouts) {
      if (w.status !== 'completed') continue;
      if ((w.completedAt ?? 0) < ts) continue;
      workoutCnt += 1;
      const logs = logsByWorkout[w.id] ?? [];
      for (const l of logs) {
        if (l.isWarmup) continue;
        setCnt += 1;
        volume += l.weight * l.reps;
      }
    }
    const prs = personalRecords.filter((p) => p.achievedAt >= ts).length;
    return { workouts: workoutCnt, sets: setCnt, volume, prs };
  }, [workouts, logsByWorkout, personalRecords]);

  // Hacim grafiği (günlük toplam)
  const volumePoints = useMemo(() => {
    const byDay: Record<string, number> = {};
    for (const w of filteredWorkouts.slice().reverse()) {
      const dayKey = formatDate(w.startedAt, 'yyyy-MM-dd', i18n.language as Locale);
      const logs = logsByWorkout[w.id] ?? [];
      const vol = logs.reduce((s, l) => s + (l.isWarmup ? 0 : l.weight * l.reps), 0);
      byDay[dayKey] = (byDay[dayKey] ?? 0) + vol;
    }
    return Object.entries(byDay).map(([day, vol]) => ({
      timestamp: new Date(day).getTime(),
      value: Math.round(vol),
      label: formatDate(new Date(day).getTime(), 'dd/MM', i18n.language as Locale),
    }));
  }, [filteredWorkouts, logsByWorkout, i18n.language]);

  // Kas grubu dağılımı (her zaman SON 30 GÜN — daha anlamlı sinyal)
  const muscleData = useMemo(() => {
    const since = Date.now() - 30 * DAY_MS;
    const counts: Partial<Record<MuscleGroup, number>> = {};
    let total = 0;
    for (const w of workouts) {
      if ((w.completedAt ?? 0) < since) continue;
      const logs = logsByWorkout[w.id] ?? [];
      for (const l of logs) {
        if (l.isWarmup) continue;
        const ex = exerciseMap[l.exerciseId];
        if (!ex) continue;
        counts[ex.primaryMuscle] = (counts[ex.primaryMuscle] ?? 0) + 1;
        total += 1;
      }
    }
    if (total === 0) return [];
    return (Object.entries(counts) as [MuscleGroup, number][])
      .map(([muscle, sets]) => ({
        muscle,
        sets,
        pct: Math.round((sets / total) * 100),
      }))
      .sort((a, b) => b.sets - a.sets);
  }, [workouts, logsByWorkout, exerciseMap]);

  // Tutarlılık ısı haritası için tamamlanmış antrenman timestamps
  const completedTimestamps = useMemo(
    () =>
      workouts
        .filter((w) => w.status === 'completed' && w.completedAt)
        .map((w) => w.completedAt as number),
    [workouts],
  );

  // PR'larda son 30 gün rozeti için pencere
  const recentPRThreshold = Date.now() - 30 * DAY_MS;

  // ───────── Vücut sekmesi verileri ─────────
  const sortedMeasurements = useMemo(
    () => measurements.slice().sort((a, b) => a.date - b.date),
    [measurements],
  );

  const weightSeries = useMemo(
    () =>
      sortedMeasurements
        .filter((m) => m.weight !== null)
        .map((m) => ({
          timestamp: m.date,
          value: m.weight as number,
          label: formatDate(m.date, 'dd/MM', i18n.language as Locale),
        })),
    [sortedMeasurements, i18n.language],
  );

  // 7-günlük yumuşatma — moving average
  const smoothedWeight = useMemo(() => {
    if (weightSeries.length === 0) return [];
    const out: typeof weightSeries = [];
    for (let i = 0; i < weightSeries.length; i++) {
      const window = weightSeries.slice(Math.max(0, i - 6), i + 1);
      const avg = window.reduce((s, p) => s + p.value, 0) / window.length;
      out.push({ ...weightSeries[i], value: Math.round(avg * 10) / 10 });
    }
    return out;
  }, [weightSeries]);

  /**
   * Haftalık değişim mantığı:
   * - En az 2 ölçüm + arada en az 3 gün gerek (yoksa 'insufficient')
   * - 7 gün geriye en yakın ölçümü taban al, son ölçümle farkı al
   * - Pencerede kalan gün sayısına göre normalize et (6 gün ara → orantıla)
   * Çıktı: { value, sufficient } veya null
   */
  const weeklyWeightChange = useMemo(() => {
    if (weightSeries.length < 2) return null;
    const newest = weightSeries[weightSeries.length - 1];
    const since = newest.timestamp - 7 * DAY_MS;
    const baseline =
      [...weightSeries].reverse().find((p) => p.timestamp <= since) ??
      weightSeries[0];
    const daysApart = (newest.timestamp - baseline.timestamp) / DAY_MS;
    if (daysApart < 3) return { value: null, sufficient: false };
    const rawDelta = newest.value - baseline.value;
    // ≤7 gün → ham fark; 7'den uzunsa haftalık orantıla
    const weekly = daysApart <= 7 ? rawDelta : (rawDelta / daysApart) * 7;
    return { value: Math.round(weekly * 10) / 10, sufficient: true };
  }, [weightSeries]);

  /**
   * Hedef tavsiyesi:
   * - sufficient değilse → null (vücut sekmesinde başka mesaj göstereceğiz)
   * - |delta| > 5 kg/hafta → 'anomaly' (büyük olasılıkla yanlış giriş)
   * - bulk + negatif veya cut + pozitif → 'wrongDirection'
   * - bulk: 0.1-0.5 sağlıklı; <0.1 yavaş; >0.5 hızlı
   * - cut: -1.0 ile -0.2 sağlıklı; >-0.2 yavaş; <-1.0 hızlı
   */
  // ───────── Etkileşim handler'ları ─────────

  const handleInsightAction = useCallback(
    (insight: Insight) => {
      const action = insight.action;
      if (!action) return;
      switch (action.route) {
        case 'Programs':
          tabNav.navigate('Programs');
          break;
        case 'Exercises': {
          const muscle = action.params?.initialMuscleFilter;
          tabNav.navigate(
            'Exercises',
            muscle ? { initialMuscleFilter: String(muscle) } : undefined,
          );
          break;
        }
        case 'Profile':
          tabNav.navigate('Profile');
          break;
        case 'AddMeasurement':
          rootNav.navigate('AddMeasurement');
          break;
        case 'Measurements':
          rootNav.navigate('Measurements');
          break;
        case 'ProgramDetail': {
          const programId = action.params?.programId;
          if (programId) {
            rootNav.navigate('ProgramDetail', { programId: String(programId) });
          }
          break;
        }
        case 'Reports':
        default:
          break;
      }
    },
    [rootNav, tabNav],
  );

  const handlePRPress = useCallback(
    (exerciseId: string) => {
      rootNav.navigate('ExerciseDetail', { exerciseId });
    },
    [rootNav],
  );

  const handleMusclePress = useCallback(
    (muscle: MuscleGroup) => {
      tabNav.navigate('Exercises', { initialMuscleFilter: muscle });
    },
    [tabNav],
  );

  const handleSetTargetWeight = useCallback(() => {
    tabNav.navigate('Profile');
  }, [tabNav]);

  const goalAdvice = useMemo(() => {
    const w = weeklyWeightChange;
    if (!w || !w.sufficient || w.value === null) return null;
    const goal = profile?.goal;
    if (!goal) return null;
    const v = w.value;
    if (Math.abs(v) > 5) {
      return { state: 'anomaly', color: theme.colors.danger };
    }
    if (goal === 'bulk') {
      if (v < 0) return { state: 'wrongDirection', color: theme.colors.warning };
      if (v > 0.5) return { state: 'tooFast', color: theme.colors.warning };
      if (v < 0.1) return { state: 'tooSlow', color: theme.colors.warning };
      return { state: 'healthyRange', color: theme.colors.success };
    }
    if (goal === 'cut') {
      if (v > 0) return { state: 'wrongDirection', color: theme.colors.warning };
      if (v < -1.0) return { state: 'tooFast', color: theme.colors.warning };
      if (v > -0.2) return { state: 'tooSlow', color: theme.colors.warning };
      return { state: 'healthyRange', color: theme.colors.success };
    }
    return null;
  }, [weeklyWeightChange, profile?.goal, theme]);

  return (
    <Screen
      scroll
      padded
      withBottomInset
      refreshing={loading && loaded}
      onRefresh={onRefresh}
    >
      <Text variant="title" style={styles.title}>
        {t('reports.title')}
      </Text>

      {/* Range chips */}
      <View style={styles.rangeRow}>
        <Chip label={t('reports.weekly')} selected={range === 'week'} onPress={() => setRange('week')} />
        <Chip label={t('reports.monthly')} selected={range === 'month'} onPress={() => setRange('month')} />
        <Chip label={t('reports.threeMonths')} selected={range === '3month'} onPress={() => setRange('3month')} />
        <Chip label={t('reports.all')} selected={range === 'all'} onPress={() => setRange('all')} />
      </View>

      {loading && !loaded ? (
        <View style={styles.skelWrap}>
          <CardSkeleton lines={2} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={2} />
        </View>
      ) : null}

      {/* Bu hafta özeti — range'den bağımsız, her zaman üstte */}
      <View style={styles.section}>
        <WeeklySummaryCard summary={weeklySummary} />
      </View>

      {/* Akıllı öneriler */}
      <View style={styles.section}>
        <Text variant="label" muted style={styles.sectionLabel}>
          {t('insights.title')}
        </Text>
        {insights.length === 0 ? (
          <Card>
            <Text muted align="center">
              {workouts.length === 0
                ? t('insights.needMoreData')
                : t('insights.allGood')}
            </Text>
          </Card>
        ) : (
          <View style={styles.insightList}>
            {insights.map((i) => (
              <InsightCard key={i.id} insight={i} onActionPress={handleInsightAction} />
            ))}
          </View>
        )}
      </View>

      {/* Sekmeler */}
      <View style={styles.tabRow}>
        <TabButton
          label={t('reports.tabPerformance')}
          active={tab === 'performance'}
          onPress={() => setTab('performance')}
        />
        <TabButton
          label={t('reports.tabBody')}
          active={tab === 'body'}
          onPress={() => setTab('body')}
        />
      </View>

      {tab === 'performance' ? (
        <PerformanceTab
          totals={totals}
          deltas={deltas}
          rangeKey={range}
          volumePoints={volumePoints}
          muscleData={muscleData}
          completedTimestamps={completedTimestamps}
          personalRecords={personalRecords}
          exerciseMap={exerciseMap}
          recentPRThreshold={recentPRThreshold}
          isTr={isTr}
          onPRPress={handlePRPress}
          onMusclePress={handleMusclePress}
        />
      ) : (
        <BodyTab
          weightSeries={weightSeries}
          smoothedWeight={smoothedWeight}
          weeklyWeightChange={weeklyWeightChange?.value ?? null}
          weeklyChangeSufficient={weeklyWeightChange?.sufficient ?? false}
          goalAdvice={goalAdvice}
          measurements={sortedMeasurements}
          locale={i18n.language as Locale}
          heightCm={profile?.height ?? null}
          currentWeight={
            sortedMeasurements
              .slice()
              .reverse()
              .find((m) => m.weight !== null)?.weight ?? profile?.weight ?? null
          }
          latestWaist={
            sortedMeasurements
              .slice()
              .reverse()
              .find((m) => m.waist !== null)?.waist ?? null
          }
          targetWeight={profile?.targetWeight ?? null}
          weeklyChangeForETA={weeklyWeightChange?.value ?? null}
          onSetTarget={handleSetTargetWeight}
        />
      )}
    </Screen>
  );
}

// ─── Sub components ────────────────────────────────────────────────────────

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tabBtn,
        {
          backgroundColor: active ? theme.colors.primary : 'transparent',
          borderColor: active ? theme.colors.primary : theme.colors.border,
          borderRadius: theme.radius.md,
        },
      ]}
      android_ripple={{ color: theme.colors.border }}
    >
      <Text
        size="sm"
        weight="semibold"
        align="center"
        color={active ? theme.colors.primaryContrast : theme.colors.text}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface PerformanceTabProps {
  totals: { totalWorkouts: number; totalVolume: number; totalSets: number; avgDuration: number };
  deltas: {
    workouts: number | null;
    volume: number | null;
    sets: number | null;
    avgDuration: number | null;
  };
  rangeKey: Range;
  volumePoints: { timestamp: number; value: number; label: string }[];
  muscleData: { muscle: MuscleGroup; sets: number; pct: number }[];
  completedTimestamps: number[];
  personalRecords: PersonalRecord[];
  exerciseMap: Record<string, Exercise>;
  recentPRThreshold: number;
  isTr: boolean;
  onPRPress: (exerciseId: string) => void;
  onMusclePress: (muscle: MuscleGroup) => void;
}

function PerformanceTab({
  totals,
  deltas,
  rangeKey,
  volumePoints,
  muscleData,
  completedTimestamps,
  personalRecords,
  exerciseMap,
  recentPRThreshold,
  isTr,
  onPRPress,
  onMusclePress,
}: PerformanceTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (completedTimestamps.length === 0) {
    return (
      <EmptyState
        iconName="pulse-outline"
        title={t('reports.noWorkouts')}
        description={t('reports.noWorkoutsDesc')}
      />
    );
  }

  return (
    <>
      {/* 4 KPI (önceki döneme göre delta gösterilir, "all" için delta yok) */}
      <View style={styles.kpiGrid}>
        <KPI
          label={t('reports.kpiWorkouts')}
          value={String(totals.totalWorkouts)}
          delta={rangeKey === 'all' ? null : deltas.workouts}
        />
        <KPI
          label={t('reports.kpiVolume')}
          value={formatVolume(totals.totalVolume)}
          delta={rangeKey === 'all' ? null : deltas.volume}
        />
        <KPI
          label={t('reports.kpiSets')}
          value={String(totals.totalSets)}
          delta={rangeKey === 'all' ? null : deltas.sets}
        />
        <KPI
          label={t('reports.kpiAvgDuration')}
          value={totals.avgDuration > 0 ? formatDuration(totals.avgDuration) : '—'}
          delta={rangeKey === 'all' ? null : deltas.avgDuration}
        />
      </View>

      {/* Hacim grafiği */}
      {volumePoints.length >= 2 ? (
        <View style={styles.section}>
          <Text variant="label" muted style={styles.sectionLabel}>
            {t('workout.totalVolume')}
          </Text>
          <Card>
            <WeightChart points={volumePoints} unit="kg" />
          </Card>
        </View>
      ) : null}

      {/* Kas grubu dağılımı */}
      <View style={styles.section}>
        <Text variant="label" muted style={styles.sectionLabel}>
          {t('reports.muscleDistribution')}
        </Text>
        <Card>
          <Text variant="caption" muted style={styles.cardCaption}>
            {t('reports.muscleDistributionHint', { days: 30 })}
          </Text>
          <MuscleDistributionChart data={muscleData} onMusclePress={onMusclePress} />
        </Card>
      </View>

      {/* Tutarlılık ısı haritası */}
      <View style={styles.section}>
        <Text variant="label" muted style={styles.sectionLabel}>
          {t('reports.consistency')}
        </Text>
        <Card>
          <ConsistencyHeatmap workoutTimestamps={completedTimestamps} />
        </Card>
      </View>

      {/* PR listesi */}
      <View style={styles.section}>
        <Text variant="label" muted style={styles.sectionLabel}>
          {t('reports.personalRecords')}
        </Text>
        {personalRecords.length === 0 ? (
          <Card>
            <Text muted align="center">
              {t('reports.noData')}
            </Text>
          </Card>
        ) : (
          <View style={styles.prList}>
            {personalRecords
              .slice()
              .sort((a, b) => b.estimated1RM - a.estimated1RM)
              .map((pr) => {
                const ex = exerciseMap[pr.exerciseId];
                const name = ex ? (isTr ? ex.nameTr : ex.name) : pr.exerciseId;
                const isRecent = pr.achievedAt >= recentPRThreshold;
                return (
                  <Card
                    key={pr.id}
                    style={styles.prCard}
                    onPress={() => onPRPress(pr.exerciseId)}
                  >
                    <View style={styles.prRow}>
                      <View style={styles.prLeft}>
                        <View style={styles.prTitleRow}>
                          <Text weight="semibold" numberOfLines={1} style={{ flex: 1 }}>
                            {name}
                          </Text>
                          {isRecent ? (
                            <View
                              style={[
                                styles.recentBadge,
                                { backgroundColor: theme.colors.success },
                              ]}
                            >
                              <Text size="xs" weight="bold" color={theme.colors.primaryContrast}>
                                {t('reports.prRecent')}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text variant="caption" muted>
                          {pr.weight} kg × {pr.reps} {t('common.reps')}
                        </Text>
                      </View>
                      <View style={styles.prRight}>
                        <Text variant="caption" muted>
                          1RM ~
                        </Text>
                        <Text weight="bold" color={theme.colors.primary}>
                          {pr.estimated1RM} kg
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
          </View>
        )}
      </View>
    </>
  );
}

interface BodyTabProps {
  weightSeries: { timestamp: number; value: number; label: string }[];
  smoothedWeight: { timestamp: number; value: number; label: string }[];
  weeklyWeightChange: number | null;
  weeklyChangeSufficient: boolean;
  goalAdvice: { state: string; color: string } | null;
  measurements: BodyMeasurement[];
  locale: Locale;
  heightCm: number | null;
  currentWeight: number | null;
  latestWaist: number | null;
  targetWeight: number | null;
  weeklyChangeForETA: number | null;
  onSetTarget: () => void;
}

function BodyTab({
  weightSeries,
  smoothedWeight,
  weeklyWeightChange,
  weeklyChangeSufficient,
  goalAdvice,
  measurements,
  locale,
  heightCm,
  currentWeight,
  latestWaist,
  targetWeight,
  weeklyChangeForETA,
  onSetTarget,
}: BodyTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  // Hedef kilo + BMI kartları, ölçüm yoksa bile gösterilir (profile verisinden)
  const renderHealthCards = () => (
    <>
      <View style={styles.section}>
        <TargetWeightCard
          currentWeight={currentWeight}
          targetWeight={targetWeight}
          weeklyChangeKg={weeklyChangeForETA}
          locale={locale}
          onPressSetTarget={onSetTarget}
        />
      </View>
      <View style={styles.section}>
        <BMICard heightCm={heightCm} weightKg={currentWeight} waistCm={latestWaist} />
      </View>
    </>
  );

  if (measurements.length === 0) {
    return (
      <>
        {renderHealthCards()}
        <EmptyState
          iconName="stats-chart-outline"
          title={t('reports.noMeasurements')}
          description={t('measurements.noMeasurementsCta')}
        />
      </>
    );
  }

  const isAnomaly = goalAdvice?.state === 'anomaly';

  const seriesByMetric = (() => {
    type Key = 'chest' | 'waist' | 'arm' | 'thigh';
    const labels: Record<Key, string> = {
      chest: t('measurements.chest'),
      waist: t('measurements.waist'),
      arm: t('measurements.arm'),
      thigh: t('measurements.thigh'),
    };
    const out: { key: Key; label: string; points: typeof weightSeries }[] = [];
    (['chest', 'waist', 'arm', 'thigh'] as Key[]).forEach((k) => {
      const pts = measurements
        .filter((m) => m[k] !== null)
        .map((m) => ({
          timestamp: m.date,
          value: m[k] as number,
          label: formatDate(m.date, 'dd/MM', locale),
        }));
      if (pts.length >= 2) out.push({ key: k, label: labels[k], points: pts });
    });
    return out;
  })();

  return (
    <>
      {renderHealthCards()}

      {/* Goal / haftalık değişim kartı */}
      {!weeklyChangeSufficient ? (
        <Card style={styles.goalCard}>
          <Text variant="caption" muted>
            {t('reports.weeklyChange')}
          </Text>
          <Text muted>{t('reports.needMoreMeasurements')}</Text>
        </Card>
      ) : isAnomaly ? (
        <Card
          style={[
            styles.goalCard,
            { borderLeftColor: theme.colors.danger, borderLeftWidth: 3 },
          ]}
        >
          <Text variant="caption" muted>
            {t('reports.weeklyChange')}
          </Text>
          <View style={styles.goalRow}>
            <Text variant="title" color={theme.colors.danger}>
              {weeklyWeightChange! > 0 ? '+' : ''}
              {weeklyWeightChange} kg
            </Text>
            <View
              style={[
                styles.goalPill,
                { backgroundColor: theme.colors.danger + '20' },
              ]}
            >
              <Text size="sm" weight="semibold" color={theme.colors.danger}>
                {t('reports.anomaly')}
              </Text>
            </View>
          </View>
          <Text variant="caption" muted style={styles.cardCaption}>
            {t('reports.anomalyHint')}
          </Text>
        </Card>
      ) : goalAdvice ? (
        <Card
          style={[styles.goalCard, { borderLeftColor: goalAdvice.color, borderLeftWidth: 3 }]}
        >
          <Text variant="caption" muted>
            {t('reports.weeklyChange')}
          </Text>
          <View style={styles.goalRow}>
            <Text variant="title">
              {weeklyWeightChange! > 0 ? '+' : ''}
              {weeklyWeightChange} kg
            </Text>
            <View
              style={[styles.goalPill, { backgroundColor: goalAdvice.color + '20' }]}
            >
              <Text size="sm" weight="semibold" color={goalAdvice.color}>
                {t(`reports.${goalAdvice.state}`)}
              </Text>
            </View>
          </View>
        </Card>
      ) : weeklyWeightChange !== null ? (
        // Hedef yoksa (maintain veya null) sadece değişimi göster
        <Card style={styles.goalCard}>
          <Text variant="caption" muted>
            {t('reports.weeklyChange')}
          </Text>
          <Text variant="title">
            {weeklyWeightChange > 0 ? '+' : ''}
            {weeklyWeightChange} kg
          </Text>
        </Card>
      ) : null}

      {/* Kilo + smoothed */}
      {weightSeries.length >= 2 ? (
        <View style={styles.section}>
          <Text variant="label" muted style={styles.sectionLabel}>
            {t('reports.weightProgress')}
          </Text>
          <Card>
            <WeightChart points={smoothedWeight} unit="kg" title={t('reports.smoothed7d')} />
          </Card>
        </View>
      ) : (
        <Card style={styles.emptyCard}>
          <Text muted align="center">
            {t('reports.noData')}
          </Text>
        </Card>
      )}

      {/* Diğer ölçüler */}
      {seriesByMetric.length > 0 ? (
        <View style={styles.section}>
          <Text variant="label" muted style={styles.sectionLabel}>
            {t('reports.bodyMetrics')}
          </Text>
          {seriesByMetric.map((s) => (
            <Card key={s.key} style={styles.metricCard}>
              <Text variant="label" muted style={styles.cardCaption}>
                {s.label}
              </Text>
              <WeightChart points={s.points} unit="cm" />
            </Card>
          ))}
        </View>
      ) : null}

      {/* Vücut yağı */}
      {(() => {
        const bf = measurements
          .filter((m) => m.bodyFatPct !== null)
          .map((m) => ({
            timestamp: m.date,
            value: m.bodyFatPct as number,
            label: formatDate(m.date, 'dd/MM', locale),
          }));
        if (bf.length < 2) return null;
        return (
          <View style={styles.section}>
            <Text variant="label" muted style={styles.sectionLabel}>
              {t('measurements.bodyFat')}
            </Text>
            <Card>
              <WeightChart points={bf} unit="%" />
            </Card>
          </View>
        );
      })()}
    </>
  );
}

function KPI({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: number | null;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  let deltaColor = theme.colors.textMuted;
  let deltaText: string | null = null;
  if (delta !== null && delta !== undefined) {
    if (delta > 0) {
      deltaColor = theme.colors.success;
      deltaText = t('reports.deltaUp', { pct: delta });
    } else if (delta < 0) {
      deltaColor = theme.colors.danger;
      deltaText = t('reports.deltaDown', { pct: Math.abs(delta) });
    } else {
      deltaText = t('reports.deltaSame');
    }
  }

  return (
    <Card style={styles.kpiCard}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text variant="heading">{value}</Text>
      {deltaText ? (
        <Text size="xs" weight="semibold" color={deltaColor}>
          {deltaText}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 12,
  },
  rangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  loaderWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  skelWrap: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
    gap: 8,
  },
  sectionLabel: {
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  insightList: {
    gap: 8,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: 2,
    padding: 12,
  },
  cardCaption: {
    marginBottom: 8,
  },
  prList: {
    gap: 8,
  },
  prCard: {
    padding: 12,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  prLeft: {
    flex: 1,
    gap: 2,
  },
  prRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  prTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyCard: {
    paddingVertical: 32,
    marginBottom: 16,
  },
  goalCard: {
    padding: 16,
    marginBottom: 20,
    gap: 4,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metricCard: {
    padding: 12,
    marginBottom: 8,
  },
});
