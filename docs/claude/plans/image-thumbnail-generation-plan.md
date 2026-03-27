# Thumbnail Generation at Upload Time - Implementation Plan (v3)

## Summary

Replace Supabase CDN image transforms ($5/1,000 origin images/month) with Sharp-based thumbnail generation at upload time ($0 transform cost/month). Pre-generate **thumbnail (400px)** and **medium (1200px)** sizes, store in Supabase Storage, update DB columns. This eliminates the per-image transform cost that makes the $8/month base tier unprofitable for clients with 1,000+ photos.

**v3 Revision (2026-02-13):** Complete rewrite after route audit + user confirmation revealed massive dead code. Scope reduced from 11 upload routes to **2 live routes**. Incorporates all QA Critic v2 fixes (C1 Sharp pipeline bug, S1 concurrency control, S2 upsert, S4 NULL check, S5 cover preset). User approved deletion of 17 dead files and the `galleries` table.

---

## Business Context

### Current Problem (Supabase Transforms)

| Client Photos | Monthly Transform Cost | Client Revenue ($8/mo) | Net After Stripe (50% split) | Profit/Loss |
|---------------|----------------------|------------------------|------------------------------|-------------|
| 500 | $2.50 | $3.74 | $3.74 | +$1.24 |
| 2,000 | $10.00 | $3.74 | $3.74 | **-$6.26** |
| 5,000 | $25.00 | $3.74 | $3.74 | **-$21.26** |
| 10,000 | $50.00 | $3.74 | $3.74 | **-$46.26** |

Transform pricing: $5 per 1,000 origin images/month. Resets monthly. Even CDN cache hits count toward billing.

### After This Change (Pre-Generated Thumbnails)

| Client Photos | Storage Cost (additional) | Transform Cost | Net After Stripe | Profit/Loss |
|---------------|--------------------------|----------------|------------------|-------------|
| 500 | $0.003 | $0 | $3.74 | **+$3.74** |
| 2,000 | $0.012 | $0 | $3.74 | **+$3.73** |
| 5,000 | $0.029 | $0 | $3.74 | **+$3.71** |
| 10,000 | $0.058 | $0 | $3.74 | **+$3.68** |

Storage: ~30KB per thumbnail + ~200KB per medium = ~230KB additional per photo. At $0.021/GB/month.

**Break-even: This change saves $5-50+/month per client, making the $8/month base tier profitable at ANY photo count.**

---

## Ground-Truth Schema (Audited 2026-02-13)

### Two Photo Tables Exist

Both are actively used. The frontend reads from both with a fallback pattern.

#### `gallery_photos` (90 rows) -- Used by web photographer uploads

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `gallery_id` | uuid | FK -> photo_galleries.id |
| `photo_url` | text | Full-size original URL |
| `thumbnail_url` | text | Currently equals `photo_url` (no real thumbnails) |
| `original_filename` | varchar | |
| `file_size` | integer | |
| `width` | integer | |
| `height` | integer | |
| `taken_at` | timestamptz | |
| `caption` | text | |
| `is_favorite` | boolean | |
| `is_private` | boolean | |
| `metadata` | jsonb | |
| `status` | text | Default 'active' |
| `deleted_at` | timestamptz | Soft delete |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Does NOT have:** `medium_url`, `original_url`, `full_url`, `filename`

#### `photos` (622 rows) -- Used by desktop uploads

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `gallery_id` | uuid | FK -> photo_galleries.id |
| `platform_photo_id` | varchar | |
| `filename` | varchar | |
| `original_url` | varchar | Full-size original URL |
| `thumbnail_url` | varchar | Currently equals `original_url` (no real thumbnails) |
| `medium_url` | varchar | **Already exists** -- currently NULL for all rows |
| `full_url` | varchar | |
| `file_size` | integer | |
| `width` | integer | |
| `height` | integer | |
| `alt_text` | text | |
| `exif_data` | jsonb | |
| `tags` | text[] | |
| `is_favorite` | boolean | |
| `download_count` | integer | |
| `is_sneak_peek` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Already has:** `medium_url`, `full_url`

#### Gallery Tables

| Table | Rows | Purpose |
|-------|------|---------|
| `photo_galleries` | 12 | Gallery metadata (active). Has `cover_image_url`. |
| `galleries` | 0 | **DEAD** -- no rows, no references. To be dropped in Phase 6. |

#### Database Triggers

| Trigger | Table | Action |
|---------|-------|--------|
| `set_cover_on_photo_insert` | `photos` | Sets `photo_galleries.cover_image_url` from `thumbnail_url` or `original_url` |
| `set_cover_on_gallery_photo_insert` | `gallery_photos` | Sets `galleries.cover_image_url` from `thumbnail_url` or `photo_url` |

The `gallery_photos` trigger updates the dead `galleries` table (0 rows). This trigger is effectively inert and will be dropped in Phase 6.

#### Frontend Read Pattern

`src/app/gallery/[galleryId]/page.tsx` lines 138-175:
1. Queries `gallery_photos` first
2. If empty, falls back to `photos` table
3. Maps `photos.original_url` -> `photo_url` in JavaScript

#### Rendering -- Where `getTransformedImageUrl` Is Called

