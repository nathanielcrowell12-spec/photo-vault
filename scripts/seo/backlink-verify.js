/**
 * Phase 3.5 Step 3c — sanity-check the "4 referring domains" result.
 *
 * www.photovault.photo is the canonical host. If the backlinks API treats the
 * bare domain and the www host as different targets, the headline number is wrong.
 * Also lists the actual backlinks, since spam_score 55 on 4 links is worth seeing.
 */
const { makeClient, save } = require('./lib');

(async () => {
  const client = makeClient({ maxSpend: 8.0 });
  const out = {};

  console.log('=== host variants ===');
  for (const target of ['photovault.photo', 'www.photovault.photo']) {
    let s;
    try {
      const r = await client.post(
        'backlinks/summary/live',
        [{ target, internal_list_limit: 1, backlinks_status_type: 'live' }],
        target
      );
      s = r[0] || {};
    } catch (e) {
      // A null result for the www host means DataForSEO holds no separate record
      // for it — the bare-domain target is the one carrying the data.
      console.log(`  ${target.padEnd(24)} NO SEPARATE RECORD (${e.message})`);
      out[target] = null;
      continue;
    }
    out[target] = s;
    console.log(
      `  ${target.padEnd(24)} rank=${s.rank}  ref_domains=${s.referring_domains}  ` +
        `backlinks=${s.backlinks}  first_seen=${s.first_seen}  crawled_pages=${s.crawled_pages}`
    );
  }

  console.log('\n=== the actual backlinks ===');
  const bl = await client.post(
    'backlinks/backlinks/live',
    [{ target: 'photovault.photo', limit: 50, backlinks_status_type: 'live' }],
    'backlinks:list'
  );
  const items = (bl[0] && bl[0].items) || [];
  out.backlinks = items;
  for (const b of items) {
    console.log(
      `  [${b.dofollow ? 'dofollow' : 'nofollow'}] rank=${String(b.domain_from_rank).padStart(3)} ` +
        `spam=${String(b.backlink_spam_score).padStart(3)}  ${b.domain_from}`
    );
    console.log(`      anchor: ${JSON.stringify(b.anchor)}  -> ${b.url_to}`);
  }
  if (!items.length) console.log('  (none returned)');

  save('phase35-backlink-verify', out);
  console.log(`\n=== SPEND: $${client.spent().toFixed(4)} ===`);
})().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
