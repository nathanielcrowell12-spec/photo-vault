# PhotoVault — Gallery Creation Wizard & Proofing System
## Brownfield Epic Document

**Created:** 2026-03-18
**Updated:** 2026-03-18 (post QA Critic review)
**Source:** Pixieset competitive recon + photographer feedback from Facebook outreach
**BMAD Method:** Brownfield-Create-Epic (multiple coordinated epics)
**QA Critic Verdict:** APPROVE WITH CONCERNS — critical issues addressed below

---

## QA Critic Resolutions

### C1: CHECK Constraint Migration (RESOLVED)
Migration must `DROP CONSTRAINT` on `billing_mode` and `gallery_status` columns before adding new values. Also resolve `live` vs `delivered` discrepancy in existing migration files. New CHECK values:
- `billing_mode IN ('storage_only', 'all_in_one', 'external')`
- `gallery_status IN ('draft', 'ready', 'proofing', 'proofing_complete', 'payment_pending', 'delivered', 'archived')`

### C2: Dual Photo Table (RESOLVED — Option C)
Two photo tables exist: `gallery_photos` (web manual upload) and `photos` (photographer upload + desktop). Different column names. Proofing FK will target `photos` table (the primary path for new galleries created via wizard). Old `gallery_photos`-only galleries cannot use proofing until a future consolidation migration. This is acceptable because proofing is a new feature only available on new galleries created via the wizard.

### C3: External Payment Status (RESOLVED)
Use `payment_status='external'` instead of overloading `paid`. Add `external` to the `payment_status` CHECK constraint:
- `payment_status IN ('pending', 'paid', 'failed', 'refunded', 'expired', 'external')`

### User Decisions (from Nate)
- **Proofing can be enabled on Classic galleries** (not just Proof First) — proofing is independent of payment timing
- **Photographer subscription enforcement already exists** — photographers who haven't paid can't create galleries
- **"Deliver and Done" $0 revenue accepted** — photographer pays $22/mo subscription; this flow is necessary to compete
- **External galleries expire in 6 months** (not 90 days) — market research confirms 6 months is industry standard
- **Two 6-month options:** one with commission (existing $50 Six-Month Package) and one at $0 (Deliver and Done with 6-month expiry)
- **No admin stuck-gallery tool exists** — add as a story or sub-task

---

## Existing System Context

**Technology Stack:** Next.js 15, Supabase (PostgreSQL + RLS), Stripe Connect, Tailwind CSS, shadcn/ui
**Current Gallery Creation:** Single flat form at `src/app/photographer/galleries/create/page.tsx` — collects client, name, description, session date, metadata, billing mode (all_in_one vs storage_only), and pricing package. Creates gallery in `photo_galleries` table with status `draft`, then redirects to upload page.
**Current Paywall:** Client sees gallery, hits Stripe Checkout gate at `POST /api/stripe/gallery-checkout`. Destination charge splits payment between photographer (Stripe Connect) and PhotoVault (application fee).
**Current Favorites:** `is_favorite` boolean on `gallery_photos` table, Heart icon in lightbox viewer. Photographer-side only — no client-facing proofing workflow.
**Current Download:** Download tracking via `photo_downloads` table. Tracks individual/bulk downloads. No resolution gating — serves whatever URL is stored.

**Database Table:** `photo_galleries` (canonical) with columns for pricing, payment status, Stripe references, expiration, download tracking, archive/reactivation, and gallery status (`draft`, `ready`, `delivered`, `archived`).

---

## Epic 1: Gallery Creation Wizard with Preset Flows

### Epic Goal

Replace the flat gallery creation form with a guided multi-step wizard that collects mandatory delivery decisions and offers preset flows for speed. Photographers cannot skip mandatory variables. Selecting a preset auto-fills wizard settings.

### Stories

---

#### Story 1.1: Wizard Shell & Preset Flow Selection

**User Story:**
As a photographer,
I want to select a preset delivery flow when creating a gallery,
So that I can quickly configure my most common gallery settings without filling out every option manually.

