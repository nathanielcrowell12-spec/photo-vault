import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/gallery/[galleryId]/proofing/acknowledge
 * Mark a proofing submission as acknowledged by the photographer.
 * Idempotent — acknowledging an already-acknowledged submission returns success.
 * Uses service role client to update proofing_submissions (photographer doesn't have RLS UPDATE).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const { galleryId } = await params
    const supabase = await createServerSupabaseClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (!body.photo_id) {
      return NextResponse.json({ error: 'photo_id is required' }, { status: 400 })
    }

    const adminClient = createServiceRoleClient()

    // Verify photographer owns this gallery
    const { data: gallery, error: galleryError } = await adminClient
      .from('photo_galleries')
      .select('id, photographer_id, gallery_status')
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    if (gallery.photographer_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (gallery.gallery_status !== 'proofing_complete') {
      return NextResponse.json(
        { error: 'Gallery must be in proofing_complete status' },
        { status: 400 }
      )
    }

    // Find the submission by gallery_id + photo_id
    const { data: submission, error: findError } = await adminClient
      .from('proofing_submissions')
      .select('id, photographer_acknowledged')
      .eq('gallery_id', galleryId)
      .eq('photo_id', body.photo_id)
      .not('submitted_at', 'is', null)
      .maybeSingle()

    if (findError) {
      logger.error('[Proofing Acknowledge] Find error:', findError)
      return NextResponse.json({ error: 'Failed to find submission' }, { status: 500 })
    }

    if (!submission) {
      return NextResponse.json({ error: 'No submitted proofing found for this photo' }, { status: 404 })
    }

    // Idempotent — if already acknowledged, return success
    if (submission.photographer_acknowledged) {
      return NextResponse.json({
        success: true,
        already_acknowledged: true,
        submission_id: submission.id
      })
    }

    // Set acknowledged
    const now = new Date().toISOString()
    const { error: updateError } = await adminClient
      .from('proofing_submissions')
      .update({
        photographer_acknowledged: true,
        acknowledged_at: now
      })
      .eq('id', submission.id)

    if (updateError) {
      logger.error('[Proofing Acknowledge] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to acknowledge' }, { status: 500 })
    }

    logger.info('[Proofing Acknowledge] Acknowledged', {
      galleryId,
      photoId: body.photo_id,
      submissionId: submission.id
    })

    return NextResponse.json({
      success: true,
      already_acknowledged: false,
      submission_id: submission.id,
      acknowledged_at: now
    })
  } catch (error) {
    logger.error('[Proofing Acknowledge] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
