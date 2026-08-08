/**
 * PhotoVault SEO — analyze the wide national sweep.
 * Segments by intent, clusters by (volume,cpc), ranks by volume x CPC.
 * Usage: node scripts/seo/analyze-wide.js [topN]
 */
const { load } = require('./lib');

const TOP_N = Number(process.argv[2] || 30);

// Noise: not a buyer of gallery software or family photo storage.
const JUNK = [
  /\bjobs?\b/, /\bsalary\b/, /\bhiring\b/, /\bapprentice/, /\bschool\b/, /\bcourse/,
  /\bclass(es)?\b/, /\bdegree\b/, /\bintern(ship)?\b/, /\bcareer/, /\bresume\b/,
  /\blicens/, /\bcertification\b/, /\bhow to become\b/, /\bcrack\b/, /\btorrent\b/,
  /\bapk\b/, /\bmod\b/, /\bfree download\b/, /\bpreset/, /\bphotoshop\b/,
  /\blightroom\b/, /\bcamera\b/, /\blens(es)?\b/, /\btripod\b/, /\bsd card\b/,
  /\bhard drive\b/, /\bnas\b/, /\bssd\b/, /\bmemory card\b/, /\bprinter\b/,
  /\bprints?\b/, /\bframe(s|d)?\b/, /\balbum\b/, /\bscrapbook/, /\bwallpaper/,
  /\bstock photo/, /\bfree images?\b/, /\bai (photo|image) gener/, /\bheadshot generator\b/,
];

// Consumer cloud giants — real volume, but navigational to a competitor we can't displace
// and mostly not PhotoVault's buyer. Segregated, not silently deleted.
const CONSUMER_CLOUD = [
  /\bicloud\b/, /\bgoogle (one|drive)\b/, /\bonedrive\b/, /\bdropbox\b/, /\bamazon photos\b/,
  /\bmega\b/, /\bmediafire\b/, /\bflickr\b/, /\bsmugmug\b/, /\bshutterfly\b/,
  /\bsnapfish\b/, /\bapple\b/, /\bsamsung\b/, /\biphone\b/, /\bandroid\b/, /\bwindows\b/,
  /\bmac\b/, /\bpc\b/, /\bterabox\b/, /\bproton drive\b/, /\bsync\.com\b/, /\bpcloud\b/,
];

// Photographer-business intent — PhotoVault's core SaaS buyer.
const PRO = [
  /photographer/, /\bclient gallery\b/, /\bproofing\b/, /\bdeliver/, /\bstudio\b/,
  /pixieset/, /shootproof/, /pic-?time/, /zenfolio/, /cloudspot/, /\bgallery software\b/,
  /\bphotography business\b/, /\bwedding photo/, /\bsession\b/,
];

const isAny = (kw, list) => list.some((r) => r.test(kw));

const items = load('ideas-national-wide')
  .filter((i) => i && i.keyword && typeof i.search_volume === 'number' && i.search_volume > 0)
  .map((i) => ({
    keyword: i.keyword,
    volume: i.search_volume,
    cpc: i.cpc == null ? 0 : Number(i.cpc),
    comp: i.competition || 'n/a',
  }));

const clean = items.filter((i) => !isAny(i.keyword, JUNK));
const pro = clean.filter((i) => isAny(i.keyword, PRO) && !isAny(i.keyword, CONSUMER_CLOUD));
const cloud = clean.filter((i) => isAny(i.keyword, CONSUMER_CLOUD));
const other = clean.filter((i) => !pro.includes(i) && !cloud.includes(i));

function show(title, list, n = TOP_N) {
  const pools = new Set(list.map((i) => `${i.volume}|${i.cpc.toFixed(2)}`));
  console.log(`\n${'='.repeat(80)}\n${title}\n${'='.repeat(80)}`);
  console.log(`keywords: ${list.length} | DISTINCT (vol,cpc) POOLS: ${pools.size}  <- real opportunity count`);
  console.log('   score |   vol |    cpc | comp | keyword');
  for (const i of [...list].sort((a, b) => b.volume * b.cpc - a.volume * a.cpc).slice(0, n)) {
    console.log(
      `  ${String(Math.round(i.volume * i.cpc)).padStart(6)} | ${String(i.volume).padStart(5)} | ` +
      `$${i.cpc.toFixed(2).padStart(6)} | ${String(i.comp).slice(0, 4).padEnd(4)} | ${i.keyword}`
    );
  }
}

console.log(`total with volume: ${items.length} | after junk filter: ${clean.length} (dropped ${items.length - clean.length})`);
show('1. PHOTOGRAPHER / PRO INTENT  <-- PhotoVault core buyer', pro, 35);
show('2. CONSUMER CLOUD BRANDS  <-- volume exists, but navigational to giants', cloud, 12);
show('3. EVERYTHING ELSE (generic storage / sharing intent)', other, 25);
