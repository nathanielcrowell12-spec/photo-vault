# PostHog Core Event Tracking Implementation Plan
## Story 6.2: Core Event Tracking

**Date:** December 14, 2025
**Author:** Claude Code (PostHog Expert)
**Story:** 6.2 - Core Event Tracking

---

## Executive Summary

This plan implements all 21 core funnel events for PhotoVault across photographer and client journeys. The foundation (Story 6.1) is complete with client/server tracking infrastructure, TypeScript event schemas, and React hooks already in place.

**Key Decision:** Critical funnel events (signup, payment, churn) use **server-side tracking** to bypass ad blockers. Engagement events (gallery views, favorites) use **client-side tracking**.

**Files Modified:** 14 files
**New Files:** 0 (all schemas/hooks exist)
**Estimated Time:** 3-4 hours

---

## What Exists vs. What Needs to Be Added

### ✅ Already Complete (Story 6.1)

**Infrastructure:**
- `src/lib/analytics/client.ts` - Client-side PostHog with auto-capture
- `src/lib/analytics/server.ts` - Server-side PostHog (ad-blocker proof)
- `src/hooks/useAnalytics.ts` - React hooks (usePageView, useTrackEvent, useTrackFlowTime)
- `src/app/providers/PostHogProvider.tsx` - Provider component
- `src/contexts/AuthContext.tsx` - Already calls `identifyUser()` on login, `resetAnalytics()` on logout

**Event Schemas (30+ events typed):**
- All event interfaces defined in `src/types/analytics.ts`
- Event name constants exported as `EVENTS` object
- TypeScript type mapping via `EventPropertiesMap`

### ❌ What Needs to Be Added (Story 6.2)

**Event Triggers:** Add `trackServerEvent()` or `trackEvent()` calls at these 21 key points:

**Photographer Journey (9 events):**
1. `photographer_signed_up` - After signup
2. `photographer_started_onboarding` - When onboarding begins
3. `photographer_completed_onboarding` - When onboarding finishes
4. `photographer_skipped_onboarding` - If skipped
5. `photographer_connected_stripe` - After Stripe Connect
6. `photographer_uploaded_first_photo` - First upload
7. `photographer_created_gallery` - Gallery creation
8. `photographer_invited_client` - Client invite sent
9. `photographer_received_first_payment` - First commission

**Client Journey (9 events):**
10. `client_clicked_invite_link` - Gallery invite clicked
11. `client_viewed_gallery` - Gallery page view
12. `client_created_account` - Account created (public checkout flow)
13. `client_started_payment` - Payment form opened
14. `client_payment_completed` - Payment succeeded
15. `client_payment_failed` - Payment failed
16. `client_downloaded_photo` - Photo download
17. `client_shared_gallery` - Share button clicked

**Engagement Events (3 events):**
18. `gallery_viewed` - Any gallery view
19. `photo_favorited` - Photo favorited/unfavorited
20. `family_member_invited` - (Placeholder - feature not built yet)

---

## Implementation: Event by Event

### 1. Photographer Signed Up
**Location:** `src/contexts/AuthContext.tsx` (signUp method, line 290-365)
**Type:** Server-side (critical funnel event)
**Trigger Point:** After user profile created, before returning success

```typescript
// src/contexts/AuthContext.tsx
// Line ~355, after photographer profile creation succeeds

if (userType === 'photographer') {
  // ... existing photographer profile creation ...

  if (!photographerError) {
    // Track signup event (server-side to avoid ad blockers)
    try {
      const { trackServerEvent } = await import('@/lib/analytics/server')
      await trackServerEvent(data.user.id, 'photographer_signed_up', {
        signup_method: 'email', // Could be 'google' or 'apple' if OAuth added
        referral_source: undefined, // Add UTM tracking later
      })
    } catch (trackError) {
      console.error('[Analytics] Error tracking photographer signup:', trackError)
      // Don't block signup if tracking fails
    }

    // ... existing platform subscription creation ...
  }
}
```

**Properties Available:**
- `signup_method`: Always 'email' (OAuth not implemented yet)
- `referral_source`: Not tracked yet (add UTM parameter support later)

**Notes:**
- Server-side tracking required (critical conversion event)
- Import dynamically to avoid SSR issues
- Don't block signup if tracking fails

---

### 2. Photographer Started Onboarding
**Location:** `src/app/photographers/onboarding/page.tsx` (line 1-159)
**Type:** Client-side (engagement event)
**Trigger Point:** When component mounts for the first time

```typescript
// src/app/photographers/onboarding/page.tsx
// Add to imports
import { useTrackEvent } from '@/hooks/useAnalytics'
import { EVENTS } from '@/types/analytics'

// Inside component
const track = useTrackEvent()

useEffect(() => {
  if (!user) return

  // Track onboarding start when component first loads
  const signupTime = new Date(user.created_at).getTime()
  const now = Date.now()
  const timeFromSignup = Math.round((now - signupTime) / 1000)

  track(EVENTS.PHOTOGRAPHER_STARTED_ONBOARDING, {
    time_from_signup_seconds: timeFromSignup
  })
}, [user?.id]) // Only fire once per user
```

**Properties Available:**
- `time_from_signup_seconds`: Calculate from `user.created_at`

