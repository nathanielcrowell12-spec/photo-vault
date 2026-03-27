# Desktop Resume UI & Delete Gallery Bug Fix Plan

**Created:** January 22, 2026
**Expert:** Electron & Desktop App Expert + Supabase Expert
**Status:** Ready for Implementation

---

## Summary

This plan addresses two features requested by the user:

1. **Resume Upload UI** - Add UI to the desktop app that shows incomplete uploads and allows resuming to the SAME gallery (not creating a new gallery)
2. **Delete Gallery Bug Fix** - Fix the issue where deleting empty/incomplete galleries doesn't work

---

## Story 1: Desktop App Resume Upload UI

### Problem Statement

The user was uploading a gallery with 137 photos. The upload was interrupted, resulting in only 83 photos in the gallery. The desktop app has backend support for resuming uploads (`resumeUpload()` function exists in `upload-manager.ts`), but **the UI does not expose this capability**.

Currently:
- Clicking "Start Upload" creates a **NEW** gallery instead of resuming the existing one
- Users have no way to see incomplete uploads
- Users have no way to resume to the same gallery

### Current State Analysis

**Backend Already Supports Resume:**

1. **`src/upload-state.ts`** - Persists upload state to electron-store:
   ```typescript
   interface UploadState {
     uploadId: string
     galleryId: string      // Existing gallery ID
     filePaths: string[]     // All files to upload
     completedFiles: number  // How many already uploaded
     totalFiles: number      // Total file count
     userId: string
     galleryName: string
     tempFolder: string
     platform: string
     createdAt: string
     updatedAt: string
   }
   ```

2. **`src/upload-manager.ts`** (lines 560-625) - Has `resumeUpload()` function:
   ```typescript
   async resumeUpload(uploadId: string): Promise<string> {
     const state = loadUploadState(uploadId)
     // Get remaining files to upload
     const remainingFilePaths = state.filePaths.slice(state.completedFiles)
     // Resume by starting upload with remaining files to existing gallery
     const newUploadId = await this.startUpload({
       filePaths: remainingFilePaths,
       userId: state.userId,
       galleryName: state.galleryName,
       platform: 'desktop',
       galleryId: state.galleryId  // Uses existing gallery!
     })
     return newUploadId
   }
   ```

3. **`src/preload.ts`** (lines 65-72) - Already exposes IPC methods:
   ```typescript
   getIncompleteUploads: (): Promise<unknown[]> => ipcRenderer.invoke('get-incomplete-uploads'),
   resumeIncompleteUpload: (uploadId: string): Promise<{ success: boolean; uploadId?: string; error?: string }> =>
     ipcRenderer.invoke('resume-incomplete-upload', uploadId),
   cancelIncompleteUpload: (uploadId: string): Promise<{ success: boolean }> =>
     ipcRenderer.invoke('cancel-incomplete-upload', uploadId),
   onIncompleteUploads: (callback: (uploads: unknown[]) => void): void => {
     ipcRenderer.on('incomplete-uploads', (_event, uploads: unknown[]) => callback(uploads))
   },
   ```

**UI Does NOT Expose Resume:**

4. **`ui/renderer.js`** - Searched for "incomplete" - **no matches found**
   - The UI only has a "Start Upload" button that creates new galleries
   - No section showing incomplete uploads
   - No "Resume" button

### Implementation Plan

#### Step 1: Add Incomplete Uploads UI Section to `ui/index.html`

Add after the file selection area (before progress container):

```html
<!-- Incomplete Uploads Section -->
<div id="incomplete-uploads-section" class="incomplete-uploads-section" style="display: none;">
  <h3>📋 Incomplete Uploads</h3>
  <p class="section-description">These uploads were interrupted. Click "Resume" to continue where you left off.</p>
  <div id="incomplete-uploads-list" class="incomplete-uploads-list"></div>
</div>
```

Add CSS styling:

```css
.incomplete-uploads-section {
  margin: 20px 0;
  padding: 15px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
}

.incomplete-uploads-section h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #856404;
}

.section-description {
  margin: 0 0 15px 0;
  font-size: 13px;
  color: #6c757d;
}

.incomplete-upload-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
  margin-bottom: 10px;
  border: 1px solid #e0e0e0;
}

.incomplete-upload-info {
  flex: 1;
}

.incomplete-upload-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
}

.incomplete-upload-info p {
  margin: 0;
  font-size: 12px;
  color: #6c757d;
}

.incomplete-upload-actions {
  display: flex;
  gap: 8px;
}

.resume-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.resume-btn:hover {
  background: #218838;
}

.discard-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.discard-btn:hover {
  background: #c82333;
}
```

