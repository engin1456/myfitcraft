import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Text } from '@/components/ui';

interface DataPoint {
  value: number;
  label?: string;
  timestamp: number;
}

interface Props {
  points: DataPoint[];
  unit?: string;
  title?: string;
}

/**
 * Basit zaman serisi line chart. Veriler kronolojik (eski->yeni) sirada beklenir.
 */
export function WeightChart({ points, unit = 'kg', title }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  if (points.length === 0) {
    return (
      <View style={styles.empty}>
        <Text muted align="center">
          Henüz veri yok
        </Text>
      </View>
    );
  }

  const data = points.map((p) => ({ value: p.value, label: p.label ?? '' }));
  const min = Math.min(...points.map((p) => p.value));
  const max = Math.max(...points.map((p) => p.value));
  const yAxisMin = Math.floor(min - (max - min) * 0.1 || 1);
  const yAxisMax = Math.ceil(max + (max - min) * 0.1 || 1);

  return (
    <View style={styles.container}>
      {title ? (
        <Text variant="label" muted style={styles.title}>
          {title}
        </Text>
      ) : null}
      <LineChart
        data={data}
        width={width - 64}
        height={180}
        spacing={Math.max(30, (width - 100) / Math.max(points.length - 1, 1))}
        thickness={2}
        color={theme.colors.primary}
        startFillColor={theme.colors.primary}
        endFillColor={theme.colors.primary}
        startOpacity={0.3}
        endOpacity={0.05}
        areaChart
        hideRules
        hideDataPoints={points.length > 12}
        dataPointsColor={theme.colors.primary}
        dataPointsRadius={4}
        yAxisColor="transparent"
        xAxisColor={theme.colors.border}
        yAxisTextStyle={{ color: theme.colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: theme.colors.textMuted, fontSize: 10 }}
        yAxisOffset={yAxisMin}
        maxValue={yAxisMax - yAxisMin}
        noOfSections={4}
        initialSpacing={10}
        endSpacing={10}
        adjustToWidth
      />
      <Text variant="caption" muted align="right" style={styles.unit}>
        {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  title: {
    marginLeft: 4,
  },
  empty: {
    paddingVertical: 32,
  },
  unit: {
    marginRight: 4,
  },
});
