# Plan Critique: Client Gallery Visibility Bug

**Plan Reviewed:** client-gallery-visibility-investigation.md (DOES NOT EXIST)
**Skill Reference:** supabase-skill.md
**Date:** January 3, 2026

## Summary Verdict

**CANNOT REVIEW - PLAN MISSING**

The investigation plan file `client-gallery-visibility-investigation.md` does not exist. This critique document instead provides:
1. Analysis of the root cause based on code review
2. What any investigation plan MUST address
3. Recommended fix approach matching existing working patterns

---

## Critical Finding: Root Cause Identified via Code Review

### The Problem

**GalleryGrid.tsx (lines 103-112)** uses the WRONG query pattern for clients:

```typescript
// For clients: show only self-uploaded galleries (photographer_id is null)
// This filters out old test data and photographer-assigned galleries
query = query.eq('user_id', userId).is('photographer_id', null)
```

This query logic is **fundamentally broken** for paying clients:

1. It requires `photographer_id` to be NULL
2. It requires `user_id` to match the client's auth ID directly
3. **Problem:** When a photographer creates a gallery FOR a client:
   - `photographer_id` is set (NOT null)
   - `client_id` references the `clients` table
   - `user_id` may or may not be set depending on when client signed up

### The Working Pattern (stats API)

**`/api/client/stats/route.ts` (lines 19-37)** does it correctly:

```typescript
// First, get the client record(s) linked to this auth user
// The clients table has user_id FK to auth.users
const { data: clientRecords } = await supabase
  .from('clients')
  .select('id')
  .eq('user_id', user.id)

const clientIds = clientRecords?.map(c => c.id) || []

// Get total galleries count for this client
// photo_galleries.client_id references clients.id, NOT auth.users.id
let galleriesCount = 0
if (clientIds.length > 0) {
  const { count } = await supabase
    .from('photo_galleries')
    .select('*', { count: 'exact', head: true })
    .in('client_id', clientIds)
  galleriesCount = count || 0
}
```

**Key Insight:** The stats API:
1. First looks up the `clients` table to find client records where `user_id = auth.uid()`
2. Then queries `photo_galleries` using `client_id` IN those client IDs

### Why GalleryGrid Fails

| Scenario | GalleryGrid Query | Result |
|----------|------------------|--------|
| Photographer-created gallery for client | `photographer_id = NULL` fails | Gallery NOT shown |
| Client self-uploaded gallery | Works (if `user_id` set) | Gallery shown |
| Client linked via `clients` table | `user_id` check fails | Gallery NOT shown |

**The GalleryGrid comment is misleading:** It says "show only self-uploaded galleries" but that's not the business requirement. Clients should see ALL their galleries, including those created by photographers.

---

## What Any Fix Plan MUST Address

### 1. Root Cause Verification (Critical - Missing)

No investigation plan can skip actually VERIFYING the root cause with SQL. Run these queries:

```sql
-- 1. Find "Beta client 2" user
SELECT id, email FROM auth.users WHERE email LIKE '%beta%client%2%';

-- 2. Check if they have client records
SELECT c.id, c.name, c.photographer_id, c.user_id
FROM clients c
WHERE c.user_id = '<auth_user_id>' OR c.email LIKE '%beta%client%2%';

-- 3. Check galleries linked to this client
SELECT pg.id, pg.gallery_name, pg.photographer_id, pg.client_id, pg.user_id
FROM photo_galleries pg
WHERE pg.client_id IN (SELECT id FROM clients WHERE user_id = '<auth_user_id>');

-- 4. Test what GalleryGrid query returns
SELECT * FROM photo_galleries
WHERE user_id = '<auth_user_id>' AND photographer_id IS NULL;

-- 5. Compare results - the difference is the bug
```

### 2. Fix Approach Options

**Option A: Create Server-Side API (Recommended)**

Match the working stats API pattern. Create `/api/client/galleries/route.ts`:

```typescript
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get client records for this user
  const { data: clientRecords } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)

  const clientIds = clientRecords?.map(c => c.id) || []

  // Build OR query for both client-linked AND self-uploaded galleries
  let query = supabase.from('photo_galleries').select('*')

  if (clientIds.length > 0) {
    // Client has photographer relationships - show those galleries
    query = query.or(`client_id.in.(${clientIds.join(',')}),and(user_id.eq.${user.id},photographer_id.is.null)`)
  } else {
    // No photographer relationships - show only self-uploaded
    query = query.eq('user_id', user.id).is('photographer_id', null)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  return NextResponse.json({ galleries: data || [] })
}
```

**Pros:**
- Server-side, respects RLS
- Matches working stats API pattern
- Centralizes query logic

**Cons:**
- Requires GalleryGrid to fetch from API instead of direct Supabase call
- Additional network request

**Option B: Fix GalleryGrid Query Directly**

Update the client query in GalleryGrid.tsx:

```typescript
if (isPhotographer) {
  query = query.eq('photographer_id', userId)
} else {
  // Get client IDs first, then query galleries
  const { data: clientRecords } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId)

  const clientIds = clientRecords?.map(c => c.id) || []

  if (clientIds.length > 0) {
    // Show galleries where client_id matches OR self-uploaded
    query = query.or(`client_id.in.(${clientIds.join(',')}),and(user_id.eq.${userId},photographer_id.is.null)`)
  } else {
    // No client records - only self-uploaded
    query = query.eq('user_id', userId).is('photographer_id', null)
  }
}
```

**Pros:**
- Single location change
- No new API endpoint

**Cons:**
- Two sequential queries (clients, then galleries)
- Client-side Supabase call (works but less secure)

