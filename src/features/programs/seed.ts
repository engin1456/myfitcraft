import type { Program, ProgramDay, ProgramExercise } from '@/types/models';

/**
 * Preset (sistem) programları.
 * ownerId = null → tüm kullanıcılara görünür, salt-okunur.
 *
 * 5 ünlü program (StrongLifts, Starting Strength, 5/3/1 BBB, PPL 6-Day, GZCLP) +
 * 5 orijinal MyFitCraft programı (Full Body Novice, Upper/Lower, Bro Split, Home BW, Powerlifter Foundation).
 *
 * Egzersiz id'leri `src/features/exercises/seed.ts` ile birebir eşleşmeli.
 */

export interface ProgramBundle {
  program: Program;
  days: ProgramDay[];
  exercises: ProgramExercise[];
}

/**
 * Seed bundle'larını yazarken `ownerId`'yi her literal'a tek tek koymak yerine
 * Raw tiplerde optional bırakıyoruz. `PRESET_PROGRAMS` map'i tek noktada
 * `ownerId: null` enjekte eder.
 */
type RawProgramDay = Omit<ProgramDay, 'ownerId'>;
type RawProgramExercise = Omit<ProgramExercise, 'ownerId'>;
interface RawProgramBundle {
  program: Program;
  days: RawProgramDay[];
  exercises: RawProgramExercise[];
}

const ts = Date.now();

function mkExercise(
  id: string,
  programDayId: string,
  exerciseId: string,
  orderInDay: number,
  defaultSets: number,
  defaultReps: string,
  defaultRestSeconds: number,
  notes?: string,
): RawProgramExercise {
  return {
    id,
    programDayId,
    exerciseId,
    orderInDay,
    defaultSets,
    defaultReps,
    defaultRestSeconds,
    supersetGroup: null,
    notes: notes ?? null,
  };
}

// ============================================================================
// 1. StrongLifts 5x5 — Mehdi Hadim (Beginner)
// ============================================================================
const strongLifts5x5: RawProgramBundle = {
  program: {
    id: 'preset-stronglifts-5x5',
    ownerId: null,
    name: 'StrongLifts 5x5',
    nameTr: 'StrongLifts 5x5',
    description:
      'Klasik başlangıç gücü programı. Haftada 3 gün, A/B antrenman değişimi. Her egzersizde 5 set × 5 tekrar. Her seansta ağırlık artar (linear progression). Squat, Bench, OHP, Row ve Deadlift üzerine kuruludur.',
    descriptionTr:
      'Klasik başlangıç gücü programı. Haftada 3 gün, A/B antrenman değişimi. Her egzersizde 5 set × 5 tekrar. Her seansta ağırlık artar (linear progression). Squat, Bench, OHP, Row ve Deadlift üzerine kuruludur.',
    goal: 'strength',
    level: 'beginner',
    frequencyPerWeek: 3,
    durationWeeks: 12,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-sl-a',
      programId: 'preset-stronglifts-5x5',
      dayOrder: 1,
      focus: 'fullBody',
      name: 'Workout A',
      nameTr: 'Antrenman A',
    },
    {
      id: 'preset-sl-b',
      programId: 'preset-stronglifts-5x5',
      dayOrder: 2,
      focus: 'fullBody',
      name: 'Workout B',
      nameTr: 'Antrenman B',
    },
  ],
  exercises: [
    mkExercise('p-sl-a-1', 'preset-sl-a', 'barbell-squat', 1, 5, '5', 180),
    mkExercise(
      'p-sl-a-2',
      'preset-sl-a',
      'barbell-bench-press-medium-grip',
      2,
      5,
      '5',
      180,
    ),
    mkExercise('p-sl-a-3', 'preset-sl-a', 'bent-over-barbell-row', 3, 5, '5', 180),

    mkExercise('p-sl-b-1', 'preset-sl-b', 'barbell-squat', 1, 5, '5', 180),
    mkExercise('p-sl-b-2', 'preset-sl-b', 'standing-military-press', 2, 5, '5', 180),
    mkExercise('p-sl-b-3', 'preset-sl-b', 'barbell-deadlift', 3, 1, '5', 240),
  ],
};

// ============================================================================
// 2. Starting Strength — Mark Rippetoe (Beginner)
// ============================================================================
const startingStrength: RawProgramBundle = {
  program: {
    id: 'preset-starting-strength',
    ownerId: null,
    name: 'Starting Strength',
    nameTr: 'Starting Strength',
    description:
      'Mark Rippetoe\'nun klasik başlangıç gücü programı. Haftada 3 gün, A/B değişimi. 3x5 ana lift\'ler + 1x5 deadlift. Power Clean ile patlayıcılık geliştirir. 6-12 hafta süreli novice progression.',
    descriptionTr:
      'Mark Rippetoe\'nun klasik başlangıç gücü programı. Haftada 3 gün, A/B değişimi. 3x5 ana lift\'ler + 1x5 deadlift. Power Clean ile patlayıcılık geliştirir. 6-12 hafta süreli novice progression.',
    goal: 'strength',
    level: 'beginner',
    frequencyPerWeek: 3,
    durationWeeks: 12,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-ss-a',
      programId: 'preset-starting-strength',
      dayOrder: 1,
      focus: 'fullBody',
      name: 'Workout A',
      nameTr: 'Antrenman A',
    },
    {
      id: 'preset-ss-b',
      programId: 'preset-starting-strength',
      dayOrder: 2,
      focus: 'fullBody',
      name: 'Workout B',
      nameTr: 'Antrenman B',
    },
  ],
  exercises: [
    mkExercise('p-ss-a-1', 'preset-ss-a', 'barbell-squat', 1, 3, '5', 180),
    mkExercise(
      'p-ss-a-2',
      'preset-ss-a',
      'barbell-bench-press-medium-grip',
      2,
      3,
      '5',
      180,
    ),
    mkExercise('p-ss-a-3', 'preset-ss-a', 'barbell-deadlift', 3, 1, '5', 240),

    mkExercise('p-ss-b-1', 'preset-ss-b', 'barbell-squat', 1, 3, '5', 180),
    mkExercise('p-ss-b-2', 'preset-ss-b', 'standing-military-press', 2, 3, '5', 180),
    mkExercise('p-ss-b-3', 'preset-ss-b', 'power-clean', 3, 5, '3', 180),
  ],
};

// ============================================================================
// 3. 5/3/1 Boring But Big — Jim Wendler (Intermediate)
// ============================================================================
const fiveThreeOneBBB: RawProgramBundle = {
  program: {
    id: 'preset-531-bbb',
    ownerId: null,
    name: '5/3/1 Boring But Big',
    nameTr: '5/3/1 BBB',
    description:
      'Jim Wendler\'in efsane programı. Her hafta ana lift için %65/75/85 - 5/3/1+ yüklemesi yapılır. Sonrasında aynı lift 5x10 BBB volume work ile vurulur. 4 günlük döngü, hipertrofi + güç birlikte. 4 haftalık döngülerle ilerler.',
    descriptionTr:
      'Jim Wendler\'in efsane programı. Her hafta ana lift için %65/75/85 - 5/3/1+ yüklemesi yapılır. Sonrasında aynı lift 5x10 BBB volume work ile vurulur. 4 günlük döngü, hipertrofi + güç birlikte. 4 haftalık döngülerle ilerler.',
    goal: 'strength',
    level: 'intermediate',
    frequencyPerWeek: 4,
    durationWeeks: 16,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-531-bench',
      programId: 'preset-531-bbb',
      dayOrder: 1,
      focus: 'push',
      name: 'Bench Day',
      nameTr: 'Bench Günü',
    },
    {
      id: 'preset-531-squat',
      programId: 'preset-531-bbb',
      dayOrder: 2,
      focus: 'lower',
      name: 'Squat Day',
      nameTr: 'Squat Günü',
    },
    {
      id: 'preset-531-ohp',
      programId: 'preset-531-bbb',
      dayOrder: 3,
      focus: 'push',
      name: 'OHP Day',
      nameTr: 'OHP Günü',
    },
    {
      id: 'preset-531-dl',
      programId: 'preset-531-bbb',
      dayOrder: 4,
      focus: 'lower',
      name: 'Deadlift Day',
      nameTr: 'Deadlift Günü',
    },
  ],
  exercises: [
    // Bench Day
    mkExercise(
      'p-531-bench-1',
      'preset-531-bench',
      'barbell-bench-press-medium-grip',
      1,
      3,
      '5/3/1',
      180,
      'Ana lift: 5/3/1 yüklemesi. Son set AMRAP (mümkün olduğu kadar).',
    ),
    mkExercise(
      'p-531-bench-2',
      'preset-531-bench',
      'barbell-bench-press-medium-grip',
      2,
      5,
      '10',
      90,
      'BBB volume work: %50 ağırlıkla 5x10.',
    ),
    mkExercise('p-531-bench-3', 'preset-531-bench', 'bent-over-barbell-row', 3, 5, '10', 90),
    mkExercise('p-531-bench-4', 'preset-531-bench', 'triceps-pushdown', 4, 3, '12-15', 60),
    // Squat Day
    mkExercise(
      'p-531-sq-1',
      'preset-531-squat',
      'barbell-squat',
      1,
      3,
      '5/3/1',
      180,
      'Ana lift: 5/3/1, son set AMRAP.',
    ),
    mkExercise('p-531-sq-2', 'preset-531-squat', 'barbell-squat', 2, 5, '10', 120, 'BBB %50.'),
    mkExercise('p-531-sq-3', 'preset-531-squat', 'leg-press', 3, 3, '12', 90),
    mkExercise('p-531-sq-4', 'preset-531-squat', 'hanging-leg-raise', 4, 3, '10-12', 60),
    // OHP Day
    mkExercise(
      'p-531-ohp-1',
      'preset-531-ohp',
      'standing-military-press',
      1,
      3,
      '5/3/1',
      180,
    ),
    mkExercise('p-531-ohp-2', 'preset-531-ohp', 'standing-military-press', 2, 5, '10', 90),
    mkExercise('p-531-ohp-3', 'preset-531-ohp', 'pullups', 3, 5, '10', 90),
    mkExercise('p-531-ohp-4', 'preset-531-ohp', 'side-lateral-raise', 4, 3, '12-15', 45),
    // Deadlift Day
    mkExercise('p-531-dl-1', 'preset-531-dl', 'barbell-deadlift', 1, 3, '5/3/1', 180),
    mkExercise('p-531-dl-2', 'preset-531-dl', 'barbell-deadlift', 2, 5, '10', 180, 'BBB %50.'),
    mkExercise('p-531-dl-3', 'preset-531-dl', 'good-morning', 3, 3, '8-10', 90),
    mkExercise('p-531-dl-4', 'preset-531-dl', 'plank', 4, 3, '45s', 60),
  ],
};

