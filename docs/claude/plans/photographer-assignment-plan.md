# Photographer Assignment to Gallery - Implementation Plan

**Date:** January 19, 2026
**Feature:** Allow admins to assign photographers to galleries, with onboarding email for inactive photographers
**Status:** REVISED - QA Critic Feedback Addressed
**Revision:** v2 (Post-QA Critique)

---

## Executive Summary

This feature enables admins to assign a photographer to a gallery (connecting `photo_galleries.photographer_id` to a user). When the assigned photographer has not yet completed Stripe Connect onboarding, the system sends an onboarding email explaining PhotoVault, the 50/50 commission model, and how to activate their account.

**Key Safety Finding:** The edge case of "gallery assigned to inactive photographer" is ALREADY SAFE. The checkout flow at `src/app/api/stripe/gallery-checkout/route.ts` (lines 141-154) blocks payment if the photographer has no active Stripe Connect account. Clients see: "The photographer needs to complete their payment setup before you can pay."

---

## QA Critique Responses

| Concern | Resolution |
|---------|------------|
| Wrong Supabase import | Using `createServerSupabaseClient` from `@/lib/supabase` |
| Email retrieval pattern | Using `auth.admin.listUsers()` with Map lookup |
| Non-existent Alert component | Using inline warning div pattern from existing codebase |
| Query syntax for gallery count | Using JavaScript aggregation pattern |
| Email template location | Adding to `critical-templates.ts` |
| `isAdmin` derivation | Using `const isAdmin = userType === 'admin'` from `useAuth()` |
| `photographer_name` preservation | Preserving if exists, only updating on fresh assignment |
| Race condition risk | Documented as acceptable for beta scale |
| Unassign flow | Explicitly documented with null option |

---

## Research Findings

### Current Database Schema

**`photo_galleries` table:**
- `photographer_id` (UUID, FK to user_profiles) - What we need to SET
- `photographer_name` (TEXT) - Display name, can be set independently
- `client_id` (UUID, FK to clients table) - Client assignment

**`photographers` table:**
- `id` (UUID, FK to user_profiles)
- `stripe_connect_account_id` (TEXT)
- `stripe_connect_status` (TEXT: 'not_started', 'pending', 'active')

**`user_profiles` table:**
- `id` (UUID, PK)
- `user_type` (TEXT: 'photographer', 'client', 'admin', 'secondary')
- `full_name` (TEXT)
- `payment_status` (TEXT) - maps to stripe_connect_status

### Current Users in Database

| User | Type | Stripe Connect Status |
|------|------|----------------------|
| Nathaniel Crowell | admin | N/A |
| Kelly Moran | photographer | not_started |
| Kaitlyn Crowell | client | N/A (client, not photographer) |

### Existing Code Patterns to Follow

**`src/app/api/admin/photographers/route.ts`:**
- Uses `createServerSupabaseClient` from `@/lib/supabase`
- Uses `supabase.auth.admin.listUsers()` to get emails, maps by ID
- JavaScript aggregation for counts
- No explicit admin check (relies on route protection / RLS)

**`src/components/GalleryEditModal.tsx`:**
- Uses `useAuth()` hook to get `userType`
- Pattern: `const isAdmin = userType === 'admin'`
- Uses inline div for warnings, not Alert component

### Payment Safety Check (CRITICAL)

**Location:** `src/app/api/stripe/gallery-checkout/route.ts` lines 141-154

```typescript
// CRITICAL: Block payment if photographer can't receive money
if (!photographerRecord?.stripe_connect_account_id || photographerRecord.stripe_connect_status !== 'active') {
  return NextResponse.json({
    error: 'Payment setup incomplete',
    message: 'The photographer needs to complete their payment setup before you can pay.',
    code: 'PHOTOGRAPHER_STRIPE_MISSING',
  }, { status: 400 })
}
```

**Conclusion:** System is SAFE. Client cannot pay until photographer activates Stripe Connect.

---

## Design Decisions

### 1. Photographer Lookup Method

**Chosen:** **Dropdown of existing photographers** (with "None" option for unassignment)

**Rationale:**
- For MVP beta, we only have a few photographers
- Dropdown is simplest to implement
- Can add invite flow later when needed

### 2. When to Send Onboarding Email

**Trigger:** When gallery is assigned to photographer AND photographer's `payment_status !== 'active'`

**Email NOT sent if:**
- Photographer already has active Stripe Connect
- Photographer was already assigned to this gallery (re-assignment)

### 3. UI Location

