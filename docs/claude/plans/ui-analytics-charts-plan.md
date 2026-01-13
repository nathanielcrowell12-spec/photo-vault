# Admin Analytics Charts Implementation Plan

**Date:** 2026-01-05
**Status:** Ready for QA Critic Review
**Target File:** `src/app/admin/analytics/page.tsx`

---

## Executive Summary

This plan outlines the implementation of real charting components for PhotoVault's admin analytics page. The codebase already has `recharts@3.3.0` installed and working implementations in `src/app/photographers/analytics/page.tsx` that we can reference as patterns.

---

## Current State Analysis

### What Exists
- **Analytics Page:** `src/app/admin/analytics/page.tsx` with placeholder charts
- **Data Service:** `src/lib/server/admin-analytics-service.ts` providing basic metrics
- **API Route:** `src/app/api/admin/analytics/route.ts`
- **Recharts:** Already installed (v3.3.0) and used in photographer analytics pages
- **CSS Variables:** Chart colors defined (`--chart-1` through `--chart-5`) in globals.css

### Placeholder Locations (lines from current page)
1. **Line 178-180:** "Line chart coming soon" (User Growth Chart)
2. **Line 194-196:** "Pie chart coming soon" (Platform Usage Breakdown)
3. **Lines 252-263:** Performance metrics showing "—" placeholders

### Current Data Types
```typescript
type AnalyticsData = {
  metrics: {
    totalUsers: number
    photosUploaded: number
    storageUsed: string
    activeToday: number
  }
  recentEvents: Array<{
    id: string
    type: string
    description: string
    timestamp: string
  }>
}
```

---

## Required Changes

### 1. Extended API Data Types

The current API only returns aggregate metrics. We need time-series data for charts.

**New TypeScript Interfaces:**

```typescript
// Add to src/app/admin/analytics/page.tsx or create types file

interface UserGrowthDataPoint {
  date: string           // "Jan 2026", "Feb 2026", etc.
  photographers: number  // Cumulative photographer count
  clients: number        // Cumulative client count
  total: number          // Total users
}

interface GalleryStatusBreakdown {
  status: string         // "draft", "ready", "live", "archived"
  count: number
  percentage: number
}

interface PerformanceMetrics {
  avgApiResponseMs: number | null
  errorRate: number | null        // Percentage (0-100)
  uptimePercent: number | null    // 30-day uptime (0-100)
}

interface ExtendedAnalyticsData {
  metrics: {
    totalUsers: number
    photosUploaded: number
    storageUsed: string
    activeToday: number
  }
  userGrowth: UserGrowthDataPoint[]        // NEW: Time-series data
  galleryBreakdown: GalleryStatusBreakdown[] // NEW: Pie chart data
  performance: PerformanceMetrics           // NEW: Performance data
  recentEvents: Array<{
    id: string
    type: string
    description: string
    timestamp: string
  }>
}
```

### 2. Backend Service Updates

**File:** `src/lib/server/admin-analytics-service.ts`

Add these functions to the service:

```typescript
// Add to fetchAdminAnalyticsData()

// User Growth - Last 6 months
async function fetchUserGrowthData(supabase: SupabaseClient): Promise<UserGrowthDataPoint[]> {
  const months: UserGrowthDataPoint[] = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    // Count photographers up to this month
    const { count: photographers } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('user_type', 'photographer')
      .lte('created_at', monthEnd.toISOString())

    // Count clients up to this month
    const { count: clients } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('user_type', 'client')
      .lte('created_at', monthEnd.toISOString())

    months.push({
      date: monthLabel,
      photographers: photographers || 0,
      clients: clients || 0,
      total: (photographers || 0) + (clients || 0)
    })
  }

  return months
}

// Gallery Status Breakdown
async function fetchGalleryBreakdown(supabase: SupabaseClient): Promise<GalleryStatusBreakdown[]> {
  const statuses = ['draft', 'ready', 'live', 'archived']
  const breakdown: GalleryStatusBreakdown[] = []

  const { count: total } = await supabase
    .from('photo_galleries')
    .select('id', { count: 'exact', head: true })

  for (const status of statuses) {
    const { count } = await supabase
      .from('photo_galleries')
      .select('id', { count: 'exact', head: true })
      .eq('status', status)

    breakdown.push({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: count || 0,
      percentage: total ? Math.round(((count || 0) / total) * 100) : 0
    })
  }

  return breakdown.filter(b => b.count > 0) // Only show statuses with galleries
}

// Performance Metrics (placeholder - integrate with monitoring later)
function getPerformanceMetrics(): PerformanceMetrics {
  // TODO: Integrate with actual monitoring (Vercel Analytics, etc.)
  return {
    avgApiResponseMs: null,
    errorRate: null,
    uptimePercent: null
  }
}
```

