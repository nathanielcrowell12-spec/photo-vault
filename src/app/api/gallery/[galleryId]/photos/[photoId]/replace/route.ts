import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Max file size: 50MB (matches existing upload page)
const MAX_FILE_SIZE = 50 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']

/**
 * POST /api/gallery/[galleryId]/photos/[photoId]/replace
 * Replace a photo file in-place — new image uploaded, same DB row updated,
 * old file deleted from storage. Preserves sort_position for chronological order.
 * Auto-acknowledges the related proofing submission.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string; photoId: string }> }
) {
  try {
    const { galleryId, photoId } = await params
    const supabase = await createServerSupabaseClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
        { error: 'Gallery must be in proofing_complete status to replace photos' },
        { status: 400 }
      )
    }

    // Get existing photo record (need old URLs for cleanup)
    const { data: existingPhoto, error: photoError } = await adminClient
      .from('photos')
      .select('id, original_url, thumbnail_url, medium_url, full_url, sort_position, gallery_id')
      .eq('id', photoId)
      .eq('gallery_id', galleryId)
      .single()

    if (photoError || !existingPhoto) {
      return NextResponse.json({ error: 'Photo not found in this gallery' }, { status: 404 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const randomStr = Math.random().toString(36).substring(2, 10)
    const fileName = `${Date.now()}-${randomStr}.${ext}`
    const filePath = `${galleryId}/${fileName}`

    // Upload new file to storage
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('photos')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      logger.error('[Photo Replace] Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload replacement file' }, { status: 500 })
    }

    // Get public URL for new file
    const { data: { publicUrl } } = adminClient.storage
      .from('photos')
      .getPublicUrl(filePath)

    // Update photo record — all 4 URL columns + filename, keep sort_position
    const { data: updatedPhoto, error: updateError } = await adminClient
      .from('photos')
      .update({
        original_url: publicUrl,
        thumbnail_url: publicUrl,
        medium_url: publicUrl,
        full_url: publicUrl,
        filename: file.name
      })
      .eq('id', photoId)
      .select('id, gallery_id, filename, original_url, thumbnail_url, medium_url, full_url, sort_position')
      .single()

    if (updateError) {
      logger.error('[Photo Replace] DB update error:', updateError)
      // Try to clean up the uploaded file since the DB update failed
      await adminClient.storage.from('photos').remove([filePath]).catch(() => {})
      return NextResponse.json({ error: 'Failed to update photo record' }, { status: 500 })
    }

    // Auto-acknowledge the related proofing submission (replacing = acknowledging)
    const now = new Date().toISOString()
    await adminClient
      .from('proofing_submissions')
      .update({
        photographer_acknowledged: true,
        acknowledged_at: now
      })
      .eq('gallery_id', galleryId)
      .eq('photo_id', photoId)
      .not('submitted_at', 'is', null)
      .then(({ error }) => {
        if (error) {
          logger.warn('[Photo Replace] Auto-acknowledge failed (non-fatal):', error)
        }
      })

    // Non-blocking: delete old file from storage
    const oldStoragePath = extractStoragePath(existingPhoto.original_url)
    if (oldStoragePath) {
      adminClient.storage
        .from('photos')
        .remove([oldStoragePath])
        .then(({ error }) => {
          if (error) {
            logger.warn('[Photo Replace] Old file cleanup failed (non-fatal):', {
              oldPath: oldStoragePath,
              error: error.message
            })
          } else {
            logger.info('[Photo Replace] Old file cleaned up:', oldStoragePath)
          }
        })
    }

    logger.info('[Photo Replace] Replaced', {
      galleryId,
      photoId,
      oldFile: oldStoragePath,
      newFile: filePath
    })

    return NextResponse.json({
      success: true,
      photo: updatedPhoto
    })
  } catch (error) {
    logger.error('[Photo Replace] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Extract the storage path from a Supabase public URL.
 * URL format: https://<project>.supabase.co/storage/v1/object/public/photos/<galleryId>/<filename>
 */
function extractStoragePath(url: string): string | null {
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/photos\/(.+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}
