# QA Critic Review: Photographer Assignment Plan

**Date:** January 19, 2026
**Plan Reviewed:** `photographer-assignment-plan.md`
**Reviewer:** QA Critic (Senior Software Architect)
**Verdict:** **NEEDS REVISION**

---

## Executive Summary

The plan demonstrates good research and correctly identifies the existing safety net in the checkout flow. However, there are **significant issues** that must be addressed before implementation:

1. **Critical:** Missing admin auth check pattern (security gap)
2. **Critical:** Email retrieval approach doesn't match codebase patterns
3. **Moderate:** UI component uses non-existent Alert component
4. **Moderate:** Missing `photographer_id` vs `photographer_name` field handling

---

## Detailed Critique

### 1. SECURITY: Missing Admin Auth Check Pattern

**Issue:** The plan proposes a simple admin check pattern that differs from established patterns in the codebase.

**Plan proposes (lines 181-196):**
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const { data: profile } = await supabase
  .from('user_profiles')
  .select('user_type')
  .eq('id', user.id)
  .single()

if (profile?.user_type !== 'admin') {
  return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
}
```

**Reality:** Looking at `src/app/api/admin/photographers/route.ts`, I notice it does NOT have explicit admin authentication at all - it relies on RLS or is exposed. This is actually a **codebase pattern concern** that the plan correctly addresses.

However, the plan uses `createServerClient` from `@/lib/supabase/server` while the existing admin route uses `createServerSupabaseClient` from `@/lib/supabase`. This inconsistency could cause issues.

**Recommendation:** Use the same import pattern as existing admin routes: `createServerSupabaseClient` from `@/lib/supabase`.

---

### 2. CRITICAL: Email Retrieval Approach

**Issue:** The plan uses `supabase.auth.admin.getUserById()` to get a single photographer's email, but the codebase pattern uses `supabase.auth.admin.listUsers()` with pagination and mapping.

**Plan proposes (line 339):**
```typescript
const { data: authUser } = await supabase.auth.admin.getUserById(photographer_id)
if (authUser?.user?.email) {
  // send email
}
```

**Codebase pattern (from `src/app/api/admin/photographers/route.ts` lines 56-68):**
```typescript
const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
  perPage: 1000,
})

const emailMap = new Map<string, string>()
for (const authUser of authData?.users ?? []) {
  emailMap.set(authUser.id, authUser.email ?? '')
}
```

**Problem:** The `getUserById` approach is actually MORE correct for a single user lookup, BUT it requires the service role key which means using a specific admin client. The plan doesn't specify which Supabase client to use.

**Recommendation:**
1. Explicitly use `createAdminClient()` from `@/lib/supabase-server` for the auth lookup
2. Or, pre-fetch photographer emails in the list endpoint and pass the email via the request body

---

### 3. UI: Non-Existent Alert Component

**Issue:** The plan references an `<Alert>` component with `variant="warning"` that doesn't exist in the codebase.

**Plan proposes (lines 546-554):**
```tsx
import { Alert, AlertDescription } from '@/components/ui/alert'

<Alert variant="warning">
  <AlertTriangle className="h-4 w-4" />
  <AlertDescription>
    This photographer hasn't completed Stripe setup...
  </AlertDescription>
</Alert>
```

**Reality:** A search for "from Alert" in the codebase returns no matches. Looking at the shadcn-skill.md, there's no mention of Alert being installed.

**Recommendation:**
1. Install the Alert component: `npx shadcn@latest add alert`
2. OR use the existing error display pattern from GalleryEditModal (lines 449-453):
```tsx
<div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded">
  <p className="text-sm">Warning message here</p>
</div>
```

---

### 4. SCHEMA: photographer_id vs photographer_name

**Issue:** The plan conflates `photographer_id` and `photographer_name` fields without noting they serve different purposes.

**Plan proposes updating both (lines 317-327):**
```typescript
const { error: updateError } = await supabase
  .from('photo_galleries')
  .update({
    photographer_id: photographer_id,
    photographer_name: photographer.full_name,
    updated_at: new Date().toISOString(),
  })
  .eq('id', galleryId)
```

**Schema reality (from PHOTOVAULT_SCHEMA_CATALOG.md):**
- `photographer_id` is a UUID FK to `photographers.id`
- `photographer_name` is a varchar display name

**Question:** What happens if the gallery already has a `photographer_name` that differs from the user's `full_name`? Should we overwrite it?

**Recommendation:** Add logic to preserve existing `photographer_name` if it exists and differs:
```typescript
photographer_name: gallery.photographer_name || photographer.full_name,
```
Or explicitly document that admin assignment ALWAYS overwrites the photographer name.

---

### 5. QUERY PATTERN: Incorrect Join Syntax

**Issue:** The plan's query for photographers uses incorrect Supabase join syntax.

**Plan proposes (lines 200-208):**
```typescript
const { data: photographers, error } = await supabase
  .from('user_profiles')
  .select(`
    id,
    full_name,
    photographers!inner(stripe_connect_status),
    photo_galleries(count)
  `)
  .eq('user_type', 'photographer')
