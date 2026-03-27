# Proofing Review Enhancement Plan — QA Critic Review

**Date:** 2026-03-27
**Reviewer:** QA Critic Expert
**Plan reviewed:** `docs/claude/plans/proofing-review-enhancement-plan.md`
**Verdict:** CONDITIONAL PASS — 3 blockers, 5 warnings, 4 notes

---

## BLOCKERS (Must fix before implementation)

### B1. Wrong table name for `sort_position` migration

The plan says:

```sql
ALTER TABLE photos ADD COLUMN sort_position integer;
```

This is correct — the `photos` table (464 rows) is the table used by the proofing system. **However**, the backfill query and the existing proofing review page both order by `created_at`, so we need to verify the `photos` table has a `created_at` column. The schema catalog entry for `photos` does NOT list `created_at` — it only shows `id`, `gallery_id`, `filename`, `original_url`, `thumbnail_url`, `medium_url`, `full_url`, `exif_data`, `tags`, `is_sneak_peek`. If `created_at` doesn't exist, the backfill migration will fail silently or error.

**Action:** Before writing the migration, run `SELECT column_name FROM information_schema.columns WHERE table_name = 'photos'` to confirm `created_at` exists. If it doesn't, the backfill strategy needs rethinking (perhaps use `id` ordering or the upload order from storage metadata).

**Counterpoint:** The existing `proofing-review/page.tsx` at line 116 already does `.order('created_at', { ascending: true })` and presumably works, so `created_at` likely exists but is missing from the schema catalog. Still — verify before migrating.

### B2. Replace API has no thumbnail/medium regeneration

The plan says the Replace API will:
> Updates `photos` row: new `original_url`, `thumbnail_url`, `full_url`, `filename`

But the existing upload flow in `upload/page.tsx` (line 194) sets `thumbnail_url` and `full_url` to the SAME URL as `original_url` — there's no thumbnail generation pipeline. The plan assumes the replacement file's URL can be used directly for all three columns, which is consistent with the current approach. **However**, the schema shows `medium_url` as a separate column, and the proofing review page uses `photo.medium_url || photo.thumbnail_url || photo.original_url` (line 296).

The plan does NOT mention updating `medium_url`. If it's left as the old value, the proofing review page will display the OLD photo from `medium_url` even after replacement.

**Action:** Add `medium_url` to the list of columns updated by the Replace API. The plan must explicitly set all four URL columns: `original_url`, `thumbnail_url`, `medium_url`, `full_url`.

### B3. Zero-change guardrail logic is incomplete

The plan says (Story 2.5):
> On "Submit to Photographer" click, check if ANY proofing_submission has a non-null `filter_selection` OR non-null/non-empty `client_note`

But looking at the existing `ProofingPanel.tsx`, the submit flow goes through `handleSubmit()` which calls `/api/gallery/${galleryId}/proofing/submit`. The existing submit API at line 74 already rejects submissions with ZERO proofing_submission rows:

```
if (!unsubmitted || unsubmitted.length === 0) {
  return NextResponse.json(
    { error: 'No proofing selections to submit. Review at least one photo first.' },
```

So the zero-change check needs to be **client-side only** (before calling the API), and it needs to distinguish between:
- (a) Client reviewed photos but left everything as "Original" / no notes = zero CHANGES but has submission rows
- (b) Client didn't interact with any photos at all = zero ROWS

The existing API only blocks case (b). The plan's guardrail targets case (a), but the plan doesn't mention case (b) at all, and the existing server-side check handles (b) already. The plan should explicitly state: "The client-side guardrail handles case (a); the existing server-side check handles case (b); both remain."

Also: the `selections` Map in `ProofingPanel.tsx` stores entries for ANY photo the client interacted with, even if they just clicked "Original" (filter_selection = null). A client who clicks through all photos selecting "Original" on each would have `selections.size > 0` with all `filter_selection = null` and all `client_note = null`. The plan's check `non-null filter_selection OR non-null/non-empty client_note` would correctly identify this as zero changes — good. But the check must iterate the selections Map values, not just check `selections.size`.

