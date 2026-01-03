# Plan Critique: Gallery Consolidation Migration

**Plan Reviewed:** `gallery-consolidation-migration-plan.md`
**Skill Reference:** `supabase-skill.md`
**Date:** 2026-01-03

---

## Summary Verdict

**NEEDS REVISION**

This migration plan is well-structured with good backup/rollback provisions, but contains several critical issues that could cause data corruption, break RLS policies, and leave the system in an inconsistent state. The photographer_id mapping logic has a fundamental flaw, the RLS policies don't match the skill file patterns for performance, and there's a SQL syntax error that will abort the migration.

---

## Critical Issues (Must Fix)

### 1. **SQL Syntax Error - RAISE NOTICE Outside DO Block**

- **What's wrong:** Line 545 has `RAISE NOTICE 'FK constraint updated...'` outside of a PL/pgSQL block. RAISE NOTICE can only be used inside functions or DO blocks, not as standalone SQL.
- **Why it matters:** This will cause a syntax error and abort the entire migration at Step 5, leaving gallery_photos without ANY foreign key constraint - a dangerous state.
- **Suggested fix:** Wrap the RAISE NOTICE in a DO block:
  ```sql
  DO $$
  BEGIN
    RAISE NOTICE 'FK constraint updated: gallery_photos.gallery_id now references photo_galleries';
  END $$;
  ```

### 2. **Photographer ID Mapping Has Logic Gap**

- **What's wrong:** The mapping logic in Step 2 (lines 373-377) assumes `galleries.photographer_id` references `user_profiles(id)`, but then tries to match it against `photographers.user_id`. This won't work if `galleries.photographer_id` actually IS a user_profiles.id (which is NOT the same as auth.users.id - user_profiles.id could be different).
  ```sql
  COALESCE(
      (SELECT p.id FROM photographers p WHERE p.user_id = g.photographer_id),  -- WRONG: user_id != user_profiles.id
      (SELECT p.id FROM photographers p WHERE p.user_id = g.user_id)
  )
  ```
- **Why it matters:** This could result in NULL photographer_id for ALL migrated galleries, breaking the FK chain to photographers and making galleries inaccessible to their owners.
- **Suggested fix:** Need to understand the actual relationship. If `galleries.photographer_id` references `user_profiles(id)`:
  ```sql
  COALESCE(
      (SELECT p.id FROM photographers p
       JOIN user_profiles up ON up.user_id = p.user_id
       WHERE up.id = g.photographer_id),
      (SELECT p.id FROM photographers p WHERE p.user_id = g.user_id)
  )
  ```

### 3. **galleries Table Has client_id But It's Not Documented**

- **What's wrong:** The INSERT statement (line 382) references `g.client_id`, but the galleries table schema shown in section 2.1 (lines 39-85) does NOT include a `client_id` column.
- **Why it matters:** If `galleries.client_id` doesn't exist, the migration will fail with a "column does not exist" error. If it does exist (undocumented), we need to verify its FK relationship.
- **Suggested fix:** Run a schema check before finalizing the plan:
  ```sql
  SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'galleries';
  ```

### 4. **Missing WITH CHECK Clause on UPDATE Policy**

