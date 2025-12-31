# Electron Upload Redirect Implementation Plan

## Problem Statement

After a successful upload, the PhotoVault desktop app displays a success message but does **NOT** redirect the user to the gallery page where they can view photos and mark the gallery as ready. The user is left on the upload screen with no clear next action.

**Current behavior (ui/renderer.js:276-288):**
- `upload-complete` event fires
- Success message shown
- Form resets after 3 seconds
- **No redirect to gallery**

**Desired behavior:**
- After upload completes, open user's default browser to the gallery page
- URL should be `/gallery/{galleryId}` (public gallery view)
- Use secure IPC pattern (no direct shell access from renderer)

---

## Research Findings

### Current Upload Flow

1. **Desktop app → Hub API** (`/api/v1/upload/prepare`)
   - Creates gallery in database
   - Returns `galleryId` and signed upload URL
   - Located in: `photovault-hub/src/app/api/v1/upload/prepare/route.ts`

2. **Desktop app uploads files** (TUS chunked upload)
   - Streams files in 6MB chunks to Supabase Storage
   - Upload manager: `photovault-desktop/src/upload-manager.ts`

3. **Upload completes**
   - Upload manager emits `'complete'` event with `uploadId`
   - Main process forwards to renderer: `upload-complete` event
   - **MISSING:** `galleryId` is NOT included in the event data

4. **Renderer receives event** (ui/renderer.js:276-288)
   - Shows success message
   - Resets UI
   - **Does nothing else**

### Key Files & Architecture

| File | Purpose | Key Details |
|------|---------|-------------|
| `src/upload-manager.ts` | Manages chunked uploads | Line 395: `this.emit('complete', uploadId)` - **NO galleryId** |
| `src/main.ts` | Main process, IPC handlers | Line 624-626: Forwards `complete` event to renderer |
| `src/preload.ts` | Secure IPC bridge | Lines 69-71: `onUploadComplete` callback signature |
| `ui/renderer.js` | UI logic | Lines 276-288: Handles upload complete event |

### Gallery URL Structure (from Hub)

Based on `photovault-hub/src/app/photographer/galleries/page.tsx`:
- **Public gallery view:** `/gallery/{galleryId}` (line 417, 521)
- **Photographer gallery list:** `/photographer/galleries`
- **Upload page:** `/photographer/galleries/{galleryId}/upload`

The correct URL for post-upload redirect is `/gallery/{galleryId}` - this is the public gallery page where photos can be viewed.

### Security Considerations (from Electron Skill)

From the Electron skill (lines 77-93):

```typescript
// ❌ WRONG: Exposing shell.openExternal directly to renderer
contextBridge.exposeInMainWorld('api', {
  openURL: (url) => shell.openExternal(url),  // Security hole!
})

// ✅ RIGHT: Validate URL in main process before opening
contextBridge.exposeInMainWorld('api', {
  openGallery: (galleryId) => ipcRenderer.invoke('open-gallery', galleryId)
})

// In main.ts:
ipcMain.handle('open-gallery', async (_, galleryId) => {
  // Validate galleryId format
  if (!isValidGalleryId(galleryId)) throw new Error('Invalid gallery ID')

  // Construct URL in main process
  const url = `${config.hubUrl}/gallery/${galleryId}`

  // Open in default browser
  shell.openExternal(url)
})
```

**Why this matters:**
- Renderer process should NEVER have direct access to `shell.openExternal`
- Main process must validate inputs before opening URLs
- Prevents malicious code from opening arbitrary URLs

---

## Root Cause Analysis

### Why galleryId is Missing

In `src/upload-manager.ts` (lines 224-251), the upload process:

1. Calls `/api/v1/upload/prepare` → receives `galleryId` (line 249)
2. Stores `galleryId` in local variable (line 250)
3. Uses `galleryId` for uploads (lines 256-386)
4. **Emits complete event WITHOUT galleryId** (line 395):
   ```typescript
   this.emit('complete', uploadId)  // ❌ Missing galleryId
   ```

The `galleryId` is available in the `startUpload()` method scope but is NOT passed to the event emitter.

---

## Implementation Plan

### Phase 1: Pass galleryId Through Event Chain

#### Step 1.1: Update Upload Manager to Include galleryId

**File:** `src/upload-manager.ts`

**Change line 395:**
```typescript
// BEFORE:
this.emit('complete', uploadId)

// AFTER:
this.emit('complete', uploadId, galleryId)
```

**Add parameter to event listener in main.ts** (line 624):
```typescript
// BEFORE:
uploadManager.on('complete', (uploadId) => {
  mainWindow?.webContents.send('upload-complete', { uploadId })
})

// AFTER:
uploadManager.on('complete', (uploadId, galleryId) => {
  mainWindow?.webContents.send('upload-complete', { uploadId, galleryId })
})
```