**Action:** Clarify in the plan that the check iterates selection values, not just checks collection size. Also document the interaction with the existing server-side validation.

---

## WARNINGS (Should fix, risk of bugs if ignored)

### W1. Pagination with mixed layouts creates visual inconsistency

The plan says 24 photos per page in a grid. Photos WITH feedback show as side-by-side cards (taking much more vertical space), photos WITHOUT feedback show as simple thumbnails. If page 1 happens to have 20 photos with feedback and page 2 has 4, the pages will have wildly different heights and scrolling experiences.

Worse: the plan says "paginated grid" but doesn't specify whether the pagination count is by PHOTO or by CARD. If it's 24 photos per page, a page with all feedback photos will have 24 large side-by-side cards. If it's 24 cards, then feedback photos and non-feedback photos count the same.

**Recommendation:** Paginate by PHOTO count (not visual card count). Accept variable page heights. The user said "paginated grid" meaning all photos are in the grid, some just happen to have feedback displayed inline. This is the right approach — but document it explicitly.

### W2. No optimistic UI for acknowledge/replace actions

The progress counter "4/12 changes remaining" decrements on acknowledge or replace. The plan doesn't specify whether this is optimistic (update UI immediately, revert on error) or pessimistic (wait for API response). Given that the page is a `'use client'` component with useState, this needs to be decided.

**Recommendation:** Use optimistic updates with rollback on error. Waiting for API response on every acknowledge click will feel sluggish when a photographer is processing 50+ feedback items.

### W3. Race condition between replace and acknowledge

The plan says:
> Replace API auto-sets `photographer_acknowledged = true` on the related proofing_submission

But what if the photographer acknowledges first, then changes their mind and replaces? The replace would set `photographer_acknowledged = true` again (no-op). What about the reverse — replace first, then the photographer clicks acknowledge on the same photo? The acknowledge API should either:
- (a) Be a no-op if already acknowledged (idempotent)
- (b) Reject with a message like "already resolved"

The plan doesn't address this. Both replace and acknowledge should be idempotent.

**Recommendation:** Make both actions idempotent. If a photo is already acknowledged (by either method), acknowledge is a no-op returning success. Document this.

### W4. Storage cleanup has no error handling strategy

The plan says:
> Old file URL parsed to extract storage path, then `supabase.storage.from('photos').remove([oldPath])`

If the URL format changes, or the file was already deleted, or the storage bucket has different permissions, this will fail. The plan mentions "Log old file path, retry on failure, eventual cleanup job" in the risks table but doesn't specify:
- Where the old path is logged (database? application logs?)
- What "retry on failure" means (retry in the same request? background job?)
- Whether the replace operation should SUCCEED even if storage cleanup fails

**Recommendation:** The replace should succeed even if old file deletion fails. Log the orphaned path to a `storage_cleanup_queue` table or at minimum to structured application logs. Don't block the photographer's workflow on storage cleanup.

### W5. Acknowledge API path uses `submissionId` but the data model may not expose it

The plan defines: `PATCH /api/gallery/[galleryId]/proofing/[submissionId]/acknowledge`

The existing proofing review page builds a `proofingMap` keyed by `photo_id`, not by `submission.id`. The proofing GET API does return `id` on each submission, so the data is available. But the UI will need to look up the submission ID from the photo ID to call this endpoint. Consider whether `photo_id` would be a simpler API parameter.

**Recommendation:** Consider `PATCH /api/gallery/[galleryId]/proofing/acknowledge` with `{ photo_id }` in the request body. Simpler for the frontend and avoids an extra lookup. The backend can find the submission by `(gallery_id, photo_id)`.

---

## NOTES (Minor items, nice-to-have improvements)

### N1. No loading/error states specified for the new page

The existing page has basic loading/error states. The plan doesn't mention loading skeletons for the paginated grid or error boundaries for individual photo cards. The Next.js skill requires `loading.tsx` and `error.tsx` for async pages. Since this is a client component doing its own data fetching, inline loading states are acceptable, but should be explicitly designed.

