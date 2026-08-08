/**
 * Phase 3.5 Step 7 — local pack analysis. ZERO API COST.
 * Re-reads serp-results.json, already paid for in Phase 2.
 *
 * LIMITATION, stated up front: Phase 2 saved a SUMMARY (hasLocalPack + top5 domains),
 * not the raw SERP items. So this can report WHICH keywords carry a local pack, but
 * not WHO occupies it. Capturing occupants would need fresh SERP calls (~$0.004 each).
 * Not spent, because the strategic question does not depend on it — see the read below.
 */
const { load } = require('./lib');

const rows = load('serp-results');
console.log(`serp-results.json: ${rows.length} keywords\n`);

const withPack = rows.filter((r) => r.hasLocalPack);
const local = rows.filter((r) => r.market === 'local');

console.log(`Local-market keywords tested: ${local.length}`);
console.log(`Keywords showing a local_pack: ${withPack.length} of ${rows.length}\n`);

console.log('  pack  rank  keyword                                   top 5');
console.log('  ' + '-'.repeat(94));
for (const r of local) {
  console.log(
    `  ${r.hasLocalPack ? ' YES' : '  no'}  ${String(r.photovaultRank ?? '-').padStart(4)}  ` +
      `${r.keyword.padEnd(40)} ${(r.top5 || []).join(', ')}`
  );
}

// SERP feature crowding: how much room is left for an organic result at all.
console.log('\n  Feature crowding on local terms (each feature pushes organic down):');
for (const r of local) {
  console.log(`    ${String((r.serpFeatures || []).length).padStart(2)}  ${r.keyword}`);
  console.log(`        ${(r.serpFeatures || []).join(', ')}`);
}

console.log(
  '\nREAD: a local_pack is a Google Business Profile surface. PhotoVault is a SaaS\n' +
    'platform, not a Madison photography business, so it cannot legitimately claim a\n' +
    'GBP listing for these queries — regardless of who currently occupies the pack.\n' +
    'Combined with Phase 1 (the location long-tail is one ~10/mo pool at $0.00 CPC),\n' +
    'this removes the last remaining argument for investing in the location directory.'
);
console.log('\n(API cost: $0 — re-read of Phase 2 data)');
