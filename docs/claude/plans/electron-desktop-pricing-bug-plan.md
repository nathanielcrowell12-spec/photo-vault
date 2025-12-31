# Electron: Desktop Upload Pricing Bug - Implementation Plan

## Summary

Galleries created via desktop app upload flow are missing pricing fields (`payment_option_id`, `billing_mode`, `shoot_fee`, `storage_fee`, `total_amount`, `gallery_status`), causing the paywall to NOT appear for clients. The root cause is that `/api/v1/upload/prepare` only creates a minimal gallery record without pricing information, whereas the web UI collects full pricing during gallery creation.

---

## Official Documentation Reference

**Electron Best Practices:**
- https://www.electronjs.org/docs/latest/tutorial/security
- https://www.electronjs.org/docs/latest/api/ipc-main
- https://www.electronjs.org/docs/latest/api/ipc-renderer

**Key Insights:**
- Desktop app cannot collect payment info (requires Stripe Elements in browser)
- IPC should pass structured data, not prompt for user input mid-upload
- Main process should validate all inputs before starting upload

---

## Root Cause Analysis

### What Web UI Does (Correct Flow)

**File:** `src/app/photographer/galleries/create/page.tsx`

The web gallery creation flow:
1. Photographer selects client
2. Enters gallery name, description, session date
3. **Chooses billing mode** (`all_in_one` or `storage_only`)
4. **Enters shoot fee** (for all_in_one mode)
5. **Selects storage package** (`year_package`, `six_month_package`, etc.)
6. System calculates pricing breakdown using `calculateAllInOnePricing()`
7. Gallery created with ALL pricing fields populated
8. Redirects to `/photographer/galleries/[id]/upload` to add photos

**Fields populated:**
```typescript
{
  payment_option_id: selectedPackageId,        // e.g., 'year_package'
  billing_mode: billingMode,                   // 'all_in_one' or 'storage_only'
  shoot_fee: shootFeeCents,                    // e.g., 250000 (= $2500)
  storage_fee: storageFeeCents,                // e.g., 10000 (= $100)
  total_amount: totalCents,                    // shoot_fee + storage_fee
  payment_status: 'pending',
  gallery_status: 'draft',
  gallery_expires_at: expiryDate,
  download_tracking_enabled: selectedPackageId === 'shoot_only',
  // ... etc
}
```

### What Desktop App Does (Missing Pricing)

**File:** `src/app/api/v1/upload/prepare/route.ts`

Current desktop upload flow:
1. Desktop app sends: `{ fileName, fileSize, userId, galleryName, platform, clientId }`
2. API creates gallery with ONLY basic fields:
```typescript
{
  photographer_id: userId,
  client_id: clientId || null,
  platform: platform || 'photovault',
  gallery_name: galleryName,
  photo_count: 0,
  session_date: new Date().toISOString(),
  is_imported: false
  // ❌ NO PRICING FIELDS
}
```
3. Returns storage path for upload
4. After upload completes, gallery exists but has NO pricing data
5. **Paywall never appears** because `payment_option_id` is NULL

### Database Schema Validation

**File:** `database/add-pricing-columns-to-photo-galleries.sql`

All these fields are **nullable** (with defaults), so gallery creation succeeds:
- `payment_option_id VARCHAR(50) DEFAULT NULL`
- `billing_mode VARCHAR(20) DEFAULT 'storage_only'`
- `shoot_fee INTEGER DEFAULT 0`
- `storage_fee INTEGER DEFAULT 0`
- `total_amount INTEGER DEFAULT 0`
- `payment_status VARCHAR(20) DEFAULT 'pending'`
- `gallery_status VARCHAR(20) DEFAULT 'draft'`

**But:** The paywall logic likely checks `if (payment_option_id)` - if NULL, no paywall shows.

---

## Existing Codebase Patterns

### Desktop Upload Flow

**Desktop renderer.js (lines 210-215):**
```javascript
const result = await window.electronAPI.startUpload({
  filePaths: selectedFiles,
  userId: currentUserId,
  galleryName: galleryNameInput.value.trim(),
  platform: 'PhotoVault'
  // ❌ No pricing info sent
})
```

