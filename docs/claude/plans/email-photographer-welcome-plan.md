# Email: Photographer Welcome Email Fix - Implementation Plan

## Summary

`EmailService.sendPhotographerWelcomeEmail()` is fully built (method at `email-service.ts:285` + template at `critical-templates.ts:210-486` with `PHOTOVAULT_BETA_2026` coupon) but has **zero call sites** in the entire codebase. The signup flow in `AuthContext.tsx` creates the auth user, profile, photographer record, tracks analytics, and creates the platform subscription — but never triggers the welcome email. This plan wires up the existing method.

## Root Cause

The `sendPhotographerWelcomeEmail()` method was implemented but never connected to any trigger point. The photographer signup flow completes without any email notification.

## Existing Code to Reference

| What | File | Status |
|------|------|--------|
| Welcome email template (HTML+text) | `src/lib/email/critical-templates.ts:210-486` | EXISTS, includes coupon |
| EmailService method | `src/lib/email/email-service.ts:285` | EXISTS, zero callers |
| Signup flow (client-side) | `src/contexts/AuthContext.tsx:242-385` | Working, no email call |
| Platform subscription API | `src/app/api/stripe/platform-subscription/route.ts` | Working, no email call |
| Analytics tracking pattern | `AuthContext.tsx:334-349` → `POST /api/analytics/track` | Pattern to follow |

## Implementation Approach

### Option A (Recommended): New API route called from AuthContext

Create a lightweight API route `/api/email/photographer-welcome` and call it from `AuthContext.tsx` after signup succeeds. This matches the existing pattern used for analytics tracking (`POST /api/analytics/track`) and platform subscription (`POST /api/stripe/platform-subscription`).

**Why this approach:**
- Matches existing patterns in the signup flow (client calls server API route)
- Separates email concern from subscription concern
- Email failure won't block signup (fire-and-forget with error logging)
- Server-side route has access to `RESEND_API_KEY`

### Why NOT Option B (inside platform-subscription route)

- Mixing email concerns into the subscription route violates single responsibility
- If subscription fails but account was created, no welcome email is sent
- The platform-subscription route is already 250+ lines

## Implementation Steps

### Step 1: Create API route

Create `src/app/api/email/photographer-welcome/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email/email-service'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { photographerName, photographerEmail, businessName } = await request.json()

    if (!photographerEmail) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    await EmailService.sendPhotographerWelcomeEmail({
      photographerName: photographerName || 'Photographer',
      photographerEmail,
      businessName,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Welcome Email] Failed to send:', error)
    // Return 200 anyway — email failure should not break signup
    return NextResponse.json({ success: false, error: 'Email send failed' })
  }
}
```

### Step 2: Call from AuthContext signup flow

In `src/contexts/AuthContext.tsx`, add a fetch call after the analytics tracking (around line 350), before the platform subscription call:

```typescript
// Send welcome email (fire-and-forget, don't block signup)
fetch('/api/email/photographer-welcome', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    photographerName: fullName,
    photographerEmail: email,
    businessName: fullName,
  }),
}).catch((err) => console.error('[Welcome Email] Failed:', err))
```

**Key:** This is fire-and-forget. We don't `await` it and we `.catch()` errors silently. The signup must not fail because of an email issue.

### Step 3: Verify EmailService.sendPhotographerWelcomeEmail signature

Read `email-service.ts:285` to confirm the method signature matches what we're passing. The `PhotographerWelcomeEmailData` interface (from `critical-templates.ts`) requires:
- `photographerName: string`
- `photographerEmail: string`
- `businessName?: string`

### Step 4: Verify template includes coupon

Confirm `critical-templates.ts` template contains `PHOTOVAULT_BETA_2026` coupon code display. (Investigation confirmed this at line 352.)

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/app/api/email/photographer-welcome/route.ts` | CREATE | New API route to send welcome email |
| `src/contexts/AuthContext.tsx` | MODIFY | Add fire-and-forget fetch call after line ~350 |

## Testing Steps

### Unit Test (TDD - write first)
1. Write test for the API route: mock `EmailService.sendPhotographerWelcomeEmail`, verify it's called with correct params
2. Write test for auth check: verify 401 when no auth
3. Write test for missing email: verify 400 response
4. Write test for email failure: verify 200 response (graceful degradation)

### Integration Test
1. Sign up a new photographer account
2. Verify welcome email arrives at the email address
3. Verify email contains `PHOTOVAULT_BETA_2026` coupon code
4. Verify signup completes even if email service is down (resilience)

### Manual Verification
1. Check Resend dashboard for sent email
2. Verify email renders correctly on mobile
3. Verify coupon code is visible and copyable

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Resend API down | Email fails silently, signup completes, log error |
| Invalid email format | Resend will reject, error logged, signup completes |
| Duplicate signup (user already exists) | Won't reach email code — Supabase auth.signUp fails first |
| Rate limiting by Resend | Error logged, signup completes |

## Gotchas & Warnings

1. **AuthContext is `'use client'`** — cannot call `EmailService` directly. Must go through API route.
2. **Do NOT await the email fetch** — it must be fire-and-forget to avoid blocking signup.
3. **The beta welcome email (`sendBetaWelcomeEmail`) is a DIFFERENT email** — sent when coupon is applied via Stripe discount webhook. Don't confuse the two.
4. **There are TWO separate email patterns** in the codebase: `EmailService` (class-based) and `send.ts` (standalone functions). Use `EmailService` for consistency.
