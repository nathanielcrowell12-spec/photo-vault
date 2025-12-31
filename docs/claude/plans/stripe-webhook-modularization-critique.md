# QA Critique: Stripe Webhook Modularization Plan

**Reviewer:** QA Critic Expert
**Plan Under Review:** `stripe-webhook-modularization-plan.md`
**Date:** 2025-12-31
**Verdict:** NEEDS REVISION

---

## Executive Summary

The Stripe Webhook Modularization Plan is **generally well-structured** and demonstrates solid understanding of the codebase. However, several **critical gaps** exist around TDD compliance, error handling preservation, and edge case coverage that must be addressed before implementation begins.

**Recommendation:** Address Critical Issues 1-4 and Concerns 1-3 before proceeding with Phase 1.

---

## Critical Issues (MUST FIX)

### 1. Line Count Accuracy - INCORRECT

**Plan claims:** File is 1350 lines, `handleCheckoutCompleted` is lines 186-732 (~546 lines)

**Actual:** File is 1350 lines, `handleCheckoutCompleted` spans lines 186-732 but this is only ~546 lines. However, the plan's module analysis section incorrectly states the checkout handler at "~546 lines" when the function is actually more complex.

**Actual line counts from route.ts:**
| Handler | Actual Lines | Plan's Estimate |
|---------|--------------|-----------------|
| `handleCheckoutCompleted` | 186-732 (547 lines) | ~546 lines (correct) |
| `handleSubscriptionCreated` | 737-782 (46 lines) | ~45 lines (correct) |
| `handlePaymentSucceeded` | 789-1007 (219 lines) | ~218 lines (correct) |
| `handlePaymentFailed` | 1013-1152 (140 lines) | ~139 lines (correct) |
| `handleSubscriptionDeleted` | 1158-1280 (123 lines) | ~122 lines (correct) |
| `handleSubscriptionUpdated` | 1285-1311 (27 lines) | ~26 lines (correct) |
| `handlePayoutCreated` | 1316-1349 (34 lines) | ~33 lines (correct) |

**Resolution:** Line counts are actually accurate within +/- 1 line. No action needed.

---

### 2. TDD Compliance - SEVERELY LACKING

**Per TDD Discipline Skill (Iron Law):** "NO CODE WITHOUT A FAILING TEST FIRST"

**Plan's Test Strategy (Section 5) Violations:**

1. **Tests written DURING extraction, not BEFORE:** The plan says "For each module extracted... Unit test the handler in isolation." This is backwards. Tests must exist BEFORE extraction to verify behavior is preserved.

2. **No "capture current behavior" test suite:** Section 5.1 says "Document current behavior... Capture webhook signatures" but does not mandate:
   - Creating failing tests BEFORE moving code
   - Running the test suite after EACH file move
   - Verifying identical behavior after extraction

3. **Missing test-first extraction workflow:** The correct TDD approach for refactoring is:
   ```
   1. Write tests that pass with current implementation
   2. Extract code to new module (tests should still pass)
   3. If tests fail, the extraction broke something
   ```

**Required Changes to Plan:**

Add to Section 5.1 - **Mandatory Before ANY Extraction:**
```markdown
### 5.0 Test-First Foundation (REQUIRED BEFORE PHASE 1)

Before extracting ANY code:

1. **Create comprehensive webhook test suite** covering ALL handlers:
   - `__tests__/webhooks/current-behavior.test.ts`
   - One test per event type
   - Tests must use actual handler functions
   - Tests must verify database state changes
   - Tests must mock email/analytics (not verify behavior)

2. **Run and verify all tests PASS** with current monolithic implementation

3. **During extraction, run tests after EVERY file change**
   - Tests fail? Revert. Something broke.
   - Tests pass? Safe to continue.

This is non-negotiable per TDD Discipline Skill.
```

---

### 3. Missing Checkout Sub-Type: `purchase_type === 'subscription'`

**Plan Section 1.2 lists checkout sub-types** but the actual code at line 623-625 shows:

```typescript
} else if (purchase_type === 'subscription') {
  // Subscription created via checkout - handled by subscription.created event
  return `Subscription checkout completed for user ${user_id}`
}
```

**This is documented in the plan** (line 34), but:

1. The plan does NOT create a module for subscription checkout handling
2. The `checkout/index.ts` router (Section 3.7) does NOT route this case
3. This will cause subscription checkouts to fall through to the "unknown" case

**Required Fix:**