**Hub API `/api/v1/upload/prepare` (lines 24-36):**
```typescript
const { data: gallery, error: galleryError } = await supabase
  .from('photo_galleries')
  .insert({
    photographer_id: userId,
    client_id: clientId || null,
    platform: platform || 'photovault',
    gallery_name: galleryName,
    photo_count: 0,
    session_date: new Date().toISOString(),
    is_imported: false
    // ❌ Missing all pricing fields
  })
```

### Payment Models Reference

**File:** `src/lib/payment-models.ts`

Available storage packages:
- `year_package`: $100 (12 months) → $50 commission
- `six_month_package`: $50 (6 months) → $25 commission
- `six_month_trial`: $20 (6 months, no renewal) → $10 commission
- `shoot_only`: $0 (no storage, 90 days max)

**Key Functions:**
- `getPhotographerPaymentOptions()` - Returns packages photographers can offer
- `calculateAllInOnePricing(shootFee, packageId)` - Calculates breakdown
- `getPaymentOptionSummary(packageId)` - User-friendly description

### No Default Pricing Storage Found

**Search Results:**
- ❌ No `photographer_settings` table
- ❌ No `default_pricing` fields in `user_profiles`
- ❌ No `default_pricing` fields in `photographers` table

Photographers do NOT have default pricing stored anywhere. Each gallery creation requires explicit pricing selection.

---

## Architecture Decision: Recommended Approach

### Option A: Add Pricing Fields to Desktop App UI ❌ REJECTED

**Pros:**
- Complete data at upload time
- No post-upload step needed

**Cons:**
- Desktop app would need Stripe pricing knowledge (violates separation of concerns)
- Requires UI redesign for desktop app
- Photographer would see pricing UI twice (desktop + web confirmation)
- Desktop app should focus on file upload, not business logic

### Option B: Pull Default Pricing from Photographer Settings ❌ REJECTED

**Pros:**
- Photographer sets defaults once
- Desktop upload auto-applies defaults

**Cons:**
- No such settings exist currently (requires new feature)
- Photographers price each session differently - no "default" makes sense
- Would still need UI for photographers to set defaults
- Band-aid fix, not addressing real issue

### Option C: Redirect to Pricing Page After Upload ✅ **RECOMMENDED**

**Pros:**
- Separates concerns: Desktop handles upload, Hub handles business logic
- Leverages existing web UI for pricing (already built and tested)
- No desktop app changes needed (minimal code change)
- Matches photographer mental model: "Upload photos first, set pricing after"
- Works with existing paywall logic (just needs pricing populated)

**Cons:**
- Requires two-step process (upload, then price)
- Gallery exists in "draft" state temporarily

**Why This is Best:**
1. **Separation of Concerns** - Desktop app = file uploader, not business logic system
2. **Reuses Existing UI** - Web pricing UI is already built, tested, UX-optimized
3. **Minimal Code Change** - Only need to redirect after upload completes
4. **Future-Proof** - If pricing models change, only web UI needs updating

---

## Implementation Steps

### Step 1: Create Pricing Setup Page

**New File:** `src/app/photographer/galleries/[id]/pricing/page.tsx`

This page will:
1. Display gallery info (name, client, photo count)
2. Show pricing form (billing mode, shoot fee, storage package)
3. Use same pricing logic as create page (`calculateAllInOnePricing`)
4. Update gallery record with pricing fields
5. Redirect to gallery detail page after save

**Template from:** `src/app/photographer/galleries/create/page.tsx` (lines 623-810)
- Copy billing mode selection (lines 623-666)
- Copy pricing form (lines 668-739)
- Copy summary display (lines 742-810)
- Replace gallery creation with UPDATE query

### Step 2: Update Desktop Upload Process Route

**File:** `src/app/api/v1/upload/process/route.ts`

**Current behavior (line 233):**
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

