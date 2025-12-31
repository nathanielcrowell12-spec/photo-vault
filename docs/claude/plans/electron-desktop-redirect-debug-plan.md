# Electron Desktop Redirect Debugging Plan

**Date:** December 21, 2025
**Issue:** Desktop app ZIP upload completes successfully, but no redirect to gallery page happens
**Status:** PHASE 1 - INVESTIGATION COMPLETE

---

## Problem Summary

**What Works:**
- Web upload redirect → Gallery page opens correctly ✅
- Desktop ZIP upload → Gallery is created successfully ✅
- Desktop ZIP upload → Photos are extracted and visible on web ✅

**What Doesn't Work:**
- Desktop ZIP upload → Browser does NOT open to gallery page ❌

**Expected Behavior:**
After desktop upload completes, `shell.openExternal()` should open the default browser to `/gallery/{galleryId}`

---

## PHASE 1: ROOT CAUSE ANALYSIS

### Investigation Findings

I reviewed all 4 files in the desktop app redirect chain:

#### 1. Upload Manager (`src/upload-manager.ts`)

**Status:** ✅ CORRECTLY IMPLEMENTED

**Line 395:** The complete event properly emits galleryId:
```typescript
this.emit('complete', uploadId, galleryId)
```

**Evidence:**
- Line 250: `galleryId` is captured from API response
- Line 395: `galleryId` is passed to event emitter
- The implementation matches the plan exactly

#### 2. Main Process (`src/main.ts`)

**Status:** ✅ CORRECTLY IMPLEMENTED

**Lines 665-667:** Event listener receives and forwards galleryId:
```typescript
uploadManager.on('complete', (uploadId, galleryId) => {
  mainWindow?.webContents.send('upload-complete', { uploadId, galleryId })
})
```

**Lines 618-656:** IPC handler exists with proper validation:
- UUID format validation (line 621)
- Hub URL configuration (line 628-634)
- `shell.openExternal()` call (line 648)
- Proper error handling and logging

**Evidence:**
- Shell module imported (line 1: `import { ..., shell } from 'electron'`)
- Handler registered with `ipcMain.handle('open-gallery-in-browser', ...)`
- Implementation matches plan Phase 2.1

#### 3. Preload Bridge (`src/preload.ts`)

**Status:** ✅ CORRECTLY IMPLEMENTED

**Line 18:** Type definition includes galleryId:
```typescript
interface UploadCompleteData {
  uploadId: string
  galleryId?: string  // ← Present and correct
}
```

**Lines 99-100:** IPC method exposed to renderer:
```typescript
openGalleryInBrowser: (galleryId: string): Promise<{ success: boolean; error?: string; url?: string }> =>
  ipcRenderer.invoke('open-gallery-in-browser', galleryId)
```

**Evidence:**
- Type definition matches plan Phase 1.2
- Method exposure matches plan Phase 2.2

#### 4. Renderer (`ui/renderer.js`)

**Status:** ⚠️ IMPLEMENTED BUT SUSPICIOUS

**Lines 276-316:** The upload complete handler:

```javascript
window.electronAPI.onUploadComplete(async (data) => {
  console.log('Upload completed:', data.uploadId, 'galleryId:', data.galleryId)
  resetUI()

  // Open gallery in browser if galleryId is present
  if (data.galleryId) {
    console.log('Opening gallery in browser after short delay...')

    // Small delay to allow server-side processing to start
    await new Promise(resolve => setTimeout(resolve, 2000))

    try {
      const result = await window.electronAPI.openGalleryInBrowser(data.galleryId)

      if (result.success) {
        console.log('Gallery opened successfully in browser:', result.url)
        showStatus('Upload complete! Gallery opened in your browser.')
      } else {
        console.error('Failed to open gallery:', result.error)
        const manualUrl = result.url || `gallery/${data.galleryId}`
        showError(`Upload complete, but could not open browser automatically. Open this URL manually: ${manualUrl}`)
      }
    } catch (error) {
      console.error('Error opening gallery:', error)
      showError(`Upload complete, but could not open browser. Your gallery ID: ${data.galleryId}`)
    }
  } else {
    console.warn('Upload completed but no galleryId received')
    showSuccess()
  }

  // Reset form after delay
  setTimeout(() => {
    selectedFiles = []
    fileInfo.classList.remove('visible')
    galleryNameInput.value = ''
    hideAlerts()
  }, 5000)
})
```