**Notes:**
- Client-side is fine (not a critical conversion)
- Use dependency array to fire only once

---

### 3. Photographer Completed Onboarding
**Location:** `src/app/photographers/onboarding/page.tsx` (handleComplete method, line 79-83)
**Type:** Client-side (engagement event)
**Trigger Point:** When onboarding completes successfully

```typescript
// src/app/photographers/onboarding/page.tsx
// Modify handleComplete method

import { useAuth } from '@/contexts/AuthContext'
const { user } = useAuth()

const handleComplete = () => {
  // Calculate time from signup
  const signupTime = user?.created_at ? new Date(user.created_at).getTime() : Date.now()
  const now = Date.now()
  const timeFromSignup = Math.round((now - signupTime) / 1000)

  // Track completion
  track(EVENTS.PHOTOGRAPHER_COMPLETED_ONBOARDING, {
    time_from_signup_seconds: timeFromSignup,
    steps_completed: onboardingData.completedSteps.length
  })

  // Existing redirect logic
  console.log('Onboarding completed:', onboardingData)
  router.push('/photographers/dashboard')
}
```

**Properties Available:**
- `time_from_signup_seconds`: From signup to completion
- `steps_completed`: Number of steps completed

---

### 4. Photographer Skipped Onboarding
**Location:** `src/app/photographers/onboarding/page.tsx`
**Type:** Client-side (engagement event)
**Trigger Point:** Need to add skip button (not currently implemented)

**Implementation:**
```typescript
// Add skip button to UI (currently missing)
// In the return JSX, add:

<Button
  variant="ghost"
  onClick={handleSkipOnboarding}
  className="text-neutral-400"
>
  Skip for now
</Button>

// Handler:
const handleSkipOnboarding = () => {
  const signupTime = user?.created_at ? new Date(user.created_at).getTime() : Date.now()
  const timeFromSignup = Math.round((Date.now() - signupTime) / 1000)

  track(EVENTS.PHOTOGRAPHER_SKIPPED_ONBOARDING, {
    step_skipped_at: steps[currentStep].title,
    time_from_signup_seconds: timeFromSignup
  })

  router.push('/photographers/dashboard')
}
```

**Note:** Skip functionality not currently implemented. Add this when Story 4.x (Onboarding Polish) is done.

---

### 5. Photographer Connected Stripe
**Location:** `src/app/api/stripe/connect/callback/route.ts` (line 50-78)
**Type:** Server-side (critical funnel event)
**Trigger Point:** After Stripe Connect onboarding completes

```typescript
// src/app/api/stripe/connect/callback/route.ts
// After updating photographer record (line ~63)

if (account.details_submitted) {
  // Track Stripe Connect completion (server-side)
  try {
    const { trackServerEvent } = await import('@/lib/analytics/server')

    // Check if this is the first connection
    const { data: photographer } = await adminClient
      .from('photographers')
      .select('stripe_connect_onboarded_at, created_at')
      .eq('id', user.id)
      .single()

    const isFirstConnection = !photographer?.stripe_connect_onboarded_at

    // Calculate time from signup
    const signupTime = photographer?.created_at
      ? new Date(photographer.created_at).getTime()
      : Date.now()
    const timeFromSignup = Math.round((Date.now() - signupTime) / 1000)

    await trackServerEvent(user.id, 'photographer_connected_stripe', {
      time_from_signup_seconds: timeFromSignup,
      is_first_connection: isFirstConnection
    })
  } catch (trackError) {
    console.error('[Analytics] Error tracking Stripe Connect:', trackError)
  }

  // Existing redirect logic
  return NextResponse.redirect(
    new URL('/photographers/settings?stripe=success', request.url)
  )
}
```

**Properties Available:**
- `time_from_signup_seconds`: From signup to Stripe connection
- `is_first_connection`: Check if `stripe_connect_onboarded_at` was previously null

**Notes:**
- Server-side required (critical conversion)
- Check first connection vs. reconnection

---

### 6. Photographer Uploaded First Photo
**Location:** Multiple upload endpoints
**Type:** Server-side (important milestone)
**Trigger Point:** After first photo successfully uploaded

**Primary Location:** `src/app/api/v1/upload/process/route.ts` (desktop app uploads)

```typescript
// After photos are inserted into gallery_photos table
// Check if this is the photographer's first upload ever

const { data: photoCount } = await supabase
  .from('gallery_photos')
  .select('id', { count: 'exact', head: true })
  .eq('photographer_id', photographerId)

const isFirstPhoto = (photoCount?.count || 0) === 0

if (isFirstPhoto && insertedPhotos.length > 0) {
  try {
    const { trackServerEvent } = await import('@/lib/analytics/server')

    // Calculate time from signup
    const { data: photographer } = await supabase
      .from('photographers')
      .select('created_at')
      .eq('id', photographerId)
      .single()

    const signupTime = photographer?.created_at
      ? new Date(photographer.created_at).getTime()
      : Date.now()
    const timeFromSignup = Math.round((Date.now() - signupTime) / 1000)

    await trackServerEvent(photographerId, 'photographer_uploaded_first_photo', {
      time_from_signup_seconds: timeFromSignup,
      file_size_bytes: insertedPhotos[0].file_size
    })
  } catch (trackError) {
    console.error('[Analytics] Error tracking first upload:', trackError)
  }
}
```

