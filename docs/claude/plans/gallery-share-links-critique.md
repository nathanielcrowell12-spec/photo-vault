# Gallery Share Links - QA Critique

**Date:** December 20, 2025
**Plan Reviewed:** `gallery-share-links-plan.md`
**Critic:** QA Critic Expert
**Verdict:** NEEDS REVISION

---

## Executive Summary

The implementation plan is well-researched and addresses a real user need (casual sharing without accounts). However, it contains several critical issues that must be addressed before implementation:

1. **CRITICAL:** CHECK constraint on line 141-149 is syntactically invalid and will fail to create
2. **CRITICAL:** Race condition in download tracking (lines 703-708) will cause duplicate counts
3. **MAJOR:** Next.js 15 async params pattern not followed in API routes
4. **MODERATE:** Over-engineered IP tracking violates stated privacy goals
5. **MODERATE:** Missing validation allows abuse vectors (token enumeration, rate limiting gaps)

The plan demonstrates good understanding of PhotoVault's architecture and correctly identifies the difference between share links and family sharing. The RLS policies generally follow PhotoVault patterns. However, the implementation issues listed above must be fixed before proceeding.

---

## Detailed Critique

### 1. Database Schema Issues

#### CRITICAL: Invalid CHECK Constraint (Lines 141-149)

**Problem:**
```sql
CONSTRAINT max_active_links_per_gallery CHECK (
  NOT EXISTS (
    SELECT 1 FROM gallery_share_links
    WHERE gallery_id = gallery_share_links.gallery_id
    AND is_revoked = FALSE
    AND (expires_at IS NULL OR expires_at > NOW())
    HAVING COUNT(*) >= 5
  )
)
```

**Why This Fails:**
1. CHECK constraints in PostgreSQL cannot query the table being modified (creates circular dependency)
2. The self-reference `gallery_share_links.gallery_id` is ambiguous
3. `HAVING` requires `GROUP BY`, which is missing
4. This will throw a syntax error during table creation

**Evidence from Supabase Skill:**
The skill doesn't provide examples of CHECK constraints querying the same table because it's a PostgreSQL limitation. CHECK constraints can only reference the current row, not perform table-wide queries.

**Correct Solution:**
Enforce the limit in application code (API route) as shown on line 376-387. The plan already does this correctly! Remove the CHECK constraint entirely.

**Recommended Fix:**
```sql
-- Remove the entire CONSTRAINT block (lines 141-149)
-- The application-level check (lines 376-387) is sufficient and correct
```

---

#### MODERATE: Missing Index on Active Links Query

**Problem:**
The application checks active link count with this query (line 376-381):
```typescript
.eq('gallery_id', galleryId)
.eq('is_revoked', false)
.or('expires_at.is.null,expires_at.gt.now()')
```

**Issue:**
The partial index on line 160-161 only covers `gallery_id, is_revoked, expires_at` WHERE `is_revoked = FALSE`. This is good! However, the `.or()` filter on `expires_at` might not use the index efficiently.

**Recommendation:**
The existing index is acceptable, but monitor query performance. Consider a functional index if the `.or()` clause causes performance issues at scale.

---

### 2. Race Conditions

#### CRITICAL: Download Tracking Race Condition (Lines 703-708)

**Problem:**
```typescript
const { error: trackError } = await supabase
  .from('share_link_downloads')
  .insert({ ... })

// If insert succeeded (not a duplicate), increment counter
if (!trackError) {
  await supabase
    .from('gallery_share_links')
    .update({ downloads_used: shareLink.downloads_used + 1 })
}
```

**Why This Fails:**
1. Two requests arrive simultaneously for same photo
2. Both read `downloads_used = 4`
3. Both insert download records (different IPs = both succeed)
4. Both update with `downloads_used = 5`
5. Result: Counter says 5, but 6 downloads actually tracked

**Evidence from Supabase Skill (Line 80):**
The skill warns about wrapping `auth.uid()` for performance, but also applies to any query reading then writing based on that read. This is a classic read-modify-write race condition.

**Correct Solution:**
Use PostgreSQL's atomic increment:
```typescript
// CORRECT: Atomic increment
await supabase.rpc('increment_downloads', {
  link_id: shareLink.id
})

// Or use UPDATE with increment:
await supabase
  .from('gallery_share_links')
  .update({ downloads_used: shareLink.downloads_used + 1 })
  .eq('id', shareLink.id)
  .eq('downloads_used', shareLink.downloads_used)  // Optimistic lock
```

