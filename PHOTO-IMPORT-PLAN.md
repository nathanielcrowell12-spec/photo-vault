# Photo Import & Gallery Viewer - Implementation Plan

## Current Problem
- Gallery tile has no thumbnail
- Clicking "View Gallery" takes user to external Pixieset site
- Requires password to view photos
- Photos are not saved to our database

## Required Solution
Users should be able to:
1. ✅ See gallery thumbnails on dashboard
2. ✅ Click gallery to open **internal gallery viewer page**
3. ✅ View photos in two modes:
   - **Grid/Tile View**: All photos laid out
   - **Slideshow View**: One photo at a time with next/prev
4. ✅ Copy/paste photos from both views
5. ✅ Close slideshow viewer to return to grid
6. ✅ All photos stored in **our database**, not linking back to source

## Implementation Phases

### Phase 1: Photo Import System ✅ (STARTING)
**Goal**: Download photos from Pixieset and save to Supabase

Components:
- [ ] Create Supabase Storage bucket for photos
- [ ] Build Pixieset API integration (or web scraping)
- [ ] Create photo import queue system
- [ ] Save photos to Supabase Storage
- [ ] Save photo metadata to `gallery_photos` table
- [ ] Generate thumbnails for each photo
- [ ] Update gallery cover_image_url with first photo

### Phase 2: Gallery Viewer Page ✅
**Goal**: Internal page to view gallery photos

Components:
- [ ] Create `/gallery/[galleryId]` route
- [ ] Fetch gallery and photos from database
- [ ] Build Grid View component
- [ ] Build Slideshow/Lightbox component
- [ ] Add view mode toggle (Grid ↔ Slideshow)
- [ ] Add navigation (back to dashboard)

### Phase 3: Photo Display Features ✅
**Goal**: Rich viewing experience

Components:
- [ ] Grid View:
  - Responsive photo grid
  - Photo selection
  - Copy/download functionality
  - Lazy loading for performance
  
- [ ] Slideshow View:
  - Full-screen photo viewer
  - Next/Previous navigation
  - Keyboard shortcuts (arrow keys, ESC to close)
  - Copy/download functionality
  - Photo counter (e.g., "5 of 150")
  - Zoom in/out

### Phase 4: Background Import ✅
**Goal**: Import photos without blocking UI

Components:
- [ ] Import status indicator on gallery card
- [ ] Progress bar showing import completion
- [ ] Background job to import photos
- [ ] Real-time updates when photos are imported

## Technical Architecture

### Database Tables (Already Created)
```sql
galleries (
  id, user_id, gallery_name, platform, gallery_url, 
  gallery_password, photo_count, cover_image_url, 
  is_imported, import_started_at, import_completed_at
)

gallery_photos (
  id, gallery_id, photo_url, thumbnail_url, 
  original_filename, file_size, width, height, 
  taken_at, is_favorite, metadata
)
```

### Supabase Storage Structure
```
buckets/
  photos/
    {user_id}/
      {gallery_id}/
        original/
          photo-1.jpg
          photo-2.jpg
        thumbnails/
          photo-1-thumb.jpg
          photo-2-thumb.jpg
```

### Routes
```
/dashboard                    → Gallery grid (existing)
/gallery/[galleryId]         → Gallery viewer page (NEW)
/api/import/pixieset         → Import photos API (NEW)
/api/photos/[photoId]        → Serve photo (NEW)
```

## Development Priority

### Immediate (Today):
1. ✅ Create Supabase Storage buckets
2. ✅ Build basic photo import for Pixieset
3. ✅ Create gallery viewer page with grid view
4. ✅ Update gallery card click to go to internal page

### Short-term (This Week):
5. Add slideshow/lightbox viewer
6. Add copy/download functionality
7. Generate thumbnails
8. Update gallery cards with thumbnails

### Medium-term (Next Week):
9. Background import queue
10. Import progress indicators
11. Support for other platforms (SmugMug, ShootProof)
12. Photo organization features (favorites, tags)

## Challenges & Solutions

### Challenge 1: Accessing Pixieset Photos
**Problem**: Pixieset requires password, may not have public API

**Solutions**:
- Option A: Use Pixieset API if available
- Option B: Web scraping with gallery URL + password
- Option C: Ask user to download and upload manually (last resort)

### Challenge 2: Storage Costs
**Problem**: Storing 150 photos per gallery = lots of storage

**Solutions**:
- Compress photos to reasonable quality
- Generate smaller thumbnails
- Use Supabase Storage (25GB free, then $0.021/GB)
- Only import on-demand (when user first views gallery)

### Challenge 3: Import Time
**Problem**: Importing 150 photos takes time

**Solutions**:
- Background job processing
- Show progress indicator
- Import in batches
- Allow viewing as photos import

## Next Steps

Starting with Phase 1 - Photo Import System
Let's begin by creating the Supabase storage buckets and building the import infrastructure.

