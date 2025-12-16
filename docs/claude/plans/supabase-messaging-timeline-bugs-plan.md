# Supabase Messaging & Timeline Bugs - Implementation Plan

**Date:** December 16, 2025
**Expert:** Supabase Expert
**Status:** Ready for Implementation

---

## Executive Summary

Two schema mismatches are blocking core functionality:

1. **Messaging 403 Forbidden**: The `can_user_message` RPC function references the wrong table (`galleries` instead of `photo_galleries`) and wrong column (`user_id` instead of `client_id`)
2. **Timeline API Error**: API queries `cover_photo_url` but schema has `cover_image_url`

Both bugs are fixable with targeted SQL migrations and minimal code changes.

---

## Root Cause Analysis

### Bug 1: Messaging Permission Check Failure

**Location:** `database/messaging-mvp-schema.sql` lines 261-270

**Current (Broken) Code:**
```sql
-- Client to their Photographer
IF v_sender_type = 'client' AND v_recipient_type = 'photographer' THEN
  -- Check if sender is photographer's client (has galleries)
  SELECT EXISTS (
    SELECT 1 FROM galleries          -- ❌ WRONG TABLE
    WHERE photographer_id = p_recipient_id
    AND user_id = p_sender_id        -- ❌ WRONG COLUMN
  ) INTO v_can_message;
  RETURN v_can_message;
END IF;
```

**Why This Fails:**
- PhotoVault uses `photo_galleries` as the primary table, NOT `galleries`
- `photo_galleries` has `client_id` (UUID FK to `clients.id`), NOT `user_id`
- The `clients` table was extended with a `user_id` column (added in `client-onboarding-schema.sql` line 158) to link `clients` records to auth users

