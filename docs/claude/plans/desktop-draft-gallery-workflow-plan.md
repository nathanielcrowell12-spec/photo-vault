# Desktop Draft Gallery Workflow Fix Plan

## Executive Summary
After a desktop upload completes, users are redirected to the wrong page (`/photographer/galleries/{id}/upload` - an upload form) instead of a draft gallery review page. The gallery workflow is broken because there's no dedicated draft review/confirmation page and no email-send functionality wired up.

## Root Cause Analysis

### Issue 1: Wrong Redirect URL
**Location**: `photovault-desktop/src/main.ts`, line 718
**Problem**: After upload completes, desktop app redirects to:
```
/photographer/galleries/{id}/upload
```
This is an upload form page, not a review page.

**Expected**: Should redirect to a draft gallery review page
```
/photographer/galleries/{id}/draft
```

### Issue 2: Missing Draft Gallery Review Page
**Location**: `photovault-hub/src/app/photographer/galleries/`
**Problem**: No dedicated draft review page exists. The upload page (`[id]/upload/page.tsx`) is for adding photos, not reviewing them.

**Database Schema**: `gallery_status` field exists with values: 'draft', 'ready', 'delivered', 'archived'
**Current Page**: `[id]/upload/page.tsx` shows:
- Upload form for adding photos
- Uploaded photos grid
- "Complete & Send to Client" button (but it just navigates to sneak-peek selection)

**Missing Page**: A dedicated draft review page that:
- Shows uploaded photos
- Displays gallery metadata (name, client, pricing)
- Has "Draft - Not visible to client" badge
- Has "Complete & Send to Client" button that actually sends email

### Issue 3: Email Send Workflow Not Implemented
**Location**: Multiple files
**Problem**:
- Upload page has "Complete & Send to Client" button (line 307 in upload/page.tsx)
- It only navigates to `sneak-peek-select` page
- No API endpoint to transition gallery from draft→ready and send email
- `email_sent_at` field exists but is never populated after desktop upload

### Issue 4: No Confirmation Gallery Status is Draft
**Location**: `src/app/api/v1/upload/prepare/route.ts` and `src/app/api/v1/upload/process/route.ts`
**Problem**:
- When gallery is created in `/api/v1/upload/prepare` (line 63), no explicit `gallery_status` is set
- Database default is `'draft'` (consolidate-photo-galleries-migration.sql, line 66)
- When processing completes in `/api/v1/upload/process` (line 227-235), gallery is updated with:
  - `photo_count`
  - `is_imported: true`
  - But `gallery_status` is NOT explicitly set or preserved

## Files That Need Changes

### 1. Desktop App Redirect (HIGH PRIORITY)
**File**: `photovault-desktop/src/main.ts`
**Line**: 718
**Change**: Update redirect URL from `/photographer/galleries/{id}/upload` to `/photographer/galleries/{id}/draft`

**Current**:
```typescript
const galleryUrl = `${hubUrl}/photographer/galleries/${galleryId}/upload`
```

**New**:
```typescript
const galleryUrl = `${hubUrl}/photographer/galleries/${galleryId}/draft`
```

### 2. Create Draft Gallery Review Page (HIGH PRIORITY)
**File**: NEW - `photovault-hub/src/app/photographer/galleries/[id]/draft/page.tsx`
**Purpose**: Review and confirm gallery before sending to client

**Should include**:
- Gallery header with name, client, pricing, draft badge
- Uploaded photos grid (read-only)
- "Complete & Send to Client" button (calls new API endpoint)
- "Add More Photos" link (navigates to upload page)
- "Download Gallery" link
- "Gallery Settings" link

### 3. Gallery Status Preservation in Upload API (MEDIUM PRIORITY)
**File**: `photovault-hub/src/app/api/v1/upload/process/route.ts`
**Line**: 227-235
**Change**: Explicitly set gallery_status='draft' when updating after process completes

**Current**:
```typescript
await supabase
  .from('photo_galleries')
  .update({
    photo_count: uploadedCount,
    is_imported: true,
    import_started_at: null
  })
  .eq('id', galleryId)
```

**New**:
```typescript
await supabase
  .from('photo_galleries')
  .update({
    photo_count: uploadedCount,
    is_imported: true,
    import_started_at: null,
    gallery_status: 'draft'  // Explicit: gallery is draft until photographer sends
  })
  .eq('id', galleryId)
```

### 4. Email Send API Endpoint (HIGH PRIORITY)
**File**: NEW - `photovault-hub/src/app/api/photographer/galleries/[id]/send-to-client/route.ts`
**Purpose**: Transition gallery from draft→ready and send client email

