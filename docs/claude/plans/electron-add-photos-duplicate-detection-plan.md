# Implementation Plan: Add Photos to Existing Gallery with Duplicate Detection

**Date:** 2026-02-02
**Author:** Electron & Desktop Application Expert
**Status:** Draft - Awaiting Review

---

## Summary

This plan covers implementing the "Add More Photos" feature for the PhotoVault Desktop app, allowing photographers to add photos to existing galleries with smart duplicate detection. The feature will detect duplicates by filename, show the user a summary before upload, and only upload new photos. Additionally, we'll unify the fragmented resume/retry systems into a single, robust per-file tracking system.

---

## Current Architecture Analysis

### Desktop App Structure

1. **`main.ts`** - Electron main process
   - Handles IPC communication with renderer
   - Protocol handler (`photovault://`) already accepts `galleryId` parameter
   - Auth store (`SecureAuthStore`) already stores `galleryId` when passed from web
   - `startUpload` IPC handler already accepts optional `galleryId`

2. **`upload-manager.ts`** - Core upload logic
   - `TusUploadManager` class handles chunked uploads
   - Already supports uploading to existing gallery via `galleryId` option
   - Uploads files in 4MB chunks
   - Has two separate state management systems:
     - `queueStore` - Failed uploads queue (electron-store)
     - `upload-state.ts` - Incomplete uploads for resume
   - **Problem:** These systems are separate and the retry button gets stuck at "Retrying..."

