/**
 * Share Link Download Tracking API
 * POST /api/gallery/[galleryId]/share-links/track-download - Track a download via share link
 *
 * This endpoint is PUBLIC - uses share token for authorization.
 * It atomically increments the download count and returns remaining downloads.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Track a download via share link
 * POST /api/gallery/[galleryId]/share-links/track-download
 *
 * Body:
 * {
 *   shareToken: string;
 * }
 *
 * Response:
 * {
 *   allowed: boolean;
 *   downloadsRemaining: number | null;
 *   error?: string;
 * }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ galleryId: string }> }
) {
  try {
    const { galleryId } = await context.params

    // 1. Parse request body
    const body = await request.json()
    const { shareToken } = body

    if (!shareToken) {
      return NextResponse.json(
        { allowed: false, error: 'Share token is required' },
        { status: 400 }
      )
    }

    // 2. Use service role client (public endpoint, bypasses RLS)
    const supabase = createServiceRoleClient()

    // 3. Fetch share link
    const { data: shareLink, error } = await supabase
      .from('gallery_share_links')
      .select('id, download_limit, downloads_used, expires_at, is_revoked')
      .eq('gallery_id', galleryId)
      .eq('share_token', shareToken)
      .single()

    if (error || !shareLink) {
      return NextResponse.json(
        { allowed: false, error: 'Invalid share link' },
        { status: 404 }
      )
    }

    // 4. Check if revoked or expired
    if (shareLink.is_revoked) {
      return NextResponse.json(
        { allowed: false, error: 'This share link has been revoked' },
        { status: 403 }
      )
    }

    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return NextResponse.json(
        { allowed: false, error: 'This share link has expired' },
        { status: 403 }
      )
    }

    // 5. Check if view-only (download_limit = 0)
    if (shareLink.download_limit === 0) {
      return NextResponse.json(
        { allowed: false, downloadsRemaining: 0, error: 'This is a view-only share link. Downloads are disabled.' },
        { status: 403 }
      )
    }

    // 6. Check if download limit reached (before incrementing)
    if (shareLink.download_limit !== null && shareLink.downloads_used >= shareLink.download_limit) {
      return NextResponse.json(
        { allowed: false, downloadsRemaining: 0, error: 'Download limit reached for this share link' },
        { status: 403 }
      )
    }

    // 7. Atomically increment download count using RPC
    const { data: newCount, error: rpcError } = await supabase.rpc('increment_share_link_download_count', {
      link_id: shareLink.id
    })

    if (rpcError) {
      logger.error('[ShareLinks] Error incrementing download count:', rpcError)
      // Still allow download but don't track accurately
      // This is better than blocking the user
    }

    // 8. Calculate downloads remaining
    const downloadsRemaining = shareLink.download_limit !== null
      ? Math.max(0, shareLink.download_limit - (newCount || shareLink.downloads_used + 1))
      : null

    logger.info(`[ShareLinks] Download tracked for gallery ${galleryId}, remaining: ${downloadsRemaining}`)

    return NextResponse.json({
      allowed: true,
      downloadsRemaining,
    })

  } catch (error) {
    const err = error as Error
    logger.error('[ShareLinks] Error:', err)
    return NextResponse.json(
      { allowed: false, error: 'Failed to track download' },
      { status: 500 }
    )
  }
}
