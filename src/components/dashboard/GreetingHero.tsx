import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Text } from '@/components/ui';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  greeting: string;
  streakCount: number;
  streakActive: boolean;
}

/**
 * Hero greeting kartı: forge-orange gradient arka plan, saate uygun ikon,
 * sağda büyük animasyonlu streak rakamı (countup).
 */
export function GreetingHero({ greeting, streakCount, streakActive }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const iconName = pickTimeIcon();

  return (
    <LinearGradient
      colors={[theme.colors.primary, '#C84618']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.left}>
        <View style={styles.iconRow}>
          <Ionicons name={iconName} size={18} color={theme.colors.primaryContrast} />
          <Text size="xs" weight="semibold" color={theme.colors.primaryContrast} style={styles.eyebrow}>
            {t('common.appName')}
          </Text>
        </View>
        <Text variant="title" color={theme.colors.primaryContrast} style={styles.title}>
          {greeting}
        </Text>
      </View>

      <View style={styles.streakBox}>
        <Ionicons
          name={streakActive ? 'flame' : 'flame-outline'}
          size={22}
          color={streakActive ? '#FFE08A' : theme.colors.primaryContrast}
        />
        <View style={styles.streakNumWrap}>
          <CountUp value={streakCount} />
          <Text size="xs" color={theme.colors.primaryContrast} style={styles.streakLabel}>
            {streakCount === 1 ? t('dashboard.day') : t('dashboard.days')}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function pickTimeIcon(): IoniconName {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'partly-sunny';
  if (h >= 12 && h < 18) return 'sunny';
  if (h >= 18 && h < 22) return 'cloudy-night';
  return 'moon';
}

/**
 * Hedef değere doğru sayan rakam — kullanıcı her dashboard açışında küçük
 * bir motivasyon dokunuşu görsün. ~600ms.
 */
function CountUp({ value }: { value: number }) {
  const theme = useTheme();
  const [display, setDisplay] = useState(value);
  const startedRef = useRef(false);

  useEffect(() => {
    // İlk render'da animasyon
    if (startedRef.current) {
      setDisplay(value);
      return;
    }
    startedRef.current = true;
    const duration = 600;
    const steps = Math.min(value, 30);
    if (steps <= 0) {
      setDisplay(value);
      return;
    }
    const tickMs = duration / steps;
    let current = 0;
    setDisplay(0);
    const interval = setInterval(() => {
      current += Math.max(1, Math.ceil(value / steps));
      if (current >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(current);
      }
    }, tickMs);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <Text variant="heading" weight="bold" color={theme.colors.primaryContrast}>
      {display}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    minHeight: 96,
  },
  left: {
    flex: 1,
    gap: 6,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  title: {
    marginTop: 2,
  },
  streakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  streakNumWrap: {
    alignItems: 'center',
    minWidth: 28,
  },
  streakLabel: {
    opacity: 0.85,
    marginTop: -2,
  },
});
