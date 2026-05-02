import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';

import { Screen, Text, Card, Button, Input } from '@/components/ui';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { useReportsStore } from '@/stores/reports.store';
import { changeLanguage } from '@/i18n';
import {
  signOut,
  resendEmailVerification,
  refreshCurrentUser,
} from '@/services/auth.service';
import { isFirebaseConfigured } from '@/services/firebase';
import { computeAchievements } from '@/utils/achievements';
import { updateUserProfile } from '@/services/users.service';
import { toast } from '@/stores/toast.store';
import type { Locale, ThemePreference } from '@/types/models';
import type { RootStackParamList } from '@/app/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const themePref = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const signOutLocal = useAuthStore((s) => s.signOutLocal);

  const [targetWeightInput, setTargetWeightInput] = useState<string>(
    profile?.targetWeight !== null && profile?.targetWeight !== undefined
      ? String(profile.targetWeight)
      : '',
  );
  const [savingTarget, setSavingTarget] = useState(false);

  const [nameEditing, setNameEditing] = useState(false);
  const [nameInput, setNameInput] = useState<string>(profile?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [verificationBusy, setVerificationBusy] = useState(false);
  const workouts = useReportsStore((s) => s.workouts);
  const personalRecords = useReportsStore((s) => s.personalRecords);

  // İlk açılışta auth state'i tazele -> emailVerified güncel olsun
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    refreshCurrentUser()
      .then((user) => setEmailVerified(user ? user.emailVerified : null))
      .catch(() => setEmailVerified(null));
  }, []);

  const onResendVerification = async () => {
    setVerificationBusy(true);
    try {
      await resendEmailVerification();
      toast.success(t('profile.verificationSent'));
    } catch {
      toast.error(t('profile.verificationFailed'));
    } finally {
      setVerificationBusy(false);
    }
  };

  const onCheckVerification = async () => {
    setVerificationBusy(true);
    try {
      const user = await refreshCurrentUser();
      const verified = Boolean(user?.emailVerified);
      setEmailVerified(verified);
      if (verified) {
        toast.success(t('profile.verificationSent'));
      }
    } catch {
      // sessizce yut
    } finally {
      setVerificationBusy(false);
    }
  };

  const achievements = useMemo(
    () => computeAchievements({ profile, workouts, personalRecords }),
    [profile, workouts, personalRecords],
  );
  const isTr = i18n.language === 'tr';

  const onSwitchLocale = async () => {
    const next: Locale = (i18n.language as Locale) === 'tr' ? 'en' : 'tr';
    setLocale(next);
    await changeLanguage(next);
  };

  const cycleTheme = () => {
    const order: ThemePreference[] = ['system', 'dark', 'light'];
    const idx = order.indexOf(themePref);
    setTheme(order[(idx + 1) % order.length]);
  };

  const onLogout = () => {
    Alert.alert(t('profile.title'), t('auth.logout') + '?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: async () => {
          if (isFirebaseConfigured) {
            try {
              await signOut();
            } catch {
              signOutLocal();
            }
          } else {
            signOutLocal();
          }
        },
      },
    ]);
  };

  const onSaveName = async () => {
    const trimmed = nameInput.trim();
    if (trimmed.length < 2) {
      toast.error(t('onboarding.nameRequired'));
      return;
    }
    if (!profile) return;
    setSavingName(true);
    const previous = profile.displayName;
    setProfile({ ...profile, displayName: trimmed });
    try {
      if (isFirebaseConfigured) {
        await updateUserProfile(profile.uid, { displayName: trimmed });
      }
      setNameEditing(false);
      toast.success(t('profile.nameSaved'));
    } catch {
      setProfile({ ...profile, displayName: previous });
      toast.error(t('errors.generic'));
    } finally {
      setSavingName(false);
    }
  };

  const onSaveTargetWeight = async () => {
    const trimmed = targetWeightInput.trim().replace(',', '.');
    if (trimmed === '') {
      toast.error(t('profile.targetWeightInvalid'));
      return;
    }
    const value = Number(trimmed);
    if (!Number.isFinite(value) || value < 30 || value > 300) {
      toast.error(t('profile.targetWeightInvalid'));
      return;
    }
    if (!profile) return;
    setSavingTarget(true);
    const previous = profile.targetWeight;
    const next = Math.round(value * 10) / 10;
    setProfile({ ...profile, targetWeight: next });
    try {
      if (isFirebaseConfigured) {
        await updateUserProfile(profile.uid, { targetWeight: next });
      }
      toast.success(t('profile.targetWeightSaved'));
    } catch (e) {
      setProfile({ ...profile, targetWeight: previous });
      toast.error(t('errors.generic'));
    } finally {
      setSavingTarget(false);
    }
  };

  const onRemoveTargetWeight = async () => {
    if (!profile) return;
    setSavingTarget(true);
    const previous = profile.targetWeight;
    setProfile({ ...profile, targetWeight: null });
    setTargetWeightInput('');
    try {
      if (isFirebaseConfigured) {
        await updateUserProfile(profile.uid, { targetWeight: null });
      }
    } catch {
      setProfile({ ...profile, targetWeight: previous });
    } finally {
      setSavingTarget(false);
    }
  };

  const themeLabel: Record<ThemePreference, string> = {
    system: t('profile.themeSystem'),
    dark: t('profile.themeDark'),
    light: t('profile.themeLight'),
  };

  return (
    <Screen scroll padded withBottomInset>
      <Text variant="title" style={styles.title}>
        {t('profile.title')}
      </Text>

      {emailVerified === false ? (
        <Card
          style={[
            styles.verifyBanner,
            {
              backgroundColor: theme.colors.warning + '15',
              borderColor: theme.colors.warning + '40',
            },
          ]}
        >
          <Text size="sm" weight="semibold" color={theme.colors.warning}>
            {t('profile.emailNotVerifiedTitle')}
          </Text>
          <Text variant="caption" muted style={styles.verifyDesc}>
            {t('profile.emailNotVerifiedDesc')}
          </Text>
          <View style={styles.verifyActions}>
            <Button
              size="sm"
              fullWidth={false}
              title={t('profile.resendVerification')}
              onPress={onResendVerification}
              loading={verificationBusy}
            />
            <Button
              size="sm"
              variant="ghost"
              fullWidth={false}
              title={t('profile.checkAgain')}
              onPress={onCheckVerification}
              loading={verificationBusy}
            />
          </View>
        </Card>
      ) : null}

      <Card style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text variant="heading" color={theme.colors.primaryContrast}>
            {(profile?.displayName ?? profile?.email ?? '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileMeta}>
          {nameEditing ? (
            <View style={styles.nameEditRow}>
              <Input
                value={nameInput}
                onChangeText={setNameInput}
                placeholder={t('onboarding.namePlaceholder')}
                autoCapitalize="words"
                autoFocus
                containerStyle={styles.nameInput}
              />
              <Button
                size="sm"
                fullWidth={false}
                title={t('common.save')}
                onPress={onSaveName}
                loading={savingName}
              />
              <Button
                size="sm"
                variant="ghost"
                fullWidth={false}
                title={t('common.cancel')}
                onPress={() => {
                  setNameInput(profile?.displayName ?? '');
                  setNameEditing(false);
                }}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setNameInput(profile?.displayName ?? '');
                setNameEditing(true);
              }}
              style={styles.nameRow}
              hitSlop={6}
            >
              <Text variant="heading">{profile?.displayName ?? t('onboarding.nameLabel')}</Text>
              <Text size="sm" muted>
                ✏️
              </Text>
            </Pressable>
          )}
          <Text variant="caption" muted>
            {profile?.email ?? '—'}
          </Text>
          {profile?.streakCount ? (
            <Text variant="caption" color={theme.colors.primary}>
              🔥 {profile.streakCount} gün
            </Text>
          ) : null}
        </View>
      </Card>

      {/* Achievements */}
      <View style={styles.section}>
        <Text variant="label" muted>
          🏆 Basarimlar
        </Text>
        <View style={styles.achievementsGrid}>
          {achievements.map((a) => (
            <Card
              key={a.id}
              style={[
                styles.achievementCard,
                !a.unlocked && { opacity: 0.45 },
              ]}
            >
              <Text size="2xl">{a.icon}</Text>
              <Text size="xs" weight="semibold" align="center">
                {isTr ? a.titleTr : a.titleEn}
              </Text>
              {a.progress ? (
                <Text variant="caption" muted align="center">
                  {a.progress.current}/{a.progress.target}
                </Text>
              ) : null}
            </Card>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="label" muted>
          {t('profile.settings')}
        </Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Text>{t('profile.language')}</Text>
            <Button
              size="sm"
              variant="ghost"
              fullWidth={false}
              title={i18n.language === 'tr' ? 'Türkçe' : 'English'}
              onPress={onSwitchLocale}
            />
          </View>
          <View style={[styles.row, styles.divider, { borderTopColor: theme.colors.border }]}>
            <Text>{t('profile.theme')}</Text>
            <Button
              size="sm"
              variant="ghost"
              fullWidth={false}
              title={themeLabel[themePref]}
              onPress={cycleTheme}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Card style={styles.card}>
          <Pressable
            onPress={() => navigation.navigate('Measurements')}
            style={styles.row}
          >
            <Text>{t('measurements.title')}</Text>
            <Text muted>›</Text>
          </Pressable>
        </Card>
      </View>

      {/* Hedef kilo — Vücut sekmesindeki ETA için */}
      <View style={styles.section}>
        <Text variant="label" muted>
          {t('reports.targetWeight')}
        </Text>
        <Card style={styles.card}>
          <Text variant="caption" muted>
            {t('profile.targetWeightHelper')}
          </Text>
          <Input
            placeholder={t('profile.targetWeightPlaceholder')}
            value={targetWeightInput}
            onChangeText={setTargetWeightInput}
            keyboardType="decimal-pad"
            containerStyle={styles.targetInput}
          />
          <View style={styles.targetActions}>
            <Button
              size="sm"
              fullWidth={false}
              title={t('profile.saveTargetWeight')}
              onPress={onSaveTargetWeight}
              loading={savingTarget}
            />
            {profile?.targetWeight !== null && profile?.targetWeight !== undefined ? (
              <Button
                size="sm"
                variant="ghost"
                fullWidth={false}
                title={t('profile.removeTargetWeight')}
                onPress={onRemoveTargetWeight}
              />
            ) : null}
          </View>
        </Card>
      </View>

      {/* Yasal + Hakkında */}
      <View style={styles.section}>
        <Text variant="label" muted>
          {t('profile.about')}
        </Text>
        <Card style={styles.card}>
          <Pressable
            onPress={() => navigation.navigate('Legal', { kind: 'privacy' })}
            style={styles.row}
          >
            <Text>{t('profile.privacy')}</Text>
            <Text muted>›</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Legal', { kind: 'terms' })}
            style={[styles.row, styles.divider, { borderTopColor: theme.colors.border }]}
          >
            <Text>{t('profile.terms')}</Text>
            <Text muted>›</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              Linking.openURL('mailto:myfitcraft.app@gmail.com').catch(() => {})
            }
            style={[styles.row, styles.divider, { borderTopColor: theme.colors.border }]}
          >
            <Text>{t('profile.supportEmail')}</Text>
            <Text muted>›</Text>
          </Pressable>
          <View style={[styles.row, styles.divider, { borderTopColor: theme.colors.border }]}>
            <Text muted>{t('profile.version')}</Text>
            <Text muted>{appVersion}</Text>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Button title={t('auth.logout')} variant="danger" onPress={onLogout} />
      </View>
    </Screen>
  );
}

const appVersion: string = (() => {
  const v =
    (Constants.expoConfig?.version as string | undefined) ??
    (Constants.manifest2 as { version?: string } | undefined)?.version;
  return v ?? '1.0.0';
})();

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementCard: {
    width: '30.5%',
    alignItems: 'center',
    gap: 4,
    padding: 12,
  },
  section: {
    gap: 8,
    marginTop: 16,
  },
  card: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  nameInput: {
    flex: 1,
    minWidth: 140,
    marginBottom: 0,
  },
  targetInput: {
    marginTop: 8,
    marginBottom: 8,
  },
  targetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  verifyBanner: {
    borderWidth: 1,
    marginBottom: 12,
    gap: 6,
  },
  verifyDesc: {
    marginBottom: 4,
  },
  verifyActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
});
