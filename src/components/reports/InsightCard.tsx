import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Card, Text } from '@/components/ui';
import type { Insight } from '@/utils/insights';

interface Props {
  insight: Insight;
  onActionPress?: (insight: Insight) => void;
}

/**
 * Tek bir akıllı öneriyi kart olarak render eder.
 * - severity'ye göre sol kenar bandı renklendirir
 * - i18n key'lerini params ile çevirir; muscle params'ı da i18n key dönüyor (`muscles.chest`)
 *   bu yüzden bir adım çevirip tekrar interpolation yapıyoruz.
 */
export function InsightCard({ insight, onActionPress }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const accent =
    insight.severity === 'success'
      ? theme.colors.success
      : insight.severity === 'warning'
        ? theme.colors.warning
        : theme.colors.primary;

  const icon = insight.severity === 'success' ? '✓' : insight.severity === 'warning' ? '!' : 'i';

  // Çeviri parametrelerinde "muscle" gibi key'ler i18n yoluyla yeniden çevrilmeli.
  const params: Record<string, string | number> = { ...(insight.params ?? {}) };
  if (typeof params.muscle === 'string' && params.muscle.startsWith('muscles.')) {
    params.muscle = t(params.muscle);
  }

  const title = t(insight.titleKey, params);
  const message = t(insight.messageKey, params);

  return (
    <Card
      style={[
        styles.card,
        {
          borderLeftColor: accent,
          borderLeftWidth: 3,
          paddingVertical: 12,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: accent + '20' }]}>
          <Text weight="bold" color={accent} size="sm">
            {icon}
          </Text>
        </View>
        <View style={styles.body}>
          <Text weight="semibold" numberOfLines={2}>
            {title}
          </Text>
          <Text variant="caption" muted style={styles.msg}>
            {message}
          </Text>
          {insight.action && onActionPress ? (
            <Pressable
              onPress={() => onActionPress(insight)}
              hitSlop={6}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: accent + (pressed ? '30' : '15'),
                  borderColor: accent + '40',
                },
              ]}
            >
              <Text size="sm" weight="semibold" color={accent}>
                {t(insight.action.labelKey)}
                {' →'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  msg: {
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});