### 3. Frontend Chart Components

**No new packages required** - Recharts is already installed and configured.

#### 3.1 User Growth Line Chart

Replace the placeholder at lines 176-182:

```tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Inside CardContent for User Growth Chart:
{analyticsData?.userGrowth && analyticsData.userGrowth.length > 0 ? (
  <ResponsiveContainer width="100%" height={192}>
    <LineChart data={analyticsData.userGrowth}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
      <XAxis
        dataKey="date"
        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
        axisLine={{ stroke: 'var(--border)' }}
      />
      <YAxis
        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
        axisLine={{ stroke: 'var(--border)' }}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          color: 'var(--foreground)'
        }}
      />
      <Legend />
      <Line
        type="monotone"
        dataKey="photographers"
        name="Photographers"
        stroke="var(--chart-1)"
        strokeWidth={2}
        dot={{ fill: 'var(--chart-1)', strokeWidth: 2 }}
      />
      <Line
        type="monotone"
        dataKey="clients"
        name="Clients"
        stroke="var(--chart-2)"
        strokeWidth={2}
        dot={{ fill: 'var(--chart-2)', strokeWidth: 2 }}
      />
    </LineChart>
  </ResponsiveContainer>
) : (
  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-muted-foreground">
    No user growth data available
  </div>
)}
```

#### 3.2 Gallery Status Pie Chart

Replace the placeholder at lines 192-198:

```tsx
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Color mapping for gallery statuses
const GALLERY_STATUS_COLORS: Record<string, string> = {
  'Draft': 'var(--chart-4)',    // Darker teal
  'Ready': 'var(--chart-3)',    // Medium teal
  'Live': 'var(--chart-1)',     // Primary teal
  'Archived': 'var(--chart-5)'  // Darkest teal
}

// Inside CardContent for Platform Usage Breakdown:
{analyticsData?.galleryBreakdown && analyticsData.galleryBreakdown.length > 0 ? (
  <ResponsiveContainer width="100%" height={192}>
    <RechartsPieChart>
      <Pie
        data={analyticsData.galleryBreakdown}
        dataKey="count"
        nameKey="status"
        cx="50%"
        cy="50%"
        outerRadius={70}
        label={({ status, percentage }) => `${status}: ${percentage}%`}
        labelLine={{ stroke: 'var(--muted-foreground)' }}
      >
        {analyticsData.galleryBreakdown.map((entry, index) => (
          <Cell
            key={`cell-${index}`}
            fill={GALLERY_STATUS_COLORS[entry.status] || 'var(--chart-1)'}
          />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          color: 'var(--foreground)'
        }}
        formatter={(value: number, name: string) => [`${value} galleries`, name]}
      />
      <Legend />
    </RechartsPieChart>
  </ResponsiveContainer>
) : (
  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-muted-foreground">
    No gallery data available
  </div>
)}
```

#### 3.3 Performance Metrics Cards

Update the performance metrics section (lines 250-265):

```tsx
// Inside the Performance Metrics CardContent:
<div className="grid gap-4 md:grid-cols-3">
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <p className="text-sm text-muted-foreground">Average API Response</p>
    <p className="mt-2 text-xl font-semibold text-slate-900">
      {analyticsData?.performance?.avgApiResponseMs !== null
        ? `${analyticsData.performance.avgApiResponseMs}ms`
        : '—'}
    </p>
    {analyticsData?.performance?.avgApiResponseMs === null && (
      <p className="text-xs text-muted-foreground mt-1">Connect monitoring</p>
    )}
  </div>
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <p className="text-sm text-muted-foreground">Error Rate</p>
    <p className={`mt-2 text-xl font-semibold ${
      analyticsData?.performance?.errorRate !== null && analyticsData.performance.errorRate > 5
        ? 'text-red-600'
        : 'text-slate-900'
    }`}>
      {analyticsData?.performance?.errorRate !== null
        ? `${analyticsData.performance.errorRate.toFixed(2)}%`
        : '—'}
    </p>
    {analyticsData?.performance?.errorRate === null && (
      <p className="text-xs text-muted-foreground mt-1">Connect monitoring</p>
    )}
  </div>
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <p className="text-sm text-muted-foreground">Uptime (30 days)</p>
    <p className={`mt-2 text-xl font-semibold ${
      analyticsData?.performance?.uptimePercent !== null && analyticsData.performance.uptimePercent >= 99
        ? 'text-green-600'
        : analyticsData?.performance?.uptimePercent !== null && analyticsData.performance.uptimePercent >= 95
        ? 'text-yellow-600'
        : 'text-slate-900'
    }`}>
      {analyticsData?.performance?.uptimePercent !== null
        ? `${analyticsData.performance.uptimePercent.toFixed(2)}%`
        : '—'}
    </p>
    {analyticsData?.performance?.uptimePercent === null && (
      <p className="text-xs text-muted-foreground mt-1">Connect monitoring</p>
    )}
  </div>
</div>
```

