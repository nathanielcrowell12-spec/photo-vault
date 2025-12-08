# Manual Testing Guide - Payment Flow Scenarios

**Date:** December 1, 2025  
**Environment:** Local Development (localhost:3002)  
**Prerequisites:** Dev server and Stripe CLI running

---

## Pre-Test Setup Verification

Before starting, verify:
- ✅ Dev server running on `http://localhost:3002`
- ✅ Stripe CLI forwarding webhooks (check terminal for "Ready" message)
- ✅ Test photographer ID: `2135ab3a-6237-48b3-9d53-c38d0626b3e4`
- ✅ Stripe Connect Account: `acct_1SYm5G9my0XhgOxd`

---

## Test Scenario 1: Photographer Without Stripe Connect

**Objective:** Verify checkout gracefully blocks when photographer hasn't set up Stripe Connect.

### Steps:

1. **Find or Create Test Gallery**
   - Log into the app as a photographer who has NOT completed Stripe Connect
   - OR use photographer ID: `9102ee9c-124c-49f2-a1c1-e8ce39cd1d82` (status: `not_started`)
   - Create a new gallery or use an existing one
   - Set pricing: $200 shoot fee + $100 storage fee = $300 total

2. **Navigate to Public Gallery Page**
   - Get the gallery ID from the database or URL
   - Open: `http://localhost:3002/gallery/[galleryId]`
   - You should see the gallery with a "Pay Now" button

3. **Click "Pay Now" Button**
   - Click the payment button
   - **Expected Result:** You should see an error message, NOT be redirected to Stripe

4. **Verify Error Message**
   - **Expected Error:** "The photographer needs to complete their payment setup before you can pay. They have been notified."
   - **Expected Error Code:** `PHOTOGRAPHER_STRIPE_MISSING`
   - Check browser console (F12) for API response

### ✅ Success Criteria:
- [ ] Checkout API returns 400 status
- [ ] Error code is `PHOTOGRAPHER_STRIPE_MISSING`
- [ ] Error message matches expected text
- [ ] No Stripe Checkout session created
- [ ] User cannot proceed with payment

---

## Test Scenario 2: Public Checkout Flow (Destination Charges)

**Objective:** Test end-to-end payment flow for unauthenticated clients.

### Steps:

1. **Prepare Test Gallery**
   - Use photographer ID: `2135ab3a-6237-48b3-9d53-c38d0626b3e4` (has active Stripe Connect)
   - Create or update a gallery with pricing:
     - Shoot Fee: $200.00 (20000 cents)
     - Storage Fee: $100.00 (10000 cents)
     - Total: $300.00 (30000 cents)
   - Note the gallery ID

2. **Navigate to Public Gallery**
   - Open: `http://localhost:3002/gallery/[galleryId]`
   - You should see the gallery with photos and a "Pay Now" button

3. **Click "Pay Now"**
   - Click the payment button
   - **Expected:** Redirected to Stripe Checkout page

4. **Verify Stripe Checkout Page**
   - Check that total amount shows: **$300.00**
   - Product name: **"Photography Services"**
   - Description should show gallery name

5. **Complete Payment with Test Card**
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
   - Click "Pay"

6. **Verify Success Redirect**
   - **Expected:** Redirected back to gallery page
   - URL should include: `?payment=success&session_id=cs_test_...`
   - Success banner should be displayed
   - Photos should now be accessible (no paywall)

7. **Check Stripe CLI Output**
   - Look at the terminal running Stripe CLI
   - **Expected:** You should see webhook event received:
     ```
     [Webhook] Received event: checkout.session.completed (evt_xxx)
     [Webhook] Processing checkout.session.completed evt_xxx
     [Webhook] Processing public gallery checkout for gallery: <gallery_id>
     [Webhook] Commission breakdown (DESTINATION CHARGE - already paid): {
       totalPaid: 30000,
       shootFee: 20000,
       storageFee: 10000,
       photovaultFee: 5000,
       photographerGross: 25000,
       stripeTransferId: 'tr_xxx'
     }
     ```

8. **Verify Database - Gallery**
   - Run this SQL query in Supabase:
     ```sql
     SELECT 
       id,
       gallery_name,
       payment_status,
       paid_at,
       stripe_payment_intent_id
     FROM photo_galleries
     WHERE id = '<gallery_id>';
     ```
   - **Expected:**
     - `payment_status` = `'paid'`
     - `paid_at` = current timestamp
     - `stripe_payment_intent_id` = payment intent ID

