import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';

interface Props {
  title: string;
  subtitle?: string;
}

export function AuthHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text variant="title">{title}</Text>
      {subtitle ? (
        <Text variant="body" muted style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 28,
  },
  subtitle: {
    marginTop: 4,
  },
});
