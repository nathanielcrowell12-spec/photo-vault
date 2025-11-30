---
PROJECT: PhotoVault
TYPE: technical
TOPIC: Stripe Integration Verification Checklist
---

# Stripe Integration Verification Checklist

**Date:** November 27, 2025
**Purpose:** Verify all Stripe code is correct for the new All-In-One pricing model
**Status:** Phase 2 Complete - Ready for Testing

---

## 💰 Current Pricing Model

### Storage Package Pricing
| Package | Client Pays | Photographer Gets | PhotoVault Gets | Duration |
|---------|-------------|-------------------|-----------------|----------|
| **Year Package** | $100 | $50 (50%) | $50 (50%) | 12 months |
| **6-Month Package** | $50 | $25 (50%) | $25 (50%) | 6 months |
| **6-Month Trial** | $20 | $10 (50%) | $10 (50%) | 6 months (no auto-renew) |
| **Shoot Only** | $0 | $0 | $0 | Until downloaded or 90 days |

### Ongoing Pricing (After Package Expires)
| Type | Client Pays | Photographer Gets | PhotoVault Gets |
|------|-------------|-------------------|-----------------|
| **Monthly (with photographer)** | $8/month | $4/month (50%) | $4/month (50%) |
| **Direct Monthly (no photographer)** | $8/month | $0 | $8/month (100%) |
| **Reactivation Fee** | $20 one-time | $0 | $20 (100%) |

---

## 🔍 Code Files to Verify

### 1. Core Payment Models
**File:** `src/lib/payment-models.ts`

**Payment Options:**
- [ ] `year_package`: $100, 12 months, 50% commission
- [ ] `six_month_package`: $50, 6 months, 50% commission
- [ ] `six_month_trial`: $20, 6 months, 50% commission, NO auto-renew
- [ ] `shoot_only`: $0, 90 days max, 0% commission

**Functions:**
- [ ] `getPhotographerPaymentOptions()` returns all 4 options
- [ ] `calculateAllInOnePricing()` correctly calculates revenue split
- [ ] `getPaymentOptionSummary()` returns user-friendly descriptions

---

### 2. Stripe Configuration
**File:** `src/lib/stripe.ts`

**Price IDs:**
- [ ] Year Package upfront: `price_1SY5Th8jZm4oWQdn1UDKi6WQ`
- [ ] Year Package recurring: `price_1SY5Th8jZm4oWQdnwALqVzSx`
- [ ] 6-Month Package upfront: `price_1SY5U98jZm4oWQdnnyYnQbqA`
- [ ] 6-Month Package recurring: `price_1SY5U98jZm4oWQdnBz8u9xri`
- [ ] 6-Month Trial: `price_1SY5UZ8jZm4oWQdnlFsYPaN3`
- [ ] Reactivation Fee: `price_1SY5Uz8jZm4oWQdnD3KJY0ds`
- [ ] Client Monthly: `price_1SY5VP8jZm4oWQdnSRkf7QBm`
- [ ] Direct Monthly: `price_1SY5yu8jZm4oWQdncyIxgA2Z`
- [ ] Photographer Platform: `price_1SY5TE8jZm4oWQdnrsTm2bCp`

---

### 3. Gallery Checkout API
**File:** `src/app/api/stripe/gallery-checkout/route.ts`

**Verification:**
- [ ] File exists
- [ ] Handles All-In-One pricing (shoot fee + storage)
- [ ] Single line item "Photography Services" (no itemization to client)
- [ ] Metadata includes: photographer_payout_amount, platform_amount, commission_rate
- [ ] No hardcoded amounts
- [ ] No compilation errors

---

### 4. Webhook Handler
**File:** `src/app/api/stripe/webhook/route.ts`

**payment_intent.succeeded handler:**
- [ ] Updates gallery `payment_status` to 'paid'
- [ ] Records transaction in `gallery_payment_transactions`
- [ ] Creates Stripe Transfer to photographer's connected account
- [ ] Uses metadata for revenue split (not hardcoded)

**checkout.session.completed handler:**
- [ ] Handles both subscription and one-time payments
- [ ] Creates appropriate records in database

---

### 5. Download Tracking API
**File:** `src/app/api/gallery/download/route.ts`

**Verification:**
- [ ] POST: Records individual photo download
- [ ] PUT: Records bulk download
- [ ] GET: Returns download progress
- [ ] Verifies user has access to gallery
- [ ] Updates gallery download counters

---

### 6. Email Templates

**File:** `src/lib/email/critical-templates.ts`
- [ ] Photographer Welcome: Says "50% commission"
- [ ] No references to "80%" or old pricing

**File:** `src/lib/email/engagement-templates.ts`
- [ ] First Gallery Upload: Shows correct commission amounts
- [ ] Examples use $100/$50 packages, not $10/month

**File:** `src/lib/email/revenue-templates.ts`
- [ ] Commission Rate shown as "50%"
- [ ] Payout amounts calculated correctly

---

## 📊 Database Schema Check

### New Tables (Phase 2)
- [ ] `photo_downloads` exists
- [ ] `gallery_payment_transactions` exists

