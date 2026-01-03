# Plan Critique: Favorite API Foreign Key Fix

**Plan Reviewed:** `docs/claude/plans/favorite-api-fk-fix-plan.md`
**Skill Reference:** `Stone-Fence-Brain/VENTURES/PhotoVault/claude/skills/supabase-skill.md`
**Date:** 2026-01-03

---

## Summary Verdict

**NEEDS REVISION**

The plan correctly identifies the root cause (FK mismatch between `gallery_photos` and `photo_galleries`), but the proposed fix introduces unnecessary complexity and perpetuates technical debt. The "Option A" approach of querying two separate gallery tables is a band-aid, not a proper fix. The plan also misses a critical observation: the `gallery_photos` table FK points to `galleries`, but the consolidation migration already migrated gallery records from `galleries` to `photo_galleries` - so `gallery_photos.gallery_id` may now reference orphaned or non-existent records.

---

## Critical Issues (Must Fix)

### 1. **The "Legacy Fallback" Is Backwards**

- **What's wrong:** The plan proposes querying `photo_galleries` first, then falling back to `galleries`. But the consolidation migration (Step 8) COPIED data FROM `galleries` TO `photo_galleries`. If a gallery exists in `galleries`, it should also exist in `photo_galleries` after migration. The fallback is solving the wrong problem.
- **Why it matters:** The fallback suggests there are galleries in `galleries` that don't exist in `photo_galleries`, but post-migration that shouldn't happen. If it does happen, that's a data integrity issue that needs investigation, not a code workaround.
- **Suggested fix:** First verify: are there actually galleries in `galleries` that don't exist in `photo_galleries`? If yes, re-run the migration. If no, the fallback is unnecessary.

### 2. **FK Relationship Remains Broken**

- **What's wrong:** After this fix, `gallery_photos.gallery_id` still references `galleries.id`, not `photo_galleries.id`. This means:
  - PostgREST joins between `gallery_photos` and `photo_galleries` will NEVER work
  - Every API that needs gallery info for a photo must use this multi-query workaround
  - The `photos` table (from schema.sql) correctly references `photo_galleries`, creating an inconsistent schema
- **Why it matters:** This is exactly the kind of band-aid Nate hates. The plan acknowledges this in "Step 3: Consider future migration" but kicks the can down the road.
- **Suggested fix:** If we're touching this code anyway, consider Option B (add the FK). Or at minimum, create a migration ticket with higher priority than "lower priority."

### 3. **No Investigation of Existing Data State**

- **What's wrong:** The plan does not include a step to query the actual database and understand:
  - How many rows in `gallery_photos`?
  - How many have `gallery_id` that exists in `galleries` only?
  - How many have `gallery_id` that exists in `photo_galleries`?
  - Are there orphaned `gallery_photos` with no parent gallery at all?
- **Why it matters:** Without this data, we're guessing at the fix. The correct solution depends entirely on the actual data state.
- **Suggested fix:** Before coding, run diagnostic queries:
  ```sql
  -- Photos with gallery in photo_galleries
  SELECT COUNT(*) FROM gallery_photos gp
  WHERE EXISTS (SELECT 1 FROM photo_galleries pg WHERE pg.id = gp.gallery_id);

  -- Photos with gallery in galleries only
  SELECT COUNT(*) FROM gallery_photos gp
  WHERE EXISTS (SELECT 1 FROM galleries g WHERE g.id = gp.gallery_id)
  AND NOT EXISTS (SELECT 1 FROM photo_galleries pg WHERE pg.id = gp.gallery_id);

  -- Orphaned photos
  SELECT COUNT(*) FROM gallery_photos gp
  WHERE NOT EXISTS (SELECT 1 FROM galleries g WHERE g.id = gp.gallery_id)
  AND NOT EXISTS (SELECT 1 FROM photo_galleries pg WHERE pg.id = gp.gallery_id);
  ```

---

## Concerns (Should Address)

### 1. **Two Gallery Tables Means Two RLS Policy Chains**

- **What's wrong:** The plan's fix queries `photo_galleries` with its RLS policies, then falls back to `galleries` with different RLS policies. The access control logic differs between tables:
  - `photo_galleries`: Uses `client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())`
  - `galleries`: Uses `user_id = auth.uid()` directly
- **Why it matters:** A photo might be accessible via one gallery table's RLS but not the other, leading to inconsistent behavior.
- **Suggested fix:** Document which RLS policies are being applied and ensure access logic is consistent.

