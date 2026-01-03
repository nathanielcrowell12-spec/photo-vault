# Fix Plan: Favorite API Foreign Key Relationship Bug

**Date:** 2026-01-03
**Status:** Investigation Complete - Ready for Implementation
**Priority:** High (blocking favorite toggle functionality)

---

## 1. Problem Statement

The favorite toggle API at `src/app/api/photos/[id]/favorite/route.ts` fails with:

```json
{
  "code": "PGRST200",
  "details": "Searched for a foreign key relationship between 'gallery_photos' and 'photo_galleries' in the schema 'public', but no matches were found.",
  "hint": "Perhaps you meant 'gallery_sharing' instead of 'gallery_photos'.",
  "message": "Could not find a relationship between 'gallery_photos' and 'photo_galleries' in the schema cache"
}
```

---

## 2. Root Cause Analysis

### Evidence Collected

**File: `database/galleries-table.sql` (lines 95-97)**
```sql
CREATE TABLE IF NOT EXISTS gallery_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
    ...
```

**File: `database/schema.sql` (lines 83-85)**
```sql
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES photo_galleries(id) ON DELETE CASCADE,
  ...
```

### Root Cause

The codebase has **two separate gallery systems** that never got fully consolidated:

| Table | FK Target | Used By |
|-------|-----------|---------|
| `gallery_photos` | `galleries` (old table) | Web UI imports, client uploads |
| `photos` | `photo_galleries` (canonical table) | Desktop uploader, photographer uploads |

The failing query in `route.ts` attempts:
```typescript
.from('gallery_photos')
.select(`
  ...
  photo_galleries!inner (...)
`)
```

This fails because `gallery_photos.gallery_id` references `galleries`, NOT `photo_galleries`. PostgREST correctly reports no FK relationship exists.

### Supporting Evidence

1. **Consolidation migration** (`consolidate-photo-galleries-migration.sql`) intended to make `photo_galleries` the canonical table, but it only migrated gallery records - it did NOT add a FK from `gallery_photos` to `photo_galleries`.

2. **Working patterns in codebase** (e.g., `src/app/api/client/favorites/route.ts`) use separate queries instead of joins:
   ```typescript
   // Step 1: Get client record
   const { data: clientRecord } = await supabase
     .from('clients')
     .select('id')
     .eq('user_id', user.id)
     .single()

   // Step 2: Get galleries for client
   const { data: clientGalleries } = await supabase
     .from('photo_galleries')
     .select('id, gallery_name')
     .eq('client_id', clientRecord.id)

   // Step 3: Get photos from those galleries
   const { data: favorites } = await supabase
     .from('gallery_photos')
     .select('...')
     .in('gallery_id', galleryIds)
   ```

---

## 3. Fix Options

### Option A: Rewrite Query Without Join (Recommended)

**Approach:** Follow the working pattern from `client/favorites/route.ts` - use separate queries.

**Pros:**
- No schema changes required
- No migration needed
- Matches existing working patterns
- Lower risk

**Cons:**
- Slightly more code
- Two queries instead of one

**Implementation:**
```typescript
// Step 1: Get the photo with its gallery_id
const { data: photo, error: photoError } = await supabase
  .from('gallery_photos')
  .select('id, gallery_id, is_favorite')
  .eq('id', photoId)
  .single()

if (!photo) return 404

// Step 2: Get the gallery details (try both tables)
let gallery = await supabase
  .from('photo_galleries')
  .select('id, client_id, user_id, photographer_id, clients(user_id)')
  .eq('id', photo.gallery_id)
  .single()

if (!gallery.data) {
  // Fallback: check old galleries table
  gallery = await supabase
    .from('galleries')
    .select('id, client_id, user_id, photographer_id')
    .eq('id', photo.gallery_id)
    .single()
}

// Step 3: Check access and toggle favorite
```

### Option B: Add Missing FK Relationship (Alternative)

**Approach:** Add a FK from `gallery_photos.gallery_id` to `photo_galleries.id`.

**Pros:**
- Enables the join syntax to work
- More performant (single query)

**Cons:**
- Requires migration
- Must ensure all `gallery_photos.gallery_id` values exist in `photo_galleries`
- Complex: need to either migrate old galleries or have dual FK constraints
- Higher risk of data integrity issues

