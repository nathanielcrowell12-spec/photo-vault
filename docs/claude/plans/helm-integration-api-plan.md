# Helm Integration API Implementation Plan

**Created:** 2026-01-10
**Author:** Claude Code (Next.js 15 & Supabase Expert)
**Status:** Ready for Implementation
**Estimated Effort:** 4-6 hours

---

## 1. Summary

This plan implements 3 new API endpoints for PhotoVault that expose operational data to Helm Mission Control:

| Endpoint | Purpose | Frequency |
|----------|---------|-----------|
| `GET /api/helm/report-data/daily` | Daily operational metrics | Daily at 1 PM UTC |
| `GET /api/helm/report-data/weekly` | Weekly performance data | Monday at 1 PM UTC |
| `GET /api/helm/report-data/monthly` | Monthly comprehensive data | 1st of month at 1 PM UTC |

All endpoints require Bearer token authentication via `HELM_API_KEY`.

---

## 2. Existing Code to Reference

### What EXISTS (Patterns to Follow)
- `src/lib/supabase-server.ts` - Contains `createServiceRoleClient()` for admin operations
- `src/app/api/helm/health/route.ts` - Simple Helm endpoint pattern (no auth)
- `src/lib/logger.ts` - Logging utility

### What EXISTS but is BROKEN (Do NOT Copy)
- `src/app/api/helm/metrics/route.ts` - Uses wrong table names:
  - `users` (should be `user_profiles`)
  - `photos` (should be `gallery_photos`)
  - `commission_payments` (should be `commissions`)
  - Also has NO authentication

### Correct Table Names (from Schema Catalog)

| What | Correct Table | NOT This |
|------|---------------|----------|
| Users | `user_profiles` | `users` |
| Galleries | `photo_galleries` | `galleries` |
| Photos | `gallery_photos` | `photos` |
| Commissions | `commissions` | `commission_payments` |
| Photographers | `photographers` | - |
| Clients | `clients` | - |
| Subscriptions | `subscriptions` | - |

---

## 3. File Structure

Create these new files:

```
src/
  lib/
    helm/
      auth.ts           # Authorization helper
      queries.ts        # Reusable database queries
      types.ts          # Response type definitions
  app/
    api/
      helm/
        report-data/
          daily/
            route.ts    # Daily metrics endpoint
          weekly/
            route.ts    # Weekly metrics endpoint
          monthly/
            route.ts    # Monthly metrics endpoint
```

---

## 4. Shared Utilities

### 4.1 Type Definitions

**File:** `src/lib/helm/types.ts`

```typescript
/**
 * Helm Integration API Type Definitions
 * All monetary values in CENTS, all timestamps in ISO 8601 UTC
 */

// ============================================================================
// Shared Types
// ============================================================================

export type GalleryStatus = 'draft' | 'ready' | 'live' | 'archived'
export type CommissionStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'
export type AlertType = 'churn_risk' | 'payment_failed' | 'inactive_photographer' | 'gallery_stuck'
export type AlertSeverity = 'critical' | 'warning' | 'info'
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'incomplete'

export interface HelmAlert {
  type: AlertType
  message: string
  severity: AlertSeverity
  entityId?: string
}

export interface RecentGallery {
  id: string
  name: string
  status: GalleryStatus
  photographerId: string
  photographerName: string
  createdAt: string
}

export interface RecentPayment {
  id: string
  amount: number // cents
  status: CommissionStatus
  photographerId: string
  createdAt: string
}

export interface TopPhotographer {
  id: string
  name: string
  email: string
  galleries: number
  revenue: number // cents
}

// ============================================================================
// Daily Report Types
// ============================================================================

export interface DailyMetrics {
  newGalleries: number
  newPhotos: number
  totalPayments: number
  totalRevenue: number // cents
  newClients: number
  activePhotographers: number
}

export interface DailyActivity {
  recentGalleries: RecentGallery[]
  recentPayments: RecentPayment[]
}

export interface DailyReportData {
  period: {
    start: string
    end: string
  }
  dataFreshnessUtc: string
  metrics: DailyMetrics
  activity: DailyActivity
  alerts: HelmAlert[]
}

// ============================================================================
// Weekly Report Types
// ============================================================================

export interface WeeklyMetrics {
  galleriesCreated: number
  galleriesPublished: number
  photosUploaded: number
  totalRevenue: number // cents
  newClients: number
  churnedClients: number
  activeSubscriptions: number
  mrr: number // cents
}

export interface WeeklyTrends {
  galleryGrowth: number // percentage
  revenueGrowth: number // percentage
  clientGrowth: number // percentage
}

export interface WeeklyReportData {
  period: {
    weekStart: string
    weekEnd: string
  }
  dataFreshnessUtc: string
  metrics: WeeklyMetrics
  trends: WeeklyTrends
  topPhotographers: TopPhotographer[]
}

// ============================================================================
// Monthly Report Types
// ============================================================================

export interface MonthlyMetrics {
  totalPhotographers: number
  activePhotographers: number
  totalClients: number
  totalGalleries: number
  totalPhotos: number
  mrr: number // cents
  arr: number // cents
  totalRevenue: number // cents
  churnRate: number // percentage
}

export interface SubscriptionBreakdown {
  active: number
  pastDue: number
  canceled: number
  trialing: number
}

export interface MonthlyGrowth {
  mrrGrowth: number // percentage
  photographerGrowth: number // percentage
  clientGrowth: number // percentage
  galleryGrowth: number // percentage
}

export interface CommissionSummary {
  totalCommissions: number // cents
  pendingPayouts: number // cents
  completedPayouts: number // cents
  averageCommissionRate: number // percentage
}

export interface MonthlyReportData {
  period: {
    month: number
    year: number
    startDate: string
    endDate: string
  }
  dataFreshnessUtc: string
  metrics: MonthlyMetrics
  subscriptionBreakdown: SubscriptionBreakdown
  growth: MonthlyGrowth
  commissionSummary: CommissionSummary
}

// ============================================================================
// API Response Types
// ============================================================================

export interface HelmApiSuccessResponse<T> {
  success: true
  data: T
}

export interface HelmApiErrorResponse {
  success: false
  error: string
  details?: string
}

export type HelmApiResponse<T> = HelmApiSuccessResponse<T> | HelmApiErrorResponse
```

