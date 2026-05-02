import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Screen, Text, Button, Card, Input } from '@/components/ui';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
import { useTheme } from '@/app/providers/ThemeProvider';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { isFirebaseConfigured } from '@/services/firebase';
import { updateUserProfile } from '@/services/users.service';
import type { ExperienceLevel, Goal } from '@/types/models';

type IntroSlide = { titleKey: string; subtitleKey: string; iconName: IoniconName };

const SLIDES: IntroSlide[] = [
  { titleKey: 'onboarding.title1', subtitleKey: 'onboarding.subtitle1', iconName: 'calendar' },
  { titleKey: 'onboarding.title2', subtitleKey: 'onboarding.subtitle2', iconName: 'clipboard' },
  { titleKey: 'onboarding.title3', subtitleKey: 'onboarding.subtitle3', iconName: 'trending-up' },
];

const GOALS: Goal[] = ['bulk', 'cut', 'strength', 'maintain'];
const LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

type Phase = 'intro' | 'name' | 'goal' | 'level' | 'body' | 'done';

export function OnboardingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const hasSeenIntro = useSettingsStore((s) => s.hasSeenOnboardingIntro);
  const markIntroSeen = useSettingsStore((s) => s.markOnboardingIntroSeen);

  const uid = useAuthStore((s) => s.uid);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  // Mantık:
  // - Henüz auth olmamışsa sadece intro göster, intro biter bitmez auth stack'e geç
  // - Auth olmuş ama profile incomplete ise intro görüldüyse uygun phase'den başla
  const computeInitialPhase = (): Phase => {
    if (!hasSeenIntro || !uid) return 'intro';
    if (!profile?.displayName) return 'name';
    if (!profile.goal) return 'goal';
    if (!profile.experienceLevel) return 'level';
    return 'body';
  };

  const [phase, setPhase] = useState<Phase>(computeInitialPhase);
  const [slideIndex, setSlideIndex] = useState(0);
  const [name, setName] = useState<string>(profile?.displayName ?? '');
  const [goal, setGoal] = useState<Goal | null>(profile?.goal ?? null);
  const [level, setLevel] = useState<ExperienceLevel | null>(profile?.experienceLevel ?? null);
  const [height, setHeight] = useState<string>(profile?.height ? String(profile.height) : '');
  const [weight, setWeight] = useState<string>(profile?.weight ? String(profile.weight) : '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPhase(computeInitialPhase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSeenIntro, uid, profile?.displayName, profile?.goal, profile?.experienceLevel]);

  const onIntroNext = () => {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex(slideIndex + 1);
      return;
    }
    markIntroSeen();
    // Henüz auth olmadıysa AuthStack'e geçiş RootNavigator tarafından otomatik
    // yapılır; auth ise isim phase'inden başla (yoksa atlar)
    if (uid) setPhase(profile?.displayName ? 'goal' : 'name');
  };

  const onSaveName = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      Alert.alert(t('common.appName'), t('onboarding.nameRequired'));
      return;
    }
    if (!uid) {
      setPhase('goal');
      return;
    }
    // Lokal optimistic
    if (profile) {
      setProfile({ ...profile, displayName: trimmed });
    }
    setPhase('goal');
    if (isFirebaseConfigured) {
      // Arka planda Firestore'a yaz; başarısız olursa sessizce yeniden denenir
      try {
        await updateUserProfile(uid, { displayName: trimmed });
      } catch {
        // sessiz
      }
    }
  };

  const onSaveProfile = async () => {
    if (!uid) return;
    const h = Number(height);
    const w = Number(weight);
    if (!goal || !level || !Number.isFinite(h) || !Number.isFinite(w) || h < 100 || w < 30) {
      Alert.alert(t('common.appName'), t('errors.required'));
      return;
    }

    if (!isFirebaseConfigured) {
      // Firebase olmasa bile lokal olarak profili "complete" işaretleyelim
      setProfile({
        ...(profile ?? {
          uid,
          email: null,
          displayName: null,
          photoURL: null,
          locale: 'tr',
          theme: 'system',
          createdAt: Date.now(),
          streakCount: 0,
          lastWorkoutDate: null,
          isPremium: false,
          activeProgramId: null,
          programSchedule: null,
          programStartedAt: null,
          targetWeight: null,
        }),
        goal,
        experienceLevel: level,
        height: h,
        weight: w,
        onboardingCompleted: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      await updateUserProfile(uid, {
        goal,
        experienceLevel: level,
        height: h,
        weight: w,
        onboardingCompleted: true,
      });
      if (profile) {
        setProfile({
          ...profile,
          goal,
          experienceLevel: level,
          height: h,
          weight: w,
          onboardingCompleted: true,
        });
      }
    } catch (e) {
      Alert.alert(t('common.appName'), t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderIntro = () => {
    const slide = SLIDES[slideIndex];
    return (
      <View style={styles.flex}>
        <View style={styles.heroPlaceholder}>
          <LinearGradient
            colors={[theme.colors.primary, '#C84618']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroBlock, { borderRadius: theme.radius['2xl'] }]}
          >
            <View style={styles.heroIconBg} pointerEvents="none">
              <Ionicons name="barbell" size={56} color={theme.colors.primaryContrast} />
            </View>
            <Ionicons name={slide.iconName} size={68} color={theme.colors.primaryContrast} />
          </LinearGradient>
        </View>
        <View style={styles.introTextWrap}>
          <Text variant="title" align="center">
            {t(slide.titleKey)}
          </Text>
          <Text variant="body" muted align="center" style={styles.introSubtitle}>
            {t(slide.subtitleKey)}
          </Text>
        </View>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === slideIndex ? theme.colors.primary : theme.colors.border,
                  width: i === slideIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.actions}>
          <Button title={t('common.continue')} onPress={onIntroNext} />
          {slideIndex < SLIDES.length - 1 ? (
            <Pressable onPress={() => setSlideIndex(SLIDES.length - 1)} style={styles.skipBtn}>
              <Text variant="caption" muted>
                {t('common.skip')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  const renderName = () => (
    <View style={styles.flex}>
      <Text variant="title">{t('onboarding.nameQuestion')}</Text>
      <Text variant="body" muted>
        {t('onboarding.nameHelper')}
      </Text>
      <View style={styles.bodyForm}>
        <Input
          label={t('onboarding.nameLabel')}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoCorrect={false}
          placeholder={t('onboarding.namePlaceholder')}
          autoFocus
        />
      </View>
      <Button title={t('common.continue')} onPress={onSaveName} />
    </View>
  );

  const renderGoal = () => (
    <View style={styles.flex}>
      <Text variant="title">{t('onboarding.goalQuestion')}</Text>
      <View style={styles.choices}>
        {GOALS.map((g) => (
          <Card
            key={g}
            onPress={() => setGoal(g)}
            elevated={goal === g}
            style={[
              styles.choiceCard,
              goal === g && { borderColor: theme.colors.primary, borderWidth: 1 },
            ]}
          >
            <Text variant="heading">{t(`onboarding.goal${g.charAt(0).toUpperCase() + g.slice(1)}`)}</Text>
          </Card>
        ))}
      </View>
      <Button
        title={t('common.continue')}
        onPress={() => setPhase('level')}
        disabled={!goal}
      />
    </View>
  );

  const renderLevel = () => (
    <View style={styles.flex}>
      <Text variant="title">{t('onboarding.experienceQuestion')}</Text>
      <View style={styles.choices}>
        {LEVELS.map((lv) => (
          <Card
            key={lv}
            onPress={() => setLevel(lv)}
            elevated={level === lv}
            style={[
              styles.choiceCard,
              level === lv && { borderColor: theme.colors.primary, borderWidth: 1 },
            ]}
          >
            <Text variant="heading">
              {t(`onboarding.experience${lv.charAt(0).toUpperCase() + lv.slice(1)}`)}
            </Text>
          </Card>
        ))}
      </View>
      <Button
        title={t('common.continue')}
        onPress={() => setPhase('body')}
        disabled={!level}
      />
    </View>
  );

  const renderBody = () => (
    <View style={styles.flex}>
      <Text variant="title">{t('onboarding.bodyQuestion')}</Text>
      <View style={styles.bodyForm}>
        <Input
          label={t('onboarding.heightLabel')}
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
          placeholder="175"
        />
        <Input
          label={t('onboarding.weightLabel')}
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
          placeholder="75"
        />
      </View>
      <Button
        title={t('common.finish')}
        loading={submitting}
        onPress={onSaveProfile}
      />
    </View>
  );

  return (
    <Screen padded>
      <View style={[styles.flex, { width: width - 32 }]}>
        {phase === 'intro' && renderIntro()}
        {phase === 'name' && renderName()}
        {phase === 'goal' && renderGoal()}
        {phase === 'level' && renderLevel()}
        {phase === 'body' && renderBody()}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: 16,
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBlock: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  heroIconBg: {
    position: 'absolute',
    opacity: 0.18,
    transform: [{ rotate: '-12deg' }],
  },
  introTextWrap: {
    gap: 8,
  },
  introSubtitle: {
    paddingHorizontal: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actions: {
    gap: 12,
    paddingBottom: 16,
  },
  skipBtn: {
    alignSelf: 'center',
    padding: 8,
  },
  choices: {
    gap: 10,
  },
  choiceCard: {
    paddingVertical: 18,
  },
  bodyForm: {
    gap: 14,
  },
});
