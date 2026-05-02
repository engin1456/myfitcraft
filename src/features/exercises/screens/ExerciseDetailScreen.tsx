import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen, Text, Card, Chip } from '@/components/ui';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ExerciseImage } from '@/components/exercise/ExerciseImage';
import { WeightChart } from '@/components/charts/WeightChart';
import { fetchExerciseById } from '@/services/exercises.service';
import { fetchLastLogsForExercise } from '@/services/workouts.service';
import { muscleColor } from '@/constants/muscles';
import { useAuthStore } from '@/stores/auth.store';
import { estimate1RM } from '@/utils/calculations';
import { formatDate } from '@/utils/format';
import type { Exercise, Locale, WorkoutLog } from '@/types/models';
import type { RootStackScreenProps } from '@/app/navigation/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_SIZE = Math.min(SCREEN_WIDTH - 32, 360);

export function ExerciseDetailScreen({ route }: RootStackScreenProps<'ExerciseDetail'>) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isTr = i18n.language === 'tr';

  const uid = useAuthStore((s) => s.uid);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentFrame, setCurrentFrame] = useState<0 | 1>(0);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchExerciseById(route.params.exerciseId).then((ex) => {
      if (!cancelled) {
        setExercise(ex);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [route.params.exerciseId]);

  // Kullanıcının bu egzersizdeki geçmiş loglarını çek (1RM trend grafiği için)
  useEffect(() => {
    let cancelled = false;
    if (!uid) return;
    fetchLastLogsForExercise(uid, route.params.exerciseId, 50).then((arr) => {
      if (!cancelled) setLogs(arr);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, route.params.exerciseId]);

  /**
   * Logları haftaya göre grupla, her hafta için **maksimum tahmini 1RM** noktası üret.
   * (Brzycki formülü kullanılır.)
   * En az 2 farklı haftada veri varsa grafik gösterilir.
   */
  const oneRMTrend = useMemo(() => {
    if (logs.length === 0) return [];
    const byWeek: Record<number, number> = {};
    for (const l of logs) {
      if (l.isWarmup || l.reps <= 0 || l.weight <= 0) continue;
      const d = new Date(l.completedAt);
      const dow = d.getDay() === 0 ? 7 : d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - (dow - 1));
      monday.setHours(0, 0, 0, 0);
      const wk = monday.getTime();
      const e1 = estimate1RM(l.weight, l.reps);
      byWeek[wk] = Math.max(byWeek[wk] ?? 0, e1);
    }
    return Object.entries(byWeek)
      .map(([wk, v]) => ({
        timestamp: Number(wk),
        value: Math.round(v * 10) / 10,
        label: formatDate(Number(wk), 'dd/MM', i18n.language as Locale),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [logs, i18n.language]);

  if (loading) {
    return (
      <Screen padded>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen padded>
        <Text muted align="center">
          {t('exercises.noResults')}
        </Text>
      </Screen>
    );
  }

  const displayName = isTr ? exercise.nameTr : exercise.name;

  // İçerik dile göre seç. TR override yoksa fallback olarak EN göster + uyarı.
  const hasTrInstructions =
    isTr && exercise.instructionStepsTr.length > 0 &&
    exercise.instructionStepsTr.some(
      (step, i) => step !== exercise.instructionSteps[i],
    );
  const hasTrTips = isTr && exercise.tipsTr.length > 0;
  const showTranslationPending = isTr && !hasTrInstructions;

  const steps = isTr && hasTrInstructions ? exercise.instructionStepsTr : exercise.instructionSteps;
  const tips = isTr && hasTrTips ? exercise.tipsTr : exercise.tips;

  const hasBothFrames = Boolean(
    exercise.imageUrl && exercise.animationUrl && exercise.imageUrl !== exercise.animationUrl,
  );

  return (
    <Screen scroll padded>
      {/* Hero görsel + frame label */}
      <View style={styles.heroWrap}>
        <View
          style={[
            styles.heroFrame,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <ExerciseImage
            imageUrl={exercise.imageUrl}
            animationUrl={exercise.animationUrl}
            primaryMuscle={exercise.primaryMuscle}
            size={HERO_SIZE}
            animated
            animationIntervalMs={1100}
            onFrameChange={setCurrentFrame}
          />
        </View>

        {hasBothFrames ? (
          <View style={styles.frameIndicatorRow}>
            <FrameDot active={currentFrame === 0} color={theme.colors.primary} />
            <FrameDot active={currentFrame === 1} color={theme.colors.primary} />
            <Text variant="caption" muted style={styles.frameLabel}>
              {currentFrame === 0 ? t('exercises.startPosition') : t('exercises.endPosition')}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Başlık */}
      <Text variant="title" style={styles.name}>
        {displayName}
      </Text>

      {/* Kas grupları + ekipman chip'leri */}
      <View style={styles.chipsRow}>
        <Chip
          label={t(`muscles.${exercise.primaryMuscle}`)}
          selected
          color={muscleColor(exercise.primaryMuscle)}
        />
        <Chip label={t(`equipment.${exercise.equipment}`)} />
        {exercise.isCompound ? <Chip label="Compound" /> : null}
      </View>

      {exercise.secondaryMuscles.length > 0 ? (
        <View style={styles.section}>
          <Text variant="label" muted>
            {t('exercises.secondaryMuscles')}
          </Text>
          <View style={styles.chipsRow}>
            {exercise.secondaryMuscles.map((m) => (
              <Chip key={m} label={t(`muscles.${m}`)} color={muscleColor(m)} />
            ))}
          </View>
        </View>
      ) : null}

      {/* TR çevirisi yoksa uyarı */}
      {showTranslationPending ? (
        <Card
          style={[
            styles.warningCard,
            { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.warning },
          ]}
        >
          <Text size="sm" muted>
            ⚠ {t('exercises.translationPending')}
          </Text>
        </Card>
      ) : null}

      {/* AI çeviri rozeti */}
      {exercise.isAutoTranslated && !showTranslationPending ? (
        <Card
          style={[
            styles.warningCard,
            { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
          ]}
        >
          <Text size="sm" muted>
            ⚡ {t('exercises.autoTranslated')} — {t('exercises.autoTranslatedHint')}
          </Text>
        </Card>
      ) : null}

      {/* Nasıl Yapılır */}
      <View style={styles.section}>
        <Text variant="label" weight="bold" style={styles.sectionTitle}>
          {t('exercises.instructions')}
        </Text>
        <Card>
          {steps.map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <View
                style={[
                  styles.stepNumber,
                  { backgroundColor: theme.colors.primary, borderRadius: 14 },
                ]}
              >
                <Text size="sm" weight="bold" color={theme.colors.primaryContrast}>
                  {idx + 1}
                </Text>
              </View>
              <Text style={styles.stepText} size="md">
                {step}
              </Text>
            </View>
          ))}
        </Card>
      </View>

      {/* İpuçları & Yaygın Hatalar */}
      {tips.length > 0 ? (
        <View style={styles.section}>
          <Text variant="label" weight="bold" style={styles.sectionTitle}>
            {t('exercises.tips')}
          </Text>
          <Card>
            {tips.map((tip, idx) => (
              <View key={idx} style={styles.tipRow}>
                <Text color={theme.colors.primary} weight="bold" size="md">
                  ▸
                </Text>
                <Text style={styles.tipText} size="md">
                  {tip}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {/* Senin 1RM trendin (sadece kullanıcının bu egzersizde geçmişi varsa) */}
      {oneRMTrend.length >= 2 ? (
        <View style={styles.section}>
          <Text variant="label" weight="bold" style={styles.sectionTitle}>
            {t('reports.exerciseTrend')}
          </Text>
          <Card>
            <Text variant="caption" muted style={styles.tipText}>
              {t('reports.exerciseTrendHint')}
            </Text>
            <WeightChart points={oneRMTrend} unit="kg" />
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

function FrameDot({ active, color }: { active: boolean; color: string }) {
  return (
    <View
      style={[
        styles.dot,
        {
          backgroundColor: active ? color : 'transparent',
          borderColor: color,
          borderWidth: 1.5,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  heroFrame: {
    padding: 12,
  },
  frameIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  frameLabel: {
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  section: {
    marginTop: 24,
    gap: 10,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  warningCard: {
    marginTop: 16,
    borderWidth: 1,
    padding: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    lineHeight: 22,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    lineHeight: 22,
  },
});
