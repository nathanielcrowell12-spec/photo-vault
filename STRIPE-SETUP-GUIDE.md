# 🔵 Stripe Integration Setup Guide for PhotoVault

**Last Updated:** October 15, 2025  
**Estimated Setup Time:** 30 minutes

---

## 📋 OVERVIEW

PhotoVault needs Stripe for:
1. **Client Subscriptions** - $100 first year, then $8/month
2. **Photographer Subscriptions** - $22/month
3. **Commission Payments** - 50% revenue share to photographers via Stripe Connect

---

## 🚀 STEP 1: CREATE STRIPE ACCOUNT

### Create Account (Free)
1. Go to https://stripe.com
2. Click "Start now" or "Sign up"
3. Fill in:
   - Email address
   - Full name
   - Country: United States
   - Password

### Verify Email
1. Check your email for verification link
2. Click the link to verify

### Complete Business Profile
1. **Business Type**: Individual or Company
2. **Business Description**: "Photo management platform for photographers and families"
3. **Website**: photovault.com (or your domain)
4. **Customer Support Email**: Your support email

---

## 🔑 STEP 2: GET YOUR API KEYS

### Test Mode Keys (For Development)
1. Log into Stripe Dashboard: https://dashboard.stripe.com
2. Make sure you're in **TEST MODE** (toggle in top right)
3. Go to **Developers** → **API Keys**
4. You'll see:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - Click "Reveal test key"

### Copy Keys to `.env.local`
```bash
# In photovault-hub/.env.local, add:
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx  # Get this in Step 4
```

---

## 💰 STEP 3: CREATE PRODUCTS & PRICES

### Client Subscription Product
1. Go to **Products** → **Add Product**
2. **Name**: PhotoVault Client Storage
3. **Description**: Lifetime access to all your professional photos
4. **Pricing Model**: Recurring
5. **Price**: 
   - **First Year**: $100 (create custom billing)
   - **After Year 1**: $8/month

**Setup Steps:**
```
Product 1: PhotoVault Client - First Year
- Price: $100
- Billing Period: 12 months
- Price ID: price_xxxxx (save this)

Product 2: PhotoVault Client - Renewal
- Price: $8
- Billing Period: Monthly
- Price ID: price_yyyyy (save this)
```

### Photographer Subscription Product
1. **Name**: PhotoVault Pro - Photographer Plan
2. **Description**: Unlimited client galleries with 50% revenue share
3. **Pricing Model**: Recurring
4. **Price**: $22/month

```
Product 3: PhotoVault Pro
- Price: $22
- Billing Period: Monthly
- Price ID: price_zzzzz (save this)
```

### Add Price IDs to `.env.local`
```bash
STRIPE_CLIENT_FIRST_YEAR_PRICE_ID=price_xxxxx
STRIPE_CLIENT_MONTHLY_PRICE_ID=price_yyyyy
STRIPE_PHOTOGRAPHER_PRICE_ID=price_zzzzz
```

---

## 🔗 STEP 4: SETUP WEBHOOKS

Webhooks notify your app when payments succeed/fail.

### Local Development (Using Stripe CLI)
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
   ```bash
   # Windows (with Scoop)
   scoop install stripe
   
   # Or download from: https://github.com/stripe/stripe-cli/releases
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to http://localhost:3002/api/stripe/webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_`)
   ```bash
   # Add to .env.local
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
   ```

### Production Webhooks (After Deploying)
1. Go to **Developers** → **Webhooks** → **Add Endpoint**
2. **Endpoint URL**: https://yourdomain.com/api/stripe/webhook
3. **Events to Listen For**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `account.updated` (for Stripe Connect)
4. Copy the **Signing Secret** to production `.env`

---

## 🤝 STEP 5: ENABLE STRIPE CONNECT

Stripe Connect allows you to pay photographers their commission.

