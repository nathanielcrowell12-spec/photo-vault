# Supabase: Upload Bug Investigation

**Status:** Phase 1 Investigation COMPLETE
**Date:** December 18, 2025
**Bug:** Photo uploads failing with "Gallery verification failed: The result contains 0 rows"

---

## Summary

Photo uploads fail because the code queries a column (`user_id`) that doesn't exist in the `photo_galleries` table. The table uses `photographer_id` instead. RLS passes but returns 0 rows because the filter column is missing.

---

## Root Cause (With Evidence)

**File:** `src/app/api/photos/upload/route.ts`
**Line:** 35
**The Bug:**
```typescript
.eq('user_id', user.id)  // photo_galleries has NO user_id column - uses photographer_id!
```

**What Happens:**
1. Query: "Find gallery where id = X AND user_id = Y"
2. RLS policy evaluates: `photographer_id = auth.uid()` → PASSES
3. Column filter: `user_id = Y` → Column doesn't exist → 0 rows match
4. Result: `gallery = null`, error message: "Gallery verification failed: 0 rows"

---

## Files Affected

### CRITICAL - Blocking All Uploads:

| File | Line | Bug | Fix |
|------|------|-----|-----|
| `src/app/api/photos/upload/route.ts` | 35 | `.eq('user_id', user.id)` | Change to `.eq('photographer_id', user.id)` |

### HIGH - Upload Processing Broken:

| File | Lines | Bug | Fix |
|------|-------|-----|-----|
| `src/app/api/v1/upload/process/route.ts` | 122, 125 | `.select('user_id')` + `gallery.user_id` | Use `photographer_id` |
| `src/app/api/v1/upload/process-fast/route.ts` | 63-65 | Same | Use `photographer_id` |
| `src/app/api/v1/upload/process-streaming/route.ts` | 95 | Same | Use `photographer_id` |
| `src/app/api/v1/upload/chunked/route.ts` | 91 | Inserts `user_id` | Use `photographer_id` |

---

## Schema Evidence

### photo_galleries Table (From database/schema.sql):
```sql
CREATE TABLE IF NOT EXISTS photo_galleries (
  id UUID PRIMARY KEY,
  photographer_id UUID REFERENCES photographers(id),  -- ✓ Correct column
  client_id UUID REFERENCES clients(id),
  -- NO user_id column
  ...
)
```

### RLS Policy (From database/photo-galleries-rls-policies.sql):
```sql
CREATE POLICY "Photographers can view own galleries"
ON photo_galleries
FOR SELECT
USING (photographer_id = auth.uid());  -- ✓ Uses photographer_id
```

---

## Test Data

- **User:** nathaniel.crowell12+betaph1@gmail.com
- **User ID:** `7d68f5ed-60a6-4e57-b858-21390aba4f32`
- **Gallery ID:** `eb745598-e6fe-47f5-8c96-576c3045e9a6`
- **Gallery exists** in `photo_galleries` with `photographer_id` = `7d68f5ed...`
- **Query fails** because it filters on `user_id` (column doesn't exist)

---

## Why This Happened

The codebase has **two competing schema designs**:

1. **Modern Schema (`photo_galleries`):** Uses `photographer_id` to link galleries to photographers
2. **Legacy Schema (`galleries`):** Uses `user_id` to link galleries to auth users

Different developers/sessions wrote code assuming different schemas. The web upload route was written assuming the legacy schema with `user_id`.

---

## Fix Plan

### Phase 1: Critical Fix (Unblocks Uploads)
Change `user_id` to `photographer_id` in `photos/upload/route.ts`

### Phase 2: Process Routes
Fix all `/api/v1/upload/process*` routes to use `photographer_id`

### Phase 3: Chunked Route
Fix insert statement in `chunked/route.ts`

### Phase 4: Verification
Test both web and desktop uploads with test gallery

---

## Evidence That Fix Is Correct

1. Gallery creation in `prepare/route.ts` (line 27) correctly uses:
   ```typescript
   photographer_id: userId,  // ✓ Correct
   ```

2. RLS policy expects `photographer_id` not `user_id`

3. Schema has `photographer_id` column, not `user_id`

4. Query returns 0 rows (not permission error) = column mismatch, not RLS issue

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking existing galleries | Low | Column rename doesn't affect existing data |
| Storage path mismatch | Medium | Verify storage paths use correct user ID |
| Other code using user_id | Medium | Search codebase for other references |

---

## Next Steps

1. [ ] Fix `photos/upload/route.ts` line 35
2. [ ] Fix process routes
3. [ ] Test web upload
4. [ ] Test desktop upload
5. [ ] Verify existing galleries still accessible