**Story Context:**
- **Integrates with:** `src/app/photographer/galleries/create/page.tsx` (replaces current flat form)
- **Technology:** React client component, shadcn/ui Stepper/Tabs pattern
- **Follows pattern:** Existing create gallery page (auth check, client selection, Supabase insert)
- **Touch points:** `photo_galleries` table (new columns), create gallery API flow

**Acceptance Criteria:**

*Functional Requirements:*
1. Wizard displays 3 preset flow cards at the top: **Classic PhotoVault**, **Proof First Pay Later**, **Deliver and Done**
2. Each preset card shows a one-sentence description and which variables it auto-fills
3. Selecting a preset populates all wizard variables with that preset's defaults
4. Photographer can override any individual setting after selecting a preset
5. Wizard has clearly delineated steps (Client → Gallery Details → Delivery Settings → Pricing → Review)
6. Current form fields (client selection, gallery name, description, session date, metadata, billing mode, pricing package) remain present and functional
7. Wizard prevents progression past mandatory fields (payment timing, pricing plan, proofing on/off)

*Integration Requirements:*
8. Existing gallery creation flow (Supabase insert into `photo_galleries`) continues to work unchanged for all current fields
9. New wizard variables are stored as new columns on `photo_galleries`
10. Analytics event `PHOTOGRAPHER_CREATED_GALLERY` continues to fire with existing properties

*Quality Requirements:*
11. Change is covered by appropriate tests
12. No regression in existing gallery creation functionality

**Technical Notes:**
- **New DB columns on `photo_galleries`:**
  - `payment_timing VARCHAR(30)` — `before_access` (default), `after_proofing`, `external`
  - `proofing_enabled BOOLEAN DEFAULT FALSE`
  - `proofing_deadline TIMESTAMPTZ DEFAULT NULL`
  - `ai_edits_permission VARCHAR(30) DEFAULT 'not_allowed'` — `not_allowed`, `allowed`, `approval_required`
  - `preset_flow VARCHAR(30) DEFAULT NULL` — `classic`, `proof_first`, `deliver_and_done`
- **Preset mappings:**
  - Classic PhotoVault: `payment_timing=before_access`, `proofing_enabled=false`, `ai_edits_permission=not_allowed`
  - Proof First Pay Later: `payment_timing=after_proofing`, `proofing_enabled=true`, `proofing_deadline=14 days from now`, `ai_edits_permission=allowed`
  - Deliver and Done: `payment_timing=external`, `proofing_enabled=false`, `ai_edits_permission=not_allowed`
- **Migration:** Additive columns only — existing galleries default to `payment_timing=before_access`, `proofing_enabled=false`
- **Key constraint:** When `payment_timing=external`, Stripe checkout is bypassed entirely. Gallery goes directly to `payment_status=paid` on creation. No commission split. Photographer still needs active $22/mo subscription.

**Definition of Done:**
- [ ] Wizard UI renders with 3 preset cards and 5 steps
- [ ] Presets auto-fill all wizard variables correctly
- [ ] All current gallery creation fields remain functional
- [ ] New columns added to `photo_galleries` via migration
- [ ] Gallery record saves all new fields correctly
- [ ] Existing tests pass, new tests cover wizard flow
- [ ] Mobile-responsive (photographer may use phone/tablet)

**Risk Assessment:**
- **Primary Risk:** Breaking existing gallery creation for photographers with galleries in progress
- **Mitigation:** Additive-only DB migration; existing create flow still works if wizard is abandoned
- **Rollback:** Revert to flat form component; new columns are nullable and ignored

---

#### Story 1.2: Payment Timing — "Deliver and Done" Flow (External Payment Bypass)

**User Story:**
As a photographer who handles billing through my own system (HoneyBook, Dubsado, Square, cash),
I want to create a gallery without a PhotoVault paywall,
So that my client can access their photos directly without paying through PhotoVault.

**Story Context:**
- **Integrates with:** Gallery access logic in `src/app/gallery/[galleryId]/page.tsx`, Stripe checkout gate at `src/app/api/stripe/gallery-checkout/route.ts`
- **Technology:** Conditional logic in gallery viewer, Supabase RLS
- **Follows pattern:** Existing `shoot_only` payment option (already bypasses payment for $0 galleries)
- **Touch points:** Gallery viewer paywall logic, photographer dashboard gallery list