### N2. "Mark Revisions Complete" button gating

The plan says the button is "only enabled when progress counter = 0/X". The existing page (line 357) gates on `gallery.gallery_status === 'proofing_complete'` but doesn't check progress. The plan should clarify: is the button visible but disabled until 0/X, or hidden entirely? What if the photographer wants to mark complete before addressing all feedback (artistic judgment)?

**Recommendation:** Show the button always but gate with a confirmation dialog: "You still have X unresolved items. Are you sure?" This respects photographer autonomy while preventing accidents.

### N3. Dashboard zero-change detection query

The plan says to check "if any have zero proofing_submissions with changes" for the dashboard warning. This requires joining `photo_galleries` with `proofing_submissions` and checking for the absence of non-null `filter_selection` or `client_note`. This is a moderately complex query. The current dashboard (line 93-98) does a simple `.eq('gallery_status', 'proofing_complete')` query. Adding the zero-change check will either require:
- A subquery/join in the same call
- A separate API call per gallery
- A denormalized flag on `photo_galleries`

**Recommendation:** Add a `has_proofing_changes` boolean column to `photo_galleries`, set by the submit API. Simplest to query on the dashboard and avoids N+1 problems.

### N4. No mention of RLS policies for new columns

The plan adds `photographer_acknowledged` and `acknowledged_at` to `proofing_submissions`. The existing RLS policies allow clients to INSERT/UPDATE (pre-submit) and photographers to SELECT. The acknowledge API will need the photographer to UPDATE `proofing_submissions` — but the existing RLS only allows client updates. The plan should include an RLS policy update:

```sql
CREATE POLICY "photographer_acknowledges_proofing" ON proofing_submissions
FOR UPDATE TO authenticated
USING (
  gallery_id IN (
    SELECT id FROM photo_galleries
    WHERE photographer_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  gallery_id IN (
    SELECT id FROM photo_galleries
    WHERE photographer_id = (SELECT auth.uid())
  )
);
```

Or, the acknowledge API could use the service role client to bypass RLS (like the submit API does). Either way, this needs to be specified.

---

## Alignment Check: Does the Plan Match What the User Asked For?

| User Request | Plan Coverage | Verdict |
|---|---|---|
| Paginated grid with ALL photos | Yes - 24/page, page numbers | OK |
| Side-by-side for feedback photos, original-only for no-feedback | Yes - grid layout described | OK |
| Progress counter "4/102" | Yes - but denominator is feedback-only, not total photos | Matches user intent (4 of 12 changes, not 4 of 102 photos) |
| Replace — upload new edited version in-place | Yes - same row, new URLs, delete old file | OK |
| Preserve chronological position (critical for weddings) | Yes - `sort_position` column | OK (see B1 for migration concern) |
| Acknowledge (bypass) for praise/judgment calls | Yes - `photographer_acknowledged` flag | OK |
| Client guardrail for zero changes | Yes - confirmation dialog | OK (see B3 for completeness) |
| Dashboard notification with amber warning | Partially - described but thin on implementation | Needs detail (see N3) |
| No infinite scroll | Yes - explicit pagination | OK |

**The counter format is slightly different from what the user described.** The user said "4/102" implying 4 changes out of 102 total photos. The plan says the denominator is "total number of proofing_submissions where client made a change." Both interpretations are reasonable, but the user's example of "4/102" suggests total-photos denominator. Clarify with user.

---

## Summary

The plan is solid architecturally. The `sort_position` approach is correct for preserving order. The separate acknowledge vs replace actions match the user's workflow. The three blockers are all fixable with minor plan amendments:

1. **B1:** Verify `created_at` exists on `photos` table before migration
2. **B2:** Include `medium_url` in the Replace API column updates
3. **B3:** Clarify zero-change detection logic (iterate values, not just check size)

The warnings are about robustness rather than correctness — the plan will work without fixing them, but the UX and reliability will be better with the recommended changes, especially W4 (storage cleanup) and W5 (simpler API path).
