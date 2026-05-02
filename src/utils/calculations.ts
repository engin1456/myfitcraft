/**
 * Strength training hesaplamaları.
 * Faz 4 ve Faz 6 tarafından kullanılacak.
 */

/**
 * Brzycki formülü ile tahmini 1RM (1 Rep Max).
 * https://en.wikipedia.org/wiki/One-repetition_maximum
 */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  // Brzycki: weight * (36 / (37 - reps))
  // 36'dan büyük tekrarlarda formül güvenilir değil; cap koyuyoruz.
  const safeReps = Math.min(reps, 30);
  return Math.round(weight * (36 / (37 - safeReps)) * 10) / 10;
}

/** Toplam set hacmi (kg). */
export function setVolume(weight: number, reps: number): number {
  return weight * reps;
}

/** İki rakam arası yüzde değişim (örn. -3.2 = %3.2 düşüş). */
export function percentChange(from: number, to: number): number {
  if (from === 0) return 0;
  return Math.round(((to - from) / from) * 1000) / 10;
}

/** Verilen ağırlığa increment ekleyip 0.5 kg'a yuvarla. */
export function addIncrement(weight: number, increment: number): number {
  return Math.round((weight + increment) * 2) / 2;
}
