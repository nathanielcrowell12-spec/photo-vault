# Pixieset ZIP Import System - Setup Guide

## Overview

The new Pixieset ZIP import system allows customers to automatically download and import their galleries from Pixieset using the "Download to Device" feature. This eliminates the need for manual downloads and uploads.

## How It Works

1. **Customer clicks Pixieset button** on dashboard
2. **Modal opens** with access type selection (Guest or Account)
3. **Customer enters credentials** (URL + password OR username + password)
4. **Customer provides gallery metadata** (name, date, location, people)
5. **PhotoVault authenticates** with Pixieset
6. **System finds "Download to Device" link** on gallery page
7. **ZIP file streams** directly from Pixieset
8. **Photos extract on-the-fly** and upload to Supabase
9. **Gallery appears** on customer dashboard

## Files Created

### Core System
- `src/lib/platforms/pixieset-zip-client.ts` - Pixieset authentication and ZIP link detection
- `src/lib/services/zip-stream-service.ts` - ZIP streaming and photo extraction
- `src/app/api/import/pixieset-zip/route.ts` - API endpoint for import requests
- `src/components/PixiesetImportModal.tsx` - User interface for import process

### Updated Files
- `src/app/dashboard/page.tsx` - Added Pixieset modal integration

## Key Features

### ✅ Dual Access Methods
- **Guest Access**: URL + password for individual galleries
- **Account Access**: Username + password for full account access

### ✅ Smart Authentication
- Handles Pixieset CSRF tokens
- Manages session cookies
- Retries failed authentications

### ✅ ZIP Link Detection
- Finds "Download to Device" links automatically
- Handles various HTML patterns
- Supports different Pixieset URL formats

### ✅ Streaming Import
- Downloads ZIP directly from Pixieset
- Extracts photos on-the-fly
- No temporary storage needed
- Cost-effective for large galleries

### ✅ Progress Tracking
- Real-time progress updates
- Stage-by-stage feedback
- Photo count tracking

### ✅ Error Handling
- Industry-standard retry logic
- Clear error messages
- Actionable remediation steps

### ✅ Metadata Collection
- Gallery name, date, location
- Photographer information
- People tags (searchable)
- All fields optional

## Testing the System

### 1. Start Development Server
```bash
npm run dev
```

### 2. Login as Customer
- Go to http://localhost:3000/login
- Login with test account

### 3. Test Pixieset Import
1. On dashboard, click **Pixieset** button
2. Select **Guest Access**
3. Enter test gallery URL:
   ```
   https://meadowlanemedia.pixieset.com/guestlogin/crowellcountryliving/
   ```
4. Enter password: `crowell`
5. Fill in gallery metadata (optional)
6. Click **Start Import**

### 4. Monitor Progress
- Watch progress bar
- Check browser console for logs
- Wait for completion

### 5. Verify Results
- Gallery should appear on dashboard
- Photos should be viewable
- Metadata should be saved

## Test Gallery

**URL**: `https://meadowlanemedia.pixieset.com/guestlogin/crowellcountryliving/`
**Password**: `crowell`
**Expected**: ~150 photos should import

## API Endpoints

### Import Request
**POST** `/api/import/pixieset-zip`

```json
{
  "galleryUrl": "https://photographer.pixieset.com/gallery/",
  "password": "gallery_password",
  "username": "pixieset_username",
  "userPassword": "account_password", 
  "accessType": "guest",
  "galleryMetadata": {
    "galleryName": "Wedding Day",
    "photographerName": "John Smith",
    "sessionDate": "June 15, 2024",
    "location": "Central Park",
    "people": ["John", "Jane", "Sarah"]
  }
}
```

## Error Messages

### Authentication Errors
- "Failed to authenticate with Pixieset" → Check credentials
- "Password is required for guest access" → Enter gallery password
- "Username and password are required for account access" → Complete account fields

### Download Errors
- "Could not find 'Download to Device' link" → Gallery may not allow downloads
- "Failed to download ZIP file after retries" → Network or server issue
- "Gallery URL is invalid" → Check URL format

### Import Errors
- "Failed to extract photos from ZIP" → ZIP file corrupted
- "Failed to upload photo to storage" → Supabase storage issue
- "Import failed: Unknown error" → Check server logs

## Troubleshooting

### Common Issues

1. **Authentication Fails**
   - Verify gallery URL format
   - Check password is correct
   - Ensure gallery allows guest access

2. **Download Link Not Found**
   - Gallery may not have downloads enabled
   - Try different gallery
   - Check if photographer disabled downloads

3. **Import Stuck**
   - Check browser console for errors
   - Verify Supabase connection
   - Check server logs

4. **Photos Not Showing**
   - Wait for import to complete
   - Refresh dashboard
   - Check gallery permissions

### Debug Steps

1. **Check Browser Console**
   ```javascript
   // Look for PixiesetZipClient logs
   console.log('PixiesetZipClient: Starting authentication...')
   ```

2. **Check Network Tab**
   - Pixieset authentication requests
   - ZIP download progress
   - API call responses

3. **Check Database**
   ```sql
   -- Check gallery record
   SELECT * FROM galleries WHERE platform = 'Pixieset' ORDER BY created_at DESC LIMIT 1;
   
   -- Check imported photos
   SELECT COUNT(*) FROM gallery_photos WHERE gallery_id = 'your-gallery-id';
   ```

## Production Considerations

### Security
- Store passwords encrypted
- Validate all inputs
- Rate limit import requests
- Monitor for abuse

### Performance
- ZIP streaming keeps memory usage low
- No temporary file storage
- Parallel photo uploads
- Progress updates via WebSocket (future)

### Scalability
- Background processing
- Queue system for multiple imports
- Error recovery mechanisms
- Monitoring and alerting

## Future Enhancements

### Phase 2: Additional Platforms
- SmugMug ZIP import
- ShootProof integration
- Zenfolio support
- Pic-Time integration

### Phase 3: Advanced Features
- Real-time progress via WebSocket
- Email notifications
- Batch import multiple galleries
- Automatic retry for failed photos

### Phase 4: Smart Features
- Automatic metadata extraction
- Duplicate photo detection
- Smart gallery naming
- EXIF data processing

## Support

### For Customers
- Clear error messages
- Step-by-step instructions
- Help documentation
- Contact support form

### For Developers
- Comprehensive logging
- Error tracking
- Performance metrics
- Debug tools

## Success Metrics

- ✅ Authentication success rate >95%
- ✅ Download success rate >90%
- ✅ Import completion rate >85%
- ✅ Customer satisfaction >4.5/5
- ✅ Average import time <10 minutes for 200 photos

---

## Quick Start

1. **Start server**: `npm run dev`
2. **Login**: Use test customer account
3. **Click Pixieset**: On dashboard
4. **Enter credentials**: Use test gallery above
5. **Watch import**: Progress bar shows status
6. **View results**: Gallery appears on dashboard

**Ready to test!** 🚀
