# Cover Image URL Persistence Bug Investigation

**Date:** 2026-01-03
**Investigator:** Claude Code
**Status:** Analysis Complete

---

## Executive Summary

The `cover_image_url` field on the `photo_galleries` table is NOT being consistently set across all upload flows. This investigation identified **12 distinct upload flows**, of which only **3 properly set cover_image_url**, **2 set it conditionally**, and **7 never set it at all**.

**Root Cause:** There is no centralized mechanism (database trigger or shared utility function) to automatically set `cover_image_url` when photos are added to a gallery. Each upload flow must implement this logic independently, and most do not.

---

## Phase 1: INVESTIGATION

### Upload Flow Inventory

I traced ALL upload paths in the codebase:

| # | Flow Name | Location | Photo Table | Sets cover_image_url? | How/When |
|---|-----------|----------|-------------|----------------------|----------|
| 1 | Web UI Gallery Upload | `src/app/photographer/galleries/[id]/upload/page.tsx:218-231` | `photos` | **YES** | Only if `photos.length === 0` (first upload batch) |
| 2 | Photos Upload API | `src/app/api/photos/upload/route.ts:117-127` | `gallery_photos` | **YES** | Sets to first photo if gallery doesn't have one |
| 3 | Desktop Process Chunked | `src/app/api/v1/upload/process-chunked/route.ts:183-225` | `photos` | **YES** | Only if gallery has no cover or has placeholder |
| 4 | Desktop Process (original) | `src/app/api/v1/upload/process/route.ts:227-235` | `gallery_photos` | **NO** | Updates `photo_count`, `is_imported` - NO cover_image_url |
| 5 | Desktop Process Fast | `src/app/api/v1/upload/process-fast/route.ts:181-189` | `gallery_photos` | **NO** | Updates `photo_count`, `is_imported` - NO cover_image_url |
| 6 | Desktop Process Streaming | `src/app/api/v1/upload/process-streaming/route.ts:179-186` | `gallery_photos` | **NO** | Updates `photo_count`, `is_imported` - NO cover_image_url |
| 7 | ZIP Import | `src/app/api/v1/import/zip/route.ts:182-190` | `gallery_photos` | **NO** | Updates `photo_count`, `is_imported` - NO cover_image_url |
| 8 | Supabase Direct Upload | `src/app/api/v1/upload/supabase-direct/route.ts:37-48` | Creates gallery | **PLACEHOLDER** | Sets `/images/placeholder-family.svg` at creation |
| 9 | Pixieset ZIP Import | `src/app/api/import/pixieset-zip/route.ts:53-76` | Creates gallery | **PLACEHOLDER** | Sets `/images/placeholder-family.svg` at creation |
| 10 | Unified Gallery Import | `src/app/api/v1/import/gallery/route.ts:55-77` | Creates gallery | **PLACEHOLDER** | Sets `/images/placeholder-family.svg` at creation |
| 11 | Photographer Upload Page | `src/app/photographer/upload/page.tsx:149-160` | `gallery_photos` | **NO** | Creates gallery, never updates cover |
| 12 | Client Smartphone Upload | `src/app/api/client/upload/route.ts:170-191` | `photos` | **NO** | Creates galleries, never sets cover |

### Flows Breakdown by cover_image_url Handling

#### Properly Sets cover_image_url (3 flows)
1. **Web UI Gallery Upload** (`/photographer/galleries/[id]/upload/page.tsx`)
   - Line 218-231: Checks if `photos.length === 0` before setting
   - Uses first `uploadedPhotos[0].thumbnail_url`

2. **Photos Upload API** (`/api/photos/upload/route.ts`)
   - Line 117: `const coverImageUrl = gallery.cover_image_url || photos?.[0]?.thumbnail_url || null`
   - Line 125: Always updates cover_image_url (uses existing or first photo)

3. **Desktop Process Chunked** (`/api/v1/upload/process-chunked/route.ts`)
   - Line 101: Tracks `firstPhotoUrl` during upload
   - Line 183-224: Checks if gallery has no cover or has placeholder before updating

#### Sets Placeholder Only (3 flows)
These set `/images/placeholder-family.svg` at gallery creation but NEVER update it after photos are uploaded:

4. **Supabase Direct Upload** - Line 46
5. **Pixieset ZIP Import** - Line 66
6. **Unified Gallery Import** - Line 68

#### Never Sets cover_image_url (6 flows)
These completely ignore cover_image_url:

7. **Desktop Process (original)** - Updates only `photo_count`, `is_imported`, `import_started_at`
8. **Desktop Process Fast** - Updates only `photo_count`, `is_imported`, `import_started_at`
9. **Desktop Process Streaming** - Updates only `photo_count`, `is_imported`, `import_started_at`
10. **ZIP Import** - Updates only `photo_count`, `is_imported`, `import_started_at`
11. **Photographer Upload Page** - Creates gallery, inserts photos to `gallery_photos`, updates `is_imported` only
12. **Client Smartphone Upload** - Creates galleries, never updates cover

