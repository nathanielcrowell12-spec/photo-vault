# Desktop Redirect Debugging Progress

**Date:** December 21, 2025
**Status:** ROOT CAUSE IDENTIFIED - galleryId is undefined

---

## The Problem

Desktop app uploads complete successfully but no redirect to gallery page.

## Diagnostic Results

### Desktop Console Output
```
1 file(s) selected, total: 4.37 MB
Upload completed: upload-1766351832390-eapqdqiok galleryId: undefined
Upload completed but no galleryId received
Upload started: upload-1766351832390-eapqdqiok
```

### Server Logs (Hub)
```
[Upload Prepare] Gallery created: 993eee19-02b4-4307-a4f3-8147b64e6f7e
POST /api/v1/upload/prepare 200
POST /api/v1/upload/chunk 200
POST /api/v1/upload/process-chunked 200
[Process] Successfully incremented photo count by 15
```

## Code Analysis

### Files Verified Correct
1. **Hub API** (`src/app/api/v1/upload/prepare/route.ts` line 55): Returns `galleryId: gallery.id`
2. **upload-manager.ts** (line 218 compiled): `const galleryId = responseData.galleryId`
3. **upload-manager.ts** (line 338 compiled): `this.emit('complete', uploadId, galleryId)`
4. **main.ts** (line 665-666): Forwards to renderer correctly
5. **preload.ts**: Exposes IPC correctly
6. **renderer.js**: Handles event correctly

### The Mystery

All code appears correct, but galleryId arrives as `undefined` at the renderer.

## Theories to Test

### Theory 1: Event Listener Timing
Two separate `app.whenReady().then()` blocks:
- Line 439: Creates uploadManager
- Line 659: Attaches event listeners

Could there be a race condition where listeners aren't attached when emit fires?

### Theory 2: API Response Parsing
Maybe `responseData.galleryId` is actually undefined due to response format mismatch.

### Theory 3: Scope/Closure Issue
Maybe galleryId is being shadowed or lost in the async flow.

## Next Steps

1. **Add diagnostic logging:**
   ```typescript
   // In upload-manager.ts before emit
   logger.info('[DEBUG] About to emit complete', { uploadId, galleryId, typeofGalleryId: typeof galleryId })

   // In main.ts listener
   uploadManager.on('complete', (uploadId, galleryId) => {
     logger.info('[DEBUG] Complete event received', { uploadId, galleryId })
     mainWindow?.webContents.send('upload-complete', { uploadId, galleryId })
   })
   ```

2. **Rebuild and test:**
   ```bash
   cd photovault-desktop
   npm run build
   npm start
   ```

3. **Check logs** to see where galleryId becomes undefined

## Quick Fix (If Needed)

If galleryId is being lost in the event chain, alternative approach:
- Store galleryId in uploadStatus map
- Retrieve from status in main.ts listener instead of from event args