9. **Verify Database - Commission**
   - Run this SQL query:
     ```sql
     SELECT 
       id,
       photographer_id,
       gallery_id,
       amount_cents,
       total_paid_cents,
       shoot_fee_cents,
       storage_fee_cents,
       photovault_commission_cents,
       status,
       stripe_transfer_id,
       paid_at,
       created_at
     FROM commissions
     WHERE gallery_id = '<gallery_id>'
     ORDER BY created_at DESC
     LIMIT 1;
     ```
   - **Expected Values:**
     - `status` = `'paid'` (NOT 'pending')
     - `stripe_transfer_id` = transfer ID (not null)
     - `paid_at` = current timestamp
     - `total_paid_cents` = 30000 ($300)
     - `shoot_fee_cents` = 20000 ($200)
     - `storage_fee_cents` = 10000 ($100)
     - `photovault_commission_cents` = 5000 ($50)
     - `amount_cents` = 25000 ($250) - photographer gross

10. **Verify Stripe Dashboard** (Optional but Recommended)
    - Go to: https://dashboard.stripe.com/test/payments
    - Find the payment intent
    - **Expected:**
      - `application_fee_amount` = 5000 ($50)
      - `transfer_data.destination` = `acct_1SYm5G9my0XhgOxd`
      - Transfer appears in photographer's Stripe Express dashboard
      - Transfer amount: ~$247 (after Stripe fees)

### ✅ Success Criteria:
- [ ] Redirected to Stripe Checkout
- [ ] Total amount shows $300.00
- [ ] Payment completes successfully
- [ ] Redirected back with success parameter
- [ ] Webhook received and processed
- [ ] Gallery `payment_status` = 'paid'
- [ ] Commission record created with correct values
- [ ] Commission `status` = 'paid' (not 'pending')
- [ ] `stripe_transfer_id` populated
- [ ] Money appears in photographer's Stripe account

---

## Test Scenario 3: Authenticated Client Checkout Flow

**Objective:** Test checkout flow for logged-in clients.

### Steps:

1. **Log In as Test Client**
   - Create or use an existing client account
   - Log in at: `http://localhost:3002/login`
   - Note the user ID

2. **Link Client to Gallery** (if not already linked)
   - Ensure the test gallery has `client_id` set to your client's ID
   - OR create a gallery with your client as the client

3. **Navigate to Client Gallery Page**
   - Open: `http://localhost:3002/client/gallery/[galleryId]`
   - You should see the gallery with a "Pay Now" button

4. **Click "Pay Now"**
   - Click the payment button
   - **Expected:** Redirected to Stripe Checkout page

5. **Complete Payment**
   - Use same test card: `4242 4242 4242 4242`
   - Complete the checkout

6. **Verify Success Redirect**
   - **Expected:** Redirected to `/client/gallery/[galleryId]?payment=success`
   - Success banner displayed
   - Photos accessible

7. **Verify Database**
   - Check gallery `payment_status` = 'paid'
   - Check commission record created
   - Verify client record linked to user account

### ✅ Success Criteria:
- [ ] Uses `gallery-checkout` endpoint (not `public-checkout`)
- [ ] Client is authenticated
- [ ] Payment completes successfully
- [ ] Success redirect goes to `/client/gallery/[galleryId]`
- [ ] Commission record created correctly

---

## Test Scenario 4: Webhook Verification

**Objective:** Verify webhook correctly processes destination charge payments.

### Steps:

1. **Complete a Test Payment**
   - Use Scenario 2 or 3 to complete a payment
   - Note the payment intent ID from Stripe Checkout URL

2. **Check Stripe CLI Output**
   - Look at terminal running `stripe listen`
   - **Expected Output:**
     ```
     [Webhook] Received event: checkout.session.completed (evt_xxx)
     [Webhook] Processing checkout.session.completed evt_xxx
     [Webhook] Processing public gallery checkout for gallery: <gallery_id>
     [Webhook] Commission breakdown (DESTINATION CHARGE - already paid): {
       totalPaid: 30000,
       shootFee: 20000,
       storageFee: 10000,
       photovaultFee: 5000,
       photographerGross: 25000,
       stripeTransferId: 'tr_xxx'
     }
     [Webhook] Successfully processed checkout.session.completed in Xms
     ```