---

## Phase 2: ANALYSIS

### Database Schema Analysis

The `photo_galleries` table has a `cover_image_url` column (VARCHAR(500)) with no default value and no constraints.

**Key Finding:** There is NO database trigger to automatically set `cover_image_url` when:
- A photo is inserted into `photos` or `gallery_photos`
- A gallery is updated with `is_imported = true`

### Table Confusion Issue

The codebase uses TWO different photo tables inconsistently:
- `photos` - Used by some flows (Web UI, Photos Upload API, some platform imports)
- `gallery_photos` - Used by other flows (Desktop uploads, ZIP imports, Photographer Upload Page)

This fragmentation makes it harder to implement a unified solution.

### Root Causes Identified

1. **No Centralized Logic:** Each upload flow must independently implement cover_image_url logic
2. **Copy-Paste Drift:** Newer flows were likely copied from older ones that never had the logic
3. **Multiple Photo Tables:** `photos` vs `gallery_photos` creates confusion
4. **No Database Enforcement:** No trigger or constraint ensures cover is set
5. **Inconsistent Conditions:** Some flows check `photos.length === 0`, others check for placeholder string

### Impact Analysis

| Flow | Monthly Usage (est.) | Impact |
|------|---------------------|--------|
| Photographer Upload Page | High | Galleries created here NEVER get cover |
| Desktop Process variants | High | Most desktop uploads don't set cover |
| ZIP Import variants | Medium | Imported galleries stuck with placeholder |
| Client Upload | Low | Personal galleries have no covers |

---

## Phase 3: GAPS IDENTIFIED

### Critical Gaps

1. **`/photographer/upload/page.tsx`** (Line 149-335)
   - Creates gallery at line 149-160
   - Creates photo records at line 262-300
   - Updates gallery at line 306-316 with `is_imported`, `import_completed_at`
   - **NEVER sets cover_image_url**

2. **`/api/v1/upload/process/route.ts`** (Line 227-235)
   - Final gallery update only sets: `photo_count`, `is_imported`, `import_started_at: null`
   - **NEVER sets cover_image_url**

3. **`/api/v1/upload/process-fast/route.ts`** (Line 181-189)
   - Same issue as above

4. **`/api/v1/upload/process-streaming/route.ts`** (Line 179-186)
   - Same issue as above

5. **`/api/v1/import/zip/route.ts`** (Line 182-190)
   - Same issue as above

### Partial Gaps

6. **`/photographer/galleries/[id]/upload/page.tsx`** (Line 218-231)
   - Only sets cover if `photos.length === 0`
   - If gallery already has photos (even without cover), it won't set one
   - Edge case: Gallery with photos but no cover stays broken

---

## Phase 4: RECOMMENDED FIX

### Option A: Database Trigger (RECOMMENDED)

Create a PostgreSQL trigger that automatically sets `cover_image_url` when:
1. First photo is inserted into a gallery (either `photos` or `gallery_photos`)
2. Gallery is marked `is_imported = true` and has no cover

**Pros:**
- Single source of truth
- Works for ALL upload flows automatically
- Future-proof - new flows get it for free
- Fixes existing broken galleries with a one-time migration

**Cons:**
- Requires database migration
- Slightly more complex to test/debug

### Option B: Centralized Utility Function

Create a shared function that all upload flows call after inserting photos.

```typescript
// src/lib/services/gallery-cover-service.ts
async function ensureGalleryCover(galleryId: string, supabase: SupabaseClient) {
  // Get current gallery
  const { data: gallery } = await supabase
    .from('photo_galleries')
    .select('cover_image_url')
    .eq('id', galleryId)
    .single()

  // Skip if already has non-placeholder cover
  if (gallery?.cover_image_url && !gallery.cover_image_url.includes('placeholder')) {
    return
  }

  // Try photos table first
  const { data: photo } = await supabase
    .from('photos')
    .select('thumbnail_url')
    .eq('gallery_id', galleryId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  // Fallback to gallery_photos
  const { data: galleryPhoto } = await supabase
    .from('gallery_photos')
    .select('thumbnail_url, photo_url')
    .eq('gallery_id', galleryId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  const coverUrl = photo?.thumbnail_url || galleryPhoto?.thumbnail_url || galleryPhoto?.photo_url

  if (coverUrl) {
    await supabase
      .from('photo_galleries')
      .update({ cover_image_url: coverUrl })
      .eq('id', galleryId)
  }
}
```

**Pros:**
- No database changes
- Easy to implement

