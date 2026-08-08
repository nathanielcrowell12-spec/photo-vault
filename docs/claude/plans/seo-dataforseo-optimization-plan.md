# PhotoVault SEO Optimization via DataForSEO — Plan

**Date:** 2026-08-07
**Status:** APPROVED — Phases 0-3 EXECUTED 2026-08-07. Phase 4 (implementation) NOT STARTED.
**Findings:** `docs/seo/keyword-research-2026-08.md`
**Actual spend:** $1.515 (estimate was ~$2.15)
**Note:** Step 0's www/non-www hypothesis was DISPROVED — `sitemap.ts` was correct.
**Skill:** `dataforseo` (`~/.claude/skills/dataforseo/SKILL.md`) + `seo-skill.md`

---

## GOAL

Use the newly-added DataForSEO credentials to produce an evidence-based SEO plan for
photovault.photo — real search volumes, real SERP competitors, real on-page defects —
and then implement the changes that the data justifies.

---

## CONTEXT ESTABLISHED (already verified)

- Credentials work: `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` in `.env.local`.
  Free `GET /v3/appendix/user_data` returned `20000 Ok`. **Balance: $45.20.**
- Public SEO surface (from `src/app/sitemap.ts` + route glob):
  - Directory: `/directory`, `/directory/[city]`, `/directory/[city]/[location_slug]`,
    `/directory/photographers/[username]`
  - Resources (9): storage guide, storage comparison, google-photos-alternatives,
    vs-pixieset, vs-pictime, vs-shootproof, gallery-fatigue,
    photographer-recurring-revenue, madison-photography-guide
  - Conversion: `/pricing`, `/features`, `/how-it-works`, `/faq`, `/photographers`,
    `/photographers/signup`
  - Blog: `/blog`, `/blog/[slug]`
- `public/robots.txt` and `src/app/layout.tsx` exist (not yet audited).

### Suspected defect to confirm first
`sitemap.ts:6` sets `baseUrl = 'https://www.photovault.photo'`, but the project's
canonical convention (CLAUDE.md, seo-skill examples) is `https://photovault.photo`.
If canonicals and the sitemap disagree on www, ranking signals split across two hosts.
**This is a free check (curl redirect chain) and is Step 0.**

---

## TWO DISTINCT SEO MARKETS

PhotoVault competes in two different search markets. They need different keyword data
and must not be blended:

| Market | Pages | Targeting |
|---|---|---|
| **A. Local directory** | `/directory/*` | `location_name: "Madison,Wisconsin,United States"` |
| **B. National SaaS** | `/resources/*`, `/pricing`, `/features` | `location_code: 2840` (USA) |

Per the dataforseo skill's verified gotchas: national volume is meaningless for local
intent, and local volume understates a national SaaS term. Run them separately.

---

## FILES TO INSPECT (no cost)

- `public/robots.txt` — confirm `/client/`, `/photographer/`, `/admin/` disallowed and
  `/directory/` allowed
- `src/app/layout.tsx` — root metadata, `metadataBase`, OG defaults
- `src/app/directory/[city]/page.tsx` + `[location_slug]/page.tsx` — `generateMetadata`,
  canonicals, structured data, thin/duplicate description risk
- `src/app/resources/photovault-vs-pixieset/page.tsx` — representative comparison page
- `src/app/pricing/page.tsx`, `src/app/faq/page.tsx` — FAQPage schema opportunity

## FILES LIKELY TO CHANGE (Phase 3 only, after data)

- `src/app/sitemap.ts` — www/non-www fix if confirmed
- `src/app/layout.tsx` — `metadataBase` / default canonical
- `src/app/directory/[city]/page.tsx`, `[location_slug]/page.tsx` — title/description
  templates rewritten around real keywords; `LocalBusiness` / `ItemList` schema
- `src/app/resources/*/page.tsx` — titles/descriptions aligned to real query phrasing
- `src/app/faq/page.tsx` — `FAQPage` JSON-LD
- New: `scripts/seo/` — the DataForSEO scripts, committed so runs are reproducible
- New: `docs/seo/keyword-research-2026-08.md` — the findings artifact

