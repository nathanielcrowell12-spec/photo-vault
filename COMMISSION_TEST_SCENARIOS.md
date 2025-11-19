---
PROJECT: PhotoVault
TYPE: technical
TOPIC: Commission Calculation Test Scenarios
---

# Commission Calculation Test Scenarios

**Date:** November 19, 2025
**Purpose:** Comprehensive test scenarios to verify 50/50 commission structure
**Status:** Ready for Testing

---

## 📊 Commission Structure Overview

### Business Rules:
- **Client Subscription:** $10.00/month
- **Photographer Commission:** $5.00 (50%)
- **PhotoVault Revenue:** $5.00 (50%)
- **Commission Rate Constant:** `PHOTOGRAPHER_COMMISSION_RATE = 0.50`
- **Payout Schedule:** 14 days after payment received
- **Grace Period:** 90 days for failed payments

### Key Files Under Test:
1. `src/lib/stripe.ts` - Commission rate constant (0.50)
2. `src/lib/server/commission-service.ts` - Commission calculation logic
3. `src/app/api/webhooks/stripe/route.ts` - Webhook payment processing

---

## 🧪 Test Scenarios

### **Scenario 1: Basic Monthly Subscription Payment**

**Test Case 1.1: First Month Payment**
```
Given: Client subscribes to gallery for first time
When: Stripe processes $10.00 payment
Then:
  - Payment record created: $10.00 (1000 cents)
  - Commission calculated: $5.00 (500 cents)
  - Commission rate stored: 0.50
  - Scheduled payout date: payment_date + 14 days
  - Commission status: pending
  - PhotoVault revenue: $5.00
```

**Expected Database Records:**
```sql
-- payment_history table
INSERT INTO payment_history (
  amount_paid_cents: 1000,
  currency: 'usd',
  status: 'succeeded'
)

-- commission_payments table
INSERT INTO commission_payments (
  commission_amount: 5.00,  -- $5.00 in decimal
  status: 'pending',
  scheduled_payout_date: [payment_date + 14 days]
)
```

**Code Logic Check:**
```typescript
// src/lib/server/commission-service.ts:23-25
calculateCommissionAmount(1000) // Should return 500
// Math.round(1000 * 0.50) = 500 ✓
```

---

**Test Case 1.2: Recurring Monthly Payment**
```
Given: Client has active subscription (2nd month)
When: Stripe processes renewal payment of $10.00
Then:
  - New payment record: $10.00
  - New commission record: $5.00 (50%)
  - Commission type: 'recurring'
  - Previous commission unaffected
  - PhotoVault revenue: $5.00
```

**Expected Behavior:**
- Each month creates a NEW commission record
- Previous commissions remain in their own state (pending/paid)
- Commission calculation is ALWAYS 50% regardless of payment number

---

### **Scenario 2: Edge Cases - Decimal Handling**

**Test Case 2.1: Odd-Cent Amount (Not Standard, But Test Logic)**
```
Given: Payment amount is 1001 cents ($10.01)
When: Commission calculated
Then:
  - Commission: Math.round(1001 * 0.50) = 501 cents ($5.01)
  - PhotoVault: 1001 - 501 = 500 cents ($5.00)
  - Rounding handled correctly ✓
```

**Test Case 2.2: Very Small Payment**
```
Given: Payment amount is 1 cent ($0.01)
When: Commission calculated
Then:
  - Commission: Math.round(1 * 0.50) = 1 cent ($0.01)
  - PhotoVault: 0 cents ($0.00)
  - No division by zero errors ✓
```

**Test Case 2.3: Large Payment**
```
Given: Payment amount is 100000 cents ($1000.00)
When: Commission calculated
Then:
  - Commission: Math.round(100000 * 0.50) = 50000 cents ($500.00)
  - PhotoVault: 50000 cents ($500.00)
  - No overflow errors ✓
```

---

### **Scenario 3: Payout Scheduling**

