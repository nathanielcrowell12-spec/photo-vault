/**
 * Phase 3.5 Step 6 — SERP ground truth on the new low-KD candidates.
 *
 * Keyword difficulty is a model. The SERP is the fact. Phase 2 tested only 38 of
 * 1,031 keywords; none of the template/guide cluster was ever checked. ~$0.004 each.
 */
const { makeClient, save, USA } = require('./lib');

const KEYWORDS = [
  // Template / form cluster — lightfolio's proven traffic engine, KD 0-7
  'photography contract template', 'photography invoice template',
  'wedding photography contract', 'photo release form', 'model release form',
  'print release form photography', 'photographer invoice', 'photography invoice',
  'sample photography contract', 'photographer contract', 'mini session contract',
  'second shooter contract', 'photography pricing guide template',
  // Starter-guide cluster — KD 0
  'how to start a photography business', 'photography business plan',
  'starting a photography business', 'pricing photography',
  'mini sessions for photography',
  // Product-adjacent, KD 0-1
  'proofing images', 'photo proofing software', 'photography workflow software',
  // Wedding guest cluster — KD 10-17, the unclaimed gap
  'wedding guest photo sharing', 'share wedding photos with guests',
  'guests upload wedding photos', 'how to share wedding photos with guests',
  // The one Phase 2 delivery term that survived difficulty scoring, KD 18
  'how to deliver photos to clients',
  // Website/portfolio cluster — KD 16-24, tier 2 reference points
  'photography portfolio websites', 'photographer portfolio websites',
  'photo galleries for photographers',
];

const OURS = /photovault\.photo/i;

(async () => {
  const client = makeClient({ maxSpend: 8.0 });
  const out = {};

  for (const keyword of KEYWORDS) {
    // Live SERP takes exactly ONE task per POST — never batch these.
    const r = await client.post(
      'serp/google/organic/live/advanced',
      [{ keyword, ...USA, device: 'desktop', depth: 20 }],
      keyword.slice(0, 34)
    );
    const items = (r[0] && r[0].items) || [];
    const organic = items.filter((i) => i.type === 'organic');
    const features = [...new Set(items.map((i) => i.type))].filter((t) => t !== 'organic');
    out[keyword] = {
      top: organic.slice(0, 5).map((i) => ({ rank: i.rank_group, domain: i.domain, url: i.url })),
      features,
      ours: organic.find((i) => OURS.test(i.domain || '')) || null,
      organic_count: organic.length,
    };
  }
  save('phase35-serp-verify', out);

  // Community/forum/UGC presence means a real answer page can displace it.
  const SOFT = /reddit|quora|facebook|pinterest|medium|wordpress|blogspot|youtube|linkedin/i;
  console.log('\n  soft  keyword                                    top 5 domains');
  console.log('  ' + '-'.repeat(96));
  const scored = Object.entries(out).map(([kw, v]) => {
    const soft = v.top.filter((t) => SOFT.test(t.domain || '')).length;
    return { kw, soft, v };
  });
  scored.sort((a, b) => b.soft - a.soft);
  for (const { kw, soft, v } of scored) {
    console.log(
      `  ${String(soft).padStart(4)}  ${kw.padEnd(42)} ${v.top.map((t) => t.domain).join(', ')}`
    );
  }
  const ranked = Object.entries(out).filter(([, v]) => v.ours);
  console.log(
    `\n  photovault.photo appears in top 20 for: ${ranked.length} of ${KEYWORDS.length}` +
      (ranked.length ? ` -> ${ranked.map(([k, v]) => `${k}#${v.ours.rank_group}`).join(', ')}` : '')
  );
  console.log(`\n=== SPEND: $${client.spent().toFixed(4)} ===`);
})().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