**Acceptance Criteria:**

*Functional Requirements:*
1. When `payment_timing=external`, gallery is created with `payment_status=paid` immediately (no Stripe session needed)
2. Client receives gallery access link directly (same as post-payment flow)
3. No commission split occurs — PhotoVault earns $0 on this gallery
4. Photographer's $22/mo platform subscription remains required (enforced at account level, not gallery level)
5. Gallery viewer skips paywall entirely for `external` payment timing galleries
6. Photographer dashboard shows "External Payment" badge on these galleries (distinct from paid/pending)

*Integration Requirements:*
7. Existing paywall logic (`payment_status !== 'paid'` check) continues to gate all other gallery types
8. Stripe webhook handler is not affected (no checkout session is created)
9. Gallery email notifications (gallery-ready) still fire when photographer publishes

*Quality Requirements:*
10. Cannot exploit external payment to bypass platform subscription check
11. Tests cover: external payment gallery creation, client access without payment, dashboard display

**Technical Notes:**
- **Approach:** When wizard submits with `payment_timing=external`, set `payment_status=external`, `total_amount=0`, `billing_mode=external` (new enum value), `gallery_expires_at=NOW() + 6 months`
- **Dashboard display:** Add `external` to `billing_mode` and `payment_status` CHECK constraints
- **Expiry:** 6 months (industry standard per market research), not 90 days
- **RLS:** No changes needed — client access RLS is based on `client_id` linking, not payment status

**Definition of Done:**
- [ ] External payment galleries created with `payment_status=paid`
- [ ] Client can access gallery without hitting paywall
- [ ] No Stripe session created for external payment galleries
- [ ] Dashboard shows "External Payment" badge
- [ ] Platform subscription check still enforced
- [ ] Tests pass

**Risk Assessment:**
- **Primary Risk:** Photographers using "Deliver and Done" exclusively, generating $0 revenue for PhotoVault
- **Mitigation:** This is a business decision, not a technical risk. Platform subscription ($22/mo) ensures minimum revenue. This flow is necessary to compete with free delivery tools.
- **Rollback:** Remove `external` from `payment_timing` options in wizard; existing external galleries continue working

---

#### Story 1.3: Payment Timing — "Proof First, Pay Later" Flow

**User Story:**
As a photographer,
I want my client to complete proofing before being asked to pay,
So that they feel confident about the photos they're paying for and I can deliver exactly what they want.

**Story Context:**
- **Integrates with:** Gallery viewer page, Stripe checkout gate, proofing system (Epic 2)
- **Technology:** Gallery status state machine, conditional paywall rendering
- **Follows pattern:** Existing gallery status flow (`draft` → `ready` → `delivered` → `archived`)
- **Touch points:** Gallery viewer, photographer dashboard, email notifications

**Acceptance Criteria:**

*Functional Requirements:*
1. When `payment_timing=after_proofing`, client receives gallery link but sees proofing view first (not paywall)
2. Client can browse all photos and submit proofing selections before paying
3. After proofing submission, client sees paywall with normal Stripe checkout
4. Photographer can see proofing submissions in their dashboard
5. Once photographer marks proofing review complete, gallery transitions to payment-ready state
6. Payment flow is identical to current flow after proofing completes

*Integration Requirements:*
7. Existing `before_access` payment timing (current default) is unchanged
8. Stripe checkout session creation works identically — just triggered later in the flow
9. Gallery status flow extended: `draft` → `ready` → `proofing` → `proofing_complete` → `payment_pending` → `delivered`

*Quality Requirements:*
10. Client cannot download full-resolution photos before payment
11. Proofing view shows photos but restricts download capability
12. Tests cover full proof-first flow end-to-end

**Technical Notes:**
- **New gallery_status values:** Add `proofing`, `proofing_complete`, `payment_pending` to the CHECK constraint
- **Gallery viewer branching logic:**
  - `payment_timing=before_access` + `payment_status=pending` → show paywall (current behavior)
  - `payment_timing=after_proofing` + `gallery_status=proofing` → show proofing panel
  - `payment_timing=after_proofing` + `gallery_status=proofing_complete` → show paywall
  - `payment_timing=after_proofing` + `payment_status=paid` → show full gallery (same as current)
