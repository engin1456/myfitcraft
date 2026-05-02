import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/app/providers/ThemeProvider';
import type { FontSize, FontWeight } from '@/theme/typography';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';

interface Props extends RNTextProps {
  variant?: Variant;
  size?: FontSize;
  weight?: FontWeight;
  color?: string;
  muted?: boolean;
  align?: TextStyle['textAlign'];
}

const variantToSize: Record<Variant, FontSize> = {
  display: '4xl',
  title: '2xl',
  heading: 'xl',
  body: 'md',
  label: 'sm',
  caption: 'xs',
};

const variantToWeight: Record<Variant, FontWeight> = {
  display: 'bold',
  title: 'bold',
  heading: 'semibold',
  body: 'regular',
  label: 'medium',
  caption: 'regular',
};

export function Text({
  variant = 'body',
  size,
  weight,
  color,
  muted,
  align,
  style,
  children,
  ...rest
}: Props) {
  const theme = useTheme();
  const resolvedSize = size ?? variantToSize[variant];
  const resolvedWeight = weight ?? variantToWeight[variant];
  const resolvedColor = color ?? (muted ? theme.colors.textMuted : theme.colors.text);

  return (
    <RNText
      style={[
        {
          color: resolvedColor,
          fontSize: theme.fontSize[resolvedSize],
          lineHeight: theme.lineHeight[resolvedSize],
          fontWeight: theme.fontWeight[resolvedWeight],
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