| File | Line | Preset | What it renders |
|------|------|--------|----------------|
| `gallery/[galleryId]/page.tsx` | 760 | `preview` (200px) | Gallery grid thumbnails (free section) |
| `gallery/[galleryId]/page.tsx` | 871 | `preview` (200px) | Gallery grid thumbnails (paid section) |
| `gallery/[galleryId]/page.tsx` | 1194 | `thumbnail` (400px) | Paywall preview grid |
| `gallery/[galleryId]/page.tsx` | 1273 | `medium` (1200px) | Slideshow/lightbox |
| `client/favorites/page.tsx` | 145 | `thumbnail` (400px) | Favorites grid |
| `client/favorites/page.tsx` | 229 | `medium` (1200px) | Favorites lightbox |
| `client/dashboard/page.tsx` | 430 | `cover` (600px) | Gallery cards |
| `client/timeline/page.tsx` | 333 | `cover` (600px) | Timeline gallery cards |
| `family/galleries/page.tsx` | 403 | `cover` (600px) | Family gallery cards |
| `family/galleries/page.tsx` | 528 | `preview` (200px) | Family gallery small cards |
| `ImageWithFallback.tsx` (via GalleryGrid) | -- | `cover` (600px) | Dashboard gallery grid |
| `ImageWithFallback.tsx` (via GalleryCard) | -- | `cover` (600px) | Gallery card component |

**Preset -> Column mapping after this change:**

| Preset | CDN Width | Pre-generated Column | Column Width | Acceptable? |
|--------|-----------|---------------------|--------------|-------------|
| `preview` (200px) | 200px | `thumbnail_url` | 400px | Yes -- 400px downscaled by browser to 200px display |
| `thumbnail` (400px) | 400px | `thumbnail_url` | 400px | Exact match |
| `cover` (600px) | 600px | `thumbnail_url` | 400px | Yes -- user decision: use 400px for covers |
| `medium` (1200px) | 1200px | `medium_url` | 1200px | Exact match |

All four presets map to just 2 generated sizes. Zero CDN transforms needed.

---

## Live Upload Routes (Only 2)

### Route 1: `src/app/api/photos/upload/route.ts` (Web Upload)

- **Auth:** Supabase session cookies
- **Input:** FormData with `galleryId` + `photos[]` files
- **Storage bucket:** `photos`
- **Storage path:** `{userId}/{galleryId}/original/{timestamp}-{randomId}-{filename}`
- **DB table:** `gallery_photos`
- **Columns written:** `gallery_id`, `photo_url`, `thumbnail_url`, `original_filename`, `file_size`, `is_favorite`, `is_private`
- **Current thumbnail behavior:** `thumbnail_url = publicUrl` (same as original -- line 87 has TODO comment)
- **Cover image:** Sets `photo_galleries.cover_image_url` from first photo's `thumbnail_url` (line 117)
- **Processing model:** Sequential (for loop over files)
- **Buffer availability:** `file.arrayBuffer()` gives the buffer per file

### Route 2: `src/app/api/v1/upload/process-chunked/route.ts` (Desktop Upload)

- **Auth:** Uses service role key directly (module-level Supabase client)
- **Input:** JSON body with `galleryId`, `storagePath`, `totalChunks`
- **Process:** Downloads chunks from `gallery-imports` bucket, merges, extracts ZIP
- **Storage bucket:** `photos`
- **Storage path:** `galleries/{galleryId}/{timestamp}-{random}-{sanitizedName}`
- **DB table:** `photos`
- **Columns written:** `gallery_id`, `filename`, `original_url`, `thumbnail_url`, `file_size`
- **Current thumbnail behavior:** `thumbnail_url = publicUrl` (line 147 has comment "You can generate thumbnails later")
- **Cover image:** Sets `photo_galleries.cover_image_url` from `firstPhotoUrl` if gallery has no cover (line 218-225)
- **Processing model:** Batches of 10 via `Promise.all` (line 102-107)
- **Buffer availability:** Each photo extracted from ZIP as `Buffer.from(imageData)` -- already in memory
- **Response:** SSE streaming with progress events

**Desktop app call chain** (`photovault-desktop/src/upload-manager.ts`):
- Line 300: `/api/v1/upload/prepare` (gallery creation -- no photos)
- Line 404: `/api/v1/upload/chunk` (storage chunks -- no DB writes)
- Line 468: `/api/v1/upload/process-chunked` (processes ZIP -> photos)

---

## Dead Code Deletion (User Approved)

### Dead Upload Routes (17 files)