// ============================================================================
// 4. Push / Pull / Legs 6-Day (Intermediate, Hypertrophy)
// ============================================================================
const ppl6Day: RawProgramBundle = {
  program: {
    id: 'preset-ppl-6day',
    ownerId: null,
    name: 'Push / Pull / Legs (6-Day)',
    nameTr: 'Push / Pull / Legs (6 Gün)',
    description:
      'Klasik PPL split, haftada 6 gün, sadece pazar dinlenme. Hipertrofi odaklı yüksek hacim. Push (göğüs/omuz/triceps), Pull (sırt/biceps), Legs (bacak/kalça). Her grup haftada 2 kez vurulur.',
    descriptionTr:
      'Klasik PPL split, haftada 6 gün, sadece pazar dinlenme. Hipertrofi odaklı yüksek hacim. Push (göğüs/omuz/triceps), Pull (sırt/biceps), Legs (bacak/kalça). Her grup haftada 2 kez vurulur.',
    goal: 'bulk',
    level: 'intermediate',
    frequencyPerWeek: 6,
    durationWeeks: 12,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-ppl6-push',
      programId: 'preset-ppl-6day',
      dayOrder: 1,
      focus: 'push',
      name: 'Push',
      nameTr: 'Push (İtme)',
    },
    {
      id: 'preset-ppl6-pull',
      programId: 'preset-ppl-6day',
      dayOrder: 2,
      focus: 'pull',
      name: 'Pull',
      nameTr: 'Pull (Çekme)',
    },
    {
      id: 'preset-ppl6-legs',
      programId: 'preset-ppl-6day',
      dayOrder: 3,
      focus: 'legs',
      name: 'Legs',
      nameTr: 'Bacak',
    },
  ],
  exercises: [
    // Push
    mkExercise(
      'p-ppl6-pu-1',
      'preset-ppl6-push',
      'barbell-bench-press-medium-grip',
      1,
      4,
      '6-8',
      150,
    ),
    mkExercise('p-ppl6-pu-2', 'preset-ppl6-push', 'standing-military-press', 2, 4, '8-10', 120),
    mkExercise('p-ppl6-pu-3', 'preset-ppl6-push', 'incline-dumbbell-press', 3, 3, '10-12', 90),
    mkExercise('p-ppl6-pu-4', 'preset-ppl6-push', 'side-lateral-raise', 4, 4, '12-15', 60),
    mkExercise('p-ppl6-pu-5', 'preset-ppl6-push', 'cable-crossover', 5, 3, '12-15', 60),
    mkExercise('p-ppl6-pu-6', 'preset-ppl6-push', 'triceps-pushdown', 6, 4, '12-15', 60),
    mkExercise('p-ppl6-pu-7', 'preset-ppl6-push', 'ez-bar-skullcrusher', 7, 3, '10-12', 60),
    // Pull
    mkExercise('p-ppl6-pl-1', 'preset-ppl6-pull', 'barbell-deadlift', 1, 3, '5', 240),
    mkExercise('p-ppl6-pl-2', 'preset-ppl6-pull', 'pullups', 2, 4, '6-10', 120),
    mkExercise('p-ppl6-pl-3', 'preset-ppl6-pull', 'bent-over-barbell-row', 3, 3, '8-10', 120),
    mkExercise('p-ppl6-pl-4', 'preset-ppl6-pull', 'seated-cable-rows', 4, 3, '10-12', 90),
    mkExercise('p-ppl6-pl-5', 'preset-ppl6-pull', 'face-pull', 5, 4, '15-20', 45),
    mkExercise('p-ppl6-pl-6', 'preset-ppl6-pull', 'barbell-curl', 6, 3, '8-10', 60),
    mkExercise('p-ppl6-pl-7', 'preset-ppl6-pull', 'hammer-curls', 7, 3, '10-12', 60),
    // Legs
    mkExercise('p-ppl6-lg-1', 'preset-ppl6-legs', 'barbell-squat', 1, 4, '6-8', 180),
    mkExercise('p-ppl6-lg-2', 'preset-ppl6-legs', 'romanian-deadlift', 2, 3, '8-10', 150),
    mkExercise('p-ppl6-lg-3', 'preset-ppl6-legs', 'leg-press', 3, 3, '10-12', 120),
    mkExercise('p-ppl6-lg-4', 'preset-ppl6-legs', 'dumbbell-lunges', 4, 3, '10', 90),
    mkExercise('p-ppl6-lg-5', 'preset-ppl6-legs', 'barbell-hip-thrust', 5, 3, '10-12', 90),
    mkExercise('p-ppl6-lg-6', 'preset-ppl6-legs', 'seated-calf-raise', 6, 4, '15-20', 45),
    mkExercise('p-ppl6-lg-7', 'preset-ppl6-legs', 'hanging-leg-raise', 7, 3, '10-15', 60),
  ],
};

// ============================================================================
// 5. GZCLP — Cody Lefever (Beginner-Intermediate)
// ============================================================================
const gzclp: RawProgramBundle = {
  program: {
    id: 'preset-gzclp',
    ownerId: null,
    name: 'GZCLP',
    nameTr: 'GZCLP',
    description:
      'Cody Lefever\'in modern hibrit programı. T1 (5x3 ana lift, AMRAP), T2 (3x10 ikincil), T3 (3x15 yardımcı). Linear Progression ile başlangıçtan orta seviyeye köprü. 4 gün/hafta, AB1-AB2 rotasyon.',
    descriptionTr:
      'Cody Lefever\'in modern hibrit programı. T1 (5x3 ana lift, AMRAP), T2 (3x10 ikincil), T3 (3x15 yardımcı). Linear Progression ile başlangıçtan orta seviyeye köprü. 4 gün/hafta, AB1-AB2 rotasyon.',
    goal: 'strength',
    level: 'beginner',
    frequencyPerWeek: 4,
    durationWeeks: 12,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-gzclp-a1',
      programId: 'preset-gzclp',
      dayOrder: 1,
      focus: 'lower',
      name: 'A1 - Squat / Bench',
      nameTr: 'A1 — Squat / Bench',
    },
    {
      id: 'preset-gzclp-b1',
      programId: 'preset-gzclp',
      dayOrder: 2,
      focus: 'upper',
      name: 'B1 - OHP / Deadlift',
      nameTr: 'B1 — OHP / Deadlift',
    },
    {
      id: 'preset-gzclp-a2',
      programId: 'preset-gzclp',
      dayOrder: 3,
      focus: 'lower',
      name: 'A2 - Squat / Bench',
      nameTr: 'A2 — Squat / Bench',
    },
    {
      id: 'preset-gzclp-b2',
      programId: 'preset-gzclp',
      dayOrder: 4,
      focus: 'upper',
      name: 'B2 - OHP / Deadlift',
      nameTr: 'B2 — OHP / Deadlift',
    },
  ],
  exercises: [
    // A1: Squat (T1) + Bench (T2) + Lat Pulldown (T3)
    mkExercise('p-gz-a1-1', 'preset-gzclp-a1', 'barbell-squat', 1, 5, '3+', 180, 'T1: 5x3+, son set AMRAP'),
    mkExercise(
      'p-gz-a1-2',
      'preset-gzclp-a1',
      'barbell-bench-press-medium-grip',
      2,
      3,
      '10',
      120,
      'T2: 3x10',
    ),
    mkExercise('p-gz-a1-3', 'preset-gzclp-a1', 'wide-grip-lat-pulldown', 3, 3, '15+', 60, 'T3: son set AMRAP'),
    // B1: OHP (T1) + Deadlift (T2) + Row (T3)
    mkExercise('p-gz-b1-1', 'preset-gzclp-b1', 'standing-military-press', 1, 5, '3+', 180, 'T1'),
    mkExercise('p-gz-b1-2', 'preset-gzclp-b1', 'barbell-deadlift', 2, 3, '10', 180, 'T2'),
    mkExercise('p-gz-b1-3', 'preset-gzclp-b1', 'bent-over-barbell-row', 3, 3, '15+', 60, 'T3'),
    // A2: Bench (T1) + Squat (T2) + Lat Pulldown (T3)
    mkExercise(
      'p-gz-a2-1',
      'preset-gzclp-a2',
      'barbell-bench-press-medium-grip',
      1,
      5,
      '3+',
      180,
      'T1',
    ),
    mkExercise('p-gz-a2-2', 'preset-gzclp-a2', 'barbell-squat', 2, 3, '10', 150, 'T2'),
    mkExercise('p-gz-a2-3', 'preset-gzclp-a2', 'wide-grip-lat-pulldown', 3, 3, '15+', 60, 'T3'),
    // B2: Deadlift (T1) + OHP (T2) + Row (T3)
    mkExercise('p-gz-b2-1', 'preset-gzclp-b2', 'barbell-deadlift', 1, 5, '3+', 240, 'T1'),
    mkExercise('p-gz-b2-2', 'preset-gzclp-b2', 'standing-military-press', 2, 3, '10', 90, 'T2'),
    mkExercise('p-gz-b2-3', 'preset-gzclp-b2', 'bent-over-barbell-row', 3, 3, '15+', 60, 'T3'),
  ],
};

// ============================================================================
// 6. MyFitCraft Beginner Full Body (3 day, novice friendly)
// ============================================================================
const mfcBeginner: RawProgramBundle = {
  program: {
    id: 'preset-mfc-beginner',
    ownerId: null,
    name: 'MyFitCraft Beginner Full Body',
    nameTr: 'MyFitCraft Başlangıç Full Body',
    description:
      'Yeni başlayanlar için 3 günlük full body programı. Compound hareketlere odaklanır. Her gün farklı varyasyon, haftada 3 kez tüm vücut. 6-8 hafta sonra Upper/Lower veya PPL\'e geçiş tavsiye edilir.',
    descriptionTr:
      'Yeni başlayanlar için 3 günlük full body programı. Compound hareketlere odaklanır. Her gün farklı varyasyon, haftada 3 kez tüm vücut. 6-8 hafta sonra Upper/Lower veya PPL\'e geçiş tavsiye edilir.',
    goal: 'strength',
    level: 'beginner',
    frequencyPerWeek: 3,
    durationWeeks: 8,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-mfc-beg-a',
      programId: 'preset-mfc-beginner',
      dayOrder: 1,
      focus: 'fullBody',
      name: 'Day A',
      nameTr: 'Gün A',
    },
    {
      id: 'preset-mfc-beg-b',
      programId: 'preset-mfc-beginner',
      dayOrder: 2,
      focus: 'fullBody',
      name: 'Day B',
      nameTr: 'Gün B',
    },
    {
      id: 'preset-mfc-beg-c',
      programId: 'preset-mfc-beginner',
      dayOrder: 3,
      focus: 'fullBody',
      name: 'Day C',
      nameTr: 'Gün C',
    },
  ],
  exercises: [
    // Day A
    mkExercise('p-mfc-bA-1', 'preset-mfc-beg-a', 'barbell-squat', 1, 3, '8-10', 120),
    mkExercise('p-mfc-bA-2', 'preset-mfc-beg-a', 'pushups', 2, 3, '8-12', 90),
    mkExercise('p-mfc-bA-3', 'preset-mfc-beg-a', 'wide-grip-lat-pulldown', 3, 3, '10', 90),
    mkExercise('p-mfc-bA-4', 'preset-mfc-beg-a', 'plank', 4, 3, '30s', 60),
    // Day B
    mkExercise('p-mfc-bB-1', 'preset-mfc-beg-b', 'romanian-deadlift', 1, 3, '8-10', 120),
    mkExercise('p-mfc-bB-2', 'preset-mfc-beg-b', 'standing-military-press', 2, 3, '8', 120),
    mkExercise('p-mfc-bB-3', 'preset-mfc-beg-b', 'seated-cable-rows', 3, 3, '10', 90),
    mkExercise('p-mfc-bB-4', 'preset-mfc-beg-b', 'sit-up', 4, 3, '15', 60),
    // Day C
    mkExercise(
      'p-mfc-bC-1',
      'preset-mfc-beg-c',
      'barbell-bench-press-medium-grip',
      1,
      3,
      '8',
      120,
    ),
    mkExercise('p-mfc-bC-2', 'preset-mfc-beg-c', 'dumbbell-lunges', 2, 3, '10', 90),
    mkExercise('p-mfc-bC-3', 'preset-mfc-beg-c', 'pullups', 3, 3, '5-8', 120),
    mkExercise('p-mfc-bC-4', 'preset-mfc-beg-c', 'hanging-leg-raise', 4, 3, '8-10', 60),
  ],
};

