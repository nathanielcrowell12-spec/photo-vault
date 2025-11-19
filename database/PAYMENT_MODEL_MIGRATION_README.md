# Payment Model Database Migration Guide

**Date:** November 15, 2025
**Migration File:** `payment-model-migration.sql`
**Specification:** `C:\Users\natha\Stone-Fence-Brain\PHOTOVAULT_PAYMENT_MODEL_SCHEMA_CHANGES.md`

---

## Overview

This migration transforms PhotoVault from a simple gallery storage platform into a **complete payment processor** for photographers, handling shoot fees, storage packages, and ongoing monthly billing.

### Key Changes

1. **Primary Photographer Tracking** - ONE CLIENT = ONE PRIMARY PHOTOGRAPHER earning monthly commission
2. **Payment Package System** - $20, $50, $100 upfront packages with 50/50 revenue split
3. **Shoot Fee Processing** - 100% pass-through to photographers (minus Stripe fees)
4. **Monthly Billing** - $8/month recurring payments (never pauses once started)
5. **Photographer Succession** - Automatic reassignment when photographers leave
6. **Orphan Protocol** - PhotoVault retains 100% revenue when no photographers remain
7. **2-Week Payout Delay** - Risk mitigation for payment processing
8. **Stripe Connect Integration** - Photographer payout infrastructure

---

## Migration Phases

### Phase 1: Modify Existing Tables ✅
- `clients` - Add primary photographer tracking
- `payment_options` - Add package type fields
- `client_payments` - Add shoot fee itemization
- `client_invitations` - Add package selection
- `photographers` - Add Stripe Connect fields
- `photo_galleries` - Add sneak peek and status tracking

### Phase 2: Create New Tables ✅
- `photographer_succession_log` - Audit trail for primary changes
- `monthly_billing_schedule` - Track $8/month recurring billing
- `photographer_payouts` - Track photographer earnings with 2-week delay

### Phase 3: Create Database Functions ✅
- `set_primary_photographer()` - Auto-set on client signup (BEFORE trigger)
- `log_primary_photographer()` - Log initial assignment (AFTER trigger)
- `handle_photographer_succession()` - Reassign when photographer leaves
- `calculate_photographer_payout()` - Calculate payouts with commissions

### Phase 4: Update Payment Options ✅
- Delete old incorrect payment options
- Insert correct $20, $50, $100 packages
- Insert monthly and reactivation options

---

## Pre-Migration Checklist

- [ ] **Backup Production Database** - Critical!
- [ ] **Test on Development First** - Never run migrations directly on production
- [ ] **Review Specification** - Read `PHOTOVAULT_PAYMENT_MODEL_SCHEMA_CHANGES.md`
- [ ] **Verify Supabase Access** - Ensure you have admin credentials
- [ ] **Stop Background Jobs** - Pause any cron jobs that might conflict
- [ ] **Notify Team** - Alert team members of scheduled migration

---

## How to Run Migration

### Option 1: Supabase Dashboard (Recommended for Development)

1. Navigate to Supabase Dashboard → SQL Editor
2. Copy entire contents of `payment-model-migration.sql`
3. Paste into SQL editor
4. **Review carefully** - Read each section
5. Click "Run" to execute
6. Review output for errors
7. Run verification queries at end of file

### Option 2: Supabase CLI

```bash
# Navigate to project directory
cd "C:\Users\natha\.cursor\Photo Vault\photovault-hub"

# Run migration (development)
npx supabase db push

# Or apply specific migration file
psql $DATABASE_URL -f database/payment-model-migration.sql
```

### Option 3: psql Command Line

```bash
# Connect to database
psql postgresql://postgres:[password]@[host]:5432/postgres

# Run migration
\i database/payment-model-migration.sql

# Verify
\dt  -- List tables
\df  -- List functions
```

---

## Post-Migration Verification

### 1. Verify Tables Created

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'photographer_succession_log',
    'monthly_billing_schedule',
    'photographer_payouts'
  );
```

**Expected:** All 3 tables listed

### 2. Verify Columns Added to clients

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
  AND column_name IN (
    'primary_photographer_id',
    'became_primary_at',
    'is_orphaned',
    'orphaned_at',
    'client_type'
  )
ORDER BY column_name;
```

**Expected:** All 5 columns listed

### 3. Verify Payment Options

```sql
SELECT id, name, price, package_type, free_months, is_first_gallery_only
FROM payment_options
ORDER BY
  CASE package_type
    WHEN 'service_fee' THEN 1
    WHEN 'prepaid' THEN 2
    WHEN 'monthly' THEN 3
    WHEN 'reactivation' THEN 4
  END,
  price;
```

