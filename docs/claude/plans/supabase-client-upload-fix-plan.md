# Supabase: Client Upload Gallery Creation Fix

## Summary
Client web upload form at `/client/upload` is failing with two errors:
1. RLS policy violation when inserting into `photo_galleries` table
2. Check constraint violation on `gallery_status` column (trying to use 'active' when only 'draft', 'ready', 'delivered', 'archived' are allowed)

## Official Documentation Reference
- Supabase RLS Policies: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL Check Constraints: https://www.postgresql.org/docs/current/ddl-constraints.html

## Root Cause Analysis

### Issue 1: RLS Policy Violation
The client upload form tries to insert a gallery with `client_id = user?.id`, but there's no RLS policy allowing clients to insert galleries for themselves. The existing policies only allow:
- Photographers to insert galleries (with `photographer_id = auth.uid()`)
- Admins to insert any gallery

**Solution:** A new RLS policy was already created in `database/add-client-gallery-upload-policy.sql` that allows clients to insert galleries where `client_id = auth.uid()` and `photographer_id IS NULL`. This needs to be run in Supabase.

### Issue 2: Check Constraint Violation
The upload form at line 148 of `src/app/client/upload/page.tsx` sets:
```javascript
gallery_status: 'active'
```

But the check constraint in `database/consolidate-photo-galleries-migration.sql` line 67 only allows:
```sql
CHECK (gallery_status IN ('draft', 'ready', 'delivered', 'archived'))
```

The value 'active' is NOT in this list, causing the insert to fail.

**What other parts of the app use:** Looking at `src/app/photographer/galleries/create/page.tsx` line 285, photographers create galleries with:
```javascript
gallery_status: 'draft'
```

This is the correct value for a newly created gallery.

## Current Schema Analysis

### photo_galleries Table
**Location:** `database/consolidate-photo-galleries-migration.sql`

**Relevant columns:**
- `gallery_status VARCHAR(20) DEFAULT 'draft'` with check constraint
- Valid values: `'draft'`, `'ready'`, `'delivered'`, `'archived'`
- Default value: `'draft'`

**Workflow meaning:**
- `draft` = Gallery created but not ready for client viewing (photographer uploading photos)
- `ready` = Photos uploaded, ready to send to client
- `delivered` = Gallery delivered/sent to client
- `archived` = Gallery archived after completion

**For client uploads:** Since clients are uploading their own photos (no photographer involvement), the gallery should start as `'draft'` and the client can mark it complete when done.

### Existing RLS Policies
**Location:** `database/consolidate-photo-galleries-migration.sql` lines 229-274

Current policies:
1. Photographers can insert/update/view their galleries
2. Clients can view galleries assigned to them
3. Admins can do everything

**Missing:** Policy for clients to insert their own galleries (photographer-less uploads)

## Implementation Steps

### Step 1: Run the RLS Policy SQL
The policy SQL already exists at `database/add-client-gallery-upload-policy.sql`. It needs to be run in Supabase Dashboard.

**To execute:**
1. Go to Supabase Dashboard → SQL Editor
2. Paste the contents of `database/add-client-gallery-upload-policy.sql`
3. Run it

**What it does:**
- Creates policy allowing clients to INSERT galleries where `client_id = auth.uid()` and `photographer_id IS NULL`
- Creates policy allowing clients to UPDATE their own uploaded galleries
- Creates policy allowing clients to DELETE their own uploaded galleries

### Step 2: Fix the gallery_status Value
Change line 148 in `src/app/client/upload/page.tsx` from:
```javascript
gallery_status: 'active',  // WRONG
```

To:
```javascript
gallery_status: 'draft',  // CORRECT
```

**Reasoning:**
- 'draft' is the correct status for a newly created gallery
- Matches what photographers use when creating galleries
- Complies with the check constraint
- Semantically correct: gallery is in draft state until client finishes uploading

## SQL Migrations

**File:** `database/add-client-gallery-upload-policy.sql` (already exists)