**Cons:**
- Must update every upload flow
- Future flows might forget to call it
- Doesn't fix existing broken galleries automatically

### Option C: Hybrid Approach (BEST)

1. Implement Option A (database trigger) for future-proofing
2. Run a one-time migration to fix existing galleries
3. Keep the utility function for any flows that need immediate cover updates

---

## Implementation Steps

### If Proceeding with Option A (Database Trigger):

1. **Create Migration SQL:**
```sql
-- Function to set cover_image_url from first photo
CREATE OR REPLACE FUNCTION set_gallery_cover_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if gallery doesn't have a real cover
  IF EXISTS (
    SELECT 1 FROM photo_galleries
    WHERE id = NEW.gallery_id
    AND (cover_image_url IS NULL OR cover_image_url LIKE '%placeholder%')
  ) THEN
    UPDATE photo_galleries
    SET cover_image_url = COALESCE(NEW.thumbnail_url, NEW.photo_url, NEW.original_url)
    WHERE id = NEW.gallery_id
    AND (cover_image_url IS NULL OR cover_image_url LIKE '%placeholder%');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for photos table
DROP TRIGGER IF EXISTS set_cover_on_photo_insert ON photos;
CREATE TRIGGER set_cover_on_photo_insert
  AFTER INSERT ON photos
  FOR EACH ROW
  EXECUTE FUNCTION set_gallery_cover_image();

-- Trigger for gallery_photos table
DROP TRIGGER IF EXISTS set_cover_on_gallery_photo_insert ON gallery_photos;
CREATE TRIGGER set_cover_on_gallery_photo_insert
  AFTER INSERT ON gallery_photos
  FOR EACH ROW
  EXECUTE FUNCTION set_gallery_cover_image();
```

2. **Fix Existing Galleries:**
```sql
-- One-time fix for galleries with placeholders or NULL covers
UPDATE photo_galleries pg
SET cover_image_url = COALESCE(
  (SELECT thumbnail_url FROM photos WHERE gallery_id = pg.id ORDER BY created_at LIMIT 1),
  (SELECT COALESCE(thumbnail_url, photo_url) FROM gallery_photos WHERE gallery_id = pg.id ORDER BY created_at LIMIT 1)
)
WHERE cover_image_url IS NULL
   OR cover_image_url LIKE '%placeholder%';
```

3. **Test Each Upload Flow** to verify trigger works

### If Proceeding with Option B (Utility Function):

1. Create `src/lib/services/gallery-cover-service.ts`
2. Update these files to call the function:
   - `src/app/photographer/upload/page.tsx` (after line 300)
   - `src/app/api/v1/upload/process/route.ts` (before line 227)
   - `src/app/api/v1/upload/process-fast/route.ts` (before line 181)
   - `src/app/api/v1/upload/process-streaming/route.ts` (before line 179)
   - `src/app/api/v1/import/zip/route.ts` (before line 182)
   - `src/app/api/client/upload/route.ts` (after photo insert loop)

---

## Files Referenced

| File | Line Numbers | Issue |
|------|--------------|-------|
| `src/app/photographer/galleries/[id]/upload/page.tsx` | 218-231 | Conditionally sets cover |
| `src/app/api/photos/upload/route.ts` | 109-127 | Properly sets cover |
| `src/app/api/v1/upload/process-chunked/route.ts` | 183-225 | Properly sets cover |
| `src/app/api/v1/upload/process/route.ts` | 227-235 | **MISSING cover logic** |
| `src/app/api/v1/upload/process-fast/route.ts` | 181-189 | **MISSING cover logic** |
| `src/app/api/v1/upload/process-streaming/route.ts` | 179-186 | **MISSING cover logic** |
| `src/app/api/v1/import/zip/route.ts` | 182-190 | **MISSING cover logic** |
| `src/app/photographer/upload/page.tsx` | 306-316 | **MISSING cover logic** |
| `src/app/api/client/upload/route.ts` | 170-191 | **MISSING cover logic** |
| `src/app/api/v1/upload/supabase-direct/route.ts` | 37-48 | Sets placeholder only |
| `src/app/api/import/pixieset-zip/route.ts` | 53-76 | Sets placeholder only |
| `src/app/api/v1/import/gallery/route.ts` | 55-77 | Sets placeholder only |

---

## Recommendation

**Implement Option C (Hybrid Approach):**

1. Create the database trigger (handles future uploads automatically)
2. Run migration to fix existing galleries
3. Optionally add utility function for immediate UI feedback

This ensures:
- All future uploads automatically get cover images
- No need to modify every upload flow
- Existing broken galleries get fixed
- Future developers don't need to remember to add cover logic

---

## Evidence

All file paths and line numbers were verified by direct code inspection on 2026-01-03. The analysis covers 12 distinct upload flows across 12 source files.
