# Client Ratings System - Complete Implementation Plan

## Summary

PhotoVault needs a client ratings system where clients can rate their photographer experience after receiving galleries. The **UI and API code are already built**, but the **database table does not exist**.

### Current State

| Component | Status | Location |
|-----------|--------|----------|
| Client Rating UI | Complete | `src/app/client/rate/[galleryId]/page.tsx` |
| Client Rating API | Complete | `src/app/api/client/rating/route.ts` |
| Photographer Feedback UI | Complete | `src/app/photographer/feedback/page.tsx` |
| Photographer Ratings API | Complete | `src/app/api/photographer/ratings/route.ts` |
| Dashboard Stats Integration | Complete | `src/app/api/photographer/stats/route.ts` (line 66-81) |
| **Database Table** | **MISSING** | Need to apply migration |
| Schema SQL File | EXISTS | `database/client-ratings-schema.sql` |

### What's Missing

1. The `client_ratings` table does not exist in production
2. No "Rate" button/link visible to clients from their gallery view
3. No email prompt sent to clients after gallery delivery

---

## 1. Database Schema

The SQL file at `database/client-ratings-schema.sql` is **well-designed** and ready to apply. Key features:

### Table Structure

```sql
CREATE TABLE client_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  gallery_id UUID REFERENCES photo_galleries(id) ON DELETE SET NULL,

  -- Rating fields (1-5 scale)
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),

  -- Status: 'published' | 'hidden' | 'flagged'
  status TEXT NOT NULL DEFAULT 'published',

  -- Photographer response
  photographer_response TEXT,
  response_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes

- `idx_client_ratings_photographer` - Fast lookup by photographer
- `idx_client_ratings_client` - Fast lookup by client
- `idx_client_ratings_gallery` - Fast lookup by gallery
- `idx_client_ratings_status` - Filter by status

### Unique Constraints (One Rating Per Gallery)

```sql
-- One rating per client per gallery (when gallery_id is not null)
CREATE UNIQUE INDEX idx_client_ratings_unique_gallery
  ON client_ratings(client_id, gallery_id)
  WHERE gallery_id IS NOT NULL;

-- One rating per client-photographer pair (when no gallery specified)
CREATE UNIQUE INDEX idx_client_ratings_unique_no_gallery
  ON client_ratings(client_id, photographer_id)
  WHERE gallery_id IS NULL;
```

---

## 2. RLS Policies

The existing schema file includes RLS policies. Here's the analysis:

### Current Policies in Schema File

| Policy | For | Rule |
|--------|-----|------|
| `photographers_view_own_ratings` | SELECT | `photographer_id = auth.uid()` |
| `photographers_respond_to_ratings` | UPDATE | `photographer_id = auth.uid()` |
| `clients_view_own_ratings` | SELECT | Client's `user_id = auth.uid()` |
| `clients_create_ratings` | INSERT | Client's `user_id = auth.uid()` |
| `clients_update_own_ratings` | UPDATE | Within 30 days of creation |
| `service_role_all_access` | ALL | For API service role access |

### Issue Found: Photographer UPDATE Policy is Too Permissive

The current policy allows photographers to update ANY column on their ratings. It should be restricted to only:
- `photographer_response`
- `response_at`

### Recommended Fix

Replace the photographer update policy:

```sql
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "photographers_respond_to_ratings" ON client_ratings;

-- Create a more restrictive policy using a function
CREATE OR REPLACE FUNCTION check_photographer_response_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow changes to response fields, not the rating itself
  IF NEW.rating != OLD.rating
     OR NEW.review_text IS DISTINCT FROM OLD.review_text
     OR NEW.communication_rating IS DISTINCT FROM OLD.communication_rating
     OR NEW.quality_rating IS DISTINCT FROM OLD.quality_rating
     OR NEW.timeliness_rating IS DISTINCT FROM OLD.timeliness_rating
     OR NEW.status != OLD.status
     OR NEW.client_id != OLD.client_id
     OR NEW.gallery_id IS DISTINCT FROM OLD.gallery_id
     OR NEW.photographer_id != OLD.photographer_id
  THEN
    RAISE EXCEPTION 'Photographers can only update response fields';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER enforce_photographer_response_only
  BEFORE UPDATE ON client_ratings
  FOR EACH ROW
  WHEN (auth.uid() = OLD.photographer_id)
  EXECUTE FUNCTION check_photographer_response_update();

-- Simple policy for photographer updates
CREATE POLICY "photographers_respond_to_ratings" ON client_ratings
  FOR UPDATE
  USING (photographer_id = auth.uid())
  WITH CHECK (photographer_id = auth.uid());
```

**Alternative (simpler):** Since the API already uses service role for updates, keep the existing RLS but rely on API-level enforcement (which is already implemented correctly in `src/app/api/photographer/ratings/route.ts`).

---

## 3. Client Rating Flow Design

### When Can Clients Rate?

**Immediately after payment/gallery access is granted.**

The current UI at `/client/rate/[galleryId]` checks:
1. User is authenticated
2. User has a `clients` record with matching `user_id`
3. Gallery exists in `photo_galleries`

### Where is the Rating UI?

| Location | Current State | Recommendation |
|----------|---------------|----------------|
| `/client/rate/[galleryId]` | Complete | Keep as-is |
| Gallery view page | No link | **Add "Rate Experience" button** |
| Client dashboard | No link | **Add "Rate" badges on unrated galleries** |
| Email after gallery delivery | Not implemented | **Phase 2** |

### Preventing Duplicate Ratings

The unique constraint `idx_client_ratings_unique_gallery` enforces this at the database level. The API also checks for existing ratings and updates instead of inserting.

---

## 4. Required Changes

### Phase 1: Apply Migration (CRITICAL)

Apply the existing schema file via Supabase MCP:

```sql
-- Contents of database/client-ratings-schema.sql
-- (Already reviewed and approved)
```

### Phase 2: Add Rating Link to Gallery View

**File:** `src/app/gallery/[galleryId]/page.tsx`

Add a "Rate Your Experience" button visible to clients who:
1. Have access to the gallery
2. Are the gallery's client (not just share link viewers)

**Suggested location:** In the gallery header or as a floating action button.

```tsx
// Add to imports
import { Star } from 'lucide-react'

