# PhotoVault Launch Strategy v2 — Distribution-First Playbook
## From 1 Photographer to General Availability

**Created:** 2026-02-19 | **Updated:** 2026-03-15 (v2 — timeline reset, product blockers resolved)
**Timeline:** 12 weeks (March 17 — June 8, 2026)
**Starting point:** 1 real photographer, 1 self-funded client, product working end-to-end
**Target:** 30+ photographers, 10+ paying clients, positive unit economics
**Budget:** $0 ad spend — organic only until Phase 5

> **v2 Note:** The original plan (Feb 19) was never executed due to building energy going to other projects. Since then, key product blockers have been resolved: payment page fixed, blog CMS launched, PostHog analytics flowing, drip emails live. The strategy is sound — the gap was execution. This version resets the clock and removes solved blockers.

---

## Situation Assessment (March 15, 2026)

### The Honest Numbers
- **1 real photographer** signed up organically
- **1 client** (Nate's wife — self-funded, proves the payment flow works)
- **0 warm outreach executed** — strategy docs written, never acted on
- **Social media activity only** — no direct asks, no Reddit, no community engagement
- **Product live since Oct 2025** (~5 months)

### What's Ready (Product Is No Longer the Bottleneck)
- [x] Payment page working (Stripe checkout functional)
- [x] Post-signup drip emails live (photographer Day 1/3/7/14, client Day 1/3/7)
- [x] Competitor comparison page live at `/resources/photovault-vs-pixieset`
- [x] Blog CMS operational (admin uploads .md files, no redeploy)
- [x] PostHog analytics flowing on production
- [x] Desktop app handles large gallery uploads
- [x] Stripe Connect live — commissions work
- [x] CAN-SPAM compliant email system (Resend)

### What's NOT Built (But Not Blocking Outreach)
- Hero photo memory emails (Phase 4 — needs hero photo selection UI)
- Google auth (nice-to-have, not blocking)
- Referral program (Phase 4)
- Passive income calculator free tool (Phase 3)

### The Core Insight
PhotoVault is a two-sided marketplace. But at this stage, **you only need to market to one side.** Photographers bring their OWN clients. Every minute of marketing should target photographers until you have 20+. Client-side marketing comes later (if ever — photographers ARE the distribution).

---

## The ORB Channel Strategy

### Owned (Invest Most Here — Compounds Over Time)

| Channel | Status | Priority |
|---------|--------|----------|
| **Email list** | Drip sequences live | Grow via blog + free tool |
| **Blog** | CMS live, 1 article | 2 articles/month targeting photographer keywords |
| **Website** | Live, payment working | Add social proof as testimonials arrive |
| **Product** | Working end-to-end | Focus on photographer onboarding smoothness |

### Rented (Use to Funnel to Owned)

| Channel | Status | Priority |
|---------|--------|----------|
| **Reddit** | Strategy doc exists, 0 karma | Execute Reddit Strategy — karma first |
| **Facebook Groups** | Not started | Join Madison photographer groups |
| **LinkedIn** | Not started | Founder journey posts |
| **Instagram** | Some activity | Continue, lower priority than direct channels |

### Borrowed (Highest Leverage Per Minute)

| Channel | Status | Priority |
|---------|--------|----------|
| **WPPA** | Not contacted | Attend next event, offer to present |
| **Twig & Olive** | Not contacted | Phase 4 — need proof points first |
| **Photography podcasts** | Not started | Phase 5 |
| **Local meetups** | Not started | Find Madison photography meetups |

---

## Phase 1: Warm Network Activation (Weeks 1-3, Mar 17 — Apr 6)

**Goal:** 5-8 photographers with accounts, 3+ with real galleries uploaded.
**Time budget:** 5-7 hrs/week — ALL on outreach and onboarding support.

> Warm outreach converts at 20-40%. Cold channels convert at 1-3%. With limited time, start with the highest ROI activity.

### Actions

- [ ] Talk to Kailyn — get her 2-3 photographer contacts
- [ ] List every photographer you personally know or have used
- [ ] List every photographer Kailyn knows (beyond her top 2-3)
- [ ] List friends/family who know photographers (ask them to intro)
- [ ] **Goal: identify 15 warm/warm-ish leads total**
- [ ] Send outreach messages — use templates from `PhotoVault_Beta_Warm_Outreach_Messages.md`:
  - Kailyn sends **Version A** to her contacts
  - You send **Version B** to your contacts
  - You send **Version C** (email/LinkedIn) to warm-ish contacts (local photographers found via Instagram/Google)
- [ ] Follow up with non-responders after 3-5 days using **Version D**
- [ ] For each "yes": personally walk them through signup + first gallery upload (call or screen share)
- [ ] For each "not now": ask if they know anyone else (referral chain)
- [ ] Ask your 1 existing photographer: "Would you be willing to introduce me to another photographer?" (warm referral)

### Weekly Rhythm (Phase 1)

| Day | Activity | Time |
|-----|----------|------|
| Mon | Identify leads, draft messages | 1 hr |
| Tue | Send outreach (3-5 messages) | 45 min |
| Wed | Follow up on responses, schedule onboarding calls | 45 min |
| Thu | Onboard anyone who said yes (call/screen share) | 1 hr |
| Fri | Follow up with non-responders, ask for referrals | 45 min |
| Weekend | Light — check if new signups are stuck | 30 min |

### Success Metrics

| Metric | Target |
|--------|--------|
| Warm outreach sent | 15+ |
| Positive responses | 5-8 |
| Photographers with accounts | 5-8 |
| Photographers with real galleries | 3+ |
| Client invites sent by photographers | 2+ |

### Risk / Mitigation
- *Warm network is too small:* Ask each contact for 2 referrals. Expand to Kailyn's full network. Search Instagram for Madison photographers.
- *Photographers sign up but don't upload:* Follow up within 48 hrs. Offer a 15-min onboarding call. Make it dead simple.
- *Nobody says yes:* You need to figure out WHY before moving to cold channels. Interview the "no" responses — is it the pitch, the product, or the timing?

**Minimum viable action if time is crushed:** Send outreach to Kailyn's contacts and personally onboard whoever says yes.

---

## Phase 2: Community Seeding + Reddit Foundation (Weeks 4-6, Apr 7 — Apr 27)

**Goal:** 10-15 total photographers. Reddit karma 100+. First organic inbound signup.
**Time budget:** 5-7 hrs/week — split between Reddit, Facebook, and follow-ups.

### Actions

- [ ] Create Reddit account: `u/PhotoVaultNate` or similar branded handle
- [ ] Set up profile per **Reddit Strategy** doc (bio, avatar)
- [ ] Join target subreddits: r/photography, r/WeddingPhotography, r/photobusiness, r/AskPhotography, r/madisonwi
- [ ] **Karma building (weeks 4-5):** Post 2-3 genuinely helpful comments per day. NO PhotoVault mention. Pure value.
- [ ] Join 1-2 Madison Facebook photography groups — comment helpfully for one week before any platform mention
- [ ] Collect feedback from Phase 1 photographers: What do they love? What's broken? Get 1-2 direct quotes.
- [ ] Continue warm outreach to remaining leads from Phase 1 list
- [ ] Ask Phase 1 photographers for referrals ("Know anyone else who'd want to try this?")
- [ ] **Week 6:** If karma 75+, post to r/SideProject (template in Reddit Strategy doc)
- [ ] Research WPPA event calendar — plan to attend next one

### Content to Create

- [ ] 1 blog article: "How Photographers Can Build Recurring Revenue from Past Clients"
- [ ] Share article in relevant Reddit threads (as a helpful resource, not promotion)
- [ ] Add first testimonial quote to homepage (even 2 sentences from your 1 photographer)

### Success Metrics

| Metric | Target |
|--------|--------|
| Total photographers | 10-15 |
| Reddit karma | 100+ |
| Reddit helpful comments | 20+ |
| Facebook group comments | 5+ |
| Usable testimonial quotes | 2+ |
| Inbound signups (no direct ask) | 1+ |

### Risk / Mitigation
- *Reddit shadowban:* Follow 90/10 rule strictly. No PhotoVault mentions for first 2 weeks. Check visibility from logged-out browser.
- *Facebook groups remove posts:* Lead with value. Ask mods before posting anything with a link.
- *Nobody gives a testimonial:* Ask specifically: "Would you be willing to give me 2 sentences about your experience? I'll draft something for you to approve."

**Minimum viable action:** Post 3 helpful Reddit comments per week and follow up with every Phase 1 photographer for feedback.

---

## Phase 3: Controlled Expansion + Content Engine (Weeks 7-9, Apr 28 — May 18)

**Goal:** 20+ photographers. First paying clients generating revenue. External credibility.
**Time budget:** 5-7 hrs/week — split between content, Reddit soft-closes, and outreach expansion.

### Actions

- [ ] First Reddit soft-close posts — share value + mention PhotoVault beta in r/photobusiness, r/WeddingPhotography (use templates from Reddit Strategy)
- [ ] Post founder story in r/SideProject and r/startups monthly thread
- [ ] Build and launch **Passive Income Calculator** — interactive tool showing "X past clients = $Y/month passive income" (low effort, high lead gen value)
- [ ] Share calculator on Reddit, Facebook groups, LinkedIn
- [ ] Publish 2 more blog articles:
  - "The Real Cost of Photo Gallery Platforms in 2026" (comparison piece)
  - "What Happens to Your Photos When Your Photographer Retires?" (Orphan Protocol angle)
- [ ] Send **Sales Enablement Guide** to all active photographers — help them explain PhotoVault to clients
- [ ] Expand outreach beyond Madison: Milwaukee, Chicago, Minneapolis using adapted Version C templates
- [ ] Compile testimonials into a dedicated section on `/photographers` page
- [ ] Research Twig & Olive contact info (prep for Phase 4 outreach)

### Success Metrics

| Metric | Target |
|--------|--------|
| Total photographers | 20+ |
| Galleries uploaded | 10+ |
| Active client subscriptions | 5+ |
| Client MRR | $40+ |
| Blog articles live | 4+ |
| Calculator tool live | Yes |
| Reddit karma | 300+ |

**Minimum viable action:** Make one Reddit soft-close post and expand outreach to one city beyond Madison.

---

## Phase 4: Early Access Transition (Weeks 10-12, May 19 — June 8)

**Goal:** 30+ photographers. End free beta for new signups. Revenue from both sides.
**Time budget:** 5-7 hrs/week steady, one 8-10 hr sprint for launch activities.

### Gate Criteria (Must Be True Before Entering Phase 4)
- [ ] 20+ photographers with accounts
- [ ] 5+ galleries with real client photos
- [ ] 3+ clients paying for subscriptions
- [ ] 2+ testimonials on the site
- [ ] No critical bugs in the delivery flow

### Actions

- [ ] End free beta for NEW signups (honor existing beta photographers' free period)
- [ ] Begin $22/month photographer fee for new signups
- [ ] **Beta photographer transition:** Give 2 weeks notice. Show earnings dashboard. Frame: "You've been making money — this fee pays for itself with 6 clients."
- [ ] **Decision needed:** Grandfathered rate for founding photographers? (e.g., $15/month forever as thank-you)
- [ ] Launch referral program: photographer gets 1 month free for each referral who signs up
- [ ] Begin hero photo memory email development (spec in `PhotoVault_Client_Email_Sequence.md`)
- [ ] Reach out to **Twig & Olive Photography** (94K followers, Madison educators)
- [ ] Start monthly email newsletter to photographer list
- [ ] Apply to guest on 2-3 photography business podcasts
- [ ] Prepare Product Hunt listing (tagline, screenshots, demo video, launch-day strategy)

### Success Metrics

| Metric | Target |
|--------|--------|
| Total photographers | 30+ |
| Paying photographers ($22/mo) | 5+ |
| Active client subscriptions | 10+ |
| Monthly recurring revenue | $200+ |
| Photographer churn | <10%/month |
| Email list size | 100+ |
| Reddit karma | 500+ |

---

## Phase 5: Full Launch (Week 13+, June 9 onward)

**Gate Criteria:** 30 photographers, 10+ active subscriptions, positive unit economics, <5% monthly churn.

### Actions
- [ ] Product Hunt launch (see checklist below)
- [ ] BetaList and startup directory submissions
- [ ] Full social media content calendar (run `social-content` skill)
- [ ] Paid ads pilot: $200-500/month targeting photographers on Facebook/Instagram
- [ ] National expansion messaging (remove Madison-specific framing)
- [ ] Press outreach to photography industry publications
- [ ] Conference speaking: WPPA, PPA, local business events

### Product Hunt Prep Checklist
- [ ] Compelling tagline (test 3-5 options with users)
- [ ] 3-5 polished screenshots + short demo video
- [ ] Build relationships with PH community 2-4 weeks before
- [ ] Line up 20+ people to engage on launch day
- [ ] Prepare founder's comment for launch thread
- [ ] Full team ready for all-day engagement

---

## How Emails Fit This Strategy

Design email sequences AFTER the strategy phase they belong to. Don't build everything now.

| Email Type | Status | Build When |
|------------|--------|------------|
| Post-signup drips (photographer) | **DONE** | — |
| Post-signup drips (client) | **DONE** | — |
| Hero photo memory emails | Not built | Phase 4 (needs hero photo selection UI) |
| Monthly newsletter | Not started | Phase 4 (need enough subscribers) |
| Referral program emails | Not built | Phase 4 (when referral program launches) |
| Re-engagement emails | Not built | Phase 4+ (need churned users to exist) |
| Launch announcement | Not built | Phase 5 (Product Hunt / GA launch) |
| Paid trial nurture | Not built | Phase 5 (when running paid acquisition) |

**Immediate action:** Review existing drip copy for alignment with current messaging. No rebuild needed — just a quick read-through.

---

## Metrics Dashboard — Weekly Tracking

Track every Sunday evening (15 minutes):

| Metric | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | W9 | W10 | W11 | W12 |
|--------|----|----|----|----|----|----|----|----|----|----|-----|-----|
| Total photographers | | | | | | | | | | | | |
| New this week | | | | | | | | | | | | |
| Galleries uploaded | | | | | | | | | | | | |
| Active client subs | | | | | | | | | | | | |
| Client MRR ($) | | | | | | | | | | | | |
| Reddit karma | | | | | | | | | | | | |
| Outreach sent | | | | | | | | | | | | |
| Response rate (%) | | | | | | | | | | | | |
| Inbound signups | | | | | | | | | | | | |

**Leading indicators:** Outreach sent, Reddit karma, galleries uploaded.
**Lagging indicators:** MRR, total photographers, inbound signups.

---

## Reference Documents

All located at `C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\strategy\`:

| Document | Use It For |
|----------|-----------|
| `PhotoVault_Beta_Warm_Outreach_Messages.md` | Phase 1 outreach copy (Versions A-D, ready to send) |
| `PhotoVault_Reddit_Strategy.md` | Phase 2+ Reddit playbook (subreddits, templates, 90/10 rule) |
| `PhotoVault_Photographer_Manifesto.md` | Shareable value prop — use in outreach and Reddit posts |
| `PhotoVault_Photographer_Sales_Enablement.md` | Give to photographers to help them sell to clients |
| `PhotoVault_Client_Email_Sequence.md` | Hero photo memory email spec (build in Phase 4) |
| `PhotoVault_Beta_2Week_Action_Plan.md` | Original daily task list (reference for Phase 1 structure) |

---

## If You Can Only Do ONE Thing Per Phase

| Phase | The One Thing |
|-------|--------------|
| Phase 1 | Send warm outreach messages and personally onboard whoever says yes. |
| Phase 2 | Post helpful Reddit comments 3x/week to build karma and credibility. |
| Phase 3 | Make one Reddit soft-close post and launch the passive income calculator. |
| Phase 4 | End free beta for new signups and email all photographers about the transition. |
| Phase 5 | Launch on Product Hunt with 20+ supporters lined up. |

---

## The Engine

The entire strategy runs on one principle: **be genuinely helpful to photographers in the places they already hang out, then offer PhotoVault as the solution when the moment is right.**

Direct outreach converts highest. Reddit builds credibility. Content creates inbound. Borrowed channels (WPPA, influencers, podcasts) accelerate once you have proof points.

Start with the warm asks. Everything else follows.
