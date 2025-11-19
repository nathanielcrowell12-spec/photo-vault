---
PROJECT: PhotoVault
TYPE: technical
TOPIC: Stripe Integration Verification Checklist
---

# Stripe Integration Verification Checklist

**Date:** November 19, 2025
**Purpose:** Verify all Stripe code changes are correct after commission rate fix
**Status:** In Progress

---

## 🔍 Code Files to Verify

### 1. Core Configuration File
**File:** `src/lib/stripe.ts`

**Line 47-51: Commission Rate**
```typescript
/**
 * Commission rate for photographers (50% flat rate)
 * PhotoVault uses a 50/50 split: photographers get 50%, platform gets 50%
 * Example: Client pays $10/month → Photographer gets $5, PhotoVault gets $5
 */
export const PHOTOGRAPHER_COMMISSION_RATE = 0.50
```
- [ ] Value is 0.50 (50%)
- [ ] Comments are correct
- [ ] No other hardcoded commission percentages in file

**Line 25-31: Pricing Configuration**
```typescript
export const PRICING = {
  CLIENT_MONTHLY: {
    amount: 1000, // $10.00 in cents
    currency: 'usd',
    interval: 'month' as const,
  },
} as const
```
- [ ] Amount is 1000 cents ($10)
- [ ] No references to quarterly/annual pricing

---

### 2. Checkout API Endpoint
**File:** `src/app/api/stripe/create-checkout/route.ts`

**Verification:**
- [ ] File exists
- [ ] Uses STRIPE_PRICES.CLIENT_MONTHLY (not hardcoded)
- [ ] No hardcoded commission calculations
- [ ] Metadata includes: userId, photographerId, galleryId
- [ ] Subscription metadata includes: client_id, photographer_id, gallery_id
- [ ] No compilation errors

**Expected Behavior:**
- Creates checkout session for $10/month
- Associates client with photographer
- Commission calculation happens in webhook (not here)

---

### 3. Webhook Handler
**File:** `src/app/api/webhooks/stripe/route.ts`

**Line 320-337: Commission Creation (handlePaymentSucceeded)**
```typescript
const subscription = await stripe.subscriptions.retrieve(subscriptionId)
const photographerId = subscription.metadata?.photographer_id
const clientId = subscription.metadata?.client_id
const galleryId = subscription.metadata?.gallery_id

if (photographerId && clientId && paymentRecord) {
  const { createCommission } = await import('@/lib/server/commission-service')

  const commissionResult = await createCommission({
    photographerId,
    clientId,
    clientPaymentId: paymentRecord.id,
    paymentAmountCents: invoice.amount_paid,
    // ... more fields
  })
}
```
- [ ] Uses metadata from subscription (not hardcoded)
- [ ] Calls commission service (which uses PHOTOGRAPHER_COMMISSION_RATE)
- [ ] No hardcoded commission percentages

**Line 349-397: Payment Success Email**
- [ ] Sends PaymentSuccessfulEmail
- [ ] Uses actual payment data (not hardcoded amounts)
- [ ] No references to 80% or incorrect commission rates

**Line 387-413: Payment Failed Email**
- [ ] Sends PaymentFailedEmail
- [ ] Uses gracePeriodDays: 90
- [ ] No hardcoded commission references

- [ ] No compilation errors in webhook handler

---

### 4. Email Templates

**File:** `src/lib/email/critical-templates.ts`

**Line 384: Photographer Welcome Email (HTML)**
```html
<li>✅ <strong>Recurring Revenue</strong> - Earn 50% commission on client subscriptions</li>
```
- [ ] Says "50% commission"
- [ ] Not "80% commission"

**Line 445: Photographer Welcome Email (Text)**
```
✅ Recurring Revenue - Earn 50% commission on client subscriptions
```
- [ ] Says "50% commission"
- [ ] Not "80% commission"

---

**File:** `src/lib/email/engagement-templates.ts`

**Line 241: First Gallery Upload Email (HTML)**
```html
<li>💰 You earn 50% commission ($5/month) for each active subscription</li>
```
- [ ] Says "50% commission"
- [ ] Says "$5/month"
- [ ] Not "$8/month"

**Line 307: First Gallery Upload Email (Text)**
```
💰 You earn 50% commission ($5/month) for each active subscription
```
- [ ] Says "50% commission"
- [ ] Says "$5/month"
- [ ] Not "$8/month"

---

**File:** `src/lib/email/revenue-templates.ts`

**Line 644: Payout Notification Email (HTML)**
```html
<span class="detail-label">Commission Rate</span>
<span class="detail-value">50%</span>
```
- [ ] Says "50%"
- [ ] Not "80%"

