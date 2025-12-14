# Supabase: Client ID Access Control Fix - Complete Investigation & Plan

## Summary
**THE ROOT CAUSE**: The favorite toggle bug revealed a CRITICAL misunderstanding of the `client_id` relationship chain. The code was comparing `gallery.client_id === user.id`, but `client_id` is a FOREIGN KEY to `clients.id`, NOT to `auth.users.id`. The correct access check must join through `clients.user_id`.

**THE CASCADING DAMAGE**: A previous "quick fix" attempt created TypeScript errors across 5 files because it didn't understand the full relationship chain and TypeScript type definitions.

This plan documents:
1. The FULL FK relationship chain
2. ALL files with potential client_id bugs
3. Correct access control patterns (with SQL examples)
4. TypeScript type inconsistencies
5. Step-by-step fixes

---

## Official Documentation Reference

**Supabase RLS Policy Patterns:**
- https://supabase.com/docs/guides/auth/row-level-security
- https://supabase.com/docs/guides/database/joins-and-nested-tables

**Key Insights:**
- RLS policies can join across multiple tables to check ownership
- `auth.uid()` returns the authenticated user's UUID from `auth.users.id`
- Foreign key relationships must be followed correctly in access checks

---

## Database Schema Analysis

### The Full FK Relationship Chain

```
┌─────────────────────────────────────────────────────────────────┐
│                     RELATIONSHIP CHAIN                          │
└─────────────────────────────────────────────────────────────────┘

1. auth.users (Supabase Auth)
   └── id (UUID) ← Primary Key
       │
       ├─> user_profiles.id (Extended user data)
       │   └── user_type: 'client' | 'photographer' | 'admin' | 'secondary'
       │
       └─> photo_galleries.user_id (Self-uploaded galleries ONLY)
           └── For galleries with NO photographer (clients uploading their own)

2. clients (Client records created by photographers)
   ├── id (UUID) ← Primary Key
   ├── photographer_id → auth.users.id
   └── user_id → auth.users.id (nullable - set after client creates account)
       │
       └─> Links client record to user account AFTER signup

3. photo_galleries (Main gallery table)
   ├── id (UUID) ← Primary Key
   ├── photographer_id → auth.users.id (nullable for self-uploads)
   ├── client_id → clients.id (nullable - set when photographer assigns gallery)
   └── user_id → auth.users.id (nullable - for self-uploaded galleries)

4. gallery_photos (Individual photos in galleries)
   ├── id (UUID) ← Primary Key
   ├── gallery_id → photo_galleries.id
   └── is_favorite (boolean)
```

### FK Definitions (from schema files)

**`clients` table:**
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,  -- Added later
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  ...
);
```

**`photo_galleries` table:**
```sql
CREATE TABLE photo_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- Nullable for self-uploads
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,          -- FK to clients.id
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,         -- For self-uploads
  gallery_name TEXT NOT NULL,
  ...
);
```

**Key Observation:**
- `photo_galleries.client_id` → `clients.id` (NOT `auth.users.id`)
- `clients.user_id` → `auth.users.id` (links client record to user account)
- Therefore: `photo_galleries.client_id` → `clients.id` → `clients.user_id` → `auth.users.id`

---

## The Original Bug (Favorite Toggle)

### Location
`src/app/api/photos/[id]/favorite/route.ts`

### What Was Wrong

**INCORRECT CODE (Before Fix):**
```typescript
const { data: photo } = await supabase
  .from('gallery_photos')
  .select(`
    id,
    gallery_id,
    is_favorite,
    photo_galleries!inner (
      id,
      client_id,
      user_id,
      photographer_id
    )
  `)
  .eq('id', photoId)
  .single()

const gallery = photo.photo_galleries
const hasAccess = gallery.client_id === user.id  // ❌ WRONG!
```

**Why This Failed:**
- `gallery.client_id` is a UUID pointing to `clients.id`
- `user.id` is the authenticated user's UUID from `auth.users.id`
- These are DIFFERENT ID spaces - comparing them will NEVER match

### The Correct Pattern

**CORRECT CODE (Current):**
```typescript
const { data: photo } = await supabase
  .from('gallery_photos')
  .select(`
    id,
    gallery_id,
    is_favorite,
    photo_galleries!inner (
      id,
      client_id,
      user_id,
      photographer_id,
      clients (
        user_id
      )
    )
  `)
  .eq('id', photoId)
  .single()

