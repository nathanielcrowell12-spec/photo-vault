# Stripe Webhook Modularization Plan

**Date:** 2025-12-31
**Revised:** 2025-12-31 (QA Critique fixes applied)
**Current File:** `src/app/api/webhooks/stripe/route.ts` (1350 lines)
**Target:** Split into modular handlers under `src/lib/stripe/webhooks/`
**QA Status:** APPROVED (after revisions)

---

## 1. Current State Analysis

### 1.1 Event Types Handled

| Line | Case Statement | Handler Function | Lines |
|------|----------------|------------------|-------|
| 92-93 | `checkout.session.completed` | `handleCheckoutCompleted()` | 186-732 (~546 lines) |
| 96-97 | `customer.subscription.created` | `handleSubscriptionCreated()` | 737-782 (~45 lines) |
| 100-101 | `invoice.payment_succeeded` | `handlePaymentSucceeded()` | 789-1007 (~218 lines) |
| 104-105 | `invoice.payment_failed` | `handlePaymentFailed()` | 1013-1152 (~139 lines) |
| 108-109 | `customer.subscription.deleted` | `handleSubscriptionDeleted()` | 1158-1280 (~122 lines) |
| 112-113 | `customer.subscription.updated` | `handleSubscriptionUpdated()` | 1285-1311 (~26 lines) |
| 116-117 | `payout.created` | `handlePayoutCreated()` | 1316-1349 (~33 lines) |

**Total:** 7 event types handled

### 1.2 Checkout Sub-Types (within `handleCheckoutCompleted`)

The checkout handler is complex because it handles multiple purchase flows:

| Type | Detection | Lines (approx) | Purpose |
|------|-----------|----------------|---------|
| Public Gallery Checkout | `isPublicCheckout === 'true'` | 199-577 | New client pays for gallery, account created |
| Authenticated Gallery Checkout | `type === 'gallery_payment'` | 199-577 | Existing client pays for gallery |
| Token Purchase | `purchase_type === 'tokens'` | 585-622 | Photographer buys tokens |
| Subscription Checkout | `purchase_type === 'subscription'` | 623-625 | Subscription via checkout |
| Family Takeover | `type === 'family_takeover'` | 626-642 | Secondary takes over billing |
| Reactivation | `type === 'reactivation'` | 643-728 | Client reactivates lapsed subscription |

### 1.3 Imports & Dependencies

```typescript
// External
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Internal - Database
import { createServerSupabaseClient } from '@/lib/supabase'
import { createServiceRoleClient } from '@/lib/supabase-server'

// Internal - Analytics
import { trackServerEvent } from '@/lib/analytics/server'
import { EVENTS } from '@/types/analytics'
import { isFirstTime, calculateTimeFromSignup, getPhotographerSignupDate, mapPaymentOptionToPlanType } from '@/lib/analytics/helpers'

// Internal - Logging
import { logger } from '@/lib/logger'

// Dynamic Imports (within handlers)
import('@/lib/email/email-service')  // EmailService
import('@/lib/server/family-takeover-service')  // completeTakeover
import('crypto')  // For password generation
```

### 1.4 Shared Utilities

| Utility | Location | Used By |
|---------|----------|---------|
| `getStripeClient()` | Lines 14-21 (local) | All handlers |
| Idempotency check | Lines 75-85 | Main router |
| Idempotency mark | Lines 131-135 | Main router |
| Webhook logging | Lines 139-146 | Main router |
| Error logging | Lines 161-173 | Main router |
| `createServiceRoleClient()` | Import | All handlers |
| `trackServerEvent()` | Import | Checkout, PaymentSucceeded, PaymentFailed, SubscriptionDeleted |
| `EmailService.*` | Dynamic import | Checkout, PaymentSucceeded, PaymentFailed |

### 1.5 Database Tables Touched

| Handler | Tables Modified |
|---------|-----------------|
| `handleCheckoutCompleted` | `clients`, `photo_galleries`, `commissions`, `subscriptions`, `user_profiles`, `token_transactions`, `payment_history` |
| `handleSubscriptionCreated` | `subscriptions`, `users` |
| `handlePaymentSucceeded` | `subscriptions`, `payment_history`, `commissions` |
| `handlePaymentFailed` | `subscriptions`, `payment_history` |
| `handleSubscriptionDeleted` | `subscriptions`, `error_logs` |
| `handleSubscriptionUpdated` | `subscriptions` |
| `handlePayoutCreated` | `payouts`, `users` |

