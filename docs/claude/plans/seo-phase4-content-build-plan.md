# SEO Phase 4 — Work Order + Implementation Plan

**Date:** 2026-08-08
**Status:** REVISED after QA critic review (`seo-phase4-content-build-plan-critique.md`, verdict
NEEDS REVISION). All critical issues addressed below; see REVISION LOG at the end for what
changed and for the two critic findings I checked and rejected.
**Evidence base:** `docs/seo/keyword-research-2026-08.md` (Phases 0–3.5, $3.097 spent)
**Skill:** `seo-skill.md`, `dataforseo` SKILL.md
**Predecessors:** `seo-dataforseo-optimization-plan.md`, `seo-research-completion-phase-3.5-plan.md`

---

## GOAL

Ship the content and technical work that Phase 3.5 evidence actually supports, in an order
that respects dependencies, and without pretending on-page work will fix a link problem.

---

## THE CONSTRAINT THAT SHAPES EVERYTHING

photovault.photo has **4 referring domains and domain rank 0**. The weakest competitor has 961.
Nothing in this plan produces rankings on its own. What this plan does is:

1. Stop actively broken things (the `/resources` 404 poisoning 9 pages of schema).
2. Build pages on the *only* keyword cluster a rank-0 domain can win (KD 0–17).
3. Choose page types that **earn links**, because links are the binding constraint.

Anyone reading this later: do not re-order this plan to chase the high-CPC client-gallery
terms. They are KD 33–54. That was checked. See the Phase 3.5 correction table.

---

## WORK ORDER (sequenced by hard dependency, then by reachable value)

| # | Item | Why this position | Gate |
|---|---|---|---|
| **W0** | Disavow the `ggmap.us.com` PBN link | 10-minute Search Console action that touches the **actual** constraint. It is absurd to defer the only cheap link-side action behind three content pages. | user executes |
| **W1** | `/resources` index page + `RESOURCES` registry | **Hard dependency — but for the registry, not the breadcrumbs.** W2 and W3 both consume `buildResourceBreadcrumb()` and the registry; those must exist first. The breadcrumb 404 is a *soft* dependency (nothing fails to build) but it is a **live user-facing 404**: 3 resource pages render a clickable "Resources" breadcrumb today that dead-ends. | none |
| **W2** | Wedding-guest photo sharing page | Best reachable target: KD 10–17, 260+170+50/mo, no incumbent SaaS, on-product, **no legal content**. | none |
| **W3** | Non-legal template + guide (2 pages) | KD 0. The **invoice template page is the link-earning asset** (a downloadable template — the asset type the evidence names). The business-guide page is a **traffic** play at 1,900/mo, not a link play; stated honestly rather than lumped together. | none |
| **W4** | Legal-document templates (contract, model release, print release) | Highest raw volume in the cluster **but publishes legal documents**. See RISK 1. | **user decision required** |
| **W5** | Link acquisition + PBN disavow | The actual constraint. Mostly user actions (Search Console). | user executes |

**This plan implements W1–W3.** W4 is specified but gated. W5 is documented, not implemented.

### Why W2 before W3
Both are reachable. W2 is closer to what PhotoVault *is* (guests uploading photos to a gallery),
so it converts; W3 is top-of-funnel that mostly earns links. Shipping the converting page first
means the link-earning pages have somewhere to point.

---

## EXISTING CODE TO REFERENCE (investigated, not assumed)

