# SEO Research Completion — Phase 3.5 Plan

**Date:** 2026-08-08
**Status:** APPROVED — EXECUTED 2026-08-08. Actual spend **$1.582** (est. $3–7, cap $8).
**Outcome:** root cause found — photovault.photo has 4 referring domains and domain rank 0.
Step 8 (current-discussion layer) remains BLOCKED; every Reddit path returns 403/429.
Parallel Track (4 metadata fixes) also approved and shipped; build + tests verified.
**Predecessor:** `seo-dataforseo-optimization-plan.md` (Phases 0–3 executed 2026-08-07, $1.515)
**Findings doc:** `docs/seo/keyword-research-2026-08.md`
**Skill:** `dataforseo` (`~/.claude/skills/dataforseo/SKILL.md`)
**Budget:** hard cap **$8.00**. Balance to be re-verified free before spending.

---

## GOAL

Close the three research gaps left open by the 2026-08-07 run — competitor link profile,
competitor keyword set, and keyword difficulty — so that Phase 4 implementation is justified by
a **root cause**, not by an assumption that on-page defects explain zero rankings.

---

## WHY THIS IS NOT SCOPE CREEP

Three specific gaps, each traceable to a line in the existing artifacts:

| # | Gap | Evidence it's open |
|---|---|---|
| 1 | Current-discussion layer never obtained | findings doc: "Current-discussion layer: NOT OBTAINED… a tooling failure, not a finding" |
| 2 | Keyword discovery was seed-limited | findings doc §D: "Only 6 returned (narrow seeds — a limitation of this run)" |
| 3 | Real competitors discovered *after* the plan was written; never analyzed | findings doc: "lightfolio.com and picdrop.com outrank PhotoVault everywhere and are not in any comparison page" |

And the unscoped one:

**No backlink data was ever collected.** The site is 96.16/100 on-page and ranks top-20 for
0 of 38 commercial keywords. Those two facts together mean the binding constraint is probably
**not** on-page. If lightfolio.com has 10x PhotoVault's referring domains, then fixing 40 title
tags and adding two new pages will not move rankings, and we need to know that before writing
them. Iron Law 2: no fix without root cause identified.

---

## FILES TO INSPECT (no cost)

- `docs/seo/raw/serp-results.json` — already contains `local_pack` items; re-analyzable at $0
- `scripts/seo/lib.js` — extend the existing client, do not rewrite
- `scripts/seo/serp-check.js`, `analyze-serp.js` — extend for the wider SERP pass

## FILES TO CHANGE

- **New:** `scripts/seo/backlink-gap.js`, `scripts/seo/competitor-keywords.js`,
  `scripts/seo/keyword-difficulty.js`, `scripts/seo/analyze-localpack.js`
- **Modified:** `scripts/seo/serp-check.js` (accept a keyword-list argument)
- **New raw:** `docs/seo/raw/backlinks-*.json`, `ranked-keywords-*.json`, `kd-*.json`
- **Modified:** `docs/seo/keyword-research-2026-08.md` — append a Phase 3.5 section
- **`src/` — UNTOUCHED.** No production code changes in this plan.

---

## STEPS

### Step 1 — Free re-baseline ($0)
`GET /v3/appendix/user_data`. Confirm the actual remaining balance (handoff says ~$43.69).
Abort and report if it is materially lower.

### Step 2 — Endpoint cost probe (est. $0.10–0.30)
The dataforseo skill's verified cost table covers only 4 endpoints. Labs and Backlinks pricing
is **unverified**. Before any loop, make ONE minimal call to each new family and print the real
`json.cost`:
- `POST /v3/dataforseo_labs/google/ranked_keywords/live` — one domain, `limit: 10`
- `POST /v3/dataforseo_labs/google/bulk_keyword_difficulty/live` — 10 keywords
- `POST /v3/backlinks/summary/live` — one domain

**Gate:** if any call exceeds $0.50, stop and re-scope with real numbers before continuing.
Record the observed prices back into the skill's cost table.

### Step 3 — Backlink gap analysis (est. $1–3) — *the root-cause step*
`backlinks/summary/live` for: photovault.photo, pixieset.com, pic-time.com, lightfolio.com,
picdrop.com, cloudspot.io. Compare referring domains, backlinks, and rank.