#### Step 2: Add JavaScript Logic to `ui/renderer.js`

Add at the end of `DOMContentLoaded` listener:

```javascript
// ===== INCOMPLETE UPLOADS MANAGEMENT =====
const incompleteUploadsSection = document.getElementById('incomplete-uploads-section')
const incompleteUploadsList = document.getElementById('incomplete-uploads-list')

// Check for incomplete uploads on app start
async function checkIncompleteUploads() {
  try {
    const incompleteUploads = await window.electronAPI.getIncompleteUploads()

    if (incompleteUploads && incompleteUploads.length > 0) {
      incompleteUploadsSection.style.display = 'block'
      renderIncompleteUploads(incompleteUploads)
    } else {
      incompleteUploadsSection.style.display = 'none'
    }
  } catch (error) {
    console.error('Error checking incomplete uploads:', error)
  }
}

// Render incomplete uploads list
function renderIncompleteUploads(uploads) {
  incompleteUploadsList.innerHTML = uploads.map(upload => {
    const completedCount = upload.completedFiles || 0
    const totalCount = upload.totalFiles || upload.filePaths?.length || 0
    const remainingCount = totalCount - completedCount
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    const lastUpdated = upload.updatedAt ? new Date(upload.updatedAt).toLocaleDateString() : 'Unknown'

    return `
      <div class="incomplete-upload-item" data-upload-id="${upload.uploadId}">
        <div class="incomplete-upload-info">
          <h4>${upload.galleryName || 'Untitled Gallery'}</h4>
          <p>${completedCount} of ${totalCount} files uploaded (${progress}%) • ${remainingCount} remaining</p>
          <p style="font-size: 11px; color: #999;">Last activity: ${lastUpdated}</p>
        </div>
        <div class="incomplete-upload-actions">
          <button class="resume-btn" data-upload-id="${upload.uploadId}">▶ Resume</button>
          <button class="discard-btn" data-upload-id="${upload.uploadId}">✕ Discard</button>
        </div>
      </div>
    `
  }).join('')

  // Attach event listeners to buttons
  attachIncompleteUploadHandlers()
}

// Attach click handlers for resume/discard buttons
function attachIncompleteUploadHandlers() {
  // Resume buttons
  document.querySelectorAll('.resume-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const uploadId = e.target.dataset.uploadId
      btn.disabled = true
      btn.textContent = 'Resuming...'

      try {
        const result = await window.electronAPI.resumeIncompleteUpload(uploadId)

        if (result.success) {
          showAlert('success', 'Upload resumed! Continuing where you left off...')
          // Refresh the incomplete uploads list
          checkIncompleteUploads()
        } else {
          showAlert('danger', `Failed to resume: ${result.error}`)
          btn.disabled = false
          btn.textContent = '▶ Resume'
        }
      } catch (error) {
        console.error('Error resuming upload:', error)
        showAlert('danger', 'Error resuming upload. Please try again.')
        btn.disabled = false
        btn.textContent = '▶ Resume'
      }
    })
  })

  // Discard buttons
  document.querySelectorAll('.discard-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const uploadId = e.target.dataset.uploadId

      if (confirm('Are you sure you want to discard this incomplete upload? This will NOT delete the gallery or photos already uploaded.')) {
        btn.disabled = true
        btn.textContent = 'Discarding...'

        try {
          const result = await window.electronAPI.cancelIncompleteUpload(uploadId)

          if (result.success) {
            showAlert('info', 'Incomplete upload discarded. The gallery with existing photos remains on the server.')
            checkIncompleteUploads()
          } else {
            showAlert('danger', 'Failed to discard upload.')
            btn.disabled = false
            btn.textContent = '✕ Discard'
          }
        } catch (error) {
          console.error('Error discarding upload:', error)
          btn.disabled = false
          btn.textContent = '✕ Discard'
        }
      }
    })
  })
}

// Helper to show alerts (reuse existing showAlert if available, otherwise create)
function showAlert(type, message) {
  // Check if there's an existing alert function
  if (typeof window.showStatusMessage === 'function') {
    window.showStatusMessage(type, message)
    return
  }

  // Fallback: create alert element
  const existingAlert = document.querySelector('.alert-message')
  if (existingAlert) {
    existingAlert.remove()
  }

  const alert = document.createElement('div')
  alert.className = `alert-message alert-${type}`
  alert.textContent = message
  alert.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    z-index: 1000;
    background: ${type === 'success' ? '#28a745' : type === 'danger' ? '#dc3545' : '#17a2b8'};
  `
  document.body.appendChild(alert)

  setTimeout(() => alert.remove(), 5000)
}

