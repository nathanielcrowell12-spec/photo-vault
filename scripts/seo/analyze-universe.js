/**
 * Phase 3.5 analysis — ZERO API COST. Re-reads phase35-keyword-universe.json.
 *
 * Raw Labs ranked_keywords output is mostly noise: big domains rank incidentally for
 * unrelated terms ("coyote hills golf course", "milestones card login"). The skill's
 * "raw keyword ideas need aggressive filtering" gotcha applies at full force here.
 *
 * Filters to topical relevance, then ranks by what a domain-rank-0 site can reach.
 */
const { load, save } = require('./lib');

const universe = load('phase35-keyword-universe');

// --- Relevance: must match the job PhotoVault actually does -----------------
const TOPIC = [
  /\bclient galler/, /\bphoto galler/, /\bgaller(y|ies) for\b/,
  /\bproof(ing)?\b/,
  /deliver.*(photo|image)|photo.*deliver/,
  /(share|sharing|send|sending|upload|download).*(photo|image|picture|gallery)/,
  /(photo|image|picture|gallery).*(share|sharing|send|sending|upload|download)/,
  /photo storage|storage for photo|cloud storage.*photo|photo.*cloud storage/,
  /photograph(er|y).*(software|website|business|workflow|client|contract|invoice|pricing|template)/,
  /(software|website|contract|invoice|template|release form|pricing).*photograph(er|y)/,
  /wedding.*(photo|gallery|guest)|guest.*(photo|upload)/,
  /photo (album|book|print|lab)/,
  /\bmini session/,
];

// --- Exclusions: right words, wrong searcher --------------------------------
const EXCLUDE = [
  /\bjobs?\b|hiring|salary|career|intern(ship)?|apprentice|school|course|class|degree|certificat/,
  /\bfree download\b|crack|torrent|apk|mod\b/,
  /\blogin\b|\bsign in\b|\bapp store\b/,
  // Named local businesses / labs / venues — real volume, zero relevance to a SaaS.
  /\b(bay photo|richard'?s? photo|miller'?s?|denny|indie film|mpix|whcc|nations photo)\b/,
  /golf course|nightclub|expo center|camp\b|usd\b|card balance|prepaid/,
  // People's names and brand-navigational noise.
  /\b(john|david|richard|michael|sarah|jessica)\s+\w+$/,
];

const BRANDS = /lightfolio|picdrop|cloudspot|pic-?\s?time|pixieset|shootproof|zenfolio|smugmug|pixpa|format\.com/;

const rel = universe.filter((v) => {
  const k = (v.keyword || '').toLowerCase();
  if (!k || !v.volume) return false;
  if (EXCLUDE.some((r) => r.test(k))) return false;
  return TOPIC.some((r) => r.test(k));
});

const score = (v) => (v.volume || 0) * (v.cpc || 0);
const fmt = (v) =>
  `  ${String(v.kd ?? '-').padStart(3)} ${String(v.volume).padStart(6)} ` +
  `${('$' + (v.cpc || 0).toFixed(2)).padStart(8)} ${String(Math.round(score(v))).padStart(7)}  ` +
  `${v.keyword}`;

console.log(`universe: ${universe.length} -> topically relevant: ${rel.length}`);

const nonBrand = rel.filter((v) => !BRANDS.test(v.keyword.toLowerCase()));
const brandAlt = rel.filter((v) => BRANDS.test(v.keyword.toLowerCase()));

// --- Tier 1: reachable from domain rank 0 -----------------------------------
const t1 = nonBrand.filter((v) => v.kd != null && v.kd <= 15).sort((a, b) => score(b) - score(a));
// --- Tier 2: reachable once some authority exists ---------------------------
const t2 = nonBrand
  .filter((v) => v.kd != null && v.kd > 15 && v.kd <= 30)
  .sort((a, b) => score(b) - score(a));
// --- Tier 3: not reachable for a long time ----------------------------------
const t3 = nonBrand.filter((v) => v.kd != null && v.kd > 30).sort((a, b) => score(b) - score(a));

const header = '   KD    vol      cpc   score  keyword\n  ' + '-'.repeat(74);

console.log(`\n=== TIER 1 — KD <= 15, reachable at domain rank 0 (${t1.length}) ===`);
console.log(header);
t1.slice(0, 35).forEach((v) => console.log(fmt(v)));

console.log(`\n=== TIER 2 — KD 16-30, needs some authority first (${t2.length}) ===`);
console.log(header);
t2.slice(0, 25).forEach((v) => console.log(fmt(v)));

console.log(`\n=== TIER 3 — KD > 30, not reachable near-term (${t3.length}) ===`);
console.log(header);
t3.slice(0, 12).forEach((v) => console.log(fmt(v)));

console.log(`\n=== BRAND / ALTERNATIVE terms (${brandAlt.length}) ===`);
console.log(header);
brandAlt.sort((a, b) => score(b) - score(a)).slice(0, 20).forEach((v) => console.log(fmt(v)));

// --- Where the Phase 2 winnable list actually lands on difficulty ------------
const PHASE2 = [
  'photographer client gallery', 'client photo gallery for photographers',
  'photography client gallery', 'photo proofing website',
  'how to deliver photos to clients', 'how to deliver digital photos to clients',
  'best way for photographers to share photos with clients',
  'website for photographers to upload photos for clients',
  'free client gallery for photographers', 'photo sharing for photographers',
  'share wedding photos with guests', 'guests upload wedding photos',
];
console.log('\n=== PHASE 2 "WINNABLE" LIST, NOW WITH DIFFICULTY ===');
console.log(header);
const byKw = new Map(universe.map((v) => [v.keyword, v]));
for (const k of PHASE2) {
  const v = byKw.get(k);
  console.log(v ? fmt(v) : `    -      -        -       -  ${k}  (no KD data)`);
}

save('phase35-shortlist', { tier1: t1, tier2: t2, tier3: t3, brandAlt });
console.log('\nSaved: docs/seo/raw/phase35-shortlist.json  (API cost: $0)');