---

## STEPS

### Phase 0 — Free technical audit (cost: $0)
1. Curl the redirect chain for `photovault.photo` vs `www.photovault.photo`; confirm
   which host is canonical and whether sitemap.ts disagrees.
2. Fetch live `/robots.txt` and `/sitemap.xml`; confirm they are served and consistent.
3. Read the metadata of the inspect-list pages above; record missing canonicals,
   duplicate descriptions, missing schema.

### Phase 1 — Keyword research (est. cost: ~$1.50)
4. Write `scripts/seo/keyword-research.js` — reads `.env.local`, prints `json.cost`
   after every paid call, checks `tasks[0].status_code` (not just top-level).
5. `POST /v3/keywords_data/google_ads/search_volume/live` — batched, ONE task, up to
   1,000 keywords. Two runs: Madison-local seed set, and USA national seed set.
   Seeds drawn from existing page targets (client gallery, photo storage, pixieset
   alternative, Madison wedding photographer, etc.). Est. $0.09/run.
6. `POST /v3/keywords_data/google_ads/keywords_for_keywords/live` — **~$0.09 per seed**,
   so cap at **8 seeds max** ($0.72). Print running spend.
7. Filter per skill gotchas: drop job-seeker/DIY/licensing/brand-navigational terms.
   Group by `(volume, cpc)` to collapse clustered volumes — never sum them.
   Rank by **volume × CPC**, not volume.

### Phase 2 — SERP competitive reality check (est. cost: ~$0.15)
8. `POST /v3/serp/google/organic/live/advanced` — **one keyword per POST** (live SERP
   does not batch). Top ~30 filtered keywords ≈ $0.12.
9. Filter to `type === "organic"` for winnable positions; track `local_pack` separately
   (that's a Google Business Profile surface, not an organic target).
10. Record: who ranks, does photovault.photo appear anywhere, is the SERP directory-
    dominated (Yelp/Thumbtack/The Knot) or beatable.

### Phase 3 — On-page audit (est. cost: ~$0.50)
11. `POST /v3/on_page/task_post` (Standard) — crawl ~100 pages of photovault.photo, then
    `GET /v3/on_page/summary/$id` + `/on_page/pages` for defects: missing titles,
    duplicate descriptions, broken links, slow pages, missing H1.

### Phase 4 — Implement
12. Write findings to `docs/seo/keyword-research-2026-08.md`.
13. Present a ranked, costed change list. **Get approval before editing any page.**
14. Implement approved changes. Metadata/schema changes get a build + a spot check;
    anything that changes rendered UI goes through the UI verification rule.

**Total estimated API spend: ~$2.15 of the $45.20 balance.**

---

## RISKS

1. **Spend runs away.** `keywords_for_keywords` is ~20x a SERP call. Mitigation: hard
   cap of 8 seeds, print running spend after every call, abort if total exceeds $5.
2. **Clustered volumes misread as per-keyword demand.** Mitigation: group by
   `(volume, cpc)`, report distinct pools, never sum.
3. **Silent API failures read as findings.** A failed task with no `result` looks like
   "nothing ranks here." Mitigation: check `tasks[i].status_code` explicitly and throw.
4. **Scope creep into a content-writing project.** Rewriting 9 resource pages is a
   separate effort. This plan changes *metadata, canonicals, schema, and internal
   linking* — not body copy — unless you ask for copy.
5. **Directory pages may be thin.** If the `locations` table has few rows, programmatic
   city pages risk a thin-content problem. Data will show this; fix is out of scope here.
6. **`.env.local` is read-denied to my tools.** All credential use goes through scripts
   that load it and never print values.
7. **No test-first for research scripts.** Iron Law 1 applies to product code; these are
   read-only analysis scripts. Page changes in Phase 4 do get verification.

---

## APPROVAL REQUIRED BEFORE PROCEEDING