Then `backlinks/referring_domains/live` for the two nearest-size competitors (lightfolio,
picdrop) — where their links actually come from is a concrete, reproducible link target list.

**Decision output:** either (a) PhotoVault's link profile is competitive and on-page work is the
real lever → Phase 4 proceeds as written, or (b) it is not, and Phase 4's two new pages get
re-scoped or deferred in favour of link acquisition.

### Step 4 — Competitor keyword reverse-engineering (est. $1–2)
`dataforseo_labs/google/ranked_keywords/live` for lightfolio.com, picdrop.com, cloudspot.io,
pic-time.com, pixieset.com — every keyword each already ranks for, with position and volume.
Then `relevant_pages/live` on the top 2 to see **which page types** carry their traffic.

This replaces seed-guessing with observed reality and directly fixes gap #2. It is also the
single best input to the pending "which pages do we build" decision.

### Step 5 — Keyword difficulty on the shortlist (est. $0.10)
`bulk_keyword_difficulty/live` (up to 1,000 keywords per call) across the 93 clean pools plus
everything new from Step 4. Today "winnable" is an eyeball judgment about who holds the top 5;
KD makes it a number.

### Step 6 — SERP depth on new candidates (est. $0.40–1.00)
Only 38 of 1,031 keywords have SERP data. At ~$0.004/keyword, run 100–250 more — chosen by
(high volume×CPC) × (low KD) from Steps 4–5. Reuses `serp-check.js`.

### Step 7 — Local pack, from data already paid for ($0)
`serp-results.json` already contains the `local_pack` blocks. Analyze them at zero cost to
settle whether a Google Business Profile play is available for the Madison terms. **Spend
nothing here unless the free analysis raises a specific question.**

### Step 8 — Current-discussion layer, cheapest viable substitute ($0 API)
The `last30days` lane needs `yt-dlp` installed, a Firefox x.com login, or a `BRAVE_API_KEY` —
all user actions, none of which I can do. Free substitute: fetch the **11 known ranking Reddit
thread URLs** directly and read full comment text instead of SERP snippets. That deepens the
customer-language corpus at no cost. Flag the X/YouTube layer as still-blocked rather than
silently dropping it.

### Step 9 — Synthesis
Append a Phase 3.5 section to `keyword-research-2026-08.md`. Produce the final Phase 4 action
list with the root cause stated explicitly, and resolve the two pending decisions
(body copy in scope? build the two gap pages?) with evidence instead of a coin flip.

**Total estimated spend: $3–7. Hard cap $8.00, enforced in `makeClient({ maxSpend: 8 })`.**

---

## RISKS

1. **Labs/Backlinks pricing is unverified.** Mitigated by the Step 2 probe and the hard cap.
2. **The answer may be unwelcome.** If PhotoVault's link profile cannot compete, that is a
   finding that redirects strategy toward paid/community/partnership channels. It is not a
   failure of the research, and it is much cheaper to learn now than after writing two pages.
3. **This delays Phase 4.** Mitigation: the metadata fixes (canonicals, `metadataBase`, sitemap
   `/cancellation` removal, breadcrumb/`/resources` fix) are correct **regardless** of what this
   research returns. They can run in parallel — see the note below.
4. **Reddit may rate-limit Step 8 too** (it 429'd twice on 2026-08-07). Low stakes: it costs $0,
   and failure will be reported as a tooling failure, not as a finding.
5. **Iron Law 1 (test-first)** — as in the predecessor plan, these are read-only analysis
   scripts, not product code. No `src/` change is in this plan.
6. **`.env.local` is read-denied** to my tools. All credential use goes through the existing
   `loadEnv()` in `scripts/seo/lib.js`, which never prints values.

---

## PARALLEL TRACK (optional, zero research dependency)

These four Phase 4 fixes are correct no matter what Phase 3.5 finds, and touch no body copy:
1. Add `metadataBase` to `src/app/layout.tsx`
2. Add canonicals to `/directory`, `/photographers/commission-details`,
   `/photographers/signup`, `/cancellation`
3. Remove `/cancellation` from `src/app/sitemap.ts` (it 302s to `/login`)
4. Shorten the directory location title template (one-line template change, 40 pages)

They are listed here only so you can approve them separately if you want progress on `src/`
while the research runs. **Not** included in this plan's approval.

---

## APPROVAL REQUIRED BEFORE PROCEEDING
