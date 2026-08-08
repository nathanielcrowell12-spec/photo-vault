# PhotoVault Keyword Research — August 2026

**Source:** DataForSEO Google Ads `search_volume/live` + `keywords_for_keywords/live`
**Run date:** 2026-08-07 · **API spend:** $0.36 · **Scripts:** `scripts/seo/keyword-research.js`, `scripts/seo/analyze.js`
**Raw data:** `docs/seo/raw/*.json`

> Volumes below are Google Ads **cluster** volumes. Google buckets close variants and reports
> the pool's volume on every member. Never sum them. "Pools" = distinct `(volume, cpc)` groups
> and is the honest opportunity count.

---

## Headline finding

**The national SaaS market is roughly 100x the Madison local market, and most of the site's
build effort went to the small one.**

| Market | Real demand | Pages built |
|---|---|---|
| Madison local directory | 7 distinct pools; the entire location long-tail is **one ~10/mo pool** | **30 location pages + 2 city pages** |
| National photographer SaaS | 17 distinct pools, top term **8,100/mo**, CPCs to **$17.26** | 9 resource pages |

The 30 hand-built `/directory/madison/*` location pages — the site's largest content
investment — target a keyword cluster worth about **10 searches per month at $0.00 CPC.**

---

## A. Madison local — seeded keywords

15 keywords with volume → **13 distinct pools**.

| Score (vol×CPC) | Volume | CPC | Keyword |
|---|---|---|---|
| 794 | 210 | $3.78 | madison photographers |
| 680 | 170 | $4.00 | madison wedding photographer *(cluster of 2)* |
| 107 | 40 | $2.67 | madison family photographer |
| 101 | 30 | $3.35 | senior pictures madison wi |
| 100 | 20 | $5.02 | engagement photos madison wi |
| 0 | **170** | **$0.00** | olbrich botanical gardens photos |
| 0 | **70** | **$0.00** | memorial union terrace photos |
| 0 | 10 | $0.00 | photography locations madison wi |

**Read this carefully:** the location pages *do* have volume — "olbrich botanical gardens
photos" is 170/mo — but at **$0.00 CPC**. That is Google telling us nobody bids on these
because the searcher is looking at pictures, not hiring anyone or buying software. It is
informational traffic with no commercial intent.

The commercial local terms ("madison photographers", 210/mo @ $3.78) point at
`/directory/photographers`, not at the location pages.

## B. USA national — seeded keywords

21 keywords with volume → **17 distinct pools**. This is where the money is.

| Score (vol×CPC) | Volume | CPC | Keyword | Page today |
|---|---|---|---|---|
| **39,204** | **8,100** | $4.84 | unlimited photo storage | none (closest: photo-storage-guide) |
| 3,280 | 1,600 | $2.05 | pixieset pricing | vs-pixieset (not pricing-targeted) |
| 2,850 | 590 | $4.83 | google photos alternative(s) | ✅ google-photos-alternatives |
| **1,899** | 110 | **$17.26** | photographer client gallery | none |
| 1,365 | 140 | $9.75 | photo sharing for photographers | none |
| 949 | 140 | $6.78 | shootproof pricing | vs-shootproof (not pricing-targeted) |
| 923 | 140 | $6.59 | pixieset alternative(s) | ✅ vs-pixieset |
| 468 | 70 | $6.69 | how to deliver photos to clients | none |
| 432 | 50 | $8.64 | photo storage for photographers | ✅ photo-storage-guide |
| 313 | 50 | $6.26 | long term photo storage | partial |
| 274 | 20 | $13.68 | pic-time alternative(s) | ✅ vs-pictime |
| 271 | 40 | $6.77 | photography business software | none |
| 134 | 10 | $13.42 | photographer gallery hosting | none |
| 0 | 390 | $0.00 | digital photo storage service | none |

## C. Madison local — discovered ideas

17 keywords → **only 7 distinct pools.** Seven of those keywords share a single
**10/mo @ $0.00** pool: `photography locations madison wi`, `best photo spots in madison wi`,
`best wedding photographers madison wi`, `engagement photo locations madison wi`,
`indoor photography locations madison wi`, `madison area wedding photographers`,
`wedding photographers near madison wi`.

