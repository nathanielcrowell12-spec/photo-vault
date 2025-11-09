# 🎯 Stripe Setup - Step-by-Step Instructions
**Follow these exact steps for PhotoVault**

---

## ✅ STEP 1: Get Your Stripe Test API Keys (5 minutes)

### 1.1 Open Stripe Dashboard
1. Go to: **https://dashboard.stripe.com**
2. Log in with your Stripe account
3. Look at the **top-right corner** of the page

### 1.2 Switch to Test Mode
You'll see a toggle that says either "Test mode" or "Live mode"
- If it says **"Live mode"**, click it to switch to **"Test mode"**
- The page will reload and show "Test mode" with an orange indicator
- ⚠️ **Important**: Always use Test mode for development!

### 1.3 Navigate to API Keys
1. On the left sidebar, click **"Developers"**
2. In the dropdown/submenu, click **"API keys"**
3. You should now see a page titled "API keys"

### 1.4 Copy Your Secret Key
1. Find the section labeled **"Secret key"**
2. You'll see text that says `sk_test_•••••••••••••••••••••••••••`
3. Click the **"Reveal test key"** button (or click on the key itself)
4. The full key will appear (starts with `sk_test_`)
5. Click the **copy icon** next to the key

### 1.5 Copy Your Publishable Key
1. Scroll up to the section labeled **"Publishable key"**
2. You'll see text that starts with `pk_test_`
3. This key is already visible
4. Click the **copy icon** next to the key

