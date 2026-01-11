import { SupabaseClient } from '@supabase/supabase-js'
import {
  HelmAlert,
  RecentGallery,
  RecentPayment,
  TopPhotographer,
  GalleryStatus,
  DatabaseGalleryStatus,
  PaymentStatus
} from './types'

// ============================================================================
// Status Mapping (Database → Helm API)
// ============================================================================

/**
 * Map database gallery status to Helm API status
 * Database: draft, ready, live, archived
 * Helm API: draft, published, archived
 */
function mapGalleryStatus(dbStatus: string): GalleryStatus {
  switch (dbStatus) {
    case 'draft':
      return 'draft'
    case 'ready':
    case 'live':
      return 'published'
    case 'archived':
      return 'archived'
    default:
      return 'draft'
  }
}

/**
 * Map database commission status to Helm API payment status
 * Database: pending, paid, cancelled, refunded
 * Helm API: pending, completed, failed
 */
function mapPaymentStatus(dbStatus: string): PaymentStatus {
  switch (dbStatus) {
    case 'pending':
      return 'pending'
    case 'paid':
      return 'completed'
    case 'cancelled':
    case 'refunded':
      return 'failed'
    default:
      return 'pending'
  }
}

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
  status: DatabaseGalleryStatus,
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
 * Count photographers created in date range
 */
export async function countNewPhotographers(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<number> {
  const { count, error } = await supabase
    .from('photographers')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  if (error) throw new Error(`Failed to count new photographers: ${error.message}`)
  return count || 0
}

/**
 * Count subscriptions that became active in date range
 * Used as a proxy for MRR growth calculation
 */
export async function countNewActiveSubscriptions(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<number> {
  const { count, error } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  if (error) throw new Error(`Failed to count new subscriptions: ${error.message}`)
  return count || 0
}

/**
 * Calculate MRR for a specific period
 * Based on subscriptions that were active and created before the end of that period
 */
export async function calculateMRRForPeriod(
  supabase: SupabaseClient,
  endDate: string
): Promise<number> {
  const MONTHLY_PRICE_CENTS = 800 // $8.00

  // Count subscriptions that are currently active AND were created before the period end
  // This is an approximation since we don't have historical subscription status
  const { count, error } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .lt('created_at', endDate)

  if (error) throw new Error(`Failed to calculate MRR for period: ${error.message}`)
  return (count || 0) * MONTHLY_PRICE_CENTS
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
      status: mapGalleryStatus(row.gallery_status),
      photographerId: row.photographer_id,
      photographerName: 'Unknown',
      createdAt: row.created_at
    }))
  }

  return (data || []).map(row => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = row.user_profiles as any
    return {
      id: row.id,
      name: row.gallery_name || 'Untitled Gallery',
      status: mapGalleryStatus(row.gallery_status),
      photographerId: row.photographer_id,
      photographerName: profile?.business_name || profile?.full_name || 'Unknown',
      createdAt: row.created_at
    }
  })
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
    status: mapPaymentStatus(row.status),
    photographerId: row.photographer_id,
    createdAt: row.created_at
  }))
}

// ============================================================================
// Top Performers Query
// ============================================================================

/**
 * Get top photographers by revenue in date range
 * Updated: Now includes email from auth.users via service role
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

  // Query auth.users for emails (service role can access this via admin API)
  // Note: Direct query to auth.users table via service role
  const { data: authUsers, error: authError } = await supabase
    .rpc('get_user_emails_by_ids', { user_ids: photographerIds })

  // If RPC doesn't exist, emails will be empty
  if (authError) {
    console.warn(`Failed to get auth emails (RPC may not exist): ${authError.message}`)
  }

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
  const emailMap = new Map<string, string>(
    authUsers?.map((u: { id: string; email: string }) => [u.id, u.email] as [string, string]) || []
  )

  return sortedPhotographers.map(([id, stats]) => {
    const profile = profileMap.get(id)
    const email: string = emailMap.get(id) ?? ''
    return {
      id,
      name: profile?.business_name || profile?.full_name || 'Unknown',
      email, // From auth.users if available
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

  // 2. Payment Failed: Check webhook_logs for failed payment events today
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

  // 3. Inactive Photographer: active platform subscription but no galleries in 30 days
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

  // 4. Gallery Stuck: draft status for > 14 days
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
