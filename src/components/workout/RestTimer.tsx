import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui';
import { useTheme } from '@/app/providers/ThemeProvider';

interface Props {
  durationSeconds: number;
  onComplete?: () => void;
  onSkip?: () => void;
}

/**
 * Sticky bottom dinlenme sayacı.
 * - Set tamamlanınca otomatik tetiklenir.
 * - Geri sayım canlı; ±10 sn butonları ile kullanıcı süreyi ayarlayabilir.
 * - 0'a düşünce haptic + onComplete.
 * - "Atla" ile manuel kapatma.
 */
export function RestTimer({ durationSeconds, onComplete, onSkip }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [totalDuration, setTotalDuration] = useState(durationSeconds);
  const [remaining, setRemaining] = useState(durationSeconds);
  const completed = useRef(false);
  const lastBeepAt = useRef<number | null>(null);

  // Yeni rest tetiklendiğinde state sıfırla
  useEffect(() => {
    setTotalDuration(durationSeconds);
    setRemaining(durationSeconds);
    completed.current = false;
    lastBeepAt.current = null;
  }, [durationSeconds]);

  // Tick
  useEffect(() => {
    if (remaining <= 0) {
      if (!completed.current) {
        completed.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onComplete?.();
      }
      return;
    }
    const id = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, onComplete]);

  // Son 3 saniyede ufak haptic
  useEffect(() => {
    if (remaining > 0 && remaining <= 3 && lastBeepAt.current !== remaining) {
      lastBeepAt.current = remaining;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [remaining]);

  const adjust = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    setRemaining((s) => Math.max(1, s + delta));
    setTotalDuration((d) => Math.max(1, d + delta));
  };

  const progress = Math.max(0, Math.min(1, remaining / totalDuration));
  const labelText =
    remaining <= 0 ? t('workout.restDone') : t('workout.restNextSet');

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor:
                remaining <= 3 ? theme.colors.danger : theme.colors.primary,
            },
          ]}
        />
      </View>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text variant="caption" muted>
            {t('workout.restPrep')}
          </Text>
          <Text variant="title">{formatTime(remaining)}</Text>
          <Text size="xs" muted style={{ marginTop: 2 }}>
            {labelText}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => adjust(-10)}
            style={({ pressed }) => [
              styles.adjustBtn,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text size="sm" weight="medium">
              {t('workout.restSub10')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => adjust(10)}
            style={({ pressed }) => [
              styles.adjustBtn,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text size="sm" weight="medium">
              {t('workout.restAdd10')}
            </Text>
          </Pressable>

          <Pressable
            onPress={onSkip}
            style={({ pressed }) => [
              styles.skipBtn,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.md,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text size="sm" weight="bold" color={theme.colors.primaryContrast}>
              {t('workout.skipRest')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function formatTime(s: number): string {
  if (s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingBottom: 24,
  },
  progressTrack: {
    height: 4,
    width: '100%',
  },
  progressFill: {
    height: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  left: {
    gap: 0,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  adjustBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    minWidth: 48,
    alignItems: 'center',
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 56,
    alignItems: 'center',
  },
});
