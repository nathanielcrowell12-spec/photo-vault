# Stripe Connect Payment Architecture Fix Plan

**Created:** December 1, 2025
**Status:** Ready for Implementation
**Priority:** HIGH - Fixes critical payment flow and eliminates manual payout complexity

---

## Executive Summary

PhotoVault's current payment architecture is fundamentally flawed. It collects all money to the platform account, manually tracks commissions in a database, and plans to pay photographers via a cron job with a 14-day delay. This approach is:
- **Complex and error-prone** (manual payout tracking)
- **Financially risky** (platform holds all money)
- **Against Stripe best practices** (destination charges exist for this exact use case)
- **Creates unnecessary code** (cron jobs, payout queue management)

**The correct approach:** Use Stripe Connect's **destination charges** so money goes DIRECTLY to the photographer's account, Stripe automatically handles fees, and the platform gets its cut via `application_fee_amount`. No cron jobs needed.

---

## Current Architecture Problems

### Problem 1: Money Flow is Backwards

**Current (WRONG):**
```
Client pays $350 → ALL money goes to PhotoVault platform account
                 → Platform manually tracks "$290 owed to photographer"
                 → Cron job runs after 14 days
                 → Platform manually transfers $290 to photographer
```

**What SHOULD happen:**
```
Client pays $350 → $290 goes DIRECTLY to photographer (Stripe handles this)
                 → $50 stays with PhotoVault (via application_fee_amount)
                 → Stripe automatically settles in 2 days
                 → NO manual transfers needed
```

### Problem 2: Two Commission Tables Don't Work Together

There are TWO commission tracking tables:

| Table | Used By | Purpose | Problems |
|-------|---------|---------|----------|
| `commissions` | Webhook handler | NEW table with fee breakdown | Missing `scheduled_payout_date` column |
| `commission_payments` | Cron job, commission service | OLD table for payout queue | Uses wrong Stripe account field (`cms_integration_id`) |

**Result:** Webhook writes to one table, cron reads from another. Data never connects.

### Problem 3: Manual Payout Logic is Complex

Current flow requires:
- ✅ Webhook creates commission record (status: pending)
- ✅ Cron job runs daily checking `scheduled_payout_date`
- ✅ For each due commission, call `processScheduledPayout()`
- ✅ Look up photographer's `stripe_connect_account_id`
- ✅ Create Stripe Transfer manually
- ✅ Handle transfer failures
- ✅ Update commission status to 'paid'
- ✅ Log payout history

**This is 200+ lines of code that Stripe already does automatically.**

### Problem 4: Photographer Must Have Stripe Connect Before Payment

Current code comments say "Don't use destination charges" but then checks for `photographer.stripe_account_id` in metadata. If photographer hasn't connected Stripe yet, what happens to the money?

The webhook tries to store `photographerStripeAccountId` in metadata but doesn't actually USE it for destination charges.

---

## Correct Architecture: Stripe Connect Destination Charges

### How Destination Charges Work

When creating a Stripe Checkout session (or Payment Intent):

```typescript
stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [{ price_data: { ... }, quantity: 1 }],
  payment_intent_data: {
    application_fee_amount: 5000, // Platform gets $50 (in cents)
    transfer_data: {
      destination: photographer.stripe_account_id, // Money goes HERE
    },
  },
})
```

