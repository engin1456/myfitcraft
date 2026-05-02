import { Pressable, StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Text } from '@/components/ui';
import { muscleColor } from '@/constants/muscles';
import type { MuscleGroup } from '@/types/models';

export interface MuscleDistributionItem {
  muscle: MuscleGroup;
  sets: number;
  pct: number; // 0..100
}

interface Props {
  data: MuscleDistributionItem[];
  size?: number;
  /** Legend satırına basıldığında kas grubu kimliği döner — kullanıcı egzersiz listesine gider. */
  onMusclePress?: (muscle: MuscleGroup) => void;
}

/**
 * Kas grubu donut chart + altında okunabilir bir liste.
 * Sıfır veri durumunda placeholder gösterir.
 */
export function MuscleDistributionChart({ data, size = 160, onMusclePress }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (data.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text muted align="center">
          {t('reports.noData')}
        </Text>
      </View>
    );
  }

  // gifted-charts PieChart formatı
  const pieData = data.map((d) => ({
    value: d.pct,
    color: muscleColor(d.muscle),
  }));

  // En büyük dilim ortada vurgulansın
  const top = data[0];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <PieChart
          data={pieData}
          donut
          radius={size / 2}
          innerRadius={size / 2 - 22}
          innerCircleColor={theme.colors.surface}
          centerLabelComponent={() => (
            <View style={styles.center}>
              <Text variant="caption" muted>
                {t(`muscles.${top.muscle}`)}
              </Text>
              <Text variant="title">%{top.pct}</Text>
            </View>
          )}
        />
        <View style={styles.legend}>
          {data.slice(0, 6).map((d) => {
            const content = (
              <>
                <View
                  style={[styles.dot, { backgroundColor: muscleColor(d.muscle) }]}
                />
                <Text size="sm" style={styles.legendName} numberOfLines={1}>
                  {t(`muscles.${d.muscle}`)}
                </Text>
                <Text size="sm" weight="semibold" muted>
                  %{d.pct}
                </Text>
                {onMusclePress ? (
                  <Text size="sm" muted>
                    ›
                  </Text>
                ) : null}
              </>
            );
            return onMusclePress ? (
              <Pressable
                key={d.muscle}
                onPress={() => onMusclePress(d.muscle)}
                style={({ pressed }) => [
                  styles.legendRow,
                  styles.legendPressable,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                hitSlop={4}
              >
                {content}
              </Pressable>
            ) : (
              <View key={d.muscle} style={styles.legendRow}>
                {content}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 2,
  },
  legend: {
    flex: 1,
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendPressable: {
    paddingVertical: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    flex: 1,
  },
  emptyWrap: {
    paddingVertical: 32,
  },
});
