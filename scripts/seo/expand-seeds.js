/**
 * PhotoVault SEO — wider national seed sweep.
 * 10 seed groups through keywords_for_keywords/live (~$0.09 per call).
 * Usage: node scripts/seo/expand-seeds.js
 */
const { makeClient, save, USA } = require('./lib');

const SEED_GROUPS = [
  ['unlimited photo storage', 'photo storage for photographers'],
  ['client gallery software', 'photographer client gallery'],
  ['shootproof alternative', 'pic-time alternative'],
  ['how to deliver photos to clients', 'photo delivery software'],
  ['google photos alternative', 'digital photo storage service'],
  ['photography business software', 'photo proofing software'],
  ['photo sharing for photographers', 'photographer gallery hosting'],
  ['wedding photo storage', 'where to store wedding photos'],
  ['pixieset pricing', 'shootproof pricing'],
  ['online photo gallery for clients', 'private photo gallery'],
];

(async () => {
  const dfs = makeClient({ maxSpend: 15 });
  const all = [];

  for (let i = 0; i < SEED_GROUPS.length; i++) {
    const seeds = SEED_GROUPS[i];
    try {
      const result = await dfs.post(
        'keywords_data/google_ads/keywords_for_keywords/live',
        [{ ...USA, keywords: seeds, limit: 400, sort_by: 'search_volume' }],
        `g${i + 1}:${seeds[0].slice(0, 24)}`
      );
      const items = (result[0] && result[0].items) || result || [];
      all.push(...items);
      console.log(`      +${items.length} keywords`);
    } catch (e) {
      console.log(`      SKIPPED — ${e.message}`);
    }
  }

  // Dedupe by keyword, keep first occurrence.
  const seen = new Set();
  const deduped = all.filter((k) => {
    if (!k || !k.keyword || seen.has(k.keyword)) return false;
    seen.add(k.keyword);
    return true;
  });

  save('ideas-national-wide', deduped);
  console.log(
    `\n=== ${all.length} raw -> ${deduped.length} unique | spend $${dfs.spent().toFixed(4)} ===`
  );
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