### 1.6 Update Your .env.local File
1. In VS Code (or Cursor), open: `photovault-hub/.env.local`
2. Find these lines:
```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

3. Replace `sk_test_your_key_here` with the Secret key you copied
4. Replace `pk_test_your_key_here` with the Publishable key you copied
5. **Save the file** (Ctrl+S or Cmd+S)

**Your .env.local should now look like:**
```bash
STRIPE_SECRET_KEY=sk_test_51Abc123DEFghiJKL...actual_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Xyz789ABCdefGHI...actual_key_here
```

✅ **Step 1 Complete!** You now have your API keys configured.

---

## ✅ STEP 2: Create Photographer Subscription Product (10 minutes)

### 2.1 Navigate to Products
1. In Stripe Dashboard, click **"Products"** in the left sidebar
2. You'll see a page titled "Products" (might be empty if new account)

### 2.2 Create New Product
1. Click the blue **"+ Add product"** button (top-right)
2. A form will appear

### 2.3 Fill in Product Details
**In the form that appears:**

**Product information:**
- **Name**: Type exactly: `Photographer Pro Subscription`
- **Description**: Type:
  ```
  PhotoVault professional subscription for photographers - unlimited galleries, analytics, and commission tracking. Earn $50 upfront + $4/month per client.
  ```
- **Image**: Skip for now (optional)

**Pricing:**
- **Pricing model**: Make sure **"Standard pricing"** is selected (should be default)
- **Price**: Type `22` (it will show as $22.00)
- **Currency**: Should be **USD** (or your currency)
- **Billing period**: Click the dropdown and select **"Monthly"**

**Free trial:**
- Look for a section that says **"Include a free trial"** or **"Free trial period"**
- Click the checkbox to enable it
- Enter `14` for the number of days
- Select **"days"** from the dropdown

### 2.4 Save the Product
1. Scroll down and click the blue **"Add product"** button
2. You'll be taken to the product page

### 2.5 Copy the Price ID
After the page loads:
1. Look for a section called **"Pricing"** or **"API ID"**
2. You'll see something like: `price_1Abc123xyz...`
3. Click the **copy icon** next to it
4. **IMPORTANT**: Paste this somewhere safe (Notepad, Notes app, etc.)
5. Label it: `Photographer Price ID`

✅ **Step 2 Complete!** Photographer subscription created.

---

## ✅ STEP 3: Create Client Subscription Product (15 minutes)

### 3.1 Create the Product
1. Go back to **Products** (left sidebar)
2. Click **"+ Add product"** again

### 3.2 Fill in Product Details
**Product information:**
- **Name**: Type: `Client Annual Subscription`
- **Description**: Type:
  ```
  PhotoVault client subscription - permanent access to all photos from photographers, import tools, timeline view, and mobile uploads. First year free with photographer invitation.
  ```

**Pricing (for Year 2+ - Monthly Recurring):**
- **Pricing model**: **"Standard pricing"**
- **Price**: Type `8` (will show as $8.00)
- **Currency**: **USD**
- **Billing period**: **"Monthly"**

**Free trial:**
- ✅ Enable **"Include a free trial"**
- Enter `365` days (1 year - this covers Year 1 that they already paid for)

### 3.3 Save the Product
1. Click **"Add product"**
2. Wait for the product page to load

### 3.4 Copy the First Price ID
1. Find the **"Pricing"** section
2. Copy the price ID (starts with `price_...`)
3. **Save it** and label: `Client Monthly Price ID (Year 2+)`

### 3.5 Add the One-Time Year 1 Price
Now we need to add the $100 upfront option:

1. On the same product page, scroll to **"Pricing"** section
2. Click **"Add another price"** button

### 3.6 Configure One-Time Price
**In the form:**
- **Pricing model**: **"Standard pricing"**
- **Price**: Type `100` ($100.00)
- **Currency**: **USD**
- **Billing period**: Select **"One time"** from dropdown

### 3.7 Save the One-Time Price
1. Click **"Add price"** or **"Save"**
2. The page will reload showing both prices now

### 3.8 Copy the Second Price ID
1. Find the new price (the $100 one-time)
2. Copy its price ID
3. **Save it** and label: `Client One-Time Price ID (Year 1)`

**You should now have saved:**
```
Photographer Price ID: price_abc123...
Client Monthly Price ID: price_def456...
Client One-Time Price ID: price_ghi789...
```

✅ **Step 3 Complete!** Client subscription created with both pricing options.

---

## ✅ STEP 4: Set Up Webhook Endpoint (10 minutes)

### 4.1 Navigate to Webhooks
1. In left sidebar, click **"Developers"**
2. Click **"Webhooks"**
3. You'll see "Webhooks" page (probably empty)

### 4.2 Add Endpoint
1. Click **"Add endpoint"** button (or **"+ Add hosted endpoint"**)
2. A form will appear

### 4.3 Configure Endpoint URL
**For now (local testing), skip this step - we'll use Stripe CLI instead**

Just close this form or click Cancel. We'll set this up for production later.

For local testing, we'll use the Stripe CLI which gives us a webhook URL automatically.

✅ **Step 4 Complete!** (We'll finish this with Stripe CLI next)

---

## ✅ STEP 5: Install and Set Up Stripe CLI (15 minutes)

### 5.1 Download Stripe CLI

**For Windows:**
1. Go to: **https://github.com/stripe/stripe-cli/releases/latest**
2. Scroll down to **"Assets"** section
3. Download: `stripe_X.X.X_windows_x86_64.zip` (where X.X.X is version number)
4. Save to Downloads folder

### 5.2 Extract the Files
1. Go to your Downloads folder
2. Right-click on the `stripe_X.X.X_windows_x86_64.zip` file
3. Choose **"Extract All..."**
4. Extract to: `C:\stripe\` (create this folder if needed)
5. You should now have `C:\stripe\stripe.exe`

### 5.3 Add to PATH (so you can use it from anywhere)

**Option A: Simple Way**
1. Press `Windows Key + R`
2. Type: `cmd`
3. Press Enter
4. In the command prompt, type:
```bash
cd C:\stripe
stripe --version
```

If you see a version number, it works! Skip to 5.4.

**Option B: Add to System PATH (recommended)**
1. Press `Windows Key`
2. Type: `environment variables`
3. Click **"Edit the system environment variables"**
4. Click **"Environment Variables..."** button
5. Under **"System variables"**, find **"Path"**
6. Click **"Edit..."**
7. Click **"New"**
8. Type: `C:\stripe`
9. Click **"OK"** on all windows
10. **Close and reopen** any terminal/command prompt windows

### 5.4 Verify Installation
1. Open a **new** Command Prompt or Terminal
2. Type:
```bash
stripe --version
```

You should see: `stripe version X.X.X`

✅ If you see the version, Stripe CLI is installed!

### 5.5 Login to Stripe CLI
1. In your terminal, type:
```bash
stripe login
```

2. Press **Enter**
3. Your web browser will open automatically
4. You'll see a page asking to authorize Stripe CLI
5. Click **"Allow access"**
6. Return to your terminal

You should see: `Done! The Stripe CLI is configured...`

✅ **Step 5 Complete!** Stripe CLI is ready.

---

## ✅ STEP 6: Start Webhook Listener and Get Secret (5 minutes)

### 6.1 Open a New Terminal Window
Keep your existing terminals open, open a NEW one:
- Windows: Search for "Command Prompt" or "Terminal"
- Or in VS Code: Terminal → New Terminal

### 6.2 Start the Webhook Listener
In the new terminal, type:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Press **Enter**

### 6.3 Look for the Webhook Secret
You'll see output that looks like:
```
> Ready! Your webhook signing secret is whsec_abc123xyz...
> Listening for events...
```

### 6.4 Copy the Webhook Secret
1. Select the text starting with `whsec_` (the whole thing)
2. Copy it (Ctrl+C or right-click → Copy)

### 6.5 Update .env.local
1. Open `photovault-hub/.env.local`
2. Find the line:
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

3. Replace `whsec_your_secret_here` with the secret you just copied
4. **Save the file** (Ctrl+S)

**Your .env.local should now look like:**
```bash
STRIPE_SECRET_KEY=sk_test_51Abc123...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Xyz789...
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### 6.6 Keep This Terminal Open
**⚠️ IMPORTANT**: Don't close this terminal window!
- This needs to keep running while you're testing
- You'll see webhook events appear here when they're triggered

