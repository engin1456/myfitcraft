import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { Button, Card, Screen, Text } from '@/components/ui';
import { useTheme } from '@/app/providers/ThemeProvider';
import { fetchProgramBundle } from '@/services/programs.service';
import {
  WEEKDAY_LABELS_EN,
  WEEKDAY_LABELS_TR,
  activateProgram,
} from '@/services/userProgram.service';
import { useAuthStore } from '@/stores/auth.store';
import type { ProgramBundle } from '@/features/programs/seed';
import type { WeekDay } from '@/types/models';
import type {
  RootStackParamList,
  RootStackScreenProps,
} from '@/app/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ALL_DAYS: WeekDay[] = [1, 2, 3, 4, 5, 6, 7];

export function ProgramScheduleScreen({ route }: RootStackScreenProps<'ProgramSchedule'>) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const isTr = i18n.language === 'tr';
  const labels = isTr ? WEEKDAY_LABELS_TR : WEEKDAY_LABELS_EN;
  const uid = useAuthStore((s) => s.uid);
  const profile = useAuthStore((s) => s.profile);

  const [bundle, setBundle] = useState<ProgramBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Set<WeekDay>>(() => {
    // Aktif programa zaten abonse ise mevcut schedule'ı seç
    if (profile?.activeProgramId === route.params.programId && profile?.programSchedule) {
      return new Set(profile.programSchedule);
    }
    return new Set();
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProgramBundle(route.params.programId)
      .then((b) => {
        if (!cancelled) setBundle(b);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [route.params.programId]);

  const requiredCount = bundle?.program.frequencyPerWeek ?? 0;

  const sortedSelected = useMemo(
    () => Array.from(selected).sort((a, b) => a - b),
    [selected],
  );

  const sortedDays = useMemo(
    () => (bundle ? [...bundle.days].sort((a, b) => a.dayOrder - b.dayOrder) : []),
    [bundle],
  );

  const toggleDay = (day: WeekDay) => {
    Haptics.selectionAsync().catch(() => {});
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        // Limit aşılırsa en eski seçimi at
        if (next.size >= requiredCount && requiredCount > 0) {
          // İlk eklenen seçimi (set iteration order) at
          const first = next.values().next().value as WeekDay | undefined;
          if (first !== undefined) next.delete(first);
        }
        next.add(day);
      }
      return next;
    });
  };

  const onConfirm = async () => {
    if (!uid) {
      Alert.alert(t('common.appName'), t('errors.firebaseNotConfigured'));
      return;
    }
    if (sortedSelected.length !== requiredCount) return;

    setSubmitting(true);
    try {
      await activateProgram(uid, route.params.programId, sortedSelected);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // Dashboard'a tek-tab reset
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        }),
      );
    } catch {
      Alert.alert(t('common.appName'), t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen padded>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!bundle) {
    return (
      <Screen padded>
        <Text muted align="center">
          {t('programs.noPrograms')}
        </Text>
      </Screen>
    );
  }

  const programName = isTr ? bundle.program.nameTr : bundle.program.name;
  const remaining = requiredCount - selected.size;

  return (
    <Screen scroll padded withBottomInset>
      <Text variant="caption" muted>
        {programName}
      </Text>
      <Text variant="title">{t('programs.scheduleTitle')}</Text>
      <Text muted style={styles.subtitle}>
        {t('programs.scheduleSubtitle')}
      </Text>

      <Card style={styles.hintCard}>
        <Text size="sm">
          {t('programs.scheduleHint', { count: requiredCount })}
        </Text>
        <Text size="sm" weight="semibold" color={theme.colors.primary} style={{ marginTop: 4 }}>
          {t('programs.scheduleSelected', {
            selected: selected.size,
            total: requiredCount,
          })}
        </Text>
      </Card>

      <View style={styles.daysGrid}>
        {ALL_DAYS.map((day) => {
          const isSelected = selected.has(day);
          return (
            <Pressable
              key={day}
              onPress={() => toggleDay(day)}
              style={({ pressed }) => [
                styles.dayBox,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.surfaceElevated,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  borderRadius: theme.radius.lg,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                size="lg"
                weight="bold"
                color={isSelected ? theme.colors.primaryContrast : theme.colors.text}
              >
                {labels[day]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Atama önizleme */}
      {selected.size > 0 ? (
        <View style={styles.assignSection}>
          <Text variant="label" muted style={styles.assignLabel}>
            {t('programs.scheduleAssignment')}
          </Text>
          <Card style={styles.assignCard}>
            {sortedSelected.map((weekDay, idx) => {
              const programDay = sortedDays[idx];
              return (
                <View key={weekDay} style={styles.assignRow}>
                  <View
                    style={[
                      styles.dayBadge,
                      {
                        backgroundColor: theme.colors.primary,
                        borderRadius: theme.radius.full,
                      },
                    ]}
                  >
                    <Text size="xs" weight="bold" color={theme.colors.primaryContrast}>
                      {labels[weekDay]}
                    </Text>
                  </View>
                  <Text style={styles.arrow} muted>
                    →
                  </Text>
                  <Text weight="semibold" style={styles.dayName}>
                    {programDay
                      ? isTr
                        ? programDay.nameTr
                        : programDay.name
                      : '-'}
                  </Text>
                </View>
              );
            })}
            {selected.size < requiredCount ? (
              <Text size="sm" muted style={styles.remainingText}>
                {t('programs.spotsAvailable', { count: remaining })}
              </Text>
            ) : null}
          </Card>
        </View>
      ) : null}

      <Button
        title={t('programs.scheduleConfirm')}
        onPress={onConfirm}
        loading={submitting}
        disabled={selected.size !== requiredCount}
        style={styles.confirmBtn}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
  },
  hintCard: {
    marginBottom: 16,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  dayBox: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  assignSection: {
    marginBottom: 24,
  },
  assignLabel: {
    marginBottom: 8,
  },
  assignCard: {
    gap: 8,
  },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 48,
    alignItems: 'center',
  },
  arrow: {
    fontSize: 16,
  },
  dayName: {
    flex: 1,
  },
  remainingText: {
    marginTop: 4,
  },
  confirmBtn: {
    marginTop: 8,
  },
});
