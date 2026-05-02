import {
  detectBulkStall,
  detectBulkTooFast,
  detectConsistencyDrop,
  detectCutBellyGain,
  detectCutTooFast,
  detectInactiveDays,
  detectLegSkip,
  detectMissedFrequency,
  detectMuscleGroupBalance,
  detectNewPRs,
  detectNoProgram,
  detectStaleLifts,
  detectStreakHighlight,
  detectVolumeDecline,
  runInsights,
  type InsightsInput,
} from '../insights';

import type {
  Exercise,
  Program,
  UserProfile,
  Workout,
  WorkoutLog,
  BodyMeasurement,
} from '@/types/models';

const NOW = new Date('2026-05-02T12:00:00.000Z').getTime();
const DAY = 24 * 60 * 60 * 1000;

function makeProfile(p: Partial<UserProfile> = {}): UserProfile {
  return {
    uid: 'u1',
    email: 'u@test.com',
    displayName: 'Test',
    photoURL: null,
    goal: 'bulk',
    height: 180,
    weight: 80,
    experienceLevel: 'intermediate',
    locale: 'tr',
    theme: 'system',
    createdAt: NOW - 90 * DAY,
    onboardingCompleted: true,
    streakCount: 0,
    lastWorkoutDate: null,
    isPremium: false,
    activeProgramId: 'prog-1',
    programSchedule: [1, 3, 5],
    programStartedAt: NOW - 30 * DAY,
    targetWeight: null,
    ...p,
  };
}

function makeProgram(p: Partial<Program> = {}): Program {
  return {
    id: 'prog-1',
    ownerId: null,
    name: 'PPL',
    nameTr: 'PPL',
    description: '',
    descriptionTr: '',
    goal: 'bulk',
    level: 'intermediate',
    frequencyPerWeek: 3,
    durationWeeks: 8,
    isPreset: true,
    createdAt: NOW - 90 * DAY,
    ...p,
  };
}

function makeWorkout(daysAgo: number, opts: Partial<Workout> = {}): Workout {
  const completedAt = NOW - daysAgo * DAY;
  return {
    id: `w-${daysAgo}-${Math.random().toString(36).slice(2, 6)}`,
    userId: 'u1',
    programId: 'prog-1',
    programDayId: 'pd-1',
    startedAt: completedAt - 60 * 60 * 1000,
    completedAt,
    durationSeconds: 3600,
    status: 'completed',
    notes: null,
    ...opts,
  };
}

function makeLog(workoutId: string, exerciseId: string, weight: number, reps: number, opts: Partial<WorkoutLog> = {}): WorkoutLog {
  return {
    id: `${workoutId}-${exerciseId}-${Math.random().toString(36).slice(2, 6)}`,
    workoutId,
    userId: 'u1',
    exerciseId,
    setNumber: 1,
    weight,
    reps,
    restSeconds: 90,
    isWarmup: false,
    isFailure: false,
    notes: null,
    completedAt: NOW,
    ...opts,
  };
}

function makeExercise(id: string, primaryMuscle: Exercise['primaryMuscle'], isCompound = true): Exercise {
  return {
    id,
    name: id,
    nameTr: id,
    primaryMuscle,
    secondaryMuscles: [],
    equipment: 'barbell',
    mechanic: 'push',
    isCompound,
    difficulty: 'intermediate',
    animationUrl: null,
    videoUrl: null,
    imageUrl: null,
    instructionSteps: [],
    instructionStepsTr: [],
    tips: [],
    tipsTr: [],
  };
}

function emptyInput(overrides: Partial<InsightsInput> = {}): InsightsInput {
  return {
    profile: makeProfile(),
    activeProgram: makeProgram(),
    workouts: [],
    logsByWorkout: {},
    personalRecords: [],
    measurements: [],
    exerciseMap: {},
    now: NOW,
    ...overrides,
  };
}