// Handle Supabase join return (array vs object)
const galleryData = photo.photo_galleries as any
const gallery = {
  id: galleryData?.id as string,
  client_id: galleryData?.client_id as string | null,
  user_id: galleryData?.user_id as string | null,
  photographer_id: galleryData?.photographer_id as string | null,
  clientUserId: (galleryData?.clients?.[0]?.user_id ?? galleryData?.clients?.user_id) as string | null
}

const hasAccess =
  gallery.user_id === user.id ||          // Self-uploaded gallery
  gallery.photographer_id === user.id ||  // Photographer owns gallery
  gallery.clientUserId === user.id        // Client linked via clients.user_id
```

**Why This Works:**
- Joins `photo_galleries` → `clients` to get `clients.user_id`
- Compares `clients.user_id` (not `client_id`) with `auth.uid()`
- Handles both Supabase join return types (array/object)

---

## All Files with Potential client_id Bugs

### Search Results

Found **25 files** with `client_id` comparisons or access checks:

**HIGH PRIORITY (Access Control):**
1. ✅ `src/app/api/photos/[id]/favorite/route.ts` - FIXED (current implementation correct)
2. ⚠️ `src/app/api/webhooks/stripe/route.ts` - NEEDS REVIEW (lines 206-217)
3. ⚠️ `src/app/api/stripe/gallery-checkout/route.ts` - NEEDS REVIEW
4. ⚠️ `src/app/api/stripe/public-checkout/route.ts` - NEEDS REVIEW
5. ⚠️ `src/app/api/family/shared-galleries/route.ts` - NEEDS REVIEW
6. ⚠️ `src/app/api/galleries/[id]/sharing/route.ts` - NEEDS REVIEW
7. ⚠️ `src/app/gallery/[galleryId]/page.tsx` - NEEDS REVIEW (checkAccess function)

**MEDIUM PRIORITY (Data Queries):**
8. `src/app/api/admin/clients/route.ts` - Admin queries (service role, probably OK)
9. `src/app/api/gallery/download/route.ts` - Download access checks
10. `src/app/api/v1/upload/prepare/route.ts` - Desktop upload (service role)

**LOW PRIORITY (Non-Access):**
11-25. Various dashboard/analytics/billing routes (likely using service role or correct joins)

---

## Broken Files from Previous "Fix"

### TypeScript Error

```
src/contexts/AuthContext.tsx(543,5): error TS2322:
Type '(email: string, password: string, userType: "client" | "photographer" | "admin", fullName?: string) => ...'
is not assignable to type '(email: string, password: string, userType: UserType, fullName?: string | undefined) => ...'.
  Types of parameters 'userType' and 'userType' are incompatible.
    Type 'UserType' is not assignable to type '"photographer" | "admin" | "client"'.
      Type '"secondary"' is not assignable to type '"photographer" | "admin" | "client"'.
