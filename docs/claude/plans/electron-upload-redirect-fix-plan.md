# Electron: Upload Redirect Fix Plan

## Summary
Desktop app redirects to wrong URL after upload completes - goes to `/gallery/{id}` (client page) instead of `/photographer/galleries/{id}/upload` (photographer draft page).

## Root Cause

**Location:** `photovault-desktop/ui/renderer.js:297`

**The Bug:**
```javascript
const manualUrl = result.url || `gallery/${data.galleryId}`
```

The fallback URL is wrong. When `result.url` is undefined/empty, it falls back to `gallery/${id}` which is the client-facing gallery, not the photographer's upload page.

**Evidence:**
- User was redirected to `http://localhost:3002/gallery/f84c54c7-f0de-4c1e-8b76-a57f48ced812`
- This matches the fallback pattern: `gallery/${data.galleryId}`
- The correct URL in main.ts:677 is `/photographer/galleries/${galleryId}/upload`

## Why Fallback Is Being Used

The IPC handler in main.ts:651-690 should return `{ success: true, url: galleryUrl }`, but either:
1. The IPC call is throwing an error (caught at line 300)
2. `result.url` is undefined despite `result.success` being true
3. The handler isn't being called at all

## The Fix

### File: `photovault-desktop/ui/renderer.js`

**Line 297 - Change fallback URL:**
```javascript
// BEFORE
const manualUrl = result.url || `gallery/${data.galleryId}`

// AFTER
const manualUrl = result.url || `/photographer/galleries/${data.galleryId}/upload`
```

### Optional: Add logging to diagnose IPC issue

**Lines 288-303:**
```javascript
try {
  console.log('[Redirect] Calling openGalleryInBrowser with galleryId:', data.galleryId)
  const result = await window.electronAPI.openGalleryInBrowser(data.galleryId)
  console.log('[Redirect] IPC result:', result)

  if (result.success) {
    console.log('Gallery opened successfully in browser:', result.url)
    showStatus('Upload complete! Gallery opened in your browser.')
  } else {
    console.error('Failed to open gallery:', result.error)
    const manualUrl = result.url || `/photographer/galleries/${data.galleryId}/upload`
    showError(`Upload complete, but could not open browser automatically. Open this URL manually: ${manualUrl}`)
  }
} catch (error) {
  console.error('[Redirect] IPC error:', error)
  showError(`Upload complete, but could not open browser. Your gallery ID: ${data.galleryId}`)
}
```

## Files to Modify

| File | Change |
|------|--------|
| `photovault-desktop/ui/renderer.js` | Fix fallback URL on line 297 |

## Testing Steps

1. Start hub dev server: `npm run dev -- -p 3002`
2. Launch desktop app
3. Upload photos to a gallery
4. Verify browser opens to `/photographer/galleries/{id}/upload` (not `/gallery/{id}`)

## Notes

- The main.ts code at line 677 already has the correct URL construction
- This is a simple one-line fix in the fallback path
- After fixing, if redirects still fail, the IPC issue needs deeper investigation