**Endpoint**: `POST /api/photographer/galleries/{id}/send-to-client`
**Logic**:
1. Verify photographer owns gallery
2. Check gallery has photos (photo_count > 0)
3. Verify client email exists
4. Update gallery: `gallery_status='ready'`, `email_sent_at=NOW()`
5. Send email to client (use Resend API - see `RESEND-EMAIL-SETUP.md`)
6. Return success with gallery details

**Response**:
```json
{
  "success": true,
  "gallery": {
    "id": "...",
    "gallery_status": "ready",
    "email_sent_at": "2026-01-02T...",
    "client_email": "client@example.com"
  }
}
```

### 5. Update Upload Page (MEDIUM PRIORITY)
**File**: `photovault-hub/src/app/photographer/galleries/[id]/upload/page.tsx`
**Changes**:
- Remove "Complete & Send to Client" button from upload page
- Replace with "Review Gallery" button that navigates to draft page
- Update UI messaging to clarify this is for adding photos, not reviewing

### 6. Update Gallery Page Navigation (LOW PRIORITY)
**File**: Various gallery list/detail pages
**Change**: Ensure navigation correctly routes to `/draft` page for draft galleries and `/view` for ready galleries

## Test Plan

### Unit Tests

1. **Database defaults**: Verify new galleries created via `/api/v1/upload/prepare` have `gallery_status='draft'`
2. **Upload process**: Verify `/api/v1/upload/process` preserves `gallery_status='draft'` after photo extraction
3. **Email endpoint**: Verify `/api/photographer/galleries/{id}/send-to-client`:
   - Requires photographer ownership
   - Updates gallery status to 'ready'
   - Populates email_sent_at
   - Sends email to client
   - Rejects if gallery has no photos

### Integration Tests

1. **Desktop->Draft flow**:
   - Run desktop upload with ZIP file
   - Verify redirects to `/photographer/galleries/{id}/draft`
   - Verify gallery status is 'draft' in database
   - Verify photos are visible on draft page

2. **Send to Client flow**:
   - On draft page, click "Complete & Send to Client"
   - Verify API call succeeds
   - Verify gallery status changes to 'ready' in database
   - Verify client receives email
   - Verify email_sent_at is populated
   - Verify user is redirected appropriately

### Manual Testing

1. **Desktop upload**:
   - Upload ZIP with 10+ photos
   - Land on draft page (not upload form)
   - See all photos displayed
   - See "draft" badge
   - See "Complete & Send to Client" button

2. **Send to client**:
   - Click "Complete & Send to Client"
   - See loading state, then success
   - Client account receives email with gallery link
   - Gallery is now marked "ready"

3. **Multiple uploads**:
   - Upload first batch -> draft page
   - Click "Add More Photos" -> upload page
   - Upload second batch -> returns to draft page
   - Both batches visible in photo grid

## Deployment Checklist

- [ ] Database migration: Ensure `gallery_status` constraint is applied
- [ ] New draft page component created and tested
- [ ] Send-to-client API endpoint created and tested
- [ ] Desktop app redirect URL updated and rebuilt
- [ ] Resend email templates verified
- [ ] Email sending tested in staging
- [ ] Database queries tested for photo_galleries table
- [ ] RLS policies verified for new endpoint
- [ ] Desktop app redistributed to users
- [ ] Smoke test: Desktop upload -> draft page flow

## Success Criteria

- [ ] Desktop uploads redirect to draft page (not upload form)
- [ ] Draft page displays all uploaded photos
- [ ] Gallery shows as "draft" status in database
- [ ] "Complete & Send to Client" button sends email and updates status to 'ready'
- [ ] Client receives email with gallery access
- [ ] Email_sent_at timestamp is populated
- [ ] Photographer cannot see upload form on draft page (only review interface)
- [ ] Can navigate between draft page and upload page for incremental uploads

## Risk Assessment

- **Low Risk**: Redirect URL change (desktop-only, no DB impact)
- **Low Risk**: Upload page refactor (existing upload flow unchanged)
- **Medium Risk**: New API endpoint (new code path, needs email service)
- **Medium Risk**: Gallery status preservation (changes existing update logic)

## Open Questions

1. Should photographers be able to edit gallery name/client after uploading but before sending?
2. Should "Add More Photos" button be available after sending to client (status='ready')?
3. Should there be a confirmation dialog before sending to client?
4. Should client email be required before allowing "Send to Client"?