### 4.2 Authentication Helper

**File:** `src/lib/helm/auth.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { HelmApiErrorResponse } from './types'

/**
 * Verify Helm API authorization
 * Returns null if authorized, NextResponse with error if not
 */
export function verifyHelmAuth(request: NextRequest): NextResponse<HelmApiErrorResponse> | null {
  const authHeader = request.headers.get('authorization')
  const expectedKey = process.env.HELM_API_KEY

  // Check if HELM_API_KEY is configured
  if (!expectedKey) {
    console.error('[HelmAuth] HELM_API_KEY environment variable not configured')
    return NextResponse.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 }
    )
  }

  // Check if Authorization header is present
  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: 'Missing Authorization header' },
      { status: 401 }
    )
  }

  // Verify Bearer token format and value
  if (authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return null // Authorized
}

/**
 * Create error response with consistent format
 */
export function helmErrorResponse(
  error: string,
  status: number = 500,
  details?: string
): NextResponse<HelmApiErrorResponse> {
  const response: HelmApiErrorResponse = { success: false, error }
  if (details && process.env.NODE_ENV !== 'production') {
    response.details = details
  }
  return NextResponse.json(response, { status })
}
```

### 4.3 Query Helpers

**File:** `src/lib/helm/queries.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import {
  HelmAlert,
  RecentGallery,
  RecentPayment,
  TopPhotographer,
  GalleryStatus,
  CommissionStatus
} from './types'

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Get start and end of a day in UTC
 */
export function getDayBounds(dateStr: string): { start: string; end: string } {
  const date = new Date(dateStr + 'T00:00:00.000Z')
  const start = date.toISOString()
  const end = new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
  return { start, end }
}

/**
 * Get start and end of a week (Monday to Sunday)
 */
export function getWeekBounds(weekStartStr: string): { start: string; end: string } {
  const start = new Date(weekStartStr + 'T00:00:00.000Z')
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

/**
 * Get start and end of a month
 */
export function getMonthBounds(month: number, year: number): { start: string; end: string } {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
  return { start: start.toISOString(), end: end.toISOString() }
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// ============================================================================
// Count Queries
// ============================================================================

/**
 * Count galleries created in date range
 */
export async function countGalleries(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<number> {
  const { count, error } = await supabase
    .from('photo_galleries')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  if (error) throw new Error(`Failed to count galleries: ${error.message}`)
  return count || 0
}

/**
 * Count galleries with specific status in date range (by updated_at)
 */
export async function countGalleriesByStatus(
  supabase: SupabaseClient,
  status: GalleryStatus,
  startDate: string,
  endDate: string
): Promise<number> {
  const { count, error } = await supabase
    .from('photo_galleries')
    .select('*', { count: 'exact', head: true })
    .eq('gallery_status', status)
    .gte('updated_at', startDate)
    .lt('updated_at', endDate)

  if (error) throw new Error(`Failed to count galleries by status: ${error.message}`)
  return count || 0
}

/**
 * Count photos uploaded in date range
 */
export async function countPhotos(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<number> {
  const { count, error } = await supabase
    .from('gallery_photos')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  if (error) throw new Error(`Failed to count photos: ${error.message}`)
  return count || 0
}

/**
 * Count payments (commissions) in date range
 */
export async function countPayments(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<number> {
  const { count, error } = await supabase
    .from('commissions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  if (error) throw new Error(`Failed to count payments: ${error.message}`)
  return count || 0
}

/**
 * Get total revenue in date range (returns cents)
 */
export async function getTotalRevenue(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<number> {
  const { data, error } = await supabase
    .from('commissions')
    .select('total_paid_cents')
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  if (error) throw new Error(`Failed to get revenue: ${error.message}`)
  return data?.reduce((sum, row) => sum + (row.total_paid_cents || 0), 0) || 0
}

/**
 * Count new clients in date range
 */
export async function countNewClients(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<number> {
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  if (error) throw new Error(`Failed to count clients: ${error.message}`)
  return count || 0
}

/**
 * Count distinct active photographers (created galleries in date range)
 */
export async function countActivePhotographers(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<number> {
  const { data, error } = await supabase
    .from('photo_galleries')
    .select('photographer_id')
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  if (error) throw new Error(`Failed to count active photographers: ${error.message}`)

  const uniqueIds = new Set(data?.map(row => row.photographer_id) || [])
  return uniqueIds.size
}

/**
 * Count churned clients (subscriptions canceled in date range)
 */
export async function countChurnedClients(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<number> {
  const { count, error } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'canceled')
    .gte('updated_at', startDate)
    .lt('updated_at', endDate)

  if (error) throw new Error(`Failed to count churned clients: ${error.message}`)
  return count || 0
}

/**
 * Count active subscriptions (current snapshot)
 */
export async function countActiveSubscriptions(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  if (error) throw new Error(`Failed to count active subscriptions: ${error.message}`)
  return count || 0
}

/**
 * Get subscription breakdown by status
 */
export async function getSubscriptionBreakdown(supabase: SupabaseClient): Promise<{
  active: number
  pastDue: number
  canceled: number
  trialing: number
}> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status')

  if (error) throw new Error(`Failed to get subscription breakdown: ${error.message}`)

  const breakdown = { active: 0, pastDue: 0, canceled: 0, trialing: 0 }
  data?.forEach(row => {
    switch (row.status) {
      case 'active': breakdown.active++; break
      case 'past_due': breakdown.pastDue++; break
      case 'canceled': breakdown.canceled++; break
      case 'trialing': breakdown.trialing++; break
    }
  })
  return breakdown
}

// ============================================================================
// Snapshot Counts (Total Counts)
// ============================================================================

/**
 * Get total photographer count
 */
export async function getTotalPhotographers(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from('photographers')
    .select('*', { count: 'exact', head: true })

  if (error) throw new Error(`Failed to count photographers: ${error.message}`)
  return count || 0
}

/**
 * Get total client count
 */
export async function getTotalClients(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })

  if (error) throw new Error(`Failed to count total clients: ${error.message}`)
  return count || 0
}

/**
 * Get total gallery count
 */
export async function getTotalGalleries(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from('photo_galleries')
    .select('*', { count: 'exact', head: true })

  if (error) throw new Error(`Failed to count total galleries: ${error.message}`)
  return count || 0
}

/**
 * Get total photo count
 */
export async function getTotalPhotos(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from('gallery_photos')
    .select('*', { count: 'exact', head: true })

  if (error) throw new Error(`Failed to count total photos: ${error.message}`)
  return count || 0
}

// ============================================================================
// Recent Activity Queries
// ============================================================================

/**
 * Get recent galleries with photographer info
 */
export async function getRecentGalleries(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<RecentGallery[]> {
  const { data, error } = await supabase
    .from('photo_galleries')
    .select(`
      id,
      gallery_name,
      gallery_status,
      photographer_id,
      created_at,
      photographers!inner (
        id
      ),
      user_profiles:photographer_id (
        full_name,
        business_name
      )
    `)
    .gte('created_at', startDate)
    .lt('created_at', endDate)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    // Fallback without join if relationship fails
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('photo_galleries')
      .select('id, gallery_name, gallery_status, photographer_id, created_at')
      .gte('created_at', startDate)
      .lt('created_at', endDate)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (fallbackError) throw new Error(`Failed to get recent galleries: ${fallbackError.message}`)

    return (fallbackData || []).map(row => ({
      id: row.id,
      name: row.gallery_name || 'Untitled Gallery',
      status: row.gallery_status as GalleryStatus,
      photographerId: row.photographer_id,
      photographerName: 'Unknown',
      createdAt: row.created_at
    }))
  }

  return (data || []).map(row => ({
    id: row.id,
    name: row.gallery_name || 'Untitled Gallery',
    status: row.gallery_status as GalleryStatus,
    photographerId: row.photographer_id,
    photographerName: (row.user_profiles as any)?.business_name ||
                      (row.user_profiles as any)?.full_name ||
                      'Unknown',
    createdAt: row.created_at
  }))
}

/**
 * Get recent payments (commissions)
 */
export async function getRecentPayments(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<RecentPayment[]> {
  const { data, error } = await supabase
    .from('commissions')
    .select('id, amount_cents, status, photographer_id, created_at')
    .gte('created_at', startDate)
    .lt('created_at', endDate)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to get recent payments: ${error.message}`)

  return (data || []).map(row => ({
    id: row.id,
    amount: row.amount_cents || 0,
    status: row.status as CommissionStatus,
    photographerId: row.photographer_id,
    createdAt: row.created_at
  }))
}