```

**Problems:**
1. The `photo_galleries(count)` syntax doesn't work as shown - Supabase requires specific count syntax
2. `photographers!inner` assumes the foreign key relationship is set up correctly

**Correct pattern (from supabase-skill.md):**
```typescript
// For count, use a separate query or:
.select('*, photo_galleries(count)', { count: 'estimated' })

// Or aggregate in JavaScript after fetching
```

**Recommendation:** Follow the existing pattern in `src/app/api/admin/photographers/route.ts` which fetches separately and aggregates in JavaScript (lines 71-104).

---

### 6. EMAIL TEMPLATE: Missing React Email Components

**Issue:** The email template in the plan uses raw HTML strings instead of React Email components.

**Plan proposes (lines 391-475):**
```typescript
await resend.emails.send({
  // ...
  html: `<!DOCTYPE html><html>...`,
  text: `...`,
})
```

**Codebase pattern (from resend-skill.md and email-service.ts):**
The existing EmailService class uses template functions from dedicated files:
- `templates.ts`
- `critical-templates.ts`
- `revenue-templates.ts`
- `engagement-templates.ts`
- `family-templates.ts`

**Recommendation:**
1. Create a new template function in the appropriate template file (likely `critical-templates.ts`)
2. Follow the established pattern: `getPhotographerGalleryAssignmentEmailHTML()` / `getPhotographerGalleryAssignmentEmailText()`
3. Add a new method to `EmailService` class: `sendPhotographerGalleryAssignmentEmail()`

---

### 7. ADMIN CHECK: Plan Claims Admin-Only but GalleryEditModal is Client Component

**Issue:** The plan adds photographer assignment to `GalleryEditModal.tsx` and checks `isAdmin`, but how is `isAdmin` determined in a client component?

**Plan proposes (lines 503-506):**
```typescript
const fetchPhotographers = async () => {
  if (isAdmin) {
    // fetch photographers
  }
}
```

**Reality:** Looking at `GalleryEditModal.tsx`, it uses `useAuth()` which provides `userType`. There is no `isAdmin` boolean.

**Recommendation:** Use the existing pattern:
```typescript
const { userType } = useAuth()
const isAdmin = userType === 'admin'
```
And document this in the plan.

---

### 8. EDGE CASE: Unassigning a Photographer

**Issue:** The plan mentions "unassign" as an edge case but doesn't define the API for it.

**Plan mentions (line 649):**
> "Assign photographer then unassign (set to null)"

**Question:** How does the UI trigger this? What happens to the gallery when photographer_id is null? Does the client dropdown have a "None" option like the existing client dropdown?

**Recommendation:** Either:
1. Add explicit documentation for the unassign flow
2. Or explicitly state this is out of scope for MVP

---

### 9. RE-ASSIGNMENT LOGIC: Race Condition Risk

**Issue:** The check for "already assigned" uses a GET-then-UPDATE pattern vulnerable to race conditions.

**Plan proposes (lines 314-316):**
```typescript
const wasAlreadyAssigned = gallery.photographer_id === photographer_id

// ... later ...

if (send_onboarding_email && isInactive && !wasAlreadyAssigned) {
  // send email
}
```

**Risk:** Between fetching the gallery and updating it, another admin could make changes.

**Reality:** Given this is a beta app with low concurrency, this is acceptable for now. But document the limitation.

**Recommendation:** Add a comment noting this is acceptable for current scale but should use optimistic locking (version column) if multiple admins become common.

---

### 10. TEST COVERAGE: Missing API Error Cases

**Issue:** The testing plan doesn't cover important error scenarios.

**Missing tests:**
- What if photographer's email is null in auth.users?
- What if Resend fails to send the email?
- What if the gallery update succeeds but email fails?
- Rate limiting: What if admin assigns same gallery to 10 photographers rapidly?

**Recommendation:** Add error handling tests:
1. Email send failure (should still return success for assignment)
2. Missing email (should still assign, log warning)
3. Idempotency (assigning same photographer twice returns success, no duplicate email)

---

## Verdict: NEEDS REVISION

### Must Fix Before Implementation (Blockers)

1. **Use correct Supabase client import** - `createServerSupabaseClient` not `createServerClient`
2. **Fix email retrieval** - Use admin client explicitly or pre-fetch email
3. **Fix or remove Alert component** - Either install it or use existing pattern
4. **Fix query syntax for gallery count** - Use JavaScript aggregation pattern

### Should Fix (Important)

5. Add email template to proper template file following existing patterns
6. Clarify `isAdmin` derivation in UI code
7. Add handling for `photographer_name` preservation

### Nice to Have (Minor)

8. Add race condition caveat comment
9. Expand test coverage for error cases
10. Document unassign flow

---

## Top 3 Concerns (For User)

1. **Email retrieval uses wrong Supabase client** - The plan calls `supabase.auth.admin.getUserById()` but doesn't specify using the admin client. Without the service role key, this will fail silently or error.

2. **UI references non-existent Alert component** - Will cause immediate build failure if implemented as-is. Need to either install the component or use the existing inline error pattern.

3. **Email template doesn't follow established patterns** - The plan puts raw HTML in the API route instead of using the template system. This will work but creates inconsistency and makes the email harder to maintain/test.

---

**Reviewed by:** QA Critic
**Date:** 2026-01-19