// ============================================================================
// 7. MyFitCraft Upper / Lower (4-Day, Intermediate)
// ============================================================================
const mfcUpperLower: RawProgramBundle = {
  program: {
    id: 'preset-mfc-upper-lower',
    ownerId: null,
    name: 'MyFitCraft Upper / Lower (4-Day)',
    nameTr: 'MyFitCraft Upper / Lower (4 Gün)',
    description:
      '4 günlük upper/lower split. Güç + hipertrofi dengeli. Upper A/B + Lower A/B varyasyonları, tekrarsız haftalar. Compound + accessory karması. Orta seviye için ideal.',
    descriptionTr:
      '4 günlük upper/lower split. Güç + hipertrofi dengeli. Upper A/B + Lower A/B varyasyonları, tekrarsız haftalar. Compound + accessory karması. Orta seviye için ideal.',
    goal: 'bulk',
    level: 'intermediate',
    frequencyPerWeek: 4,
    durationWeeks: 10,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-mfc-ul-ua',
      programId: 'preset-mfc-upper-lower',
      dayOrder: 1,
      focus: 'upper',
      name: 'Upper A',
      nameTr: 'Upper A',
    },
    {
      id: 'preset-mfc-ul-la',
      programId: 'preset-mfc-upper-lower',
      dayOrder: 2,
      focus: 'lower',
      name: 'Lower A',
      nameTr: 'Lower A',
    },
    {
      id: 'preset-mfc-ul-ub',
      programId: 'preset-mfc-upper-lower',
      dayOrder: 3,
      focus: 'upper',
      name: 'Upper B',
      nameTr: 'Upper B',
    },
    {
      id: 'preset-mfc-ul-lb',
      programId: 'preset-mfc-upper-lower',
      dayOrder: 4,
      focus: 'lower',
      name: 'Lower B',
      nameTr: 'Lower B',
    },
  ],
  exercises: [
    // Upper A (Bench focus)
    mkExercise(
      'p-mfc-ul-ua-1',
      'preset-mfc-ul-ua',
      'barbell-bench-press-medium-grip',
      1,
      4,
      '6-8',
      150,
    ),
    mkExercise('p-mfc-ul-ua-2', 'preset-mfc-ul-ua', 'bent-over-barbell-row', 2, 4, '6-8', 150),
    mkExercise('p-mfc-ul-ua-3', 'preset-mfc-ul-ua', 'standing-military-press', 3, 3, '8-10', 90),
    mkExercise('p-mfc-ul-ua-4', 'preset-mfc-ul-ua', 'wide-grip-lat-pulldown', 4, 3, '10-12', 90),
    mkExercise('p-mfc-ul-ua-5', 'preset-mfc-ul-ua', 'barbell-curl', 5, 3, '10-12', 60),
    mkExercise('p-mfc-ul-ua-6', 'preset-mfc-ul-ua', 'triceps-pushdown', 6, 3, '10-12', 60),
    // Lower A (Squat focus)
    mkExercise('p-mfc-ul-la-1', 'preset-mfc-ul-la', 'barbell-squat', 1, 4, '6-8', 180),
    mkExercise('p-mfc-ul-la-2', 'preset-mfc-ul-la', 'romanian-deadlift', 2, 3, '8-10', 120),
    mkExercise('p-mfc-ul-la-3', 'preset-mfc-ul-la', 'leg-press', 3, 3, '10-12', 90),
    mkExercise('p-mfc-ul-la-4', 'preset-mfc-ul-la', 'seated-calf-raise', 4, 4, '15', 45),
    mkExercise('p-mfc-ul-la-5', 'preset-mfc-ul-la', 'plank', 5, 3, '45s', 45),
    // Upper B (OHP focus)
    mkExercise(
      'p-mfc-ul-ub-1',
      'preset-mfc-ul-ub',
      'incline-dumbbell-press',
      1,
      4,
      '8-10',
      120,
    ),
    mkExercise('p-mfc-ul-ub-2', 'preset-mfc-ul-ub', 'pullups', 2, 4, '6-10', 120),
    mkExercise('p-mfc-ul-ub-3', 'preset-mfc-ul-ub', 'dumbbell-shoulder-press', 3, 3, '10-12', 90),
    mkExercise('p-mfc-ul-ub-4', 'preset-mfc-ul-ub', 'seated-cable-rows', 4, 3, '10-12', 90),
    mkExercise('p-mfc-ul-ub-5', 'preset-mfc-ul-ub', 'hammer-curls', 5, 3, '12', 60),
    mkExercise(
      'p-mfc-ul-ub-6',
      'preset-mfc-ul-ub',
      'close-grip-barbell-bench-press',
      6,
      3,
      '8-10',
      90,
    ),
    // Lower B (Deadlift focus)
    mkExercise('p-mfc-ul-lb-1', 'preset-mfc-ul-lb', 'barbell-deadlift', 1, 3, '5', 240),
    mkExercise('p-mfc-ul-lb-2', 'preset-mfc-ul-lb', 'front-barbell-squat', 2, 3, '8-10', 150),
    mkExercise('p-mfc-ul-lb-3', 'preset-mfc-ul-lb', 'barbell-hip-thrust', 3, 3, '10-12', 90),
    mkExercise('p-mfc-ul-lb-4', 'preset-mfc-ul-lb', 'dumbbell-lunges', 4, 3, '10', 60),
    mkExercise('p-mfc-ul-lb-5', 'preset-mfc-ul-lb', 'hanging-leg-raise', 5, 3, '10-12', 60),
  ],
};

// ============================================================================
// 8. MyFitCraft Bro Split (5-Day, Hypertrophy)
// ============================================================================
const mfcBroSplit: RawProgramBundle = {
  program: {
    id: 'preset-mfc-bro-split',
    ownerId: null,
    name: 'MyFitCraft Bro Split (5-Day)',
    nameTr: 'MyFitCraft Bro Split (5 Gün)',
    description:
      'Klasik vücut bölgesi splitti, haftada 5 gün. Her grup haftada 1 kez ama yüksek hacimle vurulur. Pump + estetik odaklı. Her seans 60-75 dakika. Estetik / hipertrofi için.',
    descriptionTr:
      'Klasik vücut bölgesi splitti, haftada 5 gün. Her grup haftada 1 kez ama yüksek hacimle vurulur. Pump + estetik odaklı. Her seans 60-75 dakika. Estetik / hipertrofi için.',
    goal: 'bulk',
    level: 'intermediate',
    frequencyPerWeek: 5,
    durationWeeks: 8,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-mfc-bro-chest',
      programId: 'preset-mfc-bro-split',
      dayOrder: 1,
      focus: 'push',
      name: 'Chest Day',
      nameTr: 'Göğüs Günü',
    },
    {
      id: 'preset-mfc-bro-back',
      programId: 'preset-mfc-bro-split',
      dayOrder: 2,
      focus: 'pull',
      name: 'Back Day',
      nameTr: 'Sırt Günü',
    },
    {
      id: 'preset-mfc-bro-shoulders',
      programId: 'preset-mfc-bro-split',
      dayOrder: 3,
      focus: 'push',
      name: 'Shoulder Day',
      nameTr: 'Omuz Günü',
    },
    {
      id: 'preset-mfc-bro-legs',
      programId: 'preset-mfc-bro-split',
      dayOrder: 4,
      focus: 'legs',
      name: 'Leg Day',
      nameTr: 'Bacak Günü',
    },
    {
      id: 'preset-mfc-bro-arms',
      programId: 'preset-mfc-bro-split',
      dayOrder: 5,
      focus: 'upper',
      name: 'Arms Day',
      nameTr: 'Kol Günü',
    },
  ],
  exercises: [
    // Chest
    mkExercise(
      'p-mfc-bro-c-1',
      'preset-mfc-bro-chest',
      'barbell-bench-press-medium-grip',
      1,
      4,
      '8',
      120,
    ),
    mkExercise('p-mfc-bro-c-2', 'preset-mfc-bro-chest', 'incline-dumbbell-press', 2, 4, '10', 90),
    mkExercise('p-mfc-bro-c-3', 'preset-mfc-bro-chest', 'dumbbell-bench-press', 3, 3, '10-12', 90),
    mkExercise('p-mfc-bro-c-4', 'preset-mfc-bro-chest', 'cable-crossover', 4, 3, '12-15', 60),
    mkExercise('p-mfc-bro-c-5', 'preset-mfc-bro-chest', 'pushups', 5, 3, '15+', 60, 'AMRAP finisher'),
    // Back
    mkExercise('p-mfc-bro-b-1', 'preset-mfc-bro-back', 'barbell-deadlift', 1, 3, '5', 240),
    mkExercise('p-mfc-bro-b-2', 'preset-mfc-bro-back', 'pullups', 2, 4, '6-10', 120),
    mkExercise('p-mfc-bro-b-3', 'preset-mfc-bro-back', 'bent-over-barbell-row', 3, 4, '8-10', 120),
    mkExercise('p-mfc-bro-b-4', 'preset-mfc-bro-back', 'seated-cable-rows', 4, 3, '10-12', 90),
    mkExercise('p-mfc-bro-b-5', 'preset-mfc-bro-back', 'wide-grip-lat-pulldown', 5, 3, '12', 60),
    mkExercise('p-mfc-bro-b-6', 'preset-mfc-bro-back', 'face-pull', 6, 3, '15-20', 45),
    // Shoulders
    mkExercise('p-mfc-bro-s-1', 'preset-mfc-bro-shoulders', 'standing-military-press', 1, 4, '6-8', 150),
    mkExercise('p-mfc-bro-s-2', 'preset-mfc-bro-shoulders', 'dumbbell-shoulder-press', 2, 3, '10', 90),
    mkExercise('p-mfc-bro-s-3', 'preset-mfc-bro-shoulders', 'side-lateral-raise', 3, 4, '12-15', 45),
    mkExercise('p-mfc-bro-s-4', 'preset-mfc-bro-shoulders', 'face-pull', 4, 4, '15', 45),
    mkExercise('p-mfc-bro-s-5', 'preset-mfc-bro-shoulders', 'push-press', 5, 3, '6-8', 120),
    // Legs
    mkExercise('p-mfc-bro-l-1', 'preset-mfc-bro-legs', 'barbell-squat', 1, 4, '6-8', 180),
    mkExercise('p-mfc-bro-l-2', 'preset-mfc-bro-legs', 'romanian-deadlift', 2, 3, '8-10', 120),
    mkExercise('p-mfc-bro-l-3', 'preset-mfc-bro-legs', 'leg-press', 3, 4, '10-12', 90),
    mkExercise('p-mfc-bro-l-4', 'preset-mfc-bro-legs', 'dumbbell-lunges', 4, 3, '10', 90),
    mkExercise('p-mfc-bro-l-5', 'preset-mfc-bro-legs', 'barbell-hip-thrust', 5, 3, '12', 90),
    mkExercise('p-mfc-bro-l-6', 'preset-mfc-bro-legs', 'seated-calf-raise', 6, 5, '15-20', 45),
    // Arms (Biceps + Triceps)
    mkExercise('p-mfc-bro-a-1', 'preset-mfc-bro-arms', 'barbell-curl', 1, 4, '8-10', 75),
    mkExercise('p-mfc-bro-a-2', 'preset-mfc-bro-arms', 'close-grip-barbell-bench-press', 2, 4, '8-10', 90),
    mkExercise('p-mfc-bro-a-3', 'preset-mfc-bro-arms', 'hammer-curls', 3, 3, '10-12', 60),
    mkExercise('p-mfc-bro-a-4', 'preset-mfc-bro-arms', 'ez-bar-skullcrusher', 4, 3, '10-12', 60),
    mkExercise('p-mfc-bro-a-5', 'preset-mfc-bro-arms', 'triceps-pushdown', 5, 3, '12-15', 45),
    mkExercise('p-mfc-bro-a-6', 'preset-mfc-bro-arms', 'tricep-dumbbell-kickback', 6, 3, '12', 45),
  ],
};

