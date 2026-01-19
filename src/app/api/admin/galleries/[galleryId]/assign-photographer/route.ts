// src/app/api/admin/galleries/[galleryId]/assign-photographer/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { EmailService } from '@/lib/email/email-service'
import { logger } from '@/lib/logger'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { galleryId } = await params

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (adminProfile?.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { photographer_id, send_onboarding_email = true } = await req.json()

    // Get gallery info (to check existing assignment and preserve name)
    const { data: gallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .select('id, name, photographer_id, photographer_name')
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // Handle unassignment (null photographer_id)
    if (photographer_id === null) {
      const { error: updateError } = await supabase
        .from('photo_galleries')
        .update({
          photographer_id: null,
          // Preserve photographer_name for historical display
          updated_at: new Date().toISOString(),
        })
        .eq('id', galleryId)

      if (updateError) {
        logger.error('[AssignPhotographer] Update error:', updateError)
        return NextResponse.json({ error: 'Failed to unassign photographer' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        gallery: {
          id: galleryId,
          photographer_id: null,
          photographer_name: gallery.photographer_name,
        },
        message: 'Photographer unassigned from gallery.',
      })
    }

    // Get photographer info
    const { data: photographer, error: photographerError } = await supabase
      .from('user_profiles')
      .select('id, full_name, payment_status')
      .eq('id', photographer_id)
      .eq('user_type', 'photographer')
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json({ error: 'Photographer not found' }, { status: 404 })
    }

    // Check if already assigned to this photographer (skip email if so)
    // NOTE: Race condition possible but acceptable at beta scale
    const wasAlreadyAssigned = gallery.photographer_id === photographer_id

    // Update gallery
    // Preserve existing photographer_name if it exists, otherwise use photographer's full_name
    const newPhotographerName = gallery.photographer_name || photographer.full_name

    const { error: updateError } = await supabase
      .from('photo_galleries')
      .update({
        photographer_id: photographer_id,
        photographer_name: newPhotographerName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', galleryId)

    if (updateError) {
      logger.error('[AssignPhotographer] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to assign photographer' }, { status: 500 })
    }

    // Send onboarding email if photographer is inactive and not already assigned
    let emailSent = false
    const isInactive = photographer.payment_status !== 'active'

    if (send_onboarding_email && isInactive && !wasAlreadyAssigned) {
      try {
        // Get photographer's email using established pattern
        const { data: authData } = await supabase.auth.admin.listUsers({
          perPage: 1000,
        })

        const photographerEmail = authData?.users?.find(u => u.id === photographer_id)?.email

        if (photographerEmail) {
          const result = await EmailService.sendPhotographerGalleryAssignmentEmail({
            to: photographerEmail,
            photographerName: photographer.full_name || 'Photographer',
            galleryName: gallery.name || 'Untitled Gallery',
            onboardingUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/photographer/onboarding`,
          })
          emailSent = result.success
          if (result.success) {
            logger.info('[AssignPhotographer] Onboarding email sent to:', photographerEmail)
          } else {
            logger.warn('[AssignPhotographer] Email send returned error:', result.error)
          }
        } else {
          logger.warn('[AssignPhotographer] No email found for photographer:', photographer_id)
        }
      } catch (emailError) {
        logger.error('[AssignPhotographer] Email send failed:', emailError)
        // Don't fail the request - assignment succeeded, email is best-effort
      }
    }

    return NextResponse.json({
      success: true,
      gallery: {
        id: galleryId,
        photographer_id: photographer_id,
        photographer_name: newPhotographerName,
      },
      email_sent: emailSent,
      message: emailSent
        ? `Photographer assigned. Onboarding email sent to ${photographer.full_name}.`
        : wasAlreadyAssigned
          ? 'Photographer already assigned to this gallery.'
          : 'Photographer assigned successfully.',
    })
  } catch (error) {
    logger.error('[AssignPhotographer] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to assign photographer' },
      { status: 500 }
    )
  }
}
