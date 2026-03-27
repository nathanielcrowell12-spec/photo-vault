import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { EmailService } from '@/lib/email/email-service'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

type NotificationType =
  | 'proofing_invitation'
  | 'revisions_complete'
  | 'proofing_auto_closed'

/**
 * POST /api/gallery/[galleryId]/proofing/notify
 * Sends proofing lifecycle email notifications.
 * Called by client components after status transitions.
 *
 * Body: { type: NotificationType }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const { galleryId } = await params
    const { type } = (await request.json()) as { type: NotificationType }

    if (!type || !['proofing_invitation', 'revisions_complete', 'proofing_auto_closed'].includes(type)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    // Auth check
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createServiceRoleClient()

    // Fetch gallery with client and photographer info
    const { data: gallery, error: galleryError } = await adminClient
      .from('photo_galleries')
      .select(`
        id,
        gallery_name,
        gallery_status,
        payment_timing,
        proofing_enabled,
        proofing_deadline,
        photographer_id,
        client_id,
        access_code
      `)
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // Fetch client info
    const { data: clientProfile } = await adminClient
      .from('clients')
      .select('user_id, first_name, last_name, email')
      .eq('id', gallery.client_id)
      .single()

    // Fetch photographer info
    const { data: photographerProfile } = await adminClient
      .from('photographers')
      .select('user_id, business_name, first_name, last_name, email')
      .eq('user_id', gallery.photographer_id)
      .single()

    if (!clientProfile?.email || !photographerProfile?.email) {
      logger.warn('[Proofing Notify] Missing client or photographer email', { galleryId, type })
      return NextResponse.json({ error: 'Missing contact information' }, { status: 422 })
    }

    const clientName = clientProfile.first_name
      ? `${clientProfile.first_name}${clientProfile.last_name ? ' ' + clientProfile.last_name : ''}`
      : 'there'
    const photographerName = photographerProfile.business_name
      || `${photographerProfile.first_name || ''} ${photographerProfile.last_name || ''}`.trim()
      || 'Your Photographer'
    const galleryUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://photovault.photo'}/gallery/${gallery.access_code || galleryId}`

    // Send the appropriate email
    let result: { success: boolean; error?: string }

    switch (type) {
      case 'proofing_invitation': {
        // Get photo count for invitation email
        const { count } = await adminClient
          .from('photos')
          .select('id', { count: 'exact', head: true })
          .eq('gallery_id', galleryId)

        result = await EmailService.sendProofingInvitationEmail({
          clientName,
          clientEmail: clientProfile.email,
          photographerName,
          galleryName: gallery.gallery_name,
          galleryUrl,
          proofingDeadline: gallery.proofing_deadline || '',
          photoCount: count || 0,
        })
        break
      }

      case 'revisions_complete': {
        // Only photographer can trigger this
        if (user.id !== gallery.photographer_id) {
          return NextResponse.json({ error: 'Only the photographer can send this notification' }, { status: 403 })
        }

        result = await EmailService.sendRevisionsCompleteEmail({
          clientName,
          clientEmail: clientProfile.email,
          photographerName,
          galleryName: gallery.gallery_name,
          galleryUrl,
          paymentRequired: gallery.payment_timing === 'after_proofing',
        })
        break
      }

      case 'proofing_auto_closed': {
        result = await EmailService.sendProofingAutoClosedEmails(
          {
            clientName,
            clientEmail: clientProfile.email,
            photographerName,
            galleryName: gallery.gallery_name,
            galleryUrl,
          },
          {
            photographerName,
            photographerEmail: photographerProfile.email,
            clientName,
            galleryName: gallery.gallery_name,
            galleryId,
          }
        )
        break
      }

      default:
        return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 })
    }

    if (!result.success) {
      logger.error('[Proofing Notify] Email send failed', { galleryId, type, error: result.error })
      return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
    }

    logger.info('[Proofing Notify] Sent', { galleryId, type })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[Proofing Notify] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
