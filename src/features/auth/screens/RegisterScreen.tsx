import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, Button, Input, Text } from '@/components/ui';
import { isFirebaseConfigured } from '@/services/firebase';
import { mapAuthErrorToKey, signUpWithEmail } from '@/services/auth.service';
import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas';
import { AuthHeader } from '@/features/auth/components/AuthHeader';
import type { AuthStackParamList } from '@/app/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function RegisterScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', passwordConfirm: '' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    if (!isFirebaseConfigured) {
      Alert.alert(t('common.appName'), t('errors.firebaseNotConfigured'));
      return;
    }
    setSubmitting(true);
    try {
      await signUpWithEmail({
        email: values.email,
        password: values.password,
        displayName: values.name,
      });
      // Auth listener kullanıcıyı yakalar ve onboarding'e yönlendirir
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      Alert.alert(t('auth.register'), t(mapAuthErrorToKey(code)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll padded>
      <AuthHeader title={t('auth.createAccount')} />

      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label={t('auth.name')}
              autoCapitalize="words"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name ? t(errors.name.message ?? 'errors.required') : undefined}
              placeholder="Ad Soyad"
            />
          )}
        />
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
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password ? t(errors.password.message ?? 'errors.required') : undefined}
              placeholder="••••••••"
            />
          )}
        />
        <Controller
          control={control}
          name="passwordConfirm"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label={t('auth.passwordConfirm')}
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={
                errors.passwordConfirm
                  ? t(errors.passwordConfirm.message ?? 'errors.required')
                  : undefined
              }
              placeholder="••••••••"
            />
          )}
        />

        <Button title={t('auth.register')} loading={submitting} onPress={handleSubmit(onSubmit)} />
      </View>

      <Pressable onPress={() => navigation.navigate('Login')} style={styles.bottomLink}>
        <Text variant="caption" muted>
          {t('auth.hasAccount')}{' '}
          <Text variant="caption" weight="semibold">
            {t('auth.login')}
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
  bottomLink: {
    alignSelf: 'center',
    marginTop: 28,
    padding: 8,
  },
});