✅ **Step 6 Complete!** Webhook listener is running.

---

## ✅ STEP 7: Restart Your Dev Server (2 minutes)

### 7.1 Stop the Current Dev Server
1. Find the terminal where `npm run dev` is running
2. Press **Ctrl+C** to stop it
3. Wait for it to fully stop

### 7.2 Start Dev Server Again
In the same terminal, type:
```bash
cd "C:\Users\natha\.cursor\Photo Vault\photovault-hub"
npm run dev
```

Press **Enter**

### 7.3 Wait for It to Start
You should see:
```
✓ Ready in Xs
○ Compiling...
✓ Compiled in Xms
```

And eventually:
```
▲ Next.js 15.5.4 (Turbopack)
- Local:        http://localhost:3000
```

(Or might be 3002 if 3000 is taken)

✅ **Step 7 Complete!** Dev server is running with new environment variables.

---

## ✅ STEP 8: Test the Webhook Integration (5 minutes)

### 8.1 Open Another New Terminal
You should now have 3 terminals open:
1. **Stripe CLI webhook listener** (from Step 6)
2. **Dev server** (`npm run dev`)
3. **New terminal** for testing (this one)

### 8.2 Trigger a Test Event
In the new terminal, type:
```bash
stripe trigger checkout.session.completed
```

Press **Enter**

### 8.3 Watch What Happens

**In Terminal #1 (Stripe CLI):**
You should see:
```
2025-11-03 10:30:45   --> checkout.session.completed
2025-11-03 10:30:45   <--  [200] POST http://localhost:3000/api/webhooks/stripe
```

**In Terminal #2 (Dev Server):**
You should see logs about processing the webhook

### 8.4 Check the Database
Open Supabase Dashboard:
1. Go to: **https://supabase.com/dashboard**
2. Select your PhotoVault project
3. Click **"SQL Editor"** (left sidebar)
4. Type this query:
```sql
SELECT * FROM webhook_logs ORDER BY processed_at DESC LIMIT 5;
```
5. Click **"Run"**

**Expected Result:**
You should see a row with:
- `event_type: checkout.session.completed`
- `status: success`
- `processing_time_ms: some number`

✅ **If you see this, your webhook is working perfectly!**