**Expected:** 7 payment options:
- service_fee_20 ($20)
- prepaid_6mo ($50)
- prepaid_1yr ($100)
- monthly_ongoing ($8)
- reactivation_download ($20)
- reactivation_6mo ($70)
- reactivation_1yr ($120)

### 4. Verify Functions Created

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'set_primary_photographer',
    'log_primary_photographer',
    'handle_photographer_succession',
    'calculate_photographer_payout'
  );
```

**Expected:** All 4 functions listed

### 5. Verify Triggers Created

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_set_primary_photographer',
  'trigger_log_primary_photographer'
);
```

**Expected:** 2 triggers on `clients` table

### 6. Test Primary Photographer Auto-Assignment

```sql
-- Insert test client (will be cleaned up)
INSERT INTO clients (photographer_id, email, name)
VALUES (
  (SELECT id FROM photographers LIMIT 1),
  'test@example.com',
  'Test Client'
)
RETURNING id, photographer_id, primary_photographer_id, became_primary_at;
```

**Expected:**
- `primary_photographer_id` should equal `photographer_id`
- `became_primary_at` should be current timestamp

**Cleanup:**
```sql
DELETE FROM clients WHERE email = 'test@example.com';
DELETE FROM photographer_succession_log WHERE notes LIKE '%Test Client%';
```

---

## Data Backfill (For Existing Records)

### Backfill Existing client_payments

If you have existing `client_payments` records without the new fields:

```sql
-- Update existing payments to populate new fields
UPDATE client_payments
SET
  storage_fee = amount_paid,  -- Assume all was storage fee
  total_amount = amount_paid,
  photographer_payout = amount_paid * 0.50,  -- 50% commission
  photovault_revenue = amount_paid * 0.50,
  is_first_gallery = TRUE,  -- Assume first gallery
  has_prepaid_period = TRUE
WHERE storage_fee IS NULL;
```

### Backfill Existing clients with primary_photographer_id

```sql
-- Set primary photographer for existing clients
UPDATE clients
SET
  primary_photographer_id = photographer_id,
  became_primary_at = created_at
WHERE primary_photographer_id IS NULL
  AND photographer_id IS NOT NULL;

-- Log succession for backfilled clients
INSERT INTO photographer_succession_log (
  client_id,
  new_primary_photographer_id,
  succession_reason,
  notes
)
SELECT
  id,
  primary_photographer_id,
  'initial_signup',
  'Backfilled during migration'
FROM clients
WHERE primary_photographer_id IS NOT NULL
  AND id NOT IN (SELECT client_id FROM photographer_succession_log);
```

---

## Rollback Plan (Emergency Only)

⚠️ **WARNING:** Rollback will lose new data. Only use if migration fails critically.

```sql
-- Phase 1: Drop new tables
DROP TABLE IF EXISTS photographer_payouts CASCADE;
DROP TABLE IF EXISTS monthly_billing_schedule CASCADE;
DROP TABLE IF EXISTS photographer_succession_log CASCADE;

-- Phase 2: Drop new columns from clients
ALTER TABLE clients
DROP COLUMN IF EXISTS primary_photographer_id,
DROP COLUMN IF EXISTS became_primary_at,
DROP COLUMN IF EXISTS is_orphaned,
DROP COLUMN IF EXISTS orphaned_at,
DROP COLUMN IF EXISTS client_type;

-- Phase 3: Drop new columns from photographers
ALTER TABLE photographers
DROP COLUMN IF EXISTS stripe_connect_account_id,
DROP COLUMN IF EXISTS stripe_connect_status,
DROP COLUMN IF EXISTS stripe_connect_onboarded_at,
DROP COLUMN IF EXISTS bank_account_verified,
DROP COLUMN IF EXISTS can_receive_payouts,
DROP COLUMN IF EXISTS next_payout_date,
DROP COLUMN IF EXISTS pending_balance,
DROP COLUMN IF EXISTS available_balance;

-- Phase 4: Drop new columns from client_payments
ALTER TABLE client_payments
DROP COLUMN IF EXISTS shoot_fee,
DROP COLUMN IF EXISTS storage_fee,
DROP COLUMN IF EXISTS service_fee,
DROP COLUMN IF EXISTS total_amount,
DROP COLUMN IF EXISTS photographer_payout,
DROP COLUMN IF EXISTS photovault_revenue,
DROP COLUMN IF EXISTS is_reactivation,
DROP COLUMN IF EXISTS is_first_gallery,
DROP COLUMN IF EXISTS monthly_billing_starts_at,
DROP COLUMN IF EXISTS has_prepaid_period,
DROP COLUMN IF EXISTS stripe_payment_intent_id,
DROP COLUMN IF EXISTS stripe_charge_id;

-- Phase 5: Drop new columns from photo_galleries
ALTER TABLE photo_galleries
DROP COLUMN IF EXISTS shoot_fee,
DROP COLUMN IF EXISTS payment_option_id,
DROP COLUMN IF EXISTS total_amount,
DROP COLUMN IF EXISTS gallery_status,
DROP COLUMN IF EXISTS sneak_peek_photo_ids,
DROP COLUMN IF EXISTS email_sent_at,
DROP COLUMN IF EXISTS reminder_emails_stopped,
DROP COLUMN IF EXISTS reminder_stop_date,
DROP COLUMN IF EXISTS days_since_ready;

-- Phase 6: Drop functions
DROP FUNCTION IF EXISTS calculate_photographer_payout CASCADE;
DROP FUNCTION IF EXISTS handle_photographer_succession CASCADE;
DROP FUNCTION IF EXISTS log_primary_photographer CASCADE;
DROP FUNCTION IF EXISTS set_primary_photographer CASCADE;

-- Phase 7: Restore old payment options (if backed up)
-- You'll need to manually restore from backup

-- Phase 8: Restore photographer_id NOT NULL constraint
ALTER TABLE clients
ALTER COLUMN photographer_id SET NOT NULL;
```

