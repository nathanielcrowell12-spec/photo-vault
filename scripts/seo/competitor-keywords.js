/**
 * Phase 3.5 Steps 4 + 5 — reverse-engineer the competitors' actual keyword sets,
 * find which of their PAGES carry the traffic, and score everything by difficulty.
 *
 * Replaces the seed-guessing that limited Phase 1 (§D returned only 6 ideas).
 * With photovault.photo at domain rank 0 / 4 referring domains, keyword difficulty
 * is now the binding filter, not CPC.
 *
 * Per-call abort guard: any single call over $0.50 stops the run.
 */
const { makeClient, save, load, USA } = require('./lib');

const PER_CALL_MAX = 0.5;
const DOMAINS = ['lightfolio.com', 'picdrop.com', 'cloudspot.io', 'pic-time.com', 'pixieset.com'];
const PAGE_TARGETS = ['lightfolio.com', 'picdrop.com'];

async function guarded(client, endpoint, payload, label) {
  const before = client.spent();
  const r = await client.post(endpoint, payload, label);
  const cost = client.spent() - before;
  if (cost > PER_CALL_MAX) {
    throw new Error(`ABORT: [${label}] single call cost $${cost.toFixed(4)} > $${PER_CALL_MAX}`);
  }
  return r;
}

(async () => {
  const client = makeClient({ maxSpend: 8.0 });

  // ---- Step 4a: what does each competitor rank for? ------------------------
  console.log('=== STEP 4a — competitor ranked keywords ===');
  const ranked = {};
  for (const target of DOMAINS) {
    const r = await guarded(
      client,
      'dataforseo_labs/google/ranked_keywords/live',
      [
        {
          target,
          ...USA,
          limit: 1000,
          order_by: ['keyword_data.keyword_info.search_volume,desc'],
          filters: [['ranked_serp_element.serp_item.rank_group', '<=', 20]],
        },
      ],
      `ranked:${target}`
    );
    const res = r[0] || {};
    ranked[target] = res.items || [];
    console.log(
      `  ${target.padEnd(16)} total_ranked=${res.total_count}  captured=${ranked[target].length}`
    );
  }
  save('phase35-ranked-keywords', ranked);

  // ---- Step 4b: which PAGES carry their traffic? ---------------------------
  console.log('\n=== STEP 4b — relevant pages ===');
  const pages = {};
  for (const target of PAGE_TARGETS) {
    const r = await guarded(
      client,
      'dataforseo_labs/google/relevant_pages/live',
      [{ target, ...USA, limit: 50, order_by: ['metrics.organic.etv,desc'] }],
      `pages:${target}`
    );
    pages[target] = (r[0] && r[0].items) || [];
    console.log(`  ${target}: ${pages[target].length} pages`);
    for (const p of pages[target].slice(0, 12)) {
      const m = (p.metrics && p.metrics.organic) || {};
      console.log(
        `    etv=${String(Math.round(m.etv || 0)).padStart(6)} kw=${String(m.count || 0).padStart(5)}  ${p.page_address}`
      );
    }
  }
  save('phase35-relevant-pages', pages);

  // ---- Build the candidate keyword universe -------------------------------
  // Exclude brand-navigational terms: a term containing a competitor's own brand
  // is not winnable for PhotoVault except as an "alternative" page.
  const BRANDS = ['lightfolio', 'picdrop', 'cloudspot', 'pic time', 'pic-time', 'pictime', 'pixieset'];
  const universe = new Map();
  for (const [domain, items] of Object.entries(ranked)) {
    for (const it of items) {
      const kd = it.keyword_data || {};
      const kw = kd.keyword;
      const info = kd.keyword_info || {};
      if (!kw || !info.search_volume) continue;
      const rank = ((it.ranked_serp_element || {}).serp_item || {}).rank_group;
      if (!universe.has(kw)) {
        universe.set(kw, {
          keyword: kw,
          volume: info.search_volume,
          cpc: info.cpc || 0,
          competition: info.competition,
          brand: BRANDS.some((b) => kw.includes(b)),
          rankedBy: [],
        });
      }
      universe.get(kw).rankedBy.push(`${domain}#${rank}`);
    }
  }
  console.log(`\n  candidate universe: ${universe.size} unique keywords`);

  // Carry forward the Phase 1/2 clean pools so they get difficulty scores too.
  let phase12 = [];
  try {
    const serp = load('serp-results');
    phase12 = Object.keys(serp).length ? Object.keys(serp) : [];
  } catch {
    /* optional */
  }
  for (const kw of phase12) {
    if (!universe.has(kw)) {
      universe.set(kw, { keyword: kw, volume: null, cpc: null, brand: false, rankedBy: ['phase2'] });
    }
  }

  // ---- Step 5: keyword difficulty (1,000 per call) ------------------------
  console.log('\n=== STEP 5 — keyword difficulty ===');
  const allKeywords = [...universe.keys()];
  const kdMap = {};
  for (let i = 0; i < allKeywords.length; i += 1000) {
    const chunk = allKeywords.slice(i, i + 1000);
    const r = await guarded(
      client,
      'dataforseo_labs/google/bulk_keyword_difficulty/live',
      [{ ...USA, keywords: chunk }],
      `kd:${i / 1000 + 1}`
    );
    for (const it of (r[0] && r[0].items) || []) {
      kdMap[it.keyword] = it.keyword_difficulty;
    }
  }
  for (const [kw, v] of universe) v.kd = kdMap[kw];
  save('phase35-keyword-universe', [...universe.values()]);

  // ---- The shortlist a domain-rank-0 site could actually reach -------------
  const reachable = [...universe.values()]
    .filter((v) => !v.brand && v.kd != null && v.kd <= 20 && (v.volume || 0) >= 10)
    .sort((a, b) => (b.volume || 0) * (b.cpc || 0) - (a.volume || 0) * (a.cpc || 0));

  console.log(`\n=== REACHABLE SHORTLIST (KD <= 20, vol >= 10, non-brand): ${reachable.length} ===`);
  console.log('   KD    vol      cpc  keyword');
  console.log('  ' + '-'.repeat(76));
  for (const v of reachable.slice(0, 40)) {
    console.log(
      `  ${String(v.kd).padStart(3)} ${String(v.volume).padStart(6)} ` +
        `${('$' + (v.cpc || 0).toFixed(2)).padStart(8)}  ${v.keyword}`
    );
  }

  const kdBuckets = { '0-10': 0, '11-20': 0, '21-30': 0, '31-50': 0, '51+': 0 };
  for (const v of universe.values()) {
    if (v.kd == null) continue;
    if (v.kd <= 10) kdBuckets['0-10']++;
    else if (v.kd <= 20) kdBuckets['11-20']++;
    else if (v.kd <= 30) kdBuckets['21-30']++;
    else if (v.kd <= 50) kdBuckets['31-50']++;
    else kdBuckets['51+']++;
  }
  console.log('\n  KD distribution across universe:', JSON.stringify(kdBuckets));
  console.log(`\n=== SPEND: $${client.spent().toFixed(4)} ===`);
})().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