- **Dependency:** Epic 2 (Proofing Panel) must be built first. This story wires it into the payment flow.

**Definition of Done:**
- [ ] Proof-first flow works end-to-end: gallery link → proofing → photographer review → paywall → payment → full access
- [ ] Client cannot download before payment
- [ ] Gallery status transitions correctly
- [ ] Stripe checkout unchanged in mechanics
- [ ] Tests cover flow transitions

**Risk Assessment:**
- **Primary Risk:** State machine complexity — galleries could get stuck in intermediate states
- **Mitigation:** Admin dashboard should show galleries in each status; add manual status override for admin
- **Rollback:** Set `payment_timing=before_access` on all `after_proofing` galleries; they revert to standard paywall flow

---

## Epic 2: Client Proofing Panel

### Epic Goal

Build a client-facing proofing panel where clients can apply CSS filter previews per photo, leave one free-text note per photo, and submit their selections to the photographer. Communication is one-way and one-time.

### Stories

---

#### Story 2.1: Proofing Data Model & API

**User Story:**
As a developer,
I want a database schema and API routes for proofing submissions,
So that client proofing selections are stored and retrievable by the photographer.

**Story Context:**
- **Integrates with:** `photo_galleries` table, `photos` table, Supabase RLS
- **Technology:** Supabase migration, Next.js API routes
- **Follows pattern:** Existing `photo_downloads` table pattern (FK to gallery + photo, per-user records)
- **Touch points:** New `proofing_submissions` table, new API routes

**Acceptance Criteria:**

*Functional Requirements:*
1. New `proofing_submissions` table stores per-photo proofing data:
   - `gallery_id`, `photo_id`, `client_id` (FKs)
   - `filter_selection VARCHAR(50)` — CSS filter name or `null` (approved as-is)
   - `client_note TEXT` — free-text note, one per photo, max 500 chars
   - `submitted_at TIMESTAMPTZ` — null until batch submission
2. `POST /api/gallery/[galleryId]/proofing` — saves individual photo proofing data (auto-save as client works)
3. `POST /api/gallery/[galleryId]/proofing/submit` — marks all proofing for this gallery as submitted, updates gallery status to `proofing_complete`
4. `GET /api/gallery/[galleryId]/proofing` — retrieves all proofing data (for photographer review)
5. Once submitted, no further modifications allowed (enforced at API level)