```

### Root Cause of TypeScript Errors

**INCONSISTENT USERTYPE DEFINITIONS:**

**Location 1: `src/lib/access-control.ts` (line 13)**
```typescript
export type UserType = 'client' | 'photographer' | 'admin' | 'secondary' | null
```

**Location 2: `src/contexts/AuthContext.tsx` (line 9)**
```typescript
type UserType = 'client' | 'photographer' | 'admin' | 'secondary'  // No null
```

**Location 3: `src/contexts/AuthContext.tsx` (line 241 - function signature)**
```typescript
const signUp = async (
  email: string,
  password: string,
  userType: 'client' | 'photographer' | 'admin',  // ❌ Missing 'secondary'!
  fullName?: string
) => { ... }
```

**Location 4: `src/types/analytics.ts` (line 166)**
```typescript
viewer_type?: 'photographer' | 'client' | 'secondary' | 'admin' | 'anonymous'
```

**The Problem:**
1. The `access-control.ts` export has `'secondary' | null`
2. The `AuthContext` interface expects `UserType` (with 'secondary')
3. But the `signUp` function signature OMITS 'secondary'
4. Analytics types include 'anonymous' but other places don't
5. Some places allow `null`, others don't

### Files with UserType Definitions

**Found in 15 files:**
1. `src/lib/access-control.ts` - `export type UserType = 'client' | 'photographer' | 'admin' | 'secondary' | null`
2. `src/contexts/AuthContext.tsx` - `type UserType = 'client' | 'photographer' | 'admin' | 'secondary'` (no null)
3. `src/types/analytics.ts` - `viewer_type?: 'photographer' | 'client' | 'secondary' | 'admin' | 'anonymous'`
4. `src/app/gallery/[galleryId]/page.tsx` - Uses `userType` from AuthContext
5. `src/middleware.ts` - Uses UserType for route protection
6. `src/components/MessagingPanel.tsx` - `const [userType, setUserType] = useState<string>('')` (too loose!)
7. Various other pages importing/using UserType

---

## Correct Access Control Patterns

### Pattern 1: Client Accessing Their Gallery (via client_id)

**SQL (RLS Policy):**
```sql
-- Clients can view galleries assigned to them
CREATE POLICY "Clients can view their galleries"
  ON photo_galleries FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );
```

**TypeScript (API Route):**
```typescript
const { data: { user } } = await supabase.auth.getUser()

const { data: gallery } = await supabase
  .from('photo_galleries')
  .select(`
    *,
    clients!inner (
      user_id
    )
  `)
  .eq('id', galleryId)
  .single()

// Handle array/object return
const clientData = Array.isArray(gallery.clients)
  ? gallery.clients[0]
  : gallery.clients

const isClient = clientData?.user_id === user.id
```

### Pattern 2: Client Accessing Self-Uploaded Gallery

**SQL (RLS Policy):**
```sql
-- Clients can view self-uploaded galleries (no photographer)
CREATE POLICY "Clients can view self-uploaded galleries"
  ON photo_galleries FOR SELECT
  USING (
    photographer_id IS NULL
    AND user_id = auth.uid()
  );
```

**TypeScript:**
```typescript
const { data: { user } } = await supabase.auth.getUser()

const { data: gallery } = await supabase
  .from('photo_galleries')
  .select('*')
  .eq('id', galleryId)
  .single()

const isSelfUpload = gallery.photographer_id === null
  && gallery.user_id === user.id
```

### Pattern 3: Combined Access Check (Any Valid Path)

**SQL (RLS Policy):**
```sql
CREATE POLICY "Users can view galleries they have access to"
  ON photo_galleries FOR SELECT
  USING (
    -- Photographer owns gallery
    photographer_id = auth.uid()
    OR
    -- Client assigned to gallery
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR
    -- Self-uploaded gallery
    (photographer_id IS NULL AND user_id = auth.uid())
  );
```

**TypeScript (Full Example):**
```typescript
async function checkGalleryAccess(galleryId: string, user: User): Promise<boolean> {
  const { data: gallery } = await supabase
    .from('photo_galleries')
    .select(`
      id,
      photographer_id,
      client_id,
      user_id,
      clients (
        user_id
      )
    `)
    .eq('id', galleryId)
    .single()

  if (!gallery) return false

  // Extract client user_id (handle array/object)
  const clientData = Array.isArray(gallery.clients)
    ? gallery.clients[0]
    : gallery.clients
  const clientUserId = clientData?.user_id ?? null

  // Check access via ANY valid path
  return (
    gallery.photographer_id === user.id ||  // Photographer
    clientUserId === user.id ||             // Client (via clients.user_id)
    gallery.user_id === user.id             // Self-upload
  )
}
```

### Pattern 4: Secondary Users (Family Members)

**For secondary users accessing their primary's galleries:**
```sql
-- Secondary users can view galleries their primary has access to
CREATE POLICY "Secondary users can view primary's galleries"
  ON photo_galleries FOR SELECT
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      INNER JOIN family_accounts fa ON fa.primary_user_id = c.user_id
      WHERE fa.secondary_user_id = auth.uid()
    )
  );
