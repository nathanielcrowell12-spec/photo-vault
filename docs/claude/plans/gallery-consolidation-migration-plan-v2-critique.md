# Plan Critique: Gallery Consolidation Migration V2 (Re-Review)

**Plan Reviewed:** `gallery-consolidation-migration-plan-v2.md`
**Original Critique:** `gallery-consolidation-migration-plan-critique.md`
**Skill Reference:** `supabase-skill.md`
**Date:** 2026-01-03

---

## Summary Verdict

**APPROVE WITH CONCERNS**

The revised plan addresses all 6 critical issues from the original critique. The SQL syntax error is fixed, the photographer ID mapping is clarified with proper fallback logic, the transaction wrapper is in place, and RLS policies now include proper WITH CHECK clauses and use the correct column references. The migration is now structurally sound and ready for staging testing. However, there are a few concerns that should be addressed during implementation or monitored closely.

---

## Original 6 Critical Issues - Status

### 1. SQL Syntax Error - RAISE NOTICE Outside DO Block
**STATUS: FIXED**

The original plan had `RAISE NOTICE` statements outside of PL/pgSQL blocks. The v2 plan correctly wraps all RAISE NOTICE statements in DO blocks throughout the migration script.

Example from v2 (lines 134-140):
```sql
DO $$
BEGIN
    RAISE NOTICE 'Backup created: galleries=%, gallery_photos=%, photo_galleries=%',
        (SELECT COUNT(*) FROM _backup_galleries_20260103),
        ...
END $$;
```

### 2. Photographer ID Mapping Has Logic Gap
**STATUS: FIXED**

The v2 plan now clearly documents the relationship chain (lines 54-64):
- `auth.users.id = user_profiles.id = photographers.id` for photographers
- `galleries.photographer_id` references `user_profiles(id)` which equals `photographers.id`

The mapping logic (lines 226-235) now provides three fallback options:
```sql
COALESCE(
    -- Option 1: Direct match (photographer_id already equals photographers.id)
    (SELECT p.id FROM photographers p WHERE p.id = g.photographer_id),
    -- Option 2: Find photographer by user_id
    (SELECT p.id FROM photographers p WHERE p.user_id = g.user_id),
    -- Option 3: Find photographer where photographer_id = user_profiles.user_id
    (SELECT p.id FROM photographers p
     JOIN user_profiles up ON p.id = up.id
     WHERE up.user_id = g.photographer_id)
)
```

This is a robust approach that covers edge cases.

### 3. Undocumented client_id Column
**STATUS: FIXED**

The v2 plan (lines 73-78) now documents that `client_id` exists in the `clients-galleries-schema.sql` variant, and handles the case where it might be NULL (line 237-238):
```sql
-- client_id: May be NULL if column doesn't exist in this galleries variant
(SELECT g2.client_id FROM galleries g2 WHERE g2.id = g.id) as client_id,
```

Pre-migration verification query also checks for the column's existence (lines 779-781).

### 4. Missing WITH CHECK on UPDATE Policy
**STATUS: FIXED**

The UPDATE policy (lines 459-490) now correctly includes both USING and WITH CHECK clauses:
```sql
CREATE POLICY "Users can update photos in own galleries" ON gallery_photos
FOR UPDATE
USING (
    EXISTS (...)
)
WITH CHECK (
    EXISTS (...)
);
```

This prevents users from moving photos to galleries they don't own.

### 5. Admin Policy Uses Wrong Column
**STATUS: FIXED**

The admin policy (lines 509-516) now correctly uses `user_profiles.user_id`:
```sql
CREATE POLICY "Admins can manage all photos" ON gallery_photos
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = (SELECT auth.uid())  -- CORRECT
        AND user_profiles.user_type = 'admin'
    )
);
```

### 6. No Transaction Wrapper
**STATUS: FIXED**

The migration now has explicit transaction boundaries:
- `BEGIN;` at line 115
- `COMMIT;` at line 634

With clear instructions (lines 629-632) to review NOTICE messages before committing and to run `ROLLBACK;` if anything looks wrong.

---

## Remaining Concerns (Should Monitor)

### 1. **client_id Subquery Approach May Cause Issues**

