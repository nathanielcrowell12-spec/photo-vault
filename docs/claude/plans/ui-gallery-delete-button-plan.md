# Gallery Delete Button Implementation Plan

**Date:** December 21, 2025
**Task:** Add DELETE button for galleries with confirmation dialog
**API Status:** ✅ DELETE endpoint exists at `/api/galleries/[id]` (soft delete with 30-day retention)
**Deleted page:** ✅ `/client/deleted` page exists for viewing and restoring

---

## Research Summary

### Current State Analysis

**Backend (Already Complete):**
- ✅ DELETE API endpoint: `src/app/api/galleries/[id]/route.ts` (lines 48-77)
- ✅ Soft delete via database trigger (sets `status='deleted'`, `deleted_at=NOW()`)
- ✅ 30-day retention before permanent deletion
- ✅ Restore API: POST to same endpoint (lines 5-46)
- ✅ Deleted galleries page: `src/app/client/deleted/page.tsx`

**Frontend (Missing Delete Button):**
- ❌ No delete button in `src/components/GalleryGrid.tsx` (photographer/client grid view)
- ❌ No delete button in `src/components/gallery/GalleryCard.tsx` (simpler card component)
- ❌ No delete button in `/photographer/galleries/page.tsx` (photographer-specific galleries page)

### Where Galleries Are Displayed

1. **`src/components/GalleryGrid.tsx`** (lines 1-535)
   - Used by both photographers and clients
   - Has Edit button (lines 470-482)
   - Has Share button for clients (lines 454-469)
   - Location: Edit button already exists in card info section
   - **BEST LOCATION TO ADD DELETE BUTTON** (most comprehensive component)

2. **`src/components/gallery/GalleryCard.tsx`** (lines 1-132)
   - Simpler card component
   - Has Edit button for photographers (lines 99-107)
   - Used for quick gallery previews

3. **`src/app/photographer/galleries/page.tsx`** (lines 1-482)
   - Photographer-only page with DropdownMenu (lines 357-400)
   - Already has View, Upload, Edit, Resend actions
   - Delete would fit naturally here too

---

## Design Decisions

### 1. Button Placement Strategy

**Primary Implementation: `GalleryGrid.tsx`**
- Add delete button next to the existing Edit button
- Only show for gallery owners (photographer who created it, or client who uploaded it)
- Icon-only button to save space (trash icon)

**Secondary Implementation: Photographer Galleries Page**
- Add "Delete Gallery" to the existing DropdownMenu
- More prominent action since photographers manage many galleries

### 2. Confirmation Dialog Design

Following shadcn/ui patterns and PhotoVault's aesthetic:

```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Gallery?</AlertDialogTitle>
      <AlertDialogDescription>
        This will move "{galleryName}" to Recently Deleted. You can restore it
        within 30 days. After that, it will be permanently removed.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        variant="destructive"
        onClick={handleDelete}
      >
        Delete Gallery
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 3. UI/UX Considerations

**Information Hierarchy:**
- Title: "Delete Gallery?" (clear, action-oriented)
- Description: Explains what happens (soft delete, 30-day retention, restore option)
- Actions: Cancel (outline) + Delete Gallery (destructive red)

**User Guidance:**
- Mention 30-day retention period
- Link to "Recently Deleted" page in success toast
- Show gallery name in confirmation for clarity

**Error Handling:**
- Show error toast if delete fails
- Don't remove from UI until server confirms deletion
- Optimistic update after confirmation for immediate feedback

---

## Implementation Plan

### Part 1: Add Delete Button to GalleryGrid.tsx

**File:** `src/components/GalleryGrid.tsx`

**Changes needed:**

1. **Import AlertDialog components** (add to top of file after existing imports):
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react' // Add to existing lucide imports
```

2. **Add state for delete confirmation** (after line 51 where editingGallery state is):
```tsx
const [deletingGallery, setDeletingGallery] = useState<Gallery | null>(null)
const [showDeleteDialog, setShowDeleteDialog] = useState(false)
```

