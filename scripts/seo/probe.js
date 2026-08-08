/**
 * Phase 3.5 Step 1 + Step 2 — free balance re-baseline, then minimal cost probes
 * of the three UNVERIFIED endpoint families (Labs ranked_keywords, Labs
 * bulk_keyword_difficulty, Backlinks summary).
 *
 * Gate: if any probe call exceeds $0.50, this exits non-zero and nothing else runs.
 */
const { makeClient, save, USA } = require('./lib');

const GATE = 0.5;

(async () => {
  const client = makeClient({ maxSpend: 8.0 });

  // ---- Step 1: free balance check -----------------------------------------
  const user = await client.get('appendix/user_data', 'user_data');
  const money = user[0] && user[0].money;
  console.log('=== STEP 1 — BALANCE (free) ===');
  console.log(`  balance:  $${money && money.balance}`);
  console.log(`  limits/day: $${money && money.limits && money.limits.day}`);
  save('phase35-user-data', user);

  if (!money || money.balance < 10) {
    console.error(`\nABORT: balance $${money && money.balance} is below the $10 floor.`);
    process.exit(2);
  }

  // ---- Step 2: cost probes -------------------------------------------------
  console.log('\n=== STEP 2 — COST PROBES (one minimal call per family) ===');
  const observed = {};
  const probes = [];

  const probe = async (name, endpoint, payload) => {
    const before = client.spent();
    let result = null;
    let error = null;
    try {
      result = await client.post(endpoint, payload, name);
    } catch (e) {
      error = e.message;
    }
    const cost = client.spent() - before;
    observed[name] = { endpoint, cost, error, ok: !error };
    probes.push({ name, endpoint, cost, error, sample: result && result[0] });
    console.log(
      `  ${name.padEnd(28)} $${cost.toFixed(4)}${error ? `  ERROR: ${error}` : ''}`
    );
    return result;
  };

  await probe('labs.ranked_keywords', 'dataforseo_labs/google/ranked_keywords/live', [
    { target: 'lightfolio.com', ...USA, limit: 10 },
  ]);

  await probe('labs.keyword_difficulty', 'dataforseo_labs/google/bulk_keyword_difficulty/live', [
    {
      ...USA,
      keywords: [
        'photographer client gallery',
        'client photo gallery for photographers',
        'photography client gallery',
        'photo proofing website',
        'how to deliver photos to clients',
        'how to deliver digital photos to clients',
        'best way for photographers to share photos with clients',
        'website for photographers to upload photos for clients',
        'free client gallery for photographers',
        'photo sharing for photographers',
      ],
    },
  ]);

  await probe('backlinks.summary', 'backlinks/summary/live', [
    { target: 'photovault.photo', internal_list_limit: 1, backlinks_status_type: 'live' },
  ]);

  save('phase35-cost-probe', probes);

  // ---- Gate ----------------------------------------------------------------
  console.log('\n=== GATE ===');
  const over = Object.entries(observed).filter(([, v]) => v.cost > GATE);
  const failed = Object.entries(observed).filter(([, v]) => !v.ok);

  console.log(`  total probe spend: $${client.spent().toFixed(4)}`);
  if (over.length) {
    console.error(`  OVER GATE ($${GATE}): ${over.map(([k, v]) => `${k}=$${v.cost}`).join(', ')}`);
  }
  if (failed.length) {
    console.error(`  FAILED: ${failed.map(([k]) => k).join(', ')}`);
  }
  if (over.length || failed.length) {
    console.error('\nSTOP — re-scope before running Steps 3-6.');
    process.exit(3);
  }
  console.log('  All probes under gate and succeeded. Safe to proceed to Steps 3-6.');
})().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