3. **`upload-state.ts`** - Resume state persistence
   - Tracks: `uploadId`, `galleryId`, `filePaths`, `completedFiles`, `currentChunk`
   - Per-file tracking exists but is incomplete (doesn't track which specific files succeeded)
   - Only tracks `completedFiles` count, not which files

4. **`preload.ts`** - Context bridge exposing IPC to renderer
   - All necessary methods exposed
   - `AuthCompleteData` already includes optional `galleryId`

5. **`renderer.js`** - UI logic
   - Has separate sections for "Incomplete Uploads" and "Failed Uploads"
   - Retry button disables but never re-enables on failure
   - No "Add to Gallery" mode - always creates new gallery

### Hub API Structure

1. **`/api/v1/upload/prepare`** - Gallery creation/selection
   - Already accepts optional `galleryId` to use existing gallery
   - Verifies ownership before allowing uploads to existing gallery
   - Creates new gallery if `galleryId` not provided

2. **`/api/v1/upload/chunk`** - Chunk upload endpoint
   - Receives 4MB chunks and stores in `gallery-imports` bucket
   - No duplicate detection - just stores chunks

3. **`/api/v1/upload/process-chunked`** - Processes uploaded chunks
   - Merges chunks, extracts ZIPs, uploads to final storage
   - Creates `photos` table records
   - **No duplicate detection currently**

4. **`/api/gallery/[galleryId]`** - Public gallery info
   - Returns gallery metadata and first 6 photos
   - Checks both `gallery_photos` and `photos` tables

### Database Schema

The `photos` table has:
- `filename` - Original filename (sanitized)
- `gallery_id` - Reference to gallery
- Index on `gallery_id`

**Note:** No unique constraint on `(gallery_id, filename)` - duplicates are technically allowed.

---

## Implementation Steps

### Phase 1: Hub API - Get Existing Filenames Endpoint

**New Endpoint:** `GET /api/v1/galleries/[id]/filenames`

Returns all filenames currently in a gallery for duplicate detection.

```typescript
// src/app/api/v1/galleries/[id]/filenames/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: galleryId } = await params
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Verify user owns this gallery
    const { data: gallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .select('id, photographer_id')
      .eq('id', galleryId)
      .eq('photographer_id', user.id)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found or access denied' }, { status: 404 })
    }

    // Get all filenames in this gallery
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('filename')
      .eq('gallery_id', galleryId)

    if (photosError) {
      logger.error('[Filenames] Error fetching photos:', photosError)
      return NextResponse.json({ error: 'Failed to fetch filenames' }, { status: 500 })
    }

    const filenames = photos?.map(p => p.filename) || []

    return NextResponse.json({
      galleryId,
      filenames,
      count: filenames.length
    })

  } catch (error: any) {
    logger.error('[Filenames] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Phase 2: Desktop App - Enhanced Upload State

**Updated `upload-state.ts`** - Per-file success tracking:

```typescript
// src/upload-state.ts - Updated interface
export interface FileUploadStatus {
  path: string
  filename: string
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  errorMessage?: string
  retryCount: number
  completedAt?: number
}

export interface UploadState {
  uploadId: string
  galleryId: string
  galleryName: string
  userId: string
  clientId?: string
  authToken?: string

  // NEW: Per-file tracking
  files: FileUploadStatus[]

  // Deprecated but kept for backwards compat
  filePaths: string[]
  totalFiles: number
  completedFiles: number
  currentFileIndex: number

  // Progress within current file
  currentChunk: number
  totalChunks: number

  // Temp folder for ZIP extraction
  tempFolder?: string
  originalZipPath?: string

  // Timestamps
  startedAt: number
  updatedAt: number

  // Total bytes for progress
  totalSize: number
  bytesUploaded: number
}

/**
 * Mark a specific file as completed
 */
export function markFileStatus(
  uploadId: string,
  filename: string,
  status: 'completed' | 'failed',
  errorMessage?: string
): void {
  const state = loadUploadState(uploadId)
  if (!state) return

  const fileIndex = state.files.findIndex(f => f.filename === filename)
  if (fileIndex >= 0) {
    state.files[fileIndex].status = status
    if (status === 'completed') {
      state.files[fileIndex].completedAt = Date.now()
      state.completedFiles++
    } else if (errorMessage) {
      state.files[fileIndex].errorMessage = errorMessage
      state.files[fileIndex].retryCount++
    }
    saveUploadState(state)
  }
}

/**
 * Get files that need to be uploaded (pending or failed with retries left)
 */
export function getFilesToUpload(uploadId: string, maxRetries = 3): string[] {
  const state = loadUploadState(uploadId)
  if (!state) return []

  return state.files
    .filter(f =>
      f.status === 'pending' ||
      (f.status === 'failed' && f.retryCount < maxRetries)
    )
    .map(f => f.path)
}
```

### Phase 3: Desktop App - Duplicate Detection Logic

**New file: `src/duplicate-detector.ts`**

```typescript
// src/duplicate-detector.ts
import * as path from 'path'
import * as fs from 'fs'
import logger from './logger'

export interface DuplicateCheckResult {
  totalFiles: number
  duplicates: string[]
  newFiles: string[]
  duplicateCount: number
  newCount: number
}

/**
 * Check local files against existing gallery filenames
 */
export function detectDuplicates(
  localFilePaths: string[],
  existingFilenames: string[]
): DuplicateCheckResult {
  const existingSet = new Set(
    existingFilenames.map(f => normalizeFilename(f))
  )

  const duplicates: string[] = []
  const newFiles: string[] = []

  for (const filePath of localFilePaths) {
    const filename = normalizeFilename(path.basename(filePath))

    if (existingSet.has(filename)) {
      duplicates.push(filePath)
    } else {
      newFiles.push(filePath)
    }
  }

  return {
    totalFiles: localFilePaths.length,
    duplicates,
    newFiles,
    duplicateCount: duplicates.length,
    newCount: newFiles.length
  }
}

/**
 * Normalize filename for comparison
 * - Lowercase
 * - Remove special characters (keeping alphanumeric, dots, dashes, underscores)
 */
function normalizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
}

/**
 * Fetch existing filenames from API
 */
