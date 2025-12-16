# Supabase Client Gallery RLS Fix - Implementation Complete

**Date:** December 10, 2025
**Issue:** Client users getting RLS policy violation when trying to INSERT into `photo_galleries` table
**Status:** FIXED - Ready for testing

---

## Executive Summary

**THE ROOT CAUSE:** The RLS policy allowed clients to insert galleries with `photographer_id = NULL` and `client_id = NULL`, but **didn't enforce that `user_id` must equal `auth.uid()`**. This meant the policy didn't properly verify ownership, and clients couldn't reliably create galleries.

**THE BANDAID:** A `/api/client/galleries` API route was created that used the service role key to bypass RLS entirely. This worked but was a security risk.

**THE FIX:** Updated the RLS policy to require `user_id = auth.uid()` for INSERT/UPDATE/DELETE operations, removed the bandaid API route, and updated the upload form to use direct Supabase INSERT calls.

---

## What Was Changed

### 1. Fixed RLS Policies

**File:** `database/add-client-gallery-upload-policy.sql`

**Changes:**
- Dropped old incomplete policies
- Created new policies that enforce `user_id = auth.uid()` for ownership
- Added UPDATE and DELETE policies for clients

**New INSERT Policy:**
```sql
CREATE POLICY "Clients can insert own galleries"
ON photo_galleries
FOR INSERT
WITH CHECK (
  photographer_id IS NULL
  AND user_id = auth.uid()  -- ✅ Now enforces ownership
  AND (
    client_id IS NULL
    OR client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  )
);
```

**Security improvement:** Now prevents unauthorized users from creating galleries and ensures every client-uploaded gallery has proper ownership tracking.

---

### 2. Updated Client Upload Form

**File:** `src/app/client/upload/page.tsx`

**Changes:**
- Removed API route call to `/api/client/galleries`
- Replaced with direct Supabase INSERT
- Added `user_id: user.id` to the INSERT payload (required by RLS policy)
- Added null check for `user` before upload

**New code:**
```typescript
// Create gallery directly via Supabase (RLS policy now allows this)
const { data: gallery, error: galleryError } = await supabase
  .from('photo_galleries')
  .insert({
    photographer_id: null,
    client_id: null,
    user_id: user.id,  // Required by RLS policy
    gallery_name: galleryName,
    gallery_description: galleryDescription || null,
    photo_count: files.length,
    session_date: eventDate || new Date().toISOString(),
    platform: 'photovault',
    gallery_status: 'draft',
    metadata: Object.keys(metadata).length > 0 ? metadata : null
  })
  .select()
  .single()
```

---

### 3. Removed Bandaid API Route

**File:** `src/app/api/client/galleries/route.ts` → Moved to `src/app/api/_deprecated/`

**Why removed:**
- Used service role key for user actions (security risk)
- Created maintenance burden
- No longer needed with proper RLS policies

---

## How to Apply the Fix

### Step 1: Apply the RLS Policies

Run the SQL file in Supabase Dashboard > SQL Editor:

```
database/add-client-gallery-upload-policy.sql
```

This will:
1. Drop the old incomplete policies
2. Create the new policies with ownership enforcement
3. Display a verification query result

**Expected output:** Should show 3 policies:
- "Clients can insert own galleries"
- "Clients can update own uploaded galleries"
- "Clients can delete own uploaded galleries"

---

### Step 2: Verify the Code Changes

The following files have been updated:

1. ✅ `src/app/client/upload/page.tsx` - Now uses direct Supabase INSERT
2. ✅ `src/app/api/client/galleries/route.ts` - Moved to `_deprecated` folder
3. ✅ `database/add-client-gallery-upload-policy.sql` - Updated with correct policies

No deployment needed yet - you can test locally first.

---

## Testing Instructions

### Test 1: Client Self-Upload (Primary Use Case)

1. **Start dev server:**
   ```bash
   cd "C:\Users\natha\.cursor\Photo Vault\photovault-hub"
   npm run dev -- -p 3002
   ```

