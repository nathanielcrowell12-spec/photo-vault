/**
 * Phase 3.5 — fill keyword difficulty for terms the competitor universe did not
 * contain (nobody we sampled ranks top-20 for them, so Labs never returned them).
 * That absence is itself informative and must not be reported as "no data".
 */
const { makeClient, save, USA } = require('./lib');

const KEYWORDS = [
  // Phase 2 "winnable" list entries with no KD yet
  'photographer client gallery',
  'how to deliver digital photos to clients',
  'website for photographers to upload photos for clients',
  // The unclaimed wedding-guest cluster
  'share wedding photos with guests',
  'guests upload wedding photos',
  'wedding guest photo sharing',
  'how to share wedding photos with guests',
  // Template/guide cluster surfaced by lightfolio's top pages — confirm difficulty
  'photography contract template',
  'photography invoice template',
  'wedding photography contract',
  'photo release form',
  'print release form photography',
  'model release form',
  'photography pricing guide template',
  'how to start a photography business',
  'photography business plan',
  'mini session contract',
  'second shooter contract',
  // Product-adjacent low-KD candidates worth confirming
  'proofing images',
  'photography workflow software',
  'photo proofing software',
  'client gallery software',
];

(async () => {
  const client = makeClient({ maxSpend: 8.0 });
  const r = await client.post(
    'dataforseo_labs/google/bulk_keyword_difficulty/live',
    [{ ...USA, keywords: KEYWORDS }],
    'kd-fill'
  );
  const items = (r[0] && r[0].items) || [];

  // Volumes for the same set, so the KD numbers are actionable.
  const v = await client.post(
    'keywords_data/google_ads/search_volume/live',
    [{ ...USA, keywords: KEYWORDS }],
    'volume-fill'
  );
  const vol = new Map((v || []).map((x) => [x.keyword, x]));

  const rows = items
    .map((it) => {
      const m = vol.get(it.keyword) || {};
      return {
        keyword: it.keyword,
        kd: it.keyword_difficulty,
        volume: m.search_volume,
        cpc: m.cpc || 0,
      };
    })
    .sort((a, b) => (a.kd ?? 999) - (b.kd ?? 999));

  console.log('\n   KD    vol      cpc  keyword');
  console.log('  ' + '-'.repeat(70));
  for (const x of rows) {
    console.log(
      `  ${String(x.kd ?? '-').padStart(3)} ${String(x.volume ?? '-').padStart(6)} ` +
        `${('$' + (x.cpc || 0).toFixed(2)).padStart(8)}  ${x.keyword}`
    );
  }

  save('phase35-kd-fill', rows);
  console.log(`\n=== SPEND: $${client.spent().toFixed(4)} ===`);
})().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