---

## 2. Proposed File Structure

```
src/lib/stripe/webhooks/
├── index.ts              (~120 lines) - Router & main handler
├── types.ts              (~40 lines)  - Shared types
├── helpers.ts            (~80 lines)  - Shared utilities
├── checkout/
│   ├── index.ts          (~80 lines)  - Main checkout router
│   ├── gallery.ts        (~300 lines) - Gallery checkout (public + authenticated)
│   ├── tokens.ts         (~50 lines)  - Token purchase
│   ├── family.ts         (~40 lines)  - Family takeover
│   └── reactivation.ts   (~100 lines) - Subscription reactivation
├── subscription.ts       (~200 lines) - All customer.subscription.* handlers
├── invoice.ts            (~350 lines) - invoice.payment_succeeded + failed
└── payout.ts             (~50 lines)  - payout.created

src/app/api/webhooks/stripe/
└── route.ts              (~30 lines)  - Thin wrapper that delegates to lib
```

**Total estimated:** ~1,440 lines (slightly more due to module overhead, but much more maintainable)

---

## 3. Module Details

### 3.1 `src/lib/stripe/webhooks/types.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Context passed to all handlers
export type WebhookContext = {
  supabase: SupabaseClient  // Service role client
  stripe: Stripe
  eventId: string
  eventType: string
}