**Migration Required:**
```sql
-- First ensure all gallery_photos.gallery_id exist in photo_galleries
-- This may require migrating data from galleries table first

ALTER TABLE gallery_photos
DROP CONSTRAINT IF EXISTS gallery_photos_gallery_id_fkey;

ALTER TABLE gallery_photos
ADD CONSTRAINT gallery_photos_gallery_id_fkey
FOREIGN KEY (gallery_id) REFERENCES photo_galleries(id) ON DELETE CASCADE;
```

---

## 4. Recommended Fix

**Go with Option A: Rewrite Query Without Join**

Rationale:
1. Lower risk - no schema changes
2. Matches proven working patterns in the codebase
3. Faster to implement and test
4. The `galleries` table still exists and has data - breaking that FK would cause data integrity issues

---

## 5. Implementation Steps

### Step 1: Update the API route

File: `src/app/api/photos/[id]/favorite/route.ts`

Replace the joined query (lines 25-42) with separate queries:

```typescript
// Get the photo
const { data: photo, error: photoError } = await supabase
  .from('gallery_photos')
  .select('id, gallery_id, is_favorite')
  .eq('id', photoId)
  .single()

if (photoError || !photo) {
  logger.error('[Favorite API] Photo not found:', photoError)
  return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
}

// Get gallery details - try photo_galleries first (canonical), then galleries (legacy)
let gallery: { id: string; client_id: string | null; user_id: string | null; photographer_id: string | null; clientUserId: string | null } | null = null

const { data: pgGallery } = await supabase
  .from('photo_galleries')
  .select(`id, client_id, user_id, photographer_id, clients(user_id)`)
  .eq('id', photo.gallery_id)
  .single()

if (pgGallery) {
  const clientData = pgGallery.clients
  gallery = {
    id: pgGallery.id,
    client_id: pgGallery.client_id,
    user_id: pgGallery.user_id,
    photographer_id: pgGallery.photographer_id,
    clientUserId: Array.isArray(clientData) ? clientData[0]?.user_id : clientData?.user_id
  }
} else {
  // Try legacy galleries table
  const { data: legacyGallery } = await supabase
    .from('galleries')
    .select('id, client_id, user_id, photographer_id')
    .eq('id', photo.gallery_id)
    .single()

  if (legacyGallery) {
    gallery = {
      id: legacyGallery.id,
      client_id: legacyGallery.client_id,
      user_id: legacyGallery.user_id,
      photographer_id: legacyGallery.photographer_id,
      clientUserId: null // Legacy galleries don't have client FK to get user_id
    }
  }
}

if (!gallery) {
  logger.error('[Favorite API] Gallery not found for photo:', photo.gallery_id)
  return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
}
```

### Step 2: Test the fix

1. Test with a photo from `gallery_photos` that belongs to a `photo_galleries` gallery
2. Test with a photo from `gallery_photos` that belongs to a `galleries` gallery (if any exist)
3. Verify favorite toggle works for photographers
4. Verify favorite toggle works for clients

### Step 3: Consider future migration

Add a TODO or follow-up ticket to:
1. Migrate all data from `galleries` to `photo_galleries`
2. Update `gallery_photos.gallery_id` FK to point to `photo_galleries`
3. Drop the `galleries` table

This is lower priority as the code fix handles both cases.

---

## 6. Files to Modify

| File | Change |
|------|--------|
| `src/app/api/photos/[id]/favorite/route.ts` | Rewrite query to use separate queries instead of join |

---

## 7. Testing Checklist

- [ ] Photographer can toggle favorite on their photos
- [ ] Client can toggle favorite on photos in their assigned galleries
- [ ] User with direct `user_id` match can toggle favorite
- [ ] API returns 404 for non-existent photo
- [ ] API returns 403 for unauthorized user
- [ ] No regression in existing favorite functionality

---

## 8. Appendix: Schema Summary

### Current State

```
gallery_photos.gallery_id --> galleries.id (old table)
photos.gallery_id --> photo_galleries.id (canonical table)
```

### Intended Future State

```
All photo tables --> photo_galleries.id (single canonical)
galleries table --> deprecated/removed
```