**Test Case 3.1: Payout Date Calculation**
```
Given: Payment received on 2025-11-19
When: Scheduled payout calculated
Then:
  - Payout date: 2025-12-03 (14 days later)
  - Status: pending
```

**Code Logic:**
```typescript
// src/lib/server/commission-service.ts:28-34
const paymentDate = new Date('2025-11-19')
calculateScheduledPayoutDate(paymentDate)
// Should return: 2025-12-03
```

**Test Case 3.2: Commission Payout Processing**
```
Given: Commission pending for 14+ days
When: Cron job runs processScheduledPayout()
Then:
  - Stripe Transfer created to photographer
  - Transfer amount: 500 cents ($5.00)
  - Commission status: pending → paid
  - Paid timestamp recorded
  - Stripe transfer ID stored
```

---

### **Scenario 4: Grace Period Logic**

**Test Case 4.1: Within Grace Period**
```
Given: Last payment was 30 days ago
When: isInGracePeriod() called
Then:
  - Returns: true (< 90 days)
  - Client can still access gallery
```

**Test Case 4.2: Outside Grace Period**
```
Given: Last payment was 91 days ago
When: isInGracePeriod() called
Then:
  - Returns: false (>= 90 days)
  - Access should be restricted
```

**Code Logic:**
```typescript
// src/lib/server/commission-service.ts:38-43
const lastPayment = new Date('2025-08-20') // 91 days ago from 2025-11-19
isInGracePeriod(lastPayment) // Should return false
```

---

### **Scenario 5: Failed Payment Recovery**

**Test Case 5.1: Payment Fails, Then Succeeds**
```
Given: Client's payment fails on 2025-11-01
And: Client updates payment method
When: Payment succeeds on 2025-11-10
Then:
  - Payment record created: $10.00
  - Commission created: $5.00 (50%)
  - Commission type: 'reactivation'
  - Grace period timer resets
```

**Test Case 5.2: Multiple Failed Payments**
```
Given: Client's payment fails 3 times
When: Each failure occurs
Then:
  - NO commission records created
  - Grace period continues
  - Email sent to client each time
```

---

### **Scenario 6: Subscription Cancellation**

**Test Case 6.1: Cancel Before Payout**
```
Given: Client pays $10 on 2025-11-01
And: Commission scheduled for 2025-11-15
When: Subscription canceled on 2025-11-05
Then:
  - Existing commission STILL VALID (photographer earned it)
  - Commission payout proceeds as scheduled
  - No future commissions created
```

**Test Case 6.2: Cancel After Payout**
```
Given: Commission already paid to photographer
When: Client cancels subscription
Then:
  - Past commissions unaffected
  - No refunds to photographer
  - Future payments stopped
```

---

### **Scenario 7: Multiple Clients per Photographer**

**Test Case 7.1: 10 Active Clients**
```
Given: Photographer has 10 clients
When: All 10 clients pay $10/month
Then:
  - 10 separate commission records created
  - Each commission: $5.00
  - Total pending commissions: $50.00
  - PhotoVault revenue: $50.00
```

**Test Case 7.2: Staggered Payment Dates**
```
Given: Clients pay on different dates
When: Payments processed throughout month
Then:
  - Each commission has own payout date (payment + 14 days)
  - Commissions paid out individually
  - No batching required
```

---

### **Scenario 8: Webhook Processing**

**Test Case 8.1: invoice.payment_succeeded Event**
```
Given: Stripe webhook receives payment_succeeded
When: Webhook handler processes event
Then:
  Step 1: Update subscription status
  Step 2: Create payment_history record
  Step 3: Extract photographer_id from metadata
  Step 4: Call createCommission() with:
    - photographerId: from subscription.metadata
    - clientId: from subscription.metadata
    - paymentAmountCents: invoice.amount_paid (1000)
    - commissionType: 'recurring' or 'upfront'
  Step 5: Calculate commission: 1000 * 0.50 = 500 cents
  Step 6: Store commission as $5.00
  Step 7: Send payment success email to client
```