**What happens:**
1. Client pays $350 total
2. Stripe IMMEDIATELY routes $290 to photographer's Express account
3. Stripe deducts its processing fees (~$10) from photographer's $290
4. Platform gets $50 guaranteed (via `application_fee_amount`)
5. After 2 days, photographer can access their money (Stripe's standard settlement)

**No cron jobs. No manual transfers. No 14-day delay tracking.**

### Business Model Breakdown

#### Example: $350 Payment ($250 shoot fee + $100 storage fee)

| Party | Amount | When | How |
|-------|--------|------|-----|
| **Client pays** | $350 | Checkout | Stripe Checkout |
| **Photographer receives** | $290 gross | Immediately routed by Stripe | Destination charge |
| **Stripe fees** | ~$10 | Deducted from photographer's share | Automatic |
| **Photographer net** | ~$280 | 2 days (Stripe settlement) | Direct to their bank |
| **PhotoVault gets** | $50 | Immediately | `application_fee_amount` |

**Calculation:**
- Photographer gets: `shoot_fee + (storage_fee * 0.5)` = $250 + $50 = $290
- PhotoVault gets: `storage_fee * 0.5` = $50
- Stripe fees: ~2.9% + $0.30 = ~$10 (deducted from photographer's share)

#### Example: $8/month Year 2+ Subscription

| Party | Amount | When | How |
|-------|--------|------|-----|
| **Client pays** | $8/month | Monthly billing | Stripe Subscription |
| **Photographer receives** | $4/month | Each billing cycle | Destination charge |
| **PhotoVault gets** | $4/month | Each billing cycle | `application_fee_amount` |

---

## Implementation Plan

### Phase 1: Update Checkout Creation (Payment Intent)

**Files to modify:**
1. `src/app/api/stripe/public-checkout/route.ts`
2. `src/app/api/stripe/gallery-checkout/route.ts`

**Changes needed:**

#### Current Code (gallery-checkout/route.ts, lines 237-248):
```typescript
// If photographer has Stripe Connect, set up transfer
...(photographer.stripe_account_id && {
  payment_intent_data: {
    // Don't use destination charges - we'll do a separate transfer
    // This gives us more control over timing and split
    metadata: {
      galleryId: gallery.id,
      photographerId: photographer.id,
      photographerStripeAccountId: photographer.stripe_account_id,
      photographerPayoutCents: photographerPayoutCents.toString(),
    },
  },
}),
```

#### New Code (REPLACE with):
```typescript
// Stripe Connect destination charge - money goes directly to photographer
...(photographer.stripe_account_id && {
  payment_intent_data: {
    application_fee_amount: photovaultRevenueCents, // Platform's $50 cut
    transfer_data: {
      destination: photographer.stripe_account_id,
    },
    metadata: {
      galleryId: gallery.id,
      photographerId: photographer.id,
    },
  },
}),
```

**Why this is better:**
- Money automatically routes to photographer
- Platform fee is guaranteed (can't be reversed without refund)
- No manual transfers needed
- Stripe handles settlement timing (2 days, not 14)

#### Edge Case: Photographer Hasn't Connected Stripe Yet

**Problem:** If `photographer.stripe_account_id` is null, we can't use destination charges.

**Solutions:**

**Option A: Block payment until Stripe connected (RECOMMENDED)**
```typescript
// Before creating checkout session
if (!photographer.stripe_account_id) {
  return NextResponse.json({
    error: 'Photographer payment setup incomplete',
    message: 'The photographer needs to connect their Stripe account before you can pay.',
    requiresSetup: true,
  }, { status: 400 })
}
```

**Option B: Collect to platform, notify photographer**
```typescript
// If no stripe_account_id, create session WITHOUT destination
// Add webhook handler to detect this case and email photographer
// "Your client paid $350 but you need to connect Stripe to receive $290"
```

**Recommendation:** Use Option A. It's cleaner and prevents the "money is stuck" scenario. Photographers should connect Stripe during onboarding.

### Phase 2: Update Webhook Handler

**File:** `src/app/api/webhooks/stripe/route.ts`

**Current behavior (lines 244-279):**
- Webhook calculates photographer commission
- Inserts into `commissions` table with `status: 'pending'`
- Expects a cron job to pay out later

**New behavior:**
- Webhook records the transaction as `status: 'paid'` immediately
- Money has ALREADY been routed by Stripe
- Commission record is just a HISTORY log, not a payout queue

#### Changes Needed:

**Current Code (lines 264-279):**
```typescript
await supabase.from('commissions').insert({
  photographer_id: photographerId,
  gallery_id: galleryId,
  client_email: customerEmail,
  amount_cents: photographerGrossCents, // What photographer will receive (before Stripe fees)
  total_paid_cents: amountPaidCents,
  shoot_fee_cents: shootFeeCents,
  storage_fee_cents: storageFeeCents,
  photovault_commission_cents: photovaultCommissionCents,
  payment_type: 'upfront', // Year 1 upfront payment
  stripe_payment_intent_id: session.payment_intent as string,
  status: 'pending', // Will be paid out after holding period
  created_at: new Date().toISOString(),
})
```

**New Code (REPLACE with):**
```typescript
// Get the actual transfer details from Stripe
const paymentIntent = await stripe.paymentIntents.retrieve(
  session.payment_intent as string,
  { expand: ['latest_charge.transfer'] }
)

const transfer = paymentIntent.latest_charge?.transfer
const transferId = typeof transfer === 'string' ? transfer : transfer?.id

await supabase.from('commissions').insert({
  photographer_id: photographerId,
  gallery_id: galleryId,
  client_email: customerEmail,
  amount_cents: photographerGrossCents,
  total_paid_cents: amountPaidCents,
  shoot_fee_cents: shootFeeCents,
  storage_fee_cents: storageFeeCents,
  photovault_commission_cents: photovaultCommissionCents,
  payment_type: 'upfront',
  stripe_payment_intent_id: session.payment_intent as string,
  stripe_transfer_id: transferId || null, // Record the Stripe transfer ID
  status: 'paid', // Money already transferred by Stripe
  paid_at: new Date().toISOString(), // Paid NOW
  created_at: new Date().toISOString(),
})
```

**Key changes:**
- Status is `'paid'` not `'pending'`
- `paid_at` is set immediately
- Store `stripe_transfer_id` for reconciliation
- No need for `scheduled_payout_date`

### Phase 3: Update Commission Service (Simplified)

**File:** `src/lib/server/commission-service.ts`

**Current code:** 222 lines of complex payout logic

**New code:** Remove most of it. The service becomes MUCH simpler.

#### Functions to REMOVE:
- `calculateScheduledPayoutDate()` - No longer needed
- `processScheduledPayout()` - Stripe handles transfers automatically
- Most of the payout logic

#### Functions to KEEP (and simplify):
- `createCommission()` - Still used, but simpler (no scheduled date calculation)
- `getPhotographerPendingCommissions()` - Change to `getPhotographerCommissions()`
- `getPhotographerCommissionHistory()` - Keep as-is

#### New simplified version:

```typescript
/**
 * Commission Service - SIMPLIFIED
 * With Stripe Connect destination charges, this is now just a RECORD-KEEPING service.
 * Stripe handles the actual money movement automatically.
 */

import { createServerSupabaseClient } from '../supabase'

export interface CreateCommissionParams {
  photographerId: string
  galleryId: string
  clientEmail: string
  amountCents: number
  totalPaidCents: number
  shootFeeCents: number
  storageFeeCents: number
  photovaultCommissionCents: number
  paymentType: 'upfront' | 'monthly' | 'reactivation'
  stripePaymentIntentId: string
  stripeTransferId: string | null
}

/**
 * Create commission record (for reporting only - Stripe already transferred money)
 */
export async function createCommission(params: CreateCommissionParams): Promise<{
  success: boolean
  commissionId?: string
  error?: string
}> {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('commissions')
      .insert({
        photographer_id: params.photographerId,
        gallery_id: params.galleryId,
        client_email: params.clientEmail,
        amount_cents: params.amountCents,
        total_paid_cents: params.totalPaidCents,
        shoot_fee_cents: params.shootFeeCents,
        storage_fee_cents: params.storageFeeCents,
        photovault_commission_cents: params.photovaultCommissionCents,
        payment_type: params.paymentType,
        stripe_payment_intent_id: params.stripePaymentIntentId,
        stripe_transfer_id: params.stripeTransferId,
        status: 'paid', // Always paid - Stripe already transferred
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating commission:', error)
      return { success: false, error: error.message }
    }

    console.log(`[Commission] Recorded commission ${data.id} for photographer ${params.photographerId}: $${params.amountCents / 100}`)

    return { success: true, commissionId: data.id }

  } catch (error) {
    const err = error as Error
    console.error('[Commission] Unexpected error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get photographer's commission history (no more "pending" - everything is paid)
 */
export async function getPhotographerCommissions(
  photographerId: string,
  limit: number = 50
) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('photographer_id', photographerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching commissions:', error)
    return []
  }

  return data || []
}
```

**From 222 lines to ~80 lines. 64% reduction.**

### Phase 4: Delete/Deprecate Cron Job

**File:** `src/app/api/cron/process-payouts/route.ts`

**Action:** DELETE THIS ENTIRE FILE.

**Reason:** With destination charges, Stripe handles payouts automatically. There's nothing for a cron job to do.

**Cleanup checklist:**
- [ ] Delete `src/app/api/cron/process-payouts/route.ts`
- [ ] Remove any Vercel cron configuration for this job
- [ ] Remove `vercel.json` cron entries (if any)
- [ ] Update documentation to remove references to "14-day payout delay"

### Phase 5: Database Schema Updates

**File:** `database/commissions-table.sql`

**Changes needed:**

#### Add new column:
```sql
-- Add Stripe transfer ID for reconciliation
ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_commissions_stripe_transfer_id
ON commissions(stripe_transfer_id);
```

#### Drop obsolete column (if migration allows):
```sql
-- scheduled_payout_date is no longer used
-- Only drop if you're comfortable with schema migration
ALTER TABLE commissions DROP COLUMN IF EXISTS scheduled_payout_date;
```

#### Optional: Archive old commission_payments table
```sql
-- Rename old table to keep historical data
ALTER TABLE commission_payments RENAME TO commission_payments_deprecated;

-- Add comment explaining why
COMMENT ON TABLE commission_payments_deprecated IS
'Deprecated table from manual payout system. Replaced by commissions table with Stripe Connect destination charges. Kept for historical reference only.';
```

### Phase 6: Update Photographer Dashboard

**Files to modify:**
1. `src/app/photographer/dashboard/page.tsx` (or wherever earnings are shown)
2. Create new API endpoint: `src/app/api/photographer/commissions/route.ts`

**New API endpoint:**

```typescript
// src/app/api/photographer/commissions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get photographer's commissions
    const { data: commissions, error } = await supabase
      .from('commissions')
      .select(`
        id,
        gallery_id,
        client_email,
        amount_cents,
        total_paid_cents,
        shoot_fee_cents,
        storage_fee_cents,
        photovault_commission_cents,
        payment_type,
        stripe_payment_intent_id,
        stripe_transfer_id,
        status,
        paid_at,
        created_at,
        photo_galleries (
          gallery_name,
          gallery_date
        )
      `)
      .eq('photographer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    // Calculate totals
    const totalEarnings = commissions?.reduce((sum, c) => sum + c.amount_cents, 0) || 0
    const upfrontEarnings = commissions?.filter(c => c.payment_type === 'upfront')
      .reduce((sum, c) => sum + c.amount_cents, 0) || 0
    const monthlyEarnings = commissions?.filter(c => c.payment_type === 'monthly')
      .reduce((sum, c) => sum + c.amount_cents, 0) || 0

    return NextResponse.json({
      commissions: commissions || [],
      totals: {
        total: totalEarnings / 100, // Convert to dollars
        upfront: upfrontEarnings / 100,
        monthly: monthlyEarnings / 100,
      },
    })

  } catch (error) {
    const err = error as Error
    console.error('[API:Commissions] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch commissions', message: err.message },
      { status: 500 }
    )
  }
}
```

**Dashboard UI:**

```tsx
// Example: src/app/photographer/dashboard/page.tsx (add section)

<Card>
  <CardHeader>
    <CardTitle>Earnings Overview</CardTitle>
    <CardDescription>
      All earnings are automatically transferred to your bank account within 2 days via Stripe
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid gap-4 md:grid-cols-3">
      <div>
        <div className="text-2xl font-bold">${totals.total.toFixed(2)}</div>
        <p className="text-xs text-muted-foreground">Total Earnings</p>
      </div>
      <div>
        <div className="text-2xl font-bold">${totals.upfront.toFixed(2)}</div>
        <p className="text-xs text-muted-foreground">Year 1 Payments</p>
      </div>
      <div>
        <div className="text-2xl font-bold">${totals.monthly.toFixed(2)}</div>
        <p className="text-xs text-muted-foreground">Recurring Revenue</p>
      </div>
    </div>

    <div className="mt-6">
      <h4 className="text-sm font-medium mb-3">Recent Commissions</h4>
      <div className="space-y-2">
        {commissions.map(commission => (
          <div key={commission.id} className="flex justify-between items-center p-3 border rounded">
            <div>
              <p className="font-medium">{commission.photo_galleries?.gallery_name || 'Gallery'}</p>
              <p className="text-sm text-muted-foreground">{commission.client_email}</p>
              <p className="text-xs text-muted-foreground">
                Paid {new Date(commission.paid_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">${(commission.amount_cents / 100).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground capitalize">{commission.payment_type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </CardContent>
</Card>
```

---

## Edge Cases & Considerations

### 1. What if Photographer Hasn't Connected Stripe?

**Scenario:** Gallery is created, client tries to pay, but photographer has no `stripe_account_id`.

**Solution:**
- **Block payment at checkout creation** (recommended)
- Return error: "Photographer needs to complete Stripe setup"
- Email photographer: "Your client tried to pay but you need to connect Stripe"
- Don't create checkout session without destination

**Code location:** `src/app/api/stripe/public-checkout/route.ts` and `gallery-checkout/route.ts`

```typescript
// Add check before creating session
if (!photographer.stripe_account_id) {
  // Email photographer
  await EmailService.sendPhotographerStripeSetupReminder({
    photographerEmail: photographer.email,
    photographerName: photographer.full_name,
    clientEmail: clientEmail,
    galleryName: gallery.gallery_name,
  })

  return NextResponse.json({
    error: 'Payment setup incomplete',
    message: 'The photographer needs to connect their Stripe account. They have been notified.',
    code: 'PHOTOGRAPHER_STRIPE_MISSING',
  }, { status: 400 })
}
```

### 2. What About Refunds?

**Current behavior:** If payment is refunded, platform loses money AND still owes photographer.

**With destination charges:**
- Refund automatically reverses the transfer
- Photographer's account is debited
- Platform's `application_fee` is refunded too
- Everything stays in sync automatically

**No code changes needed** - Stripe handles this.

### 3. What About Disputes/Chargebacks?

**With destination charges:**
- Stripe handles the dispute process
- If photographer loses, their account is debited
- Platform's `application_fee` is protected (Stripe covers it)

**Code needed:**
- Add webhook handler for `charge.dispute.created`
- Notify photographer of dispute
- No manual money movement required

### 4. What About Partial Refunds?

**Example:** Client paid $350, photographer already got $290, now client wants $100 refund.

**With destination charges:**
- Create partial refund via Stripe API
- Stripe automatically debits photographer's account proportionally
- Platform's fee is adjusted automatically

**Code needed:**
```typescript
// When refunding
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId,
  amount: 10000, // $100 in cents
  // Stripe automatically calculates reverse transfer
  // Photographer will be debited their share
  // Platform fee will be reduced proportionally
})
```

### 5. Monthly Subscriptions (Year 2+)

**Current:** Not implemented yet

**With destination charges:**
```typescript
// When creating subscription
stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: 'price_monthly_8dollars' }],
  application_fee_percent: 50, // 50% to photographer
  transfer_data: {
    destination: photographer.stripe_account_id,
  },
})
```

Each month:
- Stripe automatically charges client $8
- $4 goes to photographer
- $4 goes to platform
- Webhook records commission for that month

### 6. What if Photographer Closes Their Stripe Account?

**Problem:** Destination charge will fail.

**Solution:**
- Webhook will receive `payment_intent.payment_failed` event
- Detect reason: `destination_account_closed`
- Mark photographer as "payout suspended"
- Email photographer to reconnect Stripe
- Hold future payments until resolved

**Code:**
```typescript
// In webhook handler
if (paymentIntent.last_payment_error?.code === 'account_invalid') {
  // Photographer's Stripe account is invalid/closed
  await supabase
    .from('user_profiles')
    .update({ stripe_status: 'disconnected' })
    .eq('id', photographerId)

  // Email photographer
  await EmailService.sendStripeReconnectRequired(...)
}
```

### 7. Testing Without Breaking Production

**Strategy:**
1. Create a test photographer with Stripe Connect test account
2. Use Stripe test mode for all changes
3. Test full flow: create gallery → pay → verify transfer
4. Check Stripe Dashboard → Connect → Transfers
5. Verify commission record created with correct amounts

**Test checklist:**
- [ ] Payment succeeds with destination charge
- [ ] Money appears in test photographer's account
- [ ] Platform fee appears in platform account
- [ ] Commission record shows `status: 'paid'`
- [ ] `stripe_transfer_id` is populated
- [ ] Refund reverses transfer correctly
- [ ] Photographer without Stripe account blocked

---

## Migration Strategy

### Option A: Big Bang (Switch All At Once)

**Steps:**
1. Deploy all changes in one release
2. Old commissions stay in `commission_payments` (historical)
3. New commissions use destination charges
4. Cron job only processes old `commission_payments` until empty
5. Once all old commissions paid out, delete cron job

**Pros:** Clean cutover, no hybrid logic
**Cons:** Higher risk, requires careful testing

### Option B: Gradual Rollout (Feature Flag)

**Steps:**
1. Add feature flag: `USE_DESTINATION_CHARGES = true/false`
2. If `true`: Use new destination charge flow
3. If `false`: Use old manual transfer flow
4. Test with small subset of photographers first
5. Gradually increase percentage
6. Once stable, remove flag and old code

**Pros:** Lower risk, easy to rollback
**Cons:** More complex code temporarily

### Option C: Photographer Opt-In

**Steps:**
1. Add `payment_method` field to `user_profiles`: `'manual'` or `'automatic'`
2. Let photographers choose in settings
3. Automatic = destination charges (2-day settlement)
4. Manual = old 14-day cron job system
5. Phase out manual over time

**Pros:** Photographers control migration
**Cons:** Maintains two systems indefinitely

**Recommendation:** Use Option A (Big Bang) if you have good test coverage. PhotoVault is early stage, so a clean cutover is better than maintaining dual systems.

---

## Benefits Summary

### Code Simplification

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| Commission service | 222 lines | ~80 lines | 64% |
| Cron job | 90 lines | 0 lines (deleted) | 100% |
| Webhook handler | Complex pending logic | Simple recording | ~30% |
| **Total reduction** | | | **~200 lines deleted** |

### Financial Benefits

| Aspect | Current (Manual) | New (Destination) |
|--------|------------------|-------------------|
| **Settlement time** | 14 days | 2 days (Stripe standard) |
| **Platform holds money** | Yes (risky) | No (goes direct to photographer) |
| **Refund handling** | Manual reversal needed | Automatic by Stripe |
| **Dispute risk** | Platform liable | Stripe handles |
| **Payout failures** | Manual retry logic | Stripe retries automatically |
| **Photographer trust** | Lower (14-day wait) | Higher (instant routing) |

### Operational Benefits

- No cron job to maintain
- No payout queue to manage
- No "pending" commissions to track
- No manual transfer failures to debug
- Stripe Dashboard shows all transfers
- Better audit trail (Stripe's records)

---

## Testing Checklist

### Unit Tests Needed

- [ ] Checkout creation with destination charge
- [ ] Commission calculation (shoot fee + storage split)
- [ ] Webhook handling (verify status='paid')
- [ ] API endpoint for fetching commissions
- [ ] Error handling (no Stripe account)

### Integration Tests Needed

- [ ] Full payment flow: create gallery → pay → verify commission
- [ ] Refund flow: pay → refund → verify reversal
- [ ] Stripe webhook processing
- [ ] Photographer dashboard shows correct earnings

### Manual QA Tests

- [ ] Create test photographer with Stripe Connect account
- [ ] Create test gallery with pricing
- [ ] Make test payment (Stripe test mode)
- [ ] Verify money in photographer's test account
- [ ] Verify platform fee in platform account
- [ ] Check commission record in database
- [ ] Test refund scenario
- [ ] Test photographer without Stripe account (should block)

---

## Documentation Updates Needed

### Files to update:

1. **STRIPE-SETUP-GUIDE.md**
   - Add section on destination charges
   - Remove references to manual payouts
   - Update photographer onboarding flow

2. **COMMISSION-SYSTEM-IMPLEMENTATION.md**
   - Rewrite to reflect automatic transfers
   - Remove 14-day delay references
   - Update business model section

3. **WEBHOOK_README.md**
   - Add destination charge handling
   - Remove payout scheduling logic

4. **CLAUDE.md (hub-specific)**
   - Update SESSION STATE with new architecture
   - Remove cron job from file list
   - Update commission flow diagram

5. **API Documentation** (if exists)
   - Update `/api/stripe/public-checkout` docs
   - Update `/api/stripe/gallery-checkout` docs
   - Add `/api/photographer/commissions` endpoint

---

## Implementation Order

**Recommended sequence:**

1. **Phase 1:** Update database schema (add `stripe_transfer_id` column)
2. **Phase 2:** Update commission service (simplified version)
3. **Phase 3:** Update checkout creation (add destination charges)
4. **Phase 4:** Update webhook handler (record as 'paid' immediately)
5. **Phase 5:** Test full flow in Stripe test mode
6. **Phase 6:** Update photographer dashboard UI
7. **Phase 7:** Delete cron job and old code
8. **Phase 8:** Update documentation
9. **Phase 9:** Deploy to production

**Estimated time:** 4-6 hours for full implementation + testing

---

## Open Questions

1. **Q:** What happens to existing "pending" commissions in the database?
   **A:** Let the cron job finish paying those out, then delete the cron. Or mark them as 'paid_manual' and record that they were paid via the old system.

2. **Q:** Should we require photographers to connect Stripe before creating galleries?
   **A:** Recommended. Add a banner on gallery creation page: "Connect Stripe to receive payments" if not connected.

3. **Q:** What's the minimum Stripe account age before they can receive transfers?
   **A:** Stripe Express accounts can receive transfers immediately after onboarding is complete (usually same day).

4. **Q:** Do we need to notify photographers when they receive a payment?
   **A:** Optional, but recommended. Send email: "You earned $290 from [Gallery Name]. Funds will arrive in 2 days."

5. **Q:** What if photographer is in a country where Stripe Connect isn't available?
   **A:** Fall back to manual transfer (current system) or restrict PhotoVault to supported countries initially.

---

## Success Metrics

After implementing destination charges, track:

- **Settlement time:** Should be ~2 days (Stripe standard) vs 14 days (old system)
- **Transfer failure rate:** Should be <0.1% (Stripe handles retries)
- **Photographer satisfaction:** Survey photographers on payment timing
- **Support tickets:** Should decrease (no "where's my money?" questions)
- **Code maintenance:** Time spent debugging payout issues should drop to zero

---

## Final Recommendation

**Implement destination charges immediately.** The current manual payout system is:
- More complex than necessary
- Financially risky (platform holds all money)
- Against Stripe best practices
- Creates ongoing maintenance burden

Destination charges are:
- Simpler (200+ lines of code removed)
- Faster (2 days vs 14 days)
- Safer (Stripe handles disputes/refunds)
- Industry standard (every marketplace uses this)

**Estimated ROI:**
- Development time saved: ~20 hours/year (no cron debugging)
- Support time saved: ~10 hours/year (no payout inquiries)
- Risk reduction: Eliminates holding customer funds liability
- Photographer satisfaction: Improved (faster payments)

**Risk level:** Low (Stripe Connect is battle-tested by Uber, Lyft, Etsy, etc.)

---

## Appendix: Stripe Connect Resources

- [Stripe Connect Overview](https://stripe.com/docs/connect)
- [Destination Charges Guide](https://stripe.com/docs/connect/destination-charges)
- [Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Testing Connect](https://stripe.com/docs/connect/testing)
- [Handling Disputes](https://stripe.com/docs/connect/handling-api-disputes)

---

**End of Plan**

*This plan is ready for implementation. Estimated time: 4-6 hours. Risk: Low. Impact: High.*
