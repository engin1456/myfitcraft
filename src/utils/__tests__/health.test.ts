import {
  calculateBMI,
  calculateETA,
  calculateWaistHeightRatio,
} from '../health';

describe('calculateBMI', () => {
  it('returns null for invalid input', () => {
    expect(calculateBMI(0, 170)).toBeNull();
    expect(calculateBMI(70, 0)).toBeNull();
    expect(calculateBMI(-1, 170)).toBeNull();
  });

  it('classifies normal range', () => {
    const r = calculateBMI(70, 175);
    expect(r?.value).toBeCloseTo(22.9, 1);
    expect(r?.category).toBe('normal');
  });

  it('classifies underweight', () => {
    const r = calculateBMI(45, 170);
    expect(r?.category).toBe('underweight');
  });

  it('classifies overweight', () => {
    const r = calculateBMI(85, 175);
    expect(r?.category).toBe('overweight');
  });

  it('classifies obese tiers', () => {
    expect(calculateBMI(95, 170)?.category).toBe('obese1');
    expect(calculateBMI(110, 170)?.category).toBe('obese2');
  });
});

describe('calculateWaistHeightRatio', () => {
  it('returns null for invalid input', () => {
    expect(calculateWaistHeightRatio(0, 175)).toBeNull();
    expect(calculateWaistHeightRatio(80, 0)).toBeNull();
  });

  it('classifies healthy', () => {
    const r = calculateWaistHeightRatio(80, 175);
    expect(r?.ratio).toBeCloseTo(0.46, 2);
    expect(r?.category).toBe('healthy');
  });

  it('classifies increased risk', () => {
    const r = calculateWaistHeightRatio(95, 175);
    expect(r?.category).toBe('increased');
  });

  it('classifies very high risk', () => {
    const r = calculateWaistHeightRatio(115, 175);
    expect(r?.category).toBe('veryHigh');
  });
});

describe('calculateETA', () => {
  const now = new Date('2026-01-01').getTime();

  it('returns 0 weeks if already at target', () => {
    const r = calculateETA(70, 70.2, -0.4, now);
    expect(r?.weeks).toBe(0);
    expect(r?.onTrack).toBe(true);
  });

  it('returns null when change too small', () => {
    expect(calculateETA(80, 75, 0.01, now)).toBeNull();
  });

  it('marks wrong direction as off-track', () => {
    // hedef azalmak (-5kg) ama haftada +0.3 alıyor
    const r = calculateETA(80, 75, 0.3, now);
    expect(r?.onTrack).toBe(false);
  });

  it('estimates weeks for cutting', () => {
    // 80 → 75 (5kg azalt), -0.5 kg/hafta → 10 hafta
    const r = calculateETA(80, 75, -0.5, now);
    expect(r?.weeks).toBe(10);
    expect(r?.onTrack).toBe(true);
  });

  it('estimates weeks for bulking', () => {
    const r = calculateETA(70, 75, 0.25, now);
    expect(r?.weeks).toBe(20);
    expect(r?.onTrack).toBe(true);
  });

  it('rejects unrealistic projections (>3 years)', () => {
    // 80 → 60 (20 kg) at 0.05 kg/week → 400 hafta
    expect(calculateETA(80, 60, -0.05, now)).toBeNull();
  });
});
