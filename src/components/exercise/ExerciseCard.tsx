import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, Text } from '@/components/ui';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ExerciseImage } from './ExerciseImage';
import type { Exercise } from '@/types/models';

interface Props {
  exercise: Exercise;
  onPress?: () => void;
}

export function ExerciseCard({ exercise, onPress }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isTr = i18n.language === 'tr';
  const displayName = isTr ? exercise.nameTr : exercise.name;

  return (
    <Card onPress={onPress} style={styles.card}>
      <ExerciseImage
        imageUrl={exercise.imageUrl}
        animationUrl={exercise.animationUrl}
        primaryMuscle={exercise.primaryMuscle}
        size={56}
      />
      <View style={styles.info}>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {displayName}
        </Text>
        <Text variant="caption" muted numberOfLines={1}>
          {t(`muscles.${exercise.primaryMuscle}`)} · {t(`equipment.${exercise.equipment}`)}
        </Text>
      </View>
      {exercise.isCompound ? (
        <View
          style={[
            styles.badge,
            { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm },
          ]}
        >
          <Text size="xs" weight="bold" color={theme.colors.primaryContrast}>
            COMPOUND
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
});
