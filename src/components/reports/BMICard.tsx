import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Card, Text } from '@/components/ui';
import { calculateBMI, calculateWaistHeightRatio } from '@/utils/health';

interface Props {
  heightCm: number | null | undefined;
  weightKg: number | null | undefined;
  waistCm?: number | null;
}

/**
 * BMI + Bel/Boy oranı tek kartta. Her ikisi de hesaplanabilir değilse kart yine
 * info text ile gösterilir.
 */
export function BMICard({ heightCm, weightKg, waistCm }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const bmi = calculateBMI(weightKg ?? 0, heightCm ?? 0);
  const wh = calculateWaistHeightRatio(waistCm ?? 0, heightCm ?? 0);

  const bmiColor = bmi ? bmiSeverityColor(bmi.category, theme) : theme.colors.textMuted;
  const whColor = wh ? whSeverityColor(wh.category, theme) : theme.colors.textMuted;

  return (
    <Card style={styles.card}>
      <Text variant="label" weight="bold" style={styles.title}>
        {t('reports.bmi')}
      </Text>
      <Text variant="caption" muted style={styles.hint}>
        {t('reports.bmiHint')}
      </Text>

      <View style={styles.row}>
        {bmi ? (
          <>
            <Text variant="heading" weight="bold">
              {bmi.value.toFixed(1)}
            </Text>
            <View style={[styles.badge, { backgroundColor: bmiColor + '20' }]}>
              <Text size="sm" weight="semibold" color={bmiColor}>
                {t(`reports.bmiCategory${capitalize(bmi.category)}`)}
              </Text>
            </View>
          </>
        ) : (
          <Text muted size="sm">
            {t('reports.bmiNoData')}
          </Text>
        )}
      </View>

      {/* Renkli BMI bar */}
      {bmi ? <BMIBar value={bmi.value} /> : null}

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <Text variant="label" weight="bold" style={styles.title}>
        {t('reports.waistHeight')}
      </Text>
      <Text variant="caption" muted style={styles.hint}>
        {t('reports.waistHeightHint')}
      </Text>
      <View style={styles.row}>
        {wh ? (
          <>
            <Text variant="heading" weight="bold">
              {wh.ratio.toFixed(2)}
            </Text>
            <View style={[styles.badge, { backgroundColor: whColor + '20' }]}>
              <Text size="sm" weight="semibold" color={whColor}>
                {t(`reports.waistHeight${capitalize(wh.category)}`)}
              </Text>
            </View>
          </>
        ) : (
          <Text muted size="sm">
            {t('reports.waistHeightNoData')}
          </Text>
        )}
      </View>
    </Card>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function bmiSeverityColor(
  c: ReturnType<typeof calculateBMI> extends infer T ? T extends { category: infer C } ? C : never : never | undefined,
  theme: ReturnType<typeof useTheme>,
): string {
  switch (c) {
    case 'normal':
      return theme.colors.success;
    case 'underweight':
    case 'overweight':
      return theme.colors.warning;
    case 'obese1':
    case 'obese2':
      return theme.colors.danger;
    default:
      return theme.colors.textMuted;
  }
}

function whSeverityColor(
  c: ReturnType<typeof calculateWaistHeightRatio> extends infer T ? T extends { category: infer C } ? C : never : never | undefined,
  theme: ReturnType<typeof useTheme>,
): string {
  switch (c) {
    case 'healthy':
      return theme.colors.success;
    case 'increased':
      return theme.colors.warning;
    case 'high':
    case 'veryHigh':
      return theme.colors.danger;
    default:
      return theme.colors.textMuted;
  }
}

/** 15-40 BMI aralığında konumlandıran ince bar. */
function BMIBar({ value }: { value: number }) {
  const theme = useTheme();
  // BMI ölçek kesimleri: 18.5 / 25 / 30 / 35
  // 15→0%, 40→100%
  const clamped = Math.max(15, Math.min(40, value));
  const pct = ((clamped - 15) / (40 - 15)) * 100;

  return (
    <View style={[styles.bar, { backgroundColor: theme.colors.border }]}>
      <View
        style={[
          styles.barSeg,
          { left: '0%', width: '14%', backgroundColor: theme.colors.warning + '80' },
        ]}
      />
      <View
        style={[
          styles.barSeg,
          { left: '14%', width: '26%', backgroundColor: theme.colors.success + '80' },
        ]}
      />
      <View
        style={[
          styles.barSeg,
          { left: '40%', width: '20%', backgroundColor: theme.colors.warning + '80' },
        ]}
      />
      <View
        style={[
          styles.barSeg,
          { left: '60%', width: '20%', backgroundColor: theme.colors.danger + '60' },
        ]}
      />
      <View
        style={[
          styles.barSeg,
          { left: '80%', width: '20%', backgroundColor: theme.colors.danger + '90' },
        ]}
      />
      {/* marker */}
      <View
        style={[
          styles.marker,
          {
            left: `${pct}%`,
            backgroundColor: theme.colors.text,
            borderColor: theme.colors.surface,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 4,
  },
  title: {
    marginBottom: 2,
  },
  hint: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  bar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 4,
    marginBottom: 8,
  },
  barSeg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  marker: {
    position: 'absolute',
    top: -4,
    width: 4,
    height: 16,
    marginLeft: -2,
    borderRadius: 2,
    borderWidth: 1,
  },
});