| What | Where | How it will be used |
|---|---|---|
| Resource page structure | `src/app/resources/gallery-fatigue/page.tsx` (636 lines) | **Template to follow.** Metadata block → `breadcrumbSchema` const → `<script type="application/ld+json">` → page body using `Card`, `Button`, lucide icons. |
| Metadata + canonical convention | every `src/app/resources/*/page.tsx` | Absolute canonical URLs (`https://www.photovault.photo/...`). **Match this** — do not switch to relative, even though `metadataBase` now exists. |
| Breadcrumb JSON-LD shape | all 9 resource pages, inline `breadcrumbSchema` const | There is **no shared helper**. Each page inlines its own. See DECISION 1. |
| Layout-carried metadata for client components | `src/app/photographers/signup/layout.tsx` (created 2026-08-08) | Pattern if any new page must be `'use client'`. New pages should be server components — no layout needed. |
| Downloadable asset precedent | `public/resources/MADISON-PHOTOGRAPHY-GUIDE-2026.pdf` | Where a downloadable template file would live. |
| Sitemap registration | `src/app/sitemap.ts`, `resourcePages` array | **Every new page must be added here.** Currently 57 URLs. |
| Title length helper | `src/lib/directory-seo.ts` (created 2026-08-08) | Directory-specific. Do **not** reuse for resource pages — different template shape. |
| Blog posts | Supabase `blog_posts` table via `src/lib/blog.ts` | **Not used here.** These are static resource pages, not blog rows. Noted so nobody wonders why. |

### Duplication check
- No existing `/resources` index page exists (confirmed: `ls src/app/resources/` shows 9 leaf dirs, no `page.tsx` at root).
- No existing wedding-guest page (confirmed: no match in the 9 resource slugs).
- No shared breadcrumb/schema utility exists to extend (confirmed: `grep -rln BreadcrumbList src/lib src/components` → no results).

---

## DECISIONS TAKEN (stated, not asked)

**DECISION 1 — Extract a shared breadcrumb helper, or keep inlining?**
**Chosen: extract `src/lib/resource-schema.ts` with a `buildResourceBreadcrumb(slug, name)` helper,
use it in the 3 new pages, and do NOT retrofit the existing 9.**
Rationale: the 9 existing pages work; retrofitting them is scope creep with regression risk on
the site's only ranking assets. But writing three *more* copies of a 20-line literal is exactly
the band-aid the user has said he hates. New code uses the helper; old code is left alone and
flagged as a follow-up. This is a deliberate split, not an oversight.

**DECISION 2 — `/resources` as a real page, not a redirect.**
Phase 3 offered "build an index" vs "drop the breadcrumb item". Building it wins: the resource
cluster is the site's best-ranking asset and has no hub, so an index adds internal-link equity
and a crawl path. A redirect would leave the breadcrumb pointing at a 3xx, which is still wrong.

**DECISION 3 — Server components, no `'use client'`.**
These are static content pages. Client components cannot export metadata (the exact problem that
left `/photographers/signup` without a canonical). Keeping them server components avoids needing
a `layout.tsx` per page.

---

## FILES TO CHANGE

### W1 — `/resources` hub
- **New:** `src/app/resources/page.tsx` — index listing all resource pages, grouped.
- **New:** `src/lib/resource-schema.ts` — `buildResourceBreadcrumb()` + `RESOURCES` registry.
- **New:** `src/lib/resource-schema.test.ts` — tests first.
- **Modified:** `src/app/sitemap.ts` — add `/resources` to `resourcePages`, and fix the
  early-return failure mode (see RISK 7).
- **Modified:** `src/components/navigation.tsx` → **the `Footer` component only** (exported at
  line 372). Add one `/resources` link under the existing `<h3>Resources</h3>` heading (line 486),
  beside the leaf links already there (lines 489–504). `Footer` renders from the root layout, so
  this gives `/resources` an inbound link from every page.
  **Without this the hub ships with 3 inbound breadcrumb links and near-zero internal equity,
  which defeats DECISION 2's entire rationale.**

> **PINNED — footer only. The top nav (`Navigation`, lines 42–371) must NOT be touched.**
> Verified: it contains no content links at all (its single `href` is `/auth/signup`, line 206);
> every resource link on the site lives in `Footer`. This is pinned rather than left to
> implementation-time judgement because a top-nav change would trigger the UI Change Routing
> rule in `CLAUDE.md` (UI Expert → plan → critic → approval), which this plan has not been
> through. A footer link-list addition is not a layout change.
>
> `src/components/landing/LandingFooter.tsx` (homepage-only, used at `src/app/page.tsx:149`) is
> **out of scope** — the root-layout `Footer` already covers every page. *(An earlier draft gave
> its path as `src/components/LandingFooter.tsx`, which does not exist.)*