```

---

## Implementation Steps

### Step 1: Fix TypeScript Type Definitions

**Goal:** Create a SINGLE source of truth for UserType

**File:** `src/lib/access-control.ts`

**Action:** Keep the existing definition (most complete):
```typescript
export type UserType = 'client' | 'photographer' | 'admin' | 'secondary' | null
```

**File:** `src/contexts/AuthContext.tsx`

**Action 1:** Remove local UserType definition, import from access-control:
```typescript
import { UserType } from '@/lib/access-control'
```

**Action 2:** Fix signUp function signature (line 241):
```typescript
// BEFORE:
const signUp = async (
  email: string,
  password: string,
  userType: 'client' | 'photographer' | 'admin',  // ❌ Missing 'secondary'
  fullName?: string
) => { ... }

// AFTER:
const signUp = async (
  email: string,
  password: string,
  userType: Exclude<UserType, null>,  // ✅ All valid types except null
  fullName?: string
) => { ... }
```

**File:** `src/types/analytics.ts`

**Action:** Import and use UserType for viewer_type:
```typescript
import { UserType } from '@/lib/access-control'

export interface GalleryViewedEvent extends AuthenticatedEventProperties {
  gallery_id: string
  photographer_id: string
  photo_count: number
  is_owner: boolean
  viewer_type?: Exclude<UserType, null> | 'anonymous'  // ✅ Consistent + anonymous
}
```

**File:** `src/components/MessagingPanel.tsx` (line 74)

**Action:** Fix overly loose type:
```typescript
// BEFORE:
const [userType, setUserType] = useState<string>('')  // ❌ Too loose

// AFTER:
import { UserType } from '@/lib/access-control'
const [userType, setUserType] = useState<UserType>(null)  // ✅ Properly typed
```

### Step 2: Audit and Fix client_id Access Checks

**High Priority Files to Review:**

#### 2.1: `src/app/api/webhooks/stripe/route.ts` (Lines 206-217)

**Current code:**
```typescript
if (clientId) {
  const { data: client } = await supabase
    .from('clients')
    .select('email, name')
    .eq('id', clientId)
    .single()

  if (client) {
    customerEmail = client.email
    customerName = client.name
  }
}
```

**Analysis:** This is OK - it's fetching client data by `clients.id`, not doing access control.

#### 2.2: `src/app/gallery/[galleryId]/page.tsx` (checkAccess function)

**Current code (lines 206-211):**
```typescript
// SECOND: Check if client owns this gallery (client_id matches) but no pricing was set
if (galleryData.client_id === user.id && !galleryData.total_amount) {
  console.log('[Gallery] Gallery assigned to client with no pricing - free access')
  setHasAccess(true)
  setCheckingAccess(false)
  return
}
```

**Problem:** ❌ Comparing `client_id` (points to `clients.id`) with `user.id` (auth user)

**Fix:**
```typescript
// SECOND: Check if client owns this gallery via clients.user_id
// Need to fetch client record to compare user_id
const { data: clientRecord } = await supabase
  .from('clients')
  .select('user_id')
  .eq('id', galleryData.client_id)
  .single()

if (clientRecord?.user_id === user.id && !galleryData.total_amount) {
  console.log('[Gallery] Gallery assigned to client with no pricing - free access')
  setHasAccess(true)
  setCheckingAccess(false)
  return
}
```

**OR** (better - fetch client info in initial query):
```typescript
// In fetchGallery function, update the select:
const { data: galleryData } = await supabase
  .from('photo_galleries')
  .select(`
    *,
    clients (
      user_id
    )
  `)
  .eq('id', galleryId)
  .single()

// Then in checkAccess:
const clientData = Array.isArray(galleryData.clients)
  ? galleryData.clients[0]
  : galleryData.clients

