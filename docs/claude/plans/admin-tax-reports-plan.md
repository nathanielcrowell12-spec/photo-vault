# Admin Tax Reports Page Plan

**Date:** 2026-01-11
**Feature:** Tax-ready export reports for TurboTax Schedule C
**Priority:** Low (needed for 2026 tax filing, not urgent)

---

## Problem Statement

PhotoVault currently lacks detailed financial export reports needed for tax filing. The user:
- Does not use accounting software (no QuickBooks)
- Needs detailed paperwork for TurboTax Schedule C (self-employment income)
- Will need 1099-NEC forms for photographers paid $600+ annually

---

## Proposed Solution

Create `/admin/tax-reports` page with year-selectable CSV exports:

### Files to Create

| File | Purpose |
|------|---------|
| `src/app/admin/tax-reports/page.tsx` | Tax reports UI page |
| `src/app/api/admin/tax-reports/income/route.ts` | CSV export: all income transactions |
| `src/app/api/admin/tax-reports/payouts/route.ts` | CSV export: photographer payouts |
| `src/app/api/admin/tax-reports/summary/route.ts` | JSON: year summary totals |

### Page Layout

```
+--------------------------------------------------+
|  [Receipt Icon] Tax Reports           Admin Badge |
|  Export financial data for tax filing             |
+--------------------------------------------------+
|                                                   |
|  Year: [2025 ▼]  [Refresh]                       |
|                                                   |
+--------------------------------------------------+
|  Summary Cards:                                   |
|  +------------+ +------------+ +------------+    |
|  | Gross Rev  | | Platform   | | Photog     |    |
|  | $X,XXX     | | Commission | | Payouts    |    |
|  | XX trans   | | $X,XXX     | | $X,XXX     |    |
|  +------------+ +------------+ +------------+    |
+--------------------------------------------------+
|  Export Reports:                                  |
|  +----------------------------------------------+|
|  | Income Detail Report           [Download CSV]||
|  | All payments received in 2025                ||
|  +----------------------------------------------+|
|  | Photographer Payout Report     [Download CSV]||
|  | All commissions paid to photographers        ||
|  +----------------------------------------------+|
|  | 1099 Threshold Report          [Download CSV]||
|  | Photographers earning $600+ (need 1099-NEC) ||
|  +----------------------------------------------+|
+--------------------------------------------------+
```

### Data Sources

All data comes from the `commissions` table:

```sql
-- Income (PhotoVault's cut)
SELECT
  paid_at as date,
  client_email,
  gallery_id,
  total_paid_cents / 100 as gross_amount,
  photovault_commission_cents / 100 as platform_revenue
FROM commissions
WHERE status = 'paid'
  AND paid_at >= '2025-01-01'
  AND paid_at < '2026-01-01'
ORDER BY paid_at;

-- Photographer Payouts (their cut)
SELECT
  paid_at as date,
  photographer_id,
  amount_cents / 100 as payout_amount
FROM commissions
WHERE status = 'paid'
  AND paid_at >= '2025-01-01'
  AND paid_at < '2026-01-01';

-- 1099 Threshold (photographers over $600)
SELECT
  photographer_id,
  SUM(amount_cents) / 100 as total_paid
FROM commissions
WHERE status = 'paid'
  AND paid_at >= '2025-01-01'
  AND paid_at < '2026-01-01'
GROUP BY photographer_id
HAVING SUM(amount_cents) >= 60000  -- $600 in cents
ORDER BY total_paid DESC;
```

### CSV Export Formats

**Income Detail Report:**
```csv
Date,Client Email,Gallery ID,Gross Amount,Platform Revenue,Payment Type
2025-03-15,client@email.com,abc123,$100.00,$50.00,initial_payment
```

**Photographer Payout Report:**
```csv
Date,Photographer Name,Photographer Email,Amount,Gallery ID
2025-03-15,Jane Doe,jane@photo.com,$50.00,abc123
```

**1099 Threshold Report:**
```csv
Photographer Name,Email,Tax ID (if on file),Total Paid 2025,Need 1099
Jane Doe,jane@photo.com,N/A,$1250.00,YES
```

---

## Implementation Steps

1. **Create summary service** (`src/lib/server/admin-tax-service.ts`)
   - `getTaxYearSummary(year: number)` - totals for summary cards
   - `getIncomeTransactions(year: number)` - raw data for CSV
   - `getPhotographerPayouts(year: number)` - raw data for CSV
   - `get1099Candidates(year: number)` - photographers over threshold

2. **Create API routes** (3 routes)
   - Each returns CSV with proper `Content-Disposition` header
   - Filenames include year: `photovault-income-2025.csv`

3. **Create page UI**
   - Follow existing admin page patterns (AccessGuard, Card layout)
   - Year selector (2024 to current year)
   - Download buttons that hit API routes directly

4. **Add to admin navigation** (if nav exists)

---

## Security Considerations

- Page requires admin access (AccessGuard with `canAccessAdminDashboard`)
- API routes should verify admin session
- CSV exports contain PII (emails) - admin only
- No photographer tax IDs are stored (would need separate collection)

---

## Testing Plan

1. Verify page loads with AccessGuard protection
2. Verify year selector shows correct years
3. Verify summary cards show accurate totals
4. Download each CSV and verify:
   - Correct headers
   - Data matches database
   - Proper date filtering by year
5. Verify 1099 threshold correctly identifies photographers at $600+

---

## Out of Scope

- Automatic 1099 filing (requires tax ID collection)
- Stripe fee tracking (available in Stripe dashboard)
- Expense tracking (not currently in system)
- QuickBooks/Xero integration

---

## Questions for User

None - requirements are clear. Building for 2026 tax season.
