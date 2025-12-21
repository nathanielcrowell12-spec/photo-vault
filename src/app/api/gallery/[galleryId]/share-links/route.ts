/**
 * Share Links API
 * POST /api/gallery/[galleryId]/share-links - Create a new share link
 * GET /api/gallery/[galleryId]/share-links - List all share links for a gallery
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { v4 as uuidv4 } from 'uuid'
import { trackServerEvent } from '@/lib/analytics/server'
import { EVENTS } from '@/types/analytics'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Max active links per gallery (enforced in app, not DB constraint)
// No limit on share links - free advertising for PhotoVault

// Max expiration in days
const MAX_EXPIRATION_DAYS = 365

/**
 * Create a new share link for a gallery
 * POST /api/gallery/[galleryId]/share-links
 *
 * Requires authentication and active subscription to the gallery (or gallery ownership).
 *
 * Body:
 * {
 *   label?: string;          // Optional label like "Wedding Guests"
 *   expiresInDays?: number;  // Default 30, max 365
 *   downloadLimit?: number;  // Default 5, null = unlimited, 0 = view only
 * }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ galleryId: string }> }
) {
  try {
    const { galleryId } = await context.params
    const supabase = await createServerSupabaseClient()

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const {
      label,
      expiresInDays = 30,
      downloadLimit = 5,
    } = body

    // Validate expiration
    if (expiresInDays < 1 || expiresInDays > MAX_EXPIRATION_DAYS) {
      return NextResponse.json(
        { error: `Expiration must be between 1 and ${MAX_EXPIRATION_DAYS} days` },
        { status: 400 }
      )
    }

    // 3. Check if user has access to create share links for this gallery
    // Need to use service role for cross-table queries
    const adminSupabase = createServiceRoleClient()

    // Check if user has active subscription OR owns the gallery
    const { data: subscription } = await adminSupabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('gallery_id', galleryId)
      .in('status', ['active', 'trialing', 'past_due'])
      .or('access_suspended.is.null,access_suspended.eq.false')
      .maybeSingle()

    const { data: gallery } = await adminSupabase
      .from('photo_galleries')
      .select('id, user_id, photographer_id')
      .eq('id', galleryId)
      .single()

    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    const isOwner = gallery.user_id === user.id
    const hasSubscription = !!subscription

    if (!isOwner && !hasSubscription) {
      return NextResponse.json(
        { error: 'You must be subscribed to this gallery or own it to create share links' },
        { status: 403 }
      )
    }

    // 4. Generate share token
    const shareToken = uuidv4()

    // 5. Calculate expiration
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()

    // 6. Insert share link
    const { data: shareLink, error: insertError } = await adminSupabase
      .from('gallery_share_links')
      .insert({
        gallery_id: galleryId,
        created_by_user_id: user.id,
        share_token: shareToken,
        expires_at: expiresAt,
        download_limit: downloadLimit,
        label: label || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[ShareLinks] Error creating share link:', insertError)
      return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
    }

    // 8. Build share URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
    const shareUrl = `${siteUrl}/gallery/${galleryId}?share=${shareToken}`

    // 9. Track analytics event
    try {
      await trackServerEvent(user.id, EVENTS.SHARE_LINK_CREATED as keyof typeof EVENTS, {
        gallery_id: galleryId,
        photographer_id: gallery.photographer_id || '',
        expires_in_days: expiresInDays,
        download_limit: downloadLimit,
      })
    } catch (trackError) {
      console.error('[ShareLinks] Error tracking event:', trackError)
    }

    console.log(`[ShareLinks] Created share link for gallery ${galleryId} by user ${user.id}`)

    return NextResponse.json({
      id: shareLink.id,
      shareToken: shareLink.share_token,
      shareUrl,
      expiresAt: shareLink.expires_at,
      downloadLimit: shareLink.download_limit,
      label: shareLink.label,
      createdAt: shareLink.created_at,
    })

  } catch (error) {
    const err = error as Error
    console.error('[ShareLinks] Error:', err)
    return NextResponse.json(
      { error: 'Failed to create share link', message: err.message },
      { status: 500 }
    )
  }
}

/**
 * List all share links for a gallery
 * GET /api/gallery/[galleryId]/share-links
 *
 * Returns all share links created by the authenticated user for this gallery.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ galleryId: string }> }
) {
  try {
    const { galleryId } = await context.params
    const supabase = await createServerSupabaseClient()

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get all share links for this gallery created by the user
    const { data: shareLinks, error } = await supabase
      .from('gallery_share_links')
      .select('*')
      .eq('gallery_id', galleryId)
      .eq('created_by_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[ShareLinks] Error fetching share links:', error)
      return NextResponse.json({ error: 'Failed to fetch share links' }, { status: 500 })
    }

    // 3. Add share URLs and compute isActive
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
    const linksWithUrls = (shareLinks || []).map(link => ({
      ...link,
      shareUrl: `${siteUrl}/gallery/${galleryId}?share=${link.share_token}`,
      isActive: !link.is_revoked && (!link.expires_at || new Date(link.expires_at) > new Date()),
    }))

    return NextResponse.json({ shareLinks: linksWithUrls })

  } catch (error) {
    const err = error as Error
    console.error('[ShareLinks] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch share links', message: err.message },
      { status: 500 }
    )
  }
}