**Primary:** `GalleryEditModal.tsx` - Add photographer dropdown alongside existing client dropdown

### 4. Photographer Name Handling

**Rule:** Preserve existing `photographer_name` if it exists; only update on fresh assignment where no name exists.

```typescript
photographer_name: gallery.photographer_name || photographer.full_name,
```

### 5. Unassign Flow

**UI:** Dropdown includes "None" option
**API:** Pass `photographer_id: null` to clear assignment
**Effect:** Removes photographer_id but preserves photographer_name (for historical display)

---

## Database Changes

### No Schema Changes Required

The `photo_galleries.photographer_id` column already exists. We're just setting it via UI.

---

## API Routes

### 1. List Photographers (for dropdown) - USES EXISTING ENDPOINT

**Endpoint:** `GET /api/admin/photographers` (ALREADY EXISTS)

**This endpoint already provides:**
- Photographer IDs
- Names (business_name or full_name)
- Payment status (maps to stripe_connect_status)

**No changes needed** - just consume existing endpoint in UI.

### 2. Assign Photographer to Gallery (NEW)

**Endpoint:** `PATCH /api/admin/galleries/[galleryId]/assign-photographer`

**Auth:** Admin only (check userType in route)

**Request Body:**
```typescript
{
  photographer_id: string | null;  // null to unassign
  send_onboarding_email?: boolean; // Default true if photographer is inactive
}
```

**Response:**
```typescript
{
  success: boolean;
  gallery: { id: string; photographer_id: string | null; photographer_name: string };
  email_sent?: boolean;
  message: string;
}
```

**Implementation:**

```typescript
// src/app/api/admin/galleries/[galleryId]/assign-photographer/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { EmailService } from '@/lib/email/email-service'
import { logger } from '@/lib/logger'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { galleryId } = await params

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (adminProfile?.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { photographer_id, send_onboarding_email = true } = await req.json()

    // Get gallery info (to check existing assignment and preserve name)
    const { data: gallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .select('id, name, photographer_id, photographer_name')
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // Handle unassignment (null photographer_id)
    if (photographer_id === null) {
      const { error: updateError } = await supabase
        .from('photo_galleries')
        .update({
          photographer_id: null,
          // Preserve photographer_name for historical display
          updated_at: new Date().toISOString(),
        })
        .eq('id', galleryId)

      if (updateError) {
        logger.error('[AssignPhotographer] Update error:', updateError)
        return NextResponse.json({ error: 'Failed to unassign photographer' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        gallery: {
          id: galleryId,
          photographer_id: null,
          photographer_name: gallery.photographer_name,
        },
        message: 'Photographer unassigned from gallery.',
      })
    }

    // Get photographer info
    const { data: photographer, error: photographerError } = await supabase
      .from('user_profiles')
      .select('id, full_name, payment_status')
      .eq('id', photographer_id)
      .eq('user_type', 'photographer')
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json({ error: 'Photographer not found' }, { status: 404 })
    }

    // Check if already assigned to this photographer (skip email if so)
    // NOTE: Race condition possible but acceptable at beta scale
    const wasAlreadyAssigned = gallery.photographer_id === photographer_id

    // Update gallery
    // Preserve existing photographer_name if it exists, otherwise use photographer's full_name
    const newPhotographerName = gallery.photographer_name || photographer.full_name

    const { error: updateError } = await supabase
      .from('photo_galleries')
      .update({
        photographer_id: photographer_id,
        photographer_name: newPhotographerName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', galleryId)

    if (updateError) {
      logger.error('[AssignPhotographer] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to assign photographer' }, { status: 500 })
    }

    // Send onboarding email if photographer is inactive and not already assigned
    let emailSent = false
    const isInactive = photographer.payment_status !== 'active'

    if (send_onboarding_email && isInactive && !wasAlreadyAssigned) {
      try {
        // Get photographer's email using established pattern
        const { data: authData } = await supabase.auth.admin.listUsers({
          perPage: 1000,
        })

        const photographerEmail = authData?.users?.find(u => u.id === photographer_id)?.email

        if (photographerEmail) {
          const emailService = new EmailService()
          await emailService.sendPhotographerGalleryAssignmentEmail({
            to: photographerEmail,
            photographerName: photographer.full_name || 'Photographer',
            galleryName: gallery.name || 'Untitled Gallery',
            onboardingUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/photographer/onboarding`,
          })
          emailSent = true
          logger.info('[AssignPhotographer] Onboarding email sent to:', photographerEmail)
        } else {
          logger.warn('[AssignPhotographer] No email found for photographer:', photographer_id)
        }
      } catch (emailError) {
        logger.error('[AssignPhotographer] Email send failed:', emailError)
        // Don't fail the request - assignment succeeded, email is best-effort
      }
    }

    return NextResponse.json({
      success: true,
      gallery: {
        id: galleryId,
        photographer_id: photographer_id,
        photographer_name: newPhotographerName,
      },
      email_sent: emailSent,
      message: emailSent
        ? `Photographer assigned. Onboarding email sent to ${photographer.full_name}.`
        : wasAlreadyAssigned
          ? 'Photographer already assigned to this gallery.'
          : 'Photographer assigned successfully.',
    })
  } catch (error) {
    logger.error('[AssignPhotographer] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to assign photographer' },
      { status: 500 }
    )
  }
}
```

---

## Email Template

### Add to `src/lib/email/critical-templates.ts`

Following the established pattern in the file:

```typescript
// Add to critical-templates.ts