#### Step 1.2: Update Type Definitions in preload.ts

**File:** `src/preload.ts`

**Update `UploadCompleteData` interface** (lines 16-18):
```typescript
interface UploadCompleteData {
  uploadId: string
  galleryId: string  // ADD THIS
}
```

The `onUploadComplete` callback signature (lines 69-71) will automatically use the updated type.

---

### Phase 2: Add Secure URL Opening via IPC

#### Step 2.1: Add IPC Handler in Main Process

**File:** `src/main.ts`

**Add handler AFTER the authentication handlers (around line 606):**

```typescript
// Gallery browser redirect handler
ipcMain.handle('open-gallery-in-browser', async (_event, galleryId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate galleryId format (UUID v4 format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(galleryId)) {
      logger.warn('[IPC] Invalid galleryId format rejected', { galleryId })
      return { success: false, error: 'Invalid gallery ID format' }
    }

    // Get hub URL from config
    const config = require('../config.json')
    const hubUrl = config.photoVaultWebUrl || process.env.PHOTOVAULT_WEB_URL || 'http://localhost:3002'

    // Construct validated URL
    const galleryUrl = `${hubUrl}/gallery/${galleryId}`

    logger.info('[IPC] Opening gallery in browser', { galleryId, url: galleryUrl })

    // Open in default browser (import shell at top of file)
    shell.openExternal(galleryUrl)

    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('[IPC] Failed to open gallery in browser', { error: errorMessage, galleryId })
    return { success: false, error: errorMessage }
  }
})
```

**Notes:**
- UUID validation prevents path traversal attacks
- URL construction happens in main process (secure)
- Logs provide audit trail
- Returns success/error for renderer feedback

#### Step 2.2: Expose IPC Method in Preload

**File:** `src/preload.ts`

**Add to contextBridge.exposeInMainWorld** (around line 95, after `onAuthCleared`):

```typescript
  // Browser redirect functions
  openGalleryInBrowser: (galleryId: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('open-gallery-in-browser', galleryId)
```

**Update global type definition** (around line 119, inside Window interface):

```typescript
  openGalleryInBrowser: (galleryId: string) => Promise<{ success: boolean; error?: string }>
```

---

### Phase 3: Update Renderer to Open Gallery

#### Step 3.1: Modify Upload Complete Handler

**File:** `ui/renderer.js`

**Replace lines 276-288:**

```javascript
// Listen for upload complete
window.electronAPI.onUploadComplete(async (data) => {
  console.log('Upload completed:', data.uploadId)

  // Show success message
  showSuccess()

  // Open gallery in browser if galleryId is present
  if (data.galleryId) {
    console.log('Opening gallery in browser:', data.galleryId)

    try {
      const result = await window.electronAPI.openGalleryInBrowser(data.galleryId)

      if (!result.success) {
        console.error('Failed to open gallery:', result.error)
        showError('Upload complete, but could not open gallery: ' + result.error)
      } else {
        console.log('Gallery opened successfully in browser')
        // Update success message to indicate browser opened
        showSuccess('Upload complete! Gallery opened in your browser.')
      }
    } catch (error) {
      console.error('Error opening gallery:', error)
      showError('Upload complete, but could not open browser')
    }
  } else {
    console.warn('Upload completed but no galleryId received')
  }

  // Reset UI after a delay (keep success message visible)
  resetUI()
  setTimeout(() => {
    selectedFiles = []
    fileInfo.classList.remove('visible')
    galleryNameInput.value = ''
    hideAlerts()
  }, 5000)  // Increased from 3s to 5s to give user time to see browser opening
})
```

**Changes:**
- Checks for `data.galleryId` presence
- Calls `openGalleryInBrowser()` via IPC
- Handles success/error cases
- Updates success message to confirm browser opened
- Extends delay to 5 seconds (gives user time to see what happened)

---

## Testing Plan

### Unit Tests

**Test 1: galleryId validation in IPC handler**
```javascript
// Valid UUID
expect(await ipcMain.handle('open-gallery-in-browser', null, '123e4567-e89b-12d3-a456-426614174000'))
  .toEqual({ success: true })

// Invalid format
expect(await ipcMain.handle('open-gallery-in-browser', null, '../../../etc/passwd'))
  .toEqual({ success: false, error: 'Invalid gallery ID format' })
```

**Test 2: Event data includes galleryId**
```javascript
const uploadManager = new TusUploadManager()
uploadManager.on('complete', (uploadId, galleryId) => {
  expect(galleryId).toBeDefined()
  expect(typeof galleryId).toBe('string')
})
```

### Integration Tests

