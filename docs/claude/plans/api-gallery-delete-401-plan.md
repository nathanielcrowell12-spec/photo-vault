# API Gallery Delete 401 Unauthorized - Root Cause Analysis & Fix Plan

## Executive Summary

**Bug:** DELETE `/api/galleries/[id]` returns 401 Unauthorized even when the user is authenticated.

**Root Cause:** The route imports `createServerSupabaseClient` from `@/lib/supabase` (deprecated) instead of `@/lib/supabase-server` (correct). The deprecated client uses the service role key WITHOUT cookies, so `getUser()` always returns null.

**Impact:** HIGH - Users cannot delete their galleries. Multiple other API routes have the same bug.

---

## Phase 1: Evidence & Investigation

### Server Log Evidence

```
[Middleware] User authenticated: nathaniel.crowell12+betaph1@gmail.com accessing: /api/galleries/f84c54c7-f0de-4c1e-8b76-a57f48ced812
DELETE /api/galleries/f84c54c7-f0de-4c1e-8b76-a57f48ced812 401 in 2454ms
```

The middleware confirms the user IS authenticated, but the API route returns 401.

### The Two Supabase Client Files

#### WRONG: `src/lib/supabase.ts` (Deprecated)

```typescript
// Line 37-52
export function createServerSupabaseClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false  // <-- No cookies!
    }
  })
}
```

This client:
- Uses `createClient` from `@supabase/supabase-js` (basic client)
- Uses **service role key** (bypasses RLS)
- Does NOT access cookies
- `getUser()` returns null because there's no session

#### CORRECT: `src/lib/supabase-server.ts`

```typescript
// Line 14-35
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()  // <-- Reads auth cookies!

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        // ... sets cookies
      },
    },
  })
}
```

This client:
- Uses `createServerClient` from `@supabase/ssr` (SSR-aware)
- Uses **anon key** (respects RLS)
- Reads auth cookies from the request
- `getUser()` returns the authenticated user

### The Buggy Route

**File:** `src/app/api/galleries/[id]/route.ts`

```typescript
// Line 3 - WRONG IMPORT
import { createServerSupabaseClient } from '@/lib/supabase';

// Line 52-58
const supabase = createServerSupabaseClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

Since the wrong client is used, `getUser()` returns `{ data: { user: null } }`, triggering the 401.

---

## Phase 2: Scope of Impact

### Files Using Wrong Import (Need User Auth - BROKEN)

These files import from `@/lib/supabase` but call `getUser()` expecting authenticated users:

| File | Impact | Priority |
|------|--------|----------|
| `src/app/api/galleries/[id]/route.ts` | DELETE/POST gallery fails | HIGH |
| `src/app/api/stripe/subscription/route.ts` | GET/POST subscription fails | HIGH |
| `src/app/api/stripe/reactivate/route.ts` | POST reactivate fails | HIGH |
| `src/app/api/stripe/cancel-subscription/route.ts` | POST cancel fails | HIGH |

### Files Using Wrong Import (May Work But Using Deprecated Code)

These files use service role intentionally but should migrate to `createServiceRoleClient`:

| File | Current Behavior | Recommendation |
|------|------------------|----------------|
| `src/app/api/admin/users/route.ts` | Uses admin API (works) | Migrate to `createServiceRoleClient` |
| `src/app/api/admin/photographers/route.ts` | Uses service role (works) | Migrate to `createServiceRoleClient` |
| `src/app/api/admin/clients/route.ts` | Uses service role (works) | Migrate to `createServiceRoleClient` |
| `src/app/api/cron/suspend-photographers/route.ts` | Uses service role (works) | Migrate to `createServiceRoleClient` |
| `src/app/api/cron/deactivate-clients/route.ts` | Uses service role (works) | Migrate to `createServiceRoleClient` |
| `src/app/api/analytics/error/route.ts` | Uses service role (works) | Migrate to `createServiceRoleClient` |

### Files Using Wrong Import (Public Routes - May Have Security Issues)

These routes don't require auth but using service role may bypass RLS unintentionally:

| File | Risk Level |
|------|------------|
| `src/app/api/directory/photographers/route.ts` | LOW - Read-only public data |
| `src/app/api/directory/photographers/[username]/route.ts` | LOW - Read-only public data |
| `src/app/api/directory/locations/route.ts` | LOW - Read-only public data |
| `src/app/api/directory/locations/[slug]/route.ts` | LOW - Read-only public data |
| `src/app/api/health/route.ts` | LOW - Health check |

### Files Using Legacy `supabase` Export (Also Deprecated)

These files import the `supabase` object directly (always uses service role):

| File |
|------|
| `src/app/api/client/import/route.ts` |
| `src/app/api/client/notifications/route.ts` |
| `src/app/api/client/billing/route.ts` |
| `src/app/api/client/invoice/[paymentId]/download/route.ts` |
| `src/app/api/billing/payment-reminder/route.ts` |
| `src/app/api/platforms/smugmug/route.ts` |
| `src/app/api/platforms/shootproof/route.ts` |
| `src/app/api/platforms/pixieset/route.ts` |
| `src/app/api/helm/metrics/route.ts` |
| `src/app/api/reports/send-email/route.ts` |
| `src/app/api/reports/schedule/route.ts` |
| `src/app/api/revenue/dashboard/route.ts` |
| `src/app/api/revenue/commission/route.ts` |
| `src/app/api/revenue/analytics/route.ts` |

---

## Phase 3: Fix Plan

### Step 1: Fix Critical User-Auth Routes (Priority 1)

Update these 4 files to use the correct import:

```typescript
// BEFORE (wrong)
import { createServerSupabaseClient } from '@/lib/supabase';
const supabase = createServerSupabaseClient();