**Also Track In:**
- `src/app/api/client/upload/route.ts` (client self-uploads)
- `src/app/api/v1/import/gallery/route.ts` (Pixieset imports)

**Properties:**
- `time_from_signup_seconds`: From signup to first upload
- `file_size_bytes`: Size of first photo (optional)

---

### 7. Photographer Created Gallery
**Location:** `src/app/photographer/galleries/create/page.tsx` (handleCreateGallery, line 239-325)
**Type:** Client-side (engagement event)
**Trigger Point:** After gallery successfully created

```typescript
// src/app/photographer/galleries/create/page.tsx
// Add to imports
import { useTrackEvent } from '@/hooks/useAnalytics'
import { EVENTS } from '@/types/analytics'

// Inside component
const track = useTrackEvent()

// In handleCreateGallery, after gallery created successfully (line ~310)
if (galleryError) throw galleryError

console.log('[CreateGallery] Gallery created:', gallery)

// Track gallery creation
try {
  // Check if this is the first gallery
  const { count: galleryCount } = await supabase
    .from('photo_galleries')
    .select('id', { count: 'exact', head: true })
    .eq('photographer_id', user?.id)

  const isFirstGallery = (galleryCount || 0) === 1 // Just created first one

  // Calculate time from signup
  const { data: { user: authUser } } = await supabase.auth.getUser()
  const signupTime = authUser?.created_at
    ? new Date(authUser.created_at).getTime()
    : Date.now()
  const timeFromSignup = Math.round((Date.now() - signupTime) / 1000)

  track(EVENTS.PHOTOGRAPHER_CREATED_GALLERY, {
    gallery_id: gallery.id,
    is_first_gallery: isFirstGallery,
    photo_count: 0, // No photos yet
    time_from_signup_seconds: timeFromSignup
  })
} catch (trackError) {
  console.error('[Analytics] Error tracking gallery creation:', trackError)
}

// Existing redirect
router.push(`/photographer/galleries/${gallery.id}/upload`)
```

**Properties:**
- `gallery_id`: The created gallery ID
- `is_first_gallery`: Check count before creation
- `photo_count`: Always 0 at creation
- `time_from_signup_seconds`: From signup to first gallery

---

### 8. Photographer Invited Client
**Location:** TBD - Invite functionality spread across multiple areas
**Type:** Client-side (engagement event)
**Trigger Point:** After invite email sent or link copied

**Primary Location:** When gallery becomes "published" (status changes from draft to published)

**Note:** PhotoVault doesn't have explicit "invite client" functionality. Photographers create galleries for clients, then clients access via:
1. Public checkout link (sent manually)
2. Gallery URL shared manually

**Recommendation:** Track when photographer shares gallery link (copy to clipboard event), or track when gallery status changes to "published".

**Defer to Story 6.3** (friction tracking) - add share tracking there.

---

### 9. Photographer Received First Payment
**Location:** `src/app/api/webhooks/stripe/route.ts` (handleCheckoutCompleted, line 182-471)
**Type:** Server-side (critical revenue event)
**Trigger Point:** After commission record inserted

```typescript
// src/app/api/webhooks/stripe/route.ts
// After commission insert succeeds (line ~440)

await supabase.from('commissions').insert({
  photographer_id: photographerId,
  gallery_id: galleryId,
  client_email: customerEmail,
  amount_cents: photographerGrossCents,
  total_paid_cents: amountPaidCents,
  shoot_fee_cents: shootFeeCents,
  storage_fee_cents: storageFeeCents,
  photovault_commission_cents: photovaultFeeCents,
  payment_type: 'upfront',
  stripe_payment_intent_id: session.payment_intent as string,
  stripe_transfer_id: stripeTransferId,
  status: 'paid',
  paid_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
}).then(async ({ error }: { error: any }) => {
  if (error) {
    console.warn('[Webhook] Commission insert error:', error.message)
  } else {
    // Commission recorded successfully - track if first payment
    try {
      const { trackServerEvent } = await import('@/lib/analytics/server')

      // Check if this is the photographer's first payment
      const { count: commissionCount } = await supabase
        .from('commissions')
        .select('id', { count: 'exact', head: true })
        .eq('photographer_id', photographerId)
        .eq('status', 'paid')

      const isFirstPayment = (commissionCount || 0) === 1

      if (isFirstPayment) {
        // Get photographer signup date
        const { data: photographer } = await supabase
          .from('photographers')
          .select('created_at')
          .eq('id', photographerId)
          .single()

        const signupTime = photographer?.created_at
          ? new Date(photographer.created_at).getTime()
          : Date.now()
        const timeFromSignup = Math.round((Date.now() - signupTime) / 1000)

        await trackServerEvent(photographerId, 'photographer_received_first_payment', {
          amount_cents: photographerGrossCents,
          client_id: clientId || 'unknown',
          gallery_id: galleryId,
          time_from_signup_seconds: timeFromSignup
        })
      }
    } catch (trackError) {
      console.error('[Analytics] Error tracking first payment:', trackError)
    }
  }
})
```

**Properties:**
- `amount_cents`: Photographer's payout
- `client_id`: Who paid
- `gallery_id`: Which gallery
- `time_from_signup_seconds`: Signup to first payment (activation time!)

---