| File | Reason Dead |
|------|-------------|
| `src/app/api/v1/upload/process/route.ts` | Writes wrong columns to `gallery_photos` (has `storage_path`, `mime_type` which don't exist) |
| `src/app/api/v1/upload/process-fast/route.ts` | Same wrong schema as above |
| `src/app/api/v1/upload/process-streaming/route.ts` | Same wrong schema as above |
| `src/app/api/v1/upload/chunked/route.ts` | Not called by desktop app |
| `src/app/api/v1/upload/supabase-direct/route.ts` | Not called by desktop app |
| `src/app/api/v1/upload/merge/route.ts` | Not called by desktop app |
| `src/app/api/v1/import/zip/route.ts` | Wrong schema, not called |
| `src/app/api/v1/import/gallery/route.ts` | Not called |
| `src/app/api/import/pixieset/route.ts` | Platform imports abandoned |
| `src/app/api/import/pixieset-zip/route.ts` | Platform imports abandoned |
| `src/app/api/platforms/pixieset/route.ts` | Platform imports abandoned |
| `src/app/api/platforms/smugmug/route.ts` | Platform imports abandoned |
| `src/app/api/platforms/shootproof/route.ts` | Platform imports abandoned |
| `src/app/api/client/import/route.ts` | Not used |
| `src/lib/services/unified-import-service.ts` | Writes wrong columns (`original_url`, `full_url`) into `gallery_photos` |
| `src/lib/services/zip-stream-service.ts` | Same wrong column issue |
| `src/lib/services/photo-import-service.ts` | Used only by abandoned platform imports |

### Dead Database Objects

| Object | Type | Reason |
|--------|------|--------|
| `galleries` table | Table | 0 rows, no references from live code |
| `set_cover_on_gallery_photo_insert` trigger | Trigger | Updates the dead `galleries` table |

---

## Implementation Phases

### Phase 1: Core Thumbnail Service

**Install dependencies:**
```bash
npm install sharp p-limit
npm install -D @types/sharp
```

Note: `p-limit` v6+ is ESM-only. Use `p-limit@5` for CommonJS compatibility, or use dynamic import.

#### Create: `src/lib/image/thumbnail-service.ts`

```typescript
import sharp from 'sharp'
import { Readable } from 'stream'

export interface ThumbnailResult {
  thumbnailBuffer: Buffer
  mediumBuffer: Buffer
  metadata: {
    width: number
    height: number
    format: string
  }
}

export const THUMBNAIL_CONFIG = {
  thumbnail: { width: 400, quality: 80 },
  medium: { width: 1200, quality: 85, progressive: true },
} as const

/**
 * Generate thumbnail and medium-sized images from an input source.
 *
 * Accepts either a Buffer (preferred, used by both live routes) or a
 * Readable stream (for future use). Streams are converted to Buffer
 * internally before processing because Sharp's clone-based dual-output
 * pipeline requires random access to the source data -- calling
 * .metadata() on a stream consumes it, making subsequent .clone() fail.
 *
 * Pipeline: input -> buffer -> sharp(buffer).rotate() -> clone() x2
 */
export async function generateThumbnails(
  input: Buffer | Readable
): Promise<ThumbnailResult> {
  // Convert stream to buffer if needed (fixes QA Critic C1: metadata() consumes streams)
  const inputBuffer = input instanceof Buffer
    ? input
    : await streamToBuffer(input)

  // Create Sharp instance from buffer, auto-orient based on EXIF
  const baseImage = sharp(inputBuffer).rotate()

  // Get metadata from the oriented image
  const metadata = await baseImage.metadata()

  // Clone for dual output (safe because input is a buffer, not a consumed stream)
  const [thumbnailBuffer, mediumBuffer] = await Promise.all([
    baseImage.clone()
      .resize(THUMBNAIL_CONFIG.thumbnail.width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: THUMBNAIL_CONFIG.thumbnail.quality,
        progressive: false, // Small files (~30KB) don't benefit from progressive
      })
      .toBuffer(),

    baseImage.clone()
      .resize(THUMBNAIL_CONFIG.medium.width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: THUMBNAIL_CONFIG.medium.quality,
        progressive: true, // Larger images (~200KB) benefit from progressive loading
      })
      .toBuffer(),
  ])

  return {
    thumbnailBuffer,
    mediumBuffer,
    metadata: {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      format: metadata.format ?? 'unknown',
    },
  }
}

/**
 * Collect a Readable stream into a single Buffer.
 * Used internally to convert stream inputs before Sharp processing.
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
```

#### Create: `src/lib/image/thumbnail-storage.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js'

export interface StoredThumbnails {
  thumbnailUrl: string
  mediumUrl: string
}

/**
 * Upload pre-generated thumbnail and medium images to Supabase Storage.
 *
 * Path structure mirrors original with size subdirs:
 *   Original: {basePath}/original/{filename}.jpg  (or galleries/{id}/{filename})
 *   Thumb:    {basePath}/thumb/{filename}.jpg
 *   Medium:   {basePath}/medium/{filename}.jpg
 *
 * Uses upsert: true (QA Critic S2) so migration job is idempotent --
 * re-running on already-processed photos safely overwrites thumbnails.
 */
export async function storeThumbnails(
  supabase: SupabaseClient,
  bucket: string,
  basePath: string,
  filename: string,
  thumbnailBuffer: Buffer,
  mediumBuffer: Buffer,
): Promise<StoredThumbnails> {
  const thumbPath = `${basePath}/thumb/${filename}`
  const mediumPath = `${basePath}/medium/${filename}`

  const [thumbResult, mediumResult] = await Promise.all([
    supabase.storage
      .from(bucket)
      .upload(thumbPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      }),
    supabase.storage
      .from(bucket)
      .upload(mediumPath, mediumBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      }),
  ])

  if (thumbResult.error) throw new Error(`Thumbnail upload failed: ${thumbResult.error.message}`)
  if (mediumResult.error) throw new Error(`Medium upload failed: ${mediumResult.error.message}`)

  const { data: { publicUrl: thumbnailUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(thumbPath)

  const { data: { publicUrl: mediumUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(mediumPath)

  return { thumbnailUrl, mediumUrl }
}
```

#### Create: `src/lib/image/process-and-store-thumbnails.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Readable } from 'stream'
import { generateThumbnails } from './thumbnail-service'
import { storeThumbnails, StoredThumbnails } from './thumbnail-storage'
import { logger } from '@/lib/logger'

/**
 * Combined entry point: generate thumbnails from a source and store them.
 *
 * Returns URLs for thumbnail and medium images.
 * On failure, returns null (caller should fall back to original URL).
 * This ensures thumbnail generation can never break an upload.
 */
export async function processAndStoreThumbnails(
  input: Buffer | Readable,
  supabase: SupabaseClient,
  bucket: string,
  basePath: string,
  filename: string,
): Promise<StoredThumbnails | null> {
  try {
    const { thumbnailBuffer, mediumBuffer } = await generateThumbnails(input)

    return await storeThumbnails(
      supabase,
      bucket,
      basePath,
      filename,
      thumbnailBuffer,
      mediumBuffer,
    )
  } catch (error) {
    logger.error('[Thumbnails] Failed to generate/store thumbnails:', {
      bucket,
      basePath,
      filename,
      error: error instanceof Error ? error.message : String(error),
    })
    // Non-fatal: return null, caller uses original URL as thumbnail (status quo)
    return null
  }
}
```

**Key design decisions:**
- `fit: 'inside'` + `withoutEnlargement: true` = proportional scaling, no cropping, no upscale
- Auto-orient via `.rotate()` = fixes EXIF rotation issues
- Accepts `Buffer | Readable` in interface; converts stream to buffer internally (fixes QA Critic C1)
- Non-fatal: returns `null` on failure so upload still succeeds without thumbnails
- `progressive: false` for thumbnails (30KB loads instantly), `progressive: true` for medium (200KB+ benefits)
- Store in same bucket under `thumb/` and `medium/` subdirs (no cross-bucket complexity)
- `upsert: true` makes migration job idempotent (fixes QA Critic S2)

---

### Phase 2: Database Migration

#### Create: `database/add-medium-url-to-gallery-photos.sql`

```sql
-- Add medium_url column to gallery_photos table.
-- The photos table already has medium_url (since original schema).
-- gallery_photos needs it added for web-uploaded photos.
ALTER TABLE gallery_photos
ADD COLUMN IF NOT EXISTS medium_url TEXT;

COMMENT ON COLUMN gallery_photos.medium_url IS
  'Pre-generated 1200px wide JPEG for slideshow/lightbox viewing. NULL for legacy photos.';
```

**No migration needed for `photos` table** -- it already has `medium_url`.

**Schema catalog update:** After migration, update `Stone-Fence-Brain/VENTURES/PhotoVault/PHOTOVAULT_SCHEMA_CATALOG.md` to reflect:
1. Add `medium_url` to `gallery_photos` table definition
2. Fix row counts (`photos`: 622, `gallery_photos`: 90, `galleries`: 0)
3. Update the "which table to use" guidance

---

### Phase 3A: Web Upload Integration

**File:** `src/app/api/photos/upload/route.ts`

This route processes files sequentially in a for loop. Each file is already available as a `File` object, with buffer access via `file.arrayBuffer()`.

**Changes:**

1. Add import at top of file:

```typescript
import { processAndStoreThumbnails } from '@/lib/image/process-and-store-thumbnails'
```

2. Replace lines 85-87 (the TODO comment and `thumbnailUrl = publicUrl`) with:

```typescript
// Generate real thumbnails from the uploaded file buffer
const fileBuffer = Buffer.from(await file.arrayBuffer())
const thumbResult = await processAndStoreThumbnails(
  fileBuffer,
  supabase,
  'photos',
  `${user.id}/${gallery.id}`,
  fileName,
)
const thumbnailUrl = thumbResult?.thumbnailUrl ?? publicUrl
const mediumUrl = thumbResult?.mediumUrl ?? null
```

3. Update the insert object (lines 92-100) to include `medium_url`:

```typescript
const { data: photoData, error: photoError } = await supabase
  .from('gallery_photos')
  .insert({
    gallery_id: gallery.id,
    photo_url: publicUrl,
    thumbnail_url: thumbnailUrl,
    medium_url: mediumUrl,
    original_filename: file.name,
    file_size: file.size,
    is_favorite: false,
    is_private: false
  })
  .select()
  .single()
```

4. Cover image logic (lines 116-117) already uses `photos?.[0]?.thumbnail_url`, which will now be the real 400px thumbnail. No change needed.

**Memory considerations:** Web upload processes files sequentially. One file at a time in Sharp. Even a 40MB photo uses ~400MB for Sharp processing, well within Vercel's 1024MB.

---

### Phase 3B: Desktop Upload Integration

**File:** `src/app/api/v1/upload/process-chunked/route.ts`

This route extracts photos from ZIP files and already has each photo as a `Buffer` (line 83: `Buffer.from(imageData)`). It processes batches of 10 photos in parallel via `Promise.all`.

**Changes:**

1. Add imports at top of file:

```typescript
import { processAndStoreThumbnails } from '@/lib/image/process-and-store-thumbnails'
import pLimit from 'p-limit'
```

2. Add concurrency limiter near the top of the `start()` function:

```typescript
// Limit Sharp processing to 3 concurrent photos (QA Critic S1).
// Storage uploads remain at batch size 10 for throughput.
// 3 photos x ~10MB x 10x Sharp overhead = ~300MB, safe under 1024MB.
const sharpLimit = pLimit(3)
```

3. Inside the `batch.map()` callback (after line 133, after getting `publicUrl`), add thumbnail generation:

```typescript
// Generate thumbnails (concurrency-limited by sharpLimit)
const thumbResult = await sharpLimit(() =>
  processAndStoreThumbnails(
    buffer,
    supabase,
    'photos',
    `galleries/${galleryId}`,
    sanitizedName,
  )
)
```

4. Update the database insert (lines 141-149) to use real thumbnail URLs and add `medium_url`:

```typescript
const { error: photoRecordError } = await supabase
  .from('photos')
  .insert({
    gallery_id: galleryId,
    filename: sanitizedName,
    original_url: publicUrl,
    thumbnail_url: thumbResult?.thumbnailUrl ?? publicUrl,
    medium_url: thumbResult?.mediumUrl ?? null,
    file_size: buffer.length,
  })
```

5. Add SSE progress event for thumbnail generation. After the existing upload progress `send()` call (line 171), add:

```typescript
if (thumbResult) {
  send({ message: `Generated thumbnails for batch...`, progress: Math.floor(uploadProgress) })
}
```

6. Cover image logic (lines 218-225) uses `firstPhotoUrl` which is set from `publicUrl` (the original). Update to use the thumbnail URL for covers:

```typescript
// Track first photo's thumbnail for cover image
if (!firstPhotoUrl) {
  firstPhotoUrl = thumbResult?.thumbnailUrl ?? publicUrl
}
```

Move this assignment to after thumbnail generation (replacing the existing `firstPhotoUrl` assignment at line 136-138).

**Memory analysis with `p-limit(3)`:**
- 3 concurrent Sharp jobs x ~10MB photo x 10x overhead = ~300MB for Sharp
- 10 photo buffers from ZIP extraction = ~100MB (already in memory)
- Total: ~400MB (safe under Vercel's 1024MB default)

---

### Phase 4: Update Rendering

Replace all `getTransformedImageUrl()` calls with direct column references. Handle NULL thumbnails for legacy photos.

#### Fallback Pattern (QA Critic S4 -- NULL check)

For `gallery_photos` (primary query):
```typescript
const thumbnailSrc = photo.thumbnail_url && photo.thumbnail_url !== photo.photo_url
  ? photo.thumbnail_url  // Pre-generated thumbnail
  : photo.photo_url      // Legacy: use original

const mediumSrc = photo.medium_url
  ? photo.medium_url      // Pre-generated medium
  : photo.photo_url       // Legacy: use original
```

For `photos` (fallback query, mapped to `photo_url` by frontend):
```typescript
const thumbnailSrc = photo.thumbnail_url && photo.thumbnail_url !== photo.original_url
  ? photo.thumbnail_url  // Pre-generated thumbnail
  : photo.original_url   // Legacy: use original

const mediumSrc = photo.medium_url
  ? photo.medium_url      // Pre-generated medium
  : photo.original_url    // Legacy: use original
```

The NULL check (`photo.thumbnail_url &&`) is critical because legacy photos in `gallery_photos` may have NULL `thumbnail_url` if the column was never populated, and the inequality check alone (`!== photo.photo_url`) would evaluate `null !== "https://..."` as `true`, resulting in a broken `null` src.

#### Files to Modify

**1. `src/app/gallery/[galleryId]/page.tsx`** (4 call sites)

| Line | Current | After |
|------|---------|-------|
| 760 | `getTransformedImageUrl(photo.photo_url, 'preview')` | `photo.thumbnail_url && photo.thumbnail_url !== photo.photo_url ? photo.thumbnail_url : photo.photo_url` |
| 871 | `getTransformedImageUrl(photo.photo_url, 'preview')` | Same as above |
| 1194 | `getTransformedImageUrl(photo.photo_url, 'thumbnail')` | Same as above |
| 1273 | `getTransformedImageUrl(photo.photo_url, 'medium')` | `photo.medium_url \|\| photo.photo_url` |

Consider extracting a helper at the top of the component:
```typescript
function getThumbnailSrc(photo: { thumbnail_url?: string | null; photo_url: string }): string {
  return photo.thumbnail_url && photo.thumbnail_url !== photo.photo_url
    ? photo.thumbnail_url
    : photo.photo_url
}

function getMediumSrc(photo: { medium_url?: string | null; photo_url: string }): string {
  return photo.medium_url || photo.photo_url
}
```

Note: The `photos` table fallback path in this file maps `original_url` -> `photo_url` in JavaScript (lines 138-175), so the same helper works for both tables.

Also update the data query to include `medium_url` in the select for both `gallery_photos` and `photos` tables.

**2. `src/app/client/favorites/page.tsx`** (2 call sites)

| Line | Current | After |
|------|---------|-------|
| 145 | `getTransformedImageUrl(photo.thumbnail_url \|\| photo.photo_url, 'thumbnail')` | `photo.thumbnail_url && photo.thumbnail_url !== photo.photo_url ? photo.thumbnail_url : photo.photo_url` |
| 229 | `getTransformedImageUrl(photo.photo_url, 'medium')` | `photo.medium_url \|\| photo.photo_url` |

**3. `src/app/client/dashboard/page.tsx`** (1 call site)

| Line | Current | After |
|------|---------|-------|
| 430 | `getTransformedImageUrl(gallery.cover_image_url, 'cover')` | `gallery.cover_image_url` (covers will already be 400px thumbnail URLs after Phase 3 + Phase 5) |

For legacy galleries where `cover_image_url` is still an original URL, the 400px thumbnail won't exist. The browser will load the full original -- same as today without CDN transforms. Acceptable until Phase 5 migration runs.

**4. `src/app/client/timeline/page.tsx`** (1 call site)

| Line | Current | After |
|------|---------|-------|
| 333 | `getTransformedImageUrl(gallery.cover_image_url, 'cover')` | `gallery.cover_image_url` |

Same cover logic as dashboard.

**5. `src/app/family/galleries/page.tsx`** (2 call sites)

| Line | Current | After |
|------|---------|-------|
| 403 | `getTransformedImageUrl(gallery.cover_image_url, 'cover')` | `gallery.cover_image_url` |
| 528 | `getTransformedImageUrl(photo.photo_url, 'preview')` | `photo.thumbnail_url && photo.thumbnail_url !== photo.photo_url ? photo.thumbnail_url : photo.photo_url` |

**6. `src/components/ui/ImageWithFallback.tsx`**

This component currently accepts a `preset` prop and internally calls `getTransformedImageUrl()`. After this change:
- Remove the `preset` prop from the interface
- Remove the `getTransformedImageUrl` import and all transform logic
- The `src` prop will receive the correct pre-sized URL from the parent
- Keep the lazy loading, error handling, and fallback-to-original logic
- The `triedOriginal` retry logic (lines 37, 43, 79-82) becomes unnecessary -- remove it

Alternatively, keep `preset` as an optional prop for backward compatibility during rollout. If `preset` is provided and `src` does not already point to a `/thumb/` or `/medium/` path, fall back to CDN transforms. This makes the transition incremental.

**Recommended approach:** Remove the `preset` prop entirely. All callers will be updated in this phase to pass the correct URL directly. Clean break, no ambiguity.

**7. `src/components/GalleryGrid.tsx`** and **`src/components/gallery/GalleryCard.tsx`**

These pass `preset="cover"` to `ImageWithFallback`. Update to:
- Remove the `preset` prop
- Pass the `cover_image_url` directly as `src` (it will already be a thumbnail URL for new galleries)

#### `getTransformedImageUrl` Disposition

- **Keep** the utility file `src/lib/supabase-image-transforms.ts` and its tests
- **Remove** all imports and calls from the files listed above
- **Add comment** at the top: `// Reserved for future premium CDN tier. Not used in base tier rendering.`
- The utility is correct and tested; preserving it avoids rework if a premium tier adds CDN transforms later

---

### Phase 5: Migrate Existing Photos

#### Create: `src/app/api/admin/migrate-thumbnails/route.ts`

Admin-only batch job to generate thumbnails for the ~700 existing photos that currently have `thumbnail_url === original_url` (or `thumbnail_url === photo_url`).

**Logic:**

```typescript
// 1. Query gallery_photos where thumbnail needs generation
const { data: legacyGalleryPhotos } = await supabase
  .from('gallery_photos')
  .select('id, photo_url, thumbnail_url')
  .or('thumbnail_url.is.null,thumbnail_url.eq.photo_url')

// 2. Query photos where thumbnail needs generation
const { data: legacyPhotos } = await supabase
  .from('photos')
  .select('id, original_url, thumbnail_url')
  .or('thumbnail_url.is.null,thumbnail_url.eq.original_url')

// 3. For each photo:
//    a. Download original from storage
//    b. Generate thumbnails via processAndStoreThumbnails()
//    c. Update DB row with new thumbnail_url and medium_url
//    d. Report progress via SSE

// 4. After all photos processed:
//    Update photo_galleries.cover_image_url for each gallery
//    to use the first photo's new thumbnail_url
```

**Processing strategy:**
- Process in batches of 10, with `p-limit(3)` for Sharp within each batch
- Resume support: skip photos where `thumbnail_url` already differs from original (idempotent with `upsert: true`)
- SSE progress events for monitoring
- Rate limit storage API calls to avoid 429s

**Estimated migration time:**
- ~700 photos x ~2 seconds each = ~23 minutes at sequential processing
- With batching: ~5 minutes

**Path extraction:** To get the `basePath` and `filename` for storage, parse the existing `photo_url` / `original_url`:
```typescript
// photo_url like: https://{project}.supabase.co/storage/v1/object/public/photos/{userId}/{galleryId}/original/{filename}
// Extract: basePath = "{userId}/{galleryId}", filename = "{filename}"
const urlPath = new URL(photoUrl).pathname
const parts = urlPath.split('/photos/')[1]  // everything after bucket name
const segments = parts.split('/')
// For web uploads: segments = [userId, galleryId, "original", filename]
// For desktop uploads: segments = ["galleries", galleryId, filename]
```

---

### Phase 6: Dead Code Cleanup

Delete all files listed in the "Dead Code Deletion" section above. Also:

1. **Drop `galleries` table:**

```sql
-- Drop the inert trigger first
DROP TRIGGER IF EXISTS set_cover_on_gallery_photo_insert ON gallery_photos;
-- Drop the trigger function
DROP FUNCTION IF EXISTS set_gallery_cover_image();
-- Drop the dead table
DROP TABLE IF EXISTS galleries;
```

2. **Remove any imports** referencing deleted files (grep for import paths)

3. **Remove any route registrations** or references in middleware that point to deleted routes

4. **Update schema catalog** to remove `galleries` table

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| **Create** | `src/lib/image/thumbnail-service.ts` | Core Sharp thumbnail/medium generation |
| **Create** | `src/lib/image/thumbnail-storage.ts` | Upload thumbnails to Supabase Storage |
| **Create** | `src/lib/image/process-and-store-thumbnails.ts` | Combined process + store wrapper |
| **Create** | `src/lib/image/__tests__/thumbnail-service.test.ts` | Unit tests for thumbnail generation |
| **Create** | `src/lib/image/__tests__/thumbnail-storage.test.ts` | Unit tests for storage upload |
| **Create** | `src/lib/image/__tests__/process-and-store-thumbnails.test.ts` | Unit tests for combined wrapper |
| **Create** | `database/add-medium-url-to-gallery-photos.sql` | Migration: add medium_url to gallery_photos |
| **Create** | `database/drop-galleries-table.sql` | Migration: drop dead galleries table + trigger |
| **Create** | `src/app/api/admin/migrate-thumbnails/route.ts` | Batch migration for existing ~700 photos |
| **Modify** | `src/app/api/photos/upload/route.ts` | Add thumbnail generation to web upload |
| **Modify** | `src/app/api/v1/upload/process-chunked/route.ts` | Add thumbnail generation to desktop upload |
| **Modify** | `src/app/gallery/[galleryId]/page.tsx` | Replace CDN transforms with direct column refs |
| **Modify** | `src/app/client/favorites/page.tsx` | Replace CDN transforms with direct column refs |
| **Modify** | `src/app/client/dashboard/page.tsx` | Replace CDN transforms with direct column refs |
| **Modify** | `src/app/client/timeline/page.tsx` | Replace CDN transforms with direct column refs |
| **Modify** | `src/app/family/galleries/page.tsx` | Replace CDN transforms with direct column refs |
| **Modify** | `src/components/ui/ImageWithFallback.tsx` | Remove preset prop + CDN transform logic |
| **Modify** | `src/components/GalleryGrid.tsx` | Remove preset prop, pass URL directly |
| **Modify** | `src/components/gallery/GalleryCard.tsx` | Remove preset prop, pass URL directly |
| **Keep** | `src/lib/supabase-image-transforms.ts` | Preserved for future premium CDN tier |
| **Delete** | `src/app/api/v1/upload/process/route.ts` | Dead code |
| **Delete** | `src/app/api/v1/upload/process-fast/route.ts` | Dead code |
| **Delete** | `src/app/api/v1/upload/process-streaming/route.ts` | Dead code |
| **Delete** | `src/app/api/v1/upload/chunked/route.ts` | Dead code |
| **Delete** | `src/app/api/v1/upload/supabase-direct/route.ts` | Dead code |
| **Delete** | `src/app/api/v1/upload/merge/route.ts` | Dead code |
| **Delete** | `src/app/api/v1/import/zip/route.ts` | Dead code |
| **Delete** | `src/app/api/v1/import/gallery/route.ts` | Dead code |
| **Delete** | `src/app/api/import/pixieset/route.ts` | Dead code |
| **Delete** | `src/app/api/import/pixieset-zip/route.ts` | Dead code |
| **Delete** | `src/app/api/platforms/pixieset/route.ts` | Dead code |
| **Delete** | `src/app/api/platforms/smugmug/route.ts` | Dead code |
| **Delete** | `src/app/api/platforms/shootproof/route.ts` | Dead code |
| **Delete** | `src/app/api/client/import/route.ts` | Dead code |
| **Delete** | `src/lib/services/unified-import-service.ts` | Dead code |
| **Delete** | `src/lib/services/zip-stream-service.ts` | Dead code |
| **Delete** | `src/lib/services/photo-import-service.ts` | Dead code |
| **Update** | `PHOTOVAULT_SCHEMA_CATALOG.md` | Reflect medium_url addition + correct row counts |

---

## Dependencies

```bash
# New
npm install sharp p-limit@5
npm install -D @types/sharp

# Already installed
jszip (ZIP extraction in process-chunked)
```

**Sharp on Vercel:** Works out of the box with Node.js runtime. Vercel includes Sharp's native binaries. Next.js already uses Sharp internally for `next/image`.

**p-limit@5:** Version 5 is the last CommonJS-compatible release. Version 6+ is ESM-only. If the project uses ESM throughout, version 6 is fine. Otherwise, use `p-limit@5` or dynamic import: `const pLimit = (await import('p-limit')).default`.

---

## Testing Strategy (TDD)

### Unit Tests

**1. `src/lib/image/__tests__/thumbnail-service.test.ts`**

| Test | Description |
|------|-------------|
| Generates thumbnail at ~400px width | Buffer input, JPEG output, verify width via sharp metadata |
| Generates medium at ~1200px width | Buffer input, JPEG output, verify width |
| Does not enlarge small images | 300px input stays 300px (withoutEnlargement) |
| Auto-orients EXIF rotation | Input with orientation tag, verify output dimensions swapped |
| Progressive JPEG for medium only | Check JPEG markers in output buffers |
| Handles PNG input | PNG -> JPEG conversion |
| Handles WebP input | WebP -> JPEG conversion |
| Handles HEIC input gracefully | Either produces thumbnail OR returns clear error (not crash) |
| Rejects non-image input | Text file -> throws with descriptive message |
| Accepts Readable stream | Stream input -> same output as Buffer input |
| Returns correct metadata | width, height, format fields populated |

**2. `src/lib/image/__tests__/thumbnail-storage.test.ts`**

| Test | Description |
|------|-------------|
| Uploads to correct paths | `{base}/thumb/{file}` and `{base}/medium/{file}` |
| Returns correct public URLs | URLs match expected pattern |
| Uses upsert: true | Verify Supabase client called with upsert: true |
| Handles upload failure | Throws with clear message including which upload failed |
| Works with `photos` bucket | Correct bucket parameter forwarded |

**3. `src/lib/image/__tests__/process-and-store-thumbnails.test.ts`**

| Test | Description |
|------|-------------|
| Buffer -> returns { thumbnailUrl, mediumUrl } | End-to-end happy path |
| Stream -> returns { thumbnailUrl, mediumUrl } | Stream variant |
| Generation failure -> returns null | Mock sharp to throw, verify null returned |
| Storage failure -> returns null | Mock storage to throw, verify null returned |
| Logs errors via logger.error | Verify logger called, NOT console.log |

### Integration Tests

**4. Upload route integration (manual or E2E)**

| Test | Description |
|------|-------------|
| Web upload creates real thumbnails | POST to `/api/photos/upload`, verify `thumbnail_url != photo_url` in DB |
| Web upload populates medium_url | Verify `medium_url` is not null in DB |
| Desktop upload creates real thumbnails | POST to `/api/v1/upload/process-chunked`, verify `thumbnail_url != original_url` |
| Desktop upload populates medium_url | Verify `medium_url` is not null |
| Thumbnail dimensions correct | Download thumbnail, verify width ~400px via Sharp |
| Upload succeeds when Sharp fails | Mock Sharp to throw, verify photo still uploaded with original URL as thumbnail |

---

## Rollout Strategy

1. **Phase 1:** Build thumbnail service + tests (TDD)
2. **Phase 2:** Run migration (add `medium_url` to `gallery_photos`)
3. **Phase 3A:** Integrate into web upload route, test end-to-end
4. **Phase 3B:** Integrate into desktop upload route, test end-to-end
5. **Phase 4:** Update rendering to use direct URLs
6. **Phase 5:** Run migration for existing ~700 photos
7. **Phase 6:** Delete dead code, drop `galleries` table
8. **After migration complete:** Verify CDN transform usage drops to zero on Supabase dashboard

---

## Rollback Strategy

Thumbnails are additive (new files + new column values). Rollback is safe and non-destructive:

1. **Revert rendering code** to use `getTransformedImageUrl()` again (restore `preset` prop on `ImageWithFallback`)
2. **Revert upload routes** to remove `processAndStoreThumbnails()` calls
3. **Thumbnail files** remain in storage (harmless, can be cleaned up later)
4. **`medium_url` column** values can be set to NULL (column itself is harmless to keep)
5. **No data loss**, no destructive changes at any phase

Dead code deletion (Phase 6) is independently rollable via git revert. It has no dependency on the thumbnail feature.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sharp memory on large photos (40MB+) | OOM on Vercel | `p-limit(3)` bounds concurrent Sharp jobs; Vercel 1024MB handles 3x 40MB photos; graceful fallback to original on failure |
| Slow upload (extra 1-2s per photo) | User frustration | Web upload is sequential (one at a time, user sees per-photo progress); Desktop has SSE progress + "Generating thumbnails..." event |
| Migration failure mid-batch | Incomplete data | Resume-friendly with `upsert: true`; skip already-processed photos; legacy photos still render with original URLs |
| Desktop app compatibility | Broken uploads | Server-side only changes; desktop API contract unchanged (same request/response shape) |
| HEIC/RAW not supported by Sharp | Error on exotic formats | Graceful fallback: `processAndStoreThumbnails()` returns null; photo uses original URL (status quo behavior) |
| GIF becomes static JPEG thumbnail | Loss of animation | Acceptable for thumbnails/previews; original GIF preserved for download/lightbox |
| `p-limit` ESM compatibility | Build failure | Use `p-limit@5` (last CommonJS release) or dynamic import |
| Vercel function timeout (60s Pro plan) | Large ZIP batches timeout | SSE streaming extends connection; `p-limit(3)` reduces per-photo time; worst case: some photos don't get thumbnails (non-fatal) |
| Two-table inconsistency | Implementation confusion | Plan explicitly documents both tables, column names, and per-route integration; each route modified independently |
| Cover images for legacy galleries | Covers show full originals | Acceptable until Phase 5 migration; same behavior as current (no CDN transforms = serve original) |

---

## User Decisions (Resolved)

| Question | Decision | Impact on Plan |
|----------|----------|---------------|
| Gallery cover size | Use 400px thumbnail for covers (no third size) | All 4 presets map to 2 sizes |
| Broken services | Delete them | 3 dead services in delete list |
| Platform imports | Dead code -- delete routes | 5 dead routes in delete list |
| Client upload | Future scope -- don't touch | Not in any phase |
| Vercel tier | Pro (60s timeout) | Batch processing viable |
| Dead `galleries` table | Drop table + inert trigger | Phase 6 cleanup |
| Two-table unification | Handle both now, unify as separate project | Each route modified for its own table |

---

## QA Critic v2 Issues (All Resolved)

| Issue | Status | Resolution in v3 |
|-------|--------|-------------------|
| **C1: Sharp pipeline bug** (metadata consumes streams) | Fixed | `generateThumbnails()` converts stream to buffer before Sharp processing. Clone-based dual-output works on buffer. |
| **C2: Routes 2-5 don't write thumbnail_url** | Moot | Routes 2-5 are dead code, deleted in Phase 6. Only 2 live routes remain, both already write `thumbnail_url`. |
| **S1: No concurrency control** | Fixed | `p-limit(3)` added to `process-chunked` batch processing. Web upload is sequential (no concurrency needed). |
| **S2: upsert: false breaks re-runs** | Fixed | `storeThumbnails()` uses `upsert: true`. Migration job is idempotent. |
| **S3: client/upload non-standard columns** | Deferred | Client upload is future scope per user decision. |
| **S4: NULL check in fallback logic** | Fixed | Fallback pattern uses `photo.thumbnail_url && photo.thumbnail_url !== photo.photo_url`. |
| **S5: Missing cover preset** | Fixed | User chose 400px thumbnail for covers. No third size needed. |
| **S6: process-fast bucket discrepancy** | Moot | `process-fast` is dead code, deleted in Phase 6. |
| **M1: 400px vs 300px thumbnail** | Kept 400px | Matches existing CDN preset; consistent with current behavior. |
| **M3: HEIC test** | Added | Test list includes HEIC graceful handling. |
| **M4: GIF handling** | Documented | Risk table notes GIF -> static JPEG for thumbnails. |
| **M5: storage_path/mime_type columns** | Moot | Routes that use those columns are dead code. |
