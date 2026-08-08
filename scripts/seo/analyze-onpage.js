/**
 * PhotoVault SEO — Phase 3 analysis: which pages carry which defects.
 * Usage: node scripts/seo/analyze-onpage.js
 */
const { load } = require('./lib');

const pages = load('onpage-pages');
const short = (u) => (u || '').replace(/^https?:\/\/www\.photovault\.photo/, '') || '/';

function list(title, pred, extra) {
  const hits = pages.filter(pred);
  console.log(`\n${'='.repeat(80)}\n${title}  (${hits.length})\n${'='.repeat(80)}`);
  for (const p of hits.slice(0, 40)) {
    console.log(`  ${short(p.url)}`);
    if (extra) {
      const e = extra(p);
      if (e) console.log(`      ${e}`);
    }
  }
  return hits;
}

const c = (p, k) => p.checks && p.checks[k];

console.log(`total pages crawled: ${pages.length}`);

list('BROKEN / 4xx', (p) => c(p, 'is_broken') || c(p, 'is_4xx_code'),
  (p) => `status ${p.status_code}`);

list('REDIRECTS', (p) => c(p, 'is_redirect'), (p) => `-> ${p.location || '?'}`);

list('NON-INDEXABLE', (p) => p.meta && p.meta.htags === undefined ? false : c(p, 'is_non_indexable') || p.is_non_indexable,
  (p) => `reason: ${p.non_indexable_reason || 'n/a'}`);

list('MISSING CANONICAL', (p) => !c(p, 'canonical'));

list('DUPLICATE TITLE', (p) => c(p, 'duplicate_title'),
  (p) => `"${(p.meta && p.meta.title) || ''}"`);

list('DUPLICATE DESCRIPTION', (p) => c(p, 'duplicate_description'),
  (p) => `"${((p.meta && p.meta.description) || '').slice(0, 90)}"`);

list('DUPLICATE CONTENT', (p) => c(p, 'duplicate_content'));

const longTitles = list('TITLE TOO LONG (>65 chars)', (p) => c(p, 'title_too_long'),
  (p) => {
    const t = (p.meta && p.meta.title) || '';
    return `${t.length} chars: "${t}"`;
  });

list('TITLE TOO SHORT', (p) => c(p, 'title_too_short'),
  (p) => `"${(p.meta && p.meta.title) || ''}"`);

list('IRRELEVANT DESCRIPTION', (p) => c(p, 'irrelevant_description'),
  (p) => `"${((p.meta && p.meta.description) || '').slice(0, 90)}"`);

list('LOW CHARACTER COUNT (thin content)', (p) => c(p, 'low_character_count'),
  (p) => `${(p.meta && p.meta.content && p.meta.content.plain_text_word_count) || '?'} words`);

// Worst offenders by title length, for the rewrite list.
console.log(`\n${'='.repeat(80)}\nLONGEST TITLES (rewrite targets)\n${'='.repeat(80)}`);
const byLen = longTitles
  .map((p) => ({ url: short(p.url), t: (p.meta && p.meta.title) || '' }))
  .sort((a, b) => b.t.length - a.t.length)
  .slice(0, 15);
for (const x of byLen) console.log(`  ${String(x.t.length).padStart(3)}  ${x.url}\n       "${x.t}"`);
