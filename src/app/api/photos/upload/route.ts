import { NextRequest, NextResponse } from 'next/server'
import { generateRandomId } from '@/lib/api-constants'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const galleryId = formData.get('galleryId') as string
    const userId = formData.get('userId') as string
    const files = formData.getAll('photos') as File[]

    if (!galleryId || !userId || files.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify gallery belongs to user
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('*')
      .eq('id', galleryId)
      .eq('user_id', userId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json(
        { error: 'Gallery not found or access denied' },
        { status: 404 }
      )
    }

    const uploadedPhotos = []

    // Process each photo
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const timestamp = Date.now()
      const randomId = generateRandomId()
      const fileName = `${timestamp}-${randomId}-${file.name}`
      
      // Upload original photo
      const originalPath = `${userId}/${galleryId}/original/${fileName}`
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

      // Save to database
      const { data: photoData, error: photoError } = await supabase
        .from('gallery_photos')
        .insert({
          gallery_id: galleryId,
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

    // Update gallery photo count
    const { data: photos } = await supabase
      .from('gallery_photos')
      .select('id')
      .eq('gallery_id', galleryId)

    await supabase
      .from('galleries')
      .update({
        photo_count: photos?.length || 0,
        is_imported: true,
        import_completed_at: new Date().toISOString()
      })
      .eq('id', galleryId)

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