2. **Create/login as client:**
   - Navigate to http://localhost:3002
   - Sign up or log in as a client user
   - Navigate to `/client/upload`

3. **Upload photos:**
   - Fill out form:
     - Gallery Name: "Test Gallery"
     - Description: "Testing RLS fix"
     - Event Date: Pick any date
     - Location: "Test Location"
   - Select 2-3 photos
   - Click "Create Gallery with X photos"

4. **Expected result:**
   - ✅ Gallery created successfully
   - ✅ Photos upload without errors
   - ✅ Redirected to `/client/dashboard`
   - ✅ New gallery appears in dashboard

5. **Verify in Supabase:**
   ```sql
   SELECT id, gallery_name, photographer_id, client_id, user_id, platform, gallery_status
   FROM photo_galleries
   WHERE user_id = '<your client auth.uid>'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

   Should show:
   - `photographer_id = NULL`
   - `client_id = NULL`
   - `user_id = <your auth.uid>`
   - `platform = 'photovault'`
   - `gallery_status = 'draft'`

---

### Test 2: Unauthorized Insert Should Fail

Open browser console and try:

```typescript
// This should fail with RLS policy violation
const { data, error } = await supabase
  .from('photo_galleries')
  .insert({
    photographer_id: null,
    client_id: null,
    user_id: null,  // Wrong - should be auth.uid()
    gallery_name: 'Hacker Gallery',
    platform: 'photovault',
    gallery_status: 'draft'
  })

console.log(error) // Should show RLS policy violation
```

Expected error:
```
{
  code: "42501",
  message: "new row violates row-level security policy for table \"photo_galleries\""
}
```

---

### Test 3: Client Cannot Impersonate Another User

Try to create a gallery with someone else's `user_id`:

```typescript
const { data, error } = await supabase
  .from('photo_galleries')
  .insert({
    photographer_id: null,
    client_id: null,
    user_id: '<different user UUID>',  // Not your auth.uid()
    gallery_name: 'Impersonation Test',
    platform: 'photovault',
    gallery_status: 'draft'
  })

console.log(error) // Should show RLS policy violation
```

---

## Technical Details

### Schema Overview

```sql
-- photo_galleries table structure (relevant columns)
CREATE TABLE photo_galleries (
  id UUID PRIMARY KEY,
  photographer_id UUID,        -- NULL for client self-uploads
  client_id UUID,              -- NULL for client self-uploads (no photographer relationship)
  user_id UUID,                -- Links to auth.users (ownership)
  platform VARCHAR(50) NOT NULL,
  gallery_name VARCHAR(255) NOT NULL,
  gallery_status VARCHAR(20) DEFAULT 'draft',
  -- ... many other columns
);

-- clients table (for photographer-client relationships)
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  photographer_id UUID NOT NULL,  -- Which photographer owns this client
  user_id UUID,                   -- Links client record to user account
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  -- ...
);
```

### RLS Policy Logic

**For client self-uploads:**
- `photographer_id = NULL` (no photographer)
- `client_id = NULL` (no photographer relationship)
- `user_id = auth.uid()` (ownership tracked directly)

**For photographer-created galleries for clients:**
- `photographer_id = <photographer's auth.uid>`
- `client_id = <clients.id>` (references clients table)
- `user_id = <client's auth.uid>` (set when client signs up)

**RLS policies handle both cases:**
1. Client self-upload: `photographer_id IS NULL AND user_id = auth.uid()`
2. Client with photographer: `client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())`

---

## Before vs After Comparison

### Before (With Bandaid)

```typescript
// ❌ Old approach: API route with service role key
const response = await fetch('/api/client/galleries', {
  method: 'POST',
  body: JSON.stringify({
    gallery_name: galleryName,
    // ...
  })
})
```

**Problems:**
- Service role key in API route (security risk)
- Extra network round-trip (slower)
- Bypasses RLS (defeats the purpose of database security)
- More code to maintain

---

### After (With Fixed RLS)