export type HandlerResult = {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

// QA FIX: Comprehensive metadata type for checkout sessions
export interface CheckoutSessionMetadata {
  // Common fields
  user_id?: string
  type?: 'gallery_payment' | 'family_takeover' | 'reactivation'
  purchase_type?: 'tokens' | 'subscription'
  isPublicCheckout?: 'true' | 'false'

  // Gallery checkout fields
  galleryId?: string
  photographerId?: string
  clientId?: string
  clientEmail?: string
  clientName?: string
  galleryName?: string
  totalAmount?: string
  shootFee?: string
  storageFee?: string
  shootFeeCents?: string
  storageFeeCents?: string
  photovaultRevenueCents?: string
  photographerPayoutCents?: string
  paymentOptionId?: string
  payment_option_id?: string

  // Token purchase fields
  tokens?: string

  // Family takeover fields
  account_id?: string
  secondary_id?: string
  takeover_type?: 'full_primary' | 'billing_only'
  reason?: string
  reason_text?: string
  new_payer_user_id?: string
  previous_primary_id?: string

  // Reactivation fields
  stripe_subscription_id?: string
  gallery_id?: string
}

// Re-export commonly used Stripe types
export type { Stripe }
export type CheckoutSession = Stripe.Checkout.Session
export type Subscription = Stripe.Subscription
export type Invoice = Stripe.Invoice
export type Payout = Stripe.Payout
```

**Dependencies:** None (type-only)

### 3.2 `src/lib/stripe/webhooks/helpers.ts`

```typescript
// Functions to extract:
export function getStripeClient(): Stripe
export async function checkIdempotency(supabase, eventId): Promise<boolean>
export async function markProcessed(supabase, eventId, eventType): Promise<void>
export async function logWebhookResult(supabase, eventId, eventType, result, processingTime): Promise<void>
export async function logWebhookError(supabase, error, processingTime): Promise<void>
```

**Dependencies:**
- `stripe` (npm)
- `@/lib/supabase-server`
- `@/lib/logger`

### 3.3 `src/lib/stripe/webhooks/checkout/gallery.ts`

**Handles:** Gallery payments (public and authenticated)

```typescript
export async function handleGalleryCheckout(
  session: Stripe.Checkout.Session,
  ctx: WebhookContext
): Promise<HandlerResult>
```

**Internal responsibilities:**
- User account creation (public checkout)
- Client linking
- Gallery payment status update
- Commission recording
- Subscription record creation
- Welcome email with temp password

**Dependencies:**
- `@/lib/supabase-server`
- `@/lib/analytics/server` + `@/lib/analytics/helpers`
- `@/lib/email/email-service` (dynamic)
- `crypto` (dynamic)
- `../helpers.ts`
- `../types.ts`

### 3.4 `src/lib/stripe/webhooks/checkout/tokens.ts`

**Handles:** Token purchases

```typescript
export async function handleTokenPurchase(
  session: Stripe.Checkout.Session,
  ctx: WebhookContext
): Promise<HandlerResult>
```

**Dependencies:**
- `@/lib/supabase-server`
- `../types.ts`

### 3.5 `src/lib/stripe/webhooks/checkout/family.ts`

**Handles:** Family account takeover

```typescript
export async function handleFamilyTakeover(
  session: Stripe.Checkout.Session,
  ctx: WebhookContext
): Promise<HandlerResult>
```

**Dependencies:**
- `@/lib/server/family-takeover-service` (dynamic)
- `../types.ts`

### 3.6 `src/lib/stripe/webhooks/checkout/reactivation.ts`

**Handles:** Subscription reactivation after lapse

```typescript
export async function handleReactivation(
  session: Stripe.Checkout.Session,
  ctx: WebhookContext
): Promise<HandlerResult>
```

**Dependencies:**
- `@/lib/supabase-server`
- `@/lib/email/email-service` (dynamic)
- `../types.ts`

### 3.7 `src/lib/stripe/webhooks/checkout/index.ts`

**Router for checkout.session.completed**

```typescript
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  ctx: WebhookContext
): Promise<HandlerResult> {
  const { type, purchase_type, isPublicCheckout, galleryId, user_id } = session.metadata || {}

  // Route to appropriate handler
  if ((isPublicCheckout === 'true' || type === 'gallery_payment') && galleryId) {
    return handleGalleryCheckout(session, ctx)
  }
  if (purchase_type === 'tokens') {
    return handleTokenPurchase(session, ctx)
  }
  // QA FIX: Handle subscription checkout (defers to subscription.created event)
  if (purchase_type === 'subscription') {
    return {
      success: true,
      message: `Subscription checkout completed for user ${user_id}, handled by subscription.created event`
    }
  }
  if (type === 'family_takeover') {
    return handleFamilyTakeover(session, ctx)
  }
  if (type === 'reactivation') {
    return handleReactivation(session, ctx)
  }

  // Log unknown checkout types for debugging
  logger.info(`[Webhook] Unhandled checkout type: ${purchase_type || type || 'unknown'}`)
  return { success: true, message: `Checkout completed, type: ${purchase_type || type || 'unknown'}` }
}
```

**Dependencies:**
- `./gallery.ts`
- `./tokens.ts`
- `./family.ts`
- `./reactivation.ts`
- `../types.ts`

### 3.8 `src/lib/stripe/webhooks/subscription.ts`

**Handles:** All `customer.subscription.*` events

```typescript
export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  ctx: WebhookContext
): Promise<HandlerResult>

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  ctx: WebhookContext
): Promise<HandlerResult>

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  ctx: WebhookContext
): Promise<HandlerResult>
```

**Dependencies:**
- `@/lib/supabase-server`
- `@/lib/analytics/server`
- `@/types/analytics`
- `./helpers.ts`
- `./types.ts`

### 3.9 `src/lib/stripe/webhooks/invoice.ts`

**Handles:** `invoice.payment_succeeded` and `invoice.payment_failed`

```typescript
export async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  ctx: WebhookContext
): Promise<HandlerResult>

