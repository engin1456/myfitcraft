/**
 * Akıllı öneri motoru (insights engine).
 *
 * Tamamen kural-tabanlı, on-device. Antrenman geçmişi, vücut ölçüleri, aktif program
 * ve kullanıcı hedefini birleştirip özetler ve öneriler üretir.
 *
 * Tasarım:
 * - Her bir detector saf fonksiyon: input verisini alır, eğer eşik tutuyorsa Insight döner.
 * - `runInsights` tüm detector'ları çalıştırır, score'a göre sıralar, top N döner.
 * - i18n key'leri üzerinden çevrilir; UI tarafında t(insight.titleKey, insight.params) yapılır.
 *
 * Severity:
 * - 'success' → yeşil (motivasyon)
 * - 'info'    → nötr (bilgilendirme)
 * - 'warning' → turuncu (dikkat)
 */

import { estimate1RM } from './calculations';

import type {
  BodyMeasurement,
  Exercise,
  MuscleGroup,
  PersonalRecord,
  Program,
  UserProfile,
  Workout,
  WorkoutLog,
} from '@/types/models';

export type InsightSeverity = 'success' | 'info' | 'warning';

/**
 * Bir insight'a bağlanan tıklanabilir aksiyon. UI bunu butona/karta dönüştürür.
 * route: ana stack/tab route adı; params opsiyonel.
 */
export interface InsightAction {
  /** UI'da gösterilecek buton metni için i18n key. */
  labelKey: string;
  route:
    | 'Programs'
    | 'ProgramDetail'
    | 'Exercises'
    | 'AddMeasurement'
    | 'Measurements'
    | 'Profile'
    | 'Reports';
  params?: Record<string, string | number>;
}

export interface Insight {
  /** Stabil kimlik — UI'da dismiss/dedup için. */
  id: string;
  severity: InsightSeverity;
  titleKey: string;
  messageKey: string;
  /** i18n interpolation parametreleri (count, name vs). */
  params?: Record<string, string | number>;
  /** Yüksek = daha öncelikli. UI top N'i seçer. */
  score: number;
  /** Opsiyonel aksiyon — örn. "Program seç" butonu. */
  action?: InsightAction;
}

export interface InsightsInput {
  profile: UserProfile | null;
  activeProgram: Program | null;
  workouts: Workout[]; // tamamlanmış (status==='completed'), tarihe göre sıralı (yeni→eski) varsayılır ama içerde sıralarız
  logsByWorkout: Record<string, WorkoutLog[]>;
  personalRecords: PersonalRecord[];
  measurements: BodyMeasurement[]; // tarihe göre sıralı (yeni→eski) varsayılır ama içerde sıralarız
  exerciseMap: Record<string, Exercise>; // exerciseId → Exercise (kas grubu için)
  now?: number; // test için override
}

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

// ---------- yardımcılar ----------

function sortByTimeDesc<T extends { date?: number; startedAt?: number; completedAt?: number | null }>(
  arr: T[],
  key: 'date' | 'startedAt' | 'completedAt',
): T[] {
  return arr
    .slice()
    .sort((a, b) => ((b as Record<string, number>)[key] ?? 0) - ((a as Record<string, number>)[key] ?? 0));
}

function workingSetsOf(logs: WorkoutLog[]): WorkoutLog[] {
  return logs.filter((l) => !l.isWarmup && l.reps > 0 && l.weight >= 0);
}

function volumeOf(logs: WorkoutLog[]): number {
  return logs.reduce((s, l) => s + l.weight * l.reps, 0);
}

function pctChange(from: number, to: number): number {
  if (from === 0) return 0;
  return Math.round(((to - from) / from) * 100);
}

