import { useEffect, useState } from 'react';

import { useAuthStore } from '@/stores/auth.store';
import { fetchProgramBundle } from '@/services/programs.service';
import {
  getNextScheduledDay,
  getTodayProgramDay,
} from '@/services/userProgram.service';
import type { ProgramBundle } from '@/features/programs/seed';
import type { ProgramDay, WeekDay } from '@/types/models';

export interface TodayProgramInfo {
  /** Kullanıcının seçtiği aktif program (yoksa null). */
  bundle: ProgramBundle | null;
  /** Bugün antrenman varsa o gün, yoksa null (= dinlenme veya program yok). */
  todayDay: ProgramDay | null;
  /** Sıradaki antrenman günü + kaç gün sonra (bugün dahil). */
  nextDay: { weekDay: WeekDay; programDay: ProgramDay; daysUntil: number } | null;
  /** Kullanıcının hiç aktif programı yok mu? */
  hasActiveProgram: boolean;
  loading: boolean;
}

/**
 * Aktif program + bugünkü gün + sıradaki gün bilgisini tek hook'ta toplar.
 * Auth store'daki profile değişince otomatik yeniden hesaplar.
 */
export function useTodayProgramDay(): TodayProgramInfo {
  const profile = useAuthStore((s) => s.profile);
  const [bundle, setBundle] = useState<ProgramBundle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const programId = profile?.activeProgramId;
    if (!programId) {
      setBundle(null);
      return;
    }
    setLoading(true);
    fetchProgramBundle(programId)
      .then((b) => {
        if (!cancelled) setBundle(b);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.activeProgramId]);

  const schedule = profile?.programSchedule ?? null;
  const todayDay = getTodayProgramDay(bundle, schedule);
  const nextDay = getNextScheduledDay(bundle, schedule);

  return {
    bundle,
    todayDay,
    nextDay,
    hasActiveProgram: Boolean(profile?.activeProgramId),
    loading,
  };
}