*Integration Requirements:*
6. RLS: Client can INSERT/UPDATE proofing for galleries where they are the assigned client, until submitted
7. RLS: Photographer can SELECT proofing for their own galleries
8. `photo_galleries.gallery_status` transitions from `proofing` to `proofing_complete` on submission
9. Proofing deadline: cron or trigger sets `gallery_status=proofing_complete` when `proofing_deadline` elapses (even if client hasn't submitted)

*Quality Requirements:*
10. API validates filter selection against allowed values
11. API validates note length (max 500 chars)
12. Tests cover: save proofing, submit proofing, deadline expiration, read-after-submit immutability

**Technical Notes:**
- **Table design:**
  ```sql
  CREATE TABLE proofing_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id UUID NOT NULL REFERENCES photo_galleries(id) ON DELETE CASCADE,
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,  -- FK to `photos` table (primary for wizard-created galleries)
    client_user_id UUID NOT NULL REFERENCES auth.users(id),
    filter_selection VARCHAR(50) DEFAULT NULL,
    client_note TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ DEFAULT NULL,
    UNIQUE (gallery_id, photo_id, client_user_id)
  );
  ```
  **Note:** FK targets `photos` table, not `gallery_photos`. Old galleries with photos only in `gallery_photos` cannot use proofing until a future table consolidation. This is acceptable — proofing is only available on wizard-created galleries.
- **Proofing availability:** Proofing can be enabled on ANY gallery type (Classic, Proof First, Deliver and Done). It is independent of payment timing. On Classic galleries, proofing happens after payment.
- **Allowed filters:** `null` (no change), `grayscale`, `sepia`, `brightness-up`, `contrast-up`, `warmth`, `cool-tone` — final list TBD based on CSS filter capabilities
- **Deadline enforcement:** On-read check (simpler than cron): when gallery viewer loads a gallery with `proofing_enabled=true` AND `proofing_deadline < NOW()` AND `gallery_status=proofing`, automatically transition to `proofing_complete`. Avoids needing pg_cron infrastructure. Supplement with a nightly cron as a safety net if pg_cron is already enabled.

**Definition of Done:**
- [ ] Migration creates `proofing_submissions` table with RLS
- [ ] API routes for save, submit, and read proofing data
- [ ] Submit locks further modifications
- [ ] Deadline auto-closes proofing
- [ ] Tests cover all scenarios

---

#### Story 2.2: Client Proofing UI — Filter Preview & Notes

**User Story:**
As a client viewing my photo gallery in proofing mode,
I want to preview filter options on each photo and leave notes for my photographer,
So that I can communicate my preferences for the final edits without needing a separate conversation.

**Story Context:**
- **Integrates with:** Gallery viewer at `src/app/gallery/[galleryId]/page.tsx`, proofing API from Story 2.1
- **Technology:** React client component, CSS filters (client-side only), shadcn/ui
- **Follows pattern:** Existing gallery grid + lightbox pattern
- **Touch points:** Gallery viewer (conditional rendering based on `proofing_enabled` + gallery status)

**Acceptance Criteria:**

*Functional Requirements:*
1. When gallery has `proofing_enabled=true` and `gallery_status=proofing`, gallery viewer renders proofing panel instead of standard view
2. Each photo displays in a split layout: original on left, filter preview on right
3. Vertical filter menu on right panel with options: Original (no filter), Black & White, Sepia, Brighten, Warm, Cool, High Contrast
4. Selecting a filter updates the right panel preview in real-time using CSS `filter` property
5. One free-text note field per photo (plain text, max 500 chars, one submission)
6. Photos with no action taken are visually marked as "Approved as-is"
7. Auto-saves proofing selections as client works (debounced API calls)
8. "Submit to Photographer" button at bottom — disabled until client has viewed all photos (or explicitly skipped)
9. Confirmation modal before final submission: "You cannot make changes after submitting. Are you sure?"
10. After submission, proofing panel shows read-only summary of what was submitted

*Integration Requirements:*
11. Gallery grid/lightbox continue to work for non-proofing galleries
12. Downloads are disabled during proofing (photos are view-only until after payment)
13. Mobile-responsive — split layout stacks vertically on mobile

*Quality Requirements:*
14. CSS filter previews are performant — no server round-trips for filter rendering
15. Auto-save debounced to max 1 API call per 2 seconds
16. Tests cover: filter selection, note entry, submission, read-only post-submit, mobile layout

**Technical Notes:**
- **CSS filter mappings:**
  - `grayscale` → `filter: grayscale(100%)`
  - `sepia` → `filter: sepia(80%)`
  - `brightness-up` → `filter: brightness(1.2)`
  - `warmth` → `filter: sepia(20%) saturate(1.2)`
  - `cool-tone` → `filter: hue-rotate(20deg) saturate(0.9)`
  - `contrast-up` → `filter: contrast(1.3)`
- **Auto-save pattern:** Use `useDebouncedCallback` to batch filter/note changes, save via `POST /api/gallery/[galleryId]/proofing`
- **Component structure:** New `ProofingPanel.tsx` component, conditionally rendered in gallery viewer based on gallery state

**Definition of Done:**
- [ ] Proofing panel renders for proofing-enabled galleries
- [ ] Split layout with filter preview works on desktop and mobile
- [ ] All filter options render correctly via CSS
- [ ] Notes save and submit correctly
- [ ] Submission locks panel to read-only
- [ ] Downloads disabled during proofing
- [ ] Auto-save works with debounce
- [ ] Tests pass

---

#### Story 2.3: Photographer Proofing Review Dashboard

**User Story:**
As a photographer,
I want to see my client's proofing selections and notes in my dashboard,
So that I can review their feedback, re-edit photos as needed, and finalize the gallery for delivery.

**Story Context:**
- **Integrates with:** Photographer dashboard at `src/app/photographer/dashboard/page.tsx`, gallery detail views
- **Technology:** React client component, Supabase queries, shadcn/ui
- **Follows pattern:** Existing photographer gallery list and stats pattern
- **Touch points:** Photographer dashboard, gallery detail page, photo management

**Acceptance Criteria:**

*Functional Requirements:*
1. Photographer dashboard shows alert/badge when any gallery has `gallery_status=proofing_complete`
2. Clicking the alert opens the gallery proofing review view
3. Proofing review shows each photo with:
   - Original photo on left
   - Client's selected filter preview on right (rendered with same CSS filter)
   - Client's note displayed below (or "Approved as-is" if no feedback)
4. Photos with client feedback are visually distinct from approved-as-is photos
5. Photographer can delete individual photos and re-upload revised edits
6. "Mark Revisions Complete" button transitions gallery to next state:
   - If `payment_timing=after_proofing`: gallery moves to `payment_pending` (client sees paywall)
   - If `payment_timing=before_access`: gallery moves to `delivered` (client already paid)
   - If `payment_timing=external`: gallery moves to `delivered` (no payment needed)
7. Communication is one-way — no reply field for photographer. They act on the feedback by editing photos.

*Integration Requirements:*
8. Existing photographer dashboard layout/navigation unchanged
9. Photo delete + re-upload uses existing photo management patterns
10. Gallery status transition triggers appropriate email notification to client

*Quality Requirements:*
11. Tests cover: dashboard alert, proofing review display, revision complete transitions
12. Handles edge case: client submits with all photos approved as-is (nothing to review)

**Technical Notes:**
- **Dashboard alert:** Query `photo_galleries` where `photographer_id=auth.uid()` AND `gallery_status=proofing_complete`
- **Photo replacement flow:** Delete existing photo record + storage object, upload new photo to same gallery using existing upload pattern
- **Status transitions:** Update `gallery_status` and trigger email via existing `gallery-ready` email route (may need new template for "revisions complete" notification)

**Definition of Done:**
- [ ] Dashboard shows proofing-complete alerts
- [ ] Proofing review view displays client selections and notes
- [ ] Photographer can delete/re-upload photos
- [ ] "Mark Revisions Complete" transitions gallery correctly
- [ ] Email notification fires on transition
- [ ] Tests pass

---

## Epic 3: Post-Delivery AI Edits

### Epic Goal

Allow clients to request CSS-filter-based edits on individual photos in delivered galleries, with optional photographer approval and per-edit payment to PhotoVault.

### Stories

---

#### Story 3.1: AI Edit Request System

**User Story:**
As a client viewing my delivered gallery,
I want to request a filter/enhancement edit on any individual photo,
So that I can get a variation of my photo without going back to my photographer.

**Story Context:**
- **Integrates with:** Gallery viewer (delivered state), Stripe checkout, photographer dashboard
- **Technology:** React client component, Stripe per-edit payment, Supabase
- **Follows pattern:** Existing Stripe checkout pattern (single payment for service)
- **Touch points:** Gallery viewer, new `ai_edit_requests` table, Stripe checkout, photographer dashboard (if approval required)

**Acceptance Criteria:**

*Functional Requirements:*
1. Only available on delivered galleries where `ai_edits_permission != 'not_allowed'`
2. Client sees "Request Edit" button per photo in delivered gallery view
3. Client selects from same filter options as proofing panel (grayscale, sepia, brighten, etc.)
4. Client previews filter on photo (same CSS filter approach)
5. Client confirms → Stripe checkout for per-edit price (TBD — placeholder $1.29)
6. If `ai_edits_permission=allowed`: edit processes automatically after payment
7. If `ai_edits_permission=approval_required`: edit request goes to photographer dashboard; photographer approves or rejects; if approved, edit processes; if rejected, client is refunded
8. "Processing" = apply CSS filter server-side using Sharp, save as new photo variant alongside original
9. Both original and edited version accessible in gallery

*Integration Requirements:*
10. Stripe payment is a simple checkout (no destination charge — 100% to PhotoVault)
11. Edit request does not affect gallery status or expiration
12. Photographer approval notifications use existing email system

*Quality Requirements:*
13. Client cannot request the same filter on the same photo twice
14. Tests cover: request flow, payment, auto-processing, approval flow, rejection/refund

**Technical Notes:**
- **New table `ai_edit_requests`:**
  - `gallery_id`, `photo_id`, `client_user_id`
  - `filter_selection VARCHAR(50)`
  - `status VARCHAR(20)` — `pending_payment`, `pending_approval`, `approved`, `processing`, `complete`, `rejected`
  - `stripe_payment_intent_id`, `amount_cents`
  - `edited_photo_url TEXT` — URL of processed result
- **Server-side processing:** Sharp can apply equivalents of CSS filters (grayscale, sepia tone via color manipulation, brightness, contrast). This is a separate story if complexity warrants it.
- **Pricing:** Start with flat $1.29/edit. Can iterate pricing later.
- **THIS EPIC IS LOWER PRIORITY than Epics 1 and 2.** Can be deferred to Phase 2.

**Definition of Done:**
- [ ] Edit request UI in delivered gallery view
- [ ] Stripe payment flow for per-edit pricing
- [ ] Auto-processing for `allowed` permission
- [ ] Approval flow for `approval_required` permission
- [ ] Server-side filter application (Sharp)
- [ ] Both original and edited versions in gallery
- [ ] Tests pass

---

## Compatibility Requirements (All Epics)

- [ ] Existing APIs remain unchanged for current gallery types
- [ ] Database schema changes are additive only (new columns with defaults, new tables)
- [ ] UI changes follow existing shadcn/ui + Tailwind patterns
- [ ] Performance impact is minimal (CSS filters are client-side, no additional API calls on gallery load for non-proofing galleries)
- [ ] Existing galleries continue to function exactly as they do today
- [ ] Desktop app upload flow (`/api/v1/upload/prepare` and `/api/v1/upload/process`) is not affected

## Implementation Order

1. **Story 0** — DB migration: DROP/re-create CHECK constraints on `billing_mode`, `gallery_status`, `payment_status`. Add new wizard columns (`payment_timing`, `proofing_enabled`, `proofing_deadline`, `ai_edits_permission`, `preset_flow`). Resolve `live` vs `delivered` discrepancy.
2. **Story 2.1** — Proofing data model & API (foundation — `proofing_submissions` table + endpoints)
3. **Story 1.1** — Wizard shell & presets (new gallery creation UI)
4. **Story 2.2** — Client proofing UI (client-facing panel)
5. **Story 1.2** — External payment bypass (Deliver and Done flow, 6-month expiry)
6. **Story 2.3** — Photographer proofing review dashboard
7. **Story 1.3** — Proof First Pay Later flow (wires proofing to payment)
8. **Story E.1** — Email templates: proofing invitation, deadline reminder, revisions complete, proofing auto-closed (QA Critic concern S5)
9. **Story A.1** — Admin dashboard: stuck gallery override tool (no tool exists today)
10. **Story 3.1** — AI edits (lower priority, Phase 2)

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gallery status state machine grows complex | Galleries stuck in intermediate states | Admin override tool; comprehensive status transition tests |
| CSS filters look different across browsers | Client preview doesn't match final edit | Use standardized CSS filter values; test on Chrome/Safari/Firefox |
| Proofing deadline auto-close fails | Client loses ability to submit | Supabase cron with alert if job fails; manual admin override |
| External payment bypass reduces revenue | PhotoVault earns $0 on some galleries | Accepted business risk; $22/mo subscription ensures minimum |
| Server-side Sharp filter processing quality | Edited photos look different from CSS preview | Test Sharp filter equivalents thoroughly; consider client-side canvas export as alternative |

---

*Document follows BMAD Brownfield-Create-Epic template. Each story is scoped for a single focused development session (4-8 hours). Epic 3 is deferrable to Phase 2.*