**Evidence:**
- Logic looks correct (checks for galleryId, calls IPC method)
- 2-second delay before opening (addresses race condition concern from critique)
- Error handling present
- Implementation matches plan Phase 3.1

---

## ROOT CAUSE HYPOTHESIS

### Theory 1: galleryId is Undefined/Null (Most Likely)

**Evidence supporting this theory:**

1. **upload-manager.ts line 363-370** shows the processing call happens AFTER the complete event is emitted:

```typescript
// Line 388: All files uploaded and processed
logger.info('[DESKTOP] All files uploaded successfully!', { uploadId, galleryId, fileCount: filePaths.length })

status.status = 'completed'
status.progress = 100
this.uploadStatuses.set(uploadId, status)

this.emit('complete', uploadId, galleryId)  // ← Line 395
```

Wait, that looks correct. Let me check the flow more carefully...

**Actually, checking the upload flow:**

Looking at lines 224-397 in upload-manager.ts:
- Line 249: `galleryId` is assigned from API response
- Lines 256-386: Upload loop processes all files
- Line 395: `this.emit('complete', uploadId, galleryId)` is called

**The problem:** `galleryId` is defined in the `startUpload()` method scope and should be available at line 395.

### Theory 2: Event Data Not Forwarding Correctly

**Checking the event chain more carefully:**

In main.ts lines 665-667:
```typescript
uploadManager.on('complete', (uploadId, galleryId) => {
  mainWindow?.webContents.send('upload-complete', { uploadId, galleryId })
})
```

This looks correct. The event forwards both uploadId and galleryId.

### Theory 3: ZIP Upload Uses Different Code Path

**CRITICAL FINDING:**

Looking at upload-manager.ts more carefully, I notice there are TWO processing endpoints being called:

1. **For chunked files** (lines 361-370): `/api/v1/upload/process-chunked`
2. **For ZIP files** (not shown): Possibly different processing

Wait, let me search for how ZIP files are handled specifically...

**Re-reading upload-manager.ts lines 256-386:**

The code uploads files in chunks regardless of type. Each file is:
1. Split into 6MB chunks (line 272)
2. Uploaded chunk by chunk (lines 278-356)
3. Processed via `/api/v1/upload/process-chunked` (lines 361-370)

**This applies to ALL file types, including ZIP files.**

### Theory 4: Multiple File Upload Changes Something

Looking at the upload flow:
- User selects ZIP file
- Code treats it as a single file in an array
- Gallery is created ONCE (line 227)
- ZIP file is uploaded in chunks
- Processing is called
- Complete event should fire with galleryId

**Wait, I see a potential issue!**

Lines 361-376 show that processing is called for EACH file:
```typescript
for (let fileIndex = 0; fileIndex < filePaths.length; fileIndex++) {
  // ... upload chunks ...

  // Process this file's chunks
  const processResponse = await fetch(`${config.webUrl}/api/v1/upload/process-chunked`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      galleryId,
      storagePath,
      totalChunks
    })
  })
}
```

But the `complete` event (line 395) is emitted AFTER this loop completes. So galleryId should still be in scope.

### Theory 5: Renderer showStatus/showError Functions Don't Exist

Looking at renderer.js lines 335-349:
```javascript
function showSuccess() {
  alertSuccess.classList.add('visible')
  alertError.classList.remove('visible')
}

function showError(message) {
  errorMessage.textContent = message
  alertError.classList.add('visible')
  alertSuccess.classList.remove('visible')
}
```