**Add after update (line 235):**
```typescript
// Check if gallery has pricing info
const { data: gallery } = await supabase
  .from('photo_galleries')
  .select('payment_option_id, photographer_id')
  .eq('id', galleryId)
  .single()

// If no pricing, flag it as needing setup
const needsPricing = !gallery?.payment_option_id

send({
  progress: 100,
  message: `Successfully imported ${uploadedCount} photos!`,
  complete: true,
  galleryId: galleryId,
  needsPricing: needsPricing,  // NEW FLAG
  photographerId: gallery?.photographer_id
})
```

### Step 3: Update Desktop App to Handle Redirect

**File:** `photovault-desktop/ui/renderer.js`

**Current success handler (around line 280):**
```javascript
window.electronAPI.onUploadComplete((data) => {
  // ...existing success UI...
})
```

**Add redirect logic:**
```javascript
window.electronAPI.onUploadComplete((data) => {
  if (data.complete) {
    uploadBtn.disabled = false
    cancelBtn.classList.add('hidden')

    // Show success message
    fileName.textContent = data.message
    progressText.textContent = '100%'

    // If pricing needed, open web browser to pricing page
    if (data.needsPricing) {
      const webUrl = getWebUrl() // From config
      const pricingUrl = `${webUrl}/photographer/galleries/${data.galleryId}/pricing`

      showStatus('Upload complete! Opening browser to set pricing...')
      window.electronAPI.openExternal(pricingUrl)
    } else {
      showSuccess('Upload complete!')
    }
  }
})
```

### Step 4: Update `/api/v1/upload/prepare` to Set Gallery Status

**File:** `src/app/api/v1/upload/prepare/route.ts` (lines 24-36)

Add `gallery_status: 'draft'` to make it explicit:

```typescript
const { data: gallery, error: galleryError } = await supabase
  .from('photo_galleries')
  .insert({
    photographer_id: userId,
    client_id: clientId || null,
    platform: platform || 'photovault',
    gallery_name: galleryName,
    photo_count: 0,
    session_date: new Date().toISOString(),
    is_imported: false,
    gallery_status: 'draft'  // NEW: Explicit draft state until pricing set
  })
  .select()
  .single()
```

### Step 5: Update Pricing Page to Mark Gallery Active

**In new pricing page, after successful pricing save:**

```typescript
const { error: updateError } = await supabase
  .from('photo_galleries')
  .update({
    payment_option_id: selectedPackageId,
    billing_mode: billingMode,
    shoot_fee: shootFeeCents,
    storage_fee: storageFeeCents,
    total_amount: totalCents,
    payment_status: 'pending',
    gallery_status: 'active',  // ✅ Now fully configured
    gallery_expires_at: expiryDate,
    download_tracking_enabled: selectedPackageId === 'shoot_only',
    total_photos_to_download: photoCount,
    // ... other fields
  })
  .eq('id', galleryId)

if (!updateError) {
  // Redirect to gallery detail or sneak peek selection
  router.push(`/photographer/galleries/${galleryId}`)
}
```

---

## Code Examples

### New Pricing Setup Page (Simplified)

**File:** `src/app/photographer/galleries/[id]/pricing/page.tsx`