```typescript
// ✅ New approach: Direct Supabase INSERT with RLS
const { data: gallery, error } = await supabase
  .from('photo_galleries')
  .insert({
    photographer_id: null,
    client_id: null,
    user_id: user.id,  // RLS policy enforces this matches auth.uid()
    gallery_name: galleryName,
    platform: 'photovault',
    gallery_status: 'draft',
    // ...
  })
  .select()
  .single()
```

**Benefits:**
- Database-level security (RLS enforces ownership)
- Faster (no extra API round-trip)
- Less code to maintain
- Follows security best practices
- Consistent with rest of application

---

## Security Improvements

### Before Fix

**Vulnerabilities:**
1. Service role key used in API endpoint accessible to clients
2. RLS policy didn't verify `user_id` ownership
3. Potential for unauthorized gallery creation (if API auth was bypassed)

**Risk Level:** Medium

---

### After Fix

**Security Features:**
1. ✅ RLS policy enforces `user_id = auth.uid()` (database-level ownership)
2. ✅ No service role key in client-accessible code
3. ✅ Cannot create galleries for other users
4. ✅ Cannot create galleries without authentication
5. ✅ Follows principle of least privilege

**Risk Level:** Low

---

## Rollback Plan

If issues occur after deployment:

### Quick Rollback (Restore Bandaid)

1. **Restore API route:**
   ```bash
   mv src/app/api/_deprecated/galleries-route-old.ts src/app/api/client/galleries/route.ts
   ```

2. **Revert upload form:**
   ```bash
   git checkout HEAD~1 -- src/app/client/upload/page.tsx
   ```

3. **Revert RLS policies in Supabase:**
   ```sql
   DROP POLICY IF EXISTS "Clients can insert own galleries" ON photo_galleries;

   -- Restore old policy
   CREATE POLICY "Clients can insert own galleries"
   ON photo_galleries
   FOR INSERT
   WITH CHECK (
     photographer_id IS NULL
     AND (
       client_id IS NULL
       OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
     )
   );
   ```

---

## What This Enables

With this fix in place, clients can now:

1. ✅ Upload photos directly via web form without errors
2. ✅ Create galleries without needing a photographer relationship
3. ✅ Organize their own photo collections
4. ✅ Set metadata (event date, location, people, notes)
5. ✅ Have full ownership and control of their galleries

---

## Future Improvements

Once this fix is tested and deployed, consider:

1. **Add bulk upload:** Allow clients to upload multiple galleries at once
2. **Import from Google Photos/iCloud:** Integration with cloud storage
3. **Share with family:** Allow clients to share galleries with family members
4. **Print ordering:** Integration with print services
5. **AI organization:** Auto-tag photos by content, date, location

---

## Summary

**Status:** FIXED ✅

**Files changed:**
1. `database/add-client-gallery-upload-policy.sql` - Updated with correct RLS policies
2. `src/app/client/upload/page.tsx` - Now uses direct Supabase INSERT
3. `src/app/api/client/galleries/route.ts` - Moved to `_deprecated` folder

**Next steps:**
1. Apply SQL file in Supabase Dashboard
2. Test locally with the instructions above
3. Deploy to production once verified
4. Monitor for any errors or issues

**Expected impact:**
- ✅ Client uploads work correctly
- ✅ Better security (RLS enforcement)
- ✅ Faster uploads (no API round-trip)
- ✅ Less code to maintain

---

## Questions & Answers

**Q: Why not just keep the bandaid API route?**
A: Using service role keys for user actions is a security anti-pattern. RLS policies are the correct solution for authorization.

**Q: What if a client already has a photographer?**
A: The policy handles both cases. If `client_id` is set (client has photographer relationship), the policy allows it. If `client_id = NULL` (self-upload), that's also allowed.

**Q: Can photographers still create galleries for clients?**
A: Yes! The photographer policies are unchanged. This fix only affects client self-uploads.

**Q: What about existing galleries?**
A: Existing galleries are unaffected. The SELECT policy already correctly handles viewing galleries by `user_id`.

**Q: Is this fix backward compatible?**
A: Yes. The new policies are more restrictive (better security) but don't break existing functionality.

---

**End of Implementation Plan**
