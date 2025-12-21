/**
 * Share Token Validation API
 * POST /api/gallery/[galleryId]/validate-share-token - Validate a share token (public)
 *
 * This endpoint is PUBLIC - no authentication required.
 * It validates whether a share token grants access to view a gallery.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface ShareLinkInfo {
  id: string
  downloadLimit: number | null
  downloadsUsed: number
  expiresAt: string | null
  viewOnly: boolean
  downloadsRemaining: number | null
}

/**
 * Validate a share token
 * POST /api/gallery/[galleryId]/validate-share-token
 *
 * Body:
 * {
 *   shareToken: string;
 * }
 *
 * Response:
 * {
 *   valid: boolean;
 *   shareLink?: ShareLinkInfo;
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
        { valid: false, error: 'Share token is required' },
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
      console.log(`[ShareToken] Invalid token for gallery ${galleryId}`)
      return NextResponse.json(
        { valid: false, error: 'Invalid share link' },
        { status: 404 }
      )
    }

    // 4. Check if revoked
    if (shareLink.is_revoked) {
      console.log(`[ShareToken] Revoked token for gallery ${galleryId}`)
      return NextResponse.json(
        { valid: false, error: 'This share link has been revoked' },
        { status: 403 }
      )
    }

    // 5. Check if expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      console.log(`[ShareToken] Expired token for gallery ${galleryId}`)
      return NextResponse.json(
        { valid: false, error: 'This share link has expired' },
        { status: 403 }
      )
    }

    // 6. Atomically increment view count using RPC
    const { error: rpcError } = await supabase.rpc('increment_share_link_view_count', {
      link_id: shareLink.id
    })

    if (rpcError) {
      // Non-fatal - log but don't fail validation
      console.error('[ShareToken] Error incrementing view count:', rpcError)
    }

    // 7. Calculate downloads remaining
    const viewOnly = shareLink.download_limit === 0
    const downloadsRemaining = shareLink.download_limit !== null
      ? Math.max(0, shareLink.download_limit - shareLink.downloads_used)
      : null // null means unlimited

    console.log(`[ShareToken] Valid token for gallery ${galleryId}, views incremented`)

    return NextResponse.json({
      valid: true,
      shareLink: {
        id: shareLink.id,
        downloadLimit: shareLink.download_limit,
        downloadsUsed: shareLink.downloads_used,
        expiresAt: shareLink.expires_at,
        viewOnly,
        downloadsRemaining,
      } satisfies ShareLinkInfo,
    })

  } catch (error) {
    const err = error as Error
    console.error('[ShareToken] Error:', err)
    return NextResponse.json(
      { valid: false, error: 'Failed to validate share token' },
      { status: 500 }
    )
  }
}
