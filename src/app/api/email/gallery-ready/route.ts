import { NextRequest, NextResponse } from 'next/server'
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
        clients (
          id,
          name,
          email
        )
      `)
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      console.log('[GalleryReady] Gallery not found:', galleryId, galleryError)
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    console.log('[GalleryReady] Gallery data:', JSON.stringify(gallery, null, 2))

    // Verify this photographer owns the gallery
    if (gallery.photographer_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Handle both array and object formats from Supabase join
    // Supabase returns an object for single relations, array for multi relations
    const clientsData = gallery.clients
    const client = Array.isArray(clientsData)
      ? clientsData[0] as { id: string; name: string; email: string } | undefined
      : clientsData as { id: string; name: string; email: string } | null

    if (!client?.email) {
      console.log('[GalleryReady] No client email - clients:', clientsData, 'client:', client)
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
    const galleryUrl = `${siteUrl}/client/gallery/${galleryId}`

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

    console.log(`[GalleryReady] Email sent to ${client.email} for gallery ${galleryId}`)

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${client.email}`
    })

  } catch (error) {
    const err = error as Error
    console.error('[GalleryReady] Error:', err)
    return NextResponse.json(
      { error: 'Failed to send notification', message: err.message },
      { status: 500 }
    )
  }
}