export async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  ctx: WebhookContext
): Promise<HandlerResult>
```

**Dependencies:**
- `@/lib/supabase-server`
- `@/lib/analytics/server` + `@/lib/analytics/helpers`
- `@/lib/email/email-service` (dynamic)
- `./helpers.ts`
- `./types.ts`

### 3.10 `src/lib/stripe/webhooks/payout.ts`

**Handles:** `payout.created`

```typescript
export async function handlePayoutCreated(
  payout: Stripe.Payout,
  ctx: WebhookContext
): Promise<HandlerResult>
```

**Dependencies:**
- `@/lib/supabase-server`
- `./types.ts`

### 3.11 `src/lib/stripe/webhooks/index.ts`

**Main router and exports**

```typescript
import { createServiceRoleClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import { handleCheckoutCompleted } from './checkout'
import { handleSubscriptionCreated, handleSubscriptionUpdated, handleSubscriptionDeleted } from './subscription'
import { handlePaymentSucceeded, handlePaymentFailed } from './invoice'
import { handlePayoutCreated } from './payout'
import { getStripeClient, checkIdempotency, markProcessed, logWebhookResult } from './helpers'
import type { WebhookContext, HandlerResult } from './types'
import type Stripe from 'stripe'

export { getStripeClient, checkIdempotency, markProcessed, logWebhookResult } from './helpers'
export * from './types'

// QA FIX: Explicit idempotency wrapper with correct timing
export async function processWebhookEvent(event: Stripe.Event): Promise<HandlerResult> {
  const supabase = createServiceRoleClient()
  const startTime = Date.now()

  // 1. CHECK IDEMPOTENCY FIRST (before any processing)
  const alreadyProcessed = await checkIdempotency(supabase, event.id)
  if (alreadyProcessed) {
    logger.info(`[Webhook] Event ${event.id} already processed, skipping`)
    return { success: true, message: 'Already processed' }
  }

  // 2. CREATE CONTEXT
  const ctx: WebhookContext = {
    supabase,
    stripe: getStripeClient(),
    eventId: event.id,
    eventType: event.type
  }

  // 3. PROCESS - handlers MUST NOT call markProcessed
  let result: HandlerResult
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, ctx)
        break
      case 'customer.subscription.created':
        result = await handleSubscriptionCreated(event.data.object as Stripe.Subscription, ctx)
        break
      case 'customer.subscription.updated':
        result = await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, ctx)
        break
      case 'customer.subscription.deleted':
        result = await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, ctx)
        break
      case 'invoice.payment_succeeded':
        result = await handlePaymentSucceeded(event.data.object as Stripe.Invoice, ctx)
        break
      case 'invoice.payment_failed':
        result = await handlePaymentFailed(event.data.object as Stripe.Invoice, ctx)
        break
      case 'payout.created':
        result = await handlePayoutCreated(event.data.object as Stripe.Payout, ctx)
        break
      default:
        logger.info(`[Webhook] Unhandled event type: ${event.type}`)
        result = { success: true, message: `Unhandled event type: ${event.type}` }
    }
  } catch (error) {
    // QA FIX: DO NOT mark as processed on error - allows retry
    logger.error(`[Webhook] Handler error for ${event.type}:`, error)
    throw error  // Re-throw to caller
  }

  // 4. MARK PROCESSED ONLY AFTER SUCCESS
  await markProcessed(supabase, event.id, event.type)
  await logWebhookResult(supabase, event.id, event.type, result, Date.now() - startTime)

  return result
}
```

---

### 3.12 Required Handler Patterns

**QA FIX: All handlers MUST follow these non-blocking patterns:**

#### Email Pattern (Non-Blocking)
```typescript
// CORRECT: Email failure does NOT fail the handler
try {
  const { EmailService } = await import('@/lib/email/email-service')
  await EmailService.sendWelcomeEmail(...)
} catch (emailError) {
  logger.error('[Webhook] Email send failed:', emailError)
  // Continue - payment is already processed
}
```

#### Analytics Pattern (Non-Blocking)
```typescript
// CORRECT: Analytics failure does NOT fail the handler
try {
  await trackServerEvent(userId, EVENTS.PAYMENT_COMPLETED, {...})
} catch (trackError) {
  logger.error('[Webhook] Analytics tracking failed:', trackError)
  // Continue - payment is already processed
}
```

#### Commission Duplicate Handling
```typescript
// CORRECT: Duplicate commission is logged but doesn't fail
await supabase.from('commissions').insert({...})
  .then(({ error }) => {
    if (error) logger.warn('[Webhook] Commission insert error (may be duplicate):', error.message)
  })
