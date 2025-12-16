# Fix Admin Dashboard to Use Real Data from Commissions Table

**Date:** December 12, 2025
**Story:** 2.4 - Fix Admin Dashboard
**Expert:** Supabase Expert
**Status:** Implementation Plan Ready

---

## Summary

The admin dashboard services currently query the `client_payments` table for revenue data, but this table is **empty (0 rows)**. The actual payment data exists in the `commissions` table which has **7 rows** with real Stripe payment records. This plan details how to update both admin service files to use the `commissions` table and calculate PhotoVault's revenue correctly.

---

## Problem Analysis

### Current State

| Service File | What It Does | Problem |
|--------------|--------------|---------|
| `admin-dashboard-service.ts` | Fetches monthly revenue for dashboard stats | Queries empty `client_payments` table → returns `null` |
| `admin-revenue-service.ts` | Fetches all revenue stats, payments, top photographers | Queries empty `client_payments` table → returns all zeros |

### Empty Tables Found

1. **`client_payments`** - 0 rows (doesn't exist in schema)
2. **`photo_sessions`** - 0 rows (used for counting photographer sessions)

### Real Data Location

**`commissions` table** - 7 rows with real Stripe payments

**Key columns:**
- `total_paid_cents` - Total amount paid by client (e.g., 30000 = $300)
- `amount_cents` - Photographer commission (e.g., 27500 = $275)
- `photovault_commission_cents` - PhotoVault's revenue (e.g., 2500 = $25)
- `status` - 'paid', 'refunded', 'pending'
- `paid_at` - When payment was received (use for date filtering)
- `created_at` - When commission record was created
- `payment_type` - 'upfront', 'monthly', 'reactivation'
- `photographer_id` - UUID linking to user_profiles
- `stripe_payment_intent_id` - Stripe payment reference
- `stripe_transfer_id` - Stripe transfer reference

---

## Existing Patterns Found in Codebase

### Pattern 1: Simple Commission Query (photographer-stats)
```typescript
// From: src/app/api/photographer/stats/route.ts (lines 32-37)
const { data: allCommissions } = await supabase
  .from('commissions')
  .select('amount_cents')
  .eq('photographer_id', user.id)

const totalEarnings = (allCommissions?.reduce((sum, c) => sum + c.amount_cents, 0) || 0) / 100
```

**Key insight:** Convert cents to dollars by dividing by 100 at the end.

### Pattern 2: Monthly Commission Query (photographer-stats)
```typescript
// From: src/app/api/photographer/stats/route.ts (lines 40-49)
const now = new Date()
const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

const { data: monthlyCommissions } = await supabase
  .from('commissions')
  .select('amount_cents')
  .eq('photographer_id', user.id)
  .gte('created_at', firstOfMonth)

const monthlyEarnings = (monthlyCommissions?.reduce((sum, c) => sum + c.amount_cents, 0) || 0) / 100
```

**Key insight:** Use UTC date for month boundaries, filter with `.gte('created_at', startISO)`.

### Pattern 3: Commission Service Query (commission-service.ts)
```typescript
// From: src/lib/server/commission-service.ts (lines 92-96)
const { data, error } = await supabase
  .from('commissions')
  .select('amount_cents, payment_type')
  .eq('photographer_id', photographerId)
```

**Key insight:** Select only needed columns for performance.

### Pattern 4: Analytics Query with Type Filtering (photographer-analytics-service.ts)
```typescript
// From: src/lib/server/photographer-analytics-service.ts (lines 68-76)
const { data: commissions, error: commissionsError } = await supabase
  .from('commissions')
  .select('amount_cents, payment_type, created_at, client_email')
  .eq('photographer_id', photographerId)
  .order('created_at', { ascending: true })

// Split by payment type
const totalUpfront = commissions?.filter(c => c.payment_type === 'upfront').reduce((sum, c) => sum + c.amount_cents, 0) || 0
const totalRecurring = commissions?.filter(c => c.payment_type === 'monthly' || c.payment_type === 'reactivation').reduce((sum, c) => sum + c.amount_cents, 0) || 0
```

**Key insight:** Filter by `payment_type` to separate upfront vs recurring revenue.

---

## Important: PhotoVault Revenue vs Photographer Revenue

**CRITICAL DISTINCTION:**

- **`amount_cents`** = Photographer's commission (what they earn)
- **`photovault_commission_cents`** = PhotoVault's revenue (what we keep)
- **`total_paid_cents`** = Client paid amount (photographer + photovault)

**Admin dashboard needs PhotoVault's revenue, NOT photographer revenue!**

### Revenue Calculation for Admin Dashboard

```typescript
// WRONG - This is photographer revenue
const revenue = commissions.reduce((sum, c) => sum + c.amount_cents, 0)

// CORRECT - This is PhotoVault revenue
const revenue = commissions.reduce((sum, c) => sum + c.photovault_commission_cents, 0)
```

---

## Implementation Plan

### File 1: `src/lib/server/admin-dashboard-service.ts`

**Current Code (Lines 63-86):**
```typescript
async function fetchMonthlyRevenue() {
  try {
    const supabase = createServerSupabaseClient()
    const now = new Date()
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
    const startISO = startOfMonth.toISOString()
    const endISO = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)).toISOString()

    const { data, error } = await supabase
      .from('client_payments')  // ❌ WRONG TABLE
      .select('amount_paid')
      .gte('payment_date', startISO)
      .lte('payment_date', endISO)
      .eq('status', 'active')

    if (error) throw error

    const total = data?.reduce((sum, row) => sum + (row.amount_paid ?? 0), 0) ?? 0
    return { value: total } satisfies FetchResult<number>
  } catch (error) {
    console.warn('[admin-dashboard-service] Monthly revenue unavailable', error)
    return { value: null, error: error instanceof Error ? error : new Error('Unknown error') } satisfies FetchResult<NullableNumber>
  }
}
```

**Updated Code:**
```typescript
async function fetchMonthlyRevenue() {
  try {
    const supabase = createServerSupabaseClient()
    const now = new Date()
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
    const startISO = startOfMonth.toISOString()
    const endISO = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)).toISOString()

    const { data, error } = await supabase
      .from('commissions')  // ✅ CORRECT TABLE
      .select('photovault_commission_cents')  // ✅ PhotoVault revenue only
      .gte('paid_at', startISO)  // ✅ Use paid_at for when revenue was received
      .lte('paid_at', endISO)
      .eq('status', 'paid')  // ✅ Only count paid commissions

    if (error) throw error

    // Sum PhotoVault's commission and convert cents to dollars
    const totalCents = data?.reduce((sum, row) => sum + (row.photovault_commission_cents ?? 0), 0) ?? 0
    const totalDollars = totalCents / 100

    return { value: totalDollars } satisfies FetchResult<number>
  } catch (error) {
    console.warn('[admin-dashboard-service] Monthly revenue unavailable', error)
    return { value: null, error: error instanceof Error ? error : new Error('Unknown error') } satisfies FetchResult<NullableNumber>
  }
}
```

**Changes Made:**
1. Changed table from `client_payments` to `commissions`
2. Changed column from `amount_paid` to `photovault_commission_cents` (PhotoVault's cut)
3. Changed date filter from `payment_date` to `paid_at` (matches commission schema)
4. Changed status filter from `'active'` to `'paid'` (matches commission schema)
5. Added cents-to-dollars conversion (`totalCents / 100`)

---

### File 2: `src/lib/server/admin-revenue-service.ts`

This file needs more extensive changes. It has 4 main functions:

1. **Total Revenue** (lines 45-53)
2. **Monthly Revenue** (lines 56-69)
3. **Yearly Revenue** (lines 72-84)
4. **Recent Payments** (lines 90-110)
5. **Top Photographers** (lines 113-139)

#### Change 1: Total Revenue (lines 45-53)

**Current Code:**
```typescript
// Fetch total revenue
const { data: allPayments, error: allPaymentsError } = await supabase
  .from('client_payments')  // ❌ WRONG TABLE
  .select('amount_paid')
  .eq('status', 'active')

if (allPaymentsError) throw allPaymentsError

const totalRevenue = allPayments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0
```

**Updated Code:**
```typescript
// Fetch total revenue (PhotoVault's commission only)
const { data: allCommissions, error: allCommissionsError } = await supabase
  .from('commissions')  // ✅ CORRECT TABLE
  .select('photovault_commission_cents')  // ✅ PhotoVault revenue
  .eq('status', 'paid')  // ✅ Only paid commissions

if (allCommissionsError) throw allCommissionsError

const totalRevenueCents = allCommissions?.reduce((sum, c) => sum + (c.photovault_commission_cents || 0), 0) || 0
const totalRevenue = totalRevenueCents / 100  // Convert to dollars
```

#### Change 2: Monthly Revenue (lines 56-69)

**Current Code:**
```typescript
// Fetch this month's revenue
const now = new Date()
const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))

const { data: monthPayments, error: monthError } = await supabase
  .from('client_payments')  // ❌ WRONG TABLE
  .select('amount_paid')
  .gte('payment_date', startOfMonth.toISOString())
  .lte('payment_date', endOfMonth.toISOString())
  .eq('status', 'active')

if (monthError) throw monthError

const thisMonth = monthPayments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0
```

**Updated Code:**
```typescript
// Fetch this month's revenue
const now = new Date()
const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))

const { data: monthCommissions, error: monthError } = await supabase
  .from('commissions')  // ✅ CORRECT TABLE
  .select('photovault_commission_cents')  // ✅ PhotoVault revenue
  .gte('paid_at', startOfMonth.toISOString())  // ✅ Use paid_at
  .lte('paid_at', endOfMonth.toISOString())
  .eq('status', 'paid')  // ✅ Only paid commissions

if (monthError) throw monthError

const thisMonthCents = monthCommissions?.reduce((sum, c) => sum + (c.photovault_commission_cents || 0), 0) || 0
const thisMonth = thisMonthCents / 100  // Convert to dollars
```

#### Change 3: Yearly Revenue (lines 72-84)

**Current Code:**
```typescript
// Fetch this year's revenue
const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0))
const endOfYear = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999))

const { data: yearPayments, error: yearError } = await supabase
  .from('client_payments')  // ❌ WRONG TABLE
  .select('amount_paid')
  .gte('payment_date', startOfYear.toISOString())
  .lte('payment_date', endOfYear.toISOString())
  .eq('status', 'active')

if (yearError) throw yearError

const thisYear = yearPayments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0
```

**Updated Code:**
```typescript
// Fetch this year's revenue
const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0))
const endOfYear = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999))

const { data: yearCommissions, error: yearError } = await supabase
  .from('commissions')  // ✅ CORRECT TABLE
  .select('photovault_commission_cents')  // ✅ PhotoVault revenue
  .gte('paid_at', startOfYear.toISOString())  // ✅ Use paid_at
  .lte('paid_at', endOfYear.toISOString())
  .eq('status', 'paid')  // ✅ Only paid commissions

if (yearError) throw yearError

const thisYearCents = yearCommissions?.reduce((sum, c) => sum + (c.photovault_commission_cents || 0), 0) || 0
const thisYear = thisYearCents / 100  // Convert to dollars
```

#### Change 4: Average Order (line 87)

**Current Code:**
```typescript
// Calculate average order
const averageOrder = allPayments && allPayments.length > 0 ? totalRevenue / allPayments.length : 0
```

**Updated Code:**
```typescript
// Calculate average order (PhotoVault's cut per transaction)
const averageOrder = allCommissions && allCommissions.length > 0 ? totalRevenue / allCommissions.length : 0
```

#### Change 5: Recent Payments (lines 90-110)

**Current Code:**
```typescript
// Fetch recent payments with client info
const { data: recentPaymentsData, error: recentError } = await supabase
  .from('client_payments')  // ❌ WRONG TABLE
  .select(`
    id,
    amount_paid,
    payment_date,
    status,
    clients!inner(name)
  `)
  .order('payment_date', { ascending: false })
  .limit(10)

if (recentError) throw recentError

const recentPayments: RecentPayment[] = (recentPaymentsData || []).map((p: any) => ({
  id: p.id.substring(0, 8).toUpperCase(),
  customer: p.clients?.name || 'Unknown',
  amount: p.amount_paid || 0,
  status: p.status === 'active' ? 'Active' : p.status === 'inactive' ? 'Inactive' : 'Expired',
  date: p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—',
}))
```

**Updated Code:**
```typescript
// Fetch recent payments with client info
const { data: recentPaymentsData, error: recentError } = await supabase
  .from('commissions')  // ✅ CORRECT TABLE
  .select(`
    id,
    photovault_commission_cents,
    total_paid_cents,
    paid_at,
    status,
    client_email,
    payment_type
  `)
  .eq('status', 'paid')  // ✅ Only show paid commissions
  .order('paid_at', { ascending: false })  // ✅ Use paid_at
  .limit(10)

if (recentError) throw recentError

const recentPayments: RecentPayment[] = (recentPaymentsData || []).map((c: any) => ({
  id: c.id.substring(0, 8).toUpperCase(),
  customer: c.client_email || 'Unknown',  // Show client email (name not in commissions table)
  amount: (c.photovault_commission_cents || 0) / 100,  // ✅ PhotoVault revenue in dollars
  status: c.status === 'paid' ? 'Paid' : c.status === 'refunded' ? 'Refunded' : 'Pending',
  date: c.paid_at ? new Date(c.paid_at).toLocaleDateString() : '—',
}))
```

**Note:** The `clients` join won't work because `commissions` table uses `client_email` (string) not `client_id` (UUID). We show the email instead of name.

#### Change 6: Top Photographers (lines 113-139)

**Current Code:**
```typescript
// Fetch top photographers by revenue
const { data: photographersData, error: photographersError } = await supabase
  .from('photographers')  // ❌ WRONG TABLE (doesn't exist or is empty)
  .select(`
    id,
    total_commission_earned,
    user_profiles!inner(business_name, full_name)
  `)
  .order('total_commission_earned', { ascending: false })
  .limit(3)

if (photographersError) throw photographersError

// Get session counts for each photographer
const topPhotographers: TopPhotographer[] = await Promise.all(
  (photographersData || []).map(async (p: any) => {
    const { count } = await supabase
      .from('photo_sessions')  // ❌ WRONG TABLE (empty)
      .select('id', { count: 'exact', head: true })
      .eq('photographer_id', p.id)

    return {
      name: p.user_profiles?.business_name || p.user_profiles?.full_name || 'Unknown',
      revenue: p.total_commission_earned || 0,
      sessions: count || 0,
    }
  })
)
```

**Updated Code:**
```typescript
// Fetch top photographers by commission revenue
// First, aggregate commissions by photographer
const { data: allCommissionsData, error: commissionsError } = await supabase
  .from('commissions')  // ✅ CORRECT TABLE
  .select('photographer_id, amount_cents')  // Photographer's earnings (not PhotoVault's)
  .eq('status', 'paid')

if (commissionsError) throw commissionsError

// Aggregate by photographer
const photographerRevenue = new Map<string, number>()
for (const comm of allCommissionsData || []) {
  if (comm.photographer_id) {
    const current = photographerRevenue.get(comm.photographer_id) || 0
    photographerRevenue.set(comm.photographer_id, current + comm.amount_cents)
  }
}

// Sort and take top 3
const topPhotographerIds = Array.from(photographerRevenue.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)

// Fetch photographer details
const topPhotographers: TopPhotographer[] = await Promise.all(
  topPhotographerIds.map(async ([photographerId, revenueCents]) => {
    // Get photographer name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('business_name, full_name')
      .eq('id', photographerId)
      .single()

    // Count galleries instead of sessions (photo_sessions table is empty)
    const { count: galleriesCount } = await supabase
      .from('photo_galleries')
      .select('id', { count: 'exact', head: true })
      .eq('photographer_id', photographerId)

    return {
      name: profile?.business_name || profile?.full_name || 'Unknown',
      revenue: revenueCents / 100,  // Convert to dollars
      sessions: galleriesCount || 0,  // Use galleries count instead of sessions
    }
  })
)
```

**Note:** Since `photo_sessions` table is empty, we use `photo_galleries` count instead. This shows how many galleries the photographer has created.

---

## Additional Fixes

### Fix 1: Hardcoded System Uptime

**File:** `src/lib/server/admin-dashboard-service.ts` (line 149)

**Current:**
```typescript
systemUptime: '99.9%', // Placeholder until uptime monitoring is integrated
```

**Options:**
1. **Keep as placeholder** - Document that it's a mock value
2. **Calculate from Supabase** - Query system start time and calculate uptime
3. **Remove the stat** - Don't show uptime until we have real monitoring

**Recommendation:** Keep as placeholder with updated comment:

```typescript
systemUptime: '99.9%', // Mock value - integrate with monitoring service when available
```

### Fix 2: Stripe Integration Status

**File:** Revenue page currently shows Stripe as "Integration pending"

**Investigation needed:**
- Where is this displayed? (Need to find the component)
- Should show "Connected" or "Operational" since Stripe is working

**Action:** Search for "Integration pending" text in the codebase to find where to update.

### Fix 3: Empty photo_sessions Table

**Impact:** Top photographers widget shows 0 sessions for everyone.

**Fix:** Changed to use `photo_galleries` count instead (see "Change 6" above).

---

## RLS (Row Level Security) Considerations

### Current RLS Policies on `commissions` Table

From `database/commissions-table.sql`:

```sql
-- Photographers can view their own commissions
CREATE POLICY "Photographers can view own commissions"
  ON commissions FOR SELECT
  USING (photographer_id = auth.uid());

-- Admins can view all commissions
CREATE POLICY "Admins can view all commissions"
  ON commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Service role can insert/update (for webhooks)
CREATE POLICY "Service role can manage commissions"
  ON commissions FOR ALL
  USING (auth.role() = 'service_role');
```

### Important for Admin Dashboard

**Admin services MUST use Service Role Client** to bypass RLS:

✅ **CORRECT:**
```typescript
import { createServiceRoleClient } from '@/lib/supabase-server'
const supabase = createServiceRoleClient()  // Has service_role permissions
```

❌ **WRONG:**
```typescript
import { createServerSupabaseClient } from '@/lib/supabase'
const supabase = createServerSupabaseClient()  // Uses authenticated user's RLS
```

**Current Implementation Status:**

- `admin-dashboard-service.ts` (line 36, 49, 65) - Uses `createServerSupabaseClient()` ✅ CORRECT (has admin RLS policy)
- `admin-revenue-service.ts` (line 42) - Uses `createServiceRoleClient()` ✅ CORRECT (bypasses RLS)

**Recommendation:** Keep as-is. Both work because:
1. Admin dashboard service can use regular client (admin user has RLS access)
2. Admin revenue service uses service role (best practice for admin operations)

---

## Testing Steps

### Step 1: Verify Commissions Data

```sql
-- Run in Supabase SQL Editor
SELECT
  id,
  photographer_id,
  client_email,
  total_paid_cents,
  amount_cents,
  photovault_commission_cents,
  payment_type,
  status,
  paid_at,
  created_at
FROM commissions
ORDER BY paid_at DESC;
```

**Expected:** 7 rows with real Stripe payment data.

### Step 2: Calculate Expected Monthly Revenue

```sql
-- Calculate PhotoVault's revenue for current month
SELECT
  DATE_TRUNC('month', paid_at) as month,
  SUM(photovault_commission_cents) / 100.0 as photovault_revenue_dollars,
  SUM(total_paid_cents) / 100.0 as total_client_paid_dollars,
  COUNT(*) as transaction_count
FROM commissions
WHERE
  status = 'paid'
  AND paid_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND paid_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY DATE_TRUNC('month', paid_at);
```

**Note down the result** - this is what the dashboard should show.

### Step 3: Test Admin Dashboard Page

1. Navigate to `/admin/dashboard`
2. Check "Monthly Revenue" stat
3. Verify it matches the SQL query result from Step 2
4. Check "System Uptime" - should still show "99.9%" (placeholder)
5. Check status cards - should show operational if data loaded successfully

### Step 4: Test Admin Revenue Page

1. Navigate to `/admin/revenue`
2. Check stats:
   - **Total Revenue** - Should match sum of all `photovault_commission_cents`
   - **This Month** - Should match Step 2 calculation
   - **This Year** - Should match year-to-date sum
   - **Average Order** - Should be total revenue ÷ number of commissions
3. Check "Recent Payments" section:
   - Should show up to 3 recent commissions
   - Should display client email (not name)
   - Amount should be PhotoVault's cut in dollars
   - Status should show "Paid"
4. Check "Top Photographers" section:
   - Should show top 3 photographers by earnings
   - Revenue should be photographer's earnings (not PhotoVault's cut)
   - Sessions should show gallery count (not 0)

### Step 5: Verify Calculations

Run this SQL to verify the dashboard calculations:

```sql
-- Total revenue (all time)
SELECT
  SUM(photovault_commission_cents) / 100.0 as total_photovault_revenue
FROM commissions
WHERE status = 'paid';

-- This month
SELECT
  SUM(photovault_commission_cents) / 100.0 as this_month_revenue
FROM commissions
WHERE
  status = 'paid'
  AND paid_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND paid_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- This year
SELECT
  SUM(photovault_commission_cents) / 100.0 as this_year_revenue
FROM commissions
WHERE
  status = 'paid'
  AND paid_at >= DATE_TRUNC('year', CURRENT_DATE)
  AND paid_at < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year';

-- Average order
SELECT
  SUM(photovault_commission_cents) / COUNT(*) / 100.0 as avg_photovault_revenue_per_order
FROM commissions
WHERE status = 'paid';

-- Top 3 photographers (photographer earnings, not PhotoVault cut)
SELECT
  p.photographer_id,
  up.business_name,
  up.full_name,
  SUM(p.amount_cents) / 100.0 as total_photographer_earnings,
  COUNT(DISTINCT pg.id) as gallery_count
FROM commissions p
LEFT JOIN user_profiles up ON up.id = p.photographer_id
LEFT JOIN photo_galleries pg ON pg.photographer_id = p.photographer_id
WHERE p.status = 'paid'
GROUP BY p.photographer_id, up.business_name, up.full_name
ORDER BY total_photographer_earnings DESC
LIMIT 3;
```

Compare these results with the dashboard display.

### Step 6: Test Edge Cases

1. **No commissions this month** - Set computer date to a month with no data, verify shows $0
2. **Refunded commission** - Update a commission to `status = 'refunded'`, verify it's excluded from totals
3. **Null paid_at** - Ensure commissions without `paid_at` are excluded from date filters

---

## Files to Modify

### Primary Files

| File Path | Lines to Change | Type of Change |
|-----------|----------------|----------------|
| `src/lib/server/admin-dashboard-service.ts` | 71-75 | Change table + column names |
| `src/lib/server/admin-dashboard-service.ts` | 80 | Update calculation |
| `src/lib/server/admin-revenue-service.ts` | 46-53 | Total revenue query |
| `src/lib/server/admin-revenue-service.ts` | 60-69 | Monthly revenue query |
| `src/lib/server/admin-revenue-service.ts` | 75-84 | Yearly revenue query |
| `src/lib/server/admin-revenue-service.ts` | 87 | Average order calculation |
| `src/lib/server/admin-revenue-service.ts` | 90-110 | Recent payments query |
| `src/lib/server/admin-revenue-service.ts` | 113-139 | Top photographers query |

### Investigation Needed

| Component | Issue | Action |
|-----------|-------|--------|
| Revenue page status card | Shows "Integration pending" for Stripe | Find and update to "Connected" |

---

## TypeScript Types Update

### Current Types in `admin-revenue-service.ts`

```typescript
export type RecentPayment = {
  id: string
  customer: string  // Currently expects client name
  amount: number
  status: string
  date: string
}

export type TopPhotographer = {
  name: string
  revenue: number
  sessions: number  // Currently expects session count
}
```

**Changes needed:**

1. **RecentPayment.customer** - Will show email instead of name (commissions table doesn't have client names)
2. **TopPhotographer.sessions** - Will show gallery count instead of session count (photo_sessions table is empty)

**Option 1:** Keep types as-is (customer can be email, sessions can be galleries)
**Option 2:** Update JSDoc comments to clarify:

```typescript
export type RecentPayment = {
  id: string
  customer: string  // Client email (commissions table doesn't store names)
  amount: number    // PhotoVault's commission in dollars
  status: string
  date: string
}

export type TopPhotographer = {
  name: string
  revenue: number   // Photographer's total earnings (not PhotoVault's cut)
  sessions: number  // Gallery count (photo_sessions table is empty)
}
```

**Recommendation:** Add JSDoc comments (Option 2).

---

## Migration Considerations

### Backwards Compatibility

**Not applicable** - `client_payments` table never had real data, so no migration needed.

### Future Improvements

1. **Add client names to commissions** - Store client name at payment time for easier reporting
2. **Populate photo_sessions table** - Link galleries to sessions for better tracking
3. **Real uptime monitoring** - Integrate with monitoring service (Vercel, Sentry, etc.)
4. **Failed payments tracking** - Add failed commission records for chargeback tracking

---

## Known Issues & Limitations

### Issue 1: Client Names Missing

**Problem:** Admin revenue page shows client emails instead of names.

**Why:** `commissions` table only has `client_email`, not `client_id` or `client_name`.

**Workaround:** Display email in "Recent Payments" section.

**Future Fix:** Add `client_id` foreign key to commissions table during webhook creation.

### Issue 2: Sessions Count Shows Galleries

**Problem:** "Top Photographers" widget shows gallery count, not session count.

**Why:** `photo_sessions` table is empty.

**Workaround:** Use `photo_galleries` count as proxy metric.

**Future Fix:** Populate `photo_sessions` table or remove the "sessions" column entirely.

### Issue 3: Hardcoded Uptime

**Problem:** System uptime is a hardcoded placeholder.

**Why:** No monitoring integration yet.

**Workaround:** Keep "99.9%" with comment explaining it's a placeholder.

**Future Fix:** Integrate Vercel Analytics or external uptime monitor.

---

## Success Criteria

### Functional Requirements

- [ ] Admin dashboard shows real monthly revenue from commissions table
- [ ] Revenue page shows correct total, monthly, and yearly revenue
- [ ] Recent payments section displays actual commission records
- [ ] Top photographers ranked by real earnings
- [ ] All amounts calculated correctly (PhotoVault cut vs photographer cut)
- [ ] Date filtering works correctly (uses `paid_at` column)
- [ ] Only "paid" commissions are included (excludes refunded/pending)

### Non-Functional Requirements

- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Page load time < 2 seconds
- [ ] SQL queries optimized (select only needed columns)
- [ ] RLS policies work correctly for admin users

### Documentation Requirements

- [ ] Code comments added explaining PhotoVault vs photographer revenue
- [ ] JSDoc updated for type definitions
- [ ] Known limitations documented in code comments

---

## Implementation Checklist

### Phase 1: Update admin-dashboard-service.ts
- [ ] Change `fetchMonthlyRevenue()` to query `commissions` table
- [ ] Update table name from `client_payments` to `commissions`
- [ ] Update column name from `amount_paid` to `photovault_commission_cents`
- [ ] Update date column from `payment_date` to `paid_at`
- [ ] Update status filter from `'active'` to `'paid'`
- [ ] Add cents-to-dollars conversion
- [ ] Update error logging messages
- [ ] Test dashboard page loads without errors

### Phase 2: Update admin-revenue-service.ts
- [ ] Update total revenue query (lines 46-53)
- [ ] Update monthly revenue query (lines 60-69)
- [ ] Update yearly revenue query (lines 75-84)
- [ ] Update average order calculation (line 87)
- [ ] Update recent payments query (lines 90-110)
- [ ] Update top photographers query (lines 113-139)
- [ ] Add JSDoc comments to types
- [ ] Test revenue page loads without errors

### Phase 3: Testing
- [ ] Run SQL queries to get expected values
- [ ] Test admin dashboard page
- [ ] Test admin revenue page
- [ ] Verify all calculations match SQL results
- [ ] Test with different date ranges
- [ ] Test edge cases (no data, refunded commissions)
- [ ] Verify RLS policies work

### Phase 4: Cleanup
- [ ] Remove any unused imports
- [ ] Update code comments
- [ ] Update this plan with any discoveries
- [ ] Mark Story 2.4 as complete in WORK_PLAN.md

---

## Next Steps After Implementation

1. **Find Stripe status display** - Search codebase for "Integration pending" and update to "Connected"
2. **Consider adding client names** - Update webhook to store client name in commissions table
3. **Evaluate photo_sessions table** - Decide if it's needed or should be removed from schema
4. **Plan uptime monitoring** - Research Vercel Analytics or external monitoring services

---

## Code Snippets for Quick Copy-Paste

### Complete Updated admin-dashboard-service.ts fetchMonthlyRevenue()

```typescript
async function fetchMonthlyRevenue() {
  try {
    const supabase = createServerSupabaseClient()
    const now = new Date()
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
    const startISO = startOfMonth.toISOString()
    const endISO = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)).toISOString()

    // Query commissions table for PhotoVault's revenue this month
    const { data, error } = await supabase
      .from('commissions')
      .select('photovault_commission_cents')
      .gte('paid_at', startISO)
      .lte('paid_at', endISO)
      .eq('status', 'paid')

    if (error) throw error

    // Sum PhotoVault's commission and convert cents to dollars
    const totalCents = data?.reduce((sum, row) => sum + (row.photovault_commission_cents ?? 0), 0) ?? 0
    const totalDollars = totalCents / 100

    return { value: totalDollars } satisfies FetchResult<number>
  } catch (error) {
    console.warn('[admin-dashboard-service] Monthly revenue unavailable', error)
    return { value: null, error: error instanceof Error ? error : new Error('Unknown error') } satisfies FetchResult<NullableNumber>
  }
}
```

### Complete Updated admin-revenue-service.ts fetchAdminRevenueData()

See full implementation in "Change 1" through "Change 6" sections above.

---

**Plan Complete - Ready for Implementation**
