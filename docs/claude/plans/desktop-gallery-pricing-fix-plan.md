# Desktop Gallery Pricing Fix - Option A: "Create First, Upload Second"

**Created:** December 30, 2024
**Problem:** Desktop uploads create galleries without pricing fields, so paywall never appears
**Solution:** Create gallery on web with pricing BEFORE launching desktop uploader

---

## Problem Statement

When photographers use the desktop uploader:
1. They fill out gallery name/pricing on web creation page
2. They click "Desktop Upload"
3. Desktop app launches and calls `/api/v1/upload/prepare`
4. API creates a NEW gallery with only 7 fields (no pricing)
5. Photos upload to this bare gallery
6. Client receives email, clicks link, sees NO paywall (total_amount = NULL)

The web-entered pricing data is lost because the desktop flow creates its own gallery.

---

## Root Cause Analysis

**Web Creation Page** (`src/app/photographer/galleries/create/page.tsx`):
- Collects: gallery name, client, billing_mode, shoot_fee, storage package, metadata
- Currently does NOT create gallery before launching desktop
- Just opens `photovault://auth?token=...&galleryId=undefined`

**Desktop Upload Prepare** (`src/app/api/v1/upload/prepare/route.ts`):
- Always creates NEW gallery with minimal fields
- Does NOT accept `galleryId` to upload to existing gallery
- Missing: payment_option_id, billing_mode, shoot_fee, storage_fee, total_amount

**Paywall Logic** (`src/app/gallery/[galleryId]/page.tsx`):
- If `total_amount = NULL` → grants FREE access
- If `total_amount > 0` → shows paywall
- Desktop galleries have NULL pricing → no paywall

---

## Proposed Solution

### Flow Change

**Before (Broken):**
```
Web Form → Launch Desktop → Desktop creates gallery → Photos upload → No pricing
```

**After (Fixed):**
```
Web Form → Create gallery in DB → Launch Desktop with galleryId →
Desktop uploads to EXISTING gallery → Pricing intact
```

### Implementation Steps

#### Step 1: Modify Gallery Creation Page
**File:** `src/app/photographer/galleries/create/page.tsx`

When user clicks "Desktop Upload":
1. Validate all form fields (same as web upload)
2. Create gallery in database with ALL pricing fields
3. Get back `gallery.id`
4. Launch desktop with: `photovault://auth?token=...&galleryId={gallery.id}`
5. Redirect web to upload status page: `/photographer/galleries/{id}/upload`

```typescript
// Pseudo-code for handleDesktopUpload()
const handleDesktopUpload = async () => {
  // 1. Validate form
  if (!validateForm()) return;

  // 2. Create gallery WITH pricing (same insert as web upload)
  const { data: gallery } = await supabase
    .from('photo_galleries')
    .insert({
      photographer_id: user?.id,
      client_id: selectedClientId,
      gallery_name: galleryName,
      // ... all the pricing fields
      payment_option_id: selectedPackageId,
      billing_mode: billingMode,
      shoot_fee: shootFeeCents,
      storage_fee: storageFeeCents,
      total_amount: totalCents,
      payment_status: 'pending',
      // ... metadata fields
    })
    .select()
    .single();

  // 3. Launch desktop with gallery ID
  const token = session?.access_token;
  window.location.href = `photovault://auth?token=${token}&userId=${user.id}&galleryId=${gallery.id}`;

  // 4. Redirect to upload status page
  router.push(`/photographer/galleries/${gallery.id}/upload`);
};
```

#### Step 2: Modify Upload Prepare API
**File:** `src/app/api/v1/upload/prepare/route.ts`

Accept optional `galleryId` parameter:
- If `galleryId` provided → verify ownership, use existing gallery
- If no `galleryId` → create new gallery (backwards compatibility)

```typescript
// Current (line 9-21)
const { fileName, fileSize, userId, galleryName, platform, clientId } = await request.json();

// New
const { fileName, fileSize, userId, galleryName, platform, clientId, galleryId } = await request.json();