/** ISO başlangıç (Pazartesi 00:00) zaman damgası. */
function startOfWeek(ts: number): number {
  const d = new Date(ts);
  const day = d.getDay(); // 0=Pazar … 6=Cmt
  const diff = day === 0 ? -6 : 1 - day; // Pazartesi'ye geri
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Kas grubu adını i18n'in `muscles.*` key'ine eşleyen helper — UI'da `t(`muscles.${name}`)`.
 * Burada sadece string döndürüyoruz, çevirme UI sorumluluğunda.
 */
function muscleKey(m: MuscleGroup): string {
  return `muscles.${m}`;
}

// ---------- detector'lar ----------

/**
 * Bu hafta atlanan antrenman sayısı (aktif programa göre).
 * Hafta başlangıcı Pazartesi.
 */
export function detectMissedFrequency(input: InsightsInput): Insight | null {
  const { profile, activeProgram, workouts } = input;
  const now = input.now ?? Date.now();
  if (!profile || !activeProgram) return null;

  const target = activeProgram.frequencyPerWeek;
  if (target <= 0) return null;
  const weekStart = startOfWeek(now);
  const done = workouts.filter(
    (w) => w.status === 'completed' && w.completedAt && w.completedAt >= weekStart,
  ).length;

  // Pazar 23:59 → haftanın sonu; kalan gün hesabı (basitleştirilmiş)
  const dow = new Date(now).getDay() || 7; // 1..7
  const remaining = Math.max(0, 7 - dow);

  if (done < target && remaining < target - done) {
    // hafta zaten kaybedildi sayılır → daha güçlü uyarı
    return {
      id: 'missedFrequency',
      severity: 'warning',
      titleKey: 'insights.missedFrequencyTitle',
      messageKey: 'insights.missedFrequencyMsg',
      params: { done, target, remaining },
      score: 90,
    };
  }
  if (done < target) {
    return {
      id: 'missedFrequency',
      severity: 'info',
      titleKey: 'insights.missedFrequencyTitle',
      messageKey: 'insights.missedFrequencyMsg',
      params: { done, target, remaining },
      score: 60,
    };
  }
  return null;
}

/** Aktif program yok. */
export function detectNoProgram(input: InsightsInput): Insight | null {
  if (!input.profile) return null;
  if (input.profile.activeProgramId) return null;
  return {
    id: 'noProgram',
    severity: 'info',
    titleKey: 'insights.noProgramTitle',
    messageKey: 'insights.noProgramMsg',
    score: 70,
    action: { labelKey: 'insights.actionPickProgram', route: 'Programs' },
  };
}

/**
 * Son 4 haftada kas grubu başına çalışan set yüzdesi.
 * - <8% ve toplam set ≥ 30 → low warning (gap)
 * - >40% ve toplam set ≥ 30 → over warning (overload)
 *
 * En kritik bir tane döndürür (en düşük yüzdeli kas grubu).
 */
export function detectMuscleGroupBalance(input: InsightsInput): Insight[] {
  const { workouts, logsByWorkout, exerciseMap } = input;
  const now = input.now ?? Date.now();
  const cutoff = now - 4 * WEEK;
  const counts: Partial<Record<MuscleGroup, number>> = {};
  let total = 0;

  for (const w of workouts) {
    if (w.status !== 'completed') continue;
    if ((w.completedAt ?? 0) < cutoff) continue;
    const sets = workingSetsOf(logsByWorkout[w.id] ?? []);
    for (const s of sets) {
      const ex = exerciseMap[s.exerciseId];
      if (!ex) continue;
      const m = ex.primaryMuscle;
      counts[m] = (counts[m] ?? 0) + 1;
      total += 1;
    }
  }

  if (total < 30) return []; // yeterli veri yok

  const out: Insight[] = [];

  // En düşük (göğüs/sırt/bacak/omuz büyük gruplara odaklanalım, biceps/triceps zaten düşük olabilir)
  const focusGroups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'quadriceps', 'hamstrings', 'glutes', 'core'];
  for (const m of focusGroups) {
    const c = counts[m] ?? 0;
    const pct = Math.round((c / total) * 100);
    if (pct < 8) {
      out.push({
        id: `muscleGap-${m}`,
        severity: 'warning',
        titleKey: 'insights.muscleGapTitle',
        messageKey: 'insights.muscleGapMsg',
        // Not: muscle key'i raw döner, UI'da t(`muscles.${m}`) yap.
        params: { muscle: muscleKey(m), pct },
        score: 80 - pct,
        action: {
          labelKey: 'insights.actionFindExercises',
          route: 'Exercises',
          params: { initialMuscleFilter: m },
        },
      });
    }
  }

  // En yüksek tek kas grubu (overload)
  let topMuscle: MuscleGroup | null = null;
  let topPct = 0;
  for (const m of Object.keys(counts) as MuscleGroup[]) {
    const pct = Math.round(((counts[m] ?? 0) / total) * 100);
    if (pct > topPct) {
      topPct = pct;
      topMuscle = m;
    }
  }
  if (topMuscle && topPct > 40) {
    out.push({
      id: `muscleOver-${topMuscle}`,
      severity: 'info',
      titleKey: 'insights.muscleOverTitle',
      messageKey: 'insights.muscleOverMsg',
      params: { muscle: muscleKey(topMuscle), pct: topPct },
      score: 50,
    });
  }

  return out;
}

