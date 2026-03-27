# Proofing Review Enhancement Plan

**Date:** 2026-03-27
**Status:** Revised — blocker fixes applied, QA critique addressed
**Epic:** Gallery Wizard & Proofing System (Stories 2.3b, 2.4, 2.5)

---

## Problem Statement

The proofing review page exists but doesn't support the photographer's actual workflow:
1. No way to replace individual photos in-place (preserve chronological order)
2. No way to distinguish client praise from client critique (bypass button)
3. No progress tracking — photographer doesn't know how many changes remain
4. No guardrail when client submits zero changes (likely an error)
5. Dashboard proofing notification is basic — doesn't show zero-change warnings

---

## Scope

### Story 2.3b — Proofing Review Page Redesign

**Goal:** Photographer sees full gallery in paginated grid with side-by-side feedback where applicable.

**Layout:**
- **Header:** Gallery name, status badge, progress counter **"4/102"** — 4 change requests remaining out of 102 total photos in the gallery
- **Grid:** All photos in paginated grid (24 per page, paginated by photo count — pages may vary in height)
  - Photos WITH client feedback: original on left, client's filter preview on right, note underneath, action buttons
  - Photos WITHOUT feedback: just the original thumbnail, no sister photo, no empty space
- **Zero-change banner:** If client submitted with no changes on any photo, prominent warning: "Customer made no change requests — please verify with customer"
- **Pagination:** Page numbers at bottom, no infinite scroll — ensures no photos get lost
- **Actions per feedback photo:**
  - **Replace** — opens file picker, uploads new version in-place
  - **Acknowledge** — marks feedback as "noted" without file replacement (for praise, or photographer's judgment call). Decrements counter.
- **Footer:** "Mark Revisions Complete" button — always visible, **soft-gated**:
  - If counter > 0: clicking shows confirmation popup with the counter: "You still have 4 of 102 photos with unresolved feedback. Are you sure you want to finalize?"
  - If counter = 0: proceeds directly (or with simple "Finalize gallery?" confirmation)

**UI behavior:**
- Acknowledge and replace use **optimistic updates** — counter decrements immediately, rolls back on API error
- Both actions are **idempotent** — acknowledging an already-acknowledged photo is a no-op returning success

---

### Story 2.4 — Photo Replace-in-Place + Acknowledge API

**Goal:** API endpoints for replacing a photo file and acknowledging feedback.

#### 2.4a — Acknowledge Feedback

**Database change:** Add `photographer_acknowledged` column to `proofing_submissions`.

```sql
ALTER TABLE proofing_submissions
  ADD COLUMN photographer_acknowledged boolean NOT NULL DEFAULT false,
  ADD COLUMN acknowledged_at timestamptz;
```

**RLS:** The acknowledge API uses the **service role client** (like the existing submit API) to bypass RLS. This avoids adding a photographer UPDATE policy to `proofing_submissions`, keeping the RLS model clean — clients write, photographers read, service role does cross-role updates.

**API:** `PATCH /api/gallery/[galleryId]/proofing/acknowledge`
- Request body: `{ photo_id: string }`
- Looks up submission by `(gallery_id, photo_id)` — simpler than routing by submissionId
- Sets `photographer_acknowledged = true`, `acknowledged_at = NOW()`
- Idempotent: if already acknowledged, returns success (no error)
- Validates photographer owns the gallery via auth check
- Returns updated submission

#### 2.4b — Replace Photo in Place

**Goal:** Upload a new image file, swap it into the same position in the gallery.

**Database change:** Add `sort_position` column to `photos` table (for explicit ordering).

```sql
ALTER TABLE photos ADD COLUMN sort_position integer;

-- Backfill existing photos with position based on created_at order
-- (created_at confirmed to exist on photos table via galleries-table.sql line 109)
WITH numbered AS (
  SELECT id, gallery_id,
    ROW_NUMBER() OVER (PARTITION BY gallery_id ORDER BY created_at ASC) as pos
  FROM photos
)
UPDATE photos SET sort_position = numbered.pos
FROM numbered WHERE photos.id = numbered.id;
```

**API:** `POST /api/gallery/[galleryId]/photos/[photoId]/replace`
- Accepts multipart form data with new image file
- Validates photographer owns the gallery
- Uploads new file to `photos` bucket: `${galleryId}/${timestamp}-${random}.${ext}`
- Updates `photos` row — **ALL four URL columns**: `original_url`, `thumbnail_url`, `medium_url`, `full_url`, `filename`
- Keeps same `id`, `sort_position`, `gallery_id` — chronological order preserved
- **Storage cleanup is non-blocking:** old file deletion happens after response. If it fails, log the orphaned path but do NOT fail the replace operation
- Auto-sets `photographer_acknowledged = true` on the related proofing_submission (replacing = acknowledging)
- Returns updated photo record

**Storage cleanup:** Old file URL parsed to extract storage path, then `supabase.storage.from('photos').remove([oldPath])`. Wrapped in try/catch — failure logged, not thrown.

---

### Story 2.5 — Client "No Changes" Guardrail

**Goal:** Prevent accidental zero-change submissions.

**Location:** `src/components/ProofingPanel.tsx` — submission flow

**Logic:**
- On "Submit to Photographer" click, **iterate all values in the selections Map**
- Check if ANY selection has a non-null `filter_selection` OR non-null/non-empty `client_note`
- Do NOT just check `selections.size` — a client who clicked through every photo selecting "Original" with no notes has `selections.size > 0` but zero actual changes
- **Case (a) — has rows but zero changes:** Show new confirmation dialog
  - Title: "No changes requested"
  - Body: "Proofing is your opportunity to request edits before final delivery. Are you sure you don't have any changes to request?"
  - Buttons: "Go Back" (primary) / "Yes, I'm sure" (secondary/outline)
- **Case (b) — zero rows (no interactions at all):** Already blocked by existing server-side check (400: "Review at least one photo first")
- If they confirm "Yes, I'm sure": proceed with normal submission flow
- If changes exist: use existing confirmation flow (no extra dialog)

**Dashboard enhancement:**
- Add `has_proofing_changes` boolean column to `photo_galleries` (denormalized flag)
- Set by the submit API when transitioning to `proofing_complete`:
  - Check if any `proofing_submissions` for this gallery have non-null `filter_selection` or `client_note`
  - Set `has_proofing_changes = true/false` accordingly
- Dashboard query: simple `.eq('gallery_status', 'proofing_complete')` + read `has_proofing_changes` — no joins needed
- Galleries with `has_proofing_changes = false`: amber warning style "Customer made no change requests — verify with customer"
- Galleries with `has_proofing_changes = true`: normal blue "Ready for review"

---

## Database Migration Summary

Single migration file: `database/proofing-review-enhancement-migration.sql`

```sql
-- 1. Add sort_position to photos for explicit ordering
ALTER TABLE photos ADD COLUMN sort_position integer;

-- 2. Backfill positions from created_at order
WITH numbered AS (
  SELECT id, gallery_id,
    ROW_NUMBER() OVER (PARTITION BY gallery_id ORDER BY created_at ASC) as pos
  FROM photos
)
UPDATE photos SET sort_position = numbered.pos
FROM numbered WHERE photos.id = numbered.id;

-- 3. Add acknowledge columns to proofing_submissions
ALTER TABLE proofing_submissions
  ADD COLUMN photographer_acknowledged boolean NOT NULL DEFAULT false,
  ADD COLUMN acknowledged_at timestamptz;

-- 4. Add denormalized proofing-changes flag to photo_galleries
ALTER TABLE photo_galleries
  ADD COLUMN has_proofing_changes boolean;
```

---

## API Endpoints Summary

| Method | Path | Purpose |
|--------|------|---------|
| PATCH | `/api/gallery/[galleryId]/proofing/acknowledge` | Mark feedback as acknowledged (body: `{ photo_id }`) |
| POST | `/api/gallery/[galleryId]/photos/[photoId]/replace` | Replace photo file in-place |

---

## File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `src/app/api/gallery/[galleryId]/proofing/acknowledge/route.ts` | Acknowledge API |
| `src/app/api/gallery/[galleryId]/photos/[photoId]/replace/route.ts` | Replace photo API |
| `database/proofing-review-enhancement-migration.sql` | Schema changes |

### Modified Files
| File | Changes |
|------|---------|
| `src/app/photographer/galleries/[id]/proofing-review/page.tsx` | Full redesign: paginated grid, side-by-side feedback, replace/acknowledge buttons, progress counter "X/Y", zero-change banner, soft-gated "Mark Revisions Complete" with popup |
| `src/components/ProofingPanel.tsx` | Add zero-change confirmation dialog (iterate selection values, not just size) |
| `src/app/photographer/dashboard/page.tsx` | Enhance proofing alerts: read `has_proofing_changes`, amber warning for zero-change galleries |
| `src/app/api/gallery/[galleryId]/proofing/submit/route.ts` | Set `has_proofing_changes` on `photo_galleries` during submit |

---

## Implementation Order

1. **Database migration** — add `sort_position`, `photographer_acknowledged`, `acknowledged_at`, `has_proofing_changes`
2. **Acknowledge API** — PATCH endpoint with `photo_id` body, idempotent, service role + tests
3. **Replace photo API** — file upload + storage swap + all 4 URL columns + non-blocking cleanup + tests
4. **Update submit API** — set `has_proofing_changes` flag on `photo_galleries` at submit time
5. **Proofing review page redesign** — paginated grid, progress counter "X/totalPhotos", action buttons, soft-gated finalize with popup, optimistic UI
6. **Client guardrail** — zero-change confirmation dialog in ProofingPanel (iterate values)
7. **Dashboard enhancement** — zero-change warning in proofing alerts using denormalized flag

---

## Key Design Decisions

1. **New DB record vs URL reuse for replacement:** Same `photos` row updated with new URLs. Old file deleted from storage (non-blocking). Clean DB, no cache issues.

2. **`sort_position` column:** Explicit ordering instead of relying on `created_at`. When a photo is replaced, `sort_position` stays the same — chronological gallery order preserved. Critical for weddings. Gaps from deletions are fine — only relative order matters.

3. **Acknowledge vs Replace:** Two distinct actions. Acknowledge = "I see the feedback, no file change needed." Replace = "I've uploaded a new version." Both clear the item from the progress counter. Both are idempotent.

4. **Progress counter format: "4/102"** — 4 = unresolved change requests (not acknowledged AND not replaced). 102 = total photos in the gallery. This gives the photographer the full picture: how much work remains relative to the gallery size.

5. **Soft-gated finalize:** "Mark Revisions Complete" is always visible. If unresolved items remain, clicking triggers a popup showing the count — photographer can override. Respects photographer autonomy.

6. **Pagination by photo count (24/page):** Pages may vary in height because feedback photos take more vertical space than plain thumbnails. This is acceptable — paginating by photo count keeps the mental model simple.

7. **`has_proofing_changes` denormalized flag:** Set once at submit time, avoids N+1 join queries on every dashboard load. Simple boolean on `photo_galleries`.

8. **Acknowledge API uses service role:** Keeps RLS model clean — clients write submissions, photographers read them, service role handles cross-role updates (same pattern as submit API).

9. **All four URL columns updated on replace:** `original_url`, `thumbnail_url`, `medium_url`, `full_url` all set to new file URL. Prevents stale `medium_url` showing old photo in fallback chains.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Large galleries (500+ photos) slow to load | Pagination (24/page), only load current page photos |
| Storage cleanup fails (orphaned files) | Non-blocking: log orphaned path, don't fail the replace |
| Photographer replaces wrong photo | Side-by-side preview visible; can re-replace if needed |
| `sort_position` gaps after deletions | Gaps are fine — only relative order matters |
| Race condition: photographer replaces while client still proofing | Gallery must be in `proofing_complete` status for replace API |
| Acknowledge then replace (or vice versa) on same photo | Both idempotent — no conflict |

---

## Test Plan

| Test | Type |
|------|------|
| Acknowledge API — sets flag, returns updated record | Unit |
| Acknowledge API — idempotent on already-acknowledged | Unit |
| Acknowledge API — rejects non-owner | Unit |
| Acknowledge API — accepts photo_id in body, finds submission | Unit |
| Replace API — uploads new file, updates ALL 4 URL columns + filename | Unit |
| Replace API — preserves sort_position | Unit |
| Replace API — auto-acknowledges related submission | Unit |
| Replace API — succeeds even if old file deletion fails | Unit |
| Replace API — rejects non-owner | Unit |
| Submit API — sets has_proofing_changes=true when changes exist | Unit |
| Submit API — sets has_proofing_changes=false when no changes | Unit |
| Progress counter — shows "X/totalPhotos" format | Component |
| Progress counter — decrements on acknowledge (optimistic) | Component |
| Progress counter — decrements on replace (optimistic) | Component |
| Soft-gate popup — shows count when counter > 0 | Component |
| Soft-gate popup — skips when counter = 0 | Component |
| Zero-change dialog — appears when selections exist but all are null/empty | Component |
| Zero-change dialog — doesn't appear when real selections exist | Component |
| Dashboard — shows amber warning for has_proofing_changes=false galleries | Component |
| Dashboard — shows normal style for has_proofing_changes=true galleries | Component |
| Pagination — correct page counts, 24 per page | Component |

---

## QA Critique Resolutions

| Blocker | Resolution |
|---------|------------|
| B1: `created_at` might not exist on `photos` | **Verified** — exists at `galleries-table.sql:109`. Backfill migration is safe. |
| B2: Replace API missing `medium_url` | **Fixed** — plan now explicitly updates all 4 URL columns |
| B3: Zero-change guardrail logic incomplete | **Fixed** — plan specifies iterating selection values, documents case (a) vs case (b) interaction with server-side check |

| Warning | Resolution |
|---------|------------|
| W1: Pagination with mixed layouts | **Documented** — paginate by photo count, accept variable page heights |
| W2: No optimistic UI | **Added** — optimistic updates with rollback on error |
| W3: Race between replace and acknowledge | **Added** — both actions are idempotent |
| W4: Storage cleanup blocking | **Fixed** — non-blocking, log-and-continue |
| W5: Acknowledge API uses submissionId | **Fixed** — changed to accept `photo_id` in request body |

| Note | Resolution |
|------|------------|
| N2: Hard-locked finalize button | **Changed** — soft-gated with popup showing count |
| N3: Dashboard zero-change query complexity | **Fixed** — denormalized `has_proofing_changes` flag on `photo_galleries` |
| N4: Missing RLS policy | **Resolved** — acknowledge API uses service role client |
