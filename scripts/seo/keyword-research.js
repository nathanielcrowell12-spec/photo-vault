/**
 * PhotoVault SEO — Phase 1 keyword research via DataForSEO.
 *
 * Guardrails (from the dataforseo skill's real-money lessons):
 *  - checks tasks[0].status_code, NOT just the top-level one (a failed task with no
 *    result otherwise reads as the finding "nothing ranks here")
 *  - prints json.cost after every paid call and a running total
 *  - HARD ABORT at MAX_SPEND
 *  - search_volume/live batches (1 task, many keywords); keywords_for_keywords is
 *    ~$0.09 PER SEED, so seeds are capped
 *
 * Usage: node scripts/seo/keyword-research.js
 * Output: docs/seo/raw/*.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'docs', 'seo', 'raw');
const MAX_SPEND = 5.0;

// ---------- credentials ----------
function loadEnv() {
  const raw = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}
const env = loadEnv();
const AUTH = Buffer.from(`${env.DATAFORSEO_LOGIN}:${env.DATAFORSEO_PASSWORD}`).toString('base64');

// ---------- spend-tracked POST ----------
let spent = 0;
async function post(endpoint, payload, label) {
  if (spent >= MAX_SPEND) {
    throw new Error(`ABORT: spend cap $${MAX_SPEND} reached ($${spent.toFixed(4)})`);
  }
  const res = await fetch(`https://api.dataforseo.com/v3/${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Basic ${AUTH}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  const task = (json.tasks || [])[0] || {};

  // The critical check: top-level can be 20000 Ok while the task itself failed.
  if (json.status_code !== 20000 || task.status_code !== 20000 || !task.result) {
    throw new Error(
      `[${label}] top=${json.status_code} "${json.status_message}" | ` +
        `task=${task.status_code} "${task.status_message}"`
    );
  }

  spent += json.cost || 0;
  console.log(
    `  [${label}] cost $${(json.cost || 0).toFixed(4)} | running total $${spent.toFixed(4)}`
  );
  return task.result;
}

// ---------- seeds ----------
const LOCAL_KEYWORDS = [
  'madison wedding photographer', 'wedding photographers madison wi',
  'madison family photographer', 'family photos madison wi',
  'madison photographers', 'photographer near me madison',
  'senior photos madison wi', 'senior pictures madison wi',
  'engagement photos madison wi', 'madison engagement photographer',
  'madison newborn photographer', 'newborn photos madison wi',
  'madison headshot photographer', 'headshots madison wi',
  'madison portrait photographer', 'maternity photographer madison wi',
  'photography locations madison wi', 'best photo spots madison wi',
  'photo spots madison wisconsin', 'uw madison graduation photos',
  'olbrich botanical gardens photos', 'memorial union terrace photos',
  'madison wi photo locations', 'where to take pictures in madison wi',
  'middleton wi photographer', 'sun prairie photographer',
];

const NATIONAL_KEYWORDS = [
  'pixieset alternative', 'pixieset alternatives', 'pixieset pricing',
  'shootproof alternative', 'shootproof pricing',
  'pic-time alternative', 'pic time alternative',
  'client gallery software', 'best client gallery software',
  'photo gallery software for photographers', 'photographer client gallery',
  'online proofing software photographers', 'photo proofing software',
  'photo delivery software', 'how to deliver photos to clients',
  'google photos alternative', 'google photos alternatives',
  'photo storage for photographers', 'unlimited photo storage',
  'digital photo storage service', 'long term photo storage',
  'photography business software', 'photo sharing for photographers',
  'photographer gallery hosting', 'where to store wedding photos',
  'how long do photographers keep photos',
];

// keywords_for_keywords is ~$0.09 PER SEED — keep these tight.
const LOCAL_SEEDS = ['madison wedding photographer', 'photography locations madison wi'];
const NATIONAL_SEEDS = ['pixieset alternative', 'client gallery software'];

const MADISON = { location_name: 'Madison,Wisconsin,United States', language_name: 'English' };
const USA = { location_code: 2840, language_code: 'en' };

// ---------- run ----------
(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const save = (name, data) => {
    fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify(data, null, 2));
    console.log(`  -> saved docs/seo/raw/${name}.json`);
  };

  console.log('\n=== A. search_volume — Madison local ===');
  save('volume-madison', await post(
    'keywords_data/google_ads/search_volume/live',
    [{ ...MADISON, keywords: LOCAL_KEYWORDS }],
    'vol-madison'
  ));

  console.log('\n=== B. search_volume — USA national ===');
  save('volume-national', await post(
    'keywords_data/google_ads/search_volume/live',
    [{ ...USA, keywords: NATIONAL_KEYWORDS }],
    'vol-national'
  ));

  console.log(`\n=== C. keywords_for_keywords — ${LOCAL_SEEDS.length} local seeds ===`);
  save('ideas-madison', await post(
    'keywords_data/google_ads/keywords_for_keywords/live',
    [{ ...MADISON, keywords: LOCAL_SEEDS, limit: 300, sort_by: 'search_volume' }],
    'ideas-madison'
  ));

  console.log(`\n=== D. keywords_for_keywords — ${NATIONAL_SEEDS.length} national seeds ===`);
  save('ideas-national', await post(
    'keywords_data/google_ads/keywords_for_keywords/live',
    [{ ...USA, keywords: NATIONAL_SEEDS, limit: 300, sort_by: 'search_volume' }],
    'ideas-national'
  ));

  console.log(`\n=== DONE — total spend $${spent.toFixed(4)} ===`);
})().catch((e) => {
  console.error(`\nFAILED after $${spent.toFixed(4)}: ${e.message}`);
  process.exit(1);
});
