/**
 * Phase 3.5 Step 3 — backlink gap analysis. THE ROOT-CAUSE STEP.
 *
 * photovault.photo scores 96.16/100 on-page and ranks top-20 for 0 of 38 commercial
 * keywords. If the link profile is an order of magnitude behind the competitors that
 * DO rank, then the Phase 4 on-page fix list is not the lever and we need to know
 * before writing two new pages.
 *
 * Cost: 6 x backlinks/summary (~$0.024 ea) + 2 x referring_domains.
 */
const { makeClient, save } = require('./lib');

const DOMAINS = [
  'photovault.photo', // us
  'pixieset.com', // 19x top-5, funded incumbent
  'pic-time.com', // 4x
  'lightfolio.com', // 11x — the real organic competitor
  'picdrop.com', // 10x — the real organic competitor
  'cloudspot.io', // 7x
];

// Nearest-size competitors: where do their links actually come from?
const LINK_TARGETS = ['lightfolio.com', 'picdrop.com'];

(async () => {
  const client = makeClient({ maxSpend: 8.0 });
  const summaries = {};

  console.log('=== STEP 3a — backlink summaries ===');
  for (const target of DOMAINS) {
    const r = await client.post(
      'backlinks/summary/live',
      [{ target, internal_list_limit: 1, backlinks_status_type: 'live' }],
      target
    );
    summaries[target] = r[0];
  }
  save('phase35-backlink-summaries', summaries);

  const num = (n) => (n == null ? 'n/a' : Number(n).toLocaleString());
  console.log('\n  domain                 rank  ref.domains  ref.main  backlinks   spam');
  console.log('  ' + '-'.repeat(72));
  const rows = DOMAINS.map((d) => {
    const s = summaries[d] || {};
    return {
      domain: d,
      rank: s.rank,
      referring_domains: s.referring_domains,
      referring_main_domains: s.referring_main_domains,
      backlinks: s.backlinks,
      spam: s.backlinks_spam_score,
    };
  });
  for (const r of rows) {
    console.log(
      `  ${r.domain.padEnd(20)} ${String(r.rank).padStart(5)} ` +
        `${num(r.referring_domains).padStart(12)} ${num(r.referring_main_domains).padStart(9)} ` +
        `${num(r.backlinks).padStart(11)} ${String(r.spam).padStart(6)}`
    );
  }

  // ---- The verdict ---------------------------------------------------------
  const us = rows[0];
  const others = rows.slice(1).filter((r) => r.referring_domains != null);
  const median = (arr) => {
    const s = [...arr].sort((a, b) => a - b);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  };
  const medRefDomains = median(others.map((r) => r.referring_domains));
  const weakest = others.reduce((a, b) => (a.referring_domains < b.referring_domains ? a : b));

  console.log('\n=== VERDICT ===');
  console.log(`  photovault.photo referring domains: ${num(us.referring_domains)}`);
  console.log(`  competitor median:                  ${num(medRefDomains)}`);
  console.log(
    `  weakest competitor:                 ${weakest.domain} @ ${num(weakest.referring_domains)}`
  );
  const gap = medRefDomains / Math.max(us.referring_domains || 0.0001, 0.0001);
  console.log(`  gap multiple (median / us):         ${gap.toFixed(1)}x`);
  console.log(
    `\n  READ: ${
      gap >= 5
        ? 'LINK-CONSTRAINED. On-page fixes alone will not produce rankings. Phase 4 must be re-scoped.'
        : 'NOT clearly link-constrained. On-page/content work is a plausible lever. Phase 4 proceeds.'
    }`
  );

  // ---- Step 3b: where do the nearest competitors get links? ----------------
  console.log('\n=== STEP 3b — referring domains of nearest competitors ===');
  const refs = {};
  for (const target of LINK_TARGETS) {
    try {
      const r = await client.post(
        'backlinks/referring_domains/live',
        [
          {
            target,
            limit: 100,
            order_by: ['rank,desc'],
            backlinks_status_type: 'live',
            filters: [['referring_links_types.anchor', '>', 0]],
          },
        ],
        `refdomains:${target}`
      );
      refs[target] = (r[0] && r[0].items) || [];
      console.log(`  ${target}: ${refs[target].length} referring domains captured`);
    } catch (e) {
      // Filters can be rejected; retry without them rather than losing the step.
      console.log(`  ${target}: filtered call failed (${e.message}) — retrying unfiltered`);
      const r = await client.post(
        'backlinks/referring_domains/live',
        [{ target, limit: 100, order_by: ['rank,desc'], backlinks_status_type: 'live' }],
        `refdomains:${target}:retry`
      );
      refs[target] = (r[0] && r[0].items) || [];
      console.log(`  ${target}: ${refs[target].length} referring domains captured`);
    }
  }
  save('phase35-referring-domains', refs);

  // Domains linking to BOTH competitors = highest-probability link targets for us.
  const setA = new Set((refs[LINK_TARGETS[0]] || []).map((i) => i.domain));
  const both = (refs[LINK_TARGETS[1]] || []).filter((i) => setA.has(i.domain));
  console.log(`\n  Link to BOTH ${LINK_TARGETS.join(' + ')}: ${both.length}`);
  for (const d of both.slice(0, 25)) {
    console.log(`    rank ${String(d.rank).padStart(4)}  ${d.domain}`);
  }

  console.log(`\n=== SPEND: $${client.spent().toFixed(4)} ===`);
})().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