3. **Check Webhook Logs in Database**
   - Run this SQL query:
     ```sql
     SELECT 
       event_id,
       event_type,
       status,
       processing_time_ms,
       result_message
     FROM webhook_logs
     WHERE event_type = 'checkout.session.completed'
     ORDER BY processed_at DESC
     LIMIT 1;
     ```
   - **Expected:**
     - `status` = 'success'
     - `event_type` = 'checkout.session.completed'
     - `result_message` contains gallery ID

4. **Verify Idempotency**
   - Check `processed_webhook_events` table:
     ```sql
     SELECT 
       stripe_event_id,
       event_type,
       processed_at
     FROM processed_webhook_events
     WHERE event_type = 'checkout.session.completed'
     ORDER BY processed_at DESC
     LIMIT 5;
     ```
   - Each event ID should appear only once

5. **Verify Commission Record**
   - Use the same query from Scenario 2, Step 9
   - Commission should have correct fee breakdown

### ✅ Success Criteria:
- [ ] Webhook event received in Stripe CLI
- [ ] Webhook processed successfully
- [ ] Webhook log entry created in database
- [ ] Commission record created with correct values
- [ ] No duplicate commissions for same payment

---

## Test Scenario 5: Commission API Endpoint

**Objective:** Verify photographer can view their commissions via API.

### Steps:

1. **Get Authentication Token**
   - Log in as test photographer: `2135ab3a-6237-48b3-9d53-c38d0626b3e4`
   - Open browser DevTools (F12) → Application/Storage → Cookies
   - Find the Supabase auth token (usually `sb-<project>-auth-token`)
   - Copy the token value

2. **Make API Call**
   - Open a new terminal or use Postman/curl
   - Run:
     ```bash
     curl -X GET "http://localhost:3002/api/photographer/commissions" \
       -H "Authorization: Bearer <your-auth-token>" \
       -H "Content-Type: application/json"
     ```
   - OR use browser console:
     ```javascript
     fetch('http://localhost:3002/api/photographer/commissions', {
       headers: {
         'Authorization': 'Bearer <your-auth-token>',
         'Content-Type': 'application/json'
       }
     }).then(r => r.json()).then(console.log)
     ```

3. **Verify Response Structure**
   - **Expected Response:**
     ```json
     {
       "commissions": [
         {
           "id": "...",
           "photographer_id": "...",
           "gallery_id": "...",
           "gallery_name": "...",
           "amount_cents": 25000,
           "amount_dollars": 250.00,
           "total_paid_cents": 30000,
           "total_paid_dollars": 300.00,
           "shoot_fee_cents": 20000,
           "storage_fee_cents": 10000,
           "photovault_commission_cents": 5000,
           "status": "paid",
           "stripe_transfer_id": "tr_xxx",
           "paid_at": "2025-12-01T...",
           "created_at": "2025-12-01T..."
         }
       ],
       "totals": {
         "totalEarnings": 250.00,
         "upfrontEarnings": 250.00,
         "monthlyEarnings": 0.00,
         "transactionCount": 1
       },
       "meta": {
         "count": 1,
         "limit": 50,
         "payoutInfo": "Earnings are automatically deposited..."
       }
     }
     ```

4. **Verify Data Accuracy**
   - Check that `status` = `'paid'` (not 'pending')
   - Check that `stripe_transfer_id` is populated
   - Check that dollar amounts are calculated correctly
   - Check that gallery names are included

### ✅ Success Criteria:
- [ ] Returns 200 OK
- [ ] Response includes `commissions` array
- [ ] Response includes `totals` object
- [ ] Commission records have `status: 'paid'`
- [ ] `stripe_transfer_id` populated
- [ ] Dollar amounts calculated correctly
- [ ] Gallery names enriched

---

## Test Scenario 7: Fee Calculation Verification

**Objective:** Verify commission calculations match business model.

### Steps:

For each test case, create a gallery with the specified pricing and complete a payment:

#### Case 1: $200 Shoot + $100 Storage = $300 Total

1. Create gallery with:
   - Shoot Fee: $200.00
   - Storage Fee: $100.00
   - Total: $300.00

2. Complete payment

3. Verify commission record:
   - Client pays: $300.00 ✅
   - Shoot fee: $200.00 → 100% to photographer ✅
   - Storage fee: $100.00 → Split 50/50:
     - Photographer: $50.00 ✅
     - PhotoVault: $50.00 ✅
   - **Photographer gross:** $250.00 ✅
   - **PhotoVault commission:** $50.00 ✅

