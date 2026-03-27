# QA Critic Review: Gallery Creation Wizard & Proofing System
**Reviewed:** 2026-03-18
**Plan:** `docs/claude/plans/gallery-wizard-proofing-epics.md`
**Verdict:** APPROVE WITH CONCERNS

---

## Summary Verdict: APPROVE WITH CONCERNS

The plan is well-structured, follows BMAD brownfield conventions, and addresses the user's requirements. The implementation order is logical and the scope is reasonable. However, there are several technical issues that must be resolved before implementation begins, primarily around database schema conflicts with existing CHECK constraints, the dual-table photo architecture, and the gallery status state machine complexity.

---

## Critical Issues (Must Fix)

### C1: Database CHECK Constraint Conflicts Will Block Migration

The plan adds `external` to `billing_mode` (Story 1.2) and new values (`proofing`, `proofing_complete`, `payment_pending`) to `gallery_status` (Story 1.3). However, existing CHECK constraints are strict enums:

- `billing_mode IN ('storage_only', 'all_in_one')` — defined in BOTH `all-in-one-pricing-migration.sql` AND `consolidate-photo-galleries-migration.sql`
- `gallery_status IN ('draft', 'ready', 'delivered', 'archived')` — defined in `consolidate-photo-galleries-migration.sql`
- A conflicting `gallery_status` constraint in `payment-model-migration.sql` uses `('draft', 'ready', 'live', 'archived')` — different values already

**The plan mentions adding new columns but does not mention ALTER-ing these CHECK constraints.** The migration will silently fail or error when inserting `external` billing_mode or `proofing` gallery_status values.

**Fix:** The migration must explicitly `ALTER TABLE photo_galleries DROP CONSTRAINT` for the existing CHECK and re-create it with the expanded values. The plan should document exactly which constraints change and their new values. Additionally, resolve the `live` vs `delivered` discrepancy between the two existing migration files before adding more values.

### C2: Proofing Table References `photos` Table But Gallery Viewer Queries `gallery_photos` Table

Story 2.1 creates `proofing_submissions` with `photo_id UUID NOT NULL REFERENCES photos(id)`. But the gallery viewer (`src/app/gallery/[galleryId]/page.tsx`, lines 140-176) queries `gallery_photos` first, then falls back to `photos`. These are two separate tables with different schemas:

- `gallery_photos` — references `galleries(id)` (the old deprecated table), has `photo_url`, `thumbnail_url`, `original_filename`
- `photos` — references `photo_galleries(id)` (canonical table), has `original_url`, `thumbnail_url`, `filename`

If a gallery's photos are in `gallery_photos` (which seems to be the case for some galleries), the proofing FK to `photos(id)` will fail — those photo IDs don't exist in `photos`.

**Fix:** The plan must explicitly decide which photo table is canonical for proofing. If both tables contain photos, the proofing system needs to handle both, or a data migration must consolidate them first. This is a prerequisite that should be Story 0 or a spike.

### C3: "Deliver and Done" Sets `payment_status=paid` Without Payment — Revenue Reporting Impact

Story 1.2 says: set `payment_status=paid`, `paid_at=NOW()`, `total_amount=0` for external payment galleries. This means:

- Dashboard queries that count `payment_status=paid` will include $0 galleries, inflating "paid gallery" counts
- Revenue reports summing `total_amount WHERE payment_status=paid` will be correct ($0 contributes nothing) BUT any report counting "paid galleries" or "conversion rate" will be skewed
- The `gallery_payment_transactions` table — will an external gallery have a transaction record? The plan doesn't say. If not, joins between galleries and transactions will silently exclude these.
- Stripe webhook handler won't fire (no session), so any post-payment logic in the webhook (gallery status transitions, email triggers) won't execute

**Fix:** Consider using a distinct `payment_status` value like `external` or `not_applicable` instead of overloading `paid`. This keeps reporting clean and makes the semantics explicit. Alternatively, document exactly which queries/reports need updating and add that to the DoD.

---

## Concerns (Should Address)

### S1: Gallery Status State Machine Has No Formal Transition Validation

Story 1.3 extends the gallery status to: `draft -> ready -> proofing -> proofing_complete -> payment_pending -> delivered -> archived`. That's 7 states. But there's no server-side enforcement of valid transitions. Any API call could update `gallery_status` to any value. Invalid transitions (e.g., jumping from `draft` to `delivered`) would corrupt the workflow.

