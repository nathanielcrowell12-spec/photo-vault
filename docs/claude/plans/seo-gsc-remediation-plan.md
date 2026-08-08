# SEO — Search Console Remediation Plan

**Date:** 2026-08-08
**Status:** AWAITING APPROVAL
**Evidence:** live Google Search Console session, `sc-domain:photovault.photo`, data through 8/4/26
**Supersedes priorities in:** `seo-phase4-content-build-plan.md` (built W1–W3 earlier today)
**Skill:** `seo-skill.md`

---

## WHY THIS PLAN EXISTS

Today's build was driven by keyword-difficulty modelling. Search Console shows what the site
*actually does*, and it disagrees with the model in three places. This plan re-prioritises around
measured behaviour and fixes a root-cause defect the modelling could never have found.

---

## WHAT GSC ACTUALLY SHOWS

**Indexing:** 7 indexed, 22 not indexed (sitemap has 61 URLs).

| Reason | Source | Count |
|---|---|---|
| Crawled – currently not indexed | Google systems | 11 |
| Page with redirect | Website | 6 |
| Duplicate without user-selected canonical | Website | 3 |
| Blocked by robots.txt | Website | 1 |
| Alternate page with proper canonical (passed) | Website | 1 |

**Performance, 90 days:** 1,070 impressions · 4 clicks · CTR 0.4% · **average position 15.6**.
Only **10 pages** earned any impression at all:

| Page | Clicks | Impressions |
|---|---|---|
| `/` | 3 | 406 |
| **`/resources/photovault-vs-pictime`** | 1 | **520** |
| `/resources/photovault-vs-shootproof` | 0 | 92 |
| `/pricing` | 0 | 37 |
| `/features` | 0 | 32 |
| `/privacy` | 0 | 30 |
| 4 × directory/blog pages | 0 | 5 total |

**Links:** 4 external (github.com, photovault.pro, photovault.site, reddit.com); **16 internal.**

---

## THREE CORRECTIONS TO PREVIOUS SESSIONS

Recording these explicitly so nobody re-derives the wrong conclusion from the older docs.

1. **"photovault.photo has zero organic presence" — WRONG.** That generalised a DataForSEO result
   about 38 specific keywords into a claim about the whole site. GSC shows 1,070 impressions at
   average position 15.6. The site is on page 2 for real commercial queries, not absent.
2. **"Disavow the ggmap.us.com PBN" (W0) — DEPRIORITISED.** GSC's external-link list does not
   contain ggmap.us.com. Google either never counted it or already discounts it. Both tools report
   exactly 4 external links but name **completely different domains, zero overlap** — so neither
   list is complete, and neither should be treated as authoritative alone.
3. **The comparison-page strategy is better validated than the keyword research suggested.**
   57% of all site impressions come from two `vs-` pages.

---

## ROOT CAUSE FOUND: middleware redirects unknown routes to /login

`src/middleware.ts:107` builds `isPublicRoute` from an **exact-match** allowlist
(`publicRoutes.some(route => pathname === route)`). `/directory`, `/resources`, `/blog` are
rescued by `startsWith` checks at lines 120–132. Everything else falls through to the auth check
at line 198 and, for anonymous users, returns `302 → /login?redirectTo=<pathname>`.

Googlebot is always anonymous. Consequences visible in GSC right now:

| URL | Bucket | Cause |
|---|---|---|
| `/cancellation` | Page with redirect | **Public content page** — has its own canonical and metadata, but is missing from `publicRoutes`, so it 302s to login |
| `/month` | Page with redirect | Route does not exist anywhere in the codebase; should 404, instead 302s |
| `/login?redirectTo=/cancellation` | Duplicate without canonical | Artifact of the above |
| `/login?redirectTo=/month` | Duplicate without canonical | Artifact of the above |

**4 of the 22 non-indexed URLs are this one defect.** Worse, it is open-ended: any non-existent
URL Google ever discovers becomes an indexable redirect plus a duplicate `/login?redirectTo=` URL.
A 404 is a clean signal; a 302 to a login page is not.

The other 4 "Page with redirect" entries are benign host canonicalisation
(`http→https`, non-www→www) and need no action.

---

## THE HIGHEST-LEVERAGE FACT

`/resources/photovault-vs-pictime` earns **520 impressions — more than the homepage — and 1 click.**
It sits around position 15. The demand is proven and measured, and it converts at 0.2% purely
because page 2 gets no clicks.

Meanwhile **`/resources/photovault-vs-pixieset` earns ZERO impressions.** It is not in the top-pages
list at all. Pixieset is the largest competitor and `pixieset alternative` is 140/mo at $6.59.
Its sibling page pulls 520 impressions. That is an anomaly, not a gradient — something specific is
wrong with that page, and finding out is cheap.

And the directory is settled: **30 location pages produced 5 impressions in 90 days.**

---

## WORK ORDER

| # | Item | Why this position |
|---|---|---|
| **G1** | Fix the middleware fall-through | Root cause, fully in our control, fixes 4 non-indexed URLs and stops the leak permanently |
| **G2** | Diagnose `vs-pixieset` zero impressions | Biggest unexplained gap; cheap to check; may be another instance of a systemic defect |
| **G3** | Add pricing depth to `vs-pictime` + `vs-shootproof` | Acts on 612 measured impressions rather than modelled demand |
| **G4** | `noindex` the auth surface | Stops `/login*` competing for index slots |
| **G5** | Resolve the last "Blocked by robots.txt" URL | 1 page, still unidentified — see OPEN QUESTIONS |

---

## FILES TO CHANGE