### 10. Client Clicked Invite Link
**Location:** `src/app/gallery/[galleryId]/page.tsx` (line 1-150)
**Type:** Client-side (top of funnel)
**Trigger Point:** When gallery page loads for unauthenticated user

```typescript
// src/app/gallery/[galleryId]/page.tsx
// Add to imports
import { useTrackEvent } from '@/hooks/useAnalytics'
import { EVENTS } from '@/types/analytics'

const track = useTrackEvent()

// In fetchGallery, after gallery loads successfully
useEffect(() => {
  if (!gallery || !user) return

  // Track gallery view for unauthenticated users (likely from invite link)
  const isAuthenticated = !!user

  if (!isAuthenticated) {
    track(EVENTS.CLIENT_CLICKED_INVITE_LINK, {
      gallery_id: gallery.id,
      photographer_id: gallery.photographer_id || 'unknown',
      invite_token: searchParams.get('token') || undefined
    })
  }
}, [gallery?.id, user])
```

**Properties:**
- `gallery_id`: Gallery being viewed
- `photographer_id`: Gallery owner
- `invite_token`: From URL params (if exists)

---

### 11. Client Viewed Gallery
**Location:** `src/app/gallery/[galleryId]/page.tsx` (existing)
**Type:** Client-side (engagement)
**Trigger Point:** When authenticated client views gallery

```typescript
// src/app/gallery/[galleryId]/page.tsx
// Use existing usePageView hook

import { usePageView } from '@/hooks/useAnalytics'

// Inside component
usePageView('gallery', {
  gallery_id: galleryId,
  photographer_id: gallery?.photographer_id,
  photo_count: photos.length
})

// This automatically tracks:
// - gallery_viewed on mount
// - gallery_left on unmount (with duration)
```

**Properties:**
- `gallery_id`: Gallery ID
- `photographer_id`: Gallery owner
- `photo_count`: Number of photos
- `duration_seconds`: Auto-tracked on unmount

**Note:** usePageView hook already implemented in Story 6.1, just needs to be added to component.

---

### 12. Client Created Account
**Location:** `src/app/api/webhooks/stripe/route.ts` (public checkout flow, line 250-316)
**Type:** Server-side (critical funnel event)
**Trigger Point:** After account created for public checkout

```typescript
// src/app/api/webhooks/stripe/route.ts
// After user account created (line ~298)

if (!userId && isPublicCheckout === 'true') {
  // ... existing user creation code ...

  if (newUser?.user) {
    userId = newUser.user.id
    console.log('[Webhook] Created new user account:', userId)

    // Track client account creation (server-side)
    try {
      const { trackServerEvent } = await import('@/lib/analytics/server')

      await trackServerEvent(userId, 'client_created_account', {
        gallery_id: galleryId,
        photographer_id: photographerId || undefined,
        signup_method: 'email' // Created via checkout
      })
    } catch (trackError) {
      console.error('[Analytics] Error tracking client account:', trackError)
    }
  }
}
```

**Properties:**
- `gallery_id`: Gallery that triggered account creation
- `photographer_id`: Gallery owner
- `signup_method`: Always 'email' (checkout-created accounts)

---

### 13. Client Started Payment
**Location:** `src/app/api/stripe/gallery-checkout/route.ts` or `src/app/api/stripe/public-checkout/route.ts`
**Type:** Server-side (funnel event)
**Trigger Point:** When checkout session created

```typescript
// src/app/api/stripe/gallery-checkout/route.ts
// After creating checkout session, before returning

const session = await stripe.checkout.sessions.create({
  // ... existing session config ...
})

// Track payment start (server-side)
try {
  const { trackServerEvent } = await import('@/lib/analytics/server')

  const userId = clientId || photographerId // Use whoever initiated

  await trackServerEvent(userId, 'client_started_payment', {
    gallery_id: galleryId,
    photographer_id: photographerId,
    plan_type: paymentOptionId === 'year_package' ? 'annual'
      : paymentOptionId === 'six_month_package' ? '6month'
      : 'monthly',
    amount_cents: session.amount_total || 0
  })
} catch (trackError) {
  console.error('[Analytics] Error tracking payment start:', trackError)
}

return NextResponse.json({ sessionId: session.id })
```

**Properties:**
- `gallery_id`: Gallery being purchased
- `photographer_id`: Gallery owner
- `plan_type`: Package selected
- `amount_cents`: Total amount

---

### 14. Client Payment Completed
**Location:** `src/app/api/webhooks/stripe/route.ts` (handleCheckoutCompleted, line 182-471)
**Type:** Server-side (critical revenue event)
**Trigger Point:** After payment processed successfully

```typescript
// src/app/api/webhooks/stripe/route.ts
// After gallery payment_status updated (line ~326)

const { error: galleryError } = await supabase
  .from('photo_galleries')
  .update({
    payment_status: 'paid',
    paid_at: new Date().toISOString(),
    stripe_payment_intent_id: session.payment_intent as string,
  })
  .eq('id', galleryId)

if (!galleryError) {
  // Track payment completion (server-side)
  try {
    const { trackServerEvent } = await import('@/lib/analytics/server')

    // Check if this is client's first payment
    const { count: paymentCount } = await supabase
      .from('photo_galleries')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('payment_status', 'paid')

    const isFirstPayment = (paymentCount || 0) === 1

    // Use userId (newly created or existing)
    if (userId) {
      await trackServerEvent(userId, 'client_payment_completed', {
        gallery_id: galleryId,
        photographer_id: photographerId,
        plan_type: metadata.payment_option_id || 'unknown',
        amount_cents: amountPaidCents,
        is_first_payment: isFirstPayment
      })
    }
  } catch (trackError) {
    console.error('[Analytics] Error tracking payment completion:', trackError)
  }
}
```