Nothing new of value surfaced. The Madison market is genuinely small and already covered.

## D. USA national — discovered ideas

Only 6 returned (narrow seeds — a limitation of this run), but two are notable gaps:

| Score | Volume | CPC | Keyword |
|---|---|---|---|
| 686 | 50 | **$13.72** | websites like pixieset |
| 140 | 20 | $6.99 | alternatives to pixieset |
| 43 | 10 | $4.25 | pixieset free alternative |

---

## What the data says to do

1. **Stop expanding the location directory.** It is informational traffic at $0 CPC. Keep the
   30 pages (they cost nothing to keep, and they do pull 170/mo-class informational visits),
   but do not build more, and do not spend on more cities on this evidence.
2. **The comparison-page strategy is validated** — `pixieset alternative` (140/mo @ $6.59),
   `pic-time alternative` (20/mo @ $13.68) all have real, high-CPC demand and PhotoVault
   already ranks pages at them. This was a good bet.
3. **Biggest untapped term: `unlimited photo storage`, 8,100/mo.** No dedicated page exists.
4. **Highest-value term: `photographer client gallery`, $17.26 CPC.** No page exists. Low
   volume, but CPC is the market pricing a click at seventeen dollars.
5. **Competitor *pricing* queries are unclaimed** — `pixieset pricing` 1,600/mo and
   `shootproof pricing` 140/mo. The vs- pages exist but aren't built to answer "what does
   Pixieset cost."

---

# Wide national sweep + Phase 2 SERP (same run date)

**Additional spend:** $0.90 (10 seed groups, 1,031 unique keywords) + $0.152 (38 SERPs).
**Cumulative: $1.41.** Scripts: `expand-seeds.js`, `analyze-wide.js`, `pool-check.js`,
`serp-check.js`, `analyze-serp.js`.

## CORRECTION to the Phase 1 conclusions

Two Phase 1 recommendations do not survive the wider data. Recording both:

1. **"`unlimited photo storage`, 8,100/mo, is the biggest untapped term" — withdrawn.**
   Its SERP is **giant-locked**: Amazon, Dropbox, Shutterfly, SmugMug hold the top 5.
   PhotoVault will not rank there. Do not build this page.
2. **`cloud storage for photographers` at 135,000/mo is not real.** `pool-check.js` shows it
   shares an identical `(135000, $4.74)` pool with `cloud storage for photos` and
   `cloud based photo storage`. That is generic consumer demand wearing a photographer
   costume. Same contamination hits `storage for photographers` (12,100) and
   `best cloud storage for photographers` (2,400). **14 contaminated pools total; 93
   photographer keywords are clean.**

## The blunt result

**photovault.photo appears in the top 20 for 0 of 38 keywords tested.** Zero organic
presence on any commercial term, national or local.

## Who actually owns these SERPs

| Appearances in top 5 (of 38 keywords) | Domain |
|---|---|
| **35x** | reddit.com |
| 19x | pixieset.com |
| 17x | facebook.com |
| 7x | lightfolio.com · picdrop.com · dropbox.com |
| 6x | themframes.com |
| 4x | pic-time.com |

**The primary competitor for this niche is Reddit, not Pixieset.** Reddit holds a top-5 slot
on 92% of tested keywords. That is good news: a genuine, specific answer page outranks a
forum thread far more often than it outranks a funded SaaS homepage.

## Winnable targets, ranked

These are **clean** (uncontaminated) pools with real CPC whose SERPs are open or
community-held — i.e. Reddit/Facebook rank, so a real page can displace them.