**Suggestion:** Add a Postgres function or application-layer validation that enforces valid transitions. A simple approach: a `BEFORE UPDATE` trigger that checks `OLD.gallery_status` and `NEW.gallery_status` against an allowed-transitions map. This prevents bugs where a race condition or bad API call skips a state.

### S2: Proofing Deadline Enforcement via Supabase Cron Is Under-Specified

Story 2.1 mentions "Supabase cron function checks `proofing_deadline < NOW()`" but provides no detail. Questions:

- Does Supabase cron (`pg_cron`) run in this project already? If not, enabling it is a non-trivial step.
- What's the polling interval? Every minute? Every hour? A 1-hour interval means galleries could stay in `proofing` state up to an hour past deadline.
- What happens if the cron job fails? The risk table mentions "manual admin override" but there's no admin tool story in the plan.
- Does the deadline auto-close also trigger the "post-proofing" email to the client?

**Suggestion:** Add a concrete sub-task or spike for cron setup. Specify the interval. Consider an alternative: a check on gallery load (if `proofing_deadline < NOW()` AND `gallery_status = proofing`, transition to `proofing_complete` on-read). This is simpler and doesn't require cron infrastructure.

### S3: Auto-Save Debounce Strategy Needs Conflict Resolution

Story 2.2 specifies auto-saving proofing selections with a 2-second debounce. If the client opens the gallery in two browser tabs (common on desktop), concurrent saves could create race conditions:

- Tab A saves filter=grayscale for photo X
- Tab B saves filter=sepia for photo X 200ms later
- Which one wins? Last-write-wins is probably fine, but the client won't know their tab A choice was overwritten

**Suggestion:** Add an `updated_at` optimistic locking check, or simply document that multi-tab editing is not supported and the last save wins.

### S4: CSS Filter Preview vs. Server-Side Sharp Processing Fidelity (Epic 3)

The plan acknowledges this risk but doesn't propose a concrete mitigation. CSS `filter: sepia(80%)` and Sharp's sepia implementation will produce visually different results. Clients who approved a specific look in the browser will get a different result from the server.

**Suggestion:** For Phase 1 (proofing), CSS filters are fine because they're just communication ("I want something like this"). For Phase 2 (AI edits that generate actual files), consider using client-side Canvas API to render the filter and upload the result, rather than trying to match CSS filters in Sharp. This guarantees WYSIWYG.

### S5: No Story for Email Notifications

Multiple stories reference email triggers:
- Story 1.2: "Gallery email notifications (gallery-ready) still fire when photographer publishes"
- Story 1.3: Implicit — client needs to know proofing is complete and payment is due
- Story 2.3: "Email notification fires on transition" for revisions complete

But there's no story or sub-task for creating these email templates. The existing `gallery-ready` email template likely doesn't cover "your proofing is complete, please pay" or "your photographer has finished revisions."

**Suggestion:** Add a story or explicit sub-tasks for new email templates: (1) proofing invitation, (2) proofing deadline reminder, (3) revisions complete / payment due, (4) proofing auto-closed by deadline.

### S6: RLS Policy Gap for Proofing Submissions

Story 2.1 specifies RLS: "Client can INSERT/UPDATE proofing for galleries where they are the assigned client." But the client is linked via the `clients` table (not directly by `auth.uid()`). The RLS policy would need to join `proofing_submissions -> photo_galleries -> clients -> user_id = auth.uid()`. This is a multi-table join in RLS, which is supported but worth testing for performance on larger datasets.

Also: the plan says clients can INSERT/UPDATE until submitted, but the `submitted_at` check in RLS needs careful implementation — RLS evaluates per-row, so the policy needs `WHERE submitted_at IS NULL` on the UPDATE policy. This is doable but easy to get wrong.

**Suggestion:** Write out the exact RLS policy SQL in the plan to catch issues before implementation.

---

## Minor Notes (Consider)

### M1: Wizard Step Count