But the code calls `showStatus()` on line 293 and 408. Let me check if this function exists...

**Lines 408-414:**
```javascript
function showStatus(message) {
  // Use the success alert for status messages
  const alertSuccess = document.getElementById('alert-success')
  alertSuccess.textContent = message
  alertSuccess.classList.add('visible')
  setTimeout(() => alertSuccess.classList.remove('visible'), 3000)
}
```

✅ Function exists.

---

## THE ACTUAL ROOT CAUSE

### Critical Discovery: Console Logging

**The user said:**
> "No redirect to gallery page happened after upload completed"

**But they didn't say:**
> "No console logs appeared"

**Looking at renderer.js lines 276-277:**
```javascript
window.electronAPI.onUploadComplete(async (data) => {
  console.log('Upload completed:', data.uploadId, 'galleryId:', data.galleryId)
```

**Action Required:** Check the browser DevTools console logs to see:
1. Does `console.log('Upload completed:...` appear?
2. What is the value of `data.galleryId`?
3. Does `console.log('Opening gallery in browser after short delay...')` appear?
4. Does the success or error path execute?

### Debugging Workflow (Systematic Debugging Phase 2)

**The user needs to run a test upload and capture:**

1. **Desktop app console logs** (from terminal where app was started)
   - Look for: `[DESKTOP] All files uploaded successfully!` with galleryId
   - Look for: `[IPC] Opening gallery in browser` with galleryId

2. **Renderer DevTools console** (View → Toggle Developer Tools in Electron)
   - Look for: `Upload completed:` log
   - Check: What is `data.galleryId` value?
   - Look for: `Opening gallery in browser after short delay...`
   - Check: Does success or error path execute?

3. **Network tab in renderer DevTools**
   - Check if IPC call is made to `open-gallery-in-browser`

---

## PHASE 2: VERIFICATION STEPS

### Before Creating Fix

**Run this diagnostic:**

1. Start desktop app with: `npm start` (capture terminal output)
2. Open DevTools in the app: Help → Toggle Developer Tools
3. Select a small ZIP file (easier to debug)
4. Enter gallery name
5. Click Upload
6. **WAIT for upload to complete**
7. **Immediately check:**
   - Terminal logs for `[DESKTOP] All files uploaded successfully!`
   - Renderer console for `Upload completed:` log
   - Value of `data.galleryId` in that log

### Expected Log Output

**If implementation is correct, you should see:**

**Terminal (main process):**
```
[DESKTOP] All files uploaded successfully! { uploadId: 'upload-123...', galleryId: 'abc-123-def...', fileCount: 1 }
[IPC] Opening gallery in browser { galleryId: 'abc-123-def...', url: 'http://localhost:3002/gallery/abc-123-def...' }
```

**Renderer console:**
```
Upload completed: upload-123... galleryId: abc-123-def...
Opening gallery in browser after short delay...
Gallery opened successfully in browser: http://localhost:3002/gallery/abc-123-def...
```

**If galleryId is missing, you'll see:**
```
Upload completed: upload-123... galleryId: undefined
Upload completed but no galleryId received
```

---

## PHASE 3: LIKELY FIXES

### If galleryId is Undefined

**Check upload-manager.ts line 249:**

The responseData should have galleryId. Verify the API endpoint `/api/v1/upload/prepare` is returning it.

**Fix:** Check hub API route at `photovault-hub/src/app/api/v1/upload/prepare/route.ts`

### If galleryId is Present But Browser Doesn't Open

**Possible causes:**
1. IPC handler not registered (check main.ts line 618)
2. Preload not exposing method (check preload.ts line 99)
3. Shell.openExternal failing silently

**Fix:** Add more logging to IPC handler to see if it's even being called

### If Error Path Executes

**Check the error message:** It will tell us what failed:
- "Invalid gallery ID format" → UUID validation failed
- "Invalid hub URL configuration" → Hub URL is malformed
- Other error → Shell.openExternal failed