| Vol | CPC | Keyword | Who holds top 5 | Page today |
|---|---|---|---|---|
| 110 | **$17.26** | photographer client gallery | pixieset, pic-time, reddit, lightfolio | none |
| 30 | **$24.01** | client photo gallery for photographers | pixieset, pic-time, reddit, lightfolio | none |
| 40 | $12.54 | photography client gallery | pixieset, pic-time, reddit, lightfolio | none |
| 30 | **$23.03** | photo proofing website / site | reddit, pixieset, zenfolio, aftershoot | none |
| 70 | $6.69 | how to deliver photos to clients | **reddit, facebook**, dropbox, ppa | none |
| 10 | **$45.84** | how to deliver digital photos to clients | **reddit, facebook**, picdrop, dropbox | none |
| 40 | **$20.05** | best way for photographers to share photos with clients | pixieset, reddit, facebook | none |
| 10 | **$69.73** | website for photographers to upload photos for clients | pixieset, reddit, lightfolio, facebook | none |
| 140 | $10.00 | free client gallery for photographers | pixieset, cloudspot, reddit | none |
| 140 | $9.75 | photo sharing for photographers | pixieset, reddit, picdrop, facebook | none |

**Pattern:** every one of these is a "how do I get photos to my client" query. PhotoVault has
comparison pages (vs-pixieset, vs-shootproof, vs-pictime) but **no page for the job itself.**

## The unclaimed cluster nobody noticed: wedding guest photo sharing

| Vol | CPC | Keyword | Top 5 |
|---|---|---|---|
| 260 | $5.28 | share wedding photos with guests | reddit, guestpix, boho-weddings, weduploader, guestcam |
| 170 | $5.87 | guests upload wedding photos | reddit, guestpix, theknot, weduploader |

Held only by small single-purpose apps and Reddit — no incumbent SaaS. PhotoVault has no page
here at all. (`wedding photo sharing`, 320/mo, is pool-contaminated — discount it.)

## Competitor pricing terms: harder than Phase 1 implied

`pixieset pricing` — 3 of the top 5 are pixieset.com's own pages. `shootproof pricing` — 2 of 5
are shootproof.com. **But** `picflow.com` ranks #5 on *both*, which proves a third-party
comparison page can break in. Worth trying, not a quick win.

## Madison local: local pack on 3 of 4

`madison photographers`, `madison wedding photographer`, and `photography locations madison wi`
all show a **local_pack** — a Google Business Profile surface an organic directory page cannot
occupy. Organic top 5 is individual photographer sites, Instagram, Yelp, The Knot, WeddingWire.
`olbrich botanical gardens photos` is owned by olbrich.org, Facebook, Instagram, visitmadison,
and Wikipedia, with **8 SERP features** crowding organic results down the page.

This reinforces the Phase 1 read: the location pages are not going to produce commercial traffic.

---

# The Reddit corpus (the customer-research layer)

**Spend:** +$0.088 (22 SERPs, URLs captured). **Cumulative: $1.50.**
Script: `reddit-threads.js`. Raw: `docs/seo/raw/reddit-threads.json`, `niche-competitors.json`.

Only **11 unique threads** carry the entire high-value keyword cluster. One thread ranks #1
for five of our target keywords. This is a small, knowable corpus — not a vague "Reddit is big."

| Best rank | Ranks for | Thread |
|---|---|---|
| #1 | **5 keywords** | What website do you use to share photos with Client? (r/photography) |
| #3 | 4 | Best Websites for client galleries and printing to order |
| #1 | 4 | Best place for sharing photos with client |
| #1 | 2 | Client Proofing galleries |
| #1 | 1 | Pixieset Alternative? |
| #1 | 1 | Pixieset / Pic-Time Self-hosted alternative for Wedding Photographer |
| #1 | 1 | How did you distribute wedding photos to guests? (r/weddingplanning) |
| #1 | 1 | Best website for having guests share photos? (r/wedding) |
| #1 | 1 | Photographers, what storage do you use? (r/PhotographyAdvice) |

## What photographers actually say (verbatim from the ranking snippets)

**1. Mobile download friction is the number-one complaint — and it is a product requirement,
not a copy problem.**
> "I've been using CloudSpot, but many people find it frustrating downloading the images on
> their phones."

And from the couples' side:
> "Ideally would not want them to have to download anything & would want it to be easy to use
> and intuitive"

