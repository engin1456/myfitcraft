/* eslint-disable */
/**
 * Otomatik AI çeviri scripti.
 *
 * Mevcut tüm egzersizleri (seed.ts'den) okur.
 * Manuel çevirisi (translations.tr.json) olan egzersizleri ATLAR.
 * Geri kalanlar için OpenAI API'ye batch istek gönderir.
 * Sonucu translations.auto.tr.json'a yazar.
 *
 * Kullanım:
 *   node scripts/auto-translate.js              # tüm kalanları çevir
 *   node scripts/auto-translate.js --limit=5    # sadece ilk 5 (test için)
 *   node scripts/auto-translate.js --resume     # mevcut auto dosyasına ekle (default)
 *
 * Env:
 *   OPENAI_API_KEY (.env dosyasından)
 */

const fs = require('node:fs');
const path = require('node:path');

// .env yükleme (basit parser)
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const SRC_RAW = path.join(__dirname, 'exercises-raw.json');
const TR_MANUAL = path.join(__dirname, 'translations.tr.json');
const TR_AUTO = path.join(__dirname, 'translations.auto.tr.json');

// === CLI args ===
const args = process.argv.slice(2);
let limit = Infinity;
for (const a of args) {
  if (a.startsWith('--limit=')) limit = parseInt(a.slice(8), 10);
}

// === Config ===
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('xxxxx')) {
  console.error('❌ OPENAI_API_KEY .env dosyasında bulunamadı veya placeholder.');
  console.error('   .env dosyasına OPENAI_API_KEY=sk-... ekleyin.');
  process.exit(1);
}

const MODEL = 'gpt-4o-mini'; // ucuz + hızlı + kaliteli
const CONCURRENCY = 5; // aynı anda 5 istek
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// === Slugify (build-exercises.js ile aynı) ===
function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[/_]/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const ALLOWED_CATEGORIES = new Set(['strength', 'powerlifting', 'olympic weightlifting']);

// === Mevcut çevirileri yükle ===
const manualTranslations = JSON.parse(fs.readFileSync(TR_MANUAL, 'utf8'));
let autoTranslations = {};
if (fs.existsSync(TR_AUTO)) {
  autoTranslations = JSON.parse(fs.readFileSync(TR_AUTO, 'utf8'));
  console.log(`📖 Mevcut auto çeviriler yüklendi: ${Object.keys(autoTranslations).length - 1} egzersiz`); // -1 for _meta
}

// _meta alanı yoksa ekle
if (!autoTranslations._meta) {
  autoTranslations._meta = `MyFitCraft AI otomatik çevirileri (gpt-4o-mini ile üretildi). Manuel kaliteli çeviri yoksa fallback olarak kullanılır. UI'da "⚡ Auto" rozeti gösterilir.`;
}

// === Çevrilecek egzersizleri belirle ===
const raw = JSON.parse(fs.readFileSync(SRC_RAW, 'utf8'));
const filtered = raw.filter((e) => ALLOWED_CATEGORIES.has(e.category));

// Build script ile aynı id üretimini yap
const usedIds = new Set();
const exerciseList = [];
for (const e of filtered) {
  let id = slugify(e.id || e.name);
  if (usedIds.has(id)) {
    let suffix = 2;
    while (usedIds.has(`${id}-${suffix}`)) suffix++;
    id = `${id}-${suffix}`;
  }
  usedIds.add(id);
  exerciseList.push({ id, raw: e });
}

const todo = exerciseList.filter(({ id }) => {
  if (manualTranslations[id]) return false; // manuel var, atla
  if (autoTranslations[id]) return false; // zaten auto çevrildi
  return true;
});

console.log(`📊 Durum:`);
console.log(`   Toplam egzersiz:       ${exerciseList.length}`);
console.log(`   Manuel kaliteli:       ${Object.keys(manualTranslations).length - 1}`);
console.log(
  `   Auto (mevcut):         ${Math.max(0, Object.keys(autoTranslations).length - 1)}`,
);
console.log(`   Çevrilecek (kalan):    ${todo.length}`);

const willProcess = Math.min(limit, todo.length);
console.log(`   Bu çalıştırmada:       ${willProcess}\n`);

if (willProcess === 0) {
  console.log('✓ Hiçbir şey yok, çıkıyorum.');
  process.exit(0);
}

// === Maliyet tahmini ===
// gpt-4o-mini: $0.150 / 1M input, $0.600 / 1M output
// Egzersiz başına ~600 input + ~600 output token tahmin
const estCost = (willProcess * (600 * 0.15 + 600 * 0.6)) / 1_000_000;
console.log(`💰 Tahmini maliyet: ~$${estCost.toFixed(3)} (gpt-4o-mini)\n`);