### 8.5 Test More Events (Optional)
Try triggering other events:
```bash
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

Check webhook_logs after each one.

✅ **Step 8 Complete!** Webhooks are fully functional!

---

## ✅ STEP 9: Run Database Migration (10 minutes)

### 9.1 Open Supabase Dashboard
1. Go to: **https://supabase.com/dashboard**
2. Click on your PhotoVault project
3. Wait for it to load

### 9.2 Navigate to SQL Editor
1. In left sidebar, click **"SQL Editor"**
2. You'll see the SQL Editor page

### 9.3 Open the Migration File
In VS Code/Cursor:
1. Open file: `database/webhook-tables.sql`
2. Select **ALL** the contents (Ctrl+A or Cmd+A)
3. Copy it (Ctrl+C or Cmd+C)

### 9.4 Create New Query in Supabase
1. In Supabase SQL Editor, click **"New query"** button
2. A blank query editor will appear
3. Paste the migration SQL (Ctrl+V or Cmd+V)

### 9.5 Run the Migration
1. Review the SQL (should be about 400+ lines)
2. Click the green **"Run"** button (or press Ctrl+Enter)
3. Wait for it to execute (may take 10-30 seconds)

### 9.6 Check for Success
At the bottom of the editor, you should see:
```
Success. No rows returned
```

And at the very end, you should see output like:
```
NOTICE: ==============================================
NOTICE: Stripe Webhook Tables Migration Complete!
NOTICE: ==============================================
NOTICE: Tables created:
NOTICE:   ✓ subscriptions
...
```

✅ **If you see this, migration succeeded!**

### 9.7 Verify Tables Were Created
Create a new query and run:
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

**Expected Result:** You should see 6 rows, one for each table.

✅ **Step 9 Complete!** Database is ready for webhooks.

---

## ✅ STEP 10: Test End-to-End (Optional but Recommended)

### 10.1 Test Token Balance Function
In Supabase SQL Editor, run:
```sql
-- First, get a user ID
SELECT id, email FROM users LIMIT 1;
```

Copy the `id` value (it's a UUID)

### 10.2 Test Adding Tokens
Replace `YOUR_USER_ID` with the actual UUID:
```sql
SELECT add_tokens_to_balance(
  'YOUR_USER_ID'::uuid,
  100,
  'test_payment_intent_123'
);
```

Run it. Should return: `Success. No rows returned`

### 10.3 Verify Balance Updated
```sql
SELECT id, email, token_balance FROM users WHERE id = 'YOUR_USER_ID'::uuid;
```

**Expected:** `token_balance` should now be `100` (or 100 more than it was)

### 10.4 Check Transaction Record
```sql
SELECT * FROM token_transactions ORDER BY created_at DESC LIMIT 1;
```

Should show your test transaction.

✅ **Step 10 Complete!** Everything is working end-to-end!

---

## 🎉 YOU'RE DONE!

### What You've Accomplished:
✅ Stripe API keys configured
✅ Photographer subscription product created ($22/month)
✅ Client subscription products created ($100 one-time + $8/month)
✅ Stripe CLI installed and authenticated
✅ Webhook listener running locally
✅ Database migration completed (6 tables, 4 functions)
✅ Webhooks tested and confirmed working
✅ Token balance functions tested

### Your System is Now:
- ✅ Ready to accept real test payments
- ✅ Processing webhooks automatically
- ✅ Updating database when payments occur
- ✅ Tracking subscriptions and token balances

---

## 🚀 Next Steps

### For Continued Testing:
1. Keep the Stripe CLI listener running while testing
2. Keep your dev server running
3. Trigger test events or create test checkouts
4. Monitor webhook_logs table

### Before Production:
1. Create products in Stripe **Live mode** (not Test)
2. Create production webhook endpoint (your real domain)
3. Add live API keys to Vercel
4. Run migration in production Supabase
5. Test with real (small) payment

### To Stop Testing:
1. Press Ctrl+C in Stripe CLI terminal (stops webhook listener)
2. Press Ctrl+C in dev server terminal (stops server)

---

## 📋 Your Price IDs Reference

**Keep these saved - you'll need them in your code:**

```typescript
// Add these to your checkout/subscription creation code

const STRIPE_PRICE_IDS = {
  photographer_monthly: 'price_...',  // $22/month (from Step 2)
  client_monthly: 'price_...',        // $8/month Year 2+ (from Step 3.4)
  client_onetime: 'price_...',        // $100 Year 1 (from Step 3.8)
}
```

---

## 🆘 Troubleshooting

**"Command not found: stripe"**
→ Stripe CLI not in PATH. Use `cd C:\stripe` then `.\stripe.exe` instead of just `stripe`

**"Webhook signature verification failed"**
→ Make sure you copied the `whsec_...` secret from Step 6 correctly to `.env.local`

**"Connection refused" when triggering webhook**
→ Make sure dev server is running on localhost:3000 (or 3002)

**"Table already exists" error**
→ Migration already run. That's OK, skip Step 9.

**Webhook listener keeps disconnecting**
→ Normal if inactive for long time. Just restart it: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---

**Setup Complete!** 🎊
**Time Taken:** ~1 hour
**Status:** Production-Ready (for test mode)

Need help with any step? Just ask!
