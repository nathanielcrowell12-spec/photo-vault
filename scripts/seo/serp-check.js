/**
 * PhotoVault SEO — Phase 2 SERP competitive check.
 *
 * serp/google/organic/live/advanced accepts exactly ONE task per POST — later array
 * elements silently fail with per-task 40000. So: one call per keyword.
 * Only type === "organic" items are winnable positions; local_pack is tracked separately
 * because it is a Google Business Profile surface, not an organic target.
 *
 * Usage: node scripts/seo/serp-check.js
 */
const { makeClient, save, MADISON, USA } = require('./lib');

const NATIONAL = [
  'pixieset pricing', 'pixieset alternative', 'photographer client gallery',
  'free client gallery for photographers', 'photo sharing for photographers',
  'photo sharing website for photographers', 'best client gallery for photographers',
  'client photo gallery for photographers', 'photography client gallery',
  'photo proofing website', 'photo proofing site', 'how to deliver photos to clients',
  'how to deliver digital photos to clients',
  'best way for photographers to share photos with clients',
  'website for photographers to upload photos for clients', 'shootproof pricing',
  'pic-time alternative', 'photo storage for photographers', 'best storage for photographers',
  'online storage for photographers', 'share wedding photos with guests',
  'guests upload wedding photos', 'wedding photo sharing',
  'photo sharing platforms for photographers', 'best photo sharing site for photographers',
  'photo upload sites for photographers', 'digital storage for photographers',
  'pixieset photo sharing', 'unlimited photo storage', 'google photos alternative',
  'photo storage services', 'photo hosting sites', 'best cloud storage for photos',
  'long term photo storage',
];

const LOCAL = [
  'madison photographers', 'madison wedding photographer',
  'photography locations madison wi', 'olbrich botanical gardens photos',
];

const TARGET = /photovault\.photo/i;

(async () => {
  const dfs = makeClient({ maxSpend: 15 });
  const rows = [];

  const run = async (keyword, loc, market) => {
    try {
      const result = await dfs.post(
        'serp/google/organic/live/advanced',
        [{ ...loc, keyword, device: 'desktop', depth: 20 }],
        keyword.slice(0, 34)
      );
      const items = (result[0] && result[0].items) || [];
      const organic = items.filter((i) => i.type === 'organic');
      const hasLocalPack = items.some((i) => i.type === 'local_pack');
      const mine = organic.find((i) => TARGET.test(i.url || i.domain || ''));
      rows.push({
        keyword,
        market,
        organicCount: organic.length,
        hasLocalPack,
        photovaultRank: mine ? mine.rank_group : null,
        top5: organic.slice(0, 5).map((i) => i.domain),
        serpFeatures: [...new Set(items.map((i) => i.type))].filter((t) => t !== 'organic'),
      });
    } catch (e) {
      console.log(`      FAILED "${keyword}": ${e.message}`);
      rows.push({ keyword, market, error: e.message });
    }
  };

  console.log(`=== NATIONAL (${NATIONAL.length}) ===`);
  for (const k of NATIONAL) await run(k, USA, 'national');
  console.log(`\n=== MADISON LOCAL (${LOCAL.length}) ===`);
  for (const k of LOCAL) await run(k, MADISON, 'local');

  save('serp-results', rows);
  console.log(`\n=== DONE — spend $${dfs.spent().toFixed(4)} ===`);

  const ranked = rows.filter((r) => r.photovaultRank);
  console.log(`\nphotovault.photo appears in top 20 for ${ranked.length}/${rows.length} keywords`);
  for (const r of ranked) console.log(`  #${r.photovaultRank}  ${r.keyword}`);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
