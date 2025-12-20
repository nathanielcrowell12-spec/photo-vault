import { NextRequest, NextResponse } from 'next/server'
import { generateRandomId } from '@/lib/api-constants'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get authenticated user from session (cookies)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const galleryId = formData.get('galleryId') as string
    const files = formData.getAll('photos') as File[]

    if (!galleryId || files.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify gallery belongs to authenticated user
    const { data: gallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .select('*')
      .eq('id', galleryId)
      .eq('photographer_id', user.id)
      .single()

    if (galleryError || !gallery) {
      console.error('[Upload API] Gallery verification failed:', {
        galleryId,
        userId: user.id,
        error: galleryError
      })
      return NextResponse.json(
        { error: 'Gallery not found or access denied' },
        { status: 404 }
      )
    }

    console.log('[Upload API] Gallery verified:', {
      galleryId: gallery.id,
      userId: user.id,
      galleryName: gallery.gallery_name
    })

    const uploadedPhotos = []

    // Process each photo
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const timestamp = Date.now()
      const randomId = generateRandomId()
      const fileName = `${timestamp}-${randomId}-${file.name}`

      // Upload original photo - use verified user.id and gallery.id from database
      const originalPath = `${user.id}/${gallery.id}/original/${fileName}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(originalPath, file, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading photo:', uploadError)
        continue
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(originalPath)

      // TODO: Generate thumbnail
      // For now, use the original photo as thumbnail
      const thumbnailUrl = publicUrl

      // Save to database - use verified gallery.id from database query
      const { data: photoData, error: photoError } = await supabase
        .from('gallery_photos')
        .insert({
          gallery_id: gallery.id,  // Use verified gallery ID, not form data
          photo_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          original_filename: file.name,
          file_size: file.size,
          is_favorite: false,
          is_private: false
        })
        .select()
        .single()

      if (!photoError && photoData) {
        uploadedPhotos.push(photoData)
      }
    }

    // Update gallery photo count and cover image - use verified gallery.id
    const { data: photos } = await supabase
      .from('gallery_photos')
      .select('id, thumbnail_url')
      .eq('gallery_id', gallery.id)
      .order('created_at', { ascending: true })

    // Set cover image to first photo if gallery doesn't have one
    const coverImageUrl = gallery.cover_image_url || photos?.[0]?.thumbnail_url || null

    await supabase
      .from('photo_galleries')
      .update({
        photo_count: photos?.length || 0,
        is_imported: true,
        import_completed_at: new Date().toISOString(),
        cover_image_url: coverImageUrl
      })
      .eq('id', gallery.id)

    console.log('[Upload API] Upload complete:', {
      galleryId: gallery.id,
      uploadedCount: uploadedPhotos.length,
      totalFiles: files.length
    })

    return NextResponse.json({
      success: true,
      uploaded: uploadedPhotos.length,
      total: files.length,
      photos: uploadedPhotos
    })

  } catch (error) {
    console.error('Error uploading photos:', error)
    return NextResponse.json(
      { error: 'Failed to upload photos' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