- `src/middleware.ts` — add `/cancellation` to `publicRoutes`; stop redirecting unknown routes
- `src/middleware.test.ts` — **new**, tests first
- `src/app/login/layout.tsx` or page metadata — `robots: { index: false, follow: false }`
- `src/app/resources/photovault-vs-pixieset/page.tsx` — only if G2 finds a defect
- `src/app/resources/photovault-vs-pictime/page.tsx`, `photovault-vs-shootproof/page.tsx` — pricing sections

---

## STEPS

### G1 — middleware fall-through

1. **Test first.** New `src/middleware.test.ts` asserting, for an anonymous request:
   - `/cancellation` → passes through (200), does **not** redirect
   - `/month` (unknown route) → does **not** redirect to `/login`
   - `/photographer/dashboard` → **still** redirects to `/login?redirectTo=…` (the protection must
     not regress — this is the test that matters most)
   - `/api/photographer/*` → still returns 401, not a redirect
   Run it; the first two must fail.
2. Add `/cancellation` to `publicRoutes` (it is a public policy page with its own canonical).
3. Replace the blanket fall-through with an explicit **protected-prefix** check: redirect to
   `/login` only when the path is under a known authenticated area (`/photographer`, `/client`,
   `/admin`, `/family`, `/settings`, `/signup/payment`, …). Anything else falls through to Next.js,
   which returns a proper 404.
4. Re-run tests → green.

> **Risk gate.** `CLAUDE.md` requires verifying the desktop flow before changing auth/middleware.
> `/api/v1/upload` and `/auth/desktop-callback` must keep working. Covered by step 1's tests plus
> a manual desktop check before this ships.

### G2 — diagnose `vs-pixieset`

5. URL-inspect `https://www.photovault.photo/resources/photovault-vs-pixieset` in GSC (read-only).
   Determine: indexed or not; if indexed, whether it has impressions on any query at all.
6. Compare its `<head>` output against `vs-pictime`, which works — canonical, robots meta, title,
   schema. Diff the two built HTML files.
7. Fix whatever the diff shows. **If nothing is wrong technically, say so** — the answer may simply
   be that Pixieset's own pages dominate that SERP, which Phase 2 already observed (3 of top 5 were
   pixieset.com). Do not invent a fix for a non-defect.

### G3 — pricing depth on the two earning pages

8. `vs-pictime` and `vs-shootproof` already rank for `pictime pricing` (17 impressions),
   `pic-time pricing plans 2026` (9), `shootproof pricing client galleries 2026` (8). Add an
   explicit, honest pricing-comparison section to each, answering "what does it cost" directly.
9. Keep the existing honesty stance — Phase 3.5's Reddit corpus found Pixieset and its peers are
   genuinely liked, and a hit piece loses to the forum thread.
10. Re-verify with `scripts/seo/verify-pages.js` (≤500 lines, ≥1,200 words, canonical, schema).

### G4 — auth surface

11. Add `robots: { index: false, follow: false }` to `/login`. GSC already flags it as carrying the
    generic root description; it should never have been indexable.

### Verification

12. `npm run build`; `npx vitest run` — **baseline: 197/197 tests pass, the only failing file is
    `src/lib/stripe/webhooks/__tests__/current-behavior.test.ts` (mock hoisting, pre-existing).**
13. `npm run type-check` — exactly 1 permitted pre-existing error
    (`seed-data-accuracy.test.ts(20,3) TS2304 beforeAll`).
14. Live check after deploy: `curl -I https://www.photovault.photo/cancellation` → 200 not 302;
    `curl -I https://www.photovault.photo/month` → 404 not 302.
15. **Manual desktop-app flow check** before considering G1 done.
16. UI verification rule: ask the user to confirm login still gates the dashboard in a browser.

---

## RISKS

1. **G1 touches auth. This is the real risk in this plan.** A mistake here either exposes protected
   pages or locks out real users. Mitigated by writing the protection-still-works tests *first*
   (step 1), and by the explicit desktop check. If the tests cannot be made to cover the protected
   paths convincingly, **stop and escalate rather than shipping a partial fix.**
2. **Indexing will not jump after this.** G1 fixes 4 URLs. The other 11 are "crawled – currently
   not indexed", which is Google declining on authority grounds — not a defect we can patch. Do not
   present G1 as an indexing fix.
3. **Nothing has been crawled since 3 Jun 2026.** Any fix will take weeks to reflect in GSC. Do not
   evaluate this work on a two-week horizon.
4. **G3 edits pages that currently earn 57% of all impressions.** That is the one place where a
   careless change has measurable downside. Additive sections only; do not restructure or retitle.
5. **The two link datasets disagree completely.** Treat both as partial. Do not make link decisions
   on either alone.

---

## OUT OF SCOPE

- Any further `/directory` investment. 30 pages, 5 impressions, 90 days. Settled.
- The PBN disavow (correction 2) — deprioritised, not deleted.
- W4 legal templates from the previous plan — still gated on the user's decision.
- Retrofitting the 9 existing resource pages onto `buildResourceBreadcrumb`.

---

## OPEN QUESTIONS

1. **Which URL is "Blocked by robots.txt"?** 1 page, drilldown not yet opened. Likely intentional
   (`/admin`, `/client`, `/photographer` are all disallowed) but should be confirmed, not assumed.
2. **Do you own `photovault.pro` and `photovault.site`?** They are 2 of your 4 external links. If
   they are yours, your genuine third-party link count is **two** — github.com and reddit.com.
3. **What links to `/month`?** The route does not exist in the codebase, so Google found it
   somewhere. Worth knowing whether something external is generating bad URLs.

---

## APPROVAL REQUIRED BEFORE PROCEEDING