Two different audiences, same complaint, top-ranked threads for both. If PhotoVault's mobile
download path is not obviously better than CloudSpot's, no page will save it.

**2. Price sensitivity is the stated reason people leave Pixieset.**
> "I'm a photographer looking for alternatives to Pixieset. It's a solid platform, but I'm
> trying to cut costs..."
> "...deliver to clients instead of paying $20/mo"

**This cuts against PhotoVault's $22/month.** The people searching "pixieset alternative" are
explicitly leaving a ~$20/mo product to spend less. A comparison page that leads on features
walks into that objection; one that leads on the 50% commission (photographer *earns*, not just
pays) reframes it. Flagged as a real tension, not a copy tweak.

**3. The low-end competitor is WeTransfer, not Pixieset.**
> "If just delivering, use WeTransfer. There's free (up to 2GB attachments) or paid versions
> for about $80/yr"

Any "why not just use WeTransfer / Dropbox / Google Drive" objection must be answered head-on.
It is the top-voted advice in a #1-ranking thread.

**4. Pixieset is genuinely liked — do not trash it.**
> "Pixieset is fantastic. Has more aesthetic options (how your galleries look) than many current
> options, lots of security functions..."

The audience respects it. An honest comparison that concedes this earns trust; a hit piece
loses to the thread.

**5. Consumers conflate storage with delivery — and that is PhotoVault's client-side wedge.**
> "How do you manage to store 100+gigs of photos and videos on the cloud? Any cheaper storage
> with reliable other than googlephotos and oneDrive"
> "I upgraded to 100gb on Google Photos..."

This maps directly onto PhotoVault's existing "keep every photo forever" positioning.

## Niche competitors worth knowing (top 10, excluding Reddit/FB/giants)

| Hits | Domain | Where |
|---|---|---|
| 11x | lightfolio.com | every client-gallery query |
| 10x | picdrop.com | delivery + proofing queries |
| 7x | cloudspot.io | client-gallery queries |
| 6x | zenfolio.com | proofing queries |
| 4x | fast.io · pic-time.com | client-gallery queries |
| 3x | passgallery · fotostudio.io · guestcam.co · themframes.com | scattered |

**lightfolio.com and picdrop.com outrank PhotoVault everywhere and are not in any comparison
page.** They are the actual organic competition, more than ShootProof.

## Current-discussion layer: NOT OBTAINED

The `last30days` engine ran twice and failed to produce usable current data:
- Reddit keyless path returned **HTTP 429 (rate limited)** after 5 and 6 items respectively
- Web backend **unreachable** (no Brave/Exa/Serper key configured)
- X and YouTube inactive (no browser cookies found on Windows; `yt-dlp` not installed)
- Surviving clusters were unrelated hobby GitHub repos (lumispixel, Watermark)

**Do not read this as "there is no current discussion."** It is a tooling failure, not a
finding. To get this layer later: install `yt-dlp`, log into x.com in Firefox (only Firefox is
supported on Windows), and/or add a `BRAVE_API_KEY` for the web lane.

---

---

# Phase 3 — On-page crawl

**Spend:** +$0.015 (`on_page` Standard crawl, 64 pages). **Cumulative: $1.515.**
Scripts: `onpage-audit.js`, `analyze-onpage.js`. Raw: `docs/seo/raw/onpage-*.json`.

**onpage_score: 96.16 / 100.** Zero duplicate titles, zero duplicate descriptions, zero
duplicate content, zero non-indexable pages. The site is technically clean. The defects below
are specific and few.

## Defect 1 — `/resources` is a 404, and every resource page's breadcrumb points to it

`GET https://www.photovault.photo/resources` → **404**. There is no `/resources` index page.

But all 9 resource pages emit `BreadcrumbList` JSON-LD whose middle item is:
```json
{"@type":"ListItem","position":2,"name":"Resources","item":"https://www.photovault.photo/resources"}
```

So every comparison page — the pages Phase 2 proved are PhotoVault's best-ranking asset — ships
structured data pointing at a dead URL. This is the highest-value fix on the site: it is
cheap, unambiguous, and it degrades the exact pages that already work.