```sql
-- Add RLS policy to allow clients to upload their own galleries
-- Run this in Supabase Dashboard > SQL Editor
-- Date: December 10, 2025

-- Policy: Clients can insert galleries for themselves (with no photographer)
-- This allows clients to upload their own photos via the web upload form
CREATE POLICY "Clients can insert own galleries"
ON photo_galleries
FOR INSERT
WITH CHECK (
  client_id = auth.uid()
  AND photographer_id IS NULL
);

-- Policy: Clients can update their own galleries (that they created)
-- This allows clients to edit gallery metadata for galleries they uploaded
CREATE POLICY "Clients can update own uploaded galleries"
ON photo_galleries
FOR UPDATE
USING (
  client_id = auth.uid()
  AND photographer_id IS NULL
)
WITH CHECK (
  client_id = auth.uid()
  AND photographer_id IS NULL
);

-- Policy: Clients can delete their own galleries (that they created)
CREATE POLICY "Clients can delete own uploaded galleries"
ON photo_galleries
FOR DELETE
USING (
  client_id = auth.uid()
  AND photographer_id IS NULL
);
```

## TypeScript Code Changes

### File: `src/app/client/upload/page.tsx`

**Current code (line 138-152):**
```javascript
const { data: gallery, error: galleryError } = await supabase
  .from('photo_galleries')
  .insert({
    photographer_id: null, // No photographer for client uploads
    client_id: user?.id,
    gallery_name: galleryName,
    gallery_description: galleryDescription || null,
    photo_count: files.length,
    session_date: eventDate || new Date().toISOString(),
    platform: 'photovault',
    gallery_status: 'active',  // <-- WRONG VALUE
    metadata: Object.keys(metadata).length > 0 ? metadata : null
  })
  .select()
  .single()
```

**Fixed code:**
```javascript
const { data: gallery, error: galleryError } = await supabase
  .from('photo_galleries')
  .insert({
    photographer_id: null, // No photographer for client uploads
    client_id: user?.id,
    gallery_name: galleryName,
    gallery_description: galleryDescription || null,
    photo_count: files.length,
    session_date: eventDate || new Date().toISOString(),
    platform: 'photovault',
    gallery_status: 'draft',  // CORRECT: Matches check constraint
    metadata: Object.keys(metadata).length > 0 ? metadata : null
  })
  .select()
  .single()
```

**Change:** Line 148 - Change `'active'` to `'draft'`

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/client/upload/page.tsx` | Line 148: Change `gallery_status: 'active'` to `gallery_status: 'draft'` |

## RLS Policy Considerations

### Existing Policies (Before Fix)
- ✅ Photographers can insert galleries (with `photographer_id = auth.uid()`)
- ✅ Clients can view galleries assigned to them
- ❌ **MISSING:** Clients cannot insert galleries for themselves

### After Running SQL Migration
- ✅ Clients can INSERT galleries where `client_id = auth.uid()` AND `photographer_id IS NULL`
- ✅ Clients can UPDATE their own uploaded galleries
- ✅ Clients can DELETE their own uploaded galleries
- ✅ Photographers can still INSERT/UPDATE/VIEW their own galleries
- ✅ Admins can do everything

### Security Considerations
The new policy is secure because:
1. **Client ownership:** Client can only insert galleries where `client_id = auth.uid()` (their own user ID)
2. **No photographer spoofing:** Policy requires `photographer_id IS NULL`, preventing clients from creating galleries "from" photographers
3. **Scoped updates:** Clients can only update galleries they created (same WHERE clause)
4. **No cross-client access:** Client A cannot insert/update galleries for Client B

## Testing Steps

### 1. Run RLS Policy in Supabase Dashboard
```sql
-- Copy/paste from database/add-client-gallery-upload-policy.sql
-- Verify no errors
```

**Expected:** Policy created successfully, no errors

### 2. Fix the Code
Change `gallery_status: 'active'` to `gallery_status: 'draft'` in upload page

### 3. Test Client Upload Flow
1. Log in as a client user
2. Navigate to `/client/upload`
3. Fill in gallery name: "Test Upload"
4. Select 2-3 test photos
5. Click "Create Gallery"

**Expected:**
- No RLS error
- No check constraint error
- Gallery created successfully with `gallery_status = 'draft'`
- Photos uploaded to Supabase Storage
- Photo records created in `gallery_photos` table
- Redirected to `/client/dashboard`
- New gallery appears in dashboard

### 4. Verify in Supabase Dashboard
```sql
SELECT
  id,
  gallery_name,
  client_id,
  photographer_id,
  gallery_status,
  photo_count
