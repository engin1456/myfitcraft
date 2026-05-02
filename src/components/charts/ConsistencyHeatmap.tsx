import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Text } from '@/components/ui';

interface Props {
  /** completedAt timestamps (ms). */
  workoutTimestamps: number[];
  weeks?: number; // default 12
  cellSize?: number; // default 14
  cellGap?: number; // default 4
}

/**
 * GitHub-style heatmap: 12 hafta × 7 gün grid.
 * Her hücre o gün antrenman yapıldıysa primary renk, yapılmadıysa surfaceElevated.
 * Bugünden geriye doğru sayar; en sol sütun = en eski hafta.
 */
export function ConsistencyHeatmap({
  workoutTimestamps,
  weeks = 12,
  cellSize = 14,
  cellGap = 4,
}: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const grid = useMemo(() => {
    const day = 24 * 60 * 60 * 1000;

    // Bugünün gün başlangıcı
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Bugünün haftadaki sırası: 1 (Pzt) ... 7 (Pzr)
    const dow = today.getDay() === 0 ? 7 : today.getDay();

    // Bu haftanın Pazartesi'si
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow - 1));

    // Setlere koy: dayKey (yyyy-mm-dd) → true
    const trained = new Set<string>();
    for (const ts of workoutTimestamps) {
      const d = new Date(ts);
      d.setHours(0, 0, 0, 0);
      trained.add(d.toISOString().slice(0, 10));
    }

    // weeks sütun, 7 satır
    const cols: { key: string; days: { key: string; trained: boolean; future: boolean }[] }[] = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const weekStart = new Date(monday.getTime() - w * 7 * day);
      const days: { key: string; trained: boolean; future: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const cell = new Date(weekStart.getTime() + d * day);
        const k = cell.toISOString().slice(0, 10);
        const future = cell.getTime() > today.getTime();
        days.push({ key: k, trained: trained.has(k), future });
      }
      cols.push({ key: weekStart.toISOString().slice(0, 10), days });
    }
    return cols;
  }, [workoutTimestamps, weeks]);

  const totalWorkouts = workoutTimestamps.length;
  const trainingDays = useMemo(
    () => new Set(workoutTimestamps.map((t) => new Date(t).toISOString().slice(0, 10))).size,
    [workoutTimestamps],
  );

  // Haftanın gün etiketleri (kısa) — Pzt, Çar, Cum
  const dayLabels = i18n.language === 'tr' ? ['Pzt', 'Çar', 'Cum'] : ['Mon', 'Wed', 'Fri'];

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text variant="caption" muted>
            {t('reports.totalWorkoutsLabel')}
          </Text>
          <Text variant="heading">{totalWorkouts}</Text>
        </View>
        <View style={styles.stat}>
          <Text variant="caption" muted>
            {t('reports.trainingDaysLabel')}
          </Text>
          <Text variant="heading">{trainingDays}</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={[styles.dayLabels, { gap: cellGap }]}>
          {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
            <View key={idx} style={{ height: cellSize, justifyContent: 'center' }}>
              {idx === 0 || idx === 2 || idx === 4 ? (
                <Text variant="caption" muted size="xs">
                  {idx === 0 ? dayLabels[0] : idx === 2 ? dayLabels[1] : dayLabels[2]}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
        <View style={[styles.grid, { gap: cellGap }]}>
          {grid.map((col) => (
            <View key={col.key} style={[styles.col, { gap: cellGap }]}>
              {col.days.map((cell) => (
                <View
                  key={cell.key}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: 3,
                    backgroundColor: cell.future
                      ? 'transparent'
                      : cell.trained
                        ? theme.colors.primary
                        : theme.colors.surfaceElevated,
                    borderWidth: cell.future ? 0 : 1,
                    borderColor: theme.colors.border,
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      <Text variant="caption" muted style={styles.hint}>
        {t('reports.consistencyHint')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: {
    gap: 2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  dayLabels: {
    paddingTop: 0,
  },
  grid: {
    flexDirection: 'row',
  },
  col: {
    flexDirection: 'column',
  },
  hint: {
    marginTop: 4,
  },
});
