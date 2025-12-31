import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * Send Gallery Ready Email to Client
 * POST /api/email/gallery-ready
 *
 * Body:
 * {
 *   galleryId: string
 *   sneakPeekPhotoIds?: string[]  // Optional photos to include in email
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { galleryId, sneakPeekPhotoIds = [] } = body

    if (!galleryId) {
      return NextResponse.json({ error: 'Gallery ID required' }, { status: 400 })
    }

    // Get gallery with client and photographer info
    const { data: gallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .select(`
        id,
        gallery_name,
        photographer_id,
        client_id,
        total_amount,
        photo_count,
        email_sent_at,
        clients (
          id,
          name,
          email
        )
      `)
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      logger.info('[GalleryReady] Gallery not found', { galleryId, error: galleryError })
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // IDEMPOTENCY CHECK: If email was already sent, return success without resending
    if (gallery.email_sent_at) {
      logger.info('[GalleryReady] Email already sent at:', gallery.email_sent_at)
      return NextResponse.json({
        success: true,
        message: 'Email was already sent',
        alreadySent: true,
        code: 'EMAIL_ALREADY_SENT'
      }, { status: 200 })
    }

    logger.info('[GalleryReady] Gallery data:', JSON.stringify(gallery, null, 2))

    // Verify this photographer owns the gallery
    if (gallery.photographer_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // CRITICAL: Check if photographer has Stripe Connect set up
    // Photographers cannot send gallery ready emails until they can receive payments
    const { data: photographerRecord, error: photographerError } = await supabase
      .from('photographers')
      .select('id, stripe_connect_account_id, stripe_connect_status')
      .eq('id', user.id)
      .single()

    if (photographerError || !photographerRecord) {
      logger.error('[GalleryReady] Photographer record not found:', photographerError)
      return NextResponse.json({
        error: 'Payment setup required',
        message: 'You must complete your payment setup before sending gallery notifications. Please connect your Stripe account in Settings.',
        code: 'PHOTOGRAPHER_STRIPE_MISSING'
      }, { status: 400 })
    }

    if (!photographerRecord.stripe_connect_account_id || photographerRecord.stripe_connect_status !== 'active') {
      logger.error('[GalleryReady] Photographer missing Stripe Connect:', {
        photographerId: user.id,
        hasAccountId: !!photographerRecord.stripe_connect_account_id,
        status: photographerRecord.stripe_connect_status
      })
      return NextResponse.json({
        error: 'Payment setup required',
        message: 'You must complete your payment setup before sending gallery notifications. Please connect your Stripe account in Settings.',
        code: 'PHOTOGRAPHER_STRIPE_MISSING'
      }, { status: 400 })
    }

    // Handle both array and object formats from Supabase join
    // Supabase returns an object for single relations, array for multi relations
    const clientsData = gallery.clients
    const client = Array.isArray(clientsData)
      ? clientsData[0] as { id: string; name: string; email: string } | undefined
      : clientsData as { id: string; name: string; email: string } | null

    if (!client?.email) {
      logger.info('[GalleryReady] No client email found', { clientsData, client })
      return NextResponse.json({ error: 'No client email found' }, { status: 400 })
    }

    // Get photographer name
    const { data: photographer } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const photographerName = photographer?.full_name || 'Your photographer'

    // Get sneak peek photo URLs if provided
    let sneakPeekPhotos: { url: string }[] = []
    if (sneakPeekPhotoIds.length > 0) {
      const { data: photos } = await supabase
        .from('photos')
        .select('original_url, thumbnail_url')
        .in('id', sneakPeekPhotoIds)
        .limit(5)

      sneakPeekPhotos = (photos || []).map(p => ({
        url: p.thumbnail_url || p.original_url
      }))
    }

    // Build gallery URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://photovault.photo'
    const galleryUrl = `${siteUrl}/gallery/${galleryId}`

    // Format price
    const priceDisplay = gallery.total_amount
      ? `$${(gallery.total_amount / 100).toFixed(0)}`
      : 'Free'

    // Build sneak peek HTML
    const sneakPeekHtml = sneakPeekPhotos.length > 0
      ? `
        <div style="margin: 24px 0;">
          <p style="color: #f59e0b; font-weight: 600; margin-bottom: 12px;">Sneak Peek:</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${sneakPeekPhotos.map(p => `
              <img src="${p.url}" alt="Preview" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;" />
            `).join('')}
          </div>
        </div>
      `
      : ''

    // Send email via Resend
    const { getResendClient, FROM_EMAIL } = await import('@/lib/email/resend')
    const resend = await getResendClient()

    await resend.emails.send({
      from: FROM_EMAIL,
      to: client.email,
      subject: `Your photos are ready! - ${gallery.gallery_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155;">

            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #f59e0b; font-size: 28px; margin: 0;">Your Photos Are Ready!</h1>
            </div>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
              Hi ${client.name},
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
              Great news! <strong>${photographerName}</strong> has finished editing your photos from <strong>${gallery.gallery_name}</strong>.
            </p>

            <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #334155;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #94a3b8;">Gallery:</span>
                <span style="color: #f1f5f9; font-weight: 500;">${gallery.gallery_name}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #94a3b8;">Photos:</span>
                <span style="color: #f1f5f9; font-weight: 500;">${gallery.photo_count || 0} photos</span>
              </div>
              ${gallery.total_amount ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Total:</span>
                <span style="color: #f59e0b; font-weight: 600;">${priceDisplay}</span>
              </div>
              ` : ''}
            </div>

            ${sneakPeekHtml}

            <div style="text-align: center; margin: 32px 0;">
              <a href="${galleryUrl}" style="display: inline-block; background-color: #f59e0b; color: #000; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">
                View Your Gallery
              </a>
            </div>

            <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-top: 32px;">
              Your photos are securely stored with PhotoVault and ready for you to view and download.
            </p>

            <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;" />

            <p style="font-size: 12px; color: #64748b; text-align: center;">
              PhotoVault - Professional Photo Galleries<br/>
              <a href="${siteUrl}" style="color: #f59e0b;">photovault.photo</a>
            </p>

          </div>
        </body>
        </html>
      `
    })

    // CRITICAL: Set email_sent_at timestamp to track successful send
    const { error: updateError } = await supabase
      .from('photo_galleries')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', galleryId)

    if (updateError) {
      // Log but don't fail - email was sent successfully
      logger.error('[GalleryReady] Failed to update email_sent_at:', updateError)
    }

    logger.info(`[GalleryReady] Email sent to ${client.email} for gallery ${galleryId}`)

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${client.email}`
    })

  } catch (error) {
    const err = error as Error
    logger.error('[GalleryReady] Error:', err)
    return NextResponse.json(
      { error: 'Failed to send notification', message: err.message },
      { status: 500 }
    )
  }
}