Add to `checkout/index.ts` routing logic:
```typescript
if (purchase_type === 'subscription') {
  return { success: true, message: `Subscription checkout completed for user ${user_id}, handled by subscription.created event` }
}
```

Or add explicit `checkout/subscription.ts` module even if it's a pass-through.

---

### 4. Idempotency Logic Extraction Risk

**Current idempotency implementation (lines 75-85):**
```typescript
const { data: alreadyProcessed } = await supabase
  .from('processed_webhook_events')
  .select('id')
  .eq('stripe_event_id', event.id)
  .single()

if (alreadyProcessed) {
  logger.info(`[Webhook] Event ${event.id} already processed, skipping`)
  return NextResponse.json({ message: 'Already processed' }, { status: 200 })
}
```

**And marking as processed (lines 131-135):**
```typescript
await supabase.from('processed_webhook_events').insert({
  stripe_event_id: event.id,
  event_type: event.type,
  processed_at: new Date().toISOString()
})
```

**Critical Risk:** The plan proposes moving these to `helpers.ts` but **the timing is critical**:

1. Check idempotency BEFORE routing to handler
2. Mark processed AFTER handler succeeds
3. Handler failure should NOT mark as processed

**If extraction changes this order, duplicate events WILL be processed or successful events WON'T be marked.**

**Required Fix:**

The plan's `processWebhookEvent` function (Section 3.11) must explicitly show the idempotency wrapper pattern:

```typescript
export async function processWebhookEvent(event: Stripe.Event): Promise<HandlerResult> {
  const supabase = createServiceRoleClient()

  // 1. CHECK FIRST
  if (await checkIdempotency(supabase, event.id)) {
    return { success: true, message: 'Already processed' }
  }

  // 2. PROCESS
  const ctx: WebhookContext = { supabase, stripe: getStripeClient(), eventId: event.id, eventType: event.type }

  let result: HandlerResult
  try {
    switch (event.type) {
      // ... handlers
    }
  } catch (error) {
    // DO NOT mark as processed on error
    throw error
  }

  // 3. MARK ONLY AFTER SUCCESS
  await markProcessed(supabase, event.id, event.type)

  return result
}
```

---

## Concerns (SHOULD ADDRESS)

### 1. Email Failure Handling Inconsistency

**Stripe Skill says:** "Respond to webhooks quickly (< 200ms) with async processing"

**Current code properly wraps email sends in try/catch** (e.g., lines 549-572):
```typescript
if (tempPassword && userId) {
  try {
    const { EmailService } = await import('@/lib/email/email-service')
    // ... send email
  } catch (emailError) {
    logger.error('[Webhook] Error sending welcome email:', emailError)
    // Don't fail webhook if email fails - payment is already processed
  }
}
```

**Risk:** When extracting to separate modules, this pattern could be lost. Each handler module (`gallery.ts`, `reactivation.ts`, `invoice.ts`) must preserve this non-blocking email pattern.

**Recommendation:** Add to Section 3 module specs:
```markdown
**Email Send Pattern (REQUIRED):**
All email sends MUST be wrapped in try/catch and MUST NOT fail the handler.
Log errors but return success if the core database operations succeeded.
```

---

### 2. Analytics Failure Handling Same Issue

**Current code at lines 459-504** wraps analytics in try/catch:
```typescript
try {
  await trackServerEvent(userId, EVENTS.CLIENT_PAYMENT_COMPLETED, {...})
} catch (trackError) {
  logger.error('[Webhook] Error tracking payment analytics:', trackError)
  // Don't block webhook if tracking fails
}
```

**Same risk as emails.** Must be preserved in extracted modules.

---

### 3. Missing Handler: Default Case Logging

**Current code (lines 120-122):**
```typescript
default:
  logger.info(`[Webhook] Unhandled event type: ${event.type}`)
  handlerResult = `Unhandled event type: ${event.type}`
```

**Plan's router in Section 3.11** exports `processWebhookEvent` but does not show how unhandled event types are logged and returned. This should still log and return success (200) for unhandled events per Stripe best practices.

---

### 4. `supabase.raw()` Usage Warning

**Line 602-603 in current code:**
```typescript
token_balance: supabase.raw(`COALESCE(token_balance, 0) + ${tokenAmount}`)
```

**This is a SQL injection risk** if `tokenAmount` is not properly validated. When extracting `checkout/tokens.ts`, this should be flagged for review. Consider using parameterized increment or the RPC function that already exists.

---

### 5. Variable Shadow in handleCheckoutCompleted

**Lines 384-386 define:**
```typescript
let shootFeeCents: number
let storageFeeCents: number
```