export async function fetchGalleryFilenames(
  webUrl: string,
  galleryId: string,
  authToken: string
): Promise<string[]> {
  try {
    const response = await fetch(
      `${webUrl}/api/v1/galleries/${galleryId}/filenames`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    )

    if (!response.ok) {
      logger.error('[DuplicateDetector] Failed to fetch filenames:', response.status)
      return []
    }

    const data = await response.json() as { filenames: string[] }
    return data.filenames || []

  } catch (error) {
    logger.error('[DuplicateDetector] Error fetching filenames:', error)
    return []
  }
}
```

### Phase 4: Desktop App - UI Mode Selection

**Updated `renderer.js`** - Add "Add to Gallery" mode:

```javascript
// New state variable
let uploadMode = 'new' // 'new' or 'add'
let targetGalleryId = null
let targetGalleryName = null

// Listen for gallery context from auth (when user clicks "Add Photos" from web)
window.electronAPI.onAuthComplete((data) => {
  isAuthenticated = true
  currentUserId = data.userId
  updateUIForAuthenticatedState()

  // Check if we're in "add to gallery" mode
  if (data.galleryId) {
    uploadMode = 'add'
    targetGalleryId = data.galleryId
    showAddToGalleryMode(data.galleryId)
  }
})

function showAddToGalleryMode(galleryId) {
  // Update UI to show we're adding to existing gallery
  const modeIndicator = document.getElementById('mode-indicator')
  if (modeIndicator) {
    modeIndicator.innerHTML = `
      <div class="add-mode-banner">
        <span class="icon">+</span>
        <span>Adding photos to existing gallery</span>
        <button id="switch-to-new-mode" class="btn-link">Create new gallery instead</button>
      </div>
    `
    modeIndicator.style.display = 'block'
  }

  // Hide gallery name input since we're using existing gallery
  const galleryNameGroup = document.querySelector('.form-group:has(#gallery-name)')
  if (galleryNameGroup) {
    galleryNameGroup.style.display = 'none'
  }
}

// Updated upload button handler with duplicate detection
uploadBtn.addEventListener('click', async () => {
  if (selectedFiles.length === 0) {
    showError('Please select file(s)')
    return
  }

  // For new gallery mode, require gallery name
  if (uploadMode === 'new' && !galleryNameInput.value.trim()) {
    showError('Please enter a gallery name')
    return
  }

  if (!isAuthenticated || !currentUserId) {
    showError('Please sign in to upload files')
    return
  }

  // If adding to existing gallery, check for duplicates
  if (uploadMode === 'add' && targetGalleryId) {
    showStatus('Checking for duplicates...')

    const duplicateResult = await window.electronAPI.checkDuplicates({
      filePaths: selectedFiles,
      galleryId: targetGalleryId
    })

    if (duplicateResult.duplicateCount > 0) {
      // Show confirmation dialog
      const proceed = await showDuplicateConfirmation(duplicateResult)
      if (!proceed) {
        return
      }

      // Use only new files
      selectedFiles = duplicateResult.newFiles

      if (selectedFiles.length === 0) {
        showStatus('All files already exist in the gallery. Nothing to upload.')
        return
      }
    }
  }

  // Proceed with upload
  hideAlerts()
  uploadBtn.disabled = true
  cancelBtn.disabled = false
  progressContainer.classList.add('visible')

  const result = await window.electronAPI.startUpload({
    filePaths: selectedFiles,
    userId: currentUserId,
    galleryName: uploadMode === 'add' ? targetGalleryName : galleryNameInput.value.trim(),
    platform: 'PhotoVault',
    galleryId: uploadMode === 'add' ? targetGalleryId : undefined
  })

  if (result.success) {
    currentUploadId = result.uploadId
  } else {
    showError(result.error || 'Failed to start upload')
    resetUI()
  }
})

