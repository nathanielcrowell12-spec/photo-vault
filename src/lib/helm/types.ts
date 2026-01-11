/**
 * Helm Integration API Type Definitions
 * All monetary values in CENTS, all timestamps in ISO 8601 UTC
 *
 * Matches Helm spec: PHOTOVAULT_REPORT_API_SPEC.md
 */

// ============================================================================
// Shared Types
// ============================================================================

// Gallery status per Helm API spec
export type GalleryStatus = 'draft' | 'published' | 'archived'

// Database gallery status (internal use)
export type DatabaseGalleryStatus = 'draft' | 'ready' | 'live' | 'archived'

// Payment status per Helm API spec
export type PaymentStatus = 'pending' | 'completed' | 'failed'

// Database commission status (internal use)
export type CommissionStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'

export type AlertType = 'churn_risk' | 'payment_failed' | 'inactive_photographer' | 'gallery_stuck'
export type AlertSeverity = 'critical' | 'warning' | 'info'
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'incomplete'

// Error codes per Helm spec
export type HelmErrorCode = 'MISSING_PARAMETER' | 'UNAUTHORIZED' | 'NO_DATA' | 'INTERNAL_ERROR'

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
  status: PaymentStatus // 'pending' | 'completed' | 'failed' per Helm spec
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

// Error response per Helm spec - no wrapper, just error + code
export interface HelmApiErrorResponse {
  error: string
  code: HelmErrorCode
}

// Note: Success responses return data directly (no wrapper) per Helm spec
// Example: { period: {...}, metrics: {...} } not { success: true, data: {...} }
