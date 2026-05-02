/**
 * Streak hesaplama / guncelleme yardimcilari.
 * Basit kural: ust uste gun antrenman = streak ++.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function calculateNewStreak(
  currentStreak: number,
  lastWorkoutDate: number | null,
  newWorkoutDate: number,
): number {
  const today = startOfDay(newWorkoutDate);

  if (!lastWorkoutDate) return 1;

  const last = startOfDay(lastWorkoutDate);
  const diffDays = Math.round((today - last) / DAY_MS);

  if (diffDays === 0) {
    // Ayni gun ikinci antrenman, streak degismez
    return Math.max(1, currentStreak);
  }
  if (diffDays === 1) {
    // Birbirini takip eden gun
    return currentStreak + 1;
  }
  // Streak kirildi
  return 1;
}

export function isStreakActive(lastWorkoutDate: number | null, now = Date.now()): boolean {
  if (!lastWorkoutDate) return false;
  const today = startOfDay(now);
  const last = startOfDay(lastWorkoutDate);
  const diffDays = Math.round((today - last) / DAY_MS);
  return diffDays <= 1;
}