---

## PHASE 4: IMPLEMENTATION FIX (After Diagnosis)

### Fix 1: Add More Logging

**In main.ts IPC handler (after line 618), add:**
```typescript
ipcMain.handle('open-gallery-in-browser', async (_event, galleryId: string): Promise<{ success: boolean; error?: string; url?: string }> => {
  logger.info('[IPC] open-gallery-in-browser called', { galleryId, type: typeof galleryId })

  try {
    // ... rest of handler
  }
})
```

**In renderer.js (after line 276), add:**
```javascript
console.log('[DEBUG] Upload complete data:', JSON.stringify(data))
console.log('[DEBUG] galleryId type:', typeof data.galleryId)
console.log('[DEBUG] galleryId truthy:', !!data.galleryId)
```

### Fix 2: If galleryId is Missing from API Response

**Check hub API route:** `src/app/api/v1/upload/prepare/route.ts`

**Verify response includes galleryId:**
```typescript
return NextResponse.json({
  galleryId: gallery.id,  // ← Must be present
  storagePath
})
```

### Fix 3: If Shell.openExternal is Failing

**Wrap in try-catch and log more details:**
```typescript
try {
  await shell.openExternal(galleryUrl)
  logger.info('[IPC] shell.openExternal succeeded', { url: galleryUrl })
  return { success: true, url: galleryUrl }
} catch (shellError) {
  logger.error('[IPC] shell.openExternal failed', {
    error: shellError instanceof Error ? shellError.message : String(shellError),
    url: galleryUrl
  })
  throw shellError
}
```

---

## TEST PLAN

### After Applying Fix

1. **Rebuild desktop app:**
   ```bash
   cd photovault-desktop
   npm run build
   npm start
   ```

2. **Test ZIP upload:**
   - Select small test ZIP (< 10MB)
   - Complete upload
   - Verify browser opens to gallery page

3. **Test individual photo upload:**
   - Select 2-3 JPG files
   - Complete upload
   - Verify browser opens to gallery page

4. **Test error path:**
   - Temporarily break hub URL in config.json
   - Complete upload
   - Verify error message shows manual URL

---

## CRITICAL QUESTIONS FOR USER

**Before I can complete this diagnosis, I need the user to provide:**

1. **What do the console logs show?**
   - Terminal output during upload
   - Renderer DevTools console output
   - Specifically: What is the value of `data.galleryId`?

2. **Does the browser attempt to open at all?**
   - Even to wrong URL?
   - Or no browser activity whatsoever?

3. **What platform are you testing on?**
   - Windows (which version?)
   - macOS?
   - Linux?

4. **What is in your config.json?**
   - Specifically the `photoVaultWebUrl` value
   - Is it `http://localhost:3002`?

---

## NEXT STEPS

**I am HALTING here per Systematic Debugging Discipline.**

**Reason:** I need actual diagnostic data (console logs) before proceeding to Phase 3 (Generate Hypotheses) and Phase 4 (Test Solutions).

**To proceed, user must:**
1. Run test upload with DevTools open
2. Capture and share:
   - Terminal logs
   - Renderer console logs
   - Value of `data.galleryId` in the upload complete log

**Once I have this data, I can:**
- Confirm the exact failure point
- Provide a targeted fix
- Avoid guesswork and unnecessary code changes

---

## SUMMARY

**Implementation Status:** ✅ Code appears correct based on static analysis

**Probable Issue:** One of these:
1. galleryId is undefined in event data (API not returning it)
2. IPC handler not being called (method not exposed properly)
3. shell.openExternal failing silently (platform-specific issue)

**Required Action:** Diagnostic logging to determine which of the above is true

**Confidence Level:** 60% - Code looks correct, but without runtime logs I cannot confirm behavior

**Estimated Fix Time:** 15-30 minutes once diagnostic data is available