// Add in the gallery header area (when client has access)
{hasAccess && userType === 'client' && (
  <Button asChild variant="outline" className="gap-2">
    <Link href={`/client/rate/${gallery.id}`}>
      <Star className="w-4 h-4" />
      Rate Experience
    </Link>
  </Button>
)}
```

### Phase 3: Add Rating Indicator to Client Dashboard

**File:** `src/app/client/dashboard/page.tsx`

Show which galleries have been rated and which haven't:

1. Fetch rating status in the `/api/client/stats` endpoint
2. Display a "Rate" badge on unrated galleries in the gallery grid

---

## 5. API Analysis

### Client Rating API (`/api/client/rating/route.ts`)

**GET:** Checks if client has rated a gallery
- Returns `hasRated`, `canRate`, `existingRating`

**POST:** Submits or updates a rating
- Validates rating 1-5
- Gets client record from `user_id`
- Gets photographer from gallery
- Upserts rating (update if exists, insert if new)

**Status:** Complete and correct. Uses service role client for database access.

### Photographer Ratings API (`/api/photographer/ratings/route.ts`)

**GET:** Fetches all ratings for authenticated photographer
- Calculates stats (averages, distribution)
- Joins with clients for email display
- Only counts 'published' status for stats

**POST:** Photographer responds to a rating
- Verifies photographer owns the rating
- Updates `photographer_response` and `response_at`

**Status:** Complete and correct.

### Dashboard Stats (`/api/photographer/stats/route.ts`)

**Lines 66-81:** Already queries `client_ratings` table
- Gracefully handles table not existing (returns 0)
- Only counts 'published' ratings

**Status:** Complete and correct.

---

## 6. Files to Create/Modify

### Files to Modify

| File | Change |
|------|--------|
| `src/app/gallery/[galleryId]/page.tsx` | Add "Rate Experience" button for clients |
| `src/app/client/dashboard/page.tsx` | Show rating status on galleries (optional) |

### No New Files Needed

All API endpoints and UI pages already exist.

### Migration to Apply

Run via Supabase MCP:
```
mcp__supabase__apply_migration
  name: "create_client_ratings_table"
  query: <contents of database/client-ratings-schema.sql>
```

---

## 7. Testing Steps

### Pre-Implementation

1. Verify table doesn't exist:
   ```sql
   SELECT * FROM information_schema.tables
   WHERE table_name = 'client_ratings';
   ```

### Apply Migration

2. Apply the migration via Supabase MCP
3. Verify table created:
   ```sql
   SELECT column_name, data_type FROM information_schema.columns
   WHERE table_name = 'client_ratings';
   ```

### Test Client Rating Flow

4. Log in as a client with a gallery
5. Navigate to `/client/rate/[galleryId]`
6. Submit a rating with:
   - Overall rating: 5
   - Communication: 4
   - Quality: 5
   - Timeliness: 4
   - Review text: "Test review"
7. Verify rating saved:
   ```sql
   SELECT * FROM client_ratings;
   ```

### Test Photographer View

8. Log in as the photographer
9. Navigate to `/photographer/feedback`
10. Verify rating appears with correct data
11. Submit a response to the rating
12. Verify response saved:
    ```sql
    SELECT photographer_response, response_at FROM client_ratings;
    ```

### Test Dashboard Stats

13. Navigate to `/photographer/dashboard`
14. Verify `clientRating` stat shows correct average

### Test Duplicate Prevention

15. Try to submit another rating for the same gallery
16. Verify it updates the existing rating (not creates duplicate)

### Test RLS

17. As photographer, try to access a rating for a different photographer
18. Verify access denied

---

## 8. Status Values

| Status | Meaning | Who Can Set |
|--------|---------|-------------|
| `published` | Default, visible to photographer and public profiles | System (on create) |
| `hidden` | Client hid their own review | Client |
| `flagged` | Reported for review | Admin/System |

The current implementation auto-publishes all ratings. A "hide my review" feature could be added later.

---

## 9. Security Considerations

1. **RLS is enabled** - Photographers can only see their own ratings
2. **Service role used for writes** - API handles validation
3. **Trigger for response-only updates** - Optional, API already enforces this
4. **No sensitive data exposed** - Client emails are fetched server-side only

---

## 10. Future Enhancements (Not in Scope)

1. **Email prompt:** Send rating request email X days after gallery delivery
2. **Rating reminders:** Notify clients who haven't rated
3. **Public profiles:** Display aggregate ratings on photographer directory
4. **Admin moderation:** Dashboard to review flagged ratings
5. **Verified purchase badge:** Show ratings are from real clients

---

## Implementation Checklist

- [ ] Apply `client_ratings` table migration
- [ ] Verify RLS policies are working
- [ ] Test client rating submission
- [ ] Test photographer view/response
- [ ] Test dashboard stats integration
- [ ] Add "Rate Experience" button to gallery view (optional, Phase 2)
- [ ] Add rating badges to client dashboard (optional, Phase 2)

---

*Plan created: 2026-01-04*
*Based on codebase analysis of photovault-hub*
