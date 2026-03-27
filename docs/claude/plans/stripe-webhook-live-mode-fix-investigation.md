# Stripe Webhook Live Mode Fix Investigation

**Date:** 2026-01-23
**Issue:** Stripe webhooks failing in production (113 failures since Jan 19)
**Priority:** CRITICAL - Production payments at risk
**Status:** ✅ RESOLVED

---

## Summary

Stripe webhooks to `https://photovault.photo/api/webhooks/stripe` were failing with HTTP 307 redirects since January 19, 2026. The root cause was a **domain mismatch** - the webhook was configured without `www` but the server redirects to `www`.

---

## Actual Root Cause (CONFIRMED)

### The Problem

**Webhook endpoint was configured as:**
`https://photovault.photo/api/webhooks/stripe` (no www)

**But server redirects to:**
`https://www.photovault.photo/api/webhooks/stripe` (with www)

**Stripe does NOT follow redirects!** Every webhook delivery returned HTTP 307 and was marked as failed.

### Evidence from Stripe Logs

```json
Response:
HTTP status code: 307
{
  "redirect": "https://www.photovault.photo/api/webhooks/stripe",
  "status": "307"
}
```

### The Fix Applied

Changed webhook endpoint URL in Stripe Dashboard from:
- `https://photovault.photo/api/webhooks/stripe`
to:
- `https://www.photovault.photo/api/webhooks/stripe`

### Results

- 113 "failures" were actually ~8-10 unique events with multiple retry attempts
- After URL fix, manually resent the failed events
- All events now processing successfully

---

## Initial (Wrong) Hypothesis

Initially suspected webhook secret mismatch (test vs live mode). User confirmed the secrets matched. Actual root cause was discovered by examining the webhook delivery logs which showed HTTP 307 responses.

---

## Evidence Gathered

### From Stripe Email
- **Failing endpoint:** `https://photovault.photo/api/webhooks/stripe`
- **Failures:** 113 requests since Jan 19, 2026 12:57:55 PM UTC
- **Error type:** "other errors" (HTTP 307 redirect)
- **Deadline:** Stripe will disable endpoint by Jan 28, 2026

### From Code Analysis

1. **Webhook handler** (`src/app/api/webhooks/stripe/route.ts`):
   - Properly gets raw body via `request.text()`
   - Verifies signature using `stripe.webhooks.constructEvent()`
   - Code is well-structured - NOT the issue

2. **Domain configuration:**
   - Site uses `www.photovault.photo` as canonical domain
   - Non-www requests redirect with 307

---

## Fix Required

### Step 1: Get Live Mode Webhook Secret from Stripe Dashboard

1. Go to https://dashboard.stripe.com
2. **CRITICAL:** Toggle to **LIVE MODE** (top right)
3. Go to **Developers** → **Webhooks**
4. Find the endpoint: `https://photovault.photo/api/webhooks/stripe`
5. Click on it to view details
6. Click "Reveal" next to **Signing secret**
7. Copy the secret (starts with `whsec_`)

### Step 2: Update Vercel Environment Variable

1. Go to Vercel Dashboard → PhotoVault Hub project
2. Go to **Settings** → **Environment Variables**
3. Find `STRIPE_WEBHOOK_SECRET`
4. Update the value with the LIVE MODE signing secret
5. Make sure it's set for **Production** environment

### Step 3: Redeploy (May Not Be Required)

Vercel typically picks up env var changes on next deployment. If issues persist:
1. Trigger a new deployment
2. Or go to **Deployments** → Click on latest → **Redeploy**

### Step 4: Verify in Stripe Dashboard

1. Go to **Developers** → **Webhooks** → Your endpoint
2. Click **Send test webhook**
3. Select `checkout.session.completed`
4. Check that the response is 200

---

## Secondary Checks (if primary fix doesn't work)

### Check 1: Verify STRIPE_SECRET_KEY is Live Mode

The `STRIPE_SECRET_KEY` should also be the live mode key (`sk_live_...`), not the test key (`sk_test_...`).

In Vercel, verify:
- `STRIPE_SECRET_KEY` starts with `sk_live_`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_live_`

### Check 2: Verify Webhook Endpoint Exists in Live Mode

Sometimes webhooks are only configured in test mode. Verify:
1. Toggle to LIVE MODE in Stripe Dashboard
2. Go to **Developers** → **Webhooks**
3. Confirm endpoint `https://photovault.photo/api/webhooks/stripe` exists
4. If not, create it with the required events

### Check 3: Check Vercel Logs

If the fix doesn't work:
1. Go to Vercel Dashboard → Logs
2. Filter by `/api/webhooks/stripe`
3. Look for specific error messages

---

## Files That Would Be Modified

**None** - This is an environment variable configuration issue, not a code issue.

---

## Testing After Fix

1. **Stripe Dashboard Test:**
   - Send test webhook from Stripe Dashboard
   - Verify 200 response

2. **Real Transaction Test:**
   - Make a small real purchase ($1)
   - Verify webhook is received
   - Check database for commission record

3. **Stripe Webhook Logs:**
   - Go to **Developers** → **Webhooks** → Your endpoint → Recent events
   - Verify events show "Succeeded" not "Failed"

---

## Why This Wasn't Caught Earlier

1. Local development uses Stripe CLI which generates its own webhook secret
2. Test mode worked fine with test webhook secret
3. When switching to live mode, the webhook secret change was likely missed
4. No automated test could catch this - it requires actual live Stripe credentials

---

## Impact Assessment

- **Current:** Webhook failures mean checkout completions may not be processed
- **Risk:** Customers may pay but not receive access (depending on fulfillment flow)
- **Recovery:** After fix, Stripe will retry failed events within the 7-day window
- **Check:** Review any payments since Jan 19 to ensure commissions were recorded

---

## Prevention for Future

Add to deployment checklist:
- [ ] Verify `STRIPE_WEBHOOK_SECRET` matches live mode secret
- [ ] Verify `STRIPE_SECRET_KEY` starts with `sk_live_`
- [ ] Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_live_`
- [ ] Send test webhook from Stripe Dashboard after deployment
