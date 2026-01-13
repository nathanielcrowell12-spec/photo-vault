# Client Ratings System - QA Critique

**Reviewed by:** QA Critic Expert
**Date:** 2026-01-04
**Plan reviewed:** `docs/claude/plans/client-ratings-system-plan.md`
**Schema reviewed:** `database/client-ratings-schema.sql`

---

## Executive Summary

**VERDICT: APPROVE WITH CONCERNS**

The plan and schema are well-designed overall. The discovery that UI/API code already exists and only the database table is missing is correct. However, there are **two critical RLS policy issues** that must be fixed before applying the migration.

---

## 1. Completeness Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Table structure | COMPLETE | All necessary columns defined |
| Indexes | COMPLETE | All RLS and query columns indexed |
| Unique constraints | COMPLETE | Correctly handles both gallery-specific and general ratings |
| RLS enabled | COMPLETE | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` present |
| RLS policies | NEEDS FIX | Two policies have incorrect column references |
| Trigger for updated_at | COMPLETE | Properly implemented |
| Helper functions | COMPLETE | `get_photographer_avg_rating` and `get_photographer_rating_count` |
| API compatibility | VERIFIED | APIs match schema column names |

---

## 2. Critical Issues (MUST FIX)

### Issue #1: Photographer SELECT Policy Uses Wrong Column

**Location:** Line 66-68 of `client-ratings-schema.sql`

**Current (WRONG):**
```sql
CREATE POLICY "photographers_view_own_ratings" ON client_ratings
  FOR SELECT
  USING (photographer_id = auth.uid());
```

**Problem:** This policy checks if `photographer_id = auth.uid()`. Based on my database verification, `photographers.id` IS equal to `auth.uid()` (they share the same UUID via `user_profiles`). So this policy IS CORRECT.

**WAIT - Let me re-verify:** I confirmed that `photographers.id` = `user_profiles.id` = `auth.uid()`. The schema references `photographers(id)` as the foreign key for `photographer_id`. So when a photographer with `auth.uid() = 'abc123'` queries, they have a `photographers` record with `id = 'abc123'`, and the ratings have `photographer_id = 'abc123'`.

**VERDICT: This policy IS CORRECT.** The `photographer_id` column stores the auth user ID directly (since `photographers.id` = `auth.uid()`).

### Issue #2: Photographer UPDATE Policy Allows Changing Ratings (CRITICAL)

**Location:** Lines 71-74 of `client-ratings-schema.sql`

**Current (DANGEROUS):**
```sql
CREATE POLICY "photographers_respond_to_ratings" ON client_ratings
  FOR UPDATE
  USING (photographer_id = auth.uid())
  WITH CHECK (photographer_id = auth.uid());
```

**Problem:** This policy allows photographers to UPDATE any column on their ratings, including:
- `rating` (the star rating itself!)
- `review_text` (the client's written review!)
- `communication_rating`, `quality_rating`, `timeliness_rating`
- `status` (could hide negative reviews!)
- `client_id` (could reassign reviews!)

**This is a major security vulnerability.** Photographers should ONLY be able to update:
- `photographer_response`
- `response_at`

**Recommended Fix Option A (Trigger-based - more secure):**
```sql
-- Drop the permissive policy
DROP POLICY IF EXISTS "photographers_respond_to_ratings" ON client_ratings;

-- Create trigger to enforce response-only updates
CREATE OR REPLACE FUNCTION enforce_photographer_response_only()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow changes to response fields
  IF NEW.rating != OLD.rating
     OR NEW.review_text IS DISTINCT FROM OLD.review_text
     OR NEW.communication_rating IS DISTINCT FROM OLD.communication_rating
     OR NEW.quality_rating IS DISTINCT FROM OLD.quality_rating
     OR NEW.timeliness_rating IS DISTINCT FROM OLD.timeliness_rating
     OR NEW.status != OLD.status
     OR NEW.client_id != OLD.client_id
     OR NEW.gallery_id IS DISTINCT FROM OLD.gallery_id
     OR NEW.photographer_id != OLD.photographer_id
     OR NEW.created_at != OLD.created_at
  THEN
    RAISE EXCEPTION 'Photographers can only update response fields';
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER photographer_response_only_trigger
  BEFORE UPDATE ON client_ratings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_photographer_response_only();

