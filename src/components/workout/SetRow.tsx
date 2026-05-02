import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui';
import { useTheme } from '@/app/providers/ThemeProvider';
import type { DraftSet } from '@/types/models';

interface Props {
  set: DraftSet;
  onChange: (patch: Partial<DraftSet>) => void;
  onToggleComplete: () => void;
  onRemove?: () => void;
  previousReps?: number;
  previousWeight?: number;
}

export function SetRow({
  set,
  onChange,
  onToggleComplete,
  onRemove,
  previousReps,
  previousWeight,
}: Props) {
  const theme = useTheme();

  const onComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onToggleComplete();
  };

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: set.completed
            ? theme.colors.surfaceElevated
            : theme.colors.surface,
          borderColor: set.completed ? theme.colors.success : theme.colors.border,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <View style={styles.setNumberCell}>
        <Text size="sm" weight="semibold" muted={!set.isWarmup}>
          {set.isWarmup ? 'W' : set.setNumber}
        </Text>
      </View>

      <View style={styles.previousCell}>
        <Text variant="caption" muted>
          {previousWeight !== undefined && previousReps !== undefined
            ? `${previousWeight}×${previousReps}`
            : '—'}
        </Text>
      </View>

      <View style={styles.inputCell}>
        <TextInput
          value={set.weight === 0 ? '' : String(set.weight)}
          onChangeText={(v) => onChange({ weight: Number(v) || 0 })}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={theme.colors.textSubtle}
          style={[styles.input, { color: theme.colors.text }]}
          selectTextOnFocus
        />
      </View>

      <View style={styles.inputCell}>
        <TextInput
          value={set.reps === 0 ? '' : String(set.reps)}
          onChangeText={(v) => onChange({ reps: Number(v) || 0 })}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={theme.colors.textSubtle}
          style={[styles.input, { color: theme.colors.text }]}
          selectTextOnFocus
        />
      </View>

      <Pressable
        onPress={onComplete}
        onLongPress={onRemove}
        style={[
          styles.checkCell,
          {
            backgroundColor: set.completed ? theme.colors.success : 'transparent',
            borderColor: set.completed ? theme.colors.success : theme.colors.border,
            borderRadius: theme.radius.sm,
          },
        ]}
      >
        <Text size="md" weight="bold" color={set.completed ? '#FFFFFF' : theme.colors.textMuted}>
          {set.completed ? '✓' : ' '}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 6,
  },
  setNumberCell: {
    width: 32,
    alignItems: 'center',
  },
  previousCell: {
    width: 56,
    alignItems: 'center',
  },
  inputCell: {
    flex: 1,
  },
  input: {
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: 8,
  },
  checkCell: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
