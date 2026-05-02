import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/app/providers/ThemeProvider';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

/**
 * Pulsing skeleton placeholder. Loading state'de "boş ekran" yerine
 * içerik şeklini gösterir, perceived performance artırır.
 */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }: Props) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width: width as number | `${number}%`,
          height,
          borderRadius: radius,
          backgroundColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface CardSkeletonProps {
  height?: number;
  lines?: number;
}

/** Kart şeklinde grup; çoğu liste için yeterli. */
export function CardSkeleton({ height = 80, lines = 2 }: CardSkeletonProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          height: lines > 0 ? undefined : height,
        },
      ]}
    >
      <Skeleton width="60%" height={14} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '40%' : '85%'} height={10} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    marginVertical: 4,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    marginBottom: 10,
  },
});
