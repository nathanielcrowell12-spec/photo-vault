# QA Critic Review: Supabase Soft-Delete Fix Plan

**Date:** 2026-02-14
**Reviewer:** QA Critic Expert
**Plan Reviewed:** `supabase-soft-delete-fix-plan.md`
**Verdict:** APPROVE WITH CONCERNS

---

## Overall Assessment

The plan is well-structured, correctly identifies the root cause (migration never applied, wrong table name), and takes the right architectural approach (application-level filtering over RLS modification). The SQL migration is clean and the trigger pattern is sound. However, there are several issues ranging from a critical naming collision risk to missing file coverage and a contradictory restore handler that must be addressed before implementation.

---

## Top 3 Concerns

### 1. CRITICAL: `status` Column Name Collision with `gallery_status`

The `photo_galleries` table already has a column called `gallery_status` (values: 'draft', 'ready', 'live', 'archived') for workflow state. The plan adds a new column called `status` (values: 'active', 'deleted') for soft-delete state. This creates a confusing dual-status situation:

- A gallery can be `gallery_status = 'draft'` and `status = 'active'` simultaneously.
- Existing code that queries `.eq('status', ...)` on OTHER tables (clients, subscriptions, commissions) already uses `status` in various contexts. Adding yet another `status` column on `photo_galleries` with completely different semantics is a naming footgun.
- The admin analytics service at `src/lib/server/admin-analytics-service.ts` line 113 already has a comment explicitly warning: `// CORRECT: gallery_status, not status` -- which means this codebase has already been burned by this exact confusion.
- Future developers WILL write `.eq('status', 'active')` thinking they are filtering by gallery workflow status rather than soft-delete status.

**Recommendation:** Rename the new column to `deletion_status` or `is_deleted` (boolean) + `deleted_at` (timestamp). If using a boolean, the filter becomes `.eq('is_deleted', false)` which is unambiguous. If using `deletion_status`, the filter becomes `.eq('deletion_status', 'active')` which is at least searchable. The plan as written uses a generic name that will cause confusion with `gallery_status`.

**Severity:** HIGH. This is a design-time decision that is expensive to change later. Get it right now.

### 2. HIGH: Restore API Contradicts the "No Photo Soft-Delete" Design Decision

The plan explicitly states (Section "What This Migration Does NOT Do", point 2):

> "Does NOT add soft-delete to `gallery_photos` or `photos`. Photos are not individually soft-deleted."

However, the existing restore handler at `src/app/api/galleries/[id]/route.ts` (lines 53-58) does this:

```typescript
const { error: photosError } = await supabase
  .from('gallery_photos')
  .update({ status: 'active', deleted_at: null })
  .eq('gallery_id', id);
```

The plan says this file needs "No code changes." But:

- `gallery_photos` does not have a `deleted_at` column (confirmed by schema catalog).
- `gallery_photos` does have a `status` column, but it is for photo-level status (default 'active'), not soft-delete.
- Calling `.update({ status: 'active', deleted_at: null })` on `gallery_photos` will either fail (if `deleted_at` does not exist on that table) or silently do nothing useful.

This code was written by someone who assumed photos would also be soft-deleted, but the plan explicitly chose not to do that. **The restore handler must be updated to remove the `gallery_photos` update, or this will error out on restore.**

**Severity:** HIGH. The restore flow will break.

### 3. MEDIUM-HIGH: Significant Missing File Coverage (Admin + Utility Queries)

The plan identifies 8 files to modify but a codebase-wide search for `.from('photo_galleries')` found 108 file references. While many are in docs/plans/scripts, several operational source files are not covered:

**Admin dashboard queries (should probably NOT filter by status -- admin needs to see everything):**
- `src/app/api/admin/clients/route.ts` (line 71) -- counts galleries per client. Should this include deleted? The plan does not discuss it.
- `src/app/api/admin/leaderboard/route.ts` (line 90) -- counts galleries per photographer.
- `src/app/api/admin/photographers/route.ts` (lines 72, 138) -- gallery counts in photographer listings.
- `src/lib/server/admin-analytics-service.ts` (lines 101, 111, 137, 215, 258) -- total gallery counts, health check, gallery breakdown. Currently counts ALL galleries. After migration, will soft-deleted galleries inflate counts?
- `src/lib/server/admin-database-service.ts` (line 99)
- `src/lib/server/admin-revenue-service.ts` (line 172)
- `src/lib/helm/queries.ts` (9+ queries at lines 106, 125, 216, 379, 412, 435, 521, 666, 689)

