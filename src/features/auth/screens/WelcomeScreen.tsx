import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, Text, Button } from '@/components/ui';
import { useTheme } from '@/app/providers/ThemeProvider';
import type { AuthStackParamList } from '@/app/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function WelcomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  return (
    <Screen padded>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View
            style={[
              styles.logo,
              { backgroundColor: theme.colors.primary, borderRadius: theme.radius['2xl'] },
            ]}
          />
          <Text variant="display" align="center" style={styles.brand}>
            {t('common.appName')}
          </Text>
          <Text variant="body" muted align="center">
            {t('auth.tagline')}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button title={t('auth.login')} onPress={() => navigation.navigate('Login')} />
          <Button
            title={t('auth.register')}
            variant="secondary"
            onPress={() => navigation.navigate('Register')}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 8,
  },
  brand: {
    letterSpacing: -1,
  },
  actions: {
    gap: 12,
    paddingBottom: 16,
  },
});