/**
 * Bacak günü atlama özel kuralı: son 4 haftada quadriceps + hamstrings + glutes setleri
 * toplam çalışan setlerin %5'inden azsa.
 */
export function detectLegSkip(input: InsightsInput): Insight | null {
  const { workouts, logsByWorkout, exerciseMap } = input;
  const now = input.now ?? Date.now();
  const cutoff = now - 4 * WEEK;
  let leg = 0;
  let total = 0;
  for (const w of workouts) {
    if (w.status !== 'completed') continue;
    if ((w.completedAt ?? 0) < cutoff) continue;
    const sets = workingSetsOf(logsByWorkout[w.id] ?? []);
    for (const s of sets) {
      const ex = exerciseMap[s.exerciseId];
      if (!ex) continue;
      total += 1;
      if (
        ex.primaryMuscle === 'quadriceps' ||
        ex.primaryMuscle === 'hamstrings' ||
        ex.primaryMuscle === 'glutes'
      ) {
        leg += 1;
      }
    }
  }
  if (total < 30) return null;
  const pct = (leg / total) * 100;
  if (pct < 5) {
    return {
      id: 'legSkip',
      severity: 'warning',
      titleKey: 'insights.legSkipTitle',
      messageKey: 'insights.legSkipMsg',
      params: { weeks: 4 },
      score: 85,
      action: {
        labelKey: 'insights.actionFindLegExercises',
        route: 'Exercises',
        params: { initialMuscleFilter: 'quadriceps' },
      },
    };
  }
  return null;
}

/**
 * Egzersiz başına 1RM platosu: en sık yapılan compound'larda haftalık tahmini 1RM
 * son 4 hafta boyunca ≤ %2 değişmişse stale say.
 */
export function detectStaleLifts(input: InsightsInput): Insight[] {
  const { workouts, logsByWorkout, exerciseMap } = input;
  const now = input.now ?? Date.now();
  const cutoff = now - 6 * WEEK;
  // exerciseId → haftalık (weekStart → max 1RM)
  const byExWeek: Record<string, Record<number, number>> = {};
  for (const w of workouts) {
    if (w.status !== 'completed' || !w.completedAt) continue;
    if (w.completedAt < cutoff) continue;
    const wk = startOfWeek(w.completedAt);
    const sets = workingSetsOf(logsByWorkout[w.id] ?? []);
    for (const s of sets) {
      const ex = exerciseMap[s.exerciseId];
      if (!ex || !ex.isCompound) continue;
      const e1 = estimate1RM(s.weight, s.reps);
      if (e1 <= 0) continue;
      byExWeek[s.exerciseId] = byExWeek[s.exerciseId] ?? {};
      byExWeek[s.exerciseId][wk] = Math.max(byExWeek[s.exerciseId][wk] ?? 0, e1);
    }
  }

  const insights: Insight[] = [];
  for (const [exerciseId, weekMap] of Object.entries(byExWeek)) {
    const entries = Object.entries(weekMap)
      .map(([wk, v]) => ({ wk: Number(wk), v }))
      .sort((a, b) => a.wk - b.wk);
    if (entries.length < 4) continue;
    const first = entries[0].v;
    const last = entries[entries.length - 1].v;
    if (first <= 0) continue;
    const change = ((last - first) / first) * 100;
    if (Math.abs(change) <= 2) {
      const ex = exerciseMap[exerciseId];
      const name = ex?.nameTr || ex?.name || exerciseId;
      insights.push({
        id: `stale-${exerciseId}`,
        severity: 'info',
        titleKey: 'insights.staleLiftTitle',
        messageKey: 'insights.staleLiftMsg',
        params: { exercise: name, weeks: entries.length },
        score: 55,
      });
    }
  }
  // En fazla 2 stale lift göster
  return insights.slice(0, 2);
}