**Code Path:**
```typescript
// src/app/api/webhooks/stripe/route.ts:318-344
// Lines 320-323: Get subscription metadata
const subscription = await stripe.subscriptions.retrieve(subscriptionId)
const photographerId = subscription.metadata?.photographer_id // ✓
const clientId = subscription.metadata?.client_id // ✓

// Lines 328-336: Create commission
const commissionResult = await createCommission({
  photographerId,
  clientId,
  clientPaymentId: paymentRecord.id,
  paymentAmountCents: invoice.amount_paid, // 1000 cents
  paymentDate: new Date(...),
  periodStart: new Date(...),
  periodEnd: new Date(...),
  commissionType: invoice.billing_reason === 'subscription_create' ? 'upfront' : 'recurring'
})

// src/lib/server/commission-service.ts:66
// Calculate commission: Math.round(1000 * 0.50) = 500 cents ✓
```

---

### **Scenario 9: Commission Rate Consistency**

**Test Case 9.1: Verify Single Source of Truth**
```
Check: All commission calculations use PHOTOGRAPHER_COMMISSION_RATE
Files to verify:
  ✓ src/lib/stripe.ts:51 - Exports PHOTOGRAPHER_COMMISSION_RATE = 0.50
  ✓ src/lib/server/commission-service.ts:7 - Imports from stripe.ts
  ✓ src/lib/server/commission-service.ts:24 - Uses imported constant
  ✓ src/lib/stripe.ts:217 - calculateCommission() uses constant
```

**Test Case 9.2: No Hardcoded Values**
```
Search for hardcoded commission rates:
  - Search: "0.80" → Should return 0 results
  - Search: "0.20" → Should return 0 results
  - Search: "80%" in commission context → Should return 0 results
  - Search: "20%" in platform split → Should return 0 results
```

---

## 🎯 Manual Testing Checklist

### Setup Required:
- [ ] Stripe test account configured
- [ ] Test price ID created ($10/month)
- [ ] Webhook endpoint configured
- [ ] Stripe CLI running for local webhooks
- [ ] Database accessible for verification

### Test Execution:

**1. Single Payment Test:**
- [ ] Create test client subscription
- [ ] Process $10 payment via Stripe test card (4242 4242 4242 4242)
- [ ] Verify webhook received
- [ ] Check payment_history table: amount = 1000 cents
- [ ] Check commission_payments table: amount = $5.00
- [ ] Verify commission rate stored: 0.50
- [ ] Verify payout date: payment_date + 14 days

**2. Multiple Payments Test:**
- [ ] Process 3 monthly payments for same client
- [ ] Verify 3 separate commission records
- [ ] Each commission: $5.00
- [ ] Each with own payout date

**3. Edge Case Test:**
- [ ] Test payment failure → success flow
- [ ] Verify commission only created on success
- [ ] Test subscription cancellation
- [ ] Verify existing commissions preserved

**4. Multi-Client Test:**
- [ ] Create 5 test clients under one photographer
- [ ] Process payments for all 5
- [ ] Verify 5 commission records
- [ ] Total commissions: $25.00

---

## 🔍 Database Verification Queries

### Check Commission Calculations:
```sql
-- Verify all commissions are exactly 50% of payment
SELECT
  cp.id,
  cp.commission_amount,
  ph.amount_paid_cents / 100.0 as payment_amount,
  (cp.commission_amount / (ph.amount_paid_cents / 100.0)) as calculated_rate,
  CASE
    WHEN (cp.commission_amount / (ph.amount_paid_cents / 100.0)) = 0.50
    THEN '✓ CORRECT'
    ELSE '✗ WRONG'
  END as status
FROM commission_payments cp
JOIN payment_history ph ON cp.client_payment_id = ph.id
ORDER BY cp.created_at DESC;
```

