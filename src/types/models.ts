/**
 * Domain modelleri - Firestore koleksiyonlarına 1:1 karşılık gelir.
 * Bu tipleri hem servis hem UI katmanı kullanır.
 */

export type Goal = 'bulk' | 'cut' | 'maintain' | 'strength';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Locale = 'tr' | 'en';
export type ThemePreference = 'light' | 'dark' | 'system';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'fullBody';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'bands'
  | 'other';

export type Mechanic = 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'isolation';
export type DayFocus = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'fullBody' | 'custom';
export type WorkoutStatus = 'in_progress' | 'completed' | 'abandoned';

/**
 * Haftanın günleri. ISO 8601 standardı: 1=Pazartesi, 7=Pazar.
 * Örn: [1, 3, 5] = Pzt/Çar/Cum.
 */
export type WeekDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  goal: Goal | null;
  height: number | null; // cm
  weight: number | null; // kg
  experienceLevel: ExperienceLevel | null;
  locale: Locale;
  theme: ThemePreference;
  createdAt: number;
  onboardingCompleted: boolean;
  streakCount: number;
  lastWorkoutDate: number | null;
  isPremium: boolean;
  /**
   * Kullanıcının seçtiği aktif program. null ise dashboard "program seç" CTA gösterir.
   */
  activeProgramId: string | null;
  /**
   * Aktif programı haftanın hangi günlerinde uygulayacak.
   * Programın frequencyPerWeek'i kadar gün seçilmelidir.
   * Örn: 4 günlük programa [1,2,4,5] = Pzt(Day1) / Sal(Day2) / Per(Day3) / Cum(Day4).
   */
  programSchedule: WeekDay[] | null;
  /**
   * Bu aktif program ne zaman atandı? Schedule değişimini izlemek için.
   */
  programStartedAt: number | null;
  /**
   * Hedef kilo (kg). Vücut sekmesinde ETA tahmini için kullanılır.
   * null ise rapor sadece haftalık değişim gösterir.
   */
  targetWeight: number | null;
}

export interface Exercise {
  id: string;
  name: string;
  nameTr: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  mechanic: Mechanic;
  isCompound: boolean;
  difficulty: ExperienceLevel;
  animationUrl: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  instructionSteps: string[];
  instructionStepsTr: string[];
  tips: string[];
  tipsTr: string[];
  /**
   * true → çeviri AI tarafından otomatik üretildi; UI'da küçük "⚡ Auto" rozeti gösterilir.
   * false/undefined → manuel kaliteli çeviri veya çeviri yok.
   */
  isAutoTranslated?: boolean;
}

export interface Program {
  id: string;
  ownerId: string | null; // null = system program
  name: string;
  nameTr: string;
  description: string;
  descriptionTr: string;
  goal: Goal;
  level: ExperienceLevel;
  frequencyPerWeek: number;
  durationWeeks: number;
  isPreset: boolean;
  createdAt: number;
}

export interface ProgramDay {
  id: string;
  programId: string;
  /**
   * Sahibinin uid'si. Preset programlar için null. Security rules için zorunlu.
   */
  ownerId: string | null;
  dayOrder: number; // 1, 2, 3...
  focus: DayFocus;
  name: string;
  nameTr: string;
}

export interface ProgramExercise {
  id: string;
  programDayId: string;
  /**
   * Sahibinin uid'si. Preset programlar için null. Security rules için zorunlu.
   */
  ownerId: string | null;
  exerciseId: string;
  orderInDay: number;
  defaultSets: number;
  defaultReps: string; // e.g. "8-12" or "5"
  defaultRestSeconds: number;
  supersetGroup: string | null;
  notes: string | null;
}

export interface Workout {
  id: string;
  userId: string;
  programId: string | null;
  programDayId: string | null;
  startedAt: number;
  completedAt: number | null;
  durationSeconds: number | null;
  status: WorkoutStatus;
  notes: string | null;
}

export interface WorkoutLog {
  id: string;
  workoutId: string;
  /**
   * Logun sahibi. Security rules ve direkt sorgular için zorunlu.
   * (Eski kayıtlarda olmayabilir; UI tarafı opsiyonel davranır.)
   */
  userId: string;
  exerciseId: string;
  setNumber: number;
  weight: number; // kg
  reps: number;
  restSeconds: number | null;
  isWarmup: boolean;
  isFailure: boolean;
  notes: string | null;
  completedAt: number;
}

export interface BodyMeasurement {
  id: string;
  userId: string;
  date: number;
  weight: number | null;
  chest: number | null;
  waist: number | null;
  arm: number | null;
  thigh: number | null;
  neck: number | null;
  bodyFatPct: number | null;
  notes: string | null;
}

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  achievedAt: number;
}

/**
 * Aktif workout sırasında local state'te tutulan, henüz Firestore'a yazılmamış log.
 */
export interface DraftSet {
  id: string; // local uuid
  setNumber: number;
  weight: number;
  reps: number;
  isWarmup: boolean;
  completed: boolean;
  restSeconds: number | null;
}

export interface DraftExercise {
  exerciseId: string;
  exerciseName: string;
  orderInDay: number;
  targetSets: number;
  targetReps: string;
  defaultRestSeconds: number;
  sets: DraftSet[];
  notes: string | null;
}

export interface ActiveWorkout {
  workoutId: string; // local uuid until completed
  programId: string | null;
  programDayId: string | null;
  programDayName: string | null;
  startedAt: number;
  exercises: DraftExercise[];
  currentExerciseIndex: number;
}
