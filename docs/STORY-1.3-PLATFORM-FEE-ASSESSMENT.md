# Story 1.3: Platform Fee Billing - Code Assessment Report

**Date:** December 2, 2025  
**Status:** Code Review Complete  
**Objective:** Assess if existing infrastructure would support $22/month platform fee billing for photographers without making changes

---

## Executive Summary

**Verdict:** ❌ **The existing infrastructure would NOT work for photographer platform fee billing without significant modifications.**

While some foundational pieces exist (webhook handlers, database tables, UI components), they are all designed specifically for **client subscriptions**, not photographer platform subscriptions. The system would need substantial changes to support Story 1.3.

---

## Detailed Findings

### ✅ What Exists and Would Work (With Modifications)

#### 1. Webhook Infrastructure
- **File:** `src/app/api/stripe/webhook/route.ts`
- **Status:** ✅ Handler exists, but needs modification
- **Current State:**
  - `handleInvoicePaid()` function exists (lines 367-413)
  - `handleSubscriptionUpdated()` function exists (lines 253-322)
  - `handleSubscriptionDeleted()` function exists (lines 327-362)
- **Issue:** All handlers only look for `client_id` in subscription records
  - Line 393: `select('client_id')` - only queries client subscriptions
  - Line 405: Updates `user_profiles` using `sub.client_id` - assumes client
  - No logic to distinguish between client subscriptions and photographer platform subscriptions
- **What's Needed:** 
  - Add metadata check to identify platform subscriptions (e.g., `subscription_type: 'platform'`)
  - Update logic to handle photographer subscriptions differently
  - Query `photographer_id` instead of `client_id` for platform subscriptions

#### 2. Database Schema - Partial Support
- **File:** `database/stripe-subscriptions-table.sql`
- **Status:** ⚠️ Table exists but designed for client subscriptions
- **Current State:**
  - `subscriptions` table has `photographer_id` field (line 8)
  - BUT `client_id` is `NOT NULL` (line 7) - required field
  - Table comment says "Used for tracking client subscriptions to galleries" (line 3)
- **Issue:** 
  - Cannot store photographer platform subscriptions (requires `client_id`)
  - `photographer_id` field is for linking which photographer a client subscription belongs to (commission tracking)
- **What's Needed:**
  - Option 1: Make `client_id` nullable and add `subscription_type` field
  - Option 2: Create separate `photographer_subscriptions` table
  - Add `stripe_subscription_id` field to `photographers` table or `user_profiles` table

#### 3. UI Components
- **File:** `src/app/photographers/subscription/page.tsx`
- **Status:** ✅ UI exists, but uses mock data
- **Current State:**
  - Complete subscription management UI exists
  - Shows trial status, billing dates, payment methods
  - Uses `PaymentMethodManager` component
- **Issue:**
  - `fetchSubscriptionData()` uses `setTimeout()` with hardcoded mock data (lines 72-84)
  - Comment says "Simulate API call - in real implementation, this would fetch from database"
  - No actual API endpoint being called
- **What's Needed:**
  - Connect UI to real API endpoint
  - Fetch actual subscription data from database/Stripe

---

### ❌ What's Missing and Would Need to Be Built

#### 1. Platform Subscription Creation Endpoint
- **Missing:** `/api/stripe/platform-subscription/route.ts`
- **Status:** ❌ Does not exist
- **What's Needed:**
  - POST endpoint to create Stripe subscription for photographer
  - Use `STRIPE_PHOTOGRAPHER_PRICE_ID` environment variable
  - Create subscription with 14-day free trial
  - Store subscription ID in database
  - Link to photographer's user profile

#### 2. Photographer Signup Integration
- **File:** `src/app/photographers/signup/page.tsx`
- **Status:** ❌ No subscription creation
- **Current State:**
  - Creates auth user (line 275 in AuthContext)
  - Creates `user_profiles` record (line 300)
  - Creates `photographers` record (line 307)
  - Sets `payment_status: 'active'` (line 291) - but this is just a default, not tied to subscription
- **What's Needed:**
  - After photographer signup, call platform subscription creation endpoint
  - Create Stripe subscription with 14-day trial
  - Store subscription ID in database
  - Update `payment_status` based on subscription status

#### 3. Database Schema for Photographer Subscriptions
- **Status:** ❌ No dedicated storage
- **Current State:**
  - `user_profiles` table has generic `subscription_start_date` and `subscription_end_date` fields
  - `photographers` table has NO subscription-related fields
  - `subscriptions` table requires `client_id` (cannot be used for photographer subscriptions)
- **What's Needed:**
  - Add `stripe_platform_subscription_id` to `photographers` table OR
  - Add `stripe_platform_subscription_id` to `user_profiles` table with `subscription_type` field OR
  - Create new `photographer_subscriptions` table

#### 4. Webhook Handler Modifications
- **File:** `src/app/api/stripe/webhook/route.ts`
- **Status:** ⚠️ Exists but doesn't handle platform subscriptions
- **What's Needed:**
  - Modify `handleInvoicePaid()` to check subscription metadata for `subscription_type: 'platform'`
  - Update photographer's payment status when platform fee is paid
  - Handle failed platform fee payments (suspend photographer access)
  - Update `handleSubscriptionUpdated()` to handle platform subscriptions
  - Update `handleSubscriptionDeleted()` to handle platform subscription cancellations

