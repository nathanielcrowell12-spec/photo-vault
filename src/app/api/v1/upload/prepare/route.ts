import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileName, fileSize, userId, galleryName, platform, clientId } = body

    console.log('[Upload Prepare] Request:', { fileName, fileSize, userId, galleryName, platform, clientId })

    // Validate inputs
    if (!fileName || !fileSize || !userId || !galleryName) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Create gallery in database
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .insert({
        photographer_id: userId,
        client_id: clientId || null,
        user_id: clientId || null,
        gallery_name: galleryName,
        photo_count: 1,
        session_date: new Date().toISOString(),
        is_imported: false
      })
      .select()
      .single()

    if (galleryError) {
      console.error('[Upload Prepare] Gallery creation error:', galleryError)
      return NextResponse.json({
        error: 'Failed to create gallery',
        details: galleryError.message
      }, { status: 500 })
    }

    console.log('[Upload Prepare] Gallery created:', gallery.id)

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
    console.error('[Upload Prepare] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