// === Prompt template ===
function buildPrompt(ex) {
  const muscle = ex.primaryMuscles?.[0] ?? 'fullBody';
  const equip = ex.equipment ?? 'unknown';
  const enInstructions = (ex.instructions || []).join('\n');

  return `You are a strength training coach writing for the MyFitCraft fitness app. Translate AND enhance the following exercise content.

Exercise: ${ex.name}
Primary muscle: ${muscle}
Equipment: ${equip}
Original English instructions:
${enInstructions || '(none provided - generate from the exercise name)'}

Generate a JSON object with EXACTLY these 4 fields:
- "instructionSteps": array of 5-7 detailed English instruction steps. Improve clarity and add cues if the original is poor.
- "instructionStepsTr": array of 5-7 Turkish instruction steps. Use natural gym vocabulary (keep terms like "bench", "rep", "set", "barbell" in English when natural).
- "tips": array of 4-5 English tips and common mistakes. Practical, actionable, mention safety.
- "tipsTr": array of 4-5 Turkish tips and common mistakes. Same content as tips but in Turkish.

Rules:
- Each step/tip is ONE sentence (concise but informative).
- Mention exact body cues (e.g. "elbows tucked at 45°", "knees track over toes").
- Tips should include at least 1 common mistake and 1 safety note.
- Use second person ("you", "sen") for friendliness.
- Keep exercise name English in both languages.
- Output ONLY valid JSON, no markdown, no extra text.`;
}

// === OpenAI API call ===
async function callOpenAI(prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a strength training coach who writes clear, accurate exercise instructions in both English and Turkish. Output ONLY valid JSON, no markdown fences, no explanations.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI döndü ama içerik boş');

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error(`JSON parse hatası: ${content.slice(0, 200)}`);
  }

  // Schema validation
  for (const key of ['instructionSteps', 'instructionStepsTr', 'tips', 'tipsTr']) {
    if (!Array.isArray(parsed[key]) || parsed[key].length === 0) {
      throw new Error(`Eksik veya hatalı field: ${key}`);
    }
  }

  return parsed;
}

async function translateOne({ id, raw }, retries = MAX_RETRIES) {
  try {
    const prompt = buildPrompt(raw);
    const result = await callOpenAI(prompt);
    return { id, ok: true, data: result };
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return translateOne({ id, raw }, retries - 1);
    }
    return { id, ok: false, error: err.message };
  }
}

// === Concurrency runner ===
async function runBatch(items) {
  const results = [];
  let inflight = 0;
  let cursor = 0;
  let done = 0;
  let saveCounter = 0;

  return new Promise((resolve) => {
    const tick = () => {
      while (inflight < CONCURRENCY && cursor < items.length) {
        const item = items[cursor++];
        inflight++;
        translateOne(item)
          .then((res) => {
            inflight--;
            done++;
            results.push(res);
            if (res.ok) {
              autoTranslations[res.id] = res.data;
              saveCounter++;
              process.stdout.write(`  ✓ ${done}/${items.length} ${res.id}\n`);
            } else {
              process.stdout.write(`  ✗ ${done}/${items.length} ${res.id}: ${res.error}\n`);
            }
            // Her 10 başarılı çeviride dosyayı kaydet (kayıp olmasın)
            if (saveCounter >= 10) {
              fs.writeFileSync(TR_AUTO, JSON.stringify(autoTranslations, null, 2), 'utf8');
              saveCounter = 0;
            }
            if (done === items.length) {
              resolve(results);
            } else {
              tick();
            }
          });
      }
    };
    tick();
  });
}

// === Main ===
(async () => {
  const startTs = Date.now();
  const items = todo.slice(0, willProcess);

  console.log(`🚀 ${items.length} egzersiz çevriliyor (concurrency=${CONCURRENCY})...\n`);

  const results = await runBatch(items);
  const ok = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;

  // Final kaydet
  fs.writeFileSync(TR_AUTO, JSON.stringify(autoTranslations, null, 2), 'utf8');

  const elapsed = ((Date.now() - startTs) / 1000).toFixed(1);
  console.log(`\n✅ Tamamlandı (${elapsed}s):`);
  console.log(`   Başarılı: ${ok}`);
  console.log(`   Hata:     ${fail}`);
  console.log(`   Yazıldı:  ${TR_AUTO}`);
  console.log(`\nSonra çalıştır: node scripts/build-exercises.js`);
})().catch((err) => {
  console.error('💥 Fatal:', err);
  process.exit(1);
});