if (clientData?.user_id === user.id && !galleryData.total_amount) {
  // ... grant access
}
```

#### 2.3: Review Other Files

**Systematic approach:**
1. Search each file for `client_id` comparisons with `user.id` or `auth.uid()`
2. If found, determine if it's:
   - ❌ WRONG: Comparing `client_id` directly with `user.id`
   - ✅ OK: Using `client_id` to fetch data (not access control)
   - ✅ OK: Joining through `clients.user_id` correctly
3. Fix any WRONG cases using Pattern 1 or Pattern 3 above

### Step 3: Update RLS Policies (If Needed)

**Check current policies:**
```sql
-- In Supabase SQL Editor:
SELECT schemaname, tablename, policyname, permissive, qual
FROM pg_policies
WHERE tablename = 'photo_galleries';
```

**If any policies compare `client_id = auth.uid()`, replace with:**
```sql
DROP POLICY IF EXISTS "bad_policy_name" ON photo_galleries;

CREATE POLICY "Clients can view their galleries"
  ON photo_galleries FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );
```

### Step 4: Test Access Control

**Test Cases:**

1. **Client with photographer-created gallery:**
   - Photographer creates gallery → assigns to client record
   - Client signs up → `clients.user_id` gets populated
   - Client logs in → should see gallery

2. **Client with self-uploaded gallery:**
   - Client creates gallery directly → `photographer_id = NULL`, `user_id = auth.uid()`
   - Client logs in → should see gallery

3. **Secondary user:**
   - Primary user has gallery access
   - Secondary user logs in → should see primary's galleries

4. **Photographer viewing client gallery:**
   - Photographer should see ALL galleries where `photographer_id = their id`

5. **Admin:**
   - Should see ALL galleries (service role or admin policy)

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `src/lib/access-control.ts` | **None** - Keep existing UserType definition | ✅ KEEP |
| `src/contexts/AuthContext.tsx` | 1. Import UserType<br>2. Remove local UserType definition<br>3. Fix signUp signature | 🔴 HIGH |
| `src/types/analytics.ts` | Import UserType, use for viewer_type | 🟡 MEDIUM |
| `src/components/MessagingPanel.tsx` | Fix userType state typing | 🟡 MEDIUM |
| `src/app/gallery/[galleryId]/page.tsx` | Fix checkAccess client_id comparison | 🔴 HIGH |
| `src/app/api/photos/[id]/favorite/route.ts` | **None** - Already correct | ✅ DONE |
| `src/app/api/stripe/gallery-checkout/route.ts` | Audit client_id usage | 🟡 MEDIUM |
| `src/app/api/stripe/public-checkout/route.ts` | Audit client_id usage | 🟡 MEDIUM |
| `src/app/api/family/shared-galleries/route.ts` | Audit client_id usage | 🟡 MEDIUM |
| `src/app/api/galleries/[id]/sharing/route.ts` | Audit client_id usage | 🟡 MEDIUM |

---

## SQL Migrations

**If RLS policies need fixing:**

**Migration:** `database/fix-photo-galleries-client-access.sql`

```sql
-- Fix client access policies to use correct FK chain
-- Date: 2025-12-14
-- Author: Supabase Expert

-- Drop incorrect policies that compare client_id directly with auth.uid()
DROP POLICY IF EXISTS "Clients can view galleries by client_id" ON photo_galleries;
DROP POLICY IF EXISTS "Clients can update galleries by client_id" ON photo_galleries;

-- Recreate with correct FK chain: photo_galleries.client_id → clients.id → clients.user_id = auth.uid()

-- Clients can view galleries assigned to them (via client_id)
CREATE POLICY "Clients can view assigned galleries"
  ON photo_galleries FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Clients can view self-uploaded galleries (no photographer)
CREATE POLICY "Clients can view self-uploaded galleries"
  ON photo_galleries FOR SELECT
  USING (
    photographer_id IS NULL
    AND user_id = auth.uid()
  );

-- Photographers can view their galleries
CREATE POLICY "Photographers can view own galleries"
  ON photo_galleries FOR SELECT
  USING (photographer_id = auth.uid());

-- Admins can view all galleries
CREATE POLICY "Admins can view all galleries"
  ON photo_galleries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );
```

---

## Testing Steps

### 1. TypeScript Compilation
```bash
npx tsc --noEmit
```
**Expected:** No errors (especially the `UserType` error should be gone)

### 2. Test Client Access (via Supabase Dashboard)

**Setup:**
```sql
-- Get test user IDs
SELECT id, email FROM auth.users WHERE email = 'testclient@example.com';
-- Note the user_id

