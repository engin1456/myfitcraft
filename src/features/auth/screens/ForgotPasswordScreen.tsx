import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';

import { Screen, Button, Input } from '@/components/ui';
import { isFirebaseConfigured } from '@/services/firebase';
import { mapAuthErrorToKey, sendPasswordReset } from '@/services/auth.service';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/schemas';
import { AuthHeader } from '@/features/auth/components/AuthHeader';

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: ForgotPasswordFormValues) => {
    if (!isFirebaseConfigured) {
      Alert.alert(t('common.appName'), t('errors.firebaseNotConfigured'));
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      Alert.alert(t('common.appName'), t('auth.passwordResetSent'), [
        { text: t('common.done'), onPress: () => navigation.goBack() },
      ]);
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      Alert.alert(t('auth.forgotPassword'), t(mapAuthErrorToKey(code)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll padded>
      <AuthHeader title={t('auth.resetPasswordTitle')} subtitle={t('auth.resetPasswordHint')} />

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label={t('auth.email')}
              autoCapitalize="none"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email ? t(errors.email.message ?? 'errors.required') : undefined}
              placeholder="ornek@mail.com"
            />
          )}
        />

        <Button
          title={t('auth.sendResetLink')}
          loading={submitting}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
});
