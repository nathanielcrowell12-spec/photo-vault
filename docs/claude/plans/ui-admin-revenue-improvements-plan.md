# UI: Admin Revenue Page Improvements Plan (REVISED)

**Date:** December 12, 2025
**Story:** 2.4 - Fix Admin Dashboard (continued)
**Expert:** Shadcn/UI Expert
**Status:** Revised after QA critique

---

## Data Investigation Results

**7 commissions in database:**
- 5 have December 2025 `paid_at` dates → total $175
- 2 have no `paid_at` date → total $50
- All-time total: $225

**Why table showed $100 vs header $175:**
- Header correctly sums December commissions = $175
- Table showed only 3 most recent = $100
- **FIX:** Table should show THIS MONTH's transactions, not "most recent"

---

## User Decisions

| Question | Decision |
|----------|----------|
| Payment Activity table | Show THIS MONTH's transactions (matching header) |
| Dedicated transactions page | YES - all transactions with filtering |
| Leaderboard columns | Show BOTH photographer earnings AND PhotoVault commission |
| Stripe/Webhook status | REMOVE if not functional. Only show if it detects real problems |

---

## Issues to Fix

### 1. Revenue Overview Card - Clickable Stats
**Problem:** "This Month" and "This Year" are static text
**Solution:** Make them clickable, navigate to `/admin/transactions?period=month` or `?period=year`

### 2. Payment Activity Card - Show This Month
**Problem:** Shows 3 most recent (all-time), doesn't match monthly header
**Solution:**
- Filter to THIS MONTH's transactions only
- Show ALL transactions for the month (not just 3)
- Make "Sync Payments" button work (refetch data)

### 3. Top Photographers Card
**Problem:** "View full leaderboard" button disabled
**Solution:** Create `/admin/leaderboard` page, show both earnings columns

### 4. Payment Integrations Card
**Problem:** Shows fake "Pending" status for Stripe and Webhooks
**Solution:** REMOVE this card entirely. It's not functional and not useful.

---

## Files to Create

### 1. `src/app/admin/transactions/page.tsx`
Full transactions page with:
- Date filtering: This Month, This Year, All Time, Custom Range
- Columns: Date, Client Email, Type (upfront/monthly/reactivation), Total Paid, PhotoVault Cut, Photographer Cut, Status
- Pagination (25 per page)
- Search by client email
- Export to CSV (future enhancement)

### 2. `src/app/api/admin/transactions/route.ts`
API endpoint returning filtered commissions:
```typescript
// Query params: period (month|year|all), page, search
// Returns: { transactions: [], total: number, page: number }
```

### 3. `src/app/admin/leaderboard/page.tsx`
Photographer rankings showing:
- Rank (1, 2, 3 with gold/silver/bronze styling)
- Photographer Name
- Gallery Count
- PhotoVault Revenue (what they generated for us)
- Photographer Earnings (what they earned)
- Time period filter (This Month, This Year, All Time)

### 4. `src/app/api/admin/leaderboard/route.ts`
Aggregates commissions by photographer, joins with user_profiles

---

## Files to Modify

### `src/lib/server/admin-revenue-service.ts`

**Change `recentPayments` query to filter by THIS MONTH:**

Current (wrong):
```typescript
.order('paid_at', { ascending: false })
.limit(10)
```

Fixed:
```typescript
.gte('paid_at', startOfMonth.toISOString())
.lte('paid_at', endOfMonth.toISOString())
.order('paid_at', { ascending: false })
// Remove limit - show ALL this month's transactions
```

**Remove the `.slice(0, 3)` on line 177** - show all monthly transactions.

---

### `src/app/admin/revenue/page.tsx`

**1. Make "This Month" and "This Year" clickable:**

Replace static div with Link:
```tsx
import Link from 'next/link'

// In revenueStats array, add clickable flag
{
  label: 'This Month',
  value: formatCurrency(revenueData.stats.thisMonth),
  href: '/admin/transactions?period=month'  // NEW
}

// In JSX, wrap clickable stats in Link:
{stat.href ? (
  <Link href={stat.href}>
    <div className="rounded-lg border border-border bg-card p-4 cursor-pointer hover:bg-accent/50 transition-colors group">
      <p className="text-sm text-muted-foreground">{stat.label}</p>
      <p className="mt-2 text-2xl font-semibold text-card-foreground">{stat.value}</p>
      <p className="text-xs text-primary group-hover:underline">View transactions →</p>
    </div>
  </Link>
) : (
  <div className="rounded-lg border border-border bg-card p-4">
    <p className="text-sm text-muted-foreground">{stat.label}</p>
    <p className="mt-2 text-2xl font-semibold text-card-foreground">{stat.value}</p>
    <p className="text-xs text-muted-foreground">{stat.subtext}</p>
  </div>
)}
```