#### 5. Environment Variable Usage
- **Status:** ⚠️ Defined but not used
- **Current State:**
  - `STRIPE_PHOTOGRAPHER_PRICE_ID` is in env examples and documentation
  - NOT used anywhere in source code
- **What's Needed:**
  - Use `STRIPE_PHOTOGRAPHER_PRICE_ID` in platform subscription creation endpoint
  - Verify it's configured in production

#### 6. Subscription Management API
- **File:** `src/app/api/stripe/subscription/route.ts`
- **Status:** ⚠️ Exists but only for clients
- **Current State:**
  - GET endpoint queries `client_id = user.id` (line 40)
  - POST endpoint queries `client_id = user.id` (line 117)
  - Cannot be used for photographer platform subscriptions
- **What's Needed:**
  - Create `/api/stripe/platform-subscription` endpoint OR
  - Modify existing endpoint to handle both client and photographer subscriptions

---

## Required Modifications Summary

### Database Changes
1. **Option A (Recommended):** Add fields to `photographers` table:
   ```sql
   ALTER TABLE photographers ADD COLUMN stripe_platform_subscription_id VARCHAR(255);
   ALTER TABLE photographers ADD COLUMN platform_subscription_status VARCHAR(50);
   ALTER TABLE photographers ADD COLUMN platform_subscription_trial_end TIMESTAMPTZ;
   ```

2. **Option B:** Modify `subscriptions` table to support both types:
   ```sql
   ALTER TABLE subscriptions ALTER COLUMN client_id DROP NOT NULL;
   ALTER TABLE subscriptions ADD COLUMN subscription_type VARCHAR(50) CHECK (subscription_type IN ('client', 'platform'));
   ALTER TABLE subscriptions ADD COLUMN photographer_user_id UUID REFERENCES user_profiles(id);
   ```

### Code Changes Required

1. **Create:** `src/app/api/stripe/platform-subscription/route.ts`
   - POST: Create subscription with 14-day trial
   - GET: Fetch photographer's platform subscription

2. **Modify:** `src/app/api/stripe/webhook/route.ts`
   - Update `handleInvoicePaid()` to handle platform subscriptions
   - Update `handleSubscriptionUpdated()` to handle platform subscriptions
   - Update `handleSubscriptionDeleted()` to handle platform subscriptions

3. **Modify:** `src/app/photographers/signup/page.tsx` or `src/contexts/AuthContext.tsx`
   - Add subscription creation after photographer signup

4. **Modify:** `src/app/photographers/subscription/page.tsx`
   - Replace mock data with real API call to fetch subscription

5. **Add:** Subscription status check in photographer dashboard
   - Block access if subscription is past_due or cancelled

---

## Architecture Considerations

### How to Distinguish Platform Subscriptions

**Recommended Approach:** Use Stripe subscription metadata:
```typescript
{
  subscription_type: 'platform',
  photographer_id: '<photographer_user_id>'
}
```

This allows the webhook handler to:
1. Check `subscription.metadata.subscription_type === 'platform'`
2. Query photographer by `metadata.photographer_id`
3. Update photographer's subscription status accordingly

### Database Design Recommendation

**Recommended:** Add fields directly to `photographers` table:
- Simpler queries (no joins needed)
- Clear ownership (one subscription per photographer)
- Easier to check subscription status in RLS policies
- Matches existing pattern (Stripe Connect account ID is in `photographers` table)

---

## Testing Requirements (When Implemented)

1. **Subscription Creation:**
   - Photographer signup creates subscription with 14-day trial
   - Subscription ID stored in database
   - Trial period correctly set

2. **Webhook Processing:**
   - `invoice.paid` updates photographer payment status
   - `invoice.payment_failed` handles failed payments
   - `customer.subscription.deleted` handles cancellations

3. **UI Display:**
   - Subscription page shows real data
   - Trial countdown works correctly
   - Payment method management works

4. **Access Control:**
   - Photographers with active/trial subscriptions can access dashboard
   - Photographers with past_due subscriptions see warning
   - Photographers with cancelled subscriptions are blocked

---

## Conclusion

**The existing codebase has foundational infrastructure (webhooks, database tables, UI) but it is all designed for client subscriptions, not photographer platform subscriptions.**

**To implement Story 1.3, you would need to:**
1. ✅ Modify webhook handlers (exists, needs changes)
2. ❌ Create platform subscription endpoint (doesn't exist)
3. ❌ Modify database schema (needs changes)
4. ❌ Integrate subscription creation into signup flow (doesn't exist)
5. ✅ Connect UI to real data (UI exists, needs API connection)

**Estimated Effort:** Medium (1 session as specified in WORK_PLAN.md)

**Confidence Level:** The infrastructure is close, but significant modifications would be required. The good news is that the patterns are already established for client subscriptions, so implementing photographer subscriptions would follow similar patterns.

---

**Assessment Completed By:** Code Review  
**Date:** December 2, 2025

