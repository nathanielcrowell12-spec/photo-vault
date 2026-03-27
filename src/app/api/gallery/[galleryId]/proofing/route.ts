import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Valid CSS filter selections for proofing
const VALID_FILTERS = [
  'grayscale', 'sepia', 'brightness-up', 'contrast-up', 'warmth', 'cool-tone'
] as const

const MAX_NOTE_LENGTH = 500

type ProofingSaveRequest = {
  photo_id: string
  filter_selection?: string | null
  client_note?: string | null
}

/**
 * GET /api/gallery/[galleryId]/proofing
 * Retrieve all proofing data for a gallery.
 * - Clients see their own proofing selections
 * - Photographers see client proofing for their galleries
 */
export async function GET(
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

    // RLS handles access control — clients see their own, photographers see their galleries'
    const { data: submissions, error } = await supabase
      .from('proofing_submissions')
      .select('id, photo_id, filter_selection, client_note, submitted_at, created_at, updated_at, photographer_acknowledged')
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('[Proofing] GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch proofing data' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
      is_submitted: submissions?.some(s => s.submitted_at !== null) ?? false
    })
  } catch (error) {
    logger.error('[Proofing] GET unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/gallery/[galleryId]/proofing
 * Save/update proofing selection for a single photo (auto-save as client works).
 * Uses UPSERT — creates or updates the proofing entry for this photo.
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

    const body: ProofingSaveRequest = await request.json()

    // Validate required fields
    if (!body.photo_id) {
      return NextResponse.json({ error: 'photo_id is required' }, { status: 400 })
    }

    // Validate filter selection
    if (body.filter_selection !== null && body.filter_selection !== undefined) {
      if (!VALID_FILTERS.includes(body.filter_selection as typeof VALID_FILTERS[number])) {
        return NextResponse.json(
          { error: `Invalid filter. Must be one of: ${VALID_FILTERS.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate note length
    if (body.client_note && body.client_note.length > MAX_NOTE_LENGTH) {
      return NextResponse.json(
        { error: `Note must be ${MAX_NOTE_LENGTH} characters or less` },
        { status: 400 }
      )
    }

    // Verify gallery exists and has proofing enabled (use service role to bypass RLS for this check)
    const adminClient = createServiceRoleClient()
    const { data: gallery, error: galleryError } = await adminClient
      .from('photo_galleries')
      .select('id, proofing_enabled, gallery_status')
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    if (!gallery.proofing_enabled) {
      return NextResponse.json({ error: 'Proofing is not enabled for this gallery' }, { status: 403 })
    }

    // Check if proofing is already submitted for this gallery by this user
    const { data: existingSubmission } = await adminClient
      .from('proofing_submissions')
      .select('submitted_at')
      .eq('gallery_id', galleryId)
      .eq('client_user_id', user.id)
      .not('submitted_at', 'is', null)
      .limit(1)
      .maybeSingle()

    if (existingSubmission?.submitted_at) {
      return NextResponse.json(
        { error: 'Proofing has already been submitted and cannot be modified' },
        { status: 409 }
      )
    }

    // Upsert proofing selection (RLS INSERT policy handles auth)
    const { data, error } = await supabase
      .from('proofing_submissions')
      .upsert(
        {
          gallery_id: galleryId,
          photo_id: body.photo_id,
          client_user_id: user.id,
          filter_selection: body.filter_selection ?? null,
          client_note: body.client_note ?? null,
        },
        { onConflict: 'gallery_id,photo_id,client_user_id' }
      )
      .select('id, photo_id, filter_selection, client_note, updated_at')
      .single()

    if (error) {
      logger.error('[Proofing] POST upsert error:', error)
      return NextResponse.json({ error: 'Failed to save proofing selection' }, { status: 500 })
    }

    return NextResponse.json({ success: true, submission: data })
  } catch (error) {
    logger.error('[Proofing] POST unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
