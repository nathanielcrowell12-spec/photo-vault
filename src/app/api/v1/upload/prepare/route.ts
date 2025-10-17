import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileSize, userId, galleryName, platform } = await request.json()

    // Validate inputs
    if (!fileName || !userId || !galleryName) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, userId, galleryName' },
        { status: 400 }
      )
    }

    // Check file size (allow up to 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 2GB. Your file is ${(fileSize / 1024 / 1024 / 1024).toFixed(2)}GB.` },
        { status: 400 }
      )
    }

    // Generate unique filename for storage
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const ext = fileName.split('.').pop()
    const storageFileName = `${timestamp}-${randomStr}.${ext}`
    const storagePath = `temp-uploads/${userId}/${storageFileName}`

    // Create gallery record first
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .insert({
        user_id: userId,
        gallery_name: galleryName,
        gallery_description: `Imported from ${platform} ZIP file`,
        platform: platform || 'ZIP Upload',
        photo_count: 0,
        is_imported: false,
        cover_image_url: '/images/placeholder-family.svg',
        import_started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (galleryError || !gallery) {
      console.error('Error creating gallery:', galleryError)
      return NextResponse.json(
        { error: 'Failed to create gallery record' },
        { status: 500 }
      )
    }

    // Return the storage path and gallery ID for chunked uploads
    // No need for signed URL since chunks will be uploaded directly to gallery-imports bucket
    return NextResponse.json({
      success: true,
      storagePath: storagePath,
      galleryId: gallery.id
    })

  } catch (error) {
    console.error('Prepare upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
