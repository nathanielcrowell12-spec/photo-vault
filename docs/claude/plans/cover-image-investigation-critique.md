# Cover Image Investigation Plan - QA Critique

**Date:** 2026-01-03
**Reviewer:** QA Critic Expert
**Plan Under Review:** `cover-image-investigation.md`

---

## Verdict: NEEDS REVISION

The plan demonstrates excellent investigation work - the 12-flow inventory is thorough and the root cause analysis is accurate. However, the proposed database trigger solution has several critical issues that must be addressed before implementation.

---

## Critical Issues (Must Fix)

### 1. RLS Will Block the Trigger from Updating `photo_galleries`

**The Problem:** The proposed trigger uses `LANGUAGE plpgsql` without `SECURITY DEFINER`. Database triggers run in the context of the user executing the INSERT. The current RLS policies on `photo_galleries` only allow:

- Photographers to update galleries where `photographer_id = auth.uid()`
- Admins to update any gallery

**What Happens:**
- When a **client** uploads photos (via `/api/client/upload`), they can INSERT into `photos` table (allowed by RLS)
- The trigger fires and tries to UPDATE `photo_galleries`
- But the client's `auth.uid()` is NOT the `photographer_id` on the gallery
- **The UPDATE silently fails** - no error, but cover_image_url stays NULL

**The Fix:**
```sql
CREATE OR REPLACE FUNCTION set_gallery_cover_image()
RETURNS TRIGGER AS $$
BEGIN
  -- ... existing logic ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- <-- MUST ADD THIS

-- Also grant execute to authenticated users
GRANT EXECUTE ON FUNCTION set_gallery_cover_image() TO authenticated;
```

**Risk if not fixed:** Trigger appears to work in testing (photographer uploads) but fails silently in production for client uploads.

### 2. Two Photo Tables Reference DIFFERENT Gallery Tables

**The Problem:** The plan correctly identifies two photo tables but misses a critical schema issue:

| Table | References | Via Column |
|-------|------------|------------|
| `photos` | `photo_galleries` | `gallery_id` |
| `gallery_photos` | `galleries` | `gallery_id` |

The `gallery_photos` table references the OLD `galleries` table (from `galleries-table.sql`), NOT `photo_galleries`. These are **two different tables** with different schemas.

**What Happens:**
```sql
-- Trigger on gallery_photos tries to update photo_galleries
UPDATE photo_galleries
SET cover_image_url = COALESCE(NEW.thumbnail_url, NEW.photo_url)
WHERE id = NEW.gallery_id  -- But gallery_id points to galleries.id, not photo_galleries.id!
```

This will match 0 rows because the UUIDs don't exist in `photo_galleries`.

**The Fix:** The plan needs to:
1. Consolidate onto ONE photo table (preferably `photos` which correctly references `photo_galleries`)
2. OR create two separate triggers - one for each gallery table
3. OR acknowledge this is a data model problem requiring migration, not just a trigger

### 3. Missing `thumbnail_url` Handling

**The Problem:** The trigger uses:
```sql
SET cover_image_url = COALESCE(NEW.thumbnail_url, NEW.photo_url, NEW.original_url)
```

But from the schema analysis:
- `photos` table has: `thumbnail_url`, `original_url`, `medium_url`, `full_url` (no `photo_url`)
- `gallery_photos` table has: `photo_url`, `thumbnail_url` (no `original_url`)

**What Happens:** If `thumbnail_url` is NULL (common during async thumbnail generation), the fallback columns may not exist or may also be NULL.

**The Fix:** The trigger should wait for thumbnail generation OR the one-time migration should only run AFTER thumbnails are generated.

---

## Concerns (Should Address)

### 1. Race Condition on Concurrent Inserts

**Scenario:** Two photos are inserted simultaneously (batch upload). Both triggers fire, both check "is cover NULL?", both say yes, both UPDATE.

**Risk:** Minor - last one wins, which is fine. But could cause unnecessary DB writes.

**Mitigation:** Add `FOR UPDATE SKIP LOCKED` or use advisory locks. Low priority but worth noting.

### 2. Placeholder String Matching is Fragile

The condition:
```sql
WHERE cover_image_url LIKE '%placeholder%'
```

Will match:
- `/images/placeholder-family.svg` (intended)
- `https://cdn.example.com/user-uploaded-placeholder-test.jpg` (false positive)

**Better approach:**
```sql
WHERE cover_image_url IS NULL
   OR cover_image_url = '/images/placeholder-family.svg'
   OR cover_image_url LIKE '/images/placeholder%'
```

### 3. No Rollback Strategy

If the trigger causes issues in production:
- What's the quick disable command?
- How do we verify galleries weren't corrupted?
- Is there an audit log?

**Recommendation:** Add to the plan:
```sql
-- Emergency disable
DROP TRIGGER IF EXISTS set_cover_on_photo_insert ON photos;
DROP TRIGGER IF EXISTS set_cover_on_gallery_photo_insert ON gallery_photos;

-- Verify
SELECT id, cover_image_url FROM photo_galleries WHERE cover_image_url IS NULL;
```

### 4. Performance at Scale