Story 1.1 specifies 5 wizard steps: Client -> Gallery Details -> Delivery Settings -> Pricing -> Review. The current form has ~5 sections already (Client, Gallery Details, Metadata, Billing Mode, Pricing). Adding "Delivery Settings" and "Review" while keeping existing sections means the wizard could feel long. Consider whether "Gallery Details" and "Metadata" should be one step, or whether metadata should be deferred to post-creation (it's optional).

### M2: "Viewed All Photos" Requirement for Submit Button

Story 2.2, AC #8: "Submit to Photographer" button disabled until client has viewed all photos (or explicitly skipped). Tracking "viewed" in a gallery with 500+ photos is complex. How do you define "viewed"? Scrolled past in grid? Opened in lightbox? This needs a simpler heuristic or should just be a checkbox ("I've reviewed all photos").

### M3: Filter List Is Small

The plan offers 7 filters (including "no change"). Pixieset's proofing is simpler (just favorites + notes). The filter approach is more prescriptive but the list is small enough that clients may not find one that matches their vision. Consider whether free-text notes alone (with no filter requirement) might be sufficient for v1, with filters as an enhancement.

### M4: Preset Flow Column May Be Unnecessary

Story 1.1 adds a `preset_flow` column to track which preset was selected. Since presets just auto-fill other columns, this column has no functional purpose — it's purely for analytics. That's fine, but be explicit that it's analytics-only and has no business logic dependency.

### M5: No Mention of Desktop App Impact Assessment

The compatibility section says "Desktop app upload flow is not affected," but the desktop app uses `/api/v1/upload/prepare` which creates galleries. If the wizard adds new mandatory columns, does the desktop `prepare` endpoint need updating? The plan should verify that new columns have `DEFAULT` values so desktop-created galleries don't fail.

---

## Pre-Implementation Investigation Check

| Requirement | Status | Notes |
|------------|--------|-------|
| Search for existing similar functionality | PARTIAL | Plan references existing create page and favorites, but doesn't mention the `gallery_photos` vs `photos` dual-table issue |
| Document what exists to extend | YES | "Existing System Context" section covers current state well |
| Flag duplication risks | NO | The two photo tables (`photos` and `gallery_photos`) are a duplication risk that isn't flagged |
| "Existing Code to Reference" section | PARTIAL | References specific file paths but doesn't list all files that will need modification (e.g., gallery viewer paywall logic, dashboard page, webhook handler) |

---

## Questions for the User

1. **Dual photo table:** Are `gallery_photos` and `photos` both actively used? Should we consolidate before building proofing, or is one deprecated?

2. **Proofing without payment timing:** Can proofing be enabled on a "Classic" (pay-before-access) gallery? The plan implies proofing is only for "Proof First Pay Later," but Story 2.3 AC #6 mentions all three payment timings. Clarify whether proofing is available on all gallery types or only `after_proofing` galleries.

3. **External payment and photographer subscription enforcement:** Story 1.2 says "photographer's $22/mo platform subscription remains required (enforced at account level, not gallery level)." Is this enforcement already built? If not, it needs a story — otherwise "Deliver and Done" becomes a free tier.

4. **Revenue impact acceptance:** "Deliver and Done" generates $0 per gallery. Has the business impact been explicitly accepted? The plan flags it as "accepted business risk" but it's worth confirming with the user before building.

5. **Admin tools:** Multiple stories mention "admin override" for stuck galleries. Is there an existing admin dashboard, or does this need to be built?

---

## What the Plan Gets Right

1. **Additive-only schema changes.** New nullable columns with defaults means zero risk to existing galleries. This is the right approach.

2. **Implementation order is correct.** Data model first (2.1), then wizard (1.1), then UI (2.2), then flows (1.2, 2.3, 1.3). Dependencies are properly sequenced.

3. **Epic 3 deferred to Phase 2.** The AI edits system is the highest-complexity, lowest-priority feature. Deferring it is wise.

4. **Preset flows address real photographer pain.** The Pixieset recon shows photographers want speed. Three presets that auto-fill settings is genuinely useful and competitive.

5. **One-way proofing is the right scope.** Not building a back-and-forth chat system keeps complexity manageable. Client submits once, photographer acts on it. Simple.

6. **CSS-filter-only approach for proofing previews.** Zero server cost for previews, instant client feedback, no storage overhead. Smart choice for v1.

7. **Risk assessment and rollback plans** are included per story. This is thorough and shows defensive thinking.

8. **Story sizing** appears reasonable at 4-8 hours each, though Story 1.3 (Proof First Pay Later) is likely the densest and may need splitting.

---

## Recommendation

**Proceed with implementation after addressing the three Critical Issues:**

1. Fix the CHECK constraint migration plan (C1) — this will literally block deployment
2. Resolve the `photos` vs `gallery_photos` table question (C2) — proofing FK must target the right table
3. Decide on `payment_status` semantics for external payment galleries (C3) — affects reporting accuracy

The Concerns (S1-S6) should be addressed during implementation but don't block starting. The most important concern is S2 (cron specification) — decide on cron vs. on-read check before implementing Story 2.1.

Overall, this is a solid brownfield plan that respects the existing architecture. The implementation order is well-thought-out and the scope is realistic. Fix the critical issues and this is ready to build.