**Properties:**
- `gallery_id`: Gallery purchased
- `photographer_id`: Gallery owner
- `plan_type`: From metadata
- `amount_cents`: Amount paid
- `is_first_payment`: Check client's payment history

---

### 15. Client Payment Failed
**Location:** `src/app/api/webhooks/stripe/route.ts` (handlePaymentFailed handler)
**Type:** Server-side (critical error event)
**Trigger Point:** When payment fails

**Note:** `handlePaymentFailed` handler exists but is not shown in the 200-line limit. Add tracking there:

```typescript
// src/app/api/webhooks/stripe/route.ts
// In handlePaymentFailed function

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
): Promise<string> {
  console.log('[Webhook] Processing invoice.payment_failed', invoice.id)

  // Track payment failure (server-side)
  try {
    const { trackServerEvent } = await import('@/lib/analytics/server')

    const customerId = invoice.customer as string
    const metadata = invoice.metadata || {}

    // Try to get user ID from customer
    let userId = metadata.user_id

    if (!userId && customerId) {
      // Look up user by Stripe customer ID
      const { data: client } = await supabase
        .from('clients')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      userId = client?.user_id
    }

    if (userId) {
      await trackServerEvent(userId, 'client_payment_failed', {
        gallery_id: metadata.gallery_id || undefined,
        photographer_id: metadata.photographer_id || undefined,
        plan_type: metadata.plan_type || undefined,
        amount_cents: invoice.amount_due || undefined,
        failure_reason: invoice.last_payment_error?.message || 'Unknown error'
      })
    }
  } catch (trackError) {
    console.error('[Analytics] Error tracking payment failure:', trackError)
  }

  // ... existing failure handling ...

  return 'Payment failed - user notified'
}
```

**Properties:**
- `gallery_id`: From invoice metadata (if available)
- `photographer_id`: From metadata
- `plan_type`: From metadata
- `amount_cents`: Failed amount
- `failure_reason`: Error message from Stripe

---

### 16. Client Downloaded Photo
**Location:** `src/app/api/gallery/download/route.ts` (line 1-157)
**Type:** Server-side (engagement tracking)
**Trigger Point:** After download recorded

```typescript
// src/app/api/gallery/download/route.ts
// After download record inserted (line ~112)

const { error: insertError } = await supabase
  .from('photo_downloads')
  .insert({
    gallery_id: galleryId,
    photo_id: photoId,
    client_id: gallery.client_id,
    downloaded_by: user.id,
    download_type: downloadType,
    ip_address: ipAddress,
    user_agent: userAgent,
  })

if (!insertError) {
  // Track download (server-side to ensure accuracy)
  try {
    const { trackServerEvent } = await import('@/lib/analytics/server')

    // Check if this is user's first download ever
    const { count: downloadCount } = await supabase
      .from('photo_downloads')
      .select('id', { count: 'exact', head: true })
      .eq('downloaded_by', user.id)

    const isFirstDownload = (downloadCount || 0) === 1

    await trackServerEvent(user.id, 'client_downloaded_photo', {
      gallery_id: galleryId,
      photographer_id: gallery.photographer_id || 'unknown',
      photo_id: photoId,
      is_first_download: isFirstDownload
    })
  } catch (trackError) {
    console.error('[Analytics] Error tracking download:', trackError)
  }
}
```

**Properties:**
- `gallery_id`: Gallery
- `photographer_id`: Gallery owner
- `photo_id`: Downloaded photo
- `is_first_download`: Check count

---

### 17. Client Shared Gallery
**Location:** TBD - Share functionality not yet implemented
**Type:** Client-side (engagement)
**Trigger Point:** When share button clicked

**Note:** Gallery sharing not currently implemented. Add this in Story 6.3 (friction tracking) or later when feature is built.

**Placeholder for later:**
```typescript
// When share modal opens or copy-link clicked
track(EVENTS.CLIENT_SHARED_GALLERY, {
  gallery_id: galleryId,
  photographer_id: gallery.photographer_id,
  share_method: 'link' // or 'email', 'social'
})
```

---

### 18. Gallery Viewed (General Engagement)
**Location:** `src/app/gallery/[galleryId]/page.tsx`
**Type:** Client-side (engagement)
**Trigger Point:** Any gallery view (photographer or client)

```typescript
// src/app/gallery/[galleryId]/page.tsx
// Already covered by usePageView hook (see event #11)

import { useTrackEvent } from '@/hooks/useAnalytics'
import { EVENTS } from '@/types/analytics'

const track = useTrackEvent()

useEffect(() => {
  if (!gallery || !user) return

  // Track general gallery view
  track(EVENTS.GALLERY_VIEWED, {
    gallery_id: gallery.id,
    photographer_id: gallery.photographer_id || 'unknown',
    photo_count: photos.length,
    is_owner: user.id === gallery.photographer_id
  })
}, [gallery?.id, user?.id])
```

