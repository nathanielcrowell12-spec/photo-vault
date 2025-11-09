# Stripe Setup Guide for PhotoVault
**Custom Configuration for Your Business Model**

---

## 📊 PhotoVault Business Model Summary

Based on your codebase, here's your pricing structure:

### For Photographers:
- **Subscription**: $22/month
- **Trial**: 14 days free
- **Commission**: Earn $50 upfront + $4/month recurring per client

### For Clients:
- **Year 1**: $100 upfront ($50 to PhotoVault, $50 to photographer)
- **Year 2+**: $8/month ($4 to PhotoVault, $4 to photographer)
- **First year free** when photographer invites them

### Revenue Split:
- PhotoVault gets 50% of all client payments
- Photographers get 50% of their client payments
- Reactivated clients: PhotoVault keeps 100%

---

## 🎯 What You Need in Stripe

### 1. **Products & Prices** (for subscriptions)
### 2. **Payment Links** (for one-time payments)
### 3. **Stripe Connect** (for photographer payouts) - OPTIONAL for MVP
### 4. **Webhooks** (already built)
### 5. **Customer Portal** (for self-service management)

---

## 📋 Step-by-Step Setup Guide

---

## PART 1: Create Photographer Subscription

### Step 1.1: Create Photographer Product

1. Go to **Stripe Dashboard** → **Products**
2. Click **"+ Add product"**
3. Fill in:
   - **Name**: `Photographer Pro Subscription`
   - **Description**: `PhotoVault professional subscription for photographers - unlimited galleries, analytics, and commission tracking`
   - **Image**: Upload photographer-related image (optional)

### Step 1.2: Set Pricing

**In the same form:**
- **Pricing model**: `Standard pricing`
- **Price**: `$22.00 USD`
- **Billing period**: `Monthly`
- **Free trial**: `14 days`

**Advanced Options** (click to expand):
- **Usage type**: `Licensed` (not metered)
- **Payment behavior**: `Charge automatically`

4. Click **"Save product"**

### Step 1.3: Get Price ID

After saving, you'll see the product page. Copy the **Price ID** (starts with `price_...`)

**Add to your code later:**
```typescript
const PHOTOGRAPHER_PRICE_ID = 'price_1234567890abcdef' // Your actual price ID
```

---

## PART 2: Create Client Subscription

### Step 2.1: Create Client Product

1. Go to **Products** → **"+ Add product"**
2. Fill in:
   - **Name**: `Client Annual Subscription`
   - **Description**: `PhotoVault client subscription - permanent access to all photos, import tools, and timeline`

### Step 2.2: Set Initial Pricing (Year 1 - One-time)

**For the $100 upfront payment:**
- **Pricing model**: `Standard pricing`
- **Price**: `$100.00 USD`
- **Billing period**: `One time`

Click **"Save product"**

Copy the **Price ID** for the one-time payment.

### Step 2.3: Add Monthly Pricing (Year 2+)

On the product page, click **"Add another price"**:
- **Price**: `$8.00 USD`
- **Billing period**: `Monthly`
- **Free trial**: `1 year` (covers the first year they already paid for)

Click **"Save"**

Copy this **Price ID** too.

**Summary - You now have:**
```typescript
const CLIENT_ONETIME_PRICE_ID = 'price_...' // $100 one-time
const CLIENT_MONTHLY_PRICE_ID = 'price_...' // $8/month after 1 year
```

---

## PART 3: Configure Checkout Settings

### Step 3.1: Enable Customer Portal

1. Go to **Settings** → **Customer portal**
2. Toggle **"Enable link to portal"** → ON
3. Configure what customers can do:
   - ✅ **Cancel subscription** → Allow
   - ✅ **Update payment method** → Allow
   - ✅ **View invoice history** → Allow
   - ❌ **Update subscription** → Don't allow (you control upgrades/downgrades)

4. **Cancellation settings**:
   - ✅ Show a cancellation reason form
   - ✅ Offer a discount or trial extension → Optional
   - ✅ Cancel at period end → Yes (let them finish their paid period)

5. Click **"Save changes"**

### Step 3.2: Configure Email Receipts

1. Go to **Settings** → **Emails**
2. Enable these:
   - ✅ **Successful payments** → ON
   - ✅ **Failed payments** → ON
   - ✅ **Upcoming invoice** → ON (3 days before renewal)
   - ✅ **Subscription canceled** → ON

3. **Customize email branding** (optional):
   - Upload your PhotoVault logo
   - Set brand colors
   - Add custom footer text

---

## PART 4: Set Up Payment Methods

### Step 4.1: Enable Payment Methods

