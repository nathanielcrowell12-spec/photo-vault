import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { headers } from 'next/headers'
import { trackServerEvent } from '@/lib/analytics/server'
import { EVENTS } from '@/types/analytics'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Track photo download
 * POST /api/gallery/download
 *
 * Records a download for Shoot Only galleries to track completion.
 * When all photos are downloaded, the gallery can expire.
 *
 * Body:
 * {
 *   galleryId: string
 *   photoId: string
 *   downloadType?: 'individual' | 'bulk' | 'zip'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // 1. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const { galleryId, photoId, downloadType = 'individual' } = body

    if (!galleryId || !photoId) {
      return NextResponse.json(
        { error: 'Missing required fields: galleryId, photoId' },
        { status: 400 }
      )
    }

    // 3. Check if gallery has download tracking enabled
    const { data: gallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .select(`
        id,
        photographer_id,
        client_id,
        download_tracking_enabled,
        total_photos_to_download,
        photos_downloaded,
        all_photos_downloaded,
        payment_option_id
      `)
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // 4. Verify user has access to this gallery
    // User must be the client assigned to this gallery
    let hasAccess = false

    if (gallery.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('user_id, email')
        .eq('id', gallery.client_id)
        .single()

      if (client) {
        hasAccess = client.user_id === user.id ||
          client.email?.toLowerCase() === user.email?.toLowerCase()
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this gallery' },
        { status: 403 }
      )
    }

    // 5. Record the download (if tracking is enabled)
    if (gallery.download_tracking_enabled) {
      // Get request metadata
      const headersList = await headers()
      const userAgent = headersList.get('user-agent') || ''
      const forwardedFor = headersList.get('x-forwarded-for')
      const realIp = headersList.get('x-real-ip')
      const ipAddress = forwardedFor?.split(',')[0] || realIp || null

      // Insert download record
      // The unique constraint will prevent duplicate downloads of the same photo
      const { error: insertError } = await supabase
        .from('photo_downloads')
        .insert({
          gallery_id: galleryId,
          photo_id: photoId,
          client_id: gallery.client_id,
          downloaded_by: user.id,
          download_type: downloadType,
          ip_address: ipAddress,
          user_agent: userAgent,
        })

      if (insertError) {
        // If it's a unique constraint violation, the photo was already downloaded
        if (insertError.code === '23505') {
          console.log(`[Download] Photo ${photoId} already downloaded by user ${user.id}`)
        } else {
          console.error('[Download] Error recording download:', insertError)
        }
      }

      // 6. Check if all photos are now downloaded
      // The trigger in the database handles this, but we can also check here
      const { data: updatedGallery } = await supabase
        .from('photo_galleries')
        .select('photos_downloaded, all_photos_downloaded, total_photos_to_download')
        .eq('id', galleryId)
        .single()

      if (updatedGallery?.all_photos_downloaded && !gallery.all_photos_downloaded) {
        console.log(`[Download] Gallery ${galleryId} - all photos downloaded!`)
      }

      // Track download event (server-side - engagement tracking)
      try {
        await trackServerEvent(user.id, EVENTS.CLIENT_DOWNLOADED_PHOTO, {
          gallery_id: galleryId,
          photographer_id: gallery.photographer_id || '',
          download_type: downloadType,
        })
      } catch (trackError) {
        console.error('[Download] Error tracking download:', trackError)
        // Don't block download if tracking fails
      }

      return NextResponse.json({
        success: true,
        photosDownloaded: updatedGallery?.photos_downloaded || 0,
        totalPhotos: updatedGallery?.total_photos_to_download || 0,
        allDownloaded: updatedGallery?.all_photos_downloaded || false,
      })
    }

    // If tracking not enabled, just return success
    return NextResponse.json({
      success: true,
      trackingEnabled: false,
    })

  } catch (error) {
    const err = error as Error
    console.error('[Download] Error:', err)
    return NextResponse.json(
      { error: 'Failed to track download', message: err.message },
      { status: 500 }
    )
  }
}