// ============================================================================
// 9. MyFitCraft Home Bodyweight (3-Day, No Equipment)
// ============================================================================
const mfcHomeBW: RawProgramBundle = {
  program: {
    id: 'preset-mfc-home-bw',
    ownerId: null,
    name: 'MyFitCraft Home Bodyweight',
    nameTr: 'MyFitCraft Ev Antrenmanı (Vücut Ağırlığı)',
    description:
      'Hiçbir ekipman gerektirmeyen, evde 3 gün/hafta vücut ağırlığı programı. Her seans 30-40 dakika. Form ve tempo odaklı. Yeni başlayanlar için ideal, gym\'e ısınma adımı.',
    descriptionTr:
      'Hiçbir ekipman gerektirmeyen, evde 3 gün/hafta vücut ağırlığı programı. Her seans 30-40 dakika. Form ve tempo odaklı. Yeni başlayanlar için ideal, gym\'e ısınma adımı.',
    goal: 'maintain',
    level: 'beginner',
    frequencyPerWeek: 3,
    durationWeeks: 6,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-mfc-home-a',
      programId: 'preset-mfc-home-bw',
      dayOrder: 1,
      focus: 'fullBody',
      name: 'Day A',
      nameTr: 'Gün A',
    },
    {
      id: 'preset-mfc-home-b',
      programId: 'preset-mfc-home-bw',
      dayOrder: 2,
      focus: 'fullBody',
      name: 'Day B',
      nameTr: 'Gün B',
    },
    {
      id: 'preset-mfc-home-c',
      programId: 'preset-mfc-home-bw',
      dayOrder: 3,
      focus: 'fullBody',
      name: 'Day C',
      nameTr: 'Gün C',
    },
  ],
  exercises: [
    // A
    mkExercise('p-mfc-h-a-1', 'preset-mfc-home-a', 'pushups', 1, 4, '10-15', 60),
    mkExercise('p-mfc-h-a-2', 'preset-mfc-home-a', 'bodyweight-squat', 2, 4, '20', 60),
    mkExercise('p-mfc-h-a-3', 'preset-mfc-home-a', 'sit-up', 3, 3, '15-20', 45),
    mkExercise('p-mfc-h-a-4', 'preset-mfc-home-a', 'plank', 4, 3, '45s', 45),
    // B
    mkExercise('p-mfc-h-b-1', 'preset-mfc-home-b', 'incline-push-up', 1, 4, '12', 60),
    mkExercise('p-mfc-h-b-2', 'preset-mfc-home-b', 'bodyweight-squat', 2, 4, '20-25', 60),
    mkExercise('p-mfc-h-b-3', 'preset-mfc-home-b', 'reverse-crunch', 3, 3, '12-15', 45),
    mkExercise('p-mfc-h-b-4', 'preset-mfc-home-b', 'plank', 4, 3, '60s', 45),
    // C
    mkExercise('p-mfc-h-c-1', 'preset-mfc-home-c', 'decline-push-up', 1, 4, '8-12', 75),
    mkExercise('p-mfc-h-c-2', 'preset-mfc-home-c', 'bodyweight-squat', 2, 4, '25-30', 60),
    mkExercise('p-mfc-h-c-3', 'preset-mfc-home-c', 'crunches', 3, 3, '20', 45),
    mkExercise('p-mfc-h-c-4', 'preset-mfc-home-c', 'leg-pull-in', 4, 3, '12-15', 45),
  ],
};

// ============================================================================
// 10. MyFitCraft Powerlifter Foundation (3-Day, SBD focus)
// ============================================================================
const mfcPowerlifter: RawProgramBundle = {
  program: {
    id: 'preset-mfc-powerlifter',
    ownerId: null,
    name: 'MyFitCraft Powerlifter Foundation',
    nameTr: 'MyFitCraft Powerlifter Temel',
    description:
      'Squat, Bench, Deadlift (SBD) odaklı 3 günlük güç programı. Her gün bir ana lift + yardımcılar. Ağır setler (3-5 tekrar) + hipertrofi setleri (8-10). 1RM artırmaya odaklı.',
    descriptionTr:
      'Squat, Bench, Deadlift (SBD) odaklı 3 günlük güç programı. Her gün bir ana lift + yardımcılar. Ağır setler (3-5 tekrar) + hipertrofi setleri (8-10). 1RM artırmaya odaklı.',
    goal: 'strength',
    level: 'intermediate',
    frequencyPerWeek: 3,
    durationWeeks: 12,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-mfc-pl-squat',
      programId: 'preset-mfc-powerlifter',
      dayOrder: 1,
      focus: 'lower',
      name: 'Squat Day',
      nameTr: 'Squat Günü',
    },
    {
      id: 'preset-mfc-pl-bench',
      programId: 'preset-mfc-powerlifter',
      dayOrder: 2,
      focus: 'push',
      name: 'Bench Day',
      nameTr: 'Bench Günü',
    },
    {
      id: 'preset-mfc-pl-dl',
      programId: 'preset-mfc-powerlifter',
      dayOrder: 3,
      focus: 'pull',
      name: 'Deadlift Day',
      nameTr: 'Deadlift Günü',
    },
  ],
  exercises: [
    // Squat Day
    mkExercise('p-mfc-pl-s-1', 'preset-mfc-pl-squat', 'barbell-squat', 1, 5, '3-5', 240, 'Ağır setler'),
    mkExercise('p-mfc-pl-s-2', 'preset-mfc-pl-squat', 'romanian-deadlift', 2, 4, '6-8', 150),
    mkExercise('p-mfc-pl-s-3', 'preset-mfc-pl-squat', 'leg-press', 3, 3, '10', 90),
    mkExercise('p-mfc-pl-s-4', 'preset-mfc-pl-squat', 'hanging-leg-raise', 4, 3, '10-15', 60),
    // Bench Day
    mkExercise(
      'p-mfc-pl-b-1',
      'preset-mfc-pl-bench',
      'barbell-bench-press-medium-grip',
      1,
      5,
      '3-5',
      240,
      'Ağır setler',
    ),
    mkExercise(
      'p-mfc-pl-b-2',
      'preset-mfc-pl-bench',
      'close-grip-barbell-bench-press',
      2,
      4,
      '6-8',
      120,
    ),
    mkExercise('p-mfc-pl-b-3', 'preset-mfc-pl-bench', 'standing-military-press', 3, 3, '8', 120),
    mkExercise('p-mfc-pl-b-4', 'preset-mfc-pl-bench', 'ez-bar-skullcrusher', 4, 3, '10', 60),
    // Deadlift Day
    mkExercise('p-mfc-pl-d-1', 'preset-mfc-pl-dl', 'barbell-deadlift', 1, 5, '3-5', 240, 'Ağır setler'),
    mkExercise('p-mfc-pl-d-2', 'preset-mfc-pl-dl', 'front-barbell-squat', 2, 4, '6-8', 150),
    mkExercise('p-mfc-pl-d-3', 'preset-mfc-pl-dl', 'bent-over-barbell-row', 3, 4, '6-8', 120),
    mkExercise('p-mfc-pl-d-4', 'preset-mfc-pl-dl', 'plank', 4, 3, '60s', 60),
  ],
};

// ============================================================================
// 11. PHUL — Power Hypertrophy Upper Lower (4-Day, Intermediate)
// ============================================================================
const phul: RawProgramBundle = {
  program: {
    id: 'preset-phul',
    ownerId: null,
    name: 'PHUL (Power Hypertrophy Upper Lower)',
    nameTr: 'PHUL (Güç + Hipertrofi Upper/Lower)',
    description:
      'Brandon Campbell\'in popüler 4 günlük programı. 2 gün güç (3-5 tekrar), 2 gün hipertrofi (8-15 tekrar). Hem maksimum güç hem kas büyümesi. Pzt/Sal güç + Per/Cum hipertrofi formatında uygulanır.',
    descriptionTr:
      'Brandon Campbell\'in popüler 4 günlük programı. 2 gün güç (3-5 tekrar), 2 gün hipertrofi (8-15 tekrar). Hem maksimum güç hem kas büyümesi. Pzt/Sal güç + Per/Cum hipertrofi formatında uygulanır.',
    goal: 'bulk',
    level: 'intermediate',
    frequencyPerWeek: 4,
    durationWeeks: 12,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-phul-up-power',
      programId: 'preset-phul',
      dayOrder: 1,
      focus: 'upper',
      name: 'Upper Power',
      nameTr: 'Üst Güç',
    },
    {
      id: 'preset-phul-lo-power',
      programId: 'preset-phul',
      dayOrder: 2,
      focus: 'lower',
      name: 'Lower Power',
      nameTr: 'Alt Güç',
    },
    {
      id: 'preset-phul-up-hyp',
      programId: 'preset-phul',
      dayOrder: 3,
      focus: 'upper',
      name: 'Upper Hypertrophy',
      nameTr: 'Üst Hipertrofi',
    },
    {
      id: 'preset-phul-lo-hyp',
      programId: 'preset-phul',
      dayOrder: 4,
      focus: 'lower',
      name: 'Lower Hypertrophy',
      nameTr: 'Alt Hipertrofi',
    },
  ],
  exercises: [
    // Upper Power
    mkExercise('p-phul-up1-1', 'preset-phul-up-power', 'barbell-bench-press-medium-grip', 1, 4, '3-5', 180, 'Ana güç lift\'i'),
    mkExercise('p-phul-up1-2', 'preset-phul-up-power', 'bent-over-barbell-row', 2, 4, '3-5', 180),
    mkExercise('p-phul-up1-3', 'preset-phul-up-power', 'incline-dumbbell-press', 3, 3, '6-10', 120),
    mkExercise('p-phul-up1-4', 'preset-phul-up-power', 'wide-grip-lat-pulldown', 4, 3, '6-10', 120),
    mkExercise('p-phul-up1-5', 'preset-phul-up-power', 'standing-military-press', 5, 3, '6-10', 90),
    mkExercise('p-phul-up1-6', 'preset-phul-up-power', 'barbell-curl', 6, 3, '6-10', 75),
    mkExercise('p-phul-up1-7', 'preset-phul-up-power', 'ez-bar-skullcrusher', 7, 3, '6-10', 75),
    // Lower Power
    mkExercise('p-phul-lo1-1', 'preset-phul-lo-power', 'barbell-squat', 1, 4, '3-5', 240, 'Ana güç lift\'i'),
    mkExercise('p-phul-lo1-2', 'preset-phul-lo-power', 'barbell-deadlift', 2, 3, '3-5', 240),
    mkExercise('p-phul-lo1-3', 'preset-phul-lo-power', 'leg-press', 3, 3, '10-15', 120),
    mkExercise('p-phul-lo1-4', 'preset-phul-lo-power', 'lying-leg-curls', 4, 3, '6-10', 90),
    mkExercise('p-phul-lo1-5', 'preset-phul-lo-power', 'seated-calf-raise', 5, 4, '6-10', 60),
    // Upper Hypertrophy
    mkExercise('p-phul-up2-1', 'preset-phul-up-hyp', 'incline-dumbbell-press', 1, 4, '8-12', 90),
    mkExercise('p-phul-up2-2', 'preset-phul-up-hyp', 'cable-crossover', 2, 3, '8-15', 60),
    mkExercise('p-phul-up2-3', 'preset-phul-up-hyp', 'one-arm-dumbbell-row', 3, 4, '8-12', 90),
    mkExercise('p-phul-up2-4', 'preset-phul-up-hyp', 'seated-cable-rows', 4, 3, '8-15', 75),
    mkExercise('p-phul-up2-5', 'preset-phul-up-hyp', 'side-lateral-raise', 5, 4, '8-12', 60),
    mkExercise('p-phul-up2-6', 'preset-phul-up-hyp', 'hammer-curls', 6, 4, '8-12', 60),
    mkExercise('p-phul-up2-7', 'preset-phul-up-hyp', 'triceps-pushdown', 7, 4, '8-12', 60),
    // Lower Hypertrophy
    mkExercise('p-phul-lo2-1', 'preset-phul-lo-hyp', 'front-barbell-squat', 1, 3, '8-12', 150),
    mkExercise('p-phul-lo2-2', 'preset-phul-lo-hyp', 'romanian-deadlift', 2, 3, '8-12', 120),
    mkExercise('p-phul-lo2-3', 'preset-phul-lo-hyp', 'leg-extensions', 3, 4, '10-15', 75),
    mkExercise('p-phul-lo2-4', 'preset-phul-lo-hyp', 'seated-leg-curl', 4, 4, '10-15', 75),
    mkExercise('p-phul-lo2-5', 'preset-phul-lo-hyp', 'seated-calf-raise', 5, 5, '8-15', 45),
    mkExercise('p-phul-lo2-6', 'preset-phul-lo-hyp', 'crunches', 6, 3, '15-20', 45),
  ],
};

