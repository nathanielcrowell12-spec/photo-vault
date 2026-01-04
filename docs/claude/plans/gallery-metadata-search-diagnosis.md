# Gallery Metadata Search Diagnosis

**Date:** 2026-01-03
**Type:** Root Cause Analysis
**Status:** ROOT CAUSE IDENTIFIED

---

## Summary

Gallery search by location, people, event_type, and notes is not working because the `GalleryEditModal.tsx` saves metadata to a **nested JSON column** (`metadata.location`, `metadata.people`) while the PostgreSQL full-text search trigger reads from **top-level columns** (`location`, `people`, `event_type`, `notes`).

---

## Evidence

### Database Verification

**Query 1: Top-level columns are NULL**
```sql
SELECT location, event_type, people, notes FROM photo_galleries LIMIT 10;
```
**Result:** All 44 galleries have `location = NULL`, `event_type = NULL`, `people = []`, `notes = NULL`

**Query 2: Data exists in nested metadata JSON**
```sql
SELECT id, gallery_name, metadata, location, people
FROM photo_galleries
WHERE metadata->>'location' IS NOT NULL;
```
**Result:**
| gallery_name | metadata | location | people |
|--------------|----------|----------|--------|
| again again | `{"people":["carl"],"location":"Fifth Park"}` | NULL | [] |
| who knows whats the deal | `{"people":[],"location":"Fourth Park"}` | NULL | [] |
| shared galleries | `{"people":["mary","sarah","nate","richard"],"location":"Third Park"}` | NULL | [] |
| here's hoping | `{"people":[],"location":"Second Park 2nd"}` | NULL | [] |

**Key Finding:** Users DID add location/people data via the edit modal, but it went to the wrong place.

### Trigger Function Analysis

The trigger function `update_gallery_search_vector()` reads from TOP-LEVEL columns:
```sql
NEW.search_vector :=
  setweight(to_tsvector('english', coalesce(NEW.gallery_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(NEW.gallery_description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(NEW.location, '')), 'A') ||  -- TOP LEVEL
  setweight(to_tsvector('english', array_to_string(coalesce(NEW.people, '{}'), ' ')), 'A') ||  -- TOP LEVEL
  setweight(to_tsvector('english', coalesce(NEW.event_type, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(NEW.photographer_name, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(NEW.notes, '')), 'C');
```

### Code Analysis

**GalleryEditModal.tsx (lines 162-173):**
```typescript
const updateData: Record<string, unknown> = {
  gallery_name: formData.gallery_name,
  gallery_description: formData.gallery_description,
  photographer_name: formData.photographer_name,
  session_date: formData.session_date || null,
  metadata: {                          // <-- WRONG: nested in metadata
    ...gallery.metadata,
    location: formData.location,        // Should be top-level
    people: peopleArray                 // Should be top-level
  },
  updated_at: new Date().toISOString()
}
```

---

## Root Cause

**Category:** Data Model Mismatch

**Location:** `src/components/GalleryEditModal.tsx`, lines 162-173

**What happens:** The GalleryEditModal saves `location` and `people` into a nested `metadata` JSON object.

**Why it happens:** The component was written before the top-level columns existed, or was incorrectly assuming metadata should be nested.

**Why search fails:** The search trigger reads from `NEW.location` (top-level), not `NEW.metadata->>'location'`.

---

## Uncommitted Code Assessment

### GalleryGrid.tsx
- **Changes:** Added `location`, `event_type`, `people`, `notes` to interface
- **Status:** CORRECT - These map to top-level columns
- **Client-side search:** Uses these fields for local filtering (works IF data exists)

### timeline/page.tsx
- **Changes:** Added server-side search with debounce, passes `q` parameter to API
- **Status:** CORRECT - Properly delegates to API

### api/client/timeline/route.ts
- **Changes:** Added `textSearch('search_vector', searchQuery, {...})`
- **Status:** CORRECT - Uses PostgreSQL full-text search properly
- **Issue:** Won't find anything because search_vector only contains gallery_name/description

---

## Required Fixes

