import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileName, fileSize, userId, galleryName, platform, clientId, galleryId } = body

    logger.info('[Upload Prepare] Request:', { fileName, fileSize, userId, galleryName, platform, clientId, galleryId })

    // Validate inputs
    if (!fileName || !fileSize || !userId) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // If galleryId is provided, gallery name is not required (we use the existing gallery)
    if (!galleryId && !galleryName) {
      return NextResponse.json({
        error: 'Missing galleryName (required when not using existing gallery)'
      }, { status: 400 })
    }

    let gallery

    if (galleryId) {
      // Use existing gallery - verify ownership
      logger.info('[Upload Prepare] Using existing gallery:', galleryId)

      const { data: existingGallery, error: fetchError } = await supabase
        .from('photo_galleries')
        .select('*')
        .eq('id', galleryId)
        .eq('photographer_id', userId)
        .single()

      if (fetchError || !existingGallery) {
        logger.error('[Upload Prepare] Gallery not found or access denied:', fetchError)
        return NextResponse.json({
          error: 'Gallery not found or access denied',
          details: fetchError?.message || 'Gallery does not exist or you do not own it'
        }, { status: 404 })
      }

      gallery = existingGallery
      logger.info('[Upload Prepare] Using existing gallery with pricing:', {
        id: gallery.id,
        name: gallery.gallery_name,
        total_amount: gallery.total_amount,
        payment_option_id: gallery.payment_option_id
      })
    } else {
      // Create new gallery in database (backwards compatibility for old desktop versions)
      logger.info('[Upload Prepare] Creating new gallery (no galleryId provided)')

      const { data: newGallery, error: galleryError } = await supabase
        .from('photo_galleries')
        .insert({
          photographer_id: userId,
          client_id: clientId || null,
          platform: platform || 'photovault',
          gallery_name: galleryName,
          photo_count: 0,
          session_date: new Date().toISOString(),
          is_imported: false
        })
        .select()
        .single()

      if (galleryError) {
        logger.error('[Upload Prepare] Gallery creation error:', galleryError)
        return NextResponse.json({
          error: 'Failed to create gallery',
          details: galleryError.message
        }, { status: 500 })
      }

      gallery = newGallery
      logger.info('[Upload Prepare] Gallery created:', gallery.id)
    }

    // Generate storage path
    const fileExt = fileName.split('.').pop()
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const storagePath = `${gallery.id}/${timestamp}-${random}.${fileExt}`

    return NextResponse.json({
      galleryId: gallery.id,
      storagePath,
      fileName,
      fileSize
    })
  } catch (error: any) {
    logger.error('[Upload Prepare] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
