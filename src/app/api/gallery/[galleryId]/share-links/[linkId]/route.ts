/**
 * Share Link Management API
 * DELETE /api/gallery/[galleryId]/share-links/[linkId] - Revoke a share link
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { trackServerEvent } from '@/lib/analytics/server'
import { EVENTS } from '@/types/analytics'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Revoke a share link
 * DELETE /api/gallery/[galleryId]/share-links/[linkId]
 *
 * Only the creator of the share link can revoke it.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ galleryId: string; linkId: string }> }
) {
  try {
    const { galleryId, linkId } = await context.params
    const supabase = await createServerSupabaseClient()

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get the share link to verify ownership
    const { data: existingLink, error: fetchError } = await supabase
      .from('gallery_share_links')
      .select('id, gallery_id, created_by_user_id, is_revoked')
      .eq('id', linkId)
      .eq('gallery_id', galleryId)
      .single()

    if (fetchError || !existingLink) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 })
    }

    // 3. Verify the user is the creator
    if (existingLink.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only revoke share links you created' },
        { status: 403 }
      )
    }

    // 4. Check if already revoked
    if (existingLink.is_revoked) {
      return NextResponse.json(
        { error: 'Share link is already revoked' },
        { status: 400 }
      )
    }

    // 5. Revoke the link (soft delete)
    const { error: updateError } = await supabase
      .from('gallery_share_links')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .eq('id', linkId)
      .eq('created_by_user_id', user.id)

    if (updateError) {
      console.error('[ShareLinks] Error revoking share link:', updateError)
      return NextResponse.json({ error: 'Failed to revoke share link' }, { status: 500 })
    }

    // 6. Track analytics event
    try {
      await trackServerEvent(user.id, EVENTS.SHARE_LINK_REVOKED as keyof typeof EVENTS, {
        gallery_id: galleryId,
        share_link_id: linkId,
      })
    } catch (trackError) {
      console.error('[ShareLinks] Error tracking event:', trackError)
    }

    console.log(`[ShareLinks] Revoked share link ${linkId} for gallery ${galleryId}`)

    return NextResponse.json({
      success: true,
      message: 'Share link revoked successfully',
    })

  } catch (error) {
    const err = error as Error
    console.error('[ShareLinks] Error:', err)
    return NextResponse.json(
      { error: 'Failed to revoke share link', message: err.message },
      { status: 500 }
    )
  }
}