/** Bulk + son 3 haftada kilo değişimi < 0.3 kg → bulk stalled. */
export function detectBulkStall(input: InsightsInput): Insight | null {
  const { profile, measurements } = input;
  if (!profile || profile.goal !== 'bulk') return null;
  const ms = sortByTimeDesc(measurements, 'date').filter((m) => m.weight !== null);
  if (ms.length < 2) return null;
  const now = input.now ?? Date.now();
  const cutoff = now - 3 * WEEK;
  const recent = ms.filter((m) => m.date >= cutoff);
  if (recent.length < 2) return null;
  const newest = recent[0].weight as number;
  const oldest = recent[recent.length - 1].weight as number;
  const delta = newest - oldest;
  if (delta < 0.3 && delta > -0.5) {
    return {
      id: 'bulkStall',
      severity: 'warning',
      titleKey: 'insights.bulkStallTitle',
      messageKey: 'insights.bulkStallMsg',
      params: { kg: delta.toFixed(1), weeks: 3 },
      score: 80,
      action: { labelKey: 'insights.actionLogMeasurement', route: 'AddMeasurement' },
    };
  }
  return null;
}

/** Cut + bel ölçüsü 3 haftada arttıysa. */
export function detectCutBellyGain(input: InsightsInput): Insight | null {
  const { profile, measurements } = input;
  if (!profile || profile.goal !== 'cut') return null;
  const ms = sortByTimeDesc(measurements, 'date').filter((m) => m.waist !== null);
  if (ms.length < 2) return null;
  const now = input.now ?? Date.now();
  const cutoff = now - 3 * WEEK;
  const recent = ms.filter((m) => m.date >= cutoff);
  if (recent.length < 2) return null;
  const newest = recent[0].waist as number;
  const oldest = recent[recent.length - 1].waist as number;
  const delta = newest - oldest;
  if (delta > 1.0) {
    return {
      id: 'cutBellyGain',
      severity: 'warning',
      titleKey: 'insights.cutBellyGainTitle',
      messageKey: 'insights.cutBellyGainMsg',
      params: { cm: delta.toFixed(1), weeks: 3 },
      score: 85,
      action: { labelKey: 'insights.actionLogMeasurement', route: 'AddMeasurement' },
    };
  }
  return null;
}

/** Cut + 2 haftada > 2 kg kayıp. */
export function detectCutTooFast(input: InsightsInput): Insight | null {
  const { profile, measurements } = input;
  if (!profile || profile.goal !== 'cut') return null;
  const ms = sortByTimeDesc(measurements, 'date').filter((m) => m.weight !== null);
  if (ms.length < 2) return null;
  const now = input.now ?? Date.now();
  const cutoff = now - 2 * WEEK;
  const recent = ms.filter((m) => m.date >= cutoff);
  if (recent.length < 2) return null;
  const newest = recent[0].weight as number;
  const oldest = recent[recent.length - 1].weight as number;
  const delta = newest - oldest;
  if (delta < -2.0) {
    return {
      id: 'cutTooFast',
      severity: 'warning',
      titleKey: 'insights.cutTooFastTitle',
      messageKey: 'insights.cutTooFastMsg',
      params: { kg: Math.abs(delta).toFixed(1) },
      score: 75,
      action: { labelKey: 'insights.actionLogMeasurement', route: 'AddMeasurement' },
    };
  }
  return null;
}

/** Bulk + 2 haftada > 1 kg kazanç. */
export function detectBulkTooFast(input: InsightsInput): Insight | null {
  const { profile, measurements } = input;
  if (!profile || profile.goal !== 'bulk') return null;
  const ms = sortByTimeDesc(measurements, 'date').filter((m) => m.weight !== null);
  if (ms.length < 2) return null;
  const now = input.now ?? Date.now();
  const cutoff = now - 2 * WEEK;
  const recent = ms.filter((m) => m.date >= cutoff);
  if (recent.length < 2) return null;
  const newest = recent[0].weight as number;
  const oldest = recent[recent.length - 1].weight as number;
  const delta = newest - oldest;
  if (delta > 1.0) {
    return {
      id: 'bulkTooFast',
      severity: 'info',
      titleKey: 'insights.bulkTooFastTitle',
      messageKey: 'insights.bulkTooFastMsg',
      params: { kg: delta.toFixed(1) },
      score: 70,
      action: { labelKey: 'insights.actionLogMeasurement', route: 'AddMeasurement' },
    };
  }
  return null;
}