**Option C: RLS Policy Fix (Database Level)**

Create a view or RLS policy that handles the complex logic:

```sql
CREATE OR REPLACE VIEW client_visible_galleries AS
SELECT pg.*
FROM photo_galleries pg
WHERE
  -- Photographer sees their own galleries
  pg.photographer_id = auth.uid()
  OR
  -- Client sees galleries assigned to their client record
  pg.client_id IN (
    SELECT c.id FROM clients c WHERE c.user_id = auth.uid()
  )
  OR
  -- Client sees self-uploaded galleries (no photographer)
  (pg.user_id = auth.uid() AND pg.photographer_id IS NULL);
```

**Pros:**
- Database-level security
- Single source of truth

**Cons:**
- Views have performance implications
- Harder to debug
- May need additional RLS policies

### 3. Recommended Approach

**Option A (Server-Side API)** is recommended because:

1. **Matches Existing Pattern:** The stats API already works this way
2. **Centralized Logic:** Easy to maintain and test
3. **RLS Compliant:** Uses server client with proper auth
4. **No RLS Changes Needed:** Avoids database migrations

---

## Critical Issues (Must Fix Before Implementation)

### Issue 1: No Database Verification

Any plan MUST include SQL queries to verify:
1. The specific client record(s) for "Beta client 2"
2. What galleries exist with that `client_id`
3. What the current (broken) query returns vs expected

**Without this verification, you're guessing at the root cause.**

### Issue 2: The Comments Are Wrong

GalleryGrid.tsx line 107-108 says:
```typescript
// For clients: show only self-uploaded galleries (photographer_id is null)
// This filters out old test data and photographer-assigned galleries
```

This comment is **incorrect behavior specification**. Clients should see:
1. Galleries created by photographers for them (`client_id` linked)
2. Self-uploaded galleries (`user_id` direct, `photographer_id` null)

The comment suggests the current behavior is intentional. **Clarify with stakeholder.**

### Issue 3: RLS Policy Check

Before changing queries, verify RLS policies allow the needed access:

```sql
-- Check what policies exist on photo_galleries
SELECT * FROM pg_policies WHERE tablename = 'photo_galleries';
```

If there's no policy allowing clients to SELECT galleries via `client_id`, the fix won't work.

---

## Concerns (Should Address)

### Concern 1: Other Broken Patterns

If GalleryGrid is broken, check other client-facing components:

- `/client/dashboard/page.tsx` - Uses stats API (likely working)
- `/client/timeline/page.tsx` - Check query pattern
- `/client/galleries/page.tsx` - Check query pattern
- Any component using `photo_galleries` query for clients

### Concern 2: Performance

The stats API makes 3+ sequential queries:
1. Get client records
2. Get gallery IDs
3. Count photos per gallery
4. Count favorites

For the galleries list, consider:
- Single query with JOINs
- Caching client IDs in React context/state

### Concern 3: Edge Cases

Handle these scenarios:
1. Client with NO `clients` record (self-upload only user)
2. Client linked to MULTIPLE photographers (multiple client records)
3. Client with some galleries that have `user_id` set and some that don't

---

## Minor Notes (Consider)

### Note 1: Supabase Client Type

GalleryGrid uses `import { supabase } from '@/lib/supabase'` (line 10).

Per skill file, there are three clients:
- Browser Client (client components)
- Server Client (server components, API routes)
- Admin Client (webhooks, bypasses RLS)

Verify GalleryGrid is using the correct client for RLS behavior.

### Note 2: Logging

GalleryGrid has extensive console.log statements (lines 90-94, 114-136). These should be:
1. Removed or gated behind environment check for production
2. Used to debug the current issue first

---

## What the Plan Gets Right

**N/A - No plan exists to critique.**

However, the existing codebase has several good patterns:
1. **Stats API Pattern:** Correctly queries via `clients` table first
2. **RLS Policies:** `supabase-client-gallery-rls-fix-plan.md` shows proper RLS thinking
3. **Server-Side Clients:** Skill file clearly documents when to use each client type

---

## Recommendation

**BEFORE writing a fix plan:**

1. **Verify Root Cause with SQL** - Run the queries listed above against production
2. **Confirm Expected Behavior** - Should clients see photographer-created galleries?
3. **Check RLS Policies** - Ensure SELECT access works for the fix approach
4. **Choose Fix Approach** - Recommend Option A (Server-Side API)
5. **Identify All Affected Components** - Search codebase for similar broken patterns

**Suggested Fix Plan Outline:**

```markdown
# Client Gallery Visibility Fix Plan

## Root Cause
[SQL query results proving the issue]

## Fix Approach
Create `/api/client/galleries` endpoint matching stats API pattern

## Implementation Steps
1. Create API endpoint with correct query
2. Update GalleryGrid to use API
3. Verify RLS policies support the access
4. Test with "Beta client 2" account
5. Add tests for edge cases

## Testing
- SQL verification before/after
- Manual test with affected account
- Edge case testing (multi-photographer client, etc.)
```

---

## Summary

The investigation plan does not exist, but code review reveals:

**Root Cause:** GalleryGrid queries `photo_galleries.user_id = auth.uid() AND photographer_id IS NULL`, which excludes photographer-created galleries linked via `client_id`.

**Fix:** Create server-side API using the working pattern from stats API - query `clients` table first, then use `client_id` to find galleries.

**Risk:** Without SQL verification against the actual "Beta client 2" account, this analysis is based on code patterns only. The actual database state may reveal additional issues.

---

*Generated by QA Critic Expert - January 3, 2026*
