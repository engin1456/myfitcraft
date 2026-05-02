import { suggestNextWeight } from '../progressiveOverload';
import type { WorkoutLog } from '@/types/models';

function mkLog(weight: number, reps: number): WorkoutLog {
  return {
    id: 'l',
    workoutId: 'w',
    userId: 'u',
    exerciseId: 'e',
    setNumber: 1,
    weight,
    reps,
    restSeconds: 90,
    isWarmup: false,
    isFailure: false,
    notes: null,
    completedAt: Date.now(),
  };
}

describe('progressiveOverload.suggestNextWeight', () => {
  it('returns 0 when no previous data', () => {
    const result = suggestNextWeight([], 8);
    expect(result.suggestedWeight).toBe(0);
    expect(result.reason).toBe('maintain');
  });

  it('suggests increase when all sets hit target', () => {
    const logs = [mkLog(60, 10), mkLog(60, 10), mkLog(60, 10)];
    const result = suggestNextWeight(logs, 8);
    expect(result.reason).toBe('increase');
    expect(result.suggestedWeight).toBe(62.5);
  });

  it('suggests deload when fewer than half hit target', () => {
    const logs = [mkLog(60, 8), mkLog(60, 4), mkLog(60, 3)];
    const result = suggestNextWeight(logs, 8);
    expect(result.reason).toBe('deload');
    expect(result.suggestedWeight).toBe(57.5);
  });

  it('suggests maintain when most sets succeed but not all', () => {
    // 4 sets, 3 hit target -> hitRatio = 0.75 (>= 0.5, but not 100%)
    const logs = [mkLog(60, 8), mkLog(60, 8), mkLog(60, 8), mkLog(60, 6)];
    const result = suggestNextWeight(logs, 8);
    expect(result.reason).toBe('maintain');
    expect(result.suggestedWeight).toBe(60);
  });
});
