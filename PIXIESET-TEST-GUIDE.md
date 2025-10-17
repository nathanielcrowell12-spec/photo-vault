# Pixieset Integration Test Guide

## Prerequisites

1. ✅ Dev server running (`npm run dev`)
2. ✅ Browser session cleared (no corrupted auth tokens)
3. ✅ Logged in as a customer
4. ✅ On dashboard page

## Test Steps

### 1. Click Pixieset Button
- **Location**: Dashboard → "Import Photos from Any Platform" section
- **Expected**: Old platform connection modal opens
- **Status**: Should show platform selection options

### 2. Click "Connect" in Modal
- **Action**: Click the "Connect" button
- **Expected**: 
  - Old modal closes
  - **Unified Pixieset modal opens** ✅
  - Modal shows "Import from Pixieset" header with 📸 icon

### 3. Enter Test Credentials
- **Access Type**: Select "Guest Access"
- **Gallery URL**: `https://meadowlanemedia.pixieset.com/guestlogin/crowellcountryliving/`
- **Gallery Password**: `crowell`

### 4. Add Gallery Metadata (Optional)
- **Gallery Name**: "Crowell Country Living"
- **Photographer**: "Meadow Lane Media"
- **Date**: "January 2024"
- **Location**: "Country Home"
- **People**: "Crowell Family"

### 5. Start Import
- **Action**: Click "Start Import" button
- **Expected**:
  - Button changes to "Importing..." with spinner
  - Progress bar appears
  - Status messages update in real-time

### 6. Monitor Progress
**Expected stages**:
1. **Authenticating** (10%) - "Connecting to Pixieset..."
2. **Finding Download** (30%) - "Looking for download link..."
3. **Downloading ZIP** (40%) - "Downloading gallery ZIP file..."
4. **Extracting** (50-70%) - "Extracting photos from ZIP..."
5. **Uploading** (70-95%) - "Uploading X photos to your gallery..."
6. **Complete** (100%) - "Import completed successfully!"

### 7. Verify Gallery Appears
- **Expected**: 
  - Modal closes automatically after success
  - Gallery appears in gallery grid on dashboard
  - Gallery shows:
    - ✅ Gallery name: "Crowell Country Living"
    - ✅ Photographer: "Meadow Lane Media"
    - ✅ Platform badge: "Pixieset"
    - ✅ Photo count: (will be updated after import)

### 8. Click Gallery Tile
- **Action**: Click on the gallery tile
- **Expected**: Navigate to gallery viewer page
- **Should Show**:
  - Gallery photos in grid layout
  - Photo count
  - Gallery information
  - Download/favorite options

## Console Messages to Watch

### Successful Flow:
```
AuthContext: Auth state change: SIGNED_IN [user-id]
Connecting to platform: {platform: "Pixieset", ...}
Opening unified modal for: Pixieset
UnifiedImportService: Starting import for gallery [id] from Pixieset
```

### Error Scenarios:

**Authentication Failed**:
```
PixiesetClient: Authentication failed with status 401
Error: Failed to authenticate with Pixieset
```
→ Check URL and password are correct

**Download Link Not Found**:
```
PixiesetClient: No download link found
Error: Could not find "Download to Device" link
```
→ Gallery may not allow downloads

**Import Failed**:
```
UnifiedImportService: Import failed: [error message]
```
→ Check browser console for detailed error

## Known Issues

### Issue: Modal Doesn't Open
- **Symptom**: Click "Connect" but unified modal doesn't appear
- **Fix**: Refresh page, clear browser cache, try again
- **Prevention**: Fixed in latest version with separate modal states

### Issue: Session Expired
- **Symptom**: "Invalid Refresh Token" error
- **Fix**: Clear browser storage and login again
- **Prevention**: Improved session management in AuthContext

### Issue: Import Stuck at X%
- **Symptom**: Progress bar stops updating
- **Fix**: Check browser console for errors
- **Debugging**: Check Network tab for failed API calls

## Success Criteria

✅ **Modal transitions correctly** from old to unified  
✅ **Authentication works** with test credentials  
✅ **Progress bar updates** in real-time  
✅ **Gallery appears** on dashboard after import  
✅ **Photos are imported** to Supabase storage  
✅ **Metadata is saved** correctly  
✅ **No console errors** during import  

## Troubleshooting

### Browser Console Commands

**Check session**:
```javascript
localStorage.getItem('photovault-auth')
```

**Clear session** (if needed):
```javascript
localStorage.removeItem('photovault-auth')
location.reload()
```

**Check modal state** (in React DevTools):
```
Dashboard → State → selectedPlatform
Dashboard → State → showUnifiedModal
Dashboard → State → unifiedPlatform
```

### Database Queries

**Check gallery created**:
```sql
SELECT * FROM galleries 
WHERE user_id = 'your-user-id' 
AND platform = 'Pixieset' 
ORDER BY created_at DESC LIMIT 1;
```

**Check photos imported**:
```sql
SELECT COUNT(*) FROM gallery_photos 
WHERE gallery_id = 'gallery-id';
```

## Next Steps After Successful Test

1. **Test SmugMug** integration (same process)
2. **Test error scenarios** (wrong password, invalid URL)
3. **Test with different galleries**
4. **Verify photo quality** and metadata
5. **Test gallery viewer** functionality
6. **Test download** and favorite features

---

**Ready to Test!** 🚀

Follow these steps and report any issues you encounter.