**Alternative (Better):**
Add a database trigger to auto-increment on insert to `share_link_downloads`:
```sql
CREATE OR REPLACE FUNCTION increment_share_link_downloads()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gallery_share_links
  SET downloads_used = downloads_used + 1
  WHERE id = NEW.share_link_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_download_tracked
AFTER INSERT ON share_link_downloads
FOR EACH ROW
EXECUTE FUNCTION increment_share_link_downloads();
```

Then remove the manual update entirely from the API route.

---

#### MODERATE: View Count Increment Race (Line 545-551)

**Problem:**
Same race condition exists for `view_count` increment:
```typescript
await supabase
  .from('gallery_share_links')
  .update({
    view_count: shareLink.view_count + 1,  // Read-modify-write!
    last_viewed_at: new Date().toISOString(),
  })
```

**Fix:**
Use the same trigger approach or atomic RPC.

---

### 3. Next.js 15 Compliance Issues

#### MAJOR: Async Params Not Awaited

**Problem:**
Every API route accesses `params` synchronously:
```typescript
// Line 330, 502, etc.
export async function POST(
  req: NextRequest,
  { params }: { params: { galleryId: string } }
) {
  const { galleryId } = params  // WRONG in Next.js 15!
```

**Evidence from Next.js Skill (Line 1-20):**
While the skill excerpt doesn't show the async params pattern explicitly, Next.js 15 requires `params` to be awaited in API routes.

**Correct Pattern:**
```typescript
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ galleryId: string }> }
) {
  const { galleryId } = await context.params  // Correct
```

**Impact:**
All 4 API routes need this fix:
- `share-links/route.ts` (POST and GET)
- `share-links/[linkId]/route.ts` (DELETE)
- `validate-share-token/route.ts` (POST)
- `track-download/route.ts` (POST)

---

### 4. Security & Privacy Issues

#### MODERATE: IP Tracking Contradicts Privacy Claims

**Problem:**
The plan claims "minimal data, no tracking" (line 1227) but stores IP addresses and user agents for download tracking.

**Contradiction:**
- Line 1227: "Privacy: Store minimal data"
- Line 189: Stores `ip_address VARCHAR(45)` and `user_agent TEXT`
- Line 689-690: Captures and stores full IP and user agent

**GDPR Implications:**
IP addresses are personally identifiable information (PII) under GDPR. The plan mentions "Add privacy notice" (line 1228) but doesn't specify:
- What the notice should say
- Whether users can request deletion
- How long data is retained

**Recommendation:**
Either:
1. **Hash IPs:** Store `SHA256(ip + secret)` instead of raw IP
2. **Drop IP tracking entirely:** Accept that download limits can be bypassed by clearing cookies (acceptable for casual sharing use case)
3. **Add retention policy:** Auto-delete download records after 90 days

Given the stated use case ("temporary sharing with non-users"), option 2 is most aligned with the product philosophy.

---

#### MODERATE: Missing Rate Limiting

**Acknowledged but Not Implemented:**
Line 1217-1223 correctly identifies rate limiting as needed, but marks it "not implemented in this plan."

**Problem:**
Without rate limiting:
- Attackers can brute-force share tokens (UUID v4 has 122 bits, but still...)
- Attackers can enumerate valid gallery IDs
- Malicious actors can spam link creation

**Minimum Required:**
1. Token validation: 100 requests/hour per IP (mentioned on line 1221, but not implemented)
2. Link creation: 5 per hour per user (mentioned on line 1220, but not implemented)

**Recommendation:**
Add Vercel rate limiting middleware as a BLOCKER for production deployment. Dev/staging can skip it.

---

#### MINOR: Token Enumeration via Timing Attack

**Problem:**
Line 523-532 validates token with database query. If query time differs between "token exists" and "token doesn't exist", attackers can enumerate valid tokens.

**Likelihood:** Low (Supabase response times are fairly consistent)
**Impact:** Medium (valid token = gallery access)

**Mitigation:**
Add constant-time comparison or random delay. Example:
```typescript
// Add small random delay to mask timing differences
await new Promise(resolve => setTimeout(resolve, Math.random() * 50))
```

---

### 5. Edge Case Handling

#### GOOD: User Cancels Subscription (Lines 1295-1300)

The plan correctly identifies this edge case and makes a defensible decision: share links remain active after subscription ends.