```typescript
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import {
  getPhotographerPaymentOptions,
  calculateAllInOnePricing,
  type PaymentOption
} from '@/lib/payment-models'

export default function GalleryPricingPage() {
  const { user, userType } = useAuth()
  const router = useRouter()
  const params = useParams()
  const galleryId = params.id as string

  const [gallery, setGallery] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Pricing state (same as create page)
  const [billingMode, setBillingMode] = useState<'storage_only' | 'all_in_one'>('all_in_one')
  const [shootFee, setShootFee] = useState('')
  const [selectedPackageId, setSelectedPackageId] = useState('')

  const paymentOptions = useMemo(() => getPhotographerPaymentOptions(), [])

  // Fetch gallery info
  useEffect(() => {
    async function fetchGallery() {
      const { data, error } = await supabase
        .from('photo_galleries')
        .select('*, clients(*)')
        .eq('id', galleryId)
        .single()

      if (error) {
        console.error('Error fetching gallery:', error)
        return
      }

      setGallery(data)
      setLoading(false)
    }

    fetchGallery()
  }, [galleryId])

  // Calculate pricing (same logic as create page)
  const pricingSummary = useMemo(() => {
    const shootFeeNum = parseFloat(shootFee) || 0
    const selectedPackage = paymentOptions.find(p => p.id === selectedPackageId)

    if (billingMode === 'storage_only') {
      const storageFee = selectedPackage?.price || 0
      const storageCommission = (storageFee * (selectedPackage?.photographer_commission || 0)) / 100
      return {
        mode: 'storage_only' as const,
        shootFee: 0,
        storageFee,
        totalAmount: storageFee,
        photographerPayout: storageCommission,
        photovaultRevenue: storageFee - storageCommission,
      }
    } else {
      const pricing = calculateAllInOnePricing(shootFeeNum, selectedPackageId)
      return pricing || {
        mode: 'all_in_one' as const,
        shootFee: shootFeeNum,
        storageFee: 0,
        totalAmount: shootFeeNum,
        photographerPayout: shootFeeNum,
        photovaultRevenue: 0,
      }
    }
  }, [billingMode, shootFee, selectedPackageId, paymentOptions])

  // Calculate expiry date
  const getExpiryDate = () => {
    const now = new Date()
    switch (selectedPackageId) {
      case 'year_package':
        return new Date(now.setMonth(now.getMonth() + 12))
      case 'six_month_package':
      case 'six_month_trial':
        return new Date(now.setMonth(now.getMonth() + 6))
      case 'shoot_only':
        return new Date(now.setDate(now.getDate() + 90))
      default:
        return null
    }
  }

  // Save pricing
  const handleSavePricing = async () => {
    if (!selectedPackageId) {
      alert('Please select a storage package')
      return
    }

    if (billingMode === 'all_in_one' && shootFee === '') {
      alert('Please enter your shoot fee (or 0 for free shoots)')
      return
    }

    setSaving(true)

    try {
      const shootFeeNum = parseFloat(shootFee) || 0
      const shootFeeCents = Math.round(shootFeeNum * 100)
      const selectedPackage = paymentOptions.find(p => p.id === selectedPackageId)
      const storageFeeCents = Math.round((selectedPackage?.price || 0) * 100)
      const totalCents = billingMode === 'all_in_one'
        ? shootFeeCents + storageFeeCents
        : storageFeeCents

      const expiryDate = getExpiryDate()

      const { error: updateError } = await supabase
        .from('photo_galleries')
        .update({
          payment_option_id: selectedPackageId,
          billing_mode: billingMode,
          shoot_fee: billingMode === 'all_in_one' ? shootFeeCents : 0,
          storage_fee: storageFeeCents,
          total_amount: totalCents,
          payment_status: 'pending',
          gallery_status: 'active', // ✅ Mark as active now that pricing is set
          gallery_expires_at: expiryDate?.toISOString() || null,
          download_tracking_enabled: selectedPackageId === 'shoot_only',
          total_photos_to_download: gallery?.photo_count || 0,
        })
        .eq('id', galleryId)

      if (updateError) throw updateError

      // Redirect to gallery detail page
      router.push(`/photographer/galleries/${galleryId}`)

    } catch (error) {
      console.error('Error saving pricing:', error)
      alert('Failed to save pricing. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Set Pricing for {gallery?.gallery_name}</h1>
          <p className="text-muted-foreground">
            {gallery?.photo_count} photos uploaded. Now set your pricing to activate the gallery.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Copy billing mode card from create page (lines 623-666) */}
        {/* Copy pricing form from create page (lines 668-739) */}
        {/* Copy summary from create page (lines 742-810) */}

        <Button
          onClick={handleSavePricing}
          disabled={saving || !selectedPackageId || (billingMode === 'all_in_one' && shootFee === '')}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Pricing & Activate Gallery'}
        </Button>
      </main>
    </div>
  )
}
```

### Desktop App Redirect Handler

**File:** `photovault-desktop/ui/renderer.js`