3. **Add delete handler function** (after the `filterAndSortGalleries` function, around line 195):
```tsx
const handleDeleteGallery = async (gallery: Gallery) => {
  try {
    const response = await fetch(`/api/galleries/${gallery.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete gallery')
    }

    // Remove from local state
    setGalleries(prev => prev.filter(g => g.id !== gallery.id))

    // Show success message
    toast({
      title: 'Gallery deleted',
      description: `"${gallery.gallery_name}" has been moved to Recently Deleted. You have 30 days to restore it.`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/client/deleted'
            }
          }}
        >
          View Deleted
        </Button>
      ),
    })

    setShowDeleteDialog(false)
    setDeletingGallery(null)
  } catch (error) {
    console.error('Error deleting gallery:', error)
    toast({
      title: 'Error',
      description: 'Failed to delete gallery. Please try again.',
      variant: 'destructive',
    })
  }
}
```

4. **Add Delete button in the card info section** (after the Edit button, around line 482):
```tsx
{!isLocked && (
  <div className="flex items-center">
    {/* Existing Share button code */}
    {!isPhotographer && isPaymentActive && (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 ml-2"
        onClick={(e) => {
          e.stopPropagation()
          if (typeof window !== 'undefined') {
            window.location.href = `/client/gallery/${gallery.id}/share`
          }
        }}
        title="Share gallery"
      >
        <Share2 className="h-3 w-3" />
      </Button>
    )}
    {/* Existing Edit button */}
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 ml-2"
      onClick={(e) => {
        e.stopPropagation()
        setEditingGallery(gallery)
        setShowEditModal(true)
      }}
      title="Edit gallery info"
    >
      <Edit className="h-3 w-3" />
    </Button>
    {/* NEW: Delete button */}
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
      onClick={(e) => {
        e.stopPropagation()
        setDeletingGallery(gallery)
        setShowDeleteDialog(true)
      }}
      title="Delete gallery"
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  </div>
)}
```

5. **Add AlertDialog component** (after the GalleryEditModal, around line 531):
```tsx
{/* Gallery Delete Confirmation Dialog */}
<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Gallery?</AlertDialogTitle>
      <AlertDialogDescription>
        This will move "{deletingGallery?.gallery_name}" to Recently Deleted.
        You can restore it within 30 days. After that, it will be permanently removed.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => {
        setShowDeleteDialog(false)
        setDeletingGallery(null)
      }}>
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction
        className="bg-red-600 hover:bg-red-700"
        onClick={() => {
          if (deletingGallery) {
            handleDeleteGallery(deletingGallery)
          }
        }}
      >
        Delete Gallery
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Part 2: Add Delete to Photographer Galleries DropdownMenu

**File:** `src/app/photographer/galleries/page.tsx`

**Changes needed:**

1. **Import Trash2 icon** (add to existing lucide imports on line 24):
```tsx
import { Trash2 } from 'lucide-react'
```