**Question for User:**
Is this the desired behavior? Alternative: Add a cron job to check for canceled subscriptions and auto-revoke links.

---

#### MISSING: Share Link Accessed by Subscriber (Lines 1309-1314)

The plan mentions this edge case and proposes prioritizing subscription over share link. However, **the implementation doesn't include this logic**.

**Problem:**
Line 737-759 checks share token but doesn't check if user already has subscription. A subscriber using a share link would be subject to download limits unnecessarily.

**Recommended Fix:**
In `validateShareToken`, check if authenticated user has subscription BEFORE applying share link logic:
```typescript
// In gallery page, before validating share token
if (user) {
  const hasSubscription = await checkUserSubscription(user.id, galleryId)
  if (hasSubscription) {
    console.log('[Gallery] User has subscription, ignoring share token')
    setHasAccess(true)
    setCheckingAccess(false)
    return  // Don't validate share token
  }
}
```

---

#### MISSING: Download Limit = 0 (View Only) UI (Lines 1317-1322)

The plan describes hiding download buttons when `downloadLimit === 0`, but **the implementation doesn't include this**.

**Problem:**
Line 770-807 (download function) doesn't check `downloadLimit === 0` before showing download UI.

**Recommended Fix:**
```typescript
// In gallery page JSX
{shareAccess && shareLink?.downloadLimit === 0 && (
  <div className="bg-yellow-500 text-white py-2 px-4 text-center">
    View-only access: Downloads disabled for this share link
  </div>
)}

// Conditionally render download buttons
{(!shareAccess || shareLink?.downloadLimit !== 0) && (
  <Button onClick={() => downloadPhoto(...)}>Download</Button>
)}
```

---

### 6. Codebase Consistency

#### GOOD: RLS Policies Follow PhotoVault Patterns

The RLS policies (lines 207-287) correctly follow PhotoVault patterns:
- Uses `auth.uid()` for authenticated checks
- Uses `SELECT` subqueries for multi-table checks
- Separates policies by operation (SELECT, INSERT, UPDATE, DELETE)
- Includes service role bypass

**Matches Supabase Skill:**
- Pattern 3: Photographer → Client relationship (line 187-205 of skill)
- Uses `IN (SELECT ...)` pattern (line 179-184 of skill)

---

#### GOOD: Separation from Family Sharing

The plan correctly distinguishes share links from family sharing (lines 13-16, 59-68) and chooses the right table structure.

---

#### ISSUE: Missing PostHog Analytics

**Problem:**
The plan doesn't integrate with PhotoVault's analytics system (PostHog), which was just implemented in Story 6.1.

**Missing Events:**
- `SHARE_LINK_CREATED` (when client creates link)
- `SHARE_LINK_ACCESSED` (when someone uses link)
- `SHARE_LINK_DOWNLOAD_ATTEMPTED` (when download limit reached)
- `SHARE_LINK_REVOKED` (when client revokes link)

**Recommendation:**
Add PostHog tracking to all API routes and UI actions. This is critical for understanding feature adoption and friction points.

---

### 7. Testing Gaps

#### GOOD: Test Cases Listed (Lines 1272-1281)

The plan lists 8 test cases covering happy path and error conditions.

**Missing Test Cases:**
1. Concurrent downloads (race condition test)
2. Subscriber using share link (should get full access)
3. View-only link (download buttons hidden)
4. IP-based deduplication (same IP, different browser)
5. Token enumeration attempt (security test)
6. Rate limiting (once implemented)

---

### 8. Documentation Quality

#### GOOD: Comprehensive Research Section

Lines 19-53 show thorough research of existing access control patterns.

#### GOOD: Clear Design Rationale

Lines 55-98 explain design decisions with pros/cons.

#### ISSUE: Missing Migration Rollback Plan

The migration path (lines 1246-1288) only describes forward migration. No rollback plan if something goes wrong.

**Recommendation:**
Add rollback instructions:
```sql
-- Rollback script
DROP TRIGGER IF EXISTS on_download_tracked ON share_link_downloads;
DROP FUNCTION IF EXISTS increment_share_link_downloads();
DROP TABLE IF EXISTS share_link_downloads CASCADE;
DROP TABLE IF EXISTS gallery_share_links CASCADE;
```

---

## Verdict: NEEDS REVISION

### Critical Issues (Must Fix Before Implementation)

1. **Remove invalid CHECK constraint** (lines 141-149)
   - It will fail to create
   - Application-level check is already implemented correctly