**The Query:**
```sql
IF EXISTS (
  SELECT 1 FROM photo_galleries
  WHERE id = NEW.gallery_id
  AND (cover_image_url IS NULL OR cover_image_url LIKE '%placeholder%')
) THEN
  UPDATE photo_galleries ...
```

This runs for EVERY photo insert. For a 500-photo gallery upload:
- 500 `SELECT` queries
- 1 `UPDATE` (only first succeeds)
- 499 wasted queries

**Better approach:** Use `INSERT ... ON CONFLICT DO UPDATE` pattern or add early exit:
```sql
-- First photo sets cover, subsequent photos skip check entirely
IF EXISTS (
  SELECT 1 FROM photo_galleries WHERE id = NEW.gallery_id AND cover_image_url IS NOT NULL
) THEN
  RETURN NEW;  -- Fast exit
END IF;
```

### 5. Index Missing for Trigger Performance

The trigger queries `photo_galleries` by `id` (already indexed as PK) but the condition also checks `cover_image_url`. For large tables, consider:
```sql
CREATE INDEX CONCURRENTLY idx_photo_galleries_no_cover
ON photo_galleries(id) WHERE cover_image_url IS NULL;
```

---

## What the Plan Gets Right

1. **Thorough Investigation:** The 12-flow inventory is comprehensive and well-documented with specific file paths and line numbers.

2. **Root Cause Identification:** Correctly identifies the lack of centralization as the core issue.

3. **Option Analysis:** Provides three options (trigger, utility function, hybrid) with honest pros/cons.

4. **One-Time Migration:** Includes SQL to fix existing broken galleries - this is essential.

5. **Evidence-Based:** All claims are backed by specific code references.

6. **Future-Proofing:** The trigger approach means new upload flows get cover logic "for free."

---

## Recommendations

### Before Approving:

1. **Resolve the gallery table confusion**
   - Decision needed: Are we using `galleries` or `photo_galleries`?
   - If both exist in production, need migration plan to consolidate

2. **Add SECURITY DEFINER to trigger function**
   - Without this, client uploads will silently fail

3. **Fix column name mismatches**
   - Use correct fallback columns for each table

### During Implementation:

4. **Add performance optimization**
   - Early exit if cover already exists
   - Consider partial index

5. **Add rollback instructions**
   - Quick disable commands
   - Verification queries

6. **Add monitoring**
   - Log when trigger fires (temporarily, for validation)
   - Alert if cover_image_url is still NULL after import completes

### After Implementation:

7. **Test all 12 flows**
   - Especially client upload and desktop flows
   - Verify with RLS active (not admin/service role)

---

## Revised Implementation Recommendation

Instead of the current trigger, implement this corrected version:

```sql
-- Function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION set_gallery_cover_image()
RETURNS TRIGGER
SECURITY DEFINER  -- Critical for cross-user updates
SET search_path = public  -- Security best practice with SECURITY DEFINER
AS $$
DECLARE
  current_cover TEXT;
  target_table TEXT;
BEGIN
  -- Determine which gallery table to update based on trigger source
  IF TG_TABLE_NAME = 'photos' THEN
    target_table := 'photo_galleries';
  ELSIF TG_TABLE_NAME = 'gallery_photos' THEN
    target_table := 'galleries';  -- Different table!
  ELSE
    RETURN NEW;
  END IF;

  -- Fast path: skip if photo has no usable image URL
  IF COALESCE(NEW.thumbnail_url, NEW.photo_url, NEW.original_url, NEW.full_url, '') = '' THEN
    RETURN NEW;
  END IF;

  -- Only update if cover is missing or placeholder
  IF target_table = 'photo_galleries' THEN
    UPDATE photo_galleries
    SET cover_image_url = COALESCE(
      NEW.thumbnail_url,
      NEW.original_url,
      NEW.full_url,
      NEW.medium_url
    )
    WHERE id = NEW.gallery_id
      AND (cover_image_url IS NULL
           OR cover_image_url = '/images/placeholder-family.svg'
           OR cover_image_url LIKE '/images/placeholder%');
  ELSE
    UPDATE galleries
    SET cover_image_url = COALESCE(
      NEW.thumbnail_url,
      NEW.photo_url
    )
    WHERE id = NEW.gallery_id
      AND (cover_image_url IS NULL
           OR cover_image_url = '/images/placeholder-family.svg'
           OR cover_image_url LIKE '/images/placeholder%');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION set_gallery_cover_image() TO authenticated;
```

---

## Summary

| Aspect | Assessment |
|--------|------------|
| Investigation Quality | Excellent |
| Root Cause Analysis | Correct |
| Proposed Solution | Needs Critical Fixes |
| RLS Consideration | Missing (Critical) |
| Schema Understanding | Incomplete (Two Gallery Tables) |
| Performance | Adequate, could optimize |
| Rollback Plan | Missing |

**Final Verdict: NEEDS REVISION**

The plan cannot be approved as-is because the trigger will silently fail for client uploads (RLS issue) and may update the wrong table (schema confusion). These are not edge cases - they are core functionality that will break.

Once the critical issues are addressed, this is a solid approach that will provide lasting value by eliminating the need for every upload flow to implement cover image logic independently.