- **What's wrong:** The UPDATE policy (lines 593-609) has a USING clause but no WITH CHECK clause. According to PostgreSQL RLS semantics, UPDATE policies need both.
- **Why it matters:** Without WITH CHECK, users could potentially update a photo's gallery_id to a gallery they don't own (moving photos to other users' galleries).
- **Suggested fix:** Add WITH CHECK that matches the USING clause:
  ```sql
  CREATE POLICY "Users can update photos in own galleries" ON gallery_photos
  FOR UPDATE USING (
      EXISTS (...)
  )
  WITH CHECK (
      EXISTS (...)
  );
  ```

### 5. **RLS Policies Don't Follow Skill File Performance Pattern**

- **What's wrong:** All RLS policies use `(SELECT auth.uid())` incorrectly. The outer SELECT is present but the comparison uses `=` directly instead of subquery form. The skill file (line 75-80) specifically warns:
  > "WRONG: Calls auth.uid() for every row"
  > "RIGHT: Caches auth.uid() per statement with (SELECT auth.uid())"

  But look at line 567: `pg.user_id = (SELECT auth.uid())` - this is mixed. The problem is the nested EXISTS with a subquery on `photographers` and `clients` tables will still execute the inner queries for each row.
- **Why it matters:** Performance degradation at scale. With 1000s of photos, these policies will be slow.
- **Suggested fix:** Consider using a CTE or security definer function to cache the user's photographer_id and client_id at the start of the statement.

---

## Concerns (Should Address)

### 1. **No Transaction Wrapper**

- **What's wrong:** The migration SQL doesn't start with `BEGIN;` and end with `COMMIT;`. The plan mentions "Run this in a transaction" (line 277) but doesn't actually wrap the SQL in one.
- **Why it matters:** If any step fails mid-migration, the database will be in a partially migrated state. Even with backups, this creates recovery complexity.
- **Suggested fix:** Add explicit transaction boundaries:
  ```sql
  BEGIN;
  -- All migration steps here
  COMMIT;
  ```

### 2. **Rollback Script Uses Wrong auth.uid() Pattern**

- **What's wrong:** The rollback RLS policies (lines 767-810) use `auth.uid()` without the `(SELECT ...)` wrapper, which the skill file explicitly warns against.
- **Why it matters:** If you roll back, you're restoring policies with the bad pattern. The rollback should match the original state, but if you're writing it now, write it correctly.
- **Suggested fix:** Capture the ACTUAL current policies before migration (use `pg_policies` view) rather than recreating from memory.

### 3. **Missing Index for RLS Policy Subqueries**

- **What's wrong:** The new RLS policies do subqueries on `photographers.user_id` and `clients.user_id`, but there's no verification these columns are indexed.
- **Why it matters:** Every photo SELECT will trigger these subqueries. Without indexes, this becomes O(n) per photo.
- **Suggested fix:** Add to the migration:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_photographers_user_id ON photographers(user_id);
  CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
  ```

### 4. **Orphan Gallery Uses Hardcoded UUID**

- **What's wrong:** The orphan holding gallery uses `'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'` (line 466). While creative, hardcoded UUIDs are a code smell.
- **Why it matters:** If someone accidentally runs this migration twice with different orphans, you get silent no-ops due to `ON CONFLICT DO NOTHING`.
- **Suggested fix:** Use a proper UUID generation or a well-documented constant that won't collide:
  ```sql
  v_orphan_gallery_id UUID := '00000000-0000-0000-0000-000000000001';  -- Reserved system UUID
  ```

### 5. **No Verification of `photos` Table After Migration**

- **What's wrong:** The plan focuses entirely on `gallery_photos` but there's also a `photos` table that correctly references `photo_galleries`. Post-migration verification doesn't check if any queries might now accidentally use both tables.
- **Why it matters:** Application code might be inconsistent about which photo table to use. After this migration, both tables reference `photo_galleries` but contain different photos.
- **Suggested fix:** Add verification query and document which table should be used:
  ```sql
  -- Document: Which is the canonical photo table?
  SELECT 'gallery_photos' as table_name, COUNT(*) FROM gallery_photos
  UNION ALL
  SELECT 'photos' as table_name, COUNT(*) FROM photos;
  ```

### 6. **Admin Policy Uses Wrong Column**

- **What's wrong:** Line 631 checks `user_profiles.id = (SELECT auth.uid())`. But `user_profiles.id` might be a separate UUID from `auth.uid()`. The skill file pattern uses `user_profiles.user_id` for this check.
- **Why it matters:** Admin policy might never match, meaning admins can't manage photos.
- **Suggested fix:**
  ```sql
  WHERE user_profiles.user_id = (SELECT auth.uid())
  ```

---

## Minor Notes (Consider)

- **Line 644:** `DROP TRIGGER IF EXISTS` is good defensive coding, but consider also dropping the old function version before CREATE OR REPLACE to avoid stale function signatures.

- **Missing COMMENT:** The migration doesn't add PostgreSQL comments to document the new FK relationship. Consider:
  ```sql
  COMMENT ON CONSTRAINT gallery_photos_gallery_id_fkey ON gallery_photos
  IS 'References photo_galleries after 2026-01-03 consolidation migration';
  ```

- **No estimate for downtime:** The plan says "<5 minutes" but with 69+ photos and multiple table scans, verification queries alone could take 30+ seconds. Test in staging first (this IS documented, good).

- **Backup tables lack indexes:** The backup tables are created without indexes, which is fine for restoration but consider if these will be queried during verification.

---

## Questions for the User

1. **What is the actual relationship of `galleries.photographer_id`?**
   - Does it reference `user_profiles(id)` or `auth.users(id)` or `photographers(id)`?
   - This is critical for the mapping logic.

2. **Does the `galleries` table have a `client_id` column?**
   - The plan references `g.client_id` but it's not in the documented schema.

3. **Which is the canonical photo table going forward: `gallery_photos` or `photos`?**
   - Both will reference `photo_galleries` after migration. Should one be deprecated?

4. **What maintenance window is acceptable?**
   - Migration should be tested with realistic data volume before committing to timing.

5. **Are there any scheduled jobs or cron tasks that write to `gallery_photos`?**
   - Need to pause these during migration to avoid FK errors mid-migration.

---

## What the Plan Gets Right

- **Comprehensive backup strategy:** Creating `_backup_*` tables before any destructive operations is excellent.

- **Pre-migration analysis queries:** The data discovery queries in section 3.1 are thorough and will prevent surprises.

- **Orphan photo handling:** Moving orphans to a holding gallery instead of deleting them is the right call for a production system.

- **Step-by-step verification:** The `DO $$ ... RAISE EXCEPTION` pattern for aborting on invalid state is exactly right.

- **Post-migration verification queries:** Section 6 has comprehensive queries to verify success.

- **Execution checklist:** The checklist in section 8 is well-organized and includes staging-first testing.

- **Risk assessment:** Section 9 correctly identifies RLS policy breakage as "Medium" likelihood - that's accurate given the issues found.

- **Not dropping `galleries` immediately:** Keeping the legacy table for 2 weeks is prudent.

---

## Recommendation

**Do not execute this migration until the following are resolved:**

1. **Fix the SQL syntax error** (RAISE outside DO block) - this will crash the migration
2. **Verify the photographer_id mapping** - run the analysis query and confirm the relationship
3. **Confirm `galleries.client_id` exists** - or remove from INSERT
4. **Add WITH CHECK to UPDATE policy** - security requirement
5. **Wrap in explicit transaction** - safety requirement
6. **Fix admin policy user_id check** - functionality requirement

After these fixes, re-run through staging environment with production-like data volumes before executing on production.

**Estimated revision effort:** 1-2 hours to address critical issues, then staging test.