FROM photo_galleries
WHERE photographer_id IS NULL
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- New gallery appears
- `photographer_id` is NULL
- `client_id` matches logged-in client's user ID
- `gallery_status` = 'draft'
- `photo_count` matches number of uploaded photos

### 5. Test RLS Policy Enforcement
Try to insert a gallery for another client (should fail):
```sql
-- In SQL Editor, impersonate a client
SELECT set_config('request.jwt.claims', '{"sub": "client-user-id-here"}', true);
SET ROLE authenticated;

-- Try to insert for another client (should fail)
INSERT INTO photo_galleries (client_id, photographer_id, gallery_name, platform, gallery_status)
VALUES ('different-client-id', NULL, 'Hacked Gallery', 'photovault', 'draft');

-- Reset
RESET ROLE;
```

**Expected:** Insert fails with RLS policy violation

## Performance Considerations

### Indexes Already Exist
From `database/consolidate-photo-galleries-migration.sql`:
- ✅ `idx_photo_galleries_gallery_status` on `gallery_status`
- ✅ `idx_photo_galleries_payment_status` on `payment_status`
- ✅ `idx_photo_galleries_user_id` on `user_id`

No new indexes needed.

### Query Performance
The new RLS policy uses:
```sql
client_id = auth.uid() AND photographer_id IS NULL
```

This will use the existing index on `client_id` and filter on `photographer_id IS NULL`, which is efficient.

## Gotchas & Warnings

### 1. Don't Confuse gallery_status Values
❌ **WRONG:** 'active', 'inactive', 'expired' (these are for `payment_status`)
✅ **CORRECT:** 'draft', 'ready', 'delivered', 'archived' (these are for `gallery_status`)

### 2. client_id vs user_id
- `client_id`: UUID FK to `clients` table (used by photographers)
- `user_id`: UUID FK to `auth.users` (used for direct user linking)

For client uploads, use `client_id = auth.uid()` directly (client IS the user).

### 3. photographer_id Must Be NULL
Client uploads MUST have `photographer_id = NULL`. If you accidentally set a photographer_id, the RLS policy will reject it.

### 4. Gallery Workflow
After client finishes uploading, they might want to "publish" or "finalize" the gallery. Consider adding a button to change status from 'draft' to 'delivered' when they're done.

### 5. Photo Count Accuracy
The upload form sets `photo_count: files.length` at gallery creation, then uploads files. If some uploads fail, the count will be wrong. Consider updating photo_count after all uploads complete or querying the actual count from `gallery_photos`.

## Validation Checklist

Before deploying:
- [ ] RLS policy SQL run in Supabase Dashboard
- [ ] Code change: `gallery_status: 'draft'` instead of `'active'`
- [ ] Test client upload flow end-to-end
- [ ] Verify gallery appears in Supabase with correct values
- [ ] Test that client cannot create galleries for other clients
- [ ] Check that photos are correctly linked to gallery

## Additional Improvements (Optional)

### 1. Better Status Flow for Client Uploads
Add a "Finish Upload" button that changes status from 'draft' to 'delivered':
```javascript
const handleFinishUpload = async (galleryId: string) => {
  await supabase
    .from('photo_galleries')
    .update({ gallery_status: 'delivered' })
    .eq('id', galleryId)
}
```

### 2. Accurate Photo Count
Update photo_count after all photos uploaded:
```javascript
await supabase
  .from('photo_galleries')
  .update({
    photo_count: uploadedFiles.length,
    gallery_status: 'delivered'  // Mark as complete
  })
  .eq('id', gallery.id)
```

### 3. Error Handling for Partial Uploads
If some photos fail to upload, either:
- Delete the gallery and start over
- Keep the gallery and show which photos failed
- Allow re-uploading failed photos

## Related Documentation
- Client Upload Form: `src/app/client/upload/page.tsx`
- Gallery Schema: `database/consolidate-photo-galleries-migration.sql`
- Payment Models: `src/lib/payment-models.ts`
- Photographer Gallery Creation: `src/app/photographer/galleries/create/page.tsx`
