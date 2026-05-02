import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { Screen, Text, Card, Button, Input, Chip } from '@/components/ui';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuthStore } from '@/stores/auth.store';
import { useProgramsStore } from '@/stores/programs.store';
import { isFirebaseConfigured } from '@/services/firebase';
import { saveUserProgram } from '@/services/programs.service';
import { useExercises } from '@/hooks/useExercises';
import { ALL_MUSCLES, muscleColor } from '@/constants/muscles';
import { ExerciseImage } from '@/components/exercise/ExerciseImage';
import type {
  Exercise,
  ExperienceLevel,
  Goal,
  MuscleGroup,
  Program,
  ProgramDay,
  ProgramExercise,
} from '@/types/models';
import type { ProgramBundle } from '@/features/programs/seed';

interface DraftDay {
  id: string;
  name: string;
  exercises: DraftDayExercise[];
}

interface DraftDayExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds: number;
}

const GOALS: Goal[] = ['bulk', 'cut', 'strength', 'maintain'];
const LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function ProgramBuilderScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const isTr = i18n.language === 'tr';

  const uid = useAuthStore((s) => s.uid);
  const reload = useProgramsStore((s) => s.reload);
  const { items: allExercises } = useExercises();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState<Goal>('bulk');
  const [level, setLevel] = useState<ExperienceLevel>('intermediate');
  const [days, setDays] = useState<DraftDay[]>([
    { id: makeId('day'), name: 'Day 1', exercises: [] },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [pickerForDay, setPickerForDay] = useState<string | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerMuscle, setPickerMuscle] = useState<MuscleGroup | null>(null);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  const addDay = () => {
    setDays((d) => [
      ...d,
      { id: makeId('day'), name: `Day ${d.length + 1}`, exercises: [] },
    ]);
  };

  const removeDay = (dayId: string) => {
    setDays((d) => d.filter((x) => x.id !== dayId));
  };

  const addExerciseToDay = (dayId: string, exerciseId: string, exerciseName: string) => {
    setDays((d) =>
      d.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises: [
                ...day.exercises,
                {
                  id: makeId('ex'),
                  exerciseId,
                  exerciseName,
                  sets: 3,
                  reps: '8-12',
                  restSeconds: 90,
                },
              ],
            }
          : day,
      ),
    );
    closePicker();
  };

  const closePicker = () => {
    setPickerForDay(null);
    setPickerQuery('');
    setPickerMuscle(null);
    setPreviewExercise(null);
  };

  const openPreview = (ex: Exercise) => {
    setPreviewExercise(ex);
  };

  const closePreview = () => {
    setPreviewExercise(null);
  };

  const confirmAddPreview = () => {
    if (!pickerForDay || !previewExercise) return;
    addExerciseToDay(
      pickerForDay,
      previewExercise.id,
      isTr ? previewExercise.nameTr : previewExercise.name,
    );
  };

  // Picker liste verisi — arama + kas grubu filtresi.
  const pickerItems = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    return allExercises.filter((ex) => {
      if (pickerMuscle && ex.primaryMuscle !== pickerMuscle) return false;
      if (!q) return true;
      const name = (isTr ? ex.nameTr : ex.name).toLowerCase();
      return name.includes(q) || ex.name.toLowerCase().includes(q);
    });
  }, [allExercises, pickerQuery, pickerMuscle, isTr]);

  const removeExercise = (dayId: string, exerciseId: string) => {
    setDays((d) =>
      d.map((day) =>
        day.id === dayId
          ? { ...day, exercises: day.exercises.filter((e) => e.id !== exerciseId) }
          : day,
      ),
    );
  };

  /**
   * Bir egzersizin set/reps/restSeconds alanını günceller.
   * Numeric alanlarda boş string'i 0'a çevirme — kullanıcı yazarken sıfırlanmasın.
   */
  const updateExerciseField = <K extends keyof DraftDayExercise>(
    dayId: string,
    exerciseId: string,
    field: K,
    value: DraftDayExercise[K],
  ) => {
    setDays((d) =>
      d.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises: day.exercises.map((e) =>
                e.id === exerciseId ? { ...e, [field]: value } : e,
              ),
            }
          : day,
      ),
    );
  };

  const onSave = async () => {
    if (!uid) {
      Alert.alert(t('common.appName'), t('errors.generic'));
      return;
    }
    if (!name.trim()) {
      Alert.alert(t('programs.nameLabel'), t('programs.nameRequired'));
      return;
    }
    if (days.length === 0 || days.every((d) => d.exercises.length === 0)) {
      Alert.alert(t('common.appName'), t('programs.atLeastOneExercise'));
      return;
    }

    if (!isFirebaseConfigured) {
      Alert.alert(t('common.appName'), t('errors.firebaseNotConfigured'));
      return;
    }

    const programId = makeId('program');
    const program: Program = {
      id: programId,
      ownerId: uid,
      name: name.trim(),
      nameTr: name.trim(),
      description: description.trim(),
      descriptionTr: description.trim(),
      goal,
      level,
      frequencyPerWeek: days.length,
      durationWeeks: 4,
      isPreset: false,
      createdAt: Date.now(),
    };

    const programDays: ProgramDay[] = days.map((d, i) => ({
      id: d.id,
      programId,
      ownerId: uid,
      dayOrder: i + 1,
      focus: 'custom',
      name: d.name,
      nameTr: d.name,
    }));

    const programExercises: ProgramExercise[] = days.flatMap((d) =>
      d.exercises.map((e, idx) => ({
        id: e.id,
        programDayId: d.id,
        ownerId: uid,
        exerciseId: e.exerciseId,
        orderInDay: idx + 1,
        defaultSets: e.sets,
        defaultReps: e.reps,
        defaultRestSeconds: e.restSeconds,
        supersetGroup: null,
        notes: null,
      })),
    );

    const bundle: ProgramBundle = {
      program,
      days: programDays,
      exercises: programExercises,
    };

    setSubmitting(true);
    try {
      await saveUserProgram(bundle);
      await reload(uid);
      navigation.goBack();
    } catch {
      Alert.alert(t('common.appName'), t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderExercisePicker = () => {
    return (
      <Modal
        visible={pickerForDay !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closePicker}
      >
        <SafeAreaView
          edges={['top', 'bottom']}
          style={[styles.modalRoot, { backgroundColor: theme.colors.background }]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.colors.border, paddingHorizontal: theme.spacing.lg },
            ]}
          >
            <Text variant="heading">{t('programs.addExercise')}</Text>
            <Pressable
              onPress={closePicker}
              hitSlop={12}
              style={[
                styles.modalCloseBtn,
                { backgroundColor: theme.colors.surfaceElevated },
              ]}
            >
              <Text size="md">×</Text>
            </Pressable>
          </View>

          <View style={[styles.modalSearch, { paddingHorizontal: theme.spacing.lg }]}>
            <Input
              value={pickerQuery}
              onChangeText={setPickerQuery}
              placeholder={t('exercises.searchPlaceholder')}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Kas grubu chip'leri — wrap (2 satır), hepsi tam görünür */}
          <View
            style={[
              styles.modalChipsWrap,
              { paddingHorizontal: theme.spacing.lg },
            ]}
          >
            <Chip
              label={t('common.all')}
              selected={pickerMuscle === null}
              onPress={() => setPickerMuscle(null)}
            />
            {ALL_MUSCLES.map((m) => (
              <Chip
                key={m}
                label={t(`muscles.${m}`)}
                selected={pickerMuscle === m}
                onPress={() => setPickerMuscle(pickerMuscle === m ? null : m)}
              />
            ))}
          </View>

          <View style={[styles.modalCount, { paddingHorizontal: theme.spacing.lg }]}>
            <Text variant="caption" muted>
              {t('exercises.resultsCount', { count: pickerItems.length })}
            </Text>
          </View>

          <FlatList
            data={pickerItems}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            windowSize={10}
            contentContainerStyle={[
              styles.modalListContent,
              { paddingHorizontal: theme.spacing.lg },
            ]}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item: ex }) => (
              <Pressable
                onPress={() => openPreview(ex)}
                android_ripple={{ color: theme.colors.surfaceElevated }}
                style={[styles.pickerItem, { borderColor: theme.colors.border }]}
              >
                <ExerciseImage
                  imageUrl={ex.imageUrl}
                  animationUrl={ex.animationUrl}
                  primaryMuscle={ex.primaryMuscle}
                  size={48}
                />
                <View style={styles.pickerItemBody}>
                  <Text weight="medium" numberOfLines={1}>
                    {isTr ? ex.nameTr : ex.name}
                  </Text>
                  <Text variant="caption" muted numberOfLines={1}>
                    {t(`muscles.${ex.primaryMuscle}`)} · {t(`equipment.${ex.equipment}`)}
                  </Text>
                </View>
                <Text muted size="lg">
                  ›
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.modalEmpty}>
                <Text muted align="center">
                  {t('exercises.noResults')}
                </Text>
              </View>
            }
          />
        </SafeAreaView>

        {renderPreviewSheet()}
      </Modal>
    );
  };

  // Egzersize tıklandığında açılan detay sheet'i (görsel + açıklama + Ekle).
  const renderPreviewSheet = () => {
    return (
      <Modal
        visible={previewExercise !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closePreview}
      >
        {previewExercise ? (
          <SafeAreaView
            edges={['top', 'bottom']}
            style={[styles.modalRoot, { backgroundColor: theme.colors.background }]}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor: theme.colors.border,
                  paddingHorizontal: theme.spacing.lg,
                },
              ]}
            >
              <Text variant="heading" numberOfLines={1} style={{ flex: 1 }}>
                {isTr ? previewExercise.nameTr : previewExercise.name}
              </Text>
              <Pressable
                onPress={closePreview}
                hitSlop={12}
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: theme.colors.surfaceElevated },
                ]}
              >
                <Text size="md">×</Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.previewScroll,
                { paddingHorizontal: theme.spacing.lg },
              ]}
            >
              {/* Hero görsel */}
              <View
                style={[
                  styles.previewHero,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.lg,
                  },
                ]}
              >
                <ExerciseImage
                  imageUrl={previewExercise.imageUrl}
                  animationUrl={previewExercise.animationUrl}
                  primaryMuscle={previewExercise.primaryMuscle}
                  size={260}
                  animated
                  animationIntervalMs={1100}
                />
              </View>

              {/* Etiketler */}
              <View style={styles.previewChips}>
                <Chip
                  label={t(`muscles.${previewExercise.primaryMuscle}`)}
                  selected
                  color={muscleColor(previewExercise.primaryMuscle)}
                />
                <Chip label={t(`equipment.${previewExercise.equipment}`)} />
                {previewExercise.isCompound ? <Chip label="Compound" /> : null}
              </View>

              {/* Talimatlar */}
              {(() => {
                const hasTrInstructions =
                  isTr &&
                  previewExercise.instructionStepsTr.length > 0 &&
                  previewExercise.instructionStepsTr.some(
                    (step, i) => step !== previewExercise.instructionSteps[i],
                  );
                const steps =
                  isTr && hasTrInstructions
                    ? previewExercise.instructionStepsTr
                    : previewExercise.instructionSteps;
                return (
                  <View style={styles.previewSection}>
                    <Text variant="label" weight="bold" style={styles.previewSectionTitle}>
                      {t('exercises.instructions')}
                    </Text>
                    <Card>
                      {steps.map((step, idx) => (
                        <View key={idx} style={styles.previewStepRow}>
                          <View
                            style={[
                              styles.previewStepNumber,
                              { backgroundColor: theme.colors.primary },
                            ]}
                          >
                            <Text size="sm" weight="bold" color={theme.colors.primaryContrast}>
                              {idx + 1}
                            </Text>
                          </View>
                          <Text style={styles.previewStepText}>{step}</Text>
                        </View>
                      ))}
                    </Card>
                  </View>
                );
              })()}

              {/* İpuçları */}
              {(() => {
                const tips =
                  isTr && previewExercise.tipsTr.length > 0
                    ? previewExercise.tipsTr
                    : previewExercise.tips;
                if (tips.length === 0) return null;
                return (
                  <View style={styles.previewSection}>
                    <Text variant="label" weight="bold" style={styles.previewSectionTitle}>
                      {t('exercises.tips')}
                    </Text>
                    <Card>
                      {tips.map((tip, idx) => (
                        <View key={idx} style={styles.previewTipRow}>
                          <Text color={theme.colors.primary} weight="bold" size="md">
                            ▸
                          </Text>
                          <Text style={styles.previewTipText}>{tip}</Text>
                        </View>
                      ))}
                    </Card>
                  </View>
                );
              })()}
            </ScrollView>

            {/* Sticky alt CTA — Ekle */}
            <View
              style={[
                styles.previewFooter,
                {
                  backgroundColor: theme.colors.background,
                  borderTopColor: theme.colors.border,
                  paddingHorizontal: theme.spacing.lg,
                },
              ]}
            >
              <Button
                title={t('exercises.addToProgram')}
                onPress={confirmAddPreview}
              />
            </View>
          </SafeAreaView>
        ) : null}
      </Modal>
    );
  };

  return (
    <Screen scroll padded withBottomInset>
      <Text variant="title" style={styles.title}>
        {t('programs.createNew')}
      </Text>

      <View style={styles.form}>
        <Input
          label={t('programs.nameLabel')}
          value={name}
          onChangeText={setName}
          placeholder={t('programs.namePlaceholder')}
        />
        <Input
          label={t('programs.descriptionLabel')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('programs.descriptionPlaceholder')}
          multiline
        />

        <View>
          <Text variant="label" muted style={styles.label}>
            {t('programs.goalLabel')}
          </Text>
          <View style={styles.choiceRow}>
            {GOALS.map((g) => (
              <Pressable
                key={g}
                onPress={() => setGoal(g)}
                style={[
                  styles.choice,
                  {
                    backgroundColor:
                      goal === g ? theme.colors.primary : theme.colors.surfaceElevated,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <Text
                  size="sm"
                  weight="medium"
                  color={goal === g ? theme.colors.primaryContrast : theme.colors.text}
                >
                  {t(`onboarding.goal${capitalize(g)}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text variant="label" muted style={styles.label}>
            {t('programs.levelLabel')}
          </Text>
          <View style={styles.choiceRow}>
            {LEVELS.map((lv) => (
              <Pressable
                key={lv}
                onPress={() => setLevel(lv)}
                style={[
                  styles.choice,
                  {
                    backgroundColor:
                      level === lv ? theme.colors.primary : theme.colors.surfaceElevated,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <Text
                  size="sm"
                  weight="medium"
                  color={level === lv ? theme.colors.primaryContrast : theme.colors.text}
                >
                  {t(`onboarding.experience${capitalize(lv)}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.daysSection}>
        <View style={styles.sectionHeader}>
          <Text variant="label" muted>
            {t('programs.days')}
          </Text>
          <Button size="sm" fullWidth={false} title={t('programs.addDay')} onPress={addDay} />
        </View>

        {days.map((day) => (
          <Card key={day.id} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Input
                value={day.name}
                onChangeText={(v) =>
                  setDays((d) => d.map((x) => (x.id === day.id ? { ...x, name: v } : x)))
                }
                containerStyle={{ flex: 1 }}
              />
              {days.length > 1 ? (
                <Pressable onPress={() => removeDay(day.id)} style={styles.removeBtn}>
                  <Text color={theme.colors.danger}>×</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.exerciseList}>
              {day.exercises.map((e) => (
                <View
                  key={e.id}
                  style={[styles.exerciseCard, { borderColor: theme.colors.border }]}
                >
                  <View style={styles.exerciseHeadRow}>
                    <Text weight="medium" numberOfLines={1} style={{ flex: 1 }}>
                      {e.exerciseName}
                    </Text>
                    <Pressable
                      onPress={() => removeExercise(day.id, e.id)}
                      hitSlop={10}
                      style={styles.removeMini}
                    >
                      <Text color={theme.colors.danger} size="lg">
                        ×
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.exerciseFieldsRow}>
                    <FieldStepper
                      label={t('programs.sets')}
                      value={e.sets}
                      onChange={(v) =>
                        updateExerciseField(day.id, e.id, 'sets', v)
                      }
                      min={1}
                      max={10}
                    />
                    <View style={styles.exerciseField}>
                      <Text variant="caption" muted>
                        {t('programs.reps')}
                      </Text>
                      <Input
                        value={e.reps}
                        onChangeText={(v) =>
                          updateExerciseField(day.id, e.id, 'reps', v)
                        }
                        placeholder="8-12"
                        autoCapitalize="none"
                        autoCorrect={false}
                        containerStyle={styles.fieldInput}
                      />
                    </View>
                    <FieldStepper
                      label={t('programs.restShort')}
                      value={e.restSeconds}
                      onChange={(v) =>
                        updateExerciseField(day.id, e.id, 'restSeconds', v)
                      }
                      min={15}
                      max={600}
                      step={15}
                      suffix="s"
                    />
                  </View>
                </View>
              ))}
              <Button
                size="sm"
                variant="ghost"
                title={`+ ${t('programs.addExercise')}`}
                onPress={() => setPickerForDay(day.id)}
              />
            </View>
          </Card>
        ))}
      </View>

      <Button title={t('common.save')} loading={submitting} onPress={onSave} style={styles.saveBtn} />

      {renderExercisePicker()}
    </Screen>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Sayısal alan için kompakt -/+ stepper. Set ve dinlenme süresi için kullanılıyor.
 * `step` artırma/azaltma adımı; `suffix` görünüm için ('s' = saniye).
 */
function FieldStepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  const theme = useTheme();
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  const canDec = value > min;
  const canInc = value < max;
  return (
    <View style={stepperStyles.field}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <View
        style={[
          stepperStyles.stepperBox,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Pressable
          onPress={dec}
          disabled={!canDec}
          hitSlop={6}
          style={stepperStyles.stepperBtn}
        >
          <Text
            size="lg"
            weight="bold"
            color={canDec ? theme.colors.text : theme.colors.textSubtle}
          >
            −
          </Text>
        </Pressable>
        <Text size="md" weight="semibold" align="center" style={stepperStyles.stepperValue}>
          {value}
          {suffix ?? ''}
        </Text>
        <Pressable
          onPress={inc}
          disabled={!canInc}
          hitSlop={6}
          style={stepperStyles.stepperBtn}
        >
          <Text
            size="lg"
            weight="bold"
            color={canInc ? theme.colors.text : theme.colors.textSubtle}
          >
            +
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  field: {
    flex: 1,
    gap: 4,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    height: 50,
    paddingHorizontal: 4,
  },
  stepperBtn: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    flex: 1,
    paddingHorizontal: 4,
  },
});

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
  },
  form: {
    gap: 14,
    marginBottom: 24,
  },
  label: {
    marginBottom: 6,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  daysSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCard: {
    gap: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseList: {
    gap: 10,
  },
  exerciseCard: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  exerciseHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeMini: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseFieldsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  exerciseField: {
    flex: 1,
    gap: 4,
  },
  fieldInput: {
    width: '100%',
  },
  saveBtn: {
    marginTop: 24,
    marginBottom: 16,
  },
  modalRoot: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearch: {
    paddingTop: 14,
    paddingBottom: 6,
  },
  modalChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  modalCount: {
    paddingTop: 4,
    paddingBottom: 6,
  },
  modalListContent: {
    paddingTop: 4,
    paddingBottom: 32,
    flexGrow: 1,
  },
  modalEmpty: {
    paddingTop: 64,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  pickerItemBody: {
    flex: 1,
    gap: 2,
  },
  previewScroll: {
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  previewHero: {
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  previewSection: {
    gap: 10,
  },
  previewSectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  previewStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewStepText: {
    flex: 1,
    lineHeight: 22,
  },
  previewTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  previewTipText: {
    flex: 1,
    lineHeight: 22,
  },
  previewFooter: {
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