1. Go to **Settings** → **Payment methods**
2. Enable these for your customers:
   - ✅ **Cards** (Visa, Mastercard, Amex, Discover)
   - ✅ **Apple Pay** (recommended)
   - ✅ **Google Pay** (recommended)
   - ⚠️ **ACH Direct Debit** (optional - US only, lower fees but slower)
   - ⚠️ **SEPA Direct Debit** (optional - Europe only)

**Recommended for PhotoVault:** Just cards + digital wallets (Apple/Google Pay)

### Step 4.2: Configure Card Settings

Still in Payment methods:
- **3D Secure**: `Adaptive` (recommended - prevents fraud)
- **Saved cards**: `Allow customers to save cards` → ON
- **CVC requirement**: `Always require CVC` → ON (more secure)

Click **"Save"**

---

## PART 5: Create Webhook (Already Built - Just Connect)

### Step 5.1: Create Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL**:
   - Local testing: Use Stripe CLI (see below)
   - Production: `https://your-domain.com/api/webhooks/stripe`

4. **Description**: `PhotoVault payment webhook`

5. **Events to send** → Click "Select events"

**Select these 6 events:**
```
✅ checkout.session.completed
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed
```

*(Optional for Stripe Connect later: payout.created)*

6. Click **"Add endpoint"**

### Step 5.2: Get Webhook Secret

After creating the endpoint, click on it to view details.

Copy the **Signing secret** (starts with `whsec_...`)

**Add to `.env.local`:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...your_actual_secret
```

---

## PART 6: Get Your API Keys

### Step 6.1: Switch to Test Mode

In the top-right corner, make sure the toggle says **"Test mode"** (not Live mode)

### Step 6.2: Get Test Keys

1. Go to **Developers** → **API keys**
2. You'll see two keys:

**Publishable key** (starts with `pk_test_...`):
- Click "Reveal test key"
- Copy it

**Secret key** (starts with `sk_test_...`):
- Click "Reveal test key"
- Copy it

### Step 6.3: Add to Environment Variables

**Edit `.env.local`:**
```bash
# Replace the placeholder values with your actual keys
STRIPE_SECRET_KEY=sk_test_51Abc123...your_actual_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Xyz789...your_actual_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_1234567890...your_actual_webhook_secret
```

**Save the file.**

---

## PART 7: Test Locally with Stripe CLI

### Step 7.1: Install Stripe CLI (Windows)

**Option A: Using Windows Installer**
1. Download from: https://github.com/stripe/stripe-cli/releases/latest
2. Look for `stripe_X.X.X_windows_x86_64.zip`
3. Extract to a folder (e.g., `C:\stripe`)
4. Add to PATH:
   - Search "Environment Variables" in Windows
   - Edit System Variables → PATH
   - Add `C:\stripe` (or wherever you extracted)
   - Click OK
5. Open NEW terminal and verify: `stripe --version`

**Option B: Using Scoop (if you have it)**
```bash
scoop install stripe
```

### Step 7.2: Login to Stripe CLI

```bash
stripe login
```

This will open your browser and ask you to authorize the CLI.

### Step 7.3: Forward Webhooks to Local Dev Server

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Keep this terminal open!** It will show you the webhook signing secret.

Copy the secret (starts with `whsec_...`) and add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_...from_stripe_listen_output
```

### Step 7.4: Restart Dev Server

Since you updated `.env.local`, restart your dev server:

```bash
# Press Ctrl+C in your dev server terminal
npm run dev
```

---

## PART 8: Test the Integration

### Test 8.1: Test Webhook Events

**In a new terminal:**
```bash
stripe trigger checkout.session.completed
```

**Check:**
1. Stripe CLI terminal shows: `✅ Received event: checkout.session.completed`
2. Your dev server shows webhook processing logs
3. Query database:
```sql
SELECT * FROM webhook_logs ORDER BY processed_at DESC LIMIT 1;
```

Should show `status: 'success'`

### Test 8.2: Test with Real Checkout Flow

**Use Stripe test cards:**

**Successful payment:**
```
Card number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Payment fails:**
```
Card number: 4000 0000 0000 0341
```

**Requires 3D Secure:**
```
Card number: 4000 0025 0000 3155
```

### Test 8.3: Verify Data in Database

After successful test checkout:

```sql
-- Check webhook was received
SELECT * FROM webhook_logs WHERE event_type = 'checkout.session.completed';

-- Check user balance (if token purchase)
SELECT email, token_balance FROM users;

