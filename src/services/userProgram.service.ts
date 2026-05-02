/**
 * Kullanıcının seçtiği aktif program + haftalık schedule yönetimi.
 * UserProfile içindeki `activeProgramId`, `programSchedule`, `programStartedAt` alanlarına yaslanır.
 */
import type { ProgramDay, UserProfile, WeekDay } from '@/types/models';
import type { ProgramBundle } from '@/features/programs/seed';
import { updateUserProfile } from './users.service';
import { useAuthStore } from '@/stores/auth.store';
import { isFirebaseConfigured } from './firebase';
import { logger } from '@/utils/logger';

/**
 * JS Date.getDay() → ISO WeekDay (1=Pzt, 7=Paz).
 * JS: 0=Sunday..6=Saturday.
 */
export function jsDayToIsoWeekDay(jsDay: number): WeekDay {
  return (jsDay === 0 ? 7 : jsDay) as WeekDay;
}

export function getTodayWeekDay(now: Date = new Date()): WeekDay {
  return jsDayToIsoWeekDay(now.getDay());
}

/**
 * Kullanıcının schedule'ında bugün hangi sıradaki gün?
 * Örn: program 4 gün, schedule [1,3,5,6] (Pzt/Çar/Cum/Cmt).
 * Bugün Çar ise → schedule içinde 2. sırada → programDay[1] (0-indexed).
 *
 * @returns 0-indexed gün sırası, veya null (bugün dinlenme günü)
 */
export function getTodayDayIndex(
  schedule: WeekDay[] | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!schedule || schedule.length === 0) return null;
  const today = getTodayWeekDay(now);
  const sortedSchedule = [...schedule].sort((a, b) => a - b);
  const idx = sortedSchedule.indexOf(today);
  return idx === -1 ? null : idx;
}

/**
 * Bugün için ProgramDay döner (varsa). Schedule yoksa veya bugün dinlenmeyse null.
 */
export function getTodayProgramDay(
  bundle: ProgramBundle | null | undefined,
  schedule: WeekDay[] | null | undefined,
  now: Date = new Date(),
): ProgramDay | null {
  if (!bundle) return null;
  const idx = getTodayDayIndex(schedule, now);
  if (idx === null) return null;
  // Program günleri dayOrder ile sıralı
  const sortedDays = [...bundle.days].sort((a, b) => a.dayOrder - b.dayOrder);
  return sortedDays[idx] ?? null;
}

/**
 * Schedule'daki sıradaki antrenman gününü bul (bugün dahil veya sonrası).
 * Dashboard'da "Sıradaki: Salı - Push" göstermek için.
 */
export function getNextScheduledDay(
  bundle: ProgramBundle | null | undefined,
  schedule: WeekDay[] | null | undefined,
  now: Date = new Date(),
): { weekDay: WeekDay; programDay: ProgramDay; daysUntil: number } | null {
  if (!bundle || !schedule || schedule.length === 0) return null;
  const sortedSchedule = [...schedule].sort((a, b) => a - b);
  const sortedDays = [...bundle.days].sort((a, b) => a.dayOrder - b.dayOrder);
  const today = getTodayWeekDay(now);

  // Bugünden başlayarak sıradaki schedule gününü bul
  for (let offset = 0; offset < 7; offset++) {
    const checkDay = (((today - 1 + offset) % 7) + 1) as WeekDay;
    const idx = sortedSchedule.indexOf(checkDay);
    if (idx !== -1) {
      const programDay = sortedDays[idx];
      if (programDay) {
        return { weekDay: checkDay, programDay, daysUntil: offset };
      }
    }
  }
  return null;
}

/**
 * Programa "abone ol": activeProgramId + schedule + startedAt set et.
 * Hem local store'u hem Firestore'u günceller.
 */
export async function activateProgram(
  uid: string,
  programId: string,
  schedule: WeekDay[],
): Promise<void> {
  const patch: Partial<UserProfile> = {
    activeProgramId: programId,
    programSchedule: schedule,
    programStartedAt: Date.now(),
  };

  // Önce local profile'ı güncelle (UI hızlı tepki versin)
  const current = useAuthStore.getState().profile;
  if (current) {
    useAuthStore.getState().setProfile({ ...current, ...patch });
  }

  // Sonra Firestore'a yaz (sync)
  if (isFirebaseConfigured) {
    try {
      await updateUserProfile(uid, patch);
    } catch (err) {
      logger.warn('[userProgram] Firestore update failed', err);
    }
  }
}

/**
 * Aktif programı kaldır (bırak). Dashboard "program seç" CTA'ya döner.
 */
export async function deactivateProgram(uid: string): Promise<void> {
  const patch: Partial<UserProfile> = {
    activeProgramId: null,
    programSchedule: null,
    programStartedAt: null,
  };

  const current = useAuthStore.getState().profile;
  if (current) {
    useAuthStore.getState().setProfile({ ...current, ...patch });
  }

  if (isFirebaseConfigured) {
    try {
      await updateUserProfile(uid, patch);
    } catch (err) {
      logger.warn('[userProgram] Firestore update failed', err);
    }
  }
}

/**
 * Türkçe haftanın günü etiketi.
 */
export const WEEKDAY_LABELS_TR: Record<WeekDay, string> = {
  1: 'Pzt',
  2: 'Sal',
  3: 'Çar',
  4: 'Per',
  5: 'Cum',
  6: 'Cmt',
  7: 'Paz',
};

export const WEEKDAY_LABELS_EN: Record<WeekDay, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

export const WEEKDAY_FULL_TR: Record<WeekDay, string> = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  7: 'Pazar',
};

export const WEEKDAY_FULL_EN: Record<WeekDay, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export function weekDayLabel(day: WeekDay, locale: 'tr' | 'en', long = false): string {
  if (locale === 'tr') return long ? WEEKDAY_FULL_TR[day] : WEEKDAY_LABELS_TR[day];
  return long ? WEEKDAY_FULL_EN[day] : WEEKDAY_LABELS_EN[day];
}
