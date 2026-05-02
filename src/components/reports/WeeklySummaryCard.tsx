import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Card, Text } from '@/components/ui';
import { formatVolume } from '@/utils/format';

export interface WeeklySummary {
  workouts: number;
  sets: number;
  volume: number;
  prs: number;
}

interface Props {
  summary: WeeklySummary;
}

/**
 * Bu haftanın özet kartı (Pazartesi → Pazar) — KPI'ların üstünde.
 * Hiç antrenman yoksa boş hal mesajı gösterir.
 */
export function WeeklySummaryCard({ summary }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const empty = summary.workouts === 0;

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.primary + '10' }]}>
      <View style={styles.header}>
        <Text variant="caption" weight="semibold" color={theme.colors.primary}>
          {t('reports.weeklySummary')}
        </Text>
        <Text variant="caption" muted>
          {t('reports.weeklySummaryHint')}
        </Text>
      </View>
      {empty ? (
        <Text muted style={styles.emptyMsg}>
          {t('reports.summaryNoActivity')}
        </Text>
      ) : (
        <View style={styles.row}>
          <Stat value={String(summary.workouts)} label={t('reports.summaryWorkouts')} />
          <Sep />
          <Stat value={String(summary.sets)} label={t('reports.summarySets')} />
          <Sep />
          <Stat value={formatVolume(summary.volume)} label={t('reports.summaryVolume')} />
          <Sep />
          <Stat value={String(summary.prs)} label={t('reports.summaryPRs')} />
        </View>
      )}
    </Card>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="heading" weight="bold">
        {value}
      </Text>
      <Text variant="caption" muted>
        {label}
      </Text>
    </View>
  );
}

function Sep() {
  const theme = useTheme();
  return <View style={[styles.sep, { backgroundColor: theme.colors.border }]} />;
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyMsg: {
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  sep: {
    width: 1,
    height: 24,
    marginHorizontal: 4,
  },
});