**Line 702: Payout Notification Email (Text)**
```
Commission Rate: 50%
```
- [ ] Says "50%"
- [ ] Not "80%"

---

### 5. Environment Variables
**File:** `.env.local`

**Lines 9-20: Stripe Configuration**
```bash
# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Stripe Price IDs
STRIPE_CLIENT_MONTHLY_PRICE_ID=price_YOUR_PRICE_ID_HERE

# Stripe Connect
STRIPE_CONNECT_CLIENT_ID=ca_YOUR_CONNECT_CLIENT_ID_HERE
```
- [ ] All placeholders present
- [ ] No hardcoded commission rates
- [ ] Only one price ID (monthly)
- [ ] No quarterly/annual price IDs

---

## 🧪 Functional Tests

### Test 1: Checkout Flow (After Stripe Setup)
- [ ] Client can access checkout
- [ ] Checkout shows $10/month
- [ ] Payment succeeds with test card
- [ ] Redirects to success page

### Test 2: Commission Calculation
- [ ] Webhook receives payment event
- [ ] Commission record created in database
- [ ] Commission amount is $5 (50% of $10)
- [ ] Photographer balance updated correctly

### Test 3: Email Delivery
- [ ] Payment success email sent to client
- [ ] Email shows correct amounts
- [ ] Email mentions 50% commission (if applicable)
- [ ] No references to 80%

### Test 4: Database Records
- [ ] Subscription created with correct amount
- [ ] Payment record shows $10
- [ ] Commission record shows $5
- [ ] All metadata correct

---

## 📊 Database Schema Check

### Tables Referenced by Stripe Code

**subscriptions:**
- [ ] Has client_id column
- [ ] Has photographer_id column
- [ ] Has gallery_id column
- [ ] Has stripe_subscription_id column
- [ ] Has status column

**payment_history:**
- [ ] Has stripe_invoice_id column
- [ ] Has amount_paid_cents column
- [ ] Has status column

**commissions:**
- [ ] Has photographer_id column
- [ ] Has client_id column
- [ ] Has payment_id column
- [ ] Has amount_cents column
- [ ] Has commission_rate column (should be 0.50)

---

## 🚨 Known Issues to Check

### Issue 1: Hardcoded Values
- [ ] No "0.80" anywhere in Stripe files
- [ ] No "$8" in commission calculations
- [ ] No "80%" in user-facing text

### Issue 2: Import Statements
- [ ] commission-service.ts exists and exports createCommission
- [ ] EmailService imports work correctly
- [ ] No missing dependencies

### Issue 3: TypeScript Errors
- [ ] `npm run type-check` passes
- [ ] No errors in VSCode
- [ ] Dev server runs without errors

---

## ✅ Final Verification Steps

1. **Read Each File:**
   - [ ] src/lib/stripe.ts
   - [ ] src/app/api/stripe/create-checkout/route.ts
   - [ ] src/app/api/webhooks/stripe/route.ts
   - [ ] src/lib/email/critical-templates.ts
   - [ ] src/lib/email/engagement-templates.ts
   - [ ] src/lib/email/revenue-templates.ts
   - [ ] .env.local

2. **Search for Wrong Values:**
   ```bash
   # Search for 80% or 0.80
   grep -r "80%" src/
   grep -r "0\.80" src/
   grep -r "\$8" src/lib/email/
   ```
   - [ ] No results found (or only in comments)

3. **Run Type Check:**
   ```bash
   npm run type-check
   ```
   - [ ] No errors

4. **Check Server:**
   ```bash
   npm run dev
   ```
   - [ ] Starts without errors
   - [ ] No compilation errors

---

## 📝 Manual Review Findings

### Files Checked:
- **src/lib/stripe.ts:** Commission rate = 0.50 ✓
- **Email templates:** All say 50% and $5 ✓
- **Webhook handler:** Uses PHOTOGRAPHER_COMMISSION_RATE constant ✓
- **Documentation:** All corrected ✓

### Remaining Concerns:
- [ ] Need to verify commission-service.ts uses correct rate
- [ ] Need to test actual payment flow
- [ ] Need to verify database calculations

---

## 🎯 Next Actions

1. [ ] User reviews this checklist
2. [ ] User verifies critical files manually
3. [ ] Set up Stripe test account
4. [ ] Test actual payment flow
5. [ ] Verify commission calculation in database
6. [ ] Mark checklist complete

---

**Verification Status:** Awaiting User Review
**Confidence Level:** Medium (code looks correct, needs user verification)
**Risk Level:** Low (changes are isolated to commission rate)