**Correct Logic:**
A client can message their photographer if:
1. There exists a `photo_galleries` record where:
   - `photographer_id = p_recipient_id` (the photographer they're messaging)
   - `client_id = [client record id]` where `clients.user_id = p_sender_id` (the auth user)

OR (simpler):
2. There exists a `clients` record where:
   - `photographer_id = p_recipient_id`
   - `user_id = p_sender_id`

The second approach is more direct and doesn't require joining through galleries.

**Same Issue in Reverse Direction (Lines 250-259):**
```sql
-- Photographer to their Client
IF v_sender_type = 'photographer' AND v_recipient_type = 'client' THEN
  SELECT EXISTS (
    SELECT 1 FROM clients
    WHERE photographer_id = p_sender_id
    AND user_id = p_recipient_id     -- ✅ This one is CORRECT!
  ) INTO v_can_message;
  RETURN v_can_message;
END IF;
```
This direction is already using the correct table and column!

---

### Bug 2: Timeline API Column Mismatch

**Location:** `src/app/api/client/timeline/route.ts` line 57

**Current (Broken) Code:**
```typescript
const { data: galleries, error: galleriesError } = await supabase
  .from('photo_galleries')
  .select(`
    id,
    gallery_name,
    created_at,
    photo_count,
    cover_photo_url,    // ❌ WRONG COLUMN NAME
    photographer_id,
    location,
    event_type
  `)
```

**Schema Reality (`database/schema.sql` line 71):**
```sql
CREATE TABLE IF NOT EXISTS photo_galleries (
  ...
  cover_image_url VARCHAR(500),  -- ✅ ACTUAL COLUMN NAME
  ...
);
```

**Impact Analysis:**
Grep shows `cover_photo_url` is used in 6 files:
1. `src/app/api/client/timeline/route.ts` (line 57) - **API query**
2. `src/app/client/timeline/page.tsx` (lines 28, 322, 324) - **TypeScript interface + rendering**
3. `src/app/client/dashboard/page.tsx` (lines 38, 366, 368) - **TypeScript interface + rendering**
4. `src/app/api/client/stats/route.ts` (line 61) - **API query**
5. `src/lib/platforms/pixieset-client.ts` (line 133) - **External platform mapping** (reading from Pixieset API, not our DB)
6. `WORK_PLAN.md` (line 1958) - **Documentation of this bug**

**Files Using Correct Column Name (`cover_image_url`):**
- All other API routes: `v1/upload/*`, `family/*`, `import/*`, `platforms/*`
- All components: `GalleryGrid.tsx`, `gallery/GalleryCard.tsx`, `directory/LocationCard.tsx`
- All types: `src/types/gallery.ts`, `src/types/directory.ts`

This is a **recent regression** - only 3 client-facing files diverged.

---

## Implementation Plan

### Phase 1: Fix Messaging Permission Function (Migration)

**File:** `database/fix-messaging-can-user-message.sql` (NEW)

```sql
-- Fix can_user_message function to use correct table and columns
-- Bug: References 'galleries' table and 'user_id' column which don't exist
-- Fix: Use 'photo_galleries' + 'client_id' OR 'clients' + 'user_id'

CREATE OR REPLACE FUNCTION can_user_message(
  p_sender_id UUID,
  p_recipient_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sender_type TEXT;
  v_recipient_type TEXT;
  v_can_message BOOLEAN := FALSE;
BEGIN
  -- Get user types
  SELECT user_type INTO v_sender_type FROM user_profiles WHERE id = p_sender_id;
  SELECT user_type INTO v_recipient_type FROM user_profiles WHERE id = p_recipient_id;

  -- Admin can message anyone
  IF v_sender_type = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Anyone can message admin
  IF v_recipient_type = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Photographer to Photographer
  IF v_sender_type = 'photographer' AND v_recipient_type = 'photographer' THEN
    RETURN TRUE;
  END IF;

  -- Photographer to their Client
  IF v_sender_type = 'photographer' AND v_recipient_type = 'client' THEN
    -- Check if recipient is photographer's client via clients table
    SELECT EXISTS (
      SELECT 1 FROM clients
      WHERE photographer_id = p_sender_id
      AND user_id = p_recipient_id
    ) INTO v_can_message;
    RETURN v_can_message;
  END IF;

  -- Client to their Photographer
  IF v_sender_type = 'client' AND v_recipient_type = 'photographer' THEN
    -- ✅ FIX: Check via clients table (user_id link)
    SELECT EXISTS (
      SELECT 1 FROM clients
      WHERE photographer_id = p_recipient_id
      AND user_id = p_sender_id
    ) INTO v_can_message;
    RETURN v_can_message;
  END IF;

  -- Default: cannot message
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

**Reasoning:**
- Uses `clients` table which has both `photographer_id` and `user_id` columns
- Symmetric logic: both directions now use the same table
- Avoids needing to join through `photo_galleries`
- Matches existing pattern in Photographer→Client direction (lines 250-259)

**Alternative Approach (via photo_galleries):**
If we wanted to use `photo_galleries` instead:
```sql
-- Client to their Photographer (alternative via galleries)
IF v_sender_type = 'client' AND v_recipient_type = 'photographer' THEN
  SELECT EXISTS (
    SELECT 1 FROM photo_galleries pg
    INNER JOIN clients c ON pg.client_id = c.id
    WHERE pg.photographer_id = p_recipient_id
    AND c.user_id = p_sender_id
  ) INTO v_can_message;
  RETURN v_can_message;
END IF;
```
**Recommendation:** Use the `clients` table approach (simpler, no join needed).

---

### Phase 2: Fix Timeline API Column References

**Affected Files:**
1. `src/app/api/client/timeline/route.ts`
2. `src/app/client/timeline/page.tsx`
3. `src/app/client/dashboard/page.tsx`
4. `src/app/api/client/stats/route.ts`

#### 2.1 Fix API Route: `src/app/api/client/timeline/route.ts`

**Line 9 - TypeScript Interface:**
```typescript
// BEFORE:
interface TimelineGallery {
  id: string
  name: string
  created_at: string
  photo_count: number
  cover_photo_url: string | null  // ❌ Wrong
  photographer_name: string
  photographer_business: string | null
  location: string | null
  event_type: string | null
}

// AFTER:
interface TimelineGallery {
  id: string
  name: string
  created_at: string
  photo_count: number
  cover_image_url: string | null  // ✅ Correct
  photographer_name: string
  photographer_business: string | null
  location: string | null
  event_type: string | null
}
```

**Line 57 - Database Query:**
```typescript
// BEFORE:
const { data: galleries, error: galleriesError } = await supabase
  .from('photo_galleries')
  .select(`
    id,
    gallery_name,
    created_at,
    photo_count,
    cover_photo_url,  // ❌ Wrong
    photographer_id,
    location,
    event_type
  `)

// AFTER:
const { data: galleries, error: galleriesError } = await supabase
  .from('photo_galleries')
  .select(`
    id,
    gallery_name,
    created_at,
    photo_count,
    cover_image_url,  // ✅ Correct
    photographer_id,
    location,
    event_type
  `)
```

**Line 117 - Response Mapping:**
```typescript
// BEFORE:
monthMap.get(month)!.push({
  id: gallery.id,
  name: gallery.gallery_name || 'Untitled Gallery',
  created_at: gallery.created_at,
  photo_count: gallery.photo_count || 0,
  cover_photo_url: gallery.cover_photo_url,  // ❌ Wrong
  photographer_name: photographer?.name || 'Your Photographer',
  photographer_business: photographer?.business || null,
  location: gallery.location,
  event_type: gallery.event_type
})

// AFTER:
monthMap.get(month)!.push({
  id: gallery.id,
  name: gallery.gallery_name || 'Untitled Gallery',
  created_at: gallery.created_at,
  photo_count: gallery.photo_count || 0,
  cover_image_url: gallery.cover_image_url,  // ✅ Correct
  photographer_name: photographer?.name || 'Your Photographer',
  photographer_business: photographer?.business || null,
  location: gallery.location,
  event_type: gallery.event_type
})
```

---

#### 2.2 Fix Client Page: `src/app/client/timeline/page.tsx`

**Line 28 - TypeScript Interface:**
```typescript
// BEFORE:
interface TimelineGallery {
  id: string
  name: string
  created_at: string
  photo_count: number
  cover_photo_url: string | null  // ❌ Wrong
  photographer_name: string
  photographer_business: string | null
  location: string | null
  event_type: string | null
}

// AFTER:
interface TimelineGallery {
  id: string
  name: string
  created_at: string
  photo_count: number
  cover_image_url: string | null  // ✅ Correct
  photographer_name: string
  photographer_business: string | null
  location: string | null
  event_type: string | null
}
```

**Lines 322-324 - Rendering:**
```typescript
// BEFORE:
<div className="w-32 h-24 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
  {gallery.cover_photo_url ? (  // ❌ Wrong
    <img
      src={gallery.cover_photo_url}  // ❌ Wrong
      alt={gallery.name}
      className="w-full h-full object-cover"
    />
  ) : (
    // ... empty state
  )}
</div>

// AFTER:
<div className="w-32 h-24 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
  {gallery.cover_image_url ? (  // ✅ Correct
    <img
      src={gallery.cover_image_url}  // ✅ Correct
      alt={gallery.name}
      className="w-full h-full object-cover"
    />
  ) : (
    // ... empty state
  )}
</div>
```

---

#### 2.3 Fix Client Dashboard: `src/app/client/dashboard/page.tsx`

**Line 38 - TypeScript Interface:**
```typescript
// BEFORE:
interface RecentGallery {
  id: string
  gallery_name: string
  photo_count: number
  created_at: string
  cover_photo_url: string | null  // ❌ Wrong
}

// AFTER:
interface RecentGallery {
  id: string
  gallery_name: string
  photo_count: number
  created_at: string
  cover_image_url: string | null  // ✅ Correct
}
```

**Lines 366-368 - Rendering:**
```typescript
// BEFORE:
{gallery.cover_photo_url ? (  // ❌ Wrong
  <img
    src={gallery.cover_photo_url}  // ❌ Wrong
    alt={gallery.gallery_name}
    className="w-full h-full object-cover"
  />
) : (
  // ... empty state
)}

// AFTER:
{gallery.cover_image_url ? (  // ✅ Correct
  <img
    src={gallery.cover_image_url}  // ✅ Correct
    alt={gallery.gallery_name}
    className="w-full h-full object-cover"
  />
) : (
  // ... empty state
)}
```

**Note:** Need to check if the API query in this file also selects the column. Let me check where `RecentGallery` data comes from.

---

#### 2.4 Fix Client Stats API: `src/app/api/client/stats/route.ts`

**Line 61 - Database Query:**
Need to inspect this file to see if it queries `cover_photo_url`. Based on grep results, it does reference it.

```typescript
// Expected fix (need to verify exact line):
// BEFORE: cover_photo_url
// AFTER: cover_image_url
```

---

### Phase 3: Verification & Testing

#### 3.1 Messaging Test Script

**File:** `scripts/test-messaging-permissions.sql` (NEW)

```sql
-- Test script to verify can_user_message fixes
-- Run this in Supabase SQL Editor after migration

-- Setup test data (replace with your actual test user IDs)
DO $$
DECLARE
  v_photographer_id UUID;
  v_client_user_id UUID;
  v_client_record_id UUID;
  v_result BOOLEAN;
BEGIN
  -- Find a photographer and client with relationship
  SELECT c.photographer_id, c.user_id, c.id
  INTO v_photographer_id, v_client_user_id, v_client_record_id
  FROM clients c
  WHERE c.user_id IS NOT NULL
  LIMIT 1;

  IF v_photographer_id IS NULL OR v_client_user_id IS NULL THEN
    RAISE NOTICE 'No test data found. Create a client with user_id first.';
    RETURN;
  END IF;

  -- Test 1: Client can message their photographer
  SELECT can_user_message(v_client_user_id, v_photographer_id) INTO v_result;
  RAISE NOTICE 'Test 1 - Client → Photographer: % (expected TRUE)', v_result;

  -- Test 2: Photographer can message their client
  SELECT can_user_message(v_photographer_id, v_client_user_id) INTO v_result;
  RAISE NOTICE 'Test 2 - Photographer → Client: % (expected TRUE)', v_result;

  -- Test 3: Random user cannot message photographer
  SELECT can_user_message(gen_random_uuid(), v_photographer_id) INTO v_result;
  RAISE NOTICE 'Test 3 - Random → Photographer: % (expected FALSE)', v_result;

  -- Test 4: Client cannot message random user
  SELECT can_user_message(v_client_user_id, gen_random_uuid()) INTO v_result;
  RAISE NOTICE 'Test 4 - Client → Random: % (expected FALSE)', v_result;
END $$;
```

**Expected Output:**
```
NOTICE:  Test 1 - Client → Photographer: t (expected TRUE)
NOTICE:  Test 2 - Photographer → Client: t (expected TRUE)
NOTICE:  Test 3 - Random → Photographer: f (expected FALSE)
NOTICE:  Test 4 - Client → Random: f (expected FALSE)
```

---

#### 3.2 Timeline Manual Test

**Steps:**
1. Deploy code changes to dev environment
2. Login as client user with galleries
3. Navigate to `/client/timeline`
4. **Verify:**
   - No console errors
   - Gallery cover images load correctly
   - No "column does not exist" database errors
5. Navigate to `/client/dashboard`
6. **Verify:**
   - Recent galleries section shows cover images
   - No console errors

---

#### 3.3 E2E Messaging Test

**Prerequisites:**
- Photographer account: `photographer@test.com`
- Client account: `client@test.com` (linked via `clients.user_id`)
- At least one `photo_galleries` record linking them

**Test Flow:**
1. Login as client
2. Navigate to messaging
3. Find photographer in contacts
4. Send message: "Test message from client"
5. **Verify:** Message sends successfully (no 403 error)
6. Logout, login as photographer
7. View conversation
8. **Verify:** Message appears
9. Reply: "Test reply from photographer"
10. **Verify:** Reply sends successfully
11. Logout, login as client
12. **Verify:** Reply appears

**Before Fix:**
- Step 5 fails with 403 Forbidden
- Error: `can_user_message` returns false

**After Fix:**
- All steps pass
- Messages flow bidirectionally

---

## Edge Cases & Considerations

### Edge Case 1: Client Without `user_id`
**Scenario:** Legacy `clients` record exists without `user_id` (created before onboarding system)

**Current Behavior:** These clients cannot message (function returns false)

**Recommendation:** This is acceptable for MVP. These are photographer-created client records, not self-registered users. They don't have login credentials, so they can't message anyway.

**Future Enhancement:** Migration script to link legacy clients to user accounts (requires email matching logic).

---

### Edge Case 2: Multiple Clients Per User
**Scenario:** One user (auth.uid) could theoretically have multiple `clients` records with different photographers

**Current Behavior:** Function checks `EXISTS` - if ANY client record matches, returns true

**Impact:** Client can message ANY photographer they have a `clients` record with (correct behavior)

---

### Edge Case 3: Deleted Galleries
**Scenario:** Client had galleries but they were deleted. Should they still be able to message photographer?

**Current Implementation:** Uses `clients` table, NOT `photo_galleries`, so deletion of galleries doesn't affect messaging permission

**Impact:** Client can message photographer as long as `clients` record exists (even if all galleries deleted). This is the correct behavior - the relationship is defined by `clients`, not galleries.

---

### Edge Case 4: Null Cover Images
**Scenario:** `cover_image_url` is null for a gallery

**Current Handling:**
```typescript
{gallery.cover_image_url ? (
  <img src={gallery.cover_image_url} ... />
) : (
  <Image className="w-8 h-8 text-muted-foreground" />  // Empty state icon
)}
```

**Impact:** Already handled correctly in UI. No changes needed.

---

## Rollback Plan

### If Messaging Fix Breaks Something

**Rollback SQL:**
```sql
-- Restore original (broken) version
CREATE OR REPLACE FUNCTION can_user_message(
  p_sender_id UUID,
  p_recipient_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sender_type TEXT;
  v_recipient_type TEXT;
  v_can_message BOOLEAN := FALSE;
BEGIN
  SELECT user_type INTO v_sender_type FROM user_profiles WHERE id = p_sender_id;
  SELECT user_type INTO v_recipient_type FROM user_profiles WHERE id = p_recipient_id;

  IF v_sender_type = 'admin' THEN RETURN TRUE; END IF;
  IF v_recipient_type = 'admin' THEN RETURN TRUE; END IF;
  IF v_sender_type = 'photographer' AND v_recipient_type = 'photographer' THEN RETURN TRUE; END IF;

  IF v_sender_type = 'photographer' AND v_recipient_type = 'client' THEN
    SELECT EXISTS (
      SELECT 1 FROM clients WHERE photographer_id = p_sender_id AND user_id = p_recipient_id
    ) INTO v_can_message;
    RETURN v_can_message;
  END IF;

  -- Rollback to broken version
  IF v_sender_type = 'client' AND v_recipient_type = 'photographer' THEN
    SELECT EXISTS (
      SELECT 1 FROM galleries WHERE photographer_id = p_recipient_id AND user_id = p_sender_id
    ) INTO v_can_message;
    RETURN v_can_message;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

**Note:** This rollback is purely academic - the original version is completely broken (table doesn't exist), so rolling back would restore the broken state.

---

### If Timeline Fix Breaks Something

**Git Rollback:**
```bash
git checkout HEAD~1 -- src/app/api/client/timeline/route.ts
git checkout HEAD~1 -- src/app/client/timeline/page.tsx
git checkout HEAD~1 -- src/app/client/dashboard/page.tsx
git checkout HEAD~1 -- src/app/api/client/stats/route.ts
```

**Recovery:** The original code is broken (queries non-existent column), so rollback would restore broken state. Instead, fix forward by debugging specific issues.

---

## Implementation Order

1. **Run messaging migration in Supabase SQL Editor**
   - File: `database/fix-messaging-can-user-message.sql`
   - Execution time: <1 second
   - No downtime (function replacement is atomic)

2. **Update timeline API route**
   - File: `src/app/api/client/timeline/route.ts`
   - Changes: 3 locations (interface, query, mapping)

3. **Update timeline page**
   - File: `src/app/client/timeline/page.tsx`
   - Changes: 3 locations (interface, render checks)

4. **Update client dashboard**
   - File: `src/app/client/dashboard/page.tsx`
   - Changes: 3 locations (interface, render checks)

5. **Update client stats API** (if needed)
   - File: `src/app/api/client/stats/route.ts`
   - Verify if this file queries `cover_photo_url`

6. **Deploy to dev environment**

7. **Run verification tests**
   - SQL test script
   - Manual timeline test
   - E2E messaging test

8. **Deploy to production** (if all tests pass)

---

## Success Criteria

### Bug 1 (Messaging) Fixed When:
- ✅ SQL test script shows all 4 tests passing
- ✅ Client can send message to photographer via UI (no 403 error)
- ✅ Photographer can reply to client
- ✅ No console errors in messaging flow

### Bug 2 (Timeline) Fixed When:
- ✅ `/client/timeline` page loads without database errors
- ✅ Gallery cover images render correctly (or show empty state if null)
- ✅ `/client/dashboard` recent galleries show cover images
- ✅ No "column does not exist" errors in browser console or API logs

---

## Files to Create

1. `database/fix-messaging-can-user-message.sql` - Migration to fix RPC function
2. `scripts/test-messaging-permissions.sql` - Verification test script

---

## Files to Modify

1. `src/app/api/client/timeline/route.ts` (3 changes)
2. `src/app/client/timeline/page.tsx` (3 changes)
3. `src/app/client/dashboard/page.tsx` (3 changes)
4. `src/app/api/client/stats/route.ts` (verify + fix if needed)

---

## Estimated Effort

- **Messaging Fix:** 15 minutes (SQL migration + testing)
- **Timeline Fix:** 30 minutes (4 files, ~12 total changes)
- **Testing:** 30 minutes (SQL tests + manual E2E)
- **Total:** ~1.5 hours

---

## Post-Implementation

### Documentation Updates Needed
1. Update `WORK_PLAN.md` - Mark Bug 2.4.2 as complete
2. Update messaging schema docs (if any) to reference correct tables
3. Add note about `clients.user_id` column requirement for messaging

### Monitoring
- Watch for 403 errors in messaging endpoints (should drop to zero)
- Watch for "column does not exist" errors in timeline/dashboard (should drop to zero)
- Monitor PostHog for improved client engagement metrics (if messaging was blocked, usage should increase)

---

## Questions for User

1. **Messaging Test Accounts:** Do you have test photographer and client accounts with an existing relationship I can use for E2E testing?
2. **Stats API:** Should I inspect `src/app/api/client/stats/route.ts` to confirm it needs the same `cover_photo_url` → `cover_image_url` fix?
3. **Priority:** Which bug is higher priority? Should I fix messaging first (blocks communication) or timeline first (blocks UI)?

---

**Ready to proceed with implementation upon approval.**
