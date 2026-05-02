import {
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/app/providers/ThemeProvider';

interface CommonProps {
  padded?: boolean;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

interface StaticProps extends CommonProps, Omit<ViewProps, 'style' | 'children'> {
  onPress?: undefined;
}

interface PressableCardProps extends CommonProps, Omit<PressableProps, 'style' | 'children'> {
  onPress: PressableProps['onPress'];
}

export function Card(props: StaticProps | PressableCardProps) {
  const theme = useTheme();
  const { padded = true, elevated = false, style, children } = props;

  const baseStyle: ViewStyle = {
    backgroundColor: elevated ? theme.colors.surfaceElevated : theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: padded ? theme.spacing.lg : 0,
    borderWidth: elevated ? 0 : 1,
    borderColor: theme.colors.border,
  };

  if ('onPress' in props && props.onPress) {
    const { onPress, padded: _p, elevated: _e, style: _s, children: _c, ...rest } = props;
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [baseStyle, { opacity: pressed ? 0.85 : 1 }, style]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  const { padded: _p, elevated: _e, style: _s, children: _c, ...rest } = props as StaticProps;
  return (
    <View style={[baseStyle, style]} {...rest}>
      {children}
    </View>
  );
}