// Show duplicate confirmation dialog
function showDuplicateConfirmation(duplicateResult) {
  return new Promise((resolve) => {
    const dialog = document.createElement('div')
    dialog.className = 'duplicate-dialog'
    dialog.innerHTML = `
      <div class="duplicate-dialog-content">
        <h3>Duplicate Files Detected</h3>
        <p>Found <strong>${duplicateResult.totalFiles}</strong> photos.</p>
        <ul>
          <li><strong>${duplicateResult.duplicateCount}</strong> already exist in the gallery</li>
          <li><strong>${duplicateResult.newCount}</strong> are new</li>
        </ul>
        ${duplicateResult.newCount > 0
          ? `<p>Upload <strong>${duplicateResult.newCount}</strong> new photos?</p>`
          : `<p>All photos already exist. Nothing new to upload.</p>`
        }
        <div class="dialog-buttons">
          ${duplicateResult.newCount > 0
            ? `<button id="dialog-confirm" class="btn-primary">Upload ${duplicateResult.newCount} New Photos</button>`
            : ''
          }
          <button id="dialog-cancel" class="btn-secondary">Cancel</button>
        </div>
      </div>
    `

    document.body.appendChild(dialog)

    document.getElementById('dialog-confirm')?.addEventListener('click', () => {
      document.body.removeChild(dialog)
      resolve(true)
    })

    document.getElementById('dialog-cancel').addEventListener('click', () => {
      document.body.removeChild(dialog)
      resolve(false)
    })
  })
}
```

### Phase 5: Desktop App - IPC Handlers

**Updated `main.ts`** - Add duplicate check handler:

```typescript
// Add new IPC handler for duplicate checking
ipcMain.handle('check-duplicates', async (_event, { filePaths, galleryId }: { filePaths: string[], galleryId: string }): Promise<DuplicateCheckResult> => {
  const auth = authStore.getAuth()

  if (!auth?.token) {
    return {
      totalFiles: filePaths.length,
      duplicates: [],
      newFiles: filePaths,
      duplicateCount: 0,
      newCount: filePaths.length
    }
  }

  // Get web URL from config
  let webUrl = process.env.PHOTOVAULT_WEB_URL || 'https://www.photovault.photo'
  try {
    const config = require('../config.json')
    webUrl = config.photoVaultWebUrl || webUrl
  } catch {}

  // Fetch existing filenames
  const existingFilenames = await fetchGalleryFilenames(webUrl, galleryId, auth.token)

  // Detect duplicates
  return detectDuplicates(filePaths, existingFilenames)
})
```

**Updated `preload.ts`** - Expose new IPC:

```typescript
// Add to contextBridge.exposeInMainWorld
checkDuplicates: (options: { filePaths: string[], galleryId: string }): Promise<{
  totalFiles: number
  duplicates: string[]
  newFiles: string[]
  duplicateCount: number
  newCount: number
}> => ipcRenderer.invoke('check-duplicates', options),
```

### Phase 6: Unified Resume/Retry System

**Problem Statement:**
Currently there are TWO separate systems:
1. `queueStore` in `upload-manager.ts` - "Failed Uploads" queue
2. `upload-state.ts` - "Incomplete Uploads" for resume

The "Retrying..." button gets stuck because the retry handler updates the button text but never re-enables it on failure.

**Solution:** Unify into a single system with per-file tracking.

**Updated `upload-manager.ts`**:

```typescript
// Remove queueStore - use unified UploadState instead

/**
 * Unified retry method - handles both failed and interrupted uploads
 */