---

## Common Issues & Solutions

### Issue: "photographer_id cannot be null"

**Cause:** Trying to make `photographer_id` nullable but existing data has NULL values
**Solution:** Backfill NULL values first:
```sql
-- Find and fix NULL photographer_id values
UPDATE clients
SET photographer_id = (SELECT id FROM photographers LIMIT 1)
WHERE photographer_id IS NULL;
```

### Issue: "payment_options foreign key constraint fails"

**Cause:** Old payment option IDs referenced in `client_payments` or `photo_galleries`
**Solution:** Update references before deleting:
```sql
-- Find orphaned references
SELECT DISTINCT payment_option_id FROM client_payments WHERE payment_option_id NOT IN (SELECT id FROM payment_options);

-- Map old IDs to new IDs (adjust as needed)
UPDATE client_payments SET payment_option_id = 'prepaid_6mo' WHERE payment_option_id = 'old_option_id';
```

### Issue: "function already exists"

**Cause:** Running migration twice
**Solution:** Functions use `CREATE OR REPLACE` - safe to re-run

### Issue: Triggers not firing

**Cause:** Trigger order or conflict with other triggers
**Solution:** Check trigger order:
```sql
SELECT trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'clients'
ORDER BY action_timing, action_order;
```

---

## Next Steps After Migration

1. **Update Application Code**
   - [ ] Update gallery creation form to include shoot fee input
   - [ ] Update payment flow to use new payment_options
   - [ ] Implement sneak peek selection interface
   - [ ] Build unpaid galleries dashboard
   - [ ] Integrate Stripe Connect for photographer payouts

2. **Set Up Cron Jobs**
   - [ ] Daily: Update `days_since_ready` counter
   - [ ] Weekly: Send reminder emails for unpaid galleries
   - [ ] Daily: Process pending photographer payouts (where `payout_eligible_date <= NOW()`)
   - [ ] Monthly: Process $8/month recurring billing

3. **Configure Stripe**
   - [ ] Set up Stripe Connect platform
   - [ ] Configure webhook endpoints
   - [ ] Test payment flow end-to-end
   - [ ] Set up payout automation

4. **Test Payment Flows**
   - [ ] Create test gallery with $20 package
   - [ ] Create test gallery with $100 package
   - [ ] Test photographer succession
   - [ ] Test orphan protocol
   - [ ] Test 2-week payout delay

5. **Monitor & Optimize**
   - [ ] Add monitoring for failed payouts
   - [ ] Track commission calculations
   - [ ] Monitor succession events
   - [ ] Review orphaned clients weekly

---

## Support & Resources

- **Specification:** `C:\Users\natha\Stone-Fence-Brain\PHOTOVAULT_PAYMENT_MODEL_SCHEMA_CHANGES.md`
- **Feature Spec:** `C:\Users\natha\Stone-Fence-Brain\SHARE_GALLERIES_COMPLETE_SPECIFICATION.md`
- **Migration File:** `C:\Users\natha\.cursor\Photo Vault\photovault-hub\database\payment-model-migration.sql`
- **Supabase Docs:** https://supabase.com/docs/guides/database
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

## Migration Status

- [x] Migration script created
- [ ] Tested on development database
- [ ] Data backfill completed
- [ ] Verified all functions working
- [ ] Tested photographer succession
- [ ] Application code updated
- [ ] Tested on staging
- [ ] Deployed to production
- [ ] Post-migration verification completed
- [ ] Team notified of changes

---

**Last Updated:** November 15, 2025
**Migration Created By:** Claude Code
**Review Status:** Pending human review before execution