```

### 3.12 `src/app/api/webhooks/stripe/route.ts` (Final)

**Thin wrapper - ~30 lines**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { processWebhookEvent, getStripeClient, logWebhookError } from '@/lib/stripe/webhooks'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const stripe = getStripeClient()
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)

    const result = await processWebhookEvent(event)

    return NextResponse.json({
      message: result.message,
      event_type: event.type,
      processing_time_ms: Date.now() - startTime
    }, { status: result.success ? 200 : 500 })

  } catch (error) {
    await logWebhookError(error, Date.now() - startTime)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

---

## 4. Extraction Order (Least to Most Dependencies)

| Priority | Module | Reason |
|----------|--------|--------|
| 1 | `types.ts` | No dependencies, needed by all others |
| 2 | `helpers.ts` | Only external deps, needed by most handlers |
| 3 | `payout.ts` | Simplest handler (~33 lines), no analytics, no email |
| 4 | `checkout/tokens.ts` | Simple, no email, no analytics |
| 5 | `subscription.ts` | Self-contained, analytics but no email in created/updated |
| 6 | `checkout/family.ts` | Simple delegation to external service |
| 7 | `checkout/reactivation.ts` | Has email but relatively isolated |
| 8 | `invoice.ts` | Complex but well-defined (analytics + email) |
| 9 | `checkout/gallery.ts` | Most complex (user creation, commission, email, analytics) |
| 10 | `checkout/index.ts` | Router, depends on all checkout handlers |
| 11 | `index.ts` | Main router, depends on all modules |
| 12 | Update `route.ts` | Final step, switches to new implementation |

---

## 5. Test Strategy

### 5.0 TDD-Compliant Test Foundation (REQUIRED BEFORE ANY EXTRACTION)

**Iron Law:** "NO CODE WITHOUT A FAILING TEST FIRST"

Before extracting ANY code, complete the following:

#### Step 1: Create Behavior Test Suite

Create `src/lib/stripe/webhooks/__tests__/current-behavior.test.ts`:

```typescript
/**
 * These tests capture the CURRENT behavior of the webhook handlers.
 * They MUST pass before any extraction begins.
 * After extraction, they MUST still pass - if they fail, the extraction broke something.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock external dependencies
vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: vi.fn(() => mockSupabase)
}))
vi.mock('@/lib/analytics/server', () => ({
  trackServerEvent: vi.fn()
}))
vi.mock('@/lib/email/email-service', () => ({
  EmailService: { sendWelcomeEmail: vi.fn(), sendPaymentReceipt: vi.fn() }
}))

// Tests for each event type...
```

#### Step 2: Test Coverage Requirements

| Event Type | Required Test Cases |
|------------|---------------------|
| `checkout.session.completed` (gallery) | New user created, existing user linked, commission recorded, subscription created |
| `checkout.session.completed` (tokens) | Token balance increased, transaction recorded |
| `checkout.session.completed` (subscription) | Returns early, defers to subscription.created |
| `checkout.session.completed` (family) | Delegates to family-takeover-service |
| `checkout.session.completed` (reactivation) | Access restored, subscription updated |
| `subscription.created` | Subscription record created in DB |
| `subscription.updated` | Status and period updated |
| `subscription.deleted` | Status set to canceled, churn tracked |
| `invoice.payment_succeeded` | Commission recorded, access restored if suspended |
| `invoice.payment_failed` | Failure count incremented, suspension logic correct |
| `payout.created` | Payout record created |

#### Step 3: Idempotency Tests (Critical)

```typescript
describe('Idempotency', () => {
  it('should skip already-processed events', async () => {
    // Insert event into processed_webhook_events
    // Call handler
    // Verify no database changes
  })

  it('should NOT mark event as processed on handler error', async () => {
    // Mock handler to throw
    // Verify processed_webhook_events NOT inserted
  })

  it('should mark event as processed ONLY after success', async () => {
    // Call handler successfully
    // Verify processed_webhook_events contains event
  })
})
```

#### Step 4: Run and Verify

```bash
# All tests MUST pass before extraction begins
npm run test src/lib/stripe/webhooks/__tests__/current-behavior.test.ts
```

#### Step 5: During Extraction Workflow

```
1. Run tests → All pass
2. Extract ONE module
3. Run tests → If fail, REVERT immediately
4. Run tests → If pass, commit and continue
5. Repeat for each module
```

---

### 5.1 Before Extraction (Documentation)

1. **Document current behavior:** Create test scenarios for each event type
2. **Capture webhook signatures:** Save sample payloads for each event type from Stripe CLI
3. **Verify existing test coverage:** Check what tests exist for webhook handlers

### 5.2 During Extraction

For each module extracted:

1. **Unit test the handler in isolation:**
   - Mock Supabase client
   - Mock Stripe client (where needed)
   - Mock EmailService
   - Test success paths
   - Test error paths

2. **Integration test:**
   - Use Stripe CLI to send test events
   - Verify database state changes
   - Verify email sends (use email test mode)

### 5.3 Test Files to Create

```
src/lib/stripe/webhooks/__tests__/
├── helpers.test.ts
├── payout.test.ts
├── subscription.test.ts
├── invoice.test.ts
└── checkout/
    ├── gallery.test.ts
    ├── tokens.test.ts
    ├── family.test.ts
    └── reactivation.test.ts
```

### 5.4 Integration Test Checklist

| Event | Test Scenario |
|-------|---------------|
| `checkout.session.completed` (gallery) | New client, verify: user created, gallery updated, commission recorded, subscription created, email sent |
| `checkout.session.completed` (tokens) | Token balance increased, transaction recorded |
| `checkout.session.completed` (reactivation) | Access restored, email sent |
| `customer.subscription.created` | Subscription record created |
| `customer.subscription.updated` | Status/period updated |
| `customer.subscription.deleted` | Status changed to canceled, churn tracked |
| `invoice.payment_succeeded` | Commission recorded, access restored if was suspended |
| `invoice.payment_failed` | Failure count incremented, access suspended after 6 months |
| `payout.created` | Payout record created |

---

## 6. Risk Assessment

### 6.1 High Risk Areas

| Risk | Mitigation |
|------|------------|
| **Breaking idempotency** | Extract idempotency logic first, test thoroughly |
| **Missing metadata handling** | Document all metadata fields per checkout type |
| **Email failures blocking webhook** | Keep all email sends in try/catch with logging |
| **Analytics failures blocking webhook** | Keep all analytics in try/catch |
| **Duplicate commission records** | Preserve existing duplicate handling logic |
| **Race conditions** | Maintain same execution order as current handler |

### 6.2 Medium Risk Areas

| Risk | Mitigation |
|------|------------|
| Import path changes | Use absolute imports consistently |
| Type mismatches | Define clear types in types.ts |
| Missing error context | Pass eventId to all handlers for logging |
| Supabase client lifecycle | Create client once in router, pass to handlers |

### 6.3 Low Risk Areas

| Risk | Mitigation |
|------|------------|
| Code duplication | Accept some duplication for clarity |
| Slightly larger total codebase | Worth it for maintainability |

---

## 7. Migration Checklist

### Phase 1: Setup (No risk)
- [ ] Create `src/lib/stripe/webhooks/` directory
- [ ] Create `types.ts`
- [ ] Create `helpers.ts`
- [ ] Add tests for helpers

### Phase 2: Simple Handlers (Low risk)
- [ ] Extract `payout.ts`
- [ ] Extract `checkout/tokens.ts`
- [ ] Extract `subscription.ts`
- [ ] Add tests for each

### Phase 3: Complex Handlers (Medium risk)
- [ ] Extract `checkout/family.ts`
- [ ] Extract `checkout/reactivation.ts`
- [ ] Extract `invoice.ts`
- [ ] Add tests for each

### Phase 4: Gallery Checkout (High risk - largest handler)
- [ ] Extract `checkout/gallery.ts`
- [ ] Extract `checkout/index.ts`
- [ ] Comprehensive testing

### Phase 5: Router (Final)
- [ ] Create `index.ts` main router
- [ ] Update `route.ts` to use new modules
- [ ] Full integration test with Stripe CLI
- [ ] Verify all events work in dev environment
- [ ] Deploy to staging
- [ ] Monitor for 24 hours
- [ ] Deploy to production

---

## 8. Rollback Plan

If issues are discovered post-deployment:

1. **Immediate:** Revert `route.ts` to use inline handlers (Git revert)
2. **Short-term:** Keep old code commented in `route.ts.backup`
3. **Monitoring:** Watch `webhook_logs` table for errors
4. **Alerting:** Set up Stripe Dashboard alerts for failed webhooks

---

## 9. Notes

### Existing `src/lib/stripe.ts`

The existing `stripe.ts` file contains utility functions. Consider:
- Move `getStripeClient()` to that file (or share from there)
- The webhook modules can import from both `@/lib/stripe` and `@/lib/stripe/webhooks/helpers`

### Not Extracted (Intentionally)

These Stripe event types are NOT currently handled and should remain unhandled unless business logic requires them:

- `charge.dispute.created/updated/closed` - Not implemented
- `transfer.created/updated` - Not implemented
- `account.updated` - Not implemented (Connect account status)
- `customer.created/updated/deleted` - Not implemented
- `payment_intent.*` - Handled implicitly via checkout

---

*Plan created: 2025-12-31*
*Author: Stripe Expert Agent*