describe('insights', () => {
  describe('detectNoProgram', () => {
    it('triggers when activeProgramId is null', () => {
      const input = emptyInput({ profile: makeProfile({ activeProgramId: null }) });
      expect(detectNoProgram(input)).toMatchObject({ id: 'noProgram' });
    });
    it('does not trigger when program exists', () => {
      expect(detectNoProgram(emptyInput())).toBeNull();
    });
  });

  describe('detectMissedFrequency', () => {
    it('returns warning when target is missed and not enough days remain', () => {
      // Friday = day 5 of week → 2 days remain. Target 3, done 0 → can't catch up.
      const friday = new Date('2026-05-01T12:00:00.000Z').getTime(); // Cuma
      const input = emptyInput({ now: friday, workouts: [] });
      const r = detectMissedFrequency(input);
      expect(r?.severity).toBe('warning');
    });

    it('returns null when target met', () => {
      const workouts = [makeWorkout(0), makeWorkout(1), makeWorkout(2)];
      expect(detectMissedFrequency(emptyInput({ workouts }))).toBeNull();
    });
  });

  describe('detectMuscleGroupBalance', () => {
    it('flags low chest when chest sets <8% of total', () => {
      const benchEx = makeExercise('bench', 'chest');
      const squatEx = makeExercise('squat', 'quadriceps');
      const exerciseMap = { bench: benchEx, squat: squatEx };
      const workouts: Workout[] = [];
      const logs: Record<string, WorkoutLog[]> = {};
      // 30 squat set, 1 bench set → chest = ~3%
      for (let i = 0; i < 5; i++) {
        const w = makeWorkout(i, { id: `w-${i}` });
        workouts.push(w);
        logs[w.id] = [];
        for (let s = 0; s < 6; s++) logs[w.id].push(makeLog(w.id, 'squat', 100, 5));
      }
      // bench için ekstra 1 set
      logs[workouts[0].id].push(makeLog(workouts[0].id, 'bench', 60, 5));

      const out = detectMuscleGroupBalance(emptyInput({ workouts, logsByWorkout: logs, exerciseMap }));
      const chestGap = out.find((i) => i.id.startsWith('muscleGap-chest'));
      expect(chestGap).toBeDefined();
    });

    it('returns empty when total sets < 30', () => {
      const out = detectMuscleGroupBalance(emptyInput());
      expect(out).toHaveLength(0);
    });
  });

  describe('detectLegSkip', () => {
    it('flags when leg sets <5%', () => {
      const benchEx = makeExercise('bench', 'chest');
      const exerciseMap = { bench: benchEx };
      const workouts: Workout[] = [];
      const logs: Record<string, WorkoutLog[]> = {};
      for (let i = 0; i < 5; i++) {
        const w = makeWorkout(i, { id: `w-${i}` });
        workouts.push(w);
        logs[w.id] = [];
        for (let s = 0; s < 8; s++) logs[w.id].push(makeLog(w.id, 'bench', 60, 5));
      }
      const out = detectLegSkip(emptyInput({ workouts, logsByWorkout: logs, exerciseMap }));
      expect(out?.id).toBe('legSkip');
    });
  });

  describe('detectStaleLifts', () => {
    it('flags exercise whose 1RM did not change much in 4 weeks', () => {
      const benchEx = makeExercise('bench', 'chest');
      const exerciseMap = { bench: benchEx };
      const workouts: Workout[] = [];
      const logs: Record<string, WorkoutLog[]> = {};
      // 5 hafta üst üste aynı ağırlık & reps
      for (let i = 0; i < 5; i++) {
        const w = makeWorkout(i * 7, { id: `w-${i}` });
        workouts.push(w);
        logs[w.id] = [makeLog(w.id, 'bench', 80, 5)];
      }
      const out = detectStaleLifts(emptyInput({ workouts, logsByWorkout: logs, exerciseMap }));
      expect(out.length).toBeGreaterThanOrEqual(1);
      expect(out[0].id).toBe('stale-bench');
    });
  });

  describe('detectBulkStall', () => {
    it('flags bulk with negligible weight change in 3 weeks', () => {
      const measurements: BodyMeasurement[] = [
        { id: 'm1', userId: 'u1', date: NOW - 21 * DAY, weight: 80, chest: null, waist: null, arm: null, thigh: null, neck: null, bodyFatPct: null, notes: null },
        { id: 'm2', userId: 'u1', date: NOW - 1 * DAY, weight: 80.1, chest: null, waist: null, arm: null, thigh: null, neck: null, bodyFatPct: null, notes: null },
      ];
      expect(detectBulkStall(emptyInput({ measurements }))?.id).toBe('bulkStall');
    });

    it('does not flag for cut goal', () => {
      const measurements: BodyMeasurement[] = [
        { id: 'm1', userId: 'u1', date: NOW - 21 * DAY, weight: 80, chest: null, waist: null, arm: null, thigh: null, neck: null, bodyFatPct: null, notes: null },
        { id: 'm2', userId: 'u1', date: NOW - 1 * DAY, weight: 80, chest: null, waist: null, arm: null, thigh: null, neck: null, bodyFatPct: null, notes: null },
      ];
      const input = emptyInput({ profile: makeProfile({ goal: 'cut' }), measurements });
      expect(detectBulkStall(input)).toBeNull();
    });
  });

  describe('detectCutBellyGain', () => {
    it('flags cut with waist increase >1cm', () => {
      const measurements: BodyMeasurement[] = [
        { id: 'm1', userId: 'u1', date: NOW - 21 * DAY, weight: 80, chest: null, waist: 80, arm: null, thigh: null, neck: null, bodyFatPct: null, notes: null },
        { id: 'm2', userId: 'u1', date: NOW - 1 * DAY, weight: 80, chest: null, waist: 82, arm: null, thigh: null, neck: null, bodyFatPct: null, notes: null },
      ];
      const input = emptyInput({ profile: makeProfile({ goal: 'cut' }), measurements });
      expect(detectCutBellyGain(input)?.id).toBe('cutBellyGain');
    });
  });

  describe('detectCutTooFast', () => {
    it('flags >2kg loss in 2 weeks', () => {
      const measurements: BodyMeasurement[] = [
        { id: 'm1', userId: 'u1', date: NOW - 14 * DAY, weight: 85, chest: null, waist: null, arm: null, thigh: null, neck: null, bodyFatPct: null, notes: null },
        { id: 'm2', userId: 'u1', date: NOW - 1 * DAY, weight: 82, chest: null, waist: null, arm: null, thigh: null, neck: null, bodyFatPct: null, notes: null },
      ];
      const input = emptyInput({ profile: makeProfile({ goal: 'cut' }), measurements });
      expect(detectCutTooFast(input)?.id).toBe('cutTooFast');
    });
  });

  describe('detectBulkTooFast', () => {
    it('flags >1kg gain in 2 weeks for bulk', () => {
      const measurements: BodyMeasurement[] = [
        { id: 'm1', userId: 'u1', date: NOW - 14 * DAY, weight: 80, chest: null, waist: null, arm: null, thigh: null, neck: null, bodyFatPct: null, notes: null },
        { id: 'm2', userId: 'u1', date: NOW - 1 * DAY, weight: 81.5, chest: null, waist: null, arm: null, thigh: null, neck: null, bodyFatPct: null, notes: null },
      ];
      expect(detectBulkTooFast(emptyInput({ measurements }))?.id).toBe('bulkTooFast');
    });
  });

  describe('detectVolumeDecline', () => {
    it('flags 15%+ drop in last 3 vs prev 3 workouts', () => {
      const ex = makeExercise('bench', 'chest');
      const workouts: Workout[] = [];
      const logs: Record<string, WorkoutLog[]> = {};
      // 3 eski high-vol + 3 yeni düşük vol
      for (let i = 0; i < 3; i++) {
        const w = makeWorkout(20 + i, { id: `w-old-${i}` });
        workouts.push(w);
        logs[w.id] = [makeLog(w.id, 'bench', 100, 10)];
      }
      for (let i = 0; i < 3; i++) {
        const w = makeWorkout(i, { id: `w-new-${i}` });
        workouts.push(w);
        logs[w.id] = [makeLog(w.id, 'bench', 60, 10)];
      }
      const out = detectVolumeDecline(emptyInput({ workouts, logsByWorkout: logs, exerciseMap: { bench: ex } }));
      expect(out?.id).toBe('volumeDecline');
    });
  });

  describe('detectInactiveDays', () => {
    it('flags >5 days inactive', () => {
      const workouts = [makeWorkout(8)];
      expect(detectInactiveDays(emptyInput({ workouts }))?.id).toBe('inactive');
    });

    it('returns null if recent workout', () => {
      const workouts = [makeWorkout(2)];
      expect(detectInactiveDays(emptyInput({ workouts }))).toBeNull();
    });
  });

  describe('detectStreakHighlight', () => {
    it('triggers on streak >= 7', () => {
      const input = emptyInput({ profile: makeProfile({ streakCount: 10 }) });
      expect(detectStreakHighlight(input)?.severity).toBe('success');
    });
  });

  describe('detectNewPRs', () => {
    it('counts PRs in last 30 days', () => {
      const personalRecords = [
        { id: 'pr1', userId: 'u1', exerciseId: 'bench', weight: 100, reps: 5, estimated1RM: 115, achievedAt: NOW - 5 * DAY },
        { id: 'pr2', userId: 'u1', exerciseId: 'squat', weight: 140, reps: 5, estimated1RM: 162, achievedAt: NOW - 50 * DAY },
      ];
      const out = detectNewPRs(emptyInput({ personalRecords }));
      expect(out?.params?.count).toBe(1);
    });
  });

  describe('detectConsistencyDrop', () => {
    it('flags when last 4w avg drops below 60% of prev 4w avg', () => {
      const workouts: Workout[] = [];
      // prev 4 weeks: 8 workouts
      for (let i = 0; i < 8; i++) workouts.push(makeWorkout(30 + i * 2));
      // recent 4 weeks: 1 workout
      workouts.push(makeWorkout(5));
      const out = detectConsistencyDrop(emptyInput({ workouts }));
      expect(out?.id).toBe('consistencyDrop');
    });
  });

  describe('runInsights', () => {
    it('returns top N sorted by score', () => {
      const input = emptyInput({
        profile: makeProfile({ activeProgramId: null, streakCount: 12 }),
        activeProgram: null,
      });
      const out = runInsights(input, 3);
      expect(out.length).toBeLessThanOrEqual(3);
      // noProgram (70) ve streak (50) → noProgram önce gelmeli
      expect(out[0].id).toBe('noProgram');
    });

    it('respects max parameter', () => {
      const input = emptyInput({
        profile: makeProfile({ activeProgramId: null, streakCount: 12 }),
        activeProgram: null,
      });
      const out = runInsights(input, 1);
      expect(out.length).toBe(1);
    });
  });
});