**Client-facing queries missing from the plan:**
- `src/app/api/client/favorites/route.ts` -- The plan lists this as P3 "consider filtering by gallery status" but this is actually important. A user who deletes a gallery will still see favorite photos from that gallery. That is confusing UX.
- `src/app/api/client/notifications/route.ts` -- queries `photo_galleries` for notification context.
- `src/app/api/conversations/contacts/route.ts` -- queries `photo_galleries` for contact resolution.
- `src/app/api/gallery/[galleryId]/route.ts` -- uses admin client (bypasses RLS) to fetch gallery info for paywall. A deleted gallery could still be served on the paywall page.
- `src/app/gallery/[galleryId]/page.tsx` -- single gallery viewer. A deleted gallery is fully viewable via direct URL.
- `src/lib/subscription-access.ts` -- checks subscription access using gallery data.

**The plan should explicitly categorize every file that queries `photo_galleries` into:**
1. MUST filter (user-facing listings) -- covered
2. MUST NOT filter (admin views, webhooks, payment processing)
3. SHOULD filter (debatable, lower priority)

Without this, future developers will not know which queries intentionally show all galleries and which were simply missed.

**Severity:** MEDIUM-HIGH. The missing files will not break anything immediately, but they create inconsistent behavior and data leakage (deleted galleries appearing in some views but not others).

---

## Additional Concerns

### 4. MEDIUM: `search_galleries` RPC Function Must Be Updated in the Migration

The plan identifies the `search_galleries` function as needing an update but punts to "check the function definition" and offers a fallback of filtering in JavaScript. I found the function definition in `database/add-gallery-metadata-search.sql` (lines 194-256). It does NOT filter by status. The fix is straightforward -- add `AND (g.status = 'active')` to the WHERE clause. This should be included in the migration SQL, not left as a TODO.

**Specific fix for the migration:**

```sql
CREATE OR REPLACE FUNCTION search_galleries(
  -- same parameters --
)
RETURNS TABLE (/* same columns */)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT /* same columns */
  FROM photo_galleries g
  WHERE
    g.photographer_id = p_photographer_id
    AND g.status = 'active'  -- ADD THIS LINE
    AND (p_search_query IS NULL OR ...)
    -- rest unchanged
  ORDER BY relevance DESC, g.created_at DESC
  LIMIT p_limit;
END;
$$;
```

### 5. MEDIUM: Permanent Deletion Function Has a Race Condition

The `permanent_delete_old_galleries()` function does this:

```sql
ALTER TABLE photo_galleries DISABLE TRIGGER handle_soft_delete_gallery;
-- deletes --
ALTER TABLE photo_galleries ENABLE TRIGGER handle_soft_delete_gallery;
```

This is dangerous in a concurrent environment. If a user deletes a gallery while the cron job is running and the trigger is disabled, their gallery will be PERMANENTLY deleted instead of soft-deleted. `ALTER TABLE ... DISABLE TRIGGER` is a DDL statement that takes an ACCESS EXCLUSIVE lock, which will block all other operations on the table. On a production database with concurrent users, this could cause:

1. Brief downtime for all gallery operations while the lock is held.
2. If the function fails partway through, the trigger stays disabled.

**Better approach:** Instead of disabling the trigger, have the permanent delete function update the rows to a third status (e.g., `status = 'purging'`) first, then delete rows with `status = 'purging'`. The trigger checks `IF OLD.status != 'purging' THEN soft-delete ELSE allow DELETE`. This avoids any DDL or trigger manipulation.

Alternatively, use a simpler approach: just hard-delete from within the function body using raw SQL (since the function is already `SECURITY DEFINER`), bypassing the trigger entirely:

```sql
-- The trigger only fires on DELETE via the table.
-- A direct DELETE in a SECURITY DEFINER function still fires the trigger.
-- Must use session_replication_role or similar.
```

Actually, the current approach of disabling/enabling the trigger WILL work in a SECURITY DEFINER function. But wrap it in an explicit transaction with proper error handling:

```sql
BEGIN
    ALTER TABLE photo_galleries DISABLE TRIGGER handle_soft_delete_gallery;
    -- deletions --
    ALTER TABLE photo_galleries ENABLE TRIGGER handle_soft_delete_gallery;
EXCEPTION WHEN OTHERS THEN
    ALTER TABLE photo_galleries ENABLE TRIGGER handle_soft_delete_gallery;
    RAISE;
END;
```

### 6. MEDIUM: `gallery_photos` Table Has No RLS -- Deleted Gallery Photos Are Still Accessible

The schema catalog confirms: `gallery_photos` has NO RLS. This means that even after a gallery is soft-deleted, all photos in that gallery remain fully accessible via direct queries to `gallery_photos`. Any API endpoint or client-side code that queries `gallery_photos` by `gallery_id` will still return photos for deleted galleries.

