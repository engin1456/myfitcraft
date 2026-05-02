import { addIncrement, estimate1RM, percentChange, setVolume } from '../calculations';

describe('calculations', () => {
  describe('estimate1RM (Brzycki)', () => {
    it('returns the weight when reps = 1', () => {
      expect(estimate1RM(100, 1)).toBe(100);
    });

    it('returns 0 for invalid input', () => {
      expect(estimate1RM(0, 5)).toBe(0);
      expect(estimate1RM(100, 0)).toBe(0);
      expect(estimate1RM(-50, 5)).toBe(0);
    });

    it('estimates higher 1RM for low reps with good weight', () => {
      const oneRM = estimate1RM(100, 5);
      expect(oneRM).toBeGreaterThan(100);
      expect(oneRM).toBeLessThan(120);
    });

    it('caps at 30 reps for stability', () => {
      const result = estimate1RM(50, 50);
      expect(Number.isFinite(result)).toBe(true);
    });
  });

  describe('setVolume', () => {
    it('multiplies weight by reps', () => {
      expect(setVolume(50, 10)).toBe(500);
      expect(setVolume(0, 10)).toBe(0);
    });
  });

  describe('percentChange', () => {
    it('returns positive percent for increase', () => {
      expect(percentChange(100, 110)).toBe(10);
    });

    it('returns negative percent for decrease', () => {
      expect(percentChange(100, 90)).toBe(-10);
    });

    it('returns 0 when from is 0 (avoid division by zero)', () => {
      expect(percentChange(0, 100)).toBe(0);
    });
  });

  describe('addIncrement', () => {
    it('rounds to nearest 0.5kg', () => {
      expect(addIncrement(60, 2.5)).toBe(62.5);
      expect(addIncrement(60.3, 2.5)).toBe(63);
      expect(addIncrement(60, -2.5)).toBe(57.5);
      expect(addIncrement(60.1, 2.4)).toBe(62.5);
    });
  });
});