#### Case 2: $500 Shoot + $200 Storage = $700 Total

1. Create gallery with:
   - Shoot Fee: $500.00
   - Storage Fee: $200.00
   - Total: $700.00

2. Complete payment

3. Verify commission record:
   - Client pays: $700.00 ✅
   - Shoot fee: $500.00 → 100% to photographer ✅
   - Storage fee: $200.00 → Split 50/50:
     - Photographer: $100.00 ✅
     - PhotoVault: $100.00 ✅
   - **Photographer gross:** $600.00 ✅
   - **PhotoVault commission:** $100.00 ✅

#### Case 3: Storage Only ($100)

1. Create gallery with:
   - Shoot Fee: $0.00
   - Storage Fee: $100.00
   - Total: $100.00

2. Complete payment

3. Verify commission record:
   - Client pays: $100.00 ✅
   - Shoot fee: $0.00 ✅
   - Storage fee: $100.00 → Split 50/50:
     - Photographer: $50.00 ✅
     - PhotoVault: $50.00 ✅
   - **Photographer gross:** $50.00 ✅
   - **PhotoVault commission:** $50.00 ✅

### ✅ Success Criteria:
- [ ] All calculations match expected values
- [ ] Commission records have correct fee breakdown
- [ ] Stripe `application_fee_amount` equals PhotoVault commission
- [ ] Photographer receives correct amount after Stripe fees

---

## Test Scenario 8: Edge Cases

**Objective:** Test error handling and edge cases.

### 8.1: Duplicate Webhook Events

1. **Simulate Duplicate Webhook** (if possible):
   - Stripe may send duplicate webhooks
   - Check `processed_webhook_events` table for idempotency
   - **Expected:** Same event ID should not create duplicate commissions

2. **Verify Idempotency Check:**
   ```sql
   SELECT 
     stripe_event_id,
     COUNT(*) as count
   FROM processed_webhook_events
   GROUP BY stripe_event_id
   HAVING COUNT(*) > 1;
   ```
   - Should return 0 rows (no duplicates)

### 8.2: Missing Metadata

1. **Check Webhook Handler:**
   - Review `src/app/api/webhooks/stripe/route.ts`
   - Verify it handles missing metadata gracefully
   - **Expected:** Should log error but not fail webhook (return 200 to Stripe)

### 8.3: Payment Intent Retrieval Failure

1. **Test Scenario:**
   - This is hard to simulate, but verify code handles it:
   - Check `handleCheckoutCompleted()` function
   - If `stripe.paymentIntents.retrieve()` fails, commission should still be created
   - `stripe_transfer_id` may be null in this case

### 8.4: Database Insert Failure

1. **Verify Error Handling:**
   - Check webhook handler logs errors but returns 200 to Stripe
   - This prevents Stripe from retrying indefinitely
   - Errors should be logged to `webhook_logs` table

### ✅ Success Criteria:
- [ ] Idempotency prevents duplicate commissions
- [ ] Missing metadata handled gracefully
- [ ] Payment intent retrieval failure doesn't break webhook
- [ ] Database insert failures logged but don't break webhook

---

## Testing Checklist Summary

After completing all scenarios, verify:

- [ ] Scenario 1: Payment blocked when photographer missing Stripe Connect ✅
- [ ] Scenario 2: Public checkout flow works end-to-end
- [ ] Scenario 3: Authenticated checkout flow works
- [ ] Scenario 4: Webhook processes events correctly
- [ ] Scenario 5: Commission API returns correct data
- [ ] Scenario 6: Database queries use correct table/columns ✅
- [ ] Scenario 7: Fee calculations match business model
- [ ] Scenario 8: Edge cases handled gracefully

---

## Troubleshooting

### Webhook Not Receiving Events
- Check Stripe CLI is running: `stripe listen --forward-to localhost:3002/api/webhooks/stripe`
- Verify webhook signing secret in `.env.local`
- Check Stripe CLI output for connection status

### Payment Fails
- Verify Stripe test mode keys are in `.env.local`
- Check browser console for errors
- Verify photographer has active Stripe Connect account

### Commission Not Created
- Check webhook logs in database
- Verify webhook handler processed event
- Check for errors in webhook_logs table

### API Returns 401 Unauthorized
- Verify auth token is valid
- Check token hasn't expired
- Ensure user is logged in as photographer

---

**Good luck with testing!** 🚀

