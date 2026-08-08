/**
 * PhotoVault SEO — cluster contamination check.
 *
 * Google Ads reports a POOL's volume on every member. A photographer-worded keyword that
 * shares a (volume,cpc) pool with a generic consumer keyword is NOT evidence of
 * photographer-specific demand — it is the generic pool's volume wearing a pro costume.
 *
 * Usage: node scripts/seo/pool-check.js
 */
const { load } = require('./lib');

const PRO = [
  /photographer/, /\bclient gallery\b/, /\bproofing\b/, /pixieset/, /shootproof/,
  /pic-?time/, /zenfolio/, /cloudspot/, /\bgallery software\b/, /\bphotography business\b/,
  /\bphotography studio\b/, /\bwedding photo/, /\bdeliver/,
];
const isPro = (k) => PRO.some((r) => r.test(k));

const items = load('ideas-national-wide')
  .filter((i) => i && i.keyword && i.search_volume > 0)
  .map((i) => ({ keyword: i.keyword, volume: i.search_volume, cpc: i.cpc == null ? 0 : Number(i.cpc) }));

const pools = new Map();
for (const i of items) {
  const k = `${i.volume}|${i.cpc.toFixed(2)}`;
  if (!pools.has(k)) pools.set(k, []);
  pools.get(k).push(i);
}

const cleanPro = [];
const contaminated = [];

for (const [, members] of pools) {
  const proMembers = members.filter((m) => isPro(m.keyword));
  if (!proMembers.length) continue;
  const genericMembers = members.filter((m) => !isPro(m.keyword));
  if (genericMembers.length) {
    contaminated.push({ proMembers, genericMembers });
  } else {
    cleanPro.push(...proMembers);
  }
}

console.log('='.repeat(84));
console.log('CONTAMINATED — pro-worded keyword sharing a pool with generic consumer terms');
console.log('(the volume belongs to the generic pool, NOT to photographer intent)');
console.log('='.repeat(84));
for (const c of contaminated.sort((a, b) => b.proMembers[0].volume - a.proMembers[0].volume).slice(0, 15)) {
  const p = c.proMembers[0];
  console.log(`\n  ${p.volume}/mo @ $${p.cpc.toFixed(2)}`);
  console.log(`    pro-worded:  ${c.proMembers.map((m) => m.keyword).join(' | ')}`);
  console.log(`    ALSO in pool: ${c.genericMembers.slice(0, 3).map((m) => m.keyword).join(' | ')}`);
}

console.log(`\n${'='.repeat(84)}`);
console.log('CLEAN PRO — pool contains ONLY photographer-intent keywords (trustworthy)');
console.log('='.repeat(84));
console.log('   score |   vol |    cpc | keyword');
for (const i of cleanPro.sort((a, b) => b.volume * b.cpc - a.volume * a.cpc).slice(0, 40)) {
  console.log(
    `  ${String(Math.round(i.volume * i.cpc)).padStart(6)} | ${String(i.volume).padStart(5)} | ` +
    `$${i.cpc.toFixed(2).padStart(6)} | ${i.keyword}`
  );
}
console.log(`\ncontaminated pools: ${contaminated.length} | clean pro keywords: ${cleanPro.length}`);