-- Simple RLS policy (trigger handles field restrictions)
CREATE POLICY "photographers_respond_to_ratings" ON client_ratings
  FOR UPDATE
  USING (photographer_id = (SELECT auth.uid()))
  WITH CHECK (photographer_id = (SELECT auth.uid()));
```

**Recommended Fix Option B (API-only enforcement - simpler but less secure):**

The existing API at `src/app/api/photographer/ratings/route.ts` (lines 160-167) already restricts updates to only `photographer_response` and `response_at`. If you trust that ALL photographer updates will go through this API (service role), you can:

1. Keep the permissive RLS policy
2. Rely on API-level enforcement
3. Document this as a known limitation

**My recommendation:** Use **Option A** (trigger) for defense-in-depth. The API might be bypassed if:
- A new endpoint is added that forgets to restrict fields
- Direct database access is ever granted
- The service role client is used incorrectly elsewhere

---

## 3. Minor Issues (SHOULD FIX)

### Issue #3: Missing Performance Optimization in RLS Policies

**Location:** All RLS policies with `auth.uid()` calls

**Current:**
```sql
USING (photographer_id = auth.uid());
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
```

**Should be (per Supabase best practices):**
```sql
USING (photographer_id = (SELECT auth.uid()));
USING (client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid())));
```

**Why:** Wrapping `auth.uid()` in a subselect caches it per-statement rather than re-evaluating per-row. This is a performance optimization documented in the Supabase skill file.

### Issue #4: Service Role Policy May Not Work as Expected

**Location:** Lines 100-102

**Current:**
```sql
CREATE POLICY "service_role_all_access" ON client_ratings
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

**Potential issue:** When using the service role client in Supabase, RLS is bypassed entirely by default. This policy is redundant and may not even be evaluated.

**Recommendation:** Remove this policy. Service role already bypasses RLS. If you want non-service-role admin access, create a proper admin policy checking `user_profiles.user_type = 'admin'`.

---

## 4. Correctness Verification

### API-to-Schema Column Mapping

| API Field (camelCase) | Schema Column (snake_case) | Match |
|-----------------------|---------------------------|-------|
| `rating` | `rating` | YES |
| `reviewText` | `review_text` | YES |
| `communicationRating` | `communication_rating` | YES |
| `qualityRating` | `quality_rating` | YES |
| `timelinessRating` | `timeliness_rating` | YES |
| `status` | `status` | YES |
| `photographerResponse` | `photographer_response` | YES |
| `responseAt` | `response_at` | YES |
| `galleryId` | `gallery_id` | YES |
| `clientId` | `client_id` | YES |
| `photographerId` | `photographer_id` | YES |

**All columns match correctly.**

### Foreign Key References

| Column | References | Correct? |
|--------|------------|----------|
| `photographer_id` | `photographers(id)` | YES - photographers.id = auth.uid() |
| `client_id` | `clients(id)` | YES - clients have separate id, with user_id FK |
| `gallery_id` | `photo_galleries(id)` | YES |

**All foreign keys are correct.**

### Unique Constraint Logic

```sql
-- One rating per client per gallery
CREATE UNIQUE INDEX idx_client_ratings_unique_gallery
  ON client_ratings(client_id, gallery_id)
  WHERE gallery_id IS NOT NULL;

-- One rating per client-photographer if no gallery
CREATE UNIQUE INDEX idx_client_ratings_unique_no_gallery
  ON client_ratings(client_id, photographer_id)
  WHERE gallery_id IS NULL;
```