/** Son 3 antrenmanda toplam hacim ondan önceki 3'e göre %15+ düştü. */
export function detectVolumeDecline(input: InsightsInput): Insight | null {
  const { workouts, logsByWorkout } = input;
  const completed = workouts.filter((w) => w.status === 'completed');
  if (completed.length < 6) return null;
  const sorted = sortByTimeDesc(completed, 'completedAt');
  const recent3 = sorted.slice(0, 3);
  const prev3 = sorted.slice(3, 6);
  const recentVol = recent3.reduce((s, w) => s + volumeOf(workingSetsOf(logsByWorkout[w.id] ?? [])), 0);
  const prevVol = prev3.reduce((s, w) => s + volumeOf(workingSetsOf(logsByWorkout[w.id] ?? [])), 0);
  if (prevVol === 0) return null;
  const drop = pctChange(prevVol, recentVol);
  if (drop <= -15) {
    return {
      id: 'volumeDecline',
      severity: 'warning',
      titleKey: 'insights.weight1RMDeclineTitle',
      messageKey: 'insights.weight1RMDeclineMsg',
      params: { pct: Math.abs(drop) },
      score: 78,
    };
  }
  return null;
}

/** Son antrenman > 5 gün önce. */
export function detectInactiveDays(input: InsightsInput): Insight | null {
  const { workouts } = input;
  const now = input.now ?? Date.now();
  const completed = workouts
    .filter((w) => w.status === 'completed' && w.completedAt)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  if (completed.length === 0) return null;
  const last = completed[0].completedAt as number;
  const days = Math.floor((now - last) / DAY);
  if (days >= 5) {
    return {
      id: 'inactive',
      severity: days >= 10 ? 'warning' : 'info',
      titleKey: 'insights.inactiveDaysTitle',
      messageKey: 'insights.inactiveDaysMsg',
      params: { days },
      score: 60 + Math.min(30, days * 2),
      action: { labelKey: 'insights.actionViewPrograms', route: 'Programs' },
    };
  }
  return null;
}

/** Streak ≥ 7 → motivasyon. */
export function detectStreakHighlight(input: InsightsInput): Insight | null {
  const s = input.profile?.streakCount ?? 0;
  if (s < 7) return null;
  return {
    id: 'streak',
    severity: 'success',
    titleKey: 'insights.streakHighlightTitle',
    messageKey: 'insights.streakHighlightMsg',
    params: { days: s },
    score: 50,
  };
}

/** Son 30 günde kaç egzersizde PR kırıldı. */
export function detectNewPRs(input: InsightsInput): Insight | null {
  const now = input.now ?? Date.now();
  const cutoff = now - 30 * DAY;
  const recent = input.personalRecords.filter((p) => p.achievedAt >= cutoff);
  if (recent.length === 0) return null;
  return {
    id: 'newPRs',
    severity: 'success',
    titleKey: 'insights.newPRsTitle',
    messageKey: 'insights.newPRsMsg',
    params: { count: recent.length },
    score: 45 + recent.length * 3,
  };
}

/**
 * Tutarlılık düşüşü: önceki 4 haftanın ortalama haftalık antrenman sayısı vs son 4 hafta.
 */
export function detectConsistencyDrop(input: InsightsInput): Insight | null {
  const { workouts } = input;
  const now = input.now ?? Date.now();
  const completed = workouts.filter((w) => w.status === 'completed' && w.completedAt);
  if (completed.length < 8) return null;
  const recentWindow = completed.filter((w) => (w.completedAt as number) >= now - 4 * WEEK).length;
  const prevWindow = completed.filter(
    (w) => (w.completedAt as number) >= now - 8 * WEEK && (w.completedAt as number) < now - 4 * WEEK,
  ).length;
  const recentAvg = recentWindow / 4;
  const prevAvg = prevWindow / 4;
  if (prevAvg <= 0) return null;
  if (recentAvg < prevAvg * 0.6) {
    return {
      id: 'consistencyDrop',
      severity: 'warning',
      titleKey: 'insights.consistencyDropTitle',
      messageKey: 'insights.consistencyDropMsg',
      params: { prev: prevAvg.toFixed(1), curr: recentAvg.toFixed(1) },
      score: 75,
      action: { labelKey: 'insights.actionViewPrograms', route: 'Programs' },
    };
  }
  return null;
}

/** Son 5 antrenman süresi ortalaması > 75 dk veya < 25 dk. */
export function detectSessionDuration(input: InsightsInput): Insight | null {
  const { workouts } = input;
  const completed = workouts
    .filter((w) => w.status === 'completed' && (w.durationSeconds ?? 0) > 0)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    .slice(0, 5);
  if (completed.length < 3) return null;
  const avgMin =
    Math.round(
      (completed.reduce((s, w) => s + (w.durationSeconds ?? 0), 0) / completed.length / 60) * 10,
    ) / 10;
  if (avgMin > 75) {
    return {
      id: 'longSession',
      severity: 'info',
      titleKey: 'insights.longSessionTitle',
      messageKey: 'insights.longSessionMsg',
      params: { minutes: avgMin },
      score: 40,
    };
  }
  if (avgMin < 25) {
    return {
      id: 'shortSession',
      severity: 'info',
      titleKey: 'insights.shortSessionTitle',
      messageKey: 'insights.shortSessionMsg',
      params: { minutes: avgMin },
      score: 35,
    };
  }
  return null;
}