### W2 — wedding-guest photo sharing
- **New:** `src/app/resources/wedding-guest-photo-sharing/page.tsx`
- **Modified:** `src/app/sitemap.ts`, `src/lib/resource-schema.ts` (registry entry)

### W3 — non-legal guide cluster
- **New:** `src/app/resources/photography-invoice-template/page.tsx`
- **New:** `src/app/resources/how-to-start-a-photography-business/page.tsx`
- **Modified:** `src/app/sitemap.ts`, `src/lib/resource-schema.ts`

### Not touched
- The 9 existing resource pages. No retrofit (DECISION 1).
- `src/app/directory/**` — Phase 3.5 concluded no further investment.

---

## STEPS

### W1 — `/resources` hub (fixes 9 broken breadcrumbs)

1. **Test first.** Write `src/lib/resource-schema.test.ts` asserting:
   - `buildResourceBreadcrumb('gallery-fatigue', 'Gallery Fatigue')` produces exactly the
     3-item `BreadcrumbList` shape the existing 9 pages emit (byte-compatible with
     `gallery-fatigue/page.tsx`, so the helper is provably a drop-in).
   - Every entry in the `RESOURCES` registry has a non-empty `slug`, `name`, `description`.
   - No duplicate slugs in the registry.
   - **Registry ↔ filesystem ↔ sitemap consistency** (closes RISK 5, the plan's own top
     mechanical risk — ~8 lines in a file this step already creates):
     - every `RESOURCES` slug has a matching `src/app/resources/<slug>/page.tsx` on disk
       (`fs.existsSync`), and
     - every directory under `src/app/resources/` containing a `page.tsx` appears in `RESOURCES`.
     This fails loudly the moment someone adds a page without registering it, or registers a
     slug that does not exist. *(Dropped from the first revision by oversight; reinstated.)*
   - Run it. **It must fail** (module does not exist).
2. Implement `src/lib/resource-schema.ts`: the `RESOURCES` registry (12 entries — 9 existing +
   3 new) and `buildResourceBreadcrumb()`. Re-run tests → green.
3. Build `src/app/resources/page.tsx`: server component, metadata + canonical
   `https://www.photovault.photo/resources`, a `CollectionPage` + `BreadcrumbList` JSON-LD,
   and a grouped card grid linking all resource pages. Group headings: *Compare Platforms*,
   *Photo Storage*, *For Photographers*, *Guides*.
4. Add `/resources` to `resourcePages` in `sitemap.ts`.
5. Verify: `npm run build`, then confirm `.next/server/app/resources.html` contains the
   canonical, the JSON-LD, and a link to each of the 9 existing pages.

### W2 — wedding-guest photo sharing page

6. Create `src/app/resources/wedding-guest-photo-sharing/page.tsx` following the
   `gallery-fatigue` structure. Target cluster (all verified in Phase 3.5):

   | KD | Vol | CPC | Keyword |
   |---|---|---|---|
   | 10 | 260 | $5.28 | wedding guest photo sharing |
   | 13 | 260 | $5.28 | share wedding photos with guests |
   | 17 | 170 | $5.87 | guests upload wedding photos |
   | 0 | 50 | $4.23 | how to share wedding photos with guests |

   - Title ≤ 60 chars, primary keyword first.
   - `BreadcrumbList` via the helper + `FAQPage` JSON-LD (the SERP shows `people_also_ask`).
   - Content must answer the incumbents honestly. The SERP top-5 is reddit, guestpix,
     theknot, weduploader, guestcam — name them and say what they do well. Phase 3.5's Reddit
     corpus finding stands: a hit piece loses to the thread.
   - Address the verbatim guest-side objection already captured in research:
     *"would not want them to have to download anything."*
7. Register in `RESOURCES` + `sitemap.ts`. Build + verify rendered canonical/schema.

### W3 — non-legal guide cluster