2. **Import AlertDialog components** (after existing UI imports):
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
```

3. **Add state for delete confirmation** (after line 81):
```tsx
const [deletingGallery, setDeletingGallery] = useState<Gallery | null>(null)
const [showDeleteDialog, setShowDeleteDialog] = useState(false)
```

4. **Add delete handler** (after line 238, after `handleResendNotification`):
```tsx
const handleDeleteGallery = async (gallery: Gallery) => {
  try {
    const response = await fetch(`/api/galleries/${gallery.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete gallery')
    }

    // Refresh gallery list
    await searchGalleries()

    toast({
      title: 'Gallery deleted',
      description: `"${gallery.gallery_name}" has been moved to Recently Deleted. You have 30 days to restore it.`,
    })

    setShowDeleteDialog(false)
    setDeletingGallery(null)
  } catch (error) {
    console.error('Error deleting gallery:', error)
    toast({
      title: 'Error',
      description: 'Failed to delete gallery. Please try again.',
      variant: 'destructive',
    })
  }
}
```

5. **Add Delete menu item in DropdownMenu** (after the "Resend Notification" item, around line 398):
```tsx
<DropdownMenuItem
  className="text-red-600 hover:text-red-700 focus:text-red-700 cursor-pointer"
  onClick={() => {
    setDeletingGallery(gallery)
    setShowDeleteDialog(true)
  }}
>
  <Trash2 className="h-4 w-4 mr-2" />
  Delete Gallery
</DropdownMenuItem>
```

6. **Add AlertDialog** (at the bottom of the component, after the gallery grid, around line 479):
```tsx
{/* Delete Confirmation Dialog */}
<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  <AlertDialogContent className="bg-slate-800 border-border">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-foreground">Delete Gallery?</AlertDialogTitle>
      <AlertDialogDescription className="text-muted-foreground">
        This will move "{deletingGallery?.gallery_name}" to Recently Deleted.
        You can restore it within 30 days. After that, it will be permanently removed.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel
        className="border-slate-600 text-foreground hover:bg-slate-700"
        onClick={() => {
          setShowDeleteDialog(false)
          setDeletingGallery(null)
        }}
      >
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction
        className="bg-red-600 hover:bg-red-700 text-white"
        onClick={() => {
          if (deletingGallery) {
            handleDeleteGallery(deletingGallery)
          }
        }}
      >
        Delete Gallery
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Testing Steps

### 1. Visual Testing
- [ ] Verify delete button appears next to edit button in GalleryGrid
- [ ] Verify delete button has red color hover state
- [ ] Verify delete option appears in photographer galleries dropdown
- [ ] Verify confirmation dialog displays correctly
- [ ] Verify dialog shows gallery name
- [ ] Verify 30-day retention message is clear

### 2. Functionality Testing
- [ ] Click delete button → confirmation dialog opens
- [ ] Click "Cancel" → dialog closes, gallery remains
- [ ] Click "Delete Gallery" → gallery removed from view
- [ ] Success toast appears with "View Deleted" action button
- [ ] Click "View Deleted" in toast → navigates to `/client/deleted`
- [ ] Deleted gallery appears in Recently Deleted page
- [ ] Can restore from Recently Deleted page

### 3. Error Handling
- [ ] Disconnect internet, try delete → error toast appears
- [ ] Gallery remains in list if delete fails
- [ ] Error message is user-friendly

### 4. Permissions Testing
- [ ] Photographer can delete their own galleries
- [ ] Client can delete their self-uploaded galleries
- [ ] Cannot delete galleries owned by others (API handles this via `user_id` check)

### 5. Edge Cases
- [ ] Delete gallery with 0 photos
- [ ] Delete gallery with 1000+ photos
- [ ] Delete multiple galleries in sequence
- [ ] Delete while other operations are in progress

---

## Design Rationale

### Why AlertDialog instead of Dialog?
- AlertDialog is semantically correct for destructive confirmations
- Better keyboard navigation (Enter/Escape work intuitively)
- Screen reader announces as an alert
- Follows WCAG 2.1 AA accessibility guidelines

### Why Icon-Only Button in GalleryGrid?
- Space constraint: cards already have Share + Edit buttons
- Visual hierarchy: Delete is less common action than Edit
- Trash icon is universally recognized
- Hover tooltip provides text label for clarity

### Why Full Menu Item in Photographer Page?
- More space available in dropdown
- Photographers manage many galleries (need clarity)
- Destructive action deserves explicit label
- Red text color signals danger

### Why Show Gallery Name in Confirmation?
- Prevents accidental deletion of wrong gallery
- Builds user confidence
- Follows best practices from macOS, Google Drive, Dropbox

---

## Visual Mockup (Text)

### GalleryGrid Card (After Implementation)

```
┌─────────────────────────────────────────┐
│  [Cover Image]                          │
│                                         │
│  Gallery Name                [S] [E] [D]│
│  Description text                       │
│  📷 25 photos • 📅 Dec 20              │
└─────────────────────────────────────────┘

Legend:
[S] = Share button (gray)
[E] = Edit button (gray)
[D] = Delete button (red on hover)
```

### Confirmation Dialog

```
┌─────────────────────────────────────────┐
│  Delete Gallery?                        │
│                                         │
│  This will move "Summer Wedding 2024"  │
│  to Recently Deleted. You can restore  │
│  it within 30 days. After that, it     │
│  will be permanently removed.          │
│                                         │
│         [Cancel]  [Delete Gallery]     │
└─────────────────────────────────────────┘
```

---

## Success Criteria

✅ Delete button visible on all gallery cards
✅ Confirmation dialog prevents accidental deletion
✅ Soft delete (30-day retention) communicated clearly
✅ Success toast with link to Recently Deleted
✅ Gallery removed from view after deletion
✅ Error handling for failed deletions
✅ Accessible (keyboard navigation, screen reader support)
✅ Follows PhotoVault design patterns (semantic colors, shadcn/ui composition)

---

## Files to Modify

1. **`src/components/GalleryGrid.tsx`** (~80 lines added)
   - Import AlertDialog components
   - Add delete state and handler
   - Add delete button next to edit button
   - Add AlertDialog at end of component

2. **`src/app/photographer/galleries/page.tsx`** (~60 lines added)
   - Import AlertDialog components
   - Add delete state and handler
   - Add "Delete Gallery" to DropdownMenu
   - Add AlertDialog at end of component

**No new files created. No backend changes needed.**

---

## Notes

- The DELETE API already handles authorization (checks `user_id`)
- No need to check permissions client-side - server enforces it
- Toast notification uses shadcn/ui's sonner toast (already configured)
- AlertDialog follows PhotoVault's dark theme automatically via semantic tokens
- Delete button color uses `text-red-600` (shadcn destructive variant)
- Photographer galleries page uses different styling (slate-800 background) - dialog matches

---

**End of Plan**
