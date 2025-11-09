# Commission System v2.0 - Implementation Complete

**Date:** 2025-11-08
**Status:** ✅ Implementation Complete - Ready for Testing

---

## 📋 IMPLEMENTATION SUMMARY

All phases of the commission system implementation have been completed successfully.

### ✅ Phase 1: Commission Rate Fix
- **File:** `src/lib/stripe.ts`
- **Change:** Updated `PHOTOGRAPHER_COMMISSION_RATE` from 0.50 (50%) to 0.15 (15%)
- **Status:** Complete

### ✅ Phase 2: Tiered Commission Calculator
- **File:** `src/lib/commission-calculator.ts` (NEW)
- **Features:**
  - 15% for 1-10 active clients
  - 17.5% for 11-25 active clients
  - 20% for 26-50 active clients
  - 22.5% for 51+ active clients
  - Automatic payout date calculation (14 days)
  - Grace period calculation (90 days)
  - Helper functions for tier info display
- **Status:** Complete

### ✅ Phase 3: Commission Service
- **File:** `src/lib/server/commission-service.ts` (NEW)
- **Functions:**
  - `createCommission()` - Creates commission on payment
  - `processScheduledPayout()` - Transfers funds via Stripe Connect
  - `getPhotographerPendingCommissions()` - Fetch pending payouts
  - `getPhotographerCommissionHistory()` - Fetch payment history
- **Status:** Complete

### ✅ Phase 4: Webhook Integration
- **File:** `src/app/api/webhooks/stripe/route.ts`
- **Changes:** Updated `handlePaymentSucceeded()` to:
  - Create commission record when invoice paid
  - Calculate commission using photographer's tier
  - Schedule payout 14 days after payment
  - Log commission creation
- **Status:** Complete

### ✅ Phase 5: Cron Jobs (3 endpoints created)

#### 1. Process Payouts
- **File:** `src/app/api/cron/process-payouts/route.ts` (NEW)
- **Schedule:** 2:00 AM UTC daily
- **Function:** Processes all commissions with `scheduled_payout_date <= today`
- **Status:** Complete

#### 2. Deactivate Clients
- **File:** `src/app/api/cron/deactivate-clients/route.ts` (NEW)
- **Schedule:** 3:00 AM UTC daily
- **Function:** Deactivates clients with `last_payment_attempt` 90+ days ago
- **Status:** Complete

#### 3. Suspend Photographers
- **File:** `src/app/api/cron/suspend-photographers/route.ts` (NEW)
- **Schedule:** 4:00 AM UTC daily
- **Function:** Suspends photographers 90+ days overdue on platform payments
- **Status:** Complete

### ✅ Phase 6: Vercel Configuration
- **File:** `vercel.json`
- **Changes:** Added cron job configuration for all 3 endpoints
- **Status:** Complete

### ✅ Environment Variables
- **File:** `.env.local`
- **Added:** `CRON_SECRET` placeholder
- **Existing:** `STRIPE_WEBHOOK_SECRET` placeholder
- **Action Required:** Generate actual secrets before deployment

---

## 🔧 FILES CREATED/MODIFIED

### New Files (6)
1. `src/lib/commission-calculator.ts` - 155 lines
2. `src/lib/server/commission-service.ts` - 183 lines
3. `src/app/api/cron/process-payouts/route.ts` - 82 lines
4. `src/app/api/cron/deactivate-clients/route.ts` - 68 lines
5. `src/app/api/cron/suspend-photographers/route.ts` - 76 lines
6. `COMMISSION-SYSTEM-IMPLEMENTATION.md` - This file

### Modified Files (3)
1. `src/lib/stripe.ts` - Commission rate: 0.50 → 0.15
2. `src/app/api/webhooks/stripe/route.ts` - Added commission creation logic
3. `vercel.json` - Added cron job configuration
4. `.env.local` - Added CRON_SECRET

---

## 🧪 TESTING CHECKLIST

Before deploying to production, test the following:

### Local Testing

#### 1. Commission Calculation
```typescript
// Test in Node console or API route
import { getPhotographerCommissionRate, calculateCommissionAmount } from '@/lib/commission-calculator'

// Test tier 1 (15% for 5 clients)
const rate1 = await getPhotographerCommissionRate('photographer-with-5-clients')
console.log(rate1) // Should be 0.15

// Test tier 2 (17.5% for 15 clients)
const rate2 = await getPhotographerCommissionRate('photographer-with-15-clients')
console.log(rate2) // Should be 0.175

// Test commission amount
const commission = calculateCommissionAmount(10000, 0.15) // $100 payment, 15%
console.log(commission) // Should be 1500 cents ($15)
```

#### 2. Webhook Simulation
Use Stripe CLI to test webhook:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger invoice.payment_succeeded
```

Expected outcome:
- Commission record created in `commission_payments` table
- `scheduled_payout_date` = 14 days from payment
- `commission_amount` = 15% of payment (or higher based on tier)

#### 3. Cron Job Testing
Test each cron endpoint locally:

```bash
# Process payouts
curl -H "Authorization: Bearer your_cron_secret" \
  http://localhost:3000/api/cron/process-payouts

# Deactivate clients
curl -H "Authorization: Bearer your_cron_secret" \
  http://localhost:3000/api/cron/deactivate-clients

# Suspend photographers
curl -H "Authorization: Bearer your_cron_secret" \
  http://localhost:3000/api/cron/suspend-photographers
