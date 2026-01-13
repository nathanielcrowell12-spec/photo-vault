# Supabase Analytics Data Plan - QA Critic Review

**Reviewer:** QA Critic Expert
**Date:** 2026-01-05
**Plan Under Review:** `supabase-analytics-data-plan.md`

---

## Summary Verdict: APPROVE WITH CONCERNS

The plan is well-structured and demonstrates solid understanding of the database schema. However, there are several issues that should be addressed before implementation to avoid bugs and ensure the solution is done right the first time.

---

## Critical Issues (Must Fix)

### 1. SCHEMA MISMATCH: `gallery_status` Column Values

**Location:** Section 2a, Gallery Status Distribution query (line 163)

**Problem:** The plan assumes `gallery_status` values are `draft`, `ready`, `live`, `archived`, but the Schema Catalog shows the column is named `gallery_status` (correct) with values `'draft' | 'ready' | 'live' | 'archived'` (line 103 of schema). However, the actual sample data in the appendix (line 519-520) shows only `draft` and `ready` - NO `live` or `archived` statuses exist yet.

**Impact:** The pie chart will show only 2 segments when the plan's sample code hardcodes 4 status options.

**Fix:** Either:
- Only show statuses that have data (which the query does with `COUNT(*) > 0`)
- Or update the UI plan to handle dynamic status lists rather than hardcoded colors

### 2. WRONG TABLE FOR STORAGE CALCULATION

**Location:** Section 2d, Storage Usage query (lines 222-235)

**Problem:** The query sums `file_size` from both `gallery_photos` and `photos` tables, but:
1. Per Schema Catalog (line 131-164), `gallery_photos` is the PRIMARY photos table with 90 rows
2. The `photos` table (89 rows) is an ALTERNATE structure that may contain overlapping/duplicate data
3. Summing both could double-count storage

**Impact:** Storage metrics could be significantly inflated (potentially 2x).

**Fix:** Use ONLY `gallery_photos` for storage calculation, OR verify via SQL that the photo sets don't overlap before summing:
```sql
-- Verify before implementing
SELECT COUNT(*) FROM gallery_photos gp
JOIN photos p ON gp.gallery_id = p.gallery_id
  AND gp.original_filename = p.filename;
```

### 3. MISSING `gallery_photos.file_size` VERIFICATION

**Location:** Section 2d

**Problem:** The plan assumes `gallery_photos` has a `file_size` column. Schema Catalog line 142 confirms this exists. But the existing `admin-analytics-service.ts` (lines 56-64) queries `photos.file_size`, not `gallery_photos.file_size`.

**Impact:** Need to decide which table is authoritative for storage metrics and be consistent.

**Fix:** Align with existing service - either both use `photos` or both use `gallery_photos`.

---

## Concerns (Should Address)

### 1. USER TYPE MISMATCH: `secondary` vs `admin`

**Location:** Section 1, User Growth TypeScript types (lines 122-132)

**Problem:** The types include `secondary` and `admin` user types, but for a growth chart, `admin` users are likely internal (don't represent growth) and `secondary` users are family members (not signups). The meaningful user types for growth tracking are `photographer` and `client`.

**Recommendation:** Filter to only `photographer` and `client` in the query, or clearly label the chart as "All Account Types" vs "New Customers".

### 2. QUERY PERFORMANCE: No Aggregation Push-down

**Location:** Section 1, Optimized Query with Fill (lines 88-117)

**Problem:** The `generate_series` + `CROSS JOIN` approach is elegant but will generate many rows even when there's no data. For 30 days x 4 user types = 120 rows minimum.

**Recommendation:** For the current small dataset (15 users), this is fine. Add a comment noting this should be revisited at 10,000+ users.

### 3. INCONSISTENT COLUMN NAMING

**Location:** Throughout

**Problem:**
- UI Plan expects `gallery_status` but some queries reference just `status`
- `photo_galleries.status` doesn't exist (it's `gallery_status`)

**Recommendation:** Verify all column names against Schema Catalog before implementation.

### 4. HEALTH CHECK: `pg_total_relation_size` Requires Elevated Permissions

**Location:** Section 3b, Row Counts query (lines 306-323)

**Problem:** `pg_total_relation_size()` may not work with the anon key or even the service role key if PostgREST doesn't have those permissions.

**Impact:** Query could fail silently or return null.

**Fix:** Test this query via Supabase MCP before finalizing. If it fails, fall back to row counts only (which are still useful).

### 5. MISSING RLS CONSIDERATIONS

**Location:** Throughout

**Problem:** The plan correctly uses `createServiceRoleClient()` (bypasses RLS), but doesn't document WHY this is appropriate for admin-only data. Per the Supabase skill file (lines 63-66), admin client should only be used for specific scenarios.

**Recommendation:** Add a note: "Service role client required because admin analytics aggregates data across all users, which no single user should be able to query via RLS."

---

## What the Plan Gets Right

1. **Schema-Aware:** References correct primary tables (`photo_galleries`, `gallery_photos`, `user_profiles`)

2. **Time-Series Approach:** Using `date_trunc` and `generate_series` for gap-filling is the correct PostgreSQL pattern

3. **Type Safety:** Full TypeScript types defined for all data structures

4. **Caching Strategy:** Appropriate cache durations (5min for slow-changing, 1min for fast, none for health)

5. **Error Handling:** Shows graceful degradation pattern with default values

6. **Performance Notes:** Acknowledges current scale is small and provides index recommendations for scaling

7. **Parallel Query Strategy:** `Promise.all()` for independent queries is correct

8. **Sample Data Included:** Appendix with actual production data helps validate approach

---

## Recommendation

**APPROVE WITH CONCERNS** - Proceed to implementation with these fixes:

1. **Before coding:**
   - Run the storage query to verify `gallery_photos` and `photos` don't overlap
   - Test `pg_total_relation_size()` via Supabase MCP
   - Verify all column names against Schema Catalog

2. **During implementation:**
   - Use only `gallery_photos` for storage (match existing service pattern)
   - Handle dynamic gallery status values (not hardcoded 4)
   - Add RLS documentation comment

3. **Post-implementation:**
   - Verify charts render correctly with actual data
   - Test empty state (what if a table has 0 rows?)

---

## Questions for Plan Author

1. Why sum storage from both photo tables? Is there data in `photos` that's NOT in `gallery_photos`?

2. Should the health check include Supabase Storage bucket sizes (actual blob storage), not just database `file_size` columns?

3. The `activeToday` metric in the current service is "approximate" - should the new charts use this same heuristic or calculate differently?

---

*Critique complete. Ready for implementation after addressing Critical Issues.*