// ============================================================================
// Top Performers Query
// ============================================================================

/**
 * Get top photographers by revenue in date range
 */
export async function getTopPhotographers(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
  limit: number = 5
): Promise<TopPhotographer[]> {
  // Get commissions with photographer info
  const { data: commissions, error: commError } = await supabase
    .from('commissions')
    .select('photographer_id, amount_cents')
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  if (commError) throw new Error(`Failed to get commissions: ${commError.message}`)

  // Get galleries created in period
  const { data: galleries, error: galError } = await supabase
    .from('photo_galleries')
    .select('photographer_id')
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  if (galError) throw new Error(`Failed to get galleries: ${galError.message}`)

  // Aggregate by photographer
  const photographerStats = new Map<string, { revenue: number; galleries: number }>()

  commissions?.forEach(comm => {
    const stats = photographerStats.get(comm.photographer_id) || { revenue: 0, galleries: 0 }
    stats.revenue += comm.amount_cents || 0
    photographerStats.set(comm.photographer_id, stats)
  })

  galleries?.forEach(gal => {
    const stats = photographerStats.get(gal.photographer_id) || { revenue: 0, galleries: 0 }
    stats.galleries += 1
    photographerStats.set(gal.photographer_id, stats)
  })

  // Sort by revenue and take top N
  const sortedPhotographers = Array.from(photographerStats.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, limit)

  if (sortedPhotographers.length === 0) return []

  // Get photographer details
  const photographerIds = sortedPhotographers.map(([id]) => id)
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, full_name, business_name')
    .in('id', photographerIds)

  if (profileError) {
    console.warn(`Failed to get photographer profiles: ${profileError.message}`)
  }

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

  return sortedPhotographers.map(([id, stats]) => {
    const profile = profileMap.get(id)
    return {
      id,
      name: profile?.business_name || profile?.full_name || 'Unknown',
      email: '', // Not exposing email for privacy
      galleries: stats.galleries,
      revenue: stats.revenue
    }
  })
}

// ============================================================================
// MRR Calculation
// ============================================================================

/**
 * Calculate Monthly Recurring Revenue from active subscriptions
 * Assumes $8/month per active subscription
 */
export async function calculateMRR(supabase: SupabaseClient): Promise<number> {
  const MONTHLY_PRICE_CENTS = 800 // $8.00
  const activeCount = await countActiveSubscriptions(supabase)
  return activeCount * MONTHLY_PRICE_CENTS
}

// ============================================================================
// Alert Detection
// ============================================================================

/**
 * Detect all alerts
 */
