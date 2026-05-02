import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, Text, Chip } from '@/components/ui';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuthStore } from '@/stores/auth.store';
import type { Program } from '@/types/models';

interface Props {
  program: Program;
  onPress?: () => void;
  /** Toplam egzersiz sayisi (preset'lerde seed'den, custom'larda Firestore'dan) */
  exerciseCount?: number;
}

export function ProgramCard({ program, onPress, exerciseCount }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isTr = i18n.language === 'tr';
  const name = isTr ? program.nameTr : program.name;
  const desc = isTr ? program.descriptionTr : program.description;
  const isActive = useAuthStore((s) => s.profile?.activeProgramId) === program.id;

  return (
    <Card
      onPress={onPress}
      style={[
        styles.card,
        isActive && { borderColor: theme.colors.primary, borderWidth: 1.5 },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.titleLine}>
            <Text variant="heading" style={styles.titleFlex}>
              {name}
            </Text>
            {isActive ? (
              <View
                style={[
                  styles.activePill,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.radius.full,
                  },
                ]}
              >
                <Text size="xs" weight="bold" color={theme.colors.primaryContrast}>
                  {t('programs.activeBadge')}
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="caption" muted numberOfLines={2} style={styles.desc}>
            {desc}
          </Text>
        </View>
        <View
          style={[
            styles.levelBadge,
            { backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.radius.sm },
          ]}
        >
          <Text size="xs" weight="bold" muted>
            {t(`onboarding.experience${capitalize(program.level)}`)}
          </Text>
        </View>
      </View>

      <View style={styles.chipsRow}>
        <Chip label={t('programs.frequency', { count: program.frequencyPerWeek })} />
        <Chip label={t('programs.duration', { count: program.durationWeeks })} />
        {exerciseCount !== undefined ? (
          <Chip label={t('programs.exercises', { count: exerciseCount })} />
        ) : null}
      </View>
    </Card>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleFlex: {
    flex: 1,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  desc: {
    marginTop: 2,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