// Listen for updates from main process
window.electronAPI.onIncompleteUploads((uploads) => {
  if (uploads && uploads.length > 0) {
    incompleteUploadsSection.style.display = 'block'
    renderIncompleteUploads(uploads)
  } else {
    incompleteUploadsSection.style.display = 'none'
  }
})

// Check on page load
checkIncompleteUploads()
```

#### Step 3: Verify Backend IPC Handlers in `src/main.ts`

Check that these handlers exist (they should based on preload.ts):

```typescript
// These should already exist - verify and add if missing:
ipcMain.handle('get-incomplete-uploads', async () => {
  return getIncompleteUploads() // From upload-state.ts
})

ipcMain.handle('resume-incomplete-upload', async (event, uploadId: string) => {
  try {
    const newUploadId = await uploadManager.resumeUpload(uploadId)
    return { success: true, uploadId: newUploadId }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('cancel-incomplete-upload', async (event, uploadId: string) => {
  try {
    clearUploadState(uploadId) // From upload-state.ts
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})
```

### Files to Modify

| File | Changes |
|------|---------|
| `photovault-desktop/ui/index.html` | Add incomplete uploads section HTML + CSS |
| `photovault-desktop/ui/renderer.js` | Add JavaScript logic for resume UI |
| `photovault-desktop/src/main.ts` | Verify IPC handlers exist (likely already there) |

### Testing Checklist

- [ ] Start an upload, then close the app mid-upload
- [ ] Reopen the app - incomplete upload section should appear
- [ ] Click "Resume" - upload should continue to SAME gallery
- [ ] Click "Discard" - incomplete upload should be removed from list
- [ ] Complete an upload - it should NOT appear in incomplete list

### Acceptance Criteria

- [ ] Incomplete uploads section visible when there are interrupted uploads
- [ ] Shows gallery name, progress (X of Y files), remaining count
- [ ] "Resume" button continues upload to the same gallery (not new gallery)
- [ ] "Discard" button removes from tracking without deleting server data
- [ ] Section hides when no incomplete uploads exist

---

## Story 2: Delete Gallery Bug Fix

### Problem Statement

The user reported that the delete feature doesn't work for empty or incomplete galleries. They tried to delete a "messed up" empty gallery multiple times but it wouldn't delete.

### Investigation Required

Before implementing a fix, the sub-agent needs to investigate:

1. **Which delete endpoint is being called?**
   - Search for files containing "delete gallery" or similar
   - Likely candidates:
     - `/api/galleries/[id]/route.ts` (DELETE method)
     - `/api/photographer/galleries/[id]/route.ts`
     - `/api/client/galleries/[id]/route.ts`

2. **What error is being returned?**
   - Check browser Network tab when delete is clicked
   - Check server logs for errors
   - Common issues:
     - RLS policy blocking delete
     - Foreign key constraint (cascade not set up)
     - Missing permissions

3. **Database constraints to check:**
   ```sql
   -- Check if cascade delete is set up
   SELECT
     tc.constraint_name,
     tc.table_name,
     kcu.column_name,
     rc.delete_rule
   FROM information_schema.table_constraints tc
   JOIN information_schema.key_column_usage kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.referential_constraints rc
     ON tc.constraint_name = rc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY'
   AND (tc.table_name = 'gallery_photos' OR tc.table_name = 'photo_galleries');
   ```

4. **RLS policies to check:**
   ```sql
   -- Check delete policies on photo_galleries
   SELECT polname, polcmd, qual
   FROM pg_policies
   WHERE tablename = 'photo_galleries' AND polcmd = 'd';
   ```

### Common Root Causes

Based on common patterns, the issue is likely one of:

1. **Missing CASCADE on foreign key** - `gallery_photos` references `photo_galleries`, but delete doesn't cascade
   - Fix: Add `ON DELETE CASCADE` to foreign key

2. **RLS policy missing DELETE permission** - Policy allows SELECT but not DELETE
   - Fix: Add DELETE policy for gallery owner

3. **Additional tables referencing gallery** - Other tables like `gallery_sharing`, `gallery_downloads` may block delete
   - Fix: Add CASCADE to all FK references

4. **Soft delete vs hard delete** - Code might be using soft delete (setting `deleted_at`) but not hiding deleted galleries
   - Fix: Either implement soft delete properly OR use hard delete

### Investigation Steps for Sub-Agent

```bash
# 1. Find all files with delete gallery logic
grep -r "delete" --include="*.ts" --include="*.tsx" | grep -i gallery

# 2. Find the delete API endpoint
grep -r "DELETE" --include="*.ts" src/app/api/

# 3. Check photo_galleries table structure
# In Supabase SQL Editor:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'photo_galleries';

# 4. Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'photo_galleries';
```

### Files Likely Involved

Based on previous grep search (6 files found):

1. `src/app/api/galleries/[id]/route.ts` - Main gallery API (likely has DELETE)
2. `src/app/photographer/galleries/page.tsx` - Photographer gallery list UI
3. `src/components/GalleryEditModal.tsx` - Gallery edit/delete modal
4. `src/app/client/dashboard/page.tsx` - Client dashboard (may have delete)
5. Database migration files in `database/` folder

### Implementation (After Investigation)

Once root cause is identified, the fix will likely be one of:

**If RLS policy issue:**
```sql
-- Add DELETE policy for gallery owner
CREATE POLICY "Users can delete own galleries"
ON photo_galleries
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

**If foreign key cascade issue:**
```sql
-- Modify FK to cascade deletes
ALTER TABLE gallery_photos
DROP CONSTRAINT gallery_photos_gallery_id_fkey,
ADD CONSTRAINT gallery_photos_gallery_id_fkey
  FOREIGN KEY (gallery_id) REFERENCES photo_galleries(id)
  ON DELETE CASCADE;
```

**If additional tables block delete:**
```sql
-- Add cascade to all FK references
ALTER TABLE gallery_sharing
DROP CONSTRAINT IF EXISTS gallery_sharing_gallery_id_fkey,
ADD CONSTRAINT gallery_sharing_gallery_id_fkey
  FOREIGN KEY (gallery_id) REFERENCES photo_galleries(id)
  ON DELETE CASCADE;

ALTER TABLE gallery_downloads
DROP CONSTRAINT IF EXISTS gallery_downloads_gallery_id_fkey,
ADD CONSTRAINT gallery_downloads_gallery_id_fkey
  FOREIGN KEY (gallery_id) REFERENCES photo_galleries(id)
  ON DELETE CASCADE;
```

### Testing Checklist

- [ ] Delete a gallery with photos - photos should also be deleted
- [ ] Delete an empty gallery - should succeed
- [ ] Delete an incomplete/draft gallery - should succeed
- [ ] Verify deleted gallery doesn't appear in any lists
- [ ] Verify Supabase Storage files are cleaned up (if applicable)

### Acceptance Criteria

- [ ] Empty galleries can be deleted successfully
- [ ] Incomplete galleries can be deleted successfully
- [ ] No orphaned records left after gallery delete
- [ ] Delete works for both photographers AND clients (if applicable)
- [ ] Clear error message if delete fails for legitimate reason

---

## Implementation Order

1. **Story 2 (Delete Bug) FIRST** - This is blocking the user right now
   - Investigate root cause
   - Apply fix
   - Test all delete scenarios

2. **Story 1 (Resume UI) SECOND** - Nice-to-have feature
   - Add HTML/CSS to index.html
   - Add JavaScript to renderer.js
   - Verify IPC handlers
   - Test resume flow

---

## File Summary

### Story 1 Files (Resume UI)
| File | Action |
|------|--------|
| `photovault-desktop/ui/index.html` | ADD incomplete uploads section |
| `photovault-desktop/ui/renderer.js` | ADD resume UI JavaScript |
| `photovault-desktop/src/main.ts` | VERIFY IPC handlers exist |

### Story 2 Files (Delete Bug)
| File | Action |
|------|--------|
| `photovault-hub/src/app/api/galleries/[id]/route.ts` | INVESTIGATE & MAYBE FIX |
| `database/migrations/*.sql` | ADD CASCADE if needed |
| Supabase SQL Editor | ADD RLS policy if needed |

---

## Notes for Sub-Agent

1. **Follow the debugging discipline** - Don't guess, investigate the actual error
2. **Check server logs** - Use `mcp__supabase__get_logs` with service: 'api' or 'postgres'
3. **Test in isolation** - Use Supabase SQL Editor to test queries directly
4. **Document findings** - Update this plan with root cause before implementing fix
5. **Version bump desktop app** - If UI changes made, bump to 1.0.3

---

**End of Plan**
