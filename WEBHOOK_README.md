# ✅ Stripe Webhook Handler - Implementation Complete

## 🎉 What's Been Built

The complete Stripe webhook system for PhotoVault is now implemented and ready for testing!

### Files Created:

1. **`src/app/api/webhooks/stripe/route.ts`** - Main webhook handler
   - Handles 7 different Stripe events
   - Signature verification (security)
   - Idempotency checking (prevents duplicates)
   - Comprehensive error logging

2. **`database/webhook-tables.sql`** - Database migration
   - 6 new tables for payment tracking
   - 4 helper functions (RPC)
   - Row Level Security (RLS) policies
   - Indexes for performance

3. **`docs/STRIPE_WEBHOOK_SETUP.md`** - Complete setup guide
   - Step-by-step instructions
   - Testing procedures
   - Debugging tips
   - Common issues & solutions

---

## 🚀 Quick Start (3 Steps)

### Step 1: Run Database Migration
1. Open Supabase Dashboard → SQL Editor
2. Copy/paste contents of `database/webhook-tables.sql`
3. Click **Run**
4. Verify success message

### Step 2: Add Environment Variables
Add to `.env.local`:
```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### Step 3: Test Locally
```bash
# Terminal 1: Start Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 2: Start dev server
npm run dev

# Terminal 3: Trigger test event
stripe trigger checkout.session.completed
```

**That's it!** Your webhook is now processing Stripe events.

---

## 📊 What the Webhook Handles

| Event | What It Does |
|-------|--------------|
| `checkout.session.completed` | Adds tokens to user balance after purchase |
| `customer.subscription.created` | Creates subscription record in database |
| `invoice.payment_succeeded` | Marks subscription as active, records payment |
| `invoice.payment_failed` | Marks subscription as past_due, logs failure |
| `customer.subscription.deleted` | Cancels subscription, updates status |
| `customer.subscription.updated` | Updates subscription details |
| `payout.created` | Records photographer payout (Stripe Connect) |

---

## 📦 Database Tables Created

1. **subscriptions** - Photographer/client subscription records
2. **token_transactions** - Token purchases, usage, refunds
3. **payment_history** - All subscription payments
4. **payouts** - Photographer earnings payouts
5. **webhook_logs** - Debug logs for all webhook events
6. **processed_webhook_events** - Prevents duplicate processing

---

## 🔧 Helper Functions (RPC)

```sql
-- Add tokens to user balance
SELECT add_tokens_to_balance('user_id'::uuid, 100, 'payment_intent_id');

-- Deduct tokens (returns true/false if sufficient balance)
SELECT deduct_tokens_from_balance('user_id'::uuid, 10);

-- Get subscription status
SELECT get_user_subscription_status('user_id'::uuid);

-- Cleanup old logs (maintenance)
SELECT cleanup_old_webhook_logs();
```

---

## 🧪 Testing Commands

```bash
# Start webhook listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test different events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed

# View webhook logs in terminal
stripe logs tail
```

---

## 📝 Check if It's Working

### Query Webhook Logs:
```sql
SELECT event_type, status, processing_time_ms, processed_at
FROM webhook_logs
ORDER BY processed_at DESC
LIMIT 10;
```

### Check User Token Balance:
```sql
SELECT email, token_balance
FROM users
WHERE email = 'test@example.com';
```

### View Active Subscriptions:
```sql
SELECT u.email, s.plan_type, s.status, s.current_period_end
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.status = 'active';
```

---

## ⚙️ Configuration Needed

### Local Development:
1. `.env.local` - Add Stripe keys
2. Stripe CLI - Install and run `stripe login`

### Production:
1. **Vercel** - Add environment variables:
   - `STRIPE_SECRET_KEY` (use live key: `sk_live_...`)
   - `STRIPE_WEBHOOK_SECRET` (from Stripe Dashboard)

2. **Stripe Dashboard** - Create webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: Select all 6 events listed above
   - Copy signing secret to Vercel

---

## 🛡️ Security Features

✅ **Signature Verification** - Prevents fake webhook requests
✅ **Idempotency** - Prevents duplicate processing if Stripe retries
✅ **Row Level Security (RLS)** - Users can only see their own data
✅ **Service Role Authentication** - Webhook uses elevated permissions safely

---

## 🐛 Debugging

### Issue: Webhook not processing
**Check:**
1. Is dev server running? (`npm run dev`)
2. Is Stripe CLI forwarding? (`stripe listen ...`)
3. Is webhook secret correct in `.env.local`?

### Issue: Tokens not added
**Check:**
```sql
-- Did webhook receive the event?
SELECT * FROM webhook_logs WHERE event_type = 'checkout.session.completed';

-- Were tokens added?
SELECT * FROM token_transactions WHERE user_id = 'xxx';

-- What's the user's balance?
SELECT token_balance FROM users WHERE id = 'xxx';
```

### Issue: Signature verification failed
**Fix:** Copy webhook secret from Stripe CLI output, add to `.env.local`

---

## 📚 Full Documentation

See **`docs/STRIPE_WEBHOOK_SETUP.md`** for:
- Complete setup instructions
- Production deployment guide
- Testing procedures
- Monitoring & debugging
- Common issues & solutions
- Maintenance tasks

---

## ✨ What's Next?

1. **Run the migration** in Supabase
2. **Test locally** with Stripe CLI
3. **Verify** tokens are added after test purchase
4. **Deploy to production** when ready
5. **Configure** webhook in Stripe Dashboard (production)

---

## 🎯 Success Criteria

You'll know it's working when:
- ✅ Webhook logs show "success" status
- ✅ User token balance increases after purchase
- ✅ Subscriptions are created/updated correctly
- ✅ No errors in webhook_logs table
- ✅ Stripe Dashboard shows 100% delivery success rate

---

## 💡 Pro Tips

1. **Always test with Stripe CLI first** before deploying
2. **Monitor webhook_logs table** after deploying to production
3. **Set up alerts** for webhook failures >5%
4. **Run cleanup function monthly** to remove old logs
5. **Use test cards** for testing (4242 4242 4242 4242)

---

## 📞 Need Help?

**Issues with:**
- Database migration → Check Supabase logs
- Webhook processing → Check `webhook_logs` table
- Stripe integration → Check Stripe Dashboard → Webhooks
- Code questions → Review `src/app/api/webhooks/stripe/route.ts`

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0341`
- 3D Secure: `4000 0025 0000 3155`

---

**Implementation Status:** ✅ Complete
**Estimated Setup Time:** 15-30 minutes
**Production Ready:** Yes (after testing)

**Built by:** Claude Code
**Date:** November 3, 2025
**Stripe API Version:** 2024-11-20.acacia

---

🚀 **Ready to process real payments!**
