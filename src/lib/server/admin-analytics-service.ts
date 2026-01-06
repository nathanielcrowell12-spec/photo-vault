'use server'

import { createServiceRoleClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export type AnalyticsMetrics = {
  totalUsers: number
  photosUploaded: number
  storageUsed: string
  activeToday: number
}

export type RecentEvent = {
  id: string
  type: string
  description: string
  timestamp: string
}

// Chart data types for admin analytics
export type UserGrowthDataPoint = {
  date: string           // "Jan 2026", "Feb 2026", etc.
  photographers: number  // Cumulative photographer count
  clients: number        // Cumulative client count
  total: number          // Total users
}

export type GalleryStatusBreakdown = {
  status: string         // "Draft", "Ready", "Live", "Archived"
  count: number
  percentage: number
}

export type HealthCheckData = {
  status: 'healthy' | 'degraded' | 'unhealthy'
  queryLatencyMs: number
  tableCounts: {
    users: number
    galleries: number
    photos: number
  }
  lastChecked: string
}

export type AdminAnalyticsData = {
  metrics: AnalyticsMetrics
  recentEvents: RecentEvent[]
  userGrowth: UserGrowthDataPoint[]
  galleryBreakdown: GalleryStatusBreakdown[]
  healthCheck: HealthCheckData
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Fetch user growth data - last 6 months cumulative counts
async function fetchUserGrowthData(supabase: ReturnType<typeof createServiceRoleClient>): Promise<UserGrowthDataPoint[]> {
  const months: UserGrowthDataPoint[] = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    const monthLabel = monthEnd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

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

// Fetch gallery status breakdown - uses gallery_status column (not status)
async function fetchGalleryBreakdown(supabase: ReturnType<typeof createServiceRoleClient>): Promise<GalleryStatusBreakdown[]> {
  const breakdown: GalleryStatusBreakdown[] = []

  // Get total galleries count
  const { count: totalGalleries } = await supabase
    .from('photo_galleries')
    .select('id', { count: 'exact', head: true })

  const total = totalGalleries || 0

  // Get counts by status - using gallery_status column (not status)
  const statuses = ['draft', 'ready', 'live', 'archived']

  for (const status of statuses) {
    const { count } = await supabase
      .from('photo_galleries')
      .select('id', { count: 'exact', head: true })
      .eq('gallery_status', status)  // CORRECT: gallery_status, not status

    const statusCount = count || 0
    if (statusCount > 0) {  // Only include statuses with data
      breakdown.push({
        status: status.charAt(0).toUpperCase() + status.slice(1),  // Capitalize
        count: statusCount,
        percentage: total > 0 ? Math.round((statusCount / total) * 100) : 0
      })
    }
  }

  return breakdown
}

// Fetch health check data - simple row counts and query timing
async function fetchHealthCheckData(supabase: ReturnType<typeof createServiceRoleClient>): Promise<HealthCheckData> {
  const startTime = Date.now()
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

  try {
    // Simple row counts (no pg_total_relation_size - requires elevated permissions)
    const [usersResult, galleriesResult, photosResult] = await Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('photo_galleries').select('id', { count: 'exact', head: true }),
      supabase.from('gallery_photos').select('id', { count: 'exact', head: true })  // Use gallery_photos as primary
    ])

    const queryLatencyMs = Date.now() - startTime

    // Determine health status based on latency
    if (queryLatencyMs > 5000) {
      status = 'unhealthy'
    } else if (queryLatencyMs > 1000) {
      status = 'degraded'
    }

    // Check for errors
    if (usersResult.error || galleriesResult.error || photosResult.error) {
      status = 'degraded'
    }

    return {
      status,
      queryLatencyMs,
      tableCounts: {
        users: usersResult.count || 0,
        galleries: galleriesResult.count || 0,
        photos: photosResult.count || 0
      },
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    logger.error('[admin-analytics-service] Health check failed', error)
    return {
      status: 'unhealthy',
      queryLatencyMs: Date.now() - startTime,
      tableCounts: { users: 0, galleries: 0, photos: 0 },
      lastChecked: new Date().toISOString()
    }
  }
}

export async function fetchAdminAnalyticsData(): Promise<AdminAnalyticsData> {
  const supabase = createServiceRoleClient()

  try {
    // Fetch total users - use count for safety
    const { count: totalUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })

    if (usersError) {
      logger.warn('[admin-analytics-service] Could not fetch total users', usersError)
    }

    // Fetch total photos uploaded - use count for safety
    const { count: photosUploaded, error: photosError } = await supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })

    if (photosError) {
      logger.warn('[admin-analytics-service] Could not fetch photos count', photosError)
    }

    // Fetch total file sizes for storage calculation
    const { data: photoSizes, error: sizesError } = await supabase
      .from('photos')
      .select('file_size')

    if (sizesError) {
      logger.warn('[admin-analytics-service] Could not fetch photo sizes', sizesError)
    }

    const totalBytes = photoSizes?.reduce((sum, photo) => sum + (photo.file_size || 0), 0) || 0
    const storageUsed = formatBytes(totalBytes)

    // Calculate active users today (users who created galleries or uploaded photos today)
    const today = new Date()
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0))

    const { count: activeGalleryUsers, error: activeGalleryError } = await supabase
      .from('photo_galleries')
      .select('photographer_id', { count: 'exact', head: true })
      .gte('created_at', startOfDay.toISOString())

    if (activeGalleryError) {
      logger.warn('[admin-analytics-service] Could not fetch active gallery users', activeGalleryError)
    }

    const { count: activePhotoUsers, error: activePhotoError } = await supabase
      .from('photos')
      .select('gallery_id', { count: 'exact', head: true })
      .gte('created_at', startOfDay.toISOString())

    if (activePhotoError) {
      logger.warn('[admin-analytics-service] Could not fetch active photo users', activePhotoError)
    }

    // Approximate active users (this is a rough estimate)
    const activeToday = Math.max(activeGalleryUsers || 0, activePhotoUsers || 0)

    // Fetch recent events from multiple sources
    const recentEvents: RecentEvent[] = []

    // Get recent user signups
    const { data: recentSignups, error: signupsError } = await supabase
      .from('user_profiles')
      .select('id, user_type, created_at')
      .order('created_at', { ascending: false })
      .limit(3)

    if (!signupsError && recentSignups) {
      recentSignups.forEach((signup) => {
        recentEvents.push({
          id: `signup-${signup.id}`,
          type: 'User Signup',
          description: `New ${signup.user_type} registration`,
          timestamp: new Date(signup.created_at).toLocaleString(),
        })
      })
    }

    // Get recent gallery creations
    const { data: recentGalleries, error: galleriesError } = await supabase
      .from('photo_galleries')
      .select('id, gallery_name, created_at')
      .order('created_at', { ascending: false })
      .limit(2)

    if (!galleriesError && recentGalleries) {
      recentGalleries.forEach((gallery) => {
        recentEvents.push({
          id: `gallery-${gallery.id}`,
          type: 'Gallery Created',
          description: `"${gallery.gallery_name}" created`,
          timestamp: new Date(gallery.created_at).toLocaleString(),
        })
      })
    }

    // Get recent photo uploads
    const { data: recentPhotos, error: photosRecentError } = await supabase
      .from('photos')
      .select('id, filename, created_at')
      .order('created_at', { ascending: false })
      .limit(2)

    if (!photosRecentError && recentPhotos) {
      recentPhotos.forEach((photo) => {
        recentEvents.push({
          id: `photo-${photo.id}`,
          type: 'Photo Upload',
          description: `"${photo.filename}" uploaded`,
          timestamp: new Date(photo.created_at).toLocaleString(),
        })
      })
    }

    // Sort all events by timestamp (most recent first)
    recentEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Fetch chart data in parallel for performance
    const [userGrowth, galleryBreakdown, healthCheck] = await Promise.all([
      fetchUserGrowthData(supabase).catch(err => {
        logger.warn('[admin-analytics-service] User growth fetch failed', err)
        return [] as UserGrowthDataPoint[]
      }),
      fetchGalleryBreakdown(supabase).catch(err => {
        logger.warn('[admin-analytics-service] Gallery breakdown fetch failed', err)
        return [] as GalleryStatusBreakdown[]
      }),
      fetchHealthCheckData(supabase).catch(err => {
        logger.warn('[admin-analytics-service] Health check fetch failed', err)
        return {
          status: 'unhealthy' as const,
          queryLatencyMs: 0,
          tableCounts: { users: 0, galleries: 0, photos: 0 },
          lastChecked: new Date().toISOString()
        }
      })
    ])

    return {
      metrics: {
        totalUsers: totalUsers || 0,
        photosUploaded: photosUploaded || 0,
        storageUsed,
        activeToday,
      },
      recentEvents: recentEvents.slice(0, 5), // Return top 5 most recent events
      userGrowth,
      galleryBreakdown,
      healthCheck,
    }
  } catch (error) {
    logger.error('[admin-analytics-service] Failed to fetch analytics data', error)

    // Return safe defaults on error
    return {
      metrics: {
        totalUsers: 0,
        photosUploaded: 0,
        storageUsed: '0 B',
        activeToday: 0,
      },
      recentEvents: [],
      userGrowth: [],
      galleryBreakdown: [],
      healthCheck: {
        status: 'unhealthy',
        queryLatencyMs: 0,
        tableCounts: { users: 0, galleries: 0, photos: 0 },
        lastChecked: new Date().toISOString()
      },
    }
  }
}