```javascript
// Add helper to get web URL from config
async function getWebUrl() {
  // Desktop app should have config.json with webUrl
  // Default to localhost for dev
  return 'http://localhost:3002' // Or read from config
}

// Update upload complete handler
window.electronAPI.onUploadComplete(async (data) => {
  if (data.complete) {
    uploadBtn.disabled = false
    cancelBtn.classList.add('hidden')
    progressFill.style.width = '100%'
    progressText.textContent = '100%'

    if (data.needsPricing) {
      // Gallery uploaded but needs pricing
      fileName.textContent = 'Upload complete! Opening browser to set pricing...'
      fileSize.textContent = `${data.totalPhotos} photos uploaded`

      const webUrl = await getWebUrl()
      const pricingUrl = `${webUrl}/photographer/galleries/${data.galleryId}/pricing`

      // Open browser to pricing page
      await window.electronAPI.openExternal(pricingUrl)

      // Show success after short delay
      setTimeout(() => {
        showSuccess('Photos uploaded! Complete pricing setup in your browser.')
      }, 1000)
    } else {
      // Gallery already has pricing (shouldn't happen for desktop uploads, but handle it)
      showSuccess(`Upload complete! ${data.totalPhotos} photos uploaded.`)
    }
  }
})
```

---

## Files to Create/Modify

| File | Changes |
|------|---------|
| **NEW:** `src/app/photographer/galleries/[id]/pricing/page.tsx` | New pricing setup page (copy from create page, adapt for update) |
| `src/app/api/v1/upload/prepare/route.ts` | Add `gallery_status: 'draft'` to insert |
| `src/app/api/v1/upload/process/route.ts` | Check if pricing exists, add `needsPricing` flag to response |
| `photovault-desktop/ui/renderer.js` | Handle `needsPricing` flag, open browser to pricing page |
| `photovault-desktop/src/preload.ts` | Add `openExternal(url)` IPC method (if not exists) |
| `photovault-desktop/src/main.ts` | Add IPC handler for `openExternal` using `shell.openExternal(url)` |

---

## Security Considerations

### IPC Security

**Desktop app must validate URLs before opening:**

```typescript
// src/main.ts
ipcMain.handle('open-external', async (event, url: string) => {
  // SECURITY: Only allow opening PhotoVault domain URLs
  const allowedHosts = [
    'localhost:3002',      // Dev
    'photovault.photo',    // Prod
  ]

  try {
    const urlObj = new URL(url)
    const isAllowed = allowedHosts.some(host =>
      urlObj.host === host || urlObj.host.endsWith(`.${host}`)
    )

    if (!isAllowed) {
      console.error('Blocked attempt to open external URL:', url)
      return { success: false, error: 'Invalid URL' }
    }

    await shell.openExternal(url)
    return { success: true }
  } catch (error) {
    console.error('Error opening URL:', error)
    return { success: false, error: 'Failed to open URL' }
  }
})
```

### Pricing Page Access Control

**Ensure only photographer can access pricing page:**

```typescript
// src/app/photographer/galleries/[id]/pricing/page.tsx
useEffect(() => {
  if (!user) {
    router.push('/login')
    return
  }

  if (userType !== 'photographer') {
    router.push('/dashboard')
    return
  }

  // Verify photographer owns this gallery
  async function verifyOwnership() {
    const { data: gallery } = await supabase
      .from('photo_galleries')
      .select('photographer_id')
      .eq('id', galleryId)
      .single()

    if (gallery?.photographer_id !== user.id) {
      router.push('/photographer/dashboard')
      return
    }
  }

  verifyOwnership()
}, [user, userType, galleryId, router])
```

---

## Testing Steps

### Test Case 1: Fresh Desktop Upload

1. Open PhotoVault Desktop app
2. Authenticate as photographer
3. Select ZIP file with photos
4. Enter gallery name
5. Start upload
6. **VERIFY:** Upload completes successfully
7. **VERIFY:** Browser opens to `/photographer/galleries/[id]/pricing`
8. **VERIFY:** Pricing page shows gallery name and photo count
9. Select billing mode, shoot fee, storage package
10. Click "Save Pricing & Activate Gallery"
11. **VERIFY:** Redirects to gallery detail page
12. **VERIFY:** Gallery status is "active"
13. **VERIFY:** Paywall appears for client when viewing gallery

