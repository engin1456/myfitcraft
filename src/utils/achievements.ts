import type { PersonalRecord, UserProfile, Workout } from '@/types/models';

export interface Achievement {
  id: string;
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  icon: string;
  unlocked: boolean;
  progress?: { current: number; target: number };
}

export function computeAchievements(params: {
  profile: UserProfile | null;
  workouts: Workout[];
  personalRecords: PersonalRecord[];
}): Achievement[] {
  const { profile, workouts, personalRecords } = params;
  const completedWorkouts = workouts.filter((w) => w.status === 'completed');
  const total = completedWorkouts.length;
  const streak = profile?.streakCount ?? 0;

  // Bench / squat / deadlift 100kg achievement (estimated1RM bazli)
  const bench = personalRecords.find((p) => p.exerciseId === 'bench-press-barbell');
  const squat = personalRecords.find((p) => p.exerciseId === 'squat-barbell');
  const deadlift = personalRecords.find((p) => p.exerciseId === 'deadlift-conventional');

  return [
    {
      id: 'first-workout',
      titleTr: 'Ilk Antrenman',
      titleEn: 'First Workout',
      descTr: 'Ilk antrenmanini tamamladin!',
      descEn: 'Completed your first workout!',
      icon: '🏁',
      unlocked: total >= 1,
      progress: total < 1 ? { current: total, target: 1 } : undefined,
    },
    {
      id: 'streak-7',
      titleTr: '7 Gun Streak',
      titleEn: '7-Day Streak',
      descTr: '7 gun ust uste antrenman',
      descEn: '7 days in a row',
      icon: '🔥',
      unlocked: streak >= 7,
      progress: streak < 7 ? { current: streak, target: 7 } : undefined,
    },
    {
      id: 'streak-30',
      titleTr: '30 Gun Streak',
      titleEn: '30-Day Streak',
      descTr: '30 gun ust uste antrenman — efsane!',
      descEn: '30 days in a row — legendary!',
      icon: '⚡',
      unlocked: streak >= 30,
      progress: streak < 30 ? { current: streak, target: 30 } : undefined,
    },
    {
      id: 'workouts-10',
      titleTr: '10 Antrenman',
      titleEn: '10 Workouts',
      descTr: 'Toplam 10 antrenman',
      descEn: '10 total workouts',
      icon: '💪',
      unlocked: total >= 10,
      progress: total < 10 ? { current: total, target: 10 } : undefined,
    },
    {
      id: 'workouts-50',
      titleTr: '50 Antrenman',
      titleEn: '50 Workouts',
      descTr: 'Toplam 50 antrenman',
      descEn: '50 total workouts',
      icon: '🏆',
      unlocked: total >= 50,
      progress: total < 50 ? { current: total, target: 50 } : undefined,
    },
    {
      id: 'bench-100',
      titleTr: 'Bench 100kg',
      titleEn: 'Bench 100kg',
      descTr: '100kg bench press!',
      descEn: '100kg bench press!',
      icon: '🥇',
      unlocked: (bench?.estimated1RM ?? 0) >= 100,
    },
    {
      id: 'squat-140',
      titleTr: 'Squat 140kg',
      titleEn: 'Squat 140kg',
      descTr: '140kg squat!',
      descEn: '140kg squat!',
      icon: '🦵',
      unlocked: (squat?.estimated1RM ?? 0) >= 140,
    },
    {
      id: 'deadlift-180',
      titleTr: 'Deadlift 180kg',
      titleEn: 'Deadlift 180kg',
      descTr: '180kg deadlift!',
      descEn: '180kg deadlift!',
      icon: '🪨',
      unlocked: (deadlift?.estimated1RM ?? 0) >= 180,
    },
  ];
}