export interface PhotographerGalleryAssignmentParams {
  photographerName: string
  galleryName: string
  onboardingUrl: string
}

export function getPhotographerGalleryAssignmentEmailHTML(params: PhotographerGalleryAssignmentParams): string {
  const { photographerName, galleryName, onboardingUrl } = params

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">PhotoVault</h1>
        <p style="color: #666; margin: 5px 0;">Professional Photo Gallery Platform</p>
      </div>

      <h2 style="color: #1f2937;">Hi ${photographerName},</h2>

      <p>Great news! You've been assigned to a new gallery on PhotoVault:</p>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 18px; font-weight: 600;">${galleryName}</p>
      </div>

      <h3 style="color: #1f2937;">What is PhotoVault?</h3>
      <p>PhotoVault is a professional photo delivery platform where photographers share galleries with clients. When clients purchase access, you earn commissions automatically.</p>

      <h3 style="color: #1f2937;">How You Earn</h3>
      <ul style="padding-left: 20px;">
        <li><strong>Year 1:</strong> When a client pays $100 for gallery access, you receive <strong>$50</strong> (50% commission)</li>
        <li><strong>Year 2+:</strong> When clients renew at $8/month, you receive <strong>$4/month</strong> passive income</li>
      </ul>

      <h3 style="color: #1f2937;">Complete Your Setup</h3>
      <p>To receive payments, you need to complete a quick Stripe Connect setup (takes ~2 minutes). Until this is done, clients won't be able to pay for the gallery.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${onboardingUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Complete Setup &rarr;
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        Questions? Reply to this email or contact support@photovault.photo
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        PhotoVault - Professional Photo Galleries<br>
        <a href="https://photovault.photo" style="color: #9ca3af;">photovault.photo</a>
      </p>
    </body>
    </html>
  `
}

export function getPhotographerGalleryAssignmentEmailText(params: PhotographerGalleryAssignmentParams): string {
  const { photographerName, galleryName, onboardingUrl } = params

  return `
Hi ${photographerName},

Great news! You've been assigned to a new gallery on PhotoVault:

${galleryName}

WHAT IS PHOTOVAULT?
PhotoVault is a professional photo delivery platform where photographers share galleries with clients. When clients purchase access, you earn commissions automatically.

HOW YOU EARN
- Year 1: When a client pays $100 for gallery access, you receive $50 (50% commission)
- Year 2+: When clients renew at $8/month, you receive $4/month passive income

COMPLETE YOUR SETUP
To receive payments, you need to complete a quick Stripe Connect setup (takes ~2 minutes). Until this is done, clients won't be able to pay for the gallery.

Complete setup: ${onboardingUrl}

Questions? Reply to this email or contact support@photovault.photo

--
PhotoVault - Professional Photo Galleries
https://photovault.photo
  `.trim()
}
```

### Add to `src/lib/email/email-service.ts`

```typescript
// Add import at top
import {
  getPhotographerGalleryAssignmentEmailHTML,
  getPhotographerGalleryAssignmentEmailText,
  type PhotographerGalleryAssignmentParams,
} from './critical-templates'

// Add method to EmailService class
async sendPhotographerGalleryAssignmentEmail(
  params: PhotographerGalleryAssignmentParams & { to: string }
): Promise<void> {
  const { to, ...templateParams } = params

  await this.resend.emails.send({
    from: 'PhotoVault <noreply@photovault.photo>',
    to,
    subject: `You've been assigned a gallery on PhotoVault`,
    html: getPhotographerGalleryAssignmentEmailHTML(templateParams),
    text: getPhotographerGalleryAssignmentEmailText(templateParams),
  })
}
```

---

## UI Changes

### GalleryEditModal - Add Photographer Assignment

**File:** `src/components/GalleryEditModal.tsx`

**Changes:**
1. Add state for selected photographer
2. Fetch photographers list on mount (for admin users only)
3. Add photographer dropdown (visible to admins only)
4. Show warning if selected photographer is inactive
5. Handle save with photographer assignment

**Key Code Additions:**

```typescript
// Add to imports
import { useEffect, useState } from 'react'