### Test Case 2: Existing Gallery (Already Has Pricing)

1. Create gallery via web UI with pricing
2. Navigate to gallery upload page
3. Upload photos
4. **VERIFY:** No pricing redirect (gallery already configured)
5. **VERIFY:** Paywall still works correctly

### Test Case 3: Pricing Page Direct Access

1. Create draft gallery via desktop upload
2. Don't complete pricing setup
3. Later, manually navigate to `/photographer/galleries/[id]/pricing`
4. **VERIFY:** Page loads and shows pricing form
5. Complete pricing
6. **VERIFY:** Gallery activates

### Test Case 4: Security - Wrong Photographer

1. User A creates gallery via desktop upload
2. User B tries to access `/photographer/galleries/[user-a-gallery-id]/pricing`
3. **VERIFY:** Redirected to dashboard (access denied)

### Test Case 5: Client Viewing Draft Gallery

1. Create gallery via desktop upload (no pricing)
2. Client tries to view gallery
3. **VERIFY:** Either redirects to "Gallery not available" or shows "Pricing setup pending"

---

## Build & Distribution

### No Changes to electron-builder Config

This solution requires:
- ✅ No new desktop app dependencies
- ✅ No changes to IPC methods (uses existing `openExternal` or add simple handler)
- ✅ No platform-specific code

**If `openExternal` doesn't exist:**

Add to `src/preload.ts`:
```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing methods ...
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url)
})
```

Add to `src/main.ts`:
```typescript
ipcMain.handle('open-external', async (event, url: string) => {
  // See security section above for validation
  await shell.openExternal(url)
  return { success: true }
})
```

---

## Gotchas & Warnings

### 1. Gallery Status State Machine

Galleries now have three states:
- `draft` - Created but no pricing (desktop uploads start here)
- `active` - Pricing set, ready for client viewing
- `complete` - All workflow steps done (sneak peek, etc.)

**RLS policies must allow:**
- Photographers to view/edit `draft` galleries
- Clients should NOT see `draft` galleries

### 2. Desktop App User Experience

**Current flow:**
1. User uploads photos
2. Desktop app says "Upload complete!"
3. Browser suddenly opens

**Better UX:**
Show message like:
> "Upload complete! Opening browser to set pricing. You can close this window."

### 3. Backward Compatibility

**Existing galleries created via desktop app:**
- Already in database with NULL pricing
- Need migration or manual fix
- Consider adding admin tool to list galleries missing pricing

**Migration query:**
```sql
-- Find galleries created via desktop with missing pricing
SELECT id, gallery_name, photographer_id, created_at
FROM photo_galleries
WHERE platform = 'photovault'
  AND payment_option_id IS NULL
  AND photo_count > 0
ORDER BY created_at DESC;
```

### 4. Multi-Platform Differences

**Windows:**
- `shell.openExternal()` opens default browser ✅

**macOS:**
- Same behavior ✅

**Linux:**
- May prompt user which browser to use (OS dependent) ⚠️

### 5. Offline Upload Scenario

**What if photographer uploads while offline?**
- Desktop app can upload to Supabase (works offline if storage available)
- But browser redirect will fail (no internet)

**Solution:**
- Desktop app should detect online/offline status
- If offline: Show message "Upload complete! Set pricing at: [URL]" (copyable)
- If online: Open browser automatically

---

## Alternative Approach (Not Recommended)

### If User Insists on Desktop-Only Pricing

**Could add minimal pricing to desktop app:**
1. Desktop app prompts for storage package ONLY
2. Defaults to `shoot_only` (no storage fee)
3. Sends `payment_option_id` to `/api/v1/upload/prepare`
4. Hub API creates gallery with minimal pricing

