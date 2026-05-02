// Bu modül Firebase ve auth store import ediyor, jest ortamında çalıştırmak için
// firebase ve auth katmanlarını mock'la. Pure fonksiyonları test ediyoruz, mocks kullanılmıyor.
jest.mock('../firebase', () => ({
  isFirebaseConfigured: false,
  getDb: () => ({}),
  getAuth: () => ({}),
}));
jest.mock('../users.service', () => ({
  updateUserProfile: jest.fn(),
}));
jest.mock('@/stores/auth.store', () => ({
  useAuthStore: { getState: () => ({ profile: null, setProfile: () => {} }) },
}));

import {
  getNextScheduledDay,
  getTodayDayIndex,
  getTodayProgramDay,
  jsDayToIsoWeekDay,
} from '../userProgram.service';
import type { ProgramBundle } from '@/features/programs/seed';
import type { ProgramDay, WeekDay } from '@/types/models';

function mkDay(id: string, order: number): ProgramDay {
  return {
    id,
    programId: 'p',
    ownerId: null,
    dayOrder: order,
    focus: 'fullBody',
    name: `Day ${order}`,
    nameTr: `Gün ${order}`,
  };
}

const bundle: ProgramBundle = {
  program: {
    id: 'p',
    ownerId: null,
    name: 'Test',
    nameTr: 'Test',
    description: '',
    descriptionTr: '',
    goal: 'strength',
    level: 'beginner',
    frequencyPerWeek: 3,
    durationWeeks: 4,
    isPreset: true,
    createdAt: 0,
  },
  days: [mkDay('d1', 1), mkDay('d2', 2), mkDay('d3', 3)],
  exercises: [],
};

// Helpers - dates
const monday = new Date('2026-05-04T10:00:00'); // Pzt
const tuesday = new Date('2026-05-05T10:00:00');
const wednesday = new Date('2026-05-06T10:00:00');
const thursday = new Date('2026-05-07T10:00:00');
const friday = new Date('2026-05-08T10:00:00');
const saturday = new Date('2026-05-09T10:00:00');
const sunday = new Date('2026-05-10T10:00:00');

describe('jsDayToIsoWeekDay', () => {
  test('Pazar (JS=0) → ISO 7', () => {
    expect(jsDayToIsoWeekDay(0)).toBe(7);
  });
  test('Pazartesi (JS=1) → ISO 1', () => {
    expect(jsDayToIsoWeekDay(1)).toBe(1);
  });
  test('Cumartesi (JS=6) → ISO 6', () => {
    expect(jsDayToIsoWeekDay(6)).toBe(6);
  });
});

describe('getTodayDayIndex', () => {
  const schedule: WeekDay[] = [1, 3, 5]; // Pzt/Çar/Cum

  test('Pazartesi → 0. sıra (Day 1)', () => {
    expect(getTodayDayIndex(schedule, monday)).toBe(0);
  });
  test('Çarşamba → 1. sıra (Day 2)', () => {
    expect(getTodayDayIndex(schedule, wednesday)).toBe(1);
  });
  test('Cuma → 2. sıra (Day 3)', () => {
    expect(getTodayDayIndex(schedule, friday)).toBe(2);
  });
  test('Salı (schedule\'da yok) → null', () => {
    expect(getTodayDayIndex(schedule, tuesday)).toBeNull();
  });
  test('Pazar (schedule\'da yok) → null', () => {
    expect(getTodayDayIndex(schedule, sunday)).toBeNull();
  });
  test('schedule null → null', () => {
    expect(getTodayDayIndex(null, monday)).toBeNull();
  });
  test('schedule sıralama bağımsız çalışır', () => {
    expect(getTodayDayIndex([5, 1, 3], wednesday)).toBe(1);
  });
});

describe('getTodayProgramDay', () => {
  const schedule: WeekDay[] = [1, 3, 5];

  test('Pazartesi → Day 1', () => {
    const day = getTodayProgramDay(bundle, schedule, monday);
    expect(day?.id).toBe('d1');
  });
  test('Çarşamba → Day 2', () => {
    const day = getTodayProgramDay(bundle, schedule, wednesday);
    expect(day?.id).toBe('d2');
  });
  test('Salı → null (dinlenme)', () => {
    expect(getTodayProgramDay(bundle, schedule, tuesday)).toBeNull();
  });
  test('bundle null → null', () => {
    expect(getTodayProgramDay(null, schedule, monday)).toBeNull();
  });
});

describe('getNextScheduledDay', () => {
  const schedule: WeekDay[] = [1, 3, 5];

  test('Pazartesi günü → bugün antrenman var (daysUntil 0)', () => {
    const next = getNextScheduledDay(bundle, schedule, monday);
    expect(next?.daysUntil).toBe(0);
    expect(next?.programDay.id).toBe('d1');
  });

  test('Salı günü → yarın (daysUntil 1, Çar = Day 2)', () => {
    const next = getNextScheduledDay(bundle, schedule, tuesday);
    expect(next?.daysUntil).toBe(1);
    expect(next?.weekDay).toBe(3);
    expect(next?.programDay.id).toBe('d2');
  });

  test('Perşembe günü → yarın (daysUntil 1, Cum = Day 3)', () => {
    const next = getNextScheduledDay(bundle, schedule, thursday);
    expect(next?.daysUntil).toBe(1);
    expect(next?.programDay.id).toBe('d3');
  });

  test('Cumartesi → 2 gün sonra (Pzt = Day 1)', () => {
    const next = getNextScheduledDay(bundle, schedule, saturday);
    expect(next?.daysUntil).toBe(2);
    expect(next?.weekDay).toBe(1);
    expect(next?.programDay.id).toBe('d1');
  });

  test('Pazar → 1 gün sonra (Pzt = Day 1)', () => {
    const next = getNextScheduledDay(bundle, schedule, sunday);
    expect(next?.daysUntil).toBe(1);
    expect(next?.programDay.id).toBe('d1');
  });

  test('schedule yok → null', () => {
    expect(getNextScheduledDay(bundle, null, monday)).toBeNull();
  });
});
