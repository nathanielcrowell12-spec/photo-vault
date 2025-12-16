# Gallery Eye Button Routing Fix - Research Plan

**Date:** December 11, 2025
**Researcher:** Claude Code (Shadcn/UI & Tailwind Expert Agent)
**Issue:** Eye icon button on `/photographer/clients` page incorrectly links to `/photographer/galleries/[id]` which returns 404

---

## Summary

The Eye icon button next to each gallery on the `/photographer/clients` page is currently linking to `/photographer/galleries/${gallery.id}` (line 462), but this route **does not exist**. The photographer should be redirected to the **public gallery viewer** at `/gallery/[id]` instead, which is the established pattern used throughout the application.

---

## Research Findings

### 1. Current Routes That Exist

I searched the entire photographer-related codebase and found these routes:

**Photographer Gallery Routes:**
```
/photographer/galleries/page.tsx              # Main galleries list page
/photographer/galleries/create/page.tsx       # Create new gallery
/photographer/galleries/[id]/upload/page.tsx  # Upload photos to gallery
/photographer/galleries/[id]/sneak-peek-select/page.tsx  # Select sneak peek
```

**Public Gallery Routes:**
```
/gallery/[galleryId]/page.tsx                 # Public gallery viewer (CLIENT-FACING)
```

**IMPORTANT:** There is **NO** `/photographer/galleries/[id]/page.tsx` route. This is the 404 you're seeing.

### 2. How the Main Galleries Page Handles Viewing

I examined `/photographer/galleries/page.tsx` (lines 360-364) and found the dropdown menu actions:

```tsx
<DropdownMenuItem
  className="text-slate-300 hover:text-white focus:text-white cursor-pointer"
  onClick={() => router.push(`/gallery/${gallery.id}`)}
>
  <Eye className="h-4 w-4 mr-2" />
  View Gallery
</DropdownMenuItem>
```

**Key Finding:** The "View Gallery" action on the main galleries page routes to `/gallery/${gallery.id}`, NOT `/photographer/galleries/${gallery.id}`.

### 3. Other Gallery Actions in the Main Galleries Page

The main galleries page also provides these actions:

- **View Gallery:** `/gallery/${gallery.id}` (public viewer)
- **Upload Photos:** `/photographer/galleries/${gallery.id}/upload`
- **Edit Details:** `/photographer/galleries/${gallery.id}/edit` ⚠️ (This route also doesn't exist!)
- **Resend Notification:** API call to `/api/email/gallery-ready`

### 4. Quick Action Buttons (Below Gallery Cards)

Lines 449-467 show two quick action buttons:

```tsx
<Button onClick={() => router.push(`/gallery/${gallery.id}`)}>
  <ExternalLink className="h-3 w-3 mr-1" />
  View
</Button>
<Button onClick={() => router.push(`/photographer/galleries/${gallery.id}/upload`)}>
  <Upload className="h-3 w-3 mr-1" />
  Upload
</Button>
```

**Pattern:** "View" goes to `/gallery/[id]`, "Upload" goes to `/photographer/galleries/[id]/upload`

### 5. Understanding the `/gallery/[id]` Route

This is the **public gallery viewer** (lines 67-1065 of `/gallery/[galleryId]/page.tsx`). Key capabilities:

- **Photographer Access:** If `userType === 'photographer'` and `gallery.photographer_id === user.id`, they get full access (line 170-176)
- **Features for Photographers:**
  - View all photos in grid/slideshow
  - Download photos
  - Share gallery
  - Manual upload option (if photos not imported yet)
- **Access Control:** Built-in RLS checks and paywall logic for clients

**This is the CORRECT route for photographers to view their own galleries.**

---

## What the Eye Icon SHOULD Do

### Recommendation: Link to `/gallery/${gallery.id}`

**Reasoning:**

1. **Consistency:** The main `/photographer/galleries` page uses `/gallery/[id]` for "View Gallery"
2. **Functionality:** The `/gallery/[id]` route provides everything a photographer needs:
   - Full photo grid
   - Slideshow/lightbox
   - Download capabilities
   - Share functionality
   - Manual upload option
3. **Access Control:** The route already handles photographer authentication and grants full access
4. **No Need for Separate Route:** There's no reason to create `/photographer/galleries/[id]/page.tsx` when the public viewer already serves this purpose with proper auth checks

### Alternative Option (NOT Recommended): Create `/photographer/galleries/[id]/page.tsx`

This would require:
- Creating a new page component
- Duplicating the gallery viewer logic
- Managing separate auth/RLS checks
- Maintaining two codebases for the same functionality

**This is unnecessary** because the public viewer already handles photographer access perfectly.

---

## Exact Code Change Needed

### File to Modify

**`src/app/photographer/clients/page.tsx`**

### Current Code (Line 461-465)

```tsx
<Button size="sm" variant="ghost" asChild className="text-neutral-400 hover:text-white">
  <Link href={`/photographer/galleries/${gallery.id}`}>
    <Eye className="h-4 w-4" />
  </Link>
</Button>
```

### Fixed Code

```tsx
<Button size="sm" variant="ghost" asChild className="text-neutral-400 hover:text-white">
  <Link href={`/gallery/${gallery.id}`}>
    <Eye className="h-4 w-4" />
  </Link>
</Button>
```

**Change:** `photographer/galleries` → `gallery`

---

## Additional Issues Found

### Issue 2: "Edit Details" Route Also Doesn't Exist

In `/photographer/galleries/page.tsx` (line 374), there's another broken route:

```tsx
<DropdownMenuItem
  onClick={() => router.push(`/photographer/galleries/${gallery.id}/edit`)}
>
  <Edit className="h-4 w-4 mr-2" />
  Edit Details
</DropdownMenuItem>
```

**Problem:** `/photographer/galleries/[id]/edit/page.tsx` does not exist.

**Recommendation:** Either:
1. Create this route (if editing gallery metadata is needed)
2. Remove this menu item (if editing isn't a priority)

---

## Testing Steps

After making the fix:

1. **Start dev server:**
   ```bash
   npm run dev -- -p 3002
   ```

2. **Login as photographer:**
   - Navigate to http://localhost:3002/photographer/clients

3. **Expand a client with galleries:**
   - Click chevron to expand client
   - Verify galleries are listed

4. **Click the Eye icon:**
   - Should navigate to `/gallery/[id]`
   - Should show full gallery viewer
   - Photographer should have full access (no paywall)

5. **Verify functionality:**
   - Photo grid displays
   - Can open lightbox/slideshow
   - Can download photos
   - Can share gallery

---

## Files to Modify

### Required Fix
- `src/app/photographer/clients/page.tsx` (line 462)

### Optional Fix (Separate Issue)
- `src/app/photographer/galleries/page.tsx` (line 374) - Either create `/photographer/galleries/[id]/edit` route or remove menu item

---

## Summary for Implementation

**Problem:** Eye button links to non-existent `/photographer/galleries/[id]` route

**Solution:** Change link to `/gallery/${gallery.id}`

**Justification:**
- Matches existing pattern in `/photographer/galleries` page
- Public gallery viewer already handles photographer authentication
- Provides all necessary functionality (view, download, share)
- Avoids creating duplicate code

**Implementation Complexity:** Trivial (one-line change)

**Testing Complexity:** Low (manual click testing)

**Risk:** None (public viewer already handles this use case)

---

**End of Research Plan**