**Why this is worse:**
- Desktop app now needs business logic (pricing models)
- Still missing shoot fee (can't collect payment info in Electron)
- Photographer would need to edit pricing in web UI anyway
- Violates separation of concerns

**Only do this if:**
- User explicitly rejects the redirect approach
- Photographer workflow absolutely cannot handle browser redirect
- Acceptable to have "incomplete" pricing that requires web editing

---

## Migration Plan for Existing Galleries

### Step 1: Identify Affected Galleries

```sql
-- Find desktop-uploaded galleries missing pricing
SELECT
  pg.id,
  pg.gallery_name,
  pg.photographer_id,
  pg.photo_count,
  pg.created_at,
  up.full_name as photographer_name
FROM photo_galleries pg
LEFT JOIN user_profiles up ON pg.photographer_id = up.id
WHERE pg.platform = 'photovault'
  AND pg.payment_option_id IS NULL
  AND pg.photo_count > 0
  AND pg.is_imported = true
ORDER BY pg.created_at DESC;
```

### Step 2: Email Affected Photographers

**Email template:**
> Subject: Action Required: Set Pricing for Your Galleries
>
> Hi [Photographer Name],
>
> We noticed some of your galleries are missing pricing information. This means your clients cannot see the paywall and aren't being charged for storage.
>
> Affected galleries:
> - [Gallery Name] - [Photo Count] photos - [Created Date]
>
> **Action Required:**
> Please set pricing for each gallery by visiting:
> [Link to pricing page]
>
> This is a one-time fix. Future desktop uploads will automatically prompt you to set pricing.

### Step 3: Add Dashboard Warning

**In photographer dashboard, show alert:**
```typescript
// Fetch galleries missing pricing
const { data: missingPricingGalleries } = await supabase
  .from('photo_galleries')
  .select('id, gallery_name')
  .eq('photographer_id', user.id)
  .is('payment_option_id', null)
  .gt('photo_count', 0)

{missingPricingGalleries && missingPricingGalleries.length > 0 && (
  <Alert variant="warning">
    <AlertTitle>Pricing Required</AlertTitle>
    <AlertDescription>
      {missingPricingGalleries.length} galleries need pricing setup.
      <ul>
        {missingPricingGalleries.map(g => (
          <li key={g.id}>
            <Link href={`/photographer/galleries/${g.id}/pricing`}>
              {g.gallery_name} - Set Pricing
            </Link>
          </li>
        ))}
      </ul>
    </AlertDescription>
  </Alert>
)}
```

---

## Success Criteria

✅ **Desktop upload flow:**
1. Photographer uploads photos via desktop app
2. Upload completes successfully
3. Browser opens to pricing page automatically
4. Photographer sets pricing
5. Gallery becomes active
6. Client can view gallery and sees paywall

✅ **Web upload flow:**
1. Unchanged - still collects pricing during gallery creation

✅ **Security:**
1. Only photographer can access pricing page for their galleries
2. Desktop app only opens PhotoVault domain URLs

✅ **Backward compatibility:**
1. Existing galleries with pricing still work
2. Existing draft galleries can be completed via pricing page

✅ **User experience:**
1. Clear messaging when browser opens
2. Pricing page shows gallery context (name, photos, client)
3. Redirect after pricing save goes to logical next step

---

## Timeline Estimate

| Task | Effort | Dependencies |
|------|--------|--------------|
| Create pricing page | 3 hours | None |
| Update upload process API | 1 hour | None |
| Update desktop renderer.js | 1 hour | None |
| Add IPC handlers (if needed) | 1 hour | None |
| Testing (all scenarios) | 2 hours | All above |
| Migration plan execution | 1 hour | Deployment |
| **TOTAL** | **9 hours** | Sequential |

---

## Questions for User

1. **Confirm approach:** Is the "redirect to pricing page after upload" approach acceptable?
2. **Migration:** Should we auto-email photographers with galleries missing pricing, or just add dashboard warning?
3. **Default package:** Should there be a sensible default package selected on pricing page (e.g., `year_package`)?
4. **Gallery visibility:** Should clients be able to see draft galleries (with "Pricing pending" message), or completely hide them?

---

*End of Implementation Plan*