**2. Enable "Sync Payments" button:**
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    setDataLoading(true)
    fetchData()  // Already defined in useEffect
  }}
  disabled={dataLoading}
>
  <RefreshCw className={cn("mr-2 h-4 w-4", dataLoading && "animate-spin")} />
  {dataLoading ? 'Syncing...' : 'Sync Payments'}
</Button>
```

**3. Update Payment Activity description:**
```tsx
<CardDescription>
  Transactions for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
</CardDescription>
```

**4. Enable "View full leaderboard" button:**
```tsx
<Link href="/admin/leaderboard">
  <Button variant="outline" className="w-full">
    View full leaderboard
    <ArrowRight className="ml-2 h-4 w-4" />
  </Button>
</Link>
```

**5. REMOVE the Payment Integrations card entirely** (lines 326-359)

---

## Semantic Color Tokens (Per Shadcn Skill)

All UI must use semantic tokens, NOT hardcoded colors:

| Instead of | Use |
|------------|-----|
| `bg-white` | `bg-card` |
| `bg-blue-50` | `bg-accent/50` |
| `border-blue-100` | `border-border` |
| `text-slate-500` | `text-muted-foreground` |
| `text-slate-900` | `text-card-foreground` |
| `text-blue-600` | `text-primary` |

---

## TypeScript Types

### Transaction Type
```typescript
export type Transaction = {
  id: string
  date: string              // ISO string
  clientEmail: string
  paymentType: 'upfront' | 'monthly' | 'reactivation'
  totalPaidCents: number
  photovaultCommissionCents: number
  photographerCommissionCents: number
  status: 'paid' | 'refunded' | 'pending'
  photographerName?: string
}
```

### Leaderboard Entry Type
```typescript
export type LeaderboardEntry = {
  rank: number
  photographerId: string
  photographerName: string
  galleryCount: number
  photovaultRevenueCents: number    // What they generated FOR PhotoVault
  photographerEarningsCents: number // What they earned
}
```

---

## Error & Loading States

### Loading State
```tsx
{dataLoading && (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
)}
```

### Error State
```tsx
{error && (
  <div className="text-center py-8 text-destructive">
    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
    <p>Failed to load data. Please try again.</p>
    <Button variant="outline" onClick={fetchData} className="mt-4">
      Retry
    </Button>
  </div>
)}
```

### Empty State
```tsx
{transactions.length === 0 && !dataLoading && (
  <div className="text-center py-8 text-muted-foreground">
    <p>No transactions this month.</p>
  </div>
)}
```

---

## Implementation Order

1. **Fix admin-revenue-service.ts** - Change recentPayments to this month's transactions
2. **Update revenue page** - Clickable stats, sync button, remove integrations card
3. **Create transactions API route** - With period filtering
4. **Create transactions page** - Full transaction history
5. **Create leaderboard API route** - Aggregated photographer stats
6. **Create leaderboard page** - Ranked photographers
7. **Test everything**

---

## Accessibility Checklist

- [ ] Clickable stats have focus-visible rings
- [ ] Links announce destination to screen readers
- [ ] Tables have proper `<th>` headers
- [ ] Loading states announced with aria-live
- [ ] Color contrast meets WCAG AA (4.5:1 for text)

---

## Testing Steps

1. **Revenue page loads** - Shows real monthly revenue ($175 for December)
2. **Payment Activity shows THIS MONTH** - All 5 December transactions
3. **Click "This Month" stat** → Goes to `/admin/transactions?period=month`
4. **Click "This Year" stat** → Goes to `/admin/transactions?period=year`
5. **Transactions page filters correctly** - Month shows 5, Year shows 5
6. **Sync button works** - Spinner shows, data refreshes
7. **Leaderboard page** - Shows photographers with both revenue columns
8. **No Payment Integrations card** - Should be removed

---

## Files Summary

| Action | File | Changes |
|--------|------|---------|
| Modify | `src/lib/server/admin-revenue-service.ts` | Filter recentPayments by month |
| Modify | `src/app/admin/revenue/page.tsx` | Clickable stats, sync button, remove integrations |
| Create | `src/app/admin/transactions/page.tsx` | Full transactions page |
| Create | `src/app/api/admin/transactions/route.ts` | Filtered transactions API |
| Create | `src/app/admin/leaderboard/page.tsx` | Photographer rankings |
| Create | `src/app/api/admin/leaderboard/route.ts` | Aggregated leaderboard API |

---

**Plan Revised - Ready for Implementation**