/** Setlerdeki ısınma oranı %5'in altında. */
export function detectWarmupRatio(input: InsightsInput): Insight | null {
  const now = input.now ?? Date.now();
  const cutoff = now - 4 * WEEK;
  let warm = 0;
  let total = 0;
  for (const w of input.workouts) {
    if ((w.completedAt ?? 0) < cutoff) continue;
    const logs = input.logsByWorkout[w.id] ?? [];
    for (const l of logs) {
      total += 1;
      if (l.isWarmup) warm += 1;
    }
  }
  if (total < 30) return null;
  const ratio = warm / total;
  if (ratio < 0.05) {
    return {
      id: 'warmupLow',
      severity: 'info',
      titleKey: 'insights.warmupRatioLowTitle',
      messageKey: 'insights.warmupRatioLowMsg',
      score: 30,
    };
  }
  return null;
}

/** Set arası ortalama dinlenme < 60 sn (compound idealinin altı). */
export function detectShortRest(input: InsightsInput): Insight | null {
  const now = input.now ?? Date.now();
  const cutoff = now - 4 * WEEK;
  const rests: number[] = [];
  for (const w of input.workouts) {
    if ((w.completedAt ?? 0) < cutoff) continue;
    const logs = input.logsByWorkout[w.id] ?? [];
    for (const l of logs) {
      if (!l.isWarmup && l.restSeconds && l.restSeconds > 0) rests.push(l.restSeconds);
    }
  }
  if (rests.length < 30) return null;
  const avg = Math.round(rests.reduce((s, r) => s + r, 0) / rests.length);
  if (avg < 60) {
    return {
      id: 'shortRest',
      severity: 'info',
      titleKey: 'insights.restTooShortTitle',
      messageKey: 'insights.restTooShortMsg',
      params: { seconds: avg },
      score: 35,
    };
  }
  return null;
}

/** Bu hafta hacim önceki haftanın %30'undan fazla arttıysa overreaching uyarısı. */
export function detectVolumeJump(input: InsightsInput): Insight | null {
  const { workouts, logsByWorkout } = input;
  const now = input.now ?? Date.now();
  const thisWkStart = startOfWeek(now);
  const prevWkStart = thisWkStart - WEEK;
  let thisVol = 0;
  let prevVol = 0;
  for (const w of workouts) {
    if (w.status !== 'completed' || !w.completedAt) continue;
    const v = volumeOf(workingSetsOf(logsByWorkout[w.id] ?? []));
    if (w.completedAt >= thisWkStart) thisVol += v;
    else if (w.completedAt >= prevWkStart) prevVol += v;
  }
  if (prevVol < 1000) return null; // zayıf taban → noise
  const change = pctChange(prevVol, thisVol);
  if (change >= 30) {
    return {
      id: 'volumeJump',
      severity: 'info',
      titleKey: 'insights.volumeJumpTitle',
      messageKey: 'insights.volumeJumpMsg',
      params: { pct: change },
      score: 40,
    };
  }
  return null;
}

// ---------- runner ----------

export function runInsights(input: InsightsInput, max = 3): Insight[] {
  const all: Insight[] = [];

  // Tek-değerli detector'lar
  const single = [
    detectNoProgram,
    detectMissedFrequency,
    detectLegSkip,
    detectBulkStall,
    detectCutBellyGain,
    detectCutTooFast,
    detectBulkTooFast,
    detectVolumeDecline,
    detectInactiveDays,
    detectStreakHighlight,
    detectNewPRs,
    detectConsistencyDrop,
    detectSessionDuration,
    detectWarmupRatio,
    detectShortRest,
    detectVolumeJump,
  ];
  for (const fn of single) {
    const r = fn(input);
    if (r) all.push(r);
  }
  // Çoklu detector'lar
  all.push(...detectMuscleGroupBalance(input));
  all.push(...detectStaleLifts(input));

  // Skora göre azalan + dedup
  const seen = new Set<string>();
  const sorted = all.sort((a, b) => b.score - a.score).filter((i) => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });

  return sorted.slice(0, max);
}