### Fix 1: Update GalleryEditModal.tsx (REQUIRED)

Change from nested metadata to top-level columns:

```typescript
// BEFORE (wrong)
const updateData: Record<string, unknown> = {
  ...
  metadata: {
    ...gallery.metadata,
    location: formData.location,
    people: peopleArray
  },
  ...
}

// AFTER (correct)
const updateData: Record<string, unknown> = {
  gallery_name: formData.gallery_name,
  gallery_description: formData.gallery_description,
  photographer_name: formData.photographer_name,
  session_date: formData.session_date || null,
  location: formData.location || null,           // TOP LEVEL
  people: peopleArray,                           // TOP LEVEL
  event_type: formData.event_type || null,       // Add this field to form
  notes: formData.notes || null,                 // Add this field to form
  updated_at: new Date().toISOString()
}
```

### Fix 2: Add event_type and notes fields to GalleryEditModal (RECOMMENDED)

The trigger supports `event_type` and `notes` but the form doesn't have inputs for them.

### Fix 3: Migrate existing metadata to top-level columns (REQUIRED)

Run migration to copy existing nested data to top-level columns:

```sql
-- Copy location from metadata to top-level column
UPDATE photo_galleries
SET location = metadata->>'location'
WHERE metadata->>'location' IS NOT NULL
  AND (location IS NULL OR location = '');

-- Copy people from metadata to top-level column
UPDATE photo_galleries
SET people = ARRAY(SELECT jsonb_array_elements_text(metadata->'people'))
WHERE metadata->'people' IS NOT NULL
  AND jsonb_array_length(metadata->'people') > 0
  AND (people IS NULL OR array_length(people, 1) IS NULL);

-- Touch records to trigger search_vector update
UPDATE photo_galleries
SET updated_at = NOW()
WHERE (metadata->>'location' IS NOT NULL)
   OR (metadata->'people' IS NOT NULL AND jsonb_array_length(metadata->'people') > 0);
```

### Fix 4: Update Gallery interface in GalleryEditModal (REQUIRED)

The interface reads from `metadata` but should read from top-level:

```typescript
// BEFORE
useEffect(() => {
  if (gallery) {
    setFormData({
      ...
      location: gallery.metadata?.location || '',  // WRONG
      people: gallery.metadata?.people?.join(', ') || '',  // WRONG
      ...
    })
  }
}, [gallery])

// AFTER
useEffect(() => {
  if (gallery) {
    setFormData({
      ...
      location: gallery.location || '',  // CORRECT
      people: gallery.people?.join(', ') || '',  // CORRECT
      ...
    })
  }
}, [gallery])
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/GalleryEditModal.tsx` | Fix save/load to use top-level columns, add event_type/notes fields |
| `src/components/GalleryGrid.tsx` | Update Gallery interface (already partially done) |
| Database migration | Migrate existing metadata to top-level columns |

---

## Testing Steps

1. **Before fix:** Search for "Fifth Park" in timeline - expect 0 results
2. **Run migration** to copy existing metadata
3. **After migration:** Verify search_vector is populated with location data
4. **Edit a gallery:** Add new location via modal
5. **Search again:** Should now find gallery by location
6. **Verify trigger fires:** Check search_vector includes new location term

---

## Rollback Plan

If issues arise:
1. The top-level columns can coexist with metadata
2. No data loss - metadata column is preserved
3. Revert code changes if needed, search just won't work

---

## Gotchas & Warnings

1. **Don't delete metadata column** - Keep it for backward compatibility
2. **Trigger fires on UPDATE** - Must touch rows for search_vector to regenerate
3. **Event_type dropdown values** - Consider standardizing (wedding, family, portrait, etc.)
4. **People is text[]** - Ensure proper array handling in TypeScript

---

## Architecture Note

The schema has BOTH:
- `metadata` JSONB column (flexible, used by some features)
- Top-level columns `location`, `people`, `event_type`, `notes` (for search)

This is intentional - the top-level columns are indexed for full-text search while metadata can store additional flexible data. The code just needs to write to the correct place.
