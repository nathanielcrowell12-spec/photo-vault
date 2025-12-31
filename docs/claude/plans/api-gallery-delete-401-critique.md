# API Gallery Delete 401 - Plan Critique

**Reviewed by:** QA Critic Expert
**Date:** 2025-12-30
**Plan:** `api-gallery-delete-401-plan.md`

---

## Verdict: APPROVED WITH CORRECTIONS

The plan correctly identifies the root cause and proposes the right solution. However, there are **two critical issues** that must be addressed before implementation, and several minor concerns.

---

## Critical Issues (Must Fix Before Implementation)

### 1. RLS Policy Mismatch - WILL BREAK DELETE AFTER FIX

**Severity:** CRITICAL - The fix will not work as written

The route code uses `user_id` to filter:
```typescript
// Line 69 in route.ts
.eq('user_id', user.id); // Ensure users can only delete their own galleries
```

But the RLS policies on `photo_galleries` use `photographer_id`:
```sql
-- From photo-galleries-rls-policies.sql
CREATE POLICY "Photographers can delete own galleries"
ON photo_galleries
FOR DELETE
USING (photographer_id = auth.uid());
```

**The Problem:** After switching to the correct Supabase client (which respects RLS):
1. `getUser()` will return the authenticated user (good!)
2. The query will try to delete where `user_id = user.id`
3. RLS will evaluate `photographer_id = auth.uid()`
4. If `user_id != photographer_id`, the delete will silently return 0 rows

**Evidence:** The `photo_galleries` table has BOTH columns:
- `photographer_id` - used for RLS policies (references who owns the gallery)
- `user_id` - added later for client linking (different purpose)

**Fix Required:** The route must use `photographer_id` instead of `user_id`:
```typescript
.eq('photographer_id', user.id) // Matches RLS policy
```

Same issue exists in the POST (restore) method at line 25.

---

### 2. Missing DELETE Policy for gallery_photos

**Severity:** HIGH - Photos won't be deleted with the gallery

The route relies on soft-delete triggers, but if those triggers don't fire (or if hard delete is ever needed), the RLS policies for `gallery_photos` only allow SELECT, not DELETE:

```sql
-- No DELETE policy exists for gallery_photos in the referenced SQL files
```

The plan mentions updating `gallery_photos` in the POST route but doesn't verify RLS policies allow this.

**Fix Required:** Either:
1. Verify DELETE cascades via trigger and doesn't need RLS
2. Or add DELETE policy for `gallery_photos`

---

## Medium Issues

### 3. Incomplete Scope - POST (Restore) Also Broken

**Severity:** MEDIUM - Same import bug exists in POST

The plan focuses on DELETE but the POST method (gallery restore) has the identical problem:
- Same wrong import
- Same `user_id` vs `photographer_id` mismatch

This is mentioned implicitly but should be explicitly listed in the checklist.

---

### 4. No Error Handling for RLS Failures

**Severity:** MEDIUM - Silent failures are hard to debug

When RLS blocks an operation, Supabase returns success with 0 rows affected. The current code only checks for errors, not for "no rows matched":

```typescript
const { error } = await supabase.from('photo_galleries').delete()...
if (error) { /* only checks for errors, not 0 rows */ }
```

After the fix, a user trying to delete someone else's gallery will get a 200 OK with "Gallery moved to recently deleted" even though nothing happened.

**Recommendation:** Check the count of affected rows and return 404 if 0:
```typescript
const { error, count } = await supabase
  .from('photo_galleries')
  .delete({ count: 'exact' })
  ...
if (count === 0) {
  return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
}
```

---

### 5. Testing Plan is Incomplete

**Severity:** MEDIUM - Important test cases missing

The testing plan should include:
- **Negative test:** User A cannot delete User B's gallery (should get 404, not 500)
- **Verify RLS works:** Delete as anon user should fail
- **Data integrity:** After delete, verify `gallery_photos` are also soft-deleted

---

## Minor Issues

### 6. Priority 2 Items Mix Concerns

The Priority 2 list mixes:
- Essential follow-up (admin routes migration)
- Nice-to-have (removing stale import from webhook route)

Consider separating these into Priority 2 and Priority 3.

---

### 7. Future Prevention Could Be Stronger

The plan suggests ESLint rules, but a stronger solution exists:
- **Delete the deprecated file entirely** after all routes are migrated
- Or rename it to `supabase-service-role-ONLY.ts` to make misuse obvious

---

## What the Plan Got Right

1. **Root cause correctly identified** - The import from wrong file causing `getUser()` to return null
2. **Evidence-based analysis** - Log evidence shows middleware confirms auth but route fails
3. **Scope analysis is thorough** - All 30 affected files were found
4. **Prioritization is sensible** - User-auth routes first, admin routes second
5. **Async/await note is important** - Calling out that the new client is async prevents runtime errors

---

## Corrected Implementation Checklist

- [ ] Fix `src/app/api/galleries/[id]/route.ts`:
  - [ ] Change import to `from '@/lib/supabase-server'`
  - [ ] Add `await` to `createServerSupabaseClient()` call
  - [ ] Change `user_id` to `photographer_id` in DELETE query
  - [ ] Change `user_id` to `photographer_id` in POST query
  - [ ] Add count check for 0 rows affected
- [ ] Fix `src/app/api/stripe/subscription/route.ts`
- [ ] Fix `src/app/api/stripe/reactivate/route.ts`
- [ ] Fix `src/app/api/stripe/cancel-subscription/route.ts`
- [ ] Write tests:
  - [ ] Happy path: Owner can delete gallery
  - [ ] Negative: Non-owner gets 404 (not 500)
  - [ ] Verify photos are soft-deleted with gallery
- [ ] Verify `gallery_photos` RLS allows updates from authenticated photographer
- [ ] Update admin/cron routes to use `createServiceRoleClient`
- [ ] Consider deprecation strategy for `@/lib/supabase.ts`

---

## Summary

| Aspect | Assessment |
|--------|------------|
| Root Cause | Correctly identified |
| Proposed Fix | Correct import fix, but missing column name correction |
| Scope | Good breadth, but missed POST method detail |
| Edge Cases | RLS silent failure not handled |
| Testing | Needs negative test cases |
| Technical Debt | Plan addresses this well |
| Security | Fix improves security (RLS will be respected) |

**Verdict:** APPROVED with the column name fix (`user_id` -> `photographer_id`) as a required correction before implementation.

---

*Critique generated by QA Critic Expert*