// Add interface (or import from types)
interface PhotographerOption {
  id: string
  name: string
  paymentStatus: string
}

// Inside the component, after existing state
const { user, userType } = useAuth()
const isAdmin = userType === 'admin'  // QA CRITIQUE: Clarified derivation

const [photographers, setPhotographers] = useState<PhotographerOption[]>([])
const [selectedPhotographer, setSelectedPhotographer] = useState<string | null>(null)
const [loadingPhotographers, setLoadingPhotographers] = useState(false)

// Initialize selectedPhotographer from gallery
useEffect(() => {
  if (gallery?.photographer_id) {
    setSelectedPhotographer(gallery.photographer_id)
  }
}, [gallery])

// Fetch photographers (if admin)
useEffect(() => {
  if (isAdmin && isOpen) {
    fetchPhotographers()
  }
}, [isAdmin, isOpen])

const fetchPhotographers = async () => {
  setLoadingPhotographers(true)
  try {
    const response = await fetch('/api/admin/photographers')
    const data = await response.json()
    if (data.success) {
      setPhotographers(data.data.photographers.map((p: any) => ({
        id: p.id,
        name: p.name,
        paymentStatus: p.paymentStatus,
      })))
    }
  } catch (error) {
    console.error('Error fetching photographers:', error)
  } finally {
    setLoadingPhotographers(false)
  }
}

// Helper to check if selected photographer is inactive
const selectedPhotographerInactive = selectedPhotographer
  ? photographers.find(p => p.id === selectedPhotographer)?.paymentStatus !== 'active'
  : false
