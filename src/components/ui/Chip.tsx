import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/app/providers/ThemeProvider';

import { Text } from './Text';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected, onPress, color, style }: Props) {
  const theme = useTheme();

  const accent = color ?? theme.colors.primary;
  const bg = selected ? accent : theme.colors.surfaceElevated;
  const fg = selected ? theme.colors.primaryContrast : theme.colors.text;
  const borderColor = selected ? accent : theme.colors.border;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.colors.border, borderless: false }}
      style={[
        styles.chip,
        {
          backgroundColor: bg,
          borderColor,
          borderRadius: theme.radius.full,
        },
        style,
      ]}
    >
      <Text
        size="sm"
        weight="medium"
        color={fg}
        numberOfLines={1}
        // Android'de includeFontPadding default true, bu sebeple Türkçe descender
        // (ç, ğ, ş) harflerin alt kısmı kompakt chip'lerde kesik görünebiliyor.
        // false yapınca daha tutarlı bir baseline elde ediyoruz.
        style={styles.chipText}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    // Horizontal ScrollView içinde shrink edip yazıların kesilmesini engelle.
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  chipText: {
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 20,
  },
});