export async function detectAlerts(supabase: SupabaseClient): Promise<HelmAlert[]> {
  const alerts: HelmAlert[] = []

  // 1. Churn Risk: past_due with 2+ payment failures
  const { data: churnRisk, error: churnError } = await supabase
    .from('subscriptions')
    .select('id, user_id, payment_failure_count')
    .eq('status', 'past_due')
    .gte('payment_failure_count', 2)

  if (!churnError && churnRisk) {
    churnRisk.forEach(sub => {
      alerts.push({
        type: 'churn_risk',
        message: `Subscription ${sub.id} has ${sub.payment_failure_count} failed payments`,
        severity: sub.payment_failure_count >= 3 ? 'critical' : 'warning',
        entityId: sub.user_id
      })
    })
  }

  // 2. Inactive Photographer: active platform subscription but no galleries in 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: activePhotographers, error: activeError } = await supabase
    .from('photographers')
    .select('id')
    .eq('platform_subscription_status', 'active')

  if (!activeError && activePhotographers) {
    const { data: recentGalleries, error: galError } = await supabase
      .from('photo_galleries')
      .select('photographer_id')
      .gte('created_at', thirtyDaysAgo)

    if (!galError) {
      const activeWithGalleries = new Set(recentGalleries?.map(g => g.photographer_id) || [])
      activePhotographers.forEach(p => {
        if (!activeWithGalleries.has(p.id)) {
          alerts.push({
            type: 'inactive_photographer',
            message: `Photographer ${p.id} has not created galleries in 30 days`,
            severity: 'warning',
            entityId: p.id
          })
        }
      })
    }
  }

  // 3. Gallery Stuck: draft status for > 14 days
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data: stuckGalleries, error: stuckError } = await supabase
    .from('photo_galleries')
    .select('id, gallery_name, photographer_id')
    .eq('gallery_status', 'draft')
    .lt('created_at', fourteenDaysAgo)
    .limit(10)

  if (!stuckError && stuckGalleries) {
    stuckGalleries.forEach(g => {
      alerts.push({
        type: 'gallery_stuck',
        message: `Gallery "${g.gallery_name || g.id}" has been in draft for over 14 days`,
        severity: 'info',
        entityId: g.id
      })
    })
  }

  return alerts
}

// ============================================================================
// Commission Summary
// ============================================================================

/**
 * Get commission summary for a period
 */
export async function getCommissionSummary(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<{
  totalCommissions: number
  pendingPayouts: number
  completedPayouts: number
  averageCommissionRate: number
}> {
  const { data, error } = await supabase
    .from('commissions')
    .select('amount_cents, total_paid_cents, status')
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  if (error) throw new Error(`Failed to get commission summary: ${error.message}`)

  let totalCommissions = 0
  let pendingPayouts = 0
  let completedPayouts = 0
  let totalPaid = 0
  let totalAmount = 0

  data?.forEach(row => {
    totalCommissions += row.amount_cents || 0
    totalPaid += row.total_paid_cents || 0
    totalAmount += row.amount_cents || 0

    if (row.status === 'pending') {
      pendingPayouts += row.amount_cents || 0
    } else if (row.status === 'paid') {
      completedPayouts += row.amount_cents || 0
    }
  })

  // Average commission rate (photographer share / total paid)
  const averageCommissionRate = totalPaid > 0
    ? (totalAmount / totalPaid) * 100
    : 50 // Default to 50%

  return {
    totalCommissions,
    pendingPayouts,
    completedPayouts,
    averageCommissionRate: Math.round(averageCommissionRate * 100) / 100
  }
}

// ============================================================================
// Growth Calculation
// ============================================================================

/**
 * Calculate percentage growth between two values
 */
export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return Math.round(((current - previous) / previous) * 10000) / 100 // 2 decimal places
}

/**
 * Get previous week date range
 */
export function getPreviousWeekBounds(weekStartStr: string): { start: string; end: string } {
  const weekStart = new Date(weekStartStr + 'T00:00:00.000Z')
  const prevWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000)
  const prevWeekEnd = new Date(prevWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
  return { start: prevWeekStart.toISOString(), end: prevWeekEnd.toISOString() }
}

/**
 * Get previous month bounds
 */
export function getPreviousMonthBounds(month: number, year: number): { start: string; end: string } {
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  return getMonthBounds(prevMonth, prevYear)
}
```

---

## 5. Daily Endpoint Implementation

**File:** `src/app/api/helm/report-data/daily/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { verifyHelmAuth, helmErrorResponse } from '@/lib/helm/auth'
import {
  getDayBounds,
  countGalleries,
  countPhotos,
  countPayments,
  getTotalRevenue,
  countNewClients,
  countActivePhotographers,
  getRecentGalleries,
  getRecentPayments,
  detectAlerts
} from '@/lib/helm/queries'
import {
  DailyReportData,
  HelmApiSuccessResponse
} from '@/lib/helm/types'

