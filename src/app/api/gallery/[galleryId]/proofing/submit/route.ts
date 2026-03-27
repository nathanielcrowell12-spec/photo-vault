import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/gallery/[galleryId]/proofing/submit
 * Batch-submit all proofing selections for a gallery.
 * Sets submitted_at on all rows, making them immutable.
 * Transitions gallery_status to 'proofing_complete'.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const { galleryId } = await params
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createServiceRoleClient()

    // Verify gallery exists and is in proofing state
    const { data: gallery, error: galleryError } = await adminClient
      .from('photo_galleries')
      .select('id, proofing_enabled, gallery_status, payment_timing')
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    if (!gallery.proofing_enabled) {
      return NextResponse.json({ error: 'Proofing is not enabled for this gallery' }, { status: 403 })
    }

    // Check if already submitted
    const { data: existingSubmitted } = await adminClient
      .from('proofing_submissions')
      .select('id')
      .eq('gallery_id', galleryId)
      .eq('client_user_id', user.id)
      .not('submitted_at', 'is', null)
      .limit(1)
      .maybeSingle()

    if (existingSubmitted) {
      return NextResponse.json(
        { error: 'Proofing has already been submitted' },
        { status: 409 }
      )
    }

    // Check that client has at least some proofing data saved
    const { data: unsubmitted, error: countError } = await adminClient
      .from('proofing_submissions')
      .select('id')
      .eq('gallery_id', galleryId)
      .eq('client_user_id', user.id)
      .is('submitted_at', null)

    if (countError) {
      logger.error('[Proofing Submit] Count error:', countError)
      return NextResponse.json({ error: 'Failed to check proofing status' }, { status: 500 })
    }

    if (!unsubmitted || unsubmitted.length === 0) {
      return NextResponse.json(
        { error: 'No proofing selections to submit. Review at least one photo first.' },
        { status: 400 }
      )
    }

    // Set submitted_at on all proofing rows for this client+gallery (use service role for batch update)
    const now = new Date().toISOString()
    const { error: submitError } = await adminClient
      .from('proofing_submissions')
      .update({ submitted_at: now })
      .eq('gallery_id', galleryId)
      .eq('client_user_id', user.id)
      .is('submitted_at', null)

    if (submitError) {
      logger.error('[Proofing Submit] Update error:', submitError)
      return NextResponse.json({ error: 'Failed to submit proofing' }, { status: 500 })
    }

    // Check if client made any actual changes (filter selection or note)
    const { data: allSubmissions } = await adminClient
      .from('proofing_submissions')
      .select('filter_selection, client_note')
      .eq('gallery_id', galleryId)
      .eq('client_user_id', user.id)

    const hasChanges = allSubmissions?.some(
      s => s.filter_selection !== null || (s.client_note !== null && s.client_note !== '')
    ) ?? false

    // Transition gallery status to proofing_complete + set has_proofing_changes flag
    // Handle both 'proofing' and 'ready' (race condition: client may submit before ready→proofing completes)
    if (gallery.gallery_status === 'proofing' || gallery.gallery_status === 'ready') {
      const { error: statusError } = await adminClient
        .from('photo_galleries')
        .update({
          gallery_status: 'proofing_complete',
          has_proofing_changes: hasChanges
        })
        .eq('id', galleryId)

      if (statusError) {
        logger.error('[Proofing Submit] Gallery status update error:', statusError)
        // Non-fatal — proofing data is saved, status can be fixed manually
      }
    }

    logger.info('[Proofing Submit] Submitted', {
      galleryId,
      userId: user.id,
      submissionCount: unsubmitted.length
    })

    return NextResponse.json({
      success: true,
      submitted_count: unsubmitted.length,
      submitted_at: now
    })
  } catch (error) {
    logger.error('[Proofing Submit] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