2. **Fix race condition in download tracking** (lines 703-708)
   - Use database trigger or atomic RPC
   - Current implementation will miscount downloads

3. **Fix Next.js 15 async params** (all API routes)
   - Await `context.params` in all API routes
   - Current code will break in production

### Major Issues (Should Fix)

4. **Add subscriber bypass for share links**
   - Subscribers using share links should get full access, not download limits

5. **Implement view-only UI** (when downloadLimit = 0)
   - Plan describes it, but implementation missing

6. **Add PostHog analytics**
   - Track all share link events for product insights

### Moderate Issues (Recommended)

7. **Reconsider IP tracking**
   - Either hash IPs or remove tracking entirely
   - Current approach contradicts privacy claims

8. **Add rate limiting** (before production)
   - Token validation: 100/hour per IP
   - Link creation: 5/hour per user

9. **Fix view count race condition**
   - Same atomic increment issue as downloads

### Minor Issues (Nice to Have)

10. **Add constant-time token comparison**
    - Mitigates timing-based token enumeration

11. **Add rollback migration script**
    - Safety net for deployment issues

12. **Expand test cases**
    - Add concurrency, security, and edge case tests

---

## Top 3 Concerns

### 1. Race Conditions Will Cause Data Corruption
The download tracking and view counting have classic read-modify-write race conditions. Under concurrent load, counters will be inaccurate. This breaks the download limit feature entirely.

**Severity:** CRITICAL
**Must fix before implementation**

### 2. Next.js 15 Breaking Changes Not Applied
All API routes use the old synchronous `params` pattern. This will cause runtime errors in production.

**Severity:** CRITICAL
**Must fix before implementation**

### 3. Feature Scope Creep vs. Stated Goals
The plan claims "minimal tracking, privacy-focused" but implements detailed IP tracking and visitor analytics. Either commit to privacy (remove IP tracking) or commit to analytics (add GDPR compliance).

**Severity:** MODERATE
**Decide before implementation**

---

## Questions for User

1. **Share Links After Subscription Ends:**
   - Should share links remain active after the creator's subscription expires?
   - Current plan: Yes, links remain active
   - Alternative: Auto-revoke on subscription cancellation

2. **IP Tracking vs. Privacy:**
   - Do you want detailed download tracking (requires storing IPs, GDPR compliance)?
   - Or simple count-based limits (easier to bypass, but privacy-friendly)?
   - Recommendation: Skip IP tracking for casual sharing use case

3. **Rate Limiting:**
   - Should rate limiting be implemented as part of this story, or deferred to a security hardening story?
   - Recommendation: Add basic rate limiting now (5 links/hour, 100 validations/hour)

4. **Analytics:**
   - Should share link events be tracked in PostHog from day one?
   - Recommendation: Yes, critical for understanding feature adoption

---

## Recommended Implementation Order (After Fixes)

1. Fix critical issues (CHECK constraint, race conditions, async params)
2. Database schema + migrations (with rollback script)
3. API routes (with analytics events)
4. Gallery page (with subscriber bypass + view-only UI)
5. Share management UI
6. Testing (including new test cases)
7. Documentation (with GDPR/privacy policy updates)

---

## Estimated Revised Timeline

| Phase | Original | Revised | Reason |
|-------|----------|---------|--------|
| Database | 1 hour | 2 hours | Add triggers, remove CHECK constraint |
| API Routes | 3 hours | 4 hours | Fix races, async params, analytics |
| Gallery Page | 2 hours | 3 hours | Add subscriber bypass, view-only UI |
| Share UI | 4 hours | 4 hours | No change |
| Testing | 2 hours | 3 hours | Add concurrency/security tests |
| Docs | 1 hour | 1 hour | No change |
| **Total** | **13 hours** | **17 hours** | +4 hours for fixes |

---

## Final Recommendation

**DO NOT PROCEED** with implementation until:
1. CHECK constraint is removed from schema
2. Race conditions are fixed with database triggers
3. All API routes use Next.js 15 async params pattern

After these fixes, the plan is sound and can proceed to implementation.

The research is thorough, the design is well-reasoned, and the RLS policies are correct. The issues are primarily implementation bugs, not architectural problems.

**Revised Verdict After Fixes: APPROVE WITH CONCERNS**
(Concerns: IP tracking privacy contradiction, missing rate limiting)

---

**End of Critique**
