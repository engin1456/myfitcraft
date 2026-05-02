import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/app/providers/ThemeProvider';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth = true,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...rest
}: Props) {
  const theme = useTheme();

  const palette = useMemo(() => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.colors.primary,
          text: theme.colors.primaryContrast,
          border: 'transparent',
        };
      case 'secondary':
        return {
          bg: theme.colors.surfaceElevated,
          text: theme.colors.text,
          border: theme.colors.border,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          text: theme.colors.text,
          border: 'transparent',
        };
      case 'danger':
        return {
          bg: theme.colors.danger,
          text: '#FFFFFF',
          border: 'transparent',
        };
    }
  }, [variant, theme]);

  const sizing = useMemo(() => {
    switch (size) {
      case 'sm':
        return { paddingV: 10, paddingH: 14, fontSize: 'sm' as const, height: 38 };
      case 'md':
        return { paddingV: 14, paddingH: 18, fontSize: 'md' as const, height: 48 };
      case 'lg':
        return { paddingV: 18, paddingH: 22, fontSize: 'lg' as const, height: 56 };
    }
  }, [size]);

  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingVertical: sizing.paddingV,
          paddingHorizontal: sizing.paddingH,
          minHeight: sizing.height,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          borderRadius: theme.radius.lg,
          borderWidth: variant === 'secondary' ? 1 : 0,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <Text
            size={sizing.fontSize}
            weight="semibold"
            color={palette.text}
            numberOfLines={1}
          >
            {title}
          </Text>
          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
