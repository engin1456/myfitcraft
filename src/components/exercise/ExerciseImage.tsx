import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { muscleColor } from '@/constants/muscles';
import type { MuscleGroup } from '@/types/models';

interface Props {
  imageUrl: string | null;
  animationUrl: string | null;
  primaryMuscle: MuscleGroup;
  size?: number;
  /**
   * true → 2 frame arasında setInterval ile geçiş yap (basit GIF efekti).
   * false (default) → sadece animationUrl ?? imageUrl gösterir.
   * Liste/card'larda performans için false bırak; sadece detay ekranında true yap.
   */
  animated?: boolean;
  /** Animasyon frame değişim aralığı (ms). Default 700. */
  animationIntervalMs?: number;
  /** Mevcut frame değişince çağrılır (0 = imageUrl/start, 1 = animationUrl/end). */
  onFrameChange?: (frame: 0 | 1) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Egzersiz görselini gösterir. yuhonas/free-exercise-db genelde 2 frame (start/end)
 * pose içerir. `animated=true` ile bunları crossfade ederek hareketli efekt verir.
 */
export function ExerciseImage({
  imageUrl,
  animationUrl,
  primaryMuscle,
  size = 56,
  animated = false,
  animationIntervalMs = 700,
  onFrameChange,
  style,
}: Props) {
  const theme = useTheme();
  const hasBothFrames = Boolean(imageUrl && animationUrl && imageUrl !== animationUrl);
  const [frame, setFrame] = useState<0 | 1>(0);

  useEffect(() => {
    if (!animated || !hasBothFrames) return;
    const id = setInterval(() => {
      setFrame((f) => (f === 0 ? 1 : 0));
    }, animationIntervalMs);
    return () => clearInterval(id);
  }, [animated, hasBothFrames, animationIntervalMs]);

  // Parent callback'ini ref'te tut — her render'da yeni referans gelse bile effect
  // tekrar tetiklenmesin (parent render'ı sırasında setState'i tetikleme uyarısı engeli).
  const onFrameChangeRef = useRef(onFrameChange);
  useEffect(() => {
    onFrameChangeRef.current = onFrameChange;
  });
  useEffect(() => {
    onFrameChangeRef.current?.(frame);
  }, [frame]);

  const url = (() => {
    if (animated && hasBothFrames) {
      return frame === 0 ? imageUrl : animationUrl;
    }
    return animationUrl ?? imageUrl;
  })();

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[
          { width: size, height: size, borderRadius: theme.radius.md },
          // ViewStyle ↔ ImageStyle uyumsuzluğu için cast (kullanım alanlarında ViewStyle geçilebiliyor)
          style as object,
        ]}
        contentFit="cover"
        transition={animated ? animationIntervalMs / 2 : 150}
        cachePolicy="memory-disk"
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceElevated,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: muscleColor(primaryMuscle) },
        ]}
      />
      <Text variant="caption" muted size="xs" align="center">
        {primaryMuscle.slice(0, 3).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
