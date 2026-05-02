import type { MuscleGroup, Equipment } from '@/types/models';
import { palette } from '@/theme/colors';

export const ALL_MUSCLES: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'core',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'fullBody',
];

export const ALL_EQUIPMENT: Equipment[] = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'kettlebell',
  'bands',
  'other',
];

const muscleColorMap: Record<MuscleGroup, string> = {
  chest: palette.muscle.chest,
  back: palette.muscle.back,
  shoulders: palette.muscle.shoulders,
  biceps: palette.muscle.biceps,
  triceps: palette.muscle.triceps,
  forearms: palette.muscle.biceps,
  core: palette.muscle.core,
  quadriceps: palette.muscle.legs,
  hamstrings: palette.muscle.legs,
  glutes: palette.muscle.legs,
  calves: palette.muscle.legs,
  fullBody: palette.brand500,
};

export function muscleColor(group: MuscleGroup): string {
  return muscleColorMap[group];
}