### 2. **The `clientUserId` Extraction Is Fragile**

- **What's wrong:** The plan hardcodes handling of `clients` join:
  ```typescript
  clientUserId: Array.isArray(clientData) ? clientData[0]?.user_id : clientData?.user_id
  ```
  But for the legacy `galleries` fallback, it sets `clientUserId: null` with comment "Legacy galleries don't have client FK to get user_id."
- **Why it matters:** If a user is linked to a gallery via the `galleries` table (which has `user_id` directly), they won't be able to favorite photos because the access check uses `clientUserId` which is null.
- **Suggested fix:** The access check needs to be:
  ```typescript
  const hasAccess =
    gallery.user_id === user.id ||
    gallery.photographer_id === user.id ||
    gallery.clientUserId === user.id
  ```
  For legacy galleries, `gallery.user_id` would grant access. Verify this is the intended behavior.

### 3. **No Unit Test Plan**

- **What's wrong:** The skill file (supabase-skill.md) emphasizes testing, and the plan has a "Testing Checklist" but doesn't specify:
  - How to create test data with photos in each scenario
  - Whether integration tests exist or need to be written
  - How to test the RLS policies specifically
- **Why it matters:** Manual testing of 6 scenarios is error-prone and won't catch regressions.
- **Suggested fix:** Add test setup steps or reference existing test infrastructure.

### 4. **Missing `(SELECT auth.uid())` Optimization**

- **What's wrong:** The supabase-skill explicitly warns about wrapping `auth.uid()` in a subselect for performance. The plan's code doesn't address whether the underlying RLS policies follow this pattern.
- **Why it matters:** If the policies don't use `(SELECT auth.uid())`, every row check will call `auth.uid()` repeatedly.
- **Suggested fix:** Either verify the policies already follow this pattern, or note it as out of scope for this fix.

---

## Minor Notes (Consider)

- The plan mentions `photos` table in schema.sql (line 83-102) which has `is_favorite` column and correctly references `photo_galleries`. Why is the favorite toggle using `gallery_photos` instead of `photos`? Are there TWO photo tables as well? If so, this is a larger consolidation issue.

- The error logging in the proposed fix logs `photoError` even when it's null (line 196-197 logs even when error is falsy).

- The proposed `gallery` type (line 201) is declared inline. Consider extracting to a proper TypeScript type for reuse.

- The plan's "Appendix: Schema Summary" would be more useful if it showed the actual FK constraints as they currently exist in production (verified via SQL query), not just what the migration files say.

---

## Questions for the User

1. **Can we run the diagnostic queries first?** Before implementing either option, we need to know the actual data distribution across `galleries` vs `photo_galleries`.

2. **Is this the right time to fix the FK properly?** Given the plan already acknowledges Option B is the "right" fix but defers it, would Nate prefer we do it now since we're already touching this area?

3. **Are there actually two photo tables (`gallery_photos` and `photos`)?** If so, which is canonical and why are both being used?

4. **What's the user impact right now?** Is the favorite toggle completely broken, or only for certain galleries? This affects urgency vs. doing it right.

---

## What the Plan Gets Right

- **Root cause analysis is accurate:** The FK mismatch between `gallery_photos` referencing `galleries` vs API trying to join `photo_galleries` is correctly identified.

- **Evidence-based approach:** The plan cites specific file locations and line numbers (database/galleries-table.sql lines 95-97, database/schema.sql lines 83-85).

- **Acknowledges the working pattern:** Correctly identifies that `client/favorites/route.ts` uses a working approach with separate queries.

- **Documents both options:** Option A (code workaround) and Option B (schema fix) are both presented with pros/cons.

- **Includes testing checklist:** The plan has a comprehensive 6-point testing checklist covering all access scenarios.

- **References consolidation history:** Correctly notes that a previous migration attempted to consolidate but didn't update the FK.

---

## Recommendation

**Do not proceed to implementation yet.** First:

1. Run the diagnostic queries to understand actual data state
2. Determine if the consolidation migration ran successfully in production
3. Based on results, reconsider Option B (proper FK fix) vs Option A

If Option A must be used for speed, add a high-priority follow-up ticket to fix the FK properly within the next sprint, not "lower priority."

The current plan is technically correct but philosophically wrong for this codebase - it perpetuates the exact kind of dual-table confusion that caused this bug in the first place.

---

*QA Critic Expert | 2026-01-03*