-- Check subscription created (if subscription)
SELECT * FROM subscriptions WHERE status = 'active';
```

---

## PART 9: Photographer Payout Options (Choose One)

You have 3 options for paying photographers their commission:

### Option A: Manual Payouts (Simplest - Start Here)

**How it works:**
- Track photographer earnings in database
- Monthly, you manually pay photographers via:
  - Bank transfer
  - PayPal
  - Check

**Pros:**
- No additional Stripe setup needed
- Full control
- Lower complexity

**Cons:**
- Manual work each month
- No automation

**To implement:**
- Just use the `payouts` table to track amounts owed
- Generate monthly payout reports
- Pay manually outside Stripe

### Option B: Stripe Connect - Express Accounts (Recommended Long-term)

**How it works:**
- Photographers create a Stripe Connect account
- You automatically transfer their commission
- Stripe handles compliance, taxes, etc.

**Pros:**
- Fully automated
- Stripe handles onboarding & compliance
- Built-in dashboard for photographers

**Cons:**
- Additional 0.5% fee on transfers
- Requires Stripe Connect setup

**To implement:**
1. Go to **Settings** → **Connect**
2. Choose **Express accounts** (easiest)
3. Enable in your account
4. Add Connect onboarding flow to photographer signup
5. Use webhook handler's `payout.created` event

### Option C: Stripe Connect - Custom Accounts (Advanced)

**Only if:** You want full control over photographer experience

**Not recommended** unless you need custom branding everywhere.

---

## 💡 Recommendation for PhotoVault MVP

**Start with:**
1. ✅ Products & subscriptions (PART 1 & 2) - **DO THIS NOW**
2. ✅ Webhooks (PART 5) - **Already built**
3. ✅ Test mode API keys (PART 6) - **DO THIS NOW**
4. ✅ Local testing (PART 7 & 8) - **DO THIS NOW**
5. ⚠️ Manual payouts (Option A) - **Start here, automate later**

**Add later (before scale):**
- Stripe Connect for automated payouts (Option B)
- Customer Portal customization
- Advanced analytics

---

## PART 10: Production Checklist

Before going live with real money:

### Pre-Launch:
- [ ] All products created in **Live mode** (not Test mode)
- [ ] Production webhook endpoint created (your real domain)
- [ ] Production webhook secret added to Vercel
- [ ] Live API keys added to Vercel (starts with `sk_live_...`, `pk_live_...`)
- [ ] Database migration run in production Supabase
- [ ] Customer Portal configured
- [ ] Email templates customized with branding
- [ ] Test with real (small) payment ($1) in live mode
- [ ] Verify webhook delivery in Stripe Dashboard
- [ ] Set up Stripe Radar (fraud detection) - Free for all accounts
- [ ] Add business information in Stripe Settings

### Post-Launch Monitoring:
- [ ] Monitor webhook delivery rate (should be >99%)
- [ ] Check webhook logs daily for errors
- [ ] Review failed payments weekly
- [ ] Track subscription churn rate
- [ ] Monitor revenue in Stripe Dashboard

---

## 🎯 Quick Start Summary (TL;DR)

**What to do RIGHT NOW:**

1. **Get your Stripe test keys:**
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy `pk_test_...` and `sk_test_...`
   - Add to `.env.local`

2. **Create products:**
   - Photographer subscription: $22/month (14-day trial)
   - Client year 1: $100 one-time
   - Client year 2+: $8/month (1-year trial)

3. **Create webhook:**
   - Go to Developers → Webhooks
   - Add endpoint (use Stripe CLI for local)
   - Select 6 events (listed in PART 5)
   - Copy signing secret to `.env.local`

4. **Test it:**
```bash
# Terminal 1:
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 2:
npm run dev

# Terminal 3:
stripe trigger checkout.session.completed
```

5. **Check database:**
```sql
SELECT * FROM webhook_logs;
```

Should see successful webhook!

---

## 🆘 Need Help?

**Common Issues:**

**"I don't see the Products tab"**
→ Make sure you're logged into Stripe Dashboard, not Stripe Billing

**"Webhook signature verification failed"**
→ Make sure you copied the `whsec_...` secret from Stripe CLI output

**"Module not found: stripe"**
→ Already installed in your package.json, just restart dev server

**"No webhook logs in database"**
→ Run the database migration: `database/webhook-tables.sql`

**"Where do I find my domain for production webhook?"**
→ After deploying to Vercel, use `https://your-app.vercel.app/api/webhooks/stripe`

---

## 📚 Resources

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Testing: https://stripe.com/docs/testing
- Stripe CLI: https://stripe.com/docs/stripe-cli
- PhotoVault Webhook Docs: `docs/STRIPE_WEBHOOK_SETUP.md`
- Test Cards: https://stripe.com/docs/testing#cards

---

**Setup Time:** ~30 minutes
**Difficulty:** Medium
**Status:** Ready to configure!

---

*Last Updated: November 3, 2025*
*For: PhotoVault MVP Launch*