async retryUpload(uploadId: string): Promise<string | null> {
  const state = loadUploadState(uploadId)
  if (!state) {
    throw new Error(`No saved state found for upload: ${uploadId}`)
  }

  logger.info('[DESKTOP] Retrying upload', {
    uploadId,
    totalFiles: state.totalFiles,
    completedFiles: state.completedFiles,
    failedFiles: state.files.filter(f => f.status === 'failed').length
  })

  // Get files that need to be uploaded
  const filesToUpload = getFilesToUpload(uploadId)

  if (filesToUpload.length === 0) {
    logger.info('[DESKTOP] No files to upload - all completed or max retries exceeded')
    clearUploadState(uploadId)
    throw new Error('No files to upload - all completed or max retries exceeded')
  }

  // Generate new upload ID for this attempt
  const newUploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Copy state with new ID and reset failed files to pending
  const newState: UploadState = {
    ...state,
    uploadId: newUploadId,
    files: state.files.map(f => ({
      ...f,
      status: f.status === 'failed' ? 'pending' : f.status
    })),
    updatedAt: Date.now()
  }

  saveUploadState(newState)
  clearUploadState(uploadId) // Clear old state

  // Start upload with remaining files
  try {
    await this.startUpload({
      filePaths: filesToUpload,
      userId: state.userId,
      galleryName: state.galleryName,
      platform: 'desktop',
      clientId: state.clientId,
      authToken: state.authToken,
      galleryId: state.galleryId
    })

    return newUploadId
  } catch (error) {
    // Don't delete state on error - let user retry again
    throw error
  }
}
```

**Updated `renderer.js`** - Fix retry button:

```javascript
// Unified retry handler with proper error handling
async function handleRetry(uploadId, btn) {
  const originalText = btn.textContent
  btn.disabled = true
  btn.textContent = 'Retrying...'

  try {
    const result = await window.electronAPI.retryUpload(uploadId)

    if (result.success) {
      showStatus('Upload resumed successfully!')
      refreshUploadList() // Refresh the list
    } else {
      showError(`Retry failed: ${result.error}`)
      // Re-enable button on failure
      btn.disabled = false
      btn.textContent = originalText
    }
  } catch (error) {
    showError(`Retry error: ${error.message}`)
    // Re-enable button on failure
    btn.disabled = false
    btn.textContent = originalText
  }
}

// Attach to retry buttons with proper handler
document.querySelectorAll('.retry-btn, .resume-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const uploadId = e.target.dataset.uploadId || e.target.dataset.id
    handleRetry(uploadId, e.target)
  })
})
```

### Phase 7: Hub Integration - Add Photos from Web

Add "Add More Photos" button to gallery management page that launches desktop app with gallery context.

**Hub page update (`/photographer/galleries/[id]/manage`):**

```tsx
// Add button to trigger desktop app with gallery context
function AddPhotosButton({ galleryId }: { galleryId: string }) {
  const handleAddPhotos = async () => {
    // Try to communicate with desktop app
    const ports = [57123, 57124, 57125, 57126, 57127]
    let desktopAvailable = false

    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}/status`)
        if (response.ok) {
          desktopAvailable = true
          // Send auth to desktop with gallery context
          const authResponse = await fetch(`http://localhost:${port}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: session?.access_token,
              userId: session?.user?.id,
              galleryId: galleryId
            })
          })
          if (authResponse.ok) {
            toast.success('Desktop app opened - select photos to add')
            return
          }
        }
      } catch {}
    }

    // Fallback to protocol handler
    window.location.href = `photovault://add-photos?galleryId=${galleryId}`
  }

  return (
    <button onClick={handleAddPhotos} className="btn-secondary">
      <PlusIcon className="w-4 h-4 mr-2" />
      Add More Photos
    </button>
  )
}
```

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `photovault-hub/src/app/api/v1/galleries/[id]/filenames/route.ts` | API endpoint to get existing filenames |
| `photovault-desktop/src/duplicate-detector.ts` | Duplicate detection logic |

### Modified Files

| File | Changes |
|------|---------|
| `photovault-desktop/src/upload-state.ts` | Add per-file tracking, unified state |
| `photovault-desktop/src/upload-manager.ts` | Remove queueStore, add unified retry, add duplicate check |
| `photovault-desktop/src/main.ts` | Add `check-duplicates` IPC handler, unified retry handler |
| `photovault-desktop/src/preload.ts` | Expose `checkDuplicates` and unified `retryUpload` |
| `photovault-desktop/ui/renderer.js` | Add mode selection, duplicate confirmation dialog, fix retry button |
| `photovault-desktop/ui/index.html` | Add mode indicator, duplicate dialog styles |

---

## Testing Steps

### 1. New API Endpoint

```bash
# Test with valid gallery (should return filenames)
curl -H "Authorization: Bearer <token>" \
  https://www.photovault.photo/api/v1/galleries/<gallery-id>/filenames