### Enable Connect
1. Go to **Connect** → **Get Started**
2. Choose **Platform or Marketplace** (you're splitting payments)
3. **Onboarding Type**: Standard (photographers manage their own Stripe account)
4. **Platform Name**: PhotoVault
5. **Support Email**: Your email

### Get Connect Client ID
1. Go to **Settings** → **Connect Settings**
2. Copy your **Client ID** (starts with `ca_`)
3. Add to `.env.local`:
   ```bash
   STRIPE_CONNECT_CLIENT_ID=ca_xxxxxxxxxxxxxxxxxxxxx
   ```

### Configure Connect Settings
- **Redirect URL**: https://yourdomain.com/photographers/stripe/callback
- **Platform Fee**: 50% (you keep 50%, photographer gets 50%)

---

## 🧪 STEP 6: TEST MODE CHECKLIST

Before going live, test everything in **Test Mode**:

### Test Credit Cards (Stripe provides these)
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155

Any future expiry date (e.g., 12/34)
Any 3-digit CVC
Any ZIP code
```

### Test Scenarios
- [ ] Client signs up and pays $100
- [ ] Client subscription renews at $8/month (simulate time)
- [ ] Photographer signs up and pays $22/month
- [ ] Photographer connects Stripe account
- [ ] Commission payment transfers to photographer
- [ ] Webhook handles successful payment
- [ ] Webhook handles failed payment
- [ ] Subscription cancellation works

---

## ✅ STEP 7: GO LIVE CHECKLIST

### Before Going Live
1. **Complete Account Verification**
   - Bank account connected
   - Business details verified
   - Identity verification complete

2. **Switch to Live Mode**
   - Toggle to **Live Mode** in Stripe Dashboard
   - Get new Live API keys (start with `pk_live_` and `sk_live_`)
   - Update `.env` with live keys

3. **Update Webhook Endpoints**
   - Add production webhook URL
   - Copy live webhook signing secret

4. **Test with Real Card (Small Amount)**
   - Use your own card for $1 test
   - Verify webhook receives event
   - Check database updates correctly
   - Refund the test payment

### Live Mode Environment Variables
```bash
# Production .env
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
STRIPE_CONNECT_CLIENT_ID=ca_xxxxxxxxxxxxxxxxxxxxx
STRIPE_CLIENT_FIRST_YEAR_PRICE_ID=price_xxxxx
STRIPE_CLIENT_MONTHLY_PRICE_ID=price_yyyyy
STRIPE_PHOTOGRAPHER_PRICE_ID=price_zzzzz
```

---

## 📊 REVENUE SPLIT EXAMPLE

### How Money Flows
```
Client pays $100 for first year
↓
PhotoVault receives $100
↓
Photographer gets $50 (50% commission via Stripe Connect)
↓
PhotoVault keeps $50

Next year: Client pays $8/month
↓
Photographer gets $4/month
↓
PhotoVault keeps $4/month
```

### Stripe Fees
- **Standard Rate**: 2.9% + $0.30 per transaction
- **Connect Fee**: Additional 0.5% for transfers
- **Example**: $100 payment
  - Client charged: $100
  - Stripe takes: ~$3.20
  - You receive: ~$96.80
  - Photographer gets: ~$48.40 (50% of $96.80)
  - You keep: ~$48.40

---

## 🛠️ STRIPE DASHBOARD NAVIGATION

### Key Pages You'll Use
- **Home**: Overview, recent activity
- **Payments**: All transactions
- **Customers**: Customer list and subscriptions
- **Products**: Your pricing plans
- **Connect**: Connected photographer accounts
- **Developers** → **API Keys**: Get your keys
- **Developers** → **Webhooks**: Manage webhooks
- **Developers** → **Logs**: Debug webhook issues

---

## 🐛 TROUBLESHOOTING

### Webhook Not Receiving Events
1. Check webhook URL is correct
2. Verify signing secret matches `.env.local`
3. Check Stripe CLI is running (`stripe listen`)
4. Look at **Developers** → **Webhooks** → **Logs**

### Payment Fails in Test Mode
1. Use test card numbers from Stripe docs
2. Check for JavaScript errors in browser console
3. Verify publishable key is correct
4. Check Stripe Dashboard → **Logs**

### Stripe Connect Not Working
1. Verify Connect is enabled in your account
2. Check redirect URL is correct
3. Ensure photographer completes onboarding
4. Check **Connect** → **Accounts** for status

### Database Not Updating
1. Check webhook is reaching your server
2. Verify webhook handler runs without errors
3. Check Supabase service role key is correct
4. Look at server logs for errors

---

## 📚 ADDITIONAL RESOURCES

### Stripe Documentation
- **Getting Started**: https://stripe.com/docs/development
- **Subscriptions**: https://stripe.com/docs/billing/subscriptions
- **Stripe Connect**: https://stripe.com/docs/connect
- **Webhooks**: https://stripe.com/docs/webhooks
- **Testing**: https://stripe.com/docs/testing

### PhotoVault Code Files (After Implementation)
- `/api/stripe/webhook` - Webhook handler
- `/api/stripe/create-checkout` - Payment checkout
- `/api/stripe/create-subscription` - Subscription setup
- `/api/stripe/connect/authorize` - Photographer Connect
- `/photographers/billing` - Photographer billing page
- `/client/billing` - Client billing page

---

## 🎯 QUICK START CHECKLIST

**Do this now (before we build the integration):**

- [ ] Create Stripe account (https://stripe.com)
- [ ] Verify email
- [ ] Complete business profile
- [ ] Get Test Mode API keys
- [ ] Copy keys to `.env.local`
- [ ] Create 3 products (Client first year, Client renewal, Photographer)
- [ ] Copy Price IDs to `.env.local`
- [ ] Install Stripe CLI (optional but recommended)
- [ ] Enable Stripe Connect
- [ ] Copy Connect Client ID to `.env.local`

**Once you've done the above, I'll build:**
1. ✅ Webhook handler
2. ✅ Checkout flows
3. ✅ Subscription management
4. ✅ Stripe Connect integration
5. ✅ Commission tracking

---

## 💬 NEED HELP?

**Stripe Support:**
- Email: support@stripe.com
- Chat: Available in Stripe Dashboard
- Docs: https://stripe.com/docs

**PhotoVault Implementation:**
- Just ask me once you have your keys ready!

---

**Next Steps:**
1. Create your Stripe account
2. Get your API keys
3. Let me know when ready - I'll build the integration
4. Test everything in Test Mode
5. Go live when ready

🎉 **Good luck! This is the most important integration for revenue.**