### New Columns on `galleries`
- [ ] `payment_option_id` VARCHAR(50)
- [ ] `billing_mode` VARCHAR(20)
- [ ] `shoot_fee` INTEGER
- [ ] `storage_fee` INTEGER
- [ ] `total_amount` INTEGER
- [ ] `payment_status` VARCHAR(20)
- [ ] `paid_at` TIMESTAMPTZ
- [ ] `gallery_expires_at` TIMESTAMPTZ
- [ ] `download_tracking_enabled` BOOLEAN
- [ ] `total_photos_to_download` INTEGER
- [ ] `photos_downloaded` INTEGER
- [ ] `all_photos_downloaded` BOOLEAN
- [ ] `download_completed_at` TIMESTAMPTZ

### Functions Created
- [ ] `reactivate_gallery(gallery_id, stripe_payment_intent_id)` exists
- [ ] `start_monthly_subscription(gallery_id, stripe_subscription_id)` exists
- [ ] `update_gallery_download_progress()` trigger exists
- [ ] `record_gallery_payment_transaction()` function exists

---

## 🧪 Functional Tests

### Test 1: Gallery Creation (All-In-One)
- [ ] Photographer can select billing mode "All-In-One"
- [ ] Photographer can enter shoot fee (e.g., $2,500)
- [ ] Photographer can select storage package
- [ ] Total shown correctly (shoot fee + storage)
- [ ] Gallery created with correct metadata

### Test 2: Gallery Creation (Storage Only)
- [ ] Photographer can select billing mode "Storage Only"
- [ ] Shoot fee input is hidden
- [ ] Only storage package options shown
- [ ] Gallery created with billing_mode = 'storage_only'

### Test 3: Shoot Only Option
- [ ] Photographer can select "Shoot Only" package
- [ ] Gallery expires after download or 90 days
- [ ] Download tracking enabled
- [ ] Client can upgrade to storage package

### Test 4: Client Checkout Flow
- [ ] Client sees single "Photography Services" line item
- [ ] Amount matches total (shoot + storage)
- [ ] No itemization visible to client
- [ ] Payment succeeds with test card

### Test 5: Webhook Processing
- [ ] payment_intent.succeeded received
- [ ] Gallery marked as paid
- [ ] Transaction recorded
- [ ] Photographer payout transfer created

### Test 6: Reactivation Flow
- [ ] Archived gallery can be reactivated
- [ ] Client pays $20 reactivation fee
- [ ] Gallery gets 1 month access
- [ ] Client can choose $8/month or just download

### Test 7: Download Tracking (Shoot Only)
- [ ] Downloads are recorded
- [ ] Counter increments correctly
- [ ] Gallery marks complete when all downloaded
- [ ] Expiration triggers after completion

---

## 🚨 Known Issues to Check

### Issue 1: Old Pricing References
- [ ] No "$10/month" anywhere in code
- [ ] No references to old commission structure
- [ ] Email templates updated

### Issue 2: Import Statements
- [ ] `payment-models.ts` exports all functions
- [ ] Stripe webhook imports work correctly
- [ ] No missing dependencies

### Issue 3: TypeScript Errors
- [ ] `npm run build` passes
- [ ] No errors in VSCode
- [ ] Dev server runs without errors

---

## ✅ Final Verification Steps

1. **Build Check:**
   ```bash
   cd "C:\Users\natha\.cursor\Photo Vault\photovault-hub"
   npm run build
   ```
   - [ ] No TypeScript errors
   - [ ] Build completes successfully

2. **Database Verification:**
   - [ ] Both migrations ran successfully
   - [ ] All new tables/columns exist
   - [ ] Functions and triggers created

3. **Manual Flow Test:**
   - [ ] Create gallery with All-In-One pricing
   - [ ] Client receives checkout link
   - [ ] Payment completes
   - [ ] Photographer receives payout notification

---

## 📝 Migration Status

### SQL Migrations Run:
- [x] `payment-model-migration.sql` - Foundation tables ✅
- [x] `all-in-one-pricing-migration.sql` - Phase 2 schema ✅

### Stripe Products Created:
- [x] Photographer Platform ($22/month)
- [x] Year Package ($100 + $8/mo)
- [x] 6-Month Package ($50 + $8/mo)
- [x] 6-Month Trial ($20 one-time)
- [x] Reactivation Fee ($20 one-time)
- [x] Client Monthly ($8/month)
- [x] Direct Monthly ($8/month, 0% commission)

---

## 🎯 Next Actions

1. [x] Run database migrations
2. [ ] Run `npm run build` to verify TypeScript
3. [ ] Test gallery creation flow locally
4. [ ] Test checkout flow with Stripe test mode
5. [ ] Verify webhook handling
6. [ ] Update any email templates with old pricing
7. [ ] Deploy to Vercel staging
8. [ ] End-to-end production test

---

**Verification Status:** Ready for Build Test
**Confidence Level:** High (migrations complete, code updated)
**Risk Level:** Low (incremental changes, test mode first)
