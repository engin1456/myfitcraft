/**
 * Sağlık metrikleri — saf hesaplamalar.
 * BMI, Bel/Boy oranı ve ETA tahmini Reports/Vücut sekmesinde kullanılır.
 */

export type BMICategory =
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obese1'
  | 'obese2';

export interface BMIResult {
  value: number;
  category: BMICategory;
}

/**
 * Vücut Kitle İndeksi: kilo (kg) / (boy m)^2.
 * WHO sınıflandırması:
 *  <18.5 → underweight
 *  18.5-24.9 → normal
 *  25-29.9 → overweight
 *  30-34.9 → obese1
 *  ≥35 → obese2
 */
export function calculateBMI(weightKg: number, heightCm: number): BMIResult | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const m = heightCm / 100;
  const value = Math.round((weightKg / (m * m)) * 10) / 10;
  let category: BMICategory;
  if (value < 18.5) category = 'underweight';
  else if (value < 25) category = 'normal';
  else if (value < 30) category = 'overweight';
  else if (value < 35) category = 'obese1';
  else category = 'obese2';
  return { value, category };
}

export type WaistHeightCategory = 'healthy' | 'increased' | 'high' | 'veryHigh';

export interface WaistHeightResult {
  ratio: number; // 0..1
  category: WaistHeightCategory;
}

/**
 * Bel / Boy oranı sağlık göstergesi olarak kullanılır.
 * Ashwell'in standartları (yetişkin kadın & erkek için):
 *  <0.43 → healthy (bazı vakalarda underweight; biz "healthy" olarak grupluyoruz)
 *  0.43-0.52 → healthy
 *  0.53-0.57 → increased risk
 *  0.58-0.62 → high risk
 *  >0.62 → very high risk
 */
export function calculateWaistHeightRatio(
  waistCm: number,
  heightCm: number,
): WaistHeightResult | null {
  if (!waistCm || !heightCm || waistCm <= 0 || heightCm <= 0) return null;
  const ratio = Math.round((waistCm / heightCm) * 100) / 100;
  let category: WaistHeightCategory;
  if (ratio <= 0.52) category = 'healthy';
  else if (ratio <= 0.57) category = 'increased';
  else if (ratio <= 0.62) category = 'high';
  else category = 'veryHigh';
  return { ratio, category };
}

export interface ETAResult {
  /** Hedefe varma için tahmini hafta sayısı (yuvarlanmış). */
  weeks: number;
  /** Tahmini hedef tarihi (ms). */
  targetDate: number;
  /** Yön doğru mu? Bulk + pozitif veya cut + negatif → true. */
  onTrack: boolean;
}

/**
 * Hedef kiloya tahmini varış süresi.
 * @param currentWeight şu anki kilo (kg)
 * @param targetWeight hedef kilo (kg)
 * @param weeklyChangeKg son haftalardaki ortalama haftalık değişim (kg/hafta)
 *   (negatif = kayıp, pozitif = kazanç)
 * @returns ETA veya null (uygun veri yoksa)
 *
 * - |weeklyChange| < 0.05 → hız çok yavaş, anlamlı tahmin yapılamaz → null
 * - hedefe yön ters → onTrack=false, ama yine de "ne kadar uzaklaşıyorsun" göstermek
 *   anlamsız olduğu için null döneriz
 * - max 156 hafta (3 yıl) ile sınırlı
 */
export function calculateETA(
  currentWeight: number,
  targetWeight: number,
  weeklyChangeKg: number,
  now: number = Date.now(),
): ETAResult | null {
  const remaining = targetWeight - currentWeight; // pozitif = kilo almalı
  // Zaten hedefte (±0.3 kg)
  if (Math.abs(remaining) <= 0.3) {
    return { weeks: 0, targetDate: now, onTrack: true };
  }
  if (Math.abs(weeklyChangeKg) < 0.05) return null;
  // Yön kontrolü
  const directionMatches = Math.sign(remaining) === Math.sign(weeklyChangeKg);
  if (!directionMatches) {
    return { weeks: 0, targetDate: now, onTrack: false };
  }
  const weeks = Math.ceil(Math.abs(remaining / weeklyChangeKg));
  if (!Number.isFinite(weeks) || weeks > 156) return null;
  const targetDate = now + weeks * 7 * 24 * 60 * 60 * 1000;
  return { weeks, targetDate, onTrack: true };
}