SELECT id, user_id FROM clients WHERE email = 'testclient@example.com';
-- Note the client_id and user_id (should match auth user)

SELECT id, client_id, photographer_id FROM photo_galleries WHERE client_id = '[client_id_from_above]';
-- Note gallery_id
```

**Test Query (as client):**
```sql
-- Simulate client auth
SELECT set_config('request.jwt.claims', '{"sub": "[user_id_here]"}', true);
SET ROLE authenticated;

-- This should WORK (client sees their gallery):
SELECT * FROM photo_galleries
WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid());

-- Reset
RESET ROLE;
```

### 3. Test via API

**Favorite Toggle:**
```bash
# As authenticated client:
curl -X POST http://localhost:3002/api/photos/[photo_id]/favorite \
  -H "Authorization: Bearer [client_jwt]"

# Should return: { "success": true, "is_favorite": true }
```

**Gallery Access:**
```bash
# Visit gallery page as client
http://localhost:3002/gallery/[gallery_id]

# Should see photos, not paywall (if client owns the gallery)
```

### 4. Regression Tests

**Ensure these still work:**
- ✅ Photographer viewing their own galleries
- ✅ Admin viewing all galleries
- ✅ Self-uploaded galleries (no photographer)
- ✅ Secondary users viewing primary's galleries
- ✅ Public galleries (unauthenticated access)

---

## Performance Considerations

### Potential Issue: Nested Queries in RLS

**Current pattern:**
```sql
client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
```

**Performance:** This is efficient because:
- `auth.uid()` is evaluated once per request
- Postgres can optimize the subquery
- Indexes exist on `clients(user_id)` and `photo_galleries(client_id)`

**Verify indexes exist:**
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('clients', 'photo_galleries');

-- Should see:
-- idx_clients_user_id on clients(user_id)
-- idx_photo_galleries_client on photo_galleries(client_id)
```

**If missing, add:**
```sql
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_galleries_client ON photo_galleries(client_id);
```

---

## Gotchas & Warnings

### 1. Supabase Join Return Types

**⚠️ CRITICAL:** Supabase joins can return EITHER an object OR an array:
```typescript
// Sometimes:
gallery.clients = { id: '...', user_id: '...' }

// Sometimes:
gallery.clients = [{ id: '...', user_id: '...' }]
```

**Always handle both:**
```typescript
const clientData = Array.isArray(gallery.clients)
  ? gallery.clients[0]
  : gallery.clients
const clientUserId = clientData?.user_id ?? null
```

### 2. NULL vs Undefined in FK Checks

**When checking if a gallery is self-uploaded:**
```typescript
// ❌ WRONG - might be undefined instead of null
if (gallery.photographer_id === null) { ... }

// ✅ CORRECT - handles both null and undefined
if (!gallery.photographer_id) { ... }
```

### 3. UserType 'secondary' in Signup

**Current restriction:** `signUp` function doesn't allow 'secondary' userType

**This is INTENTIONAL** - secondary users are created via family invitation flow, not direct signup.

**If needed in future:**
```typescript
const signUp = async (
  email: string,
  password: string,
  userType: Exclude<UserType, null | 'secondary'>,  // Exclude both null AND secondary
  fullName?: string
) => { ... }
```

### 4. Client Record Creation Timing

**Workflow:**
1. Photographer creates `clients` record (email only, no user_id)
2. Client pays and signs up
3. Webhook OR trigger links `clients.user_id` to new user
4. NOW client can access galleries

**Gap:** Between step 1 and step 4, `clients.user_id` is NULL
- RLS policies that check `clients.user_id = auth.uid()` will fail
- Client cannot access gallery until user_id is linked
- This is CORRECT behavior (security by default)

### 5. Admin Access

**Current admin RLS:**
```sql
EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = auth.uid()
  AND user_profiles.user_type = 'admin'
)
```

**This is OK** - admins stored in user_profiles with user_type = 'admin'

