import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, Button, Input, Text } from '@/components/ui';
import { isFirebaseConfigured } from '@/services/firebase';
import { mapAuthErrorToKey, signInWithEmail } from '@/services/auth.service';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas';
import { AuthHeader } from '@/features/auth/components/AuthHeader';
import type { AuthStackParamList } from '@/app/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function LoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    if (!isFirebaseConfigured) {
      Alert.alert(t('common.appName'), t('errors.firebaseNotConfigured'));
      return;
    }
    setSubmitting(true);
    try {
      await signInWithEmail(values);
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      Alert.alert(t('auth.login'), t(mapAuthErrorToKey(code)));
    } finally {
      setSubmitting(false);
    }
  };

  const onSocial = (provider: 'google' | 'apple') => {
    Alert.alert(
      t('auth.login'),
      t(provider === 'google' ? 'auth.googleComingSoon' : 'auth.appleComingSoon'),
    );
  };

  return (
    <Screen scroll padded>
      <AuthHeader title={t('auth.welcomeBack')} subtitle={t('auth.tagline')} />

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label={t('auth.email')}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email ? t(errors.email.message ?? 'errors.required') : undefined}
              placeholder="ornek@mail.com"
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label={t('auth.password')}
              secureTextEntry
              autoComplete="password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password ? t(errors.password.message ?? 'errors.required') : undefined}
              placeholder="••••••••"
            />
          )}
        />

        <Pressable
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgotWrapper}
        >
          <Text variant="caption" muted>
            {t('auth.forgotPassword')}
          </Text>
        </Pressable>

        <Button title={t('auth.login')} loading={submitting} onPress={handleSubmit(onSubmit)} />
      </View>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text variant="caption" muted style={styles.orLabel}>
          {t('auth.or')}
        </Text>
        <View style={styles.line} />
      </View>

      <View style={styles.socials}>
        <Button
          title={t('auth.loginWithGoogle')}
          variant="secondary"
          onPress={() => onSocial('google')}
        />
        <Button
          title={t('auth.loginWithApple')}
          variant="secondary"
          onPress={() => onSocial('apple')}
        />
      </View>

      <Pressable onPress={() => navigation.navigate('Register')} style={styles.bottomLink}>
        <Text variant="caption" muted>
          {t('auth.noAccount')}{' '}
          <Text variant="caption" weight="semibold">
            {t('auth.register')}
          </Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
  forgotWrapper: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#444',
  },
  orLabel: {
    textTransform: 'uppercase',
  },
  socials: {
    gap: 10,
  },
  bottomLink: {
    alignSelf: 'center',
    marginTop: 28,
    padding: 8,
  },
});