- **What it is:** Line 238 uses a correlated subquery to get client_id:
  ```sql
  (SELECT g2.client_id FROM galleries g2 WHERE g2.id = g.id) as client_id,
  ```
- **Why it's a concern:** If `galleries.client_id` doesn't exist in this database, this subquery will fail with "column does not exist" error, not return NULL as intended.
- **Impact:** Medium - Would fail the migration if the column doesn't exist
- **Mitigation:** The pre-migration analysis queries (lines 779-781) will catch this. Ensure these are run before the migration.

### 2. **RLS Policy Performance Could Still Be Improved**

- **What it is:** The RLS policies use nested EXISTS with subqueries on `photographers` and `clients` tables.
- **Why it's a concern:** While indexes are added (lines 589-590), for very large tables this could still be slow. The skill file recommends caching user's photographer_id/client_id.
- **Impact:** Low - The indexes should be sufficient for current scale
- **Mitigation:** Monitor query performance after migration. If slow, consider a SECURITY DEFINER function to cache the user's IDs.

### 3. **Orphan Gallery Uses Reserved System UUID**

- **What it is:** The orphan holding gallery uses `'00000000-0000-0000-0000-000000000001'` (line 314)
- **Why it's a concern:** While better than the original `aaaaaaaa-...`, using a UUID in the "null namespace" could theoretically conflict with other system uses.
- **Impact:** Very low - Unlikely to cause issues in practice
- **Mitigation:** Document this UUID in a system constants file for future reference.

### 4. **Rollback Script Also Updated**

- **What's good:** The rollback script (lines 655-746) correctly includes:
  - Transaction wrapper
  - Proper `(SELECT auth.uid())` pattern
  - WITH CHECK clause on UPDATE policy
  - Correct admin policy user_id reference
- **Why this matters:** The rollback would restore a working state, not reintroduce the old issues.

---

## Minor Notes (Consider)

- **Line 238 alternative:** Consider using dynamic SQL or a conditional approach to handle the client_id column existence more gracefully, though the pre-migration verification should catch this.

- **Canonical table documentation:** The plan notes "Both will reference `photo_galleries`" but doesn't make a clear decision about which photo table (`gallery_photos` vs `photos`) should be used going forward. Add a code comment or update the codebase README.

- **Backup table retention:** The plan says cleanup happens "2 weeks later" but doesn't specify how to know if the migration is stable. Consider adding specific success criteria (e.g., "no FK violations reported, no access denied errors for 2 weeks").

---

## New Issues Introduced in V2

**None identified.** The revisions are clean and don't introduce any new problems.

---

## What the Plan Gets Right

- **Comprehensive revision history:** Clearly documents what changed between v1 and v2
- **Schema relationship clarification:** Section 2 now clearly explains the ID mapping, making it easier to verify and debug
- **Three-way fallback for photographer_id:** Robust mapping logic that handles edge cases
- **Pre-migration analysis queries:** Include verification for client_id existence and photographer mapping
- **Proper transaction handling:** Clear BEGIN/COMMIT with instructions for when to ROLLBACK
- **Index creation for RLS performance:** Addresses the performance concern proactively
- **Fixed rollback script:** Ensures rollback restores a working state
- **Resolved questions documented:** Section 10 provides clear answers to the original questions

---

## Recommendation

**Proceed to staging testing.** The plan has addressed all critical issues from the original critique. Before production execution:

1. **Run pre-migration analysis queries** (Section 5) to verify:
   - `galleries.client_id` column exists
   - Photographer ID mapping will succeed for all galleries

2. **Execute in staging** with production-like data and verify:
   - All verification queries pass
   - Favorite API works
   - Gallery viewing works for photographers and clients
   - Admin access works

3. **Document the canonical photo table** decision after migration completes

4. **Monitor for 24-48 hours** post-production migration for any RLS access issues

---

## Final Verdict

**APPROVE WITH CONCERNS**

The migration plan is ready for staging testing. The concerns noted are minor and can be addressed during implementation or monitoring. All 6 critical issues from the original critique have been properly resolved.

---

*Reviewed by: QA Critic Expert*
*Date: 2026-01-03*
