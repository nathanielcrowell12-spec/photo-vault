/**
 * PhotoVault SEO — pull the actual Reddit threads that rank for our target queries.
 *
 * Phase 2 stored only domains. These threads are the customer-research corpus: real
 * photographers describing, in their own words, what's broken about the alternatives.
 *
 * Usage: node scripts/seo/reddit-threads.js
 */
const { makeClient, save, USA } = require('./lib');

// The clean-pro, winnable cluster from Phase 2 — the queries where Reddit outranks vendors.
const KEYWORDS = [
  'photographer client gallery', 'client photo gallery for photographers',
  'photography client gallery', 'photo proofing website', 'photo proofing site',
  'how to deliver photos to clients', 'how to deliver digital photos to clients',
  'best way for photographers to share photos with clients',
  'website for photographers to upload photos for clients',
  'free client gallery for photographers', 'photo sharing for photographers',
  'best client gallery for photographers', 'pixieset alternative', 'pic-time alternative',
  'photo storage for photographers', 'best storage for photographers',
  'online storage for photographers', 'share wedding photos with guests',
  'guests upload wedding photos', 'photo sharing platforms for photographers',
  'best photo sharing site for photographers', 'photo upload sites for photographers',
];

(async () => {
  const dfs = makeClient({ maxSpend: 15 });
  const threads = new Map(); // url -> {url,title,snippet,rank,keywords[]}
  const nicheCompetitors = new Map();

  const BIG = /reddit|facebook|instagram|youtube|pixieset|dropbox|amazon|google|wikipedia|pinterest|quora|twitter|linkedin/i;

  for (const keyword of KEYWORDS) {
    try {
      const result = await dfs.post(
        'serp/google/organic/live/advanced',
        [{ ...USA, keyword, device: 'desktop', depth: 20 }],
        keyword.slice(0, 36)
      );
      const organic = ((result[0] && result[0].items) || []).filter((i) => i.type === 'organic');

      for (const i of organic) {
        const url = i.url || '';
        if (/reddit\.com/i.test(url)) {
          if (!threads.has(url)) {
            threads.set(url, {
              url,
              title: i.title || '',
              snippet: i.description || '',
              bestRank: i.rank_group,
              keywords: [],
            });
          }
          const t = threads.get(url);
          t.keywords.push(keyword);
          t.bestRank = Math.min(t.bestRank, i.rank_group);
        } else if (i.rank_group <= 10 && !BIG.test(url)) {
          const d = i.domain;
          if (!nicheCompetitors.has(d)) nicheCompetitors.set(d, { domain: d, hits: 0, keywords: [] });
          const n = nicheCompetitors.get(d);
          n.hits++;
          if (n.keywords.length < 6) n.keywords.push(keyword);
        }
      }
    } catch (e) {
      console.log(`  FAILED "${keyword}": ${e.message}`);
    }
  }

  const threadList = [...threads.values()].sort((a, b) => b.keywords.length - a.keywords.length);
  const compList = [...nicheCompetitors.values()].sort((a, b) => b.hits - a.hits);
  save('reddit-threads', threadList);
  save('niche-competitors', compList);

  console.log(`\n${'='.repeat(88)}`);
  console.log(`REDDIT THREADS RANKING FOR OUR TARGET QUERIES (${threadList.length} unique)`);
  console.log('='.repeat(88));
  for (const t of threadList.slice(0, 30)) {
    console.log(`\n  #${t.bestRank} | ranks for ${t.keywords.length} of our keywords`);
    console.log(`  ${t.title}`);
    console.log(`  ${t.url}`);
    if (t.snippet) console.log(`  "${t.snippet.slice(0, 240)}"`);
  }

  console.log(`\n${'='.repeat(88)}`);
  console.log(`NICHE COMPETITORS IN TOP 10 (not Reddit/FB/Pixieset/giants)`);
  console.log('='.repeat(88));
  for (const c of compList.slice(0, 20)) {
    console.log(`  ${String(c.hits).padStart(3)}x  ${c.domain.padEnd(30)} ${c.keywords.slice(0, 3).join(' | ')}`);
  }
  console.log(`\n=== spend $${dfs.spent().toFixed(4)} ===`);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
