import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from './Button';
import { Text } from './Text';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  iconName?: IoniconName;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  /** "danger"/"warning" durumlar için ikon rengi override edilebilir. */
  iconColor?: string;
  compact?: boolean;
}

/**
 * Tutarlı boş hal: ikon + başlık + açıklama + opsiyonel CTA.
 * "Henüz veri yok" düz metni yerine kullanılır.
 */
export function EmptyState({
  iconName,
  title,
  description,
  ctaLabel,
  onCtaPress,
  iconColor,
  compact = false,
}: Props) {
  const theme = useTheme();
  const accent = iconColor ?? theme.colors.primary;

  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      {iconName ? (
        <View
          style={[
            styles.iconBubble,
            {
              backgroundColor: accent + '15',
              borderColor: accent + '30',
            },
          ]}
        >
          <Ionicons name={iconName} size={compact ? 26 : 34} color={accent} />
        </View>
      ) : null}
      <Text variant="heading" align="center" weight="semibold" style={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text muted align="center" style={styles.desc}>
          {description}
        </Text>
      ) : null}
      {ctaLabel && onCtaPress ? (
        <Button
          title={ctaLabel}
          variant="primary"
          size="md"
          fullWidth={false}
          onPress={onCtaPress}
          style={styles.cta}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  compact: {
    paddingVertical: 20,
  },
  iconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    marginTop: 4,
  },
  desc: {
    marginTop: 4,
    maxWidth: 320,
  },
  cta: {
    marginTop: 16,
  },
});