```

**In the JSX (after client assignment dropdown, inside admin section):**

```tsx
{isAdmin && (
  <div className="space-y-2">
    <Label htmlFor="photographer">Assign Photographer</Label>
    <Select
      value={selectedPhotographer || ''}
      onValueChange={(value) => setSelectedPhotographer(value === '__none__' ? null : value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a photographer..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">
          <span className="text-muted-foreground">None (Unassign)</span>
        </SelectItem>
        {photographers.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <div className="flex items-center gap-2">
              <span>{p.name}</span>
              {p.paymentStatus !== 'active' && (
                <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                  Inactive
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    {/* Warning for inactive photographer - using inline pattern, NOT Alert component */}
    {selectedPhotographerInactive && (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded text-sm">
        <p className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            This photographer hasn't completed Stripe setup. Clients won't be able to pay until they do.
            An onboarding email will be sent when you save.
          </span>
        </p>
      </div>
    )}
  </div>
)}
```

**Save Handler Update:**

```typescript
const handleSave = async () => {
  setSaving(true)
  try {
    // ... existing gallery update logic ...

    // If photographer changed and user is admin
    if (isAdmin && selectedPhotographer !== gallery.photographer_id) {
      const assignResponse = await fetch(`/api/admin/galleries/${gallery.id}/assign-photographer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photographer_id: selectedPhotographer }),
      })

      const assignData = await assignResponse.json()

      if (!assignResponse.ok) {
        console.error('Photographer assignment failed:', assignData.error)
        toast({
          title: 'Warning',
          description: 'Gallery saved but photographer assignment failed',
          variant: 'destructive',
        })
      } else if (assignData.email_sent) {
        toast({
          title: 'Photographer Assigned',
          description: assignData.message,
        })
      }
    }

    // ... rest of save logic ...
  } finally {
    setSaving(false)
  }
}
```

---

## Security Considerations

### 1. Admin-Only Access

All photographer assignment operations require admin role verification:
- API route checks `user_profiles.user_type === 'admin'`
- UI only renders photographer dropdown when `isAdmin === true`

### 2. Email Rate Limiting

- Don't send duplicate emails for same gallery/photographer pair
- Check `wasAlreadyAssigned` before sending

### 3. Stripe Connect Safety

Already handled by existing checkout flow - no changes needed.

### 4. Race Condition Note

The check for "already assigned" uses a GET-then-UPDATE pattern. At beta scale with few admins, this is acceptable. If multiple admins become common, add optimistic locking (version column).

---

## Testing Plan

### Unit Tests

1. **API: Assign Photographer**
   - Admin can assign photographer
   - Non-admin gets 403
   - Invalid photographer_id returns 404
   - Invalid gallery_id returns 404
   - Null photographer_id unassigns successfully

2. **API: Error Scenarios**
   - Email send failure still returns success for assignment
   - Missing email logs warning, still assigns
   - Re-assigning same photographer returns success, no email sent

3. **Email: Gallery Assignment**
   - Email sent when photographer is inactive
   - Email NOT sent when photographer is active
   - Email NOT sent when re-assigning same photographer
   - Email contains correct gallery name and onboarding URL

### Integration Tests

1. **Full Flow:**
   - Admin opens gallery edit modal
   - Selects inactive photographer from dropdown
   - Sees warning about inactive status
   - Saves gallery
   - Photographer receives onboarding email
   - Photographer clicks link, completes Stripe setup
   - Client can now pay for gallery

2. **Unassign Flow:**
   - Admin opens gallery with assigned photographer
   - Selects "None" from dropdown
   - Saves gallery
   - Gallery no longer has photographer_id
   - photographer_name preserved for historical display

### Manual QA Checklist

- [ ] Admin can see photographer dropdown in GalleryEditModal
- [ ] Non-admin cannot see photographer dropdown
- [ ] Inactive photographers show "Inactive" badge in dropdown
- [ ] Warning div appears when selecting inactive photographer
- [ ] Onboarding email received by inactive photographer
- [ ] Email contains correct gallery name
- [ ] Email link goes to onboarding page
- [ ] "None" option successfully unassigns photographer
- [ ] Client cannot pay until photographer activates (existing behavior verified)

---

## Migration Path

### Phase 1: Email Template (30 min)
1. Add template functions to `critical-templates.ts`
2. Add method to `EmailService` class
3. Test with real email

### Phase 2: API Route (1 hour)
1. Create `/api/admin/galleries/[galleryId]/assign-photographer/route.ts`
2. Test via Postman/curl with various scenarios

### Phase 3: UI Integration (1-2 hours)
1. Update GalleryEditModal with photographer dropdown
2. Add warning state for inactive photographers
3. Wire up save handler to call assign API

### Phase 4: Testing (1 hour)
1. Write tests
2. Manual QA
3. Fix any issues

---

## Files to Create/Modify

### New Files (1)
1. `src/app/api/admin/galleries/[galleryId]/assign-photographer/route.ts`

### Modified Files (3)
1. `src/lib/email/critical-templates.ts` - Add gallery assignment template functions
2. `src/lib/email/email-service.ts` - Add `sendPhotographerGalleryAssignmentEmail` method
3. `src/components/GalleryEditModal.tsx` - Add photographer dropdown

---

## Out of Scope (Future Enhancements)

1. **Invite new photographer by email** - For photographers not yet registered
2. **Bulk assignment** - Assign multiple galleries to one photographer
3. **Photographer self-assignment** - Photographer claims a gallery via code
4. **Assignment notifications for clients** - Tell client when photographer assigned
5. **Assignment history/audit log** - Track who assigned whom when

---

## Acceptance Criteria

- [ ] Admin can assign any registered photographer to any gallery
- [ ] Admin can unassign photographer (select "None")
- [ ] Dropdown shows all photographers with their Stripe status
- [ ] Warning shown when selecting inactive photographer
- [ ] Onboarding email sent to inactive photographers upon assignment
- [ ] Email explains PhotoVault, commission model, and has clear CTA
- [ ] Non-admins cannot see or use photographer assignment
- [ ] Existing checkout safety (block payment for inactive photographer) still works
- [ ] No duplicate emails sent for same assignment
- [ ] photographer_name preserved when unassigning

---

## Summary

This implementation adds photographer assignment capability to PhotoVault with minimal complexity:

1. **Reuses existing endpoint** - `/api/admin/photographers` already provides the data we need
2. **Follows existing patterns** - Uses same Supabase client, email service, UI patterns
3. **Maintains safety** - Existing checkout blocks prevent payment to inactive photographers
4. **Admin-only** - Clear permission boundary

The onboarding email is the key feature - it ensures photographers understand PhotoVault and the commission model before they need to set up payments.

---

**End of Implementation Plan - v2 (Post-QA Critique)**