**Two valid fixes:** build a real `/resources` index (also captures internal-link equity and
gives the 9 pages a hub), or drop the middle breadcrumb item. Building the index is better —
Phase 2 showed the resource cluster is the winning asset and it currently has no hub page.

## Defect 2 — 4 pages missing a canonical

`/resources` (404), `/photographers/commission-details`, `/photographers/signup`, `/cancellation`.

Plus **`/directory`**, which the crawler did not flag but a direct fetch confirms has no
`rel="canonical"` at all. Phase 0's finding stands — verified twice.

## Defect 3 — `/cancellation` is in the sitemap but redirects to `/login`

`sitemap.ts` lists `/cancellation` at priority 0.3. Live, it 302s to
`/login?redirectTo=%2Fcancellation`. A sitemap should not advertise auth-gated URLs. Remove it.

## Defect 4 — 40 titles over 65 characters

Nearly all are directory location pages built from one template:

> `{Location} - Photography Location in {City} | PhotoVault Directory` — 66 to **110** chars

Worst: `/directory/madison/hilldale-shopping-center` at 110 chars, and
`/blog/madison-photographers-add-50-100` at 106.

Google truncates around 60. Suggested template:
`{Location} Photos — {City}, WI | PhotoVault` (~45 chars).

Note the strategic caveat: Phase 1/2 showed these pages target ~10 searches/month at $0.00 CPC.
Fixing 40 titles here is a template one-liner, so it is worth doing, but it is **not** a
traffic lever. Do not mistake it for one.

Also over-length and worth hand-editing, because these pages actually matter:
`/pricing` (68), `/features` (75), `/photographers` (67), and 4 `/resources/*` pages (67-73).

## Defect 5 — thin content on the directory hub pages

| Page | Words |
|---|---|
| `/directory/photographers` | **28** |
| `/directory/madison` | **38** |
| `/directory/middleton` | **38** |
| `/directory` | 68 |
| `/blog` | 112 |
| `/contact` | 117 |

The city pages carry 38 words *and* zero structured data (Phase 0). They are the weakest pages
on the site by both measures.

## Minor

- `/login` (and its redirect variant) inherits the generic root description — flagged
  `irrelevant_description`. `/login` should arguably be `noindex` anyway.
- `/privacy` and `/terms` titles flagged too short. Harmless; ignore.
- 3 broken links, 1 of them the `/resources` breadcrumb above.
- 57 images lack a `title` attribute — low priority; `alt` is what matters for SEO and the
  crawl did not flag missing alt text.

---

## Revised recommendation

1. **Build one strong "deliver photos to clients" page** targeting the client-gallery /
   delivery cluster. It is the highest-CPC, most-open, most on-strategy gap.
2. **Build a wedding-guest-photo-sharing page.** Genuinely unclaimed by any incumbent.
3. **Do not build** `unlimited photo storage` or any generic cloud-storage page.
4. **Do not expand** the location directory.
5. Fix the three Phase 0 technical defects regardless — they are cheap and unambiguous.

---
---

# Phase 3.5 — Research completion (2026-08-08)

**Spend:** +$1.582. **Cumulative: $3.097.** Balance after: ~$41.81.
**Plan:** `docs/claude/plans/seo-research-completion-phase-3.5-plan.md`
**Scripts:** `probe.js`, `backlink-gap.js`, `backlink-verify.js`, `competitor-keywords.js`,
`kd-fill.js`, `serp-verify.js`, `analyze-universe.js`, `analyze-localpack.js`
**Raw:** `docs/seo/raw/phase35-*.json`, `serp-verify.log`

Phases 0–3 answered "what should we rank for." They never answered **"why do we rank for
nothing."** That question had an unexamined answer, and it changes the plan.

## THE ROOT CAUSE: photovault.photo has no link profile