**Properties:**
- `gallery_id`: Gallery ID
- `photographer_id`: Owner
- `photo_count`: Photos in gallery
- `is_owner`: Is viewer the photographer?

---

### 19. Photo Favorited
**Location:** `src/app/api/photos/[id]/favorite/route.ts` (line 58-72)
**Type:** Client-side (engagement)
**Trigger Point:** After favorite status toggled

**Note:** This should be client-side for performance. Track in the UI component that calls this API.

**Location:** `src/app/gallery/[galleryId]/components/GalleryGrid.tsx` or `Lightbox.tsx`

```typescript
// In the component that handles favorite toggle
const handleToggleFavorite = async (photoId: string) => {
  try {
    const response = await fetch(`/api/photos/${photoId}/favorite`, {
      method: 'POST'
    })

    const data = await response.json()

    if (data.success && data.is_favorite) {
      // Track favorite action (client-side)
      track(EVENTS.PHOTO_FAVORITED, {
        gallery_id: galleryId,
        photo_id: photoId,
        photographer_id: gallery.photographer_id
      })
    }

    // Update UI state
    // ...
  } catch (error) {
    console.error('Error toggling favorite:', error)
  }
}
```

**Properties:**
- `gallery_id`: Gallery
- `photo_id`: Favorited photo
- `photographer_id`: Gallery owner

**Note:** Only track when favoriting (not unfavoriting) to reduce noise.

---

### 20. Family Member Invited
**Location:** TBD - Family sharing not implemented yet
**Type:** Client-side
**Trigger Point:** When invite sent

**Note:** Defer to later story when family sharing is built.

---

## Server-Side vs. Client-Side Decision Matrix

| Event | Tracking Method | Reason |
|-------|----------------|--------|
| **photographer_signed_up** | **Server** | Critical conversion - must not be blocked |
| photographer_started_onboarding | Client | Engagement metric - okay if some blocked |
| photographer_completed_onboarding | Client | Engagement metric |
| photographer_skipped_onboarding | Client | Engagement metric |
| **photographer_connected_stripe** | **Server** | Critical activation - must not be blocked |
| photographer_uploaded_first_photo | **Server** | Important milestone |
| photographer_created_gallery | Client | Engagement metric |
| photographer_invited_client | Client | Engagement metric |
| **photographer_received_first_payment** | **Server** | Revenue event - critical |
| client_clicked_invite_link | Client | Top of funnel - okay if some blocked |
| client_viewed_gallery | Client | Engagement metric |
| **client_created_account** | **Server** | Critical funnel event |
| **client_started_payment** | **Server** | Critical funnel event |
| **client_payment_completed** | **Server** | Revenue event - critical |
| **client_payment_failed** | **Server** | Error tracking - critical for debugging |
| client_downloaded_photo | **Server** | Accurate tracking needed for Shoot Only |
| client_shared_gallery | Client | Engagement metric |
| gallery_viewed | Client | Engagement metric |
| photo_favorited | Client | Engagement metric |
| family_member_invited | Client | Engagement metric |

**Bold = Server-side (9 events)**
Regular = Client-side (11 events)

---

## File Modifications Summary

### Files to Modify (14 files):

1. **`src/contexts/AuthContext.tsx`**
   - Add `photographer_signed_up` tracking (line ~355)

2. **`src/app/photographers/onboarding/page.tsx`**
   - Add `photographer_started_onboarding` on mount
   - Add `photographer_completed_onboarding` in handleComplete
   - Add skip button + `photographer_skipped_onboarding` (defer to Story 4.x)

3. **`src/app/api/stripe/connect/callback/route.ts`**
   - Add `photographer_connected_stripe` after Connect completes

4. **`src/app/api/v1/upload/process/route.ts`**
   - Add `photographer_uploaded_first_photo` after upload

5. **`src/app/api/client/upload/route.ts`**
   - Add `photographer_uploaded_first_photo` (client self-uploads)

6. **`src/app/api/v1/import/gallery/route.ts`**
   - Add `photographer_uploaded_first_photo` (Pixieset imports)

7. **`src/app/photographer/galleries/create/page.tsx`**
   - Add `photographer_created_gallery` after creation

8. **`src/app/api/webhooks/stripe/route.ts`**
   - Add `photographer_received_first_payment` in handleCheckoutCompleted
   - Add `client_created_account` after account creation
   - Add `client_payment_completed` after payment success
   - Add `client_payment_failed` in handlePaymentFailed

9. **`src/app/api/stripe/gallery-checkout/route.ts`**
   - Add `client_started_payment` when session created

10. **`src/app/api/stripe/public-checkout/route.ts`**
    - Add `client_started_payment` when session created

11. **`src/app/gallery/[galleryId]/page.tsx`**
    - Add `client_clicked_invite_link` for unauthenticated views
    - Add `client_viewed_gallery` using usePageView hook
    - Add `gallery_viewed` general tracking

12. **`src/app/api/gallery/download/route.ts`**
    - Add `client_downloaded_photo` after download recorded

13. **`src/app/gallery/[galleryId]/components/GalleryGrid.tsx`**
    - Add `photo_favorited` when favorite toggled

