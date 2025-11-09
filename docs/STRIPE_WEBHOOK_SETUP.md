# Stripe Webhook Setup & Testing Guide

## Overview
This guide walks you through setting up, testing, and monitoring Stripe webhooks for PhotoVault.

---

## 📋 Table of Contents
1. [Database Setup](#database-setup)
2. [Environment Variables](#environment-variables)
3. [Stripe Dashboard Configuration](#stripe-dashboard-configuration)
4. [Local Testing](#local-testing)
5. [Production Deployment](#production-deployment)
6. [Monitoring & Debugging](#monitoring--debugging)
7. [Common Issues](#common-issues)

---

## 1. Database Setup

### Step 1: Run Migration
Execute the database migration in Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy contents of `database/webhook-tables.sql`
4. Click "Run"
5. Verify success message appears

### Step 2: Verify Tables Created
Run this query to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'subscriptions',
  'token_transactions',
  'payment_history',
  'payouts',
  'webhook_logs',
  'processed_webhook_events'
);
```

You should see all 6 tables listed.

### Step 3: Test RPC Functions
Test the token balance function:

```sql
-- First, get a test user ID
SELECT id FROM users LIMIT 1;

-- Test adding tokens (replace with actual user ID)
SELECT add_tokens_to_balance(
  'YOUR_USER_ID_HERE'::uuid,
  100,
  'test_payment_intent'
);

-- Verify balance updated
SELECT id, email, token_balance FROM users WHERE id = 'YOUR_USER_ID_HERE'::uuid;
```

---

## 2. Environment Variables

### Local Development (.env.local)
Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx

# Note: STRIPE_WEBHOOK_SECRET will be generated in next step
```

### Production (Vercel)
Add the same variables in Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add `STRIPE_SECRET_KEY` (use live key: `sk_live_...`)
3. Add `STRIPE_WEBHOOK_SECRET` (use live webhook secret: `whsec_...`)
4. Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (use live key: `pk_live_...`)

---

## 3. Stripe Dashboard Configuration

### Create Webhook Endpoint

#### For Local Testing:
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Copy the webhook signing secret (starts with `whsec_`)
5. Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

#### For Production:
1. Go to Stripe Dashboard: https://dashboard.stripe.com
2. Navigate to **Developers → Webhooks**
3. Click **"Add endpoint"**
4. Enter URL: `https://your-domain.com/api/webhooks/stripe`
5. Select **API version**: `2024-11-20.acacia` (or latest)
6. Select events to listen for:

**Required Events:**
```
✅ checkout.session.completed
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed
```

**Optional Events (for Stripe Connect):**
```
✅ payout.created
✅ payout.paid
✅ payout.failed
```

7. Click **"Add endpoint"**
8. Copy the **Signing secret** (starts with `whsec_`)
9. Add to Vercel environment variables

---

## 4. Local Testing

### Method 1: Stripe CLI (Recommended)

**Start the webhook listener:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**In a new terminal, start your dev server:**
```bash
cd photovault-hub
npm run dev
```

**Trigger test events:**

```bash
# Test token purchase (checkout completed)
stripe trigger checkout.session.completed

# Test subscription created
stripe trigger customer.subscription.created

# Test payment succeeded
stripe trigger invoice.payment_succeeded

# Test payment failed
stripe trigger invoice.payment_failed

# Test subscription canceled
stripe trigger customer.subscription.deleted
```

**Monitor webhook processing:**
- Check terminal output from `stripe listen`
- Check your dev server logs
- Query `webhook_logs` table in Supabase

### Method 2: Manual Testing via Stripe Dashboard

1. Create a test product/price in Stripe Dashboard
2. Use Stripe's test checkout page
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Monitor webhook delivery in Stripe Dashboard → Webhooks
5. Check database for updated records

### Test Card Numbers

**Successful payment:**
```
4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Payment fails:**
```
4000 0000 0000 0341
```

**Requires authentication (3D Secure):**
```
4000 0025 0000 3155
```

---

## 5. Production Deployment

### Pre-Deployment Checklist

- [ ] Database migration run in production Supabase
- [ ] All tables verified to exist
- [ ] RPC functions tested
- [ ] Production Stripe keys added to Vercel
- [ ] Webhook endpoint created in Stripe Dashboard (production mode)
- [ ] Webhook signing secret added to Vercel
- [ ] Test webhook delivery from Stripe Dashboard

### Post-Deployment Verification

1. **Test webhook endpoint is reachable:**
```bash
curl -X POST https://your-domain.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

Should return: `{"error":"Missing signature"}` (this is expected)

2. **Trigger test event from Stripe Dashboard:**
   - Go to Developers → Webhooks → [Your endpoint]
   - Click "Send test webhook"
   - Select `checkout.session.completed`
   - Check delivery status

3. **Monitor webhook logs:**
```sql
SELECT event_type, status, processing_time_ms, processed_at
FROM webhook_logs
ORDER BY processed_at DESC
LIMIT 10;
```

---

## 6. Monitoring & Debugging

### View Webhook Logs

**In Supabase:**
```sql
-- Recent webhook activity
SELECT
  event_type,
  status,
  processing_time_ms,
  result_message,
  error_message,
  processed_at
FROM webhook_logs
ORDER BY processed_at DESC
LIMIT 20;

-- Failed webhooks
SELECT *
FROM webhook_logs
WHERE status = 'failed'
ORDER BY processed_at DESC;

-- Webhook performance stats
SELECT
  event_type,
  COUNT(*) as total_events,
  AVG(processing_time_ms) as avg_time_ms,
  MAX(processing_time_ms) as max_time_ms,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count
FROM webhook_logs
WHERE processed_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY total_events DESC;
```

**In Stripe Dashboard:**
1. Go to Developers → Webhooks
2. Click on your webhook endpoint
3. View:
   - Delivery success rate
   - Failed deliveries
   - Response times
   - Recent attempts

### Check Processed Events (Idempotency)

```sql
-- List all processed events
SELECT stripe_event_id, event_type, processed_at
FROM processed_webhook_events
ORDER BY processed_at DESC
LIMIT 50;

-- Check if specific event was processed
SELECT * FROM processed_webhook_events
WHERE stripe_event_id = 'evt_xxxxxxxxxxxxx';
```

### View User Token Balance

```sql
-- Check specific user's token balance
SELECT
  u.id,
  u.email,
  u.token_balance,
  COUNT(tt.id) as transaction_count,
  SUM(CASE WHEN tt.transaction_type = 'purchase' THEN tt.tokens_amount ELSE 0 END) as total_purchased,
  SUM(CASE WHEN tt.transaction_type = 'usage' THEN tt.tokens_amount ELSE 0 END) as total_used
FROM users u
LEFT JOIN token_transactions tt ON u.id = tt.user_id
WHERE u.email = 'user@example.com'
GROUP BY u.id, u.email, u.token_balance;
```

### View Active Subscriptions

```sql
-- All active subscriptions
SELECT
  s.id,
  u.email,
  s.plan_type,
  s.status,
  s.current_period_end,
  s.created_at
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.status IN ('active', 'trialing')
ORDER BY s.created_at DESC;
```

---

## 7. Common Issues

### Issue 1: Webhook Signature Verification Failed

**Error:** `Webhook signature verification failed`

**Causes:**
- Wrong webhook secret in environment variables
- Request body was modified before verification
- Using wrong Stripe API version

**Solutions:**
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Ensure using raw request body (not parsed JSON)
3. Check Stripe API version matches webhook configuration

### Issue 2: User Not Found

**Error:** `User not found for Stripe customer: cus_xxxxx`

**Cause:** User doesn't have `stripe_customer_id` set

**Solution:**
When creating Stripe customer, save ID to user record:
```typescript
const customer = await stripe.customers.create({
  email: user.email,
  metadata: { user_id: user.id }
})

await supabase
  .from('users')
  .update({ stripe_customer_id: customer.id })
  .eq('id', user.id)
```

### Issue 3: Duplicate Processing

**Error:** Multiple token additions for same purchase

**Cause:** Webhook retries without idempotency check

**Solution:** Already handled in webhook code via `processed_webhook_events` table.
Verify table exists and has unique constraint on `stripe_event_id`.

### Issue 4: RPC Function Not Found

**Error:** `function add_tokens_to_balance does not exist`

**Solution:**
1. Verify migration ran successfully
2. Check function exists:
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%token%';
```
3. Re-run migration if needed

### Issue 5: Webhook Timing Out

**Error:** Webhook response time >10 seconds

**Cause:** Processing too slow, Stripe times out

**Solution:**
- Optimize database queries
- Move heavy processing to background jobs
- Respond to Stripe immediately, process async
- Add indexes to frequently queried columns

### Issue 6: Payment Succeeded but Tokens Not Added

**Debug Steps:**
1. Check webhook was received:
```sql
SELECT * FROM webhook_logs
WHERE event_type = 'checkout.session.completed'
ORDER BY processed_at DESC LIMIT 5;
```

2. Check for errors:
```sql
SELECT * FROM webhook_logs
WHERE status = 'failed'
AND event_type = 'checkout.session.completed';
```

3. Check token transactions:
```sql
SELECT * FROM token_transactions
WHERE stripe_payment_intent_id = 'pi_xxxxxxxxxxxxx';
```

4. Verify user balance:
```sql
SELECT email, token_balance FROM users
WHERE id = 'user_id_here';
```

---

## 8. Testing Checklist

### Before Going Live

- [ ] Database migration completed in production
- [ ] All 6 tables exist in production database
- [ ] RPC functions tested and working
- [ ] Webhook endpoint created in Stripe (production mode)
- [ ] Webhook secret added to Vercel environment variables
- [ ] Test successful payment → tokens added
- [ ] Test failed payment → status updated correctly
- [ ] Test subscription creation → record created
- [ ] Test subscription cancellation → status updated
- [ ] Verified no duplicate processing (idempotency)
- [ ] Checked webhook logs for errors
- [ ] Monitored webhook delivery rate in Stripe Dashboard
- [ ] Tested with real (small amount) payment in production

---

## 9. Maintenance

### Weekly Tasks
- Review failed webhooks in Stripe Dashboard
- Check `webhook_logs` for errors
- Verify subscription renewals processing correctly

### Monthly Tasks
- Review webhook performance metrics
- Clean up old webhook logs (older than 90 days):
```sql
SELECT cleanup_old_webhook_logs();
```
- Audit token balances for discrepancies

### Monitoring Alerts
Set up alerts for:
- Webhook failure rate >5% in 1 hour
- Webhook response time >5 seconds
- Payment failure rate >10% in 1 day
- Any error in production webhook logs

---

## 10. Support Resources

**Stripe Documentation:**
- Webhooks: https://stripe.com/docs/webhooks
- Testing: https://stripe.com/docs/testing
- API Reference: https://stripe.com/docs/api

**Stripe CLI:**
- Installation: https://stripe.com/docs/stripe-cli
- Webhook Testing: https://stripe.com/docs/cli/trigger

**PhotoVault Specific:**
- Report issues: [Your support channel]
- Webhook handler code: `src/app/api/webhooks/stripe/route.ts`
- Database schema: `database/webhook-tables.sql`

---

## Quick Reference Commands

```bash
# Start Stripe CLI listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test checkout
stripe trigger checkout.session.completed

# View webhook logs
stripe logs tail --filter-endpoint-id=we_xxxxx

# Test with real API
stripe customers create --email=test@example.com

# View processed events
psql $DATABASE_URL -c "SELECT * FROM processed_webhook_events ORDER BY processed_at DESC LIMIT 10;"
```

---

**Last Updated:** November 3, 2025
**Version:** 1.0
**Stripe API Version:** 2024-11-20.acacia