| Domain | Domain rank | Referring domains | Backlinks |
|---|---|---|---|
| **photovault.photo** | **0** | **4** | **4** |
| lightfolio.com | 373 | 961 | 23,210 |
| cloudspot.io | 368 | 977 | 18,578 |
| picdrop.com | 480 | 6,379 | 171,280 |
| pic-time.com | 503 | 13,027 | 702,780 |
| pixieset.com | 602 | 122,869 | 5,243,295 |

**240x behind the weakest competitor. 1,595x behind the median.**

And all four links are junk — there is not one editorial link:

| Type | Domain | Note |
|---|---|---|
| dofollow, spam 60 | ggmap.us.com | A PBN. Its anchor text is literally an advert for buying backlinks. |
| nofollow, spam 50 | ready.pro | scraper |
| nofollow, spam 60 | www.onwebdirectory.com | scraper directory |
| nofollow, spam 50 | screenshots.wiki | scraper |

**This is why the site ranks for nothing.** It is a 96.16/100 on-page score attached to a
domain Google has no reason to trust. The Phase 4 fix list (canonicals, `metadataBase`,
titles, breadcrumbs) is correct hygiene and worth shipping — but **none of it will produce
rankings**, and it must not be presented as if it would.

> The single dofollow link is a PBN that PhotoVault did not build. It is the reason the
> profile carries a spam score of 55 on only four links. Worth a Search Console disavow.

## Phase 2's "winnable" list does not survive difficulty scoring

Phase 2 ranked targets by CPC and by eyeballing who held the top 5. With keyword difficulty
attached, most of that list is out of reach for a domain-rank-0 site:

| KD | Vol | CPC | Keyword | Verdict |
|---|---|---|---|---|
| **54** | 40 | $12.54 | photography client gallery | out of reach |
| **49** | 10 | $69.73 | website for photographers to upload photos for clients | out of reach |
| **39** | 110 | $17.26 | photographer client gallery | out of reach |
| **37** | 30 | $24.01 | client photo gallery for photographers | out of reach |
| **35** | 140 | $10.00 | free client gallery for photographers | out of reach |
| **33** | 140 | $9.75 | photo sharing for photographers | out of reach |
| **31** | 40 | $20.05 | best way for photographers to share photos with clients | out of reach |
| **28** | 30 | $23.03 | photo proofing website | stretch |
| **18** | 70 | $6.69 | how to deliver photos to clients | reachable on KD… |

…but SERP ground truth kills the last one too: `how to deliver photos to clients` top 5 is
**pixieset, reddit, facebook, dropbox, picdrop**. High KD or incumbent-held — either way, the
previous session's headline recommendation ("build one strong deliver-photos-to-clients page")
is **not the best first move.** Recording this as a correction, not a refinement.

## What IS reachable — and it was hiding in the competitor's own site

`relevant_pages` on lightfolio.com shows where its traffic actually comes from:

| Est. traffic | Keywords | Page |
|---|---|---|
| 3,787 | 278 | `/` (homepage) |
| **1,540** | **83** | **`/photography-contracts`** |
| 718 | 19 | `/guides/commercial-photography` |
| **707** | **27** | **`/photography-invoices`** |
| **671** | **19** | **`/wedding-photography-contract`** |
| 326 | 64 | `/mini-sessions/christmas` |
| 279 | 23 | `/contracts/print-release` |

**lightfolio's #2 through #7 traffic pages are free photographer business templates — not
product pages.** picdrop's engine is the same shape: `/web/articles/*` guides, including
`best-way-to-share-photos-with-clients`.

That cluster is nearly unguarded on difficulty:

| KD | Vol | CPC | Keyword |
|---|---|---|---|
| 0 | 1,900 | $6.27 | how to start a photography business |
| 0 | 1,000 | $5.20 | photography business plan |
| 0 | 720 | $9.05 | proofing images |
| 0 | 590 | $5.51 | photography invoice template |
| 0 | 480 | $6.71 | wedding photography contract |
| 0 | 390 | $7.25 | photography invoice |
| 0 | 140 | $17.63 | photography workflow software |
| 0 | 90 | $39.37 | photographer invoice |
| 0 | 50 | $5.08 | second shooter contract |
| 0 | 50 | $1.76 | print release form photography |
| 0 | 40 | $1.46 | photography pricing guide template |
| 0 | 20 | $30.15 | mini session contract |
| 5 | 1,000 | $4.36 | model release form |
| 6 | 1,300 | $6.38 | photography contract template |
| 7 | 1,900 | $3.66 | photo release form |