8. `src/app/resources/photography-invoice-template/page.tsx` — targets
   `photography invoice template` (KD 0, 590/mo, $5.51), `photographer invoice` (KD 0, 90/mo,
   $39.37), `photography invoice` (KD 0, 390/mo, $7.25).
   *(Source for all three: `docs/seo/raw/phase35-keyword-universe.json`. These were verified in
   the raw data but were missing from the findings doc until 2026-08-08; the doc has been
   corrected. Do not re-flag them as unsourced.)*
   An invoice is a commercial document, not a legal agreement — outside RISK 1.
   **This is the link-earning page in W3.** It must ship an actual downloadable template asset
   (see `public/resources/` precedent), not just prose about invoicing — the asset is what
   attracts links.
9. `src/app/resources/how-to-start-a-photography-business/page.tsx` — targets
   `how to start a photography business` (KD 0, 1,900/mo, $6.27) and
   `photography business plan` (KD 0, 1,000/mo, $5.20).
10. Register both, add to sitemap, build + verify.

### Verification (applies to every page)

11. `npm run build` must pass.
12. For each new page, assert **programmatically against the built HTML** (a script, not an
    eyeball): exactly one `<link rel="canonical">` with the right absolute URL; `<title>`
    ≤ 60 chars; every `ld+json` block survives `JSON.parse`; the `BreadcrumbList` middle item
    resolves to a page that exists. Print a pass/fail table.