// ============================================================================
// 12. PHAT — Power Hypertrophy Adaptive Training (Layne Norton, 5-Day)
// ============================================================================
const phat: RawProgramBundle = {
  program: {
    id: 'preset-phat',
    ownerId: null,
    name: 'PHAT (Power Hypertrophy Adaptive Training)',
    nameTr: 'PHAT (Güç + Hipertrofi Adaptif Antrenman)',
    description:
      'Layne Norton\'ın efsane 5 günlük programı. 2 gün güç-tabanlı (Upper/Lower Power) + 3 gün hacim-tabanlı (Back/Shoulders, Lower, Chest/Arms). Hem powerlifter hem bodybuilder yaklaşımını birleştirir. İleri seviye için.',
    descriptionTr:
      'Layne Norton\'ın efsane 5 günlük programı. 2 gün güç-tabanlı (Upper/Lower Power) + 3 gün hacim-tabanlı (Back/Shoulders, Lower, Chest/Arms). Hem powerlifter hem bodybuilder yaklaşımını birleştirir. İleri seviye için.',
    goal: 'bulk',
    level: 'advanced',
    frequencyPerWeek: 5,
    durationWeeks: 12,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-phat-up-power',
      programId: 'preset-phat',
      dayOrder: 1,
      focus: 'upper',
      name: 'Upper Power',
      nameTr: 'Üst Güç',
    },
    {
      id: 'preset-phat-lo-power',
      programId: 'preset-phat',
      dayOrder: 2,
      focus: 'lower',
      name: 'Lower Power',
      nameTr: 'Alt Güç',
    },
    {
      id: 'preset-phat-back-sho',
      programId: 'preset-phat',
      dayOrder: 3,
      focus: 'pull',
      name: 'Back & Shoulders Hypertrophy',
      nameTr: 'Sırt & Omuz Hipertrofi',
    },
    {
      id: 'preset-phat-lo-hyp',
      programId: 'preset-phat',
      dayOrder: 4,
      focus: 'lower',
      name: 'Lower Hypertrophy',
      nameTr: 'Alt Hipertrofi',
    },
    {
      id: 'preset-phat-chest-arms',
      programId: 'preset-phat',
      dayOrder: 5,
      focus: 'push',
      name: 'Chest & Arms Hypertrophy',
      nameTr: 'Göğüs & Kol Hipertrofi',
    },
  ],
  exercises: [
    // Upper Power
    mkExercise('p-phat-up1-1', 'preset-phat-up-power', 'barbell-bench-press-medium-grip', 1, 3, '3-5', 240),
    mkExercise('p-phat-up1-2', 'preset-phat-up-power', 'incline-dumbbell-press', 2, 2, '6-10', 120),
    mkExercise('p-phat-up1-3', 'preset-phat-up-power', 'bent-over-barbell-row', 3, 3, '3-5', 240),
    mkExercise('p-phat-up1-4', 'preset-phat-up-power', 'one-arm-dumbbell-row', 4, 2, '6-10', 90),
    mkExercise('p-phat-up1-5', 'preset-phat-up-power', 'standing-military-press', 5, 3, '5-8', 150),
    mkExercise('p-phat-up1-6', 'preset-phat-up-power', 'barbell-curl', 6, 3, '6-10', 75),
    mkExercise('p-phat-up1-7', 'preset-phat-up-power', 'close-grip-barbell-bench-press', 7, 3, '6-10', 90),
    // Lower Power
    mkExercise('p-phat-lo1-1', 'preset-phat-lo-power', 'barbell-squat', 1, 3, '3-5', 240),
    mkExercise('p-phat-lo1-2', 'preset-phat-lo-power', 'hack-squat', 2, 2, '6-10', 150),
    mkExercise('p-phat-lo1-3', 'preset-phat-lo-power', 'leg-extensions', 3, 2, '6-10', 90),
    mkExercise('p-phat-lo1-4', 'preset-phat-lo-power', 'romanian-deadlift', 4, 3, '5-8', 180),
    mkExercise('p-phat-lo1-5', 'preset-phat-lo-power', 'seated-leg-curl', 5, 2, '6-10', 75),
    mkExercise('p-phat-lo1-6', 'preset-phat-lo-power', 'seated-calf-raise', 6, 4, '6-10', 60),
    // Back & Shoulders Hypertrophy
    mkExercise('p-phat-bs-1', 'preset-phat-back-sho', 'bent-over-barbell-row', 1, 6, '3', 75, 'Hız ile, %65-70 1RM'),
    mkExercise('p-phat-bs-2', 'preset-phat-back-sho', 'wide-grip-lat-pulldown', 2, 3, '8-12', 75),
    mkExercise('p-phat-bs-3', 'preset-phat-back-sho', 'seated-cable-rows', 3, 3, '8-12', 75),
    mkExercise('p-phat-bs-4', 'preset-phat-back-sho', 'straight-arm-pulldown', 4, 2, '12-15', 60),
    mkExercise('p-phat-bs-5', 'preset-phat-back-sho', 'dumbbell-shoulder-press', 5, 3, '8-12', 90),
    mkExercise('p-phat-bs-6', 'preset-phat-back-sho', 'side-lateral-raise', 6, 3, '12-20', 45),
    mkExercise('p-phat-bs-7', 'preset-phat-back-sho', 'face-pull', 7, 3, '12-15', 45),
    // Lower Hypertrophy
    mkExercise('p-phat-lo2-1', 'preset-phat-lo-hyp', 'barbell-squat', 1, 6, '3', 60, 'Hız ile, %65-70 1RM'),
    mkExercise('p-phat-lo2-2', 'preset-phat-lo-hyp', 'hack-squat', 2, 3, '8-12', 120),
    mkExercise('p-phat-lo2-3', 'preset-phat-lo-hyp', 'leg-press', 3, 2, '12-15', 90),
    mkExercise('p-phat-lo2-4', 'preset-phat-lo-hyp', 'leg-extensions', 4, 3, '15-20', 75),
    mkExercise('p-phat-lo2-5', 'preset-phat-lo-hyp', 'romanian-deadlift', 5, 3, '8-12', 120),
    mkExercise('p-phat-lo2-6', 'preset-phat-lo-hyp', 'lying-leg-curls', 6, 2, '12-15', 75),
    mkExercise('p-phat-lo2-7', 'preset-phat-lo-hyp', 'seated-calf-raise', 7, 4, '8-12', 60),
    // Chest & Arms Hypertrophy
    mkExercise('p-phat-ca-1', 'preset-phat-chest-arms', 'barbell-bench-press-medium-grip', 1, 6, '3', 60, 'Hız ile, %65-70 1RM'),
    mkExercise('p-phat-ca-2', 'preset-phat-chest-arms', 'incline-dumbbell-press', 2, 3, '8-12', 90),
    mkExercise('p-phat-ca-3', 'preset-phat-chest-arms', 'dumbbell-flyes', 3, 3, '12-15', 60),
    mkExercise('p-phat-ca-4', 'preset-phat-chest-arms', 'cable-crossover', 4, 2, '15-20', 60),
    mkExercise('p-phat-ca-5', 'preset-phat-chest-arms', 'preacher-curl', 5, 3, '8-12', 75),
    mkExercise('p-phat-ca-6', 'preset-phat-chest-arms', 'hammer-curls', 6, 3, '12-15', 60),
    mkExercise('p-phat-ca-7', 'preset-phat-chest-arms', 'ez-bar-skullcrusher', 7, 3, '8-12', 75),
    mkExercise('p-phat-ca-8', 'preset-phat-chest-arms', 'triceps-pushdown', 8, 3, '12-15', 60),
  ],
};

// ============================================================================
// 13. nSuns 531 LP (4-Day, Intermediate-Advanced)
// ============================================================================
const nSuns: RawProgramBundle = {
  program: {
    id: 'preset-nsuns',
    ownerId: null,
    name: 'nSuns 531 LP (4-Day)',
    nameTr: 'nSuns 5/3/1 LP (4 Gün)',
    description:
      'Reddit\'in efsane programı. Her gün 2 ana lift: 1 ağır (5/3/1+ pyramid) + 1 hacim (8x5 LP). Yoğun hacim, hızlı progression. Linear progression artışı her hafta. İleri başlangıç-orta seviye için.',
    descriptionTr:
      'Reddit\'in efsane programı. Her gün 2 ana lift: 1 ağır (5/3/1+ pyramid) + 1 hacim (8x5 LP). Yoğun hacim, hızlı progression. Linear progression artışı her hafta. İleri başlangıç-orta seviye için.',
    goal: 'strength',
    level: 'intermediate',
    frequencyPerWeek: 4,
    durationWeeks: 12,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-nsuns-bench',
      programId: 'preset-nsuns',
      dayOrder: 1,
      focus: 'push',
      name: 'Bench + OHP',
      nameTr: 'Bench + OHP',
    },
    {
      id: 'preset-nsuns-squat',
      programId: 'preset-nsuns',
      dayOrder: 2,
      focus: 'lower',
      name: 'Squat + Sumo Deadlift',
      nameTr: 'Squat + Sumo Deadlift',
    },
    {
      id: 'preset-nsuns-ohp',
      programId: 'preset-nsuns',
      dayOrder: 3,
      focus: 'push',
      name: 'OHP + Bench',
      nameTr: 'OHP + Bench',
    },
    {
      id: 'preset-nsuns-dl',
      programId: 'preset-nsuns',
      dayOrder: 4,
      focus: 'pull',
      name: 'Deadlift + Front Squat',
      nameTr: 'Deadlift + Front Squat',
    },
  ],
  exercises: [
    // Bench Day
    mkExercise('p-ns-b-1', 'preset-nsuns-bench', 'barbell-bench-press-medium-grip', 1, 9, '5/3/1+', 180, 'Ana lift: 9 set pyramid yüklenmesi'),
    mkExercise('p-ns-b-2', 'preset-nsuns-bench', 'standing-military-press', 2, 8, '5', 120, 'Volume work: 8x5 LP'),
    mkExercise('p-ns-b-3', 'preset-nsuns-bench', 'wide-grip-lat-pulldown', 3, 4, '8-12', 90),
    mkExercise('p-ns-b-4', 'preset-nsuns-bench', 'side-lateral-raise', 4, 3, '12-15', 60),
    // Squat Day
    mkExercise('p-ns-s-1', 'preset-nsuns-squat', 'barbell-squat', 1, 9, '5/3/1+', 180, '9 set pyramid'),
    mkExercise('p-ns-s-2', 'preset-nsuns-squat', 'sumo-deadlift', 2, 8, '5', 150, '8x5 LP'),
    mkExercise('p-ns-s-3', 'preset-nsuns-squat', 'leg-press', 3, 4, '10', 90),
    mkExercise('p-ns-s-4', 'preset-nsuns-squat', 'hanging-leg-raise', 4, 3, '10-15', 60),
    // OHP Day
    mkExercise('p-ns-o-1', 'preset-nsuns-ohp', 'standing-military-press', 1, 9, '5/3/1+', 180, '9 set pyramid'),
    mkExercise('p-ns-o-2', 'preset-nsuns-ohp', 'barbell-bench-press-medium-grip', 2, 8, '5', 150, '8x5 LP'),
    mkExercise('p-ns-o-3', 'preset-nsuns-ohp', 'pullups', 3, 4, '6-10', 120),
    mkExercise('p-ns-o-4', 'preset-nsuns-ohp', 'hammer-curls', 4, 3, '10-12', 60),
    // Deadlift Day
    mkExercise('p-ns-d-1', 'preset-nsuns-dl', 'barbell-deadlift', 1, 9, '5/3/1+', 240, '9 set pyramid'),
    mkExercise('p-ns-d-2', 'preset-nsuns-dl', 'front-barbell-squat', 2, 8, '5', 150, '8x5 LP'),
    mkExercise('p-ns-d-3', 'preset-nsuns-dl', 'bent-over-barbell-row', 3, 4, '8-10', 90),
    mkExercise('p-ns-d-4', 'preset-nsuns-dl', 'plank', 4, 3, '60s', 60),
  ],
};