// AFTER (correct)
import { createServerSupabaseClient } from '@/lib/supabase-server';
const supabase = await createServerSupabaseClient();  // Note: Now async!
```

Files to fix immediately:
1. `src/app/api/galleries/[id]/route.ts`
2. `src/app/api/stripe/subscription/route.ts`
3. `src/app/api/stripe/reactivate/route.ts`
4. `src/app/api/stripe/cancel-subscription/route.ts`

### Step 2: Migrate Admin/Cron Routes to Use Explicit Service Role (Priority 2)

For routes that intentionally bypass RLS:

```typescript
// BEFORE (deprecated)
import { createServerSupabaseClient } from '@/lib/supabase';
const supabase = createServerSupabaseClient();

// AFTER (explicit)
import { createServiceRoleClient } from '@/lib/supabase-server';
const supabase = createServiceRoleClient();  // Sync, explicit service role
```

Files to update:
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/photographers/route.ts`
- `src/app/api/admin/clients/route.ts`
- `src/app/api/cron/suspend-photographers/route.ts`
- `src/app/api/cron/deactivate-clients/route.ts`
- `src/app/api/analytics/error/route.ts`

### Step 3: Clean Up Webhook Route (Priority 2)

The webhook route already has the correct import but also has a stale one:

```typescript
// Line 3-4 in webhooks/stripe/route.ts
import { createServerSupabaseClient } from '@/lib/supabase'  // REMOVE THIS
import { createServiceRoleClient } from '@/lib/supabase-server'  // KEEP THIS
```

The route uses `createServiceRoleClient()` correctly (line 72), so just remove the unused import.

### Step 4: Review and Fix Legacy Routes (Priority 3)

Routes using `import { supabase } from '@/lib/supabase'` need review:
- If they need user auth: Switch to `createServerSupabaseClient` from `supabase-server`
- If they bypass RLS intentionally: Switch to `createServiceRoleClient` from `supabase-server`

---

## Phase 4: Testing Plan

### Test 1: Gallery Delete (Primary Bug)

```bash
# 1. Log in as photographer
# 2. Navigate to a gallery
# 3. Click delete button
# 4. Verify gallery is soft-deleted (status changes, no 401)
```

### Test 2: Subscription Operations

```bash
# 1. Log in as client with active subscription
# 2. Cancel subscription - verify no 401
# 3. Reactivate subscription - verify no 401
```

### Test 3: Admin Routes Still Work

```bash
# 1. Log in as admin
# 2. Access /admin/users - verify data loads
# 3. Verify admin routes don't require cookies (use service role)
```

### Test 4: Cron Jobs Still Work

```bash
# 1. Call cron endpoint with CRON_SECRET header
# 2. Verify it processes without auth issues
```

---

## Implementation Checklist

- [ ] Fix `src/app/api/galleries/[id]/route.ts`
- [ ] Fix `src/app/api/stripe/subscription/route.ts`
- [ ] Fix `src/app/api/stripe/reactivate/route.ts`
- [ ] Fix `src/app/api/stripe/cancel-subscription/route.ts`
- [ ] Update admin routes to use `createServiceRoleClient`
- [ ] Update cron routes to use `createServiceRoleClient`
- [ ] Remove stale import from webhook route
- [ ] Review and fix legacy `supabase` imports
- [ ] Write tests for gallery delete
- [ ] Write tests for subscription operations
- [ ] Consider deprecation warning/lint rule for `@/lib/supabase`

---

## Future Prevention

1. **Add ESLint rule** to warn/error on imports from `@/lib/supabase`
2. **Add comments** to `@/lib/supabase.ts` with clear deprecation notice
3. **Consider renaming** `@/lib/supabase.ts` to `@/lib/supabase-deprecated.ts`
4. **Add integration test** that verifies authenticated API routes work

---

## Notes

The `createServerSupabaseClient` function in `supabase-server.ts` is **async** because it needs to await `cookies()`. When migrating, ensure all call sites use `await`:

```typescript
// Old (sync)
const supabase = createServerSupabaseClient();

// New (async)
const supabase = await createServerSupabaseClient();
```