export async function GET(request: NextRequest) {
  // Verify authentication
  const authError = verifyHelmAuth(request)
  if (authError) return authError

  // Get date parameter
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date')

  if (!dateParam) {
    return helmErrorResponse('Missing required parameter: date', 400)
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return helmErrorResponse('Invalid date format. Use YYYY-MM-DD', 400)
  }

  try {
    const supabase = createServiceRoleClient()
    const { start, end } = getDayBounds(dateParam)

    // Run all queries in parallel for performance
    const [
      newGalleries,
      newPhotos,
      totalPayments,
      totalRevenue,
      newClients,
      activePhotographers,
      recentGalleries,
      recentPayments,
      alerts
    ] = await Promise.all([
      countGalleries(supabase, start, end),
      countPhotos(supabase, start, end),
      countPayments(supabase, start, end),
      getTotalRevenue(supabase, start, end),
      countNewClients(supabase, start, end),
      countActivePhotographers(supabase, start, end),
      getRecentGalleries(supabase, start, end, 10),
      getRecentPayments(supabase, start, end, 10),
      detectAlerts(supabase)
    ])

    const data: DailyReportData = {
      period: {
        start: `${dateParam}T00:00:00.000Z`,
        end: `${dateParam}T23:59:59.999Z`
      },
      dataFreshnessUtc: new Date().toISOString(),
      metrics: {
        newGalleries,
        newPhotos,
        totalPayments,
        totalRevenue,
        newClients,
        activePhotographers
      },
      activity: {
        recentGalleries,
        recentPayments
      },
      alerts
    }

    const response: HelmApiSuccessResponse<DailyReportData> = {
      success: true,
      data
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[HelmDailyReport] Error:', error)
    return helmErrorResponse(
      'Failed to generate daily report',
      500,
      error instanceof Error ? error.message : undefined
    )
  }
}
```

---

## 6. Weekly Endpoint Implementation

**File:** `src/app/api/helm/report-data/weekly/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { verifyHelmAuth, helmErrorResponse } from '@/lib/helm/auth'
import {
  getWeekBounds,
  getPreviousWeekBounds,
  countGalleries,
  countGalleriesByStatus,
  countPhotos,
  getTotalRevenue,
  countNewClients,
  countChurnedClients,
  countActiveSubscriptions,
  calculateMRR,
  getTopPhotographers,
  calculateGrowth,
  formatDate
} from '@/lib/helm/queries'
import {
  WeeklyReportData,
  HelmApiSuccessResponse
} from '@/lib/helm/types'

export async function GET(request: NextRequest) {
  // Verify authentication
  const authError = verifyHelmAuth(request)
  if (authError) return authError

  // Get weekStart parameter
  const { searchParams } = new URL(request.url)
  const weekStartParam = searchParams.get('weekStart')

  if (!weekStartParam) {
    return helmErrorResponse('Missing required parameter: weekStart', 400)
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStartParam)) {
    return helmErrorResponse('Invalid date format. Use YYYY-MM-DD', 400)
  }

  try {
    const supabase = createServiceRoleClient()
    const { start, end } = getWeekBounds(weekStartParam)
    const prev = getPreviousWeekBounds(weekStartParam)

    // Calculate week end date for response
    const weekEndDate = new Date(new Date(weekStartParam + 'T00:00:00.000Z').getTime() + 6 * 24 * 60 * 60 * 1000)

    // Current week metrics
    const [
      galleriesCreated,
      galleriesPublished,
      photosUploaded,
      totalRevenue,
      newClients,
      churnedClients,
      activeSubscriptions,
      mrr,
      topPhotographers
    ] = await Promise.all([
      countGalleries(supabase, start, end),
      countGalleriesByStatus(supabase, 'live', start, end),
      countPhotos(supabase, start, end),
      getTotalRevenue(supabase, start, end),
      countNewClients(supabase, start, end),
      countChurnedClients(supabase, start, end),
      countActiveSubscriptions(supabase),
      calculateMRR(supabase),
      getTopPhotographers(supabase, start, end, 5)
    ])

    // Previous week metrics for trends
    const [
      prevGalleries,
      prevRevenue,
      prevClients
    ] = await Promise.all([
      countGalleries(supabase, prev.start, prev.end),
      getTotalRevenue(supabase, prev.start, prev.end),
      countNewClients(supabase, prev.start, prev.end)
    ])

    const data: WeeklyReportData = {
      period: {
        weekStart: weekStartParam,
        weekEnd: formatDate(weekEndDate)
      },
      dataFreshnessUtc: new Date().toISOString(),
      metrics: {
        galleriesCreated,
        galleriesPublished,
        photosUploaded,
        totalRevenue,
        newClients,
        churnedClients,
        activeSubscriptions,
        mrr
      },
      trends: {
        galleryGrowth: calculateGrowth(galleriesCreated, prevGalleries),
        revenueGrowth: calculateGrowth(totalRevenue, prevRevenue),
        clientGrowth: calculateGrowth(newClients, prevClients)
      },
      topPhotographers
    }

    const response: HelmApiSuccessResponse<WeeklyReportData> = {
      success: true,
      data
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[HelmWeeklyReport] Error:', error)
    return helmErrorResponse(
      'Failed to generate weekly report',
      500,
      error instanceof Error ? error.message : undefined
    )
  }
}
```

---

## 7. Monthly Endpoint Implementation

**File:** `src/app/api/helm/report-data/monthly/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { verifyHelmAuth, helmErrorResponse } from '@/lib/helm/auth'
import {
  getMonthBounds,
  getPreviousMonthBounds,
  getTotalPhotographers,
  countActivePhotographers,
  getTotalClients,
  getTotalGalleries,
  getTotalPhotos,
  calculateMRR,
  getTotalRevenue,
  getSubscriptionBreakdown,
  countChurnedClients,
  countActiveSubscriptions,
  getCommissionSummary,
  calculateGrowth,
  countNewClients,
  countGalleries
} from '@/lib/helm/queries'
import {
  MonthlyReportData,
  HelmApiSuccessResponse
} from '@/lib/helm/types'

export async function GET(request: NextRequest) {
  // Verify authentication
  const authError = verifyHelmAuth(request)
  if (authError) return authError

  // Get month and year parameters
  const { searchParams } = new URL(request.url)
  const monthParam = searchParams.get('month')
  const yearParam = searchParams.get('year')

  if (!monthParam || !yearParam) {
    return helmErrorResponse('Missing required parameters: month and year', 400)
  }

  const month = parseInt(monthParam, 10)
  const year = parseInt(yearParam, 10)

  // Validate month (1-12) and year
  if (isNaN(month) || month < 1 || month > 12) {
    return helmErrorResponse('Invalid month. Must be 1-12', 400)
  }

  if (isNaN(year) || year < 2000 || year > 2100) {
    return helmErrorResponse('Invalid year. Must be between 2000 and 2100', 400)
  }

  try {
    const supabase = createServiceRoleClient()
    const { start, end } = getMonthBounds(month, year)
    const prev = getPreviousMonthBounds(month, year)

    // Current month metrics
    const [
      totalPhotographers,
      activePhotographers,
      totalClients,
      totalGalleries,
      totalPhotos,
      mrr,
      totalRevenue,
      subscriptionBreakdown,
      churnedThisMonth,
      activeAtStartOfMonth,
      commissionSummary
    ] = await Promise.all([
      getTotalPhotographers(supabase),
      countActivePhotographers(supabase, start, end),
      getTotalClients(supabase),
      getTotalGalleries(supabase),
      getTotalPhotos(supabase),
      calculateMRR(supabase),
      getTotalRevenue(supabase, start, end),
      getSubscriptionBreakdown(supabase),
      countChurnedClients(supabase, start, end),
      countActiveSubscriptions(supabase), // Approximation for start of month
      getCommissionSummary(supabase, start, end)
    ])

    // Calculate churn rate
    const churnRate = activeAtStartOfMonth > 0
      ? Math.round((churnedThisMonth / activeAtStartOfMonth) * 10000) / 100
      : 0

    // Previous month metrics for growth calculations
    const [
      prevMrr,
      prevPhotographers,
      prevClients,
      prevGalleries
    ] = await Promise.all([
      calculateMRR(supabase), // Would need historical data for accurate prev MRR
      getTotalPhotographers(supabase), // Snapshot - would need historical
      countNewClients(supabase, prev.start, prev.end),
      countGalleries(supabase, prev.start, prev.end)
    ])

    // Current month new counts for growth
    const [
      newClientsThisMonth,
      newGalleriesThisMonth
    ] = await Promise.all([
      countNewClients(supabase, start, end),
      countGalleries(supabase, start, end)
    ])

    // Format dates for response
    const startDate = new Date(start).toISOString().split('T')[0]
    const endDate = new Date(end).toISOString().split('T')[0]

    const data: MonthlyReportData = {
      period: {
        month,
        year,
        startDate,
        endDate
      },
      dataFreshnessUtc: new Date().toISOString(),
      metrics: {
        totalPhotographers,
        activePhotographers,
        totalClients,
        totalGalleries,
        totalPhotos,
        mrr,
        arr: mrr * 12,
        totalRevenue,
        churnRate
      },
      subscriptionBreakdown,
      growth: {
        mrrGrowth: 0, // Would need historical MRR data
        photographerGrowth: 0, // Would need historical data
        clientGrowth: calculateGrowth(newClientsThisMonth, prevClients),
        galleryGrowth: calculateGrowth(newGalleriesThisMonth, prevGalleries)
      },
      commissionSummary
    }

    const response: HelmApiSuccessResponse<MonthlyReportData> = {
      success: true,
      data
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[HelmMonthlyReport] Error:', error)
    return helmErrorResponse(
      'Failed to generate monthly report',
      500,
      error instanceof Error ? error.message : undefined
    )
  }
}
```

---

## 8. Alert Detection Logic

| Alert Type | Detection Query | Severity |
|------------|-----------------|----------|
| `churn_risk` | `subscriptions WHERE status='past_due' AND payment_failure_count >= 2` | `critical` if >= 3 failures, else `warning` |
| `payment_failed` | Commission with `status='failed'` created today | `critical` |
| `inactive_photographer` | Photographer with `platform_subscription_status='active'` but no galleries in 30 days | `warning` |
| `gallery_stuck` | Gallery with `gallery_status='draft'` for > 14 days | `info` |

The alert detection is implemented in `src/lib/helm/queries.ts` in the `detectAlerts()` function.

---

## 9. Environment Variables

Add to `.env.local`:

```bash
# Helm Integration API Key
# Generate with: openssl rand -base64 32
HELM_API_KEY=your-secure-random-key-here
```

**Key requirements:**
- Minimum 32 characters
- Randomly generated (use `openssl rand -base64 32`)
- Share this key with Helm team to add to Helm's `.env.local` as `PHOTOVAULT_API_KEY`

---

## 10. Testing Plan

### Manual Testing via cURL

```bash
# Set your API key
export HELM_API_KEY="your-key-here"

# Test Daily Endpoint
curl -X GET "http://localhost:3002/api/helm/report-data/daily?date=2026-01-09" \
  -H "Authorization: Bearer $HELM_API_KEY" \
  -H "Content-Type: application/json"

# Test Weekly Endpoint
curl -X GET "http://localhost:3002/api/helm/report-data/weekly?weekStart=2026-01-06" \
  -H "Authorization: Bearer $HELM_API_KEY" \
  -H "Content-Type: application/json"

# Test Monthly Endpoint
curl -X GET "http://localhost:3002/api/helm/report-data/monthly?month=1&year=2026" \
  -H "Authorization: Bearer $HELM_API_KEY" \
  -H "Content-Type: application/json"

# Test unauthorized access (should return 401)
curl -X GET "http://localhost:3002/api/helm/report-data/daily?date=2026-01-09" \
  -H "Content-Type: application/json"

# Test missing parameter (should return 400)
curl -X GET "http://localhost:3002/api/helm/report-data/daily" \
  -H "Authorization: Bearer $HELM_API_KEY"

# Test invalid date format (should return 400)
curl -X GET "http://localhost:3002/api/helm/report-data/daily?date=01-09-2026" \
  -H "Authorization: Bearer $HELM_API_KEY"
```

### Test Cases

1. **Authentication Tests**
   - [ ] Returns 401 when no Authorization header
   - [ ] Returns 401 when wrong Bearer token
   - [ ] Returns 200 when correct Bearer token

2. **Parameter Validation Tests**
   - [ ] Daily: Returns 400 when missing `date`
   - [ ] Daily: Returns 400 when invalid date format
   - [ ] Weekly: Returns 400 when missing `weekStart`
   - [ ] Monthly: Returns 400 when missing `month` or `year`
   - [ ] Monthly: Returns 400 when month is not 1-12

3. **Data Correctness Tests**
   - [ ] Daily: Returns correct gallery count for date
   - [ ] Daily: Returns correct photo count for date
   - [ ] Weekly: Returns correct trend percentages
   - [ ] Monthly: Returns correct subscription breakdown

4. **Edge Cases**
   - [ ] Returns zero counts when no data for period
   - [ ] Returns empty arrays (not null) for recentGalleries/recentPayments
   - [ ] Handles future dates gracefully
   - [ ] Handles very old dates gracefully

---

## 11. TDD Requirements

Write these tests BEFORE implementing the endpoints.

**File:** `src/app/api/helm/report-data/__tests__/daily.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../daily/route'
import { NextRequest } from 'next/server'

// Mock the Supabase client
vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lt: vi.fn(() => ({
            count: 5,
            data: [],
            error: null
          }))
        }))
      }))
    }))
  }))
}))

