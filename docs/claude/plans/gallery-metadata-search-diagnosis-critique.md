# Plan Critique: Gallery Metadata Search Diagnosis

**Plan Reviewed:** gallery-metadata-search-diagnosis.md
**Skill Reference:** supabase-skill.md, systematic-debugging-discipline-skill.md
**Date:** 2026-01-03

## Summary Verdict

**APPROVE WITH CONCERNS**

The diagnosis correctly identifies the root cause: metadata is being saved to a nested JSON column while the search trigger reads from top-level columns. The evidence is solid and the fix direction is correct. However, there are concerns about migration safety, missing form fields, and incomplete handling of the Gallery interface types.

## Critical Issues (Must Fix)

### 1. **GalleryGrid Interface Mismatch**
- **What's wrong:** The diagnosis notes GalleryGrid already has `location`, `event_type`, `people`, `notes` in its interface, but doesn't mention that these fields are populated from the API response which currently returns NULL for these fields.
- **Why it matters:** The code changes in GalleryGrid.tsx will "work" but return null values until the modal fix and migration are applied. Client-side search will appear broken during partial deployment.
- **Suggested fix:** Emphasize that ALL fixes must be deployed together, or add fallback to read from `metadata` if top-level is null during transition.

### 2. **Migration Has No Idempotency Guard**
- **What's wrong:** The migration SQL will fail or produce unexpected results if run multiple times.
- **Why it matters:** Migrations should be safe to re-run during development/testing.
- **Suggested fix:** Add idempotency checks:
```sql
-- Only update if top-level is empty AND metadata has data
UPDATE photo_galleries
SET location = metadata->>'location'
WHERE metadata->>'location' IS NOT NULL
  AND metadata->>'location' != ''
  AND (location IS NULL OR location = '');
```

### 3. **People Array Migration May Fail**
- **What's wrong:** The `ARRAY(SELECT jsonb_array_elements_text(...))` syntax may error if `metadata->'people'` is not a valid JSON array.
- **Why it matters:** Some galleries may have malformed metadata, causing migration to fail entirely.
- **Suggested fix:** Add defensive casting and error handling, or run in a transaction with SAVEPOINT.

## Concerns (Should Address)

### 1. **Missing event_type and notes Fields in Form**
- **What's wrong:** The diagnosis mentions adding event_type and notes to the form but doesn't provide the UI code.
- **Why it matters:** Without these fields, users can't populate event_type or notes, limiting search usefulness.
- **Suggested fix:** Include the actual form field additions in the implementation plan:
  - Add event_type dropdown with options: wedding, family, portrait, event, graduation, newborn, other
  - Add notes textarea field

### 2. **Gallery Interface Should Include All Fields**
- **What's wrong:** The plan shows updating `GalleryEditModal.tsx` but the Gallery interface in that file (lines 15-27) only has `metadata?.location` and `metadata?.people` - it doesn't have top-level `location`, `people`, `event_type`, `notes`.
- **Why it matters:** TypeScript will error when trying to read `gallery.location` if the interface doesn't include it.
- **Suggested fix:** Update the Gallery interface:
```typescript
interface Gallery {
  id: string
  gallery_name: string
  gallery_description?: string
  photographer_name?: string
  session_date?: string
  client_id?: string | null
  user_id?: string
  location?: string        // ADD
  people?: string[]        // ADD
  event_type?: string      // ADD
  notes?: string           // ADD
  metadata?: {
    location?: string      // KEEP for backward compat
    people?: string[]
  }
}
```

### 3. **No Consideration of Desktop Uploader**
- **What's wrong:** The diagnosis doesn't check if the desktop uploader also writes to these columns.
- **Why it matters:** If desktop uploads don't populate location/people/event_type, those galleries won't be searchable either.
- **Suggested fix:** Check the `/api/v1/upload/prepare` and `/api/v1/upload/process` endpoints to see if they should also accept metadata.

### 4. **search_vector Regeneration Not Automatic**
- **What's wrong:** The migration touches `updated_at` to fire the trigger, but the diagnosis doesn't confirm the trigger fires on UPDATE (not just INSERT).
- **Why it matters:** If trigger only fires on INSERT, migration won't regenerate search_vector.
- **Suggested fix:** The evidence shows the trigger fires on "INSERT and UPDATE" so this is fine, but add explicit verification step to testing.

## Minor Notes (Consider)

- The plan doesn't specify which Next.js client to use for the Supabase update. Ensure using browser client (respects RLS) not admin client.
- Consider adding an index on the `search_vector` column for faster GIN searches: `CREATE INDEX IF NOT EXISTS idx_photo_galleries_search ON photo_galleries USING GIN(search_vector);`
- The `notes` field maps to weight 'C' in the trigger (lowest priority) - consider if this is intentional.

## Questions for the User

1. **Should event_type be a free-form text field or a dropdown with predefined options?** The trigger treats it as text, but a dropdown would ensure consistent values for filtering.

2. **Should the migration be a formal migration file (in `/database/migrations/`) or a one-time script?** If formal, it needs proper naming: `20260103_migrate_metadata_to_columns.sql`

3. **What should happen to the `metadata` column after migration?** Keep it for flexibility, or deprecate it?

## What the Plan Gets Right

- **Evidence-based diagnosis:** The plan shows actual database queries proving the root cause, not guesswork
- **Follows systematic debugging discipline:** Observed data first, then traced to code
- **Clear fix steps:** The four fixes are specific and actionable
- **Rollback plan included:** Acknowledges metadata column can coexist
- **Correct trigger analysis:** Accurately identifies that trigger reads top-level columns
- **Acknowledges architecture intent:** Notes that having both metadata and top-level columns is intentional

## Recommendation

1. **Revise Fix 1 & 4 together:** Provide complete code diff including interface updates
2. **Add defensive checks to migration SQL:** Handle edge cases in array conversion
3. **Add event_type and notes form fields:** Don't leave half the searchable fields unpopulated
4. **Verify search_vector regeneration in testing:** Add explicit test step

Once these concerns are addressed, proceed with implementation. The core diagnosis is solid.