### Check Payout Dates:
```sql
-- Verify payout dates are payment_date + 14 days
SELECT
  cp.id,
  ph.paid_at as payment_date,
  cp.scheduled_payout_date,
  DATE_PART('day', cp.scheduled_payout_date - ph.paid_at) as days_difference,
  CASE
    WHEN DATE_PART('day', cp.scheduled_payout_date - ph.paid_at) = 14
    THEN '✓ CORRECT'
    ELSE '✗ WRONG'
  END as status
FROM commission_payments cp
JOIN payment_history ph ON cp.client_payment_id = ph.id
ORDER BY cp.created_at DESC;
```

### Revenue Split Verification:
```sql
-- Verify total revenue split is 50/50
SELECT
  SUM(ph.amount_paid_cents / 100.0) as total_payments,
  SUM(cp.commission_amount) as total_commissions,
  SUM(ph.amount_paid_cents / 100.0) - SUM(cp.commission_amount) as photovault_revenue,
  (SUM(cp.commission_amount) / SUM(ph.amount_paid_cents / 100.0)) * 100 as commission_percentage
FROM commission_payments cp
JOIN payment_history ph ON cp.client_payment_id = ph.id
WHERE ph.status = 'succeeded';

-- Expected Result:
-- commission_percentage should be exactly 50.00%
```

---

## 🚨 Critical Assertions

### Must Pass:
1. ✅ **Commission Rate = 0.50** in all calculations
2. ✅ **Payment $10 → Commission $5** every time
3. ✅ **No hardcoded 0.80 or 80% anywhere**
4. ✅ **Payout date = payment_date + 14 days**
5. ✅ **Grace period = 90 days** exactly
6. ✅ **Each payment creates ONE commission record**
7. ✅ **Failed payments create ZERO commissions**
8. ✅ **Subscription metadata includes photographer_id**
9. ✅ **Commission stored as decimal in dollars, not cents**
10. ✅ **All calculations use PHOTOGRAPHER_COMMISSION_RATE constant**

---

## 🧮 Calculation Examples

### Example 1: Single Client, 12 Months
```
Month 1:  $10 payment → $5 commission
Month 2:  $10 payment → $5 commission
...
Month 12: $10 payment → $5 commission

Total Paid:        $120.00
Photographer Earned: $60.00 (50%)
PhotoVault Revenue:  $60.00 (50%)
```

### Example 2: 10 Clients, 1 Month Each
```
Client 1:  $10 → $5 commission
Client 2:  $10 → $5 commission
...
Client 10: $10 → $5 commission

Total Paid:        $100.00
Photographer Earned: $50.00 (50%)
PhotoVault Revenue:  $50.00 (50%)
```

### Example 3: Edge Case - $10.01 Payment
```
Payment: $10.01 (1001 cents)
Commission: Math.round(1001 * 0.50) = 501 cents = $5.01
PhotoVault: 1001 - 501 = 500 cents = $5.00

Photographer gets extra penny due to rounding
```

---

## 📋 Test Result Template

```markdown
## Test Execution: [Date]

### Test Case: [Name]
- **Status:** ✅ PASS / ❌ FAIL
- **Payment Amount:** $___
- **Expected Commission:** $___
- **Actual Commission:** $___
- **Commission Rate:** ___
- **Notes:**

### Database Verification:
- [ ] payment_history record correct
- [ ] commission_payments record correct
- [ ] Payout date correct (+14 days)
- [ ] Commission rate = 0.50

### Issues Found:
[None / List issues]

### Screenshots:
[Attach Stripe dashboard, database queries, etc.]
```

---

## 🎉 Success Criteria

**All tests pass when:**
1. Every $10 payment generates exactly $5 commission
2. No commission calculations use hardcoded values
3. All calculations reference PHOTOGRAPHER_COMMISSION_RATE constant
4. Database queries show 50/50 revenue split
5. Email templates show correct commission percentages
6. Payout scheduling works correctly (payment + 14 days)
7. Grace period logic works (90 days)
8. Failed payments don't create commissions
9. Multiple clients handled correctly
10. Webhook processing creates commissions reliably

---

**Status:** Ready for Testing
**Next Step:** Execute manual tests with Stripe test mode
**Owner:** Development Team
**Priority:** HIGH (Launch Blocker)