# Test with invalid gallery (should return 404)
curl -H "Authorization: Bearer <token>" \
  https://www.photovault.photo/api/v1/galleries/invalid-id/filenames

# Test without auth (should return 401)
curl https://www.photovault.photo/api/v1/galleries/<gallery-id>/filenames
```

### 2. Duplicate Detection

1. Create gallery with 10 photos
2. Select same 10 photos + 5 new ones in desktop app
3. Click "Add to Gallery"
4. Verify dialog shows "10 duplicates, 5 new"
5. Confirm upload
6. Verify only 5 new photos uploaded
7. Check gallery now has 15 photos total

### 3. Resume/Retry System

1. Start upload with 20 photos
2. Kill desktop app mid-upload (after ~5 photos)
3. Reopen desktop app
4. Verify "Incomplete Uploads" section shows the upload
5. Click "Resume"
6. Verify upload continues from where it left off (not from beginning)
7. Verify button re-enables if resume fails

### 4. Add Photos from Web

1. Open gallery management page in web browser
2. Click "Add More Photos" button
3. Verify desktop app opens with gallery context
4. Select photos
5. Verify upload goes to correct gallery
6. Verify duplicate detection works

---

## Edge Cases to Handle

1. **ZIP extraction with duplicates** - When extracting a ZIP, detect duplicates within the ZIP and against existing gallery
2. **Filename collisions** - If user uploads `photo.jpg` and gallery has `photo.jpg`, treat as duplicate
3. **Network interruption during duplicate check** - Fall back to uploading all (user can manually skip)
4. **Gallery deleted between check and upload** - Handle 404 gracefully
5. **Large galleries (1000+ photos)** - Paginate filename fetch if needed
6. **Case sensitivity** - Normalize filenames to lowercase for comparison

---

## Migration Notes

### Backwards Compatibility

The new unified state system includes both old and new fields:
- Old: `filePaths`, `totalFiles`, `completedFiles`, `currentFileIndex`
- New: `files` array with per-file status

On first load, migrate old states:

```typescript
function migrateOldState(state: UploadState): UploadState {
  if (!state.files) {
    // Convert old format to new
    state.files = state.filePaths.map((path, index) => ({
      path,
      filename: path.split('/').pop() || path.split('\\').pop() || 'unknown',
      status: index < state.completedFiles ? 'completed' : 'pending',
      retryCount: 0
    }))
  }
  return state
}
```

---

## Estimated Effort

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1: Filenames API | 1 hour | High |
| Phase 2: Enhanced Upload State | 2 hours | High |
| Phase 3: Duplicate Detection | 1 hour | High |
| Phase 4: UI Mode Selection | 2 hours | High |
| Phase 5: IPC Handlers | 1 hour | High |
| Phase 6: Unified Resume/Retry | 3 hours | High |
| Phase 7: Hub Integration | 2 hours | Medium |
| Testing | 3 hours | High |

**Total: ~15 hours**

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Filename normalization inconsistency | Medium | Use same normalization on both client and server |
| Large galleries slow to load | Low | Add pagination, cache results |
| Race condition during concurrent uploads | Medium | Use atomic database operations |
| Old states incompatible with new format | Low | Add migration logic on load |

---

## Open Questions

1. **Should we support partial duplicate uploads?** (e.g., "Upload duplicates anyway" option)
2. **Should duplicates be logged/tracked?** (for analytics)
3. **Should we add visual diff for potential duplicates?** (show thumbnails side by side)
4. **What's the max retry count before giving up?** (currently 3)

---

## Approval Checklist

- [ ] Technical approach reviewed
- [ ] Database schema changes approved (none required)
- [ ] API contract approved
- [ ] UI/UX flow approved
- [ ] Test plan approved
- [ ] Estimated effort approved
