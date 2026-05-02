import { addIncrement } from './calculations';

import type { WorkoutLog } from '@/types/models';

export interface OverloadSuggestion {
  suggestedWeight: number;
  reason: 'increase' | 'maintain' | 'deload';
  message: string;
}

/**
 * Çok basit progressive overload algoritması:
 * - Tüm setler hedef tekrar'a ulaştıysa +2.5kg
 * - Setlerin yarısından azı tamamlandıysa -2.5kg (deload)
 * - Aksi halde aynı ağırlıkta devam
 *
 * Faz 6'da daha sofistike bir versiyonla değiştirilebilir.
 */
export function suggestNextWeight(
  lastSets: WorkoutLog[],
  targetReps: number,
  increment = 2.5,
): OverloadSuggestion {
  if (lastSets.length === 0) {
    return {
      suggestedWeight: 0,
      reason: 'maintain',
      message: 'Önceki veri yok',
    };
  }

  const lastWeight = lastSets[0].weight;
  const allHitTarget = lastSets.every((s) => s.reps >= targetReps);
  const hitCount = lastSets.filter((s) => s.reps >= targetReps).length;
  const hitRatio = hitCount / lastSets.length;

  if (allHitTarget) {
    return {
      suggestedWeight: addIncrement(lastWeight, increment),
      reason: 'increase',
      message: `Geçen sefer ${lastWeight}kg → bugün ${addIncrement(lastWeight, increment)}kg dene`,
    };
  }

  if (hitRatio < 0.5) {
    return {
      suggestedWeight: addIncrement(lastWeight, -increment),
      reason: 'deload',
      message: 'Bir kademe geri çek, sağlam tekrarlar yap',
    };
  }

  return {
    suggestedWeight: lastWeight,
    reason: 'maintain',
    message: 'Aynı ağırlıkta tekrar dene',
  };
}