// ============================================================================
// 14. Madcow 5x5 (3-Day Intermediate, Bill Madden)
// ============================================================================
const madcow5x5: RawProgramBundle = {
  program: {
    id: 'preset-madcow-5x5',
    ownerId: null,
    name: 'Madcow 5x5',
    nameTr: 'Madcow 5x5',
    description:
      'StrongLifts sonrası en popüler intermediate program. 3 gün/hafta, A-B-A / B-A-B değişimi. Heavy/Light/Medium günler ile progression yavaşlar ama daha sürdürülebilir. Tek günde 5x5 ramped sets.',
    descriptionTr:
      'StrongLifts sonrası en popüler intermediate program. 3 gün/hafta, A-B-A / B-A-B değişimi. Heavy/Light/Medium günler ile progression yavaşlar ama daha sürdürülebilir. Tek günde 5x5 ramped sets.',
    goal: 'strength',
    level: 'intermediate',
    frequencyPerWeek: 3,
    durationWeeks: 12,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-mc-heavy',
      programId: 'preset-madcow-5x5',
      dayOrder: 1,
      focus: 'fullBody',
      name: 'Heavy Day',
      nameTr: 'Ağır Gün',
    },
    {
      id: 'preset-mc-light',
      programId: 'preset-madcow-5x5',
      dayOrder: 2,
      focus: 'fullBody',
      name: 'Light Day',
      nameTr: 'Hafif Gün',
    },
    {
      id: 'preset-mc-medium',
      programId: 'preset-madcow-5x5',
      dayOrder: 3,
      focus: 'fullBody',
      name: 'Medium Day (PR Day)',
      nameTr: 'Orta Gün (PR Günü)',
    },
  ],
  exercises: [
    // Heavy Day - 5x5 ramping
    mkExercise('p-mc-h-1', 'preset-mc-heavy', 'barbell-squat', 1, 5, '5', 180, '5x5 ramped, son set en ağır'),
    mkExercise('p-mc-h-2', 'preset-mc-heavy', 'barbell-bench-press-medium-grip', 2, 5, '5', 180, '5x5 ramped'),
    mkExercise('p-mc-h-3', 'preset-mc-heavy', 'bent-over-barbell-row', 3, 5, '5', 180, '5x5 ramped'),
    // Light Day - %80 weights, recovery
    mkExercise('p-mc-l-1', 'preset-mc-light', 'barbell-squat', 1, 4, '5', 120, '%80 ağırlıkla, hafif'),
    mkExercise('p-mc-l-2', 'preset-mc-light', 'standing-military-press', 2, 4, '5', 120),
    mkExercise('p-mc-l-3', 'preset-mc-light', 'barbell-deadlift', 3, 4, '5', 180),
    // Medium Day - PR set
    mkExercise('p-mc-m-1', 'preset-mc-medium', 'barbell-squat', 1, 4, '5+1x3+1x8', 240, 'Heavy gün +%2.5, son set 8 tekrar'),
    mkExercise('p-mc-m-2', 'preset-mc-medium', 'barbell-bench-press-medium-grip', 2, 4, '5+1x3+1x8', 240, 'PR set'),
    mkExercise('p-mc-m-3', 'preset-mc-medium', 'bent-over-barbell-row', 3, 4, '5+1x3+1x8', 240),
  ],
};

// ============================================================================
// 15. HST — Hypertrophy Specific Training (3-Day Full Body)
// ============================================================================
const hst: RawProgramBundle = {
  program: {
    id: 'preset-hst',
    ownerId: null,
    name: 'HST (Hypertrophy Specific Training)',
    nameTr: 'HST (Hipertrofiye Özel Antrenman)',
    description:
      'Bryan Haycock\'un bilime dayalı hipertrofi sistemi. 3 gün/hafta tüm vücut. 8 haftalık döngü: 2 hafta 15-rep, 2 hafta 10-rep, 2 hafta 5-rep, 2 hafta negatives. Mekanik gerilim için yüksek frekans + progresif yükleme.',
    descriptionTr:
      'Bryan Haycock\'un bilime dayalı hipertrofi sistemi. 3 gün/hafta tüm vücut. 8 haftalık döngü: 2 hafta 15-rep, 2 hafta 10-rep, 2 hafta 5-rep, 2 hafta negatives. Mekanik gerilim için yüksek frekans + progresif yükleme.',
    goal: 'bulk',
    level: 'intermediate',
    frequencyPerWeek: 3,
    durationWeeks: 8,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-hst-a',
      programId: 'preset-hst',
      dayOrder: 1,
      focus: 'fullBody',
      name: 'Full Body A',
      nameTr: 'Full Body A',
    },
    {
      id: 'preset-hst-b',
      programId: 'preset-hst',
      dayOrder: 2,
      focus: 'fullBody',
      name: 'Full Body B',
      nameTr: 'Full Body B',
    },
    {
      id: 'preset-hst-c',
      programId: 'preset-hst',
      dayOrder: 3,
      focus: 'fullBody',
      name: 'Full Body C',
      nameTr: 'Full Body C',
    },
  ],
  exercises: [
    // A
    mkExercise('p-hst-a-1', 'preset-hst-a', 'barbell-squat', 1, 2, '15→10→5', 90, 'Döngü ilerledikçe rep azalır, ağırlık artar'),
    mkExercise('p-hst-a-2', 'preset-hst-a', 'barbell-bench-press-medium-grip', 2, 2, '15→10→5', 90),
    mkExercise('p-hst-a-3', 'preset-hst-a', 'bent-over-barbell-row', 3, 2, '15→10→5', 90),
    mkExercise('p-hst-a-4', 'preset-hst-a', 'standing-military-press', 4, 2, '15→10→5', 75),
    mkExercise('p-hst-a-5', 'preset-hst-a', 'barbell-curl', 5, 1, '15→10→5', 60),
    mkExercise('p-hst-a-6', 'preset-hst-a', 'triceps-pushdown', 6, 1, '15→10→5', 60),
    mkExercise('p-hst-a-7', 'preset-hst-a', 'seated-calf-raise', 7, 1, '15→10→5', 45),
    // B
    mkExercise('p-hst-b-1', 'preset-hst-b', 'romanian-deadlift', 1, 2, '15→10→5', 90),
    mkExercise('p-hst-b-2', 'preset-hst-b', 'incline-dumbbell-press', 2, 2, '15→10→5', 75),
    mkExercise('p-hst-b-3', 'preset-hst-b', 'pullups', 3, 2, '15→10→5', 90),
    mkExercise('p-hst-b-4', 'preset-hst-b', 'side-lateral-raise', 4, 2, '15→10→5', 60),
    mkExercise('p-hst-b-5', 'preset-hst-b', 'hammer-curls', 5, 1, '15→10→5', 60),
    mkExercise('p-hst-b-6', 'preset-hst-b', 'ez-bar-skullcrusher', 6, 1, '15→10→5', 60),
    mkExercise('p-hst-b-7', 'preset-hst-b', 'crunches', 7, 2, '15-20', 45),
    // C - varies again
    mkExercise('p-hst-c-1', 'preset-hst-c', 'leg-press', 1, 2, '15→10→5', 90),
    mkExercise('p-hst-c-2', 'preset-hst-c', 'dumbbell-bench-press', 2, 2, '15→10→5', 75),
    mkExercise('p-hst-c-3', 'preset-hst-c', 'seated-cable-rows', 3, 2, '15→10→5', 75),
    mkExercise('p-hst-c-4', 'preset-hst-c', 'dumbbell-shoulder-press', 4, 2, '15→10→5', 75),
    mkExercise('p-hst-c-5', 'preset-hst-c', 'preacher-curl', 5, 1, '15→10→5', 60),
    mkExercise('p-hst-c-6', 'preset-hst-c', 'tricep-dumbbell-kickback', 6, 1, '15→10→5', 60),
    mkExercise('p-hst-c-7', 'preset-hst-c', 'plank', 7, 2, '45s', 45),
  ],
};

// ============================================================================
// 16. Reverse Pyramid Training (3-Day Full Body, Andy Morgan / Martin Berkhan)
// ============================================================================
const rpt: RawProgramBundle = {
  program: {
    id: 'preset-rpt',
    ownerId: null,
    name: 'Reverse Pyramid Training',
    nameTr: 'Ters Piramit Antrenman (RPT)',
    description:
      'Martin Berkhan / Andy Morgan tarzı minimalist program. 3 gün/hafta tüm vücut. İlk set en ağır (4-6 tekrar), her sonraki sette ağırlık %10 düşer + tekrar artar. Düşük volume, yüksek yoğunluk. Vakit kazandırır.',
    descriptionTr:
      'Martin Berkhan / Andy Morgan tarzı minimalist program. 3 gün/hafta tüm vücut. İlk set en ağır (4-6 tekrar), her sonraki sette ağırlık %10 düşer + tekrar artar. Düşük volume, yüksek yoğunluk. Vakit kazandırır.',
    goal: 'strength',
    level: 'intermediate',
    frequencyPerWeek: 3,
    durationWeeks: 10,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-rpt-a',
      programId: 'preset-rpt',
      dayOrder: 1,
      focus: 'fullBody',
      name: 'Day A',
      nameTr: 'Gün A',
    },
    {
      id: 'preset-rpt-b',
      programId: 'preset-rpt',
      dayOrder: 2,
      focus: 'fullBody',
      name: 'Day B',
      nameTr: 'Gün B',
    },
    {
      id: 'preset-rpt-c',
      programId: 'preset-rpt',
      dayOrder: 3,
      focus: 'fullBody',
      name: 'Day C',
      nameTr: 'Gün C',
    },
  ],
  exercises: [
    // A: Bench focus
    mkExercise('p-rpt-a-1', 'preset-rpt-a', 'barbell-bench-press-medium-grip', 1, 3, '4-6 → 6-8 → 8-10', 180, 'Set 1: ağır 4-6 / Set 2: -%10 / Set 3: -%10 daha'),
    mkExercise('p-rpt-a-2', 'preset-rpt-a', 'pullups', 2, 3, '6-8 → 8-10 → 10-12', 150),
    mkExercise('p-rpt-a-3', 'preset-rpt-a', 'standing-military-press', 3, 3, '4-6 → 6-8 → 8-10', 150),
    mkExercise('p-rpt-a-4', 'preset-rpt-a', 'barbell-curl', 4, 2, '6-8 → 8-10', 90),
    // B: Squat focus
    mkExercise('p-rpt-b-1', 'preset-rpt-b', 'barbell-squat', 1, 3, '4-6 → 6-8 → 8-10', 240),
    mkExercise('p-rpt-b-2', 'preset-rpt-b', 'romanian-deadlift', 2, 2, '6-8 → 8-10', 180),
    mkExercise('p-rpt-b-3', 'preset-rpt-b', 'dumbbell-lunges', 3, 2, '8-10 → 10-12', 90),
    mkExercise('p-rpt-b-4', 'preset-rpt-b', 'seated-calf-raise', 4, 2, '8-10 → 10-12', 60),
    // C: Deadlift focus
    mkExercise('p-rpt-c-1', 'preset-rpt-c', 'barbell-deadlift', 1, 2, '4-6 → 6-8', 240, 'RPT için sadece 2 set, recovery kritik'),
    mkExercise('p-rpt-c-2', 'preset-rpt-c', 'incline-dumbbell-press', 2, 3, '6-8 → 8-10 → 10-12', 120),
    mkExercise('p-rpt-c-3', 'preset-rpt-c', 'one-arm-dumbbell-row', 3, 3, '6-8 → 8-10 → 10-12', 90),
    mkExercise('p-rpt-c-4', 'preset-rpt-c', 'hammer-curls', 4, 2, '8-10 → 10-12', 75),
    mkExercise('p-rpt-c-5', 'preset-rpt-c', 'close-grip-barbell-bench-press', 5, 2, '6-8 → 8-10', 90),
  ],
};