```

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Generate Secrets

```bash
# Generate CRON_SECRET (Linux/Mac)
openssl rand -base64 32

# Generate CRON_SECRET (Windows PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Step 2: Update Environment Variables

In `.env.local` (local) and Vercel Dashboard (production):
```bash
CRON_SECRET=<generated-secret>
STRIPE_WEBHOOK_SECRET=<from-stripe-dashboard>
```

### Step 3: Deploy to Vercel

```bash
git add .
git commit -m "Implement v2.0 commission system with tiered rates and automation"
git push origin main
```

### Step 4: Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel

### Step 5: Verify Vercel Cron Jobs

1. Go to Vercel Dashboard → Project → Settings → Cron Jobs
2. Verify 3 cron jobs are scheduled:
   - `/api/cron/process-payouts` - Daily at 2:00 AM UTC
   - `/api/cron/deactivate-clients` - Daily at 3:00 AM UTC
   - `/api/cron/suspend-photographers` - Daily at 4:00 AM UTC

---

## 📊 DATABASE MONITORING

### Check Pending Commissions
```sql
SELECT
  cp.id,
  cp.photographer_id,
  cp.commission_amount,
  cp.scheduled_payout_date,
  cp.status,
  EXTRACT(DAY FROM (cp.scheduled_payout_date - CURRENT_DATE)) as days_until_payout
FROM commission_payments cp
WHERE cp.status = 'pending'
ORDER BY cp.scheduled_payout_date ASC
LIMIT 20;
```

### Check Commission Totals
```sql
SELECT
  p.id,
  COUNT(cp.id) as total_commissions,
  SUM(CASE WHEN cp.status = 'pending' THEN cp.commission_amount ELSE 0 END) as pending_total,
  SUM(CASE WHEN cp.status = 'paid' THEN cp.commission_amount ELSE 0 END) as paid_total
FROM photographers p
LEFT JOIN commission_payments cp ON cp.photographer_id = p.id
GROUP BY p.id
ORDER BY paid_total DESC
LIMIT 20;
```

### Verify Commission Rates
```sql
SELECT
  p.id,
  COUNT(c.id) as active_clients,
  CASE
    WHEN COUNT(c.id) BETWEEN 1 AND 10 THEN '15%'
    WHEN COUNT(c.id) BETWEEN 11 AND 25 THEN '17.5%'
    WHEN COUNT(c.id) BETWEEN 26 AND 50 THEN '20%'
    ELSE '22.5%'
  END as commission_tier
FROM photographers p
LEFT JOIN clients c ON c.photographer_id = p.id AND c.status = 'active'
GROUP BY p.id
ORDER BY active_clients DESC;
```

---

## ⚠️ IMPORTANT NOTES

### 1. Metadata Requirement
For commission creation to work, Stripe subscriptions MUST include metadata:
```typescript
{
  photographer_id: "<uuid>",
  client_id: "<uuid>"
}
```

### 2. Stripe Connect Required
Photographers must complete Stripe Connect onboarding before receiving payouts. The payout cron will gracefully fail if `stripe_connect_account_id` is null.

### 3. Grace Period Logic
- Clients: 90 days from `last_payment_attempt` before deactivation
- Photographers: 90 days from `last_platform_payment_attempt` before suspension

### 4. Commission Rounding
All commission calculations use `Math.round()` to prevent floating-point precision errors.

### 5. Idempotency
The webhook handler checks `processed_webhook_events` table to prevent duplicate commission creation.

---

## 🎯 SUCCESS CRITERIA

Implementation is successful when:

- ✅ Client payment triggers commission creation automatically
- ✅ Commission uses correct tiered rate (15/17.5/20/22.5%)
- ✅ Commission is scheduled for payout 14 days later
- ✅ Cron job processes payouts daily at 2 AM UTC
- ✅ Cron job deactivates clients after 90 days at 3 AM UTC
- ✅ Cron job suspends photographers after 90 days at 4 AM UTC
- ✅ No console errors in webhook handler
- ✅ Photographer can see pending/paid commissions in dashboard

---

## 🔍 TROUBLESHOOTING

### Commission Not Created
1. Check webhook logs in Supabase (`webhook_logs` table)
2. Verify subscription metadata includes `photographer_id` and `client_id`
3. Check console for error messages
4. Verify payment was successful (`invoice.payment_succeeded` event)

### Payout Failed
1. Check if photographer has `stripe_connect_account_id`
2. Verify Stripe Connect account is active
3. Check if commission amount > $0
4. Review Stripe transfer logs

### Cron Job Not Running
1. Verify `CRON_SECRET` is set in Vercel
2. Check Vercel cron job logs
3. Verify cron configuration in `vercel.json`
4. Manually test endpoint with correct Authorization header

---

## 📞 NEXT STEPS

### Immediate
1. Generate `CRON_SECRET` and update `.env.local`
2. Test commission creation with Stripe CLI
3. Test cron endpoints locally
4. Deploy to Vercel staging environment

### Short Term
1. Build photographer commission dashboard page
2. Add email notifications for:
   - Commission payments
   - Failed payouts
   - Client deactivation warnings
   - Photographer suspension warnings
3. Create admin dashboard for commission monitoring

### Long Term
1. Add commission dispute handling
2. Implement commission adjustment API
3. Build revenue analytics dashboard
4. Add tax reporting features

---

**Implementation completed by:** Claude Code
**Documentation version:** 1.0
**Last updated:** 2025-11-08