**But metadata destructuring at line 194 already has:**
```typescript
const { ..., shootFeeCents, storageFeeCents, ... } = metadata
```

**The later `let` declarations shadow the destructured values.** This is intentional (to re-assign based on format detection at line 389) but confusing. When extracting to `gallery.ts`, consider renaming the local variables to avoid confusion:

```typescript
let calculatedShootFeeCents: number
let calculatedStorageFeeCents: number
```

---

## What the Plan Gets Right

### 1. Correct Event Type Coverage

The plan correctly identifies all 7 event types handled:
- `checkout.session.completed`
- `customer.subscription.created`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.deleted`
- `customer.subscription.updated`
- `payout.created`

### 2. Proper Dependency Analysis

Section 1.3 correctly identifies imports and Section 3 correctly assigns dependencies to each module. The dynamic imports for EmailService and family-takeover-service are noted.

### 3. Correct Extraction Order

Starting with `types.ts` and `helpers.ts`, then simplest handlers (`payout.ts`, `tokens.ts`), then complex handlers is the correct order for TDD-compliant refactoring.

### 4. Risk Assessment is Accurate

Section 6 correctly identifies:
- Breaking idempotency (High)
- Email failures blocking webhook (High)
- Duplicate commission records (High)
- Race conditions (High)

### 5. Rollback Plan Exists

Section 8 provides a sensible rollback strategy, though it could be more specific about which git commits to revert to.

---

## Missing Elements

### 1. No Type Definition for `metadata` Object

The plan's `types.ts` (Section 3.1) defines `WebhookContext` and `HandlerResult` but does NOT define a type for the checkout session metadata. The current code accesses 20+ metadata fields:

```typescript
const { user_id, tokens, purchase_type, isPublicCheckout, type, galleryId,
        photographerId, clientId, clientEmail, clientName, galleryName,
        totalAmount, shootFee, storageFee, shootFeeCents, storageFeeCents,
        photovaultRevenueCents, photographerPayoutCents } = metadata
```

**Add to types.ts:**
```typescript
export interface CheckoutSessionMetadata {
  user_id?: string
  tokens?: string
  purchase_type?: 'tokens' | 'subscription'
  isPublicCheckout?: 'true' | 'false'
  type?: 'gallery_payment' | 'family_takeover' | 'reactivation'
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
```

### 2. No Commission Duplicate Handling Preservation

**Current code at line 455-457:**
```typescript
}).then(({ error }: { error: any }) => {
  if (error) logger.warn('[Webhook] Commission insert error (may be duplicate):', error.message)
})
```

**This is commission idempotency!** If a webhook retries after commission was created, it warns but doesn't fail. The extracted `gallery.ts` must preserve this `.then()` pattern.

### 3. No Mention of RPC Functions

The current code uses:
- `supabase.rpc('add_tokens_to_balance', ...)` (line 590)
- `supabase.rpc('get_photographer_churn_stats', ...)` (line 1202)
- `supabase.rpc('get_client_churn_stats', ...)` (line 1234)

These are database-side functions. The plan should verify these RPCs exist in all environments before extraction.

### 4. No Supabase Client Lifecycle Documentation

The plan mentions "Create client once in router, pass to handlers" (Section 6.2) but doesn't show how the current pattern of creating the client INSIDE the webhook handler (line 73) will change. This is correct, but should be explicit.

---

## Final Verdict

**Status: NEEDS REVISION**

### Before Proceeding:

1. **CRITICAL:** Add TDD-compliant test foundation (Section 5.0) requiring tests BEFORE extraction
2. **CRITICAL:** Fix checkout routing to handle `purchase_type === 'subscription'` case
3. **CRITICAL:** Make idempotency wrapper explicit in `processWebhookEvent`
4. **CRITICAL:** Ensure `markProcessed` is ONLY called on success, NOT on error
5. **SHOULD:** Add `CheckoutSessionMetadata` type definition
6. **SHOULD:** Document email/analytics try/catch pattern requirement for all modules
7. **SHOULD:** Preserve commission duplicate handling pattern in `gallery.ts`

### Once Addressed:

This plan will be **APPROVED FOR IMPLEMENTATION** following the TDD extraction workflow:

```
1. Write behavior tests against current implementation
2. Run tests, verify all pass
3. Extract one module
4. Run tests, verify still pass
5. Repeat 3-4 for each module
6. Final integration test with Stripe CLI
```

---

*QA Critique completed 2025-12-31*
*Reviewer: QA Critic Expert*
