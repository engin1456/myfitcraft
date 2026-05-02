import { calculateNewStreak, isStreakActive } from '../streak';

const DAY = 24 * 60 * 60 * 1000;

describe('streak', () => {
  describe('calculateNewStreak', () => {
    it('starts at 1 when no previous workout', () => {
      expect(calculateNewStreak(0, null, Date.now())).toBe(1);
    });

    it('increments by 1 for consecutive days', () => {
      const today = Date.now();
      const yesterday = today - DAY;
      expect(calculateNewStreak(5, yesterday, today)).toBe(6);
    });

    it('keeps streak when same day', () => {
      const today = Date.now();
      expect(calculateNewStreak(5, today, today)).toBe(5);
    });

    it('resets to 1 when days are skipped', () => {
      const today = Date.now();
      const threeDaysAgo = today - 3 * DAY;
      expect(calculateNewStreak(10, threeDaysAgo, today)).toBe(1);
    });
  });

  describe('isStreakActive', () => {
    it('returns false when no last workout date', () => {
      expect(isStreakActive(null)).toBe(false);
    });

    it('returns true when worked out today', () => {
      expect(isStreakActive(Date.now())).toBe(true);
    });

    it('returns true when worked out yesterday', () => {
      expect(isStreakActive(Date.now() - DAY)).toBe(true);
    });

    it('returns false when 2+ days passed', () => {
      expect(isStreakActive(Date.now() - 3 * DAY)).toBe(false);
    });
  });
});