// Add logic:
let gallery;

if (galleryId) {
  // Use existing gallery - verify ownership
  const { data: existing } = await supabase
    .from('photo_galleries')
    .select('*')
    .eq('id', galleryId)
    .eq('photographer_id', userId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Gallery not found or access denied' }, { status: 404 });
  }
  gallery = existing;
} else {
  // Create new gallery (current behavior - for backwards compatibility)
  const { data: newGallery } = await supabase
    .from('photo_galleries')
    .insert({
      photographer_id: userId,
      client_id: clientId || null,
      platform: platform || 'photovault',
      gallery_name: galleryName,
      photo_count: 0,
      session_date: new Date().toISOString(),
      is_imported: false
    })
    .select()
    .single();
  gallery = newGallery;
}

// Continue with storage path generation using gallery.id
```

#### Step 3: Modify Desktop App (If Needed)
**Location:** `photovault-desktop/` (separate repo)

The desktop app already receives `galleryId` via protocol URL. It just needs to:
1. Parse `galleryId` from URL params
2. Include it in the POST body to `/api/v1/upload/prepare`

```typescript
// When calling prepare endpoint, include galleryId if present
const response = await fetch(`${API_URL}/api/v1/upload/prepare`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName,
    fileSize,
    userId,
    galleryName,
    platform: 'photovault',
    clientId,
    galleryId: urlParams.galleryId || undefined  // NEW: pass through
  })
});
```

#### Step 4: Update Upload Status Page
**File:** `src/app/photographer/galleries/[id]/upload/page.tsx`

No major changes needed - this page already handles the upload flow for existing galleries. Just ensure it:
- Shows gallery name from existing record
- Displays pricing info for confirmation
- Handles "waiting for desktop upload" state

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `src/app/photographer/galleries/create/page.tsx` | Add `handleDesktopUpload()` that creates gallery first |
| `src/app/api/v1/upload/prepare/route.ts` | Accept optional `galleryId`, skip creation if provided |
| `photovault-desktop/` (TBD) | Pass `galleryId` from URL to API call |

---

## Edge Cases & Considerations

### 1. User closes desktop app without uploading
- Gallery exists with pricing but 0 photos
- **Mitigation:** Show warning on upload page, allow "Cancel Gallery" option

### 2. User refreshes create page after launching desktop
- Gallery already created, form reset
- **Mitigation:** Store `gallery.id` in URL or session storage, detect and redirect

### 3. Desktop app not installed
- Protocol URL fails silently
- **Current behavior:** Already handled - shows "Install Desktop App" modal

### 4. Backwards compatibility (old desktop app versions)
- Old app won't send `galleryId`, API falls back to creating new gallery
- **Result:** Old behavior preserved, but pricing still missing
- **Long-term:** Require app update or deprecate old versions

### 5. Race condition: Web creates, desktop uploads before page redirect
- Should be fine - desktop gets gallery ID immediately
- Upload happens to correct gallery

---

## Testing Plan

1. **Happy path:** Create gallery on web → Launch desktop → Upload ZIP → Verify pricing fields present → Client sees paywall

2. **Verification queries:**
```sql
-- Check gallery has pricing after desktop upload
SELECT id, gallery_name, total_amount, shoot_fee, storage_fee, payment_option_id
FROM photo_galleries
WHERE id = '{test-gallery-id}';
```

3. **Client paywall test:**
- Complete flow through to sending client email
- Click link as client
- Verify paywall appears with correct pricing

---

## Rollback Plan

If issues arise:
1. Revert gallery creation page changes
2. API change is backwards compatible (no `galleryId` = old behavior)
3. Desktop app change is additive (just passes extra param)

---

## Success Criteria

- [ ] Desktop-uploaded galleries have `total_amount > 0`
- [ ] Desktop-uploaded galleries have `payment_option_id` set
- [ ] Client viewing desktop-uploaded gallery sees paywall
- [ ] Payment flow completes successfully
- [ ] Photographer receives commission after client pays