The plan acknowledges this ("photos remain linked to the gallery") but does not address the access control implication. If a client can query `gallery_photos` directly (which they can, since there is no RLS), they can still view photos from a gallery someone else deleted.

This may be acceptable for the current architecture, but it should be explicitly documented as a known limitation.

### 7. LOW-MEDIUM: The `deleted/page.tsx` Only Shows Client-Deleted Galleries

The Recently Deleted page at `src/app/client/deleted/page.tsx` only queries galleries accessible to the current user via `client_id` or `user_id`. But the delete API allows both photographers AND clients to delete galleries. If a photographer deletes a gallery:

- The photographer has no "Recently Deleted" page.
- The client may or may not see it in their Recently Deleted page, depending on whether the gallery's `client_id` matches their client record.

The plan does not address the photographer-side experience. Should there be a `/photographer/deleted` page, or should the existing `/client/deleted` page be made role-aware?

### 8. LOW: The Plan References Line Numbers That May Drift

The plan references specific line numbers (e.g., "line ~107", "line ~162"). Line numbers drift with any code change. The plan would be more durable if it referenced the code patterns or function names instead of line numbers. This is a minor documentation concern.

### 9. LOW: No TypeScript Type Update

After adding `status` and `deleted_at` columns, the Supabase TypeScript types should be regenerated (`npx supabase gen types typescript`). The plan does not mention this step. Without it, TypeScript will not recognize the new columns, and `.eq('status', 'active')` will show type errors.

### 10. LOW: Schema Catalog Update Not Mentioned

Per the Supabase skill file, after ANY schema modification: "UPDATE: PHOTOVAULT_SCHEMA_CATALOG.md". The plan does not mention updating the schema catalog with the new `status` and `deleted_at` columns.

---

## Correctness Check: Migration SQL

The SQL migration itself is well-written. Specific observations:

- `ADD COLUMN IF NOT EXISTS` is idempotent -- good.
- `DEFAULT 'active'` ensures existing rows are correct -- good.
- The defensive `UPDATE ... WHERE status IS NULL` is unnecessary since the column has a NOT NULL DEFAULT, but harmless.
- The trigger function using `SECURITY DEFINER` is correct -- without it, the UPDATE inside the trigger would be subject to RLS and could fail.
- The `SET search_path = public` on the SECURITY DEFINER functions is a security best practice -- good.
- The partial index on `deleted_at WHERE deleted_at IS NOT NULL` is a smart optimization.
- Drop-then-create for the trigger (`DROP TRIGGER IF EXISTS ... CREATE TRIGGER`) is idempotent -- good.

---

## Deployment Order Assessment

The plan's deployment order (migration first, then code) is correct. The brief window where old code runs against the new schema is safe:
- Old code does `.select('*')` which now returns the `status` column but does not filter on it -- galleries still appear (current behavior).
- New code with `.eq('status', 'active')` against old schema (no column) would fail -- hence migration must come first.

The plan correctly identifies this.

---

## Summary Table

| # | Concern | Severity | Recommendation |
|---|---------|----------|----------------|
| 1 | `status` column name collides with `gallery_status` | HIGH | Rename to `deletion_status` or use `is_deleted` boolean |
| 2 | Restore API updates `gallery_photos.deleted_at` which does not exist | HIGH | Remove `gallery_photos` update from restore handler |
| 3 | 20+ files querying `photo_galleries` not categorized | MEDIUM-HIGH | Explicitly categorize all query files |
| 4 | `search_galleries` RPC not included in migration SQL | MEDIUM | Add updated function to migration |
| 5 | Permanent delete function has race condition | MEDIUM | Add error handling or alternative approach |
| 6 | `gallery_photos` has no RLS, photos of deleted galleries remain accessible | MEDIUM | Document as known limitation |
| 7 | No photographer-side "Recently Deleted" page | LOW-MEDIUM | Plan for photographer UX |
| 8 | Line number references will drift | LOW | Use pattern references instead |
| 9 | No TypeScript type regeneration step | LOW | Add `npx supabase gen types` step |
| 10 | Schema catalog update not mentioned | LOW | Add PHOTOVAULT_SCHEMA_CATALOG.md update step |

---

## Verdict: APPROVE WITH CONCERNS

The plan is fundamentally sound and the approach (application-level filtering, trigger-based soft delete) is correct. However, **concerns #1 and #2 must be resolved before implementation begins:**

1. The column naming collision between `status` and `gallery_status` will cause confusion and bugs. Choose a more specific name.
2. The restore handler's attempt to update `gallery_photos.deleted_at` will fail. This contradicts the plan's own design decision and must be fixed.

Concern #4 (search_galleries RPC) should also be resolved in the migration itself rather than left as a TODO.

Once these three items are addressed, the plan can proceed to implementation.