/**
 * Record bulk download (multiple photos at once)
 * PUT /api/gallery/download
 *
 * Body:
 * {
 *   galleryId: string
 *   photoIds: string[]
 *   downloadType?: 'bulk' | 'zip'
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // 1. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const { galleryId, photoIds, downloadType = 'bulk' } = body

    if (!galleryId || !photoIds || !Array.isArray(photoIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: galleryId, photoIds (array)' },
        { status: 400 }
      )
    }

    // 3. Check if gallery has download tracking enabled
    const { data: gallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .select(`
        id,
        client_id,
        download_tracking_enabled
      `)
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // 4. Verify user has access
    if (gallery.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('user_id, email')
        .eq('id', gallery.client_id)
        .single()

      const hasAccess = client &&
        (client.user_id === user.id || client.email?.toLowerCase() === user.email?.toLowerCase())

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'You do not have access to this gallery' },
          { status: 403 }
        )
      }
    }

    // 5. Record bulk downloads
    if (gallery.download_tracking_enabled && photoIds.length > 0) {
      const headersList = await headers()
      const userAgent = headersList.get('user-agent') || ''
      const forwardedFor = headersList.get('x-forwarded-for')
      const realIp = headersList.get('x-real-ip')
      const ipAddress = forwardedFor?.split(',')[0] || realIp || null

      // Batch insert - ignore duplicates
      const downloads = photoIds.map(photoId => ({
        gallery_id: galleryId,
        photo_id: photoId,
        client_id: gallery.client_id,
        downloaded_by: user.id,
        download_type: downloadType,
        ip_address: ipAddress,
        user_agent: userAgent,
      }))

      // Use upsert to handle existing records
      const { error: insertError } = await supabase
        .from('photo_downloads')
        .upsert(downloads, {
          onConflict: 'gallery_id,photo_id,downloaded_by',
          ignoreDuplicates: true,
        })

      if (insertError) {
        console.error('[Download] Error recording bulk download:', insertError)
      }
    }

    // 6. Get updated counts
    const { data: updatedGallery } = await supabase
      .from('photo_galleries')
      .select('photos_downloaded, all_photos_downloaded, total_photos_to_download')
      .eq('id', galleryId)
      .single()

    return NextResponse.json({
      success: true,
      photosDownloaded: updatedGallery?.photos_downloaded || 0,
      totalPhotos: updatedGallery?.total_photos_to_download || 0,
      allDownloaded: updatedGallery?.all_photos_downloaded || false,
      recordedCount: photoIds.length,
    })

  } catch (error) {
    const err = error as Error
    console.error('[Download] Error:', err)
    return NextResponse.json(
      { error: 'Failed to track bulk download', message: err.message },
      { status: 500 }
    )
  }
}

/**
 * Get download progress for a gallery
 * GET /api/gallery/download?galleryId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // 1. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get gallery ID from query
    const { searchParams } = new URL(request.url)
    const galleryId = searchParams.get('galleryId')

    if (!galleryId) {
      return NextResponse.json(
        { error: 'Missing galleryId parameter' },
        { status: 400 }
      )
    }

    // 3. Get gallery download status
    const { data: gallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .select(`
        id,
        client_id,
        photographer_id,
        download_tracking_enabled,
        total_photos_to_download,
        photos_downloaded,
        all_photos_downloaded,
        download_completed_at,
        payment_option_id,
        gallery_expires_at
      `)
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // 4. Verify user has access (client or photographer)
    let hasAccess = gallery.photographer_id === user.id

    if (!hasAccess && gallery.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('user_id, email')
        .eq('id', gallery.client_id)
        .single()

      hasAccess = !!client &&
        (client.user_id === user.id || client.email?.toLowerCase() === user.email?.toLowerCase())
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this gallery' },
        { status: 403 }
      )
    }

    // 5. Return download progress
    return NextResponse.json({
      galleryId: gallery.id,
      trackingEnabled: gallery.download_tracking_enabled,
      totalPhotos: gallery.total_photos_to_download,
      photosDownloaded: gallery.photos_downloaded,
      allDownloaded: gallery.all_photos_downloaded,
      completedAt: gallery.download_completed_at,
      paymentOption: gallery.payment_option_id,
      expiresAt: gallery.gallery_expires_at,
      isShootOnly: gallery.payment_option_id === 'shoot_only',
    })

  } catch (error) {
    const err = error as Error
    console.error('[Download] Error:', err)
    return NextResponse.json(
      { error: 'Failed to get download progress', message: err.message },
      { status: 500 }
    )
  }
}