**This is correctly designed.** A client can rate:
- Each gallery once (when `gallery_id` is specified)
- Each photographer once overall (when no gallery specified)

This prevents duplicates while allowing flexibility.

---

## 5. Edge Cases Analysis

| Edge Case | Handled? | How |
|-----------|----------|-----|
| Client rates same gallery twice | YES | Unique constraint + API upsert logic |
| Client deletes their account | YES | `ON DELETE CASCADE` on `client_id` |
| Photographer deletes account | YES | `ON DELETE CASCADE` on `photographer_id` |
| Gallery deleted after rating | YES | `ON DELETE SET NULL` preserves rating |
| Rating with no review text | YES | `review_text` is nullable |
| Partial category ratings | YES | All category ratings are nullable |
| Negative/zero star ratings | YES | CHECK constraint enforces 1-5 |
| Rating > 5 stars | YES | CHECK constraint enforces 1-5 |
| XSS in review text | PARTIAL | API should sanitize, but not in schema |
| Very long review text | NO | No length limit on TEXT column |

**Recommendation:** Consider adding a length limit to `review_text`:
```sql
review_text TEXT CHECK (char_length(review_text) <= 2000)
```

---

## 6. Security Checklist

| Check | Status |
|-------|--------|
| RLS enabled | YES |
| No public read access (unless intended) | YES - only owner access |
| Photographers cannot see other photographers' ratings | YES |
| Clients cannot see other clients' ratings | YES |
| Photographers cannot modify rating scores | NO - MUST FIX |
| Clients have time-limited edit window | YES - 30 days |
| Service role bypass documented | YES |

---

## 7. Recommended Schema Changes

Apply these changes to `database/client-ratings-schema.sql` before migration:

```sql
-- 1. Add performance optimization to all policies (wrap auth.uid())
-- Replace all instances of:
--   auth.uid()
-- With:
--   (SELECT auth.uid())

-- 2. Add trigger to restrict photographer updates
CREATE OR REPLACE FUNCTION enforce_photographer_response_only()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating != OLD.rating
     OR NEW.review_text IS DISTINCT FROM OLD.review_text
     OR NEW.communication_rating IS DISTINCT FROM OLD.communication_rating
     OR NEW.quality_rating IS DISTINCT FROM OLD.quality_rating
     OR NEW.timeliness_rating IS DISTINCT FROM OLD.timeliness_rating
     OR NEW.status != OLD.status
     OR NEW.client_id != OLD.client_id
     OR NEW.gallery_id IS DISTINCT FROM OLD.gallery_id
     OR NEW.photographer_id != OLD.photographer_id
     OR NEW.created_at != OLD.created_at
  THEN
    RAISE EXCEPTION 'Photographers can only update response fields';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER photographer_response_only_trigger
  BEFORE UPDATE ON client_ratings
  FOR EACH ROW
  WHEN ((SELECT auth.uid()) = OLD.photographer_id)
  EXECUTE FUNCTION enforce_photographer_response_only();

-- 3. Remove redundant service_role policy (optional)
DROP POLICY IF EXISTS "service_role_all_access" ON client_ratings;

-- 4. Add review text length limit (optional but recommended)
ALTER TABLE client_ratings
  ADD CONSTRAINT review_text_length CHECK (char_length(review_text) <= 2000);
```

---

## 8. Final Verdict

### APPROVE WITH CONCERNS

The plan is fundamentally sound. The schema is well-designed with proper indexes, constraints, and most RLS policies. The API code correctly matches the schema.

**Before applying migration:**

1. **MUST FIX:** Add trigger to prevent photographers from modifying rating scores (Issue #2)
2. **SHOULD FIX:** Wrap `auth.uid()` in `(SELECT ...)` for performance (Issue #3)
3. **OPTIONAL:** Remove redundant service_role policy (Issue #4)
4. **OPTIONAL:** Add review text length limit

**After fixing Issue #2, this plan is ready for implementation.**

---

*Critique completed: 2026-01-04*