14. **`src/app/gallery/[galleryId]/components/Lightbox.tsx`**
    - Add `photo_favorited` when favorite toggled

### Files to Read (No Changes):
- `src/lib/analytics/client.ts` - Already complete
- `src/lib/analytics/server.ts` - Already complete
- `src/types/analytics.ts` - All schemas defined
- `src/hooks/useAnalytics.ts` - All hooks implemented

---

## Testing Steps

### 1. Test Photographer Journey

**Setup:**
1. Clear PostHog dev cookies
2. Start dev server: `npm run dev -- -p 3002`
3. Open PostHog Live Events: https://app.posthog.com/project/YOUR_PROJECT/events

**Test Flow:**
```
1. Sign up as photographer → Check for "photographer_signed_up"
2. Land on onboarding page → Check for "photographer_started_onboarding"
3. Complete onboarding → Check for "photographer_completed_onboarding"
4. Connect Stripe → Check for "photographer_connected_stripe"
5. Create gallery → Check for "photographer_created_gallery"
6. Upload photos (via desktop app) → Check for "photographer_uploaded_first_photo"
7. Client completes payment → Check for "photographer_received_first_payment"
```

**Expected Events in PostHog:**
- All events appear with correct properties
- Server events have `$source: 'server'`
- Client events have `$source: undefined`
- User is identified with correct `user_type: 'photographer'`

---

### 2. Test Client Journey

**Setup:**
1. Use existing gallery with payment pending
2. Get public checkout URL
3. Clear cookies / use incognito

**Test Flow:**
```
1. Click gallery invite link → Check for "client_clicked_invite_link"
2. View gallery page → Check for "client_viewed_gallery"
3. Click "Purchase Access" → Check for "client_started_payment"
4. Complete checkout → Check for:
   - "client_created_account" (if new user)
   - "client_payment_completed"
5. Download a photo → Check for "client_downloaded_photo"
6. Favorite a photo → Check for "photo_favorited"
```

**Expected Events in PostHog:**
- New distinct_id created for anonymous user
- After payment, account created and identified
- All events linked to same user

---

### 3. Test Payment Failure

**Use Stripe test card:** `4000 0000 0000 0341` (card declined)

```
1. Start payment flow
2. Use failing test card
3. Complete checkout
4. Check PostHog for "client_payment_failed"
   - Should have failure_reason property
```

---

### 4. Test First-Time Flags

**Verify these boolean flags work correctly:**

```
- photographer_uploaded_first_photo.is_first_upload (should be false on 2nd upload)
- photographer_created_gallery.is_first_gallery (false on 2nd gallery)
- photographer_received_first_payment.is_first_payment (false on 2nd payment)
- client_downloaded_photo.is_first_download (false on 2nd download)
- client_payment_completed.is_first_payment (false on 2nd payment)
```

---

### 5. Create PostHog Funnels

After events are flowing, create these funnels in PostHog:

**Photographer Activation Funnel:**
```
1. photographer_signed_up
2. photographer_connected_stripe
3. photographer_created_gallery
4. photographer_uploaded_first_photo
5. photographer_received_first_payment
```

**Client Conversion Funnel:**
```
1. client_clicked_invite_link
2. client_viewed_gallery
3. client_started_payment
4. client_payment_completed
```

**Expected:**
- See conversion rates at each step
- Identify drop-off points
- Track time between steps

---

## Edge Cases & Error Handling

### 1. Ad Blocker Testing
**Server-side events should NOT be blocked:**
- Install uBlock Origin
- Enable all filters
- Complete photographer signup
- Verify `photographer_signed_up` still appears in PostHog

### 2. Network Failures
**All tracking calls are wrapped in try-catch:**
- Simulate offline mode
- Complete signup
- Verify signup still succeeds even if tracking fails
- Check console for error logs

### 3. Missing Properties
**Handle optional properties gracefully:**
- `referral_source`: undefined if not tracked
- `invite_token`: undefined if not in URL
- All optional properties should use `|| undefined` not `|| null`

### 4. Race Conditions
**First-time checks could race:**
- Use database counts at the moment of event
- Don't rely on client-side state
- Server-side queries are source of truth

### 5. Duplicate Events
**Idempotency protection:**
- PostHog automatically deduplicates within 24 hours by event name + properties
- Don't manually add timestamps to properties (breaks dedup)
- Use PostHog's auto-timestamp

---

## Environment Variables Required

**Already Set (from Story 6.1):**
```
# .env.local (dev)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
POSTHOG_API_KEY=phx_xxx

# Vercel (production)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx (exposed to client)
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com (exposed to client)
POSTHOG_API_KEY=phx_xxx (secret)
```

No new variables needed for Story 6.2.

---

## Acceptance Criteria Checklist

**From WORK_PLAN.md Story 6.2:**

- [ ] All 9 photographer journey events tracking
  - [ ] `photographer_signed_up` (server-side)
  - [ ] `photographer_started_onboarding` (client-side)
  - [ ] `photographer_completed_onboarding` (client-side)
  - [ ] `photographer_skipped_onboarding` (defer to Story 4.x)
  - [ ] `photographer_connected_stripe` (server-side)
  - [ ] `photographer_uploaded_first_photo` (server-side)
  - [ ] `photographer_created_gallery` (client-side)
  - [ ] `photographer_invited_client` (defer - feature not built)
  - [ ] `photographer_received_first_payment` (server-side)

