/**
 * PhotoVault SEO — Phase 2 SERP analysis: who owns these SERPs and what's winnable.
 * Usage: node scripts/seo/analyze-serp.js
 */
const { load } = require('./lib');

const rows = load('serp-results').filter((r) => !r.error);

// Domain frequency across all top-5 slots.
const freq = new Map();
for (const r of rows) for (const d of r.top5 || []) freq.set(d, (freq.get(d) || 0) + 1);

console.log('='.repeat(84));
console.log('WHO OWNS THESE SERPs (appearances in top 5, across 38 keywords)');
console.log('='.repeat(84));
for (const [d, n] of [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 22)) {
  console.log(`  ${String(n).padStart(3)}x  ${d}`);
}

// Competitor-owned vs community/aggregator vs open.
const COMPETITOR = /pixieset|shootproof|pic-time|zenfolio|cloudspot|smugmug|zenfolio|passgallery|shootq/i;
const COMMUNITY = /reddit|quora|youtube|facebook|medium/i;
const GIANT = /google|apple|amazon|microsoft|dropbox|adobe|icloud/i;

console.log(`\n${'='.repeat(84)}`);
console.log('PER-KEYWORD LANDSCAPE');
console.log('='.repeat(84));
console.log('  feat | top-5 make-up                       | keyword');

const buckets = { competitorLocked: [], giantLocked: [], communityHeavy: [], open: [] };

for (const r of rows) {
  const t5 = r.top5 || [];
  const comp = t5.filter((d) => COMPETITOR.test(d)).length;
  const giant = t5.filter((d) => GIANT.test(d)).length;
  const comm = t5.filter((d) => COMMUNITY.test(d)).length;
  const tag =
    giant >= 2 ? 'giantLocked' :
    comp >= 3 ? 'competitorLocked' :
    comm >= 2 ? 'communityHeavy' : 'open';
  buckets[tag].push(r);
  const feats = (r.serpFeatures || []).length;
  console.log(
    `  ${String(feats).padStart(4)} | comp:${comp} giant:${giant} community:${comm} ${r.hasLocalPack ? 'LOCALPACK' : '         '} | ${r.keyword}`
  );
}

const label = {
  open: 'OPEN — no single force owns the top 5. Best targets.',
  communityHeavy: 'COMMUNITY-HEAVY — Reddit/Quora/YouTube rank. Beatable with a real page.',
  competitorLocked: 'COMPETITOR-LOCKED — Pixieset/ShootProof/etc own it. Hard, but on-topic.',
  giantLocked: 'GIANT-LOCKED — Google/Apple/Amazon own it. Do not fight this.',
};
for (const k of ['open', 'communityHeavy', 'competitorLocked', 'giantLocked']) {
  console.log(`\n${'='.repeat(84)}\n${label[k]}  (${buckets[k].length})\n${'='.repeat(84)}`);
  for (const r of buckets[k]) {
    console.log(`  ${r.keyword}`);
    console.log(`      top5: ${(r.top5 || []).join(', ')}`);
  }
}