**Alternative** (if needed):
```sql
-- Hardcode admin email
auth.jwt()->>'email' = 'nathaniel.crowell12@gmail.com'
```

---

## Root Cause Analysis

### Why This Bug Happened

**Underlying Issue:** Confusion between ID spaces
- `clients.id` = Internal database ID for client records
- `auth.users.id` = Supabase Auth user ID
- These are COMPLETELY DIFFERENT UUID spaces

**Contributing Factors:**
1. **Implicit FK relationships** - Schema doesn't enforce that `client_id` points to `clients`
2. **Multiple ID columns** - `client_id`, `user_id`, `photographer_id` all look similar
3. **Evolution of schema** - `clients.user_id` was added AFTER initial schema
4. **Lack of documentation** - FK chain not clearly documented

**Similar bugs likely exist wherever:**
- `client_id` is compared directly with `user.id` or `auth.uid()`
- Code assumes `client_id` is a user ID

---

## Preventative Measures

### 1. Add Schema Comments

```sql
COMMENT ON COLUMN photo_galleries.client_id IS 'FK to clients.id (NOT auth.users.id). Use clients.user_id to link to auth user.';
COMMENT ON COLUMN clients.user_id IS 'FK to auth.users.id. Links client record to user account after signup.';
```

### 2. Create Helper Function

**File:** `src/lib/access-control.ts`

```typescript
/**
 * Check if user has access to a gallery via client_id
 *
 * IMPORTANT: client_id is a FK to clients.id, NOT auth.users.id
 * Must join through clients.user_id to check ownership
 */
export async function checkClientGalleryAccess(
  galleryId: string,
  userId: string
): Promise<boolean> {
  const supabase = createServerClient()

  const { data: gallery } = await supabase
    .from('photo_galleries')
    .select(`
      id,
      client_id,
      clients!inner (
        user_id
      )
    `)
    .eq('id', galleryId)
    .single()

  if (!gallery) return false

  const clientData = Array.isArray(gallery.clients)
    ? gallery.clients[0]
    : gallery.clients

  return clientData?.user_id === userId
}
```

### 3. Naming Convention

**Future schema changes:**
- Columns that reference `clients.id` should be named `client_record_id`
- Columns that reference `auth.users.id` should be named `user_id`
- This makes the relationship chain explicit

---

## Summary of Fixes

**TypeScript Errors (5 files):**
1. ✅ `src/contexts/AuthContext.tsx` - Import UserType, fix signUp signature
2. ✅ `src/types/analytics.ts` - Import UserType for viewer_type
3. ✅ `src/components/MessagingPanel.tsx` - Fix userType state typing
4. ✅ `src/lib/access-control.ts` - KEEP existing (source of truth)
5. ✅ Other files - Will automatically resolve once AuthContext is fixed

**Access Control Bugs (2 files):**
1. ✅ `src/app/api/photos/[id]/favorite/route.ts` - ALREADY CORRECT
2. ⚠️ `src/app/gallery/[galleryId]/page.tsx` - FIX client_id comparison (line 206-211)

**Potential Issues (4 files):**
1. ⚠️ `src/app/api/stripe/gallery-checkout/route.ts` - AUDIT
2. ⚠️ `src/app/api/stripe/public-checkout/route.ts` - AUDIT
3. ⚠️ `src/app/api/family/shared-galleries/route.ts` - AUDIT
4. ⚠️ `src/app/api/galleries/[id]/sharing/route.ts` - AUDIT

**Total Files to Modify:** 8
**Critical Fixes:** 3 (AuthContext, analytics, gallery page)
**Audits Needed:** 4

---

## Next Session Checklist

- [ ] Fix TypeScript errors (Step 1)
- [ ] Fix gallery page client_id check (Step 2.2)
- [ ] Audit 4 medium-priority files (Step 2.3)
- [ ] Test TypeScript compilation
- [ ] Test client access via API
- [ ] Test favorite toggle
- [ ] Update RLS policies if needed (Step 3)
- [ ] Run full regression test suite

---

*Plan created by Supabase Expert*
*Date: 2025-12-14*
*Session: Build is BROKEN - Favorite Bug Fix Gone Wrong*