> Source for every row: `docs/seo/raw/phase35-keyword-universe.json` and
> `docs/seo/raw/phase35-kd-fill.json`. Note that `print release form photography` is only
> **50/mo at $1.76** — it is one of the *smallest* terms in this cluster, not one of the
> largest. The large release-form term is `photo release form` (1,900/mo, KD 7), which is a
> different keyword. Do not conflate them.

**SERP ground truth confirms these are genuinely open.** The top 5 for this cluster is full of
solo photographers' own blogs — `jentilleyphotography.com`, `brennaheater.com`,
`taileephotography.com`, `catieronquillo.com`, `meagannelson.com`, `nicoledaackephotography.com`.
Sites with a fraction of pixieset's authority rank #1 here. That is the proof that these SERPs
reward the page, not the domain — which is exactly what a domain-rank-0 site needs.

This also happens to be the fastest legitimate way to *earn* the links the site is missing:
free templates and forms are the most-linked-to asset type in this niche.

## The wedding-guest cluster survives — it is the one Phase 2 pick that holds up

| KD | Vol | CPC | Keyword |
|---|---|---|---|
| 10 | 260 | $5.28 | wedding guest photo sharing |
| 13 | 260 | $5.28 | share wedding photos with guests |
| 17 | 170 | $5.87 | guests upload wedding photos |
| 0 | 50 | $4.23 | how to share wedding photos with guests |

Top 5 is reddit + tiny single-purpose apps (guestpix, weduploader, guestcam, theknot). No
incumbent SaaS, low KD, real CPC. **Confirmed as a build target.**

## Local: the last argument for the location directory is gone

3 of 4 Madison terms carry a `local_pack` — a Google Business Profile surface. PhotoVault is a
SaaS platform, not a Madison photography business, and cannot legitimately claim a GBP listing.
`olbrich botanical gardens photos` has **8 SERP features** crowding organic down the page.
Combined with the $0.00 CPC finding, there is no commercial case for further location pages.

## CORRECTIONS to earlier findings

1. **`/cancellation` was NOT missing a canonical.** It has had one all along
   (`src/app/cancellation/page.tsx`). The Phase 3 crawler followed the 302 to `/login` and
   never saw the page. Phase 3 Defect 2 was a false positive on that URL.
2. **"Highest-value term: `photographer client gallery` ($17.26 CPC)"** — withdrawn. KD 39.
3. **"Build one strong deliver-photos-to-clients page" as the #1 move** — demoted. The term is
   KD 18 but incumbent-held, and it is not where the reachable traffic is.

## STILL BLOCKED (tooling, not a finding)

The current-discussion layer remains unobtained. This session added a third failure mode:
`WebFetch` refuses reddit.com outright, and the public `.json` endpoint returns **HTTP 403**
to direct requests. Combined with last session's 429s, there is no working Reddit path.

**Do not read this as "there is no current discussion."** To unblock: register a free Reddit
API app for credentials, add a `BRAVE_API_KEY`, install `yt-dlp`, or add a ScrapeCreators key.

## REVISED RECOMMENDATION

1. **Treat link acquisition as the primary constraint.** Nothing else moves rankings until the
   domain has editorial links. Disavow the ggmap.us.com PBN link.
2. **Build the free-template cluster first** (contract, invoice, model release, print release).
   KD 0–7, proven format in this exact niche, and the most linkable asset type available.
3. **Build the wedding-guest photo sharing page.** KD 10–17, no incumbent SaaS.
4. **Do not** build a generic client-gallery page yet — KD 33–54.
5. **Do not** build `unlimited photo storage` (giant-locked) or expand the location directory.
6. **Ship the on-page hygiene fixes** — cheap and correct — but do not expect ranking movement
   from them.