// ============================================================================
// 17. Mike Mentzer Heavy Duty HIT (2-Day Split)
// ============================================================================
const mentzerHIT: RawProgramBundle = {
  program: {
    id: 'preset-mentzer-hit',
    ownerId: null,
    name: 'Mike Mentzer Heavy Duty HIT',
    nameTr: 'Mike Mentzer Heavy Duty (HIT)',
    description:
      'Mike Mentzer\'in efsane Heavy Duty sistemi. Sadece 2 gün/hafta, her egzersizde 1 (en fazla 2) set, başarısızlığa kadar. Forced reps, negatives, drop sets ile maksimum yoğunluk. Aşırı recovery → kas büyür. Volume\'a karşı zafer.',
    descriptionTr:
      'Mike Mentzer\'in efsane Heavy Duty sistemi. Sadece 2 gün/hafta, her egzersizde 1 (en fazla 2) set, başarısızlığa kadar. Forced reps, negatives, drop sets ile maksimum yoğunluk. Aşırı recovery → kas büyür. Volume\'a karşı zafer.',
    goal: 'bulk',
    level: 'advanced',
    frequencyPerWeek: 2,
    durationWeeks: 6,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-mz-a',
      programId: 'preset-mentzer-hit',
      dayOrder: 1,
      focus: 'upper',
      name: 'Chest, Back, Shoulders',
      nameTr: 'Göğüs, Sırt, Omuz',
    },
    {
      id: 'preset-mz-b',
      programId: 'preset-mentzer-hit',
      dayOrder: 2,
      focus: 'fullBody',
      name: 'Legs, Arms, Calves',
      nameTr: 'Bacak, Kol, Baldır',
    },
  ],
  exercises: [
    // Day A
    mkExercise('p-mz-a-1', 'preset-mz-a', 'incline-dumbbell-press', 1, 1, '6-10', 120, 'Başarısızlığa kadar tek set'),
    mkExercise('p-mz-a-2', 'preset-mz-a', 'dumbbell-flyes', 2, 1, '6-10', 90, 'Pre-exhaust'),
    mkExercise('p-mz-a-3', 'preset-mz-a', 'pullups', 3, 1, '6-10', 120, 'Negatives ile yardım al'),
    mkExercise('p-mz-a-4', 'preset-mz-a', 'bent-over-barbell-row', 4, 1, '6-10', 120),
    mkExercise('p-mz-a-5', 'preset-mz-a', 'standing-military-press', 5, 1, '6-10', 120),
    mkExercise('p-mz-a-6', 'preset-mz-a', 'face-pull', 6, 1, '12-15', 60),
    // Day B
    mkExercise('p-mz-b-1', 'preset-mz-b', 'leg-extensions', 1, 1, '12-15', 90, 'Pre-exhaust quads'),
    mkExercise('p-mz-b-2', 'preset-mz-b', 'leg-press', 2, 1, '8-15', 120, 'Failure'),
    mkExercise('p-mz-b-3', 'preset-mz-b', 'seated-leg-curl', 3, 1, '8-12', 90),
    mkExercise('p-mz-b-4', 'preset-mz-b', 'seated-calf-raise', 4, 1, '12-20', 60),
    mkExercise('p-mz-b-5', 'preset-mz-b', 'preacher-curl', 5, 1, '6-10', 90, 'Strict form'),
    mkExercise('p-mz-b-6', 'preset-mz-b', 'close-grip-barbell-bench-press', 6, 1, '6-10', 90),
  ],
};

// ============================================================================
// 18. MyFitCraft Full Body Frequency 5-Day (USERS' REQUEST)
// ============================================================================
const mfcFullBody5Day: RawProgramBundle = {
  program: {
    id: 'preset-mfc-fb-5day',
    ownerId: null,
    name: 'MyFitCraft Full Body 5-Day Frequency',
    nameTr: 'MyFitCraft Full Body 5 Gün (Yüksek Frekans)',
    description:
      'Her gün tüm vücudu farklı varyasyonla çalıştır. 5 gün/hafta, her gün 4-5 hareket. Düşük per-session volume + yüksek frekans = optimal hipertrofi (Greg Nuckols / Lyle McDonald science). Her büyük kas haftada 5 kez vurulur.',
    descriptionTr:
      'Her gün tüm vücudu farklı varyasyonla çalıştır. 5 gün/hafta, her gün 4-5 hareket. Düşük per-session volume + yüksek frekans = optimal hipertrofi (Greg Nuckols / Lyle McDonald science). Her büyük kas haftada 5 kez vurulur.',
    goal: 'bulk',
    level: 'intermediate',
    frequencyPerWeek: 5,
    durationWeeks: 8,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-mfc-fb5-1',
      programId: 'preset-mfc-fb-5day',
      dayOrder: 1,
      focus: 'fullBody',
      name: 'Day 1 — Heavy Squat',
      nameTr: 'Gün 1 — Ağır Squat',
    },
    {
      id: 'preset-mfc-fb5-2',
      programId: 'preset-mfc-fb-5day',
      dayOrder: 2,
      focus: 'fullBody',
      name: 'Day 2 — Heavy Bench',
      nameTr: 'Gün 2 — Ağır Bench',
    },
    {
      id: 'preset-mfc-fb5-3',
      programId: 'preset-mfc-fb-5day',
      dayOrder: 3,
      focus: 'fullBody',
      name: 'Day 3 — Heavy Deadlift',
      nameTr: 'Gün 3 — Ağır Deadlift',
    },
    {
      id: 'preset-mfc-fb5-4',
      programId: 'preset-mfc-fb-5day',
      dayOrder: 4,
      focus: 'fullBody',
      name: 'Day 4 — Heavy OHP',
      nameTr: 'Gün 4 — Ağır OHP',
    },
    {
      id: 'preset-mfc-fb5-5',
      programId: 'preset-mfc-fb-5day',
      dayOrder: 5,
      focus: 'fullBody',
      name: 'Day 5 — Hypertrophy',
      nameTr: 'Gün 5 — Hipertrofi',
    },
  ],
  exercises: [
    // Day 1 — Heavy Squat
    mkExercise('p-mfc-fb5-1-1', 'preset-mfc-fb5-1', 'barbell-squat', 1, 4, '5', 180, 'Ana lift, ağır'),
    mkExercise('p-mfc-fb5-1-2', 'preset-mfc-fb5-1', 'incline-dumbbell-press', 2, 3, '8-10', 90),
    mkExercise('p-mfc-fb5-1-3', 'preset-mfc-fb5-1', 'one-arm-dumbbell-row', 3, 3, '8-10', 90),
    mkExercise('p-mfc-fb5-1-4', 'preset-mfc-fb5-1', 'standing-leg-curl', 4, 3, '10-12', 75),
    mkExercise('p-mfc-fb5-1-5', 'preset-mfc-fb5-1', 'side-lateral-raise', 5, 3, '12-15', 45),
    // Day 2 — Heavy Bench
    mkExercise('p-mfc-fb5-2-1', 'preset-mfc-fb5-2', 'barbell-bench-press-medium-grip', 1, 4, '5', 180, 'Ana lift, ağır'),
    mkExercise('p-mfc-fb5-2-2', 'preset-mfc-fb5-2', 'front-barbell-squat', 2, 3, '6-8', 150),
    mkExercise('p-mfc-fb5-2-3', 'preset-mfc-fb5-2', 'wide-grip-lat-pulldown', 3, 3, '8-10', 90),
    mkExercise('p-mfc-fb5-2-4', 'preset-mfc-fb5-2', 'romanian-deadlift', 4, 3, '8-10', 120),
    mkExercise('p-mfc-fb5-2-5', 'preset-mfc-fb5-2', 'hammer-curls', 5, 3, '10-12', 60),
    // Day 3 — Heavy Deadlift
    mkExercise('p-mfc-fb5-3-1', 'preset-mfc-fb5-3', 'barbell-deadlift', 1, 3, '5', 240, 'Ana lift, ağır'),
    mkExercise('p-mfc-fb5-3-2', 'preset-mfc-fb5-3', 'dumbbell-bench-press', 2, 3, '8-10', 90),
    mkExercise('p-mfc-fb5-3-3', 'preset-mfc-fb5-3', 'seated-cable-rows', 3, 3, '10-12', 75),
    mkExercise('p-mfc-fb5-3-4', 'preset-mfc-fb5-3', 'leg-press', 4, 3, '10-12', 90),
    mkExercise('p-mfc-fb5-3-5', 'preset-mfc-fb5-3', 'triceps-pushdown', 5, 3, '12-15', 60),
    // Day 4 — Heavy OHP
    mkExercise('p-mfc-fb5-4-1', 'preset-mfc-fb5-4', 'standing-military-press', 1, 4, '5', 180, 'Ana lift, ağır'),
    mkExercise('p-mfc-fb5-4-2', 'preset-mfc-fb5-4', 'hack-squat', 2, 3, '8-10', 120),
    mkExercise('p-mfc-fb5-4-3', 'preset-mfc-fb5-4', 'pullups', 3, 3, '6-10', 120),
    mkExercise('p-mfc-fb5-4-4', 'preset-mfc-fb5-4', 'lying-leg-curls', 4, 3, '10-12', 75),
    mkExercise('p-mfc-fb5-4-5', 'preset-mfc-fb5-4', 'preacher-curl', 5, 3, '10-12', 60),
    // Day 5 — Hypertrophy / Pump Day
    mkExercise('p-mfc-fb5-5-1', 'preset-mfc-fb5-5', 'leg-extensions', 1, 4, '12-15', 60),
    mkExercise('p-mfc-fb5-5-2', 'preset-mfc-fb5-5', 'cable-crossover', 2, 4, '12-15', 60),
    mkExercise('p-mfc-fb5-5-3', 'preset-mfc-fb5-5', 'face-pull', 3, 4, '15-20', 45),
    mkExercise('p-mfc-fb5-5-4', 'preset-mfc-fb5-5', 'dumbbell-flyes', 4, 3, '12-15', 60),
    mkExercise('p-mfc-fb5-5-5', 'preset-mfc-fb5-5', 'seated-calf-raise', 5, 4, '12-20', 45),
    mkExercise('p-mfc-fb5-5-6', 'preset-mfc-fb5-5', 'plank', 6, 3, '60s', 45),
  ],
};

