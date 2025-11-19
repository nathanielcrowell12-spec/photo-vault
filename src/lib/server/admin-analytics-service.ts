'use server'

import { createServiceRoleClient } from '@/lib/supabase-server'

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

export type AdminAnalyticsData = {
  metrics: AnalyticsMetrics
  recentEvents: RecentEvent[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export async function fetchAdminAnalyticsData(): Promise<AdminAnalyticsData> {
  const supabase = createServiceRoleClient()

  try {
    // Fetch total users - use count for safety
    const { count: totalUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })

    if (usersError) {
      console.warn('[admin-analytics-service] Could not fetch total users', usersError)
    }

    // Fetch total photos uploaded - use count for safety
    const { count: photosUploaded, error: photosError } = await supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })

    if (photosError) {
      console.warn('[admin-analytics-service] Could not fetch photos count', photosError)
    }

    // Fetch total file sizes for storage calculation
    const { data: photoSizes, error: sizesError } = await supabase
      .from('photos')
      .select('file_size')

    if (sizesError) {
      console.warn('[admin-analytics-service] Could not fetch photo sizes', sizesError)
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
      console.warn('[admin-analytics-service] Could not fetch active gallery users', activeGalleryError)
    }

    const { count: activePhotoUsers, error: activePhotoError } = await supabase
      .from('photos')
      .select('gallery_id', { count: 'exact', head: true })
      .gte('created_at', startOfDay.toISOString())

    if (activePhotoError) {
      console.warn('[admin-analytics-service] Could not fetch active photo users', activePhotoError)
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

    return {
      metrics: {
        totalUsers: totalUsers || 0,
        photosUploaded: photosUploaded || 0,
        storageUsed,
        activeToday,
      },
      recentEvents: recentEvents.slice(0, 5), // Return top 5 most recent events
    }
  } catch (error) {
    console.error('[admin-analytics-service] Failed to fetch analytics data', error)

    // Return safe defaults on error
    return {
      metrics: {
        totalUsers: 0,
        photosUploaded: 0,
        storageUsed: '0 B',
        activeToday: 0,
      },
      recentEvents: [],
    }
  }
}
