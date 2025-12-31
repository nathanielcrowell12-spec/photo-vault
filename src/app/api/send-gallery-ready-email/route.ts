import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { EmailService } from '@/lib/email/email-service'
import { nanoid } from 'nanoid'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/send-gallery-ready-email
 *
 * Send "Gallery Ready" email to client
 * Creates invitation token and sends email notification
 *
 * Body:
 *   - galleryId: UUID of the gallery
 *   - clientId: UUID of the client (from clients table)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authenticated user (photographer)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { galleryId, clientId } = body

    if (!galleryId || !clientId) {
      return NextResponse.json(
        { error: 'galleryId and clientId are required' },
        { status: 400 }
      )
    }

    // Fetch gallery details
    const { data: gallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .select('*')
      .eq('id', galleryId)
      .eq('photographer_id', user.id) // Ensure photographer owns this gallery
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // Fetch client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('photographer_id', user.id) // Ensure photographer owns this client
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Fetch photographer details
    const { data: photographerProfile, error: photographerError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (photographerError || !photographerProfile) {
      return NextResponse.json({ error: 'Photographer profile not found' }, { status: 404 })
    }

    // Generate unique invitation token
    const invitationToken = nanoid(32)

    // Create or update client invitation record
    const { error: invitationError } = await supabase
      .from('client_invitations')
      .upsert({
        photographer_id: user.id,
        client_id: clientId,
        client_email: client.email,
        client_name: client.name,
        gallery_id: galleryId,
        invitation_token: invitationToken,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      }, {
        onConflict: 'client_email,photographer_id',
      })

    if (invitationError) {
      logger.error('[GalleryReadyEmail] Error creating invitation:', invitationError)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Send email
    const emailResult = await EmailService.sendGalleryReadyEmail({
      clientName: client.name,
      clientEmail: client.email,
      photographerName: photographerProfile.full_name || photographerProfile.business_name || user.email!,
      photographerBusinessName: photographerProfile.business_name,
      galleryName: gallery.gallery_name,
      galleryDescription: gallery.gallery_description,
      photoCount: gallery.photo_count || 0,
      invitationToken,
      galleryId,
    })

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Gallery ready email sent successfully',
      invitationToken,
    })
  } catch (error: any) {
    logger.error('[GalleryReadyEmail] Error in POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