---

## CSS Theme Integration

The project already has chart CSS variables defined in `globals.css`:

```css
/* Light Mode */
--chart-1: #00B3A4;  /* Primary teal */
--chart-2: #00D9C5;  /* Light teal */
--chart-3: #008F84;  /* Medium teal */
--chart-4: #00665D;  /* Dark teal */
--chart-5: #004D46;  /* Darkest teal */

/* Dark Mode */
--chart-1: #00D9C5;  /* Brighter for visibility */
--chart-2: #00F5E1;
--chart-3: #00B3A4;
--chart-4: #008F84;
--chart-5: #00665D;
```

Charts will automatically use these variables via `var(--chart-X)` syntax, ensuring theme consistency.

---

## Loading and Empty States

### Loading State
The page already has a loading spinner. Charts should show skeleton placeholders:

```tsx
// Skeleton for chart loading
{dataLoading && (
  <div className="h-48 rounded-lg bg-slate-100 animate-pulse" />
)}
```

### Empty States
Each chart section includes a fallback:
- User Growth: "No user growth data available"
- Gallery Breakdown: "No gallery data available"
- Performance: Shows "—" with "Connect monitoring" hint

---

## Responsive Design Considerations

1. **Chart Container Heights:**
   - Line Chart: `h-48` (192px) minimum
   - Pie Chart: `h-48` (192px) minimum
   - Use `ResponsiveContainer width="100%" height={192}`

2. **Mobile Layout:**
   - Charts stack vertically on mobile (existing `lg:grid-cols-2` handles this)
   - Pie chart labels may need adjustment for small screens

3. **Touch Interactions:**
   - Recharts tooltips work on touch
   - Consider adding touch-friendly legends

---

## Implementation Checklist

### Phase 1: Backend (admin-analytics-service.ts)
- [ ] Add `UserGrowthDataPoint` type
- [ ] Add `GalleryStatusBreakdown` type
- [ ] Add `PerformanceMetrics` type
- [ ] Implement `fetchUserGrowthData()` function
- [ ] Implement `fetchGalleryBreakdown()` function
- [ ] Add performance metrics placeholder
- [ ] Update `AdminAnalyticsData` type
- [ ] Update `fetchAdminAnalyticsData()` to include new data

### Phase 2: Frontend (admin/analytics/page.tsx)
- [ ] Update `AnalyticsData` type to match extended API
- [ ] Add Recharts imports
- [ ] Implement User Growth LineChart component
- [ ] Implement Gallery Status PieChart component
- [ ] Update Performance Metrics cards
- [ ] Add loading skeletons for charts
- [ ] Test dark mode theming

### Phase 3: Testing
- [ ] Verify charts render with real data
- [ ] Test empty states (new install with no data)
- [ ] Test responsive behavior on mobile
- [ ] Verify dark mode colors
- [ ] Check accessibility (chart labels, tooltips)

---

## Dependencies

**Already Installed (no changes needed):**
- `recharts@3.3.0`
- `lucide-react` (for icons)
- All shadcn/ui components

**No Additional Packages Required**

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance with large datasets | Low | Medium | Limit to 6-12 months of data |
| Dark mode color contrast | Medium | Low | Already tested in photographer analytics |
| Mobile pie chart labels | Medium | Low | Use percentage labels only |
| API response time | Low | Medium | Data is cached per request |

---

## Future Enhancements (Out of Scope)

1. **Real Performance Monitoring Integration**
   - Vercel Analytics API
   - Custom health check endpoint

2. **Export Functionality**
   - CSV export for chart data
   - PDF report generation

3. **Additional Charts**
   - Revenue over time (if payments tracked)
   - Geographic distribution
   - Photo upload trends

---

## Files to Modify

1. `src/lib/server/admin-analytics-service.ts` - Add new data fetching
2. `src/app/admin/analytics/page.tsx` - Add chart components

## Reference Implementation

See `src/app/photographers/analytics/page.tsx` for working Recharts examples in this codebase.

---

**QA Critic Review Required:** This plan requires review for completeness before implementation.
