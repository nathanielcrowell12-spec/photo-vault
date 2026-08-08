/**
 * PhotoVault SEO — Phase 1 analysis of DataForSEO raw output.
 *
 * Applies the skill's verified rules:
 *  - volumes are CLUSTERED by Google Ads: group by (volume, cpc) and report distinct
 *    pools, never sum members
 *  - rank by volume x CPC, not volume (CPC is the market's own value-per-click estimate)
 *  - filter job-seeker / DIY / licensing / course noise before ranking
 *
 * Usage: node scripts/seo/analyze.js
 */
const fs = require('fs');
const path = require('path');

const RAW = path.resolve(__dirname, '..', '..', 'docs', 'seo', 'raw');
const load = (n) => JSON.parse(fs.readFileSync(path.join(RAW, `${n}.json`), 'utf8'));

// Terms that look high-volume but are worthless for PhotoVault.
const JUNK = [
  /\bjobs?\b/, /\bhiring\b/, /\bsalary\b/, /\bapprentice/, /\bschool\b/, /\bcourse/,
  /\bclass(es)?\b/, /\bdegree\b/, /\bintern(ship)?\b/, /\bcareer/, /\bresume\b/,
  /\blicens/, /\bcertification\b/, /\bhow to become\b/, /\bfree download\b/,
  /\bcrack\b/, /\btorrent\b/, /\bapk\b/, /\blightroom preset/, /\bcamera\b/,
  /\blens(es)?\b/, /\btripod\b/, /\bediting software\b/, /\bphotoshop\b/,
];
const isJunk = (kw) => JUNK.some((r) => r.test(kw));

function normalize(items) {
  return (items || [])
    .filter((i) => i && i.keyword && typeof i.search_volume === 'number' && i.search_volume > 0)
    .map((i) => ({
      keyword: i.keyword,
      volume: i.search_volume,
      cpc: i.cpc == null ? 0 : Number(i.cpc),
      competition: i.competition || 'n/a',
    }));
}

function report(title, items, { showPools = true, topN = 25 } = {}) {
  const all = normalize(items);
  const clean = all.filter((i) => !isJunk(i.keyword));
  const dropped = all.length - clean.length;

  console.log(`\n${'='.repeat(78)}\n${title}\n${'='.repeat(78)}`);
  console.log(`returned: ${(items || []).length} | with volume: ${all.length} | after junk filter: ${clean.length} (dropped ${dropped})`);

  // Cluster detection — the key correction against overcounting.
  const pools = new Map();
  for (const i of clean) {
    const k = `${i.volume}|${i.cpc.toFixed(2)}`;
    if (!pools.has(k)) pools.set(k, []);
    pools.get(k).push(i.keyword);
  }
  console.log(`DISTINCT (volume,cpc) POOLS: ${pools.size}  <- real opportunity count, not ${clean.length}`);

  const ranked = [...clean].sort((a, b) => b.volume * b.cpc - a.volume * a.cpc);
  console.log(`\n-- top ${topN} by volume x CPC --`);
  console.log('  score  |  vol  |   cpc  | comp | keyword');
  for (const i of ranked.slice(0, topN)) {
    const score = i.volume * i.cpc;
    console.log(
      `  ${String(Math.round(score)).padStart(6)} | ${String(i.volume).padStart(5)} | ` +
      `$${i.cpc.toFixed(2).padStart(6)} | ${String(i.competition).slice(0, 4).padEnd(4)} | ${i.keyword}`
    );
  }

  if (showPools) {
    const multi = [...pools.entries()].filter(([, v]) => v.length > 1)
      .sort((a, b) => b[1].length - a[1].length).slice(0, 6);
    if (multi.length) {
      console.log(`\n-- largest clusters (one shared pool of demand, NOT per-keyword) --`);
      for (const [k, kws] of multi) {
        const [v, c] = k.split('|');
        console.log(`  ${v}/mo @ $${c} shared by ${kws.length}: ${kws.slice(0, 5).join(' | ')}${kws.length > 5 ? ' ...' : ''}`);
      }
    }
  }
  return { clean, pools };
}

const vm = load('volume-madison');
const vn = load('volume-national');
const im = load('ideas-madison');
const inat = load('ideas-national');

report('A. MADISON LOCAL — our seeded keywords', vm[0] ? vm[0].items || vm : vm);
report('B. USA NATIONAL — our seeded keywords', vn[0] ? vn[0].items || vn : vn);
report('C. MADISON LOCAL — discovered ideas', im[0] ? im[0].items || im : im, { topN: 30 });
report('D. USA NATIONAL — discovered ideas', inat[0] ? inat[0].items || inat : inat, { topN: 30 });
