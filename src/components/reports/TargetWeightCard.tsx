import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Card, Text, Button } from '@/components/ui';
import { calculateETA } from '@/utils/health';
import { formatDate } from '@/utils/format';
import type { Locale } from '@/types/models';

interface Props {
  /** Şu anki kilo (en son ölçüm). null ise card boş hali gösterir. */
  currentWeight: number | null;
  /** Profilde kayıtlı hedef kilo. null ise CTA gösterilir. */
  targetWeight: number | null;
  /** Son haftalardan hesaplanan ortalama haftalık değişim (kg/hafta). */
  weeklyChangeKg: number | null;
  locale: Locale;
  onPressSetTarget: () => void;
}

/**
 * "Hedef kilo" kartı:
 * - Hedef yoksa CTA → profile yönlendir.
 * - Hedef varsa kalan kilo, gerekiyorsa ETA, ya da uyarı (yanlış yön / yetersiz veri).
 */
export function TargetWeightCard({
  currentWeight,
  targetWeight,
  weeklyChangeKg,
  locale,
  onPressSetTarget,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (targetWeight === null) {
    return (
      <Card style={styles.card}>
        <Text variant="label" weight="bold" style={styles.title}>
          {t('reports.targetWeight')}
        </Text>
        <Text variant="caption" muted style={styles.hint}>
          {t('profile.targetWeightHelper')}
        </Text>
        <Button
          title={t('reports.targetWeightSet')}
          variant="primary"
          size="sm"
          onPress={onPressSetTarget}
          style={styles.cta}
        />
      </Card>
    );
  }

  if (currentWeight === null) {
    return (
      <Card style={styles.card}>
        <Header
          title={t('reports.targetWeight')}
          target={targetWeight}
          onChangePress={onPressSetTarget}
        />
        <Text muted size="sm" style={styles.statusText}>
          {t('reports.targetWeightNotEnough')}
        </Text>
      </Card>
    );
  }

  const remaining = targetWeight - currentWeight;
  const direction = remaining > 0 ? t('reports.directionGain') : t('reports.directionLose');
  const eta =
    weeklyChangeKg === null ? null : calculateETA(currentWeight, targetWeight, weeklyChangeKg);

  let statusColor = theme.colors.primary;
  let statusText: string;
  let dateText: string | null = null;

  if (eta && eta.weeks === 0 && eta.onTrack) {
    statusColor = theme.colors.success;
    statusText = t('reports.targetWeightAtTarget');
  } else if (eta && !eta.onTrack) {
    statusColor = theme.colors.warning;
    statusText = t('reports.targetWeightWrongDirection');
  } else if (eta) {
    statusColor = theme.colors.success;
    statusText = t('reports.targetWeightETA', { weeks: eta.weeks });
    dateText = t('reports.targetWeightETADate', {
      date: formatDate(eta.targetDate, locale),
    });
  } else {
    statusColor = theme.colors.textMuted;
    statusText = t('reports.targetWeightNotEnough');
  }

  return (
    <Card style={styles.card}>
      <Header
        title={t('reports.targetWeight')}
        target={targetWeight}
        onChangePress={onPressSetTarget}
      />

      {Math.abs(remaining) > 0.3 ? (
        <Text variant="caption" muted style={styles.hint}>
          {t('reports.targetWeightHint', {
            remaining: Math.abs(remaining).toFixed(1),
            direction,
          })}
        </Text>
      ) : null}

      <View style={[styles.statusBox, { backgroundColor: statusColor + '15' }]}>
        <Text weight="semibold" color={statusColor}>
          {statusText}
        </Text>
        {dateText ? (
          <Text variant="caption" muted style={styles.dateText}>
            {dateText}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

function Header({
  title,
  target,
  onChangePress,
}: {
  title: string;
  target: number;
  onChangePress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text variant="label" weight="bold">
          {title}
        </Text>
        <Text variant="heading" weight="bold">
          {target.toFixed(1)} kg
        </Text>
      </View>
      <Button
        title={t('reports.targetWeightChange')}
        variant="ghost"
        size="sm"
        fullWidth={false}
        onPress={onChangePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
  },
  title: {
    marginBottom: 2,
  },
  hint: {
    marginBottom: 4,
  },
  cta: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  dateText: {
    marginTop: 2,
  },
  statusText: {
    marginTop: 4,
  },
});
