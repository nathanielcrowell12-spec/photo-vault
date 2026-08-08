/**
 * PhotoVault SEO — Phase 3 on-page crawl via DataForSEO OnPage API.
 *
 * Standard (async) delivery: task_post creates the crawl, then we poll
 * on_page/summary/{id} until crawl_progress === "finished", then pull
 * on_page/pages for per-page defects.
 *
 * Usage: node scripts/seo/onpage-audit.js
 */
const { makeClient, save } = require('./lib');

const TARGET = 'www.photovault.photo';
const MAX_PAGES = 100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const dfs = makeClient({ maxSpend: 15 });

  console.log(`=== Creating crawl task for ${TARGET} (max ${MAX_PAGES} pages) ===`);
  const posted = await dfs.post(
    'on_page/task_post',
    [{
      target: TARGET,
      max_crawl_pages: MAX_PAGES,
      load_resources: false,
      enable_javascript: false,
      store_raw_html: false,
      check_spell: false,
    }],
    'task_post',
    // Standard delivery: the task is accepted with 20100 "Task Created." and a null result.
    { okStatuses: [20100], returnTask: true }
  );

  const taskId = posted && posted.id;
  if (!taskId) throw new Error(`no task id in response: ${JSON.stringify(posted).slice(0, 300)}`);
  console.log(`  task id: ${taskId}`);

  // Poll summary until the crawl finishes.
  let summary = null;
  for (let attempt = 1; attempt <= 40; attempt++) {
    await sleep(15000);
    // 40602 "Task In Queue." is the normal in-progress state, with a null result.
    const res = await dfs.get(`on_page/summary/${taskId}`, `summary#${attempt}`, {
      okStatuses: [40602],
    });
    if (!res || !res[0]) {
      console.log(`  [${attempt}] queued...`);
      continue;
    }
    summary = res[0];
    const pct = summary.crawl_progress;
    const done = summary.pages_crawled || 0;
    console.log(`  [${attempt}] progress=${pct} crawled=${done}`);
    if (pct === 'finished') break;
  }

  if (!summary || summary.crawl_progress !== 'finished') {
    console.log('  WARNING: crawl did not report finished; using latest summary anyway');
  }
  save('onpage-summary', summary);

  // Pull per-page detail.
  const pages = await dfs.post(
    'on_page/pages',
    [{ id: taskId, limit: 200 }],
    'pages'
  );
  const items = (pages[0] && pages[0].items) || [];
  save('onpage-pages', items);

  console.log(`\n=== CRAWL SUMMARY ===`);
  const dq = (summary && summary.domain_info) || {};
  const pm = (summary && summary.page_metrics) || {};
  console.log(`  pages crawled: ${summary && summary.pages_crawled}`);
  console.log(`  server: ${dq.server || 'n/a'} | cms: ${dq.cms || 'n/a'} | ssl: ${dq.ssl_info ? 'yes' : 'n/a'}`);
  console.log(`  onpage_score: ${pm.onpage_score}`);
  console.log(`  broken links: ${pm.broken_links} | broken resources: ${pm.broken_resources}`);
  console.log(`  duplicate title: ${pm.duplicate_title} | duplicate description: ${pm.duplicate_description}`);
  console.log(`  duplicate content: ${pm.duplicate_content}`);
  console.log(`  non-indexable: ${pm.non_indexable}`);

  const checks = pm.checks || {};
  console.log(`\n=== SITE-WIDE CHECK COUNTS (non-zero only) ===`);
  for (const [k, v] of Object.entries(checks).sort((a, b) => b[1] - a[1])) {
    if (v) console.log(`  ${String(v).padStart(4)}  ${k}`);
  }
  console.log(`\n  pages returned: ${items.length}`);
  console.log(`=== spend $${dfs.spent().toFixed(4)} ===`);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
