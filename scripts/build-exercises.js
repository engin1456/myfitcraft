/* eslint-disable */
/**
 * Free-exercise-db (yuhonas/free-exercise-db, MIT) verisini bizim Exercise modeline
 * çevirir ve src/features/exercises/seed.ts dosyasını üretir.
 *
 * Resimler GitHub raw URL'leri ile referans edilir; Storage'a upload gerekmez.
 *
 * Kullanım:
 *   node scripts/build-exercises.js
 */

const fs = require('node:fs');
const path = require('node:path');

const RAW_URL_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

const SRC = path.join(__dirname, 'exercises-raw.json');
const TR_OVERRIDES = path.join(__dirname, 'translations.tr.json');
const TR_AUTO = path.join(__dirname, 'translations.auto.tr.json');
const OUT = path.join(__dirname, '..', 'src', 'features', 'exercises', 'seed.ts');

// === Mapping tabloları ===
const EQUIPMENT_MAP = {
  'body only': 'bodyweight',
  machine: 'machine',
  other: 'other',
  'foam roll': 'other',
  kettlebells: 'kettlebell',
  dumbbell: 'dumbbell',
  cable: 'cable',
  barbell: 'barbell',
  bands: 'bands',
  'medicine ball': 'other',
  'exercise ball': 'other',
  'e-z curl bar': 'barbell',
};

const MUSCLE_MAP = {
  abdominals: 'core',
  hamstrings: 'hamstrings',
  calves: 'calves',
  shoulders: 'shoulders',
  adductors: 'quadriceps',
  glutes: 'glutes',
  quadriceps: 'quadriceps',
  biceps: 'biceps',
  forearms: 'forearms',
  abductors: 'glutes',
  triceps: 'triceps',
  chest: 'chest',
  'lower back': 'back',
  traps: 'back',
  'middle back': 'back',
  lats: 'back',
  neck: 'shoulders',
};

const LEVEL_MAP = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  expert: 'advanced',
};

// Sadece kuvvet odaklı kategoriler. Stretching, cardio, plyometrics, strongman atlanır.
const ALLOWED_CATEGORIES = new Set(['strength', 'powerlifting', 'olympic weightlifting']);

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[/_]/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapMechanic(force, mechanic) {
  if (mechanic === 'isolation') return 'isolation';
  if (force === 'push') return 'push';
  if (force === 'pull') return 'pull';
  return 'push';
}

function dedup(list) {
  return [...new Set(list)];
}

// === Build ===
const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const trOverrides = JSON.parse(fs.readFileSync(TR_OVERRIDES, 'utf8'));

// Auto translations opsiyonel - script ilk çalışırken yok olabilir
let trAuto = {};
if (fs.existsSync(TR_AUTO)) {
  trAuto = JSON.parse(fs.readFileSync(TR_AUTO, 'utf8'));
}

const filtered = raw.filter((e) => ALLOWED_CATEGORIES.has(e.category));

const usedIds = new Set();
const exercises = [];
let trMatchCount = 0;
let manualCount = 0;
let autoCount = 0;

for (const e of filtered) {
  let id = slugify(e.id || e.name);
  if (usedIds.has(id)) {
    let suffix = 2;
    while (usedIds.has(`${id}-${suffix}`)) suffix++;
    id = `${id}-${suffix}`;
  }
  usedIds.add(id);

  const primary = e.primaryMuscles?.[0]
    ? MUSCLE_MAP[e.primaryMuscles[0]] ?? 'fullBody'
    : 'fullBody';

  const secondary = dedup(
    (e.secondaryMuscles || [])
      .map((m) => MUSCLE_MAP[m])
      .filter(Boolean)
      .filter((m) => m !== primary),
  );

  const equipment = EQUIPMENT_MAP[e.equipment] ?? 'other';
  const mechanic = mapMechanic(e.force, e.mechanic);
  const isCompound = e.mechanic === 'compound';
  const difficulty = LEVEL_MAP[e.level] ?? 'beginner';

  const images = (e.images || []).map((img) => `${RAW_URL_BASE}/${img}`);
  const imageUrl = images[0] ?? null;
  const animationUrl = images[1] ?? imageUrl;

  // Override önceliği: manuel > auto > DB orijinali (EN fallback).
  //   - instructionSteps (EN, opsiyonel - yoksa DB orijinali)
  //   - instructionStepsTr (TR, opsiyonel - yoksa EN fallback)
  //   - tips (EN, opsiyonel - yoksa boş)
  //   - tipsTr (TR, opsiyonel - yoksa boş)
  const manual = trOverrides[id];
  const auto = trAuto[id];
  const ov = manual || auto || null;
  if (manual) {
    trMatchCount++;
    manualCount++;
  } else if (auto) {
    trMatchCount++;
    autoCount++;
  }
  const instructionSteps = ov?.instructionSteps ?? (e.instructions || []);
  const instructionStepsTr = ov?.instructionStepsTr ?? instructionSteps;
  const tips = ov?.tips ?? [];
  const tipsTr = ov?.tipsTr ?? tips;
  const isAuto = !manual && !!auto;

  exercises.push({
    id,
    name: e.name,
    nameTr: e.name, // İsimler EN kalır (gym dilinde standart)
    primaryMuscle: primary,
    secondaryMuscles: secondary,
    equipment,
    mechanic,
    isCompound,
    difficulty,
    animationUrl,
    videoUrl: null,
    imageUrl,
    instructionSteps,
    instructionStepsTr,
    tips,
    tipsTr,
    isAutoTranslated: isAuto,
  });
}

// İsme göre alfabetik sırala (UI'da hoş)
exercises.sort((a, b) => a.name.localeCompare(b.name));

// === Output ===
const header = `import type { Exercise } from '@/types/models';

/**
 * Egzersiz seed datası.
 * Kaynak: yuhonas/free-exercise-db (MIT lisansı) - https://github.com/yuhonas/free-exercise-db
 *
 * - ${exercises.length} egzersiz
 * - Sadece "strength", "powerlifting" ve "olympic weightlifting" kategorileri filtrelendi
 * - Resimler GitHub raw URL'lerinden çekilir; Storage gerekmez
 * - Her egzersizde 2 frame (0.jpg, 1.jpg) var → ExerciseImage component'i animasyon yapabilir
 *
 * Bu dosya \`scripts/build-exercises.js\` tarafından otomatik üretilir.
 * Manuel düzenleme yapma; bunun yerine script'i tekrar çalıştır.
 */
export const SEED_EXERCISES: Exercise[] = `;

const body = JSON.stringify(exercises, null, 2);

fs.writeFileSync(OUT, header + body + ';\n', 'utf8');

console.log(`✓ ${exercises.length} egzersiz yazıldı: ${OUT}`);
console.log(`  Kaynak: ${filtered.length} kategori-uygun egzersiz / ${raw.length} toplam`);
console.log(`  TR çevirisi olan: ${trMatchCount} egzersiz`);
console.log(`    └─ Manuel kaliteli: ${manualCount}`);
console.log(`    └─ AI otomatik:    ${autoCount}`);
console.log(`    └─ Çevirisiz:      ${exercises.length - trMatchCount}`);