**Test 3: End-to-end upload and redirect**
1. Start desktop app
2. Authenticate
3. Select test ZIP file
4. Enter gallery name
5. Start upload
6. Wait for completion
7. **Verify:** Default browser opens
8. **Verify:** URL matches `/gallery/{galleryId}` format
9. **Verify:** Gallery page loads with uploaded photos

**Test 4: Offline scenario (browser can't open)**
1. Disable network
2. Complete upload (should work - upload already finished)
3. Attempt to open browser
4. **Verify:** Error message shown
5. **Verify:** Upload still marked as complete

---

## Error Handling

### Scenarios & Responses

| Scenario | Behavior | User Message |
|----------|----------|--------------|
| **galleryId missing** | Log warning, skip browser open | "Upload complete!" (standard message) |
| **Invalid galleryId format** | Reject in IPC handler | "Upload complete, but could not open gallery: Invalid gallery ID" |
| **Browser open fails** | Catch error, show message | "Upload complete, but could not open browser" |
| **Upload succeeds, galleryId present** | Open browser | "Upload complete! Gallery opened in your browser." |

---

## Security Checklist

- [x] No direct `shell.openExternal` access from renderer
- [x] URL construction happens in main process only
- [x] galleryId validated with regex before use
- [x] Error messages don't leak internal paths
- [x] Logging includes security events (rejected IDs)
- [x] IPC handler returns typed response (no arbitrary data)

---

## Rollback Plan

If this breaks uploads or causes issues:

1. **Revert Phase 3** (renderer.js changes)
   - User still sees success message
   - No browser opening attempt
   - Uploads work normally

2. **Revert Phase 2** (IPC handlers)
   - Remove `open-gallery-in-browser` handler
   - Remove preload exposure
   - System back to pre-feature state

3. **Revert Phase 1** (event data)
   - Remove `galleryId` from event
   - TypeScript compiler will catch any remaining references

---

## Post-Implementation Verification

### Required Evidence:

1. **Code review:**
   - [ ] `upload-manager.ts` emits galleryId
   - [ ] `main.ts` forwards galleryId in event
   - [ ] `main.ts` has IPC handler with validation
   - [ ] `preload.ts` exposes method securely
   - [ ] `renderer.js` handles galleryId and opens browser

2. **Functional testing:**
   - [ ] Upload test file
   - [ ] Confirm browser opens automatically
   - [ ] Verify URL is correct `/gallery/{galleryId}`
   - [ ] Confirm gallery page loads with photos

3. **Security testing:**
   - [ ] Attempt to pass invalid galleryId (e.g., `../../../test`)
   - [ ] Verify rejection logged and error returned
   - [ ] Confirm no arbitrary URLs can be opened

4. **Logs review:**
   - [ ] Upload completion logged with galleryId
   - [ ] Browser open attempt logged
   - [ ] Any validation failures logged

---

## Implementation Order

1. **First:** Phase 1 (pass galleryId through events)
   - Smallest change, no new functionality
   - Can be tested without visible effect

2. **Second:** Phase 2 (add IPC handler)
   - Add capability, don't use it yet
   - Can be tested in isolation

3. **Third:** Phase 3 (renderer uses new capability)
   - Feature becomes visible
   - Easiest to revert if needed

---

## Open Questions for User

1. **URL preference:** Should we open `/gallery/{galleryId}` (public view) or `/photographer/galleries` (gallery list)?
   - **Recommendation:** `/gallery/{galleryId}` - user can immediately see their upload succeeded with photos displayed

2. **Timing:** Should browser open immediately on complete, or after a delay?
   - **Recommendation:** Immediate - user expects next action after upload

3. **User notification:** Current plan shows "Gallery opened in your browser" - is this clear enough?
   - Alternative: "Upload complete! Check your browser to view the gallery."

---

## Dependencies

### External:
- Electron `shell` module (already imported in `main.ts` line 1)
- User's default browser must be configured

### Internal:
- Hub must be running for gallery page to load
- Gallery must have at least processing started (photos may still be processing)

### Configuration:
- `config.json` or `PHOTOVAULT_WEB_URL` env var must have correct hub URL
- Default: `http://localhost:3002` (dev)
- Production: `https://photovault.photo`

---

## Timeline Estimate

- **Phase 1:** 15 minutes (straightforward event data change)
- **Phase 2:** 30 minutes (IPC handler with validation)
- **Phase 3:** 20 minutes (renderer logic update)
- **Testing:** 30 minutes (manual E2E + security tests)

**Total:** ~2 hours including testing

---

## Notes

- This feature significantly improves UX - user knows upload succeeded AND can take immediate action
- Security pattern (validated IPC) is reusable for future browser-opening features
- Graceful degradation: if browser open fails, upload still succeeds and user is notified
- Consider future enhancement: offer "View in Desktop" button that opens gallery in Electron window instead of browser