describe('GET /api/helm/report-data/daily', () => {
  beforeEach(() => {
    process.env.HELM_API_KEY = 'test-api-key'
  })

  it('returns 401 when no authorization header', async () => {
    const request = new NextRequest('http://localhost/api/helm/report-data/daily?date=2026-01-09')
    const response = await GET(request)
    expect(response.status).toBe(401)
  })

  it('returns 401 when wrong authorization header', async () => {
    const request = new NextRequest('http://localhost/api/helm/report-data/daily?date=2026-01-09', {
      headers: { Authorization: 'Bearer wrong-key' }
    })
    const response = await GET(request)
    expect(response.status).toBe(401)
  })

  it('returns 400 when missing date parameter', async () => {
    const request = new NextRequest('http://localhost/api/helm/report-data/daily', {
      headers: { Authorization: 'Bearer test-api-key' }
    })
    const response = await GET(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('date')
  })

  it('returns 400 when invalid date format', async () => {
    const request = new NextRequest('http://localhost/api/helm/report-data/daily?date=01-09-2026', {
      headers: { Authorization: 'Bearer test-api-key' }
    })
    const response = await GET(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('format')
  })

  it('returns 200 with valid request', async () => {
    const request = new NextRequest('http://localhost/api/helm/report-data/daily?date=2026-01-09', {
      headers: { Authorization: 'Bearer test-api-key' }
    })
    const response = await GET(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
    expect(body.data.metrics).toBeDefined()
    expect(body.data.activity).toBeDefined()
    expect(body.data.alerts).toBeDefined()
  })

  it('returns monetary values in cents', async () => {
    const request = new NextRequest('http://localhost/api/helm/report-data/daily?date=2026-01-09', {
      headers: { Authorization: 'Bearer test-api-key' }
    })
    const response = await GET(request)
    const body = await response.json()
    expect(typeof body.data.metrics.totalRevenue).toBe('number')
    // Should be integer cents, not decimal dollars
    expect(Number.isInteger(body.data.metrics.totalRevenue)).toBe(true)
  })

  it('returns timestamps in ISO 8601 format', async () => {
    const request = new NextRequest('http://localhost/api/helm/report-data/daily?date=2026-01-09', {
      headers: { Authorization: 'Bearer test-api-key' }
    })
    const response = await GET(request)
    const body = await response.json()
    expect(body.data.dataFreshnessUtc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('returns empty arrays not null for activity', async () => {
    const request = new NextRequest('http://localhost/api/helm/report-data/daily?date=2026-01-09', {
      headers: { Authorization: 'Bearer test-api-key' }
    })
    const response = await GET(request)
    const body = await response.json()
    expect(Array.isArray(body.data.activity.recentGalleries)).toBe(true)
    expect(Array.isArray(body.data.activity.recentPayments)).toBe(true)
    expect(Array.isArray(body.data.alerts)).toBe(true)
  })
})
```

Similar test files needed for:
- `src/app/api/helm/report-data/__tests__/weekly.test.ts`
- `src/app/api/helm/report-data/__tests__/monthly.test.ts`

---

## 12. Implementation Checklist

### Phase 1: Setup
- [ ] Add `HELM_API_KEY` to `.env.local`
- [ ] Create `src/lib/helm/` directory
- [ ] Create `src/lib/helm/types.ts`
- [ ] Create `src/lib/helm/auth.ts`
- [ ] Create `src/lib/helm/queries.ts`

### Phase 2: TDD - Write Tests First
- [ ] Write tests for daily endpoint
- [ ] Write tests for weekly endpoint
- [ ] Write tests for monthly endpoint
- [ ] Run tests (should all fail)

### Phase 3: Implement Endpoints
- [ ] Create `src/app/api/helm/report-data/daily/route.ts`
- [ ] Run daily tests (should pass)
- [ ] Create `src/app/api/helm/report-data/weekly/route.ts`
- [ ] Run weekly tests (should pass)
- [ ] Create `src/app/api/helm/report-data/monthly/route.ts`
- [ ] Run monthly tests (should pass)

### Phase 4: Integration Testing
- [ ] Test with real Supabase data via cURL
- [ ] Verify authentication works
- [ ] Verify error responses are consistent
- [ ] Test from Helm side (once Helm is ready)

### Phase 5: Cleanup
- [ ] Remove unused imports
- [ ] Add JSDoc comments
- [ ] Update existing `/api/helm/metrics` to use correct table names (separate task)

---

## 13. Database Investigation Findings (2026-01-10)

### Issue 1: `topPhotographers.email` Resolution

**Finding:** `user_profiles` has no email column, but `photographers.id` directly maps to `auth.users.id`.

**Query that works:**
```sql
SELECT p.id, u.email
FROM photographers p
JOIN auth.users u ON p.id = u.id
```

**Update to `getTopPhotographers()` in queries.ts:**

```typescript
/**
 * Get top photographers by revenue in date range
 * Updated: Now includes email from auth.users
 */
export async function getTopPhotographers(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
  limit: number = 5
): Promise<TopPhotographer[]> {
  // Get commissions with photographer info
  const { data: commissions, error: commError } = await supabase
    .from('commissions')
    .select('photographer_id, amount_cents')
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  if (commError) throw new Error(`Failed to get commissions: ${commError.message}`)

  // Get galleries created in period
  const { data: galleries, error: galError } = await supabase
    .from('photo_galleries')
    .select('photographer_id')
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  if (galError) throw new Error(`Failed to get galleries: ${galError.message}`)

  // Aggregate by photographer
  const photographerStats = new Map<string, { revenue: number; galleries: number }>()

  commissions?.forEach(comm => {
    const stats = photographerStats.get(comm.photographer_id) || { revenue: 0, galleries: 0 }
    stats.revenue += comm.amount_cents || 0
    photographerStats.set(comm.photographer_id, stats)
  })

  galleries?.forEach(gal => {
    const stats = photographerStats.get(gal.photographer_id) || { revenue: 0, galleries: 0 }
    stats.galleries += 1
    photographerStats.set(gal.photographer_id, stats)
  })

  // Sort by revenue and take top N
  const sortedPhotographers = Array.from(photographerStats.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, limit)

  if (sortedPhotographers.length === 0) return []

  // Get photographer details including email from auth.users
  const photographerIds = sortedPhotographers.map(([id]) => id)

  // Query user_profiles for names
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, full_name, business_name')
    .in('id', photographerIds)

  if (profileError) {
    console.warn(`Failed to get photographer profiles: ${profileError.message}`)
  }

  // Query auth.users for emails (service role can access this)
  const { data: authUsers, error: authError } = await supabase
    .from('auth.users')
    .select('id, email')
    .in('id', photographerIds)

  // Note: If direct auth.users query fails, use RPC function:
  // CREATE FUNCTION get_user_emails(user_ids uuid[]) RETURNS TABLE(id uuid, email text)
  // AS $$ SELECT id, email FROM auth.users WHERE id = ANY(user_ids) $$
  // LANGUAGE sql SECURITY DEFINER;

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
  const emailMap = new Map(authUsers?.map(u => [u.id, u.email]) || [])

  return sortedPhotographers.map(([id, stats]) => {
    const profile = profileMap.get(id)
    return {
      id,
      name: profile?.business_name || profile?.full_name || 'Unknown',
      email: emailMap.get(id) || '', // Now populated from auth.users
      galleries: stats.galleries,
      revenue: stats.revenue
    }
  })
}
```

---

### Issue 2: `payment_failed` Alert Resolution

**Finding:** `commissions.status` only has values: `paid` (13 rows), `pending` (2 rows). No `'failed'` status exists.

**Alternative:** The `webhook_logs` table tracks Stripe webhook events, including:
- `charge.failed` (3 occurrences)
- `invoice.payment_failed` (3 occurrences)
- `payment_intent.payment_failed` (3 occurrences)

**Update to `detectAlerts()` in queries.ts - Add this detection:**

```typescript
// 4. Payment Failed: Check webhook_logs for failed payment events today
const today = new Date()
today.setUTCHours(0, 0, 0, 0)
const todayStart = today.toISOString()

const { data: failedPayments, error: failedError } = await supabase
  .from('webhook_logs')
  .select('id, event_id, event_type, created_at')
  .in('event_type', ['charge.failed', 'invoice.payment_failed', 'payment_intent.payment_failed'])
  .gte('created_at', todayStart)
  .limit(10)

if (!failedError && failedPayments) {
  failedPayments.forEach(event => {
    alerts.push({
      type: 'payment_failed',
      message: `Payment failed: ${event.event_type} (Event ID: ${event.event_id})`,
      severity: 'critical',
      entityId: event.event_id
    })
  })
}
```

**Note:** This approach uses webhook logs instead of commission status. The `webhook_logs` table has no RLS, so service role client can query it directly.

---

### Issue 3: `commissions.status` Valid Values

**Finding:** Actual values in database:
- `paid` - 13 rows
- `pending` - 2 rows

The schema catalog shows `'pending' | 'paid' | 'cancelled' | 'refunded'` which is correct - `cancelled` and `refunded` simply have 0 rows currently.

**No change needed** - the type definition is correct.

---

## 14. Updated API Contract Alignment

After database investigation, the implementation now aligns with these realities:

| Contract Requirement | Implementation |
|---------------------|----------------|
| `topPhotographers.email` | ✅ Query from `auth.users` via `photographers.id` join |
| `payment_failed` alert | ✅ Query from `webhook_logs` for failed payment events |
| All 4 alert types | ✅ Now fully implemented |

---

## 15. Notes for Implementation

1. **Use `createServiceRoleClient()`** from `@/lib/supabase-server.ts` - these are internal API calls that need to bypass RLS.

2. **All monetary values in CENTS** - Never divide by 100 for dollars. Helm handles display formatting.

3. **All timestamps in ISO 8601 UTC** - Always use `.toISOString()`.

4. **Empty arrays, not null** - Return `[]` for empty activity arrays.

5. **Performance optimization** - All queries within an endpoint use `Promise.all()` for parallel execution.

6. **Error handling** - Use the consistent error format from `helmErrorResponse()`.

7. **The existing `/api/helm/metrics` endpoint uses wrong table names** - This is a known issue but NOT in scope for this plan. Create a separate task to fix it.

---

*Plan version 1.0 - Ready for implementation*