// ============================================================================
// 19. MyFitCraft Old School 4-Day (Reg Park / Bill Pearl Inspired)
// ============================================================================
const mfcOldSchool: RawProgramBundle = {
  program: {
    id: 'preset-mfc-old-school',
    ownerId: null,
    name: 'MyFitCraft Old School 4-Day',
    nameTr: 'MyFitCraft Eski Okul 4 Gün',
    description:
      'Reg Park ve Bill Pearl\'in 60-70\'lerin altın çağ yaklaşımı. 4 gün/hafta, Upper-Lower split. Yüksek volume (5x5-8), uzun dinlenme, klasik compound\'lar + temel accessory. Saf güç + estetik.',
    descriptionTr:
      'Reg Park ve Bill Pearl\'in 60-70\'lerin altın çağ yaklaşımı. 4 gün/hafta, Upper-Lower split. Yüksek volume (5x5-8), uzun dinlenme, klasik compound\'lar + temel accessory. Saf güç + estetik.',
    goal: 'bulk',
    level: 'intermediate',
    frequencyPerWeek: 4,
    durationWeeks: 12,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-mfc-os-1',
      programId: 'preset-mfc-old-school',
      dayOrder: 1,
      focus: 'upper',
      name: 'Upper #1',
      nameTr: 'Üst #1',
    },
    {
      id: 'preset-mfc-os-2',
      programId: 'preset-mfc-old-school',
      dayOrder: 2,
      focus: 'lower',
      name: 'Lower #1',
      nameTr: 'Alt #1',
    },
    {
      id: 'preset-mfc-os-3',
      programId: 'preset-mfc-old-school',
      dayOrder: 3,
      focus: 'upper',
      name: 'Upper #2',
      nameTr: 'Üst #2',
    },
    {
      id: 'preset-mfc-os-4',
      programId: 'preset-mfc-old-school',
      dayOrder: 4,
      focus: 'lower',
      name: 'Lower #2',
      nameTr: 'Alt #2',
    },
  ],
  exercises: [
    // Upper #1
    mkExercise('p-mfc-os-1-1', 'preset-mfc-os-1', 'barbell-bench-press-medium-grip', 1, 5, '5', 180),
    mkExercise('p-mfc-os-1-2', 'preset-mfc-os-1', 'standing-military-press', 2, 5, '6', 180),
    mkExercise('p-mfc-os-1-3', 'preset-mfc-os-1', 'bent-over-barbell-row', 3, 5, '6', 150),
    mkExercise('p-mfc-os-1-4', 'preset-mfc-os-1', 'pullups', 4, 4, '8-10', 120),
    mkExercise('p-mfc-os-1-5', 'preset-mfc-os-1', 'barbell-curl', 5, 4, '8', 90),
    mkExercise('p-mfc-os-1-6', 'preset-mfc-os-1', 'parallel-bar-dip', 6, 4, '8-12', 90),
    // Lower #1
    mkExercise('p-mfc-os-2-1', 'preset-mfc-os-2', 'barbell-squat', 1, 5, '5', 240),
    mkExercise('p-mfc-os-2-2', 'preset-mfc-os-2', 'romanian-deadlift', 2, 4, '6-8', 180),
    mkExercise('p-mfc-os-2-3', 'preset-mfc-os-2', 'barbell-step-ups', 3, 4, '8 each', 90),
    mkExercise('p-mfc-os-2-4', 'preset-mfc-os-2', 'standing-calf-raises', 4, 5, '10-15', 60, 'Eğer bu hareket yoksa seated-calf-raise yap'),
    mkExercise('p-mfc-os-2-5', 'preset-mfc-os-2', 'sit-up', 5, 4, '15-20', 45),
    // Upper #2
    mkExercise('p-mfc-os-3-1', 'preset-mfc-os-3', 'incline-dumbbell-press', 1, 5, '6-8', 150),
    mkExercise('p-mfc-os-3-2', 'preset-mfc-os-3', 'dumbbell-shoulder-press', 2, 4, '8', 120),
    mkExercise('p-mfc-os-3-3', 'preset-mfc-os-3', 'one-arm-dumbbell-row', 3, 4, '8-10', 90),
    mkExercise('p-mfc-os-3-4', 'preset-mfc-os-3', 'wide-grip-lat-pulldown', 4, 4, '8-10', 90),
    mkExercise('p-mfc-os-3-5', 'preset-mfc-os-3', 'preacher-curl', 5, 3, '8-10', 75),
    mkExercise('p-mfc-os-3-6', 'preset-mfc-os-3', 'ez-bar-skullcrusher', 6, 3, '8-10', 75),
    // Lower #2
    mkExercise('p-mfc-os-4-1', 'preset-mfc-os-4', 'barbell-deadlift', 1, 5, '5', 240),
    mkExercise('p-mfc-os-4-2', 'preset-mfc-os-4', 'front-barbell-squat', 2, 4, '6-8', 180),
    mkExercise('p-mfc-os-4-3', 'preset-mfc-os-4', 'leg-press', 3, 4, '10', 120),
    mkExercise('p-mfc-os-4-4', 'preset-mfc-os-4', 'lying-leg-curls', 4, 4, '10-12', 75),
    mkExercise('p-mfc-os-4-5', 'preset-mfc-os-4', 'seated-calf-raise', 5, 5, '12-15', 60),
  ],
};

// ============================================================================
// 20. MyFitCraft 3-Day Hybrid Full Body (Beginner+)
// ============================================================================
const mfcHybridFB: RawProgramBundle = {
  program: {
    id: 'preset-mfc-hybrid-fb',
    ownerId: null,
    name: 'MyFitCraft 3-Day Hybrid Full Body',
    nameTr: 'MyFitCraft 3 Gün Hibrit Full Body',
    description:
      'Greg Nuckols\'un 28 ücretsiz programından ilham. 3 gün/hafta tüm vücut. Her gün 1 squat pattern + 1 hinge pattern + 1 push + 1 pull + accessory. Dengeli, sürdürülebilir. Beginner-Intermediate köprüsü için ideal.',
    descriptionTr:
      'Greg Nuckols\'un 28 ücretsiz programından ilham. 3 gün/hafta tüm vücut. Her gün 1 squat pattern + 1 hinge pattern + 1 push + 1 pull + accessory. Dengeli, sürdürülebilir. Beginner-Intermediate köprüsü için ideal.',
    goal: 'bulk',
    level: 'beginner',
    frequencyPerWeek: 3,
    durationWeeks: 10,
    isPreset: true,
    createdAt: ts,
  },
  days: [
    {
      id: 'preset-mfc-hyb-a',
      programId: 'preset-mfc-hybrid-fb',
      dayOrder: 1,
      focus: 'fullBody',
      name: 'Day A',
      nameTr: 'Gün A',
    },
    {
      id: 'preset-mfc-hyb-b',
      programId: 'preset-mfc-hybrid-fb',
      dayOrder: 2,
      focus: 'fullBody',
      name: 'Day B',
      nameTr: 'Gün B',
    },
    {
      id: 'preset-mfc-hyb-c',
      programId: 'preset-mfc-hybrid-fb',
      dayOrder: 3,
      focus: 'fullBody',
      name: 'Day C',
      nameTr: 'Gün C',
    },
  ],
  exercises: [
    // A
    mkExercise('p-mfc-hyb-a-1', 'preset-mfc-hyb-a', 'barbell-squat', 1, 4, '6-8', 180),
    mkExercise('p-mfc-hyb-a-2', 'preset-mfc-hyb-a', 'romanian-deadlift', 2, 3, '8-10', 120),
    mkExercise('p-mfc-hyb-a-3', 'preset-mfc-hyb-a', 'barbell-bench-press-medium-grip', 3, 4, '6-8', 150),
    mkExercise('p-mfc-hyb-a-4', 'preset-mfc-hyb-a', 'one-arm-dumbbell-row', 4, 3, '8-10', 90),
    mkExercise('p-mfc-hyb-a-5', 'preset-mfc-hyb-a', 'side-lateral-raise', 5, 3, '12-15', 45),
    mkExercise('p-mfc-hyb-a-6', 'preset-mfc-hyb-a', 'plank', 6, 3, '45s', 45),
    // B
    mkExercise('p-mfc-hyb-b-1', 'preset-mfc-hyb-b', 'front-barbell-squat', 1, 3, '8-10', 150),
    mkExercise('p-mfc-hyb-b-2', 'preset-mfc-hyb-b', 'barbell-deadlift', 2, 3, '5', 240),
    mkExercise('p-mfc-hyb-b-3', 'preset-mfc-hyb-b', 'standing-military-press', 3, 4, '6-8', 150),
    mkExercise('p-mfc-hyb-b-4', 'preset-mfc-hyb-b', 'pullups', 4, 4, '6-10', 120),
    mkExercise('p-mfc-hyb-b-5', 'preset-mfc-hyb-b', 'barbell-curl', 5, 3, '10-12', 60),
    mkExercise('p-mfc-hyb-b-6', 'preset-mfc-hyb-b', 'hanging-leg-raise', 6, 3, '10-12', 60),
    // C
    mkExercise('p-mfc-hyb-c-1', 'preset-mfc-hyb-c', 'leg-press', 1, 4, '10-12', 90),
    mkExercise('p-mfc-hyb-c-2', 'preset-mfc-hyb-c', 'seated-leg-curl', 2, 3, '10-12', 75),
    mkExercise('p-mfc-hyb-c-3', 'preset-mfc-hyb-c', 'incline-dumbbell-press', 3, 4, '8-10', 120),
    mkExercise('p-mfc-hyb-c-4', 'preset-mfc-hyb-c', 'seated-cable-rows', 4, 3, '10-12', 75),
    mkExercise('p-mfc-hyb-c-5', 'preset-mfc-hyb-c', 'triceps-pushdown', 5, 3, '12-15', 60),
    mkExercise('p-mfc-hyb-c-6', 'preset-mfc-hyb-c', 'seated-calf-raise', 6, 4, '12-15', 45),
  ],
};

// ============================================================================
const RAW_PRESETS: RawProgramBundle[] = [
  // Ünlü programlar (5)
  strongLifts5x5,
  startingStrength,
  fiveThreeOneBBB,
  ppl6Day,
  gzclp,
  // MyFitCraft orijinal programlar (5)
  mfcBeginner,
  mfcUpperLower,
  mfcBroSplit,
  mfcHomeBW,
  mfcPowerlifter,
  // İkinci dalga ünlü programlar (5)
  phul,
  phat,
  nSuns,
  madcow5x5,
  hst,
  // İkinci dalga MyFitCraft + minimalist (5)
  rpt,
  mentzerHIT,
  mfcFullBody5Day,
  mfcOldSchool,
  mfcHybridFB,
];

/**
 * Tüm preset bundle'lar için `days[].ownerId = null` ve `exercises[].ownerId = null`
 * normalize edilir (security rules ve type model gereği). Bu sayede her bundle'da
 * `ownerId` tekrar tekrar yazmaya gerek kalmıyor.
 */
export const PRESET_PROGRAMS: ProgramBundle[] = RAW_PRESETS.map((b) => ({
  program: b.program,
  days: b.days.map((d) => ({ ...d, ownerId: null })),
  exercises: b.exercises.map((e) => ({ ...e, ownerId: null })),
}));

export function getPresetProgram(programId: string): ProgramBundle | undefined {
  return PRESET_PROGRAMS.find((p) => p.program.id === programId);
}