- [ ] All 9 client journey events tracking
  - [ ] `client_clicked_invite_link` (client-side)
  - [ ] `client_viewed_gallery` (client-side)
  - [ ] `client_created_account` (server-side)
  - [ ] `client_started_payment` (server-side)
  - [ ] `client_payment_completed` (server-side)
  - [ ] `client_payment_failed` (server-side)
  - [ ] `client_downloaded_photo` (server-side)
  - [ ] `client_shared_gallery` (defer - feature not built)

- [ ] All 3 engagement events tracking
  - [ ] `gallery_viewed` (client-side)
  - [ ] `photo_favorited` (client-side)
  - [ ] `family_member_invited` (defer - feature not built)

- [ ] Server-side events appear in PostHog with `$source: 'server'`
- [ ] Payment events tracked in Stripe webhook handler
- [ ] Photographer activation funnel visible in PostHog
- [ ] Client conversion funnel visible in PostHog
- [ ] Ad blockers don't block server-side events (tested)
- [ ] All first-time flags working correctly

---

## Known Limitations & Deferred Items

### Deferred to Later Stories:

1. **photographer_invited_client** - No explicit invite functionality
   - Photographers create galleries then manually share links
   - Add in Story 6.3 (friction tracking) when share tracking added

2. **photographer_skipped_onboarding** - No skip button exists
   - Add when Story 4.x (Onboarding Polish) is implemented

3. **client_shared_gallery** - Share functionality not built
   - Add when share feature is implemented

4. **family_member_invited** - Family sharing not implemented
   - Add when secondary user invite flow is enhanced

### Technical Debt:

1. **UTM Parameter Tracking** - Not implemented
   - `referral_source` always undefined
   - Add UTM tracking in Story 6.3 or later

2. **OAuth Signup** - Only email supported
   - `signup_method` always 'email'
   - Will support 'google'/'apple' when OAuth added

3. **Gallery Share Tracking** - No copy-link event
   - Can't track when photographers share gallery URLs
   - Add clipboard API tracking later

---

## PostHog Dashboard Setup

After implementation, create these in PostHog:

### 1. Photographer Activation Dashboard

**Widgets:**
- Total signups (trend)
- Stripe Connect completion rate
- First gallery creation rate
- First payment received rate
- Time to first payment (median)

### 2. Client Conversion Dashboard

**Widgets:**
- Invite link clicks (trend)
- Gallery view → payment rate
- Payment success rate
- Payment failure reasons (breakdown)
- Time from invite to payment

### 3. Engagement Dashboard

**Widgets:**
- Gallery views per user
- Photo favorites per gallery
- Download completion rate (Shoot Only)
- User retention (7-day, 30-day)

---

## Rollout Plan

### Phase 1: Implement (1 day)
- Add all tracking calls per this plan
- Test in development
- Verify events appear in PostHog

### Phase 2: QA (0.5 days)
- Run through all test flows
- Check ad blocker resistance
- Verify first-time flags
- Test error cases

### Phase 3: Deploy (0.5 days)
- Merge to main
- Deploy to Vercel
- Monitor PostHog for production events
- Create funnels in PostHog

### Phase 4: Monitor (ongoing)
- Watch for event volume
- Check for errors in PostHog
- Validate funnel conversion rates match expectations

---

## Questions for User

1. **Invite Tracking:** Should we track when photographers copy gallery URLs to clipboard? (Requires clipboard API permission)

2. **OAuth Priority:** When will Google/Apple OAuth be added? (Affects `signup_method` property)

3. **Referral Tracking:** Should we implement UTM parameter tracking now or later?

4. **Skip Button:** Should onboarding have a skip option? (Currently missing)

5. **Dashboard Priority:** Which PostHog dashboard is most important for beta launch?

---

## Success Metrics

After Story 6.2 is complete, you should see:

**In PostHog Live Events:**
- ~15-20 events firing per user journey
- Server events marked with `$source: 'server'`
- All events have correct properties
- User identification working (correct user_type)

**In PostHog Funnels:**
- Photographer activation funnel: signup → Stripe → gallery → payment
- Client conversion funnel: invite → view → payment → download
- Conversion rates visible at each step

**In PostHog Insights:**
- Time to first payment (photographer activation time)
- Payment success rate
- Gallery engagement rate
- Download completion rate

**Ready for Beta Launch:** Story 6.3 will add friction/warning events, then Epic 5 (beta prep) can begin with full analytics visibility.

---

## Implementation Order

**Recommended sequence (minimize context switching):**

1. **Photographer journey (1.5 hrs)**
   - AuthContext signup tracking
   - Onboarding tracking
   - Stripe Connect callback
   - Gallery creation tracking

2. **Upload tracking (0.5 hrs)**
   - First photo upload (multiple endpoints)

3. **Payment events (1 hr)**
   - Webhook handler (first payment, client account, payment success/fail)
   - Checkout endpoints (payment started)

4. **Client engagement (0.5 hrs)**
   - Gallery view tracking
   - Download tracking
   - Favorite tracking

5. **Testing & QA (1 hr)**
   - Run through all flows
   - Verify PostHog events
   - Create funnels

**Total: 4.5 hours estimated**

---

*End of Implementation Plan*
