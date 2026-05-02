import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Text } from '@/components/ui';
import { useActiveWorkoutStore } from '@/stores/activeWorkout.store';
import type { RootStackParamList } from '@/app/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Aktif antrenman mini banner — Spotify mini player ruhu.
 * Tab bar'ın üstünde sticky; aktif antrenman varken her sekmede görünür.
 * Tıklayınca ActiveWorkout ekranına yönlendirir.
 */
export function ActiveWorkoutMiniBanner() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const active = useActiveWorkoutStore((s) => s.active);

  // Pulse animation — dikkat çekici ama göz yormayan
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  if (!active) return null;

  // Tamamlanan set sayısı — küçük progress bilgisi
  const totalSets = active.exercises.reduce((s, e) => s + e.sets.length, 0);
  const doneSets = active.exercises.reduce(
    (s, e) => s + e.sets.filter((set) => set.completed).length,
    0,
  );
  const exerciseTotal = active.exercises.length;
  const exerciseIdx = active.currentExerciseIndex + 1;

  return (
    <Pressable
      onPress={() => navigation.navigate('ActiveWorkout')}
      style={({ pressed }) => [
        styles.wrap,
        {
          backgroundColor: theme.colors.primary,
          opacity: pressed ? 0.92 : 1,
          shadowColor: theme.colors.primary,
        },
      ]}
      android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
    >
      <View style={styles.left}>
        <Animated.View style={[styles.pulse, { opacity: pulse }]}>
          <Ionicons name="pulse" size={18} color={theme.colors.primaryContrast} />
        </Animated.View>
        <View style={styles.textCol}>
          <Text size="xs" weight="semibold" color={theme.colors.primaryContrast}>
            {t('workout.active')}
          </Text>
          <Text size="sm" weight="bold" color={theme.colors.primaryContrast} numberOfLines={1}>
            {active.programDayName ?? t('workout.workoutInProgress')}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text size="xs" color={theme.colors.primaryContrast} style={styles.progress}>
          {doneSets}/{totalSets} · {exerciseIdx}/{exerciseTotal}
        </Text>
        <View style={styles.iconBtn}>
          <Ionicons name="play" size={16} color={theme.colors.primaryContrast} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 10,
    marginBottom: 6,
    borderRadius: 14,
    gap: 12,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pulse: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progress: {
    opacity: 0.9,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
