import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// This endpoint creates a signed upload URL for direct client-to-Supabase uploads
export async function POST(request: NextRequest) {
  try {
    const { fileName, userId, galleryName, platform } = await request.json()

    console.log('[SUPABASE DIRECT] Creating signed upload URL')
    console.log('[SUPABASE DIRECT] File:', fileName)
    console.log('[SUPABASE DIRECT] User:', userId)

    // Generate a unique file path
    const timestamp = Date.now()
    const storagePath = `temp-uploads/${userId}/${timestamp}-${fileName}`

    // Create signed upload URL (valid for 1 hour)
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('photos')
      .createSignedUploadUrl(storagePath)

    if (uploadError) {
      console.error('[SUPABASE DIRECT] Error creating signed URL:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    console.log('[SUPABASE DIRECT] Signed URL created:', uploadData.path)

    // Create gallery record
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

    if (galleryError) {
      console.error('[SUPABASE DIRECT] Error creating gallery:', galleryError)
      return NextResponse.json({ error: galleryError.message }, { status: 500 })
    }

    console.log('[SUPABASE DIRECT] Gallery created:', gallery.id)

    return NextResponse.json({
      uploadUrl: uploadData.signedUrl,
      uploadPath: uploadData.path,
      token: uploadData.token,
      galleryId: gallery.id,
      storagePath
    })

  } catch (error: any) {
    console.error('[SUPABASE DIRECT] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 60,
}