13. **Two bounds in opposite directions, so neither can be satisfied by cheating:**
    - **Upper:** every page file ≤ 500 lines (`seo-skill.md:476`: "Pages/components: max 500
      lines → extract sub-components"). Assert with `wc -l`. Extract into
      `src/components/resources/` as needed. The existing 9 pages run 636–1,399 lines and
      violate this; **new pages will not.**
    - **Lower:** ≥ 1,200 words of rendered body copy per page, measured from the built HTML
      with markup stripped — not from the source file.

    The upper bound alone could be satisfied by thinning the content; the lower bound alone by
    inlining everything. Together they force the intended outcome: substantive copy, extracted
    components. See RISK 2.
14. `npx vitest run`. **Verified baseline as of 2026-08-08:**
    - **189 of 189 tests pass.**
    - **Exactly 1 test *file* fails:** `src/lib/stripe/webhooks/__tests__/current-behavior.test.ts`
      — a `vi.mock` hoisting error ("Cannot access 'mockEmailService' before initialization").
      It fails at *import*, so its tests never run and never count.
    - `src/components/directory/__tests__/seed-data-accuracy.test.ts` **PASSES 8/8 at runtime.**
      An earlier draft of this plan wrongly listed it as a failing test. It is a *type-check*
      defect only (see step 15). Any runtime failure in that file is **NEW and must be fixed**,
      not waved through.
    - Acceptance: new tests green, and the stripe webhook file remains the *only* failing file.
15. `npm run type-check` — exactly 1 pre-existing error is permitted:
    `seed-data-accuracy.test.ts(20,3): error TS2304: Cannot find name 'beforeAll'`.
    Any other error is new and blocks.
16. **UI verification rule applies**: these render visible pages. Ask the user to view
    `/resources` and the new pages in the browser before calling this done. Per project rules I
    will not claim a UI change is working without that confirmation.

---

## RISKS

1. **RISK 1 — Publishing legal documents (W4 gate).** `photo release form` (KD 7, 1,900/mo),
   `photography contract template` (KD 6, 1,300/mo), and `model release form` (KD 5, 1,000/mo)
   are among the highest-volume terms in the cluster, and they are **legal instruments**.
   *(Correction, twice-revised. An earlier draft listed `print release form` as high-volume;
   it is not. Exact figures, each verified in `docs/seo/raw/phase35-keyword-universe.json` —
   these are three DIFFERENT keywords and must not be conflated:*
   - *`photo release form` — **1,900/mo, $3.66, KD 7** (the big one)*
   - *`print release form` — **90/mo, $2.49, KD 0***
   - *`print release form photography` — **50/mo, $1.76, KD 0***

   *The first correction attached the third keyword's figures to the second keyword's name.
   Every number in this plan must be quoted with the exact keyword string it belongs to and
   the raw file it came from.)* Publishing a contract
   template creates real liability if a photographer relies on it and it fails in their
   jurisdiction. lightfolio does this; that is not a reason for PhotoVault to.
   **W4 is gated on an explicit user decision**, and if taken, requires at minimum a prominent
   "not legal advice, consult an attorney, laws vary by jurisdiction" disclaimer and templates
   the user has personally reviewed. **I will not publish legal templates without that decision.**
2. **Thin/duplicate content vs. the 500-line cap.** Three new pages in one push risks looking
   programmatic. But the existing 9 pages are 636–1,399 lines, and `seo-skill.md:476` caps
   pages at 500 — so "match the existing pages" would mean pre-committing to a skill violation.
   **These are not in tension: line count and word count are different things.** A substantive
   page whose FAQ block, comparison table, and CTA are extracted into
   `src/components/resources/` is both long-form *and* under 500 lines. Mitigation: write the
   content first, extract sub-components until the page file is under the cap, verify with
   step 13. **If I cannot write a page that earns its place, I will say so rather than ship
   filler.**
3. **This will not move rankings.** The link constraint dominates. Any post-hoc reading of
   "we shipped SEO pages and nothing happened" must account for W5 never having been done.
   Do not conclude the content failed.
4. **Scope size.** Three substantive pages is a large writing task. If it must be split, the
   dependency order is W1 → W2 → W3, and W1 alone is a shippable unit (it fixes a live defect).
5. **`RESOURCES` registry drift.** Adding a resource page without registering it means it is
   missing from the hub and sitemap. Mitigated by the no-duplicate-slug test and by making the
   registry the single source the hub renders from — but a *new page not added at all* is still
   possible. Accepted; a lint rule is out of scope.
6. **Iron Law 1.** `resource-schema.ts` is real product code and gets tests first (Step 1).
   The page components are **presentation with no branching logic** — a `.tsx` returning static
   JSX has no behaviour a unit test could assert that the build + HTML assertions (steps 11–13)
   do not already prove. The line is logic vs. presentation, not "content is exempt": the moment
   a page contains a conditional, a data fetch, or a computed value, it gets a test. This is the
   same line `src/lib/directory-seo.ts` sits on — the title *logic* is unit-tested, the page that
   renders it is verified by build assertion. *(Precedent is the weakest argument for this; the
   logic/presentation distinction is the actual reason.)*

7. **RISK 7 — `sitemap.ts` silently drops everything on a Supabase error.** `sitemap.ts` has an
   early `return staticPages` in its `locations` error branch, which discards **all** resource,
   conversion, and blog URLs — including every page this plan adds. Registering a page in
   `resourcePages` is therefore not sufficient to guarantee it is ever advertised.
   **Fix in W1 — by restructuring, NOT by widening the early return.** The obvious fix (return
   static + resource + conversion + blog on the error path) is wrong: `getAllPosts()` is called
   *after* the guard, so including `blogPages` would hoist a second Supabase call into the path
   that only runs when Supabase is already failing. If it throws, the whole sitemap route 500s —
   strictly worse than today's partial degradation.

   Correct approach: drop the early return entirely and wrap each DB-dependent block in its own
   `try/catch`, each degrading to `[]` independently. The static, resource, and conversion
   arrays are pure literals and cannot fail. A Supabase outage then costs the city/location
   URLs and possibly the blog URLs, never the hand-written pages.

   Also switch the existing `console.error` in that branch to `logger`
   (`seo-skill.md`: never use `console.log` in production code).

---

## OUT OF SCOPE (explicit)

- Retrofitting the 9 existing resource pages onto the helper (DECISION 1).
- W4 legal templates (gated).
- W5 link acquisition execution (user actions in Search Console).
- Any further `/directory` investment (Phase 3.5: no commercial case).
- The `unlimited photo storage` page (giant-locked, already retracted in Phase 2).

---

## REVISION LOG — response to QA critic (verdict: NEEDS REVISION)

### Accepted and fixed
| # | Critic finding | Verified? | Fix |
|---|---|---|---|
| 1 | Test baseline wrong — 1 failing suite, not 2; `seed-data-accuracy` passes 8/8 at runtime | **Yes** — re-ran: 189/189 tests pass, 1 file fails at import | Steps 14–15 rewritten with the exact verified baseline and an explicit "any other failure is NEW and blocks" |
| 2 | Hub would ship with no nav/footer link, defeating DECISION 2 | **Yes** — no `/resources` link anywhere in nav or footer | `navigation.tsx` + footer added to FILES TO CHANGE |
| 3 | Plan pre-commits to violating the 500-line cap | **Yes** — `seo-skill.md:476` confirmed | Step 13 added (asserted with `wc -l`); RISK 2 rewritten to separate line count from word count |
| 4 | `print release form` is not a high-volume term | **Yes** — 50/mo @ $1.76 | RISK 1 corrected to `photo release form` (1,900/mo) |
| 5 | W1 "hard dependency" overstated | **Yes** | Reframed: the *registry* is the hard dependency; the 404 is a live user-facing defect |
| 6 | W3 "earns links" only half true | **Yes** | Split explicitly: invoice template = link play, business guide = traffic play |
| 7 | `sitemap.ts` early-return silently drops all resource URLs | **Yes** — confirmed in source | New RISK 7 + fix folded into W1 |
| 8 | PBN disavow deferred behind content | **Yes** | Promoted to **W0** |
| 9 | Iron Law 1 justified only on precedent | Fair | RISK 6 rewritten around logic-vs-presentation |

### Checked and REJECTED
| Critic finding | Why rejected |
|---|---|
| `photographer invoice` ($39.37) and `photography invoice` ($7.25) are "not in the evidence" | **The data is real.** Both verified in `docs/seo/raw/phase35-keyword-universe.json` (KD 0 / 90 / $39.37 and KD 0 / 390 / $7.25). The critic checked the findings *doc*, which was incomplete — the raw JSON is the evidence. **Fix applied to the doc, not the plan.** |
| Sitemap "57 URLs" is "not verifiable and likely conflated with 57 images" | **Measured, not inferred.** `grep -c "<loc>" .next/server/app/sitemap.xml.body` returned 57 against a real build on 2026-08-08 (58 before `/cancellation` was removed). The coincidence with the 57-images figure is genuine coincidence. |

### Round 2 — critic verdict APPROVE WITH CONCERNS, 3 blockers. All 3 fixed.
| # | Finding | Verified? | Fix |
|---|---|---|---|
| 1 | The round-1 fix introduced a NEW wrong number: `print release form` is 90/mo @ $2.49, not 50/mo @ $1.76 | **Yes** — `print release form` and `print release form photography` are two different keywords; I attached the second's figures to the first's name | RISK 1 now lists all three release-form keywords with exact figures and their source file |
| 2 | Nav claim was wrong — top nav has NO content links; all 6 resource links are in `Footer` (line 372+); `LandingFooter` path was wrong | **Yes** — top nav's only `href` is `/auth/signup` (line 206); real path is `src/components/landing/LandingFooter.tsx` | FILES TO CHANGE now **pins footer-only** and explicitly forbids touching the top nav, which would trigger the UI Change Routing gate |
| 3 | Round-1 silently dropped the registry↔sitemap↔filesystem consistency test | **Yes** — Step 1 was byte-identical to round 1 | Reinstated in Step 1; closes RISK 5 |

Also adopted from round 2: a **≥1,200-word floor** in Step 13 (so the 500-line cap cannot be met
by thinning), and the **RISK 7 restructure** — the critic correctly caught that my proposed fix
would hoist a second Supabase call onto the failure path and could 500 the whole sitemap route.

**Both round-1 rejections were confirmed correct by the critic on re-check** (it had not opened
`docs/seo/raw/`, and `.next/` did contain the 57-URL artifact).

### Standing critic points NOT actioned (deliberate)
- *"Is content the right use of effort at all before link acquisition?"* — Partly actioned via W0.
  The rest stands as stated: W5 is the constraint, and this plan says so in three places rather
  than implying content will fix it. But link acquisition needs *something worth linking to*,
  and W1–W3 build that. Sequencing content behind links would deadlock.

---

## APPROVAL REQUIRED BEFORE PROCEEDING
